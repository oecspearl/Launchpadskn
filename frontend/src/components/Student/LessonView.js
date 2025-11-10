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
  const [expandedItems, setExpandedItems] = useState({});
  const [allLessons, setAllLessons] = useState([]);
  
  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
      // Load completed content from localStorage
      const saved = localStorage.getItem(`lesson_${lessonId}_completed`);
      if (saved) {
        setCompletedContent(new Set(JSON.parse(saved)));
      }
    }
    // Fetch all lessons for the student
    if (user && (user.user_id || user.userId)) {
      fetchAllLessons();
    }
  }, [lessonId, user]);
  
  const fetchAllLessons = async () => {
    try {
      const studentId = user.user_id || user.userId;
      if (!studentId) return;
      
      // Get all lessons for the student (no date filter to get all)
      const lessons = await supabaseService.getLessonsByStudent(studentId, null, null);
      
      // Sort by date descending (most recent first)
      const sortedLessons = (lessons || []).sort((a, b) => {
        const dateA = new Date(a.lesson_date + 'T' + (a.start_time || '00:00:00'));
        const dateB = new Date(b.lesson_date + 'T' + (b.start_time || '00:00:00'));
        return dateB - dateA;
      });
      
      setAllLessons(sortedLessons);
    } catch (err) {
      console.error('Error fetching all lessons:', err);
    }
  };
  
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
  
  const toggleItem = (contentId) => {
    setExpandedItems(prev => ({
      ...prev,
      [contentId]: !prev[contentId]
    }));
  };
  
  const getContentIconClass = (contentType) => {
    switch (contentType) {
      case 'VIDEO': return 'video';
      case 'QUIZ': return 'quiz';
      case 'ASSIGNMENT': return 'assignment';
      case 'DOCUMENT':
      case 'FILE': return 'document';
      case 'LEARNING_ACTIVITIES': return 'activity';
      case 'LEARNING_OUTCOMES': return 'outcome';
      case 'KEY_CONCEPTS': return 'concept';
      case 'REFLECTION_QUESTIONS': return 'reflection';
      case 'DISCUSSION_PROMPTS': return 'discussion';
      case 'SUMMARY': return 'summary';
      default: return '';
    }
  };
  
  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'VIDEO': return <FaPlay />;
      case 'IMAGE': return <FaImage />;
      case 'QUIZ': return <FaClipboardCheck />;
      case 'ASSIGNMENT': return <FaTasks />;
      case 'DOCUMENT': return <FaFileAlt />;
      case 'FILE': return <FaFileAlt />;
      case 'LEARNING_ACTIVITIES': return <FaRocket />;
      case 'LEARNING_OUTCOMES': return <FaGraduationCap />;
      case 'KEY_CONCEPTS': return <FaLightbulb />;
      case 'REFLECTION_QUESTIONS': return <FaQuestionCircle />;
      case 'DISCUSSION_PROMPTS': return <FaComments />;
      case 'SUMMARY': return <FaBook />;
      default: return <FaBook />;
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
        <Container>
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
      
      <Container className="lesson-content-container" style={{ background: 'transparent', position: 'relative', zIndex: 2, paddingBottom: '3rem' }}>
        <div className="lesson-content-wrapper">
          {/* Left Sidebar */}
          <div className="lesson-sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Lesson filter</div>
              <div className="sidebar-filter">
                <select
                  className="sidebar-filter-select"
                  value={lessonId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId && selectedId !== lessonId) {
                      navigate(`/student/lessons/${selectedId}`);
                    }
                  }}
                >
                  {lesson && (
                    <option value={lessonId || ''}>
                      {lesson.lesson_title || 'Current Lesson'}
                    </option>
                  )}
                  {allLessons.filter(l => l.lesson_id !== parseInt(lessonId || 0)).map((l) => {
                    const lessonDate = l.lesson_date ? new Date(l.lesson_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return (
                      <option key={l.lesson_id} value={l.lesson_id}>
                        {l.lesson_title || 'Untitled Lesson'} - {lessonDate}
                      </option>
                    );
                  })}
                </select>
                <FaChevronDown style={{ 
                  fontSize: '0.75rem', 
                  color: '#5f6368',
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lesson-main-content">
            {/* Lesson Content - Google Classroom Style */}
            {lesson.content && lesson.content.length > 0 && lesson.content.map((contentItem, index) => {
                          const isCompleted = completedContent.has(contentItem.content_id);
              const isExpanded = expandedItems[contentItem.content_id] || false;
                          const isVideo = contentItem.content_type === 'VIDEO' || 
                                         (contentItem.url && (contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be')));
                          const isImage = contentItem.content_type === 'IMAGE' || 
                                         (contentItem.mime_type && contentItem.mime_type.startsWith('image/'));
              const iconClass = getContentIconClass(contentItem.content_type);
              
              // Get posted date
              const postedDate = contentItem.created_at || lesson.lesson_date;
              const dateStr = postedDate ? new Date(postedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                          
                          return (
                            <div 
                              key={contentItem.content_id || index} 
                  className={`classwork-item ${iconClass} ${isExpanded ? 'expanded' : ''} ${isCompleted ? 'selected' : ''}`}
                  onClick={() => toggleItem(contentItem.content_id)}
                >
                  <div className={`classwork-icon ${iconClass}`}>
                    {getContentIcon(contentItem.content_type)}
                  </div>
                  <div className="classwork-content">
                    <h3 className="classwork-title">
                      {contentItem.title || 'Material'}
                    </h3>
                    <p className="classwork-date">Posted {dateStr}</p>
                    
                    {isExpanded && (
                      <div className="classwork-expanded">
                        {/* Video Content */}
                        {isVideo && contentItem.url && (
                          <div className="classwork-video-container" onClick={(e) => e.stopPropagation()}>
                            {contentItem.url.includes('youtube.com') || contentItem.url.includes('youtu.be') ? (
                              <div className="ratio ratio-16x9" style={{ marginBottom: '1rem' }}>
                                <iframe
                                  src={getYouTubeEmbedUrl(contentItem.url)}
                                  title={contentItem.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ border: 0, borderRadius: '8px' }}
                                />
                              </div>
                            ) : (
                              <video 
                                controls 
                                className="w-100" 
                                style={{ maxHeight: '400px', borderRadius: '8px', marginBottom: '1rem' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <source src={contentItem.url} type={contentItem.mime_type || 'video/mp4'} />
                                Your browser does not support the video tag.
                              </video>
                            )}
                          </div>
                        )}
                        
                        {/* Image Content */}
                        {isImage && contentItem.url && (
                          <div className="classwork-image-container" onClick={(e) => e.stopPropagation()}>
                            <img 
                              src={contentItem.url} 
                              alt={contentItem.title}
                              className="w-100"
                              style={{ maxHeight: '400px', width: 'auto', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer' }}
                              onClick={() => window.open(contentItem.url, '_blank')}
                            />
                          </div>
                        )}
                        
                        {/* Text-only content types (Learning Activities, Learning Outcomes, etc.) */}
                        {['LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS', 
                          'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(contentItem.content_type) && (
                          <div className="classwork-text-content" style={{ 
                            marginBottom: '1rem', 
                            padding: '1rem', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ 
                              whiteSpace: 'pre-wrap', 
                              fontSize: '0.95rem', 
                              lineHeight: '1.6',
                              color: '#212529'
                            }}>
                              {contentItem.content_type === 'LEARNING_ACTIVITIES' && contentItem.learning_activities}
                              {contentItem.content_type === 'LEARNING_OUTCOMES' && contentItem.learning_outcomes}
                              {contentItem.content_type === 'KEY_CONCEPTS' && contentItem.key_concepts}
                              {contentItem.content_type === 'REFLECTION_QUESTIONS' && contentItem.reflection_questions}
                              {contentItem.content_type === 'DISCUSSION_PROMPTS' && contentItem.discussion_prompts}
                              {contentItem.content_type === 'SUMMARY' && contentItem.summary}
                            </div>
                          </div>
                        )}
                        
                        {/* Learning Outcomes (for non-text-only content types) */}
                        {!['LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS', 
                            'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(contentItem.content_type) && 
                         contentItem.learning_outcomes && (
                          <div>
                            <ul className="classwork-objectives">
                              {contentItem.learning_outcomes.split('\n').filter(obj => obj.trim()).map((obj, idx) => (
                                <li key={idx}>{obj.trim()}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                                  
                        {contentItem.description && (
                          <div className="classwork-info-box">
                            {contentItem.description}
                          </div>
                        )}
                                
                        {/* Attachments */}
                        {((contentItem.url && !isVideo && !isImage) || contentItem.file_path || contentItem.content_type === 'ASSIGNMENT') && (
                          <div className="classwork-attachments">
                            {contentItem.content_type === 'ASSIGNMENT' && contentItem.assignment_details_file_name && (
                              <div className="attachment-card" onClick={async (e) => {
                                e.stopPropagation();
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
                              }}>
                                <div className="attachment-thumbnail">
                                  <FaFilePdf style={{ fontSize: '1.5rem', color: '#ea4335' }} />
                                </div>
                                <div className="attachment-info">
                                  <div className="attachment-title">{contentItem.assignment_details_file_name}</div>
                                  <div className="attachment-type">PDF</div>
                                </div>
                              </div>
                            )}
                            
                            {contentItem.content_type === 'ASSIGNMENT' && contentItem.assignment_rubric_file_name && (
                              <div className="attachment-card" onClick={async (e) => {
                                e.stopPropagation();
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
                              }}>
                                <div className="attachment-thumbnail">
                                  <FaFilePdf style={{ fontSize: '1.5rem', color: '#ea4335' }} />
                                </div>
                                <div className="attachment-info">
                                  <div className="attachment-title">{contentItem.assignment_rubric_file_name}</div>
                                  <div className="attachment-type">PDF</div>
                                    </div>
                                  </div>
                                )}

                            {contentItem.file_path && (
                              <div className="attachment-card" onClick={async (e) => {
                                e.stopPropagation();
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
                              }}>
                                <div className="attachment-thumbnail">
                                  <FaFileAlt style={{ fontSize: '1.5rem', color: '#1a73e8' }} />
                                </div>
                                <div className="attachment-info">
                                  <div className="attachment-title">{contentItem.file_name || 'File'}</div>
                                  <div className="attachment-type">File</div>
                                </div>
                              </div>
                            )}
                            
                            {contentItem.url && !isVideo && !isImage && (
                              <div className="attachment-card" onClick={(e) => {
                                e.stopPropagation();
                                window.open(contentItem.url, '_blank');
                              }}>
                                <div className="attachment-thumbnail">
                                  <FaExternalLinkAlt style={{ fontSize: '1.5rem', color: '#5f6368' }} />
                                </div>
                                <div className="attachment-info">
                                  <div className="attachment-title">{contentItem.url.length > 50 ? contentItem.url.substring(0, 50) + '...' : contentItem.url}</div>
                                  <div className="attachment-type">Link</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="classwork-actions" onClick={(e) => e.stopPropagation()}>
                          {contentItem.content_type === 'QUIZ' && quizStatuses[contentItem.content_id] && (
                            <button 
                              className="classwork-action-btn primary"
                                      onClick={() => navigate(`/student/quizzes/${contentItem.content_id}`)}
                                    >
                                      Take Quiz
                            </button>
                          )}
                          {contentItem.content_type === 'ASSIGNMENT' && contentItem.url && (
                            <button 
                              className="classwork-action-btn primary"
                              onClick={() => window.open(contentItem.url, '_blank')}
                            >
                              Open Assignment
                            </button>
                          )}
                          <button 
                            className={`classwork-action-btn ${isCompleted ? 'primary' : ''}`}
                            onClick={() => toggleContentComplete(contentItem.content_id)}
                          >
                            {isCompleted ? 'Marked Complete' : 'Mark as Complete'}
                          </button>
                              </div>
                            </div>
                    )}
                  </div>
                  <div className="classwork-menu" onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(contentItem.content_id);
                  }}>
                    <FaChevronDown style={{ fontSize: '0.875rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                </div>
              );
            })}
            
          </div>
        </div>
      </Container>
    </div>
  );
}

export default LessonView;
