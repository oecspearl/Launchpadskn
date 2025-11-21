import React, { useState } from 'react';
import { 
  Card, Button, Form, Alert, Spinner, 
  Row, Col, Badge
} from 'react-bootstrap';
import { FaRobot, FaMagic } from 'react-icons/fa';
import { generateLessonPlan } from '../../services/aiLessonService';

function AILessonPlanner({ 
  onPlanGenerated, 
  subjectName = '', 
  formName = '',
  initialTopic = '' 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    topic: initialTopic || '',
    gradeLevel: formName || '',
    duration: 45,
    previousTopics: '',
    learningStyle: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    console.log('[AILessonPlanner] Generate button clicked');
    console.log('[AILessonPlanner] Form data:', formData);
    console.log('[AILessonPlanner] Subject name:', subjectName);
    console.log('[AILessonPlanner] Form name:', formName);
    console.log('[AILessonPlanner] onPlanGenerated callback:', typeof onPlanGenerated);
    
    if (!formData.topic || !formData.gradeLevel) {
      setError('Please fill in at least the topic and grade level.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[AILessonPlanner] Calling generateLessonPlan with:', {
        subject: subjectName || 'General',
        topic: formData.topic,
        gradeLevel: formData.gradeLevel,
        duration: parseInt(formData.duration),
        previousTopics: formData.previousTopics,
        learningStyle: formData.learningStyle
      });

      const lessonPlan = await generateLessonPlan({
        subject: subjectName || 'General',
        topic: formData.topic,
        gradeLevel: formData.gradeLevel,
        duration: parseInt(formData.duration),
        previousTopics: formData.previousTopics,
        learningStyle: formData.learningStyle
      });

      console.log('[AILessonPlanner] Received lesson plan from AI:', lessonPlan);
      console.log('[AILessonPlanner] Lesson plan keys:', Object.keys(lessonPlan));
      console.log('[AILessonPlanner] Lesson title:', lessonPlan.lesson_title);
      console.log('[AILessonPlanner] Learning objectives:', lessonPlan.learning_objectives);
      console.log('[AILessonPlanner] Lesson plan:', lessonPlan.lesson_plan);
      console.log('[AILessonPlanner] Homework:', lessonPlan.homework_description);

      if (onPlanGenerated) {
        console.log('[AILessonPlanner] Calling onPlanGenerated callback');
        onPlanGenerated(lessonPlan);
        console.log('[AILessonPlanner] onPlanGenerated callback completed');
      } else {
        console.warn('[AILessonPlanner] onPlanGenerated callback is not defined');
      }
      
      // Close the form after successful generation
      setShowForm(false);
    } catch (err) {
      console.error('[AILessonPlanner] Error generating lesson plan:', err);
      console.error('[AILessonPlanner] Error stack:', err.stack);
      setError(err.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mb-3 border-primary">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FaRobot className="me-2" />
          <strong>AI Lesson Planner</strong>
        </div>
        <Badge bg="light" text="dark">
          <FaMagic className="me-1" />
          Powered by AI
        </Badge>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {!showForm ? (
          <div className="text-center">
            <p className="text-muted mb-3">
              Let AI help you create a comprehensive lesson plan with learning objectives, 
              detailed activities, and homework assignments.
            </p>
            <Button 
              variant="primary" 
              onClick={() => setShowForm(true)}
              disabled={isGenerating}
            >
              <FaRobot className="me-2" />
              Generate Lesson Plan with AI
            </Button>
          </div>
        ) : (
          <Form onSubmit={handleGenerate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Topic <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="e.g., Introduction to Algebra"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Grade Level / Form <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    placeholder="e.g., Form 1, Grade 10"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Learning Style (Optional)</Form.Label>
                  <Form.Select
                    name="learningStyle"
                    value={formData.learningStyle}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="reading/writing">Reading/Writing</option>
                    <option value="mixed">Mixed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Previous Topics Covered (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="previousTopics"
                value={formData.previousTopics}
                onChange={handleInputChange}
                placeholder="List any previous topics that relate to this lesson..."
              />
              <Form.Text className="text-muted">
                This helps AI create a more contextual lesson plan.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaMagic className="me-2" />
                    Generate Lesson Plan
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

export default AILessonPlanner;

