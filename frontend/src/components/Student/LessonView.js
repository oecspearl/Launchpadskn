import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Badge, ListGroup
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaBook, FaClipboardList, FaUser, FaCheckCircle, FaInfoCircle, FaClock as FaClockIcon,
  FaClipboardCheck, FaTasks, FaFilePdf, FaDownload, FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function LessonView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [quizStatuses, setQuizStatuses] = useState({}); // Track which content items have quizzes
  
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
        // Sort content by sequence_order and filter published content
        if (lessonData.content) {
          lessonData.content = lessonData.content
            .filter(item => item.is_published !== false)
            .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
        }
        
        setLesson(lessonData);
        
        // Check for in-app quizzes for QUIZ content types
        if (lessonData.content) {
          const quizContentItems = lessonData.content.filter(item => item.content_type === 'QUIZ');
          if (quizContentItems.length > 0) {
            const quizStatusMap = {};
            await Promise.all(quizContentItems.map(async (item) => {
              try {
                const { data: quiz } = await supabase
                  .from('quizzes')
                  .select('quiz_id, is_published')
                  .eq('content_id', item.content_id)
                  .eq('is_published', true)
                  .single();
                if (quiz) {
                  quizStatusMap[item.content_id] = true;
                }
              } catch (err) {
                // No quiz found or not published
                quizStatusMap[item.content_id] = false;
              }
            }));
            setQuizStatuses(quizStatusMap);
          }
        }
        
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
          
          {/* Lesson Content - Organized by Sections */}
          {lesson.content && lesson.content.length > 0 && (() => {
            // Group content by section
            const sections = {};
            lesson.content.forEach(item => {
              const section = item.content_section || 'Main Content';
              if (!sections[section]) {
                sections[section] = [];
              }
              sections[section].push(item);
            });

            return Object.entries(sections).map(([sectionName, sectionContent]) => (
              <Card key={sectionName} className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-light border-0 py-3">
                  <h5 className="mb-0">
                    <FaBook className="me-2" />
                    {sectionName} ({sectionContent.length})
                  </h5>
                </Card.Header>
                <Card.Body>
                  {sectionContent.map((contentItem, index) => {
                    const isVideo = contentItem.content_type === 'VIDEO' || 
                                   (contentItem.url && (contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be')));
                    const isImage = contentItem.content_type === 'IMAGE' || 
                                   (contentItem.mime_type && contentItem.mime_type.startsWith('image/'));
                    
                    return (
                      <Card key={contentItem.content_id || index} className="mb-3 border">
                        <Card.Body>
                          <div className="d-flex align-items-start mb-3">
                            {/* Sequence Number */}
                            <div className="me-3">
                              <Badge bg="primary" style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}>
                                {contentItem.sequence_order || index + 1}
                              </Badge>
                            </div>

                            {/* Content Details */}
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2 flex-wrap">
                                <h6 className="mb-0 me-2">{contentItem.title || 'Material'}</h6>
                                <Badge bg="secondary" className="me-2">
                                  {contentItem.content_type}
                                </Badge>
                                {contentItem.is_required === false && (
                                  <Badge bg="info" className="me-2">Optional</Badge>
                                )}
                                {contentItem.is_required !== false && (
                                  <Badge bg="success" className="me-2">
                                    <FaCheckCircle className="me-1" />
                                    Required
                                  </Badge>
                                )}
                              </div>

                              {/* Description */}
                              {contentItem.description && (
                                <p className="text-muted mb-2">{contentItem.description}</p>
                              )}

                              {/* Instructions */}
                              {contentItem.instructions && (
                                <div className="alert alert-info py-2 px-3 mb-2" style={{ fontSize: '0.9rem' }}>
                                  <FaInfoCircle className="me-2" />
                                  <strong>Instructions:</strong> {contentItem.instructions}
                                </div>
                              )}

                              {/* Learning Outcomes */}
                              {contentItem.learning_outcomes && (
                                <div className="mb-3 p-3 bg-light rounded">
                                  <h6 className="text-primary mb-2">
                                    <FaCheckCircle className="me-2" />
                                    Learning Outcomes
                                  </h6>
                                  <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {contentItem.learning_outcomes}
                                  </div>
                                </div>
                              )}

                              {/* Learning Activities */}
                              {contentItem.learning_activities && (
                                <div className="mb-3 p-3 bg-success bg-opacity-10 rounded border border-success">
                                  <h6 className="text-success mb-2">
                                    <FaBook className="me-2" />
                                    Learning Activities
                                  </h6>
                                  <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {contentItem.learning_activities}
                                  </div>
                                </div>
                              )}

                              {/* Key Concepts */}
                              {contentItem.key_concepts && (
                                <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded border border-warning">
                                  <h6 className="text-warning mb-2">
                                    <FaBook className="me-2" />
                                    Key Concepts
                                  </h6>
                                  <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {contentItem.key_concepts}
                                  </div>
                                </div>
                              )}

                              {/* Reflection Questions */}
                              {contentItem.reflection_questions && (
                                <div className="mb-3 p-3 bg-info bg-opacity-10 rounded border border-info">
                                  <h6 className="text-info mb-2">
                                    <FaInfoCircle className="me-2" />
                                    Reflection Questions
                                  </h6>
                                  <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {contentItem.reflection_questions}
                                  </div>
                                </div>
                              )}

                              {/* Discussion Prompts */}
                              {contentItem.discussion_prompts && (
                                <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded border border-primary">
                                  <h6 className="text-primary mb-2">
                                    <FaUser className="me-2" />
                                    Discussion Prompts
                                  </h6>
                                  <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {contentItem.discussion_prompts}
                                  </div>
                                </div>
                              )}

                              {/* Summary */}
                              {contentItem.summary && (
                                <div className="mb-3 p-3 bg-secondary bg-opacity-10 rounded">
                                  <h6 className="mb-2">
                                    <FaBook className="me-2" />
                                    Summary
                                  </h6>
                                  <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {contentItem.summary}
                                  </div>
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="d-flex gap-3 mb-2 flex-wrap">
                                {contentItem.estimated_minutes && (
                                  <small className="text-muted">
                                    <FaClockIcon className="me-1" />
                                    {contentItem.estimated_minutes} min
                                  </small>
                                )}
                                {contentItem.file_name && (
                                  <small className="text-muted">
                                    {contentItem.file_name}
                                    {contentItem.file_size && ` (${formatFileSize(contentItem.file_size)})`}
                                  </small>
                                )}
                              </div>
                              
                              {/* Embedded Content */}
                              {isVideo && contentItem.url && (
                                <div className="mb-3">
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
                                    <video controls className="w-100" style={{ maxHeight: '400px' }}>
                                      <source src={contentItem.url} type={contentItem.mime_type || 'video/mp4'} />
                                      Your browser does not support the video tag.
                                    </video>
                                  )}
                                </div>
                              )}
                              
                              {isImage && contentItem.url && (
                                <div className="mb-3">
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
                                      style={{ maxHeight: '300px', width: 'auto' }}
                                    />
                                  </a>
                                </div>
                              )}
                              
                              {/* Assignment PDFs */}
                              {contentItem.content_type === 'ASSIGNMENT' && (
                                <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded border border-warning">
                                  <h6 className="mb-3">
                                    <FaTasks className="me-2" />
                                    Assignment Materials
                                  </h6>
                                  <div className="d-flex flex-column gap-2">
                                    {contentItem.assignment_details_file_name && (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const { data, error } = await supabase.storage
                                              .from('course-content')
                                              .createSignedUrl(contentItem.assignment_details_file_path, 3600);
                                            
                                            if (error) throw error;
                                            if (data?.signedUrl) {
                                              window.open(data.signedUrl, '_blank');
                                            }
                                          } catch (err) {
                                            console.error('Error opening assignment details:', err);
                                            alert('Unable to open assignment details. Please contact your teacher.');
                                          }
                                        }}
                                        className="d-flex align-items-center justify-content-start"
                                      >
                                        <FaFilePdf className="me-2" />
                                        Download Assignment Details
                                        {contentItem.assignment_details_file_size && (
                                          <small className="ms-2">
                                            ({formatFileSize(contentItem.assignment_details_file_size)})
                                          </small>
                                        )}
                                      </Button>
                                    )}
                                    {contentItem.assignment_rubric_file_name && (
                                      <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const { data, error } = await supabase.storage
                                              .from('course-content')
                                              .createSignedUrl(contentItem.assignment_rubric_file_path, 3600);
                                            
                                            if (error) throw error;
                                            if (data?.signedUrl) {
                                              window.open(data.signedUrl, '_blank');
                                            }
                                          } catch (err) {
                                            console.error('Error opening assignment rubric:', err);
                                            alert('Unable to open assignment rubric. Please contact your teacher.');
                                          }
                                        }}
                                        className="d-flex align-items-center justify-content-start"
                                      >
                                        <FaFilePdf className="me-2" />
                                        Download Grading Rubric
                                        {contentItem.assignment_rubric_file_size && (
                                          <small className="ms-2">
                                            ({formatFileSize(contentItem.assignment_rubric_file_size)})
                                          </small>
                                        )}
                                      </Button>
                                    )}
                                    {!contentItem.assignment_details_file_name && !contentItem.assignment_rubric_file_name && (
                                      <p className="text-muted small mb-0">
                                        No assignment materials uploaded yet.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="d-flex gap-2 flex-wrap">
                                {contentItem.content_type === 'QUIZ' && quizStatuses[contentItem.content_id] ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => navigate(`/student/quizzes/${contentItem.content_id}`)}
                                    className="d-flex align-items-center"
                                  >
                                    <FaClipboardCheck className="me-2" />
                                    Take Quiz
                                  </Button>
                                ) : contentItem.content_type === 'QUIZ' && contentItem.url ? (
                                  <a
                                    href={contentItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm text-decoration-none d-flex align-items-center"
                                  >
                                    <FaExternalLinkAlt className="me-2" />
                                    Open Quiz
                                  </a>
                                ) : contentItem.content_type === 'ASSIGNMENT' && contentItem.url ? (
                                  <a
                                    href={contentItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm text-decoration-none d-flex align-items-center"
                                  >
                                    <FaExternalLinkAlt className="me-2" />
                                    Open Assignment Link
                                  </a>
                                ) : contentItem.url ? (
                                  <a
                                    href={contentItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm text-decoration-none d-flex align-items-center"
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
                                    className="d-flex align-items-center"
                                  >
                                    <FaDownload className="me-2" />
                                    Download
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </Card.Body>
              </Card>
            ));
          })()}
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


