-- ============================================
-- ENHANCE LESSON CONTENT FOR TRADITIONAL LMS STRUCTURE
-- ============================================
-- This migration adds LMS-style features to lesson_content:
-- - Sequencing/ordering
-- - Instructions/descriptions
-- - Content organization
-- - Estimated time
-- - Required/optional status

-- Add new columns to lesson_content table
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT, -- What students will learn from this content
ADD COLUMN IF NOT EXISTS learning_activities TEXT, -- Activities students should complete
ADD COLUMN IF NOT EXISTS key_concepts TEXT, -- Key concepts covered
ADD COLUMN IF NOT EXISTS reflection_questions TEXT, -- Questions for student reflection
ADD COLUMN IF NOT EXISTS discussion_prompts TEXT, -- Discussion topics/questions
ADD COLUMN IF NOT EXISTS summary TEXT, -- Summary of the content
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
ADD COLUMN IF NOT EXISTS content_section VARCHAR(100), -- e.g., "Introduction", "Main Content", "Assessment", "Resources"
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for sequencing
CREATE INDEX IF NOT EXISTS idx_content_sequence ON lesson_content(lesson_id, sequence_order);

-- Create index for content sections
CREATE INDEX IF NOT EXISTS idx_content_section ON lesson_content(lesson_id, content_section);

-- Update existing content to have sequence_order based on upload_date
UPDATE lesson_content
SET sequence_order = subquery.row_num
FROM (
  SELECT content_id, ROW_NUMBER() OVER (PARTITION BY lesson_id ORDER BY upload_date ASC) as row_num
  FROM lesson_content
) AS subquery
WHERE lesson_content.content_id = subquery.content_id;

-- Set updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_lesson_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS lesson_content_updated_at ON lesson_content;
CREATE TRIGGER lesson_content_updated_at
    BEFORE UPDATE ON lesson_content
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_content_timestamp();

-- Set published_at for existing content
UPDATE lesson_content
SET published_at = upload_date
WHERE published_at IS NULL AND is_published = true;

-- Add comments for documentation
COMMENT ON COLUMN lesson_content.sequence_order IS 'Order in which content appears in the lesson (1, 2, 3, ...)';
COMMENT ON COLUMN lesson_content.instructions IS 'Instructions for students on how to use this content';
COMMENT ON COLUMN lesson_content.description IS 'Description of the content item';
COMMENT ON COLUMN lesson_content.learning_outcomes IS 'Learning outcomes/objectives for this content (what students will learn)';
COMMENT ON COLUMN lesson_content.learning_activities IS 'Learning activities students should complete';
COMMENT ON COLUMN lesson_content.key_concepts IS 'Key concepts covered in this content';
COMMENT ON COLUMN lesson_content.reflection_questions IS 'Questions for student reflection';
COMMENT ON COLUMN lesson_content.discussion_prompts IS 'Discussion topics or prompts for students';
COMMENT ON COLUMN lesson_content.summary IS 'Summary of the content';
COMMENT ON COLUMN lesson_content.is_required IS 'Whether this content is required or optional';
COMMENT ON COLUMN lesson_content.estimated_minutes IS 'Estimated time to complete this content in minutes';
COMMENT ON COLUMN lesson_content.content_section IS 'Section/category of content (Introduction, Main Content, Assessment, Resources, etc.)';
COMMENT ON COLUMN lesson_content.is_published IS 'Whether this content is published and visible to students';
COMMENT ON COLUMN lesson_content.published_at IS 'When this content was published';

