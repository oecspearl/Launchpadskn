import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Button, Table, Form, Modal, 
  Spinner, Alert, Row, Col
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import supabaseService from '../../services/supabaseService';

function ManageDepartments() {
  // State for departments and UI
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Fetch departments when component mounts
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Function to fetch departments (DEPRECATED)
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      // Departments are deprecated in the new hierarchical structure
      // The system now uses: School → Form → Class → Subject
      console.log('Departments are deprecated - returning empty array');
      setDepartments([]);
      setError(null);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Departments are deprecated. Please use the new hierarchical structure (Forms, Classes, Subjects).");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDepartment({
      ...currentDepartment,
      [name]: value
    });
    
    // Clear validation error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    if (!currentDepartment.name.trim()) errors.name = "Department name is required";
    if (!currentDepartment.code.trim()) errors.code = "Department code is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitLoading(true);
    try {
      // Format department data to match backend expectations
      const departmentData = {
        name: currentDepartment.name,
        code: currentDepartment.code,
        description: currentDepartment.description,
        // If creating a new department, we need to provide an institutionId
        // For simplicity, we're using a default institutionId of 1
        institutionId: currentDepartment.institutionId || 1
      };
      
      console.log('Submitting department data:', departmentData);
      
      if (isEditing) {
        // Update existing department (deprecated - no-op)
        console.warn('Department update is deprecated');
        setSuccessMessage("Departments are deprecated. This action was not performed.");
        setSuccessMessage("Department updated successfully!");
      } else {
        // Create new department (deprecated - no-op)
        console.warn('Department creation is deprecated');
        setSuccessMessage("Departments are deprecated. This action was not performed.");
      }
      
      // Refresh department list and close modal
      fetchDepartments();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving department:", err);
      setError("Failed to save department. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle department edit
  const handleEditDepartment = (department) => {
    console.log('Editing department:', department);
    
    // Make sure we have all the required fields with proper naming
    setCurrentDepartment({
      departmentId: department.departmentId,
      name: department.name,
      code: department.code,
      description: department.description || '',
      institutionId: department.institution ? department.institution.institutionId : 1
    });
    
    setIsEditing(true);
    setShowModal(true);
  };

  // Handle department deletion (deprecated)
  const handleDeleteDepartment = async (departmentId) => {
    try {
      console.log('Department deletion is deprecated');
      setDeleteConfirmation(null);
      setSuccessMessage("Departments are deprecated. This action was not performed.");
      // Don't refresh - departments list is already empty
    } catch (err) {
      console.error("Error:", err);
      setError("Departments are deprecated.");
    }
  };



  // Open modal for adding new department
  const handleAddDepartment = () => {
    setCurrentDepartment({
      name: '',
      code: '',
      description: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Render loading spinner
  if (loading && departments.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="p-4 pt-5">
      {/* Success message */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      
      {/* Error message */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Delete confirmation */}
      {deleteConfirmation && (
        <Alert variant="warning">
          <p>Are you sure you want to delete the department "{deleteConfirmation.name}"?</p>
          <p>This action cannot be undone and may affect courses and instructors.</p>
          <div>
            <Button 
              variant="danger" 
              className="me-2"
              onClick={() => handleDeleteDepartment(deleteConfirmation.departmentId)}
            >
              Yes, Delete
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setDeleteConfirmation(null)}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Manage Departments</h4>
            <Button variant="primary" onClick={handleAddDepartment}>
              <FaPlus className="me-2" /> Add Department
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Table responsive hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No departments found. Add your first department!
                  </td>
                </tr>
              ) : (
                departments.map(department => (
                  <tr key={department.departmentId}>
                    <td>
                      <div className="fw-bold">{department.name}</div>
                    </td>
                    <td>{department.code}</td>
                    <td>{department.description || '-'}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditDepartment(department)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => setDeleteConfirmation(department)}
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

      {/* Add/Edit Department Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Department' : 'Add New Department'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={currentDepartment.name}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={currentDepartment.code}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.code}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.code}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={currentDepartment.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Department'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ManageDepartments;
