import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Table, Modal, Form, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function InstitutionScopedFormManagement({ institutionId }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [forms, setForms] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [formData, setFormData] = useState({
    form_number: '',
    form_name: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    coordinator_id: '',
    description: ''
  });
  
  useEffect(() => {
    if (institutionId) {
      fetchData();
    }
  }, [institutionId]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get forms for this institution only
      const formsData = await supabaseService.getFormsByInstitution(institutionId);
      setForms(formsData || []);
      
      // Get coordinators (instructors) for this institution
      const coordinatorsData = await supabaseService.getUsersByInstitution(institutionId, 'INSTRUCTOR');
      setCoordinators(coordinatorsData || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load forms');
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      const submitData = {
        ...formData,
        school_id: institutionId, // Always use the institution ID
        form_number: parseInt(formData.form_number),
        academic_year: formData.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      };
      
      if (editingForm) {
        await supabaseService.updateForm(editingForm.form_id, submitData);
        setSuccess('Form updated successfully!');
      } else {
        await supabaseService.createForm(submitData);
        setSuccess('Form created successfully!');
      }
      
      setShowModal(false);
      setEditingForm(null);
      setFormData({
        form_number: '',
        form_name: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        coordinator_id: '',
        description: ''
      });
      fetchData();
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err.message || 'Failed to save form');
    }
  };
  
  const handleEdit = (form) => {
    setEditingForm(form);
    setFormData({
      form_number: form.form_number?.toString() || '',
      form_name: form.form_name || '',
      academic_year: form.academic_year || '',
      coordinator_id: form.coordinator_id || '',
      description: form.description || ''
    });
    setShowModal(true);
  };
  
  const handleDelete = async (formId) => {
    if (!window.confirm('Are you sure you want to deactivate this form?')) return;
    
    try {
      await supabaseService.deleteForm(formId);
      setSuccess('Form deactivated successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting form:', err);
      setError(err.message || 'Failed to delete form');
    }
  };
  
  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Forms Management</h4>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" />
          Add Form
        </Button>
      </div>
      
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
      
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Form Number</th>
                <th>Form Name</th>
                <th>Academic Year</th>
                <th>Coordinator</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No forms found. Create your first form to get started.
                  </td>
                </tr>
              ) : (
                forms.map((form) => (
                  <tr key={form.form_id}>
                    <td>{form.form_number}</td>
                    <td>{form.form_name}</td>
                    <td>{form.academic_year}</td>
                    <td>
                      {form.coordinator_id ? (
                        coordinators.find(c => c.user_id === form.coordinator_id)?.name || 'N/A'
                      ) : (
                        'Not assigned'
                      )}
                    </td>
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
                        onClick={() => handleEdit(form)}
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
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditingForm(null);
        setFormData({
          form_number: '',
          form_name: '',
          academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
          coordinator_id: '',
          description: ''
        });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingForm ? 'Edit Form' : 'Create New Form'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Form Number *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="7"
                value={formData.form_number}
                onChange={(e) => setFormData({ ...formData, form_number: e.target.value })}
                required
              />
              <Form.Text className="text-muted">Enter 1-7 for Forms 1-7</Form.Text>
            </Form.Group>
            
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
            
            <Form.Group className="mb-3">
              <Form.Label>Coordinator</Form.Label>
              <Form.Select
                value={formData.coordinator_id}
                onChange={(e) => setFormData({ ...formData, coordinator_id: e.target.value })}
              >
                <option value="">Not assigned</option>
                {coordinators.map(coord => (
                  <option key={coord.user_id} value={coord.user_id}>
                    {coord.name} ({coord.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              setEditingForm(null);
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingForm ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default InstitutionScopedFormManagement;

