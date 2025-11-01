-- LaunchPad SKN - Caribbean Secondary School Architecture
-- Database Schema Redesign: School → Form → Class → Subject → Lesson
-- FRESH DATABASE SETUP - Run this script on a clean Supabase/PostgreSQL database
-- This script creates all prerequisite tables if they don't exist
-- 
-- For Supabase: Copy and paste into SQL Editor
-- For PostgreSQL: psql -U postgres -d your_database -f schema-redesign.sql

-- ============================================
-- PREREQUISITE TABLES (If not already created by other services)
-- ============================================

-- Institutions/Schools table (minimal version if not exists)
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

-- Users table (minimal version if not exists)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_first_login BOOLEAN DEFAULT true
);

-- Departments table (minimal version if not exists)
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
-- 1. FORM (Year Group: Forms 1-7)
-- ============================================
CREATE TABLE IF NOT EXISTS forms (
    form_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES institutions(institution_id),
    form_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6, 7
    form_name VARCHAR(50) NOT NULL, -- "Form 3", "Form 4", "Lower Sixth"
    academic_year VARCHAR(20) NOT NULL, -- "2024-2025"
    coordinator_id BIGINT REFERENCES users(user_id), -- Form Coordinator/Year Head
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_form_per_school_year UNIQUE(school_id, form_number, academic_year)
);

CREATE INDEX idx_forms_school ON forms(school_id);
CREATE INDEX idx_forms_coordinator ON forms(coordinator_id);
CREATE INDEX idx_forms_academic_year ON forms(academic_year);

-- ============================================
-- 2. CLASS (Homeroom/Stream: e.g., 3A, 3B, 3C)
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    class_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL, -- "3A", "3B", "4Science", "5Arts"
    class_code VARCHAR(20) UNIQUE NOT NULL, -- "F3A", "F4SCI", "F5ART"
    academic_year VARCHAR(20) NOT NULL, -- "2024-2025" (matching form's academic year)
    capacity INTEGER DEFAULT 35,
    current_enrollment INTEGER DEFAULT 0,
    form_tutor_id BIGINT REFERENCES users(user_id), -- Class Teacher/Form Tutor
    room_number VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_per_form UNIQUE(form_id, class_name, academic_year)
);

CREATE INDEX idx_classes_form ON classes(form_id);
CREATE INDEX idx_classes_tutor ON classes(form_tutor_id);
CREATE INDEX idx_classes_code ON classes(class_code);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);

-- ============================================
-- 3. SUBJECT (Academic Discipline)
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
    subject_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES institutions(institution_id),
    subject_name VARCHAR(100) NOT NULL, -- "Mathematics", "English Language"
    subject_code VARCHAR(20) UNIQUE NOT NULL, -- "MATH", "ENG", "PHYS"
    description TEXT,
    cxc_code VARCHAR(20), -- CSEC/CAPE subject code (e.g., "0502" for Math)
    department_id BIGINT REFERENCES departments(department_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_school ON subjects(school_id);
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_code ON subjects(subject_code);

-- ============================================
-- 4. SUBJECT FORM OFFERING (Subject offered in specific Form)
-- ============================================
CREATE TABLE IF NOT EXISTS subject_form_offerings (
    offering_id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    curriculum_framework TEXT, -- Link to CXC/CSEC/CAPE standards
    learning_outcomes TEXT,
    weekly_periods INTEGER DEFAULT 5, -- Number of lessons per week
    is_compulsory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_subject_form_offering UNIQUE(subject_id, form_id)
);

CREATE INDEX idx_offerings_subject ON subject_form_offerings(subject_id);
CREATE INDEX idx_offerings_form ON subject_form_offerings(form_id);

-- ============================================
-- 5. CLASS-SUBJECT (Junction: Which classes take which subjects)
-- ============================================
CREATE TABLE IF NOT EXISTS class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    subject_offering_id BIGINT NOT NULL REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES users(user_id), -- Subject teacher for this class
    room_preference VARCHAR(20), -- Preferred room for this class-subject
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_subject UNIQUE(class_id, subject_offering_id)
);

CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_offering ON class_subjects(subject_offering_id);
CREATE INDEX idx_class_subjects_teacher ON class_subjects(teacher_id);

-- ============================================
-- 6. LESSON (Individual Instructional Session)
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    lesson_title VARCHAR(200) NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100), -- Room number or location
    lesson_number INTEGER, -- Sequence within topic/unit
    topic VARCHAR(200),
    learning_objectives TEXT,
    lesson_plan TEXT,
    homework_description TEXT,
    homework_due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED, ABSENT
    attendance_taken BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_class_subject ON lessons(class_subject_id);
CREATE INDEX idx_lessons_date ON lessons(lesson_date);
CREATE INDEX idx_lessons_teacher ON lessons(created_by);
CREATE INDEX idx_lessons_status ON lessons(status);

-- ============================================
-- 7. LESSON CONTENT (Files, links, materials)
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_content (
    content_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- FILE, LINK, VIDEO, DOCUMENT, IMAGE
    title VARCHAR(200) NOT NULL,
    url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_content_lesson ON lesson_content(lesson_id);
CREATE INDEX idx_content_type ON lesson_content(content_type);

-- ============================================
-- 8. STUDENT CLASS ASSIGNMENT (Student → Class)
-- ============================================
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

CREATE INDEX idx_assignments_student ON student_class_assignments(student_id);
CREATE INDEX idx_assignments_class ON student_class_assignments(class_id);
CREATE INDEX idx_assignments_year ON student_class_assignments(academic_year);

-- ============================================
-- 9. LESSON ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, LATE, EXCUSED, SICK
    marked_by BIGINT REFERENCES users(user_id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT unique_lesson_student_attendance UNIQUE(lesson_id, student_id)
);

CREATE INDEX idx_attendance_lesson ON lesson_attendance(lesson_id);
CREATE INDEX idx_attendance_student ON lesson_attendance(student_id);
CREATE INDEX idx_attendance_status ON lesson_attendance(status);

-- ============================================
-- 10. SUBJECT ASSESSMENT
-- ============================================
CREATE TABLE IF NOT EXISTS subject_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL, -- TEST, QUIZ, SBA, PROJECT, MOCK_EXAM, EXAM
    assessment_name VARCHAR(200) NOT NULL,
    description TEXT,
    total_marks DECIMAL(10,2) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 0.00, -- Percentage of final grade
    due_date TIMESTAMP,
    assessment_date DATE,
    term INTEGER CHECK (term IN (1, 2, 3)), -- 1, 2, or 3
    academic_year VARCHAR(20),
    is_sba_component BOOLEAN DEFAULT false, -- For CXC School-Based Assessment
    sba_component_number INTEGER, -- For multi-component SBAs
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_class_subject ON subject_assessments(class_subject_id);
CREATE INDEX idx_assessments_type ON subject_assessments(assessment_type);
CREATE INDEX idx_assessments_term ON subject_assessments(term);
CREATE INDEX idx_assessments_date ON subject_assessments(due_date);

-- ============================================
-- 11. STUDENT GRADES
-- ============================================
CREATE TABLE IF NOT EXISTS student_grades (
    grade_id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES subject_assessments(assessment_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    marks_obtained DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(5), -- A, B, C, D, F or 1, 2, 3, 4, 5 for CXC
    is_excused BOOLEAN DEFAULT false,
    graded_by BIGINT REFERENCES users(user_id),
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    CONSTRAINT unique_student_assessment_grade UNIQUE(assessment_id, student_id)
);

CREATE INDEX idx_grades_assessment ON student_grades(assessment_id);
CREATE INDEX idx_grades_student ON student_grades(student_id);
CREATE INDEX idx_grades_letter ON student_grades(grade_letter);

-- ============================================
-- 12. FORM ANNOUNCEMENTS (Form-level communications)
-- ============================================
CREATE TABLE IF NOT EXISTS form_announcements (
    announcement_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    posted_by BIGINT REFERENCES users(user_id),
    priority VARCHAR(20) DEFAULT 'NORMAL', -- HIGH, NORMAL, LOW
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_form ON form_announcements(form_id);
CREATE INDEX idx_announcements_expiry ON form_announcements(expiry_date);

-- ============================================
-- 13. CLASS ANNOUNCEMENTS (Class-specific communications)
-- ============================================
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

CREATE INDEX idx_class_announcements_class ON class_announcements(class_id);

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
-- COMMENTS
-- ============================================
COMMENT ON TABLE forms IS 'Year groups (Forms 1-7) within a school';
COMMENT ON TABLE classes IS 'Homeroom/stream classes within a form (e.g., 3A, 3B)';
COMMENT ON TABLE subjects IS 'Academic disciplines (Mathematics, English, etc.)';
COMMENT ON TABLE subject_form_offerings IS 'Subjects offered in specific forms';
COMMENT ON TABLE class_subjects IS 'Junction table: which classes take which subjects';
COMMENT ON TABLE lessons IS 'Individual instructional sessions/periods';
COMMENT ON TABLE student_class_assignments IS 'Student enrollment in classes (replaces course enrollment)';
COMMENT ON TABLE lesson_attendance IS 'Attendance records for individual lessons';
COMMENT ON TABLE subject_assessments IS 'Tests, quizzes, SBAs, projects for subjects';
COMMENT ON TABLE student_grades IS 'Grades for assessments';

