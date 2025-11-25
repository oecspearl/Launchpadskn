# AR/VR Viewer Components

This directory contains fully functional 3D, VR, AR, and Virtual Field Trip viewer components.

## Components

### 1. ThreeDModelViewer.jsx
Interactive 3D model viewer using React Three Fiber.

**Features:**
- Loads GLTF, OBJ, FBX, USDZ models
- Orbit controls (rotate, zoom, pan)
- Auto-rotation option
- 3D annotations
- Shadow rendering
- Environment lighting

**Props:**
- `contentUrl` - URL to 3D model file
- `modelFormat` - Format type (GLTF, OBJ, etc.)
- `modelProperties` - Scale, position, rotation, autoRotate, etc.
- `annotations` - Array of 3D annotations
- `interactionMode` - VIEW_ONLY, INTERACTIVE, GUIDED_TOUR
- `onInteraction` - Callback for user interactions
- `onStateChange` - Callback for state changes

### 2. WebXRViewer.jsx
WebXR-based VR experience viewer.

**Features:**
- WebXR VR session management
- VR headset detection
- Controller tracking
- Immersive VR rendering
- Desktop mode fallback

**Props:**
- `contentUrl` - URL to VR scene (GLTF)
- `sceneConfig` - Scene configuration (scale, position)
- `onInteraction` - Callback for interactions
- `onStateChange` - Callback for state changes
- `onVREnter` - Called when entering VR
- `onVRExit` - Called when exiting VR

**Browser Support:**
- Chrome/Edge (Windows Mixed Reality, Oculus)
- Firefox (with WebXR enabled)
- Safari (iOS 15+ with WebXR)

### 3. ARViewer.jsx
Augmented Reality viewer using WebXR AR.

**Features:**
- WebXR AR session management
- Camera access handling
- AR marker support
- 3D model overlay on camera view

**Props:**
- `contentUrl` - URL to 3D model for AR overlay
- `arMarkerUrl` - URL to AR marker image
- `modelFormat` - Model format
- `platform` - WEBXR, ARKIT, ARCORE
- `onInteraction` - Callback for interactions
- `onStateChange` - Callback for state changes

**Browser Support:**
- Chrome on Android (ARCore)
- Safari on iOS (ARKit)
- Requires device with AR support

### 4. VirtualFieldTripViewer.jsx
Virtual field trip viewer with 360° scenes.

**Features:**
- 360° image/video support
- Scene navigation
- Fullscreen mode
- Location information display
- External tour integration (Google Street View, Matterport, etc.)

**Props:**
- `virtualTourUrl` - URL to external tour (iframe)
- `locationName` - Name of location
- `locationCoordinates` - Lat/long coordinates
- `scenes` - Array of scene objects with imageUrl and name
- `onStateChange` - Callback for state changes
- `onInteraction` - Callback for interactions

## Installation

Install the required dependencies:

```bash
npm install @react-three/fiber @react-three/drei three
```

## Usage Example

```jsx
import ThreeDModelViewer from './Viewers/ThreeDModelViewer';

function MyComponent() {
  const handleInteraction = (interaction) => {
    console.log('User interaction:', interaction);
  };

  const handleStateChange = (state) => {
    console.log('State changed:', state);
  };

  return (
    <ThreeDModelViewer
      contentUrl="https://example.com/model.gltf"
      modelFormat="GLTF"
      modelProperties={{
        scale: 1,
        position: [0, 0, 0],
        autoRotate: true
      }}
      annotations={[
        { position: [1, 1, 1], text: "Point of Interest", color: "#ff6b6b" }
      ]}
      onInteraction={handleInteraction}
      onStateChange={handleStateChange}
    />
  );
}
```

## Model Formats Supported

### 3D Models
- **GLTF/GLB** (Recommended) - Best performance, smallest file size
- **OBJ** - Common format, widely supported
- **FBX** - Autodesk format
- **USDZ** - Apple AR format

### VR Scenes
- **GLTF/GLB** - Recommended for WebXR
- Must be optimized for VR (low poly, compressed textures)

### AR Models
- **GLTF/GLB** - For WebXR AR
- **USDZ** - For iOS ARKit
- **GLTF** - For Android ARCore

## Model Hosting

3D models should be hosted on a CORS-enabled server. Options:
- AWS S3 with CORS
- Cloudflare R2
- GitHub Pages
- CDN services

## Performance Tips

1. **Optimize Models:**
   - Use GLTF format
   - Compress textures
   - Reduce polygon count
   - Use texture atlases

2. **Lazy Loading:**
   - Load models on demand
   - Use progressive loading

3. **Caching:**
   - Cache loaded models
   - Use service workers

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| 3D Models | ✅ | ✅ | ✅ | ✅ |
| WebXR VR | ✅ | ✅* | ❌ | ✅ |
| WebXR AR | ✅** | ❌ | ✅** | ✅** |

*Requires WebXR flag enabled
**Requires compatible device (ARCore/ARKit)

## Troubleshooting

### Models not loading
- Check CORS headers on model server
- Verify model URL is accessible
- Check browser console for errors

### VR not working
- Ensure WebXR is supported
- Check VR headset is connected
- Try different browser

### AR not working
- Check camera permissions
- Verify device has AR support
- Try on mobile device

## Next Steps

1. Add more 3D models to your database
2. Configure AR markers
3. Create VR scenes
4. Set up virtual field trips
5. Test on various devices

