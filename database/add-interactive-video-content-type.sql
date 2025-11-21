-- ============================================
-- ADD INTERACTIVE VIDEO CONTENT TYPE
-- ============================================
-- This migration documents the INTERACTIVE_VIDEO content type
-- The content_type column is VARCHAR, so no enum modification needed
-- Interactive video data is stored in the existing content_data JSONB column

-- Note: The content_data JSONB column already exists from the flashcard migration
-- Interactive video content will use content_type = 'INTERACTIVE_VIDEO' 
-- and store checkpoint/interaction data in content_data

-- Add comment for documentation
COMMENT ON COLUMN lesson_content.content_data IS 'JSONB field storing type-specific interactive content data (e.g., flashcard front/back, interactive video checkpoints/questions, quiz questions, etc.)';

