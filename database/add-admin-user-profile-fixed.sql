-- LaunchPad SKN - Add Admin User Profile (Fixed - No updated_at)
-- Run this in Supabase SQL Editor
-- This version works even if updated_at column doesn't exist

-- First, add updated_at column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Now insert/update admin user
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


