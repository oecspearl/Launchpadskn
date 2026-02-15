import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge, Tabs, Tab
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronRight,
  FaTimes, FaUserPlus, FaBook, FaUsers
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../../services/institutionService';
import { userService } from '../../services/userService';
import { classService } from '../../services/classService';
import { ROLES } from '../../constants/roles';

// ─── Inline detail panel for expanded class rows ────────────────────────────
function ClassDetailPanel({ classItem }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('subjects');

  // ── Subjects tab data ──
  const { data: classSubjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['class-subjects-inline', classItem.class_id],
    queryFn: () => classService.getSubjectsByClass(classItem.class_id),
    enabled: activeTab === 'subjects'
  });

  const { data: rawOfferings = [] } = useQuery({
    queryKey: ['offerings'],
    queryFn: () => institutionService.getCurriculumContent(null),
    enabled: activeTab === 'subjects'
  });

  // Deduplicate offerings by subject_name + form_number (national curriculum)
  const formOfferings = useMemo(() => {
    const seen = new Map();
    rawOfferings.forEach(o => {
      const key = `${(o.subject?.subject_name || '').toLowerCase().trim()}_${o.form?.form_number}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, o);
      } else if (o.curriculum_structure?.topics?.length > 0 && !existing.curriculum_structure?.topics?.length) {
        seen.set(key, o);
      }
    });
    return Array.from(seen.values());
  }, [rawOfferings]);

  const { data: teachers = [] } = useQuery({
    queryKey: ['tutors'],
    queryFn: async () => {
      const [admins, instructors] = await Promise.all([
        userService.getUsersByRole(ROLES.ADMIN),
        userService.getUsersByRole(ROLES.INSTRUCTOR)
      ]);
      const all = [...admins, ...instructors];
      return Array.from(new Map(all.map(item => [item.user_id, item])).values())
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: activeTab === 'subjects'
  });

  // ── Students tab data ──
  const { data: classRoster = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-roster', classItem.class_id],
    queryFn: () => classService.getClassRoster(classItem.class_id),
    enabled: activeTab === 'students'
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => userService.getUsersByRole(ROLES.STUDENT),
    enabled: activeTab === 'students'
  });

  // ── Subject mutations ──
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({ subject_offering_id: '', teacher_id: '' });
  const [subjectError, setSubjectError] = useState(null);

  const assignSubjectMutation = useMutation({
    mutationFn: (data) => classService.assignSubjectToClass(
      classItem.class_id, data.subject_offering_id, data.teacher_id
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subjects-inline', classItem.class_id]);
      queryClient.invalidateQueries(['class-subjects']);
      setShowSubjectForm(false);
      setSubjectFormData({ subject_offering_id: '', teacher_id: '' });
      setSubjectError(null);
    },
    onError: (err) => setSubjectError(err.message || 'Failed to assign subject')
  });

  const removeSubjectMutation = useMutation({
    mutationFn: (id) => classService.removeSubjectFromClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subjects-inline', classItem.class_id]);
      queryClient.invalidateQueries(['class-subjects']);
    }
  });

  // ── Student mutations ──
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentFormData, setStudentFormData] = useState({ student_id: '' });
  const [studentError, setStudentError] = useState(null);

  const assignStudentMutation = useMutation({
    mutationFn: (data) => classService.assignStudentToClass(
      data.student_id, classItem.class_id, classItem.academic_year
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-roster', classItem.class_id]);
      queryClient.invalidateQueries(['student-assignments']);
      queryClient.invalidateQueries(['classes']);
      setShowStudentForm(false);
      setStudentFormData({ student_id: '' });
      setStudentError(null);
    },
    onError: (err) => setStudentError(err.message || 'Failed to assign student')
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId) => classService.removeStudentFromClass(studentId, classItem.class_id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-roster', classItem.class_id]);
      queryClient.invalidateQueries(['student-assignments']);
      queryClient.invalidateQueries(['classes']);
    }
  });

  // Filter offerings by form_number (subjects are shared nationally, not per-school)
  const classFormNumber = classItem.form?.form_number;
  const relevantOfferings = formOfferings.filter(o => o.form?.form_number === classFormNumber);
  // Filter out students already in the roster
  const rosterStudentIds = new Set(classRoster.map(r => r.student_id));
  const availableStudents = allStudents.filter(s => !rosterStudentIds.has(s.user_id));

  return (
    <div className="bg-light p-3">
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="subjects" title={<span><FaBook className="me-1" /> Subjects ({classSubjects.length})</span>}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Assigned Subjects</h6>
            <Button size="sm" variant="outline-primary" onClick={() => setShowSubjectForm(!showSubjectForm)}>
              <FaPlus className="me-1" /> Add Subject
            </Button>
          </div>

          {subjectError && <Alert variant="danger" size="sm" dismissible onClose={() => setSubjectError(null)}>{subjectError}</Alert>}

          {showSubjectForm && (
            <Card className="mb-3 border">
              <Card.Body className="py-2">
                <Row className="align-items-end g-2">
                  <Col md={5}>
                    <Form.Label className="small mb-1">Subject Offering</Form.Label>
                    <Form.Select size="sm" value={subjectFormData.subject_offering_id}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, subject_offering_id: e.target.value })}>
                      <option value="">Select Subject</option>
                      {relevantOfferings.map(o => (
                        <option key={o.offering_id} value={o.offering_id}>
                          {o.subject?.subject_name} ({o.subject?.subject_code})
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small mb-1">Teacher</Form.Label>
                    <Form.Select size="sm" value={subjectFormData.teacher_id}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, teacher_id: e.target.value })}>
                      <option value="">Not assigned</option>
                      {teachers.map(t => (
                        <option key={t.user_id} value={t.user_id}>{t.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3} className="d-flex gap-2">
                    <Button size="sm" variant="primary"
                      onClick={() => assignSubjectMutation.mutate(subjectFormData)}
                      disabled={!subjectFormData.subject_offering_id || assignSubjectMutation.isLoading}>
                      {assignSubjectMutation.isLoading ? 'Assigning...' : 'Assign'}
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => setShowSubjectForm(false)}>
                      Cancel
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {isLoadingSubjects ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : classSubjects.length === 0 ? (
            <p className="text-muted small mb-0">No subjects assigned yet. Click "Add Subject" to get started.</p>
          ) : (
            <Table size="sm" hover className="mb-0">
              <thead><tr><th>Subject</th><th>Code</th><th>Teacher</th><th style={{ width: '50px' }}></th></tr></thead>
              <tbody>
                {classSubjects.map(cs => (
                  <tr key={cs.class_subject_id}>
                    <td>{cs.subject_offering?.subject?.subject_name || 'N/A'}</td>
                    <td><Badge bg="secondary">{cs.subject_offering?.subject?.subject_code || '-'}</Badge></td>
                    <td>{cs.teacher?.name || 'Not assigned'}</td>
                    <td>
                      <Button variant="outline-danger" size="sm"
                        onClick={() => {
                          if (window.confirm('Remove this subject from the class?')) {
                            removeSubjectMutation.mutate(cs.class_subject_id);
                          }
                        }}>
                        <FaTimes />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>

        <Tab eventKey="students" title={<span><FaUsers className="me-1" /> Students ({classRoster.length})</span>}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Enrolled Students</h6>
            <Button size="sm" variant="outline-primary" onClick={() => setShowStudentForm(!showStudentForm)}>
              <FaUserPlus className="me-1" /> Add Student
            </Button>
          </div>

          {studentError && <Alert variant="danger" size="sm" dismissible onClose={() => setStudentError(null)}>{studentError}</Alert>}

          {showStudentForm && (
            <Card className="mb-3 border">
              <Card.Body className="py-2">
                <Row className="align-items-end g-2">
                  <Col md={8}>
                    <Form.Label className="small mb-1">Student</Form.Label>
                    <Form.Select size="sm" value={studentFormData.student_id}
                      onChange={(e) => setStudentFormData({ ...studentFormData, student_id: e.target.value })}>
                      <option value="">Select Student</option>
                      {availableStudents.map(s => (
                        <option key={s.user_id} value={s.user_id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4} className="d-flex gap-2">
                    <Button size="sm" variant="primary"
                      onClick={() => assignStudentMutation.mutate(studentFormData)}
                      disabled={!studentFormData.student_id || assignStudentMutation.isLoading}>
                      {assignStudentMutation.isLoading ? 'Assigning...' : 'Assign'}
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => setShowStudentForm(false)}>
                      Cancel
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {isLoadingStudents ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : classRoster.length === 0 ? (
            <p className="text-muted small mb-0">No students enrolled yet. Click "Add Student" to get started.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table size="sm" hover className="mb-0">
                <thead><tr><th>Name</th><th>Email</th><th style={{ width: '50px' }}></th></tr></thead>
                <tbody>
                  {classRoster.map(r => (
                    <tr key={r.student_id}>
                      <td>{r.student?.name || 'N/A'}</td>
                      <td>{r.student?.email || 'N/A'}</td>
                      <td>
                        <Button variant="outline-danger" size="sm"
                          onClick={() => {
                            if (window.confirm(`Remove ${r.student?.name} from this class?`)) {
                              removeStudentMutation.mutate(r.student_id);
                            }
                          }}>
                          <FaTimes />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}

// ─── Main ClassManagement component ─────────────────────────────────────────
function ClassManagement({ institutionId }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isScoped = !!institutionId;
  const [selectedForm, setSelectedForm] = useState('all');
  const [expandedClassId, setExpandedClassId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [modalSchoolId, setModalSchoolId] = useState('');
  const [classData, setClassData] = useState({
    form_id: '',
    class_name: '',
    class_code: '',
    academic_year: '',
    capacity: 35,
    form_tutor_id: '',
    room_number: '',
    description: '',
    published: false
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Queries
  const { data: schools = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionService.getAllInstitutions(),
    enabled: !isScoped
  });

  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: isScoped ? ['forms', institutionId] : ['forms'],
    queryFn: () => institutionService.getFormsBySchool(isScoped ? institutionId : null)
  });

  const { data: tutors = [], isLoading: isLoadingTutors } = useQuery({
    queryKey: isScoped ? ['tutors', institutionId] : ['tutors'],
    queryFn: async () => {
      if (isScoped) {
        return userService.getUsersByInstitution(institutionId, ROLES.INSTRUCTOR);
      }
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
    queryKey: isScoped ? ['classes', institutionId] : ['classes'],
    queryFn: () => isScoped
      ? classService.getClassesByInstitution(institutionId)
      : classService.getClasses(ROLES.ADMIN)
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
    mutationFn: (id) => classService.updateClass(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setSuccess('Class deleted successfully');
      setExpandedClassId(null);
    },
    onError: (err) => setError(err.message || 'Failed to delete class')
  });

  // ── Helpers ──

  const getFormPrefix = (formId) => {
    const formObj = forms.find(f => String(f.form_id) === String(formId));
    return formObj ? `F${formObj.form_number}` : '';
  };

  const generateClassCode = (className, formId) => {
    const prefix = getFormPrefix(formId);
    return `${prefix}${className.toUpperCase().replace(/\s+/g, '')}`;
  };

  // Handlers
  const handleOpenModal = (classItem = null) => {
    const defaultSchoolId = schools.length === 1 ? schools[0].institutionId : '';

    if (classItem) {
      setEditingClass(classItem);
      // Look up the school from the form
      const formObj = forms.find(f => f.form_id === classItem.form_id);
      setModalSchoolId(formObj?.school_id || defaultSchoolId);
      setClassData({
        form_id: classItem.form_id || '',
        class_name: classItem.class_name || '',
        class_code: classItem.class_code || '',
        academic_year: classItem.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        capacity: classItem.capacity || 35,
        form_tutor_id: classItem.form_tutor_id || '',
        room_number: classItem.room_number || '',
        description: classItem.description || '',
        published: classItem.published || false
      });
    } else {
      setEditingClass(null);
      setModalSchoolId(defaultSchoolId);
      // If only one school, pre-select first form for that school
      const formsForSchool = defaultSchoolId
        ? forms.filter(f => String(f.school_id) === String(defaultSchoolId))
        : forms;
      const preselectedFormId = selectedForm !== 'all' ? selectedForm : (formsForSchool[0]?.form_id || '');
      const formObj = formsForSchool.find(f => String(f.form_id) === String(preselectedFormId));
      const academicYear = formObj?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      setClassData({
        form_id: preselectedFormId,
        class_name: '',
        class_code: '',
        academic_year: academicYear,
        capacity: 35,
        form_tutor_id: '',
        room_number: '',
        description: '',
        published: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setModalSchoolId('');
    setClassData({
      form_id: '',
      class_name: '',
      class_code: '',
      academic_year: '',
      capacity: 35,
      form_tutor_id: '',
      room_number: '',
      description: '',
      published: false
    });
    setError(null);
    setSuccess(null);
  };

  const handleModalSchoolChange = (schoolId) => {
    setModalSchoolId(schoolId);
    // Reset form selection when school changes
    setClassData(prev => ({
      ...prev,
      form_id: '',
      academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      class_code: prev.class_name && !editingClass ? '' : prev.class_code
    }));
  };

  const handleFormChange = (newFormId) => {
    const formObj = forms.find(f => String(f.form_id) === String(newFormId));
    const updates = { ...classData, form_id: newFormId };

    // Auto-populate academic year from the selected form
    if (formObj && formObj.academic_year) {
      updates.academic_year = formObj.academic_year;
    }

    // Re-generate class code if class_name exists and creating new
    if (classData.class_name && !editingClass) {
      updates.class_code = generateClassCode(classData.class_name, newFormId);
    }

    setClassData(updates);
  };

  const handleClassNameChange = (className) => {
    if (className && !editingClass) {
      const code = generateClassCode(className, classData.form_id);
      setClassData({ ...classData, class_name: className, class_code: code });
    } else {
      setClassData({ ...classData, class_name: className });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedData = {
      ...classData,
      form_id: classData.form_id ? parseInt(classData.form_id) : null,
      capacity: classData.capacity ? parseInt(classData.capacity) : 35,
      form_tutor_id: classData.form_tutor_id ? parseInt(classData.form_tutor_id) : null,
      room_number: classData.room_number || null,
      description: classData.description || null,
      class_code: classData.class_code || null
    };

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

  const toggleExpand = (classId) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
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
            {schools.length > 1 ? (
              schools.map(school => {
                const schoolForms = forms.filter(f => String(f.school_id) === String(school.institutionId));
                if (schoolForms.length === 0) return null;
                return (
                  <optgroup key={school.institutionId} label={school.name}>
                    {schoolForms.map(form => (
                      <option key={form.form_id} value={form.form_id}>
                        {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                      </option>
                    ))}
                  </optgroup>
                );
              })
            ) : (
              forms.map(form => (
                <option key={form.form_id} value={form.form_id}>
                  {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                </option>
              ))
            )}
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
                  <th>Room</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((classItem) => (
                  <React.Fragment key={classItem.class_id}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleExpand(classItem.class_id)}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          {expandedClassId === classItem.class_id ?
                            <FaChevronDown className="me-2 text-muted" size={12} /> :
                            <FaChevronRight className="me-2 text-muted" size={12} />
                          }
                          <strong>{classItem.class_name}</strong>
                        </div>
                      </td>
                      <td><Badge bg="secondary">{classItem.class_code}</Badge></td>
                      <td>
                        {classItem.form
                          ? (classItem.form.form_name || `Form ${classItem.form.form_number}`)
                          : 'N/A'}
                      </td>
                      <td>{classItem.academic_year}</td>
                      <td>{classItem.form_tutor?.name || 'Not assigned'}</td>
                      <td>
                        <Badge bg={classItem.current_enrollment >= classItem.capacity ? 'danger' : 'success'}>
                          {classItem.current_enrollment || 0} / {classItem.capacity}
                        </Badge>
                      </td>
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
                          className="me-1"
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(classItem); }}
                          title="Edit class"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(classItem.class_id); }}
                          title="Delete class"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                    {expandedClassId === classItem.class_id && (
                      <tr>
                        <td colSpan="9" className="p-0 border-top-0">
                          <ClassDetailPanel classItem={classItem} />
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

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingClass ? 'Edit Class' : 'Create New Class'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {schools.length > 1 ? (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>School *</Form.Label>
                    <Form.Select
                      value={modalSchoolId}
                      onChange={(e) => handleModalSchoolChange(e.target.value)}
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
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Form *</Form.Label>
                    <Form.Select
                      value={classData.form_id}
                      onChange={(e) => handleFormChange(e.target.value)}
                      required
                      disabled={!modalSchoolId}
                    >
                      <option value="">{modalSchoolId ? 'Select Form' : 'Select a school first'}</option>
                      {forms
                        .filter(f => String(f.school_id) === String(modalSchoolId))
                        .map(form => (
                          <option key={form.form_id} value={form.form_id}>
                            {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Form *</Form.Label>
                <Form.Select
                  value={classData.form_id}
                  onChange={(e) => handleFormChange(e.target.value)}
                  required
                >
                  <option value="">Select Form</option>
                  {forms.map(form => (
                    <option key={form.form_id} value={form.form_id}>
                      {form.form_name || `Form ${form.form_number}`} ({form.academic_year})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={classData.class_name}
                    onChange={(e) => handleClassNameChange(e.target.value)}
                    placeholder="e.g., A, Blue, Science"
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
                    Auto-generated from form + class name
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
                  <Form.Text className="text-muted">
                    Auto-filled from the selected form
                  </Form.Text>
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
                rows={2}
                value={classData.description}
                onChange={(e) => setClassData({ ...classData, description: e.target.value })}
                placeholder="Optional description"
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Published"
              checked={classData.published}
              onChange={(e) => setClassData({ ...classData, published: e.target.checked })}
            />
            <Form.Text className="text-muted">
              Published classes are visible to students for enrollment
            </Form.Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit"
              disabled={createClassMutation.isLoading || updateClassMutation.isLoading}>
              {editingClass ? 'Update' : 'Create'} Class
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ClassManagement;
