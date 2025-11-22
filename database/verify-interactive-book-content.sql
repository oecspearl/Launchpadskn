-- ============================================
-- VERIFY AND FIX INTERACTIVE BOOK CONTENT
-- ============================================
-- This script helps verify that interactive book content exists and is published

-- 1. Check all interactive book content
SELECT 
    content_id,
    lesson_id,
    title,
    content_type,
    is_published,
    published_at,
    upload_date,
    updated_at
FROM lesson_content
WHERE content_type = 'INTERACTIVE_BOOK'
ORDER BY upload_date DESC;

-- 2. Check unpublished interactive books
SELECT 
    content_id,
    lesson_id,
    title,
    is_published,
    published_at
FROM lesson_content
WHERE content_type = 'INTERACTIVE_BOOK'
  AND (is_published IS NULL OR is_published = false);

-- 3. Publish all unpublished interactive books (if needed)
-- Uncomment the following lines if you want to publish all interactive books:
/*
UPDATE lesson_content
SET 
    is_published = true,
    published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
WHERE content_type = 'INTERACTIVE_BOOK'
  AND (is_published IS NULL OR is_published = false);
*/

-- 4. Verify content_data structure for interactive books
SELECT 
    content_id,
    title,
    content_data->'pages' as pages,
    jsonb_array_length(content_data->'pages') as page_count,
    content_data->'settings' as settings
FROM lesson_content
WHERE content_type = 'INTERACTIVE_BOOK'
  AND content_data IS NOT NULL;

-- 5. Check publication status for content_id 97 (or any specific book)
SELECT 
    content_id,
    lesson_id,
    title,
    content_type,
    is_published,
    published_at,
    upload_date,
    updated_at
FROM lesson_content
WHERE content_id = 97;

-- 6. Check if the lesson containing this content is accessible
SELECT 
    l.lesson_id,
    l.lesson_title,
    l.lesson_date,
    l.status,
    cs.class_subject_id,
    c.class_id,
    c.class_name
FROM lessons l
JOIN class_subjects cs ON l.class_subject_id = cs.class_subject_id
JOIN classes c ON cs.class_id = c.class_id
WHERE l.lesson_id = (
    SELECT lesson_id 
    FROM lesson_content 
    WHERE content_id = 97
);

