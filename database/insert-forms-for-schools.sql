-- LaunchPad SKN - Insert Forms (Year Groups) for All Schools
-- This script creates Forms 1-7 for each secondary school
-- Based on Caribbean Secondary School Structure:
--   - Lower Secondary: Forms 1-3 (ages 11-14, 3 years)
--   - Upper Secondary: Forms 4-5 (ages 14-16, 2 years, CSEC)
--   - Sixth Form (Optional): Forms 6-7 (ages 16-18, 2 years, CAPE)

-- ============================================
-- IMPORTANT: Set the academic year
-- ============================================
-- Update this value to match the current academic year (e.g., "2024-2025")
DO $$
DECLARE
    current_academic_year VARCHAR(20) := '2024-2025';
BEGIN
    -- ============================================
    -- LOWER SECONDARY: Forms 1-3 (Ages 11-14)
    -- ============================================
    
    -- Form 1 (Lower Secondary - Year 1)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        1,
        'Form 1',
        current_academic_year,
        'Lower Secondary - Year 1 (Ages 11-12). Foundation year for secondary education with internal assessments.',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Form 2 (Lower Secondary - Year 2)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        2,
        'Form 2',
        current_academic_year,
        'Lower Secondary - Year 2 (Ages 12-13). Continuation of foundation studies with internal assessments.',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Form 3 (Lower Secondary - Year 3)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        3,
        'Form 3',
        current_academic_year,
        'Lower Secondary - Year 3 (Ages 13-14). Final year of lower secondary with internal assessments. Prepares students for CSEC track in Forms 4-5.',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    -- ============================================
    -- UPPER SECONDARY: Forms 4-5 (Ages 14-16, CSEC)
    -- ============================================
    
    -- Form 4 (Upper Secondary - Year 1, CSEC Year 1)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        4,
        'Form 4',
        current_academic_year,
        'Upper Secondary - Year 1 (Ages 14-15). First year of CSEC preparation. Students begin CSEC subject studies and School-Based Assessments (SBAs).',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Form 5 (Upper Secondary - Year 2, CSEC Examination Year)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        5,
        'Form 5',
        current_academic_year,
        'Upper Secondary - Year 2 (Ages 15-16). CSEC Examination Year. Students complete SBAs and sit CSEC examinations at the end of the year.',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    -- ============================================
    -- SIXTH FORM (OPTIONAL): Forms 6-7 (Ages 16-18, CAPE)
    -- ============================================
    
    -- Form 6 (Lower Sixth - CAPE Year 1)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        6,
        'Lower Sixth',
        current_academic_year,
        'Sixth Form - Lower Sixth (Ages 16-17). First year of CAPE (Caribbean Advanced Proficiency Examination) preparation. Optional post-CSEC education for students pursuing A-Level equivalent studies.',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Form 7 (Upper Sixth - CAPE Examination Year)
    INSERT INTO forms (school_id, form_number, form_name, academic_year, description, is_active)
    SELECT 
        institution_id,
        7,
        'Upper Sixth',
        current_academic_year,
        'Sixth Form - Upper Sixth (Ages 17-18). CAPE Examination Year. Students complete CAPE coursework and sit CAPE examinations. Prepares for university admission.',
        true
    FROM institutions
    WHERE institution_type = 'SECONDARY_SCHOOL'
    ON CONFLICT (school_id, form_number, academic_year) DO UPDATE SET
        form_name = EXCLUDED.form_name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Forms 1-7 have been created/updated for all schools for academic year: %', current_academic_year;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count forms per school
-- SELECT 
--     i.name as school_name,
--     COUNT(f.form_id) as total_forms,
--     STRING_AGG(f.form_name, ', ' ORDER BY f.form_number) as forms
-- FROM institutions i
-- LEFT JOIN forms f ON i.institution_id = f.school_id
-- WHERE i.institution_type = 'SECONDARY_SCHOOL'
--     AND f.academic_year = '2024-2025'
-- GROUP BY i.name
-- ORDER BY i.name;

-- List all forms with details
-- SELECT 
--     i.name as school_name,
--     f.form_number,
--     f.form_name,
--     f.academic_year,
--     f.description,
--     f.is_active,
--     CASE 
--         WHEN f.form_number BETWEEN 1 AND 3 THEN 'Lower Secondary'
--         WHEN f.form_number BETWEEN 4 AND 5 THEN 'Upper Secondary (CSEC)'
--         WHEN f.form_number BETWEEN 6 AND 7 THEN 'Sixth Form (CAPE)'
--     END as level
-- FROM institutions i
-- JOIN forms f ON i.institution_id = f.school_id
-- WHERE i.institution_type = 'SECONDARY_SCHOOL'
--     AND f.academic_year = '2024-2025'
-- ORDER BY i.name, f.form_number;

