# Supabase Storage Bucket Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create the Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project: `scholarspace` (or your LMS project)

2. **Open Storage**
   - Click "Storage" in the left sidebar
   - Click "New bucket" button

3. **Create Bucket**
   - **Name**: `lms-files`
   - **Public bucket**: ✅ Check this (for easy file access)
   - Click "Create bucket"

### Step 2: Set Bucket Policies

1. **Click on the `lms-files` bucket**

2. **Go to "Policies" tab**

3. **Add Policy for Uploads** (Allow authenticated users to upload)
   - Click "New Policy"
   - Template: "Custom"
   - Policy name: `Allow authenticated uploads`
   - SQL Policy:
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'lms-files');
   ```

4. **Add Policy for Reading** (Allow public read access)
   - Click "New Policy"  
   - Policy name: `Allow public read`
   - SQL Policy:
   ```sql
   CREATE POLICY "Allow public read"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'lms-files');
   ```

5. **Add Policy for Updates** (Allow users to update their own files)
   - Click "New Policy"
   - Policy name: `Allow authenticated updates`
   - SQL Policy:
   ```sql
   CREATE POLICY "Allow authenticated updates"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'lms-files');
   ```

6. **Add Policy for Deletion** (Allow users to delete their own files)
   - Click "New Policy"
   - Policy name: `Allow authenticated deletes`
   - SQL Policy:
   ```sql
   CREATE POLICY "Allow authenticated deletes"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'lms-files');
   ```

### Step 3: Test the Setup

Run this test in your browser console (while logged in):

```javascript
// Test upload
const testFile = new File(["test"], "test.txt", { type: "text/plain" });
const { data, error } = await window.supabase.storage
  .from('lms-files')
  .upload('test/test.txt', testFile);

console.log('Upload result:', data, error);

// Test read
const { data: urlData } = window.supabase.storage
  .from('lms-files')
  .getPublicUrl('test/test.txt');

console.log('File URL:', urlData.publicUrl);
```

### Alternative: Script-Based Setup

If you prefer, run this SQL in the Supabase SQL Editor:

```sql
-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lms-files', 'lms-files', true)
ON CONFLICT (id) DO NOTHING;

-- Add policies
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lms-files');

CREATE POLICY IF NOT EXISTS "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lms-files');

CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lms-files');

CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lms-files');
```

## Folder Structure

Recommended folder organization in your bucket:

```
lms-files/
├── assignments/
│   ├── {assignment_id}/
│   │   ├── submissions/
│   │   └── materials/
├── lessons/
│   └── {lesson_id}/
├── profiles/
│   └── avatars/
├── courses/
│   └── {course_id}/
└── temp/
```

## Security Considerations

### For Production:

1. **Row Level Security (RLS)**: Add user-specific policies
   ```sql
   -- Example: Users can only delete their own files
   CREATE POLICY "Users delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'lms-files' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

2. **File Size Limits**: Configure in Supabase dashboard
   - Go to Settings > Storage
   - Set `File size limit` (default is 50MB)

3. **MIME Type Restrictions**: Add in your application code
   ```javascript
   const ALLOWED_TYPES = [
     'application/pdf',
     'image/jpeg',
     'image/png',
     'video/mp4'
   ];
   ```

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Solution**: Check that policies are created correctly
- Verify user is authenticated: `supabase.auth.getUser()`

### Error: "Bucket not found"
- **Solution**: Verify bucket name is exactly `lms-files`
- Check bucket exists in Storage dashboard

### Files not accessible
- **Solution**: Ensure bucket is public OR policies allow read access
- Check file path is correct

### Upload fails silently
- **Solution**: Check browser console for errors
- Verify CORS settings in Supabase (usually auto-configured)
- Ensure file size is within limits

## Next Steps

Once the bucket is set up:

1. Test file upload with `FileUploadZone` component
2. Test file preview with `FilePreviewModal`
3. Check uploaded files in Supabase Storage dashboard
4. Monitor storage usage in Settings > Usage

## Storage Limits

**Free Tier**: 1GB storage
**Pro Plan**: 100GB included

Monitor usage at: `Storage > Usage` in Supabase dashboard
