import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import { 
  FaPlus, FaTrash, FaBook, FaUsers
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function ClassSubjectAssignment() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data
  const [classes, setClasses] = useState([]);
  const [formOfferings, setFormOfferings] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    class_id: '',
    subject_offering_id: '',
    teacher_id: ''
  });
  
  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedForm]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get teachers
      const { data: teachersData } = await supabase
        .from('users')
        .select('*')
        .in('role', ['ADMIN', 'INSTRUCTOR'])
        .eq('is_active', true)
        .order('name');
      setTeachers(teachersData || []);
      
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
      
      // Get form offerings
      const { data: offeringsData } = await supabase
        .from('subject_form_offerings')
        .select(`
          *,
          subject:subjects(*),
          form:forms(*)
        `)
        .order('form_id');
      
      if (selectedForm !== 'all') {
        setFormOfferings(offeringsData.filter(o => o.form_id === parseInt(selectedForm)));
      } else {
        setFormOfferings(offeringsData || []);
      }
      
      // Get class-subject assignments
      let assignmentQuery = supabase
        .from('class_subjects')
        .select(`
          *,
          class:classes(
            *,
            form:forms(*)
          ),
          subject_offering:subject_form_offerings(
            *,
            subject:subjects(*)
          ),
          teacher:users!class_subjects_teacher_id_fkey(name, email)
        `);
      
      if (selectedClass !== 'all') {
        assignmentQuery = assignmentQuery.eq('class_id', selectedClass);
      }
      
      const { data: assignmentsData } = await assignmentQuery.order('class_id');
      setClassSubjects(assignmentsData || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = () => {
    setAssignmentData({
      class_id: selectedClass !== 'all' ? selectedClass : (classes[0]?.class_id || ''),
      subject_offering_id: '',
      teacher_id: ''
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
      
      // Validate required fields
      if (!assignmentData.class_id || !assignmentData.subject_offering_id) {
        setError('Please select both Class and Subject Offering');
        return;
      }
      
      // Convert string IDs to integers
      const classId = parseInt(assignmentData.class_id);
      const subjectOfferingId = parseInt(assignmentData.subject_offering_id);
      const teacherId = assignmentData.teacher_id ? parseInt(assignmentData.teacher_id) : null;
      
      if (isNaN(classId) || isNaN(subjectOfferingId)) {
        setError('Invalid class or subject offering selected');
        return;
      }
      
      await supabaseService.assignSubjectToClass(
        classId,
        subjectOfferingId,
        teacherId
      );
      
      setSuccess('Subject assigned to class successfully');
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error assigning subject:', err);
      // Provide more detailed error messages
      let errorMessage = 'Failed to assign subject';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.details) {
        errorMessage = err.details;
      } else if (err.code === '23505') {
        errorMessage = 'This subject is already assigned to this class';
      } else if (err.code === '23503') {
        errorMessage = 'Invalid class, subject offering, or teacher selected';
      }
      setError(errorMessage);
    }
  };
  
  const handleRemove = async (classSubjectId) => {
    if (window.confirm('Are you sure you want to remove this subject from the class? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('class_subjects')
          .delete()
          .eq('class_subject_id', classSubjectId);
        
        if (error) throw error;
        setSuccess('Subject removed from class successfully');
        fetchData();
      } catch (err) {
        console.error('Error removing subject:', err);
        setError(err.message || 'Failed to remove subject');
      }
    }
  };
  
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
            <h2>Class-Subject Assignment</h2>
            <Button variant="primary" onClick={handleOpenModal}>
              <FaPlus className="me-2" />
              Assign Subject to Class
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {/* Filters */}
      <Row className="mb-3">
        <Col md={6}>
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
        <Col md={6}>
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
      </Row>
      
      {/* Class-Subject Assignments */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaBook className="me-2" />
            Current Assignments
          </h5>
        </Card.Header>
        <Card.Body>
          {classSubjects.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No subject assignments found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Form</th>
                  <th>Subject</th>
                  <th>Subject Code</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classSubjects.map((classSubject) => (
                  <tr key={classSubject.class_subject_id}>
                    <td>
                      <Badge bg="primary">{classSubject.class?.class_name || 'N/A'}</Badge>
                    </td>
                    <td>{classSubject.class?.form?.form_name || 'N/A'}</td>
                    <td><strong>{classSubject.subject_offering?.subject?.subject_name || 'N/A'}</strong></td>
                    <td>{classSubject.subject_offering?.subject?.subject_code || 'N/A'}</td>
                    <td>{classSubject.teacher?.name || 'Not assigned'}</td>
                    <td>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleRemove(classSubject.class_subject_id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Assignment Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Subject to Class</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
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
              <Form.Label>Subject Offering *</Form.Label>
              <Form.Select
                value={assignmentData.subject_offering_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, subject_offering_id: e.target.value })}
                required
              >
                <option value="">Select Subject Offering</option>
                {formOfferings.map(offering => {
                  // Only show offerings that match the selected class's form
                  if (assignmentData.class_id) {
                    const selectedClass = classes.find(c => c.class_id.toString() === assignmentData.class_id);
                    if (selectedClass && offering.form_id !== selectedClass.form_id) {
                      return null;
                    }
                  }
                  return (
                    <option key={offering.offering_id} value={offering.offering_id}>
                      {offering.subject?.subject_name} ({offering.subject?.subject_code}) - {offering.form?.form_name}
                    </option>
                  );
                })}
              </Form.Select>
              <Form.Text className="text-muted">
                Only subjects offered for the selected class's form are shown
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Teacher</Form.Label>
              <Form.Select
                value={assignmentData.teacher_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, teacher_id: e.target.value || null })}
              >
                <option value="">Not assigned</option>
                {teachers.map(teacher => (
                  <option key={teacher.user_id} value={teacher.user_id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                You can assign a teacher now or later
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Subject
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ClassSubjectAssignment;


