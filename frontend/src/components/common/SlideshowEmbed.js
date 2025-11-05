import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaExpand, FaCompress, FaExternalLinkAlt } from 'react-icons/fa';

/**
 * Component to embed slide shows from various platforms
 * Supports: Google Slides, PowerPoint Online, Slideshare, Canva, etc.
 */
function SlideshowEmbed({ url, title, onError }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      return;
    }

    try {
      const converted = convertToEmbedUrl(url);
      if (converted) {
        setEmbedUrl(converted);
        setError(null);
      } else {
        setError('Unsupported slide show URL. Please use Google Slides, PowerPoint Online, or another supported platform.');
      }
    } catch (err) {
      console.error('Error converting URL:', err);
      setError('Failed to process slide show URL');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [url, onError]);

  /**
   * Convert various slide show URLs to embeddable format
   */
  const convertToEmbedUrl = (originalUrl) => {
    if (!originalUrl) return null;

    // Google Slides
    // Format: https://docs.google.com/presentation/d/PRESENTATION_ID/edit
    // Embed: https://docs.google.com/presentation/d/PRESENTATION_ID/preview
    const googleSlidesMatch = originalUrl.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (googleSlidesMatch) {
      const presentationId = googleSlidesMatch[1];
      return `https://docs.google.com/presentation/d/${presentationId}/preview?usp=sharing&embedded=true`;
    }

    // PowerPoint Online (Office 365)
    // Format: https://[tenant].sharepoint.com/... or https://onedrive.live.com/...
    // Embed: Convert to /embed format
    if (originalUrl.includes('sharepoint.com') || originalUrl.includes('onedrive.live.com')) {
      // For SharePoint/OneDrive, we need to convert to embed format
      // This is a simplified version - may need adjustment based on actual URLs
      if (originalUrl.includes('/edit')) {
        return originalUrl.replace('/edit', '/embed');
      }
      if (!originalUrl.includes('/embed')) {
        // Try to add embed path
        const urlObj = new URL(originalUrl);
        const pathParts = urlObj.pathname.split('/');
        // Insert 'embed' before the last part
        if (pathParts.length > 1) {
          pathParts.splice(pathParts.length - 1, 0, 'embed');
          urlObj.pathname = pathParts.join('/');
          return urlObj.toString();
        }
      }
      return originalUrl;
    }

    // PowerPoint Online (direct link)
    if (originalUrl.includes('powerpoint.office.com') || originalUrl.includes('office.com/')) {
      if (!originalUrl.includes('/embed')) {
        return originalUrl.replace('/view', '/embed').replace('/edit', '/embed');
      }
      return originalUrl;
    }

    // Slideshare
    // Format: https://www.slideshare.net/username/presentation-title
    // Embed: https://www.slideshare.net/slideshow/embed_code/key/...
    if (originalUrl.includes('slideshare.net')) {
      // Extract slide ID or use the full URL
      // Slideshare requires a different format - may need to extract embed code
      // For now, try to use the URL directly
      return originalUrl;
    }

    // Canva
    // Format: https://www.canva.com/design/...
    // Embed: Requires embed code, but we can try to use the view URL
    if (originalUrl.includes('canva.com')) {
      // Canva presentations need to be published with embed code
      // For now, we'll try to use the view URL
      return originalUrl;
    }

    // Prezi
    if (originalUrl.includes('prezi.com')) {
      // Prezi uses embed URLs
      if (originalUrl.includes('/view/')) {
        return originalUrl.replace('/view/', '/embed/');
      }
      return originalUrl;
    }

    // If URL already looks like an embed URL, use it
    if (originalUrl.includes('/embed') || originalUrl.includes('iframe')) {
      return originalUrl;
    }

    return null;
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading slide show...</span>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3 border-warning">
        <Card.Body>
          <Alert variant="warning" className="mb-2">
            <strong>Unable to embed slide show:</strong> {error}
          </Alert>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleOpenInNewTab}
          >
            <FaExternalLinkAlt className="me-2" />
            Open in New Tab
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (!embedUrl) {
    return (
      <Card className="mb-3 border-secondary">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">{title || 'Slide Show'}</h6>
              <small className="text-muted">Unsupported format - opening in new tab</small>
            </div>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleOpenInNewTab}
            >
              <FaExternalLinkAlt className="me-2" />
              Open
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={`mb-3 ${isFullscreen ? 'position-fixed top-0 start-0 w-100 h-100' : ''}`} style={isFullscreen ? { zIndex: 9999 } : {}}>
      <Card.Header className="bg-white border-0 py-2 d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{title || 'Slide Show'}</h6>
        <div>
          <Button
            variant="link"
            size="sm"
            className="p-1"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-1"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <FaExternalLinkAlt />
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="p-0" style={isFullscreen ? { height: 'calc(100vh - 80px)' } : {}}>
        <div 
          style={{ 
            position: 'relative',
            paddingBottom: isFullscreen ? '0' : '56.25%', // 16:9 aspect ratio
            height: isFullscreen ? '100%' : 0,
            overflow: 'hidden'
          }}
        >
          <iframe
            src={embedUrl}
            title={title || 'Slide Show'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: isFullscreen ? '100%' : '100%',
              border: 'none'
            }}
            allowFullScreen
            allow="fullscreen"
            loading="lazy"
          />
        </div>
      </Card.Body>
    </Card>
  );
}

export default SlideshowEmbed;

