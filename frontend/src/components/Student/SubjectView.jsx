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
import LessonsStream from './LessonsStream';
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
        
        // Get assessments from subject_assessments table
        const subjectAssessments = await supabaseService.getAssessmentsByClassSubject(classSubjectId);
        
        // Get assignments from lesson_content (where content_type = 'ASSIGNMENT')
        let lessonContentAssignments = [];
        if (subjectLessons && subjectLessons.length > 0) {
          const lessonIds = subjectLessons.map(l => l.lesson_id);
          const { data, error: lcError } = await supabase
            .from('lesson_content')
            .select(`
              *,
              lesson:lessons(
                lesson_id,
                lesson_date,
                homework_due_date,
                lesson_title,
                class_subject_id
              )
            `)
            .eq('content_type', 'ASSIGNMENT')
            .eq('is_published', true)
            .in('lesson_id', lessonIds);
          
          if (lcError) {
            if (import.meta.env.DEV) console.error('Error fetching lesson content assignments:', lcError);
          } else {
            lessonContentAssignments = data || [];
          }
        }
        
        // Convert lesson content assignments to assessment format
        const convertedAssignments = (lessonContentAssignments || []).map(content => {
          // Use homework_due_date from lesson, or lesson_date as fallback, or null
          const dueDate = content.lesson?.homework_due_date || 
                         (content.lesson?.lesson_date ? `${content.lesson.lesson_date}T23:59:59` : null);
          
          return {
            assessment_id: `content_${content.content_id}`, // Prefix to avoid conflicts
            assessment_name: content.title,
            assessment_type: 'ASSIGNMENT',
            due_date: dueDate,
            total_marks: null, // Lesson content assignments don't have total_marks
            class_subject_id: parseInt(classSubjectId),
            description: content.description || content.instructions || '',
            instructions: content.instructions || '',
            url: content.url,
            assignment_details_file_path: content.assignment_details_file_path,
            assignment_details_file_name: content.assignment_details_file_name,
            assignment_rubric_file_path: content.assignment_rubric_file_path,
            assignment_rubric_file_name: content.assignment_rubric_file_name,
            lesson_id: content.lesson_id,
            content_id: content.content_id,
            is_lesson_content: true // Flag to identify lesson content assignments
          };
        });
        
        // Merge subject assessments with lesson content assignments
        const allAssessments = [...(subjectAssessments || []), ...convertedAssignments];
        setAssessments(allAssessments);
        
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
      if (import.meta.env.DEV) console.error('Error fetching subject data:', err);
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
  
  // Group assessments by status
  // For assignments without due dates, treat them as upcoming
  const upcomingAssessments = assessments.filter(a => {
    if (!a.due_date) {
      // If no due date, treat as upcoming (especially for lesson content assignments)
      return true;
    }
    return new Date(a.due_date) >= new Date();
  }).sort((a, b) => {
    // Sort by due date, with no-due-date items at the end
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });
  
  const pastAssessments = assessments.filter(a => {
    return a.due_date && new Date(a.due_date) < new Date();
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
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={fetchSubjectData}>
            Try Again
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
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
    <Container className="mt-4">
      {/* Header */}
      <Row className="mb-4 subject-view-header">
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
          <LessonsStream lessons={lessons} classSubjectId={classSubjectId} />
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
                        const dueDate = assessment.due_date ? new Date(assessment.due_date) : null;
                        const daysLeft = dueDate ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                        return (
                          <ListGroup.Item key={index} className="border-0 px-0 py-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{assessment.assessment_name}</h6>
                                <div className="text-muted small mb-2">
                                  {assessment.due_date ? (
                                    <>
                                      <FaCalendarAlt className="me-1" />
                                      Due: {formatDate(assessment.due_date)}
                                      {daysLeft > 0 && (
                                        <Badge bg={daysLeft <= 3 ? 'danger' : 'warning'} className="ms-2">
                                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <FaCalendarAlt className="me-1" />
                                      <span className="text-muted">No due date set</span>
                                      {assessment.is_lesson_content && (
                                        <Badge bg="info" className="ms-2">From Lesson</Badge>
                                      )}
                                    </>
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
                              {assessment.is_lesson_content ? (
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to lesson view for lesson content assignments
                                    if (assessment.lesson_id) {
                                      navigate(`/student/lessons/${assessment.lesson_id}`);
                                    }
                                  }}
                                >
                                  View Assignment
                                </Button>
                              ) : (
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => navigate(`/student/assignments/${assessment.assessment_id}/submit`)}
                                >
                                  Submit
                                </Button>
                              )}
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
                        // For lesson content assignments, use content_id for grade lookup
                        const grade = assessment.is_lesson_content 
                          ? grades.find(g => g.assessment?.assessment_id === `content_${assessment.content_id}`)
                          : grades.find(g => g.assessment?.assessment_id === assessment.assessment_id || g.assessment_id === assessment.assessment_id);
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
                                  {assessment.is_lesson_content && (
                                    <Badge bg="info" className="ms-2">From Lesson</Badge>
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


