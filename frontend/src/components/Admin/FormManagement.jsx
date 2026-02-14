import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../../services/institutionService';
import { userService } from '../../services/userService';
import { classService } from '../../services/classService';
import { ROLES } from '../../constants/roles';

function FormManagement() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedFormId, setExpandedFormId] = useState(null);

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
        userService.getUsersByRole(ROLES.INSTRUCTOR)
      ]);
      const all = [...admins, ...instructors];
      const unique = Array.from(new Map(all.map(item => [item.user_id, item])).values());
      return unique.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms'],
    queryFn: () => institutionService.getFormsBySchool(null)
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses(ROLES.ADMIN)
  });

  const isLoadingData = isLoadingSchools || isLoadingCoordinators || isLoadingForms;

  // Count classes per form
  const classCountByForm = {};
  classes.forEach(c => {
    classCountByForm[c.form_id] = (classCountByForm[c.form_id] || 0) + 1;
  });

  // Group forms by school for clear display
  const formsBySchool = {};
  forms.forEach(form => {
    const schoolId = form.school_id;
    const schoolName = form.school?.name || schools.find(s => s.institutionId === schoolId)?.name || 'Unknown School';
    if (!formsBySchool[schoolId]) {
      formsBySchool[schoolId] = { schoolName, forms: [] };
    }
    formsBySchool[schoolId].forms.push(form);
  });
  const schoolGroups = Object.values(formsBySchool);
  const hasMultipleSchools = schoolGroups.length > 1;

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
      setSuccess('Form archived successfully');
      setExpandedFormId(null);
    },
    onError: (err) => setError(err.message || 'Failed to archive form')
  });

  // Handlers
  const handleOpenModal = (form = null) => {
    const defaultSchoolId = schools.length === 1 ? schools[0].institutionId : '';
    const currentYear = new Date().getFullYear();

    if (form) {
      setEditingForm(form);
      setFormData({
        school_id: form.school_id || defaultSchoolId,
        form_number: form.form_number || '',
        form_name: form.form_name || '',
        academic_year: form.academic_year || `${currentYear}-${currentYear + 1}`,
        coordinator_id: form.coordinator_id || '',
        description: form.description || ''
      });
    } else {
      setEditingForm(null);
      setFormData({
        school_id: defaultSchoolId,
        form_number: '',
        form_name: '',
        academic_year: `${currentYear}-${currentYear + 1}`,
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

  const handleFormNumberChange = (value) => {
    const num = parseInt(value);
    if (!editingForm && num >= 1 && num <= 7) {
      setFormData({
        ...formData,
        form_number: num,
        form_name: `Form ${num}`
      });
    } else {
      setFormData({ ...formData, form_number: value ? parseInt(value) : '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedData = {
      ...formData,
      school_id: formData.school_id ? parseInt(formData.school_id) : null,
      form_number: formData.form_number ? parseInt(formData.form_number) : null,
      coordinator_id: formData.coordinator_id ? parseInt(formData.coordinator_id) : null,
      description: formData.description || null
    };

    if (!cleanedData.school_id) {
      setError('School is required');
      return;
    }
    if (!cleanedData.form_number || cleanedData.form_number < 1 || cleanedData.form_number > 7) {
      setError('Form number must be between 1 and 7');
      return;
    }
    if (!cleanedData.form_name || cleanedData.form_name.trim() === '') {
      setError('Form name is required');
      return;
    }
    if (!cleanedData.academic_year || cleanedData.academic_year.trim() === '') {
      setError('Academic year is required');
      return;
    }

    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.form_id, data: cleanedData });
    } else {
      createFormMutation.mutate(cleanedData);
    }
  };

  const handleDelete = (formId) => {
    if (window.confirm('Are you sure you want to archive this form? Associated classes will remain but the form will be hidden.')) {
      deleteFormMutation.mutate(formId);
    }
  };

  const toggleExpand = (formId) => {
    setExpandedFormId(expandedFormId === formId ? null : formId);
  };

  // Get classes for a specific form
  const getClassesForForm = (formId) => classes.filter(c => c.form_id === formId);

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
                  <th>Form</th>
                  <th>Academic Year</th>
                  {!hasMultipleSchools && <th>School</th>}
                  <th>Coordinator</th>
                  <th>Classes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schoolGroups.map((group) => (
                  <React.Fragment key={group.schoolName}>
                    {hasMultipleSchools && (
                      <tr>
                        <td colSpan={hasMultipleSchools ? 6 : 7}
                          className="bg-light fw-bold text-primary border-bottom-0"
                          style={{ fontSize: '0.95rem', letterSpacing: '0.02em' }}
                        >
                          {group.schoolName}
                        </td>
                      </tr>
                    )}
                    {group.forms.map((form) => (
                      <React.Fragment key={form.form_id}>
                        <tr
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleExpand(form.form_id)}
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              {hasMultipleSchools && <span style={{ width: 16, display: 'inline-block' }} />}
                              {expandedFormId === form.form_id ?
                                <FaChevronDown className="me-2 text-muted" size={12} /> :
                                <FaChevronRight className="me-2 text-muted" size={12} />
                              }
                              <strong>{form.form_name || `Form ${form.form_number}`}</strong>
                            </div>
                          </td>
                          <td>{form.academic_year}</td>
                          {!hasMultipleSchools && (
                            <td>{form.school?.name || group.schoolName}</td>
                          )}
                          <td>{form.coordinator?.name || 'Not assigned'}</td>
                          <td>
                            <Badge bg="info">
                              {classCountByForm[form.form_id] || 0}
                            </Badge>
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
                              className="me-1"
                              onClick={(e) => { e.stopPropagation(); handleOpenModal(form); }}
                              title="Edit form"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDelete(form.form_id); }}
                              title="Archive form"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                        {expandedFormId === form.form_id && (
                          <tr>
                            <td colSpan={hasMultipleSchools ? 6 : 7} className="p-0 border-top-0">
                              <div className="bg-light p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">Classes in {form.form_name || `Form ${form.form_number}`}</h6>
                                  <Button size="sm" variant="outline-primary" onClick={() => navigate('/admin/classes')}>
                                    Manage Classes
                                  </Button>
                                </div>
                                {getClassesForForm(form.form_id).length === 0 ? (
                                  <p className="text-muted small mb-0">No classes created yet for this form.</p>
                                ) : (
                                  <Table size="sm" hover className="mb-0">
                                    <thead>
                                      <tr><th>Class</th><th>Code</th><th>Tutor</th><th>Enrollment</th><th>Room</th></tr>
                                    </thead>
                                    <tbody>
                                      {getClassesForForm(form.form_id).map(c => (
                                        <tr key={c.class_id}>
                                          <td><strong>{c.class_name}</strong></td>
                                          <td><Badge bg="secondary">{c.class_code}</Badge></td>
                                          <td>{c.form_tutor?.name || 'Not assigned'}</td>
                                          <td>
                                            <Badge bg={c.current_enrollment >= c.capacity ? 'danger' : 'success'}>
                                              {c.current_enrollment || 0} / {c.capacity}
                                            </Badge>
                                          </td>
                                          <td>{c.room_number || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
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
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {schools.length > 1 ? (
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
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>School</Form.Label>
                <Form.Control
                  type="text"
                  value={schools[0]?.name || 'N/A'}
                  disabled
                />
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Number * (1-7)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="7"
                    value={formData.form_number}
                    onChange={(e) => handleFormNumberChange(e.target.value)}
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
                  <Form.Text className="text-muted">
                    Auto-generated from form number
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
                rows={2}
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
            <Button variant="primary" type="submit"
              disabled={createFormMutation.isLoading || updateFormMutation.isLoading}>
              {editingForm ? 'Update' : 'Create'} Form
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default FormManagement;
