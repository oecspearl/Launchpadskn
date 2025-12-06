import React, { useState, useMemo, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Alert,
  Badge, Tab, Tabs, ListGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaChalkboardTeacher, FaCalendarAlt, FaClock, FaUsers,
  FaBook, FaClipboardList, FaMapMarkerAlt, FaPlus, FaEdit, FaTasks,
  FaLightbulb, FaArrowUp, FaCheckCircle, FaFileAlt, FaComments
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useToast } from '../../contexts/ToastContext';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import Timetable from '../common/Timetable';
import SkeletonLoader from '../common/SkeletonLoader';
import EmptyState from '../common/EmptyState';
import QuickActions from '../common/QuickActions';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import { registerShortcutHandler, unregisterShortcutHandler } from '../../utils/keyboardShortcuts';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const { user, lastLoginTime } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Get teacher ID
  const teacherId = user?.user_id || user?.userId || user?.id;
  const isValidTeacherId = teacherId && (typeof teacherId === 'number' || !teacherId.includes('-'));

  // Queries
  const { data: myClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: () => classService.getClassesByTeacher(teacherId),
    enabled: !!isValidTeacherId
  });

  // Get week date range
  const { weekStart, weekEnd, todayStr } = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      todayStr: today.toISOString().split('T')[0]
    };
  }, []);

  const { data: weekLessons = [], isLoading: isLoadingLessons } = useQuery({
    queryKey: ['teacher-lessons', teacherId, weekStart, weekEnd],
    queryFn: () => classService.getLessonsByTeacher(teacherId, weekStart, weekEnd),
    enabled: !!isValidTeacherId
  });

  // Get assessments for all class subjects
  const { data: allAssessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['teacher-assessments', myClasses.map(cs => cs.class_subject_id)],
    queryFn: async () => {
      const assessments = [];
      for (const classSubject of myClasses) {
        try {
          const csAssessments = await studentService.getAssessmentsByClassSubject(
            classSubject.class_subject_id
          );
          assessments.push(...(csAssessments || []));
        } catch (err) {
          console.warn('Error fetching assessments:', err);
        }
      }
      return assessments;
    },
    enabled: myClasses.length > 0
  });

  const isLoading = isLoadingClasses || isLoadingLessons || isLoadingAssessments;

  // Computed data
  const todayLessons = useMemo(() => {
    return (weekLessons || [])
      .filter(lesson => {
        const lessonDate = new Date(lesson.lesson_date).toISOString().split('T')[0];
        return lessonDate === todayStr;
      })
      .sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [weekLessons, todayStr]);

  const upcomingAssessments = useMemo(() => {
    return (allAssessments || [])
      .filter(a => a.due_date && new Date(a.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [allAssessments]);

  const uniqueClasses = useMemo(() => {
    return Array.from(
      new Map(myClasses.map(cs => [cs.class?.class_id, cs])).values()
    );
  }, [myClasses]);

  // Helper functions
  const getSubjectName = (classSubject) => {
    return classSubject?.subject_offering?.subject?.subject_name ||
      classSubject?.subject_name ||
      'Subject';
  };

  const getClassName = (classSubject) => {
    return classSubject?.class?.class_name || '';
  };

  const getFormName = (classSubject) => {
    return classSubject?.class?.form?.form_name || '';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

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

  // Register keyboard shortcuts
  useEffect(() => {
    registerShortcutHandler('dashboard', () => {
      navigate('/teacher');
      showSuccess('Navigated to Dashboard');
    });

    registerShortcutHandler('lessons', () => {
      setActiveTab('classes');
      showSuccess('Viewing Classes');
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

  // Quick actions configuration
  const quickActions = [
    {
      icon: <FaPlus />,
      label: 'Create Lesson',
      onClick: () => navigate('/teacher/lessons/create'),
      variant: 'primary'
    },
    {
      icon: <FaEdit />,
      label: 'Grade Work',
      onClick: () => navigate('/teacher/grading'),
      variant: 'success'
    },
    {
      icon: <FaChalkboardTeacher />,
      label: 'My Classes',
      onClick: () => setActiveTab('classes'),
      variant: 'secondary'
    },
    {
      icon: <FaTasks />,
      label: 'Assignments',
      onClick: () => navigate('/teacher/assignments'),
      variant: 'warning'
    }
  ];

  if (!isValidTeacherId) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Loading user information...
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="mt-4">
        <SkeletonLoader variant="dashboard" />
      </Container>
    );
  }

  return (
    <Container className="teacher-dashboard-container mt-4">
      {/* Header */}
      <Row className="teacher-dashboard-header mb-4">
        <Col>
          <h2>Welcome, {user?.name || 'Teacher'}!</h2>
          <p className="text-muted mb-0">
            Manage your classes and lessons
          </p>
          {formatLastLogin() && (
            <p className="mb-0 opacity-50 small">
              <FaClock className="me-1" />
              Last login: {formatLastLogin()}
            </p>
          )}
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <Row className="g-4">
            {/* Actionable Insights & Today's Lessons */}
            <Col md={8}>
              {/* Actionable Insights */}
              <Card className="suggested-actions-card shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 fw-bold">
                      <FaLightbulb className="me-2" />
                      Suggested Actions
                    </h5>
                    <Badge bg="light" text="dark" className="rounded-pill px-3 py-2">3 New</Badge>
                  </div>
                  <Row className="g-3">
                    <Col md={4}>
                      <div className="suggested-action-item">
                        <div className="d-flex align-items-center mb-2">
                          <FaClipboardList className="me-2" />
                          <span className="fw-bold">Grading</span>
                        </div>
                        <p className="small mb-3 opacity-75">5 assignments pending review</p>
                        <Button className="suggested-action-btn w-100" size="sm" onClick={() => navigate('/teacher/grading')}>
                          Review Now
                        </Button>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="suggested-action-item">
                        <div className="d-flex align-items-center mb-2">
                          <FaCalendarAlt className="me-2" />
                          <span className="fw-bold">Planning</span>
                        </div>
                        <p className="small mb-3 opacity-75">Next week's schedule is empty</p>
                        <Button className="suggested-action-btn w-100" size="sm" onClick={() => navigate('/teacher/lessons/create')}>
                          Plan Lessons
                        </Button>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="suggested-action-item">
                        <div className="d-flex align-items-center mb-2">
                          <FaUsers className="me-2" />
                          <span className="fw-bold">Attendance</span>
                        </div>
                        <p className="small mb-3 opacity-75">Mark attendance for today</p>
                        <Button className="suggested-action-btn w-100" size="sm" onClick={() => setActiveTab('classes')}>
                          View Classes
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0">
                    <FaCalendarAlt className="me-2" />
                    Today's Lessons
                  </h5>
                </Card.Header>
                <Card.Body>
                  {todayLessons.length === 0 ? (
                    <EmptyState
                      variant="no-lessons"
                      title="No Lessons Today"
                      message="No classes scheduled for today. Enjoy your break!"
                    />
                  ) : (
                    <ListGroup variant="flush">
                      {todayLessons.map((lesson, index) => {
                        const subjectName = lesson.class_subject?.subject_offering?.subject?.subject_name || 'Lesson';
                        const className = lesson.class_subject?.class?.class_name || '';
                        return (
                          <ListGroup.Item key={index} className="lesson-item border-0 px-0 py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{subjectName}</h6>
                                <div className="text-muted small mb-2">
                                  <FaUsers className="me-1" />
                                  {className}
                                </div>
                                <div className="text-muted small">
                                  <FaClock className="me-1" />
                                  {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                                  {lesson.location && (
                                    <>
                                      <span className="ms-3">
                                        <FaMapMarkerAlt className="me-1" />
                                        {lesson.location}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {lesson.lesson_title && (
                                  <p className="mb-0 mt-2 small">{lesson.lesson_title}</p>
                                )}
                              </div>
                              <div className="text-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => navigate(`/teacher/lessons/${lesson.lesson_id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Quick Stats */}
            <Col md={4}>
              <Row className="g-3">
                <Col xs={12}>
                  <Card className="stat-card stat-primary">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0">{uniqueClasses.length}</h3>
                          <small>Classes</small>
                          <div className="mt-2 small text-success">
                            <FaArrowUp className="me-1" />
                            Active this term
                          </div>
                        </div>
                        <FaChalkboardTeacher size={40} opacity={0.5} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12}>
                  <Card className="stat-card stat-success">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0">{todayLessons.length}</h3>
                          <small>Today's Lessons</small>
                          <div className="mt-2 small text-muted">
                            <FaClock className="me-1" />
                            Next: 10:00 AM
                          </div>
                        </div>
                        <FaCalendarAlt size={40} opacity={0.5} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12}>
                  <Card className="stat-card stat-warning">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0">{myClasses.length}</h3>
                          <small>Subjects</small>
                          <div className="mt-2 small text-success">
                            <FaCheckCircle className="me-1" />
                            All on track
                          </div>
                        </div>
                        <FaBook size={40} opacity={0.5} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Recent Activity Feed */}
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <h6 className="mb-0 fw-bold">Recent Activity</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <ListGroup variant="flush">
                        <ListGroup.Item className="border-0 px-3 py-2">
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3">
                              <FaFileAlt className="text-primary" />
                            </div>
                            <div>
                              <p className="mb-0 small fw-bold">New Assignment Submission</p>
                              <small className="text-muted">John Doe submitted "History Essay"</small>
                            </div>
                            <small className="text-muted ms-auto">2m</small>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="border-0 px-3 py-2">
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3">
                              <FaComments className="text-success" />
                            </div>
                            <div>
                              <p className="mb-0 small fw-bold">New Question</p>
                              <small className="text-muted">Sarah asked about "Algebra"</small>
                            </div>
                            <small className="text-muted ms-auto">1h</small>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* My Classes */}
          <Row className="mt-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaChalkboardTeacher className="me-2" />
                    My Classes
                  </h5>
                  <Button variant="outline-primary" size="sm" onClick={() => setActiveTab('classes')}>
                    View All
                  </Button>
                </Card.Header>
                <Card.Body>
                  {uniqueClasses.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">No classes assigned</p>
                  ) : (
                    <Row className="g-3">
                      {uniqueClasses.slice(0, 6).map((classSubject, index) => {
                        const className = getClassName(classSubject);
                        const formName = getFormName(classSubject);
                        const classId = classSubject.class?.class_id;

                        // Get all subjects for this class
                        const subjectsForClass = myClasses.filter(cs => cs.class?.class_id === classId);

                        return (
                          <Col md={4} key={index}>
                            <Card className="class-card h-100">
                              <Card.Body>
                                <h6 className="mb-2">{formName} - {className}</h6>
                                <small className="text-muted">
                                  {subjectsForClass.length} subject{subjectsForClass.length !== 1 ? 's' : ''}
                                </small>
                                <div className="mt-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={() => navigate(`/teacher/classes/${classId}`)}
                                  >
                                    Manage Class
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Assessments */}
          {upcomingAssessments.length > 0 && (
            <Row className="mt-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0 py-3">
                    <h5 className="mb-0">
                      <FaClipboardList className="me-2" />
                      Upcoming Assessments
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      {upcomingAssessments.map((assessment, index) => {
                        const dueDate = new Date(assessment.due_date);
                        const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <ListGroup.Item key={index} className="assessment-item border-0 px-0 py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{assessment.assessment_name}</h6>
                                <small className="text-muted">
                                  Due: {dueDate.toLocaleDateString()}
                                  {daysLeft > 0 && (
                                    <Badge bg={daysLeft <= 3 ? 'danger' : 'warning'} className="ms-2">
                                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                    </Badge>
                                  )}
                                </small>
                              </div>
                              <Badge bg="secondary">{assessment.assessment_type}</Badge>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Tab>

        <Tab eventKey="timetable" title="Timetable">
          <Row>
            <Col>
              <Timetable lessons={weekLessons} />
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="classes" title="My Classes">
          <Row className="g-4">
            {uniqueClasses.map((classSubject, index) => {
              const className = getClassName(classSubject);
              const formName = getFormName(classSubject);
              const classId = classSubject.class?.class_id;
              const subjectsForClass = myClasses.filter(cs => cs.class?.class_id === classId);

              return (
                <Col md={6} lg={4} key={index}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <h5 className="mb-3">{formName} - {className}</h5>
                      <p className="text-muted small mb-2">
                        <strong>Subjects:</strong> {subjectsForClass.length}
                      </p>
                      <div className="mb-3">
                        {subjectsForClass.map((cs, idx) => (
                          <Badge key={idx} bg="light" text="dark" className="me-2 mb-2">
                            {getSubjectName(cs)}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="primary"
                        className="w-100"
                        onClick={() => navigate(`/teacher/classes/${classId}`)}
                      >
                        Manage Class
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
            {uniqueClasses.length === 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <p className="text-muted mb-0">No classes assigned to you</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Tab>
      </Tabs>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        show={showShortcutsModal}
        onHide={() => setShowShortcutsModal(false)}
      />
    </Container>
  );
}

export default TeacherDashboard;
