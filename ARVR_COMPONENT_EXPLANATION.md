# How the 3D and VR Component Works

## Current Implementation

The AR/VR component (`ARVRIntegration.jsx`) currently provides:

### 1. **Content Management**
- Fetches AR/VR content from the database based on subject/class
- Displays content cards with metadata (name, type, description, location)
- Tracks student sessions and progress

### 2. **Session Tracking**
- Creates a session when a student starts an experience
- Tracks completion percentage
- Logs interactions (stored in `interactions_log` JSONB field)
- Updates session state (camera position, selected objects, etc.)

### 3. **Content Types Supported**
- **3D_MODEL**: Interactive 3D models (GLTF, OBJ, FBX, USDZ formats)
- **AR_OVERLAY**: Augmented reality overlays (AR marker-based)
- **VR_EXPERIENCE**: Virtual reality experiences (WebXR)
- **FIELD_TRIP**: Virtual field trips (360° tours)

### 4. **Current UI Flow**
1. Student sees list of available AR/VR content
2. Clicks "Start Experience" → Creates session in database
3. Opens modal with placeholder content
4. Can mark as complete when done

## What's Missing (To Make It Fully Functional)

The component currently shows **placeholders** for the actual 3D/VR rendering. To make it work, you need:

### For 3D Models:
- **Three.js** or **React Three Fiber** for WebGL rendering
- **GLTFLoader** to load 3D model files
- Camera controls (orbit, zoom, pan)
- Interaction handlers (click, hover, rotate)

### For AR:
- **WebXR API** or **AR.js** for marker-based AR
- Camera access permissions
- AR marker detection
- Overlay rendering

### For VR:
- **WebXR API** for browser-based VR
- VR headset detection
- Scene rendering in VR mode
- Controller tracking

### For Virtual Field Trips:
- **A-Frame** or **React 360** for 360° images
- Navigation between scenes
- Hotspot system

## How to Integrate Actual 3D/VR Rendering

Here's how you would enhance the component:

### Option 1: Three.js for 3D Models

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// In the modal, replace placeholder with:
useEffect(() => {
  if (selectedContent?.content_type === '3D_MODEL' && selectedContent.content_url) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const container = document.getElementById('3d-container');
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    const loader = new GLTFLoader();
    
    loader.load(selectedContent.content_url, (gltf) => {
      scene.add(gltf.scene);
      camera.position.set(0, 0, 5);
      controls.update();
      
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
    });
    
    return () => {
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }
}, [selectedContent]);
```

### Option 2: React Three Fiber (Recommended)

```bash
npm install @react-three/fiber @react-three/drei three
```

```javascript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// In modal:
{selectedContent?.content_type === '3D_MODEL' && (
  <div style={{ width: '100%', height: '500px' }}>
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Model url={selectedContent.content_url} />
      <OrbitControls />
      <Environment preset="sunset" />
    </Canvas>
  </div>
)}
```

### Option 3: WebXR for VR

```javascript
async function enterVR() {
  if (navigator.xr) {
    const session = await navigator.xr.requestSession('immersive-vr');
    // Initialize VR scene
    // Render loop
  }
}

// Check VR support
const isVRAvailable = navigator.xr && await navigator.xr.isSessionSupported('immersive-vr');
```

### Option 4: AR.js for Augmented Reality

```html
<!-- In modal body -->
<a-scene embedded arjs>
  <a-marker preset="hiro">
    <a-box position="0 0.5 0" material="color: yellow;"></a-box>
  </a-marker>
  <a-entity camera></a-entity>
</a-scene>
```

## Database Schema

The component uses these database fields:

```sql
-- arvr_content table
content_url TEXT,           -- URL to 3D model/VR scene
model_format VARCHAR(50),   -- GLTF, OBJ, FBX, USDZ
platform VARCHAR(50),       -- WEBXR, ARKIT, ARCORE
ar_marker_url TEXT,         -- AR marker image
vr_scene_config JSONB,      -- VR scene configuration
model_properties JSONB,     -- Scale, rotation, position
annotations JSONB,          -- 3D annotations

-- arvr_sessions table
session_state JSONB,        -- Current state (camera pos, etc.)
interactions_log JSONB,     -- Log of user interactions
screenshots JSONB,          -- Screenshot URLs
```

## Recommended Libraries

1. **Three.js** - 3D graphics library
2. **React Three Fiber** - React renderer for Three.js
3. **@react-three/drei** - Useful helpers for R3F
4. **A-Frame** - Web framework for VR/AR
5. **AR.js** - AR marker tracking
6. **WebXR Polyfill** - Fallback for older browsers

## Implementation Steps

1. **Install dependencies:**
   ```bash
   npm install three @react-three/fiber @react-three/drei
   ```

2. **Create a 3D Viewer component:**
   - Separate component for 3D model rendering
   - Handles loading, controls, interactions

3. **Create an AR Viewer component:**
   - Uses camera API
   - Marker detection
   - Overlay rendering

4. **Create a VR Viewer component:**
   - WebXR session management
   - VR scene rendering
   - Controller tracking

5. **Update ARVRIntegration.jsx:**
   - Replace placeholders with actual viewers
   - Handle loading states
   - Track interactions

## Example: Enhanced 3D Model Viewer

I can create a fully functional 3D model viewer component that you can integrate. Would you like me to:

1. Create a `ThreeJSViewer` component?
2. Create a `WebXRViewer` component for VR?
3. Create an `ARViewer` component for AR?
4. Update the `ARVRIntegration` component to use these?

Let me know which one(s) you'd like me to implement!

