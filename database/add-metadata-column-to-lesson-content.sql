-- LaunchPad SKN - Add metadata column to lesson_content table
-- This column stores JSON metadata for content types like 3D_MODEL

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lesson_content' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE lesson_content 
        ADD COLUMN metadata JSONB;
        
        -- Add comment
        COMMENT ON COLUMN lesson_content.metadata IS 'JSON metadata for content types (e.g., 3D_MODEL stores arvr_content_id)';
    END IF;
END $$;

-- Create index on metadata for better query performance (optional, but useful if querying by metadata)
CREATE INDEX IF NOT EXISTS idx_lesson_content_metadata ON lesson_content USING GIN (metadata);

