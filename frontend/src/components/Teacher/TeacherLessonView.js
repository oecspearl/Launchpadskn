import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Badge
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaBook, FaClipboardList, FaUsers, FaUserCheck, FaFilePowerpoint
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import SlideshowEmbed from '../common/SlideshowEmbed';

function TeacherLessonView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lesson, setLesson] = useState(null);
  
  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);
  
  const fetchLessonData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: lessonData } = await supabase
        .from('lessons')
        .select(`
          *,
          class_subject:class_subjects(
            *,
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            ),
            class:classes(
              *,
              form:forms(*)
            )
          ),
          content:lesson_content(*)
        `)
        .eq('lesson_id', lessonId)
        .single();
      
      setLesson(lessonData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson');
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
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
  
  if (error || !lesson) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error || 'Lesson not found'}</Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <Button 
            variant="link" 
            className="p-0 mb-2"
            onClick={() => navigate('/teacher/dashboard')}
          >
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <h2>{lesson.lesson_title || 'Lesson'}</h2>
          <p className="text-muted mb-0">
            {lesson.class_subject?.subject_offering?.subject?.subject_name} • 
            {lesson.class_subject?.class?.form?.form_name} - {lesson.class_subject?.class?.class_name}
          </p>
        </Col>
      </Row>
      
      <Row className="g-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Lesson Details</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="mb-2">
                    <FaCalendarAlt className="me-2 text-primary" />
                    <strong>Date:</strong> {formatDate(lesson.lesson_date)}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-2">
                    <FaClock className="me-2 text-primary" />
                    <strong>Time:</strong> {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                  </div>
                </Col>
              </Row>
              
              {lesson.location && (
                <div className="mb-3">
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  <strong>Location:</strong> {lesson.location}
                </div>
              )}
              
              {lesson.topic && (
                <div className="mb-3">
                  <h6>Topic</h6>
                  <p className="mb-0">{lesson.topic}</p>
                </div>
              )}
              
              {lesson.learning_objectives && (
                <div className="mb-3">
                  <h6>Learning Objectives</h6>
                  <div className="white-space-pre-wrap">{lesson.learning_objectives}</div>
                </div>
              )}
              
              {lesson.lesson_plan && (
                <div className="mb-3">
                  <h6>Lesson Plan</h6>
                  <div className="white-space-pre-wrap">{lesson.lesson_plan}</div>
                </div>
              )}
              
              {lesson.homework_description && (
                <Card className="bg-warning bg-opacity-10 border-warning mb-3">
                  <Card.Body>
                    <h6 className="mb-2">
                      <FaClipboardList className="me-2" />
                      Homework
                    </h6>
                    <p className="mb-0">{lesson.homework_description}</p>
                    {lesson.homework_due_date && (
                      <p className="mb-0 mt-2 text-muted small">
                        <strong>Due:</strong> {formatDate(lesson.homework_due_date)}
                      </p>
                    )}
                  </Card.Body>
                </Card>
              )}
              
              <Badge bg={
                lesson.status === 'COMPLETED' ? 'success' :
                lesson.status === 'CANCELLED' ? 'danger' :
                'primary'
              }>
                {lesson.status || 'SCHEDULED'}
              </Badge>
            </Card.Body>
          </Card>
          
          {/* Lesson Content - Embedded Slide Shows */}
          {lesson.content && lesson.content.length > 0 && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0">
                  <FaBook className="me-2" />
                  Lesson Materials
                </h5>
              </Card.Header>
              <Card.Body>
                {lesson.content.map((contentItem, index) => {
                  // Check if this is a slide show/presentation that should be embedded
                  const isSlideshow = contentItem.content_type === 'SLIDESHOW' || 
                                    contentItem.content_type === 'PRESENTATION' ||
                                    (contentItem.content_type === 'LINK' && 
                                     contentItem.url && 
                                     (contentItem.url.includes('docs.google.com/presentation') ||
                                      contentItem.url.includes('powerpoint') ||
                                      contentItem.url.includes('slideshare') ||
                                      contentItem.url.includes('canva.com') ||
                                      contentItem.url.includes('prezi.com')));
                  
                  if (isSlideshow && contentItem.url) {
                    return (
                      <SlideshowEmbed
                        key={index}
                        url={contentItem.url}
                        title={contentItem.title || 'Slide Show'}
                      />
                    );
                  }
                  
                  // Regular content item - show link
                  return (
                    <div key={index} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            {contentItem.content_type === 'SLIDESHOW' || contentItem.content_type === 'PRESENTATION' ? (
                              <FaFilePowerpoint className="me-2" />
                            ) : (
                              <FaBook className="me-2" />
                            )}
                            {contentItem.title || 'Material'}
                          </h6>
                          <small className="text-muted">
                            Type: {contentItem.content_type}
                          </small>
                        </div>
                        {contentItem.url && (
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            href={contentItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={() => navigate(`/teacher/lessons/${lessonId}/attendance`)}
              >
                <FaUserCheck className="me-2" />
                Mark Attendance
              </Button>
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={() => navigate(`/teacher/class-subjects/${lesson.class_subject_id}/lessons`)}
              >
                <FaBook className="me-2" />
                Lesson Planning
              </Button>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Class Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Form:</strong> {lesson.class_subject?.class?.form?.form_name}
              </div>
              <div className="mb-2">
                <strong>Class:</strong> {lesson.class_subject?.class?.class_name}
              </div>
              <div>
                <strong>Subject:</strong> {lesson.class_subject?.subject_offering?.subject?.subject_name}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TeacherLessonView;

