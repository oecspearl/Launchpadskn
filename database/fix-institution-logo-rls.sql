-- ============================================
-- FIX: RLS Policies for Institution Logo Uploads
-- ============================================
-- Run this in Supabase SQL Editor
-- Adds policies for the 'lms-files' bucket to allow
-- school admins and super admins to upload institution logos
-- Path pattern: institutions/logos/{institution_id}.{ext}

-- Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Admins can upload institution logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view institution logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update institution logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete institution logos" ON storage.objects;

-- Policy: Admins and School Admins can upload institution logos
CREATE POLICY "Admins can upload institution logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lms-files' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'institutions' AND
  (storage.foldername(name))[2] = 'logos' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SCHOOL_ADMIN')
  )
);

-- Policy: All authenticated users can view institution logos
CREATE POLICY "Authenticated users can view institution logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lms-files' AND
  (storage.foldername(name))[1] = 'institutions' AND
  (storage.foldername(name))[2] = 'logos' AND
  auth.role() = 'authenticated'
);

-- Policy: Admins and School Admins can update institution logos
CREATE POLICY "Admins can update institution logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lms-files' AND
  (storage.foldername(name))[1] = 'institutions' AND
  (storage.foldername(name))[2] = 'logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SCHOOL_ADMIN')
  )
);

-- Policy: Admins and School Admins can delete institution logos
CREATE POLICY "Admins can delete institution logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lms-files' AND
  (storage.foldername(name))[1] = 'institutions' AND
  (storage.foldername(name))[2] = 'logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SCHOOL_ADMIN')
  )
);
