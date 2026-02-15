import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Form, InputGroup, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { FaSearch, FaUserGraduate, FaEye, FaInfoCircle } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { classService } from '../../services/classService';
import { institutionService } from '../../services/institutionService';
import { ROLES } from '../../constants/roles';
import Breadcrumb from '../common/Breadcrumb';
import StudentInformationManagement from './StudentInformationManagement';

/**
 * StudentManagement - View and filter students by school, form, and class.
 *
 * @param {number|string} [institutionId] - When provided, scopes ALL data to
 *   this institution. Used by SchoolAdmin and Teacher views so they only see
 *   students from their own organisation.  When omitted the global admin view
 *   is shown (all schools, with a school filter).
 */
function StudentManagement({ institutionId }) {
  const isScoped = !!institutionId;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const breadcrumbItems = isScoped
    ? [
        { label: 'Dashboard', path: '/school-admin/dashboard', type: 'dashboard' },
        { label: 'Students', type: 'student' }
      ]
    : [
        { label: 'Dashboard', path: '/admin/dashboard', type: 'dashboard' },
        { label: 'Student Management', type: 'student' }
      ];

  // ── Queries (scoped vs global) ──
  const { data: schools = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionService.getAllInstitutions(),
    enabled: !isScoped
  });

  const { data: scopedSchool } = useQuery({
    queryKey: ['institution', institutionId],
    queryFn: () => institutionService.getInstitutionById(institutionId),
    enabled: isScoped
  });

  const { data: forms = [] } = useQuery({
    queryKey: isScoped ? ['forms', institutionId] : ['forms'],
    queryFn: () => institutionService.getFormsBySchool(isScoped ? institutionId : null)
  });

  const { data: classes = [] } = useQuery({
    queryKey: isScoped ? ['classes', institutionId] : ['classes'],
    queryFn: () => isScoped
      ? classService.getClassesByInstitution(Number(institutionId))
      : classService.getClasses(ROLES.ADMIN)
  });

  const { data: allStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: isScoped ? ['students', institutionId] : ['students'],
    queryFn: () => isScoped
      ? userService.getUsersByInstitution(institutionId, ROLES.STUDENT)
      : userService.getUsersByRole(ROLES.STUDENT)
  });

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: isScoped ? ['student-assignments', institutionId] : ['student-assignments-all'],
    queryFn: () => classService.getAllStudentAssignments(isScoped ? { institutionId } : {})
  });

  const isLoading = isLoadingStudents || isLoadingAssignments;

  // ── Build lookup: studentId → assignment info ──
  const assignmentMap = useMemo(() => {
    const map = {};
    assignments.forEach(a => {
      if (!a.student) return;
      const sid = a.student_id || a.student?.user_id;
      if (sid && !map[sid]) {
        map[sid] = a;
      }
    });
    return map;
  }, [assignments]);

  // ── Enrich students with class/form/school data ──
  const enrichedStudents = useMemo(() => {
    return allStudents.map(student => {
      const sid = student.user_id || student.id;
      const assignment = assignmentMap[sid];
      const cls = assignment?.class;
      const form = cls?.form;
      return {
        userId: sid,
        name: student.name || student.email,
        email: student.email,
        isActive: student.is_active !== false,
        phone: student.phone || '',
        address: student.address || '',
        dateOfBirth: student.date_of_birth || null,
        createdAt: student.created_at,
        emergencyContact: student.emergency_contact,
        // Class/form/school info
        className: cls?.class_name || null,
        classId: cls?.class_id || null,
        formName: form?.form_name || (form?.form_number ? `Form ${form.form_number}` : null),
        formId: form?.form_id || null,
        schoolId: form?.school_id || student.institution_id || null,
        schoolName: isScoped
          ? (scopedSchool?.name || null)
          : null, // resolved below for global view
      };
    });
  }, [allStudents, assignmentMap, isScoped, scopedSchool]);

  // Resolve school names (global admin view only)
  const studentsWithSchools = useMemo(() => {
    if (isScoped) return enrichedStudents;
    if (schools.length === 0) return enrichedStudents;
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.institutionId] = s.name; });
    return enrichedStudents.map(s => ({
      ...s,
      schoolName: s.schoolId ? schoolMap[s.schoolId] || null : null
    }));
  }, [enrichedStudents, schools, isScoped]);

  // ── Cascading filter options ──
  const filteredForms = useMemo(() => {
    if (isScoped) return forms; // already scoped by query
    if (selectedSchool === 'all') return forms;
    return forms.filter(f => String(f.school_id) === String(selectedSchool));
  }, [forms, selectedSchool, isScoped]);

  const filteredClasses = useMemo(() => {
    if (isScoped) {
      // Scoped: filter classes by selected form only
      if (selectedForm !== 'all') {
        return classes.filter(c => String(c.form_id) === String(selectedForm));
      }
      return classes;
    }
    let cls = classes;
    if (selectedForm !== 'all') {
      cls = cls.filter(c => String(c.form_id) === String(selectedForm));
    } else if (selectedSchool !== 'all') {
      const formIds = new Set(filteredForms.map(f => f.form_id));
      cls = cls.filter(c => formIds.has(c.form_id));
    }
    return cls;
  }, [classes, selectedForm, selectedSchool, filteredForms, isScoped]);

  // ── Apply all filters to students ──
  const displayStudents = useMemo(() => {
    let list = studentsWithSchools;

    // School filter (global view only)
    if (!isScoped && selectedSchool !== 'all') {
      list = list.filter(s => String(s.schoolId) === String(selectedSchool) || !s.schoolId);
      if (selectedForm !== 'all' || selectedClass !== 'all') {
        list = list.filter(s => s.schoolId);
      }
    }

    // Form filter
    if (selectedForm !== 'all') {
      list = list.filter(s => String(s.formId) === String(selectedForm));
    }

    // Class filter
    if (selectedClass !== 'all') {
      list = list.filter(s => String(s.classId) === String(selectedClass));
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(s => statusFilter === 'active' ? s.isActive : !s.isActive);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
      );
    }

    // Sort: assigned first (form → class → name), then unassigned
    return list.sort((a, b) => {
      if (a.classId && !b.classId) return -1;
      if (!a.classId && b.classId) return 1;
      if (!isScoped && a.schoolName !== b.schoolName) return (a.schoolName || 'zzz').localeCompare(b.schoolName || 'zzz');
      if (a.formName !== b.formName) return (a.formName || 'zzz').localeCompare(b.formName || 'zzz');
      if (a.className !== b.className) return (a.className || 'zzz').localeCompare(b.className || 'zzz');
      return a.name.localeCompare(b.name);
    });
  }, [studentsWithSchools, selectedSchool, selectedForm, selectedClass, statusFilter, searchTerm, isScoped]);

  // ── Stats ──
  const assignedCount = studentsWithSchools.filter(s => s.classId).length;
  const unassignedCount = studentsWithSchools.length - assignedCount;
  // Show school filter only in global admin view with multiple schools
  const showSchoolFilter = !isScoped && schools.length > 1;

  // ── Filter reset helpers ──
  const handleSchoolChange = (value) => {
    setSelectedSchool(value);
    setSelectedForm('all');
    setSelectedClass('all');
  };

  const handleFormChange = (value) => {
    setSelectedForm(value);
    setSelectedClass('all');
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <Container className="py-4 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {!isScoped && <Breadcrumb items={breadcrumbItems} />}

      <div className="d-flex justify-content-between align-items-center mb-4 pt-3">
        <div>
          <h2 className="mb-1">
            <FaUserGraduate className="me-2 text-primary" />
            {isScoped ? 'Students' : 'Student Management'}
          </h2>
          <p className="text-muted mb-0">
            {isScoped
              ? `${scopedSchool?.name || 'Your school'} — organised by form and class`
              : 'View and manage students by school, form, and class'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Badge bg="info" className="d-flex align-items-center px-3 py-2">
            Total: {allStudents.length}
          </Badge>
          <Badge bg="success" className="d-flex align-items-center px-3 py-2">
            Assigned: {assignedCount}
          </Badge>
          {unassignedCount > 0 && (
            <Badge bg="warning" text="dark" className="d-flex align-items-center px-3 py-2">
              Unassigned: {unassignedCount}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-end">
            {showSchoolFilter && (
              <Col md={2}>
                <Form.Label className="small mb-1 fw-semibold">School</Form.Label>
                <Form.Select size="sm" value={selectedSchool} onChange={(e) => handleSchoolChange(e.target.value)}>
                  <option value="all">All Schools</option>
                  {schools.map(s => (
                    <option key={s.institutionId} value={s.institutionId}>{s.name}</option>
                  ))}
                </Form.Select>
              </Col>
            )}
            <Col md={showSchoolFilter ? 2 : 3}>
              <Form.Label className="small mb-1 fw-semibold">Form</Form.Label>
              <Form.Select size="sm" value={selectedForm} onChange={(e) => handleFormChange(e.target.value)}>
                <option value="all">All Forms</option>
                {showSchoolFilter && selectedSchool === 'all' ? (
                  schools.map(school => {
                    const schoolForms = filteredForms.filter(f => String(f.school_id) === String(school.institutionId));
                    if (schoolForms.length === 0) return null;
                    return (
                      <optgroup key={school.institutionId} label={school.name}>
                        {schoolForms.map(f => (
                          <option key={f.form_id} value={f.form_id}>
                            {f.form_name || `Form ${f.form_number}`}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })
                ) : (
                  filteredForms.map(f => (
                    <option key={f.form_id} value={f.form_id}>
                      {f.form_name || `Form ${f.form_number}`}
                    </option>
                  ))
                )}
              </Form.Select>
            </Col>
            <Col md={showSchoolFilter ? 2 : 3}>
              <Form.Label className="small mb-1 fw-semibold">Class</Form.Label>
              <Form.Select size="sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="all">All Classes</option>
                {filteredClasses.map(c => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} ({c.class_code})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small mb-1 fw-semibold">Status</Form.Label>
              <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={showSchoolFilter ? 4 : 4}>
              <Form.Label className="small mb-1 fw-semibold">Search</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Student Table ── */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {displayStudents.length === 0 ? (
            <div className="text-center py-5">
              <FaUserGraduate size={48} className="text-muted mb-3" />
              <h5>No students found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' || selectedSchool !== 'all' || selectedForm !== 'all' || selectedClass !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No students have registered yet'}
              </p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  {showSchoolFilter && <th>School</th>}
                  <th>Form</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.map((student) => (
                  <tr key={student.userId}>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>
                      <span className="small">{student.email}</span>
                    </td>
                    {showSchoolFilter && (
                      <td>
                        <span className="small">{student.schoolName || <span className="text-muted">—</span>}</span>
                      </td>
                    )}
                    <td>
                      {student.formName
                        ? <Badge bg="outline-secondary" className="border text-dark">{student.formName}</Badge>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      {student.className
                        ? <Badge bg="primary">{student.className}</Badge>
                        : <Badge bg="warning" text="dark">Unassigned</Badge>
                      }
                    </td>
                    <td>
                      <Badge bg={student.isActive ? 'success' : 'secondary'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleViewStudent(student)}
                        title="View details"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowInfoModal(true);
                        }}
                        title="Student information"
                      >
                        <FaInfoCircle />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <div className="text-muted small mt-2">
            Showing {displayStudents.length} of {allStudents.length} students
          </div>
        </Card.Body>
      </Card>

      {/* Student Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Student Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <Row>
              <Col md={6}>
                <h6>Personal Information</h6>
                <p><strong>Name:</strong> {selectedStudent.name}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                {selectedStudent.phone && <p><strong>Phone:</strong> {selectedStudent.phone}</p>}
                {selectedStudent.dateOfBirth && (
                  <p><strong>Date of Birth:</strong> {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                )}
                {selectedStudent.address && (
                  <p><strong>Address:</strong> {selectedStudent.address}</p>
                )}
              </Col>
              <Col md={6}>
                <h6>Academic Information</h6>
                {selectedStudent.schoolName && (
                  <p><strong>School:</strong> {selectedStudent.schoolName}</p>
                )}
                {selectedStudent.formName && (
                  <p><strong>Form:</strong> {selectedStudent.formName}</p>
                )}
                {selectedStudent.className ? (
                  <p><strong>Class:</strong> {selectedStudent.className}</p>
                ) : (
                  <p><strong>Class:</strong> <Badge bg="warning" text="dark">Unassigned</Badge></p>
                )}
                <p><strong>Status:</strong> <Badge bg={selectedStudent.isActive ? 'success' : 'secondary'}>{selectedStudent.isActive ? 'Active' : 'Inactive'}</Badge></p>
                {selectedStudent.emergencyContact && (
                  <p><strong>Emergency Contact:</strong> {selectedStudent.emergencyContact}</p>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Student Information Management Modal */}
      <Modal
        show={showInfoModal}
        onHide={() => {
          setShowInfoModal(false);
          setSelectedStudent(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>Student Information Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <StudentInformationManagement
              studentId={selectedStudent.userId}
              student={selectedStudent}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowInfoModal(false);
            setSelectedStudent(null);
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default StudentManagement;
