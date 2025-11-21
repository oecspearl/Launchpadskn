import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBuilding, FaMapMarkerAlt, FaEnvelope, FaPhone, FaGlobe, FaUniversity, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import supabaseService from '../../services/supabaseService';
import Breadcrumb from '../common/Breadcrumb';

function InstitutionManagement() {
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState({});
  const [expandedInstitutions, setExpandedInstitutions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact: '',
    phone: '',
    website: '',
    establishedYear: '',
    type: 'UNIVERSITY'
  });

  const [deptFormData, setDeptFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/admin/dashboard', type: 'dashboard' },
    { label: 'Institution Management', path: '/admin/institutions', type: 'institution' }
  ];

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getAllInstitutions();
      setInstitutions(data || []);
    } catch (error) {
      setError('Failed to fetch institutions');
      console.error('Error fetching institutions:', error);
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (institution = null) => {
    if (institution) {
      setEditingInstitution(institution);
      setFormData({
        name: institution.name || '',
        location: institution.location || '',
        contact: institution.contact || '',
        phone: institution.phone || '',
        website: institution.website || '',
        establishedYear: institution.establishedYear || institution.established_year || '',
        type: institution.institutionType || institution.institution_type || institution.type || 'UNIVERSITY'
      });
    } else {
      setEditingInstitution(null);
      setFormData({
        name: '',
        location: '',
        contact: '',
        phone: '',
        website: '',
        establishedYear: '',
        type: 'UNIVERSITY'
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInstitution(null);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Sanitize form data - convert empty strings to null for numeric fields
      const sanitizedData = {
        ...formData,
        establishedYear: formData.establishedYear === '' ? null : formData.establishedYear
      };

      if (editingInstitution) {
        const institutionId = editingInstitution.institutionId || editingInstitution.institution_id;
        await supabaseService.updateInstitution(institutionId, sanitizedData);
        setSuccess('Institution updated successfully');
      } else {
        await supabaseService.createInstitution(sanitizedData);
        setSuccess('Institution created successfully');
      }

      await fetchInstitutions();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      setError(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (institution) => {
    if (window.confirm(`Are you sure you want to delete ${institution.name}? This action cannot be undone.`)) {
      try {
        const institutionId = institution.institutionId || institution.institution_id;
        await supabaseService.deleteInstitution(institutionId);
        setSuccess('Institution deleted successfully');
        await fetchInstitutions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(error.message || 'Failed to delete institution');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const toggleInstitution = async (institutionId) => {
    const newExpanded = new Set(expandedInstitutions);
    if (newExpanded.has(institutionId)) {
      newExpanded.delete(institutionId);
    } else {
      newExpanded.add(institutionId);
      if (!departments[institutionId]) {
        try {
          // Departments are deprecated - return empty array
          setDepartments(prev => ({ ...prev, [institutionId]: [] }));
        } catch (error) {
          console.error('Departments deprecated:', error);
          setDepartments(prev => ({ ...prev, [institutionId]: [] }));
        }
      }
    }
    setExpandedInstitutions(newExpanded);
  };

  const handleAddDepartment = (institution) => {
    setSelectedInstitution(institution);
    setEditingDepartment(null);
    setDeptFormData({ name: '', code: '', description: '' });
    setShowDeptModal(true);
  };

  const handleEditDepartment = (department, institution) => {
    setSelectedInstitution(institution);
    setEditingDepartment(department);
    setDeptFormData({
      name: department.name || '',
      code: department.code || '',
      description: department.description || ''
    });
    setShowDeptModal(true);
  };

  const handleDeptInputChange = (e) => {
    const { name, value } = e.target;
    setDeptFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      // Departments are deprecated - show warning
      setSuccess('Departments are deprecated in the new hierarchical structure. This action was not performed.');
      setShowDeptModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Departments are deprecated.');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'UNIVERSITY': return 'primary';
      case 'COLLEGE': return 'success';
      case 'SCHOOL': return 'warning';
      case 'INSTITUTE': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Breadcrumb items={breadcrumbItems} />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaBuilding className="me-2 text-primary" />
                Institution Management
              </h2>
              <p className="text-muted">Manage educational institutions in the system</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <FaPlus className="me-2" />
              Add Institution
            </Button>
          </div>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {institutions.length === 0 ? (
            <div className="text-center py-5">
              <FaBuilding size={48} className="text-muted mb-3" />
              <h5>No institutions found</h5>
              <p className="text-muted">Start by adding your first institution</p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <FaPlus className="me-2" />
                Add Institution
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Established</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((institution) => (
                  <React.Fragment key={institution.institutionId}>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 me-2"
                            onClick={() => toggleInstitution(institution.institutionId)}
                          >
                            {expandedInstitutions.has(institution.institutionId) ?
                              <FaChevronDown /> : <FaChevronRight />
                            }
                          </Button>
                          <div>
                            <strong>{institution.name}</strong>
                            {institution.website && (
                              <div className="small text-muted">
                                <FaGlobe className="me-1" />
                                <a href={institution.website} target="_blank" rel="noopener noreferrer">
                                  {institution.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getTypeColor(institution.institutionType || institution.institution_type)}>
                          {institution.institutionType || institution.institution_type || 'UNIVERSITY'}
                        </Badge>
                      </td>
                      <td>
                        <FaMapMarkerAlt className="me-1 text-muted" />
                        {institution.location}
                      </td>
                      <td>
                        <div>
                          {institution.contact && (
                            <div className="small">
                              <FaEnvelope className="me-1" />
                              {institution.contact}
                            </div>
                          )}
                          {institution.phone && (
                            <div className="small">
                              <FaPhone className="me-1" />
                              {institution.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{institution.establishedYear || 'N/A'}</td>
                      <td>
                        <div className="btn-group">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowModal(institution)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(institution)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedInstitutions.has(institution.institutionId) && (
                      <tr>
                        <td colSpan="6" className="bg-light">
                          <div className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">
                                <FaUniversity className="me-2" />
                                Departments ({departments[institution.institutionId]?.length || 0})
                              </h6>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAddDepartment(institution)}
                              >
                                <FaPlus className="me-1" />
                                Add Department
                              </Button>
                            </div>
                            {departments[institution.institutionId]?.length > 0 ? (
                              <Row>
                                {departments[institution.institutionId].map(dept => (
                                  <Col md={4} key={dept.departmentId} className="mb-2">
                                    <Card size="sm">
                                      <Card.Body className="p-2">
                                        <div className="d-flex justify-content-between align-items-start">
                                          <div>
                                            <strong>{dept.name}</strong>
                                            <div className="small text-muted">{dept.code}</div>
                                            {dept.description && (
                                              <div className="small">{dept.description}</div>
                                            )}
                                          </div>
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEditDepartment(dept, institution)}
                                          >
                                            <FaEdit />
                                          </Button>
                                        </div>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            ) : (
                              <div className="text-center py-3">
                                <p className="text-muted mb-2">No departments found</p>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleAddDepartment(institution)}
                                >
                                  <FaPlus className="me-1" />
                                  Add First Department
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Institution Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="UNIVERSITY">University</option>
                    <option value="COLLEGE">College</option>
                    <option value="SECONDARY SCHOOL">Secondary School</option>
                    <option value="PRIMARY SCHOOL">Primary School</option>
                    <option value="INSTITUTE">Institute</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Established Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Website</Form.Label>
              <Form.Control
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingInstitution ? 'Update Institution' : 'Create Institution'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Department Modal */}
      <Modal show={showDeptModal} onHide={() => setShowDeptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDepartment ? 'Edit Department' : `Add Department to ${selectedInstitution?.name}`}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDeptSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Department Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={deptFormData.name}
                onChange={handleDeptInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department Code *</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={deptFormData.code}
                onChange={handleDeptInputChange}
                placeholder="e.g., CS, ENG, MATH"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={deptFormData.description}
                onChange={handleDeptInputChange}
                placeholder="Department description..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeptModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default InstitutionManagement;