import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Badge, ListGroup, ProgressBar, Accordion
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaBook, FaClipboardList, FaUser, FaCheckCircle, FaInfoCircle, FaClock as FaClockIcon,
  FaClipboardCheck, FaTasks, FaFilePdf, FaDownload, FaExternalLinkAlt,
  FaPlay, FaImage, FaFileAlt, FaLightbulb, FaQuestionCircle, FaComments,
  FaGraduationCap, FaRocket, FaStar, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import './LessonView.css';

function LessonView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [quizStatuses, setQuizStatuses] = useState({});
  const [completedContent, setCompletedContent] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});
  
  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
      // Load completed content from localStorage
      const saved = localStorage.getItem(`lesson_${lessonId}_completed`);
      if (saved) {
        setCompletedContent(new Set(JSON.parse(saved)));
      }
    }
  }, [lessonId]);
  
  useEffect(() => {
    // Save completed content to localStorage
    if (lessonId && completedContent.size > 0) {
      localStorage.setItem(`lesson_${lessonId}_completed`, JSON.stringify([...completedContent]));
    }
  }, [completedContent, lessonId]);
  
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
                quizStatusMap[item.content_id] = false;
              }
            }));
            setQuizStatuses(quizStatusMap);
          }
        }
        
        // Get student's attendance for this lesson
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
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };
  
  const toggleContentComplete = (contentId) => {
    setCompletedContent(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });
  };
  
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };
  
  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'VIDEO': return <FaPlay className="text-danger" />;
      case 'IMAGE': return <FaImage className="text-info" />;
      case 'QUIZ': return <FaClipboardCheck className="text-success" />;
      case 'ASSIGNMENT': return <FaTasks className="text-warning" />;
      case 'DOCUMENT': return <FaFileAlt className="text-primary" />;
      case 'FILE': return <FaFileAlt className="text-secondary" />;
      default: return <FaBook className="text-muted" />;
    }
  };
  
  const getContentColor = (contentType) => {
    switch (contentType) {
      case 'VIDEO': return 'danger';
      case 'IMAGE': return 'info';
      case 'QUIZ': return 'success';
      case 'ASSIGNMENT': return 'warning';
      case 'DOCUMENT': return 'primary';
      case 'FILE': return 'secondary';
      default: return 'muted';
    }
  };
  
  // Calculate progress
  const calculateProgress = () => {
    if (!lesson?.content || lesson.content.length === 0) return 0;
    return Math.round((completedContent.size / lesson.content.length) * 100);
  };
  
  if (isLoading) {
    return (
      <div className="lesson-view-container" style={{ background: 'transparent', minHeight: '100vh', padding: '3rem 0' }}>
        <Container>
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3 text-muted">Loading lesson details...</p>
          </div>
        </Container>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="lesson-view-container" style={{ background: 'transparent', minHeight: '100vh', padding: '3rem 0' }}>
        <Container>
          <Alert variant="danger">{error}</Alert>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </Container>
      </div>
    );
  }
  
  if (!lesson) {
    return (
      <div className="lesson-view-container" style={{ background: 'transparent', minHeight: '100vh', padding: '3rem 0' }}>
        <Container>
          <Alert variant="warning">Lesson not found</Alert>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </Container>
      </div>
    );
  }
  
  const progress = calculateProgress();
  const contentCount = lesson.content?.length || 0;
  const completedCount = completedContent.size;
  
  return (
    <div className="lesson-view-container" style={{ background: 'transparent', minHeight: '100vh', width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', marginTop: '-1.5rem', marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}>
      {/* Hero Header */}
      <div className="lesson-hero-header" style={{ marginTop: 0, marginBottom: 0 }}>
        <Container fluid style={{ maxWidth: '100%', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <Button 
            variant="light" 
            className="mb-3 back-button"
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
          
          <div className="hero-content">
            <div className="hero-badge mb-2">
              <Badge bg="light" text="dark" className="px-3 py-2" style={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                {getSubjectName()}
              </Badge>
            </div>
            <h1 className="lesson-title">{lesson.lesson_title || 'Lesson'}</h1>
            <p className="lesson-subtitle">
              {getFormName()} • {getClassName()} • {formatDate(lesson.lesson_date)}
            </p>
            
            {/* Progress Bar */}
            {contentCount > 0 && (
              <div className="progress-section mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="progress-label">
                    <FaRocket className="me-2" />
                    Your Progress
                  </span>
                  <span className="progress-text">
                    {completedCount} of {contentCount} completed
                  </span>
                </div>
                <ProgressBar 
                  now={progress} 
                  variant="success" 
                  className="progress-bar-custom"
                  style={{ height: '10px', borderRadius: '10px' }}
                />
                {progress === 100 && (
                  <div className="text-center mt-2">
                    <Badge bg="success" className="px-3 py-2">
                      <FaStar className="me-2" />
                      Lesson Complete! Great job!
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </div>
      
      <Container fluid className="lesson-content-container" style={{ background: 'transparent', position: 'relative', zIndex: 2, paddingBottom: '3rem', maxWidth: '100%', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <Row className="g-4" style={{ marginLeft: 0, marginRight: 0 }}>
          {/* Main Lesson Content */}
          <Col lg={8}>
            {/* Lesson Info Card */}
            <Card className="lesson-info-card mb-4">
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={4}>
                    <div className="info-item">
                      <FaCalendarAlt className="info-icon text-primary" />
                      <div>
                        <div className="info-label">Date</div>
                        <div className="info-value">{formatDate(lesson.lesson_date)}</div>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="info-item">
                      <FaClock className="info-icon text-success" />
                      <div>
                        <div className="info-label">Time</div>
                        <div className="info-value">
                          {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                        </div>
                      </div>
                    </div>
                  </Col>
                  {lesson.location && (
                    <Col md={4}>
                      <div className="info-item">
                        <FaMapMarkerAlt className="info-icon text-danger" />
                        <div>
                          <div className="info-label">Location</div>
                          <div className="info-value">{lesson.location}</div>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
            
            {/* Topic & Objectives */}
            {(lesson.topic || lesson.learning_objectives) && (
              <Card className="lesson-section-card mb-4">
                <Card.Body className="p-4">
                  {lesson.topic && (
                    <div className="mb-4">
                      <h4 className="section-title">
                        <FaBook className="me-2 text-primary" />
                        Topic
                      </h4>
                      <p className="topic-text">{lesson.topic}</p>
                    </div>
                  )}
                  
                  {lesson.learning_objectives && (
                    <div>
                      <h4 className="section-title">
                        <FaGraduationCap className="me-2 text-success" />
                        Learning Objectives
                      </h4>
                      <div className="objectives-list">
                        {lesson.learning_objectives.split('\n').filter(obj => obj.trim()).map((obj, idx) => (
                          <div key={idx} className="objective-item">
                            <FaCheckCircle className="objective-icon" />
                            <span>{obj.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
            
            {/* Homework Card */}
            {lesson.homework_description && (
              <Card className="homework-card mb-4 border-warning">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="homework-icon">
                      <FaClipboardList />
                    </div>
                    <div>
                      <h4 className="mb-0">Homework Assignment</h4>
                      {lesson.homework_due_date && (
                        <small className="text-muted">
                          Due: {formatDate(lesson.homework_due_date)}
                        </small>
                      )}
                    </div>
                  </div>
                  <p className="homework-text mb-0">{lesson.homework_description}</p>
                </Card.Body>
              </Card>
            )}
            
            {/* Lesson Content - Organized by Sections */}
            {lesson.content && lesson.content.length > 0 && (() => {
              const sections = {};
              lesson.content.forEach(item => {
                const section = item.content_section || 'Main Content';
                if (!sections[section]) {
                  sections[section] = [];
                }
                sections[section].push(item);
              });

              return Object.entries(sections).map(([sectionName, sectionContent]) => {
                const isExpanded = expandedSections[sectionName] !== false; // Default to expanded
                const sectionProgress = sectionContent.filter(item => 
                  completedContent.has(item.content_id)
                ).length;
                const sectionTotal = sectionContent.length;
                
                return (
                  <Card key={sectionName} className="content-section-card mb-4">
                    <Card.Header 
                      className="section-header"
                      onClick={() => toggleSection(sectionName)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <h5 className="mb-0 me-3">
                            {getContentIcon(sectionContent[0]?.content_type || 'BOOK')}
                            <span className="ms-2">{sectionName}</span>
                          </h5>
                          <Badge bg="secondary" className="ms-2">
                            {sectionContent.length} items
                          </Badge>
                          {sectionTotal > 0 && (
                            <Badge bg="success" className="ms-2">
                              {sectionProgress}/{sectionTotal} complete
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </Card.Header>
                    {isExpanded && (
                      <Card.Body className="p-0">
                        {sectionContent.map((contentItem, index) => {
                          const isCompleted = completedContent.has(contentItem.content_id);
                          const isVideo = contentItem.content_type === 'VIDEO' || 
                                         (contentItem.url && (contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be')));
                          const isImage = contentItem.content_type === 'IMAGE' || 
                                         (contentItem.mime_type && contentItem.mime_type.startsWith('image/'));
                          
                          return (
                            <div 
                              key={contentItem.content_id || index} 
                              className={`content-item ${isCompleted ? 'completed' : ''}`}
                            >
                              <div className="content-item-header">
                                <div className="content-number">
                                  <Badge bg={getContentColor(contentItem.content_type)} className="number-badge">
                                    {contentItem.sequence_order || index + 1}
                                  </Badge>
                                </div>
                                <div className="content-title-section">
                                  <div className="d-flex align-items-center flex-wrap">
                                    <h6 className="content-title mb-0 me-2">
                                      {getContentIcon(contentItem.content_type)}
                                      <span className="ms-2">{contentItem.title || 'Material'}</span>
                                    </h6>
                                    <Badge bg={getContentColor(contentItem.content_type)} className="me-2">
                                      {contentItem.content_type}
                                    </Badge>
                                    {contentItem.is_required === false ? (
                                      <Badge bg="info">Optional</Badge>
                                    ) : (
                                      <Badge bg="success">
                                        <FaCheckCircle className="me-1" />
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {contentItem.description && (
                                    <p className="content-description mb-2">{contentItem.description}</p>
                                  )}
                                  
                                  {contentItem.estimated_minutes && (
                                    <small className="text-muted">
                                      <FaClockIcon className="me-1" />
                                      {contentItem.estimated_minutes} minutes
                                    </small>
                                  )}
                                </div>
                                <div className="content-actions">
                                  <Button
                                    variant={isCompleted ? "success" : "outline-secondary"}
                                    size="sm"
                                    onClick={() => toggleContentComplete(contentItem.content_id)}
                                    className="complete-btn"
                                  >
                                    {isCompleted ? (
                                      <>
                                        <FaCheckCircle className="me-1" />
                                        Done
                                      </>
                                    ) : (
                                      'Mark Complete'
                                    )}
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="content-item-body">
                                {/* Instructions */}
                                {contentItem.instructions && (
                                  <Alert variant="info" className="instruction-alert">
                                    <FaInfoCircle className="me-2" />
                                    <strong>Instructions:</strong> {contentItem.instructions}
                                  </Alert>
                                )}
                                
                                {/* Learning Outcomes */}
                                {contentItem.learning_outcomes && (
                                  <div className="info-box learning-outcomes">
                                    <h6>
                                      <FaCheckCircle className="me-2 text-success" />
                                      Learning Outcomes
                                    </h6>
                                    <div className="white-space-pre-wrap">{contentItem.learning_outcomes}</div>
                                  </div>
                                )}
                                
                                {/* Learning Activities */}
                                {contentItem.learning_activities && (
                                  <div className="info-box learning-activities">
                                    <h6>
                                      <FaRocket className="me-2 text-primary" />
                                      Learning Activities
                                    </h6>
                                    <div className="white-space-pre-wrap">{contentItem.learning_activities}</div>
                                  </div>
                                )}
                                
                                {/* Key Concepts */}
                                {contentItem.key_concepts && (
                                  <div className="info-box key-concepts">
                                    <h6>
                                      <FaLightbulb className="me-2 text-warning" />
                                      Key Concepts
                                    </h6>
                                    <div className="white-space-pre-wrap">{contentItem.key_concepts}</div>
                                  </div>
                                )}
                                
                                {/* Reflection Questions */}
                                {contentItem.reflection_questions && (
                                  <div className="info-box reflection-questions">
                                    <h6>
                                      <FaQuestionCircle className="me-2 text-info" />
                                      Reflection Questions
                                    </h6>
                                    <div className="white-space-pre-wrap">{contentItem.reflection_questions}</div>
                                  </div>
                                )}
                                
                                {/* Discussion Prompts */}
                                {contentItem.discussion_prompts && (
                                  <div className="info-box discussion-prompts">
                                    <h6>
                                      <FaComments className="me-2 text-primary" />
                                      Discussion Prompts
                                    </h6>
                                    <div className="white-space-pre-wrap">{contentItem.discussion_prompts}</div>
                                  </div>
                                )}
                                
                                {/* Summary */}
                                {contentItem.summary && (
                                  <div className="info-box summary">
                                    <h6>
                                      <FaBook className="me-2 text-secondary" />
                                      Summary
                                    </h6>
                                    <div className="white-space-pre-wrap">{contentItem.summary}</div>
                                  </div>
                                )}
                                
                                {/* Embedded Content */}
                                {isVideo && contentItem.url && (
                                  <div className="media-container mb-3">
                                    {contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be') ? (
                                      <div className="ratio ratio-16x9">
                                        <iframe
                                          src={getYouTubeEmbedUrl(contentItem.url)}
                                          title={contentItem.title}
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          style={{ border: 0, borderRadius: '8px' }}
                                        />
                                      </div>
                                    ) : (
                                      <video controls className="w-100 rounded" style={{ maxHeight: '400px' }}>
                                        <source src={contentItem.url} type={contentItem.mime_type || 'video/mp4'} />
                                        Your browser does not support the video tag.
                                      </video>
                                    )}
                                  </div>
                                )}
                                
                                {isImage && contentItem.url && (
                                  <div className="media-container mb-3">
                                    <a
                                      href={contentItem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: 'block', cursor: 'pointer' }}
                                    >
                                      <img 
                                        src={contentItem.url} 
                                        alt={contentItem.title}
                                        className="img-fluid rounded shadow-sm"
                                        style={{ maxHeight: '400px', width: 'auto' }}
                                      />
                                    </a>
                                  </div>
                                )}
                                
                                {/* Assignment PDFs */}
                                {contentItem.content_type === 'ASSIGNMENT' && (
                                  <div className="assignment-materials mb-3">
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
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="content-actions-bottom d-flex gap-2 flex-wrap">
                                  {contentItem.content_type === 'QUIZ' && quizStatuses[contentItem.content_id] ? (
                                    <Button
                                      variant="success"
                                      size="lg"
                                      onClick={() => navigate(`/student/quizzes/${contentItem.content_id}`)}
                                      className="action-button"
                                    >
                                      <FaClipboardCheck className="me-2" />
                                      Take Quiz
                                    </Button>
                                  ) : contentItem.content_type === 'QUIZ' && contentItem.url ? (
                                    <Button
                                      variant="primary"
                                      size="lg"
                                      href={contentItem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="action-button"
                                    >
                                      <FaExternalLinkAlt className="me-2" />
                                      Open Quiz
                                    </Button>
                                  ) : contentItem.content_type === 'ASSIGNMENT' && contentItem.url ? (
                                    <Button
                                      variant="warning"
                                      size="lg"
                                      href={contentItem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="action-button"
                                    >
                                      <FaExternalLinkAlt className="me-2" />
                                      Open Assignment Link
                                    </Button>
                                  ) : contentItem.url ? (
                                    <Button
                                      variant="primary"
                                      size="lg"
                                      href={contentItem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="action-button"
                                    >
                                      {isVideo ? (
                                        <>
                                          <FaPlay className="me-2" />
                                          Watch Video
                                        </>
                                      ) : isImage ? (
                                        <>
                                          <FaImage className="me-2" />
                                          View Image
                                        </>
                                      ) : (
                                        <>
                                          <FaExternalLinkAlt className="me-2" />
                                          Open Link
                                        </>
                                      )}
                                    </Button>
                                  ) : contentItem.file_path ? (
                                    <Button
                                      variant="primary"
                                      size="lg"
                                      onClick={async () => {
                                        try {
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
                                      className="action-button"
                                    >
                                      <FaDownload className="me-2" />
                                      Download File
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </Card.Body>
                    )}
                  </Card>
                );
              });
            })()}
          </Col>
          
          {/* Sidebar */}
          <Col lg={4}>
            {/* Attendance Status */}
            {user?.role?.toLowerCase() === 'student' && attendance && (
              <Card className="sidebar-card mb-4">
                <Card.Body className="p-4">
                  <h6 className="mb-3">
                    <FaCheckCircle className="me-2" />
                    My Attendance
                  </h6>
                  <Badge 
                    bg={
                      attendance.status === 'PRESENT' ? 'success' :
                      attendance.status === 'ABSENT' ? 'danger' :
                      attendance.status === 'LATE' ? 'warning' :
                      'secondary'
                    }
                    className="attendance-badge"
                  >
                    {attendance.status || 'Not Marked'}
                  </Badge>
                  {attendance.notes && (
                    <p className="mt-3 mb-0 small text-muted">
                      {attendance.notes}
                    </p>
                  )}
                </Card.Body>
              </Card>
            )}
            
            {/* Teacher Info */}
            <Card className="sidebar-card mb-4">
              <Card.Body className="p-4">
                <h6 className="mb-3">
                  <FaUser className="me-2" />
                  Teacher
                </h6>
                <div className="teacher-info">
                  <strong>{getTeacherName()}</strong>
                  <br />
                  <small className="text-muted">{getSubjectName()}</small>
                </div>
              </Card.Body>
            </Card>
            
            {/* Class Info */}
            <Card className="sidebar-card">
              <Card.Body className="p-4">
                <h6 className="mb-3">
                  <FaBook className="me-2" />
                  Class Information
                </h6>
                <div className="class-info">
                  <div className="mb-2">
                    <strong>Form:</strong> {getFormName()}
                  </div>
                  <div className="mb-2">
                    <strong>Class:</strong> {getClassName()}
                  </div>
                  <div>
                    <strong>Subject:</strong> {getSubjectName()}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default LessonView;
