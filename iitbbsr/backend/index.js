require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Initialize user profile after Supabase auth
app.post('/api/users/init', verifyAuth, async (req, res) => {
  const { username, display_name } = req.body;
  const userId = req.user.id;

  try {
    // Insert into public.users table.
    // The verifyAuth middleware already verified the JWT, 
    // but to interact as the user, we can pass their token to Supabase
    // or just rely on service role. Here we use anon key + user's JWT.
    
    // We create a custom client for this request with the user's token
    const { createClient } = require('@supabase/supabase-js');
    const userSupabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${req.headers.authorization.split(' ')[1]}`
          }
        }
      }
    );

    const { data, error } = await userSupabase
      .from('users')
      .upsert([
        {
          id: userId,
          username: username,
          display_name: display_name,
          level: 1,
          total_xp: 0,
          points: 0
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting user:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'User profile initialized', data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Search users (bypassing RLS safely on the backend)
app.get('/api/users/search', verifyAuth, async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  const jwt = require('jsonwebtoken');
  const { createClient } = require('@supabase/supabase-js');
  
  // Forge a service_role token to bypass RLS for search
  const secret = process.env.SUPABASE_JWT_SECRET;
  const token = jwt.sign({ role: 'service_role' }, secret);
  
  const adminSupabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data, error } = await adminSupabase
    .from('users')
    .select('id, username, display_name, level, avatar')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(5);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Complete a task with server-side validation and XP calculation
app.post('/api/tasks/:id/complete', verifyAuth, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  const { createClient } = require('@supabase/supabase-js');
  // Use service role key if available for trusted operations, or anon key with user's JWT. 
  // We'll use the user's JWT but perform checks on the server.
  const userSupabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${req.headers.authorization.split(' ')[1]}` } } }
  );

  try {
    // 1. Fetch task
    const { data: task, error: taskError } = await userSupabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) return res.status(404).json({ error: 'Task not found' });
    if (task.status === 'completed') return res.status(400).json({ error: 'Task already completed' });
    if (task.status !== 'in_progress' || !task.timer_started_at) {
      return res.status(400).json({ error: 'Task timer has not been started' });
    }

    // 2. Validate timer (Anti-cheat)
    const startedAt = new Date(task.timer_started_at).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - startedAt) / 1000;
    
    // Allow a small grace period (e.g. 5 seconds) for network latency
    if (elapsedSeconds < (task.timer_duration - 5)) {
      return res.status(400).json({ 
        error: 'Timer has not fully elapsed',
        remaining: task.timer_duration - elapsedSeconds
      });
    }

    // 3. Calculate XP (0.5 XP per minute)
    const xpGained = Math.max(1, Math.round((task.timer_duration / 60) * 0.5));

    // 4. Update Task Status
    await userSupabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId);

    // 5. Update Attribute XP
    const { data: attrData } = await userSupabase
      .from('attributes')
      .select('*')
      .eq('attribute_name', task.attribute_type)
      .single();

    if (attrData) {
      let newAttrXp = attrData.attribute_xp + xpGained;
      let newAttrLevel = attrData.level;
      let attrXpNeeded = Math.floor(100 * Math.pow(newAttrLevel, 1.5));
      
      while (newAttrXp >= attrXpNeeded) {
        newAttrXp -= attrXpNeeded;
        newAttrLevel += 1;
        attrXpNeeded = Math.floor(100 * Math.pow(newAttrLevel, 1.5));
      }

      await userSupabase
        .from('attributes')
        .update({ attribute_xp: newAttrXp, level: newAttrLevel })
        .eq('id', attrData.id);
    }

    // 6. Update User XP
    const { data: userData } = await userSupabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let newTotalXp = userData.total_xp + xpGained;
    let newUserLevel = userData.level;
    let userXpNeeded = Math.floor(500 * Math.pow(newUserLevel, 1.5));

    while (newTotalXp >= userXpNeeded) {
      newTotalXp -= userXpNeeded;
      newUserLevel += 1;
      userXpNeeded = Math.floor(500 * Math.pow(newUserLevel, 1.5));
    }

    await userSupabase
      .from('users')
      .update({ total_xp: newTotalXp, level: newUserLevel })
      .eq('id', userId);

    res.json({ message: 'Task completed!', xpGained });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example
app.get('/api/user/profile', verifyAuth, async (req, res) => {
  const userId = req.user.id;
  
  const userSupabase = require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${req.headers.authorization.split(' ')[1]}` } } }
  );

  const { data, error } = await userSupabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: 'Protected data accessed successfully',
    auth: req.user,
    profile: data
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
