import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaUsers
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../../services/institutionService';
import { userService } from '../../services/userService';
import { classService } from '../../services/classService';
import { ROLES } from '../../constants/roles';

function ClassManagement() {
  const queryClient = useQueryClient();
  const [selectedForm, setSelectedForm] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classData, setClassData] = useState({
    form_id: '',
    class_name: '',
    class_code: '',
    academic_year: '',
    capacity: 35,
    form_tutor_id: '',
    room_number: '',
    description: '',
    thumbnail: '',
    syllabus: '',
    difficulty: 'intermediate',
    subject_area: '',
    published: false,
    featured: false
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Queries
  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms'],
    queryFn: () => institutionService.getFormsBySchool(null)
  });

  const { data: tutors = [], isLoading: isLoadingTutors } = useQuery({
    queryKey: ['tutors'],
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

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses(ROLES.ADMIN)
  });

  const isLoading = isLoadingForms || isLoadingTutors || isLoadingClasses;

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: (data) => classService.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setSuccess('Class created successfully');
      handleCloseModal();
    },
    onError: (err) => setError(err.message || 'Failed to create class')
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => classService.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setSuccess('Class updated successfully');
      handleCloseModal();
    },
    onError: (err) => setError(err.message || 'Failed to update class')
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => classService.updateClass(id, { is_active: false }), // Soft delete
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setSuccess('Class deleted successfully');
    },
    onError: (err) => setError(err.message || 'Failed to delete class')
  });

  // Handlers
  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setClassData({
        form_id: classItem.form_id || '',
        class_name: classItem.class_name || '',
        class_code: classItem.class_code || '',
        academic_year: classItem.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        capacity: classItem.capacity || 35,
        form_tutor_id: classItem.form_tutor_id || '',
        room_number: classItem.room_number || '',
        description: classItem.description || '',
        thumbnail: classItem.thumbnail || '',
        syllabus: classItem.syllabus || '',
        difficulty: classItem.difficulty || 'intermediate',
        subject_area: classItem.subject_area || '',
        published: classItem.published || false,
        featured: classItem.featured || false
      });
    } else {
      setEditingClass(null);
      const currentYear = new Date().getFullYear();
      setClassData({
        form_id: selectedForm !== 'all' ? selectedForm : (forms[0]?.form_id || ''),
        class_name: '',
        class_code: '',
        academic_year: `${currentYear}-${currentYear + 1}`,
        capacity: 35,
        form_tutor_id: '',
        room_number: '',
        description: '',
        thumbnail: '',
        syllabus: '',
        difficulty: 'intermediate',
        subject_area: '',
        published: false,
        featured: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setClassData({
      form_id: '',
      class_name: '',
      class_code: '',
      academic_year: '',
      capacity: 35,
      form_tutor_id: '',
      room_number: '',
      description: '',
      thumbnail: '',
      syllabus: '',
      difficulty: 'intermediate',
      subject_area: '',
      published: false,
      featured: false
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean up classData: convert empty strings to null for optional fields
    const cleanedData = {
      ...classData,
      form_id: classData.form_id ? parseInt(classData.form_id) : null,
      capacity: classData.capacity ? parseInt(classData.capacity) : 35,
      form_tutor_id: classData.form_tutor_id ? parseInt(classData.form_tutor_id) : null,
      room_number: classData.room_number || null,
      description: classData.description || null,
      class_code: classData.class_code || null
    };

    // Validate required fields
    if (!cleanedData.form_id) {
      setError('Form is required');
      return;
    }
    if (!cleanedData.class_name || cleanedData.class_name.trim() === '') {
      setError('Class name is required');
      return;
    }
    if (!cleanedData.academic_year || cleanedData.academic_year.trim() === '') {
      setError('Academic year is required');
      return;
    }

    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.class_id, data: cleanedData });
    } else {
      createClassMutation.mutate(cleanedData);
    }
  };

  const handleDelete = (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This will remove all student assignments and subject assignments.')) {
      deleteClassMutation.mutate(classId);
    }
  };

  const handleClassCodeChange = (className) => {
    // Auto-generate class code from class name
    if (className && !editingClass) {
      const code = className.toUpperCase().replace(/\s+/g, '');
      setClassData({ ...classData, class_name: className, class_code: code });
    } else {
      setClassData({ ...classData, class_name: className });
    }
  };

  // Filter classes
  const filteredClasses = classes.filter(c => {
    if (selectedForm === 'all') return true;
    return c.form_id === parseInt(selectedForm);
  });

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
        <h2>Class Management</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <FaPlus className="me-2" />
          Create Class
        </Button>
      </div>

      {/* Filter by Form */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Label>Filter by Form</Form.Label>
          <Form.Select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
          >
            <option value="all">All Forms</option>
            {forms.map(form => (
              <option key={form.form_id} value={form.form_id}>
                {form.form_number}{form.stream} ({form.academic_year})
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No classes found</p>
              <Button variant="primary" className="mt-3" onClick={() => handleOpenModal()}>
                Create First Class
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Class Code</th>
                  <th>Form</th>
                  <th>Academic Year</th>
                  <th>Form Tutor</th>
                  <th>Enrollment</th>
                  <th>Capacity</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.class_id}>
                    <td><strong>{classItem.class_name}</strong></td>
                    <td><Badge bg="secondary">{classItem.class_code}</Badge></td>
                    <td>
                      {classItem.form ? `${classItem.form.form_number}${classItem.form.stream || ''}` : 'N/A'}
                    </td>
                    <td>{classItem.academic_year}</td>
                    <td>{classItem.form_tutor?.name || 'Not assigned'}</td>
                    <td>
                      <Badge bg={classItem.current_enrollment >= classItem.capacity ? 'danger' : 'success'}>
                        {classItem.current_enrollment || 0} / {classItem.capacity}
                      </Badge>
                    </td>
                    <td>{classItem.capacity}</td>
                    <td>{classItem.room_number || '-'}</td>
                    <td>
                      <Badge bg={classItem.published ? 'success' : 'secondary'}>
                        {classItem.published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenModal(classItem)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => window.location.href = `/admin/classes/${classItem.class_id}/students`}
                      >
                        <FaUsers />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(classItem.class_id)}
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
            {editingClass ? 'Edit Class' : 'Create New Class'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Form *</Form.Label>
              <Form.Select
                value={classData.form_id}
                onChange={(e) => setClassData({ ...classData, form_id: e.target.value })}
                required
              >
                <option value="">Select Form</option>
                {forms.map(form => (
                  <option key={form.form_id} value={form.form_id}>
                    {form.form_number}{form.stream} ({form.academic_year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.class_name}
                    onChange={(e) => handleClassCodeChange(e.target.value)}
                    placeholder="e.g., 3A, 4Science, 5Arts"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.class_code}
                    onChange={(e) => setClassData({ ...classData, class_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., F3A, F4SCI"
                    required
                  />
                  <Form.Text className="text-muted">
                    Unique identifier for this class
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
                    value={classData.academic_year}
                    onChange={(e) => setClassData({ ...classData, academic_year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={classData.capacity}
                    onChange={(e) => setClassData({ ...classData, capacity: parseInt(e.target.value) || 35 })}
                  />
                  <Form.Text className="text-muted">
                    Default: 35 students
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Tutor</Form.Label>
                  <Form.Select
                    value={classData.form_tutor_id}
                    onChange={(e) => setClassData({ ...classData, form_tutor_id: e.target.value || null })}
                  >
                    <option value="">Not assigned</option>
                    {tutors.map(tutor => (
                      <option key={tutor.user_id} value={tutor.user_id}>
                        {tutor.name} ({tutor.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Room Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.room_number}
                    onChange={(e) => setClassData({ ...classData, room_number: e.target.value })}
                    placeholder="e.g., Room 101, Lab 2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={classData.description}
                onChange={(e) => setClassData({ ...classData, description: e.target.value })}
                placeholder="Optional description"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Thumbnail URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={classData.thumbnail}
                    onChange={(e) => setClassData({ ...classData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Form.Text className="text-muted">
                    Image URL for class banner/thumbnail
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Area</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.subject_area}
                    onChange={(e) => setClassData({ ...classData, subject_area: e.target.value })}
                    placeholder="e.g., Science, Arts, General"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Difficulty</Form.Label>
              <Form.Select
                value={classData.difficulty}
                onChange={(e) => setClassData({ ...classData, difficulty: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Syllabus</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={classData.syllabus}
                onChange={(e) => setClassData({ ...classData, syllabus: e.target.value })}
                placeholder="Rich text syllabus content (HTML supported)"
              />
              <Form.Text className="text-muted">
                Detailed syllabus for the class
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Published"
                  checked={classData.published}
                  onChange={(e) => setClassData({ ...classData, published: e.target.checked })}
                />
                <Form.Text className="text-muted">
                  Published classes are visible to all users and students can enroll
                </Form.Text>
              </Col>

              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Featured"
                  checked={classData.featured}
                  onChange={(e) => setClassData({ ...classData, featured: e.target.checked })}
                />
                <Form.Text className="text-muted">
                  Featured classes appear prominently in listings
                </Form.Text>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingClass ? 'Update' : 'Create'} Class
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ClassManagement;
