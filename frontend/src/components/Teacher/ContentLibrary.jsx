import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Modal, Badge, InputGroup, Pagination, Tabs, Tab
} from 'react-bootstrap';
import {
  FaSearch, FaFilter, FaStar, FaStarHalfAlt, FaBook, FaVideo,
  FaFileAlt, FaImage, FaLink, FaPlus, FaHeart, FaHeartBroken,
  FaUsers, FaEye, FaDownload, FaTag, FaGraduationCap, FaClock,
  FaCheckCircle, FaTimesCircle, FaThumbsUp, FaComments
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import contentLibraryService from '../../services/contentLibraryService';
import { supabase } from '../../config/supabase';
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
  const [selectedContent, setSelectedContent] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

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
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddToLesson(item)}
                        >
                          Add to Lesson
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
    </Container>
  );
}

export default ContentLibrary;

