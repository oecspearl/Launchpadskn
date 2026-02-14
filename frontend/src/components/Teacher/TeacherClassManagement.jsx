import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Tab, Tabs, Table, Badge, ListGroup, InputGroup, Form
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUsers, FaBook, FaUserGraduate, FaChalkboardTeacher,
  FaClipboardList, FaCalendarAlt, FaArrowLeft, FaSearch,
  FaChartLine
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import './TeacherClassManagement.css';

function TeacherClassManagement() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const teacherId = user?.user_id || user?.userId || user?.id;
  const isValidTeacherId = teacherId && (typeof teacherId === 'number' || !teacherId.includes('-'));

  // Queries
  const { data: classInfo, isLoading: isLoadingClass, error: classError } = useQuery({
    queryKey: ['class-details', classId],
    queryFn: async () => {
      const classes = await classService.getClasses(user?.role, teacherId);
      return classes.find(c => c.class_id.toString() === classId) || null;
    },
    enabled: !!classId && !!isValidTeacherId
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => classService.getClassRoster(classId),
    enabled: !!classId
  });

  const { data: allClassSubjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['class-subjects-all', classId],
    queryFn: () => classService.getSubjectsByClass(classId),
    enabled: !!classId
  });

  // Filter to only subjects this teacher teaches
  const classSubjects = useMemo(() => {
    if (!isValidTeacherId) return [];
    return allClassSubjects.filter(cs => cs.teacher_id === parseInt(teacherId));
  }, [allClassSubjects, teacherId, isValidTeacherId]);

  // Get all class subject IDs for fetching lessons and assessments
  const classSubjectIds = useMemo(() => {
    return allClassSubjects.map(cs => cs.class_subject_id);
  }, [allClassSubjects]);

  const { data: recentLessons = [], isLoading: isLoadingLessons } = useQuery({
    queryKey: ['class-recent-lessons', classSubjectIds],
    queryFn: async () => {
      if (classSubjectIds.length === 0) return [];
      // Fetch lessons for all class subjects in parallel
      const results = await Promise.allSettled(
        classSubjectIds.map(csId => classService.getLessonsByClassSubject(csId))
      );
      const allLessons = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value || []);
      // Sort by date and time, take most recent 5
      return allLessons
        .sort((a, b) => {
          const dateCompare = new Date(b.lesson_date) - new Date(a.lesson_date);
          if (dateCompare !== 0) return dateCompare;
          return (b.start_time || '').localeCompare(a.start_time || '');
        })
        .slice(0, 5);
    },
    enabled: classSubjectIds.length > 0
  });

  const { data: upcomingAssessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['class-upcoming-assessments', classSubjectIds],
    queryFn: async () => {
      if (classSubjectIds.length === 0) return [];
      // Fetch assessments for all class subjects in parallel
      const results = await Promise.allSettled(
        classSubjectIds.map(csId => studentService.getAssessmentsByClassSubject(csId))
      );
      const allAssessments = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value || []);
      // Filter upcoming and sort
      return allAssessments
        .filter(a => a.due_date && new Date(a.due_date) >= new Date())
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);
    },
    enabled: classSubjectIds.length > 0
  });

  const isLoading = isLoadingClass || isLoadingStudents || isLoadingSubjects || isLoadingLessons || isLoadingAssessments;

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(assignment => {
      const studentName = assignment.student?.name?.toLowerCase() || '';
      const studentEmail = assignment.student?.email?.toLowerCase() || '';
      return studentName.includes(query) || studentEmail.includes(query);
    });
  }, [students, searchQuery]);

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

  if (classError || !classInfo) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {classError?.message || 'Class not found'}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/teacher/dashboard')}>
          <FaArrowLeft className="me-2" />
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Header */}
      <Row className="mb-4 pt-5">
        <Col>
          <Button
            variant="outline-secondary"
            className="mb-3"
            onClick={() => navigate('/teacher/dashboard')}
          >
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>{classInfo.form?.form_number}{classInfo.form?.stream} - {classInfo.class_name}</h2>
              <p className="text-muted mb-0">
                {classInfo.description || `Class code: ${classInfo.class_code}`}
              </p>
            </div>
            <div className="text-end">
              <Badge bg="info" className="me-2">
                <FaUsers className="me-1" />
                {students.length} Students
              </Badge>
              <Badge bg="secondary">
                <FaBook className="me-1" />
                {classSubjects.length} Subjects
              </Badge>
            </div>
          </div>
        </Col>
      </Row>

      {/* Class Info Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Form</h6>
                  <h4 className="mb-0">{classInfo.form?.form_number}{classInfo.form?.stream}</h4>
                </div>
                <FaChalkboardTeacher size={30} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Academic Year</h6>
                  <h4 className="mb-0">{classInfo.academic_year}</h4>
                </div>
                <FaCalendarAlt size={30} className="text-success" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Capacity</h6>
                  <h4 className="mb-0">{classInfo.capacity || 'N/A'}</h4>
                </div>
                <FaUsers size={30} className="text-warning" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Enrolled</h6>
                  <h4 className="mb-0">{students.length}</h4>
                </div>
                <FaUserGraduate size={30} className="text-info" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        {/* Overview Tab */}
        <Tab eventKey="overview" title="Overview">
          <Row className="g-4">
            <Col md={8}>
              {/* Recent Lessons */}
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaCalendarAlt className="me-2" />
                    Recent Lessons
                  </h5>
                  {classSubjects.length > 0 && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/teacher/class-subjects/${classSubjects[0]?.class_subject_id}/lessons`)}
                    >
                      View All
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  {recentLessons.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">No lessons found</p>
                  ) : (
                    <ListGroup variant="flush">
                      {recentLessons.map((lesson, index) => (
                        <ListGroup.Item key={index} className="border-0 px-0 py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">
                                {lesson.class_subject?.subject_offering?.subject?.subject_name || 'Lesson'}
                              </h6>
                              <p className="text-muted small mb-1">
                                {new Date(lesson.lesson_date).toLocaleDateString()} • {lesson.start_time} - {lesson.end_time}
                              </p>
                              {lesson.lesson_title && (
                                <p className="mb-0 small">{lesson.lesson_title}</p>
                              )}
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/teacher/lessons/${lesson.lesson_id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>

              {/* Upcoming Assessments */}
              {upcomingAssessments.length > 0 && (
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
                          <ListGroup.Item key={index} className="border-0 px-0 py-3">
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
              )}
            </Col>

            <Col md={4}>
              {/* Subjects Taught */}
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0">
                    <FaBook className="me-2" />
                    Subjects You Teach
                  </h5>
                </Card.Header>
                <Card.Body>
                  {classSubjects.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">
                      No subjects assigned to you for this class
                    </p>
                  ) : (
                    <ListGroup variant="flush">
                      {classSubjects.map((cs, index) => (
                        <ListGroup.Item key={index} className="border-0 px-0 py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>
                                {cs.subject_offering?.subject?.subject_name || 'Subject'}
                              </strong>
                              <br />
                              <small className="text-muted">
                                {cs.subject_offering?.subject?.subject_code || ''}
                              </small>
                            </div>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/teacher/class-subjects/${cs.class_subject_id}/lessons`)}
                              >
                                Manage
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => navigate(`/teacher/class-subjects/${cs.class_subject_id}/gradebook`)}
                              >
                                <FaChartLine className="me-1" />
                                Gradebook
                              </Button>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>

              {/* Class Info */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0">Class Information</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Form Tutor:</strong>
                    <br />
                    {classInfo.form_tutor?.name || 'Not assigned'}
                    {classInfo.form_tutor?.email && (
                      <small className="d-block text-muted">{classInfo.form_tutor.email}</small>
                    )}
                  </div>
                  {classInfo.room_number && (
                    <div className="mb-3">
                      <strong>Room:</strong> {classInfo.room_number}
                    </div>
                  )}
                  {classInfo.description && (
                    <div>
                      <strong>Description:</strong>
                      <p className="mb-0 small">{classInfo.description}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Students Tab */}
        <Tab eventKey="students" title={`Students (${students.length})`}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaUsers className="me-2" />
                  Class Roster
                </h5>
                <InputGroup style={{ maxWidth: '300px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>
            </Card.Header>
            <Card.Body>
              {students.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">No students enrolled in this class</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((assignment, index) => {
                      const studentData = assignment.student;
                      return (
                        <tr key={studentData?.user_id || index}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{studentData?.name || 'N/A'}</strong>
                          </td>
                          <td>{studentData?.email || 'N/A'}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/teacher/students/${studentData?.user_id}`)}
                            >
                              View Profile
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
              {searchQuery && filteredStudents.length === 0 && (
                <p className="text-muted text-center py-3 mb-0">
                  No students found matching "{searchQuery}"
                </p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Subjects Tab */}
        <Tab eventKey="subjects" title="Subjects">
          <Row className="g-4">
            {classSubjects.map((cs, index) => (
              <Col md={6} lg={4} key={index}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body>
                    <h5 className="mb-3">
                      {cs.subject_offering?.subject?.subject_name || 'Subject'}
                    </h5>
                    <p className="text-muted small mb-2">
                      <strong>Code:</strong> {cs.subject_offering?.subject?.subject_code || 'N/A'}
                    </p>
                    {cs.subject_offering?.weekly_periods && (
                      <p className="text-muted small mb-3">
                        <strong>Periods per week:</strong> {cs.subject_offering.weekly_periods}
                      </p>
                    )}
                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/teacher/class-subjects/${cs.class_subject_id}/lessons`)}
                      >
                        <FaBook className="me-2" />
                        Manage Lessons
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => navigate(`/teacher/class-subjects/${cs.class_subject_id}/gradebook`)}
                      >
                        <FaChartLine className="me-2" />
                        View Gradebook
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => navigate(`/teacher/curriculum?subject=${cs.subject_offering?.subject_id}&form=${classInfo.form_id}`)}
                      >
                        View Curriculum
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {classSubjects.length === 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <p className="text-muted mb-0">No subjects assigned to you for this class</p>
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

export default TeacherClassManagement;
