-- ============================================
-- Add principal column to institutions table
-- ============================================
-- Run this in Supabase SQL Editor

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS principal VARCHAR(255);

COMMENT ON COLUMN institutions.principal IS 'Name of the school principal or head of institution';
