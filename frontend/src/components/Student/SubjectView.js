import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Badge, ListGroup, Tabs, Tab
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FaBook, FaClock, FaMapMarkerAlt, FaClipboardList, 
  FaTrophy, FaCalendarAlt, FaUser, FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import './SubjectView.css';

function SubjectView() {
  const { classSubjectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons');
  
  // Subject data
  const [classSubject, setClassSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [grades, setGrades] = useState([]);
  
  useEffect(() => {
    if (classSubjectId) {
      fetchSubjectData();
    }
  }, [classSubjectId]);
  
  const fetchSubjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get class-subject details
      const { data: classSubjectData, error: csError } = await supabase
        .from('class_subjects')
        .select(`
          *,
          subject_offering:subject_form_offerings(
            *,
            subject:subjects(*)
          ),
          class:classes(
            *,
            form:forms(*)
          ),
          teacher:users!class_subjects_teacher_id_fkey(*)
        `)
        .eq('class_subject_id', classSubjectId)
        .single();
      
      if (csError) throw csError;
      
      if (classSubjectData) {
        setClassSubject(classSubjectData);
        
        // Get lessons for this subject
        const subjectLessons = await supabaseService.getLessonsByClassSubject(classSubjectId);
        setLessons(subjectLessons || []);
        
        // Get assessments
        const subjectAssessments = await supabaseService.getAssessmentsByClassSubject(classSubjectId);
        setAssessments(subjectAssessments || []);
        
        // Get student's grades for this subject
        if (user && (user.user_id || user.userId)) {
          // Use numeric user_id, not UUID
          const studentId = user.user_id || user.userId;
          const allGrades = await supabaseService.getStudentGrades(studentId);
          const subjectGrades = (allGrades || []).filter(grade => {
            return grade.assessment?.class_subject_id === parseInt(classSubjectId);
          });
          setGrades(subjectGrades || []);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching subject data:', err);
      setError('Failed to load subject details');
      setIsLoading(false);
    }
  };
  
  const getSubjectName = () => {
    return classSubject?.subject_offering?.subject?.subject_name || 'Subject';
  };
  
  const getTeacherName = () => {
    return classSubject?.teacher?.name || 'TBD';
  };
  
  const getClassName = () => {
    return classSubject?.class?.class_name || '';
  };
  
  const getFormName = () => {
    return classSubject?.class?.form?.form_name || '';
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
  
  // Group lessons by status
  const upcomingLessons = lessons.filter(l => {
    const lessonDate = new Date(l.lesson_date + 'T' + l.start_time);
    return lessonDate >= new Date();
  }).sort((a, b) => {
    const dateA = new Date(a.lesson_date + 'T' + a.start_time);
    const dateB = new Date(b.lesson_date + 'T' + b.start_time);
    return dateA - dateB;
  });
  
  const pastLessons = lessons.filter(l => {
    const lessonDate = new Date(l.lesson_date + 'T' + l.start_time);
    return lessonDate < new Date();
  }).sort((a, b) => {
    const dateA = new Date(a.lesson_date + 'T' + a.start_time);
    const dateB = new Date(b.lesson_date + 'T' + b.start_time);
    return dateB - dateA; // Most recent first
  });
  
  // Group assessments by status
  const upcomingAssessments = assessments.filter(a => {
    return a.due_date && new Date(a.due_date) >= new Date();
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  
  const pastAssessments = assessments.filter(a => {
    return !a.due_date || new Date(a.due_date) < new Date();
  }).sort((a, b) => {
    const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
    const dateB = b.due_date ? new Date(b.due_date) : new Date(0);
    return dateB - dateA;
  });
  
  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading subject details...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  if (!classSubject) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Subject not found</Alert>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="link" 
            className="p-0 mb-2"
            onClick={() => navigate('/student/dashboard')}
          >
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <h2>{getSubjectName()}</h2>
          <p className="text-muted mb-0">
            {getFormName()} • {getClassName()} • Teacher: {getTeacherName()}
          </p>
        </Col>
      </Row>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="lessons" title={`Lessons (${lessons.length})`}>
          <Row className="g-4">
            {/* Upcoming Lessons */}
            {upcomingLessons.length > 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0 py-3">
                    <h5 className="mb-0">
                      <FaCalendarAlt className="me-2" />
                      Upcoming Lessons
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      {upcomingLessons.map((lesson, index) => (
                        <ListGroup.Item key={index} className="border-0 px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{lesson.lesson_title || 'Lesson'}</h6>
                              <div className="text-muted small mb-2">
                                <FaCalendarAlt className="me-1" />
                                {formatDate(lesson.lesson_date)}
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
                              {lesson.topic && (
                                <p className="mb-0 mt-2 small">
                                  <strong>Topic:</strong> {lesson.topic}
                                </p>
                              )}
                              {lesson.homework_description && (
                                <div className="mt-2">
                                  <Badge bg="warning">Homework Assigned</Badge>
                                  {lesson.homework_due_date && (
                                    <small className="text-muted ms-2">
                                      Due: {formatDate(lesson.homework_due_date)}
                                    </small>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            )}
            
            {/* Past Lessons */}
            {pastLessons.length > 0 && (
              <Col className="mt-4">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0 py-3">
                    <h5 className="mb-0">
                      <FaCalendarAlt className="me-2" />
                      Past Lessons
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      {pastLessons.slice(0, 10).map((lesson, index) => (
                        <ListGroup.Item key={index} className="border-0 px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{lesson.lesson_title || 'Lesson'}</h6>
                              <div className="text-muted small mb-2">
                                <FaCalendarAlt className="me-1" />
                                {formatDate(lesson.lesson_date)}
                              </div>
                              <div className="text-muted small">
                                <FaClock className="me-1" />
                                {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                              </div>
                            </div>
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            )}
            
            {lessons.length === 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <p className="text-muted mb-0">No lessons scheduled yet</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Tab>
        
        <Tab eventKey="assignments" title={`Assignments (${assessments.length})`}>
          <Row className="g-4">
            {/* Upcoming Assignments */}
            {upcomingAssessments.length > 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0 py-3">
                    <h5 className="mb-0">
                      <FaClipboardList className="me-2" />
                      Upcoming Assignments
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      {upcomingAssessments.map((assessment, index) => {
                        const dueDate = new Date(assessment.due_date);
                        const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <ListGroup.Item key={index} className="border-0 px-0 py-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{assessment.assessment_name}</h6>
                                <div className="text-muted small mb-2">
                                  <FaCalendarAlt className="me-1" />
                                  Due: {formatDate(assessment.due_date)}
                                  {daysLeft > 0 && (
                                    <Badge bg={daysLeft <= 3 ? 'danger' : 'warning'} className="ms-2">
                                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                    </Badge>
                                  )}
                                </div>
                                <div className="small">
                                  <Badge bg="secondary" className="me-2">
                                    {assessment.assessment_type}
                                  </Badge>
                                  {assessment.total_marks && (
                                    <span className="text-muted">
                                      Total: {assessment.total_marks} marks
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => navigate(`/student/assignments/${assessment.assessment_id}/submit`)}
                              >
                                Submit
                              </Button>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            )}
            
            {/* Past Assignments */}
            {pastAssessments.length > 0 && (
              <Col className="mt-4">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0 py-3">
                    <h5 className="mb-0">
                      <FaClipboardList className="me-2" />
                      Past Assignments
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      {pastAssessments.map((assessment, index) => {
                        const grade = grades.find(g => g.assessment_id === assessment.assessment_id);
                        return (
                          <ListGroup.Item key={index} className="border-0 px-0 py-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{assessment.assessment_name}</h6>
                                <div className="text-muted small mb-2">
                                  {assessment.due_date && (
                                    <>
                                      <FaCalendarAlt className="me-1" />
                                      Due: {formatDate(assessment.due_date)}
                                    </>
                                  )}
                                </div>
                                <div className="small">
                                  <Badge bg="secondary" className="me-2">
                                    {assessment.assessment_type}
                                  </Badge>
                                  {grade ? (
                                    <Badge bg={grade.percentage >= 70 ? 'success' : grade.percentage >= 50 ? 'warning' : 'danger'}>
                                      {grade.marks_obtained}/{assessment.total_marks} ({grade.percentage}%)
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not graded yet</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            )}
            
            {assessments.length === 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <p className="text-muted mb-0">No assignments yet</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Tab>
        
        <Tab eventKey="grades" title="Grades">
          <Row>
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0">
                    <FaTrophy className="me-2" />
                    My Grades
                  </h5>
                </Card.Header>
                <Card.Body>
                  {grades.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted mb-0">No grades recorded yet</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {grades.map((grade, index) => {
                        const assessment = grade.assessment;
                        return (
                          <ListGroup.Item key={index} className="border-0 px-0 py-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{assessment?.assessment_name || 'Assessment'}</h6>
                                <div className="text-muted small mb-2">
                                  Type: {assessment?.assessment_type || 'N/A'}
                                </div>
                                <div>
                                  <Badge 
                                    bg={grade.percentage >= 70 ? 'success' : grade.percentage >= 50 ? 'warning' : 'danger'}
                                    className="me-2"
                                    style={{ fontSize: '1rem', padding: '0.5rem' }}
                                  >
                                    {grade.marks_obtained}/{assessment?.total_marks || 'N/A'} 
                                    {' '}({grade.percentage}%)
                                  </Badge>
                                  {grade.grade_letter && (
                                    <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem' }}>
                                      Grade: {grade.grade_letter}
                                    </Badge>
                                  )}
                                </div>
                                {grade.comments && (
                                  <p className="mb-0 mt-2 small">
                                    <strong>Comments:</strong> {grade.comments}
                                  </p>
                                )}
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
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default SubjectView;


