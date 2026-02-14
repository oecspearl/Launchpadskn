-- LaunchPad SKN - Fresh Database Setup for Supabase
-- Run this script in Supabase SQL Editor for a clean start
-- This script creates ALL required tables for the Caribbean Secondary School architecture

-- ============================================
-- IMPORTANT: This script is for FRESH databases only
-- It will create prerequisite tables if they don't exist
-- ============================================

-- ============================================
-- PREREQUISITE TABLES
-- ============================================

-- Institutions/Schools table
CREATE TABLE IF NOT EXISTS institutions (
    institution_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(255),
    contact VARCHAR(255),
    phone VARCHAR(255),
    website VARCHAR(255),
    established_year INTEGER,
    institution_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (minimal version)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50),
    phone VARCHAR(255),
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    department_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_first_login BOOLEAN DEFAULT true
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT REFERENCES institutions(institution_id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    head_of_department VARCHAR(255),
    department_email VARCHAR(255),
    office_location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CORE HIERARCHY TABLES
-- ============================================

-- Forms (Year Groups: Forms 1-7)
CREATE TABLE IF NOT EXISTS forms (
    form_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES institutions(institution_id),
    form_number INTEGER NOT NULL CHECK (form_number BETWEEN 1 AND 7),
    form_name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    coordinator_id BIGINT REFERENCES users(user_id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_form_per_school_year UNIQUE(school_id, form_number, academic_year)
);

-- Classes (Homeroom/Stream: 3A, 3B, etc.)
CREATE TABLE IF NOT EXISTS classes (
    class_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 35,
    current_enrollment INTEGER DEFAULT 0,
    form_tutor_id BIGINT REFERENCES users(user_id),
    room_number VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_per_form UNIQUE(form_id, class_name, academic_year)
);

-- Subjects (Academic Disciplines)
CREATE TABLE IF NOT EXISTS subjects (
    subject_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES institutions(institution_id),
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    cxc_code VARCHAR(20),
    department_id BIGINT REFERENCES departments(department_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject Form Offerings (Subject offered in specific Form)
CREATE TABLE IF NOT EXISTS subject_form_offerings (
    offering_id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    curriculum_framework TEXT,
    learning_outcomes TEXT,
    weekly_periods INTEGER DEFAULT 5,
    is_compulsory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_subject_form_offering UNIQUE(subject_id, form_id)
);

-- Class-Subject Junction (Which classes take which subjects)
CREATE TABLE IF NOT EXISTS class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    subject_offering_id BIGINT NOT NULL REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES users(user_id),
    room_preference VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_subject UNIQUE(class_id, subject_offering_id)
);

-- Lessons (Individual Instructional Sessions)
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    lesson_title VARCHAR(200) NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    lesson_number INTEGER,
    topic VARCHAR(200),
    learning_objectives TEXT,
    lesson_plan TEXT,
    homework_description TEXT,
    homework_due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    attendance_taken BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson Content (Files, links, materials)
CREATE TABLE IF NOT EXISTS lesson_content (
    content_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by BIGINT REFERENCES users(user_id)
);

-- Student Class Assignments (Student enrollment in classes)
CREATE TABLE IF NOT EXISTS student_class_assignments (
    assignment_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    assignment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_class_year UNIQUE(student_id, class_id, academic_year)
);

-- Lesson Attendance
CREATE TABLE IF NOT EXISTS lesson_attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    marked_by BIGINT REFERENCES users(user_id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT unique_lesson_student_attendance UNIQUE(lesson_id, student_id)
);

-- Subject Assessments (Tests, SBAs, Projects)
CREATE TABLE IF NOT EXISTS subject_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    assessment_name VARCHAR(200) NOT NULL,
    description TEXT,
    total_marks DECIMAL(10,2) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 0.00,
    due_date TIMESTAMP,
    assessment_date DATE,
    term INTEGER CHECK (term IN (1, 2, 3)),
    academic_year VARCHAR(20),
    is_sba_component BOOLEAN DEFAULT false,
    sba_component_number INTEGER,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Grades
CREATE TABLE IF NOT EXISTS student_grades (
    grade_id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES subject_assessments(assessment_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    marks_obtained DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(5),
    is_excused BOOLEAN DEFAULT false,
    graded_by BIGINT REFERENCES users(user_id),
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    CONSTRAINT unique_student_assessment_grade UNIQUE(assessment_id, student_id)
);

-- Form Announcements
CREATE TABLE IF NOT EXISTS form_announcements (
    announcement_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    posted_by BIGINT REFERENCES users(user_id),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Announcements
CREATE TABLE IF NOT EXISTS class_announcements (
    announcement_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    posted_by BIGINT REFERENCES users(user_id),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Forms indexes
CREATE INDEX IF NOT EXISTS idx_forms_school ON forms(school_id);
CREATE INDEX IF NOT EXISTS idx_forms_coordinator ON forms(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_forms_academic_year ON forms(academic_year);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_form ON classes(form_id);
CREATE INDEX IF NOT EXISTS idx_classes_tutor ON classes(form_tutor_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(subject_code);

-- Subject offerings indexes
CREATE INDEX IF NOT EXISTS idx_offerings_subject ON subject_form_offerings(subject_id);
CREATE INDEX IF NOT EXISTS idx_offerings_form ON subject_form_offerings(form_id);

-- Class subjects indexes
CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_offering ON class_subjects(subject_offering_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON class_subjects(teacher_id);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_class_subject ON lessons(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(created_by);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);

-- Lesson content indexes
CREATE INDEX IF NOT EXISTS idx_content_lesson ON lesson_content(lesson_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON lesson_content(content_type);

-- Student assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_student ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_year ON student_class_assignments(academic_year);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_lesson ON lesson_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON lesson_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON lesson_attendance(status);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessments_class_subject ON subject_assessments(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON subject_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_term ON subject_assessments(term);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON subject_assessments(due_date);

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_assessment ON student_grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_letter ON student_grades(grade_letter);

-- Announcement indexes
CREATE INDEX IF NOT EXISTS idx_announcements_form ON form_announcements(form_id);
CREATE INDEX IF NOT EXISTS idx_announcements_expiry ON form_announcements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_class_announcements_class ON class_announcements(class_id);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Student's Current Class and Subjects
CREATE OR REPLACE VIEW student_class_subjects_view AS
SELECT 
    sca.student_id,
    sca.class_id,
    c.class_name,
    c.class_code,
    f.form_number,
    f.form_name,
    s.subject_id,
    s.subject_name,
    s.subject_code,
    cs.class_subject_id,
    cs.teacher_id,
    u.name AS teacher_name
FROM student_class_assignments sca
JOIN classes c ON sca.class_id = c.class_id
JOIN forms f ON c.form_id = f.form_id
JOIN class_subjects cs ON c.class_id = cs.class_id
JOIN subject_form_offerings sfo ON cs.subject_offering_id = sfo.offering_id
JOIN subjects s ON sfo.subject_id = s.subject_id
LEFT JOIN users u ON cs.teacher_id = u.user_id
WHERE sca.is_active = true AND c.is_active = true;

-- View: Teacher's Classes and Subjects
CREATE OR REPLACE VIEW teacher_class_subjects_view AS
SELECT 
    cs.teacher_id,
    u.name AS teacher_name,
    c.class_id,
    c.class_name,
    c.class_code,
    f.form_id,
    f.form_number,
    f.form_name,
    s.subject_id,
    s.subject_name,
    s.subject_code,
    cs.class_subject_id
FROM class_subjects cs
JOIN classes c ON cs.class_id = c.class_id
JOIN forms f ON c.form_id = f.form_id
JOIN subject_form_offerings sfo ON cs.subject_offering_id = sfo.offering_id
JOIN subjects s ON sfo.subject_id = s.subject_id
JOIN users u ON cs.teacher_id = u.user_id
WHERE c.is_active = true AND cs.teacher_id IS NOT NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ LaunchPad SKN database schema created successfully!';
    RAISE NOTICE '📊 16 tables created';
    RAISE NOTICE '🔍 2 views created';
    RAISE NOTICE '📋 All indexes and constraints applied';
END $$;


