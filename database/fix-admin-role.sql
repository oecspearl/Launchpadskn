-- Fix Admin User Role
-- Run this to update the user role to ADMIN

-- Check current user
SELECT user_id, email, name, role, id 
FROM users 
WHERE email = 'admin@launchpadskn.com';

-- Update role to ADMIN
UPDATE users 
SET role = 'ADMIN',
    name = 'Admin User'
WHERE email = 'admin@launchpadskn.com';

-- Verify
SELECT user_id, email, name, role, id 
FROM users 
WHERE email = 'admin@launchpadskn.com';

-- Also update in Supabase Auth metadata (if possible)
-- This needs to be done via Dashboard or API


