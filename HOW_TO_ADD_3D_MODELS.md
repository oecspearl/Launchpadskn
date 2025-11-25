# How to Add 3D Models to the Platform

## Quick Start Guide

### Method 1: Using SQL (Direct Database Insert)

#### Step 1: Prepare Your 3D Model
1. **Format**: Convert your model to GLTF or GLB format (recommended)
   - Use Blender, Maya, or online converters
   - GLB is preferred (single file, smaller size)
   
2. **Optimize**:
   - Reduce polygon count if possible
   - Compress textures (use WebP or compressed JPG)
   - Keep file size under 10MB for best performance

3. **Test**: Make sure the model loads correctly in a 3D viewer

#### Step 2: Upload to CDN/Storage
Choose one of these options:

**Option A: AWS S3**
```bash
# Upload using AWS CLI
aws s3 cp heart.gltf s3://your-bucket/models/heart.gltf --acl public-read

# Enable CORS on bucket
# Add CORS configuration:
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }]
}
```

**Option B: Cloudflare R2**
```bash
# Upload via Cloudflare dashboard or API
# Enable public access
# URL will be: https://your-account.r2.cloudflarestorage.com/models/heart.gltf
```

**Option C: Google Cloud Storage**
```bash
# Upload via gsutil
gsutil cp heart.gltf gs://your-bucket/models/heart.gltf
gsutil acl ch -u AllUsers:R gs://your-bucket/models/heart.gltf
```

**Option D: GitHub (for testing)**
- Upload to GitHub repository
- Use raw file URL: `https://raw.githubusercontent.com/user/repo/main/models/heart.gltf`

#### Step 3: Insert into Database
Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO arvr_content (
    content_name,
    description,
    content_type,
    content_url,
    model_format,
    subject_id,
    class_subject_id,
    model_properties,
    annotations,
    difficulty_level,
    estimated_duration_minutes,
    created_by
) VALUES (
    'Human Heart 3D Model',                    -- Name
    'Interactive 3D model of the human heart for biology class. Students can explore all chambers and valves.',  -- Description
    '3D_MODEL',                               -- Type: 3D_MODEL, VR_EXPERIENCE, AR_OVERLAY, FIELD_TRIP
    'https://cdn.example.com/models/heart.gltf',  -- Your CDN URL
    'GLTF',                                   -- Format: GLTF, OBJ, USDZ
    5,                                        -- subject_id (Biology = 5, adjust as needed)
    NULL,                                     -- class_subject_id (NULL = available to all classes)
    '{
        "scale": 1.5,
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "autoRotate": true,
        "cameraControls": true,
        "exposure": 1.0,
        "shadowIntensity": 1.0
    }'::jsonb,                                -- Model properties
    '[
        {
            "position": [1, 1, 1],
            "text": "Right Atrium",
            "color": "#ff6b6b"
        },
        {
            "position": [-1, 1, 1],
            "text": "Left Atrium",
            "color": "#4ecdc4"
        },
        {
            "position": [0, -1, 0],
            "text": "Right Ventricle",
            "color": "#ffe66d"
        },
        {
            "position": [0, -1.5, 0],
            "text": "Left Ventricle",
            "color": "#95e1d3"
        }
    ]'::jsonb,                                -- Annotations (hotspots)
    'MEDIUM',                                 -- Difficulty: EASY, MEDIUM, HARD, EXPERT
    15,                                       -- Estimated duration in minutes
    1                                         -- created_by (your user_id)
);
```

#### Step 4: Link to Specific Class (Optional)
If you want to link to a specific class-subject:

```sql
UPDATE arvr_content
SET class_subject_id = 12  -- Your class_subject_id
WHERE content_id = 1;      -- The ID returned from INSERT
```

### Method 2: Using Admin UI (Recommended) ✅

**Step 1: Navigate to AR/VR Content Manager**
1. Go to Admin Dashboard
2. Click "AR/VR Content" card in Quick Access
3. Or navigate directly to `/admin/arvr-content`

**Step 2: Add New 3D Model**
1. Click "Add 3D Model" button
2. Fill in the form:
   - **Content Name**: e.g., "Human Heart 3D Model"
   - **Description**: Brief description
   - **Content Type**: Select "3D Model"
   - **Model URL**: Either:
     - Click "Upload" to upload to Supabase Storage
     - Or paste external CDN URL
   - **Model Format**: Select format (GLTF, GLB, OBJ, USDZ)
   - **Subject**: Select subject (optional)
   - **Difficulty Level**: Select difficulty
   - **Scale**: Adjust model size (1.0 = normal)
   - **Auto Rotate**: Enable/disable auto-rotation
3. Click "Create"

**Step 3: Upload File (Optional)**
- Click "Upload" button next to Model URL field
- Select your GLTF/GLB/OBJ file
- File uploads to Supabase Storage
- URL is automatically filled in

**Step 4: Edit/Delete**
- Click edit icon to modify existing content
- Click delete icon to remove content

---

## Detailed Steps

### Step 1: Get Your Model Ready

#### Converting Models to GLTF
1. **Using Blender** (Free):
   ```
   1. Open your model in Blender
   2. File → Export → glTF 2.0
   3. Choose format: glTF Binary (.glb) or glTF Separate (.gltf + .bin)
   4. Export
   ```

2. **Using Online Converters**:
   - https://products.aspose.app/3d/conversion
   - https://www.meshconvert.com/
   - Upload OBJ/FBX → Download GLTF

3. **Model Requirements**:
   - ✅ GLTF/GLB format
   - ✅ File size < 10MB (recommended)
   - ✅ Textures included or referenced
   - ✅ Single model or scene (not multiple separate files)

### Step 2: Upload to Storage

#### Using AWS S3 (Example)
```bash
# Install AWS CLI if not installed
# Configure: aws configure

# Upload model
aws s3 cp heart.gltf s3://your-bucket/models/heart.gltf --acl public-read

# Upload textures if separate
aws s3 cp textures/ s3://your-bucket/models/textures/ --recursive --acl public-read

# Get public URL
# URL: https://your-bucket.s3.amazonaws.com/models/heart.gltf
```

#### Using Supabase Storage (Recommended)
```sql
-- 1. Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('3d-models', '3d-models', true);

-- 2. Upload via Supabase Dashboard:
--    - Go to Storage
--    - Create/Select '3d-models' bucket
--    - Upload your GLTF file
--    - Get public URL from file details
```

### Step 3: Get Subject IDs

Find the subject_id you want to link:

```sql
-- List all subjects
SELECT subject_id, subject_name 
FROM subjects 
ORDER BY subject_name;

-- Example results:
-- subject_id | subject_name
-- 1          | Mathematics
-- 2          | English
-- 3          | Science
-- 5          | Biology
```

### Step 4: Insert Model into Database

#### Basic Insert (Minimal)
```sql
INSERT INTO arvr_content (
    content_name,
    content_type,
    content_url,
    model_format,
    subject_id,
    created_by
) VALUES (
    'My 3D Model',
    '3D_MODEL',
    'https://your-cdn.com/models/model.gltf',
    'GLTF',
    5,  -- Biology subject_id
    1   -- Your user_id
);
```

#### Advanced Insert (With Properties)
```sql
INSERT INTO arvr_content (
    content_name,
    description,
    content_type,
    content_url,
    model_format,
    subject_id,
    class_subject_id,
    model_properties,
    annotations,
    difficulty_level,
    estimated_duration_minutes,
    learning_objectives,
    created_by
) VALUES (
    'DNA Double Helix Structure',
    'Interactive 3D model showing the double helix structure of DNA with labeled base pairs.',
    '3D_MODEL',
    'https://cdn.example.com/models/dna.gltf',
    'GLTF',
    5,  -- Biology
    NULL,  -- Available to all classes
    '{
        "scale": 2.0,
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "autoRotate": true,
        "cameraControls": true,
        "exposure": 1.2,
        "shadowIntensity": 0.8
    }'::jsonb,
    '[
        {
            "position": [0, 1, 0],
            "text": "Adenine",
            "color": "#ff6b6b",
            "normal": "0 1 0"
        },
        {
            "position": [0, -1, 0],
            "text": "Thymine",
            "color": "#4ecdc4",
            "normal": "0 -1 0"
        }
    ]'::jsonb,
    'MEDIUM',
    20,
    'Understand DNA structure, identify base pairs, explore double helix',
    1
);
```

### Step 5: Verify Model

1. **Check Database**:
```sql
SELECT * FROM arvr_content WHERE content_name = 'Your Model Name';
```

2. **Test in Platform**:
   - Navigate to Interactive Content Hub
   - Go to AR/VR tab
   - Your model should appear in the list
   - Click to test loading

### Step 6: Add Annotations (Optional)

Annotations are interactive hotspots on the 3D model:

```sql
UPDATE arvr_content
SET annotations = '[
    {
        "position": [1, 1, 1],
        "text": "Part 1",
        "color": "#ff6b6b"
    },
    {
        "position": [-1, -1, -1],
        "text": "Part 2",
        "color": "#4ecdc4"
    }
]'::jsonb
WHERE content_id = 1;
```

**Position Format**: `[x, y, z]` coordinates in 3D space
**Color**: Hex color code for the annotation marker

---

## Model Properties Explained

```json
{
  "scale": 1.5,              // Scale multiplier (1.0 = original size)
  "position": [0, 0, 0],     // Model position [x, y, z]
  "rotation": [0, 0, 0],     // Initial rotation [x, y, z] in radians
  "autoRotate": true,        // Auto-rotate model continuously
  "cameraControls": true,   // Enable user camera controls
  "exposure": 1.0,           // Lighting exposure (0.5 - 2.0)
  "shadowIntensity": 1.0     // Shadow intensity (0.0 - 1.0)
}
```

---

## Common Issues & Solutions

### Issue: Model doesn't load
**Solution**: 
- Check CORS headers on CDN
- Verify URL is accessible
- Check browser console for errors
- Ensure GLTF file is valid

### Issue: Textures missing
**Solution**:
- Ensure texture paths in GLTF are relative
- Upload textures to same CDN location
- Check texture file formats (JPG, PNG supported)

### Issue: Model too large/slow
**Solution**:
- Reduce polygon count
- Compress textures
- Use GLB format (binary, smaller)
- Optimize model in Blender

### Issue: Model appears too small/large
**Solution**:
- Adjust `scale` in `model_properties`
- Try values: 0.5 (smaller), 1.0 (normal), 2.0 (larger)

---

## Quick Reference

### Content Types
- `3D_MODEL` - Standard 3D model viewer
- `VR_EXPERIENCE` - VR scene (requires VR headset)
- `AR_OVERLAY` - AR overlay (mobile)
- `FIELD_TRIP` - Virtual field trip (360° images)

### Model Formats
- `GLTF` - Recommended (text-based, includes textures)
- `GLB` - Recommended (binary, single file)
- `OBJ` - Supported (may need textures separately)
- `USDZ` - iOS AR only

### Difficulty Levels
- `EASY` - Beginner level
- `MEDIUM` - Intermediate
- `HARD` - Advanced
- `EXPERT` - Expert level

---

## Example: Complete Workflow

```sql
-- 1. Upload model to: https://cdn.example.com/models/solar-system.gltf

-- 2. Insert into database
INSERT INTO arvr_content (
    content_name,
    description,
    content_type,
    content_url,
    model_format,
    subject_id,
    model_properties,
    annotations,
    difficulty_level,
    estimated_duration_minutes,
    created_by
) VALUES (
    'Solar System Model',
    'Interactive 3D model of our solar system with all planets orbiting the sun.',
    '3D_MODEL',
    'https://cdn.example.com/models/solar-system.gltf',
    'GLTF',
    3,  -- Science
    '{
        "scale": 0.5,
        "autoRotate": true,
        "cameraControls": true
    }'::jsonb,
    '[
        {"position": [0, 0, 0], "text": "Sun", "color": "#ffd700"},
        {"position": [2, 0, 0], "text": "Earth", "color": "#4a90e2"},
        {"position": [3, 0, 0], "text": "Mars", "color": "#cd5c5c"}
    ]'::jsonb,
    'MEDIUM',
    25,
    1
);

-- 3. Verify
SELECT content_id, content_name, content_url 
FROM arvr_content 
WHERE content_name = 'Solar System Model';

-- 4. Test in platform!
```

---

## Next Steps

After adding your model:
1. ✅ Test it in the platform
2. ✅ Verify annotations work
3. ✅ Test on mobile (AR mode)
4. ✅ Share with students
5. ✅ Monitor usage analytics

Need help? Check the browser console for errors or review the model file format.

