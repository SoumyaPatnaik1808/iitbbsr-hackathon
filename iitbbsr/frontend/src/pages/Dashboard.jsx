import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { Bell, Brain, Dumbbell, ShieldCheck, Target, Play, Pause, RotateCcw, CheckSquare, Square, Plus, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

// Anti-cheat verification function hitting the backend
async function completeTaskServerSide(taskId, accessToken) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const res = await fetch(`${apiUrl}/api/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to complete task');
  }
  return await res.json();
}

export default function Dashboard() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAttr, setNewTaskAttr] = useState('Focus');
  const [newTaskDuration, setNewTaskDuration] = useState(25 * 60);
  
  // Active timer state for the UI
  const [activeTask, setActiveTask] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiUrl}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          });
          const data = await response.json();
          setSearchResults(data || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Load Initial Data
  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime changes for cross-device sync
    const channels = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` }, payload => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attributes', filter: `user_id=eq.${session.user.id}` }, payload => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${session.user.id}` }, payload => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channels); };
  }, [session.user.id]);

  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Profile
      let { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      
      // If user profile doesn't exist (e.g. Google OAuth or backend init failed), create it
      if (userError && userError.code === 'PGRST116') {
        const { data: newUserData, error: insertError } = await supabase.from('users').upsert({
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email.split('@')[0],
          display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.display_name || 'Adventurer',
          level: 1,
          total_xp: 0,
          points: 0
        }, { onConflict: 'id' }).select().single();
        
        if (!insertError) {
          userData = newUserData;
        } else {
          console.error("Failed to create profile:", insertError);
          setErrorMsg(`Failed to create profile: ${insertError.message}`);
          return;
        }
      } else if (userError) {
        console.error("Error fetching profile:", userError);
        setErrorMsg(`Database error: ${userError.message || userError.details || userError.code}. Did you run the schema.sql in Supabase?`);
        return;
      }
      
      if (userData) {
        setProfile(userData);
      } else {
        setErrorMsg("Profile data is still null after creation attempt.");
        return;
      }

    // 2. Fetch Attributes
    const { data: attrsData } = await supabase.from('attributes').select('*').eq('user_id', session.user.id);
    if (attrsData) setAttributes(attrsData);

    // 3. Fetch Tasks
    const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (tasksData) setTasks(tasksData);
    
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setErrorMsg(err.message);
    }
  };

  // Timer Tick Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Find the currently running task (status='in_progress' and has timer_started_at)
      const running = tasks.find(t => t.status === 'in_progress');
      if (running) {
        setActiveTask(running);
        const started = new Date(running.timer_started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - started) / 1000);
        const remaining = Math.max(0, running.timer_duration - elapsed);
        setRemainingSeconds(remaining);
      } else {
        setActiveTask(null);
        setRemainingSeconds(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleStartTask = async (taskId) => {
    if (tasks.some(t => t.status === 'in_progress')) {
      alert("You already have an active quest. Complete or abandon it first.");
      return;
    }
    const { error } = await supabase.from('tasks').update({ 
      status: 'in_progress', 
      timer_started_at: new Date().toISOString() 
    }).eq('id', taskId);
    
    if (error) {
      alert("Error starting task: " + error.message);
    } else {
      fetchDashboardData();
    }
  };

  const handleCancelTask = async (taskId) => {
    if (!confirm("Are you sure you want to abandon this quest? Progress will be lost.")) return;
    const { error } = await supabase.from('tasks').update({ 
      status: 'pending', 
      timer_started_at: null 
    }).eq('id', taskId);
    
    if (error) {
      alert("Error cancelling task: " + error.message);
    } else {
      fetchDashboardData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this quest? (Costs 1 XP)")) return;
    
    try {
      const { error: delError } = await supabase.from('tasks').delete().eq('id', taskId);
      if (delError) throw delError;

      // Reduce XP by 1 (preventing it from dropping below 0)
      const newXp = Math.max(0, profile.total_xp - 1);
      const { error: xpError } = await supabase.from('users').update({ total_xp: newXp }).eq('id', session.user.id);
      if (xpError) throw xpError;

      fetchDashboardData();
    } catch (err) {
      alert("Error deleting task: " + (err.message || "Unknown error"));
    }
  };

  const handleCompleteTask = async (task) => {
    if (task.status === 'completed') return;
    
    // Optimistic UI check (Server will reject if fake)
    const started = new Date(task.timer_started_at).getTime();
    const elapsed = Math.floor((Date.now() - started) / 1000);
    if (elapsed < task.timer_duration) {
      alert(`Timer not finished. ${task.timer_duration - elapsed} seconds remaining!`);
      return;
    }

    try {
      await completeTaskServerSide(task.id, session.access_token);
      // Fetch new data to reflect XP and level up
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert("Please enter a quest title.");
      return;
    }
    try {
      console.log("Adding task:", { title: newTaskTitle, attr: newTaskAttr, dur: newTaskDuration });
      const { data, error } = await supabase.from('tasks').insert({
        user_id: session.user.id,
        title: newTaskTitle.trim(),
        attribute_type: newTaskAttr,
        timer_duration: newTaskDuration,
        status: 'pending'
      }).select();
      
      console.log("Insert response:", { data, error });
      
      if (error) {
        alert("Error adding task: " + error.message);
      } else {
        setNewTaskTitle('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Exception in handleAddTask:", err);
      alert("Unexpected error: " + err.message);
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0b1219] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-300 text-sm mb-4">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="min-h-screen bg-[#0b1219] flex items-center justify-center text-white">Loading Registry Data...</div>;

  const xpNeeded = Math.floor(500 * Math.pow(profile.level, 1.5));
  const progressPercent = Math.min(100, Math.floor((profile.total_xp / xpNeeded) * 100));

  return (
    <div className="min-h-screen bg-[#0b1219] text-white font-sans flex flex-col items-center pb-20">
      
      {/* Navbar */}
      <nav className="w-full px-8 py-4 flex justify-between items-center border-b border-white/5 bg-[#0b1219] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.5 9.5L19.5 4.5" stroke="#4db8ff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9.5 14.5L4.5 19.5" stroke="#4db8ff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 2L15 5L19 5L19 9L22 12L19 15L19 19L15 19L12 22L9 19L5 19L5 15L2 12L5 9L5 5L9 5L12 2Z" stroke="#4db8ff" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">Quest Up</span>
          </div>
          <div className="hidden md:flex space-x-2 text-sm font-medium">
            <Link to="/dashboard" className="bg-white/10 px-4 py-1.5 rounded-full text-white">Dashboard</Link>
            <div className="relative flex items-center">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 ml-2">
                <Search size={14} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none w-32 md:w-48 transition-all"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {searchQuery.trim() && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#121b24] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-3 text-xs text-gray-500 text-center">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                          <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold leading-none">{u.display_name}</span>
                            <span className="text-xs text-primary mt-1">@{u.username} • Lvl {u.level}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-gray-500 text-center">No users found</div>
                  )}
                </div>
              )}
            </div>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-500 cursor-not-allowed px-4 py-1.5 flex items-center gap-2 transition-colors">
              Stats 
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-primary/20">Coming Soon</span>
            </a>
            <Link to="/profile" className="text-gray-400 hover:text-white px-4 py-1.5 transition-colors">Profile</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10">
            <Bell size={14} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
              <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold leading-none">{profile.display_name}</div>
              <div className="text-xs text-primary mt-1">Lvl {profile.level} Adept</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-6xl px-6 mt-8">
        
        {/* User Header Card */}
        <div className="w-full bg-[#121b24] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center shadow-lg mb-10">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 p-1">
               <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                <span className="bg-primary/20 text-primary text-xs px-2.5 py-1 rounded-full font-bold border border-primary/20">Level {profile.level}</span>
              </div>
              <div className="text-gray-400 text-sm flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-primary"><Target size={14} /> 12-Day Streak</span>
                <span>/</span>
                <span>{profile.total_xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono text-gray-400 uppercase">
              <span>Level {profile.level} Progress</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="text-right text-xs text-gray-500 font-mono">
              {(xpNeeded - profile.total_xp).toLocaleString()} XP to Level {profile.level + 1}
            </div>
          </div>
        </div>

        {/* Core Attributes */}
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Core Attributes</h3>
          <button className="text-xs text-primary hover:underline">Attribute Details</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {['Intellect', 'Strength', 'Discipline', 'Focus'].map(attrName => {
            const attrData = attributes.find(a => a.attribute_name === attrName) || { level: 1, attribute_xp: 0 };
            const attrIcons = { Intellect: Brain, Strength: Dumbbell, Discipline: ShieldCheck, Focus: Target };
            const Icon = attrIcons[attrName] || Target;
            const lvlProgress = Math.min(100, (attrData.attribute_xp / Math.floor(100 * Math.pow(attrData.level, 1.5))) * 100);

            return (
              <div key={attrName} className="bg-[#121b24] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-300">{attrName}</span>
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-3xl font-bold">Lvl {attrData.level}</span>
                  <span className="text-xs text-green-400 font-mono">+{Math.floor(lvlProgress)}%</span>
                </div>
                <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${lvlProgress}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Quests */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Quests</h3>
              <span className="text-xs text-gray-500">{tasks.filter(t=>t.status==='completed').length} of {tasks.length} Completed</span>
            </div>

            <form onSubmit={handleAddTask} className="w-full bg-[#121b24] p-2 rounded-xl border border-white/5 mb-4 flex items-center gap-3">
              <Plus size={18} className="text-gray-500 ml-2" />
              <input 
                type="text" 
                placeholder="Add a new quest or objective..." 
                value={newTaskTitle}
                onChange={e=>setNewTaskTitle(e.target.value)}
                className="flex-grow bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
              <select 
                value={newTaskAttr} 
                onChange={e=>setNewTaskAttr(e.target.value)}
                className="bg-[#0b1219] text-xs text-gray-300 border border-white/10 rounded px-2 py-1.5 focus:outline-none"
              >
                <option value="Focus">Focus</option>
                <option value="Intellect">Intellect</option>
                <option value="Strength">Strength</option>
                <option value="Discipline">Discipline</option>
              </select>
              <select 
                value={newTaskDuration} 
                onChange={e=>setNewTaskDuration(Number(e.target.value))}
                className="bg-[#0b1219] text-xs text-gray-300 border border-white/10 rounded px-2 py-1.5 focus:outline-none"
              >
                <option value={1500}>25m</option>
                <option value={2700}>45m</option>
                <option value={300}>5m break</option>
                <option value={60}>1m test</option>
              </select>
              <button type="submit" className="bg-white/10 hover:bg-white/20 text-xs px-4 py-1.5 rounded-lg transition-colors border border-white/5 text-gray-300">
                Add Quest
              </button>
            </form>

            <div className="flex flex-col gap-3">
              {tasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isRunning = task.status === 'in_progress';
                
                // Determine if we can check it
                let canCheck = false;
                let timeLeftText = `${Math.floor(task.timer_duration/60)}m`;
                
                if (isRunning) {
                  const started = new Date(task.timer_started_at).getTime();
                  const elapsed = Math.floor((Date.now() - started) / 1000);
                  const rem = Math.max(0, task.timer_duration - elapsed);
                  canCheck = rem === 0;
                  if (rem > 0) timeLeftText = `${Math.ceil(rem/60)}m left`;
                  else timeLeftText = `Ready to complete!`;
                } else if (isCompleted) {
                  timeLeftText = 'Completed';
                }

                return (
                  <div key={task.id} className={`bg-[#121b24] p-4 rounded-xl border border-white/5 flex items-center justify-between ${isCompleted ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      {isCompleted ? (
                        <CheckSquare size={20} className="text-primary cursor-not-allowed" />
                      ) : (
                        <button 
                          disabled={!canCheck && isRunning} 
                          onClick={() => canCheck && handleCompleteTask(task)}
                          className={`${canCheck ? 'text-green-400 hover:text-green-300' : 'text-gray-600'} transition-colors`}
                        >
                          <Square size={20} />
                        </button>
                      )}
                      
                      <div>
                        <div className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</div>
                        <div className="text-xs mt-1 flex items-center gap-2">
                          <span className={`${isCompleted ? 'text-gray-600' : 'text-primary'}`}>{task.attribute_type}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400">+{Math.max(1, Math.round((task.timer_duration/60) * 0.5))} XP</span>
                          <span className="text-gray-600">•</span>
                          <span className={canCheck && !isCompleted ? 'text-green-400 font-bold' : 'text-gray-500'}>{timeLeftText}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isCompleted && !isRunning && (
                        <button onClick={() => handleStartTask(task.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 border border-white/5">
                          <Play size={14} />
                        </button>
                      )}
                      {isRunning && !canCheck && (
                        <div className="bg-primary/20 text-primary text-xs px-3 py-1.5 rounded-lg font-bold border border-primary/30">
                          Running
                        </div>
                      )}
                      {isCompleted && (
                        <span className="text-green-400 text-xs font-mono font-bold">+{Math.max(1, Math.round((task.timer_duration/60) * 0.5))} XP</span>
                      )}
                      <button 
                        onClick={() => handleDeleteTask(task.id)} 
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/20 transition-colors ml-1"
                        title="Delete Quest"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Focus Timer */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Focus Timer</h3>
            </div>
            
            <div className="bg-[#121b24] p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative shadow-lg">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                {activeTask ? 'DEEP FOCUS SESSION' : 'IDLE'}
              </div>
              
              <div className="text-7xl font-bold font-mono tracking-tighter mb-6">
                {activeTask ? formatTime(remainingSeconds) : '25:00'}
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 mb-8">
                <div className={`w-2 h-2 rounded-full ${activeTask ? 'bg-primary animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-xs text-gray-300 font-medium truncate max-w-[200px]">
                  {activeTask ? `Working on: ${activeTask.title}` : 'No active quest'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 w-full mt-4">
                <button 
                  disabled={!activeTask}
                  onClick={() => activeTask && handleCancelTask(activeTask.id)}
                  className="flex-grow bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={16} /> Abandon Quest
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
