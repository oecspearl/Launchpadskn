-- LaunchPad SKN - Add Admin User Profile (Without updated_at)
-- Simple version that doesn't require updated_at column
-- Run this in Supabase SQL Editor

INSERT INTO users (
    name,
    email,
    role,
    phone,
    is_active,
    department_id,
    created_at,
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
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    is_first_login = EXCLUDED.is_first_login;

-- Verify
SELECT user_id, name, email, role, is_active, created_at
FROM users 
WHERE email = 'admin@launchpadskn.com';


