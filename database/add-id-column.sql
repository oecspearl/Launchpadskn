-- LaunchPad SKN - Add UUID column to users table
-- Run this FIRST before linking users with Supabase Auth

-- Add id column (UUID) to link with auth.users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'id';

SELECT '✅ id column added successfully!' AS status;

-- Now you can check existing users
SELECT user_id, email, name, role, id as auth_uuid,
       CASE WHEN id IS NULL THEN 'Not Linked' ELSE 'Linked ✅' END as status
FROM users;


