# How 3D Models Operate on the Platform

## Overview
The platform supports interactive 3D models, VR experiences, AR overlays, and virtual field trips using React 19-compatible libraries.

## Complete Workflow

### 1. **Content Creation & Storage**

#### Database Structure
3D models are stored in the `arvr_content` table:

```sql
CREATE TABLE arvr_content (
    content_id BIGSERIAL PRIMARY KEY,
    content_name VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL,  -- 3D_MODEL, VR_EXPERIENCE, AR_OVERLAY, FIELD_TRIP
    content_url TEXT,                   -- URL to 3D model file (GLTF, OBJ, etc.)
    model_format VARCHAR(50),            -- GLTF, OBJ, FBX, USDZ
    model_properties JSONB,              -- Scale, rotation, position, autoRotate
    annotations JSONB,                   -- 3D annotations/hotspots
    subject_id BIGINT,                   -- Associated subject
    class_subject_id BIGINT,             -- Associated class-subject
    ...
);
```

#### Example Database Entry
```json
{
  "content_id": 1,
  "content_name": "Human Heart 3D Model",
  "description": "Interactive 3D model of the human heart for biology class",
  "content_type": "3D_MODEL",
  "content_url": "https://cdn.example.com/models/heart.gltf",
  "model_format": "GLTF",
  "model_properties": {
    "scale": 1.5,
    "position": [0, 0, 0],
    "rotation": [0, 0, 0],
    "autoRotate": true,
    "cameraControls": true,
    "exposure": 1.0,
    "shadowIntensity": 1.0
  },
  "annotations": [
    {
      "position": [1, 1, 1],
      "text": "Right Atrium",
      "color": "#ff6b6b"
    },
    {
      "position": [-1, 1, 1],
      "text": "Left Atrium",
      "color": "#4ecdc4"
    }
  ],
  "subject_id": 5,  -- Biology
  "class_subject_id": 12
}
```

### 2. **Content Upload Process**

#### Option A: Direct URL (Recommended)
1. **Upload 3D model to CDN/Storage**:
   - Upload GLTF/GLB file to:
     - AWS S3 (with CORS enabled)
     - Cloudflare R2
     - Google Cloud Storage
     - Any CORS-enabled CDN
   
2. **Insert into Database**:
   ```sql
   INSERT INTO arvr_content (
     content_name, content_type, content_url, 
     model_format, subject_id, class_subject_id
   ) VALUES (
     'Human Heart Model', '3D_MODEL', 
     'https://cdn.example.com/models/heart.gltf',
     'GLTF', 5, 12
   );
   ```

#### Option B: Admin Interface (Future)
- Admin uploads 3D model file through UI
- System automatically:
  - Uploads to CDN
  - Generates thumbnail
  - Creates database entry
  - Validates model format

### 3. **Content Retrieval**

#### Frontend Flow
```javascript
// 1. User navigates to Interactive Content Hub
// 2. Component fetches AR/VR content for subject/class

const { data: arvrContent } = useQuery({
  queryKey: ['arvr-content', subjectId, classSubjectId],
  queryFn: () => interactiveContentService.getARVRContent(
    subjectId, 
    null, 
    classSubjectId
  )
});

// 3. Content is displayed in cards
// 4. User clicks "Start Experience"
// 5. Modal opens with appropriate viewer
```

### 4. **Model Rendering**

#### For 3D Models (content_type = '3D_MODEL')
Uses **Google Model Viewer** web component:

```jsx
<ModelViewerComponent
  contentUrl="https://cdn.example.com/models/heart.gltf"
  modelFormat="GLTF"
  modelProperties={{
    scale: 1.5,
    autoRotate: true,
    cameraControls: true
  }}
  annotations={[
    { position: [1,1,1], text: "Right Atrium", color: "#ff6b6b" }
  ]}
/>
```

**What Happens:**
1. Component loads `@google/model-viewer` web component
2. Fetches GLTF file from `content_url`
3. Renders 3D model in WebGL canvas
4. Applies properties (scale, rotation, lighting)
5. Adds annotations as interactive hotspots
6. Enables camera controls (drag, zoom, pan)

#### For VR Experiences (content_type = 'VR_EXPERIENCE')
Uses **Three.js + WebXR**:

```jsx
<WebXRViewerV2
  contentUrl="https://cdn.example.com/vr-scenes/chemistry-lab.gltf"
  sceneConfig={{
    scale: 1,
    position: [0, 0, 0]
  }}
/>
```

**What Happens:**
1. Loads Three.js scene
2. Fetches VR scene GLTF file
3. Sets up WebXR session
4. Renders in VR mode when headset connected
5. Tracks head movement and controllers

### 5. **User Interactions**

#### Desktop/Tablet Interactions
- **Rotate**: Click and drag to rotate model
- **Zoom**: Scroll wheel or pinch to zoom
- **Pan**: Right-click and drag (if enabled)
- **Annotations**: Click hotspots to see information
- **AR Mode**: Click AR button to view in AR (mobile)

#### Mobile Interactions
- **Touch Rotate**: One finger drag
- **Zoom**: Pinch gesture
- **AR**: Tap AR button to open in AR mode
- **Annotations**: Tap hotspots

#### VR Interactions
- **Look Around**: Move head to look
- **Controllers**: Use VR controllers to interact
- **Teleport**: Move through VR space
- **Grab**: Pick up and manipulate objects

### 6. **Session Tracking**

When a student interacts with a 3D model:

```javascript
// 1. Session created in database
const session = await interactiveContentService.createARVRSession({
  content_id: 1,
  student_id: 123,
  class_subject_id: 12,
  session_state: {},
  interactions_log: []
});

// 2. Interactions logged
handleInteraction({
  type: 'annotation_click',
  annotation: 'Right Atrium',
  timestamp: '2024-11-25T10:30:00Z'
});

// 3. State changes tracked
handleStateChange({
  cameraPosition: [5, 5, 5],
  cameraRotation: [0, 0.5, 0],
  viewedAnnotations: ['Right Atrium', 'Left Atrium']
});

// 4. Progress updated
updateARVRSession(sessionId, {
  completion_percentage: 75,
  interactions_log: [...],
  session_state: {...}
});
```

### 7. **Supported Formats**

#### 3D Models
- **GLTF/GLB** ✅ (Recommended - best performance)
- **OBJ** ✅ (Supported)
- **USDZ** ✅ (iOS AR)
- **FBX** ⚠️ (Limited support)

#### VR Scenes
- **GLTF/GLB** ✅ (Recommended)
- Must be optimized for VR (low poly, compressed textures)

#### AR Models
- **GLTF/GLB** ✅ (WebXR AR)
- **USDZ** ✅ (iOS ARKit)

### 8. **Model Requirements**

#### File Size
- **Recommended**: < 10MB for GLTF
- **Maximum**: 50MB (may cause slow loading)
- **Optimization**: Use compressed textures, reduce polygons

#### CORS Requirements
Model files must be served with CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
```

#### Texture Requirements
- Formats: JPG, PNG, WebP
- Recommended: 2048x2048 or smaller
- Use texture compression when possible

### 9. **AR Capabilities**

#### WebXR AR (Chrome/Edge on Android)
- Marker-based AR
- Location-based AR
- Face tracking (if supported)

#### ARKit (Safari on iOS)
- USDZ format
- Quick Look integration
- Face tracking
- Object tracking

#### ARCore (Chrome on Android)
- GLTF format
- Plane detection
- Object tracking

### 10. **Performance Optimization**

#### Model Optimization
1. **Reduce Polygon Count**: Use decimation tools
2. **Compress Textures**: Use WebP or compressed formats
3. **Use GLB**: Binary format is smaller than GLTF
4. **LOD (Level of Detail)**: Multiple detail levels
5. **Texture Atlasing**: Combine textures

#### Loading Strategy
- **Lazy Loading**: Load models only when needed
- **Progressive Loading**: Show low-res first, then high-res
- **Caching**: Cache loaded models in browser
- **CDN**: Use CDN for fast delivery

### 11. **Example Use Cases**

#### Biology Class
```
Model: Human Heart
- Students can rotate and examine
- Click annotations to learn parts
- View in AR on mobile devices
- Teacher can highlight specific areas
```

#### Chemistry Class
```
VR Experience: Virtual Lab
- Students enter VR lab
- Perform experiments safely
- Interact with chemicals
- See molecular structures in 3D
```

#### History Class
```
Virtual Field Trip: Ancient Rome
- 360° tour of historical sites
- Navigate between scenes
- Interactive hotspots with information
- Immersive learning experience
```

#### Geography Class
```
AR Overlay: World Map
- Point camera at AR marker
- 3D globe appears
- Rotate to see different continents
- Tap countries for information
```

### 12. **Technical Architecture**

```
┌─────────────────┐
│   Database      │
│  (arvr_content) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase API   │
│  (RPC Functions)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Frontend │
│  (React 19)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Viewer Component│
│  (Model Viewer) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CDN/Storage    │
│  (3D Model File)│
└─────────────────┘
```

### 13. **Student Experience Flow**

1. **Student logs in** → Navigates to subject
2. **Clicks "Interactive Content"** → Sees AR/VR tab
3. **Views available content** → Cards showing 3D models/VR experiences
4. **Clicks "Start Experience"** → Modal opens with viewer
5. **Interacts with model**:
   - Rotates, zooms, explores
   - Clicks annotations
   - Views in AR (mobile)
   - Enters VR (if headset available)
6. **Progress tracked** → Interactions logged in database
7. **Completes experience** → Marks as complete, progress saved

### 14. **Teacher/Admin Experience**

1. **Upload 3D Model**:
   - Upload GLTF file to CDN
   - Get URL
   - Insert into database with metadata

2. **Configure Model**:
   - Set scale, rotation
   - Add annotations
   - Link to subject/class

3. **Monitor Usage**:
   - View student sessions
   - See interaction logs
   - Track completion rates

### 15. **Best Practices**

#### For Content Creators
- Use GLTF/GLB format
- Optimize file size (< 10MB)
- Add meaningful annotations
- Test on multiple devices
- Provide descriptions

#### For Administrators
- Use reliable CDN
- Enable CORS properly
- Monitor file sizes
- Organize by subject
- Keep models updated

#### For Developers
- Handle loading states
- Show error messages
- Track interactions
- Optimize performance
- Test AR/VR features

## Summary

3D models on the platform work through:
1. **Storage**: Models stored as URLs in database
2. **Retrieval**: Fetched via Supabase API
3. **Rendering**: Google Model Viewer or Three.js
4. **Interaction**: User controls (rotate, zoom, AR, VR)
5. **Tracking**: Sessions and interactions logged
6. **Progress**: Completion tracked per student

The system is designed to be:
- ✅ React 19 compatible
- ✅ Mobile-friendly
- ✅ AR/VR ready
- ✅ Performance optimized
- ✅ Easy to use
- ✅ Scalable

