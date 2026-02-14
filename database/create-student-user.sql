-- LaunchPad SKN - Create Student User "user"
-- This script creates a student user named "user" and optionally assigns them to a class
-- 
-- IMPORTANT: You need to manually create the student in Supabase Auth first!
-- Steps:
-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add user" -> "Create new user"
-- 3. Email: user@launchpadskn.com
-- 4. Password: Student123!
-- 5. ✅ Check "Auto Confirm User"
-- 6. User Metadata: {"name": "user", "role": "STUDENT"}
-- 7. Copy the UUID generated (you'll need it below)
-- 
-- Then run this script, replacing {STUDENT_UUID_HERE} with the actual UUID

-- ============================================
-- STEP 1: Create Student User in users table
-- ============================================
DO $$
DECLARE
    student_email TEXT := 'user@launchpadskn.com';
    student_name TEXT := 'user';
    student_uuid UUID := '{STUDENT_UUID_HERE}'; -- <<< REPLACE WITH ACTUAL UUID FROM SUPABASE AUTH
    student_user_id BIGINT;
    school_id_var BIGINT;
    form_id_var BIGINT;
    class_id_var BIGINT;
    academic_year_var VARCHAR(20) := '2024-2025';
BEGIN
    -- Verify the UUID exists in auth.users (Supabase Auth)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = student_uuid AND email = student_email) THEN
        RAISE EXCEPTION 'Student user not found in auth.users. Please create the user in Supabase Dashboard -> Authentication -> Users first. UUID: %, Email: %', student_uuid, student_email;
    END IF;

    RAISE NOTICE 'Student user found in auth.users with UUID: %', student_uuid;

    -- Check if user profile already exists
    SELECT user_id INTO student_user_id 
    FROM users 
    WHERE email = student_email OR (id IS NOT NULL AND id = student_uuid);

    IF student_user_id IS NULL THEN
        -- Insert new student profile
        INSERT INTO users (
            id, name, email, role, is_active, 
            created_at, is_first_login
        ) VALUES (
            student_uuid, 
            student_name,
            student_email,
            'STUDENT',
            true,
            NOW(),
            true
        )
        RETURNING user_id INTO student_user_id;
        
        RAISE NOTICE 'Student profile created in users table with user_id: %', student_user_id;
    ELSE
        -- Update existing profile
        UPDATE users
        SET 
            id = student_uuid,
            name = student_name,
            role = 'STUDENT',
            is_active = true,
            is_first_login = true,
            updated_at = NOW()
        WHERE user_id = student_user_id OR id = student_uuid;
        
        RAISE NOTICE 'Student profile updated in users table with user_id: %', student_user_id;
    END IF;

    -- ============================================
    -- STEP 2: Get or Create a School
    -- ============================================
    -- Get first available secondary school
    SELECT institution_id INTO school_id_var
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ORDER BY institution_id
    LIMIT 1;

    IF school_id_var IS NULL THEN
        RAISE EXCEPTION 'No secondary schools found. Please run insert-skn-secondary-schools.sql first.';
    END IF;

    RAISE NOTICE 'Using school_id: %', school_id_var;

    -- ============================================
    -- STEP 3: Get or Create a Form
    -- ============================================
    -- Get Form 3 for this school (or create if doesn't exist)
    SELECT form_id INTO form_id_var
    FROM forms
    WHERE school_id = school_id_var
      AND form_number = 3
      AND academic_year = academic_year_var
    LIMIT 1;

    IF form_id_var IS NULL THEN
        RAISE NOTICE 'Form 3 not found, creating it...';
        
        INSERT INTO forms (
            school_id, form_number, form_name, academic_year, 
            description, is_active
        ) VALUES (
            school_id_var,
            3,
            'Form 3',
            academic_year_var,
            'Lower Secondary - Year 3 (Ages 13-14). Final year of lower secondary with internal assessments.',
            true
        )
        RETURNING form_id INTO form_id_var;
        
        RAISE NOTICE 'Form 3 created with form_id: %', form_id_var;
    ELSE
        RAISE NOTICE 'Form 3 found with form_id: %', form_id_var;
    END IF;

    -- ============================================
    -- STEP 4: Get or Create a Class
    -- ============================================
    -- Get or create Class 3A
    SELECT class_id INTO class_id_var
    FROM classes
    WHERE form_id = form_id_var
      AND class_name = '3A'
      AND academic_year = academic_year_var
    LIMIT 1;

    IF class_id_var IS NULL THEN
        RAISE NOTICE 'Class 3A not found, creating it...';
        
        INSERT INTO classes (
            form_id, class_name, class_code, academic_year,
            capacity, current_enrollment, is_active
        ) VALUES (
            form_id_var,
            '3A',
            'F3A',
            academic_year_var,
            35,
            0,
            true
        )
        RETURNING class_id INTO class_id_var;
        
        RAISE NOTICE 'Class 3A created with class_id: %', class_id_var;
    ELSE
        RAISE NOTICE 'Class 3A found with class_id: %', class_id_var;
    END IF;

    -- ============================================
    -- STEP 5: Assign Student to Class (Optional)
    -- ============================================
    -- Uncomment the section below if you want to automatically assign the student to a class
    
    -- Check if assignment already exists
    IF EXISTS (
        SELECT 1 FROM student_class_assignments
        WHERE student_id = student_user_id
          AND class_id = class_id_var
          AND academic_year = academic_year_var
    ) THEN
        RAISE NOTICE 'Student already assigned to this class. Updating assignment...';
        
        UPDATE student_class_assignments
        SET 
            is_active = true,
            assignment_date = CURRENT_DATE,
            notes = 'Student user assignment - updated'
        WHERE student_id = student_user_id
          AND class_id = class_id_var
          AND academic_year = academic_year_var;
    ELSE
        -- Create new assignment
        INSERT INTO student_class_assignments (
            student_id, class_id, academic_year,
            is_active, notes
        ) VALUES (
            student_user_id,
            class_id_var,
            academic_year_var,
            true,
            'Student user assignment - created automatically'
        );
        
        -- Update class enrollment count
        UPDATE classes
        SET current_enrollment = current_enrollment + 1
        WHERE class_id = class_id_var;
        
        RAISE NOTICE 'Student assigned to Class 3A successfully!';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUCCESS! Student User Created';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Student Name: %', student_name;
    RAISE NOTICE 'Student Email: %', student_email;
    RAISE NOTICE 'Student Password: Student123!';
    RAISE NOTICE 'Student UUID: %', student_uuid;
    RAISE NOTICE 'School ID: %', school_id_var;
    RAISE NOTICE 'Form: Form 3 (form_id: %)', form_id_var;
    RAISE NOTICE 'Class: 3A (class_id: %)', class_id_var;
    RAISE NOTICE 'Academic Year: %', academic_year_var;
    RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify student was created
SELECT 
    u.user_id,
    u.id as auth_uuid,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.created_at
FROM users u
WHERE u.email = 'user@launchpadskn.com';

-- Verify student assignment (if assigned)
SELECT 
    sca.assignment_id,
    u.name as student_name,
    u.email as student_email,
    c.class_name,
    c.class_code,
    f.form_name,
    f.form_number,
    i.name as school_name,
    sca.academic_year,
    sca.is_active
FROM student_class_assignments sca
JOIN users u ON sca.student_id = u.user_id
JOIN classes c ON sca.class_id = c.class_id
JOIN forms f ON c.form_id = f.form_id
JOIN institutions i ON f.school_id = i.institution_id
WHERE u.email = 'user@launchpadskn.com'
  AND sca.is_active = true;

-- ============================================
-- NOTES
-- ============================================
-- 1. Before running this script, create the user in Supabase Auth:
--    - Go to Supabase Dashboard -> Authentication -> Users
--    - Click "Add user" -> "Create new user"
--    - Email: user@launchpadskn.com
--    - Password: Student123!
--    - Check "Auto Confirm User"
--    - Add metadata: {"name": "user", "role": "STUDENT"}
--    - Copy the UUID
--
-- 2. Replace {STUDENT_UUID_HERE} in the script with the actual UUID
--
-- 3. The script will:
--    - Create/update user profile in users table
--    - Find or create Form 3
--    - Find or create Class 3A
--    - Assign student to Class 3A (if section is uncommented)
--
-- 4. To assign to a different class, modify the class_name in STEP 4
--
-- 5. To skip class assignment, comment out STEP 5

