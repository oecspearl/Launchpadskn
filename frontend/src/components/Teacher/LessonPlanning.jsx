import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Form, Modal, Badge, Accordion, ListGroup, ButtonGroup
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBook, FaSave, FaPlus, FaMagic,
  FaList, FaTh, FaTable, FaEye, FaEdit
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
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
  const [showModal, setShowModal] = useState(false);
  
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
    status: 'SCHEDULED'
  });
  
  useEffect(() => {
    if (classSubjectId) {
      fetchData();
    }
  }, [classSubjectId]);
  
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
        status: lesson.status || 'SCHEDULED'
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
        status: 'SCHEDULED'
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
      const lessonDateTime = `${lessonData.lesson_date}T${lessonData.start_time}:00`;
      const endDateTime = `${lessonData.lesson_date}T${lessonData.end_time}:00`;
      
      const lessonPayload = {
        class_subject_id: parseInt(lessonData.class_subject_id),
        lesson_date: lessonData.lesson_date,
        start_time: lessonData.start_time + ':00',
        end_time: lessonData.end_time + ':00',
        lesson_title: lessonData.lesson_title || null,
        topic: lessonData.topic || null,
        learning_objectives: lessonData.learning_objectives || null,
        lesson_plan: lessonData.lesson_plan || null,
        location: lessonData.location || null,
        homework_description: lessonData.homework_description || null,
        homework_due_date: lessonData.homework_due_date || null,
        status: lessonData.status || 'SCHEDULED'
      };
      
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
      setError(err.message || 'Failed to save lesson');
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
                    value={lessonData.lesson_date}
                    onChange={(e) => setLessonData({ ...lessonData, lesson_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={lessonData.start_time}
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
                    value={lessonData.end_time}
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
                value={lessonData.lesson_title}
                onChange={(e) => setLessonData({ ...lessonData, lesson_title: e.target.value })}
                placeholder="e.g., Introduction to Algebra"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Topic</Form.Label>
              <Form.Control
                type="text"
                value={lessonData.topic}
                onChange={(e) => setLessonData({ ...lessonData, topic: e.target.value })}
                placeholder="Lesson topic"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Learning Objectives</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={lessonData.learning_objectives}
                onChange={(e) => setLessonData({ ...lessonData, learning_objectives: e.target.value })}
                placeholder="What students will learn"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Lesson Plan</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={lessonData.lesson_plan}
                onChange={(e) => setLessonData({ ...lessonData, lesson_plan: e.target.value })}
                placeholder="Detailed lesson plan and activities"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={lessonData.location}
                onChange={(e) => setLessonData({ ...lessonData, location: e.target.value })}
                placeholder="e.g., Room 101, Lab 2"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Homework Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={lessonData.homework_description}
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
                    value={lessonData.homework_due_date}
                    onChange={(e) => setLessonData({ ...lessonData, homework_due_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={lessonData.status}
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
    </Container>
  );
}

export default LessonPlanning;

