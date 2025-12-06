import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Badge, ListGroup, ProgressBar, Accordion, Modal
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaBook, FaClipboardList, FaUser, FaCheckCircle, FaInfoCircle, FaClock as FaClockIcon,
  FaClipboardCheck, FaTasks, FaFilePdf, FaDownload, FaExternalLinkAlt,
  FaPlay, FaImage, FaFileAlt, FaLightbulb, FaQuestionCircle, FaComments,
  FaGraduationCap, FaRocket, FaStar, FaChevronDown, FaChevronUp,
  FaSearch, FaFilter, FaLock, FaArrowRight, FaHashtag, FaCube, FaVideo, FaDoorOpen
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import collaborationService from '../../services/collaborationService';
import { supabase } from '../../config/supabase';
import FlashcardViewer from './FlashcardViewer';
import InteractiveVideoViewer from './InteractiveVideoViewer';
import InteractiveBookPlayer from './InteractiveBookPlayer';
import ModelViewerComponent from '../InteractiveContent/Viewers/ModelViewerComponent';
import ViewerErrorBoundary from '../InteractiveContent/Viewers/ViewerErrorBoundary';
import DiscussionBoard from './DiscussionBoard';
import './LessonView.css';

function LessonView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [virtualClassroom, setVirtualClassroom] = useState(null);
  const [quizStatuses, setQuizStatuses] = useState({});
  const [completedContent, setCompletedContent] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [allLessons, setAllLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, completed, incomplete
  const [filterCategory, setFilterCategory] = useState('all'); // all, learning, practice, assessments, resources, homework
  const [showFlashcardViewer, setShowFlashcardViewer] = useState(false);
  const [currentFlashcardContent, setCurrentFlashcardContent] = useState(null);
  const [showInteractiveVideoViewer, setShowInteractiveVideoViewer] = useState(false);
  const [currentInteractiveVideoContent, setCurrentInteractiveVideoContent] = useState(null);
  const [showInteractiveBookPlayer, setShowInteractiveBookPlayer] = useState(false);
  const [currentInteractiveBookContent, setCurrentInteractiveBookContent] = useState(null);
  const [show3DModelViewer, setShow3DModelViewer] = useState(false);
  const [current3DModelContent, setCurrent3DModelContent] = useState(null);
  const [showDiscussionSidebar, setShowDiscussionSidebar] = useState(false);

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
      // Use numeric user_id, not UUID
      let studentId = user.user_id;

      // If user_id is not available or is a UUID, convert it
      if (!studentId || (typeof studentId === 'string' && studentId.includes('-'))) {
        const userIdToLookup = user.userId || user.id || studentId;
        if (userIdToLookup && typeof userIdToLookup === 'string' && userIdToLookup.includes('-')) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('user_id')
            .eq('id', userIdToLookup)
            .maybeSingle();

          if (userProfile && userProfile.user_id) {
            studentId = userProfile.user_id;
          } else {
            console.warn('[LessonView] Could not find user_id for UUID:', userIdToLookup);
            return;
          }
        }
      }

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
        if (user && user.role?.toLowerCase() === 'student') {
          // Use numeric user_id, not UUID
          let studentId = user.user_id;

          // If user_id is not available or is a UUID, convert it
          if (!studentId || (typeof studentId === 'string' && studentId.includes('-'))) {
            // It's a UUID, need to get the numeric user_id
            const userIdToLookup = user.userId || user.id || studentId;
            if (userIdToLookup && typeof userIdToLookup === 'string' && userIdToLookup.includes('-')) {
              const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', userIdToLookup)
                .maybeSingle();

              if (userProfile && userProfile.user_id) {
                studentId = userProfile.user_id;
              } else {
                console.warn('[LessonView] Could not find user_id for UUID:', userIdToLookup);
                setIsLoading(false);
                return;
              }
            }
          }

          const { data: attendanceData } = await supabase
            .from('lesson_attendance')
            .select('*')
            .eq('lesson_id', lessonId)
            .eq('student_id', studentId)
            .maybeSingle();

          setAttendance(attendanceData);
        }

        // Fetch virtual classroom if session_id exists
        if (lessonData?.session_id) {
          try {
            const classroom = await collaborationService.getVirtualClassroom(lessonData.session_id);
            setVirtualClassroom(classroom);
          } catch (err) {
            console.error('Error fetching virtual classroom:', err);
            // Virtual classroom might not exist yet, that's okay
          }
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
      case 'FLASHCARD': return 'flashcard';
      case 'INTERACTIVE_VIDEO': return 'video';
      case 'INTERACTIVE_BOOK': return 'book';
      case '3D_MODEL': return '3d-model';
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
      case 'FLASHCARD': return <FaClipboardList />;
      case 'INTERACTIVE_VIDEO': return <FaPlay />;
      case 'INTERACTIVE_BOOK': return <FaBook />;
      case '3D_MODEL': return <FaCube />;
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

  // Categorize content into Learning, Assessments, Resources, Practice, Homework, and Closure
  const categorizeContent = (content) => {
    if (!content || content.length === 0) {
      return { learning: [], assessments: [], resources: [], practice: [], homework: [], closure: [] };
    }

    const categories = {
      learning: [],
      assessments: [],
      resources: [],
      practice: [],
      homework: [],
      closure: []
    };

    content.forEach(item => {
      // Special handling: FLASHCARD, INTERACTIVE_VIDEO, INTERACTIVE_BOOK, and 3D_MODEL content types always go to Learning section
      if (item.content_type === 'FLASHCARD' || item.content_type === 'INTERACTIVE_VIDEO' || item.content_type === 'INTERACTIVE_BOOK' || item.content_type === '3D_MODEL') {
        categories.learning.push(item);
        return;
      }

      // First, check if content_section is explicitly set to one of our main categories
      // This takes priority over content_type-based categorization
      const contentSection = item.content_section?.trim()?.toLowerCase() || '';

      // Check for exact matches and variations (case-insensitive)
      if (contentSection === 'homework') {
        categories.homework.push(item);
      } else if (contentSection === 'practice') {
        categories.practice.push(item);
      } else if (contentSection === 'assessments' || contentSection === 'assessment') {
        categories.assessments.push(item);
      } else if (contentSection === 'resources' || contentSection === 'resource') {
        categories.resources.push(item);
      } else if (contentSection === 'learning' || contentSection === 'main content') {
        categories.learning.push(item);
      } else if (contentSection === 'closure') {
        categories.closure.push(item);
      } else {
        // Fall back to content_type-based categorization if content_section is not set or doesn't match
        // This ensures backward compatibility with existing content
        const contentType = item.content_type;

        // Assessments
        if (['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'].includes(contentType)) {
          categories.assessments.push(item);
        }
        // Closure content (Summary, Reflection, etc.)
        else if (['SUMMARY', 'REFLECTION_QUESTIONS'].includes(contentType)) {
          categories.closure.push(item);
        }
        // Learning content (including interactive content like flashcards)
        else if (['LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS',
          'DISCUSSION_PROMPTS',
          'VIDEO', 'IMAGE', 'DOCUMENT', 'FLASHCARD', 'INTERACTIVE_VIDEO', '3D_MODEL'].includes(contentType)) {
          categories.learning.push(item);
        }
        // Resources (files and links)
        else if (['FILE', 'LINK'].includes(contentType)) {
          categories.resources.push(item);
        }
        // Default: treat as learning content
        else {
          categories.learning.push(item);
        }
      }
    });

    return categories;
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!lesson?.content || lesson.content.length === 0) return 0;
    return Math.round((completedContent.size / lesson.content.length) * 100);
  };

  // Calculate progress per section
  const calculateSectionProgress = (sectionContent) => {
    if (!sectionContent || sectionContent.length === 0) return 0;
    const completed = sectionContent.filter(item => completedContent.has(item.content_id)).length;
    return Math.round((completed / sectionContent.length) * 100);
  };

  // Calculate total estimated time for content
  const calculateEstimatedTime = (content) => {
    if (!content || content.length === 0) return 0;
    return content.reduce((total, item) => {
      return total + (item.estimated_minutes || 0);
    }, 0);
  };

  // Check if prerequisites are met
  // First checks explicit prerequisites set by teacher, then falls back to sequence_order
  const checkPrerequisites = (item, allContent) => {
    // Check explicit prerequisites first (set by teacher)
    if (item.prerequisite_content_ids && item.prerequisite_content_ids.length > 0) {
      const prerequisiteItems = allContent.filter(c =>
        item.prerequisite_content_ids.includes(c.content_id)
      );

      const missing = prerequisiteItems.filter(prereq => !completedContent.has(prereq.content_id));

      return {
        met: missing.length === 0,
        missing: missing.map(p => p.title)
      };
    }

    // Fall back to sequence_order-based prerequisites (automatic)
    if (!item.sequence_order || item.sequence_order <= 1) return { met: true, missing: [] };

    const prerequisites = allContent.filter(c =>
      c.sequence_order < item.sequence_order &&
      c.sequence_order > 0
    );

    const missing = prerequisites.filter(prereq => !completedContent.has(prereq.content_id));

    return {
      met: missing.length === 0,
      missing: missing.map(p => p.title)
    };
  };

  // Filter and search content
  const filterAndSearchContent = (content) => {
    if (!content) return [];

    let filtered = [...content];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.content_type?.toLowerCase().includes(query)
      );
    }

    // Filter by completion status
    if (filterType === 'completed') {
      filtered = filtered.filter(item => completedContent.has(item.content_id));
    } else if (filterType === 'incomplete') {
      filtered = filtered.filter(item => !completedContent.has(item.content_id));
    }

    // Filter by category (will be applied after categorization)

    // Sort by sequence_order
    filtered.sort((a, b) => {
      const orderA = a.sequence_order || 999;
      const orderB = b.sequence_order || 999;
      return orderA - orderB;
    });

    return filtered;
  };

  // Filter categorized content by selected category
  const getFilteredCategorizedContent = (categorized) => {
    // Ensure closure category exists
    if (!categorized.closure) {
      categorized.closure = [];
    }
    if (filterCategory === 'all') return categorized;

    const filtered = { ...categorized };
    Object.keys(filtered).forEach(key => {
      if (key !== filterCategory) {
        filtered[key] = [];
      }
    });
    return filtered;
  };

  if (isLoading) {
    return (
      <div className="lesson-view-container" style={{ minHeight: '100vh', padding: '3rem 0' }}>
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
      <div className="lesson-view-container" style={{ minHeight: '100vh', padding: '3rem 0' }}>
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
      <div className="lesson-view-container" style={{ minHeight: '100vh', padding: '3rem 0' }}>
        <Container>
          <Alert variant="warning">Lesson not found</Alert>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </Container>
      </div>
    );
  }

  // Render a single content item
  const renderContentItem = (contentItem, index) => {
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

    // Check prerequisites
    const prerequisites = checkPrerequisites(contentItem, lesson.content || []);

    // Get sequence order
    const sequenceOrder = contentItem.sequence_order;

    return (
      <div
        key={contentItem.content_id || index}
        className={`classwork-item ${iconClass} ${isExpanded ? 'expanded' : ''} ${isCompleted ? 'selected' : ''} ${!prerequisites.met ? 'prerequisite-locked' : ''}`}
        onClick={() => toggleItem(contentItem.content_id)}
      >
        <div className={`classwork-icon ${iconClass}`}>
          {getContentIcon(contentItem.content_type)}
        </div>
        <div className="classwork-content">
          <div className="d-flex align-items-start justify-content-between">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                {sequenceOrder && sequenceOrder > 0 && (
                  <Badge bg="secondary" className="sequence-badge">
                    <FaHashtag className="me-1" style={{ fontSize: '0.7rem' }} />
                    {sequenceOrder}
                  </Badge>
                )}
                <h3 className="classwork-title mb-0">
                  {contentItem.title || 'Material'}
                </h3>
                {contentItem.content_type === 'FLASHCARD' && contentItem.content_data?.cards && (
                  <Badge bg="info" className="ms-2">
                    {contentItem.content_data.cards.length} card{contentItem.content_data.cards.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {contentItem.content_type === 'INTERACTIVE_BOOK' && contentItem.content_data?.pages && (
                  <Badge bg="info" className="ms-2">
                    {contentItem.content_data.pages.length} page{contentItem.content_data.pages.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <p className="classwork-date mb-0">Posted {dateStr}</p>
                {contentItem.estimated_minutes && contentItem.estimated_minutes > 0 && (
                  <span className="content-time-badge">
                    <FaClock className="me-1" style={{ fontSize: '0.75rem' }} />
                    {contentItem.estimated_minutes} {contentItem.estimated_minutes === 1 ? 'min' : 'mins'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Prerequisite Warning */}
          {!prerequisites.met && prerequisites.missing.length > 0 && (
            <Alert variant="warning" className="mt-2 mb-2 prerequisite-alert">
              <FaLock className="me-2" />
              <strong>Prerequisites required:</strong> Please complete the following items first: {prerequisites.missing.join(', ')}
            </Alert>
          )}

          {/* Flashcard Preview (Collapsed State) */}
          {!isExpanded && contentItem.content_type === 'FLASHCARD' && contentItem.content_data?.cards && (
            <div className="classwork-preview-info mt-2">
              <Badge bg="info" className="me-2">
                <FaClipboardList className="me-1" />
                {contentItem.content_data.cards.length} Flashcard{contentItem.content_data.cards.length !== 1 ? 's' : ''}
              </Badge>
              {contentItem.description && (
                <span className="text-muted small">{contentItem.description.substring(0, 100)}{contentItem.description.length > 100 ? '...' : ''}</span>
              )}
            </div>
          )}

          {/* Interactive Book Preview (Collapsed State) */}
          {!isExpanded && contentItem.content_type === 'INTERACTIVE_BOOK' && contentItem.content_data?.pages && (
            <div className="classwork-preview-info mt-2">
              <Badge bg="info" className="me-2">
                <FaBook className="me-1" />
                {contentItem.content_data.pages.length} Page{contentItem.content_data.pages.length !== 1 ? 's' : ''}
              </Badge>
              {contentItem.description && (
                <span className="text-muted small">{contentItem.description.substring(0, 100)}{contentItem.description.length > 100 ? '...' : ''}</span>
              )}
            </div>
          )}

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
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.95rem',
                      lineHeight: '1.6'
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

              {/* Flashcard Preview */}
              {contentItem.content_type === 'FLASHCARD' && contentItem.content_data && (
                <div className="classwork-info-box">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="info">Flashcard Set</Badge>
                    {contentItem.content_data.cards && (
                      <span className="text-muted">
                        {contentItem.content_data.cards.length} card{contentItem.content_data.cards.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {contentItem.description && (
                    <div className="mt-2">{contentItem.description}</div>
                  )}
                  {!contentItem.description && contentItem.content_data.cards && contentItem.content_data.cards.length > 0 && (
                    <div className="mt-2 text-muted small">
                      Click "Study Flashcards" to begin studying this flashcard set.
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Video Preview */}
              {contentItem.content_type === 'INTERACTIVE_VIDEO' && contentItem.content_data && (
                <div className="classwork-info-box">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="primary">Interactive Video</Badge>
                    {contentItem.content_data.checkpoints && (
                      <span className="text-muted">
                        {contentItem.content_data.checkpoints.length} checkpoint{contentItem.content_data.checkpoints.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {contentItem.description && (
                    <div className="mt-2">{contentItem.description}</div>
                  )}
                  {!contentItem.description && (
                    <div className="mt-2 text-muted small">
                      Click "Watch Interactive Video" to view this video with interactive checkpoints.
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Book Preview */}
              {contentItem.content_type === 'INTERACTIVE_BOOK' && contentItem.content_data && (
                <div className="classwork-info-box">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="primary">Interactive Book</Badge>
                    {contentItem.content_data.pages && (
                      <span className="text-muted">
                        {contentItem.content_data.pages.length} page{contentItem.content_data.pages.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {contentItem.description && (
                    <div className="mt-2">{contentItem.description}</div>
                  )}
                  {!contentItem.description && (
                    <div className="mt-2 text-muted small">
                      Click "Read Interactive Book" to view this multi-page interactive content.
                    </div>
                  )}
                </div>
              )}

              {/* 3D Model - Embedded Viewer */}
              {contentItem.content_type === '3D_MODEL' && (
                <div className="classwork-3d-model-container" onClick={(e) => e.stopPropagation()}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="primary">3D Model / AR/VR</Badge>
                      {contentItem.metadata && (() => {
                        try {
                          const metadata = typeof contentItem.metadata === 'string'
                            ? JSON.parse(contentItem.metadata)
                            : contentItem.metadata;
                          if (metadata.content_type) {
                            return <Badge bg="secondary">{metadata.content_type.replace('_', ' ')}</Badge>;
                          }
                        } catch (e) { }
                        return null;
                      })()}
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setCurrent3DModelContent(contentItem);
                        setShow3DModelViewer(true);
                      }}
                    >
                      <FaCube className="me-2" />
                      Full Screen
                    </Button>
                  </div>
                  {contentItem.description && (
                    <div className="mb-3">{contentItem.description}</div>
                  )}
                  {contentItem.url ? (
                    <div style={{
                      width: '100%',
                      height: '500px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #dee2e6',
                      backgroundColor: '#1a1a1a'
                    }}>
                      <ViewerErrorBoundary>
                        <ModelViewerComponent
                          contentUrl={contentItem.url}
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
                  ) : (
                    <Alert variant="warning">
                      No 3D model URL configured. Please contact your teacher.
                    </Alert>
                  )}
                  <div className="mt-2 small text-muted">
                    <strong>Tips:</strong> Click and drag to rotate • Scroll to zoom • Use AR button (if available) to view in augmented reality
                  </div>
                </div>
              )}

              {contentItem.description && contentItem.content_type !== 'FLASHCARD' && contentItem.content_type !== 'INTERACTIVE_VIDEO' && contentItem.content_type !== 'INTERACTIVE_BOOK' && contentItem.content_type !== '3D_MODEL' && (
                <div className="classwork-info-box">
                  {contentItem.description}
                </div>
              )}

              {/* Assignment Rubric (from instructions field) */}
              {contentItem.content_type === 'ASSIGNMENT' && contentItem.instructions && (
                <div className="mt-3">
                  {(() => {
                    // Check if instructions contain rubric (separated by "--- RUBRIC ---")
                    const instructions = contentItem.instructions;
                    const rubricIndex = instructions.indexOf('--- RUBRIC ---');

                    if (rubricIndex !== -1) {
                      // Extract rubric text
                      const rubricText = instructions.substring(rubricIndex + '--- RUBRIC ---'.length).trim();
                      const assignmentDesc = instructions.substring(0, rubricIndex).trim();

                      // Parse rubric text into structured data for table display
                      const parseRubric = (text) => {
                        const lines = text.split('\n').filter(line => line.trim());

                        // Check if this is a matrix-style rubric (performance levels as columns)
                        // Look for header patterns like "Excellent (10)" or "Criteria | Excellent"
                        const hasPerformanceLevels = /Excellent|Good|Satisfactory|Needs Improvement|Incomplete|Outstanding|Proficient|Developing|Beginning/i.test(text);
                        const hasTableStructure = text.includes('|') || /Criteria\s*[|:]?\s*(Excellent|Good|Satisfactory)/i.test(text);

                        if (hasPerformanceLevels && hasTableStructure) {
                          // Parse matrix-style rubric
                          return parseMatrixRubric(text, lines);
                        } else {
                          // Parse simple list-style rubric
                          return parseListRubric(lines);
                        }
                      };

                      // Parse matrix-style rubric with performance levels as columns
                      const parseMatrixRubric = (text, lines) => {
                        const result = {
                          type: 'matrix',
                          performanceLevels: [],
                          criteria: []
                        };

                        // Find header row with performance levels
                        let headerIndex = -1;
                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i].toLowerCase();
                          if (line.includes('criteria') && (line.includes('excellent') || line.includes('good'))) {
                            headerIndex = i;
                            break;
                          }
                        }

                        if (headerIndex === -1) {
                          // Try to find header by looking for performance level keywords
                          for (let i = 0; i < Math.min(5, lines.length); i++) {
                            const line = lines[i].toLowerCase();
                            if (line.includes('excellent') || line.includes('good') || line.includes('satisfactory')) {
                              headerIndex = i;
                              break;
                            }
                          }
                        }

                        if (headerIndex === -1) return null;

                        // Parse header row to extract performance levels
                        const headerLine = lines[headerIndex];
                        // Split by | or detect patterns like "Excellent (10)"
                        const headerParts = headerLine.split('|').map(p => p.trim()).filter(p => p);

                        if (headerParts.length === 0) {
                          // Try regex pattern for "Excellent (10)" format
                          const levelPattern = /(Excellent|Good|Satisfactory|Needs Improvement|Incomplete|Outstanding|Proficient|Developing|Beginning)\s*\((\d+)\)/gi;
                          let match;
                          while ((match = levelPattern.exec(headerLine)) !== null) {
                            result.performanceLevels.push({
                              name: match[1].trim(),
                              points: parseInt(match[2])
                            });
                          }
                        } else {
                          // Parse from pipe-separated format
                          headerParts.forEach((part, idx) => {
                            if (idx === 0 && part.toLowerCase().includes('criteria')) return;
                            const levelMatch = part.match(/(.+?)\s*\((\d+)\)/);
                            if (levelMatch) {
                              result.performanceLevels.push({
                                name: levelMatch[1].trim(),
                                points: parseInt(levelMatch[2])
                              });
                            } else if (part.match(/Excellent|Good|Satisfactory|Needs Improvement|Incomplete/i)) {
                              result.performanceLevels.push({
                                name: part.trim(),
                                points: null
                              });
                            }
                          });
                        }

                        if (result.performanceLevels.length === 0) return null;

                        // Parse criteria rows
                        for (let i = headerIndex + 1; i < lines.length; i++) {
                          const line = lines[i].trim();
                          if (!line || line.toLowerCase().includes('total points')) continue;

                          // Split by | or detect criterion name followed by descriptions
                          const parts = line.split('|').map(p => p.trim()).filter(p => p);

                          if (parts.length >= 2) {
                            const criterionName = parts[0];
                            const descriptions = parts.slice(1);

                            if (criterionName && descriptions.length > 0) {
                              result.criteria.push({
                                name: criterionName,
                                descriptions: descriptions.slice(0, result.performanceLevels.length)
                              });
                            }
                          } else {
                            // Try to parse format like "Criterion Name: Excellent (10): Description..."
                            const criterionMatch = line.match(/^(.+?):\s*(.+)$/);
                            if (criterionMatch) {
                              const criterionName = criterionMatch[1].trim();
                              const rest = criterionMatch[2];

                              // Try to extract descriptions for each level
                              const descriptions = [];
                              result.performanceLevels.forEach((level, idx) => {
                                const levelPattern = new RegExp(`${level.name}\\s*\\(\\d+\\):?\\s*([^:]+?)(?=\\s*(?:${result.performanceLevels[idx + 1]?.name || 'Total'}|$))`, 'i');
                                const descMatch = rest.match(levelPattern);
                                if (descMatch) {
                                  descriptions.push(descMatch[1].trim());
                                } else {
                                  descriptions.push('');
                                }
                              });

                              if (descriptions.some(d => d)) {
                                result.criteria.push({
                                  name: criterionName,
                                  descriptions: descriptions
                                });
                              }
                            }
                          }
                        }

                        // If we found criteria, return the matrix format
                        if (result.criteria.length > 0) {
                          return result;
                        }

                        return null;
                      };

                      // Parse simple list-style rubric
                      const parseListRubric = (lines) => {
                        const criteria = [];

                        lines.forEach((line, index) => {
                          line = line.trim();
                          if (!line) return;

                          // Pattern 1: "Criterion Name (X points): Description"
                          const pattern1 = /^(.+?)\s*\((\d+)\s*points?\)\s*:?\s*(.+)$/i;
                          const match1 = line.match(pattern1);
                          if (match1) {
                            criteria.push({
                              criterion: match1[1].trim(),
                              points: parseInt(match1[2]),
                              description: match1[3].trim()
                            });
                            return;
                          }

                          // Pattern 2: "X. Criterion Name - X points - Description"
                          const pattern2 = /^\d+\.\s*(.+?)\s*-\s*(\d+)\s*points?\s*-\s*(.+)$/i;
                          const match2 = line.match(pattern2);
                          if (match2) {
                            criteria.push({
                              criterion: match2[1].trim(),
                              points: parseInt(match2[2]),
                              description: match2[3].trim()
                            });
                            return;
                          }

                          // Pattern 3: "Criterion Name: X points" (description on next line)
                          const pattern3 = /^(.+?):\s*(\d+)\s*points?$/i;
                          const match3 = line.match(pattern3);
                          if (match3 && index + 1 < lines.length) {
                            criteria.push({
                              criterion: match3[1].trim(),
                              points: parseInt(match3[2]),
                              description: lines[index + 1].trim()
                            });
                            return;
                          }
                        });

                        // If no structured criteria found, return null to show as text
                        if (criteria.length === 0) {
                          return null;
                        }

                        return { type: 'list', criteria };
                      };

                      const rubricCriteria = parseRubric(rubricText);

                      return (
                        <>
                          {assignmentDesc && (
                            <div className="classwork-info-box mb-3">
                              <strong>Assignment Instructions:</strong>
                              <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                                {assignmentDesc}
                              </div>
                            </div>
                          )}
                          <div className="classwork-info-box" style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '8px',
                            padding: '1rem'
                          }}>
                            <strong style={{ color: '#856404', marginBottom: '1rem', display: 'block' }}>📋 Grading Rubric:</strong>

                            {rubricCriteria ? (
                              rubricCriteria.type === 'matrix' ? (
                                // Matrix-style rubric with performance levels as columns
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    border: '2px solid #856404',
                                    backgroundColor: '#fff',
                                    fontSize: '0.9rem'
                                  }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#ffc107', color: '#856404' }}>
                                        <th style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          textAlign: 'left',
                                          fontWeight: 'bold',
                                          width: '20%'
                                        }}>Criteria</th>
                                        {rubricCriteria.performanceLevels.map((level, idx) => (
                                          <th key={idx} style={{
                                            border: '1px solid #856404',
                                            padding: '12px',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem'
                                          }}>
                                            {level.name}
                                            {level.points !== null && ` (${level.points})`}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rubricCriteria.criteria.map((crit, idx) => (
                                        <tr key={idx} style={{
                                          backgroundColor: idx % 2 === 0 ? '#fff' : '#fffef0'
                                        }}>
                                          <td style={{
                                            border: '1px solid #856404',
                                            padding: '12px',
                                            color: '#856404',
                                            fontWeight: '500',
                                            verticalAlign: 'top'
                                          }}>{crit.name}</td>
                                          {crit.descriptions.map((desc, descIdx) => (
                                            <td key={descIdx} style={{
                                              border: '1px solid #856404',
                                              padding: '12px',
                                              color: '#856404',
                                              fontSize: '0.85rem',
                                              lineHeight: '1.5',
                                              verticalAlign: 'top'
                                            }}>{desc || '-'}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {rubricText.toLowerCase().includes('total points') && (
                                    <div style={{
                                      marginTop: '1rem',
                                      padding: '8px',
                                      backgroundColor: '#ffc107',
                                      color: '#856404',
                                      fontWeight: 'bold',
                                      textAlign: 'center',
                                      border: '1px solid #856404',
                                      borderRadius: '4px'
                                    }}>
                                      {rubricText.match(/Total Points:\s*(\d+)/i)?.[0] || 'Total Points: 100'}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // List-style rubric
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    border: '2px solid #856404',
                                    backgroundColor: '#fff',
                                    fontSize: '0.95rem'
                                  }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#ffc107', color: '#856404' }}>
                                        <th style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          textAlign: 'left',
                                          fontWeight: 'bold'
                                        }}>Criterion</th>
                                        <th style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          textAlign: 'center',
                                          fontWeight: 'bold',
                                          width: '100px'
                                        }}>Points</th>
                                        <th style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          textAlign: 'left',
                                          fontWeight: 'bold'
                                        }}>Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rubricCriteria.criteria.map((crit, idx) => (
                                        <tr key={idx} style={{
                                          backgroundColor: idx % 2 === 0 ? '#fff' : '#fffef0'
                                        }}>
                                          <td style={{
                                            border: '1px solid #856404',
                                            padding: '12px',
                                            color: '#856404',
                                            fontWeight: '500'
                                          }}>{crit.criterion}</td>
                                          <td style={{
                                            border: '1px solid #856404',
                                            padding: '12px',
                                            textAlign: 'center',
                                            color: '#856404',
                                            fontWeight: 'bold'
                                          }}>{crit.points}</td>
                                          <td style={{
                                            border: '1px solid #856404',
                                            padding: '12px',
                                            color: '#856404'
                                          }}>{crit.description}</td>
                                        </tr>
                                      ))}
                                      <tr style={{ backgroundColor: '#ffc107', fontWeight: 'bold' }}>
                                        <td style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          textAlign: 'right',
                                          color: '#856404'
                                        }}>Total:</td>
                                        <td style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          textAlign: 'center',
                                          color: '#856404'
                                        }}>
                                          {rubricCriteria.criteria.reduce((sum, crit) => sum + crit.points, 0)}
                                        </td>
                                        <td style={{
                                          border: '1px solid #856404',
                                          padding: '12px',
                                          color: '#856404'
                                        }}></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )
                            ) : (
                              <div style={{
                                whiteSpace: 'pre-wrap',
                                color: '#856404',
                                fontSize: '0.95rem',
                                lineHeight: '1.6'
                              }}>
                                {rubricText}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    } else {
                      // No rubric separator, show all instructions
                      return (
                        <div className="classwork-info-box">
                          <strong>Assignment Instructions:</strong>
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                            {instructions}
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Attachments */}
              {((contentItem.url && !isVideo && !isImage) || contentItem.file_path || contentItem.content_type === 'ASSIGNMENT') && (
                <div className="classwork-attachments">
                  {contentItem.content_type === 'ASSIGNMENT' && contentItem.assignment_details_file_name && (
                    <div className="attachment-card" onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const bucketName = 'course-content';
                        const filePath = contentItem.assignment_details_file_path;
                        const cleanPath = filePath?.replace(/^course-content\//, '').replace(/^course-bucket\//, '') || filePath;

                        console.log('Accessing assignment details:', { bucketName, originalPath: filePath, cleanPath });

                        const { data, error } = await supabase.storage
                          .from(bucketName)
                          .createSignedUrl(cleanPath, 3600);

                        if (error) {
                          console.error('Storage error details:', { error, bucketName, filePath: cleanPath });
                          throw error;
                        }
                        if (data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        } else {
                          throw new Error('No signed URL returned');
                        }
                      } catch (err) {
                        console.error('Error opening assignment details:', err);
                        const errorMsg = err.message?.includes('Bucket not found')
                          ? `Storage bucket 'course-content' not found. File path: ${contentItem.assignment_details_file_path}`
                          : `Unable to open assignment details: ${err.message || 'Unknown error'}`;
                        alert(errorMsg);
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
                        const bucketName = 'course-content';
                        const filePath = contentItem.assignment_rubric_file_path;
                        const cleanPath = filePath?.replace(/^course-content\//, '').replace(/^course-bucket\//, '') || filePath;

                        console.log('Accessing assignment rubric:', { bucketName, originalPath: filePath, cleanPath });

                        const { data, error } = await supabase.storage
                          .from(bucketName)
                          .createSignedUrl(cleanPath, 3600);

                        if (error) {
                          console.error('Storage error details:', { error, bucketName, filePath: cleanPath });
                          throw error;
                        }
                        if (data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        } else {
                          throw new Error('No signed URL returned');
                        }
                      } catch (err) {
                        console.error('Error opening assignment rubric:', err);
                        const errorMsg = err.message?.includes('Bucket not found')
                          ? `Storage bucket 'course-content' not found. File path: ${contentItem.assignment_rubric_file_path}`
                          : `Unable to open assignment rubric: ${err.message || 'Unknown error'}`;
                        alert(errorMsg);
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
                        const bucketName = 'course-content';
                        const filePath = contentItem.file_path;

                        // Remove bucket name from path if it's included
                        const cleanPath = filePath.replace(/^course-content\//, '').replace(/^course-bucket\//, '');

                        console.log('Accessing file:', { bucketName, originalPath: filePath, cleanPath });

                        const { data, error } = await supabase.storage
                          .from(bucketName)
                          .createSignedUrl(cleanPath, 3600);

                        if (error) {
                          console.error('Storage error details:', {
                            error,
                            bucketName,
                            filePath: cleanPath,
                            originalPath: filePath
                          });
                          throw error;
                        }
                        if (data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        } else {
                          throw new Error('No signed URL returned');
                        }
                      } catch (err) {
                        console.error('Error generating signed URL:', err);
                        const errorMsg = err.message?.includes('Bucket not found')
                          ? `Storage bucket 'course-content' not found or inaccessible. File path: ${contentItem.file_path}`
                          : `Unable to open file: ${err.message || 'Unknown error'}`;
                        alert(errorMsg);
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

                  {/* Only show URL as link if it's not a FILE type (FILE types should use file_path with signed URLs) */}
                  {contentItem.url && !isVideo && !isImage && contentItem.content_type !== 'FILE' && (
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
                {contentItem.content_type === 'FLASHCARD' && contentItem.content_data && (
                  <button
                    className="classwork-action-btn primary"
                    onClick={() => {
                      setCurrentFlashcardContent(contentItem);
                      setShowFlashcardViewer(true);
                    }}
                  >
                    Study Flashcards
                  </button>
                )}
                {contentItem.content_type === 'INTERACTIVE_VIDEO' && contentItem.content_data && (
                  <button
                    className="classwork-action-btn primary"
                    onClick={() => {
                      setCurrentInteractiveVideoContent(contentItem);
                      setShowInteractiveVideoViewer(true);
                    }}
                  >
                    Watch Interactive Video
                  </button>
                )}
                {contentItem.content_type === 'INTERACTIVE_BOOK' && contentItem.content_data && (
                  <button
                    className="classwork-action-btn primary"
                    onClick={() => {
                      setCurrentInteractiveBookContent(contentItem);
                      setShowInteractiveBookPlayer(true);
                    }}
                  >
                    Read Interactive Book
                  </button>
                )}
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
  };

  const progress = calculateProgress();
  const contentCount = lesson.content?.length || 0;
  const completedCount = completedContent.size;

  // Filter and search content first
  const filteredContent = filterAndSearchContent(lesson.content);

  // Then categorize the filtered content
  let categorizedContent = categorizeContent(filteredContent);

  // Apply category filter if needed
  categorizedContent = getFilteredCategorizedContent(categorizedContent);

  // Calculate total estimated time for the lesson
  const totalEstimatedTime = calculateEstimatedTime(lesson.content);

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

            {/* Estimated Time */}
            {totalEstimatedTime > 0 && (
              <div className="estimated-time-badge mt-2 mb-3">
                <Badge bg="info" className="px-3 py-2">
                  <FaClock className="me-2" />
                  Estimated Time: {totalEstimatedTime} {totalEstimatedTime === 1 ? 'minute' : 'minutes'}
                </Badge>
              </div>
            )}

            {/* Virtual Classroom */}
            {virtualClassroom && (
              <div className="mt-3 mb-3">
                <Button
                  variant="success"
                  size="lg"
                  className="px-4 py-2"
                  onClick={() => {
                    if (virtualClassroom.meeting_url) {
                      window.open(virtualClassroom.meeting_url, '_blank', 'width=1200,height=800');
                      // Join the session
                      if (lesson.session_id && user?.user_id) {
                        collaborationService.joinSession(lesson.session_id, user.user_id);
                      }
                    }
                  }}
                  style={{
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <FaVideo className="me-2" />
                  Join Virtual Classroom
                  <FaDoorOpen className="ms-2" />
                </Button>
              </div>
            )}

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
            {/* Search and Filter Bar */}
            <div className="content-search-filter mb-4">
              <Row className="g-3">
                <Col md={6}>
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search content by title, description, or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </Col>
                <Col md={3}>
                  <div className="filter-select-wrapper">
                    <FaFilter className="filter-icon" />
                    <select
                      className="form-select filter-select"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Content</option>
                      <option value="completed">Completed</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  </div>
                </Col>
                <Col md={3}>
                  <select
                    className="form-select filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="learning">Learning</option>
                    <option value="practice">Practice</option>
                    <option value="assessments">Assessments</option>
                    <option value="resources">Resources</option>
                    <option value="homework">Homework</option>
                  </select>
                </Col>
              </Row>
              {(searchQuery || filterType !== 'all' || filterCategory !== 'all') && (
                <div className="filter-results-info mt-2">
                  <small className="text-muted">
                    Showing {filteredContent.length} of {lesson.content?.length || 0} items
                    {(searchQuery || filterType !== 'all') && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 ms-2"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                          setFilterCategory('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </small>
                </div>
              )}
            </div>

            {/* Learning Content Section */}
            {categorizedContent.learning.length > 0 && (
              <div className="content-section">
                <div className="content-section-header">
                  <div className="d-flex align-items-center flex-grow-1">
                    <FaGraduationCap className="me-2" />
                    <h4>Learning</h4>
                    <span className="content-count">({categorizedContent.learning.length})</span>
                  </div>
                  <div className="content-section-meta">
                    {calculateSectionProgress(categorizedContent.learning) > 0 && (
                      <span className="section-progress me-3">
                        {calculateSectionProgress(categorizedContent.learning)}% complete
                      </span>
                    )}
                    {calculateEstimatedTime(categorizedContent.learning) > 0 && (
                      <span className="section-time">
                        <FaClock className="me-1" />
                        {calculateEstimatedTime(categorizedContent.learning)} min
                      </span>
                    )}
                  </div>
                </div>
                {categorizedContent.learning.map((contentItem, index) =>
                  renderContentItem(contentItem, index)
                )}
              </div>
            )}

            {/* Practice Section */}
            {categorizedContent.practice.length > 0 && (
              <div className="content-section">
                <div className="content-section-header">
                  <div className="d-flex align-items-center flex-grow-1">
                    <FaClipboardList className="me-2" />
                    <h4>Practice</h4>
                    <span className="content-count">({categorizedContent.practice.length})</span>
                  </div>
                  <div className="content-section-meta">
                    {calculateSectionProgress(categorizedContent.practice) > 0 && (
                      <span className="section-progress me-3">
                        {calculateSectionProgress(categorizedContent.practice)}% complete
                      </span>
                    )}
                    {calculateEstimatedTime(categorizedContent.practice) > 0 && (
                      <span className="section-time">
                        <FaClock className="me-1" />
                        {calculateEstimatedTime(categorizedContent.practice)} min
                      </span>
                    )}
                  </div>
                </div>
                {categorizedContent.practice.map((contentItem, index) =>
                  renderContentItem(contentItem, index)
                )}
              </div>
            )}

            {/* Assessments Section */}
            {categorizedContent.assessments.length > 0 && (
              <div className="content-section">
                <div className="content-section-header">
                  <div className="d-flex align-items-center flex-grow-1">
                    <FaClipboardCheck className="me-2" />
                    <h4>Assessments</h4>
                    <span className="content-count">({categorizedContent.assessments.length})</span>
                  </div>
                  <div className="content-section-meta">
                    {calculateSectionProgress(categorizedContent.assessments) > 0 && (
                      <span className="section-progress me-3">
                        {calculateSectionProgress(categorizedContent.assessments)}% complete
                      </span>
                    )}
                    {calculateEstimatedTime(categorizedContent.assessments) > 0 && (
                      <span className="section-time">
                        <FaClock className="me-1" />
                        {calculateEstimatedTime(categorizedContent.assessments)} min
                      </span>
                    )}
                  </div>
                </div>
                {categorizedContent.assessments.map((contentItem, index) =>
                  renderContentItem(contentItem, index)
                )}
              </div>
            )}

            {/* Resources Section */}
            {categorizedContent.resources.length > 0 && (
              <div className="content-section">
                <div className="content-section-header">
                  <div className="d-flex align-items-center flex-grow-1">
                    <FaFileAlt className="me-2" />
                    <h4>Resources</h4>
                    <span className="content-count">({categorizedContent.resources.length})</span>
                  </div>
                  <div className="content-section-meta">
                    {calculateSectionProgress(categorizedContent.resources) > 0 && (
                      <span className="section-progress me-3">
                        {calculateSectionProgress(categorizedContent.resources)}% complete
                      </span>
                    )}
                    {calculateEstimatedTime(categorizedContent.resources) > 0 && (
                      <span className="section-time">
                        <FaClock className="me-1" />
                        {calculateEstimatedTime(categorizedContent.resources)} min
                      </span>
                    )}
                  </div>
                </div>
                {categorizedContent.resources.map((contentItem, index) =>
                  renderContentItem(contentItem, index)
                )}
              </div>
            )}

            {/* Homework Section */}
            {categorizedContent.homework.length > 0 && (
              <div className="content-section">
                <div className="content-section-header">
                  <div className="d-flex align-items-center flex-grow-1">
                    <FaBook className="me-2" />
                    <h4>Homework</h4>
                    <span className="content-count">({categorizedContent.homework.length})</span>
                  </div>
                  <div className="content-section-meta">
                    {calculateSectionProgress(categorizedContent.homework) > 0 && (
                      <span className="section-progress me-3">
                        {calculateSectionProgress(categorizedContent.homework)}% complete
                      </span>
                    )}
                    {calculateEstimatedTime(categorizedContent.homework) > 0 && (
                      <span className="section-time">
                        <FaClock className="me-1" />
                        {calculateEstimatedTime(categorizedContent.homework)} min
                      </span>
                    )}
                  </div>
                </div>
                {categorizedContent.homework.map((contentItem, index) =>
                  renderContentItem(contentItem, index)
                )}
              </div>
            )}

            {/* Closure Section */}
            {categorizedContent.closure.length > 0 && (
              <div className="content-section">
                <div className="content-section-header">
                  <div className="d-flex align-items-center flex-grow-1">
                    <FaBook className="me-2" />
                    <h4>Closure</h4>
                    <span className="content-count">({categorizedContent.closure.length})</span>
                  </div>
                  <div className="content-section-meta">
                    {calculateSectionProgress(categorizedContent.closure) > 0 && (
                      <span className="section-progress me-3">
                        {calculateSectionProgress(categorizedContent.closure)}% complete
                      </span>
                    )}
                    {calculateEstimatedTime(categorizedContent.closure) > 0 && (
                      <span className="section-time">
                        <FaClock className="me-1" />
                        {calculateEstimatedTime(categorizedContent.closure)} min
                      </span>
                    )}
                  </div>
                </div>
                {categorizedContent.closure.map((contentItem, index) =>
                  renderContentItem(contentItem, index)
                )}
              </div>
            )}

            {/* Empty State */}
            {lesson.content && lesson.content.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted">No content available for this lesson yet.</p>
              </div>
            )}


          </div>
        </div>
      </Container>

      {/* Flashcard Viewer Modal */}
      <Modal
        show={showFlashcardViewer}
        onHide={() => {
          setShowFlashcardViewer(false);
          setCurrentFlashcardContent(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Body style={{ padding: 0 }}>
          {currentFlashcardContent && currentFlashcardContent.content_data && (
            <FlashcardViewer
              contentData={currentFlashcardContent.content_data}
              title={currentFlashcardContent.title}
              description={currentFlashcardContent.description}
              onComplete={() => {
                toggleContentComplete(currentFlashcardContent.content_id);
                setShowFlashcardViewer(false);
                setCurrentFlashcardContent(null);
              }}
              onClose={() => {
                setShowFlashcardViewer(false);
                setCurrentFlashcardContent(null);
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Interactive Video Viewer Modal */}
      <Modal
        show={showInteractiveVideoViewer}
        onHide={() => {
          setShowInteractiveVideoViewer(false);
          setCurrentInteractiveVideoContent(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Body style={{ padding: 0 }}>
          {currentInteractiveVideoContent && currentInteractiveVideoContent.content_data && (
            <InteractiveVideoViewer
              contentData={currentInteractiveVideoContent.content_data}
              title={currentInteractiveVideoContent.title}
              description={currentInteractiveVideoContent.description}
              onComplete={() => {
                toggleContentComplete(currentInteractiveVideoContent.content_id);
                setShowInteractiveVideoViewer(false);
                setCurrentInteractiveVideoContent(null);
              }}
              onClose={() => {
                setShowInteractiveVideoViewer(false);
                setCurrentInteractiveVideoContent(null);
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Interactive Book Player Modal */}
      <Modal
        show={showInteractiveBookPlayer}
        onHide={() => {
          setShowInteractiveBookPlayer(false);
          setCurrentInteractiveBookContent(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Body style={{ padding: 0 }}>
          {currentInteractiveBookContent && currentInteractiveBookContent.content_data && (
            <InteractiveBookPlayer
              contentData={currentInteractiveBookContent.content_data}
              title={currentInteractiveBookContent.title}
              description={currentInteractiveBookContent.description}
              contentId={currentInteractiveBookContent.content_id}
              onComplete={() => {
                toggleContentComplete(currentInteractiveBookContent.content_id);
                setShowInteractiveBookPlayer(false);
                setCurrentInteractiveBookContent(null);
              }}
              onClose={() => {
                setShowInteractiveBookPlayer(false);
                setCurrentInteractiveBookContent(null);
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* 3D Model Viewer Modal */}
      <Modal
        show={show3DModelViewer}
        onHide={() => {
          setShow3DModelViewer(false);
          setCurrent3DModelContent(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCube className="me-2" />
            {current3DModelContent?.title || '3D Model'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          {current3DModelContent && current3DModelContent.url ? (
            <>
              <div style={{
                width: '100%',
                height: '70vh',
                minHeight: '500px',
                backgroundColor: '#1a1a1a'
              }}>
                <ViewerErrorBoundary>
                  <ModelViewerComponent
                    contentUrl={current3DModelContent.url}
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
              {current3DModelContent.description && (
                <div className="p-3 border-top">
                  <p className="mb-0">{current3DModelContent.description}</p>
                </div>
              )}
            </>
          ) : (
            <Alert variant="warning" className="m-3">
              No 3D model URL configured. Please contact your teacher.
            </Alert>
          )}
        </Modal.Body>
      </Modal>
      {/* Floating Discussion Button */}
      <button
        className="floating-discussion-btn"
        onClick={() => setShowDiscussionSidebar(!showDiscussionSidebar)}
        title="Class Discussion"
        aria-label="Toggle class discussion"
      >
        <FaComments />
      </button>

      {/* Discussion Sidebar */}
      {showDiscussionSidebar && (
        <>
          <div 
            className="discussion-sidebar-overlay"
            onClick={() => setShowDiscussionSidebar(false)}
          />
          <div className="discussion-sidebar">
            <div className="discussion-sidebar-header">
              <h5 className="mb-0">
                <FaComments className="me-2" />
                Class Discussion
              </h5>
              <Button
                variant="link"
                className="text-muted p-0"
                onClick={() => setShowDiscussionSidebar(false)}
                aria-label="Close discussion"
              >
                
              </Button>
            </div>
            <div className="discussion-sidebar-body">
              <DiscussionBoard lessonId={lessonId} user={user} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LessonView;

