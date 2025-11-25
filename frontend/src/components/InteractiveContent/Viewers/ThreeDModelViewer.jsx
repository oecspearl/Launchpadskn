import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Html, Text } from '@react-three/drei';
import { Spinner, Alert } from 'react-bootstrap';
import * as THREE from 'three';

// Model loader component
function Model({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], onLoad, onError }) {
  const { scene, error } = useGLTF(url);
  const modelRef = useRef();

  useEffect(() => {
    if (scene) {
      // Apply scale, position, rotation
      scene.scale.set(scale, scale, scale);
      scene.position.set(...position);
      scene.rotation.set(...rotation);
      
      // Enable shadows
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      if (onLoad) onLoad(scene);
    }
  }, [scene, scale, position, rotation, onLoad]);

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  // Auto-rotate animation
  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.2;
    }
  });

  if (error) {
    return (
      <Html center>
        <Alert variant="danger">Failed to load model: {error.message}</Alert>
      </Html>
    );
  }

  return <primitive ref={modelRef} object={scene} />;
}

// Annotation component
function Annotation({ position, text, color = '#ff6b6b' }) {
  return (
    <Html position={position} center>
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '14px',
          pointerEvents: 'none',
          border: `2px solid ${color}`,
          whiteSpace: 'nowrap'
        }}
      >
        {text}
      </div>
    </Html>
  );
}

// Main 3D Viewer Component
function ThreeDModelViewer({
  contentUrl,
  modelFormat = 'GLTF',
  modelProperties = {},
  annotations = [],
  interactionMode = 'INTERACTIVE',
  onInteraction,
  onStateChange
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const controlsRef = useRef();
  const cameraRef = useRef();

  const {
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    autoRotate = true,
    enableZoom = true,
    enablePan = true,
    enableRotate = true
  } = modelProperties;

  const handleModelLoad = (scene) => {
    setIsLoading(false);
    setModelLoaded(true);
    
    // Calculate bounding box for camera positioning
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    if (cameraRef.current) {
      cameraRef.current.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
      );
      cameraRef.current.lookAt(center);
    }

    if (onStateChange) {
      onStateChange({
        cameraPosition: cameraRef.current?.position,
        modelCenter: center,
        modelSize: size
      });
    }
  };

  const handleModelError = (err) => {
    setIsLoading(false);
    setError(err.message || 'Failed to load 3D model');
  };

  const handleInteraction = (event) => {
    if (onInteraction && interactionMode === 'INTERACTIVE') {
      onInteraction({
        type: event.type,
        position: event.point,
        object: event.object?.name,
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!contentUrl) {
    return (
      <Alert variant="warning">
        No 3D model URL provided. Please configure the content URL in the database.
      </Alert>
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

      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Environment */}
        <Environment preset="sunset" />

        {/* Camera */}
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[5, 5, 5]}
          fov={50}
        />

        {/* 3D Model */}
        {contentUrl && (
          <Model
            url={contentUrl}
            scale={scale}
            position={position}
            rotation={rotation}
            onLoad={handleModelLoad}
            onError={handleModelError}
          />
        )}

        {/* Annotations */}
        {modelLoaded && annotations.map((annotation, index) => (
          <Annotation
            key={index}
            position={annotation.position || [0, 0, 0]}
            text={annotation.text || `Annotation ${index + 1}`}
            color={annotation.color || '#ff6b6b'}
          />
        ))}

        {/* Controls */}
        {modelLoaded && (
          <OrbitControls
            ref={controlsRef}
            enableZoom={enableZoom}
            enablePan={enablePan}
            enableRotate={enableRotate}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            minDistance={1}
            maxDistance={20}
            onChange={() => {
              if (cameraRef.current && onStateChange) {
                onStateChange({
                  cameraPosition: cameraRef.current.position.toArray(),
                  cameraRotation: cameraRef.current.rotation.toArray()
                });
              }
            }}
          />
        )}

        {/* Grid helper */}
        <gridHelper args={[10, 10]} />
      </Canvas>

      {/* Controls Info */}
      {modelLoaded && interactionMode === 'INTERACTIVE' && (
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
          <div>🖱️ Left Click + Drag: Rotate</div>
          <div>🖱️ Right Click + Drag: Pan</div>
          <div>🖱️ Scroll: Zoom</div>
        </div>
      )}
    </div>
  );
}

export default ThreeDModelViewer;

