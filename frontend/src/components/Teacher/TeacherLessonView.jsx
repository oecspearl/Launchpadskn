import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Badge
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaBook, FaClipboardList, FaUsers, FaUserCheck,
  FaBullseye, FaListOl, FaLightbulb, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import StructuredLessonPlanDisplay from './StructuredLessonPlanDisplay';
import './TeacherLessonView.css';

function TeacherLessonView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: lessonData } = await supabase
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
            )
          )
        `)
        .eq('lesson_id', lessonId)
        .single();

      setLesson(lessonData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson');
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
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

  // Parse lesson plan into structured sections
  const parseLessonPlan = (planText) => {
    if (!planText) return null;

    const sections = [];
    const lines = planText.split('\n');
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check for section headers (lines ending with :)
      if (trimmed.endsWith(':') && trimmed.length < 50) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmed.slice(0, -1),
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(trimmed);
      } else {
        // If no section yet, create a general section
        if (sections.length === 0) {
          currentSection = {
            title: 'Overview',
            content: [trimmed]
          };
        }
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : null;
  };

  const renderLessonPlanSection = (section, index) => {
    const getIcon = (title) => {
      const lower = title.toLowerCase();
      if (lower.includes('objective')) return { icon: FaBullseye, class: 'icon-objectives' };
      if (lower.includes('activity') || lower.includes('activities')) return { icon: FaLightbulb, class: 'icon-activities' };
      if (lower.includes('assessment')) return { icon: FaCheckCircle, class: 'icon-assessment' };
      if (lower.includes('resource')) return { icon: FaBook, class: 'icon-resources' };
      return { icon: FaListOl, class: 'icon-plan' };
    };

    const { icon: Icon, class: iconClass } = getIcon(section.title);

    return (
      <div key={index} className="lesson-plan-section">
        <div className="lesson-plan-section-header">
          <div className={`lesson-plan-section-icon ${iconClass}`}>
            <Icon />
          </div>
          <h5 className="lesson-plan-section-title">{section.title}</h5>
        </div>
        <div className="lesson-plan-content">
          {section.content.length === 1 ? (
            <p>{section.content[0]}</p>
          ) : (
            <ul className="lesson-plan-list">
              {section.content.map((item, idx) => (
                <li key={idx}>{item.replace(/^[-•*]\s*/, '')}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
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

  if (error || !lesson) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error || 'Lesson not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="lesson-view-header mb-4">
        <Col>
          <Button
            variant="link"
            className="p-0 mb-3 text-white text-decoration-none"
            onClick={() => navigate('/teacher/dashboard')}
          >
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <h2>{lesson.lesson_title || 'Lesson'}</h2>
          <p className="mb-0">
            {lesson.class_subject?.subject_offering?.subject?.subject_name} •
            {lesson.class_subject?.class?.form?.form_name} - {lesson.class_subject?.class?.class_name}
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Lesson Details</h5>
            </Card.Header>
            <Card.Body>
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
                <div className="mb-3">
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  <strong>Location:</strong> {lesson.location}
                </div>
              )}

              {lesson.topic && (
                <div className="mb-3">
                  <h6>Topic</h6>
                  <p className="mb-0">{lesson.topic}</p>
                </div>
              )}

              {lesson.learning_objectives && (
                <div className="mb-3">
                  <h6>Learning Objectives</h6>
                  <div className="white-space-pre-wrap">{lesson.learning_objectives}</div>
                </div>
              )}

              {lesson.lesson_plan && (
                <div className="mb-3">
                  <h6 className="mb-3">Lesson Plan</h6>
                  <StructuredLessonPlanDisplay lessonPlanText={lesson.lesson_plan} />
                </div>
              )}

              {lesson.homework_description && (
                <div className="homework-card">
                  <h6>
                    <FaClipboardList />
                    Homework
                  </h6>
                  <p>{lesson.homework_description}</p>
                  {lesson.homework_due_date && (
                    <div className="homework-due">
                      <strong>Due:</strong> {formatDate(lesson.homework_due_date)}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3">
                <span className={`lesson-status-badge status-${(lesson.status || 'SCHEDULED').toLowerCase()}`}>
                  {lesson.status || 'SCHEDULED'}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <Button
                variant="primary"
                className="w-100 mb-2"
                onClick={() => navigate(`/teacher/lessons/${lessonId}/attendance`)}
              >
                <FaUserCheck className="me-2" />
                Mark Attendance
              </Button>
              <Button
                variant="outline-primary"
                className="w-100 mb-2"
                onClick={() => navigate(`/teacher/lessons/${lessonId}/content`)}
              >
                <FaBook className="me-2" />
                Manage Content
              </Button>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => navigate(`/teacher/class-subjects/${lesson.class_subject_id}/lessons`)}
              >
                Lesson Planning
              </Button>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Class Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Form:</strong> {lesson.class_subject?.class?.form?.form_name}
              </div>
              <div className="mb-2">
                <strong>Class:</strong> {lesson.class_subject?.class?.class_name}
              </div>
              <div>
                <strong>Subject:</strong> {lesson.class_subject?.subject_offering?.subject?.subject_name}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TeacherLessonView;

