# How to Use Embed Links for 3D Models

## ✅ Supported Embed Types

### 1. Sketchfab Embed URLs

**Format:** `https://sketchfab.com/models/[model-id]/embed`

**How to get it:**
1. Go to your Sketchfab model page
2. Click the **"Embed"** button (usually in the share menu)
3. Copy the **iframe src URL** (the part inside `src="..."`)
4. Use that URL in the AR/VR Content Manager

**Example:**
```
https://sketchfab.com/models/abc123def456/embed
```

**What the system does:**
- Automatically detects Sketchfab embed URLs
- Renders them in an iframe
- Full interactive controls (rotate, zoom, AR)

### 2. Sketchfab Model Page URLs (Auto-converted)

**Format:** `https://sketchfab.com/models/[model-id]`

**How it works:**
- The system automatically converts model page URLs to embed URLs
- Just paste the model page URL
- No need to manually get the embed code

**Example:**
```
https://sketchfab.com/models/abc123def456
```
↓ Automatically converts to ↓
```
https://sketchfab.com/models/abc123def456/embed
```

### 3. Generic Embed URLs

**Any URL containing `/embed` will be rendered as an iframe**

**Supported platforms:**
- Sketchfab
- Other platforms that provide embed URLs

**Example:**
```
https://example.com/models/123/embed
```

## 📝 Step-by-Step Guide

### For Sketchfab Models:

#### Option 1: Use Model Page URL (Easiest)
1. Go to your Sketchfab model page
2. Copy the full URL from the address bar
   - Example: `https://sketchfab.com/models/abc123def456`
3. In AR/VR Content Manager, paste this URL as the `content_url`
4. The system will automatically convert it to an embed URL

#### Option 2: Use Embed URL (Recommended)
1. Go to your Sketchfab model page
2. Click **"Share"** or **"Embed"** button
3. Copy the **iframe src URL** from the embed code
   - Look for: `src="https://sketchfab.com/models/.../embed"`
4. Paste only the URL part (not the full iframe code)
5. Use this URL in the AR/VR Content Manager

#### Option 3: Full iframe Code (Advanced)
If you have the full iframe embed code:
```html
<iframe src="https://sketchfab.com/models/abc123/embed" ...></iframe>
```
- The system will automatically extract the `src` URL
- Just paste the full iframe code or the src URL

## 🎯 What Works vs. What Doesn't

### ✅ Works:
- ✅ Sketchfab embed URLs: `https://sketchfab.com/models/[id]/embed`
- ✅ Sketchfab model page URLs: `https://sketchfab.com/models/[id]` (auto-converted)
- ✅ Any URL with `/embed` in the path
- ✅ Direct GLTF/GLB file URLs (from Supabase Storage)

### ❌ Doesn't Work:
- ❌ Sketchfab sharing links: `https://skfb.ly/...` (short links)
- ❌ Direct file URLs without CORS: External servers blocking cross-origin requests

## 🔧 Adding an Embed Link

### Via Admin Interface:

1. **Navigate to AR/VR Content:**
   - Go to `/admin/arvr-content`
   - Click "Add 3D Model"

2. **Fill in the form:**
   - **Name:** Give it a descriptive name
   - **Content Type:** Select `3D_MODEL` or `VR_EXPERIENCE`
   - **Content URL:** Paste your embed URL or model page URL
   - **Description:** Add a description (optional)

3. **Save:**
   - Click "Create"
   - The model will be available for teachers to add to lessons

### Via Database (Advanced):

```sql
INSERT INTO arvr_content (
  content_name,
  content_type,
  content_url,
  description
) VALUES (
  'My 3D Model',
  '3D_MODEL',
  'https://sketchfab.com/models/abc123def456/embed',
  'Description here'
);
```

## 💡 Tips

1. **Test the URL first:**
   - Open the embed URL in a new browser tab
   - Make sure it loads correctly
   - If it works in a browser, it will work in the platform

2. **Use embed URLs, not sharing links:**
   - Embed URLs: `https://sketchfab.com/models/[id]/embed` ✅
   - Sharing links: `https://skfb.ly/...` ❌

3. **For best performance:**
   - Use embed URLs when available
   - For direct file hosting, use Supabase Storage

4. **Mobile compatibility:**
   - Embed iframes work on mobile devices
   - AR features may require specific device support

## 🔍 Troubleshooting

### "Model doesn't load"
- **Check:** URL is an embed URL (contains `/embed`)
- **Check:** Model is set to "Public" or "Unlisted" on Sketchfab
- **Check:** Browser console for specific errors

### "CORS error"
- **Cause:** Using a sharing link instead of embed URL
- **Solution:** Use the embed URL or model page URL

### "iframe blocked"
- **Cause:** Browser security settings
- **Solution:** Check browser settings, try a different browser

## 📚 Examples

### Example 1: Sketchfab Model Page URL
```
Input: https://sketchfab.com/models/abc123def456
Output: Automatically converted to embed and displayed
```

### Example 2: Sketchfab Embed URL
```
Input: https://sketchfab.com/models/abc123def456/embed
Output: Displayed directly in iframe
```

### Example 3: Full iframe Code
```
Input: <iframe src="https://sketchfab.com/models/abc123/embed" width="640" height="480"></iframe>
Output: Extracts src URL and displays in iframe
```

## 🎨 Features Available with Embed Links

- ✅ **Interactive viewing:** Rotate, zoom, pan
- ✅ **AR support:** View in augmented reality (if model supports it)
- ✅ **Fullscreen:** Click to expand
- ✅ **Annotations:** If model has annotations, they'll be visible
- ✅ **Mobile friendly:** Works on phones and tablets

## 🚀 Next Steps

1. **Get your embed URL** from Sketchfab or your 3D platform
2. **Add it to AR/VR Content** via the admin interface
3. **Teachers can add it to lessons** via the lesson content manager
4. **Students can view it** embedded directly in the lesson

