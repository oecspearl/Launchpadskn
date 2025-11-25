import React, { useState, useEffect } from 'react';
import {
  Modal, Card, Row, Col, Form, Button, Badge, InputGroup,
  Dropdown, Spinner, Alert, Tabs, Tab
} from 'react-bootstrap';
import {
  FaSearch, FaFilter, FaLink, FaVideo, FaGamepad, FaFileAlt,
  FaPlus, FaExternalLinkAlt, FaStar, FaTag
} from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContextSupabase';

function ResourceLibrary({ show, onHide, offering, onSelectResource }) {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    if (show) {
      loadResources();
    }
  }, [show]);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, filterType, filterSubject]);

  const loadResources = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('curriculum_resources')
        .select('*')
        .order('usage_count', { ascending: false });

      // Filter by subject if offering is provided
      if (offering?.subject_id) {
        query = query.or(`subject_id.eq.${offering.subject_id},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          console.warn('Resource library table not created yet. Please run database migrations.');
          setResources([]);
          return;
        }
        throw error;
      }
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(r => r.resource_type === filterType);
    }

    // Filter by subject
    if (filterSubject) {
      filtered = filtered.filter(r => r.subject_id === filterSubject);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredResources(filtered);
  };

  const handleCreateResource = async (resourceData) => {
    if (!user?.user_id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('curriculum_resources')
        .insert({
          ...resourceData,
          created_by: user.user_id,
          subject_id: offering?.subject_id
        })
        .select()
        .single();

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          throw new Error('Resource library tables not created yet. Please run database migrations first.');
        }
        throw error;
      }
      await loadResources();
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'VIDEO': return <FaVideo />;
      case 'GAME': return <FaGamepad />;
      case 'LINK': return <FaLink />;
      default: return <FaFileAlt />;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaLink className="me-2" />
          Resource Library
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="browse" title="Browse Resources">
            <div className="mb-3">
              <Row>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="VIDEO">Videos</option>
                    <option value="LINK">Links</option>
                    <option value="GAME">Games</option>
                    <option value="WORKSHEET">Worksheets</option>
                    <option value="DOCUMENT">Documents</option>
                    <option value="ACTIVITY">Activities</option>
                    <option value="ASSESSMENT">Assessments</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Button variant="primary" onClick={() => setActiveTab('create')}>
                    <FaPlus className="me-1" />
                    Add Resource
                  </Button>
                </Col>
              </Row>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : filteredResources.length === 0 ? (
              <Alert variant="info">No resources found. Create one to get started!</Alert>
            ) : (
              <Row>
                {filteredResources.map((resource) => (
                  <Col md={6} lg={4} key={resource.resource_id} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            {getResourceIcon(resource.resource_type)}
                            <strong>{resource.title}</strong>
                          </div>
                          {resource.rating > 0 && (
                            <div>
                              <FaStar className="text-warning" />
                              <small>{resource.rating.toFixed(1)}</small>
                            </div>
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-muted small mb-2">{resource.description}</p>
                        )}
                        {resource.tags && resource.tags.length > 0 && (
                          <div className="mb-2">
                            {resource.tags.map((tag, idx) => (
                              <Badge key={idx} bg="secondary" className="me-1">
                                <FaTag className="me-1" style={{ fontSize: '0.7rem' }} />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            Used {resource.usage_count || 0} times
                          </small>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onSelectResource(resource, '')}
                          >
                            Link to Curriculum
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>

          <Tab eventKey="create" title="Create Resource">
            <ResourceCreator
              offering={offering}
              onCreate={handleCreateResource}
              onSuccess={() => {
                setActiveTab('browse');
                loadResources();
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

// Resource Creator Component
function ResourceCreator({ offering, onCreate, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'LINK',
    url: '',
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
    setSaving(true);
    try {
      await onCreate(formData);
      onSuccess();
      setFormData({
        title: '',
        description: '',
        resource_type: 'LINK',
        url: '',
        tags: []
      });
    } catch (error) {
      alert('Failed to create resource');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Resource Title *</Form.Label>
        <Form.Control
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Resource Type *</Form.Label>
        <Form.Select
          value={formData.resource_type}
          onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
          required
        >
          <option value="VIDEO">Video</option>
          <option value="LINK">Link</option>
          <option value="GAME">Game</option>
          <option value="WORKSHEET">Worksheet</option>
          <option value="DOCUMENT">Document</option>
          <option value="ACTIVITY">Activity</option>
          <option value="ASSESSMENT">Assessment</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>URL *</Form.Label>
        <Form.Control
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
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
        {saving ? 'Creating...' : 'Create Resource'}
      </Button>
    </Form>
  );
}

export default ResourceLibrary;

