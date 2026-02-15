import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Table, Modal, Form, Badge
} from 'react-bootstrap';
import {
  FaPlus, FaTrash, FaBook, FaChartLine, FaUsers, FaGamepad
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { institutionService } from '../../services/institutionService';
import { classService } from '../../services/classService';
import { ROLES } from '../../constants/roles';
import CurriculumAnalytics from './CurriculumAnalytics';
import CollaborationHub from '../Collaboration/CollaborationHub';
import InteractiveContentHub from '../InteractiveContent/InteractiveContentHub';

function ClassSubjectAssignment() {
  const queryClient = useQueryClient();
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showInteractiveContent, setShowInteractiveContent] = useState(false);
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [modalSchoolId, setModalSchoolId] = useState('');
  const [modalFormId, setModalFormId] = useState('');
  const [assignmentData, setAssignmentData] = useState({
    class_id: '',
    subject_offering_id: '',
    teacher_id: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Queries
  const { data: schools = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionService.getAllInstitutions()
  });

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

  const hasMultipleSchools = schools.length > 1;

  // Build a school lookup from forms (forms have school data joined)
  const schoolMap = useMemo(() => {
    const map = {};
    forms.forEach(f => {
      if (f.school) {
        map[f.school.institution_id || f.school_id] = f.school.name;
      }
    });
    return map;
  }, [forms]);

  // Filtered forms based on selected school
  const filteredForms = useMemo(() => {
    if (selectedSchool === 'all') return forms;
    return forms.filter(f => String(f.school_id) === String(selectedSchool));
  }, [forms, selectedSchool]);

  // Filtered classes based on selected form (and indirectly school)
  const filteredClassOptions = useMemo(() => {
    if (selectedForm === 'all') {
      if (selectedSchool === 'all') return classes;
      // Filter classes by forms belonging to the selected school
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

  // Modal: offerings filtered by form_number (subjects are shared nationally)
  const modalOfferings = useMemo(() => {
    if (!modalFormId) return [];
    const selectedFormObj = forms.find(f => f.form_id === parseInt(modalFormId));
    if (!selectedFormObj) return [];
    return formOfferings.filter(o => o.form?.form_number === selectedFormObj.form_number);
  }, [formOfferings, modalFormId, forms]);

  // Resolve school name for a class subject
  const getSchoolName = (classSubject) => {
    const formId = classSubject.class?.form_id;
    if (!formId) return 'N/A';
    const formObj = forms.find(f => f.form_id === formId);
    if (!formObj) return 'N/A';
    return formObj.school?.name || schoolMap[formObj.school_id] || 'N/A';
  };

  // Mutations
  const assignSubjectMutation = useMutation({
    mutationFn: (data) => classService.assignSubjectToClass(data.class_id, data.subject_offering_id, data.teacher_id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subjects']);
      queryClient.invalidateQueries(['class-subjects-inline']);
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
      queryClient.invalidateQueries(['class-subjects-inline']);
      setSuccess('Subject removed from class successfully');
    },
    onError: (err) => setError(err.message || 'Failed to remove subject')
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
    // If a filter is active, pre-populate modal
    const preSchool = selectedSchool !== 'all' ? selectedSchool : defaultSchoolId;
    const preForm = selectedForm !== 'all' ? selectedForm : '';
    const preClass = selectedClass !== 'all' ? selectedClass : '';

    setModalSchoolId(preSchool ? String(preSchool) : '');
    setModalFormId(preForm ? String(preForm) : '');
    setAssignmentData({
      class_id: preClass || '',
      subject_offering_id: '',
      teacher_id: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalSchoolId('');
    setModalFormId('');
    setAssignmentData({
      class_id: '',
      subject_offering_id: '',
      teacher_id: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleModalSchoolChange = (schoolId) => {
    setModalSchoolId(schoolId);
    setModalFormId('');
    setAssignmentData({ class_id: '', subject_offering_id: '', teacher_id: '' });
  };

  const handleModalFormChange = (formId) => {
    setModalFormId(formId);
    setAssignmentData({ ...assignmentData, class_id: '', subject_offering_id: '' });
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

  // Filter assignments by school, form and class
  const filteredAssignments = useMemo(() => {
    return classSubjects.filter(cs => {
      if (selectedSchool !== 'all') {
        const formObj = forms.find(f => f.form_id === cs.class?.form_id);
        if (!formObj || String(formObj.school_id) !== String(selectedSchool)) return false;
      }
      if (selectedForm !== 'all') {
        if (cs.class?.form_id !== parseInt(selectedForm)) return false;
      }
      if (selectedClass !== 'all') {
        if (cs.class_id.toString() !== selectedClass) return false;
      }
      return true;
    });
  }, [classSubjects, selectedSchool, selectedForm, selectedClass, forms]);

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
        {hasMultipleSchools && (
          <Col md={4}>
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
        <Col md={hasMultipleSchools ? 4 : 6}>
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
        <Col md={hasMultipleSchools ? 4 : 6}>
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
      </Row>

      {/* Class-Subject Assignments */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaBook className="me-2" />
            Current Assignments
            <Badge bg="secondary" className="ms-2">{filteredAssignments.length}</Badge>
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
                  {hasMultipleSchools && <th>School</th>}
                  <th>Form</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Subject Code</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((classSubject) => (
                  <tr key={classSubject.class_subject_id}>
                    {hasMultipleSchools && (
                      <td>{getSchoolName(classSubject)}</td>
                    )}
                    <td>
                      {classSubject.class?.form
                        ? (classSubject.class.form.form_name || `Form ${classSubject.class.form.form_number}`)
                        : 'N/A'}
                    </td>
                    <td>
                      <Badge bg="primary">{classSubject.class?.class_name || 'N/A'}</Badge>
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
                        variant="outline-success"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setSelectedClassSubject(classSubject);
                          setShowCollaboration(true);
                        }}
                        title="Open Collaboration Hub"
                      >
                        <FaUsers />
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setSelectedClassSubject(classSubject);
                          setShowInteractiveContent(true);
                        }}
                        title="Interactive Content"
                      >
                        <FaGamepad />
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
                onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value, subject_offering_id: '' })}
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

            {/* Subject Offering selector */}
            <Form.Group className="mb-3">
              <Form.Label>Subject Offering *</Form.Label>
              <Form.Select
                value={assignmentData.subject_offering_id}
                onChange={(e) => setAssignmentData({ ...assignmentData, subject_offering_id: e.target.value })}
                required
                disabled={!modalFormId}
              >
                <option value="">
                  {!modalFormId ? 'Select a form first' : 'Select Subject Offering'}
                </option>
                {modalOfferings.map(offering => (
                  <option key={offering.offering_id} value={offering.offering_id}>
                    {offering.subject?.subject_name} ({offering.subject?.subject_code})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Only subjects offered for the selected form are shown
              </Form.Text>
            </Form.Group>

            {/* Teacher selector */}
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

      {/* Collaboration Hub Modal */}
      <Modal
        show={showCollaboration}
        onHide={() => {
          setShowCollaboration(false);
          setSelectedClassSubject(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" />
            Collaboration Hub
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClassSubject && (
            <CollaborationHub
              classSubjectId={selectedClassSubject.class_subject_id}
              classSubject={selectedClassSubject}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowCollaboration(false);
            setSelectedClassSubject(null);
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Interactive Content Hub Modal */}
      <Modal
        show={showInteractiveContent}
        onHide={() => {
          setShowInteractiveContent(false);
          setSelectedClassSubject(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaGamepad className="me-2" />
            Interactive Content
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClassSubject && (
            <InteractiveContentHub
              classSubjectId={selectedClassSubject.class_subject_id}
              classSubject={selectedClassSubject}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowInteractiveContent(false);
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
