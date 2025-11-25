import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../../services/institutionService';
import { userService } from '../../services/userService';
import { ROLES } from '../../constants/roles';

function FormManagement() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false); // Managed by React Query
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  // Queries
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionService.getAllInstitutions()
  });

  const { data: coordinators = [], isLoading: isLoadingCoordinators } = useQuery({
    queryKey: ['coordinators'],
    queryFn: async () => {
      const [admins, instructors] = await Promise.all([
        userService.getUsersByRole(ROLES.ADMIN),
        userService.getUsersByRole(ROLES.INSTRUCTOR) // Assuming INSTRUCTOR role exists in constants
      ]);
      // Merge and deduplicate just in case
      const all = [...admins, ...instructors];
      const unique = Array.from(new Map(all.map(item => [item.user_id, item])).values());
      return unique.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms'],
    queryFn: () => institutionService.getFormsBySchool(null)
  });

  const isLoadingData = isLoadingSchools || isLoadingCoordinators || isLoadingForms;

  // Mutations
  const createFormMutation = useMutation({
    mutationFn: (data) => institutionService.createForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['forms']);
      setSuccess('Form created successfully');
      handleCloseModal();
    },
    onError: (err) => setError(err.message || 'Failed to create form')
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, data }) => institutionService.updateForm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['forms']);
      setSuccess('Form updated successfully');
      handleCloseModal();
    },
    onError: (err) => setError(err.message || 'Failed to update form')
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id) => institutionService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['forms']);
      setSuccess('Form deleted successfully');
    },
    onError: (err) => setError(err.message || 'Failed to delete form')
  });

  // Handlers
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
        school_id: schools[0]?.institutionId || '', // Note: institutionService returns camelCase for institutions
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
    setFormData({
      school_id: '',
      form_number: '',
      form_name: '',
      academic_year: '',
      coordinator_id: '',
      description: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.form_id, data: formData });
    } else {
      createFormMutation.mutate(formData);
    }
  };

  const handleDelete = (formId) => {
    if (window.confirm('Are you sure you want to delete this form? This will also delete all associated classes.')) {
      deleteFormMutation.mutate(formId);
    }
  };

  if (isLoadingData) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Form Management</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <FaPlus className="me-2" />
          Create Form
        </Button>
      </div>

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
                    <td>
                      {/* institutionService returns institutions in camelCase, but forms might have school relation in snake_case or camelCase depending on how it was fetched. 
                            getFormsBySchool uses supabase select with join, so it returns snake_case usually unless transformed.
                            institutionService.getFormsBySchool returns raw data.
                        */}
                      {form.school?.name || schools.find(s => s.institutionId === form.school_id)?.name || 'N/A'}
                    </td>
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
                  <option key={school.institutionId} value={school.institutionId}>
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
