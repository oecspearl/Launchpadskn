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
import { personName } from '../../utils/personName';

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
    institution_id: '',
    name: '',
    level: '',
    academic_year: '',
    coordinator_id: ''
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
    const schoolId = form.institution_id;
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
        institution_id: form.institution_id || defaultSchoolId,
        name: form.name || '',
        level: form.level || '',
        academic_year: form.academic_year || `${currentYear}-${currentYear + 1}`,
        coordinator_id: form.coordinator_id || ''
      });
    } else {
      setEditingForm(null);
      setFormData({
        institution_id: defaultSchoolId,
        name: '',
        level: '',
        academic_year: `${currentYear}-${currentYear + 1}`,
        coordinator_id: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingForm(null);
    setFormData({
      institution_id: '',
      name: '',
      level: '',
      academic_year: '',
      coordinator_id: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleFormNumberChange = (value) => {
    const num = parseInt(value);
    if (!editingForm && num >= 1 && num <= 7) {
      setFormData({
        ...formData,
        level: num,
        name: `Form ${num}`
      });
    } else {
      setFormData({ ...formData, level: value ? parseInt(value) : '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // institution_id and coordinator_id are UUIDs (do NOT parseInt); level is an integer.
    const cleanedData = {
      institution_id: formData.institution_id || null,
      name: formData.name,
      level: formData.level ? parseInt(formData.level) : null,
      academic_year: formData.academic_year,
      coordinator_id: formData.coordinator_id || null
    };

    if (!cleanedData.institution_id) {
      setError('School is required');
      return;
    }
    if (!cleanedData.level || cleanedData.level < 1 || cleanedData.level > 7) {
      setError('Form number must be between 1 and 7');
      return;
    }
    if (!cleanedData.name || cleanedData.name.trim() === '') {
      setError('Form name is required');
      return;
    }
    if (!cleanedData.academic_year || cleanedData.academic_year.trim() === '') {
      setError('Academic year is required');
      return;
    }

    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.id, data: cleanedData });
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
                      <React.Fragment key={form.id}>
                        <tr
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleExpand(form.id)}
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              {hasMultipleSchools && <span style={{ width: 16, display: 'inline-block' }} />}
                              {expandedFormId === form.id ?
                                <FaChevronDown className="me-2 text-muted" size={12} /> :
                                <FaChevronRight className="me-2 text-muted" size={12} />
                              }
                              <strong>{form.name || `Form ${form.level}`}</strong>
                            </div>
                          </td>
                          <td>{form.academic_year}</td>
                          {!hasMultipleSchools && (
                            <td>{form.school?.name || group.schoolName}</td>
                          )}
                          <td>{personName(form.coordinator) || 'Not assigned'}</td>
                          <td>
                            <Badge bg="info">
                              {classCountByForm[form.id] || 0}
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
                              onClick={(e) => { e.stopPropagation(); handleDelete(form.id); }}
                              title="Archive form"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                        {expandedFormId === form.id && (
                          <tr>
                            <td colSpan={hasMultipleSchools ? 6 : 7} className="p-0 border-top-0">
                              <div className="bg-light p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">Classes in {form.name || `Form ${form.level}`}</h6>
                                  <Button size="sm" variant="outline-primary" onClick={() => navigate('/admin/classes')}>
                                    Manage Classes
                                  </Button>
                                </div>
                                {getClassesForForm(form.id).length === 0 ? (
                                  <p className="text-muted small mb-0">No classes created yet for this form.</p>
                                ) : (
                                  <Table size="sm" hover className="mb-0">
                                    <thead>
                                      <tr><th>Class</th><th>Code</th><th>Tutor</th><th>Enrollment</th><th>Room</th></tr>
                                    </thead>
                                    <tbody>
                                      {getClassesForForm(form.id).map(c => (
                                        <tr key={c.class_id}>
                                          <td><strong>{c.class_name}</strong></td>
                                          <td><Badge bg="secondary">{c.class_code}</Badge></td>
                                          <td>{personName(c.form_tutor) || 'Not assigned'}</td>
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
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
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
                    value={formData.level}
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      <option key={coord.id} value={coord.id}>
                        {personName(coord)} ({coord.email})
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
