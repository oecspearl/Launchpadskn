# How to Host 3D Models for the Platform

## Problem: CORS Restrictions

3D models must be hosted on servers that allow Cross-Origin Resource Sharing (CORS). Many external hosting services (like Sketchfab sharing links) don't allow direct model loading due to CORS policies.

## ✅ Recommended Solutions

### Option 1: Supabase Storage (Recommended)

**Best for:** Direct file hosting with CORS enabled

1. **Upload to Supabase Storage:**
   - Go to Supabase Dashboard → Storage
   - Create/use the `3d-models` bucket
   - Upload your GLTF/GLB file
   - Make the file public or generate a signed URL

2. **Get the Public URL:**
   - For public files: `https://[project-id].supabase.co/storage/v1/object/public/3d-models/[filename]`
   - For private files: Use signed URLs (valid for a limited time)

3. **Add to AR/VR Content:**
   - Use the Supabase Storage URL as the `content_url`
   - Supabase Storage has CORS enabled by default

**Advantages:**
- ✅ CORS enabled
- ✅ Fast CDN delivery
- ✅ Secure access control
- ✅ Integrated with your platform

### Option 2: Direct GLTF/GLB URLs

**Best for:** Models already hosted on CORS-enabled servers

Use direct URLs to GLTF/GLB files from:
- GitHub (raw file URLs)
- Your own server with CORS headers
- Other CDN services with CORS enabled

**Example:**
```
https://raw.githubusercontent.com/user/repo/main/model.gltf
```

### Option 3: Convert Sketchfab Models

**Best for:** Models from Sketchfab

1. **Download the Model:**
   - Go to the Sketchfab model page
   - Click "Download" (if available)
   - Choose GLTF format

2. **Upload to Supabase Storage:**
   - Upload the GLTF file and any associated textures
   - Get the public URL
   - Use that URL in your AR/VR content

**Note:** Some Sketchfab models are not available for download. In that case, you'll need to find an alternative source or create your own model.

## ❌ What Doesn't Work

### Sketchfab Sharing Links
- `https://skfb.ly/...` - These are sharing links, not direct model files
- CORS blocked - Cannot load directly
- **Solution:** Download and re-host, or use Sketchfab embed (different approach)

### External CDNs Without CORS
- Many free hosting services don't enable CORS
- Check CORS headers before using

## Step-by-Step: Upload to Supabase Storage

### 1. Via Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Storage** → **3d-models** bucket
3. Click **Upload file**
4. Select your GLTF or GLB file
5. Make it **Public** (or use signed URLs)
6. Copy the **Public URL**

### 2. Via Code (Admin Interface)

The AR/VR Content Manager already supports file uploads:
1. Go to `/admin/arvr-content`
2. Click "Add 3D Model"
3. Upload your GLTF/GLB file
4. The system automatically uploads to Supabase Storage
5. The URL is automatically set

## File Format Requirements

### Supported Formats
- **GLTF** (`.gltf`) - Recommended, most widely supported
- **GLB** (`.glb`) - Binary version, smaller file size
- **OBJ** (`.obj`) - Legacy format, may have limitations

### File Size Recommendations
- **Optimal:** Under 10MB
- **Maximum:** 50MB (may be slow to load)
- **For mobile:** Under 5MB recommended

### Optimization Tips
1. **Compress textures:** Use compressed texture formats
2. **Reduce polygons:** Simplify geometry if possible
3. **Use GLB:** Binary format is more efficient than GLTF
4. **Remove unused data:** Clean up materials and animations

## Testing Your Model URL

Before adding to the platform, test your URL:

```javascript
// Test in browser console
fetch('YOUR_MODEL_URL')
  .then(response => {
    if (response.ok) {
      console.log('✅ URL is accessible');
    } else {
      console.log('❌ URL returned error:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ CORS or network error:', error);
  });
```

If you get a CORS error, the URL won't work with the model viewer.

## Troubleshooting

### "Failed to fetch" Error
- **Cause:** CORS restriction or invalid URL
- **Solution:** Use Supabase Storage or another CORS-enabled host

### Model Doesn't Load
- **Check:** File format is GLTF or GLB
- **Check:** URL is direct to the file (not a sharing link)
- **Check:** File is accessible (try opening URL directly in browser)

### Model Loads But Doesn't Display
- **Check:** Associated texture files are also uploaded
- **Check:** File paths in GLTF are relative or absolute URLs
- **Check:** Browser console for specific errors

## Best Practices

1. **Always use Supabase Storage** for production models
2. **Test models** before adding to lessons
3. **Optimize file sizes** for better performance
4. **Use GLB format** when possible (smaller, faster)
5. **Keep models under 10MB** for best user experience

## Quick Reference

| Hosting Option | CORS Enabled | Recommended | Notes |
|---------------|--------------|-------------|-------|
| Supabase Storage | ✅ Yes | ⭐⭐⭐⭐⭐ | Best option, integrated |
| GitHub Raw | ✅ Yes | ⭐⭐⭐⭐ | Good for public models |
| Your Own Server | ✅ If configured | ⭐⭐⭐ | Requires CORS setup |
| Sketchfab Links | ❌ No | ⭐ | Won't work, use download |
| External CDN | ⚠️ Maybe | ⭐⭐ | Check CORS first |

