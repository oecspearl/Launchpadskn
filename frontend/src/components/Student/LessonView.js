import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Badge, ListGroup
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaBook, FaClipboardList, FaUser, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import { FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

function LessonView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [attendance, setAttendance] = useState(null);
  
  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);
  
  const fetchLessonData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get lesson details
      const { data: lessonData, error: lessonError } = await supabase
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
            ),
            teacher:users!class_subjects_teacher_id_fkey(*)
          ),
          content:lesson_content(*)
        `)
        .eq('lesson_id', lessonId)
        .single();
      
      if (lessonError) throw lessonError;
      
      if (lessonData) {
        setLesson(lessonData);
        
        // Get student's attendance for this lesson (if student)
        if (user && user.userId && user.role?.toLowerCase() === 'student') {
          const { data: attendanceData } = await supabase
            .from('lesson_attendance')
            .select('*')
            .eq('lesson_id', lessonId)
            .eq('student_id', user.userId)
            .maybeSingle();
          
          setAttendance(attendanceData);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching lesson data:', err);
      setError('Failed to load lesson details');
      setIsLoading(false);
    }
  };
  
  const getSubjectName = () => {
    return lesson?.class_subject?.subject_offering?.subject?.subject_name || 'Subject';
  };
  
  const getClassName = () => {
    return lesson?.class_subject?.class?.class_name || '';
  };
  
  const getFormName = () => {
    return lesson?.class_subject?.class?.form?.form_name || '';
  };
  
  const getTeacherName = () => {
    return lesson?.class_subject?.teacher?.name || 'TBD';
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
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
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };
  
  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading lesson details...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  if (!lesson) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Lesson not found</Alert>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="link" 
            className="p-0 mb-2"
            onClick={() => {
              if (lesson.class_subject?.class_subject_id) {
                navigate(`/student/subjects/${lesson.class_subject.class_subject_id}`);
              } else {
                navigate('/student/dashboard');
              }
            }}
          >
            <FaArrowLeft className="me-2" />
            Back to Subject
          </Button>
          <h2>{lesson.lesson_title || 'Lesson'}</h2>
          <p className="text-muted mb-0">
            {getSubjectName()} • {getFormName()} • {getClassName()}
          </p>
        </Col>
      </Row>
      
      <Row className="g-4">
        {/* Main Lesson Content */}
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Lesson Details</h5>
            </Card.Header>
            <Card.Body>
              {/* Date and Time */}
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
                <Row className="mb-3">
                  <Col>
                    <div>
                      <FaMapMarkerAlt className="me-2 text-primary" />
                      <strong>Location:</strong> {lesson.location}
                    </div>
                  </Col>
                </Row>
              )}
              
              {/* Topic */}
              {lesson.topic && (
                <div className="mb-3">
                  <h6>Topic</h6>
                  <p className="mb-0">{lesson.topic}</p>
                </div>
              )}
              
              {/* Learning Objectives */}
              {lesson.learning_objectives && (
                <div className="mb-3">
                  <h6>Learning Objectives</h6>
                  <div className="white-space-pre-wrap">{lesson.learning_objectives}</div>
                </div>
              )}
              
              {/* Lesson Plan */}
              {lesson.lesson_plan && (
                <div className="mb-3">
                  <h6>Lesson Plan</h6>
                  <div className="white-space-pre-wrap">{lesson.lesson_plan}</div>
                </div>
              )}
              
              {/* Homework */}
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
              
              {/* Status */}
              <div className="mt-3">
                <Badge bg={
                  lesson.status === 'COMPLETED' ? 'success' :
                  lesson.status === 'CANCELLED' ? 'danger' :
                  'primary'
                }>
                  {lesson.status || 'SCHEDULED'}
                </Badge>
              </div>
            </Card.Body>
          </Card>
          
          {/* Lesson Content Files */}
          {lesson.content && lesson.content.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0">
                  <FaBook className="me-2" />
                  Lesson Materials ({lesson.content.length})
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {lesson.content.map((contentItem, index) => {
                    const isVideo = contentItem.content_type === 'VIDEO' || 
                                   (contentItem.url && (contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be')));
                    const isImage = contentItem.content_type === 'IMAGE' || 
                                   (contentItem.mime_type && contentItem.mime_type.startsWith('image/'));
                    
                    return (
                      <Col md={6} key={index}>
                        <Card className="h-100 border" style={{ cursor: 'default' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="flex-grow-1">
                                <h6 className="mb-1" style={{ cursor: 'text' }}>{contentItem.title || 'Material'}</h6>
                                <Badge bg="secondary" className="mb-2">
                                  {contentItem.content_type}
                                </Badge>
                                {contentItem.file_name && (
                                  <p className="text-muted small mb-1">
                                    {contentItem.file_name}
                                    {contentItem.file_size && ` (${formatFileSize(contentItem.file_size)})`}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Embedded Content */}
                            {isVideo && contentItem.url && (
                              <div className="mb-2">
                                {contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be') ? (
                                  <div className="ratio ratio-16x9">
                                    <iframe
                                      src={getYouTubeEmbedUrl(contentItem.url)}
                                      title={contentItem.title}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      style={{ border: 0 }}
                                    />
                                  </div>
                                ) : (
                                  <video controls className="w-100" style={{ maxHeight: '300px' }}>
                                    <source src={contentItem.url} type={contentItem.mime_type || 'video/mp4'} />
                                    Your browser does not support the video tag.
                                  </video>
                                )}
                              </div>
                            )}
                            
                            {isImage && contentItem.url && (
                              <div className="mb-2">
                                <a
                                  href={contentItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'block', cursor: 'pointer' }}
                                >
                                  <img 
                                    src={contentItem.url} 
                                    alt={contentItem.title}
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '200px', width: 'auto' }}
                                  />
                                </a>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="d-flex gap-2">
                              {contentItem.url ? (
                                <a
                                  href={contentItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary btn-sm flex-grow-1 text-decoration-none d-flex align-items-center justify-content-center"
                                  style={{ minHeight: '38px' }}
                                >
                                  {isVideo ? (
                                    <>
                                      <FaExternalLinkAlt className="me-2" />
                                      Watch Video
                                    </>
                                  ) : isImage ? (
                                    <>
                                      <FaExternalLinkAlt className="me-2" />
                                      View Image
                                    </>
                                  ) : (
                                    <>
                                      <FaExternalLinkAlt className="me-2" />
                                      Open
                                    </>
                                  )}
                                </a>
                              ) : contentItem.file_path ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Generate signed URL for private files
                                      const { data, error } = await supabase.storage
                                        .from('course-content')
                                        .createSignedUrl(contentItem.file_path, 3600);
                                      
                                      if (error) throw error;
                                      if (data?.signedUrl) {
                                        window.open(data.signedUrl, '_blank');
                                      }
                                    } catch (err) {
                                      console.error('Error generating signed URL:', err);
                                      alert('Unable to open file. Please contact your teacher.');
                                    }
                                  }}
                                  className="flex-grow-1 d-flex align-items-center justify-content-center"
                                >
                                  <FaDownload className="me-2" />
                                  Download
                                </Button>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
        
        {/* Sidebar */}
        <Col md={4}>
          {/* Attendance Status (for students) */}
          {user?.role?.toLowerCase() === 'student' && attendance && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3">
                <h6 className="mb-0">My Attendance</h6>
              </Card.Header>
              <Card.Body>
                <Badge 
                  bg={
                    attendance.status === 'PRESENT' ? 'success' :
                    attendance.status === 'ABSENT' ? 'danger' :
                    attendance.status === 'LATE' ? 'warning' :
                    'secondary'
                  }
                  style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
                >
                  {attendance.status || 'Not Marked'}
                </Badge>
                {attendance.notes && (
                  <p className="mt-2 mb-0 small text-muted">
                    {attendance.notes}
                  </p>
                )}
              </Card.Body>
            </Card>
          )}
          
          {/* Teacher Info */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Teacher</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center">
                <FaUser className="me-2 text-muted" size={20} />
                <div>
                  <strong>{getTeacherName()}</strong>
                  <br />
                  <small className="text-muted">{getSubjectName()}</small>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          {/* Class Info */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Class Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Form:</strong> {getFormName()}
              </div>
              <div className="mb-2">
                <strong>Class:</strong> {getClassName()}
              </div>
              <div>
                <strong>Subject:</strong> {getSubjectName()}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LessonView;


