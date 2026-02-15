import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Alert,
  Badge, Tab, Tabs, ListGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaBook, FaClipboardList, FaCalendarAlt, FaClock,
  FaMapMarkerAlt, FaGraduationCap, FaTasks, FaChartBar,
  FaEye, FaBolt, FaUser
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useToast } from '../../contexts/ToastContext';
import { useStudentData } from '../../hooks/useStudentData';
import Timetable from '../common/Timetable';
import SkeletonLoader from '../common/SkeletonLoader';
import EmptyState from '../common/EmptyState';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import { registerShortcutHandler, unregisterShortcutHandler } from '../../utils/keyboardShortcuts';
import { addRecentlyViewed, getRecentlyViewedByType } from '../../services/recentlyViewedService';
import Gamification from '../InteractiveContent/Gamification';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import GoalSetting from './GoalSetting';
import './StudentDashboard.css';

function StudentDashboard() {
  const { user, lastLoginTime } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const {
    myClass,
    subjects: mySubjects,
    lessons: weekLessons,
    assignments,
    isLoading,
    error
  } = useStudentData(user);

  // Derived state
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todayLessons = weekLessons.filter(lesson => {
    const lessonDate = new Date(lesson.lesson_date).toISOString().split('T')[0];
    return lessonDate === todayStr;
  });

  // Get subject name helper
  const getSubjectName = (classSubject) => {
    return classSubject?.subject_offering?.subject?.subject_name ||
      classSubject?.subject_name ||
      'Unknown Subject';
  };

  // Format time helper
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // Handle lesson click - navigate to lesson view
  const handleLessonClick = (lesson) => {
    if (lesson && lesson.lesson_id) {
      navigate(`/student/lessons/${lesson.lesson_id}`);
    }
  };

  // Load recently viewed items
  useEffect(() => {
    const recent = getRecentlyViewedByType('lesson', 3);
    setRecentlyViewed(recent);
  }, []);

  // Register keyboard shortcuts
  useEffect(() => {
    registerShortcutHandler('dashboard', () => {
      navigate('/student');
      showSuccess('Navigated to Dashboard');
    });

    registerShortcutHandler('lessons', () => {
      setActiveTab('timetable');
      showSuccess('Viewing Timetable');
    });

    registerShortcutHandler('help', () => {
      setShowShortcutsModal(true);
    });

    return () => {
      unregisterShortcutHandler('dashboard');
      unregisterShortcutHandler('lessons');
      unregisterShortcutHandler('help');
    };
  }, [navigate, showSuccess]);

  // Format last login time
  const formatLastLogin = () => {
    if (!lastLoginTime) return null;
    const date = new Date(lastLoginTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Container className="mt-4">
        <SkeletonLoader variant="dashboard" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Error loading dashboard data</Alert>
      </Container>
    );
  }

  return (
    <div className="student-dashboard">
      <Container className="pt-4">
        {/* Header */}
        <div className="dashboard-header-section">
          <Row className="align-items-center">
            <Col md={8}>
              <h2>Welcome back, {user?.name || 'Student'}!</h2>
              {myClass && (
                <p className="mb-0 opacity-75">
                  {myClass.form?.form_name || 'Form'} - {myClass.class_name || 'Class'}
                  {myClass.form_tutor && ` • Form Tutor: ${myClass.form_tutor.name} `}
                </p>
              )}
              {formatLastLogin() && (
                <p className="mb-0 opacity-50 small">
                  <FaClock className="me-1" />
                  Last login: {formatLastLogin()}
                </p>
              )}
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Badge bg="light" text="dark" className="p-2 px-3 rounded-pill">
                Student Portal
              </Badge>
            </Col>
          </Row>
        </div>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 border-bottom-0"
        >
          <Tab eventKey="overview" title="Overview">
            <Row className="g-4">
              {/* Today's Timetable */}
              <Col md={8}>
                <Card className="glass-card h-100 border-0">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold text-dark">
                      <FaCalendarAlt className="me-2 text-primary" />
                      Today's Lessons
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {todayLessons.length === 0 ? (
                      <EmptyState
                        variant="no-lessons"
                        title="No Lessons Today"
                        message="Enjoy your free day! Check your timetable for upcoming classes."
                      />
                    ) : (
                      <div className="todays-lessons-section mb-0">
                        {todayLessons.map((lesson, index) => {
                          const subjectName = lesson.class_subject?.subject_offering?.subject?.subject_name || 'Lesson';
                          return (
                            <div
                              key={index}
                              className="lesson-item clickable-lesson"
                              onClick={() => handleLessonClick(lesson)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="lesson-time">
                                {formatTime(lesson.start_time)}<br />
                                <span className="opacity-75">-</span><br />
                                {formatTime(lesson.end_time)}
                              </div>
                              <div className="lesson-content">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="lesson-title">{subjectName}</h6>
                                    <div className="lesson-subtitle">
                                      {lesson.location && (
                                        <span>
                                          <FaMapMarkerAlt className="me-1" />
                                          {lesson.location}
                                        </span>
                                      )}
                                    </div>
                                    {lesson.lesson_title && (
                                      <p className="mb-0 mt-1 small text-muted">{lesson.lesson_title}</p>
                                    )}
                                  </div>
                                  <Badge bg="light" text="primary" className="border border-primary-subtle">
                                    {lesson.class_subject?.class?.class_name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Quick Stats */}
              <Col md={4}>
                <Row className="g-3">
                  <Col xs={12}>
                    <Card className="stat-card bg-primary text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{mySubjects.length}</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">My Subjects</small>
                          </div>
                          <FaBook size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12}>
                    <Card className="stat-card bg-success text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{todayLessons.length}</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">Today's Lessons</small>
                          </div>
                          <FaCalendarAlt size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12}>
                    <Card className="stat-card bg-warning text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{assignments.length}</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">Assignments</small>
                          </div>
                          <FaClipboardList size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Recommendations and Goals */}
            <Row className="mt-4 g-4">
              <Col md={6}>
                <PersonalizedRecommendations />
              </Col>
              <Col md={6}>
                <GoalSetting />
              </Col>
            </Row>

            {/* My Subjects Preview */}
            <Row className="mt-4">
              <Col>
                <Card className="glass-card border-0">
                  <Card.Header className="bg-transparent border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold text-dark">
                      <FaBook className="me-2 text-primary" />
                      My Subjects
                    </h5>
                    <Button variant="link" className="text-decoration-none" onClick={() => setActiveTab('subjects')}>
                      View All
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {mySubjects.length === 0 ? (
                      <div className="empty-state">
                        <p className="mb-0">No subjects assigned</p>
                      </div>
                    ) : (
                      <div className="subjects-grid">
                        {mySubjects.slice(0, 3).map((classSubject, index) => {
                          const subjectName = getSubjectName(classSubject);
                          const teacherName = classSubject.teacher?.name || 'TBD';
                          const teacherPhoto = classSubject.teacher?.profile_image_url;
                          return (
                            <div key={index} className="subject-card">
                              <div className="d-flex align-items-center mb-2">
                                <div style={{
                                  width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                                  backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', flexShrink: 0, border: '2px solid #dee2e6'
                                }}>
                                  {teacherPhoto ? (
                                    <img src={teacherPhoto} alt={teacherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <FaUser size={16} color="#6c757d" />
                                  )}
                                </div>
                                <small className="text-muted ms-2">{teacherName}</small>
                              </div>
                              <h6 className="subject-card-title">{subjectName}</h6>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="w-100 rounded-pill"
                                onClick={() => navigate(`/student/subjects/${classSubject.class_subject_id}`)}
                              >
                                View Subject
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Upcoming Assignments Preview */}
            {assignments.length > 0 && (
              <Row className="mt-4">
                <Col>
                  <Card className="glass-card border-0">
                    <Card.Header className="bg-transparent border-0 py-3">
                      <h5 className="mb-0 fw-bold text-dark">
                        <FaClipboardList className="me-2 text-primary" />
                        Upcoming Assignments
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="assignments-list mt-0">
                        {assignments.map((assignment, index) => {
                          const dueDate = new Date(assignment.due_date);
                          const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                          return (
                            <div key={index} className="assignment-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="assignment-title">{assignment.assessment_name}</h6>
                                  <div className="assignment-meta">
                                    <span>Due: {dueDate.toLocaleDateString()}</span>
                                    {daysLeft > 0 && (
                                      <Badge bg={daysLeft <= 3 ? 'danger' : 'warning'} text={daysLeft <= 3 ? 'white' : 'dark'} className="rounded-pill">
                                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge bg="secondary" className="rounded-pill">{assignment.assessment_type}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>

          <Tab eventKey="timetable" title="Timetable">
            <Card className="glass-card border-0 p-3">
              <Timetable
                lessons={weekLessons}
                onLessonClick={handleLessonClick}
                showAllUpcoming={true}
              />
            </Card>
          </Tab>

          <Tab eventKey="subjects" title="Subjects">
            <div className="subjects-grid">
              {mySubjects.map((classSubject, index) => {
                const subjectName = getSubjectName(classSubject);
                const teacherName = classSubject.teacher?.name || 'TBD';
                const teacherPhoto = classSubject.teacher?.profile_image_url;
                return (
                  <div key={index} className="subject-card h-100">
                    <div className="text-center mb-3">
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                        backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto', border: '3px solid #dee2e6'
                      }}>
                        {teacherPhoto ? (
                          <img src={teacherPhoto} alt={teacherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FaUser size={24} color="#6c757d" />
                        )}
                      </div>
                      <small className="text-muted d-block mt-1">{teacherName}</small>
                    </div>
                    <h5 className="subject-card-title">{subjectName}</h5>
                    <p className="subject-card-meta mb-4">
                      <strong>Class:</strong> {classSubject.class?.class_name || myClass?.class_name}
                    </p>
                    <Button
                      variant="primary"
                      className="w-100 rounded-pill"
                      onClick={() => navigate(`/student/subjects/${classSubject.class_subject_id}`)}
                    >
                      View Subject Details
                    </Button>
                  </div>
                );
              })}
            </div>
            {mySubjects.length === 0 && (
              <div className="empty-state">
                <p className="mb-0">No subjects assigned to your class</p>
              </div>
            )}
          </Tab>

          <Tab eventKey="gamification" title="Gamification">
            <Gamification studentId={user?.user_id} />
          </Tab>
        </Tabs>
      </Container>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        show={showShortcutsModal}
        onHide={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}

export default StudentDashboard;
