import React, { useRef, useEffect, useState } from 'react';
import { Alert, Button, Spinner, Badge } from 'react-bootstrap';
import { FaCamera, FaDownload, FaHandPointer, FaArrowsAlt, FaTimes } from 'react-icons/fa';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Enhanced AR Viewer Component
 * Supports both WebXR AR (markerless) and marker-based AR
 */
function ARViewerEnhanced({
  contentUrl,
  arMarkerUrl,
  modelFormat = 'GLTF',
  platform = 'WEBXR',
  modelProperties = {},
  onInteraction,
  onStateChange
}) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arSupported, setARSupported] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [arMode, setArMode] = useState(null); // 'webxr', 'marker', 'model-viewer'

  // Three.js refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const controllerRef = useRef(null);
  const reticleRef = useRef(null);
  const raycasterRef = useRef(null);

  const {
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0]
  } = modelProperties;

  useEffect(() => {
    checkARSupport();
    return () => {
      // Cleanup
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const checkARSupport = async () => {
    try {
      // Check WebXR AR support
      if (navigator.xr) {
        const webxrSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (webxrSupported) {
          setArMode('webxr');
          setARSupported(true);
          setIsLoading(false);
          return;
        }
      }

      // Check for model-viewer AR support (iOS Safari, Android Chrome)
      if (customElements.get('model-viewer')) {
        setArMode('model-viewer');
        setARSupported(true);
        setIsLoading(false);
        return;
      }

      // Check for marker-based AR (AR.js)
      if (window.AR) {
        setArMode('marker');
        setARSupported(true);
        setIsLoading(false);
        return;
      }

      setARSupported(false);
      setIsLoading(false);
    } catch (err) {
      console.error('AR support check failed:', err);
      setError('Failed to check AR support. Please try a different browser or device.');
      setIsLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      setError('Camera permission denied. Please allow camera access to use AR.');
      setCameraPermission(false);
      return false;
    }
  };

  // Initialize WebXR AR
  const initWebXRAR = async () => {
    if (!containerRef.current) return;

    try {
      // Request camera permission
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        canvas: containerRef.current 
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.xr.enabled = true;
      rendererRef.current = renderer;

      // Add lighting
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

      // Create reticle for placement
      const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
      const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
      reticleRef.current = reticle;

      // Load 3D model
      if (contentUrl) {
        await loadModel(scene, contentUrl);
      }

      // Setup controller for placement
      const controller = renderer.xr.getController(0);
      controller.addEventListener('select', onSelect);
      controllerRef.current = controller;
      scene.add(controller);

      // Create a controller model for visualization
      const controllerModel = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.02, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      controller.add(controllerModel);

      // Start AR session with hit test support
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor', 'hit-test'],
        optionalFeatures: ['dom-overlay', 'hand-tracking']
      });

      renderer.xr.setSession(session);

      // Get hit test source for real-world surface detection
      let hitTestSource = null;
      let hitTestSourceRequested = false;

      session.addEventListener('end', () => {
        setIsARActive(false);
        hitTestSource = null;
        if (onStateChange) {
          onStateChange({ arActive: false });
        }
      });

      // Request hit test source
      const requestHitTestSource = async () => {
        try {
          const viewerSpace = await session.requestReferenceSpace('viewer');
          hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
          hitTestSourceRequested = true;
        } catch (err) {
          console.error('Hit test source request failed:', err);
          // Fallback to local-floor reference space
          try {
            const localFloorSpace = await session.requestReferenceSpace('local-floor');
            hitTestSource = await session.requestHitTestSource({ space: localFloorSpace });
            hitTestSourceRequested = true;
          } catch (fallbackErr) {
            console.error('Fallback hit test source request failed:', fallbackErr);
          }
        }
      };

      await requestHitTestSource();

      setIsARActive(true);
      setPlacementMode(true);
      
      if (onStateChange) {
        onStateChange({ arActive: true, session, mode: 'webxr' });
      }

      // Animation loop with WebXR hit testing for real-world surface detection
      renderer.setAnimationLoop((time, frame) => {
        if (!frame) return;

        if (placementMode && reticleRef.current && hitTestSource) {
          // Get pose for hit testing
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          
          if (hitTestResults.length > 0) {
            // Get the first hit test result (closest surface)
            const hit = hitTestResults[0];
            const pose = hit.getPose(renderer.xr.getReferenceSpace());
            
            if (pose) {
              // Update reticle position to superimpose on real-world surface
              reticleRef.current.position.set(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
              );
              reticleRef.current.quaternion.set(
                pose.transform.orientation.x,
                pose.transform.orientation.y,
                pose.transform.orientation.z,
                pose.transform.orientation.w
              );
              reticleRef.current.visible = true;
              
              // Update reticle matrix
              reticleRef.current.updateMatrix();
            }
          } else {
            reticleRef.current.visible = false;
          }
        }

        renderer.render(scene, camera);
      });

    } catch (err) {
      console.error('WebXR AR initialization failed:', err);
      setError(`Failed to start AR: ${err.message}`);
    }
  };

  const loadModel = async (scene, url) => {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      
      const model = gltf.scene;
      model.scale.set(scale, scale, scale);
      model.position.set(position[0], position[1], position[2]);
      model.rotation.set(rotation[0], rotation[1], rotation[2]);
      model.visible = false; // Hidden until placed
      
      scene.add(model);
      modelRef.current = model;
      setModelLoaded(true);

      if (onStateChange) {
        onStateChange({ modelLoaded: true });
      }
    } catch (err) {
      console.error('Model loading failed:', err);
      setError(`Failed to load 3D model: ${err.message}`);
    }
  };

  const onSelect = (event) => {
    if (placementMode && reticleRef.current && modelRef.current && reticleRef.current.visible) {
      // Place model at reticle position (superimposed on real-world surface)
      modelRef.current.position.copy(reticleRef.current.position);
      modelRef.current.quaternion.copy(reticleRef.current.quaternion);
      modelRef.current.visible = true;
      setPlacementMode(false);
      reticleRef.current.visible = false;

      if (onInteraction) {
        onInteraction({
          type: 'model_placed',
          position: modelRef.current.position.toArray(),
          rotation: modelRef.current.quaternion.toArray(),
          timestamp: new Date().toISOString(),
          message: '3D object superimposed into world view'
        });
      }

      if (onStateChange) {
        onStateChange({ 
          modelPlaced: true, 
          placementMode: false,
          position: modelRef.current.position.toArray()
        });
      }
    }
  };

  const startAR = async () => {
    if (!arSupported) {
      setError('AR is not supported in this browser. Try Chrome on Android or Safari on iOS.');
      return;
    }

    if (arMode === 'webxr') {
      await initWebXRAR();
    } else if (arMode === 'model-viewer') {
      // Use model-viewer's built-in AR
      setIsARActive(true);
      if (onStateChange) {
        onStateChange({ arActive: true, mode: 'model-viewer' });
      }
    } else if (arMode === 'marker') {
      // Marker-based AR
      setError('Marker-based AR requires AR.js library. Please use WebXR AR or model-viewer AR.');
    }
  };

  const stopAR = () => {
    if (rendererRef.current && rendererRef.current.xr.isPresenting) {
      rendererRef.current.xr.getSession().end();
    }
    setIsARActive(false);
    setPlacementMode(false);
    if (onStateChange) {
      onStateChange({ arActive: false });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Checking AR support...</p>
      </div>
    );
  }

  // Use model-viewer AR as fallback
  if (arMode === 'model-viewer' && contentUrl) {
    return (
      <div style={{ width: '100%', height: '600px', position: 'relative', background: '#1a1a1a' }}>
        <model-viewer
          src={contentUrl}
          alt="AR Model"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          ar-placement="floor"
          camera-controls
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a'
          }}
          onLoad={() => {
            setModelLoaded(true);
            if (onStateChange) {
              onStateChange({ modelLoaded: true, arActive: true, mode: 'model-viewer' });
            }
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10
          }}
        >
          <Button variant="danger" size="sm" onClick={stopAR}>
            <FaTimes className="me-1" />
            Exit AR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', background: '#000' }}>
      {/* WebXR AR Canvas */}
      <canvas
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: isARActive ? 'block' : 'none'
        }}
      />

      {/* Error Display */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            width: '90%',
            maxWidth: '500px'
          }}
        >
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {/* AR Not Started State */}
      {!isARActive && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            zIndex: 10
          }}
        >
          <FaCamera size={64} className="mb-3" />
          <h5 className="mb-3">Augmented Reality</h5>
          <p className="mb-4">
            {arMarkerUrl
              ? 'Point your camera at the AR marker to view the 3D model'
              : 'Superimpose 3D objects into your world view using Web AR'}
          </p>
          {!arMarkerUrl && (
            <div className="mb-3" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              <div>✨ Real-world surface detection</div>
              <div>📱 Tap to place objects in your environment</div>
              <div>🌍 Objects stay anchored in real space</div>
            </div>
          )}

          {arMarkerUrl && (
            <div className="mb-4">
              <Button
                variant="outline-light"
                href={arMarkerUrl}
                download
                className="me-2"
              >
                <FaDownload className="me-2" />
                Download AR Marker
              </Button>
            </div>
          )}

          <div className="mb-3">
            <Button
              variant="primary"
              size="lg"
              onClick={startAR}
              disabled={!arSupported}
            >
              <FaCamera className="me-2" />
              Start AR Experience
            </Button>
          </div>

          {arMode && (
            <Badge bg="info" className="mb-3">
              Mode: {arMode === 'webxr' ? 'WebXR AR' : arMode === 'model-viewer' ? 'Model Viewer AR' : 'Marker AR'}
            </Badge>
          )}

          {!arSupported && (
            <Alert variant="warning" className="mt-3">
              <small>
                AR requires a compatible browser and device. Try Chrome on Android or Safari on iOS.
              </small>
            </Alert>
          )}
        </div>
      )}

      {/* AR Active State - WebXR */}
      {isARActive && arMode === 'webxr' && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10
            }}
          >
            <Button variant="danger" size="sm" onClick={stopAR}>
              <FaTimes className="me-1" />
              Stop AR
            </Button>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 10
            }}
          >
            {placementMode ? (
              <>
                <div><FaHandPointer className="me-1" /> Point camera at a real surface</div>
                <div><FaArrowsAlt className="me-1" /> Tap to superimpose 3D object</div>
                <div className="mt-2" style={{ fontSize: '10px', opacity: 0.8 }}>
                  The object will appear in your world view
                </div>
              </>
            ) : (
              <>
                <div>✅ 3D object superimposed</div>
                <div>📱 Move around to view from different angles</div>
                <div>🔄 Object is anchored in real world</div>
              </>
            )}
          </div>
        </>
      )}

      {/* Instructions for marker-based AR */}
      {arMarkerUrl && !isARActive && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          <div>1. Download the AR marker</div>
          <div>2. Print or display on another device</div>
          <div>3. Start AR and point camera at marker</div>
        </div>
      )}
    </div>
  );
}

export default ARViewerEnhanced;

