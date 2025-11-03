-- LaunchPad SKN - Find Form 1 Mathematics Offering ID
-- Run this query first to find the offering_id for Form 1 Mathematics
-- Then use that ID in insert-form1-math-curriculum.sql

SELECT 
  sfo.offering_id,
  s.subject_name,
  s.subject_code,
  f.form_name,
  f.form_number,
  i.name AS school_name,
  f.academic_year,
  sfo.curriculum_version,
  sfo.curriculum_updated_at
FROM subject_form_offerings sfo
JOIN subjects s ON sfo.subject_id = s.subject_id
JOIN forms f ON sfo.form_id = f.form_id
JOIN institutions i ON f.school_id = i.institution_id
WHERE s.subject_name ILIKE '%mathematics%' 
   OR s.subject_name ILIKE '%math%'
  AND f.form_number = 1
ORDER BY i.name, s.subject_name;

-- Alternative: If you want to see ALL offerings (not just Form 1):
-- SELECT 
--   sfo.offering_id,
--   s.subject_name,
--   f.form_name,
--   f.form_number,
--   i.name AS school_name
-- FROM subject_form_offerings sfo
-- JOIN subjects s ON sfo.subject_id = s.subject_id
-- JOIN forms f ON sfo.form_id = f.form_id
-- JOIN institutions i ON f.school_id = i.institution_id
-- WHERE s.subject_name ILIKE '%mathematics%' 
--    OR s.subject_name ILIKE '%math%'
-- ORDER BY f.form_number, i.name;

