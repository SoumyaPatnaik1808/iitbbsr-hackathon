const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const secret = 'TaCVoku9TGxQfvGtDcff6COEd+mIUapNcwDVTk5LQP7RLU4ALZ0R+xvCFB12NOz0GJdR9Mib0iaePCf0RA+V9Q==';
const serviceRoleKey = jwt.sign({ role: 'service_role' }, secret);
const supabase = createClient('https://fbogzwvrfmfbvhkgiczu.supabase.co', serviceRoleKey);

async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(2);
  console.log(data, error);
}
run();
