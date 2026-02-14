/**
 * Example: Create User via Supabase Admin API
 * 
 * NOTE: This requires SERVICE_ROLE_KEY (never expose in frontend!)
 * Use this only from a secure backend server or Supabase Edge Function
 * 
 * This is an alternative if Dashboard doesn't work
 */

// This would run on a backend server, NOT in the frontend
const { createClient } = require('@supabase/supabase-js');

// Get these from Supabase Dashboard → Settings → API
const supabaseUrl = 'https://zdcniidpqppwjyosooge.supabase.co';
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY'; // Never expose this!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@launchpadskn.com',
      password: 'Admin123!',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ User created in Supabase Auth!');
    console.log('UUID:', authData.user.id);

    // Link with users table
    const { error: linkError } = await supabaseAdmin
      .from('users')
      .update({ id: authData.user.id })
      .eq('email', 'admin@launchpadskn.com');

    if (linkError) {
      console.error('Error linking user:', linkError);
      // User was created but linking failed
      console.log('UUID to link manually:', authData.user.id);
    } else {
      console.log('✅ User linked successfully!');
    }

    return authData.user.id;

  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment to run (only from secure backend!)
// createAdminUser();

/**
 * To use this:
 * 1. Get SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API
 * 2. Run this from a Node.js backend server (never in frontend!)
 * 3. Or use Supabase Edge Function
 */


