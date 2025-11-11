import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import './TeacherClassManagement.css';

function TeacherClassManagement() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [recentLessons, setRecentLessons] = useState([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);
  
  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);
  
  const fetchClassData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get class details
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          form:forms(*),
          form_tutor:users!classes_form_tutor_id_fkey(name, email)
        `)
        .eq('class_id', classId)
        .single();
      
      if (classError) throw classError;
      setClassInfo(classData);
      
      // Get students in this class
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_class_assignments')
        .select(`
          *,
          student:users(name, email, user_id)
        `)
        .eq('class_id', classId)
        .eq('is_active', true);
      
      if (studentsError) {
        console.warn('Error fetching students:', studentsError);
      } else {
        setStudents((studentsData || []).map(s => s.student).filter(Boolean));
      }
      
      // Get subjects this teacher teaches for this class
      const teacherId = user.user_id || user.userId;
      if (teacherId && !isNaN(parseInt(teacherId))) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('class_subjects')
          .select(`
            *,
            subject_offering:subject_form_offerings(
              *,
              subject:subjects(*)
            )
          `)
          .eq('class_id', classId)
          .eq('teacher_id', parseInt(teacherId));
        
        if (subjectsError) {
          console.warn('Error fetching subjects:', subjectsError);
        } else {
          setClassSubjects(subjectsData || []);
        }
      }
      
      // Get class subject IDs first (for all subjects in class, not just teacher's)
      const classSubjectIds = await getClassSubjectIds(classId);
      
      // Get recent lessons for this class (last 5)
      if (classSubjectIds.length > 0) {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select(`
            *,
            class_subject:class_subjects(
              subject_offering:subject_form_offerings(
                subject:subjects(*)
              )
            )
          `)
          .in('class_subject_id', classSubjectIds)
          .order('lesson_date', { ascending: false })
          .order('start_time', { ascending: false })
          .limit(5);
        
        setRecentLessons(lessonsData || []);
        
        // Get upcoming assessments
        const { data: assessmentsData } = await supabase
          .from('subject_assessments')
          .select('*')
          .in('class_subject_id', classSubjectIds)
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5);
        
        setUpcomingAssessments(assessmentsData || []);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching class data:', err);
      setError(err.message || 'Failed to load class data');
      setIsLoading(false);
    }
  };
  
  const getClassSubjectIds = async (classId) => {
    try {
      const { data } = await supabase
        .from('class_subjects')
        .select('class_subject_id')
        .eq('class_id', classId);
      return (data || []).map(cs => cs.class_subject_id);
    } catch {
      return [];
    }
  };
  
  // Filter students by search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
  });
  
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
  
  if (error || !classInfo) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error || 'Class not found'}
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
              <h2>{classInfo.form?.form_name} - {classInfo.class_name}</h2>
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
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      
      {/* Class Info Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Form</h6>
                  <h4 className="mb-0">{classInfo.form?.form_name}</h4>
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
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => navigate(`/teacher/class-subjects/${classSubjects[0]?.class_subject_id}/lessons`)}
                  >
                    View All
                  </Button>
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
                    {filteredStudents.map((student, index) => (
                      <tr key={student.user_id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{student.name || 'N/A'}</strong>
                        </td>
                        <td>{student.email || 'N/A'}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/admin/students?search=${student.email}`)}
                          >
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
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

