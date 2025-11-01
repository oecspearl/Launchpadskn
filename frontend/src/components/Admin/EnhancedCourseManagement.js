import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup, Badge, Alert, Modal } from 'react-bootstrap';
import { FaPlus, FaSearch, FaBook, FaEdit, FaEye, FaFilter } from 'react-icons/fa';
import api from '../../services/api';
import institutionService from '../../services/institutionService';
import CourseCreationWizard from './CourseCreationWizard';
import Breadcrumb from '../common/Breadcrumb';

function EnhancedCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editFormData, setEditFormData] = useState({
    code: '',
    title: '',
    description: '',
    creditHours: '',
    semester: '',
    academicYear: '',
    isActive: true
  });

  const [filters, setFilters] = useState({
    search: '',
    institution: '',
    department: '',
    status: 'all'
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/admin/dashboard', type: 'dashboard' },
    { label: 'Course Management', type: 'course' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, filters]);

  useEffect(() => {
    if (filters.institution) {
      fetchDepartments(filters.institution);
    } else {
      setDepartments([]);
    }
  }, [filters.institution]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, institutionsData] = await Promise.all([
        api.get('/courses'),
        institutionService.getAllInstitutions()
      ]);
      
      setCourses(coursesData.data);
      setInstitutions(institutionsData);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (institutionId) => {
    try {
      const data = await institutionService.getDepartmentsByInstitution(institutionId);
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (filters.search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.code.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(course => 
        filters.status === 'active' ? course.isActive : !course.isActive
      );
    }

    // Note: Department filtering would require additional API calls to get department info
    // This is a simplified version

    setFilteredCourses(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCourseCreated = (newCourse) => {
    setCourses(prev => [...prev, newCourse]);
    setSuccess('Course created successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setEditFormData({
      code: course.code || '',
      title: course.title || '',
      description: course.description || '',
      creditHours: course.creditHours || '',
      semester: course.semester || '',
      academicYear: course.academicYear || '',
      isActive: course.isActive !== undefined ? course.isActive : true
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await api.put(`/courses/${editingCourse.id}`, editFormData);
      setCourses(prev => prev.map(course => 
        course.id === editingCourse.id ? response.data : course
      ));
      setSuccess('Course updated successfully!');
      setShowEditModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update course');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 
      <Badge bg="success">Active</Badge> : 
      <Badge bg="secondary">Inactive</Badge>;
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
    <Container fluid className="py-4">
      <Breadcrumb items={breadcrumbItems} />
      
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaBook className="me-2 text-primary" />
                Course Management
              </h2>
              <p className="text-muted">Manage courses with hierarchical organization</p>
            </div>
            <Button variant="primary" onClick={() => setShowWizard(true)}>
              <FaPlus className="me-2" />
              Create Course
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">
            <FaFilter className="me-2" />
            Filters
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search courses..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Institution</Form.Label>
                <Form.Select
                  value={filters.institution}
                  onChange={(e) => handleFilterChange('institution', e.target.value)}
                >
                  <option value="">All Institutions</option>
                  {institutions.map(inst => (
                    <option key={inst.institutionId} value={inst.institutionId}>
                      {inst.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Department</Form.Label>
                <Form.Select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  disabled={!filters.institution}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Courses List */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Courses ({filteredCourses.length})</h5>
            <Badge bg="info">Total: {courses.length}</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-5">
              <FaBook size={48} className="text-muted mb-3" />
              <h5>No courses found</h5>
              <p className="text-muted">
                {filters.search || filters.institution || filters.status !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by creating your first course'
                }
              </p>
              <Button variant="primary" onClick={() => setShowWizard(true)}>
                <FaPlus className="me-2" />
                Create Course
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Credit Hours</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div>
                        <strong>{course.code} - {course.title}</strong>
                        {course.description && (
                          <div className="small text-muted">{course.description.substring(0, 100)}...</div>
                        )}
                      </div>
                    </td>
                    <td>{course.creditHours}</td>
                    <td>
                      {course.semester && course.academicYear ? 
                        `${course.semester} ${course.academicYear}` : 
                        'Not specified'
                      }
                    </td>
                    <td>{getStatusBadge(course.isActive)}</td>
                    <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        <Button variant="outline-primary" size="sm">
                          <FaEye />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          <FaEdit />
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

      {/* Course Creation Wizard */}
      <CourseCreationWizard
        show={showWizard}
        onHide={() => setShowWizard(false)}
        onCourseCreated={handleCourseCreated}
      />

      {/* Edit Course Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Course Code</Form.Label>
                <Form.Control
                  type="text"
                  name="code"
                  value={editFormData.code}
                  onChange={handleEditInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Credit Hours</Form.Label>
                <Form.Control
                  type="number"
                  name="creditHours"
                  value={editFormData.creditHours}
                  onChange={handleEditInputChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Course Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={editFormData.title}
              onChange={handleEditInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={editFormData.description}
              onChange={handleEditInputChange}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Semester</Form.Label>
                <Form.Select
                  name="semester"
                  value={editFormData.semester}
                  onChange={handleEditInputChange}
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
                  value={editFormData.academicYear}
                  onChange={handleEditInputChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="isActive"
              checked={editFormData.isActive}
              onChange={handleEditInputChange}
              label="Course is active"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default EnhancedCourseManagement;