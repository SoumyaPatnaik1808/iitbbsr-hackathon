const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fbogzwvrfmfbvhkgiczu.supabase.co', 'sb_publishable_4yUj9hh8lqWXpEC8HpV1Vw_F5lvPTiI');

async function run() {
  const { data, error } = await supabase.from('users').select('*').or(`username.ilike.%a%,display_name.ilike.%a%`);
  console.log(data, error);
}
run();
