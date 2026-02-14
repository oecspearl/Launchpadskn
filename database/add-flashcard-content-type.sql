-- ============================================
-- ADD FLASHCARD CONTENT TYPE AND JSONB SUPPORT
-- ============================================
-- This migration adds support for interactive content types (starting with flashcards)
-- by adding a JSONB column to store type-specific data

-- Add JSONB column for storing interactive content data
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS content_data JSONB;

-- Create index on content_data for better query performance
CREATE INDEX IF NOT EXISTS idx_content_data ON lesson_content USING GIN (content_data);

-- Add comment for documentation
COMMENT ON COLUMN lesson_content.content_data IS 'JSONB field storing type-specific interactive content data (e.g., flashcard front/back, quiz questions, etc.)';

-- Note: The content_type column already exists and can accept new types
-- Flashcard content will use content_type = 'FLASHCARD' and store data in content_data

