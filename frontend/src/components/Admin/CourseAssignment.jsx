import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Table,
  Modal, Spinner, Alert, Badge, ListGroup
} from 'react-bootstrap';
import { FaUserPlus, FaUserMinus, FaSearch } from 'react-icons/fa';
import { classService } from '../../services/classService';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function CourseAssignment() {
  const { user } = useAuth();

  // State for classes, instructors, and UI
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classInstructors, setClassInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all classes and instructors when component mounts
  useEffect(() => {
    fetchClassesAndInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClassesAndInstructors = async () => {
    setLoading(true);
    try {
      const [classesData, instructorsData] = await Promise.all([
        classService.getClasses(user?.role, user?.id),
        userService.getUsersByRole('instructor')
      ]);
      setClasses(classesData || []);
      setInstructors(instructorsData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes and instructors:', err);
      setError('Failed to load classes and instructors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch instructors assigned to a specific class
  const fetchClassInstructors = async (classId) => {
    setLoading(true);
    try {
      const rows = await classService.getClassInstructors(classId);
      const instructorsList = (rows || []).map(ci => ({
        userId: ci.instructor?.id,
        firstName: ci.instructor?.first_name || '',
        lastName: ci.instructor?.last_name || '',
        email: ci.instructor?.email || '',
        role: ci.role || 'instructor'
      }));
      setClassInstructors(instructorsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching class instructors:', err);
      setError('Failed to load class instructors. Please try again later.');
      setClassInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setSuccessMessage('');
    await fetchClassInstructors(cls.id);
  };

  const handleOpenAssignModal = () => {
    if (!selectedClass) {
      setError('Please select a class first');
      return;
    }
    setSearchTerm('');
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleAssignInstructor = async (instructorId) => {
    if (!selectedClass) return;

    setAssignmentLoading(true);
    try {
      await classService.addClassInstructor(selectedClass.id, instructorId);
      await fetchClassInstructors(selectedClass.id);
      setSuccessMessage('Instructor assigned successfully!');
      handleCloseModal();
    } catch (err) {
      console.error('Error assigning instructor:', err);
      setError(`Failed to assign instructor: ${err.message || 'Unknown error'}`);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleRemoveInstructor = async (instructorId) => {
    if (!selectedClass) return;

    if (window.confirm('Are you sure you want to remove this instructor from the class?')) {
      setAssignmentLoading(true);
      try {
        await classService.removeClassInstructor(selectedClass.id, instructorId);
        await fetchClassInstructors(selectedClass.id);
        setSuccessMessage('Instructor removed successfully!');
      } catch (err) {
        console.error('Error removing instructor:', err);
        setError(`Failed to remove instructor: ${err.message || 'Unknown error'}`);
      } finally {
        setAssignmentLoading(false);
      }
    }
  };

  // Instructors available to assign: match search and exclude those already assigned
  const assignedIds = new Set(classInstructors.map(i => i.userId));
  const filteredInstructors = instructors.filter(instructor => {
    if (assignedIds.has(instructor.id)) return false;
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.toLowerCase();
    const email = (instructor.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  if (loading && classes.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="p-4 pt-5">
      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Classes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {classes.length === 0 ? (
                  <ListGroup.Item className="text-center py-4">
                    No classes available.
                  </ListGroup.Item>
                ) : (
                  classes.map(cls => (
                    <ListGroup.Item
                      key={cls.id}
                      action
                      active={selectedClass?.id === cls.id}
                      onClick={() => handleClassSelect(cls)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-bold">{cls.name}</div>
                        <small className="text-muted">{cls.form?.name || ''}</small>
                      </div>
                      {cls.published ? (
                        <Badge bg="success" pill>Published</Badge>
                      ) : (
                        <Badge bg="secondary" pill>Draft</Badge>
                      )}
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {selectedClass ? (
                    <>Class Instructors: <span className="text-primary">{selectedClass.name}</span></>
                  ) : (
                    'Select a class to view instructors'
                  )}
                </h5>
                {selectedClass && (
                  <Button variant="primary" size="sm" onClick={handleOpenAssignModal}>
                    <FaUserPlus className="me-2" /> Assign Instructor
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
              {successMessage && <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

              {!selectedClass ? (
                <div className="text-center py-5 text-muted">
                  <p>Please select a class from the list to view and manage its instructors.</p>
                </div>
              ) : assignmentLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Processing...</p>
                </div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classInstructors.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          No instructors assigned to this class yet.
                        </td>
                      </tr>
                    ) : (
                      classInstructors.map(instructor => (
                        <tr key={instructor.userId}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="instructor-avatar me-2">
                                {(instructor.firstName.charAt(0) || '')}{(instructor.lastName.charAt(0) || '')}
                              </div>
                              <div>
                                {instructor.firstName} {instructor.lastName}
                              </div>
                            </div>
                          </td>
                          <td>{instructor.email}</td>
                          <td><Badge bg="info">{instructor.role}</Badge></td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveInstructor(instructor.userId)}
                            >
                              <FaUserMinus className="me-1" /> Remove
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for Assigning Instructors */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Instructor to {selectedClass?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Search Instructors</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                <FaSearch className="text-muted" />
              </div>
            </div>
          </Form.Group>

          <ListGroup className="mt-4">
            {filteredInstructors.length === 0 ? (
              <ListGroup.Item className="text-center py-3">
                No available instructors found.
              </ListGroup.Item>
            ) : (
              filteredInstructors.map(instructor => {
                const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 'Unknown';
                return (
                  <ListGroup.Item
                    key={instructor.id}
                    className="d-flex justify-content-between align-items-center p-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="instructor-avatar me-3 bg-primary text-white">
                        {(instructor.first_name?.charAt(0) || '')}{(instructor.last_name?.charAt(0) || '')}
                      </div>
                      <div>
                        <div className="fw-bold fs-5">{fullName}</div>
                        <div className="text-muted mb-1">{instructor.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAssignInstructor(instructor.id)}
                      disabled={assignmentLoading}
                    >
                      Assign
                    </Button>
                  </ListGroup.Item>
                );
              })
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .instructor-avatar {
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
    </Container>
  );
}

export default CourseAssignment;
