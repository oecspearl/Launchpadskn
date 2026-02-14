import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Modal, Badge, InputGroup, Pagination, Tabs, Tab
} from 'react-bootstrap';
import {
  FaSearch, FaFilter, FaStar, FaStarHalfAlt, FaBook, FaVideo,
  FaFileAlt, FaImage, FaLink, FaPlus, FaHeart, FaHeartBroken,
  FaUsers, FaEye, FaDownload, FaTag, FaGraduationCap, FaClock,
  FaCheckCircle, FaTimesCircle, FaThumbsUp, FaComments, FaExternalLinkAlt,
  FaUserPlus, FaBell, FaLightbulb
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import contentLibraryService from '../../services/contentLibraryService';
import teacherCollaborationService from '../../services/teacherCollaborationService';
import { supabase } from '../../config/supabase';
import InteractiveVideoViewer from '../Student/InteractiveVideoViewer';
import ModelViewerComponent from '../InteractiveContent/Viewers/ModelViewerComponent';
import ViewerErrorBoundary from '../InteractiveContent/Viewers/ViewerErrorBoundary';
import './ContentLibrary.css';

function ContentLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    contentType: '',
    subjectId: '',
    formId: '',
    tags: [],
    isFeatured: false,
    minRating: 0,
    sortBy: 'popular',
    sortOrder: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('browse');

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionType, setSuggestionType] = useState('IMPROVEMENT');

  useEffect(() => {
    fetchSubjects();
    fetchForms();
    fetchStats();
    if (activeTab === 'browse') {
      fetchContent();
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
      const statsData = await contentLibraryService.getLibraryStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentLibraryService.getLibraryContent({
        ...filters,
        page: currentPage,
        pageSize: 12
      });
      setContent(data || []);
      // Calculate total pages (simplified - you might want to get this from API)
      setTotalPages(Math.ceil((data?.length || 0) / 12));
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content library');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await contentLibraryService.getFavorites(user?.user_id);
      setFavorites(data.map(fav => fav.library_content).filter(Boolean));
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLesson = async (libraryContent) => {
    let targetLessonId = lessonId;
    
    // If no lessonId in URL, prompt for it
    if (!targetLessonId) {
      targetLessonId = prompt('Enter the lesson ID to add this content to:');
      if (!targetLessonId) return;
    }

    try {
      await contentLibraryService.addLibraryContentToLesson(
        libraryContent.library_id,
        parseInt(targetLessonId),
        user?.user_id
      );
      alert('Content added to lesson successfully!');
      if (lessonId) {
        navigate(`/teacher/lessons/${targetLessonId}/content`);
      } else {
        // Refresh to show updated content
        fetchContent();
      }
    } catch (err) {
      console.error('Error adding content to lesson:', err);
      alert('Failed to add content to lesson');
    }
  };

  const handleToggleFavorite = async (libraryId, isFavorite) => {
    try {
      if (isFavorite) {
        await contentLibraryService.removeFromFavorites(libraryId, user?.user_id);
      } else {
        await contentLibraryService.addToFavorites(libraryId, user?.user_id);
      }
      if (activeTab === 'favorites') {
        fetchFavorites();
      } else {
        fetchContent();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleRateContent = async () => {
    if (!selectedContent) return;

    try {
      await contentLibraryService.rateContent(
        selectedContent.library_id,
        user?.user_id,
        rating,
        review
      );
      setShowRatingModal(false);
      setRating(5);
      setReview('');
      fetchContent();
    } catch (err) {
      console.error('Error rating content:', err);
      alert('Failed to submit rating');
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'VIDEO': return <FaVideo className="text-danger" />;
      case 'IMAGE': return <FaImage className="text-info" />;
      case 'FILE': return <FaFileAlt className="text-secondary" />;
      case 'LINK': return <FaLink className="text-primary" />;
      case 'QUIZ': return <FaBook className="text-warning" />;
      case 'ASSIGNMENT': return <FaFileAlt className="text-success" />;
      default: return <FaFileAlt />;
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
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FaStar key={i} className="text-muted" style={{ opacity: 0.3 }} />);
    }

    return stars;
  };

  const displayContent = activeTab === 'favorites' ? favorites : content;

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Content Library</h2>
          <p className="text-muted">Browse and reuse content shared by teachers</p>
        </Col>
      </Row>

      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.total}</h3>
                <p className="text-muted mb-0">Total Items</p>
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
                <h3>{Object.keys(stats.byType).length}</h3>
                <p className="text-muted mb-0">Content Types</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="browse" title="Browse Library">
          <div className="d-flex justify-content-end mb-3">
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={() => setShowRequestModal(true)}
            >
              <FaBell className="me-1" />
              Request Content
            </Button>
          </div>
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
                      placeholder="Search content..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, currentPage: 1 })}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filters.contentType}
                    onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="VIDEO">Video</option>
                    <option value="IMAGE">Image</option>
                    <option value="FILE">File</option>
                    <option value="LINK">Link</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="FLASHCARD">Flashcard</option>
                    <option value="INTERACTIVE_VIDEO">Interactive Video</option>
                    <option value="INTERACTIVE_BOOK">Interactive Book</option>
                  </Form.Select>
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
              </Row>
              <Row className="mt-3">
                <Col md={4}>
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
                <Col md={4}>
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
                <Col md={4}>
                  <Form.Check
                    type="checkbox"
                    label="Featured Only"
                    checked={filters.isFeatured}
                    onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked })}
                  />
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
                {displayContent.map((item) => (
                  <Col md={6} lg={4} key={item.library_id}>
                    <Card className="h-100 content-library-card">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          {getContentTypeIcon(item.content_type)}
                          <Badge bg="secondary">{item.content_type}</Badge>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={async () => {
                            const isFav = await contentLibraryService.isFavorite(item.library_id, user?.user_id);
                            handleToggleFavorite(item.library_id, isFav);
                          }}
                        >
                          <FaHeart className="text-danger" />
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        <h6 className="card-title">{item.title}</h6>
                        <p className="card-text text-muted small">
                          {item.description?.substring(0, 100)}...
                        </p>
                        <div className="mb-2">
                          {item.subject && (
                            <Badge bg="info" className="me-1">
                              {item.subject.subject_name}
                            </Badge>
                          )}
                          {item.form && (
                            <Badge bg="secondary" className="me-1">
                              {item.form.form_name}
                            </Badge>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-2 small text-muted">
                          <span>
                            <FaStar className="text-warning" /> {item.rating_average?.toFixed(1) || '0.0'} ({item.rating_count || 0})
                          </span>
                          <span>
                            <FaUsers /> {item.use_count || 0} uses
                          </span>
                          <span>
                            <FaEye /> {item.view_count || 0} views
                          </span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="mb-2">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} bg="light" text="dark" className="me-1">
                                <FaTag className="me-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.estimated_minutes && (
                          <div className="mb-2">
                            <FaClock className="me-1" />
                            {item.estimated_minutes} min
                          </div>
                        )}
                      </Card.Body>
                      <Card.Footer className="d-flex gap-2">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={async () => {
                            // Fetch full content details
                            const fullContent = await contentLibraryService.getLibraryContentById(item.library_id);
                            setPreviewContent(fullContent);
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
                          onClick={() => handleAddToLesson(item)}
                        >
                          <FaPlus className="me-1" />
                          Add to Lesson
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedContent(item);
                            setShowRatingModal(true);
                          }}
                        >
                          <FaStar />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={async () => {
                            setSelectedContent(item);
                            const commentsData = await teacherCollaborationService.getComments(item.library_id);
                            setComments(commentsData);
                            setShowCommentsModal(true);
                          }}
                        >
                          <FaComments />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => {
                            setSelectedContent(item);
                            setShowSuggestionModal(true);
                          }}
                        >
                          <FaLightbulb />
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>

              {displayContent.length === 0 && (
                <Alert variant="info" className="text-center">
                  No content found. Try adjusting your filters.
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
                  <Alert variant="info">You haven't favorited any content yet.</Alert>
                </Col>
              ) : (
                favorites.map((item) => (
                  <Col md={6} lg={4} key={item.library_id}>
                    <Card className="h-100">
                      <Card.Body>
                        <h6>{item.title}</h6>
                        <p className="text-muted small">{item.description?.substring(0, 100)}...</p>
                        <div className="d-flex gap-2">
                          <Button
                            variant="info"
                            size="sm"
                            onClick={async () => {
                              const fullContent = await contentLibraryService.getLibraryContentById(item.library_id);
                              setPreviewContent(fullContent);
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
                            onClick={() => handleAddToLesson(item)}
                          >
                            <FaPlus className="me-1" />
                            Add to Lesson
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          )}
        </Tab>
      </Tabs>

      {/* Rating Modal */}
      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rate Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={star <= rating ? 'text-warning' : 'text-muted'}
                    style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Review (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this content..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRateContent}>
            Submit Rating
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => {
          setShowPreviewModal(false);
          setPreviewContent(null);
        }}
        size={previewContent?.content_type === 'INTERACTIVE_VIDEO' || 
              previewContent?.content_type === '3D_MODEL' || 
              previewContent?.content_type === 'AR_OVERLAY' ? 'xl' : 'lg'}
        fullscreen={previewContent?.content_type === 'INTERACTIVE_VIDEO' ? 'lg-down' : false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {getContentTypeIcon(previewContent?.content_type)}
            <span className="ms-2">Preview: {previewContent?.title}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body 
          style={{ 
            maxHeight: previewContent?.content_type === 'INTERACTIVE_VIDEO' ? '90vh' : '70vh', 
            overflowY: previewContent?.content_type === 'INTERACTIVE_VIDEO' ? 'hidden' : 'auto',
            padding: previewContent?.content_type === 'INTERACTIVE_VIDEO' ? 0 : undefined
          }}
        >
          {previewContent && (
            <>
              {/* Interactive Video - Full Screen Preview */}
              {previewContent.content_type === 'INTERACTIVE_VIDEO' && previewContent.content_data && (
                <div style={{ height: '90vh' }}>
                  <InteractiveVideoViewer
                    contentData={typeof previewContent.content_data === 'string' 
                      ? JSON.parse(previewContent.content_data) 
                      : previewContent.content_data}
                    title={previewContent.title}
                    description={previewContent.description}
                    onClose={() => {
                      setShowPreviewModal(false);
                      setPreviewContent(null);
                    }}
                  />
                </div>
              )}

              {/* Regular Preview Content */}
              {previewContent.content_type !== 'INTERACTIVE_VIDEO' && (
                <>
              {/* Basic Info */}
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Content Type:</strong> {previewContent.content_type}
                </Col>
                <Col md={6}>
                  <strong>Shared By:</strong> {previewContent.shared_by_user?.name || 'Unknown'}
                </Col>
              </Row>

              {previewContent.subject && (
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Subject:</strong> {previewContent.subject.subject_name}
                  </Col>
                  {previewContent.form && (
                    <Col md={6}>
                      <strong>Form:</strong> {previewContent.form.form_name}
                    </Col>
                  )}
                </Row>
              )}

              {/* Rating and Stats */}
              <Row className="mb-3">
                <Col>
                  <div className="d-flex align-items-center gap-3">
                    <span>
                      <FaStar className="text-warning" /> 
                      {previewContent.rating_average?.toFixed(1) || '0.0'} 
                      ({previewContent.rating_count || 0} ratings)
                    </span>
                    <span>
                      <FaUsers /> {previewContent.use_count || 0} uses
                    </span>
                    <span>
                      <FaEye /> {previewContent.view_count || 0} views
                    </span>
                    {previewContent.estimated_minutes && (
                      <span>
                        <FaClock /> {previewContent.estimated_minutes} minutes
                      </span>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Description */}
              {previewContent.description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-1">{previewContent.description}</p>
                </div>
              )}

              {/* Instructions */}
              {previewContent.instructions && (
                <div className="mb-3">
                  <strong>Instructions:</strong>
                  <div className="alert alert-info mt-1 mb-0">
                    {previewContent.instructions}
                  </div>
                </div>
              )}

              {/* Learning Outcomes */}
              {previewContent.learning_outcomes && (
                <div className="mb-3">
                  <strong>Learning Outcomes:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.learning_outcomes}
                  </div>
                </div>
              )}

              {/* Key Concepts */}
              {previewContent.key_concepts && (
                <div className="mb-3">
                  <strong>Key Concepts:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.key_concepts}
                  </div>
                </div>
              )}

              {/* Learning Activities */}
              {previewContent.learning_activities && (
                <div className="mb-3">
                  <strong>Learning Activities:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.learning_activities}
                  </div>
                </div>
              )}

              {/* Reflection Questions */}
              {previewContent.reflection_questions && (
                <div className="mb-3">
                  <strong>Reflection Questions:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.reflection_questions}
                  </div>
                </div>
              )}

              {/* Discussion Prompts */}
              {previewContent.discussion_prompts && (
                <div className="mb-3">
                  <strong>Discussion Prompts:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.discussion_prompts}
                  </div>
                </div>
              )}

              {/* Summary */}
              {previewContent.summary && (
                <div className="mb-3">
                  <strong>Summary:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.summary}
                  </div>
                </div>
              )}

              {/* 3D Model Preview */}
              {(previewContent.content_type === '3D_MODEL' || previewContent.content_type === 'AR_OVERLAY') && previewContent.url && (
                <div className="mb-3">
                  <strong>3D Model Preview:</strong>
                  <div className="mt-2" style={{ 
                    width: '100%', 
                    height: '500px', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    border: '1px solid #dee2e6',
                    backgroundColor: '#1a1a1a'
                  }}>
                    <ViewerErrorBoundary>
                      <ModelViewerComponent
                        contentUrl={previewContent.url}
                        modelFormat="GLTF"
                        modelProperties={{
                          autoRotate: true,
                          cameraControls: true,
                          exposure: 1,
                          shadowIntensity: 1
                        }}
                        annotations={[]}
                        onInteraction={(interaction) => {
                          console.log('3D Model interaction:', interaction);
                        }}
                        onStateChange={(state) => {
                          console.log('3D Model state:', state);
                        }}
                      />
                    </ViewerErrorBoundary>
                  </div>
                </div>
              )}

              {/* URL/Link Preview */}
              {previewContent.url && 
               previewContent.content_type !== 'INTERACTIVE_VIDEO' && 
               previewContent.content_type !== '3D_MODEL' && 
               previewContent.content_type !== 'AR_OVERLAY' && (
                <div className="mb-3">
                  <strong>Link/URL:</strong>
                  <div className="mt-1">
                    <a 
                      href={previewContent.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="d-inline-flex align-items-center gap-1"
                    >
                      {previewContent.url}
                      <FaExternalLinkAlt size={12} />
                    </a>
                  </div>
                  {/* Regular Video Preview */}
                  {previewContent.content_type === 'VIDEO' && (
                    <div className="mt-2">
                      {(previewContent.url.includes('youtube.com') || previewContent.url.includes('youtu.be')) ? (
                        <iframe
                          width="100%"
                          height="315"
                          src={previewContent.url.includes('youtube.com/watch') 
                            ? previewContent.url.replace('watch?v=', 'embed/')
                            : previewContent.url.replace('youtu.be/', 'youtube.com/embed/')}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video preview"
                        />
                      ) : (
                        <video controls width="100%" style={{ maxHeight: '400px' }}>
                          <source src={previewContent.url} />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  )}
                  {/* Image Preview */}
                  {previewContent.content_type === 'IMAGE' && (
                    <div className="mt-2">
                      <img 
                        src={previewContent.url} 
                        alt={previewContent.title}
                        style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* File Info */}
              {previewContent.file_name && (
                <div className="mb-3">
                  <strong>File:</strong> {previewContent.file_name}
                  {previewContent.file_size && (
                    <span className="text-muted ms-2">
                      ({(previewContent.file_size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
              )}

              {/* Tags */}
              {previewContent.tags && previewContent.tags.length > 0 && (
                <div className="mb-3">
                  <strong>Tags:</strong>
                  <div className="mt-1">
                    {previewContent.tags.map((tag, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="me-1">
                        <FaTag className="me-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Section */}
              {previewContent.content_section && (
                <div className="mb-3">
                  <strong>Content Section:</strong> {previewContent.content_section}
                </div>
              )}

              {/* Required/Optional */}
              <div className="mb-3">
                <strong>Status:</strong>{' '}
                {previewContent.is_required ? (
                  <Badge bg="success">Required</Badge>
                ) : (
                  <Badge bg="info">Optional</Badge>
                )}
              </div>

              {/* Reviews */}
              {previewContent.ratings && previewContent.ratings.length > 0 && (
                <div className="mb-3">
                  <strong>Reviews:</strong>
                  <div className="mt-2">
                    {previewContent.ratings.slice(0, 3).map((ratingItem) => (
                      <Card key={ratingItem.rating_id} className="mb-2">
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center gap-1 mb-1">
                                {renderStars(ratingItem.rating)}
                                <span className="ms-2 small">
                                  {ratingItem.user?.name || 'Anonymous'}
                                </span>
                              </div>
                              {ratingItem.review && (
                                <p className="mb-0 small">{ratingItem.review}</p>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}
            </>
          )}
        </Modal.Body>
        {previewContent?.content_type !== 'INTERACTIVE_VIDEO' && (
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewContent(null);
              }}
            >
              Close
            </Button>
            {previewContent && (
              <Button 
                variant="primary" 
                onClick={() => {
                  handleAddToLesson(previewContent);
                  setShowPreviewModal(false);
                }}
              >
                <FaPlus className="me-1" />
                Add to Lesson
              </Button>
          )}
        </Modal.Footer>
        )}
      </Modal>

      {/* Comments Modal */}
      <Modal 
        show={showCommentsModal} 
        onHide={() => {
          setShowCommentsModal(false);
          setComments([]);
          setNewComment('');
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaComments className="me-2" />
            Comments & Discussion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {comments.length === 0 ? (
            <Alert variant="info">No comments yet. Be the first to comment!</Alert>
          ) : (
            <div>
              {comments.map((comment) => (
                <Card key={comment.comment_id} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>{comment.user?.name || 'Unknown'}</strong>
                        <small className="text-muted ms-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <p className="mb-0">{comment.comment_text}</p>
                    {comment.parent_comment && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small>
                          <strong>Replying to {comment.parent_comment.user?.name}:</strong>{' '}
                          {comment.parent_comment.comment_text}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
          <Form className="mt-3">
            <Form.Group>
              <Form.Label>Add Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowCommentsModal(false);
              setComments([]);
              setNewComment('');
            }}
          >
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={async () => {
              if (!newComment.trim() || !selectedContent) return;
              try {
                await teacherCollaborationService.addComment({
                  library_id: selectedContent.library_id,
                  user_id: user?.user_id,
                  comment_text: newComment
                });
                const updatedComments = await teacherCollaborationService.getComments(selectedContent.library_id);
                setComments(updatedComments);
                setNewComment('');
              } catch (err) {
                console.error('Error adding comment:', err);
                alert('Failed to add comment');
              }
            }}
            disabled={!newComment.trim()}
          >
            Post Comment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Content Request Modal */}
      <Modal 
        show={showRequestModal} 
        onHide={() => {
          setShowRequestModal(false);
          setRequestTitle('');
          setRequestDescription('');
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBell className="me-2" />
            Request Content
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Request Title *</Form.Label>
              <Form.Control
                type="text"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="e.g., Interactive video on photosynthesis"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="Describe what content you need and how you plan to use it..."
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Select
                value={filters.subjectId}
                onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowRequestModal(false);
              setRequestTitle('');
              setRequestDescription('');
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={async () => {
              if (!requestTitle.trim() || !requestDescription.trim()) return;
              try {
                await teacherCollaborationService.createContentRequest({
                  requested_by: user?.user_id,
                  request_title: requestTitle,
                  request_description: requestDescription,
                  subject_id: filters.subjectId || null,
                  form_id: filters.formId || null,
                  status: 'OPEN'
                });
                alert('Content request submitted! Other teachers will be notified.');
                setShowRequestModal(false);
                setRequestTitle('');
                setRequestDescription('');
              } catch (err) {
                console.error('Error creating request:', err);
                alert('Failed to submit request');
              }
            }}
            disabled={!requestTitle.trim() || !requestDescription.trim()}
          >
            Submit Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Suggestion Modal */}
      <Modal 
        show={showSuggestionModal} 
        onHide={() => {
          setShowSuggestionModal(false);
          setSuggestionText('');
          setSuggestionType('IMPROVEMENT');
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaLightbulb className="me-2" />
            Suggest Improvement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContent && (
            <Alert variant="info" className="mb-3">
              Suggesting improvements for: <strong>{selectedContent.title}</strong>
            </Alert>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Suggestion Type</Form.Label>
              <Form.Select
                value={suggestionType}
                onChange={(e) => setSuggestionType(e.target.value)}
              >
                <option value="IMPROVEMENT">General Improvement</option>
                <option value="CORRECTION">Correction</option>
                <option value="ENHANCEMENT">Enhancement</option>
                <option value="TAG">Tag Suggestion</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Suggestion *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Describe your suggestion..."
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowSuggestionModal(false);
              setSuggestionText('');
              setSuggestionType('IMPROVEMENT');
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={async () => {
              if (!suggestionText.trim() || !selectedContent) return;
              try {
                await teacherCollaborationService.createSuggestion({
                  library_id: selectedContent.library_id,
                  suggested_by: user?.user_id,
                  suggestion_type: suggestionType,
                  suggestion_text: suggestionText,
                  status: 'PENDING'
                });
                alert('Suggestion submitted! The content creator will be notified.');
                setShowSuggestionModal(false);
                setSuggestionText('');
                setSuggestionType('IMPROVEMENT');
              } catch (err) {
                console.error('Error creating suggestion:', err);
                alert('Failed to submit suggestion');
              }
            }}
            disabled={!suggestionText.trim()}
          >
            Submit Suggestion
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ContentLibrary;

