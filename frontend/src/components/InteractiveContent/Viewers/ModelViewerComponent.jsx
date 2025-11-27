import React, { useEffect, useRef, useState } from 'react';
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

      const handleError = (e) => {
        console.error('Model viewer error:', e);
        setLoadError(e.detail?.message || 'Failed to load 3D model');
        if (onStateChange) {
          onStateChange({
            error: true,
            errorMessage: e.detail?.message || 'Failed to load 3D model'
          });
        }
      };

      viewer.addEventListener('load', handleLoad);
      viewer.addEventListener('progress', handleProgress);
      viewer.addEventListener('error', handleError);

      return () => {
        viewer.removeEventListener('load', handleLoad);
        viewer.removeEventListener('progress', handleProgress);
        viewer.removeEventListener('error', handleError);
      };
    }
  }, [onStateChange]);

  const [loadError, setLoadError] = useState(null);

  // Check if URL is an embed link or iframe src
  const isEmbedLink = contentUrl && (
    contentUrl.includes('/embed') ||
    contentUrl.includes('iframe') ||
    contentUrl.includes('embed/')
  );

  // Check if URL is a Sketchfab sharing link (not embed)
  const isSketchfabSharingLink = contentUrl && (
    (contentUrl.includes('sketchfab.com') && !contentUrl.includes('/embed')) ||
    contentUrl.includes('skfb.ly') ||
    (contentUrl.includes('sketchfab.io') && !contentUrl.includes('/embed'))
  );

  // Extract iframe src from embed code if it's a full HTML embed
  const extractIframeSrc = (url) => {
    // If it's already an embed URL, return as is
    if (url.includes('/embed') || url.startsWith('https://sketchfab.com/models/')) {
      // Convert Sketchfab model URL to embed URL
      if (url.includes('sketchfab.com/models/') && !url.includes('/embed')) {
        const modelIdMatch = url.match(/sketchfab\.com\/models\/([^\/\?]+)/);
        if (modelIdMatch) {
          return `https://sketchfab.com/models/${modelIdMatch[1]}/embed`;
        }
      }
      return url;
    }
    
    // Try to extract iframe src from HTML embed code
    const iframeMatch = url.match(/src=["']([^"']+)["']/);
    if (iframeMatch) {
      return iframeMatch[1];
    }
    
    return url;
  };

  if (!contentUrl) {
    return (
      <Alert variant="warning">
        No 3D model URL provided. Please configure the content URL in the database.
      </Alert>
    );
  }

  // Handle embed links (iframe)
  if (isEmbedLink || isSketchfabSharingLink) {
    const embedSrc = extractIframeSrc(contentUrl);
    
    // If it's a Sketchfab sharing link, try to convert to embed URL
    if (isSketchfabSharingLink && !embedSrc.includes('/embed')) {
      // Try to extract model ID from various Sketchfab URL formats
      const modelIdMatch = contentUrl.match(/(?:sketchfab\.com\/models\/|skfb\.ly\/)([^\/\?]+)/);
      if (modelIdMatch) {
        const embedUrl = `https://sketchfab.com/models/${modelIdMatch[1]}/embed`;
        return (
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
            <iframe
              src={embedUrl}
              title="3D Model"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          </div>
        );
      }
    }
    
    // Handle generic embed links
    if (isEmbedLink) {
      return (
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
          <iframe
            src={embedSrc}
            title="3D Model"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            allow="autoplay; fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
            allowFullScreen
          />
        </div>
      );
    }
    
    // Fallback for Sketchfab sharing links that can't be converted
    return (
      <Alert variant="info">
        <strong>Sketchfab Model Detected</strong>
        <p className="mb-2 mt-2">
          To use this Sketchfab model, please:
        </p>
        <ol className="mb-2">
          <li><strong>Get the embed URL:</strong> On the Sketchfab model page, click "Embed" and copy the iframe src URL</li>
          <li><strong>Or use the model page URL:</strong> Use the full Sketchfab model page URL (e.g., https://sketchfab.com/models/[model-id])</li>
          <li><strong>Or download and upload:</strong> Download the GLTF file and upload to Supabase Storage</li>
        </ol>
        <div className="mt-3">
          <a 
            href={contentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline-primary btn-sm me-2"
          >
            Open in Sketchfab
          </a>
          <small className="text-muted d-block mt-2">
            Current URL: {contentUrl}
          </small>
        </div>
      </Alert>
    );
  }

  if (loadError) {
    return (
      <Alert variant="danger">
        <strong>Error Loading 3D Model</strong>
        <p className="mb-2 mt-2">{loadError}</p>
        <p className="mb-2">Common causes:</p>
        <ul className="mb-2">
          <li>CORS restrictions (model must be hosted on a CORS-enabled server)</li>
          <li>Invalid file URL or file format</li>
          <li>Network connectivity issues</li>
        </ul>
        <div className="mt-3">
          <a 
            href={contentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline-primary btn-sm"
          >
            Try Opening Directly
          </a>
        </div>
      </Alert>
    );
  }

  // Allow custom height via props
  const containerHeight = modelProperties?.height || '600px';

  return (
    <div style={{ width: '100%', height: containerHeight, position: 'relative', background: '#1a1a1a' }}>
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

