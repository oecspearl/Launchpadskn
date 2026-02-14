-- LaunchPad SKN - Enhance Classes to Work Like Courses
-- This migration adds course-like features to the classes table
-- while preserving the existing Form → Class → Subject → Lesson structure
--
-- Run this in Supabase SQL Editor or PostgreSQL

-- ============================================
-- STEP 1: Add Course-Like Fields to Classes Table
-- ============================================

-- Add thumbnail (image URL for class banner)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add syllabus (rich text content)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS syllabus TEXT;

-- Add difficulty level
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'intermediate' 
CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

-- Add published status (default: false - classes are unpublished by default)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Add featured status (for highlighting important classes)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add subject_area (for categorization)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS subject_area VARCHAR(100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_published ON classes(published);
CREATE INDEX IF NOT EXISTS idx_classes_featured ON classes(featured);
CREATE INDEX IF NOT EXISTS idx_classes_difficulty ON classes(difficulty);

-- ============================================
-- STEP 2: Create Class Instructors Table
-- ============================================
-- Allows multiple instructors per class (in addition to form_tutor)

CREATE TABLE IF NOT EXISTS class_instructors (
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    instructor_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'instructor' CHECK (role IN ('primary', 'assistant', 'co-teacher', 'instructor')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (class_id, instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_class_instructors_class ON class_instructors(class_id);
CREATE INDEX IF NOT EXISTS idx_class_instructors_instructor ON class_instructors(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_instructors_active ON class_instructors(is_active);

COMMENT ON TABLE class_instructors IS 'Multiple instructors can be assigned to a class, in addition to the form_tutor';

-- ============================================
-- STEP 3: Enhance Student Class Assignments
-- ============================================
-- Add enrollment tracking fields

-- Add enrollment type (assigned by admin vs self-enrolled)
ALTER TABLE student_class_assignments 
ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) DEFAULT 'assigned' 
CHECK (enrollment_type IN ('assigned', 'enrolled', 'invited'));

-- Add enrolled_at timestamp (when student enrolled, different from assignment_date)
ALTER TABLE student_class_assignments 
ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP;

-- Add progress percentage (0-100)
ALTER TABLE student_class_assignments 
ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Update enrolled_at for existing records (set to assignment_date if exists)
UPDATE student_class_assignments 
SET enrolled_at = assignment_date 
WHERE enrolled_at IS NULL AND assignment_date IS NOT NULL;

-- Set enrolled_at to current timestamp for existing active assignments
UPDATE student_class_assignments 
SET enrolled_at = CURRENT_TIMESTAMP 
WHERE enrolled_at IS NULL AND is_active = true;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_assignments_enrollment_type ON student_class_assignments(enrollment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_enrolled_at ON student_class_assignments(enrolled_at);

COMMENT ON COLUMN student_class_assignments.enrollment_type IS 'assigned = admin assigned, enrolled = student self-enrolled, invited = invited by instructor';
COMMENT ON COLUMN student_class_assignments.progress_percentage IS 'Student progress in the class (0-100)';

-- ============================================
-- STEP 4: Create Helper Views
-- ============================================

-- View: Published Classes (for public browsing)
CREATE OR REPLACE VIEW published_classes_view AS
SELECT 
    c.class_id,
    c.class_name,
    c.class_code,
    c.description,
    c.thumbnail,
    c.syllabus,
    c.difficulty,
    c.subject_area,
    c.featured,
    c.capacity,
    c.current_enrollment,
    c.academic_year,
    c.room_number,
    f.form_id,
    f.form_name,
    f.form_number,
    ft.name AS form_tutor_name,
    ft.email AS form_tutor_email,
    i.name AS school_name,
    c.created_at,
    c.updated_at
FROM classes c
JOIN forms f ON c.form_id = f.form_id
JOIN institutions i ON f.school_id = i.institution_id
LEFT JOIN users ft ON c.form_tutor_id = ft.user_id
WHERE c.published = true 
  AND c.is_active = true
  AND f.is_active = true;

-- View: Class Instructors (all instructors for a class)
CREATE OR REPLACE VIEW class_instructors_view AS
SELECT 
    ci.class_id,
    ci.instructor_id,
    ci.role,
    ci.assigned_at,
    u.name AS instructor_name,
    u.email AS instructor_email,
    u.role AS user_role,
    c.class_name,
    c.class_code
FROM class_instructors ci
JOIN users u ON ci.instructor_id = u.user_id
JOIN classes c ON ci.class_id = c.class_id
WHERE ci.is_active = true 
  AND u.is_active = true
  AND c.is_active = true;

-- View: Student Enrollments (for enrollment tracking)
CREATE OR REPLACE VIEW student_enrollments_view AS
SELECT 
    sca.assignment_id,
    sca.student_id,
    sca.class_id,
    sca.enrollment_type,
    sca.enrolled_at,
    sca.progress_percentage,
    sca.is_active,
    sca.academic_year,
    u.name AS student_name,
    u.email AS student_email,
    c.class_name,
    c.class_code,
    c.published,
    f.form_name,
    f.form_number
FROM student_class_assignments sca
JOIN users u ON sca.student_id = u.user_id
JOIN classes c ON sca.class_id = c.class_id
JOIN forms f ON c.form_id = f.form_id
WHERE sca.is_active = true 
  AND u.is_active = true
  AND c.is_active = true;

-- ============================================
-- STEP 5: Update Comments
-- ============================================

COMMENT ON COLUMN classes.thumbnail IS 'Image URL for class banner/thumbnail';
COMMENT ON COLUMN classes.syllabus IS 'Rich text syllabus content for the class';
COMMENT ON COLUMN classes.difficulty IS 'Difficulty level: beginner, intermediate, advanced';
COMMENT ON COLUMN classes.published IS 'If true, class is visible to all users and students can enroll';
COMMENT ON COLUMN classes.featured IS 'If true, class appears in featured classes section';
COMMENT ON COLUMN classes.subject_area IS 'Subject area/category for the class';

-- ============================================
-- STEP 6: Set Default Values for Existing Classes
-- ============================================

-- Set all existing classes as unpublished by default (preserve privacy)
UPDATE classes 
SET published = false 
WHERE published IS NULL;

-- Set difficulty to intermediate for existing classes
UPDATE classes 
SET difficulty = 'intermediate' 
WHERE difficulty IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check classes table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- Check class_instructors table
SELECT COUNT(*) as total_class_instructors
FROM class_instructors;

-- Check enrollment types
SELECT enrollment_type, COUNT(*) as count
FROM student_class_assignments
GROUP BY enrollment_type;

-- ============================================
-- NOTES
-- ============================================
-- 1. All existing classes are set to published = false by default
-- 2. Admins/instructors can publish classes when ready
-- 3. Multiple instructors can be assigned via class_instructors table
-- 4. Enrollment tracking supports both admin assignment and self-enrollment
-- 5. Progress percentage can be calculated from lesson completion, assessments, etc.
-- 6. The form_tutor_id remains for backward compatibility
-- 7. All existing functionality is preserved

