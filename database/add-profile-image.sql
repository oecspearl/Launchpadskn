-- Add profile_image_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

COMMENT ON COLUMN users.profile_image_url IS 'URL to user profile photo stored in Supabase Storage';
