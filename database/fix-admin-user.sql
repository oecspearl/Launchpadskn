-- Fix Admin User for LaunchPad SKN
-- This script ensures the admin user exists and has the correct role

-- First, check if admin user exists in Supabase Auth
-- You'll need to check this in Supabase Dashboard: Authentication -> Users
-- Email: admin@launchpadskn.com

-- Step 1: Find the admin user's UUID from Supabase Auth
-- (This will be shown in Supabase Dashboard under Authentication -> Users)

-- Step 2: Update or insert the admin user in the users table
-- Replace 'YOUR_UUID_HERE' with the actual UUID from Supabase Auth

-- Option A: If user already exists in users table (by email), update it
UPDATE users 
SET 
  role = 'ADMIN',
  name = 'Admin User',
  is_active = true,
  updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@launchpadskn.com';

-- If update affected 0 rows, insert new user
-- Note: You need to get the UUID from Supabase Auth first
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'admin@launchpadskn.com' LIMIT 1),
  'admin@launchpadskn.com',
  'Admin User',
  'ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@launchpadskn.com'
);

-- Alternative: If you know the UUID, use this:
-- INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
-- VALUES (
--   'YOUR_UUID_FROM_SUPABASE_AUTH',
--   'admin@launchpadskn.com',
--   'Admin User',
--   'ADMIN',
--   true,
--   CURRENT_TIMESTAMP,
--   CURRENT_TIMESTAMP
-- )
-- ON CONFLICT (email) DO UPDATE
-- SET 
--   role = 'ADMIN',
--   name = 'Admin User',
--   is_active = true,
--   updated_at = CURRENT_TIMESTAMP;

-- Step 3: Verify the user exists and has correct role
SELECT 
  user_id,
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users
WHERE email = 'admin@launchpadskn.com';

-- Step 4: If role is not ADMIN, fix it
UPDATE users 
SET role = 'ADMIN', updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@launchpadskn.com' AND role != 'ADMIN';

