# 3D Models Platform Flow - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT EXPERIENCE                            │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN & NAVIGATION
   ┌──────────────┐
   │ Student      │
   │ Logs In      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────┐
   │ Navigate to Subject   │
   │ (e.g., Biology)      │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Click "Interactive    │
   │ Content" Button      │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ AR/VR Tab Opens       │
   └──────┬───────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Frontend: Fetches AR/VR Content             │
   │ GET /rpc/get_arvr_content                  │
   │ { subject_id, class_subject_id }            │
   └──────┬─────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Database: Returns Available Content          │
   │ - Human Heart 3D Model                       │
   │ - Virtual Lab VR Experience                  │
   │ - DNA Structure AR Overlay                   │
   └──────┬─────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Content Cards Display │
   │ [Card 1] [Card 2]    │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Student Clicks       │
   │ "Start Experience"   │
   └──────┬───────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Frontend: Creates Session                    │
   │ POST /arvr_sessions                          │
   │ { content_id, student_id, class_subject_id } │
   └──────┬─────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Modal Opens with     │
   │ 3D Viewer            │
   └──────┬───────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ ModelViewerComponent Loads                  │
   │ 1. Loads Google Model Viewer script         │
   │ 2. Fetches GLTF from content_url            │
   │ 3. Renders 3D model in WebGL                │
   │ 4. Applies properties (scale, rotation)     │
   │ 5. Adds annotations as hotspots             │
   └──────┬─────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Student Interacts     │
   │ - Rotates model       │
   │ - Zooms in/out        │
   │ - Clicks annotations  │
   │ - Views in AR (mobile)│
   └──────┬───────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Interactions Logged                        │
   │ PUT /arvr_sessions/{session_id}            │
   │ { interactions_log: [...],                  │
   │   session_state: {...} }                   │
   └──────┬─────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Student Completes     │
   │ Clicks "Complete"     │
   └──────┬───────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Session Updated                              │
   │ { is_completed: true,                        │
   │   completion_percentage: 100 }               │
   └─────────────────────────────────────────────┘
```

## Technical Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICAL ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

DATABASE LAYER
┌─────────────────────────────────────┐
│ arvr_content Table                  │
│ ┌─────────────────────────────────┐ │
│ │ content_id: 1                   │ │
│ │ content_name: "Human Heart"     │ │
│ │ content_type: "3D_MODEL"       │ │
│ │ content_url: "https://..."      │ │
│ │ model_format: "GLTF"            │ │
│ │ model_properties: {...}         │ │
│ │ annotations: [...]               │ │
│ └─────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ▼
API LAYER
┌─────────────────────────────────────┐
│ Supabase RPC Function               │
│ get_arvr_content(                   │
│   subject_id,                       │
│   content_type,                     │
│   class_subject_id                  │
│ )                                   │
└──────────────┬──────────────────────┘
               │
               ▼
FRONTEND SERVICE
┌─────────────────────────────────────┐
│ interactiveContentService            │
│ .getARVRContent()                    │
│ Returns: Array of content objects    │
└──────────────┬──────────────────────┘
               │
               ▼
REACT COMPONENT
┌─────────────────────────────────────┐
│ ARVRIntegration.jsx                  │
│ - Displays content cards             │
│ - Handles user clicks                │
│ - Opens modal with viewer            │
└──────────────┬──────────────────────┘
               │
               ▼
VIEWER COMPONENT
┌─────────────────────────────────────┐
│ ModelViewerComponent.jsx             │
│ - Loads Google Model Viewer          │
│ - Fetches GLTF from CDN              │
│ - Renders 3D model                   │
│ - Handles interactions               │
└──────────────┬──────────────────────┘
               │
               ▼
CDN/STORAGE
┌─────────────────────────────────────┐
│ https://cdn.example.com/            │
│   models/heart.gltf                 │
│   models/heart.bin                  │
│   textures/heart_texture.jpg        │
└─────────────────────────────────────┘
```

## Data Flow Example

### Step 1: Content Retrieval
```javascript
// User navigates to Biology subject
// Component fetches available 3D models

const { data: content } = await supabase.rpc('get_arvr_content', {
  subject_id_param: 5,  // Biology
  content_type_param: '3D_MODEL',
  class_subject_id_param: 12
});

// Returns:
[
  {
    content_id: 1,
    content_name: "Human Heart 3D Model",
    content_url: "https://cdn.example.com/models/heart.gltf",
    model_format: "GLTF",
    model_properties: {
      scale: 1.5,
      autoRotate: true
    },
    annotations: [
      { position: [1,1,1], text: "Right Atrium" }
    ]
  }
]
```

### Step 2: Session Creation
```javascript
// Student clicks "Start Experience"
const session = await supabase
  .from('arvr_sessions')
  .insert({
    content_id: 1,
    student_id: 123,
    class_subject_id: 12,
    session_state: {},
    interactions_log: []
  })
  .select()
  .single();

// Returns:
{
  session_id: 456,
  content_id: 1,
  student_id: 123,
  started_at: "2024-11-25T10:00:00Z"
}
```

### Step 3: Model Rendering
```html
<!-- ModelViewerComponent renders -->
<model-viewer
  src="https://cdn.example.com/models/heart.gltf"
  camera-controls
  auto-rotate
  ar
>
  <!-- Annotation hotspot -->
  <button
    slot="hotspot-0"
    data-position="1 1 1"
    onClick={() => logInteraction('annotation_click', 'Right Atrium')}
  >
    Right Atrium
  </button>
</model-viewer>
```

### Step 4: Interaction Tracking
```javascript
// Student clicks annotation
handleInteraction({
  type: 'annotation_click',
  annotation: 'Right Atrium',
  timestamp: '2024-11-25T10:05:00Z'
});

// Updates session
await supabase
  .from('arvr_sessions')
  .update({
    interactions_log: [
      ...previousLog,
      { type: 'annotation_click', annotation: 'Right Atrium', ... }
    ],
    session_state: {
      cameraPosition: [5, 5, 5],
      viewedAnnotations: ['Right Atrium']
    }
  })
  .eq('session_id', 456);
```

### Step 5: Completion
```javascript
// Student clicks "Complete"
await supabase
  .from('arvr_sessions')
  .update({
    is_completed: true,
    completed_at: '2024-11-25T10:15:00Z',
    completion_percentage: 100
  })
  .eq('session_id', 456);
```

## Model File Structure

```
heart.gltf (Main file)
├── heart.bin (Binary data)
├── textures/
│   ├── heart_diffuse.jpg
│   ├── heart_normal.jpg
│   └── heart_roughness.jpg
└── animations/
    └── heartbeat.gltf
```

## Browser Rendering Process

```
1. Browser receives GLTF file
   │
   ▼
2. Parses JSON structure
   │
   ▼
3. Loads binary data (.bin)
   │
   ▼
4. Loads textures (.jpg, .png)
   │
   ▼
5. Creates WebGL buffers
   │
   ▼
6. Renders 3D mesh
   │
   ▼
7. Applies lighting & shadows
   │
   ▼
8. Displays interactive model
```

## Mobile AR Flow

```
1. User opens 3D model on mobile
   │
   ▼
2. Clicks "AR" button
   │
   ▼
3. Camera permission requested
   │
   ▼
4. Camera opens
   │
   ▼
5. Model Viewer detects AR support
   │
   ▼
6. Renders 3D model in AR space
   │
   ▼
7. User can:
   - Walk around model
   - Scale model
   - Place model in real world
   - Take photos/videos
```

## Performance Metrics Tracked

```javascript
{
  session_id: 456,
  content_id: 1,
  student_id: 123,
  
  // Timing
  started_at: "2024-11-25T10:00:00Z",
  completed_at: "2024-11-25T10:15:00Z",
  duration_minutes: 15,
  
  // Progress
  completion_percentage: 100,
  
  // Interactions
  interactions_log: [
    { type: 'rotate', timestamp: '...' },
    { type: 'zoom', timestamp: '...' },
    { type: 'annotation_click', annotation: 'Right Atrium' },
    { type: 'ar_view', duration: 120 }
  ],
  
  // State
  session_state: {
    cameraPosition: [5, 5, 5],
    viewedAnnotations: ['Right Atrium', 'Left Atrium'],
    timeSpent: 900  // seconds
  }
}
```

