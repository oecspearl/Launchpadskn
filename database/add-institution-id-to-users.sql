-- Add institution_id column to users table
-- This column links users to their institution/school

ALTER TABLE users
ADD COLUMN IF NOT EXISTS institution_id BIGINT REFERENCES institutions(institution_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
