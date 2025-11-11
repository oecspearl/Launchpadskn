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
  FaGraduationCap, FaRocket, FaStar, FaChevronDown, FaChevronUp,
  FaSearch, FaFilter, FaLock, FaArrowRight, FaHashtag
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, completed, incomplete
  const [filterCategory, setFilterCategory] = useState('all'); // all, learning, practice, assessments, resources, homework
  
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
  
  // Categorize content into Learning, Assessments, Resources, Practice, and Homework
  const categorizeContent = (content) => {
    if (!content || content.length === 0) {
      return { learning: [], assessments: [], resources: [], practice: [], homework: [] };
    }
    
    const categories = {
      learning: [],
      assessments: [],
      resources: [],
      practice: [],
      homework: []
    };
    
    content.forEach(item => {
      // First, check if content_section is explicitly set to one of our main categories
      // This takes priority over content_type-based categorization
      const contentSection = item.content_section?.trim()?.toLowerCase() || '';
      
      // Debug logging (can be removed in production)
      if (contentSection) {
        console.log('Content item categorization:', {
          title: item.title,
          content_type: item.content_type,
          content_section: item.content_section,
          normalized: contentSection
        });
      }
      
      // Check for exact matches and variations (case-insensitive)
      if (contentSection === 'homework') {
        categories.homework.push(item);
      } else if (contentSection === 'practice') {
        categories.practice.push(item);
      } else if (contentSection === 'assessments' || contentSection === 'assessment') {
        categories.assessments.push(item);
      } else if (contentSection === 'resources' || contentSection === 'resource') {
        categories.resources.push(item);
      } else if (contentSection === 'learning') {
        categories.learning.push(item);
      } else {
        // Fall back to content_type-based categorization if content_section is not set or doesn't match
        // This ensures backward compatibility with existing content
        const contentType = item.content_type;
        
        // Assessments
        if (['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'].includes(contentType)) {
          categories.assessments.push(item);
        }
        // Learning content
        else if (['LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS', 
                  'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY', 
                  'VIDEO', 'IMAGE', 'DOCUMENT'].includes(contentType)) {
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
            
            {/* Empty State */}
            {lesson.content && lesson.content.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted">No content available for this lesson yet.</p>
              </div>
            )}
            
            
          </div>
        </div>
      </Container>
    </div>
  );
}

export default LessonView;
