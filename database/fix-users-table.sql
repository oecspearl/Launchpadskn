-- LaunchPad SKN - Fix users table (add missing updated_at column)
-- Run this if you get "column updated_at does not exist" error
-- This adds the missing column to the users table

-- Add updated_at column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updated_at timestamp
UPDATE users 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Set default for future inserts
ALTER TABLE users 
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Verify column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'updated_at';

SELECT '✅ users.updated_at column added successfully!' AS status;


