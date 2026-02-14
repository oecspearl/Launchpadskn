import React, { useState, useEffect } from 'react';
import {
  Modal, Card, Row, Col, Form, Button, Badge, InputGroup,
  Spinner, Alert, Tabs, Tab
} from 'react-bootstrap';
import {
  FaSearch, FaCopy, FaSave, FaTrash, FaBook, FaTag, FaTimes
} from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContextSupabase';

function CurriculumTemplateManager({ show, onHide, offering, onSelectTemplate, onSaveTemplate }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    if (show) {
      loadTemplates();
    }
  }, [show]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('curriculum_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      // Show public templates and user's own templates
      if (user?.user_id) {
        query = query.or(`is_public.eq.true,created_by.eq.${user.user_id}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          console.warn('Templates table not created yet. Please run database migrations.');
          setTemplates([]);
          return;
        }
        throw error;
      }
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.template_name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleSaveAsTemplate = async (templateData) => {
    if (!offering || !user?.user_id) {
      throw new Error('User not authenticated or offering not available');
    }

    try {
      const { data, error } = await supabase
        .from('curriculum_templates')
        .insert({
          template_name: templateData.name,
          description: templateData.description,
          subject_id: offering.subject_id,
          form_id: offering.form_id,
          curriculum_structure: templateData.curriculum_structure,
          is_public: templateData.is_public || false,
          created_by: user.user_id,
          tags: templateData.tags || []
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Templates table not created yet. Please run database migrations first.');
        }
        throw error;
      }
      await loadTemplates();
      return data;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    if (!user?.user_id) {
      alert('User not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('curriculum_templates')
        .delete()
        .eq('template_id', templateId)
        .eq('created_by', user.user_id); // Only allow deleting own templates

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      // Increment usage count (function might not exist yet)
      const { error: rpcError } = await supabase.rpc('increment_template_usage', { 
        template_id: template.template_id 
      });
      
      if (rpcError) {
        console.warn('Could not increment template usage (function may not exist):', rpcError.message);
      }
      
      if (onSelectTemplate) {
        onSelectTemplate(template);
      }
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaBook className="me-2" />
          Curriculum Templates
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="browse" title="Browse Templates">
            <div className="mb-3">
              <Row>
                <Col md={9}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Button variant="primary" onClick={() => setActiveTab('save')}>
                    <FaSave className="me-1" />
                    Save Current as Template
                  </Button>
                </Col>
              </Row>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Alert variant="info">No templates found. Save one to get started!</Alert>
            ) : (
              <Row>
                {filteredTemplates.map((template) => (
                  <Col md={6} key={template.template_id} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5>{template.template_name}</h5>
                            {template.is_public && (
                              <Badge bg="success" className="me-2">Public</Badge>
                            )}
                            <Badge bg="info">Used {template.usage_count || 0} times</Badge>
                          </div>
                          {template.created_by === user?.user_id && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.template_id)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-muted mb-2">{template.description}</p>
                        )}
                        {template.tags && template.tags.length > 0 && (
                          <div className="mb-2">
                            {template.tags.map((tag, idx) => (
                              <Badge key={idx} bg="secondary" className="me-1">
                                <FaTag className="me-1" style={{ fontSize: '0.7rem' }} />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {template.subject_id && `Subject ID: ${template.subject_id}`}
                            {template.form_id && ` | Form ID: ${template.form_id}`}
                          </small>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <FaCopy className="me-1" />
                            Use Template
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>

          <Tab eventKey="save" title="Save Template">
            <TemplateSaver
              offering={offering}
              onSave={handleSaveAsTemplate}
              onSuccess={() => {
                setActiveTab('browse');
                loadTemplates();
              }}
            />
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

// Template Saver Component
function TemplateSaver({ offering, onSave, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offering?.curriculum_structure) {
      alert('No curriculum data to save as template');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        curriculum_structure: offering.curriculum_structure
      });
      onSuccess();
      setFormData({
        name: '',
        description: '',
        is_public: false,
        tags: []
      });
    } catch (error) {
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Template Name *</Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Form 1 Mathematics 2024-2025"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this template..."
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Make this template public (shareable with other users)"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Tags</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag and press Enter"
          />
          <Button variant="outline-secondary" onClick={handleAddTag}>
            Add
          </Button>
        </InputGroup>
        {formData.tags.length > 0 && (
          <div className="mt-2">
            {formData.tags.map((tag, idx) => (
              <Badge key={idx} bg="secondary" className="me-1">
                {tag}
                <FaTimes
                  className="ms-1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </Form.Group>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Template'}
      </Button>
    </Form>
  );
}

export default CurriculumTemplateManager;

