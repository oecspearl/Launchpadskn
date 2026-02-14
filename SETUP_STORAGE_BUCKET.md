# How to Set Up 3D Models Storage Bucket

## Quick Setup Guide

You need to create a Supabase Storage bucket to upload 3D model files. Follow these steps:

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### Step 3: Run the Setup Script
1. Copy the entire contents of `database/setup-3d-models-storage.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button (or press Ctrl+Enter)

### Step 4: Verify Setup
1. Go to **"Storage"** in the left sidebar
2. You should see a bucket named **"3d-models"**
3. It should be marked as **"Public"**

## Alternative: Manual Setup via Supabase UI

If you prefer using the UI instead of SQL:

### Option 1: Create Bucket via Storage UI
1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"**
3. Set:
   - **Name:** `3d-models`
   - **Public bucket:** ✅ Checked (enabled)
4. Click **"Create bucket"**

### Option 2: Set Up Policies via UI
1. Go to **Storage** → **Policies**
2. Select the `3d-models` bucket
3. Add these policies:

**Policy 1: Public Read Access**
- Policy name: "Public Access"
- Allowed operation: SELECT
- Policy definition:
```sql
bucket_id = '3d-models'
```

**Policy 2: Authenticated Upload**
- Policy name: "Authenticated users can upload 3D models"
- Allowed operation: INSERT
- Policy definition:
```sql
bucket_id = '3d-models' AND auth.role() = 'authenticated'
```

**Policy 3: Update Own Files**
- Policy name: "Users can update their own 3D models"
- Allowed operation: UPDATE
- Policy definition:
```sql
bucket_id = '3d-models' AND auth.role() = 'authenticated'
```

**Policy 4: Delete Own Files**
- Policy name: "Users can delete their own 3D models"
- Allowed operation: DELETE
- Policy definition:
```sql
bucket_id = '3d-models' AND auth.role() = 'authenticated'
```

## Verify It's Working

After setup, try uploading a 3D model:
1. Go to **Admin Dashboard → AR/VR Content**
2. Click **"Add 3D Model"**
3. Click **"Upload"** button
4. Select a 3D model file (GLTF/GLB)
5. The upload should work without errors

## Troubleshooting

### Error: "Bucket not found"
- Make sure you ran the SQL script
- Check that the bucket name is exactly `3d-models` (lowercase, with hyphen)

### Error: "Permission denied"
- Check that the bucket is set to **Public**
- Verify the RLS policies are created correctly

### Error: "Storage policies not working"
- Make sure you ran the complete SQL script
- Check Storage → Policies to see if policies exist

## Alternative: Use External CDN

If you don't want to use Supabase Storage, you can:
1. Host your 3D models on an external CDN (e.g., Cloudflare, AWS S3, etc.)
2. Use the direct URL in the "Model URL" field
3. Make sure the CDN allows CORS requests

## SQL Script Location

The script is located at:
```
database/setup-3d-models-storage.sql
```

Copy and paste the entire contents into Supabase SQL Editor and run it.

