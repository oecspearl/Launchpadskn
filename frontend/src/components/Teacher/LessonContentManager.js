import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, ListGroup, Badge } from 'react-bootstrap';
import { FaPlus, FaTrash, FaFilePowerpoint, FaLink } from 'react-icons/fa';
import { supabase } from '../../config/supabase';

/**
 * Component to manage lesson content (especially slide shows)
 * Can be used when creating or editing a lesson
 */
function LessonContentManager({ lessonId, onContentAdded, onContentRemoved }) {
  const [contentItems, setContentItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    url: '',
    content_type: 'SLIDESHOW'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId) {
      fetchContent();
    }
  }, [lessonId]);

  const fetchContent = async () => {
    if (!lessonId) return;
    
    try {
      const { data, error } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      setContentItems(data || []);
    } catch (err) {
      console.error('Error fetching lesson content:', err);
    }
  };

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.url) {
      setError('Please provide both title and URL');
      return;
    }

    // Validate URL
    try {
      new URL(newContent.url);
    } catch {
      setError('Please provide a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If lessonId exists, save to database immediately
      if (lessonId) {
        const { data, error } = await supabase
          .from('lesson_content')
          .insert({
            lesson_id: lessonId,
            content_type: newContent.content_type,
            title: newContent.title,
            url: newContent.url
          })
          .select()
          .single();

        if (error) throw error;

        setContentItems([data, ...contentItems]);
        if (onContentAdded) onContentAdded(data);
      } else {
        // If lesson doesn't exist yet, just add to local state
        // The parent component will handle saving when lesson is created
        const tempContent = {
          ...newContent,
          content_id: `temp-${Date.now()}`,
          upload_date: new Date().toISOString()
        };
        setContentItems([tempContent, ...contentItems]);
        if (onContentAdded) onContentAdded(tempContent);
      }

      // Reset form
      setNewContent({
        title: '',
        url: '',
        content_type: 'SLIDESHOW'
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding content:', err);
      setError(err.message || 'Failed to add content');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to remove this content?')) {
      return;
    }

    try {
      // If it's a real database entry
      if (lessonId && !contentId.toString().startsWith('temp-')) {
        const { error } = await supabase
          .from('lesson_content')
          .delete()
          .eq('content_id', contentId);

        if (error) throw error;
      }

      setContentItems(contentItems.filter(item => item.content_id !== contentId));
      if (onContentRemoved) onContentRemoved(contentId);
    } catch (err) {
      console.error('Error removing content:', err);
      setError(err.message || 'Failed to remove content');
    }
  };

  const detectContentType = (url) => {
    if (!url) return 'LINK';
    
    if (url.includes('docs.google.com/presentation')) {
      return 'SLIDESHOW';
    }
    if (url.includes('powerpoint') || url.includes('office.com')) {
      return 'PRESENTATION';
    }
    if (url.includes('slideshare') || url.includes('canva.com') || url.includes('prezi.com')) {
      return 'SLIDESHOW';
    }
    return 'LINK';
  };

  const handleUrlChange = (url) => {
    setNewContent({
      ...newContent,
      url: url,
      content_type: detectContentType(url)
    });
  };

  // Get pending content items (temporary ones that haven't been saved)
  const getPendingContent = () => {
    return contentItems.filter(item => item.content_id?.toString().startsWith('temp-'));
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <FaFilePowerpoint className="me-2" />
          Lesson Content & Slide Shows
        </h6>
        {!showAddForm && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <FaPlus className="me-1" />
            Add Content
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {showAddForm && (
          <div className="mb-3 p-3 border rounded">
            <h6 className="mb-3">Add Slide Show or Content Link</h6>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Introduction to Algebra Slides"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://docs.google.com/presentation/d/..."
                value={newContent.url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <Form.Text className="text-muted">
                Supported: Google Slides, PowerPoint Online, Slideshare, Canva, Prezi
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content Type</Form.Label>
              <Form.Select
                value={newContent.content_type}
                onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value })}
              >
                <option value="SLIDESHOW">Slide Show (will be embedded)</option>
                <option value="PRESENTATION">Presentation (will be embedded)</option>
                <option value="LINK">Link (opens in new tab)</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddContent}
                disabled={loading || !newContent.title || !newContent.url}
              >
                {loading ? 'Adding...' : 'Add Content'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewContent({ title: '', url: '', content_type: 'SLIDESHOW' });
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {contentItems.length > 0 ? (
          <ListGroup variant="flush">
            {contentItems.map((item) => (
              <ListGroup.Item key={item.content_id} className="px-0 py-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      {(item.content_type === 'SLIDESHOW' || item.content_type === 'PRESENTATION') ? (
                        <FaFilePowerpoint className="me-2 text-primary" />
                      ) : (
                        <FaLink className="me-2 text-secondary" />
                      )}
                      <strong>{item.title}</strong>
                      <Badge bg="secondary" className="ms-2">
                        {item.content_type}
                      </Badge>
                      {item.content_id?.toString().startsWith('temp-') && (
                        <Badge bg="warning" className="ms-2">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted text-break">{item.url}</small>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveContent(item.content_id)}
                    className="ms-2"
                  >
                    <FaTrash />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <div className="text-center text-muted py-3">
            <p className="mb-0">No content added yet</p>
            <small>Click "Add Content" to add slide shows or links</small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default LessonContentManager;

