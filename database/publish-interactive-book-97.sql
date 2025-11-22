-- ============================================
-- PUBLISH INTERACTIVE BOOK (content_id: 97)
-- ============================================
-- This script publishes the interactive book so it appears in student views

-- Check current status
SELECT 
    content_id,
    lesson_id,
    title,
    content_type,
    is_published,
    published_at
FROM lesson_content
WHERE content_id = 97;

-- Publish the interactive book
UPDATE lesson_content
SET 
    is_published = true,
    published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
WHERE content_id = 97;

-- Verify it's now published
SELECT 
    content_id,
    title,
    is_published,
    published_at
FROM lesson_content
WHERE content_id = 97;

