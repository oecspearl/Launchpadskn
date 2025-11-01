import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Button, Table, 
  Spinner, Alert, Dropdown
} from 'react-bootstrap';
import { FaCheck, FaTimes, FaEllipsisV, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import NotificationToast from '../common/NotificationToast';

function EnrollmentApproval() {
  const navigate = useNavigate();
  
  // State for enrollments and UI
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  // Fetch pending enrollments when component mounts
  useEffect(() => {
    fetchPendingEnrollments();
  }, []);

  // Function to fetch pending enrollments
  const fetchPendingEnrollments = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingEnrollments();
      setPendingEnrollments(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching pending enrollments:", err);
      setError("Failed to load enrollment requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle enrollment approval
  const handleApproveEnrollment = async (enrollmentId) => {
    setProcessingId(enrollmentId);
    try {
      await adminService.approveEnrollment(enrollmentId);
      // Remove the approved enrollment from the list
      setPendingEnrollments(pendingEnrollments.filter(e => e.enrollmentId !== enrollmentId));
      setError(null);
      setNotification({
        show: true,
        type: 'success',
        title: 'Enrollment Approved',
        message: 'Student enrollment has been approved successfully.'
      });
    } catch (err) {
      console.error("Error approving enrollment:", err);
      const errorMessage = "Failed to approve enrollment. Please try again.";
      setError(errorMessage);
      setNotification({
        show: true,
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle enrollment rejection
  const handleRejectEnrollment = async (enrollmentId) => {
    if (window.confirm("Are you sure you want to reject this enrollment request?")) {
      setProcessingId(enrollmentId);
      try {
        await adminService.rejectEnrollment(enrollmentId);
        // Remove the rejected enrollment from the list
        setPendingEnrollments(pendingEnrollments.filter(e => e.enrollmentId !== enrollmentId));
        setError(null);
        setNotification({
          show: true,
          type: 'warning',
          title: 'Enrollment Rejected',
          message: 'Student enrollment request has been rejected.'
        });
      } catch (err) {
        console.error("Error rejecting enrollment:", err);
        const errorMessage = "Failed to reject enrollment. Please try again.";
        setError(errorMessage);
        setNotification({
          show: true,
          type: 'error',
          title: 'Rejection Failed',
          message: errorMessage
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  // View student details
  const handleViewStudent = (studentId) => {
    navigate(`/admin/students/${studentId}`);
  };

  // View course details
  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render loading spinner
  if (loading && pendingEnrollments.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Enrollment Requests</h4>
            <Button variant="outline-primary" onClick={fetchPendingEnrollments}>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Table responsive hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Requested On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No pending enrollment requests found.
                  </td>
                </tr>
              ) : (
                pendingEnrollments.map(enrollment => (
                  <tr key={enrollment.enrollmentId}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="student-avatar me-2">
                          {enrollment.student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold">{enrollment.student.name}</div>
                          <small className="text-muted">{enrollment.student.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold">{enrollment.course.code}</div>
                      <div>{enrollment.course.title}</div>
                    </td>
                    <td>
                      {formatDate(enrollment.enrollmentDate)}
                    </td>
                    <td>
                      {processingId === enrollment.enrollmentId ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <div className="d-flex">
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleApproveEnrollment(enrollment.enrollmentId)}
                          >
                            <FaCheck className="me-1" /> Approve
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRejectEnrollment(enrollment.enrollmentId)}
                          >
                            <FaTimes className="me-1" /> Reject
                          </Button>
                          <Dropdown align="end" className="ms-2">
                            <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${enrollment.enrollmentId}`} className="btn-icon">
                              <FaEllipsisV />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleViewStudent(enrollment.student.userId)}>
                                <FaEye className="me-2" /> View Student
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleViewCourse(enrollment.course.id)}>
                                <FaEye className="me-2" /> View Course
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <style jsx>{`
        .student-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
      `}</style>

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

export default EnrollmentApproval;
