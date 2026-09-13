const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const secret = 'TaCVoku9TGxQfvGtDcff6COEd+mIUapNcwDVTk5LQP7RLU4ALZ0R+xvCFB12NOz0GJdR9Mib0iaePCf0RA+V9Q==';
const token = jwt.sign({ role: 'service_role' }, secret);
const supabase = createClient('https://fbogzwvrfmfbvhkgiczu.supabase.co', 'sb_publishable_4yUj9hh8lqWXpEC8HpV1Vw_F5lvPTiI', {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});

async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(2);
  console.log(data, error);
}
run();
