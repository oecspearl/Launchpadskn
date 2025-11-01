import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaUsers, FaUser
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function ClassManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data
  const [classes, setClasses] = useState([]);
  const [forms, setForms] = useState([]);
  const [formTutors, setFormTutors] = useState([]);
  const [selectedForm, setSelectedForm] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classData, setClassData] = useState({
    form_id: '',
    class_name: '',
    class_code: '',
    academic_year: '',
    capacity: 35,
    form_tutor_id: '',
    room_number: '',
    description: ''
  });
  
  useEffect(() => {
    fetchData();
  }, [selectedForm]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get forms
      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('is_active', true)
        .order('form_number');
      setForms(formsData || []);
      
      // Get form tutors (instructors)
      const { data: tutorsData } = await supabase
        .from('users')
        .select('*')
        .in('role', ['ADMIN', 'INSTRUCTOR'])
        .eq('is_active', true)
        .order('name');
      setFormTutors(tutorsData || []);
      
      // Get classes
      let query = supabase
        .from('classes')
        .select(`
          *,
          form:forms(*),
          form_tutor:users!classes_form_tutor_id_fkey(name, email)
        `)
        .eq('is_active', true);
      
      if (selectedForm !== 'all') {
        query = query.eq('form_id', selectedForm);
      }
      
      const { data: classesData } = await query.order('form_id').order('class_name');
      setClasses(classesData || []);
      
      // Get enrollment count for each class
      const classesWithCounts = await Promise.all((classesData || []).map(async (cls) => {
        const { count } = await supabase
          .from('student_class_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.class_id)
          .eq('is_active', true);
        return { ...cls, enrollment: count || 0 };
      }));
      
      setClasses(classesWithCounts);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load classes');
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setClassData({
        form_id: classItem.form_id || '',
        class_name: classItem.class_name || '',
        class_code: classItem.class_code || '',
        academic_year: classItem.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        capacity: classItem.capacity || 35,
        form_tutor_id: classItem.form_tutor_id || '',
        room_number: classItem.room_number || '',
        description: classItem.description || ''
      });
    } else {
      setEditingClass(null);
      const currentYear = new Date().getFullYear();
      setClassData({
        form_id: selectedForm !== 'all' ? selectedForm : (forms[0]?.form_id || ''),
        class_name: '',
        class_code: '',
        academic_year: `${currentYear}-${currentYear + 1}`,
        capacity: 35,
        form_tutor_id: '',
        room_number: '',
        description: ''
      });
    }
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setClassData({});
    setSuccess(null);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (editingClass) {
        // Update class
        await supabaseService.updateClass(editingClass.class_id, classData);
        setSuccess('Class updated successfully');
      } else {
        // Create class
        await supabaseService.createClass(classData);
        setSuccess('Class created successfully');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error saving class:', err);
      setError(err.message || 'Failed to save class');
    }
  };
  
  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This will remove all student assignments and subject assignments.')) {
      try {
        await supabaseService.updateClass(classId, { is_active: false });
        setSuccess('Class deleted successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting class:', err);
        setError(err.message || 'Failed to delete class');
      }
    }
  };
  
  const handleClassCodeChange = (className) => {
    // Auto-generate class code from class name
    if (className && !editingClass) {
      const code = className.toUpperCase().replace(/\s+/g, '');
      setClassData({ ...classData, class_name: className, class_code: code });
    } else {
      setClassData({ ...classData, class_name: className });
    }
  };
  
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
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Class Management</h2>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />
              Create Class
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* Filter by Form */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Label>Filter by Form</Form.Label>
          <Form.Select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
          >
            <option value="all">All Forms</option>
            {forms.map(form => (
              <option key={form.form_id} value={form.form_id}>
                {form.form_name} ({form.academic_year})
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {classes.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No classes found</p>
              <Button variant="primary" className="mt-3" onClick={() => handleOpenModal()}>
                Create First Class
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Class Code</th>
                  <th>Form</th>
                  <th>Academic Year</th>
                  <th>Form Tutor</th>
                  <th>Enrollment</th>
                  <th>Capacity</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem) => (
                  <tr key={classItem.class_id}>
                    <td><strong>{classItem.class_name}</strong></td>
                    <td><Badge bg="secondary">{classItem.class_code}</Badge></td>
                    <td>{classItem.form?.form_name || 'N/A'}</td>
                    <td>{classItem.academic_year}</td>
                    <td>{classItem.form_tutor?.name || 'Not assigned'}</td>
                    <td>
                      <Badge bg={classItem.enrollment >= classItem.capacity ? 'danger' : 'success'}>
                        {classItem.enrollment || 0} / {classItem.capacity}
                      </Badge>
                    </td>
                    <td>{classItem.capacity}</td>
                    <td>{classItem.room_number || '-'}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleOpenModal(classItem)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => window.location.href = `/admin/classes/${classItem.class_id}/students`}
                      >
                        <FaUsers />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(classItem.class_id)}
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
      
      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingClass ? 'Edit Class' : 'Create New Class'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Form *</Form.Label>
              <Form.Select
                value={classData.form_id}
                onChange={(e) => setClassData({ ...classData, form_id: e.target.value })}
                required
              >
                <option value="">Select Form</option>
                {forms.map(form => (
                  <option key={form.form_id} value={form.form_id}>
                    {form.form_name} ({form.academic_year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.class_name}
                    onChange={(e) => handleClassCodeChange(e.target.value)}
                    placeholder="e.g., 3A, 4Science, 5Arts"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.class_code}
                    onChange={(e) => setClassData({ ...classData, class_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., F3A, F4SCI"
                    required
                  />
                  <Form.Text className="text-muted">
                    Unique identifier for this class
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Academic Year *</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.academic_year}
                    onChange={(e) => setClassData({ ...classData, academic_year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={classData.capacity}
                    onChange={(e) => setClassData({ ...classData, capacity: parseInt(e.target.value) || 35 })}
                  />
                  <Form.Text className="text-muted">
                    Default: 35 students
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Tutor</Form.Label>
                  <Form.Select
                    value={classData.form_tutor_id}
                    onChange={(e) => setClassData({ ...classData, form_tutor_id: e.target.value || null })}
                  >
                    <option value="">Not assigned</option>
                    {formTutors.map(tutor => (
                      <option key={tutor.user_id} value={tutor.user_id}>
                        {tutor.name} ({tutor.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Room Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.room_number}
                    onChange={(e) => setClassData({ ...classData, room_number: e.target.value })}
                    placeholder="e.g., Room 101, Lab 2"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={classData.description}
                onChange={(e) => setClassData({ ...classData, description: e.target.value })}
                placeholder="Optional description"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingClass ? 'Update' : 'Create'} Class
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ClassManagement;


