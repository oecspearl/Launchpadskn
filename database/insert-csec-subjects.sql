-- LaunchPad SKN - Insert CSEC Subjects
-- This script inserts all CSEC subjects offered in Saint Kitts and Nevis
-- Subjects require a school_id, so you have two options:
-- Option 1: Replace {SCHOOL_ID} with a specific school ID
-- Option 2: Create a "Master Catalog" institution first (see below)

-- ============================================
-- IMPORTANT NOTE: Subject Code Uniqueness
-- ============================================
-- The subjects table has subject_code as UNIQUE across all schools.
-- This script creates unique subject codes by appending school ID to avoid conflicts.
-- Each school will have their own copy of subjects (e.g., "ENG_1", "ENG_2" for different schools)
-- OR you can create a master catalog approach (see Option 2 below)

-- ============================================
-- OPTION 1: Create Subjects for All Schools (Recommended)
-- ============================================
-- This script creates subjects for each school with unique codes
-- Format: {SUBJECT_CODE}_{SCHOOL_ID} (e.g., "ENG_1", "MATH_2")

-- ============================================
-- CORE/COMPULSORY SUBJECTS
-- ============================================

-- English Language (English A)
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id, 
    'English Language',
    'ENG_' || institution_id::text,
    '0500',
    'CSEC English Language (English A) - Core compulsory subject for all students'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Mathematics
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Mathematics',
    'MATH_' || institution_id::text,
    '0502',
    'CSEC Mathematics - Core compulsory subject for all students'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- SCIENCES
-- ============================================

-- Biology
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Biology',
    'BIO_' || institution_id::text,
    '0301',
    'CSEC Biology - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Chemistry
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Chemistry',
    'CHEM_' || institution_id::text,
    '0302',
    'CSEC Chemistry - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Physics
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Physics',
    'PHYS_' || institution_id::text,
    '0303',
    'CSEC Physics - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Human and Social Biology
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Human and Social Biology',
    'HSB_' || institution_id::text,
    '0304',
    'CSEC Human and Social Biology - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Integrated Science
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Integrated Science',
    'INTSCI_' || institution_id::text,
    '0305',
    'CSEC Integrated Science - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Agricultural Science
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Agricultural Science',
    'AGRIC_' || institution_id::text,
    '0601',
    'CSEC Agricultural Science - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- SOCIAL SCIENCES & HUMANITIES
-- ============================================

-- Geography
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Geography',
    'GEO_' || institution_id::text,
    '0201',
    'CSEC Geography - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Caribbean History
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Caribbean History',
    'HIST_' || institution_id::text,
    '0202',
    'CSEC Caribbean History - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Social Studies
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Social Studies',
    'SOCST_' || institution_id::text,
    '0203',
    'CSEC Social Studies - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Economics
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Economics',
    'ECON_' || institution_id::text,
    '0401',
    'CSEC Economics - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- BUSINESS STUDIES
-- ============================================

-- Principles of Accounts
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Principles of Accounts',
    'POA_' || institution_id::text,
    '0402',
    'CSEC Principles of Accounts - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Principles of Business
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Principles of Business',
    'POB_' || institution_id::text,
    '0403',
    'CSEC Principles of Business - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Office Administration
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Office Administration',
    'OA_' || institution_id::text,
    '0404',
    'CSEC Office Administration - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Information Technology
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Information Technology',
    'IT_' || institution_id::text,
    '0701',
    'CSEC Information Technology - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- LANGUAGES
-- ============================================

-- Spanish
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Spanish',
    'SPAN_' || institution_id::text,
    '0102',
    'CSEC Spanish - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- French
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'French',
    'FREN_' || institution_id::text,
    '0101',
    'CSEC French - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- English B (for non-native English speakers)
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'English B',
    'ENGB_' || institution_id::text,
    '0501',
    'CSEC English B - General Proficiency (for non-native English speakers)'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- TECHNICAL/VOCATIONAL SUBJECTS
-- ============================================

-- Technical Drawing
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Technical Drawing',
    'TECHDR_' || institution_id::text,
    '0702',
    'CSEC Technical Drawing - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Electronic Document Preparation and Management (EDPM)
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Electronic Document Preparation and Management',
    'EDPM_' || institution_id::text,
    '0703',
    'CSEC Electronic Document Preparation and Management (EDPM) - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Building Technology
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Building Technology',
    'BUILDT_' || institution_id::text,
    '0704',
    'CSEC Building Technology - Technical Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Electrical and Electronic Technology
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Electrical and Electronic Technology',
    'ELEC_' || institution_id::text,
    '0705',
    'CSEC Electrical and Electronic Technology - Technical Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Mechanical Engineering Technology
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Mechanical Engineering Technology',
    'MECH_' || institution_id::text,
    '0706',
    'CSEC Mechanical Engineering Technology - Technical Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Home Economics - Food and Nutrition
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Home Economics - Food and Nutrition',
    'FOOD_' || institution_id::text,
    '0602',
    'CSEC Food and Nutrition - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Home Economics - Clothing and Textiles
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Home Economics - Clothing and Textiles',
    'TEXT_' || institution_id::text,
    '0603',
    'CSEC Clothing and Textiles - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- OTHER SUBJECTS
-- ============================================

-- Physical Education and Sport
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Physical Education and Sport',
    'PE_' || institution_id::text,
    '0801',
    'CSEC Physical Education and Sport - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Visual Arts
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Visual Arts',
    'ARTS_' || institution_id::text,
    '0802',
    'CSEC Visual Arts - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Music
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Music',
    'MUSIC_' || institution_id::text,
    '0803',
    'CSEC Music - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Theatre Arts
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Theatre Arts',
    'THEATRE_' || institution_id::text,
    '0804',
    'CSEC Theatre Arts - General Proficiency'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- Additional Mathematics
INSERT INTO subjects (school_id, subject_name, subject_code, cxc_code, description)
SELECT institution_id,
    'Additional Mathematics',
    'ADDMATH_' || institution_id::text,
    '0503',
    'CSEC Additional Mathematics - General Proficiency (for advanced math students)'
FROM institutions
WHERE institution_type = 'SCHOOL'
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after insertion to verify all subjects were added:
-- SELECT 
--     s.subject_name,
--     s.subject_code,
--     s.cxc_code,
--     i.name as school_name,
--     COUNT(*) OVER (PARTITION BY s.subject_code) as total_schools_offering
-- FROM subjects s
-- JOIN institutions i ON s.school_id = i.institution_id
-- WHERE s.is_active = true
-- ORDER BY s.subject_name, i.name;

-- ============================================
-- SUMMARY STATISTICS
-- ============================================
-- To get a count of subjects per school:
-- SELECT 
--     i.name as school_name,
--     COUNT(s.subject_id) as total_subjects
-- FROM institutions i
-- LEFT JOIN subjects s ON i.institution_id = s.school_id
-- WHERE i.institution_type = 'SCHOOL'
-- GROUP BY i.name
-- ORDER BY i.name;

