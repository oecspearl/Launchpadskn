import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-bootstrap';

// Google Model Viewer Component (React 19 compatible)
// Uses @google/model-viewer web component
function ModelViewerComponent({
  contentUrl,
  modelFormat = 'GLTF',
  modelProperties = {},
  annotations = [],
  onInteraction,
  onStateChange
}) {
  const modelViewerRef = useRef(null);

  const {
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    autoRotate = true,
    cameraControls = true,
    exposure = 1,
    shadowIntensity = 1
  } = modelProperties;

  useEffect(() => {
    // Load model-viewer web component if not already loaded
    if (typeof window !== 'undefined' && !window.customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (modelViewerRef.current && onStateChange) {
      const viewer = modelViewerRef.current;
      
      const handleLoad = () => {
        onStateChange({
          loaded: true,
          cameraOrbit: viewer.getCameraOrbit(),
          cameraTarget: viewer.getCameraTarget()
        });
      };

      const handleProgress = (e) => {
        onStateChange({
          progress: e.detail.totalProgress
        });
      };

      viewer.addEventListener('load', handleLoad);
      viewer.addEventListener('progress', handleProgress);

      return () => {
        viewer.removeEventListener('load', handleLoad);
        viewer.removeEventListener('progress', handleProgress);
      };
    }
  }, [onStateChange]);

  if (!contentUrl) {
    return (
      <Alert variant="warning">
        No 3D model URL provided. Please configure the content URL in the database.
      </Alert>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', background: '#1a1a1a' }}>
      <model-viewer
        ref={modelViewerRef}
        src={contentUrl}
        alt="3D Model"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a'
        }}
        camera-controls={cameraControls}
        auto-rotate={autoRotate}
        auto-rotate-delay={0}
        rotation-per-second="30deg"
        interaction-policy="allow-when-focused"
        exposure={exposure}
        shadow-intensity={shadowIntensity}
        environment-image="neutral"
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        ar-placement="floor"
        loading="auto"
        reveal="auto"
        tone-mapping="commerce"
        interaction-prompt="none"
        camera-orbit={`${position[0]}deg ${position[1]}deg ${position[2]}m`}
        field-of-view="45deg"
        min-camera-orbit="auto auto auto"
        max-camera-orbit="auto auto auto"
        min-field-of-view="10deg"
        max-field-of-view="45deg"
      >
        {/* Annotations */}
        {annotations.map((annotation, index) => (
          <button
            key={index}
            slot={`hotspot-${index}`}
            data-position={annotation.position?.join(' ') || '0 0 0'}
            data-normal={annotation.normal?.join(' ') || '1 0 0'}
            data-visibility-attribute="visible"
            style={{
              backgroundColor: annotation.color || '#ff6b6b',
              border: '2px solid white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (onInteraction) {
                onInteraction({
                  type: 'annotation_click',
                  annotation: annotation.text,
                  index
                });
              }
            }}
          >
            <div className="annotation-tooltip">{annotation.text}</div>
          </button>
        ))}
      </model-viewer>

      <style>{`
        model-viewer {
          --poster-color: transparent;
        }
        .annotation-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }
        button[slot^="hotspot-"]:hover .annotation-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default ModelViewerComponent;

