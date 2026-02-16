-- Add logo_url and address columns to institutions table
-- Run this in the Supabase SQL Editor

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;
