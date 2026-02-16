-- ============================================
-- Add student creation permission to institutions
-- ============================================
-- Run this in Supabase SQL Editor

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS can_add_students BOOLEAN DEFAULT false;

COMMENT ON COLUMN institutions.can_add_students IS 'When true, School Admins can add students manually or via CSV';
