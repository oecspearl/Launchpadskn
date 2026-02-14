-- ============================================
-- ADD ASSIGNMENT PDF FIELDS TO LESSON CONTENT
-- ============================================
-- This migration adds fields to store assignment details PDF and rubric PDF
-- for ASSIGNMENT content types

-- Add columns for assignment details PDF
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS assignment_details_file_path TEXT,
ADD COLUMN IF NOT EXISTS assignment_details_file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS assignment_details_file_size BIGINT,
ADD COLUMN IF NOT EXISTS assignment_details_mime_type VARCHAR(100);

-- Add columns for assignment rubric PDF
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS assignment_rubric_file_path TEXT,
ADD COLUMN IF NOT EXISTS assignment_rubric_file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS assignment_rubric_file_size BIGINT,
ADD COLUMN IF NOT EXISTS assignment_rubric_mime_type VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN lesson_content.assignment_details_file_path IS 'Path to assignment details PDF file in storage (for ASSIGNMENT content type)';
COMMENT ON COLUMN lesson_content.assignment_details_file_name IS 'Original filename of assignment details PDF';
COMMENT ON COLUMN lesson_content.assignment_details_file_size IS 'Size of assignment details PDF in bytes';
COMMENT ON COLUMN lesson_content.assignment_details_mime_type IS 'MIME type of assignment details PDF (typically application/pdf)';
COMMENT ON COLUMN lesson_content.assignment_rubric_file_path IS 'Path to assignment rubric PDF file in storage (for ASSIGNMENT content type)';
COMMENT ON COLUMN lesson_content.assignment_rubric_file_name IS 'Original filename of assignment rubric PDF';
COMMENT ON COLUMN lesson_content.assignment_rubric_file_size IS 'Size of assignment rubric PDF in bytes';
COMMENT ON COLUMN lesson_content.assignment_rubric_mime_type IS 'MIME type of assignment rubric PDF (typically application/pdf)';

