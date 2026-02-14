# Run Assignment PDF Migration

## Quick Fix for "Could not find the 'assignment_details_file_name' column" Error

This migration adds the necessary columns to the `lesson_content` table to support assignment PDF uploads.

## Steps to Run Migration

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration**
   - Copy the entire contents of `database/add-assignment-pdf-fields.sql`
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

### Option 2: Copy-Paste SQL

Run this SQL directly in Supabase SQL Editor:

```sql
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
```

## Verify Migration Success

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lesson_content' 
AND column_name LIKE 'assignment%'
ORDER BY column_name;
```

You should see 8 columns:
- `assignment_details_file_path`
- `assignment_details_file_name`
- `assignment_details_file_size`
- `assignment_details_mime_type`
- `assignment_rubric_file_path`
- `assignment_rubric_file_name`
- `assignment_rubric_file_size`
- `assignment_rubric_mime_type`

## After Migration

Once the migration is complete:
1. Refresh your browser
2. Try creating/editing an assignment again
3. The error should be resolved

## Notes

- The migration uses `IF NOT EXISTS`, so it's safe to run multiple times
- This migration only adds columns - it doesn't modify existing data
- All new columns are nullable, so existing assignments won't be affected

