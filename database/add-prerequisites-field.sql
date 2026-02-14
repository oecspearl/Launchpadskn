-- ============================================
-- ADD PREREQUISITE SUPPORT TO LESSON CONTENT
-- ============================================
-- This migration adds the ability for teachers to explicitly set
-- which content items are prerequisites for other content items.

-- Add prerequisite_content_ids column to store array of content IDs
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS prerequisite_content_ids BIGINT[] DEFAULT ARRAY[]::BIGINT[];

-- Create index for prerequisite lookups
CREATE INDEX IF NOT EXISTS idx_content_prerequisites ON lesson_content USING GIN (prerequisite_content_ids);

-- Add comment for documentation
COMMENT ON COLUMN lesson_content.prerequisite_content_ids IS 'Array of content_id values that must be completed before this content can be accessed';

