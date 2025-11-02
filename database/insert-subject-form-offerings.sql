-- LaunchPad SKN - Insert Subject Form Offerings
-- This script creates subject_form_offerings records linking subjects to forms
-- This populates the curriculum content that teachers can view in the Curriculum module
--
-- IMPORTANT: Run this AFTER running:
-- 1. insert-skn-secondary-schools.sql (creates institutions)
-- 2. insert-csec-subjects.sql (creates subjects)
-- 3. insert-forms-for-schools.sql (creates forms)

-- ============================================
-- CURRICULUM OFFERINGS BY FORM
-- ============================================
-- This creates offerings for core subjects across forms
-- You can customize curriculum_framework and learning_outcomes per subject/form

DO $$
DECLARE
    school_rec RECORD;
    subject_rec RECORD;
    form_rec RECORD;
    current_academic_year VARCHAR(20) := '2024-2025';
BEGIN
    -- Loop through all secondary schools
    FOR school_rec IN 
        SELECT institution_id, name 
        FROM institutions 
        WHERE institution_type = 'SECONDARY_SCHOOL'
    LOOP
        RAISE NOTICE 'Processing school: % (ID: %)', school_rec.name, school_rec.institution_id;
        
        -- Loop through forms for this school
        FOR form_rec IN
            SELECT form_id, form_number, form_name
            FROM forms
            WHERE school_id = school_rec.institution_id
              AND academic_year = current_academic_year
              AND is_active = true
            ORDER BY form_number
        LOOP
            RAISE NOTICE '  Processing form: % (Form %)', form_rec.form_name, form_rec.form_number;
            
            -- Loop through subjects for this school
            FOR subject_rec IN
                SELECT subject_id, subject_name, subject_code, cxc_code
                FROM subjects
                WHERE school_id = school_rec.institution_id
                  AND is_active = true
                ORDER BY subject_name
            LOOP
                -- Determine if subject should be offered in this form
                -- Core subjects (English, Math) offered in all forms
                -- Other subjects typically start from Form 3 or Form 4
                DECLARE
                    should_offer BOOLEAN := false;
                    is_compulsory BOOLEAN := false;
                    weekly_periods INTEGER := 5;
                    curriculum_framework_text TEXT;
                    learning_outcomes_text TEXT;
                BEGIN
                    -- Core compulsory subjects (Forms 1-5)
                    IF subject_rec.subject_name IN ('English Language', 'Mathematics') THEN
                        IF form_rec.form_number BETWEEN 1 AND 5 THEN
                            should_offer := true;
                            is_compulsory := true;
                            weekly_periods := 5;
                            
                            -- English Language curriculum
                            IF subject_rec.subject_name = 'English Language' THEN
                                curriculum_framework_text := E'CSEC English Language Syllabus:\n' ||
                                    E'• Reading Comprehension\n' ||
                                    E'• Writing Skills (Narrative, Descriptive, Expository, Argumentative)\n' ||
                                    E'• Grammar and Mechanics\n' ||
                                    E'• Literature (Poetry, Prose, Drama)\n' ||
                                    E'• Language Analysis\n' ||
                                    E'• School-Based Assessment (SBA)';
                                
                                learning_outcomes_text := E'Students will:\n' ||
                                    E'• Develop effective reading comprehension skills\n' ||
                                    E'• Master various writing genres and styles\n' ||
                                    E'• Demonstrate proficiency in grammar and mechanics\n' ||
                                    E'• Analyze and appreciate Caribbean and world literature\n' ||
                                    E'• Complete School-Based Assessment requirements';
                                
                                -- Mathematics curriculum
                            ELSIF subject_rec.subject_name = 'Mathematics' THEN
                                curriculum_framework_text := E'CSEC Mathematics Syllabus:\n' ||
                                    E'• Number Theory and Computation\n' ||
                                    E'• Algebra and Functions\n' ||
                                    E'• Geometry and Trigonometry\n' ||
                                    E'• Statistics and Probability\n' ||
                                    E'• Problem Solving and Mathematical Reasoning\n' ||
                                    E'• School-Based Assessment (SBA)';
                                
                                learning_outcomes_text := E'Students will:\n' ||
                                    E'• Master fundamental mathematical concepts\n' ||
                                    E'• Apply mathematical knowledge to real-world problems\n' ||
                                    E'• Develop logical reasoning and analytical skills\n' ||
                                    E'• Prepare for CSEC examinations\n' ||
                                    E'• Complete School-Based Assessment requirements';
                            END IF;
                        END IF;
                        
                        -- Science subjects (Forms 1-5)
                    ELSIF subject_rec.subject_name IN ('Biology', 'Chemistry', 'Physics', 'Integrated Science') THEN
                        IF form_rec.form_number BETWEEN 1 AND 5 THEN
                            should_offer := true;
                            is_compulsory := (form_rec.form_number <= 3); -- Usually compulsory up to Form 3
                            weekly_periods := 4;
                            
                            curriculum_framework_text := E'CSEC ' || subject_rec.subject_name || E' Syllabus:\n' ||
                                E'• Core scientific principles\n' ||
                                E'• Laboratory skills and experiments\n' ||
                                E'• Data analysis and interpretation\n' ||
                                E'• Application to Caribbean context\n' ||
                                E'• School-Based Assessment (SBA)';
                            
                            learning_outcomes_text := E'Students will:\n' ||
                                E'• Understand fundamental ' || LOWER(subject_rec.subject_name) || E' concepts\n' ||
                                E'• Develop practical laboratory skills\n' ||
                                E'• Analyze and interpret scientific data\n' ||
                                E'• Apply knowledge to Caribbean environment\n' ||
                                E'• Complete School-Based Assessment';
                                
                                -- CSEC preparation subjects (Forms 4-5)
                        ELSIF form_rec.form_number BETWEEN 4 AND 5 THEN
                            should_offer := true;
                            is_compulsory := false;
                            weekly_periods := 5;
                            
                            -- Social Sciences, Languages, Business, Technical subjects
                        ELSIF form_rec.form_number BETWEEN 3 AND 5 THEN
                            should_offer := true;
                            is_compulsory := false;
                            weekly_periods := CASE 
                                WHEN subject_rec.subject_name IN ('Geography', 'Caribbean History', 'Social Studies', 'Economics') THEN 4
                                WHEN subject_rec.subject_name IN ('Spanish', 'French') THEN 4
                                WHEN subject_rec.subject_name LIKE '%Business%' OR subject_rec.subject_name LIKE '%Principles%' THEN 4
                                WHEN subject_rec.subject_name LIKE '%Technology%' OR subject_rec.subject_name LIKE '%Drawing%' THEN 4
                                ELSE 3
                            END;
                            
                            curriculum_framework_text := E'CSEC ' || subject_rec.subject_name || E' Syllabus:\n' ||
                                E'• Core content aligned with CXC standards\n' ||
                                E'• Caribbean context and applications\n' ||
                                E'• School-Based Assessment (SBA) where applicable';
                            
                            learning_outcomes_text := E'Students will:\n' ||
                                E'• Master ' || LOWER(subject_rec.subject_name) || E' content\n' ||
                                E'• Apply knowledge in Caribbean context\n' ||
                                E'• Complete assessment requirements\n' ||
                                E'• Prepare for CSEC examinations';
                        END IF;
                    END IF;
                    
                    -- Create the offering if it should be offered
                    IF should_offer THEN
                        BEGIN
                            INSERT INTO subject_form_offerings (
                                subject_id,
                                form_id,
                                curriculum_framework,
                                learning_outcomes,
                                weekly_periods,
                                is_compulsory,
                                is_active
                            ) VALUES (
                                subject_rec.subject_id,
                                form_rec.form_id,
                                curriculum_framework_text,
                                learning_outcomes_text,
                                weekly_periods,
                                is_compulsory,
                                true
                            )
                            ON CONFLICT (subject_id, form_id) DO UPDATE SET
                                curriculum_framework = EXCLUDED.curriculum_framework,
                                learning_outcomes = EXCLUDED.learning_outcomes,
                                weekly_periods = EXCLUDED.weekly_periods,
                                is_compulsory = EXCLUDED.is_compulsory,
                                is_active = EXCLUDED.is_active;
                            
                            RAISE NOTICE '    Created offering: % - Form %', subject_rec.subject_name, form_rec.form_number;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE NOTICE '    Error creating offering for % - Form %: %', 
                                    subject_rec.subject_name, form_rec.form_number, SQLERRM;
                        END;
                    END IF;
                END;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Subject form offerings created successfully for academic year %', current_academic_year;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check total offerings created
-- SELECT COUNT(*) as total_offerings FROM subject_form_offerings;

-- Check offerings by form
-- SELECT 
--     f.form_name,
--     f.form_number,
--     COUNT(sfo.offering_id) as subject_count
-- FROM forms f
-- LEFT JOIN subject_form_offerings sfo ON f.form_id = sfo.form_id
-- GROUP BY f.form_id, f.form_name, f.form_number
-- ORDER BY f.form_number;

-- Check offerings by subject
-- SELECT 
--     s.subject_name,
--     COUNT(sfo.offering_id) as form_count
-- FROM subjects s
-- LEFT JOIN subject_form_offerings sfo ON s.subject_id = sfo.subject_id
-- GROUP BY s.subject_id, s.subject_name
-- ORDER BY s.subject_name;

-- View sample curriculum content
-- SELECT 
--     s.subject_name,
--     f.form_name,
--     sfo.curriculum_framework,
--     sfo.learning_outcomes,
--     sfo.weekly_periods,
--     sfo.is_compulsory
-- FROM subject_form_offerings sfo
-- JOIN subjects s ON sfo.subject_id = s.subject_id
-- JOIN forms f ON sfo.form_id = f.form_id
-- LIMIT 10;

