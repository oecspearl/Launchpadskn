import React, { useState, useMemo, useEffect } from 'react';
import {
  Container, Row, Col, Card, Badge, Tab, Tabs, Alert, Table, Form, Button, Spinner
} from 'react-bootstrap';
import {
  FaBook, FaCalendarAlt, FaClipboardList, FaChartBar,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle,
  FaClock, FaChild, FaUser, FaUserGraduate, FaFileAlt, FaDownload
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useParentData } from '../../hooks/useParentData';
import { reportCardService } from '../../services/reportCardService';
import { exportReportCardPDF } from '../../services/ReportCardPDFExporter';
import Timetable from '../common/Timetable';
import SkeletonLoader from '../common/SkeletonLoader';
import EmptyState from '../common/EmptyState';
import ChildSelector from './ChildSelector';
import './ParentDashboard.css';

function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [gradeFilter, setGradeFilter] = useState('all');

  const {
    children,
    activeChild,
    myClass,
    classAssignment,
    subjects,
    grades,
    lessons,
    attendance,
    assignments,
    disciplinarySummary,
    disciplinaryRecords,
    isLoading,
    error
  } = useParentData(user, selectedChildId);

  // Derived data
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todayLessons = useMemo(() =>
    lessons.filter(l => {
      const d = new Date(l.lesson_date).toISOString().split('T')[0];
      return d === todayStr;
    }), [lessons, todayStr]
  );

  // Attendance stats
  const attendanceStats = useMemo(() => {
    if (!attendance.length) return { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    const absent = attendance.filter(a => a.status === 'ABSENT').length;
    const late = attendance.filter(a => a.status === 'LATE').length;
    const excused = attendance.filter(a => a.status === 'EXCUSED' || a.status === 'SICK').length;
    return { total, present, absent, late, excused };
  }, [attendance]);

  const attendanceRate = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;

  // Grade average
  const gradeAverage = useMemo(() => {
    const validGrades = grades.filter(g => g.percentage != null);
    if (!validGrades.length) return null;
    return Math.round(validGrades.reduce((sum, g) => sum + g.percentage, 0) / validGrades.length);
  }, [grades]);

  // Filtered grades
  const filteredGrades = useMemo(() => {
    if (gradeFilter === 'all') return grades;
    return grades.filter(g => {
      const subjectName = g.assessment?.class_subject?.subject_offering?.subject?.subject_name || '';
      return subjectName === gradeFilter;
    });
  }, [grades, gradeFilter]);

  // Unique subjects from grades for filter
  const gradeSubjects = useMemo(() => {
    const names = new Set();
    grades.forEach(g => {
      const name = g.assessment?.class_subject?.subject_offering?.subject?.subject_name;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [grades]);

  const getSubjectName = (classSubject) => {
    return classSubject?.subject_offering?.subject?.subject_name ||
      classSubject?.subject_name ||
      'Unknown Subject';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status) => {
    const variants = {
      PRESENT: { bg: 'success', icon: <FaCheckCircle className="me-1" /> },
      ABSENT: { bg: 'danger', icon: <FaTimesCircle className="me-1" /> },
      LATE: { bg: 'warning', icon: <FaClock className="me-1" /> },
      EXCUSED: { bg: 'info', icon: null },
      SICK: { bg: 'secondary', icon: null }
    };
    const v = variants[status] || { bg: 'secondary', icon: null };
    return <Badge bg={v.bg}>{v.icon}{status}</Badge>;
  };

  const getSeverityBadge = (severity) => {
    const colors = { MINOR: 'warning', MODERATE: 'orange', MAJOR: 'danger', SEVERE: 'dark' };
    return <Badge bg={colors[severity] || 'secondary'}>{severity}</Badge>;
  };

  if (isLoading) {
    return (
      <Container className="mt-4">
        <SkeletonLoader variant="dashboard" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Error loading dashboard data: {error.message}</Alert>
      </Container>
    );
  }

  if (!children.length) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <FaChild size={64} className="text-muted mb-3" />
          <h4>No Children Linked</h4>
          <p className="text-muted">
            Your account hasn't been linked to any students yet. Please contact your school's administration
            to link your child's account.
          </p>
        </div>
      </Container>
    );
  }

  const childName = activeChild?.student?.name || 'Student';

  return (
    <div className="parent-dashboard">
      <Container className="pt-4">
        {/* Header */}
        <div className="dashboard-header-section">
          <Row className="align-items-center">
            <Col md={8}>
              <h2>
                <FaUserGraduate className="me-2" />
                Parent Portal
              </h2>
              {user?.institution_name && (
                <p className="mb-1 opacity-75 fw-semibold d-flex align-items-center gap-2">
                  {user.institution_logo_url && (
                    <img src={user.institution_logo_url} alt="" style={{ height: 28, maxWidth: 36, objectFit: 'contain' }} />
                  )}
                  {user.institution_name}
                </p>
              )}
              <p className="mb-0 opacity-75">
                Viewing: <strong>{childName}</strong>
                {myClass && (
                  <span>
                    {' '} — {myClass.form?.form_name || 'Form'} - {myClass.class_name || 'Class'}
                    {myClass.form_tutor && ` • Form Tutor: ${myClass.form_tutor.name}`}
                  </span>
                )}
              </p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Badge bg="light" text="dark" className="p-2 px-3 rounded-pill">
                Parent Portal
              </Badge>
            </Col>
          </Row>
        </div>

        {/* Child Selector */}
        <ChildSelector
          children={children}
          activeChildId={selectedChildId || activeChild?.student?.user_id}
          onSelect={setSelectedChildId}
        />

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 border-bottom-0"
        >
          {/* ==================== OVERVIEW TAB ==================== */}
          <Tab eventKey="overview" title="Overview">
            <Row className="g-4">
              {/* Today's Lessons */}
              <Col md={8}>
                <Card className="glass-card h-100 border-0">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold text-dark">
                      <FaCalendarAlt className="me-2 text-primary" />
                      Today's Lessons
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {todayLessons.length === 0 ? (
                      <EmptyState
                        variant="no-lessons"
                        title="No Lessons Today"
                        message="No scheduled lessons for today."
                      />
                    ) : (
                      <div className="todays-lessons-section mb-0">
                        {todayLessons.map((lesson, index) => {
                          const subjectName = getSubjectName(lesson.class_subject);
                          return (
                            <div key={index} className="lesson-item">
                              <div className="lesson-time">
                                {formatTime(lesson.start_time)}<br />
                                <span className="opacity-75">-</span><br />
                                {formatTime(lesson.end_time)}
                              </div>
                              <div className="lesson-content">
                                <h6 className="lesson-title">{subjectName}</h6>
                                {lesson.location && (
                                  <small className="text-muted">{lesson.location}</small>
                                )}
                                {lesson.lesson_title && (
                                  <p className="mb-0 mt-1 small text-muted">{lesson.lesson_title}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Quick Stats */}
              <Col md={4}>
                <Row className="g-3">
                  <Col xs={12}>
                    <Card className="stat-card bg-primary text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{subjects.length}</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">Subjects</small>
                          </div>
                          <FaBook size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12}>
                    <Card className="stat-card bg-success text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{attendanceRate}%</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">Attendance</small>
                          </div>
                          <FaCheckCircle size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12}>
                    <Card className="stat-card bg-info text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{gradeAverage != null ? `${gradeAverage}%` : 'N/A'}</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">Avg Grade</small>
                          </div>
                          <FaChartBar size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12}>
                    <Card className="stat-card bg-warning text-white">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h2 className="mb-0 fw-bold">{assignments.length}</h2>
                            <small className="opacity-75 text-uppercase letter-spacing-1">Upcoming Assignments</small>
                          </div>
                          <FaClipboardList size={32} className="opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Subjects List */}
            <Row className="mt-4">
              <Col>
                <Card className="glass-card border-0">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold text-dark">
                      <FaBook className="me-2 text-primary" />
                      {childName}'s Subjects
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {subjects.length === 0 ? (
                      <EmptyState
                        variant="no-subjects"
                        title="No Subjects"
                        message="No subjects assigned yet."
                      />
                    ) : (
                      <Row className="g-3">
                        {subjects.map((cs, idx) => {
                          const subjectName = getSubjectName(cs);
                          const teacherName = cs.teacher?.name || 'TBA';
                          const teacherPhoto = cs.teacher?.profile_image_url;
                          return (
                            <Col md={4} key={cs.class_subject_id || idx}>
                              <Card className="h-100 border shadow-sm">
                                <Card.Body className="p-3">
                                  <div className="d-flex align-items-center gap-2 mb-2">
                                    {teacherPhoto ? (
                                      <div style={{
                                        width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                                        border: '2px solid #dee2e6', flexShrink: 0
                                      }}>
                                        <img src={teacherPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                    ) : (
                                      <div style={{
                                        width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e9ecef',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                      }}>
                                        <FaUser size={14} color="#6c757d" />
                                      </div>
                                    )}
                                    <div>
                                      <h6 className="mb-0">{subjectName}</h6>
                                      <small className="text-muted">{teacherName}</small>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Upcoming Assignments */}
            {assignments.length > 0 && (
              <Row className="mt-4">
                <Col>
                  <Card className="glass-card border-0">
                    <Card.Header className="bg-transparent border-0 py-3">
                      <h5 className="mb-0 fw-bold text-dark">
                        <FaClipboardList className="me-2 text-warning" />
                        Upcoming Assignments
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Table responsive hover size="sm">
                        <thead>
                          <tr>
                            <th>Assessment</th>
                            <th>Type</th>
                            <th>Due Date</th>
                            <th>Days Left</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((a, idx) => {
                            const dueDate = new Date(a.due_date);
                            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                            return (
                              <tr key={a.assessment_id || idx}>
                                <td>{a.assessment_name}</td>
                                <td><Badge bg="outline-secondary" className="border">{a.assessment_type}</Badge></td>
                                <td>{dueDate.toLocaleDateString()}</td>
                                <td>
                                  <Badge bg={daysLeft <= 3 ? 'danger' : daysLeft <= 7 ? 'warning' : 'success'}>
                                    {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>

          {/* ==================== GRADES TAB ==================== */}
          <Tab eventKey="grades" title="Grades">
            <Card className="glass-card border-0">
              <Card.Header className="bg-transparent border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">
                  <FaChartBar className="me-2 text-primary" />
                  Academic Grades
                </h5>
                {gradeSubjects.length > 0 && (
                  <Form.Select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    style={{ maxWidth: 250 }}
                  >
                    <option value="all">All Subjects</option>
                    {gradeSubjects.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </Form.Select>
                )}
              </Card.Header>
              <Card.Body>
                {gradeAverage != null && (
                  <Alert variant="info" className="mb-3">
                    Overall Average: <strong>{gradeAverage}%</strong>
                  </Alert>
                )}
                {filteredGrades.length === 0 ? (
                  <EmptyState
                    title="No Grades Yet"
                    message="No grade records available."
                  />
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Assessment</th>
                        <th>Type</th>
                        <th>Marks</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                        <th>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((g, idx) => {
                        const subjectName = g.assessment?.class_subject?.subject_offering?.subject?.subject_name || '-';
                        return (
                          <tr key={g.grade_id || idx}>
                            <td>{subjectName}</td>
                            <td>{g.assessment?.assessment_name || '-'}</td>
                            <td>
                              <Badge bg="outline-secondary" className="border">
                                {g.assessment?.assessment_type || '-'}
                              </Badge>
                            </td>
                            <td>{g.marks_obtained}/{g.assessment?.total_marks}</td>
                            <td>
                              <Badge bg={
                                g.percentage >= 80 ? 'success' :
                                g.percentage >= 60 ? 'primary' :
                                g.percentage >= 50 ? 'warning' : 'danger'
                              }>
                                {g.percentage != null ? `${g.percentage}%` : '-'}
                              </Badge>
                            </td>
                            <td><strong>{g.grade_letter || '-'}</strong></td>
                            <td className="small text-muted">{g.comments || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ==================== ATTENDANCE TAB ==================== */}
          <Tab eventKey="attendance" title="Attendance">
            <Card className="glass-card border-0">
              <Card.Header className="bg-transparent border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark">
                  <FaCheckCircle className="me-2 text-success" />
                  Attendance Record
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Summary Stats */}
                <Row className="g-3 mb-4">
                  <Col xs={6} md={3}>
                    <Card className="text-center border">
                      <Card.Body className="py-3">
                        <h4 className="mb-0 text-success">{attendanceStats.present}</h4>
                        <small className="text-muted">Present</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} md={3}>
                    <Card className="text-center border">
                      <Card.Body className="py-3">
                        <h4 className="mb-0 text-danger">{attendanceStats.absent}</h4>
                        <small className="text-muted">Absent</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} md={3}>
                    <Card className="text-center border">
                      <Card.Body className="py-3">
                        <h4 className="mb-0 text-warning">{attendanceStats.late}</h4>
                        <small className="text-muted">Late</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} md={3}>
                    <Card className="text-center border">
                      <Card.Body className="py-3">
                        <h4 className="mb-0 text-primary fw-bold">{attendanceRate}%</h4>
                        <small className="text-muted">Attendance Rate</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {attendance.length === 0 ? (
                  <EmptyState
                    title="No Attendance Records"
                    message="No attendance records available yet."
                  />
                ) : (
                  <Table responsive hover size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.slice(0, 50).map((a, idx) => {
                        const subjectName = a.lesson?.class_subject?.subject_offering?.subject?.subject_name || '-';
                        const lessonDate = a.lesson?.lesson_date
                          ? new Date(a.lesson.lesson_date).toLocaleDateString()
                          : '-';
                        return (
                          <tr key={a.attendance_id || idx}>
                            <td>{lessonDate}</td>
                            <td>{subjectName}</td>
                            <td>{getStatusBadge(a.status)}</td>
                            <td className="small text-muted">{a.notes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ==================== TIMETABLE TAB ==================== */}
          <Tab eventKey="timetable" title="Timetable">
            <Card className="glass-card border-0">
              <Card.Header className="bg-transparent border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark">
                  <FaCalendarAlt className="me-2 text-primary" />
                  Class Timetable
                </h5>
              </Card.Header>
              <Card.Body>
                {lessons.length === 0 ? (
                  <EmptyState
                    title="No Lessons Scheduled"
                    message="No upcoming lessons found."
                  />
                ) : (
                  <Timetable lessons={lessons} />
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ==================== DISCIPLINARY TAB ==================== */}
          <Tab eventKey="disciplinary" title="Disciplinary">
            <Card className="glass-card border-0">
              <Card.Header className="bg-transparent border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark">
                  <FaExclamationTriangle className="me-2 text-warning" />
                  Disciplinary Records
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Summary Cards */}
                {disciplinarySummary && (
                  <Row className="g-3 mb-4">
                    <Col xs={6} md={3}>
                      <Card className="text-center border">
                        <Card.Body className="py-3">
                          <h4 className="mb-0">{disciplinarySummary.total_incidents || 0}</h4>
                          <small className="text-muted">Total Incidents</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6} md={3}>
                      <Card className="text-center border">
                        <Card.Body className="py-3">
                          <h4 className="mb-0 text-success">{disciplinarySummary.resolved_count || 0}</h4>
                          <small className="text-muted">Resolved</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6} md={3}>
                      <Card className="text-center border">
                        <Card.Body className="py-3">
                          <h4 className="mb-0 text-danger">{disciplinarySummary.suspension_count || 0}</h4>
                          <small className="text-muted">Suspensions</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6} md={3}>
                      <Card className="text-center border">
                        <Card.Body className="py-3">
                          <small className="text-muted d-block">Last Incident</small>
                          <small className="fw-bold">
                            {disciplinarySummary.last_incident_date
                              ? new Date(disciplinarySummary.last_incident_date).toLocaleDateString()
                              : 'None'}
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}

                {(!disciplinaryRecords || disciplinaryRecords.length === 0) ? (
                  <EmptyState
                    title="No Disciplinary Records"
                    message="No disciplinary incidents on record. Great job!"
                  />
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>Action Taken</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disciplinaryRecords.map((incident, idx) => (
                        <tr key={incident.incident_id || idx}>
                          <td>{incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : '-'}</td>
                          <td>{(incident.incident_type || '').replace(/_/g, ' ')}</td>
                          <td>{getSeverityBadge(incident.severity)}</td>
                          <td className="small" style={{ maxWidth: 250 }}>
                            {incident.description?.substring(0, 100)}
                            {incident.description?.length > 100 ? '...' : ''}
                          </td>
                          <td>{(incident.action_taken || '').replace(/_/g, ' ')}</td>
                          <td>
                            <Badge bg={incident.resolved ? 'success' : 'warning'}>
                              {incident.resolved ? 'Resolved' : 'Open'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ==================== REPORT CARDS TAB ==================== */}
          <Tab eventKey="report-cards" title="Report Cards">
            <ParentReportCards
              studentId={activeChild?.student?.user_id}
              institutionName={user?.institution_name}
            />
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
}

function ParentReportCards({ studentId, institutionName }) {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    reportCardService.getReportCardsByStudent(studentId)
      .then(setReportCards)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleView = async (rcId) => {
    setDetailLoading(true);
    try {
      const data = await reportCardService.getReportCard(rcId);
      setSelectedCard(data);
    } catch {
      setSelectedCard(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (rcId) => {
    const data = await reportCardService.getReportCard(rcId);
    exportReportCardPDF(data, institutionName);
  };

  if (loading) return <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>;

  if (!reportCards.length) {
    return (
      <Card className="glass-card border-0">
        <Card.Body className="text-center py-5">
          <FaFileAlt size={48} className="text-muted mb-3" />
          <h5>No Report Cards</h5>
          <p className="text-muted">No published report cards available yet.</p>
        </Card.Body>
      </Card>
    );
  }

  if (selectedCard) {
    return (
      <Card className="glass-card border-0">
        <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">
            <FaFileAlt className="me-2 text-primary" />
            Report Card — Term {selectedCard.term} ({selectedCard.academic_year})
          </h5>
          <div className="d-flex gap-2">
            <Button variant="outline-success" size="sm" onClick={() => handleDownload(selectedCard.report_card_id)}>
              <FaDownload className="me-1" /> Download PDF
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => setSelectedCard(null)}>
              Back
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}><strong>Class:</strong> {selectedCard.class?.class_name}</Col>
            <Col md={4}><strong>Rank:</strong> {selectedCard.class_rank || '—'}</Col>
            <Col md={4}><strong>Average:</strong> {selectedCard.overall_average != null ? `${selectedCard.overall_average}%` : '—'}</Col>
          </Row>

          {selectedCard.grades?.length > 0 && (
            <Table responsive size="sm" className="mb-3">
              <thead className="table-light">
                <tr>
                  <th>Subject</th>
                  <th className="text-center">Coursework</th>
                  <th className="text-center">Exam</th>
                  <th className="text-center">Final</th>
                  <th className="text-center">Grade</th>
                  <th className="text-center">Effort</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {selectedCard.grades.map(g => (
                  <tr key={g.id}>
                    <td>{g.subject_name}</td>
                    <td className="text-center">{g.coursework_avg != null ? `${g.coursework_avg}%` : '—'}</td>
                    <td className="text-center">{g.exam_mark != null ? `${g.exam_mark}%` : '—'}</td>
                    <td className="text-center">
                      <Badge bg={g.final_mark >= 70 ? 'success' : g.final_mark >= 50 ? 'warning' : 'danger'}>
                        {g.final_mark != null ? `${g.final_mark}%` : '—'}
                      </Badge>
                    </td>
                    <td className="text-center">{g.grade_letter || '—'}</td>
                    <td className="text-center">{g.effort_grade || '—'}</td>
                    <td className="small">{g.teacher_comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <Row className="mb-2">
            <Col md={6}>
              <p className="mb-1"><strong>Attendance:</strong> {selectedCard.attendance_percentage != null ? `${selectedCard.attendance_percentage}%` : '—'}</p>
              <p className="small text-muted">
                Present: {selectedCard.days_present} | Absent: {selectedCard.days_absent} | Late: {selectedCard.days_late}
              </p>
            </Col>
            <Col md={6}>
              <p className="mb-1"><strong>Conduct:</strong> {selectedCard.conduct_grade || '—'}</p>
            </Col>
          </Row>

          {selectedCard.form_teacher_comment && <p><strong>Form Teacher:</strong> {selectedCard.form_teacher_comment}</p>}
          {selectedCard.principal_comment && <p><strong>Principal:</strong> {selectedCard.principal_comment}</p>}
          {selectedCard.next_term_begins && <p><strong>Next Term:</strong> {new Date(selectedCard.next_term_begins).toLocaleDateString()}</p>}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0">
      <Card.Header className="bg-transparent border-0">
        <h5 className="mb-0 fw-bold">
          <FaFileAlt className="me-2 text-primary" />
          Published Report Cards
        </h5>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Academic Year</th>
              <th>Term</th>
              <th>Class</th>
              <th className="text-center">Average</th>
              <th className="text-center">Rank</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reportCards.map(rc => (
              <tr key={rc.report_card_id}>
                <td>{rc.academic_year}</td>
                <td>Term {rc.term}</td>
                <td>{rc.class?.class_name || '—'}</td>
                <td className="text-center">
                  {rc.overall_average != null ? (
                    <Badge bg={rc.overall_average >= 70 ? 'success' : rc.overall_average >= 50 ? 'warning' : 'danger'}>
                      {rc.overall_average}%
                    </Badge>
                  ) : '—'}
                </td>
                <td className="text-center">{rc.class_rank || '—'}</td>
                <td className="text-center">
                  <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleView(rc.report_card_id)}>
                    View
                  </Button>
                  <Button variant="outline-success" size="sm" onClick={() => handleDownload(rc.report_card_id)}>
                    <FaDownload />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default ParentDashboard;
