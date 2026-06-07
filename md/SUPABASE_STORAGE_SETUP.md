# Supabase Storage Setup Guide

## 🗂️ Create Storage Buckets

### Step 1: Create Buckets in Supabase Dashboard

Go to: **Storage** → **Create Bucket**

Create these buckets:

#### 1. `course-content`
- **Public**: No (private)
- **File size limit**: 50MB
- **Allowed MIME types**: `application/pdf, image/*, video/*, application/vnd.openxmlformats-officedocument.*`

#### 2. `assignments`
- **Public**: No (private)
- **File size limit**: 20MB
- **Allowed MIME types**: `application/pdf, application/vnd.openxmlformats-officedocument.*`

#### 3. `profile-pictures`
- **Public**: Yes (public read)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/*`

---

### Step 2: Setup Storage Policies (RLS)

In Supabase SQL Editor, run:

```sql
-- ============================================
-- COURSE CONTENT BUCKET POLICIES
-- ============================================

-- Policy: Instructors can upload course content
CREATE POLICY "Instructors can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'INSTRUCTOR'
  )
);

-- Policy: Students can view course content
CREATE POLICY "Students can view course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated'
);

-- Policy: Instructors can update their own uploads
CREATE POLICY "Instructors can update own content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'INSTRUCTOR'
  )
);

-- ============================================
-- ASSIGNMENTS BUCKET POLICIES
-- ============================================

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
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Instructors can view all submissions
CREATE POLICY "Instructors can view all assignments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'INSTRUCTOR'
  )
);

-- ============================================
-- PROFILE PICTURES BUCKET POLICIES
-- ============================================

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
```

---

### Step 3: Update File Upload Service

Add to `supabaseService.js`:

```javascript
// Upload course content
async uploadCourseContent(file, courseId, fileName) {
  const filePath = `${courseId}/${Date.now()}_${fileName}`;
  return await this.uploadFile('course-content', filePath, file);
}

// Upload assignment submission
async uploadAssignment(file, studentId, assignmentId) {
  const filePath = `${studentId}/${assignmentId}/${Date.now()}_${file.name}`;
  return await this.uploadFile('assignments', filePath, file);
}

// Upload profile picture
async uploadProfilePicture(file, userId) {
  const filePath = `${userId}/profile_${Date.now()}_${file.name}`;
  return await this.uploadFile('profile-pictures', filePath, file);
}
```

---

### Step 4: Test Storage

1. Upload a test file via frontend
2. Check in Supabase Dashboard → Storage
3. Verify file appears in correct bucket
4. Test download URL generation

---

## 📋 Storage Checklist

- [ ] Create `course-content` bucket
- [ ] Create `assignments` bucket
- [ ] Create `profile-pictures` bucket
- [ ] Setup RLS policies for each bucket
- [ ] Test upload functionality
- [ ] Test download/access
- [ ] Verify permissions work correctly

---

**Storage is ready when all buckets are created and policies are set!**


