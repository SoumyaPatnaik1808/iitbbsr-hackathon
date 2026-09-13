const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/soumya-patnaik/Desktop/iitbbsr-hackathon/iitbbsr/backend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_JWT_SECRET; // Wait, we don't have SUPABASE_SERVICE_ROLE_KEY!
