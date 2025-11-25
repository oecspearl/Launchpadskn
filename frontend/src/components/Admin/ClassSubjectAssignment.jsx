import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import {
  FaPlus, FaTrash, FaBook, FaChartLine
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { institutionService } from '../../services/institutionService';
import { classService } from '../../services/classService';
import { ROLES } from '../../constants/roles';
import CurriculumAnalytics from './CurriculumAnalytics';
import CurriculumAnalytics from './CurriculumAnalytics';

function ClassSubjectAssignment() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    class_id: '',
    subject_offering_id: '',
    teacher_id: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Queries
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
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

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses(ROLES.ADMIN)
  });

  const { data: formOfferings = [], isLoading: isLoadingOfferings } = useQuery({
    queryKey: ['offerings'],
    queryFn: () => institutionService.getCurriculumContent(null)
  });

  const { data: classSubjects = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['class-subjects', selectedClass],
    queryFn: () => classService.getAllClassSubjects({ classId: selectedClass })
  });

  const isLoading = isLoadingTeachers || isLoadingForms || isLoadingClasses || isLoadingOfferings || isLoadingAssignments;

  // Mutations
  const assignSubjectMutation = useMutation({
    mutationFn: (data) => classService.assignSubjectToClass(data.class_id, data.subject_offering_id, data.teacher_id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subjects']);
      setSuccess('Subject assigned to class successfully');
      handleCloseModal();
    },
    onError: (err) => {
      let errorMessage = 'Failed to assign subject';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === '23505') {
        errorMessage = 'This subject is already assigned to this class';
      } else if (err.code === '23503') {
        errorMessage = 'Invalid class, subject offering, or teacher selected';
      }
      setError(errorMessage);
    }
  });

  const removeSubjectMutation = useMutation({
    mutationFn: (id) => classService.removeSubjectFromClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subjects']);
      setSuccess('Subject removed from class successfully');
    },
    onError: (err) => setError(err.message || 'Failed to remove subject')
  });

  // Handlers
  const handleOpenModal = () => {
    setAssignmentData({
      class_id: selectedClass !== 'all' ? selectedClass : (classes[0]?.class_id || ''),
      subject_offering_id: '',
      teacher_id: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAssignmentData({
      class_id: '',
      subject_offering_id: '',
      teacher_id: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assignmentData.class_id || !assignmentData.subject_offering_id) {
      setError('Please select both Class and Subject Offering');
      return;
    }
    assignSubjectMutation.mutate(assignmentData);
  };

  const handleRemove = (classSubjectId) => {
    if (window.confirm('Are you sure you want to remove this subject from the class? This action cannot be undone.')) {
      removeSubjectMutation.mutate(classSubjectId);
    }
  };

  // Filter classes by form
  const filteredClasses = classes.filter(c => {
    if (selectedForm === 'all') return true;
    return c.form_id === parseInt(selectedForm);
  }).filter(c => {
    if (selectedClass === 'all') return true;
    return c.class_id.toString() === selectedClass;
  });

  // Filter assignments by form and class
  const filteredAssignments = classSubjects.filter(cs => {
    if (selectedForm !== 'all') {
      if (cs.class?.form_id !== parseInt(selectedForm)) return false;
    }
    if (selectedClass !== 'all') {
      if (cs.class_id.toString() !== selectedClass) return false;
    }
    return true;
  });

  // Get forms for filter (derived from classes to ensure relevance, or use fetched forms)
  // Using fetched forms is better as it includes all active forms

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
        <h2>Class-Subject Assignment</h2>
        <Button variant="primary" onClick={handleOpenModal}>
          <FaPlus className="me-2" />
          Assign Subject to Class
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Filters */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Label>Filter by Form</Form.Label>
          <Form.Select
            value={selectedForm}
            onChange={(e) => {
              setSelectedForm(e.target.value);
              setSelectedClass('all');
            }}
          >
            <option value="all">All Forms</option>
            {forms.map(form => (
              <option key={form.form_id} value={form.form_id}>
                {form.form_number}{form.stream} ({form.academic_year})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Label>Filter by Class</Form.Label>
          <Form.Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes
              .filter(c => selectedForm === 'all' || c.form_id === parseInt(selectedForm))
              .map(classItem => (
                <option key={classItem.class_id} value={classItem.class_id}>
                  {classItem.form?.form_number}{classItem.form?.stream} - {classItem.class_name}
                </option>
              ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Class-Subject Assignments */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaBook className="me-2" />
            Current Assignments
          </h5>
        </Card.Header>
        <Card.Body>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No subject assignments found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Form</th>
                  <th>Subject</th>
                  <th>Subject Code</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((classSubject) => (
                  <tr key={classSubject.class_subject_id}>
                    <td>
                      <Badge bg="primary">{classSubject.class?.class_name || 'N/A'}</Badge>
                    </td>
                    <td>
                      {classSubject.class?.form ? `${classSubject.class.form.form_number}${classSubject.class.form.stream || ''}` : 'N/A'}
                    </td>
                    <td><strong>{classSubject.subject_offering?.subject?.subject_name || 'N/A'}</strong></td>
                    <td>{classSubject.subject_offering?.subject?.subject_code || 'N/A'}</td>
                    <td>{classSubject.teacher?.name || 'Not assigned'}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setSelectedClassSubject(classSubject);
                          setShowAnalytics(true);
                        }}
                        title="View Curriculum Analytics"
                      >
                        <FaChartLine />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemove(classSubject.class_subject_id)}
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

      {/* Assignment Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Subject to Class</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Class *</Form.Label>
              <Form.Select
                value={assignmentData.class_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value })}
                required
              >
                <option value="">Select Class</option>
                {classes
                  .filter(c => selectedForm === 'all' || c.form_id === parseInt(selectedForm))
                  .map(classItem => (
                    <option key={classItem.class_id} value={classItem.class_id}>
                      {classItem.form?.form_number}{classItem.form?.stream} - {classItem.class_name} ({classItem.academic_year})
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject Offering *</Form.Label>
              <Form.Select
                value={assignmentData.subject_offering_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, subject_offering_id: e.target.value })}
                required
              >
                <option value="">Select Subject Offering</option>
                {formOfferings.map(offering => {
                  // Only show offerings that match the selected class's form
                  if (assignmentData.class_id) {
                    const selectedClassObj = classes.find(c => c.class_id.toString() === assignmentData.class_id.toString());
                    if (selectedClassObj && offering.form_id !== selectedClassObj.form_id) {
                      return null;
                    }
                  } else if (selectedForm !== 'all') {
                    if (offering.form_id !== parseInt(selectedForm)) return null;
                  }
                  return (
                    <option key={offering.offering_id} value={offering.offering_id}>
                      {offering.subject?.subject_name} ({offering.subject?.subject_code}) - {offering.form?.form_number}{offering.form?.stream}
                    </option>
                  );
                })}
              </Form.Select>
              <Form.Text className="text-muted">
                Only subjects offered for the selected class's form are shown
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Teacher</Form.Label>
              <Form.Select
                value={assignmentData.teacher_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, teacher_id: e.target.value || null })}
              >
                <option value="">Not assigned</option>
                {teachers.map(teacher => (
                  <option key={teacher.user_id} value={teacher.user_id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                You can assign a teacher now or later
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Subject
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Curriculum Analytics Modal */}
      <Modal
        show={showAnalytics}
        onHide={() => {
          setShowAnalytics(false);
          setSelectedClassSubject(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaChartLine className="me-2" />
            Curriculum Analytics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClassSubject && (
            <CurriculumAnalytics
              classSubjectId={selectedClassSubject.class_subject_id}
              classSubject={selectedClassSubject}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAnalytics(false);
            setSelectedClassSubject(null);
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

      {/* Curriculum Analytics Modal */}
      <Modal
        show={showAnalytics}
        onHide={() => {
          setShowAnalytics(false);
          setSelectedClassSubject(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaChartLine className="me-2" />
            Curriculum Analytics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClassSubject && (
            <CurriculumAnalytics
              classSubjectId={selectedClassSubject.class_subject_id}
              classSubject={selectedClassSubject}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAnalytics(false);
            setSelectedClassSubject(null);
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ClassSubjectAssignment;
