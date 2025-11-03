import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Form, Modal, Badge, Accordion
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBook, FaSave, FaPlus
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import AILessonPlanner from './AILessonPlanner';

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
  const [editingLesson, setEditingLesson] = useState(null);
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
      setLessonData({
        class_subject_id: classSubjectId,
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
      });
    }
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
  const sortedLessons = [...lessons].sort((a, b) => {
    const dateA = new Date(a.lesson_date + 'T' + a.start_time);
    const dateB = new Date(b.lesson_date + 'T' + b.start_time);
    return dateB - dateA; // Most recent first
  });
  
  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Lesson Planning</h2>
              <p className="text-muted mb-0">
                {classSubject.subject_offering?.subject?.subject_name} • 
                {classSubject.class?.form?.form_name} - {classSubject.class?.class_name}
              </p>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />
              Create Lesson
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {sortedLessons.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No lessons planned yet</p>
            <Button variant="primary" className="mt-3" onClick={() => handleOpenModal()}>
              Create First Lesson
            </Button>
          </Card.Body>
        </Card>
      ) : (
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
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100 mt-2"
                    onClick={() => handleOpenModal(lesson)}
                  >
                    Edit Lesson
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Create/Edit Lesson Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* AI Lesson Planner */}
            {!editingLesson && (
              <Accordion className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <FaBook className="me-2" />
                    Use AI to Generate Lesson Plan
                  </Accordion.Header>
                  <Accordion.Body>
                    <AILessonPlanner
                      subjectName={classSubject?.subject_offering?.subject?.subject_name || ''}
                      formName={classSubject?.class?.form?.form_name || ''}
                      initialTopic={lessonData.topic || ''}
                      onPlanGenerated={(plan) => {
                        setLessonData(prev => ({
                          ...prev,
                          lesson_title: plan.lesson_title || prev.lesson_title,
                          topic: prev.topic || plan.topic || '',
                          learning_objectives: plan.learning_objectives || prev.learning_objectives,
                          lesson_plan: plan.lesson_plan || prev.lesson_plan,
                          homework_description: plan.homework_description || prev.homework_description
                        }));
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
    </Container>
  );
}

export default LessonPlanning;

