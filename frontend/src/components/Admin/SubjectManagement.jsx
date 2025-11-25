import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge, Tabs, Tab
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaBook
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../../services/institutionService';
import StructuredCurriculumEditor from './StructuredCurriculumEditor';

function SubjectManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('subjects');

  // Modal state for subjects
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectData, setSubjectData] = useState({
    school_id: '',
    subject_name: '',
    subject_code: '',
    cxc_code: '',
    department_id: '',
    description: ''
  });

  // Modal state for form offerings
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [showStructuredEditor, setShowStructuredEditor] = useState(false);
  const [editingOffering, setEditingOffering] = useState(null);
  const [offeringData, setOfferingData] = useState({
    subject_id: '',
    form_id: '',
    curriculum_framework: '',
    learning_outcomes: '',
    weekly_periods: 5,
    is_compulsory: false
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Queries
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionService.getAllInstitutions()
  });

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => institutionService.getAllDepartments()
  });

  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms'],
    queryFn: () => institutionService.getFormsBySchool(null) // Fetch all forms
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => institutionService.getSubjectsBySchool(null) // Fetch all subjects
  });

  const { data: formOfferings = [], isLoading: isLoadingOfferings } = useQuery({
    queryKey: ['offerings'],
    queryFn: () => institutionService.getCurriculumContent(null) // Fetch all offerings
  });

  const isLoading = isLoadingSchools || isLoadingDepartments || isLoadingForms || isLoadingSubjects || isLoadingOfferings;

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (data) => institutionService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      setSuccess('Subject created successfully');
      handleCloseModals();
    },
    onError: (err) => setError(err.message || 'Failed to create subject')
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }) => institutionService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      setSuccess('Subject updated successfully');
      handleCloseModals();
    },
    onError: (err) => setError(err.message || 'Failed to update subject')
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id) => institutionService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      setSuccess('Subject deleted successfully');
    },
    onError: (err) => setError(err.message || 'Failed to delete subject')
  });

  const createOfferingMutation = useMutation({
    mutationFn: (data) => institutionService.createSubjectOffering(data.subject_id, data.form_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offerings']);
      setSuccess('Subject offering created successfully');
      handleCloseModals();
    },
    onError: (err) => setError(err.message || 'Failed to create offering')
  });

  const updateOfferingMutation = useMutation({
    mutationFn: ({ id, data }) => institutionService.updateCurriculumOffering(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offerings']);
      setSuccess('Subject offering updated successfully');
      handleCloseModals();
    },
    onError: (err) => setError(err.message || 'Failed to update offering')
  });

  const deleteOfferingMutation = useMutation({
    mutationFn: (id) => institutionService.deleteSubjectOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['offerings']);
      setSuccess('Subject offering deleted successfully');
    },
    onError: (err) => setError(err.message || 'Failed to delete offering')
  });

  // Handlers
  const handleCloseModals = () => {
    setShowSubjectModal(false);
    setShowOfferingModal(false);
    setShowStructuredEditor(false);
    setEditingSubject(null);
    setEditingOffering(null);
    setSubjectData({
      school_id: '',
      subject_name: '',
      subject_code: '',
      cxc_code: '',
      department_id: '',
      description: ''
    });
    setOfferingData({
      subject_id: '',
      form_id: '',
      curriculum_framework: '',
      learning_outcomes: '',
      weekly_periods: 5,
      is_compulsory: false
    });
    setError(null);
    setSuccess(null);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setSubjectData({
      school_id: subject.school_id,
      subject_name: subject.subject_name,
      subject_code: subject.subject_code || '',
      cxc_code: subject.cxc_code || '',
      department_id: subject.department_id || '',
      description: subject.description || ''
    });
    setShowSubjectModal(true);
  };

  const handleEditOffering = (offering) => {
    setEditingOffering(offering);
    setOfferingData({
      subject_id: offering.subject_id,
      form_id: offering.form_id,
      curriculum_framework: offering.curriculum_framework || '',
      learning_outcomes: offering.learning_outcomes || '',
      weekly_periods: offering.weekly_periods || 5,
      is_compulsory: offering.is_compulsory || false,
      curriculum_structure: offering.curriculum_structure
    });
    setShowOfferingModal(true);
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.subject_id, data: subjectData });
    } else {
      createSubjectMutation.mutate(subjectData);
    }
  };

  const handleSaveOffering = (e) => {
    e.preventDefault();
    if (editingOffering) {
      updateOfferingMutation.mutate({ id: editingOffering.offering_id, data: offeringData });
    } else {
      createOfferingMutation.mutate(offeringData);
    }
  };

  const handleDeleteSubject = (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const handleDeleteOffering = (id) => {
    if (window.confirm('Are you sure you want to remove this subject from this form?')) {
      deleteOfferingMutation.mutate(id);
    }
  };

  const handleStructuredCurriculumSave = (structure) => {
    const updatedData = {
      ...offeringData,
      curriculum_structure: structure
    };

    if (editingOffering) {
      updateOfferingMutation.mutate({
        id: editingOffering.offering_id,
        data: updatedData
      });
    }
    // Note: Creating new offering with structured curriculum is not directly supported in this flow yet,
    // as the editor is opened from an existing offering usually.
    // But if we want to support it, we'd need to handle it.
    // For now, assume editing only for structured curriculum.
  };

  if (isLoading) {
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
        <h2>Subject Management</h2>
        <div>
          <Button
            variant="primary"
            className="me-2"
            onClick={() => setShowSubjectModal(true)}
          >
            <FaPlus className="me-2" /> Add Subject
          </Button>
          <Button
            variant="success"
            onClick={() => setShowOfferingModal(true)}
          >
            <FaBook className="me-2" /> Assign to Form
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="subjects" title="All Subjects">
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>CXC Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => (
                    <tr key={subject.subject_id}>
                      <td>{subject.subject_code}</td>
                      <td>{subject.subject_name}</td>
                      <td>
                        {departments.find(d => d.department_id === subject.department_id)?.name || '-'}
                      </td>
                      <td>{subject.cxc_code || '-'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditSubject(subject)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.subject_id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No subjects found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="offerings" title="Form Assignments">
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Subject</th>
                    <th>Periods/Week</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formOfferings.map(offering => (
                    <tr key={offering.offering_id}>
                      <td>
                        {offering.form ? `${offering.form.form_number}${offering.form.stream || ''}` : '-'}
                      </td>
                      <td>{offering.subject?.subject_name}</td>
                      <td>{offering.weekly_periods}</td>
                      <td>
                        <Badge bg={offering.is_compulsory ? 'primary' : 'secondary'}>
                          {offering.is_compulsory ? 'Compulsory' : 'Elective'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditOffering(offering)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setEditingOffering(offering);
                            setOfferingData({
                              ...offeringData,
                              curriculum_structure: offering.curriculum_structure
                            });
                            setShowStructuredEditor(true);
                          }}
                          title="Edit Curriculum"
                        >
                          <FaBook />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteOffering(offering.offering_id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {formOfferings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No form assignments found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Subject Modal */}
      <Modal show={showSubjectModal} onHide={handleCloseModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSubject}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>School</Form.Label>
                  <Form.Select
                    value={subjectData.school_id}
                    onChange={(e) => setSubjectData({ ...subjectData, school_id: e.target.value })}
                    required
                  >
                    <option value="">Select School...</option>
                    {schools.map(school => (
                      <option key={school.institutionId} value={school.institutionId}>
                        {school.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={subjectData.department_id}
                    onChange={(e) => setSubjectData({ ...subjectData, department_id: e.target.value })}
                  >
                    <option value="">Select Department...</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectData.subject_name}
                    onChange={(e) => setSubjectData({ ...subjectData, subject_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectData.subject_code}
                    onChange={(e) => setSubjectData({ ...subjectData, subject_code: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>CXC Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectData.cxc_code}
                    onChange={(e) => setSubjectData({ ...subjectData, cxc_code: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={subjectData.description}
                onChange={(e) => setSubjectData({ ...subjectData, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
            <Button variant="primary" type="submit">
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Offering Modal */}
      <Modal show={showOfferingModal} onHide={handleCloseModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingOffering ? 'Edit Assignment' : 'Assign Subject to Form'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveOffering}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form</Form.Label>
                  <Form.Select
                    value={offeringData.form_id}
                    onChange={(e) => setOfferingData({ ...offeringData, form_id: e.target.value })}
                    required
                    disabled={!!editingOffering}
                  >
                    <option value="">Select Form...</option>
                    {forms.map(form => (
                      <option key={form.form_id} value={form.form_id}>
                        {form.form_number}{form.stream}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Select
                    value={offeringData.subject_id}
                    onChange={(e) => setOfferingData({ ...offeringData, subject_id: e.target.value })}
                    required
                    disabled={!!editingOffering}
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map(subject => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Weekly Periods</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={offeringData.weekly_periods}
                    onChange={(e) => setOfferingData({ ...offeringData, weekly_periods: parseInt(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Compulsory Subject"
                    checked={offeringData.is_compulsory}
                    onChange={(e) => setOfferingData({ ...offeringData, is_compulsory: e.target.checked })}
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Curriculum Framework</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={offeringData.curriculum_framework}
                onChange={(e) => setOfferingData({ ...offeringData, curriculum_framework: e.target.value })}
                placeholder="Overview of the curriculum..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
            <Button variant="primary" type="submit">
              {editingOffering ? 'Update Assignment' : 'Assign Subject'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Structured Curriculum Editor Modal */}
      <Modal show={showStructuredEditor} onHide={handleCloseModals} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Curriculum Editor: {editingOffering?.subject?.subject_name} (Form {editingOffering?.form?.form_number})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <StructuredCurriculumEditor
            initialData={offeringData.curriculum_structure}
            onSave={handleStructuredCurriculumSave}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default SubjectManagement;
