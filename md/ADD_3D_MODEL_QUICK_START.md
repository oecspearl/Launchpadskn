# Quick Start: Adding Your First 3D Model

## 🚀 Fastest Method (5 minutes)

### Option 1: Using Admin UI (Easiest)

1. **Login as Admin**
   - Go to your admin dashboard

2. **Navigate to AR/VR Content**
   - Click "AR/VR Content" card on dashboard
   - Or go to: `/admin/arvr-content`

3. **Click "Add 3D Model"**

4. **Fill in the form**:
   ```
   Content Name: My First 3D Model
   Description: A test model
   Content Type: 3D Model
   Model URL: https://raw.githubusercontent.com/.../model.gltf
   Model Format: GLTF
   Subject: (Select one or leave blank)
   ```

5. **Click "Create"**

6. **Test it**:
   - Go to Interactive Content Hub
   - Click AR/VR tab
   - Your model should appear!

### Option 2: Using SQL (For Developers)

```sql
-- 1. Upload your GLTF file to a CDN (or use existing URL)
-- 2. Run this in Supabase SQL Editor:

INSERT INTO arvr_content (
    content_name,
    content_type,
    content_url,
    model_format,
    subject_id,
    created_by
) VALUES (
    'My First 3D Model',
    '3D_MODEL',
    'https://your-cdn.com/models/model.gltf',  -- Your model URL
    'GLTF',
    5,  -- subject_id (adjust as needed)
    1   -- your user_id
);
```

## 📦 Where to Get 3D Models

### Free 3D Model Sources:
1. **Sketchfab** - https://sketchfab.com (many free models)
2. **Poly Haven** - https://polyhaven.com/models
3. **TurboSquid** - https://www.turbosquid.com (free section)
4. **CGTrader** - https://www.cgtrader.com (free section)
5. **Google Poly** (archived, but models still available)

### Example Free Models:
- Search for "GLTF" format
- Download GLB or GLTF files
- Upload to your CDN or use direct link

## 🔧 Setup Storage (One-Time)

If you want to upload files directly:

1. **Run SQL Script**:
   - Go to Supabase SQL Editor
   - Run: `database/setup-3d-models-storage.sql`
   - This creates the storage bucket

2. **Upload via UI**:
   - Click "Upload" button in AR/VR Content Manager
   - Select your GLTF file
   - File uploads automatically

## ✅ Verification Checklist

- [ ] Model URL is accessible (test in browser)
- [ ] CORS enabled on CDN (if external)
- [ ] Model format is GLTF/GLB/OBJ
- [ ] File size < 50MB
- [ ] Database entry created
- [ ] Model appears in AR/VR tab
- [ ] Model loads when clicked

## 🎯 Next Steps

1. Add more models
2. Add annotations (hotspots)
3. Link to specific subjects/classes
4. Test on mobile (AR mode)
5. Share with students!

## 💡 Tips

- **Start Simple**: Use a small, simple model first
- **Test URLs**: Make sure your model URL works in browser
- **Use GLB**: Single file, easier to manage
- **Optimize**: Keep file sizes small for faster loading
- **Add Descriptions**: Help students understand what they're viewing

## 🆘 Troubleshooting

**Model doesn't load?**
- Check browser console for errors
- Verify URL is correct and accessible
- Ensure CORS is enabled
- Try a different model format

**Upload fails?**
- Check file size (< 50MB)
- Verify storage bucket exists
- Try external CDN URL instead

**Model too small/large?**
- Adjust "Scale" in model properties
- Try values: 0.5, 1.0, 2.0, 5.0

Need help? Check `HOW_TO_ADD_3D_MODELS.md` for detailed instructions.

