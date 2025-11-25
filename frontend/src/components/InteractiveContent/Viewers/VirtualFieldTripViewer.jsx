import React, { useState, useEffect, useRef } from 'react';
import { Alert, Button, Spinner, Card } from 'react-bootstrap';
import { FaMapMarkerAlt, FaArrowLeft, FaArrowRight, FaExpand } from 'react-icons/fa';

// Virtual Field Trip Viewer Component
function VirtualFieldTripViewer({
  virtualTourUrl,
  locationName,
  locationCoordinates,
  scenes = [],
  onStateChange,
  onInteraction
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentScene: currentSceneIndex,
        location: locationName,
        coordinates: locationCoordinates
      });
    }
  }, [currentSceneIndex, locationName, locationCoordinates, onStateChange]);

  const handleNextScene = () => {
    if (scenes.length > 0) {
      setCurrentSceneIndex((prev) => (prev + 1) % scenes.length);
    }
  };

  const handlePreviousScene = () => {
    if (scenes.length > 0) {
      setCurrentSceneIndex((prev) => (prev - 1 + scenes.length) % scenes.length);
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current?.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current?.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading virtual tour...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // If we have a virtual tour URL (e.g., Google Street View, Matterport, etc.)
  if (virtualTourUrl) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          position: 'relative',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <iframe
          ref={iframeRef}
          src={virtualTourUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allowFullScreen
          title={`Virtual Tour: ${locationName}`}
          onLoad={() => setIsLoading(false)}
        />

        {/* Overlay Controls */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10
          }}
        >
          <Button
            variant="light"
            size="sm"
            onClick={handleFullscreen}
            className="me-2"
          >
            <FaExpand />
          </Button>
        </div>

        {locationName && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              zIndex: 10
            }}
          >
            <FaMapMarkerAlt className="me-2" />
            <strong>{locationName}</strong>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Custom 360° viewer with scenes
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        position: 'relative',
        background: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {currentScene ? (
        <>
          {/* 360° Image/Video */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: currentScene.imageUrl
                ? `url(${currentScene.imageUrl})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {!currentScene.imageUrl && (
              <div className="text-center text-white">
                <FaMapMarkerAlt size={64} className="mb-3" />
                <h5>{currentScene.name || 'Scene'}</h5>
                <p>360° image would be displayed here</p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {scenes.length > 1 && (
            <>
              <Button
                variant="light"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10
                }}
                onClick={handlePreviousScene}
              >
                <FaArrowLeft />
              </Button>
              <Button
                variant="light"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10
                }}
                onClick={handleNextScene}
              >
                <FaArrowRight />
              </Button>
            </>
          )}

          {/* Scene Info */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              zIndex: 10
            }}
          >
            {scenes.length > 1 && (
              <span className="me-3">
                Scene {currentSceneIndex + 1} of {scenes.length}
              </span>
            )}
            <strong>{currentScene.name || locationName}</strong>
          </div>

          {/* Fullscreen Button */}
          <Button
            variant="light"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10
            }}
            onClick={handleFullscreen}
          >
            <FaExpand />
          </Button>
        </>
      ) : (
        <div className="text-center text-white py-5">
          <FaMapMarkerAlt size={64} className="mb-3" />
          <h5>Virtual Field Trip</h5>
          <p>{locationName || 'No location specified'}</p>
          <Alert variant="info" className="mt-3">
            Configure virtual tour URL or scenes in the database to view the field trip.
          </Alert>
        </div>
      )}
    </div>
  );
}

export default VirtualFieldTripViewer;

