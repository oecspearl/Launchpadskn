import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import {
  FaUserPlus, FaUsers
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { institutionService } from '../../services/institutionService';
import { classService } from '../../services/classService';
import { ROLES } from '../../constants/roles';

function StudentAssignment() {
  const queryClient = useQueryClient();
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalSchoolId, setModalSchoolId] = useState('');
  const [modalFormId, setModalFormId] = useState('');
  const [assignmentData, setAssignmentData] = useState({
    student_id: '',
    class_id: '',
    academic_year: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Queries
  const { data: schools = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionService.getAllInstitutions()
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => userService.getUsersByRole(ROLES.STUDENT)
  });

  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms'],
    queryFn: () => institutionService.getFormsBySchool(null)
  });

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses(ROLES.ADMIN)
  });

  const { data: classAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['student-assignments', selectedClass],
    queryFn: () => classService.getAllStudentAssignments({ classId: selectedClass })
  });

  const isLoading = isLoadingStudents || isLoadingForms || isLoadingClasses || isLoadingAssignments;

  const hasMultipleSchools = schools.length > 1;

  // Filtered forms based on selected school
  const filteredForms = useMemo(() => {
    if (selectedSchool === 'all') return forms;
    return forms.filter(f => String(f.school_id) === String(selectedSchool));
  }, [forms, selectedSchool]);

  // Filtered classes based on selected form (and indirectly school)
  const filteredClassOptions = useMemo(() => {
    if (selectedForm === 'all') {
      if (selectedSchool === 'all') return classes;
      const schoolFormIds = filteredForms.map(f => f.form_id);
      return classes.filter(c => schoolFormIds.includes(c.form_id));
    }
    return classes.filter(c => c.form_id === parseInt(selectedForm));
  }, [classes, selectedForm, selectedSchool, filteredForms]);

  // Modal: forms filtered by modal school
  const modalForms = useMemo(() => {
    if (!modalSchoolId) return forms;
    return forms.filter(f => String(f.school_id) === String(modalSchoolId));
  }, [forms, modalSchoolId]);

  // Modal: classes filtered by modal form
  const modalClasses = useMemo(() => {
    if (!modalFormId) return [];
    return classes.filter(c => c.form_id === parseInt(modalFormId));
  }, [classes, modalFormId]);

  // Resolve school name for an assignment
  const getSchoolName = (assignment) => {
    const formId = assignment.class?.form_id;
    if (!formId) return 'N/A';
    const formObj = forms.find(f => f.form_id === formId);
    return formObj?.school?.name || 'N/A';
  };

  // Mutations
  const assignStudentMutation = useMutation({
    mutationFn: (data) => classService.assignStudentToClass(data.student_id, data.class_id, data.academic_year),
    onSuccess: () => {
      queryClient.invalidateQueries(['student-assignments']);
      queryClient.invalidateQueries(['class-roster']);
      queryClient.invalidateQueries(['classes']);
      setSuccess('Student assigned to class successfully');
      handleCloseModal();
    },
    onError: (err) => setError(err.message || 'Failed to assign student')
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ studentId, classId }) => classService.removeStudentFromClass(studentId, classId),
    onSuccess: () => {
      queryClient.invalidateQueries(['student-assignments']);
      queryClient.invalidateQueries(['class-roster']);
      queryClient.invalidateQueries(['classes']);
      setSuccess('Student removed from class successfully');
    },
    onError: (err) => setError(err.message || 'Failed to remove student')
  });

  // Handlers
  const handleSchoolChange = (schoolId) => {
    setSelectedSchool(schoolId);
    setSelectedForm('all');
    setSelectedClass('all');
  };

  const handleFormChange = (formId) => {
    setSelectedForm(formId);
    setSelectedClass('all');
  };

  const handleOpenModal = () => {
    const defaultSchoolId = schools.length === 1 ? (schools[0].institutionId || schools[0].institution_id) : '';
    const preSchool = selectedSchool !== 'all' ? selectedSchool : defaultSchoolId;
    const preForm = selectedForm !== 'all' ? selectedForm : '';
    const preClass = selectedClass !== 'all' ? selectedClass : '';

    // Derive academic year from selected form or default
    const currentYear = new Date().getFullYear();
    let academicYear = `${currentYear}-${currentYear + 1}`;
    if (preForm) {
      const formObj = forms.find(f => String(f.form_id) === String(preForm));
      if (formObj?.academic_year) academicYear = formObj.academic_year;
    }

    setModalSchoolId(preSchool ? String(preSchool) : '');
    setModalFormId(preForm ? String(preForm) : '');
    setAssignmentData({
      student_id: '',
      class_id: preClass || '',
      academic_year: academicYear
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalSchoolId('');
    setModalFormId('');
    setAssignmentData({
      student_id: '',
      class_id: '',
      academic_year: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleModalSchoolChange = (schoolId) => {
    setModalSchoolId(schoolId);
    setModalFormId('');
    setAssignmentData({ ...assignmentData, class_id: '' });
  };

  const handleModalFormChange = (formId) => {
    setModalFormId(formId);
    const formObj = forms.find(f => String(f.form_id) === String(formId));
    setAssignmentData({
      ...assignmentData,
      class_id: '',
      academic_year: formObj?.academic_year || assignmentData.academic_year
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assignmentData.student_id || !assignmentData.class_id) {
      setError('Please select both a student and a class');
      return;
    }
    assignStudentMutation.mutate(assignmentData);
  };

  const handleRemove = (assignmentId, studentId, classId) => {
    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      removeStudentMutation.mutate({ studentId, classId });
    }
  };

  // Filter assignments by school, form, class, and search
  const filteredAssignments = useMemo(() => {
    return classAssignments.filter(a => {
      if (selectedSchool !== 'all') {
        const formObj = forms.find(f => f.form_id === a.class?.form_id);
        if (!formObj || String(formObj.school_id) !== String(selectedSchool)) return false;
      }
      if (selectedForm !== 'all') {
        if (a.class?.form_id !== parseInt(selectedForm)) return false;
      }
      if (selectedClass !== 'all') {
        if (String(a.class_id) !== String(selectedClass)) return false;
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          a.student?.name?.toLowerCase().includes(searchLower) ||
          a.student?.email?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [classAssignments, selectedSchool, selectedForm, selectedClass, searchTerm, forms]);

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const searchLower = searchTerm.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(searchLower) ||
      s.email?.toLowerCase().includes(searchLower)
    );
  }, [students, searchTerm]);

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
        <h2>Student Class Assignment</h2>
        <Button variant="primary" onClick={handleOpenModal}>
          <FaUserPlus className="me-2" />
          Assign Student to Class
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Filters */}
      <Row className="mb-3">
        {hasMultipleSchools && (
          <Col md={3}>
            <Form.Label>Filter by School</Form.Label>
            <Form.Select
              value={selectedSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
            >
              <option value="all">All Schools</option>
              {schools.map(school => (
                <option key={school.institutionId || school.institution_id} value={school.institutionId || school.institution_id}>
                  {school.name}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}
        <Col md={hasMultipleSchools ? 3 : 4}>
          <Form.Label>Filter by Form</Form.Label>
          <Form.Select
            value={selectedForm}
            onChange={(e) => handleFormChange(e.target.value)}
          >
            <option value="all">All Forms</option>
            {hasMultipleSchools && selectedSchool === 'all' ? (
              schools.map(school => {
                const schoolForms = forms.filter(f => String(f.school_id) === String(school.institutionId || school.institution_id));
                if (schoolForms.length === 0) return null;
                return (
                  <optgroup key={school.institutionId || school.institution_id} label={school.name}>
                    {schoolForms.map(form => (
                      <option key={form.form_id} value={form.form_id}>
                        {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                      </option>
                    ))}
                  </optgroup>
                );
              })
            ) : (
              filteredForms.map(form => (
                <option key={form.form_id} value={form.form_id}>
                  {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                </option>
              ))
            )}
          </Form.Select>
        </Col>
        <Col md={hasMultipleSchools ? 3 : 4}>
          <Form.Label>Filter by Class</Form.Label>
          <Form.Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {filteredClassOptions.map(classItem => (
              <option key={classItem.class_id} value={classItem.class_id}>
                {classItem.form?.form_name || `Form ${classItem.form?.form_number || '?'}`} - {classItem.class_name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={hasMultipleSchools ? 3 : 4}>
          <Form.Label>Search Students</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>

      {/* Class Assignments Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaUsers className="me-2" />
            Class Assignments
            <Badge bg="secondary" className="ms-2">{filteredAssignments.length}</Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No class assignments found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  {hasMultipleSchools && <th>School</th>}
                  <th>Student</th>
                  <th>Email</th>
                  <th>Form</th>
                  <th>Class</th>
                  <th>Academic Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    {hasMultipleSchools && (
                      <td>{getSchoolName(assignment)}</td>
                    )}
                    <td>{assignment.student?.name || 'N/A'}</td>
                    <td>{assignment.student?.email || 'N/A'}</td>
                    <td>
                      {assignment.class?.form
                        ? (assignment.class.form.form_name || `Form ${assignment.class.form.form_number}`)
                        : 'N/A'}
                    </td>
                    <td>
                      <Badge bg="primary">{assignment.class?.class_name || 'N/A'}</Badge>
                    </td>
                    <td>{assignment.academic_year}</td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemove(
                          assignment.assignment_id,
                          assignment.student_id,
                          assignment.class_id
                        )}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Available Students */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">All Students</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.slice(0, 20).map((student) => {
                const assignment = classAssignments.find(a => a.student_id === student.user_id);
                return (
                  <tr key={student.user_id}>
                    <td>{student.name || 'N/A'}</td>
                    <td>{student.email}</td>
                    <td>
                      {assignment ? (
                        <Badge bg="success">
                          {assignment.class?.form?.form_name || `Form ${assignment.class?.form?.form_number}`} - {assignment.class?.class_name}
                        </Badge>
                      ) : (
                        <Badge bg="secondary">Not assigned</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg={student.is_active ? 'success' : 'secondary'}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {filteredStudents.length > 20 && (
            <p className="text-muted text-center mt-3">
              Showing 20 of {filteredStudents.length} students
            </p>
          )}
        </Card.Body>
      </Card>

      {/* Assignment Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Student to Class</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* School selector (multi-school only) */}
            {hasMultipleSchools && (
              <Form.Group className="mb-3">
                <Form.Label>School *</Form.Label>
                <Form.Select
                  value={modalSchoolId}
                  onChange={(e) => handleModalSchoolChange(e.target.value)}
                  required
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.institutionId || school.institution_id} value={school.institutionId || school.institution_id}>
                      {school.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {/* Form selector */}
            <Form.Group className="mb-3">
              <Form.Label>Form *</Form.Label>
              <Form.Select
                value={modalFormId}
                onChange={(e) => handleModalFormChange(e.target.value)}
                required
                disabled={hasMultipleSchools && !modalSchoolId}
              >
                <option value="">
                  {hasMultipleSchools && !modalSchoolId ? 'Select a school first' : 'Select Form'}
                </option>
                {modalForms.map(form => (
                  <option key={form.form_id} value={form.form_id}>
                    {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Class selector */}
            <Form.Group className="mb-3">
              <Form.Label>Class *</Form.Label>
              <Form.Select
                value={assignmentData.class_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value })}
                required
                disabled={!modalFormId}
              >
                <option value="">
                  {!modalFormId ? 'Select a form first' : 'Select Class'}
                </option>
                {modalClasses.map(classItem => (
                  <option key={classItem.class_id} value={classItem.class_id}>
                    {classItem.class_name} ({classItem.class_code || classItem.academic_year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Student selector */}
            <Form.Group className="mb-3">
              <Form.Label>Student *</Form.Label>
              <Form.Select
                value={assignmentData.student_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, student_id: e.target.value })}
                required
              >
                <option value="">Select Student</option>
                {students.map(student => {
                  const hasAssignment = classAssignments.some(a =>
                    a.student_id === student.user_id &&
                    a.academic_year === assignmentData.academic_year
                  );
                  return (
                    <option
                      key={student.user_id}
                      value={student.user_id}
                      disabled={hasAssignment}
                    >
                      {student.name} ({student.email})
                      {hasAssignment && ' - Already assigned'}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>

            {/* Academic Year */}
            <Form.Group className="mb-3">
              <Form.Label>Academic Year *</Form.Label>
              <Form.Control
                type="text"
                value={assignmentData.academic_year}
                onChange={(e) => setAssignmentData({ ...assignmentData, academic_year: e.target.value })}
                placeholder="e.g., 2024-2025"
                required
              />
              <Form.Text className="text-muted">
                Auto-filled from the selected form
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Student
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default StudentAssignment;
