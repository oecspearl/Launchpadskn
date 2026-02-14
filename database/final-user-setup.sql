-- LaunchPad SKN - Final User Setup Script
-- Run this AFTER creating user in Supabase Auth Dashboard

-- Step 1: Make sure id column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);

-- Step 2: Check current state
SELECT user_id, email, name, role, id as auth_uuid,
       CASE WHEN id IS NULL THEN '❌ Not Linked' ELSE '✅ Linked' END as status
FROM users 
WHERE email = 'admin@launchpadskn.com';

-- Step 3: Link with Supabase Auth UUID
-- Replace 'YOUR-UUID-FROM-SUPABASE-AUTH' with the actual UUID
-- Get UUID from: Supabase Dashboard → Authentication → Users → Click on user → Copy ID
UPDATE users 
SET id = 'YOUR-UUID-FROM-SUPABASE-AUTH'
WHERE email = 'admin@launchpadskn.com';

-- Step 4: Verify link
SELECT user_id, email, name, role, id as auth_uuid,
       CASE WHEN id IS NULL THEN '❌ Not Linked' ELSE '✅ Linked' END as status
FROM users 
WHERE email = 'admin@launchpadskn.com';

-- If user doesn't exist in users table, create it:
-- INSERT INTO users (
--     id,
--     email,
--     name,
--     role,
--     is_active,
--     created_at
-- )
-- VALUES (
--     'YOUR-UUID-FROM-SUPABASE-AUTH',
--     'admin@launchpadskn.com',
--     'Admin User',
--     'ADMIN',
--     true,
--     CURRENT_TIMESTAMP
-- )
-- ON CONFLICT (email) DO UPDATE
-- SET id = EXCLUDED.id;


