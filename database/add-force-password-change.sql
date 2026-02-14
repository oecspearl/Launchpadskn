-- Add force_password_change column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Verify column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'force_password_change';

SELECT '✅ users.force_password_change column added successfully!' AS status;
