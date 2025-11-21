import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Table, 
  Spinner, Alert, Badge, Nav 
} from 'react-bootstrap';
import { 
  FaBook, FaUsers, FaClipboardList, FaFileAlt,
  FaCalendarAlt, FaChartBar, FaDownload
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';

function CourseDetails() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.role]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // NOTE: This is a legacy component for the old "course" model
      // The new system uses Subjects instead. This component is kept for backward compatibility.
      // Try to fetch as subject first
      try {
        const subjectData = await supabaseService.getSubjectById(parseInt(courseId));
        if (subjectData) {
          // Convert subject to course-like format for display
          setCourse({
            id: subjectData.subject_id,
            code: subjectData.cxc_code || subjectData.subject_code || `SUBJ-${subjectData.subject_id}`,
            title: subjectData.subject_name,
            description: subjectData.description || 'No description available',
            creditHours: subjectData.credit_hours || 0,
            semester: 'N/A',
            academicYear: 'N/A',
            isActive: subjectData.is_active !== false,
            department: { name: subjectData.department_name || 'General' }
          });
          
          // Fetch lessons as course content
          try {
            // Get lessons for this subject (we'd need class-subject-id, but for now show empty)
            setCourseContent([]);
          } catch (contentErr) {
            console.warn("Could not fetch course content:", contentErr);
            setCourseContent([]);
          }
          
          setEnrollments([]); // Enrollments don't apply to new structure
          setError(null);
          return;
        }
      } catch (subjectErr) {
        console.warn("Not a subject ID, trying legacy course lookup:", subjectErr);
      }
      
      // If not found as subject, show error
      setError("Course not found. The course model has been replaced with Subjects in the new hierarchical structure. Please use the Subject view instead.");
      setCourse(null);
    } catch (err) {
      console.error("Error fetching course data:", err);
      setError("Failed to load course details. This feature may be deprecated. Please use the new Subject-based navigation.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'PENDING': 'warning',
      'ACTIVE': 'success', 
      'DROPPED': 'danger',
      'COMPLETED': 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getContentIcon = (type) => {
    switch(type) {
      case 'LECTURE': return <FaBook className="text-primary" />;
      case 'ASSIGNMENT': return <FaClipboardList className="text-warning" />;
      case 'RESOURCE': return <FaFileAlt className="text-info" />;
      default: return <FaFileAlt />;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>Legacy Feature</Alert.Heading>
          <p>{error || "Course not found"}</p>
          <p className="mb-0">
            <strong>Note:</strong> The course model has been replaced with a hierarchical structure (School → Form → Class → Subject → Lesson). 
            Please use the new Subject-based navigation from your dashboard.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="p-4 pt-5">
      <Alert variant="info" className="mb-4">
        <Alert.Heading>Legacy Component</Alert.Heading>
        <p className="mb-0">
          This is a legacy course view. The new system uses <strong>Subjects</strong> instead of Courses. 
          For the full hierarchical structure, please navigate via Forms → Classes → Subjects.
        </p>
      </Alert>
      {/* Course Header */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="mb-1">{course.code} - {course.title}</h2>
              <p className="text-muted mb-2">{course.description}</p>
              <div className="d-flex gap-3">
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <FaCalendarAlt className="me-1" />
                  {course.semester} {course.academicYear}
                </Badge>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <FaBook className="me-1" />
                  {course.creditHours} Credits
                </Badge>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <FaUsers className="me-1" />
                  {enrollments.filter(e => e.status === 'ACTIVE').length} Students
                </Badge>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <Badge bg={course.isActive ? 'success' : 'secondary'} className="fs-6 px-3 py-2">
                {course.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Course Navigation */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
          >
            Students ({enrollments.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'content'} 
            onClick={() => setActiveTab('content')}
          >
            Course Content
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Row className="g-4">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Course Information</h5>
              </Card.Header>
              <Card.Body>
                <Table borderless>
                  <tbody>
                    <tr>
                      <td><strong>Course Code:</strong></td>
                      <td>{course.code}</td>
                    </tr>
                    <tr>
                      <td><strong>Department:</strong></td>
                      <td>{course.department?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Credit Hours:</strong></td>
                      <td>{course.creditHours}</td>
                    </tr>
                    <tr>
                      <td><strong>Semester:</strong></td>
                      <td>{course.semester} {course.academicYear}</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>{course.isActive ? 'Active' : 'Inactive'}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Enrollment Statistics</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="text-center">
                      <h3 className="text-success">{enrollments.filter(e => e.status === 'ACTIVE').length}</h3>
                      <p className="text-muted mb-0">Active Students</p>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-center">
                      <h3 className="text-warning">{enrollments.filter(e => e.status === 'PENDING').length}</h3>
                      <p className="text-muted mb-0">Pending Requests</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'students' && (
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Enrolled Students</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Enrollment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No students enrolled in this course.
                    </td>
                  </tr>
                ) : (
                  enrollments.map(enrollment => (
                    <tr key={enrollment.enrollmentId}>
                      <td className="fw-medium">{enrollment.student.name}</td>
                      <td>{enrollment.student.email}</td>
                      <td>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                      <td>{getStatusBadge(enrollment.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'content' && (
        <Card className="shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Course Content</h5>
            {user?.role === 'INSTRUCTOR' && (
              <Button variant="primary" size="sm">
                Add Content
              </Button>
            )}
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Published</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courseContent.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No course content available.
                    </td>
                  </tr>
                ) : (
                  courseContent.map(content => (
                    <tr key={content.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {getContentIcon(content.type)}
                          <span className="ms-2">{content.type}</span>
                        </div>
                      </td>
                      <td className="fw-medium">{content.title}</td>
                      <td>{content.publishedAt ? new Date(content.publishedAt).toLocaleDateString() : '-'}</td>
                      <td>{content.dueDate ? new Date(content.dueDate).toLocaleDateString() : '-'}</td>
                      <td>
                        <Button variant="outline-primary" size="sm">
                          <FaDownload className="me-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Row className="g-4">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Enrollment Trends</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-4">
                  <FaChartBar size={48} className="text-muted mb-3" />
                  <p className="text-muted">Analytics dashboard coming soon</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Performance Metrics</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-4">
                  <FaChartBar size={48} className="text-muted mb-3" />
                  <p className="text-muted">Performance metrics coming soon</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default CourseDetails;