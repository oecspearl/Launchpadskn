import React, { useRef, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { FaCamera, FaDownload } from 'react-icons/fa';

// AR Viewer Component using AR.js or WebXR AR
function ARViewer({
  contentUrl,
  arMarkerUrl,
  modelFormat = 'GLTF',
  platform = 'WEBXR',
  onInteraction,
  onStateChange
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arSupported, setARSupported] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Check AR support
    const checkARSupport = async () => {
      if (navigator.xr) {
        try {
          const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
          setARSupported(arSupported);
        } catch (err) {
          console.error('AR check failed:', err);
        }
      }
    };

    checkARSupport();
    setIsLoading(false);
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Stop stream after getting permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError('Camera permission denied. Please allow camera access to use AR.');
      setCameraPermission(false);
    }
  };

  const startAR = async () => {
    if (!arSupported) {
      setError('AR is not supported in this browser. Try Chrome on Android or Safari on iOS.');
      return;
    }

    if (!cameraPermission) {
      await requestCameraPermission();
    }

    try {
      // For WebXR AR
      if (navigator.xr && platform === 'WEBXR') {
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['local-floor'],
          optionalFeatures: ['dom-overlay', 'hand-tracking']
        });

        setIsARActive(true);
        if (onStateChange) {
          onStateChange({ arActive: true, session });
        }
      } else {
        // Fallback: Use AR.js or show instructions
        setError('WebXR AR not available. Please use a compatible browser or device.');
      }
    } catch (err) {
      setError(`Failed to start AR: ${err.message}`);
    }
  };

  const stopAR = () => {
    setIsARActive(false);
    if (onStateChange) {
      onStateChange({ arActive: false });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Initializing AR...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', background: '#000' }}>
      {/* Camera Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isARActive ? 'block' : 'none'
        }}
      />

      {/* Canvas for AR Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
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
              : 'Start AR to overlay 3D content on your camera view'}
          </p>

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

          <div>
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

          {!arSupported && (
            <Alert variant="warning" className="mt-3">
              <small>
                AR requires a compatible browser and device. Try Chrome on Android or Safari on iOS.
              </small>
            </Alert>
          )}
        </div>
      )}

      {/* AR Active State */}
      {isARActive && (
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
            <div>📱 Point camera at AR marker</div>
            <div>👆 Tap to interact with 3D model</div>
          </div>
        </>
      )}

      {/* Instructions */}
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

export default ARViewer;

