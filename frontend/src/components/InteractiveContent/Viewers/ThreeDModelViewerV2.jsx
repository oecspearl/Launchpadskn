import React, { useRef, useEffect, useState } from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// Three.js-based 3D Model Viewer (React 19 compatible)
function ThreeDModelViewerV2({
  contentUrl,
  modelFormat = 'GLTF',
  modelProperties = {},
  annotations = [],
  interactionMode = 'INTERACTIVE',
  onInteraction,
  onStateChange
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const {
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    autoRotate = true,
    enableZoom = true,
    enablePan = true,
    enableRotate = true
  } = modelProperties;

  useEffect(() => {
    if (!containerRef.current || !contentUrl) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Load model
    const loader = getLoader(modelFormat);
    if (!loader) {
      setError(`Unsupported model format: ${modelFormat}`);
      setIsLoading(false);
      return;
    }

    loader.load(
      contentUrl,
      (object) => {
        // Apply transformations
        object.scale.set(scale, scale, scale);
        object.position.set(...position);
        object.rotation.set(...rotation);

        // Enable shadows
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(object);
        modelRef.current = object;

        // Calculate bounding box for camera positioning
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;

        camera.position.set(
          center.x + distance,
          center.y + distance,
          center.z + distance
        );
        camera.lookAt(center);

        setIsModelLoaded(true);
        setIsLoading(false);

        if (onStateChange) {
          onStateChange({
            cameraPosition: camera.position.toArray(),
            modelCenter: center.toArray(),
            modelSize: size.toArray()
          });
        }
      },
      (progress) => {
        // Loading progress
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
      },
      (err) => {
        setError(`Failed to load model: ${err.message}`);
        setIsLoading(false);
      }
    );

    // Orbit controls (simplified version)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationSpeed = 0.005;

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !enableRotate) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (modelRef.current) {
        modelRef.current.rotation.y += deltaX * rotationSpeed;
        modelRef.current.rotation.x += deltaY * rotationSpeed;
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e) => {
      if (!enableZoom) return;
      e.preventDefault();
      const zoomSpeed = 0.1;
      const zoom = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      camera.position.multiplyScalar(zoom);
    };

    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (autoRotate && modelRef.current && !isDragging) {
        modelRef.current.rotation.y += 0.005;
      }

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
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [contentUrl, modelFormat, scale, position, rotation, autoRotate, enableZoom, enableRotate, onStateChange]);

  const getLoader = (format) => {
    switch (format?.toUpperCase()) {
      case 'GLTF':
      case 'GLB':
        return new GLTFLoader();
      case 'OBJ':
        return new OBJLoader();
      case 'FBX':
        // FBXLoader requires additional setup, fallback to GLTF
        console.warn('FBX format not fully supported, using GLTF loader');
        return new GLTFLoader();
      default:
        return new GLTFLoader();
    }
  };

  if (!contentUrl) {
    return (
      <Alert variant="warning">
        No 3D model URL provided. Please configure the content URL in the database.
      </Alert>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', background: '#1a1a1a' }}>
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
          <p className="text-light mt-2">Loading 3D model...</p>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: enableRotate ? 'grab' : 'default'
        }}
      />

      {isModelLoaded && interactionMode === 'INTERACTIVE' && (
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
          <div>🖱️ Left Click + Drag: Rotate</div>
          <div>🖱️ Scroll: Zoom</div>
        </div>
      )}
    </div>
  );
}

export default ThreeDModelViewerV2;

