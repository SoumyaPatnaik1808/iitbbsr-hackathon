const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fbogzwvrfmfbvhkgiczu.supabase.co';
const supabaseKey = 'sb_publishable_4yUj9hh8lqWXpEC8HpV1Vw_F5lvPTiI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'demo@questup.com',
    password: 'password123',
    options: {
      data: {
        display_name: 'Demo Adventurer',
        username: 'demo_user'
      }
    }
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("Created user:", data.user?.id);
  }
}
main();
