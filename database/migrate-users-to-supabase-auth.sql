-- LaunchPad SKN - Migrate Users Table to Supabase Auth
-- This script links your existing users table with Supabase Auth
-- Run this AFTER users have been created in Supabase Auth

-- ============================================
-- STEP 1: Add UUID column to link with auth.users
-- ============================================

-- Add id column (UUID) to link with auth.users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);

-- ============================================
-- STEP 2: Migrate existing users to Supabase Auth
-- ============================================

-- Note: You need to manually create users in Supabase Auth first
-- This script creates a function to link them

-- Function to link user_id with auth user
CREATE OR REPLACE FUNCTION link_user_with_auth(
    p_user_id BIGINT,
    p_auth_uuid UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET id = p_auth_uuid
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Policy: Instructors can view students (for their courses)
CREATE POLICY "Instructors can view students"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'INSTRUCTOR'
    )
    OR auth.uid() = id
);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can insert/update/delete users
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- ============================================
-- STEP 4: Create trigger to sync email updates
-- ============================================

-- Function to sync email to auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update email in auth.users if changed
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        UPDATE auth.users
        SET email = NEW.email,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS sync_email_trigger ON users;
CREATE TRIGGER sync_email_trigger
    AFTER UPDATE OF email ON users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION sync_user_email();

-- ============================================
-- STEP 5: Helper function to create user profile from auth
-- ============================================

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        name,
        email,
        role,
        is_active,
        created_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'),
        true,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To enable this trigger, you need to run it in Supabase Dashboard
-- as it requires access to auth schema
-- Go to Database → Triggers → Create trigger on auth.users

-- ============================================
-- STEP 6: Migration Helper Queries
-- ============================================

-- Check for users not linked with auth
-- SELECT user_id, email, name, role, id 
-- FROM users 
-- WHERE id IS NULL;

-- Link a user manually (example):
-- SELECT link_user_with_auth(1, 'auth-user-uuid-here');

-- ============================================
-- STEP 7: Update other tables to use UUID (Optional)
-- ============================================

-- If you want to use UUIDs everywhere instead of BIGINT:
-- You can create a mapping table or update foreign keys

-- Example: Create a mapping view
CREATE OR REPLACE VIEW users_auth_mapping AS
SELECT 
    u.user_id,
    u.id as auth_user_id,
    u.email,
    u.name,
    u.role
FROM users u
WHERE u.id IS NOT NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Users table migration complete!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Create users in Supabase Auth (Dashboard → Authentication)';
    RAISE NOTICE '2. Link them using: SELECT link_user_with_auth(user_id, auth_uuid)';
    RAISE NOTICE '3. Test RLS policies';
    RAISE NOTICE '4. Enable trigger in Supabase Dashboard (if needed)';
END $$;


