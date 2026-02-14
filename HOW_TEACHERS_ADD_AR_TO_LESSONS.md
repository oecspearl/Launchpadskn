# How Teachers Add AR Content to Lessons

## Overview
Teachers can add Augmented Reality (AR) content to their lessons, allowing students to superimpose 3D objects into their real-world view using Web AR technology.

## Step-by-Step Guide

### Step 1: Ensure AR Content Exists
Before adding AR content to a lesson, make sure AR content has been created by an admin:

1. **Admin creates AR content:**
   - Go to **Admin Dashboard → AR/VR Content**
   - Click **"Add 3D Model"**
   - Select **"AR Overlay"** as the content type
   - Upload or provide URL to 3D model (GLTF/GLB format)
   - (Optional) Add AR marker URL for marker-based AR
   - Fill in other details (name, description, subject, etc.)
   - Click **"Create"**

### Step 2: Add AR Content to Lesson
Once AR content is available, teachers can add it to lessons:

1. **Navigate to Lesson:**
   - Go to your lesson management page
   - Open the lesson where you want to add AR content
   - Click **"Add Content"** or **"Manage Content"**

2. **Select AR Content Type:**
   - In the content type dropdown, select **"AR Content (Augmented Reality)"**
   - This is under the **"Interactive Content"** section

3. **Select AR Content:**
   - A dropdown will appear showing available AR content
   - Select the AR Overlay you want to use
   - You'll see a preview card showing:
     - Content name
     - Content type (AR Overlay)
     - Description
     - Format (GLTF, GLB, etc.)
     - Estimated duration

4. **Fill in Lesson Details:**
   - **Title:** Auto-filled from AR content, but you can edit
   - **Description:** Auto-filled, but you can customize
   - **Section:** Choose where this appears (Learning, Assessment, etc.)
   - **Required:** Mark if students must complete this
   - **Estimated Minutes:** How long students should spend

5. **Save:**
   - Click **"Save"** or **"Add Content"**
   - The AR content is now part of your lesson!

## What Students Will Experience

When students access the lesson with AR content:

1. **View AR Content:**
   - Students see the AR content item in the lesson
   - Click to open the AR viewer

2. **Start AR Experience:**
   - Click **"Start AR Experience"** button
   - Grant camera permission when prompted

3. **Superimpose Objects:**
   - Point camera at a real surface (floor, table, etc.)
   - A reticle appears when a surface is detected
   - Tap to place the 3D object on the surface
   - The object is now superimposed in their real-world view!

4. **Interact:**
   - Move around to view from different angles
   - The object stays anchored in real space
   - Can view it from all sides

## Content Types Available

### AR Overlay
- **Purpose:** Superimpose 3D objects into real-world view
- **Technology:** WebXR AR (markerless) or Model Viewer AR
- **Best For:** Interactive 3D models, educational objects, visualizations
- **Requirements:** Mobile device with camera, compatible browser

### 3D Model
- **Purpose:** View 3D models in the browser (not AR)
- **Technology:** Model Viewer, Three.js
- **Best For:** 3D visualizations that don't need AR
- **Requirements:** Any device with a modern browser

## Tips for Teachers

1. **Test First:**
   - Test AR content on a mobile device before assigning to students
   - Ensure the 3D model loads correctly

2. **Clear Instructions:**
   - Add instructions in the lesson description
   - Explain what students should do with the AR content
   - Mention device requirements (mobile device with camera)

3. **Subject Alignment:**
   - Use AR content that aligns with your lesson topic
   - Consider the learning objectives when selecting AR content

4. **Duration:**
   - Set realistic estimated minutes for AR exploration
   - AR experiences can take 5-15 minutes depending on complexity

## Troubleshooting

### No AR Content Available
- **Solution:** Ask an admin to create AR content first
- AR content must be created in **Admin Dashboard → AR/VR Content**

### AR Content Not Loading
- **Check:** Ensure the 3D model URL is valid
- **Check:** Verify the model format is GLTF or GLB
- **Check:** Model must be hosted on a CORS-enabled server (e.g., Supabase Storage)

### Students Can't Use AR
- **Check:** Students need a mobile device (Android/iOS)
- **Check:** Compatible browser (Chrome on Android, Safari on iOS)
- **Check:** Camera permission must be granted
- **Note:** Desktop browsers show fallback 3D viewer (not AR)

## Technical Details

- **AR Technology:** WebXR AR API for markerless AR
- **Fallback:** Model Viewer AR for iOS Safari
- **Model Format:** GLTF/GLB recommended
- **Storage:** Models stored in Supabase Storage or external URLs
- **Surface Detection:** Automatic real-world surface detection
- **Placement:** Tap-to-place interaction

## Support

If you encounter issues:
1. Check that AR content exists in the system
2. Verify the 3D model URL is accessible
3. Test on a mobile device with a compatible browser
4. Contact your system administrator if problems persist

