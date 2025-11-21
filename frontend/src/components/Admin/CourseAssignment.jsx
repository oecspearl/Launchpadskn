import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Table, 
  Modal, Spinner, Alert, Badge, ListGroup
} from 'react-bootstrap';
import { FaUserPlus, FaUserMinus, FaSearch } from 'react-icons/fa';
import { adminService } from '../../services/api';

function CourseAssignment() {
  // State for courses, instructors, and UI
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseInstructors, setCourseInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all courses and instructors when component mounts
  useEffect(() => {
    fetchCoursesAndInstructors();
  }, []);

  // Fetch courses and instructors
  const fetchCoursesAndInstructors = async () => {
    setLoading(true);
    try {
      // Fetch courses first
      const coursesResponse = await adminService.getAllCourses();
      console.log('Fetched courses:', coursesResponse);
      const coursesData = coursesResponse && coursesResponse.data ? coursesResponse.data : [];
      setCourses(coursesData);
      
      // Then fetch instructors
      const instructorsResponse = await adminService.getAllInstructors();
      console.log('Fetched instructors:', instructorsResponse);
      const instructorsData = instructorsResponse && instructorsResponse.data ? instructorsResponse.data : [];
      setInstructors(instructorsData);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load courses and instructors. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch instructors for a specific course
  const fetchCourseInstructors = async (courseId) => {
    setLoading(true);
    try {
      const response = await adminService.getCourseInstructors(courseId);
      console.log('Fetched course instructors:', response);
      
      // Extract instructor data from the response
      let instructorsList = [];
      if (response && response.data) {
        // Map the CourseInstructor objects to a more usable format
        instructorsList = response.data.map(courseInstructor => {
          const instructor = courseInstructor.instructor || {};
          const user = instructor.user || {};
          return {
            userId: instructor.instructorId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            department: instructor.department ? instructor.department.name : 'N/A',
            role: courseInstructor.role || 'PRIMARY'
          };
        });
      }
      
      setCourseInstructors(instructorsList);
      setError(null);
    } catch (err) {
      console.error("Error fetching course instructors:", err);
      setError("Failed to load course instructors. Please try again later.");
      setCourseInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle course selection
  const handleCourseSelect = async (course) => {
    console.log('Selected course:', course);
    setSelectedCourse(course);
    await fetchCourseInstructors(course.courseId || course.id);
  };

  // Open modal to assign instructor
  const handleOpenAssignModal = () => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }
    setSearchTerm('');
    setShowModal(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Assign instructor to course
  const handleAssignInstructor = async (instructorId) => {
    if (!selectedCourse) return;
    
    setAssignmentLoading(true);
    try {
      const courseId = selectedCourse.courseId || selectedCourse.id;
      console.log(`Assigning instructor ${instructorId} to course ${courseId}`);
      
      // Log the data being sent to the API for debugging
      console.log('Assignment data:', { instructorId, courseId, role: 'PRIMARY' });
      
      // Make the API call to assign the instructor to the course
      const response = await adminService.assignInstructorToCourse(instructorId, courseId, 'PRIMARY');
      console.log('Assignment response:', response);
      
      // Refresh the list of instructors for this course
      await fetchCourseInstructors(courseId);
      
      setSuccessMessage('Instructor assigned successfully!');
      handleCloseModal();
    } catch (err) {
      console.error("Error assigning instructor:", err);
      
      // Provide more detailed error information
      if (err.response) {
        console.error('Error response:', err.response);
        console.error('Error data:', err.response.data);
        setError(`Failed to assign instructor: ${err.response.data?.error || err.response.statusText || 'Unknown error'}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError("No response received from server. Please check your connection.");
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message || "Failed to assign instructor to course. Please try again."}`);
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Remove instructor from course
  const handleRemoveInstructor = async (instructorId) => {
    if (!selectedCourse) return;
    
    if (window.confirm("Are you sure you want to remove this instructor from the course?")) {
      setAssignmentLoading(true);
      try {
        const courseId = selectedCourse.courseId || selectedCourse.id;
        console.log(`Removing instructor ${instructorId} from course ${courseId}`);
        
        // Call the API to remove the instructor
        await adminService.removeInstructorFromCourse(instructorId, courseId);
        
        // Refresh the list of instructors for this course
        await fetchCourseInstructors(courseId);
        
        setSuccessMessage('Instructor removed successfully!');
      } catch (err) {
        console.error("Error removing instructor:", err);
        if (err.response && err.response.data) {
          setError(`Failed to remove instructor: ${err.response.data.error || 'Unknown error'}`);
        } else {
          setError("Failed to remove instructor from course. Please try again.");
        }
      } finally {
        setAssignmentLoading(false);
      }
    }
  };

  // Filter instructors based on search term
  const filteredInstructors = instructors.filter(instructor => {
    // Extract instructor details for filtering
    const firstName = instructor.user?.firstName || '';
    const lastName = instructor.user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const email = (instructor.user?.email || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    
    // Log instructor data for debugging
    if (searchTerm && (fullName.includes(searchTermLower) || email.includes(searchTermLower))) {
      console.log('Filtered instructor:', instructor);
    }
    
    return fullName.includes(searchTermLower) || email.includes(searchTermLower);
  });

  // Render loading spinner
  if (loading && courses.length === 0) {
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
              <h5 className="mb-0">Courses</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {courses.length === 0 ? (
                  <ListGroup.Item className="text-center py-4">
                    No courses available.
                  </ListGroup.Item>
                ) : (
                  courses.map(course => (
                    <ListGroup.Item 
                      key={course.courseId || course.id}
                      action
                      active={selectedCourse && (selectedCourse.courseId === course.courseId || selectedCourse.id === course.id)}
                      onClick={() => handleCourseSelect(course)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-bold">{course.courseName || course.title}</div>
                        <small className="text-muted">{course.courseCode || course.code}</small>
                      </div>
                      {course.isActive ? (
                        <Badge bg="success" pill>Active</Badge>
                      ) : (
                        <Badge bg="secondary" pill>Inactive</Badge>
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
                  {selectedCourse ? (
                    <>Course Instructors: <span className="text-primary">{selectedCourse.courseName || selectedCourse.title}</span></>
                  ) : (
                    'Select a course to view instructors'
                  )}
                </h5>
                {selectedCourse && (
                  <Button variant="primary" size="sm" onClick={handleOpenAssignModal}>
                    <FaUserPlus className="me-2" /> Assign Instructor
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              
              {!selectedCourse ? (
                <div className="text-center py-5 text-muted">
                  <p>Please select a course from the list to view and manage its instructors.</p>
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
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseInstructors.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          No instructors assigned to this course yet.
                        </td>
                      </tr>
                    ) : (
                      courseInstructors.map(instructor => (
                        <tr key={instructor.userId}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="instructor-avatar me-2">
                                {instructor.firstName.charAt(0)}{instructor.lastName.charAt(0)}
                              </div>
                              <div>
                                {instructor.firstName} {instructor.lastName}
                              </div>
                            </div>
                          </td>
                          <td>{instructor.email}</td>
                          <td>{instructor.department || 'N/A'}</td>
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
          <Modal.Title>Assign Instructor to {selectedCourse?.courseName || selectedCourse?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Search Instructors</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by name..."
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
                No instructors found.
              </ListGroup.Item>
            ) : (
              filteredInstructors.map(instructor => {
                // Extract instructor details for display
                const firstName = instructor.user?.firstName || '';
                const lastName = instructor.user?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
                const department = instructor.department?.name || 'No Department';
                const specialization = instructor.specialization || 'No Specialization';
                
                // Log the instructor object for debugging
                console.log('Rendering instructor:', {
                  id: instructor.id,
                  instructorId: instructor.instructorId,
                  firstName, lastName, fullName,
                  department, specialization
                });
                
                return (
                  <ListGroup.Item 
                    key={instructor.id} 
                    className="d-flex justify-content-between align-items-center p-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="instructor-avatar me-3 bg-primary text-white">
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-bold fs-5">{fullName}</div>
                        <div className="text-muted mb-1">{department}</div>
                        <Badge bg="info" className="me-2">Specialization: {specialization}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => {
                        // Use instructorId if available, otherwise fall back to id
                        const idToUse = instructor.instructorId || instructor.id;
                        console.log('Assigning instructor with ID:', idToUse);
                        handleAssignInstructor(idToUse);
                      }}
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