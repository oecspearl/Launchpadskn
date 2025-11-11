import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import { 
  FaUserPlus, FaUsers, FaSearch
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function StudentAssignment() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    student_id: '',
    class_id: '',
    academic_year: ''
  });
  
  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedForm]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get students
      const { data: studentsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'STUDENT')
        .eq('is_active', true)
        .order('name');
      setStudents(studentsData || []);
      
      // Get forms
      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('is_active', true)
        .order('form_number');
      
      // Get classes with filter
      let classQuery = supabase
        .from('classes')
        .select(`
          *,
          form:forms(*)
        `)
        .eq('is_active', true);
      
      if (selectedForm !== 'all') {
        classQuery = classQuery.eq('form_id', selectedForm);
      }
      
      const { data: classesData } = await classQuery.order('form_id').order('class_name');
      
      if (selectedClass !== 'all') {
        const filtered = classesData.filter(c => c.class_id.toString() === selectedClass);
        setClasses(filtered);
      } else {
        setClasses(classesData || []);
      }
      
      // Get class assignments
      let assignmentQuery = supabase
        .from('student_class_assignments')
        .select(`
          *,
          student:users(*),
          class:classes(
            *,
            form:forms(*)
          )
        `)
        .eq('is_active', true);
      
      if (selectedClass !== 'all') {
        assignmentQuery = assignmentQuery.eq('class_id', selectedClass);
      }
      
      const { data: assignmentsData } = await assignmentQuery.order('academic_year', { ascending: false });
      setClassAssignments(assignmentsData || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = () => {
    const currentYear = new Date().getFullYear();
    setAssignmentData({
      student_id: '',
      class_id: selectedClass !== 'all' ? selectedClass : (classes[0]?.class_id || ''),
      academic_year: `${currentYear}-${currentYear + 1}`
    });
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setAssignmentData({});
    setSuccess(null);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      await supabaseService.assignStudentToClass(
        assignmentData.student_id,
        assignmentData.class_id,
        assignmentData.academic_year
      );
      
      setSuccess('Student assigned to class successfully');
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error assigning student:', err);
      setError(err.message || 'Failed to assign student');
    }
  };
  
  const handleRemove = async (assignmentId, studentId, classId) => {
    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      try {
        await supabaseService.removeStudentFromClass(studentId, classId);
        setSuccess('Student removed from class successfully');
        fetchData();
      } catch (err) {
        console.error('Error removing student:', err);
        setError(err.message || 'Failed to remove student');
      }
    }
  };
  
  // Filter students by search term
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });
  
  // Filter assignments by search
  const filteredAssignments = classAssignments.filter(assignment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.student?.name?.toLowerCase().includes(searchLower) ||
      assignment.student?.email?.toLowerCase().includes(searchLower)
    );
  });
  
  // Get forms for filter
  const forms = Array.from(new Map(
    classes.map(c => [c.form?.form_id, c.form]).filter(f => f[0])
  ).values());
  
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
  
  return (
    <Container className="mt-4">
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Student Class Assignment</h2>
            <Button variant="primary" onClick={handleOpenModal}>
              <FaUserPlus className="me-2" />
              Assign Student to Class
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {/* Filters */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Label>Filter by Form</Form.Label>
          <Form.Select
            value={selectedForm}
            onChange={(e) => {
              setSelectedForm(e.target.value);
              setSelectedClass('all');
            }}
          >
            <option value="all">All Forms</option>
            {forms.map(form => (
              <option key={form.form_id} value={form.form_id}>
                {form.form_name} ({form.academic_year})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label>Filter by Class</Form.Label>
          <Form.Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map(classItem => (
              <option key={classItem.class_id} value={classItem.class_id}>
                {classItem.form?.form_name} - {classItem.class_name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label>Search Students</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>
      
      {/* Class Assignments Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaUsers className="me-2" />
            Class Assignments
          </h5>
        </Card.Header>
        <Card.Body>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No class assignments found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Form</th>
                  <th>Academic Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    <td>{assignment.student?.name || 'N/A'}</td>
                    <td>{assignment.student?.email || 'N/A'}</td>
                    <td>
                      <Badge bg="primary">{assignment.class?.class_name || 'N/A'}</Badge>
                    </td>
                    <td>{assignment.class?.form?.form_name || 'N/A'}</td>
                    <td>{assignment.academic_year}</td>
                    <td>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleRemove(
                          assignment.assignment_id,
                          assignment.student_id,
                          assignment.class_id
                        )}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Available Students */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">All Students</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.slice(0, 20).map((student) => {
                const assignment = classAssignments.find(a => a.student_id === student.user_id);
                return (
                  <tr key={student.user_id}>
                    <td>{student.name || 'N/A'}</td>
                    <td>{student.email}</td>
                    <td>
                      {assignment ? (
                        <Badge bg="success">
                          {assignment.class?.form?.form_name} - {assignment.class?.class_name}
                        </Badge>
                      ) : (
                        <Badge bg="secondary">Not assigned</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg={student.is_active ? 'success' : 'secondary'}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {filteredStudents.length > 20 && (
            <p className="text-muted text-center mt-3">
              Showing 20 of {filteredStudents.length} students
            </p>
          )}
        </Card.Body>
      </Card>
      
      {/* Assignment Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Student to Class</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Student *</Form.Label>
              <Form.Select
                value={assignmentData.student_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, student_id: e.target.value })}
                required
              >
                <option value="">Select Student</option>
                {students.map(student => {
                  const hasAssignment = classAssignments.some(a => 
                    a.student_id === student.user_id && 
                    a.academic_year === assignmentData.academic_year
                  );
                  return (
                    <option 
                      key={student.user_id} 
                      value={student.user_id}
                      disabled={hasAssignment}
                    >
                      {student.name} ({student.email})
                      {hasAssignment && ' - Already assigned'}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Class *</Form.Label>
              <Form.Select
                value={assignmentData.class_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value })}
                required
              >
                <option value="">Select Class</option>
                {classes.map(classItem => (
                  <option key={classItem.class_id} value={classItem.class_id}>
                    {classItem.form?.form_name} - {classItem.class_name} ({classItem.academic_year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Academic Year *</Form.Label>
              <Form.Control
                type="text"
                value={assignmentData.academic_year}
                onChange={(e) => setAssignmentData({ ...assignmentData, academic_year: e.target.value })}
                placeholder="e.g., 2024-2025"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Student
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default StudentAssignment;


