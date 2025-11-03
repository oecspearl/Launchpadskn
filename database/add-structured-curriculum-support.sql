-- LaunchPad SKN - Add Structured Curriculum Support
-- This script adds JSONB columns to support rich, structured curriculum content
-- while maintaining backward compatibility with existing TEXT fields

-- ============================================
-- 1. Add JSONB columns for structured curriculum
-- ============================================

-- Add curriculum_structure JSONB column to store structured curriculum data
ALTER TABLE subject_form_offerings
ADD COLUMN IF NOT EXISTS curriculum_structure JSONB DEFAULT NULL;

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_offerings_curriculum_structure 
ON subject_form_offerings USING GIN (curriculum_structure);

-- ============================================
-- 2. Add metadata columns
-- ============================================

-- Curriculum version/date
ALTER TABLE subject_form_offerings
ADD COLUMN IF NOT EXISTS curriculum_version VARCHAR(50) DEFAULT NULL;

-- Last curriculum update date
ALTER TABLE subject_form_offerings
ADD COLUMN IF NOT EXISTS curriculum_updated_at TIMESTAMP DEFAULT NULL;

-- ============================================
-- 3. Add comments for documentation
-- ============================================

COMMENT ON COLUMN subject_form_offerings.curriculum_structure IS 
'Structured curriculum data in JSONB format. Supports topics, units, outcomes, assessment strategies, and learning strategies. 
Structure: {
  "frontMatter": {
    "coverPage": {...},
    "tableOfContents": [...],
    "introduction": "..."
  },
  "topics": [
    {
      "topicNumber": 1,
      "title": "Number and Operations",
      "overview": {
        "strandIdentification": "...",
        "essentialLearningOutcomes": [...],
        "gradeLevelGuidelines": [...]
      },
      "instructionalUnits": [
        {
          "unitNumber": 1,
          "scoNumber": "1.1",
          "specificCurriculumOutcomes": "...",
          "inclusiveAssessmentStrategies": "...",
          "inclusiveLearningStrategies": "..."
        }
      ],
      "usefulContentKnowledge": "...",
      "closingFramework": {
        "essentialEducationCompetencies": [...],
        "crossCurricularConnections": {...},
        "localCultureIntegration": "...",
        "technologyIntegration": "...",
        "itemsOfInspiration": [...]
      },
      "resources": {
        "webLinks": [...],
        "videos": [...],
        "games": [...],
        "worksheets": [...]
      }
    }
  ]
}';

COMMENT ON COLUMN subject_form_offerings.curriculum_version IS 
'Version identifier for the curriculum (e.g., "Form 1 Math 2024-2025", "CSEC Mathematics v2.1")';

-- ============================================
-- 4. Migration: Convert existing curriculum_framework to structured format (optional)
-- ============================================

-- This function can be used to migrate existing TEXT curriculum to structured format
-- Run manually if needed
/*
DO $$
BEGIN
    UPDATE subject_form_offerings
    SET curriculum_structure = jsonb_build_object(
        'frontMatter', jsonb_build_object(
            'introduction', curriculum_framework
        ),
        'topics', jsonb_build_array(
            jsonb_build_object(
                'title', 'General Curriculum',
                'overview', jsonb_build_object(
                    'essentialLearningOutcomes', learning_outcomes
                )
            )
        )
    )
    WHERE curriculum_framework IS NOT NULL 
      AND curriculum_structure IS NULL;
END $$;
*/

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'subject_form_offerings' 
--   AND column_name IN ('curriculum_structure', 'curriculum_version', 'curriculum_updated_at');

-- Test JSONB structure (example)
-- UPDATE subject_form_offerings
-- SET curriculum_structure = '{"topics": [{"title": "Test Topic"}]}'::jsonb
-- WHERE offering_id = 1
-- RETURNING curriculum_structure;

