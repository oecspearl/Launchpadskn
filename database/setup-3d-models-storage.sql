-- LaunchPad SKN - Setup Supabase Storage for 3D Models
-- Run this in Supabase SQL Editor

-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public)
VALUES ('3d-models', '3d-models', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for 3D models bucket
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = '3d-models');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload 3D models"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '3d-models' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their own 3D models"
ON storage.objects FOR UPDATE
USING (
  bucket_id = '3d-models' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own 3D models"
ON storage.objects FOR DELETE
USING (
  bucket_id = '3d-models' 
  AND auth.role() = 'authenticated'
);

