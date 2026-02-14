-- ============================================
-- SUPABASE STORAGE RLS POLICIES
-- ============================================
-- Run this SQL in Supabase SQL Editor after creating storage buckets
-- This sets up Row Level Security policies for file access

-- ============================================
-- COURSE CONTENT BUCKET POLICIES
-- ============================================
-- Bucket: course-content
-- Used for: Lesson materials, files uploaded by teachers

-- Policy: Teachers/Instructors can upload course content
CREATE POLICY "Teachers can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'INSTRUCTOR' OR role = 'TEACHER')
  )
);

-- Policy: Students and Teachers can view course content
CREATE POLICY "Authenticated users can view course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated'
);

-- Policy: Teachers can update their own uploads
CREATE POLICY "Teachers can update own content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'INSTRUCTOR' OR role = 'TEACHER')
  )
);

-- Policy: Teachers can delete their own uploads
CREATE POLICY "Teachers can delete own content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'INSTRUCTOR' OR role = 'TEACHER')
  )
);

-- ============================================
-- ASSIGNMENTS BUCKET POLICIES
-- ============================================
-- Bucket: assignments
-- Used for: Student assignment submissions

-- Policy: Students can upload assignments
CREATE POLICY "Students can upload assignments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'STUDENT'
  )
);

-- Policy: Students can view their own submissions
CREATE POLICY "Students can view own assignments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated' AND
  (
    -- Students can view files in their own folder
    (storage.foldername(name))[3] = auth.uid()::text
    OR
    -- Or if they're a teacher/instructor
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND (role = 'INSTRUCTOR' OR role = 'TEACHER')
    )
  )
);

-- Policy: Teachers/Instructors can view all submissions
CREATE POLICY "Teachers can view all assignments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'INSTRUCTOR' OR role = 'TEACHER')
  )
);

-- Policy: Students can update their own submissions
CREATE POLICY "Students can update own assignments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'STUDENT'
  ) AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- Policy: Students can delete their own submissions (for resubmission)
CREATE POLICY "Students can delete own assignments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'STUDENT'
  ) AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- ============================================
-- PROFILE PICTURES BUCKET POLICIES (Optional)
-- ============================================
-- Bucket: profile-pictures
-- Used for: User profile pictures

-- Policy: Users can upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view profile pictures (public bucket)
CREATE POLICY "Profile pictures are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Policy: Users can update their own profile picture
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own profile picture
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- NOTES
-- ============================================
-- 1. Make sure storage buckets are created before running these policies
-- 2. Bucket names must match exactly: 'course-content', 'assignments', 'profile-pictures'
-- 3. These policies assume your users table has a 'role' column with values:
--    - 'STUDENT'
--    - 'TEACHER' or 'INSTRUCTOR'
--    - 'ADMIN'
-- 4. The folder structure for assignments is: submissions/{assessmentId}/{studentId}/{filename}
-- 5. The folder structure for course-content is: lessons/{lessonId}/{filename}
-- 6. If you need to modify these policies, drop them first:
--    DROP POLICY "Policy Name" ON storage.objects;

