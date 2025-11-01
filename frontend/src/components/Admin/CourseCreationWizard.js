import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, ProgressBar, Card } from 'react-bootstrap';
import { FaBuilding, FaUniversity, FaBook, FaChalkboardTeacher } from 'react-icons/fa';
import institutionService from '../../services/institutionService';
import api from '../../services/api';

function CourseCreationWizard({ show, onHide, onCourseCreated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Institution Selection
    institutionId: '',
    
    // Step 2: Department Selection
    departmentId: '',
    
    // Step 3: Course Details
    code: '',
    title: '',
    description: '',
    creditHours: '',
    semester: '',
    academicYear: new Date().getFullYear().toString(),
    maxEnrollment: '',
    prerequisites: [],
    isActive: true
  });

  const steps = [
    { number: 1, title: 'Select Institution', icon: <FaBuilding /> },
    { number: 2, title: 'Select Department', icon: <FaUniversity /> },
    { number: 3, title: 'Course Details', icon: <FaBook /> },
    { number: 4, title: 'Review & Create', icon: <FaChalkboardTeacher /> }
  ];

  useEffect(() => {
    if (show) {
      fetchInstitutions();
      resetForm();
    }
  }, [show]);

  useEffect(() => {
    if (formData.institutionId) {
      fetchDepartments(formData.institutionId);
    }
  }, [formData.institutionId]);

  useEffect(() => {
    if (formData.departmentId) {
      fetchCourses(formData.departmentId);
    }
  }, [formData.departmentId]);

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      institutionId: '',
      departmentId: '',
      code: '',
      title: '',
      description: '',
      creditHours: '',
      semester: '',
      academicYear: new Date().getFullYear().toString(),
      maxEnrollment: '',
      prerequisites: [],
      isActive: true
    });
    setError('');
    setSuccess('');
  };

  const fetchInstitutions = async () => {
    try {
      const data = await institutionService.getAllInstitutions();
      setInstitutions(data);
    } catch (error) {
      setError('Failed to fetch institutions');
    }
  };

  const fetchDepartments = async (institutionId) => {
    try {
      const data = await institutionService.getDepartmentsByInstitution(institutionId);
      setDepartments(data);
    } catch (error) {
      setError('Failed to fetch departments');
    }
  };

  const fetchCourses = async (departmentId) => {
    try {
      const response = await api.get(`/courses/department/${departmentId}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses for prerequisites');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrerequisiteChange = (courseId, isChecked) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: isChecked
        ? [...prev.prerequisites, courseId]
        : prev.prerequisites.filter(id => id !== courseId)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.institutionId !== '';
      case 2:
        return formData.departmentId !== '';
      case 3:
        return formData.code && formData.title && formData.creditHours;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const courseData = {
        code: formData.code,
        title: formData.title,
        description: formData.description,
        creditHours: parseInt(formData.creditHours),
        semester: formData.semester,
        academicYear: formData.academicYear,
        departmentId: parseInt(formData.departmentId),
        isActive: formData.isActive
      };

      const response = await api.post('/courses', courseData);
      setSuccess('Course created successfully!');
      
      setTimeout(() => {
        onCourseCreated(response.data);
        onHide();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedInstitution = () => {
    return institutions.find(inst => inst.institutionId.toString() === formData.institutionId);
  };

  const getSelectedDepartment = () => {
    return departments.find(dept => dept.departmentId.toString() === formData.departmentId);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h5 className="mb-3">Select Institution</h5>
            <Form.Group>
              <Form.Label>Institution *</Form.Label>
              <Form.Select
                name="institutionId"
                value={formData.institutionId}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose an institution...</option>
                {institutions.map(institution => (
                  <option key={institution.institutionId} value={institution.institutionId}>
                    {institution.name} - {institution.location}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 2:
        return (
          <div>
            <h5 className="mb-3">Select Department</h5>
            {formData.institutionId && (
              <div className="mb-3">
                <small className="text-muted">
                  Institution: <strong>{getSelectedInstitution()?.name}</strong>
                </small>
              </div>
            )}
            <Form.Group>
              <Form.Label>Department *</Form.Label>
              <Form.Select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                required
                disabled={!formData.institutionId}
              >
                <option value="">Choose a department...</option>
                {departments.map(department => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 3:
        return (
          <div>
            <h5 className="mb-3">Course Details</h5>
            <div className="mb-3">
              <small className="text-muted">
                Department: <strong>{getSelectedDepartment()?.name}</strong> at <strong>{getSelectedInstitution()?.name}</strong>
              </small>
            </div>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., CS101"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Credit Hours *</Form.Label>
                  <Form.Control
                    type="number"
                    name="creditHours"
                    value={formData.creditHours}
                    onChange={handleInputChange}
                    min="1"
                    max="6"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Course Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Computer Science"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Course description..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                  >
                    <option value="">Select semester...</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Academic Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    min="2020"
                    max="2030"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                label="Course is active and available for enrollment"
              />
            </Form.Group>
          </div>
        );

      case 4:
        return (
          <div>
            <h5 className="mb-3">Review & Create Course</h5>
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Institution & Department</h6>
                    <p><strong>Institution:</strong> {getSelectedInstitution()?.name}</p>
                    <p><strong>Department:</strong> {getSelectedDepartment()?.name}</p>
                    
                    <h6>Course Information</h6>
                    <p><strong>Code:</strong> {formData.code}</p>
                    <p><strong>Title:</strong> {formData.title}</p>
                    <p><strong>Credit Hours:</strong> {formData.creditHours}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Additional Details</h6>
                    <p><strong>Semester:</strong> {formData.semester || 'Not specified'}</p>
                    <p><strong>Academic Year:</strong> {formData.academicYear}</p>
                    <p><strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}</p>
                    
                    {formData.description && (
                      <>
                        <h6>Description</h6>
                        <p>{formData.description}</p>
                      </>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Create New Course</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Progress Bar */}
        <div className="mb-4">
          <ProgressBar now={(currentStep / 4) * 100} className="mb-2" />
          <div className="d-flex justify-content-between">
            {steps.map(step => (
              <div key={step.number} className={`text-center ${currentStep >= step.number ? 'text-primary' : 'text-muted'}`}>
                <div className="mb-1">{step.icon}</div>
                <small>{step.title}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            {currentStep > 1 && (
              <Button variant="outline-secondary" onClick={handlePrevious}>
                Previous
              </Button>
            )}
          </div>
          <div>
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            {currentStep < 4 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default CourseCreationWizard;