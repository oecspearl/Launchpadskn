-- LaunchPad SKN - Create Test Teacher Account
-- This script creates a test teacher user profile in the users table
-- 
-- IMPORTANT: You need to manually create the teacher in Supabase Auth first!
-- Steps:
-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add user" -> "Create new user"
-- 3. Email: teacher.test@launchpadskn.com
-- 4. Password: Teacher123!
-- 5. Copy the UUID generated (you'll need it below)
-- 
-- Then run this script, replacing {TEACHER_UUID_HERE} with the actual UUID

-- ============================================
-- STEP 1: Create Teacher User in users table
-- ============================================
DO $$
DECLARE
    teacher_email TEXT := 'teacher.test@launchpadskn.com';
    teacher_uuid UUID := '2cb1a24d-3841-4d24-ae3b-80fde763a442'; -- <<< REPLACE WITH ACTUAL UUID FROM SUPABASE AUTH
    teacher_user_id BIGINT;
BEGIN
    -- Verify the UUID exists in auth.users (Supabase Auth)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = teacher_uuid AND email = teacher_email) THEN
        RAISE EXCEPTION 'Teacher user not found in auth.users. Please create the user in Supabase Dashboard -> Authentication -> Users first. UUID: %, Email: %', teacher_uuid, teacher_email;
    END IF;

    RAISE NOTICE 'Teacher user found in auth.users with UUID: %', teacher_uuid;

    -- Check if user profile already exists
    SELECT user_id INTO teacher_user_id 
    FROM users 
    WHERE email = teacher_email OR (id IS NOT NULL AND id = teacher_uuid);

    IF teacher_user_id IS NULL THEN
        -- Insert new teacher profile
        -- Note: user_id is BIGSERIAL (auto-generated), id is UUID from Supabase Auth
        INSERT INTO users (
            id, 
            name, 
            email, 
            role, 
            is_active, 
            created_at, 
            is_first_login
        ) VALUES (
            teacher_uuid, 
            'Test Teacher',
            teacher_email,
            'INSTRUCTOR',
            true,
            NOW(),
            false
        );
        
        RAISE NOTICE 'Test teacher profile created in users table with user_id: %', (SELECT user_id FROM users WHERE email = teacher_email);
    ELSE
        -- Update existing profile to ensure correct UUID and role
        UPDATE users
        SET
            id = teacher_uuid,
            role = 'INSTRUCTOR',
            name = 'Test Teacher',
            is_active = true,
            is_first_login = false,
            updated_at = NOW()
        WHERE user_id = teacher_user_id;
        
        RAISE NOTICE 'Test teacher profile updated in users table with user_id: %', teacher_user_id;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST TEACHER ACCOUNT CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: %', teacher_email;
    RAISE NOTICE 'Password: Teacher123!';
    RAISE NOTICE 'Role: INSTRUCTOR';
    RAISE NOTICE 'UUID: %', teacher_uuid;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now log in as this teacher and:';
    RAISE NOTICE '1. Access /teacher/dashboard';
    RAISE NOTICE '2. View curriculum at /teacher/curriculum';
    RAISE NOTICE '3. View the Form 1 Mathematics structured curriculum';
    RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the teacher was created:

-- SELECT 
--   user_id,
--   id as uuid,
--   name,
--   email,
--   role,
--   is_active,
--   created_at
-- FROM users
-- WHERE email = 'teacher.test@launchpadskn.com';

-- ============================================
-- OPTIONAL: Assign Teacher to a Class-Subject
-- ============================================
-- If you want to assign this teacher to teach a specific class-subject,
-- you can run this (after replacing {TEACHER_USER_ID} with the actual user_id):

/*
DO $$
DECLARE
    teacher_user_id BIGINT := {TEACHER_USER_ID};  -- <<< REPLACE WITH ACTUAL user_id
    class_subject_id_var BIGINT;
BEGIN
    -- Get the first available class-subject for Form 1 Mathematics
    SELECT cs.class_subject_id INTO class_subject_id_var
    FROM class_subjects cs
    JOIN subject_form_offerings sfo ON cs.subject_offering_id = sfo.offering_id
    JOIN subjects s ON sfo.subject_id = s.subject_id
    JOIN forms f ON sfo.form_id = f.form_id
    WHERE s.subject_name ILIKE '%mathematics%'
      AND f.form_number = 1
    LIMIT 1;

    IF class_subject_id_var IS NOT NULL THEN
        -- Assign teacher to this class-subject
        UPDATE class_subjects
        SET teacher_id = teacher_user_id
        WHERE class_subject_id = class_subject_id_var;
        
        RAISE NOTICE 'Teacher assigned to class_subject_id: %', class_subject_id_var;
    ELSE
        RAISE NOTICE 'No class-subject found for Form 1 Mathematics. Teacher can still access curriculum.';
    END IF;
END $$;
*/

