import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Button, Table, 
  Spinner, Alert, Badge, Modal 
} from 'react-bootstrap';
import { FaPlus, FaEye, FaCheck, FaClock, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import NotificationToast from '../common/NotificationToast';

function CourseRegistration() {
  const navigate = useNavigate();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courses, enrollments] = await Promise.all([
        studentService.getAvailableCourses(),
        studentService.getMyEnrollments()
      ]);
      
      // Filter out courses already enrolled in
      const enrolledCourseIds = enrollments.map(e => e.course.id);
      const available = courses.filter(course => !enrolledCourseIds.includes(course.id));
      
      setAvailableCourses(available);
      setMyEnrollments(enrollments);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async (courseId) => {
    setEnrolling(courseId);
    try {
      await studentService.enrollInCourse(courseId);
      await fetchData(); // Refresh data
      setError(null);
      setNotification({
        show: true,
        type: 'success',
        title: 'Enrollment Request Submitted',
        message: 'Your enrollment request has been submitted and is pending admin approval.'
      });
    } catch (err) {
      console.error("Error enrolling in course:", err);
      const errorMessage = err.response?.data?.error || "Failed to enroll in course. Please try again.";
      setError(errorMessage);
      setNotification({
        show: true,
        type: 'error',
        title: 'Enrollment Failed',
        message: errorMessage
      });
    } finally {
      setEnrolling(null);
    }
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning"><FaClock className="me-1" />Pending</Badge>;
      case 'ACTIVE':
        return <Badge bg="success"><FaCheck className="me-1" />Enrolled</Badge>;
      case 'DROPPED':
        return <Badge bg="danger"><FaTimes className="me-1" />Dropped</Badge>;
      case 'COMPLETED':
        return <Badge bg="info"><FaCheck className="me-1" />Completed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      
      {/* My Enrollments */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">My Course Enrollments</h5>
        </Card.Header>
        <Card.Body>
          {myEnrollments.length === 0 ? (
            <p className="text-muted text-center py-3">No course enrollments found.</p>
          ) : (
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {myEnrollments.map(enrollment => (
                  <tr key={enrollment.enrollmentId}>
                    <td className="fw-bold">{enrollment.course.code}</td>
                    <td>{enrollment.course.title}</td>
                    <td>{enrollment.course.department?.name || 'N/A'}</td>
                    <td>{getStatusBadge(enrollment.status)}</td>
                    <td>
                      <div>
                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                        <div>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 text-decoration-none"
                            onClick={() => navigate(`/courses/${enrollment.course.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Available Courses */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Available Courses</h5>
            <Button variant="outline-primary" onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {availableCourses.length === 0 ? (
            <p className="text-muted text-center py-3">No available courses for enrollment.</p>
          ) : (
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Department</th>
                  <th>Credit Hours</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableCourses.map(course => (
                  <tr key={course.id}>
                    <td className="fw-bold">{course.code}</td>
                    <td>{course.title}</td>
                    <td>{course.department?.name || 'N/A'}</td>
                    <td>{course.creditHours}</td>
                    <td>{course.semester} {course.academicYear}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => handleViewCourse(course)}
                        >
                          <FaEye className="me-1" /> View
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          disabled={enrolling === course.id}
                          onClick={() => handleEnrollment(course.id)}
                        >
                          {enrolling === course.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <>
                              <FaPlus className="me-1" /> Enroll
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Course Details Modal */}
      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Course Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div>
              <h5>{selectedCourse.code} - {selectedCourse.title}</h5>
              <p><strong>Department:</strong> {selectedCourse.department?.name || 'N/A'}</p>
              <p><strong>Credit Hours:</strong> {selectedCourse.creditHours}</p>
              <p><strong>Semester:</strong> {selectedCourse.semester} {selectedCourse.academicYear}</p>
              {selectedCourse.description && (
                <div>
                  <strong>Description:</strong>
                  <p>{selectedCourse.description}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
            Close
          </Button>
          {selectedCourse && (
            <Button 
              variant="primary"
              disabled={enrolling === selectedCourse.id}
              onClick={() => {
                handleEnrollment(selectedCourse.id);
                setShowCourseModal(false);
              }}
            >
              {enrolling === selectedCourse.id ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaPlus className="me-1" /> Enroll in Course
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Notification Toast */}
      <NotificationToast
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </Container>
  );
}

export default CourseRegistration;