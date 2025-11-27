import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Form, Modal, Badge, Accordion, ListGroup, ButtonGroup
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBook, FaSave, FaPlus, FaMagic,
  FaList, FaTh, FaTable, FaEye, FaEdit, FaVideo, FaCopy, FaFolderOpen
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import collaborationService from '../../services/collaborationService';
import lessonTemplateService from '../../services/lessonTemplateService';
import AILessonPlanner from './AILessonPlanner';
import EnhancedLessonPlannerForm from './EnhancedLessonPlannerForm';
import LessonPlanOutput from './LessonPlanOutput';
import Timetable from '../common/Timetable';

function LessonPlanning() {
  const { classSubjectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data
  const [classSubject, setClassSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [virtualClassrooms, setVirtualClassrooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCreateClassroomModal, setShowCreateClassroomModal] = useState(false);
  const [newClassroomData, setNewClassroomData] = useState({
    title: '',
    description: '',
    recording_enabled: false,
    breakout_rooms_enabled: false
  });
  
  // Debug: Log modal state changes
  useEffect(() => {
    console.log('[LessonPlanning] showModal state changed to:', showModal);
  }, [showModal]);
  const [showEnhancedPlanner, setShowEnhancedPlanner] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'calendar'
  const [lessonData, setLessonData] = useState({
    class_subject_id: classSubjectId || '',
    lesson_date: '',
    start_time: '',
    end_time: '',
    lesson_title: '',
    topic: '',
    learning_objectives: '',
    lesson_plan: '',
    location: '',
    homework_description: '',
    homework_due_date: '',
    status: 'SCHEDULED',
    session_id: null
  });
  
  useEffect(() => {
    if (classSubjectId) {
      fetchData();
      fetchVirtualClassrooms();
    }
  }, [classSubjectId]);

  const fetchVirtualClassrooms = async () => {
    try {
      const sessions = await collaborationService.getActiveSessions(classSubjectId, 'CLASSROOM');
      setVirtualClassrooms(sessions || []);
    } catch (error) {
      console.error('Error fetching virtual classrooms:', error);
      setVirtualClassrooms([]);
    }
  };
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get class-subject details
      const { data: csData } = await supabase
        .from('class_subjects')
        .select(`
          *,
          subject_offering:subject_form_offerings(
            subject:subjects(*)
          ),
          class:classes(
            *,
            form:forms(*)
          )
        `)
        .eq('class_subject_id', classSubjectId)
        .single();
      
      setClassSubject(csData);
      
      // Get lessons
      const lessonList = await supabaseService.getLessonsByClassSubject(classSubjectId);
      setLessons(lessonList || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load lesson planning data');
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (lesson = null) => {
    console.log('[LessonPlanning] handleOpenModal called with lesson:', lesson);
    console.log('[LessonPlanning] classSubjectId:', classSubjectId);
    
    if (lesson) {
      setEditingLesson(lesson);
      setLessonData({
        class_subject_id: lesson.class_subject_id,
        lesson_date: lesson.lesson_date?.split('T')[0] || '',
        start_time: lesson.start_time?.substring(0, 5) || '',
        end_time: lesson.end_time?.substring(0, 5) || '',
        lesson_title: lesson.lesson_title || '',
        topic: lesson.topic || '',
        learning_objectives: lesson.learning_objectives || '',
        lesson_plan: lesson.lesson_plan || '',
        location: lesson.location || '',
        homework_description: lesson.homework_description || '',
        homework_due_date: lesson.homework_due_date?.split('T')[0] || '',
        status: lesson.status || 'SCHEDULED',
        session_id: lesson.session_id || null
      });
    } else {
      setEditingLesson(null);
      const today = new Date().toISOString().split('T')[0];
      const newLessonData = {
        class_subject_id: classSubjectId || '',
        lesson_date: today,
        start_time: '08:00',
        end_time: '08:45',
        lesson_title: '',
        topic: '',
        learning_objectives: '',
        lesson_plan: '',
        location: '',
        homework_description: '',
        homework_due_date: '',
        status: 'SCHEDULED',
        session_id: null
      };
      console.log('[LessonPlanning] Setting lesson data for new lesson:', newLessonData);
      setLessonData(newLessonData);
    }
    console.log('[LessonPlanning] Setting showModal to true');
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setLessonData({});
    setSuccess(null);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      // Combine date and time for proper datetime format
      // Ensure time format is HH:MM:SS
      const formatTime = (timeStr) => {
        if (!timeStr) return null;
        // If already has seconds, return as is, otherwise add :00
        return timeStr.includes(':') && timeStr.split(':').length === 3 ? timeStr : timeStr + ':00';
      };
      
      // Ensure class_subject_id is a valid integer
      // Use the classSubjectId from useParams if lessonData doesn't have it
      const classSubjectIdValue = lessonData.class_subject_id || classSubjectId;
      console.log('[LessonPlanning] class_subject_id value:', classSubjectIdValue, 'type:', typeof classSubjectIdValue);
      const validClassSubjectId = parseInt(classSubjectIdValue, 10);
      console.log('[LessonPlanning] Parsed class_subject_id:', validClassSubjectId);
      
      if (!validClassSubjectId || isNaN(validClassSubjectId)) {
        console.error('[LessonPlanning] Invalid class_subject_id:', classSubjectIdValue);
        setError(`Invalid class subject (${classSubjectIdValue}). Please refresh the page and try again.`);
        return;
      }
      
      // Validate and format date (avoid timezone issues)
      const validateAndFormatDate = (dateStr) => {
        if (!dateStr) return null;
        
        // Check if already in YYYY-MM-DD format (from HTML5 date input)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateStr)) {
          // Validate the date is actually valid (check if it's a real date)
          // Use local date parsing to avoid timezone issues
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          
          // Check if the date components match (handles invalid dates like 2024-02-30)
          if (date.getFullYear() === year && 
              date.getMonth() === month - 1 && 
              date.getDate() === day) {
            // Return the original string to avoid any timezone conversion
            return dateStr;
          } else {
            throw new Error('Invalid date. Please select a valid date.');
          }
        }
        
        // Try to parse and format if not in YYYY-MM-DD format
        // Use local date parsing to avoid timezone issues
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
        }
        
        // Return date in YYYY-MM-DD format using local date components
        // This avoids timezone conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Validate date is provided
      if (!lessonData.lesson_date) {
        setError('Lesson date is required');
        return;
      }

      const formattedDate = validateAndFormatDate(lessonData.lesson_date);
      if (!formattedDate) {
        setError('Invalid lesson date. Please select a valid date.');
        return;
      }

      // Validate times
      if (!lessonData.start_time || !lessonData.end_time) {
        setError('Start time and end time are required');
        return;
      }

      // Validate end time is after start time
      const startTime = lessonData.start_time;
      const endTime = lessonData.end_time;
      if (endTime <= startTime) {
        setError('End time must be after start time');
        return;
      }

      const lessonPayload = {
        class_subject_id: validClassSubjectId,
        lesson_date: formattedDate,
        start_time: formatTime(lessonData.start_time),
        end_time: formatTime(lessonData.end_time),
        lesson_title: lessonData.lesson_title || null,
        topic: lessonData.topic || null,
        learning_objectives: lessonData.learning_objectives || null,
        lesson_plan: lessonData.lesson_plan || null,
        location: lessonData.location || null,
        homework_description: lessonData.homework_description || null,
        homework_due_date: lessonData.homework_due_date ? validateAndFormatDate(lessonData.homework_due_date) : null,
        status: lessonData.status || 'SCHEDULED',
        session_id: lessonData.session_id || null
      };
      
      console.log('[LessonPlanning] Final lesson payload:', JSON.stringify(lessonPayload, null, 2));
      console.log('[LessonPlanning] class_subject_id in payload:', lessonPayload.class_subject_id, 'type:', typeof lessonPayload.class_subject_id);
      
      if (editingLesson) {
        await supabaseService.updateLesson(editingLesson.lesson_id, lessonPayload);
        setSuccess('Lesson updated successfully');
      } else {
        await supabaseService.createLesson(lessonPayload);
        setSuccess('Lesson created successfully');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error saving lesson:', err);
      // Show more detailed error message
      const errorMessage = err.message || err.error?.message || 'Failed to save lesson';
      const details = err.details ? ` Details: ${err.details}` : '';
      const hint = err.hint ? ` Hint: ${err.hint}` : '';
      setError(`${errorMessage}${details}${hint}`);
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // Format lesson plan object to readable text for form field
  const formatLessonPlanForForm = (planObj) => {
    if (!planObj || typeof planObj !== 'object') return '';
    
    let formatted = '';
    
    // Handle different object structures
    // Structure 1: Numbered keys like "1. LESSON HEADER"
    if (planObj['1. LESSON HEADER'] || planObj['1. LESSON HEADER']) {
      const header = planObj['1. LESSON HEADER'] || planObj['1. LESSON HEADER'];
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'LESSON HEADER\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (header.Subject) formatted += `Subject: ${header.Subject}\n`;
      if (header.Form) formatted += `Form: ${header.Form}\n`;
      if (header.Class) formatted += `Class: ${header.Class}\n`;
      if (header.Topic) formatted += `Topic: ${header.Topic}\n`;
      if (header['Essential Learning Outcomes']) formatted += `Essential Learning Outcomes: ${header['Essential Learning Outcomes']}\n`;
      if (header['Specific Learning Outcomes']) formatted += `Specific Learning Outcomes: ${header['Specific Learning Outcomes']}\n`;
      if (header.Duration) formatted += `Duration: ${header.Duration}\n`;
      formatted += '\n';
    }
    
    // Structure 2: Standard keys
    if (planObj.lesson_header || planObj.LESSON_HEADER) {
      const header = planObj.lesson_header || planObj.LESSON_HEADER;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'LESSON HEADER\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof header === 'object') {
        Object.keys(header).forEach(key => {
          formatted += `${key}: ${header[key]}\n`;
        });
      } else {
        formatted += header + '\n';
      }
      formatted += '\n';
    }
    
    // Objectives Table
    if (planObj['2. OBJECTIVES TABLE'] || planObj.objectives_table) {
      const objectives = planObj['2. OBJECTIVES TABLE'] || planObj.objectives_table;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'OBJECTIVES TABLE\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (objectives.Table && Array.isArray(objectives.Table)) {
        objectives.Table.forEach((obj, idx) => {
          formatted += `\nObjective ${idx + 1}:\n`;
          if (obj.Knowledge) formatted += `  Knowledge: ${obj.Knowledge}\n`;
          if (obj.Skills) formatted += `  Skills: ${obj.Skills}\n`;
          if (obj.Values) formatted += `  Values: ${obj.Values}\n`;
        });
      } else if (objectives.columns && Array.isArray(objectives.columns)) {
        objectives.columns.forEach((col, idx) => {
          formatted += `\nObjective ${idx + 1}:\n`;
          if (col.Knowledge) formatted += `  Knowledge: ${col.Knowledge}\n`;
          if (col.Skills) formatted += `  Skills: ${col.Skills}\n`;
          if (col.Values) formatted += `  Values: ${col.Values}\n`;
        });
      }
      formatted += '\n';
    }
    
    // Lesson Components
    if (planObj['3. LESSON COMPONENTS'] || planObj.lesson_components) {
      const components = planObj['3. LESSON COMPONENTS'] || planObj.lesson_components;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'LESSON COMPONENTS\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      
      if (typeof components === 'object') {
        const componentKeys = Object.keys(components);
        componentKeys.forEach(key => {
          const component = components[key];
          formatted += `\n${key}:\n`;
          if (typeof component === 'object') {
            if (component.Timing) formatted += `  Timing: ${component.Timing}\n`;
            if (component.Description) formatted += `  Description: ${component.Description}\n`;
            if (component.activities) {
              formatted += `  Activities:\n`;
              if (Array.isArray(component.activities)) {
                component.activities.forEach((activity, idx) => {
                  formatted += `    ${idx + 1}. ${activity}\n`;
                });
              } else {
                formatted += `    ${component.activities}\n`;
              }
            }
          } else {
            formatted += `  ${component}\n`;
          }
        });
      } else {
        formatted += components + '\n';
      }
      formatted += '\n';
    }
    
    // Assessment
    if (planObj['4. ASSESSMENT'] || planObj.assessment || planObj.ASSESSMENT) {
      const assessment = planObj['4. ASSESSMENT'] || planObj.assessment || planObj.ASSESSMENT;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'ASSESSMENT\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof assessment === 'object') {
        // Handle specific assessment keys
        if (assessment['Formative Assessment'] || assessment.formative_assessment || assessment.formative_strategies) {
          const formative = assessment['Formative Assessment'] || assessment.formative_assessment || assessment.formative_strategies;
          formatted += `Formative Assessment: ${formative}\n`;
        }
        if (assessment['Assessment Activities'] || assessment.assessment_activities) {
          formatted += `Assessment Activities: ${assessment['Assessment Activities'] || assessment.assessment_activities}\n`;
        }
        if (assessment['Assessment Tools'] || assessment.assessment_tools) {
          formatted += `Assessment Tools: ${assessment['Assessment Tools'] || assessment.assessment_tools}\n`;
        }
        // Handle any other keys
        Object.keys(assessment).forEach(key => {
          if (!['Formative Assessment', 'formative_assessment', 'formative_strategies', 
                'Assessment Activities', 'assessment_activities',
                'Assessment Tools', 'assessment_tools'].includes(key)) {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            formatted += `${formattedKey}: ${assessment[key]}\n`;
          }
        });
      } else {
        formatted += assessment + '\n';
      }
      formatted += '\n';
    }
    
    // Resources
    if (planObj['5. RESOURCES'] || planObj.resources || planObj.RESOURCES) {
      const resources = planObj['5. RESOURCES'] || planObj.resources || planObj.RESOURCES;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'RESOURCES\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof resources === 'object') {
        Object.keys(resources).forEach(key => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          formatted += `${formattedKey}: ${resources[key]}\n`;
        });
      } else {
        formatted += resources + '\n';
      }
      formatted += '\n';
    }
    
    // Homework
    if (planObj['6. HOMEWORK/EXTENSION'] || planObj.homework) {
      const homework = planObj['6. HOMEWORK/EXTENSION'] || planObj.homework;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'HOMEWORK/EXTENSION\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof homework === 'object') {
        if (homework.Description) {
          formatted += homework.Description + '\n';
        } else {
          Object.keys(homework).forEach(key => {
            formatted += `${key}: ${homework[key]}\n`;
          });
        }
      } else {
        formatted += homework + '\n';
      }
      formatted += '\n';
    }
    
    return formatted.trim();
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
  
  if (!classSubject) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Class-Subject not found</Alert>
      </Container>
    );
  }
  
  // Sort lessons by date and time
  // For schedule view, show upcoming first; for other views, show most recent first
  const sortedLessons = [...lessons].sort((a, b) => {
    const dateA = new Date(a.lesson_date + 'T' + a.start_time);
    const dateB = new Date(b.lesson_date + 'T' + b.start_time);
    return viewMode === 'calendar' ? dateA - dateB : dateB - dateA;
  });
  
  return (
    <Container className="mt-4">
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Lesson Planning</h2>
              <p className="text-muted mb-0">
                {classSubject?.subject_offering?.subject?.subject_name || 'Loading...'} • 
                {classSubject?.class?.form?.form_name || ''} - {classSubject?.class?.class_name || ''}
              </p>
            </div>
            <div>
              <Button 
                variant="outline-info" 
                className="me-2" 
                onClick={() => navigate(`/teacher/lesson-templates?classSubjectId=${classSubjectId}`)}
              >
                <FaFolderOpen className="me-2" />
                Templates
              </Button>
              <Button variant="outline-primary" className="me-2" onClick={() => setShowEnhancedPlanner(true)}>
                <FaMagic className="me-2" />
                AI Lesson Planner
              </Button>
              <Button 
                variant="primary" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[LessonPlanning] Create Lesson button clicked');
                  handleOpenModal();
                }}
              >
                <FaPlus className="me-2" />
                Create Lesson
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {/* View Mode Toggle */}
      {sortedLessons.length > 0 && (
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-end align-items-center">
              <span className="me-2 text-muted">View:</span>
              <ButtonGroup>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <FaTh className="me-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <FaList className="me-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <FaTable className="me-1" />
                  Schedule
                </Button>
              </ButtonGroup>
            </div>
          </Col>
        </Row>
      )}
      
      {sortedLessons.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No lessons planned yet</p>
            <Button 
              variant="primary" 
              className="mt-3" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LessonPlanning] Create First Lesson button clicked');
                handleOpenModal();
              }}
            >
              Create First Lesson
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <Row className="g-4">
              {sortedLessons.map((lesson, index) => (
                <Col md={6} lg={4} key={index}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{lesson.lesson_title || 'Lesson'}</h6>
                          <small className="text-muted">
                            <FaCalendarAlt className="me-1" />
                            {formatDate(lesson.lesson_date)}
                          </small>
                        </div>
                        <Badge bg={
                          lesson.status === 'COMPLETED' ? 'success' :
                          lesson.status === 'CANCELLED' ? 'danger' :
                          new Date(lesson.lesson_date) < new Date() ? 'warning' : 'primary'
                        }>
                          {lesson.status || 'SCHEDULED'}
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <FaClock className="me-1 text-muted" />
                        {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                      </div>
                      {lesson.location && (
                        <div className="mb-2">
                          <FaMapMarkerAlt className="me-1 text-muted" />
                          {lesson.location}
                        </div>
                      )}
                      {lesson.session_id && (
                        <div className="mb-2">
                          <Badge bg="info" className="me-1">
                            <FaVideo className="me-1" />
                            Virtual Classroom
                          </Badge>
                        </div>
                      )}
                      {lesson.topic && (
                        <div className="mb-2">
                          <strong>Topic:</strong> {lesson.topic}
                        </div>
                      )}
                      {lesson.homework_description && (
                        <div className="mb-2">
                          <Badge bg="warning" className="me-2">Homework</Badge>
                          {lesson.homework_due_date && (
                            <small className="text-muted">
                              Due: {formatDate(lesson.homework_due_date)}
                            </small>
                          )}
                        </div>
                      )}
                      <div className="d-flex gap-2 mt-2">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-grow-1"
                          onClick={() => navigate(`/teacher/lessons/${lesson.lesson_id}`)}
                        >
                          <FaEye className="me-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleOpenModal(lesson)}
                        >
                          <FaEdit className="me-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={async () => {
                            const templateName = prompt('Enter a name for this template:');
                            if (!templateName) return;
                            
                            try {
                              await lessonTemplateService.saveLessonAsTemplate(lesson.lesson_id, {
                                template_name: templateName,
                                created_by: user?.user_id,
                                is_public: true
                              });
                              alert('Lesson saved as template successfully!');
                            } catch (err) {
                              console.error('Error saving template:', err);
                              alert('Failed to save template');
                            }
                          }}
                          title="Save as Template"
                        >
                          <FaCopy />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {sortedLessons.map((lesson, index) => (
                    <ListGroup.Item key={index} className="border-bottom">
                      <Row className="align-items-center">
                        <Col md={3}>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-primary" />
                            <div>
                              <strong>{formatDate(lesson.lesson_date)}</strong>
                              <div className="text-muted small">
                                <FaClock className="me-1" />
                                {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <h6 className="mb-1">{lesson.lesson_title || 'Lesson'}</h6>
                          {lesson.topic && (
                            <small className="text-muted">Topic: {lesson.topic}</small>
                          )}
                        </Col>
                        <Col md={2}>
                          {lesson.location && (
                            <div className="text-muted small">
                              <FaMapMarkerAlt className="me-1" />
                              {lesson.location}
                            </div>
                          )}
                          {lesson.session_id && (
                            <Badge bg="info" className="mt-1">
                              <FaVideo className="me-1" />
                              Virtual
                            </Badge>
                          )}
                        </Col>
                        <Col md={3} className="text-end">
                          <Badge bg={
                            lesson.status === 'COMPLETED' ? 'success' :
                            lesson.status === 'CANCELLED' ? 'danger' :
                            new Date(lesson.lesson_date) < new Date() ? 'warning' : 'primary'
                          } className="me-2">
                            {lesson.status || 'SCHEDULED'}
                          </Badge>
                          <div className="d-inline-flex gap-2">
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => navigate(`/teacher/lessons/${lesson.lesson_id}`)}
                            >
                              <FaEye className="me-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleOpenModal(lesson)}
                            >
                              <FaEdit className="me-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={async () => {
                                const templateName = prompt('Enter a name for this template:');
                                if (!templateName) return;
                                
                                try {
                                  await lessonTemplateService.saveLessonAsTemplate(lesson.lesson_id, {
                                    template_name: templateName,
                                    created_by: user?.user_id,
                                    is_public: true
                                  });
                                  alert('Lesson saved as template successfully!');
                                } catch (err) {
                                  console.error('Error saving template:', err);
                                  alert('Failed to save template');
                                }
                              }}
                              title="Save as Template"
                            >
                              <FaCopy />
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          {/* Calendar/Schedule View */}
          {viewMode === 'calendar' && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Timetable 
                  lessons={sortedLessons.map(lesson => ({
                    ...lesson,
                    class_subject: classSubject
                  }))}
                  onLessonClick={(lesson) => navigate(`/teacher/lessons/${lesson.lesson_id}`)}
                />
              </Card.Body>
            </Card>
          )}
        </>
      )}
      
      {/* Create/Edit Lesson Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        size="lg"
        backdrop="static"
        keyboard={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Enhanced AI Lesson Planner */}
            {!editingLesson && (
              <Accordion className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <FaMagic className="me-2" />
                    Use AI to Generate Lesson Plan (Enhanced)
                  </Accordion.Header>
                  <Accordion.Body>
                    <EnhancedLessonPlannerForm
                      subjectName={classSubject?.subject_offering?.subject?.subject_name || ''}
                      formName={classSubject?.class?.form?.form_name || ''}
                      className={classSubject?.class?.class_name || ''}
                      classSubjectId={classSubjectId}
                      onPlanGenerated={(plan) => {
                        console.log('Enhanced planner generated plan:', plan);
                        
                        // Get the raw lesson plan (might be object or string)
                        const rawLessonPlan = plan.lesson_plan || plan.content || '';
                        
                        // Extract homework from the lesson plan BEFORE converting to string
                        let homeworkText = plan.homework_description || '';
                        if (typeof rawLessonPlan === 'object') {
                          // Check for homework in structured format
                          if (rawLessonPlan['6. HOMEWORK/EXTENSION']) {
                            const homework = rawLessonPlan['6. HOMEWORK/EXTENSION'];
                            if (homework.Description) {
                              homeworkText = homework.Description;
                            } else if (typeof homework === 'string') {
                              homeworkText = homework;
                            }
                          } else if (rawLessonPlan.homework || rawLessonPlan.HOMEWORK) {
                            const homework = rawLessonPlan.homework || rawLessonPlan.HOMEWORK;
                            if (typeof homework === 'string') {
                              homeworkText = homework;
                            } else if (homework.Description) {
                              homeworkText = homework.Description;
                            }
                          }
                        }
                        
                        // Convert lesson_plan to formatted string if it's an object
                        let lessonPlanText = rawLessonPlan;
                        if (typeof lessonPlanText === 'object') {
                          lessonPlanText = formatLessonPlanForForm(lessonPlanText);
                        }
                        
                        setLessonData(prev => {
                          const updated = {
                            ...prev,
                            lesson_title: plan.lesson_title ?? prev.lesson_title,
                            topic: prev.topic || plan.metadata?.topic || '',
                            learning_objectives: plan.learning_objectives ?? prev.learning_objectives,
                            lesson_plan: lessonPlanText,
                            homework_description: homeworkText || prev.homework_description
                          };
                          return updated;
                        });
                      }}
                    />
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lesson Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={lessonData.lesson_date || ''}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      // HTML5 date input returns YYYY-MM-DD format
                      setLessonData({ ...lessonData, lesson_date: selectedDate });
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <Form.Text className="text-muted">
                    Select the date for this lesson (format: YYYY-MM-DD)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={lessonData.start_time || ''}
                    onChange={(e) => setLessonData({ ...lessonData, start_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={lessonData.end_time || ''}
                    onChange={(e) => setLessonData({ ...lessonData, end_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Lesson Title</Form.Label>
              <Form.Control
                type="text"
                value={lessonData.lesson_title || ''}
                onChange={(e) => setLessonData({ ...lessonData, lesson_title: e.target.value })}
                placeholder="e.g., Introduction to Algebra"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Topic</Form.Label>
              <Form.Control
                type="text"
                value={lessonData.topic || ''}
                onChange={(e) => setLessonData({ ...lessonData, topic: e.target.value })}
                placeholder="Lesson topic"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Learning Objectives</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={lessonData.learning_objectives || ''}
                onChange={(e) => setLessonData({ ...lessonData, learning_objectives: e.target.value })}
                placeholder="What students will learn"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Lesson Plan</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={lessonData.lesson_plan || ''}
                onChange={(e) => setLessonData({ ...lessonData, lesson_plan: e.target.value })}
                placeholder="Detailed lesson plan and activities"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={lessonData.location || ''}
                onChange={(e) => setLessonData({ ...lessonData, location: e.target.value })}
                placeholder="e.g., Room 101, Lab 2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaVideo className="me-2" />
                Virtual Classroom (Optional)
              </Form.Label>
              <div className="d-flex gap-2 mb-2">
                <Form.Select
                  value={lessonData.session_id || ''}
                  onChange={(e) => setLessonData({ ...lessonData, session_id: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">No virtual classroom</option>
                  {virtualClassrooms.map((classroom) => (
                    <option key={classroom.session_id} value={classroom.session_id}>
                      {classroom.title}
                    </option>
                  ))}
                </Form.Select>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCreateClassroomModal(true);
                  }}
                >
                  <FaPlus className="me-1" />
                  New
                </Button>
              </div>
              <Form.Text className="text-muted">
                Link this lesson to a virtual classroom for online teaching
              </Form.Text>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Homework Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={lessonData.homework_description || ''}
                    onChange={(e) => setLessonData({ ...lessonData, homework_description: e.target.value })}
                    placeholder="Homework assignment"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Homework Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={lessonData.homework_due_date || ''}
                    onChange={(e) => setLessonData({ ...lessonData, homework_due_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={lessonData.status || 'SCHEDULED'}
                onChange={(e) => setLessonData({ ...lessonData, status: e.target.value })}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FaSave className="me-2" />
              {editingLesson ? 'Update' : 'Create'} Lesson
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Enhanced AI Lesson Planner Modal */}
      <Modal 
        show={showEnhancedPlanner} 
        onHide={() => setShowEnhancedPlanner(false)} 
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            AI Lesson Plan Generator
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: '70vh' }}>
          <Row className="g-3" style={{ height: '70vh' }}>
            {/* Left Column - Form */}
            <Col lg={5} className="d-flex flex-column">
              <EnhancedLessonPlannerForm
                subjectName={classSubject?.subject_offering?.subject?.subject_name || ''}
                formName={classSubject?.class?.form?.form_name || ''}
                className={classSubject?.class?.class_name || ''}
                classSubjectId={classSubjectId}
                onPlanGenerated={(plan) => {
                  // Auto-populate lesson form when plan is generated
                  setLessonData(prev => ({
                    ...prev,
                    lesson_title: plan.lesson_title || prev.lesson_title,
                    topic: prev.topic || plan.metadata?.topic || '',
                    learning_objectives: plan.learning_objectives || prev.learning_objectives,
                    lesson_plan: plan.lesson_plan || prev.lesson_plan,
                    homework_description: plan.homework_description || prev.homework_description
                  }));
                }}
              />
            </Col>

            {/* Right Column - Output */}
            <Col lg={7} className="d-flex flex-column">
              <LessonPlanOutput
                onSaveLesson={(lessonData) => {
                  // Populate the main lesson form and close enhanced planner
                  setLessonData(prev => ({
                    ...prev,
                    ...lessonData
                  }));
                  setShowEnhancedPlanner(false);
                  setShowModal(true);
                }}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnhancedPlanner(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowEnhancedPlanner(false);
              setShowModal(true);
            }}
          >
            Use in Lesson Form
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Virtual Classroom Modal */}
      <Modal 
        show={showCreateClassroomModal} 
        onHide={() => {
          setShowCreateClassroomModal(false);
          setNewClassroomData({
            title: '',
            description: '',
            recording_enabled: false,
            breakout_rooms_enabled: false
          });
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaVideo className="me-2" />
            Create Virtual Classroom
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={async (e) => {
          e.preventDefault();
          try {
            // Create session first
            const session = await collaborationService.createSession({
              session_type: 'CLASSROOM',
              title: newClassroomData.title,
              description: newClassroomData.description,
              class_subject_id: parseInt(classSubjectId),
              created_by: user?.user_id
            });

            // Generate Jitsi meeting URL
            const meetingId = `launchpad-${session.session_id}-${Date.now()}`;
            const meetingUrl = `https://meet.jit.si/${meetingId}`;

            // Create virtual classroom
            await collaborationService.createVirtualClassroom({
              session_id: session.session_id,
              meeting_url: meetingUrl,
              meeting_id: meetingId,
              recording_enabled: newClassroomData.recording_enabled,
              breakout_rooms_enabled: newClassroomData.breakout_rooms_enabled
            });

            // Refresh virtual classrooms list
            await fetchVirtualClassrooms();
            
            // Set the newly created classroom as selected
            setLessonData({ ...lessonData, session_id: session.session_id });
            
            setShowCreateClassroomModal(false);
            setNewClassroomData({
              title: '',
              description: '',
              recording_enabled: false,
              breakout_rooms_enabled: false
            });
            setSuccess('Virtual classroom created and linked to lesson!');
          } catch (err) {
            console.error('Error creating virtual classroom:', err);
            setError('Failed to create virtual classroom. Please try again.');
          }
        }}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={newClassroomData.title}
                onChange={(e) => setNewClassroomData({ ...newClassroomData, title: e.target.value })}
                placeholder="e.g., Math Lesson - Algebra Basics"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newClassroomData.description}
                onChange={(e) => setNewClassroomData({ ...newClassroomData, description: e.target.value })}
                placeholder="Optional description for the virtual classroom"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Recording"
                checked={newClassroomData.recording_enabled}
                onChange={(e) => setNewClassroomData({ ...newClassroomData, recording_enabled: e.target.checked })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Breakout Rooms"
                checked={newClassroomData.breakout_rooms_enabled}
                onChange={(e) => setNewClassroomData({ ...newClassroomData, breakout_rooms_enabled: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowCreateClassroomModal(false);
              setNewClassroomData({
                title: '',
                description: '',
                recording_enabled: false,
                breakout_rooms_enabled: false
              });
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Classroom
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default LessonPlanning;

