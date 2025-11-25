import React, { useState } from 'react';
import {
  Container, Card, Button, Form, Table, Modal, Alert, Badge, Spinner
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCube, FaUpload } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import interactiveContentService from '../../services/interactiveContentService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';

function ARVRContentManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    content_name: '',
    description: '',
    content_type: '3D_MODEL',
    content_url: '',
    model_format: 'GLTF',
    subject_id: '',
    class_subject_id: '',
    difficulty_level: 'MEDIUM',
    estimated_duration_minutes: 15,
    model_properties: {
      scale: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      autoRotate: true,
      cameraControls: true,
      exposure: 1,
      shadowIntensity: 1
    },
    annotations: []
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('subject_id, subject_name')
        .order('subject_name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch AR/VR content
  const { data: content = [], isLoading } = useQuery({
    queryKey: ['arvr-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arvr_content')
        .select('*, subjects:subject_id (subject_name)')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          setError('The arvr_content table does not exist. Please run the database migration script: database/add-interactive-content-tables.sql');
          return [];
        }
        throw error;
      }
      return data || [];
    },
    onError: (err) => {
      if (err.code === '42P01') {
        setError('Database table not found. Please run: database/add-interactive-content-tables.sql in Supabase SQL Editor.');
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Clean up data: convert empty strings to null for optional fields
      const cleanedData = {
        content_name: data.content_name,
        description: data.description || null,
        content_type: data.content_type,
        content_url: data.content_url || null,
        model_format: data.model_format || null,
        platform: data.platform || null,
        subject_id: data.subject_id && data.subject_id !== '' ? parseInt(data.subject_id) : null,
        class_subject_id: data.class_subject_id && data.class_subject_id !== '' ? parseInt(data.class_subject_id) : null,
        difficulty_level: data.difficulty_level || null,
        estimated_duration_minutes: data.estimated_duration_minutes || null,
        model_properties: data.model_properties || {},
        annotations: data.annotations || [],
        created_by: user?.user_id
      };

      const { data: result, error } = await supabase
        .from('arvr_content')
        .insert(cleanedData)
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['arvr-content-all']);
      setShowModal(false);
      resetForm();
      setSuccess('3D model added successfully!');
      setError(null);
    },
    onError: (err) => {
      console.error('Create error:', err);
      setError(err.message || 'Failed to create 3D model. Make sure the arvr_content table exists in the database.');
      setSuccess(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('arvr_content')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('content_id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['arvr-content-all']);
      setShowModal(false);
      setEditingContent(null);
      resetForm();
      setSuccess('3D model updated successfully!');
      setError(null);
    },
    onError: (err) => {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update 3D model.');
      setSuccess(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('arvr_content')
        .delete()
        .eq('content_id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['arvr-content-all']);
    }
  });

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Check if bucket exists, create if not
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      const bucketExists = buckets?.some(b => b.id === '3d-models');
      if (!bucketExists) {
        // Try to create bucket (requires admin privileges)
        const { error: createError } = await supabase.storage.createBucket('3d-models', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['model/gltf-binary', 'model/gltf+json', 'model/obj', 'model/usd']
        });
        
        if (createError) {
          console.warn('Could not create bucket automatically:', createError);
          alert('Storage bucket not set up. Please run the setup script in Supabase SQL Editor or use an external CDN URL.');
          setUploading(false);
          return;
        }
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('3d-models')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('3d-models')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, content_url: publicUrl }));
      setShowUploadModal(false);
      setUploading(false);
      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message + '\n\nTip: You can also use an external CDN URL instead.');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      content_name: '',
      description: '',
      content_type: '3D_MODEL',
      content_url: '',
      model_format: 'GLTF',
      subject_id: '',
      class_subject_id: '',
      difficulty_level: 'MEDIUM',
      estimated_duration_minutes: 15,
      model_properties: {
        scale: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        autoRotate: true,
        cameraControls: true,
        exposure: 1,
        shadowIntensity: 1
      },
      annotations: []
    });
    setEditingContent(null);
  };

  const handleEdit = (item) => {
    setEditingContent(item);
    setFormData({
      content_name: item.content_name || '',
      description: item.description || '',
      content_type: item.content_type || '3D_MODEL',
      content_url: item.content_url || '',
      model_format: item.model_format || 'GLTF',
      subject_id: item.subject_id || '',
      class_subject_id: item.class_subject_id || '',
      difficulty_level: item.difficulty_level || 'MEDIUM',
      estimated_duration_minutes: item.estimated_duration_minutes || 15,
      model_properties: item.model_properties || {
        scale: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        autoRotate: true,
        cameraControls: true,
        exposure: 1,
        shadowIntensity: 1
      },
      annotations: item.annotations || []
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingContent) {
      updateMutation.mutate({ id: editingContent.content_id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaCube className="me-2" />
          AR/VR Content Management
        </h2>
        <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FaPlus className="me-2" />
          Add 3D Model
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <strong>Error:</strong> {error}
          {error.includes('table') && (
            <div className="mt-2">
              <small>
                Run this SQL script in Supabase SQL Editor: <code>database/add-interactive-content-tables.sql</code>
              </small>
            </div>
          )}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          {success}
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Subject</th>
                  <th>URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <p className="text-muted">No AR/VR content yet. Click "Add 3D Model" to get started.</p>
                    </td>
                  </tr>
                ) : (
                  content.map((item) => (
                    <tr key={item.content_id}>
                      <td>{item.content_name}</td>
                      <td>
                        <Badge bg={
                          item.content_type === '3D_MODEL' ? 'primary' :
                          item.content_type === 'VR_EXPERIENCE' ? 'warning' :
                          item.content_type === 'AR_OVERLAY' ? 'info' : 'success'
                        }>
                          {item.content_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>{item.model_format || 'N/A'}</td>
                      <td>{item.subjects?.subject_name || 'All'}</td>
                      <td>
                        <a href={item.content_url} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {item.content_url}
                        </a>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(item)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item.content_id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContent ? 'Edit' : 'Add'} AR/VR Content
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Content Name *</Form.Label>
              <Form.Control
                type="text"
                value={formData.content_name}
                onChange={(e) => setFormData({ ...formData, content_name: e.target.value })}
                required
                placeholder="e.g., Human Heart 3D Model"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the 3D model or experience"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content Type *</Form.Label>
              <Form.Select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                required
              >
                <option value="3D_MODEL">3D Model</option>
                <option value="VR_EXPERIENCE">VR Experience</option>
                <option value="AR_OVERLAY">AR Overlay</option>
                <option value="FIELD_TRIP">Virtual Field Trip</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Model URL *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="url"
                  value={formData.content_url}
                  onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                  required
                  placeholder="https://cdn.example.com/models/model.gltf"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FaUpload className="me-1" />
                  Upload
                </Button>
              </div>
              <Form.Text className="text-muted">
                URL to your 3D model file (GLTF, OBJ, etc.) or use Upload button for Supabase Storage
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Model Format</Form.Label>
              <Form.Select
                value={formData.model_format}
                onChange={(e) => setFormData({ ...formData, model_format: e.target.value })}
              >
                <option value="GLTF">GLTF</option>
                <option value="GLB">GLB</option>
                <option value="OBJ">OBJ</option>
                <option value="USDZ">USDZ</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value || null })}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Difficulty Level</Form.Label>
              <Form.Select
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EXPERT">Expert</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estimated Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 15 })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Scale</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formData.model_properties.scale}
                onChange={(e) => setFormData({
                  ...formData,
                  model_properties: {
                    ...formData.model_properties,
                    scale: parseFloat(e.target.value) || 1
                  }
                })}
              />
              <Form.Text className="text-muted">1.0 = original size, 2.0 = double size</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Auto Rotate"
                checked={formData.model_properties.autoRotate}
                onChange={(e) => setFormData({
                  ...formData,
                  model_properties: {
                    ...formData.model_properties,
                    autoRotate: e.target.checked
                  }
                })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editingContent ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload 3D Model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploading ? (
            <div>
              <p>Uploading... {uploadProgress}%</p>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <Form>
              <Form.Group>
                <Form.Label>Select 3D Model File</Form.Label>
                <Form.Control
                  type="file"
                  accept=".gltf,.glb,.obj,.usdz"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                />
                <Form.Text className="text-muted">
                  Supported formats: GLTF, GLB, OBJ, USDZ (Max 50MB)
                </Form.Text>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ARVRContentManager;

