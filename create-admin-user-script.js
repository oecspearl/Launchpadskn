/**
 * Create Admin User in Supabase Auth
 * Run this with Node.js to create the user automatically
 * 
 * Usage: node create-admin-user-script.js
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://zdcniidpqppwjyosooge.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set!');
  console.log('\n📋 To get your Service Role Key:');
  console.log('1. Go to: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/settings/api');
  console.log('2. Find "service_role" key (keep it secret!)');
  console.log('3. Run: $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('4. Then run this script again\n');
  process.exit(1);
}

// Create admin client with service role (has full access)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🚀 Creating admin user in Supabase Auth...\n');

  try {
    // Step 1: Create user in Supabase Auth
    console.log('Step 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@launchpadskn.com',
      password: 'Admin123!',
      email_confirm: true, // Skip email verification
      user_metadata: {
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists in Supabase Auth');
        console.log('Fetching existing user...\n');
        
        // Try to get existing user
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === 'admin@launchpadskn.com');
        
        if (existingUser) {
          console.log('✅ Found existing user!');
          console.log('UUID:', existingUser.id);
          await linkUserToTable(existingUser.id);
          return existingUser.id;
        } else {
          throw authError;
        }
      } else {
        throw authError;
      }
    }

    console.log('✅ User created in Supabase Auth!');
    console.log('UUID:', authData.user.id);
    console.log('Email:', authData.user.email);
    console.log('');

    // Step 2: Make sure id column exists
    console.log('Step 2: Ensuring id column exists in users table...');
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;
        CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
      `
    });

    // If RPC doesn't work, try direct query
    if (alterError) {
      console.log('⚠️  Note: Could not auto-create id column via RPC');
      console.log('You may need to run this SQL manually:');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;');
    }

    // Step 3: Link with users table
    console.log('Step 3: Linking with users table...');
    await linkUserToTable(authData.user.id);

    console.log('\n✅ SUCCESS! Admin user created and linked!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@launchpadskn.com');
    console.log('   Password: Admin123!');
    console.log('\n🎉 You can now login to the application!\n');

    return authData.user.id;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

async function linkUserToTable(uuid) {
  // Check if user exists in users table
  const { data: existingUser, error: checkError } = await supabaseAdmin
    .from('users')
    .select('user_id, email, id')
    .eq('email', 'admin@launchpadskn.com')
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking user:', checkError);
  }

  if (existingUser) {
    // Update existing user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ id: uuid })
      .eq('email', 'admin@launchpadskn.com');

    if (updateError) {
      console.error('⚠️  Error linking user:', updateError.message);
      console.log('\n🔧 Run this SQL manually to link:');
      console.log(`UPDATE users SET id = '${uuid}' WHERE email = 'admin@launchpadskn.com';`);
    } else {
      console.log('✅ User linked to users table!');
    }
  } else {
    // Create new user record
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: uuid,
        email: 'admin@launchpadskn.com',
        name: 'Admin User',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('⚠️  Error creating user record:', insertError.message);
      console.log('\n🔧 Run this SQL manually to create:');
      console.log(`INSERT INTO users (id, email, name, role, is_active, created_at)`);
      console.log(`VALUES ('${uuid}', 'admin@launchpadskn.com', 'Admin User', 'ADMIN', true, CURRENT_TIMESTAMP);`);
    } else {
      console.log('✅ User record created in users table!');
    }
  }
}

// Run the script
createAdminUser();


