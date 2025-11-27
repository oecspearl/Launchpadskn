import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Modal, Badge, InputGroup, Pagination, Tabs, Tab, ListGroup
} from 'react-bootstrap';
import {
  FaSearch, FaStar, FaBook, FaPlus, FaHeart, FaUsers, FaEye,
  FaTag, FaGraduationCap, FaClock, FaCheckCircle, FaCopy,
  FaFolderOpen, FaFileAlt, FaList
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import lessonTemplateService from '../../services/lessonTemplateService';
import { supabase } from '../../config/supabase';
import './LessonTemplateLibrary.css';

function LessonTemplateLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classSubjectId = searchParams.get('classSubjectId');

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subjectId: '',
    formId: '',
    tags: [],
    isFeatured: false,
    minRating: 0,
    sortBy: 'popular'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('browse');

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lessonDate, setLessonDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:45');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchSubjects();
    fetchForms();
    fetchStats();
    if (activeTab === 'browse') {
      fetchTemplates();
    } else if (activeTab === 'favorites') {
      fetchFavorites();
    }
  }, [filters, currentPage, activeTab]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('subject_id, subject_name')
        .order('subject_name');
      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('form_id, form_name')
        .order('form_name');
      if (error) throw error;
      setForms(data || []);
    } catch (err) {
      console.error('Error fetching forms:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await lessonTemplateService.getTemplateStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await lessonTemplateService.getTemplates({
        ...filters,
        page: currentPage,
        pageSize: 12
      });
      setTemplates(data || []);
      setTotalPages(Math.ceil((data?.length || 0) / 12));
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await lessonTemplateService.getFavorites(user?.user_id);
      setFavorites(data || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!classSubjectId) {
      alert('Please select a class-subject first');
      return;
    }

    if (!lessonDate) {
      alert('Please select a lesson date');
      return;
    }

    try {
      const lesson = await lessonTemplateService.createLessonFromTemplate(
        selectedTemplate.template_id,
        parseInt(classSubjectId),
        {
          lesson_date: lessonDate,
          start_time: startTime,
          end_time: endTime,
          location: location || null,
          created_by: user?.user_id
        }
      );

      alert('Lesson created from template successfully!');
      setShowCreateModal(false);
      navigate(`/teacher/class-subjects/${classSubjectId}/lessons`);
    } catch (err) {
      console.error('Error creating lesson from template:', err);
      alert('Failed to create lesson from template');
    }
  };

  const handleToggleFavorite = async (templateId, isFavorite) => {
    try {
      if (isFavorite) {
        await lessonTemplateService.removeFromFavorites(templateId, user?.user_id);
      } else {
        await lessonTemplateService.addToFavorites(templateId, user?.user_id);
      }
      if (activeTab === 'favorites') {
        fetchFavorites();
      } else {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-warning" style={{ opacity: 0.5 }} />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FaStar key={i} className="text-muted" style={{ opacity: 0.3 }} />);
    }

    return stars;
  };

  const displayTemplates = activeTab === 'favorites' ? favorites : templates;

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Lesson Templates</h2>
          <p className="text-muted">Browse and reuse complete lesson structures</p>
        </Col>
      </Row>

      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.total}</h3>
                <p className="text-muted mb-0">Total Templates</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.totalUses}</h3>
                <p className="text-muted mb-0">Total Uses</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.averageRating.toFixed(1)}</h3>
                <p className="text-muted mb-0">Avg Rating</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.averageContentCount.toFixed(0)}</h3>
                <p className="text-muted mb-0">Avg Content Items</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="browse" title="Browse Templates">
          {/* Search and Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search templates..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, currentPage: 1 })}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  >
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="checkbox"
                    label="Featured Only"
                    checked={filters.isFeatured}
                    onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked })}
                  />
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Select
                    value={filters.subjectId}
                    onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Select
                    value={filters.formId}
                    onChange={(e) => setFilters({ ...filters, formId: e.target.value })}
                  >
                    <option value="">All Forms</option>
                    {forms.map(form => (
                      <option key={form.form_id} value={form.form_id}>
                        {form.form_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              <Row className="g-4">
                {displayTemplates.map((template) => (
                  <Col md={6} lg={4} key={template.template_id}>
                    <Card className="h-100 template-card">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <FaFolderOpen className="text-primary" />
                          <Badge bg="secondary">{template.content_count || 0} items</Badge>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={async () => {
                            const isFav = await lessonTemplateService.isFavorite(template.template_id, user?.user_id);
                            handleToggleFavorite(template.template_id, isFav);
                          }}
                        >
                          <FaHeart className="text-danger" />
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        <h6 className="card-title">{template.template_name}</h6>
                        <p className="card-text text-muted small">
                          {template.description?.substring(0, 100) || 'No description'}
                        </p>
                        <div className="mb-2">
                          {template.subject && (
                            <Badge bg="info" className="me-1">
                              {template.subject.subject_name}
                            </Badge>
                          )}
                          {template.form && (
                            <Badge bg="secondary" className="me-1">
                              {template.form.form_name}
                            </Badge>
                          )}
                          {template.topic && (
                            <Badge bg="light" text="dark" className="me-1">
                              {template.topic}
                            </Badge>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-2 small text-muted">
                          <span>
                            <FaStar className="text-warning" /> {template.rating_average?.toFixed(1) || '0.0'} ({template.rating_count || 0})
                          </span>
                          <span>
                            <FaUsers /> {template.use_count || 0} uses
                          </span>
                          <span>
                            <FaEye /> {template.view_count || 0} views
                          </span>
                        </div>
                        {template.tags && template.tags.length > 0 && (
                          <div className="mb-2">
                            {template.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} bg="light" text="dark" className="me-1">
                                <FaTag className="me-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {template.estimated_duration && (
                          <div className="mb-2">
                            <FaClock className="me-1" />
                            {template.estimated_duration} min
                          </div>
                        )}
                      </Card.Body>
                      <Card.Footer className="d-flex gap-2">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={async () => {
                            const fullTemplate = await lessonTemplateService.getTemplateById(template.template_id);
                            setPreviewTemplate(fullTemplate);
                            setShowPreviewModal(true);
                          }}
                        >
                          <FaEye className="me-1" />
                          Preview
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowCreateModal(true);
                          }}
                          disabled={!classSubjectId}
                        >
                          <FaPlus className="me-1" />
                          Use Template
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>

              {displayTemplates.length === 0 && (
                <Alert variant="info" className="text-center">
                  No templates found. Try adjusting your filters.
                </Alert>
              )}

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, idx) => (
                      <Pagination.Item
                        key={idx + 1}
                        active={currentPage === idx + 1}
                        onClick={() => setCurrentPage(idx + 1)}
                      >
                        {idx + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Tab>

        <Tab eventKey="favorites" title="My Favorites">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Row className="g-4">
              {favorites.length === 0 ? (
                <Col>
                  <Alert variant="info">You haven't favorited any templates yet.</Alert>
                </Col>
              ) : (
                favorites.map((template) => (
                  <Col md={6} lg={4} key={template.template_id}>
                    <Card className="h-100">
                      <Card.Body>
                        <h6>{template.template_name}</h6>
                        <p className="text-muted small">{template.description?.substring(0, 100)}...</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowCreateModal(true);
                          }}
                          disabled={!classSubjectId}
                        >
                          Use Template
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          )}
        </Tab>
      </Tabs>

      {/* Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => {
          setShowPreviewModal(false);
          setPreviewTemplate(null);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFolderOpen className="me-2" />
            Preview: {previewTemplate?.template_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {previewTemplate && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Created By:</strong> {previewTemplate.created_by_user?.name || 'Unknown'}
                </Col>
                <Col md={6}>
                  <strong>Content Items:</strong> {previewTemplate.content_count || 0}
                </Col>
              </Row>

              {previewTemplate.subject && (
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Subject:</strong> {previewTemplate.subject.subject_name}
                  </Col>
                  {previewTemplate.form && (
                    <Col md={6}>
                      <strong>Form:</strong> {previewTemplate.form.form_name}
                    </Col>
                  )}
                </Row>
              )}

              <Row className="mb-3">
                <Col>
                  <div className="d-flex align-items-center gap-3">
                    <span>
                      <FaStar className="text-warning" /> 
                      {previewTemplate.rating_average?.toFixed(1) || '0.0'} 
                      ({previewTemplate.rating_count || 0} ratings)
                    </span>
                    <span>
                      <FaUsers /> {previewTemplate.use_count || 0} uses
                    </span>
                    {previewTemplate.estimated_duration && (
                      <span>
                        <FaClock /> {previewTemplate.estimated_duration} minutes
                      </span>
                    )}
                  </div>
                </Col>
              </Row>

              {previewTemplate.description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-1">{previewTemplate.description}</p>
                </div>
              )}

              {previewTemplate.lesson_title && (
                <div className="mb-3">
                  <strong>Lesson Title:</strong>
                  <p className="mt-1">{previewTemplate.lesson_title}</p>
                </div>
              )}

              {previewTemplate.learning_objectives && (
                <div className="mb-3">
                  <strong>Learning Objectives:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewTemplate.learning_objectives}
                  </div>
                </div>
              )}

              {previewTemplate.lesson_plan && (
                <div className="mb-3">
                  <strong>Lesson Plan:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewTemplate.lesson_plan.substring(0, 500)}...
                  </div>
                </div>
              )}

              {previewTemplate.content && previewTemplate.content.length > 0 && (
                <div className="mb-3">
                  <strong>Content Items ({previewTemplate.content.length}):</strong>
                  <ListGroup className="mt-2">
                    {previewTemplate.content.map((item, idx) => (
                      <ListGroup.Item key={idx}>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="secondary">{item.content_type}</Badge>
                          <span>{item.title}</span>
                          {item.is_required && (
                            <Badge bg="success" className="ms-auto">Required</Badge>
                          )}
                        </div>
                        {item.description && (
                          <small className="text-muted d-block mt-1">{item.description.substring(0, 100)}...</small>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}

              {previewTemplate.tags && previewTemplate.tags.length > 0 && (
                <div className="mb-3">
                  <strong>Tags:</strong>
                  <div className="mt-1">
                    {previewTemplate.tags.map((tag, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="me-1">
                        <FaTag className="me-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowPreviewModal(false);
              setPreviewTemplate(null);
            }}
          >
            Close
          </Button>
          {previewTemplate && classSubjectId && (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowPreviewModal(false);
                setSelectedTemplate(previewTemplate);
                setShowCreateModal(true);
              }}
            >
              <FaPlus className="me-1" />
              Use Template
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Create Lesson from Template Modal */}
      <Modal 
        show={showCreateModal} 
        onHide={() => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Lesson from Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTemplate && (
            <>
              <Alert variant="info" className="mb-3">
                Creating lesson from: <strong>{selectedTemplate.template_name}</strong>
                <br />
                <small>This will create a new lesson with {selectedTemplate.content_count || 0} content items.</small>
              </Alert>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Lesson Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time *</Form.Label>
                      <Form.Control
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Time *</Form.Label>
                      <Form.Control
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Location (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Room 101"
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowCreateModal(false);
              setSelectedTemplate(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateFromTemplate}
            disabled={!lessonDate || !classSubjectId}
          >
            <FaPlus className="me-1" />
            Create Lesson
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default LessonTemplateLibrary;

