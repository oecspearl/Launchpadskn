-- LaunchPad SKN - Add Admin User Profile
-- Run this in Supabase SQL Editor
-- This creates/updates the admin user profile in the users table
--
-- IMPORTANT: 
-- 1. Make sure the admin user exists in Supabase Auth first
--    (Go to Authentication > Users and create admin@launchpadskn.com)
-- 2. This script will link the profile to the auth user's UUID

-- ============================================
-- STEP 1: Check if admin user exists in auth.users
-- ============================================
-- Run this first to get the UUID:
-- SELECT id, email FROM auth.users WHERE email = 'admin@launchpadskn.com';

-- ============================================
-- STEP 2: Add/Update Admin User Profile
-- ============================================
-- Replace '{AUTH_USER_UUID}' with the actual UUID from Step 1
-- Or leave it NULL if you don't have the UUID yet

INSERT INTO users (
    id,                    -- UUID from Supabase Auth (optional - can be NULL)
    name,
    email,
    role,
    phone,
    is_active,
    department_id,
    created_at,
    updated_at,
    is_first_login
)
VALUES (
    COALESCE(
        (SELECT id FROM auth.users WHERE email = 'admin@launchpadskn.com' LIMIT 1),
        NULL
    ),                     -- Link to Supabase Auth UUID if exists, otherwise NULL
    'Admin User',
    'admin@launchpadskn.com',
    'ADMIN',
    '+1-869-555-0000',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    is_first_login = EXCLUDED.is_first_login,
    updated_at = CURRENT_TIMESTAMP,
    id = COALESCE(
        EXCLUDED.id,
        users.id,
        (SELECT id FROM auth.users WHERE email = 'admin@launchpadskn.com' LIMIT 1)
    );                     -- Link UUID if not already set

-- ============================================
-- ALTERNATIVE: If id column doesn't exist
-- ============================================
-- If you get an error about 'id' column not existing, use this version instead:

/*
INSERT INTO users (
    name,
    email,
    role,
    phone,
    is_active,
    department_id,
    created_at,
    updated_at,
    is_first_login
)
VALUES (
    'Admin User',
    'admin@launchpadskn.com',
    'ADMIN',
    '+1-869-555-0000',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    is_first_login = EXCLUDED.is_first_login,
    updated_at = CURRENT_TIMESTAMP;
*/

-- ============================================
-- VERIFY ADMIN USER WAS CREATED/UPDATED
-- ============================================
SELECT 
    COALESCE(id::text, 'No UUID') as auth_uuid,
    user_id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
FROM users
WHERE email = 'admin@launchpadskn.com';

-- ============================================
-- UPDATE UUID IF IT WAS ADDED LATER
-- ============================================
-- If you created the user in Supabase Auth after creating the profile,
-- run this to link them:

/*
UPDATE users 
SET id = (
    SELECT id FROM auth.users 
    WHERE email = 'admin@launchpadskn.com' 
    LIMIT 1
)
WHERE email = 'admin@launchpadskn.com'
  AND id IS NULL;
*/


