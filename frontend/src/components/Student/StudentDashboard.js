import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Badge, Tab, Tabs, ListGroup
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBook, FaClipboardList, FaCalendarAlt, FaClock,
  FaTrophy, FaBell, FaUserGraduate, FaCheckCircle, FaMapMarkerAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import Timetable from '../common/Timetable';
import './StudentDashboard.css';

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data
  const [myClass, setMyClass] = useState(null);
  const [mySubjects, setMySubjects] = useState([]);
  const [todayLessons, setTodayLessons] = useState([]);
  const [weekLessons, setWeekLessons] = useState([]);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  
  // Fetch student data function
  const fetchStudentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Guard: Only fetch if user is actually a student
      if (!user || (user.role && user.role.toUpperCase() !== 'STUDENT')) {
        console.warn('[StudentDashboard] User is not a student, skipping data fetch. Role:', user?.role);
        setIsLoading(false);
        return;
      }
      
      const studentId = user.userId || user.id;
      
      // Get student's class assignment
      const { data: classAssignment, error: classError } = await supabase
        .from('student_class_assignments')
        .select(`
          *,
          class:classes(
            *,
            form:forms(*),
            form_tutor:users!classes_form_tutor_id_fkey(name, email)
          )
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (classError) {
        console.warn('Error fetching class assignment:', classError);
        // Continue even if class not found (student might not be assigned yet)
      }
      
      if (classAssignment && classAssignment.class) {
        setMyClass(classAssignment.class);
        
        // Get subjects for this class
        const subjects = await supabaseService.getSubjectsByClass(classAssignment.class.class_id);
        setMySubjects(subjects || []);
        
        // Get lessons for this week
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const lessons = await supabaseService.getLessonsByStudent(
          studentId,
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );
        
        setWeekLessons(lessons || []);
        
        // Get today's lessons
        const todayStr = today.toISOString().split('T')[0];
        const todayLessonsFiltered = (lessons || []).filter(lesson => {
          const lessonDate = new Date(lesson.lesson_date).toISOString().split('T')[0];
          return lessonDate === todayStr;
        });
        setTodayLessons(todayLessonsFiltered);
        
        // Get upcoming lessons (next 7 days)
        const upcomingLessonsFiltered = (lessons || []).filter(lesson => {
          const lessonDate = new Date(lesson.lesson_date);
          return lessonDate >= today && lessonDate <= weekEnd;
        }).sort((a, b) => {
          const dateA = new Date(a.lesson_date + 'T' + a.start_time);
          const dateB = new Date(b.lesson_date + 'T' + b.start_time);
          return dateA - dateB;
        });
        setUpcomingLessons(upcomingLessonsFiltered.slice(0, 5));
        
        // Get assessments/assignments
        const classSubjectIds = subjects.map(s => s.class_subject_id);
        const allAssessments = [];
        for (const classSubjectId of classSubjectIds) {
          try {
            const assessments = await supabaseService.getAssessmentsByClassSubject(classSubjectId);
            allAssessments.push(...(assessments || []));
          } catch (err) {
            console.warn('Error fetching assessments:', err);
          }
        }
        
        // Filter upcoming assignments
        const upcomingAssessments = allAssessments
          .filter(a => a.due_date && new Date(a.due_date) >= new Date())
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5);
        setAssignments(upcomingAssessments);
        
        // Get grades
        try {
          const studentGrades = await supabaseService.getStudentGrades(studentId);
          setGrades(studentGrades || []);
        } catch (gradeErr) {
          console.warn('Error fetching grades:', gradeErr);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching student data:', err);
      // Show dashboard even with errors - just show empty state
      setIsLoading(false);
      setError(null);
    }
  }, [user]);
  
  // Fetch student data on mount/user change
  useEffect(() => {
    console.log('[StudentDashboard] useEffect triggered, user:', user);
    
    // Always set a maximum timeout to prevent infinite loading
    const maxTimeout = setTimeout(() => {
      console.warn('[StudentDashboard] Max timeout reached, stopping loading');
      setIsLoading(false);
    }, 5000);
    
    if (user && (user.userId || user.id)) {
      fetchStudentData().then(() => {
        clearTimeout(maxTimeout);
      }).catch(() => {
        clearTimeout(maxTimeout);
      });
    } else {
      // If no user, stop loading after shorter timeout
      setTimeout(() => {
        console.warn('[StudentDashboard] No user after timeout, stopping loading');
        setIsLoading(false);
        clearTimeout(maxTimeout);
      }, 2000);
    }
    
    return () => clearTimeout(maxTimeout);
  }, [user, fetchStudentData]);
  
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
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>Welcome back, {user?.name || 'Student'}!</h2>
          {myClass && (
            <p className="text-muted">
              {myClass.form?.form_name || 'Form'} - {myClass.class_name || 'Class'}
              {myClass.form_tutor && ` • Form Tutor: ${myClass.form_tutor.name}`}
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
            {/* Today's Timetable */}
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
                        return (
                          <ListGroup.Item key={index} className="border-0 px-0 py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{subjectName}</h6>
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
                              <Badge bg="primary">{lesson.class_subject?.class?.class_name}</Badge>
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
                  <Card className="border-0 shadow-sm bg-primary text-white">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0">{mySubjects.length}</h3>
                          <small>My Subjects</small>
                        </div>
                        <FaBook size={40} opacity={0.5} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col xs={12}>
                  <Card className="border-0 shadow-sm bg-success text-white">
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
                  <Card className="border-0 shadow-sm bg-warning text-white">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0">{assignments.length}</h3>
                          <small>Upcoming Assignments</small>
                        </div>
                        <FaClipboardList size={40} opacity={0.5} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
          
          {/* My Subjects */}
          <Row className="mt-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaBook className="me-2" />
                    My Subjects
                  </h5>
                  <Button variant="outline-primary" size="sm" onClick={() => setActiveTab('subjects')}>
                    View All
                  </Button>
                </Card.Header>
                <Card.Body>
                  {mySubjects.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">No subjects assigned</p>
                  ) : (
                    <Row className="g-3">
                      {mySubjects.slice(0, 6).map((classSubject, index) => {
                        const subjectName = getSubjectName(classSubject);
                        const teacherName = classSubject.teacher?.name || 'TBD';
                        return (
                          <Col md={4} key={index}>
                            <Card className="h-100 border">
                              <Card.Body>
                                <h6 className="mb-2">{subjectName}</h6>
                                <small className="text-muted">
                                  Teacher: {teacherName}
                                </small>
                                <div className="mt-2">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="w-100"
                                    onClick={() => navigate(`/student/subjects/${classSubject.class_subject_id}`)}
                                  >
                                    View Subject
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
          
          {/* Upcoming Assignments */}
          {assignments.length > 0 && (
            <Row className="mt-4">
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
                      {assignments.map((assignment, index) => {
                        const dueDate = new Date(assignment.due_date);
                        const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <ListGroup.Item key={index} className="border-0 px-0 py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{assignment.assessment_name}</h6>
                                <small className="text-muted">
                                  Due: {dueDate.toLocaleDateString()}
                                  {daysLeft > 0 && (
                                    <Badge bg={daysLeft <= 3 ? 'danger' : 'warning'} className="ms-2">
                                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                    </Badge>
                                  )}
                                </small>
                              </div>
                              <Badge bg="secondary">{assignment.assessment_type}</Badge>
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
        
        <Tab eventKey="subjects" title="Subjects">
          <Row className="g-4">
            {mySubjects.map((classSubject, index) => {
              const subjectName = getSubjectName(classSubject);
              const teacherName = classSubject.teacher?.name || 'TBD';
              return (
                <Col md={6} lg={4} key={index}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <h5 className="mb-3">{subjectName}</h5>
                      <p className="text-muted small mb-2">
                        <strong>Teacher:</strong> {teacherName}
                      </p>
                      <p className="text-muted small mb-2">
                        <strong>Class:</strong> {classSubject.class?.class_name || myClass?.class_name}
                      </p>
                      <Button 
                        variant="primary" 
                        className="w-100 mt-3"
                        onClick={() => navigate(`/student/subjects/${classSubject.class_subject_id}`)}
                      >
                        View Subject Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
            {mySubjects.length === 0 && (
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <p className="text-muted mb-0">No subjects assigned to your class</p>
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

export default StudentDashboard;
