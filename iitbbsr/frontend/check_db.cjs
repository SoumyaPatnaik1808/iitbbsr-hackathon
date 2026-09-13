const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fbogzwvrfmfbvhkgiczu.supabase.co', 'sb_publishable_4yUj9hh8lqWXpEC8HpV1Vw_F5lvPTiI');

async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log("USERS TABLE:", error ? error.message : "Exists!");
  
  const { data: d2, error: e2 } = await supabase.from('tasks').select('*').limit(1);
  console.log("TASKS TABLE:", e2 ? e2.message : "Exists!");
}
run();
