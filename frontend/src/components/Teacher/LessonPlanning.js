import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Form, Modal, Badge
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBook, FaSave, FaPlus, FaMagic
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import openaiService from '../../services/openaiService';
import { supabase } from '../../config/supabase';

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
  const [curriculumData, setCurriculumData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [aiGenerationForm, setAiGenerationForm] = useState({
    focusArea: '',
    teachingStyle: '',
    studentLevel: '',
    keyConcepts: '',
    specialRequirements: '',
    learningApproach: ''
  });
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
      
      // Fetch curriculum data if subject offering exists
      if (csData?.subject_offering?.offering_id) {
        try {
          const curriculum = await supabaseService.getCurriculumOfferingById(
            csData.subject_offering.offering_id
          );
          setCurriculumData(curriculum);
        } catch (err) {
          console.warn('Could not fetch curriculum data:', err);
          // Continue without curriculum - AI can still generate lessons
        }
      }
      
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
    setIsGenerating(false);
  };

  const handleOpenAIGenerationModal = () => {
    setShowAIGenerationModal(true);
    // Pre-fill some fields if available
    setAiGenerationForm({
      focusArea: lessonData.topic || '',
      teachingStyle: '',
      studentLevel: classSubject?.class?.form?.form_name || '',
      keyConcepts: '',
      specialRequirements: '',
      learningApproach: ''
    });
  };

  const handleCloseAIGenerationModal = () => {
    setShowAIGenerationModal(false);
    setAiGenerationForm({
      focusArea: '',
      teachingStyle: '',
      studentLevel: '',
      keyConcepts: '',
      specialRequirements: '',
      learningApproach: ''
    });
    setError(null);
  };

  const handleGenerateLesson = async () => {
    if (!curriculumData && !classSubject?.subject_offering) {
      setError('Curriculum data not available. Please ensure the subject has curriculum assigned.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);

      // Prepare curriculum data for OpenAI
      const curriculumForAI = curriculumData || {
        subject: classSubject?.subject_offering?.subject,
        form: classSubject?.class?.form,
        curriculum_framework: classSubject?.subject_offering?.curriculum_framework,
        learning_outcomes: classSubject?.subject_offering?.learning_outcomes,
        curriculum_structure: classSubject?.subject_offering?.curriculum_structure
      };

      // Calculate duration from times if available
      let duration = 45; // default
      if (lessonData.start_time && lessonData.end_time) {
        const start = new Date(`2000-01-01T${lessonData.start_time}`);
        const end = new Date(`2000-01-01T${lessonData.end_time}`);
        duration = Math.round((end - start) / 60000); // Convert to minutes
      }

      // Generate lesson using OpenAI with form data
      const generatedLesson = await openaiService.generateLesson({
        curriculumData: curriculumForAI,
        topic: aiGenerationForm.focusArea || lessonData.topic || null,
        lessonDate: lessonData.lesson_date,
        duration: duration,
        teacherPreferences: {
          focusArea: aiGenerationForm.focusArea,
          teachingStyle: aiGenerationForm.teachingStyle,
          studentLevel: aiGenerationForm.studentLevel,
          keyConcepts: aiGenerationForm.keyConcepts,
          specialRequirements: aiGenerationForm.specialRequirements,
          learningApproach: aiGenerationForm.learningApproach
        }
      });

      // Populate form fields with generated content
      setLessonData({
        ...lessonData,
        lesson_title: generatedLesson.lesson_title || lessonData.lesson_title,
        topic: generatedLesson.topic || aiGenerationForm.focusArea || lessonData.topic,
        learning_objectives: generatedLesson.learning_objectives || lessonData.learning_objectives,
        lesson_plan: generatedLesson.lesson_plan || lessonData.lesson_plan
      });

      setSuccess('Lesson plan generated successfully! Please review and adjust as needed.');
      handleCloseAIGenerationModal();
    } catch (err) {
      console.error('Error generating lesson:', err);
      setError(err.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Lesson Title</Form.Label>
                {!editingLesson && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleOpenAIGenerationModal}
                    disabled={isGenerating}
                    className="d-flex align-items-center"
                  >
                    <FaMagic className="me-2" />
                    Generate with AI
                  </Button>
                )}
              </div>
              <Form.Control
                type="text"
                value={lessonData.lesson_title}
                onChange={(e) => setLessonData({ ...lessonData, lesson_title: e.target.value })}
                placeholder="e.g., Introduction to Algebra"
              />
              {!editingLesson && curriculumData && (
                <Form.Text className="text-muted">
                  AI will generate a lesson plan based on the curriculum for {classSubject?.subject_offering?.subject?.subject_name} - {classSubject?.class?.form?.form_name}
                </Form.Text>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Topic</Form.Label>
              <Form.Control
                type="text"
                value={lessonData.topic}
                onChange={(e) => setLessonData({ ...lessonData, topic: e.target.value })}
                placeholder="Lesson topic (optional - AI will suggest if left empty)"
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

      {/* AI Generation Form Modal */}
      <Modal show={showAIGenerationModal} onHide={handleCloseAIGenerationModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            AI Lesson Generation
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); handleGenerateLesson(); }}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>Provide details below to customize your lesson plan:</strong><br />
              The AI will use this information along with the curriculum to generate a tailored lesson plan.
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Focus Area / Topic *</Form.Label>
              <Form.Control
                type="text"
                value={aiGenerationForm.focusArea}
                onChange={(e) => setAiGenerationForm({ ...aiGenerationForm, focusArea: e.target.value })}
                placeholder="e.g., Introduction to Algebra, Photosynthesis, World War II"
                required
              />
              <Form.Text className="text-muted">
                What specific topic or concept should this lesson focus on?
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Student Level / Grade</Form.Label>
              <Form.Control
                type="text"
                value={aiGenerationForm.studentLevel}
                onChange={(e) => setAiGenerationForm({ ...aiGenerationForm, studentLevel: e.target.value })}
                placeholder={classSubject?.class?.form?.form_name || "e.g., Form 1, Grade 9"}
              />
              <Form.Text className="text-muted">
                The academic level of your students (auto-filled from class)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Teaching Style</Form.Label>
              <Form.Select
                value={aiGenerationForm.teachingStyle}
                onChange={(e) => setAiGenerationForm({ ...aiGenerationForm, teachingStyle: e.target.value })}
              >
                <option value="">Select a teaching style (optional)</option>
                <option value="interactive">Interactive/Discussion-based</option>
                <option value="hands-on">Hands-on/Experiential</option>
                <option value="lecture">Lecture-based</option>
                <option value="collaborative">Collaborative/Group work</option>
                <option value="multimodal">Multimodal (mixed approaches)</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Preferred teaching approach for this lesson
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Key Concepts to Cover</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={aiGenerationForm.keyConcepts}
                onChange={(e) => setAiGenerationForm({ ...aiGenerationForm, keyConcepts: e.target.value })}
                placeholder="e.g., Variables and expressions, Problem-solving strategies, Real-world applications"
              />
              <Form.Text className="text-muted">
                Specific concepts, skills, or knowledge you want students to learn
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Learning Approach</Form.Label>
              <Form.Select
                value={aiGenerationForm.learningApproach}
                onChange={(e) => setAiGenerationForm({ ...aiGenerationForm, learningApproach: e.target.value })}
              >
                <option value="">Select learning approach (optional)</option>
                <option value="inquiry-based">Inquiry-based Learning</option>
                <option value="problem-based">Problem-based Learning</option>
                <option value="project-based">Project-based Learning</option>
                <option value="flipped">Flipped Classroom</option>
                <option value="gamified">Gamified Learning</option>
                <option value="traditional">Traditional Direct Instruction</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Special Requirements or Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={aiGenerationForm.specialRequirements}
                onChange={(e) => setAiGenerationForm({ ...aiGenerationForm, specialRequirements: e.target.value })}
                placeholder="e.g., Include visual aids, Accommodate diverse learners, Link to previous lesson on fractions, Include assessment for learning"
              />
              <Form.Text className="text-muted">
                Any special considerations, accommodations, or specific requirements
              </Form.Text>
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseAIGenerationModal} disabled={isGenerating}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FaMagic className="me-2" />
                  Generate Lesson Plan
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default LessonPlanning;

