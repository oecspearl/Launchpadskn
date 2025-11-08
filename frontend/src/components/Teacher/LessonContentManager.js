import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Form, Modal, ListGroup, Badge
} from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { 
  FaUpload, FaFileAlt, FaLink, FaVideo, FaImage, 
  FaTrash, FaEdit, FaPlus, FaDownload
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function LessonContentManager() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [content, setContent] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [contentType, setContentType] = useState('FILE');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  useEffect(() => {
    if (lessonId) {
      fetchContent();
    }
  }, [lessonId]);
  
  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('upload_date', { ascending: false });
      
      if (fetchError) throw fetchError;
      setContent(data || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load lesson content');
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingContent(item);
      setContentType(item.content_type);
      setTitle(item.title || '');
      setUrl(item.url || '');
      setSelectedFile(null);
    } else {
      setEditingContent(null);
      setContentType('FILE');
      setTitle('');
      setUrl('');
      setSelectedFile(null);
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContent(null);
    setContentType('FILE');
    setTitle('');
    setUrl('');
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setUploading(true);
      
      let fileUrl = null;
      let filePath = null;
      let fileName = null;
      let fileSize = null;
      let mimeType = null;
      
      // Handle file upload if it's a FILE type
      if (contentType === 'FILE' && selectedFile) {
        const bucketName = 'course-content'; // Using existing bucket
        const timestamp = Date.now();
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        filePath = `lessons/${lessonId}/${timestamp}-${sanitizedFileName}`;
        
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
      } else if (contentType === 'FILE' && editingContent) {
        // Keep existing file info if editing and no new file
        fileUrl = editingContent.url;
        filePath = editingContent.file_path;
        fileName = editingContent.file_name;
        fileSize = editingContent.file_size;
        mimeType = editingContent.mime_type;
      }
      
      // Prepare content data
      const contentData = {
        lesson_id: parseInt(lessonId),
        content_type: contentType,
        title: title || (selectedFile ? selectedFile.name : 'Untitled'),
        url: contentType === 'LINK' ? url : fileUrl,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: user.user_id || user.userId
      };
      
      if (editingContent) {
        // Update existing content
        const { error: updateError } = await supabase
          .from('lesson_content')
          .update(contentData)
          .eq('content_id', editingContent.content_id);
        
        if (updateError) throw updateError;
        setSuccess('Content updated successfully');
      } else {
        // Create new content
        const { error: insertError } = await supabase
          .from('lesson_content')
          .insert(contentData);
        
        if (insertError) throw insertError;
        setSuccess('Content added successfully');
      }
      
      handleCloseModal();
      fetchContent();
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err.message || 'Failed to save content');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }
    
    try {
      // Get content to check if we need to delete file from storage
      const contentItem = content.find(c => c.content_id === contentId);
      
      // Delete from database
      const { error } = await supabase
        .from('lesson_content')
        .delete()
        .eq('content_id', contentId);
      
      if (error) throw error;
      
        // Delete file from storage if it exists
      if (contentItem?.file_path) {
        try {
          await supabase.storage
            .from('course-content')
            .remove([contentItem.file_path]);
        } catch (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }
      
      setSuccess('Content deleted successfully');
      fetchContent();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    }
  };
  
  const getContentIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return <FaVideo className="me-2" />;
      case 'IMAGE':
        return <FaImage className="me-2" />;
      case 'LINK':
        return <FaLink className="me-2" />;
      default:
        return <FaFileAlt className="me-2" />;
    }
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>Lesson Content Management</h4>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />
              Add Content
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {content.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No content added yet</p>
            <Button variant="primary" className="mt-3" onClick={() => handleOpenModal()}>
              Add First Content
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <h5 className="mb-0">Content Items ({content.length})</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              {content.map((item) => (
                <ListGroup.Item key={item.content_id} className="border-0 px-0 py-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        {getContentIcon(item.content_type)}
                        <h6 className="mb-0">{item.title}</h6>
                        <Badge bg="secondary" className="ms-2">{item.content_type}</Badge>
                      </div>
                      {item.file_name && (
                        <small className="text-muted d-block mb-1">
                          {item.file_name} {item.file_size && `(${formatFileSize(item.file_size)})`}
                        </small>
                      )}
                      {item.url && (
                        <small className="text-muted d-block">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                            {item.url.length > 50 ? item.url.substring(0, 50) + '...' : item.url}
                          </a>
                        </small>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {item.url && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          href={item.url}
                          target="_blank"
                        >
                          <FaDownload className="me-1" />
                          Open
                        </Button>
                      )}
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleOpenModal(item)}
                      >
                        <FaEdit className="me-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(item.content_id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}
      
      {/* Add/Edit Content Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContent ? 'Edit Content' : 'Add Content'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Content Type *</Form.Label>
              <Form.Select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  setSelectedFile(null);
                  setUrl('');
                }}
                required
              >
                <option value="FILE">File Upload</option>
                <option value="LINK">External Link</option>
                <option value="VIDEO">Video Link</option>
                <option value="IMAGE">Image Link</option>
                <option value="DOCUMENT">Document Link</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Content title"
                required
              />
            </Form.Group>
            
            {contentType === 'FILE' ? (
              <Form.Group className="mb-3">
                <Form.Label>File *</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  required={!editingContent}
                />
                {editingContent && !selectedFile && (
                  <Form.Text className="text-muted">
                    Current file: {editingContent.file_name || 'No file'}
                  </Form.Text>
                )}
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>URL *</Form.Label>
                <Form.Control
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={uploading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingContent ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                editingContent ? 'Update' : 'Add'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default LessonContentManager;

