-- LaunchPad SKN - Link Existing User with Supabase Auth UUID
-- Use this after creating user in Supabase Auth Dashboard

-- Step 1: Check if user exists in users table
SELECT user_id, email, name, role, id as auth_uuid
FROM users 
WHERE email = 'admin@launchpadskn.com';

-- Step 2: Link the user (replace 'YOUR-UUID-HERE' with actual UUID from Supabase Auth)
-- Get UUID from: Supabase Dashboard → Authentication → Users → Click on user → Copy ID
UPDATE users 
SET id = 'YOUR-UUID-HERE'
WHERE email = 'admin@launchpadskn.com';

-- Step 3: Verify link
SELECT user_id, email, name, role, id as auth_uuid,
       CASE WHEN id IS NULL THEN '❌ Not Linked' ELSE '✅ Linked' END as status
FROM users 
WHERE email = 'admin@launchpadskn.com';

-- ============================================
-- QUICK CREATE SCRIPT
-- ============================================
-- If user doesn't exist in users table yet, create it:
-- 
-- INSERT INTO users (
--     id,  -- UUID from Supabase Auth
--     email,
--     name,
--     role,
--     is_active,
--     created_at
-- )
-- VALUES (
--     'YOUR-UUID-HERE',  -- From Supabase Auth Dashboard
--     'admin@launchpadskn.com',
--     'Admin User',
--     'ADMIN',
--     true,
--     CURRENT_TIMESTAMP
-- )
-- ON CONFLICT (email) DO UPDATE
-- SET id = EXCLUDED.id;


