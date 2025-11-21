import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaUsers, FaCalendarAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function FormManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data
  const [forms, setForms] = useState([]);
  const [schools, setSchools] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [formData, setFormData] = useState({
    school_id: '',
    form_number: '',
    form_name: '',
    academic_year: '',
    coordinator_id: '',
    description: ''
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get schools (institutions)
      const { data: schoolsData } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      setSchools(schoolsData || []);
      
      // Get coordinators (users with admin/instructor role)
      const { data: coordinatorsData } = await supabase
        .from('users')
        .select('*')
        .in('role', ['ADMIN', 'INSTRUCTOR'])
        .eq('is_active', true)
        .order('name');
      setCoordinators(coordinatorsData || []);
      
      // Get all forms
      const { data: formsData } = await supabase
        .from('forms')
        .select(`
          *,
          coordinator:users!forms_coordinator_id_fkey(name, email),
          school:institutions(name)
        `)
        .order('form_number');
      setForms(formsData || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load forms');
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (form = null) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        school_id: form.school_id || '',
        form_number: form.form_number || '',
        form_name: form.form_name || '',
        academic_year: form.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        coordinator_id: form.coordinator_id || '',
        description: form.description || ''
      });
    } else {
      setEditingForm(null);
      setFormData({
        school_id: schools[0]?.institution_id || '',
        form_number: '',
        form_name: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        coordinator_id: '',
        description: ''
      });
    }
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingForm(null);
    setFormData({});
    setSuccess(null);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (editingForm) {
        // Update form
        await supabaseService.updateForm(editingForm.form_id, formData);
        setSuccess('Form updated successfully');
      } else {
        // Create form
        await supabaseService.createForm(formData);
        setSuccess('Form created successfully');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err.message || 'Failed to save form');
    }
  };
  
  const handleDelete = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form? This will also delete all associated classes.')) {
      try {
        await supabaseService.deleteForm(formId);
        setSuccess('Form deleted successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting form:', err);
        setError(err.message || 'Failed to delete form');
      }
    }
  };
  
  // Get classes count for form
  const getClassesCount = async (formId) => {
    try {
      const { count } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', formId)
        .eq('is_active', true);
      return count || 0;
    } catch {
      return 0;
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
    <Container className="mt-4">
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Form Management</h2>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />
              Create Form
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {forms.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No forms created yet</p>
              <Button variant="primary" className="mt-3" onClick={() => handleOpenModal()}>
                Create First Form
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Form Number</th>
                  <th>Form Name</th>
                  <th>Academic Year</th>
                  <th>School</th>
                  <th>Coordinator</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.form_id}>
                    <td>{form.form_number}</td>
                    <td>{form.form_name}</td>
                    <td>{form.academic_year}</td>
                    <td>{form.school?.name || 'N/A'}</td>
                    <td>{form.coordinator?.name || 'Not assigned'}</td>
                    <td>
                      <Badge bg={form.is_active ? 'success' : 'secondary'}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleOpenModal(form)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(form.form_id)}
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
            {editingForm ? 'Edit Form' : 'Create New Form'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>School *</Form.Label>
              <Form.Select
                value={formData.school_id}
                onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                required
              >
                <option value="">Select School</option>
                {schools.map(school => (
                  <option key={school.institution_id} value={school.institution_id}>
                    {school.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Number * (1-7)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="7"
                    value={formData.form_number}
                    onChange={(e) => setFormData({ ...formData, form_number: parseInt(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.form_name}
                    onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                    placeholder="e.g., Form 3, Lower Sixth"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Academic Year *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Coordinator</Form.Label>
                  <Form.Select
                    value={formData.coordinator_id}
                    onChange={(e) => setFormData({ ...formData, coordinator_id: e.target.value || null })}
                  >
                    <option value="">Not assigned</option>
                    {coordinators.map(coord => (
                      <option key={coord.user_id} value={coord.user_id}>
                        {coord.name} ({coord.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingForm ? 'Update' : 'Create'} Form
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default FormManagement;


