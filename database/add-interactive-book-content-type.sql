-- ============================================
-- ADD INTERACTIVE BOOK CONTENT TYPE
-- ============================================
-- This migration documents the INTERACTIVE_BOOK content type
-- The content_type column is VARCHAR, so no enum modification needed
-- Interactive book data is stored in the existing content_data JSONB column

-- Note: The content_data JSONB column already exists from the flashcard migration
-- Interactive book content will use content_type = 'INTERACTIVE_BOOK' 
-- and store page data (content, video, quiz, image pages) in content_data

-- Add comment for documentation
COMMENT ON COLUMN lesson_content.content_data IS 'JSONB field storing type-specific interactive content data (e.g., flashcard front/back, interactive video checkpoints/questions, interactive book pages, quiz questions, etc.)';

-- No schema changes needed - content_type is VARCHAR(50) and can accept 'INTERACTIVE_BOOK'
-- The content_data JSONB column already exists and can store the book structure:
-- {
--   "pages": [
--     {
--       "id": "uuid",
--       "title": "Page Title",
--       "pageType": "content|video|quiz|image",
--       "content": "HTML content",
--       "videoData": {...},
--       "quizData": {...},
--       "imageData": {...},
--       "audioUrl": "base64 audio",
--       "embeddedContentId": 123,
--       "embeddedContent": {...}
--     }
--   ],
--   "subject": "Mathematics",
--   "gradeLevel": "Form 1",
--   "settings": {
--     "showNavigation": true,
--     "showProgress": true,
--     "requireCompletion": false
--   }
-- }

