import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Modal, Form, Badge, Tabs, Tab
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaBook, FaGraduationCap
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import StructuredCurriculumEditor from './StructuredCurriculumEditor';

function SubjectManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('subjects');
  
  // Data
  const [subjects, setSubjects] = useState([]);
  const [formOfferings, setFormOfferings] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState([]);
  
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
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get schools
      const { data: schoolsData } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      setSchools(schoolsData || []);
      
      // Get departments
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      setDepartments(departmentsData || []);
      
      // Get forms
      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('is_active', true)
        .order('form_number');
      setForms(formsData || []);
      
      // Get subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select(`
          *,
          department:departments(name)
        `)
        .eq('is_active', true)
        .order('subject_name');
      setSubjects(subjectsData || []);
      
      // Get form offerings
      const { data: offeringsData } = await supabase
        .from('subject_form_offerings')
        .select(`
          *,
          subject:subjects(*),
          form:forms(*)
        `)
        .order('form_id');
      setFormOfferings(offeringsData || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setIsLoading(false);
    }
  };
  
  const handleOpenSubjectModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectData({
        school_id: subject.school_id || '',
        subject_name: subject.subject_name || '',
        subject_code: subject.subject_code || '',
        cxc_code: subject.cxc_code || '',
        department_id: subject.department_id || '',
        description: subject.description || ''
      });
    } else {
      setEditingSubject(null);
      setSubjectData({
        school_id: schools[0]?.institution_id || '',
        subject_name: '',
        subject_code: '',
        cxc_code: '',
        department_id: '',
        description: ''
      });
    }
    setShowSubjectModal(true);
  };
  
  const handleOpenOfferingModal = (offering = null) => {
    if (offering) {
      // Editing existing offering
      setEditingOffering(offering);
      setOfferingData({
        subject_id: offering.subject_id,
        form_id: offering.form_id,
        curriculum_framework: offering.curriculum_framework || '',
        learning_outcomes: offering.learning_outcomes || '',
        weekly_periods: offering.weekly_periods || 5,
        is_compulsory: offering.is_compulsory || false
      });
    } else {
      // Creating new offering
      setEditingOffering(null);
      setOfferingData({
        subject_id: '',
        form_id: '',
        curriculum_framework: '',
        learning_outcomes: '',
        weekly_periods: 5,
        is_compulsory: false
      });
    }
    setShowOfferingModal(true);
  };
  
  const handleCloseModals = () => {
    setShowSubjectModal(false);
    setShowOfferingModal(false);
    setEditingSubject(null);
    setEditingOffering(null);
    setSubjectData({});
    setOfferingData({});
    setSuccess(null);
    setError(null);
  };
  
  const handleSubmitSubject = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (editingSubject) {
        const { data, error: updateError } = await supabase
          .from('subjects')
          .update({ ...subjectData, updated_at: new Date().toISOString() })
          .eq('subject_id', editingSubject.subject_id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        setSuccess('Subject updated successfully');
      } else {
        await supabaseService.createSubject(subjectData);
        setSuccess('Subject created successfully');
      }
      
      handleCloseModals();
      fetchData();
    } catch (err) {
      console.error('Error saving subject:', err);
      setError(err.message || 'Failed to save subject');
    }
  };
  
  const handleSubmitOffering = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (editingOffering) {
        // Update existing offering
        await supabaseService.updateCurriculumOffering(
          editingOffering.offering_id,
          {
            curriculum_framework: offeringData.curriculum_framework || null,
            learning_outcomes: offeringData.learning_outcomes || null,
            weekly_periods: parseInt(offeringData.weekly_periods) || 5,
            is_compulsory: offeringData.is_compulsory || false
          }
        );
        setSuccess('Subject offering updated successfully');
      } else {
        // Create new offering
        await supabaseService.createSubjectOffering(
          offeringData.subject_id,
          offeringData.form_id,
          {
            curriculum_framework: offeringData.curriculum_framework || null,
            learning_outcomes: offeringData.learning_outcomes || null,
            weekly_periods: parseInt(offeringData.weekly_periods) || 5,
            is_compulsory: offeringData.is_compulsory || false
          }
        );
        setSuccess('Subject offering created successfully');
      }
      
      handleCloseModals();
      fetchData();
    } catch (err) {
      console.error('Error saving offering:', err);
      setError(err.message || 'Failed to save subject offering');
    }
  };

  const handleSaveStructuredCurriculum = async (structuredData) => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!editingOffering) {
        setError('No offering selected');
        return;
      }

      const { data, error } = await supabase
        .from('subject_form_offerings')
        .update({
          curriculum_structure: structuredData.curriculum_structure,
          curriculum_version: structuredData.curriculum_version,
          curriculum_updated_at: structuredData.curriculum_updated_at,
          updated_at: new Date().toISOString()
        })
        .eq('offering_id', editingOffering.offering_id)
        .select()
        .single();

      if (error) throw error;
      
      setSuccess('Structured curriculum saved successfully');
      setShowStructuredEditor(false);
      fetchData();
    } catch (err) {
      console.error('Error saving structured curriculum:', err);
      setError(err.message || 'Failed to save structured curriculum');
    }
  };
  
  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject? This will affect all classes using it.')) {
      try {
        const { error } = await supabase
          .from('subjects')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('subject_id', subjectId);
        
        if (error) throw error;
        setSuccess('Subject deleted successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting subject:', err);
        setError(err.message || 'Failed to delete subject');
      }
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
            <h2>Subject Management</h2>
            <Button variant="primary" onClick={() => handleOpenSubjectModal()}>
              <FaPlus className="me-2" />
              Create Subject
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="subjects" title="Subjects">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {subjects.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No subjects created yet</p>
                  <Button variant="primary" className="mt-3" onClick={() => handleOpenSubjectModal()}>
                    Create First Subject
                  </Button>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Subject Code</th>
                      <th>CXC Code</th>
                      <th>Department</th>
                      <th>School</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.subject_id}>
                        <td><strong>{subject.subject_name}</strong></td>
                        <td><Badge bg="primary">{subject.subject_code}</Badge></td>
                        <td>{subject.cxc_code || '-'}</td>
                        <td>{subject.department?.name || 'N/A'}</td>
                        <td>
                          {schools.find(s => s.institution_id === subject.school_id)?.name || 'N/A'}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleOpenSubjectModal(subject)}
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
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="offerings" title="Form Offerings">
          <Row className="mb-3">
            <Col>
              <Button variant="outline-primary" onClick={handleOpenOfferingModal}>
                <FaPlus className="me-2" />
                Add Subject to Form
              </Button>
            </Col>
          </Row>
          
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {formOfferings.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No subject offerings created yet</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Form</th>
                      <th>Academic Year</th>
                      <th>Periods/Week</th>
                      <th>Compulsory</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formOfferings.map((offering) => (
                      <tr key={offering.offering_id}>
                        <td><strong>{offering.subject?.subject_name}</strong></td>
                        <td>{offering.form?.form_name}</td>
                        <td>{offering.form?.academic_year}</td>
                        <td>{offering.weekly_periods || 5}</td>
                        <td>
                          {offering.is_compulsory ? (
                            <Badge bg="success">Required</Badge>
                          ) : (
                            <Badge bg="secondary">Optional</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleOpenOfferingModal(offering)}
                            >
                              <FaEdit /> Quick Edit
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => {
                                setEditingOffering(offering);
                                setShowStructuredEditor(true);
                              }}
                            >
                              <FaBook /> Structured Editor
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Subject Create/Edit Modal */}
      <Modal show={showSubjectModal} onHide={handleCloseModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSubject ? 'Edit Subject' : 'Create New Subject'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitSubject}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>School *</Form.Label>
              <Form.Select
                value={subjectData.school_id}
                onChange={(e) => setSubjectData({ ...subjectData, school_id: e.target.value })}
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
                  <Form.Label>Subject Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectData.subject_name}
                    onChange={(e) => setSubjectData({ ...subjectData, subject_name: e.target.value })}
                    placeholder="e.g., Mathematics, English Language"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectData.subject_code}
                    onChange={(e) => setSubjectData({ ...subjectData, subject_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MATH, ENG"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CXC Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={subjectData.cxc_code}
                    onChange={(e) => setSubjectData({ ...subjectData, cxc_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CSEC Math: 01"
                  />
                  <Form.Text className="text-muted">
                    CSEC/CAPE subject code if applicable
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={subjectData.department_id}
                    onChange={(e) => setSubjectData({ ...subjectData, department_id: e.target.value || null })}
                  >
                    <option value="">No department</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.name}
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
                value={subjectData.description}
                onChange={(e) => setSubjectData({ ...subjectData, description: e.target.value })}
                placeholder="Optional description"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModals}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSubject ? 'Update' : 'Create'} Subject
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Form Offering Modal */}
      <Modal show={showOfferingModal} onHide={handleCloseModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingOffering ? 'Edit Curriculum' : 'Add Subject to Form'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitOffering}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Select
                value={offeringData.subject_id}
                onChange={(e) => setOfferingData({ ...offeringData, subject_id: e.target.value })}
                required
                disabled={!!editingOffering}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name} ({subject.subject_code})
                  </option>
                ))}
              </Form.Select>
              {editingOffering && (
                <Form.Text className="text-muted">
                  Subject and Form cannot be changed after creation
                </Form.Text>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Form *</Form.Label>
              <Form.Select
                value={offeringData.form_id}
                onChange={(e) => setOfferingData({ ...offeringData, form_id: e.target.value })}
                required
                disabled={!!editingOffering}
              >
                <option value="">Select Form</option>
                {forms.map(form => (
                  <option key={form.form_id} value={form.form_id}>
                    {form.form_name} (Form {form.form_number}) - {form.academic_year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Weekly Periods</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="10"
                    value={offeringData.weekly_periods}
                    onChange={(e) => setOfferingData({ ...offeringData, weekly_periods: e.target.value })}
                    placeholder="5"
                  />
                  <Form.Text className="text-muted">
                    Number of lessons per week
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Compulsory Subject"
                    checked={offeringData.is_compulsory}
                    onChange={(e) => setOfferingData({ ...offeringData, is_compulsory: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Curriculum Framework</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={offeringData.curriculum_framework}
                onChange={(e) => setOfferingData({ ...offeringData, curriculum_framework: e.target.value })}
                placeholder="Link to CXC/CSEC/CAPE standards, curriculum details"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Learning Outcomes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={offeringData.learning_outcomes}
                onChange={(e) => setOfferingData({ ...offeringData, learning_outcomes: e.target.value })}
                placeholder="Learning objectives and outcomes for this form level"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModals}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingOffering ? 'Update Curriculum' : 'Create Offering'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default SubjectManagement;


