import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Html, VRButton } from '@react-three/drei';
import { Button, Alert, Spinner } from 'react-bootstrap';
import * as THREE from 'three';

// VR Scene Component
function VRScene({ contentUrl, sceneConfig = {}, onStateChange }) {
  const { scene, error } = useGLTF(contentUrl);
  const sceneRef = useRef();
  const { gl, camera } = useThree();
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    if (scene) {
      scene.scale.set(
        sceneConfig.scale || 1,
        sceneConfig.scale || 1,
        sceneConfig.scale || 1
      );
      scene.position.set(
        sceneConfig.position?.[0] || 0,
        sceneConfig.position?.[1] || 0,
        sceneConfig.position?.[2] || 0
      );

      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      if (sceneRef.current) {
        sceneRef.current.add(scene);
      }
    }
  }, [scene, sceneConfig]);

  // VR session handling
  useEffect(() => {
    const handleVRSessionStart = () => setIsInVR(true);
    const handleVRSessionEnd = () => setIsInVR(false);

    if (gl.xr) {
      gl.xr.addEventListener('sessionstart', handleVRSessionStart);
      gl.xr.addEventListener('sessionend', handleVRSessionEnd);
    }

    return () => {
      if (gl.xr) {
        gl.xr.removeEventListener('sessionstart', handleVRSessionStart);
        gl.xr.removeEventListener('sessionend', handleVRSessionEnd);
      }
    };
  }, [gl]);

  useFrame(() => {
    if (onStateChange && camera) {
      onStateChange({
        cameraPosition: camera.position.toArray(),
        cameraRotation: camera.rotation.toArray(),
        isInVR
      });
    }
  });

  if (error) {
    return (
      <Html center>
        <Alert variant="danger">Failed to load VR scene: {error.message}</Alert>
      </Html>
    );
  }

  return <group ref={sceneRef} />;
}

// Main WebXR Viewer Component
function WebXRViewer({
  contentUrl,
  sceneConfig = {},
  onInteraction,
  onStateChange,
  onVREnter,
  onVRExit
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vrSupported, setVRSupported] = useState(false);
  const [arSupported, setARSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);
  const glRef = useRef();

  useEffect(() => {
    // Check WebXR support
    const checkWebXRSupport = async () => {
      if (navigator.xr) {
        try {
          const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
          const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
          setVRSupported(vrSupported);
          setARSupported(arSupported);
        } catch (err) {
          console.error('WebXR check failed:', err);
        }
      }
    };

    checkWebXRSupport();
  }, []);

  const handleVREnter = () => {
    setIsInVR(true);
    if (onVREnter) onVREnter();
  };

  const handleVRExit = () => {
    setIsInVR(false);
    if (onVRExit) onVRExit();
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

      <Canvas
        ref={glRef}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          glRef.current = gl;
          setIsLoading(false);
        }}
        camera={{ position: [0, 1.6, 3], fov: 75 }}
      >
        {/* VR Button */}
        {vrSupported && (
          <VRButton
            onSessionStart={handleVREnter}
            onSessionEnd={handleVRExit}
            sessionInit={{
              optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
            }}
          />
        )}

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Environment */}
        <Environment preset="sunset" />

        {/* VR Scene */}
        {contentUrl && (
          <VRScene
            contentUrl={contentUrl}
            sceneConfig={sceneConfig}
            onStateChange={onStateChange}
          />
        )}

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#808080" />
        </mesh>
      </Canvas>

      {/* VR Status */}
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

      {/* Instructions */}
      {!isInVR && (
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
          {vrSupported ? (
            <>
              <div>🥽 Click the VR button to enter VR mode</div>
              <div>🖱️ Use mouse to look around in desktop mode</div>
            </>
          ) : (
            <div>WebXR VR is not supported in this browser</div>
          )}
        </div>
      )}
    </div>
  );
}

export default WebXRViewer;

