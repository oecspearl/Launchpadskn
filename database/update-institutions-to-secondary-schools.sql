-- LaunchPad SKN - Update Institutions to Secondary Schools
-- This script updates the database to properly mark all institutions as Secondary Schools
-- and adds constraints to ensure data integrity

-- ============================================
-- STEP 1: Update all existing institutions to 'SECONDARY_SCHOOL'
-- ============================================

-- Update any institutions with 'SCHOOL' type to 'SECONDARY_SCHOOL'
UPDATE institutions
SET institution_type = 'SECONDARY_SCHOOL'
WHERE institution_type = 'SCHOOL' OR institution_type IS NULL;

-- Also update if there are any other variations
UPDATE institutions
SET institution_type = 'SECONDARY_SCHOOL'
WHERE LOWER(name) LIKE '%secondary school%'
   OR LOWER(name) LIKE '%high school%'
   OR LOWER(name) LIKE '%academy%'
   OR LOWER(name) LIKE '%preparatory school%';

-- ============================================
-- STEP 2: Add CHECK constraint for institution_type
-- ============================================

-- First, drop existing constraint if it exists (PostgreSQL)
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'institution_type_check'
    ) THEN
        ALTER TABLE institutions DROP CONSTRAINT institution_type_check;
    END IF;
END $$;

-- Add CHECK constraint to ensure only valid institution types
ALTER TABLE institutions
ADD CONSTRAINT institution_type_check 
CHECK (
    institution_type IN (
        'SECONDARY_SCHOOL',
        'PRIMARY_SCHOOL',
        'TERTIARY_INSTITUTION',
        'MINISTRY_OF_EDUCATION',
        'OTHER'
    )
);

-- ============================================
-- STEP 3: Add comment to institution_type column
-- ============================================

COMMENT ON COLUMN institutions.institution_type IS 
'Type of educational institution. Valid values: SECONDARY_SCHOOL, PRIMARY_SCHOOL, TERTIARY_INSTITUTION, MINISTRY_OF_EDUCATION, OTHER';

-- ============================================
-- STEP 4: Set default value for future inserts
-- ============================================

-- Set default to SECONDARY_SCHOOL for new institutions
ALTER TABLE institutions
ALTER COLUMN institution_type 
SET DEFAULT 'SECONDARY_SCHOOL';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all institutions are now SECONDARY_SCHOOL
-- SELECT 
--     name,
--     institution_type,
--     location
-- FROM institutions
-- ORDER BY name;

-- Count by type (should all be SECONDARY_SCHOOL)
-- SELECT 
--     institution_type,
--     COUNT(*) as count
-- FROM institutions
-- GROUP BY institution_type;

-- Check if any institutions were not updated (should return 0 rows)
-- SELECT 
--     name,
--     institution_type
-- FROM institutions
-- WHERE institution_type IS NULL 
--    OR institution_type NOT IN (
--        'SECONDARY_SCHOOL',
--        'PRIMARY_SCHOOL',
--        'TERTIARY_INSTITUTION',
--        'MINISTRY_OF_EDUCATION',
--        'OTHER'
--    );

