import React, { useRef, useEffect, useState } from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// WebXR VR Viewer using Three.js directly (React 19 compatible)
function WebXRViewerV2({
  contentUrl,
  sceneConfig = {},
  onInteraction,
  onStateChange,
  onVREnter,
  onVRExit
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vrSupported, setVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    // Check WebXR support
    const checkWebXRSupport = async () => {
      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-vr');
          setVRSupported(supported);
        } catch (err) {
          console.error('WebXR check failed:', err);
        }
      }
    };
    checkWebXRSupport();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !contentUrl) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;

    // Renderer with WebXR support
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.xr.enabled = true;
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      contentUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(
          sceneConfig.scale || 1,
          sceneConfig.scale || 1,
          sceneConfig.scale || 1
        );
        model.position.set(
          sceneConfig.position?.[0] || 0,
          sceneConfig.position?.[1] || 0,
          sceneConfig.position?.[2] || 0
        );

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        modelRef.current = model;
        setIsLoading(false);
      },
      undefined,
      (err) => {
        setError(`Failed to load VR scene: ${err.message}`);
        setIsLoading(false);
      }
    );

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // VR session handling
    const handleVRSessionStart = () => {
      setIsInVR(true);
      if (onVREnter) onVREnter();
    };

    const handleVRSessionEnd = () => {
      setIsInVR(false);
      if (onVRExit) onVRExit();
    };

    renderer.xr.addEventListener('sessionstart', handleVRSessionStart);
    renderer.xr.addEventListener('sessionend', handleVRSessionEnd);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.xr.removeEventListener('sessionstart', handleVRSessionStart);
      renderer.xr.removeEventListener('sessionend', handleVRSessionEnd);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [contentUrl, sceneConfig, onVREnter, onVRExit]);

  const handleEnterVR = async () => {
    if (!rendererRef.current?.xr || !navigator.xr) return;

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });
      await rendererRef.current.xr.setSession(session);
    } catch (err) {
      console.error('Failed to start VR session:', err);
      setError(`Failed to start VR: ${err.message}`);
    }
  };

  if (!contentUrl) {
    return (
      <Alert variant="warning">
        No VR scene URL provided. Please configure the content URL in the database.
      </Alert>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', background: '#000' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          <Spinner animation="border" variant="light" />
          <p className="text-light mt-2">Loading VR experience...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {!vrSupported && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 10
          }}
        >
          <Alert variant="warning" className="mb-2">
            VR not supported in this browser. Try Chrome, Edge, or Firefox with WebXR enabled.
          </Alert>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {vrSupported && !isInVR && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          <Button variant="success" size="lg" onClick={handleEnterVR}>
            🥽 Enter VR
          </Button>
        </div>
      )}

      {isInVR && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 255, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10
          }}
        >
          🥽 VR Mode Active
        </div>
      )}
    </div>
  );
}

export default WebXRViewerV2;

