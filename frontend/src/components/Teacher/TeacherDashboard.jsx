import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Badge, Tab, Tabs, ListGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaChalkboardTeacher, FaCalendarAlt, FaClock, FaUsers,
  FaBook, FaClipboardList, FaMapMarkerAlt
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import Timetable from '../common/Timetable';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="teacher-dashboard-container mt-4">
      {/* Header */}
      <Row className="teacher-dashboard-header mb-4">
        <Col>
          <h2>Welcome, {user?.name || 'Teacher'}!</h2>
          <p className="text-muted">
            Manage your classes and lessons
          </p>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <Row className="g-4">
            {/* Today's Lessons */}
            <Col md={8}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0">
                    <FaCalendarAlt className="me-2" />
                    Today's Lessons
                  </h5>
                </Card.Header>
                <Card.Body>
                  {todayLessons.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No lessons scheduled for today</p>
                    </div>
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
                        </div>
                        <FaBook size={40} opacity={0.5} />
                      </div>
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
    </Container>
  );
}

export default TeacherDashboard;
