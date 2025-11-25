# How Teachers Use 3D Models in Lessons

## Overview

Teachers can now add interactive 3D models and AR/VR content to their lessons, allowing students to explore and interact with 3D objects directly in the lesson view.

## Step-by-Step Guide

### Step 1: Add 3D Models to Your Library (Admin Only)

Before teachers can use 3D models, an admin must add them to the platform:

1. **Navigate to Admin Dashboard**
   - Go to `/admin/arvr-content` or click "AR/VR Content" from the Admin Dashboard

2. **Add a 3D Model**
   - Click "Add 3D Model"
   - Fill in the form:
     - **Name**: Give your model a descriptive name (e.g., "Human Heart Anatomy")
     - **Description**: Add a brief description
     - **Type**: Select the content type:
       - `3D_MODEL`: Standard 3D model for web viewing
       - `AR_OVERLAY`: AR content that overlays on real-world objects
       - `VR_EXPERIENCE`: Full VR experience
       - `FIELD_TRIP`: Virtual field trip
     - **Upload 3D Model File**: Upload a GLTF or GLB file
     - **Format**: Select the model format (GLTF, GLB, OBJ, etc.)
     - **Subject** (Optional): Link to a specific subject
     - **Difficulty Level**: Set the difficulty (EASY, MEDIUM, HARD)
     - **Estimated Duration**: How long students should spend with this model

3. **Save the Model**
   - Click "Create" to save the model to your library

### Step 2: Add 3D Model to a Lesson (Teachers)

Once 3D models are in the library, teachers can add them to lessons:

1. **Navigate to Lesson Content**
   - Go to your lesson: `/teacher/lessons/:lessonId/content`
   - Or click "Manage Content" from a lesson view

2. **Add New Content**
   - Click "Add Content" or the "+" button
   - In the "Content Type" dropdown, select **"3D Model / AR/VR"** from the "Interactive Content" section

3. **Select a 3D Model**
   - A dropdown will appear showing all available 3D models
   - Select the model you want to add to the lesson
   - The form will auto-fill with the model's details:
     - Title
     - Description
     - URL (model file location)

4. **Customize (Optional)**
   - You can edit the title and description if needed
   - Add learning outcomes, instructions, or key concepts
   - Set the content section (Learning, Practice, Assessment, etc.)
   - Set estimated time for students

5. **Save**
   - Click "Save" to add the 3D model to your lesson
   - The model will appear in the lesson content list

### Step 3: Students View 3D Models

When students access the lesson:

1. **Navigate to Lesson**
   - Students go to `/student/lessons/:lessonId`
   - The 3D model appears in the "Learning" section

2. **View the Model**
   - Students see a preview card with:
     - Model name
     - Type badge (3D Model, AR Overlay, etc.)
     - Description
     - "View 3D Model" button

3. **Interact with the Model**
   - Click "View 3D Model" to open the interactive viewer
   - Students can:
     - Rotate the model (click and drag)
     - Zoom in/out (scroll or pinch)
     - View in AR (if supported by device)
     - See annotations (if added by admin)

## Features

### For Teachers

- **Easy Selection**: Browse and select from available 3D models
- **Auto-Fill**: Model details automatically populate
- **Customization**: Add your own descriptions and learning objectives
- **Organization**: Place models in different lesson sections

### For Students

- **Interactive Viewing**: Rotate, zoom, and explore 3D models
- **AR Support**: View models in augmented reality (on supported devices)
- **Mobile Friendly**: Works on phones, tablets, and desktops
- **No Downloads**: Models load directly in the browser

## Supported File Formats

- **GLTF** (recommended): Most widely supported, efficient
- **GLB**: Binary version of GLTF, smaller file size
- **OBJ**: Legacy format, still supported
- **FBX**: For complex animations (may require conversion)

## Best Practices

1. **File Size**: Keep models under 10MB for faster loading
2. **Optimization**: Use compressed textures and simplified geometry
3. **Descriptions**: Add clear descriptions to help students understand the model
4. **Learning Objectives**: Link models to specific learning outcomes
5. **Testing**: Preview models before adding to lessons

## Troubleshooting

### "No 3D models available"
- **Solution**: An admin needs to add models first via `/admin/arvr-content`

### Model won't load
- **Check**: File format is GLTF or GLB
- **Check**: File is uploaded to Supabase Storage
- **Check**: Browser supports WebGL (most modern browsers do)

### AR not working
- **Check**: Device supports AR (iOS 11+ or Android 7+)
- **Check**: Browser supports WebXR (Chrome, Edge, Safari)

## Technical Details

- **Storage**: Models are stored in Supabase Storage bucket `3d-models`
- **Viewer**: Uses `@google/model-viewer` for web viewing
- **AR**: Uses WebXR API for AR experiences
- **Database**: Model references stored in `arvr_content` table
- **Lesson Integration**: Models linked via `lesson_content.metadata` field

## Next Steps

1. **Add Models**: Admins should add commonly used 3D models to the library
2. **Create Lessons**: Teachers can start adding models to lessons
3. **Student Feedback**: Gather feedback on which models are most useful
4. **Expand Library**: Continuously add new models based on curriculum needs

