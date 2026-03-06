import React, { useState, useMemo, useEffect } from 'react';
import { Table, Badge, Spinner } from 'react-bootstrap';
import {
  FaBook, FaCalendarAlt, FaClipboardList, FaChartBar,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle,
  FaClock, FaChild, FaUser, FaFileAlt, FaDownload
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useParentData } from '../../hooks/useParentData';
import { reportCardService } from '../../services/reportCardService';
import { exportReportCardPDF } from '../../services/ReportCardPDFExporter';
import Timetable from '../common/Timetable';
import SkeletonLoader from '../common/SkeletonLoader';
import ChildSelector from './ChildSelector';
import './ParentDashboard.css';

const SUBJECT_COLORS = [
  'var(--skn-green)', 'var(--skn-red)', 'var(--skn-yellow)',
  '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todayLessons = useMemo(() =>
    lessons.filter(l => {
      const d = new Date(l.lesson_date).toISOString().split('T')[0];
      return d === todayStr;
    }), [lessons, todayStr]
  );

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

  const gradeAverage = useMemo(() => {
    const validGrades = grades.filter(g => g.percentage != null);
    if (!validGrades.length) return null;
    return Math.round(validGrades.reduce((sum, g) => sum + g.percentage, 0) / validGrades.length);
  }, [grades]);

  const filteredGrades = useMemo(() => {
    if (gradeFilter === 'all') return grades;
    return grades.filter(g => {
      const subjectName = g.assessment?.class_subject?.subject_offering?.subject?.subject_name || '';
      return subjectName === gradeFilter;
    });
  }, [grades, gradeFilter]);

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
      <div className="parent-brutalist">
        <div style={{ padding: 32 }}>
          <SkeletonLoader variant="dashboard" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parent-brutalist">
        <div className="parent-page">
          <div className="parent-alert parent-alert--error">
            Error loading dashboard data: {error.message}
          </div>
        </div>
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="parent-brutalist">
        <div className="parent-page">
          <div className="parent-empty">
            <div className="parent-empty__icon"><FaChild /></div>
            <div className="parent-empty__text">No Children Linked</div>
            <div className="parent-empty__hint">
              Your account hasn't been linked to any students yet. Please contact your school's administration.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const childName = activeChild?.student?.name || 'Student';

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'grades', label: 'Grades' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'timetable', label: 'Timetable' },
    { key: 'disciplinary', label: 'Disciplinary' },
    { key: 'report-cards', label: 'Report Cards' },
  ];

  return (
    <div className="parent-brutalist">
      {/* Hero */}
      <div className="parent-hero">
        <div className="parent-hero__bg-grid" />
        <div className="parent-hero__bg-green" />
        <div className="parent-hero__bg-ink" />
        <div className="parent-hero__content">
          <div className="parent-hero__rule" />
          <div className="parent-hero__greeting">{getGreeting()}</div>
          <h1 className="parent-hero__name">{user?.name || 'Parent'}</h1>
          <div className="parent-hero__meta">
            Viewing: <strong>{childName}</strong>
            {myClass && (
              <span>
                {' '} — {myClass.form?.form_name || 'Form'} - {myClass.class_name || 'Class'}
                {myClass.form_tutor && ` · Form Tutor: ${myClass.form_tutor.name}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Child Selector */}
      <div style={{ padding: '12px 32px', background: 'var(--mist)', borderBottom: '1px solid var(--fog)' }}>
        <ChildSelector
          children={children}
          activeChildId={selectedChildId || activeChild?.student?.user_id}
          onSelect={setSelectedChildId}
        />
      </div>

      {/* Tabs */}
      <div className="parent-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`parent-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Page Content */}
      <div className="parent-page">

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <>
            {/* Stat Row */}
            <div className="parent-section fade-up fade-up-1">
              <div className="parent-stats">
                <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-green)' }}>
                  <div className="parent-stat__label">Subjects</div>
                  <div className="parent-stat__value">{subjects.length}</div>
                  <div className="parent-stat__delta parent-stat__delta--up">Enrolled</div>
                </div>
                <div className="parent-stat" style={{ '--stat-accent': '#06b6d4' }}>
                  <div className="parent-stat__label">Attendance</div>
                  <div className="parent-stat__value">{attendanceRate}%</div>
                  <div className={`parent-stat__delta ${attendanceRate >= 90 ? 'parent-stat__delta--up' : 'parent-stat__delta--warn'}`}>
                    {attendanceRate >= 90 ? 'Good' : 'Needs attention'}
                  </div>
                </div>
                <div className="parent-stat" style={{ '--stat-accent': '#3b82f6' }}>
                  <div className="parent-stat__label">Avg Grade</div>
                  <div className="parent-stat__value">{gradeAverage != null ? `${gradeAverage}%` : 'N/A'}</div>
                </div>
                <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-yellow)' }}>
                  <div className="parent-stat__label">Assignments</div>
                  <div className="parent-stat__value">{assignments.length}</div>
                  <div className="parent-stat__delta parent-stat__delta--warn">Upcoming</div>
                </div>
              </div>
            </div>

            {/* Two Column: Today's Lessons + Side */}
            <div className="parent-section fade-up fade-up-2">
              <div className="parent-section-header">
                <h2 className="parent-section-title">Today's Schedule</h2>
              </div>

              <div className="parent-two-col">
                {/* Today's Lessons */}
                <div className="parent-lessons-panel">
                  <div className="parent-lessons-panel__header">
                    <h3 className="parent-lessons-panel__title">
                      {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                  </div>
                  {todayLessons.length === 0 ? (
                    <div className="parent-empty">
                      <div className="parent-empty__text">No lessons scheduled today</div>
                    </div>
                  ) : (
                    todayLessons.map((lesson, idx) => {
                      const subjectName = getSubjectName(lesson.class_subject);
                      return (
                        <div key={idx} className="parent-lesson-slot">
                          <div className="parent-lesson-slot__time">
                            <span className="parent-lesson-slot__time-hour">{formatTime(lesson.start_time)}</span>
                            <span className="parent-lesson-slot__time-end">{formatTime(lesson.end_time)}</span>
                          </div>
                          <div className="parent-lesson-slot__band" style={{ background: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }} />
                          <div className="parent-lesson-slot__body">
                            <div className="parent-lesson-slot__subject">{subjectName}</div>
                            {lesson.location && <div className="parent-lesson-slot__detail">{lesson.location}</div>}
                            {lesson.lesson_title && <div className="parent-lesson-slot__detail">{lesson.lesson_title}</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Side: Subjects */}
                <div>
                  <div className="parent-panel">
                    <div className="parent-panel__header">
                      <h4 className="parent-panel__title">{childName}'s Subjects</h4>
                    </div>
                    <div className="parent-panel__body">
                      {subjects.length === 0 ? (
                        <div className="parent-empty__text" style={{ padding: '16px 0' }}>No subjects assigned</div>
                      ) : (
                        subjects.map((cs, idx) => (
                          <div key={cs.class_subject_id || idx} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)'
                          }}>
                            <div style={{ width: 7, height: 7, background: SUBJECT_COLORS[idx % SUBJECT_COLORS.length], flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)' }}>
                                {getSubjectName(cs)}
                              </div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(0,0,0,0.4)' }}>
                                {cs.teacher?.name || 'TBA'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Upcoming Assignments */}
                  {assignments.length > 0 && (
                    <div className="parent-panel">
                      <div className="parent-panel__header">
                        <h4 className="parent-panel__title">Upcoming Assignments</h4>
                      </div>
                      <div className="parent-panel__body">
                        {assignments.slice(0, 5).map((a, idx) => {
                          const dueDate = new Date(a.due_date);
                          const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                          const dotColor = daysLeft <= 3 ? 'var(--skn-red)' : daysLeft <= 7 ? 'var(--skn-yellow)' : 'var(--fog)';
                          return (
                            <div key={a.assessment_id || idx} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)'
                            }}>
                              <div style={{ width: 7, height: 7, background: dotColor, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13 }}>{a.assessment_name}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(0,0,0,0.4)' }}>{a.assessment_type}</div>
                              </div>
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0,
                                color: daysLeft <= 3 ? 'var(--skn-red)' : daysLeft <= 7 ? 'var(--amber)' : 'rgba(0,0,0,0.4)'
                              }}>
                                {daysLeft}d left
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== GRADES TAB ==================== */}
        {activeTab === 'grades' && (
          <div className="parent-section fade-up fade-up-1">
            <div className="parent-section-header">
              <h2 className="parent-section-title">Academic Grades</h2>
              {gradeSubjects.length > 0 && (
                <select
                  className="parent-filter-select"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {gradeSubjects.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
            </div>

            {gradeAverage != null && (
              <div className="parent-alert parent-alert--info">
                Overall Average: <strong>{gradeAverage}%</strong>
              </div>
            )}

            <div className="parent-panel">
              <div className="parent-panel__body" style={{ padding: 0 }}>
                {filteredGrades.length === 0 ? (
                  <div className="parent-empty">
                    <div className="parent-empty__text">No grades yet</div>
                    <div className="parent-empty__hint">No grade records available.</div>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
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
                              <Badge bg="secondary" style={{ opacity: 0.6 }}>
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
                            <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{g.comments || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ATTENDANCE TAB ==================== */}
        {activeTab === 'attendance' && (
          <div className="parent-section fade-up fade-up-1">
            <div className="parent-section-header">
              <h2 className="parent-section-title">Attendance Record</h2>
            </div>

            {/* Summary */}
            <div className="parent-stats" style={{ marginBottom: 24 }}>
              <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-green)' }}>
                <div className="parent-stat__label">Present</div>
                <div className="parent-stat__value">{attendanceStats.present}</div>
              </div>
              <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-red)' }}>
                <div className="parent-stat__label">Absent</div>
                <div className="parent-stat__value">{attendanceStats.absent}</div>
              </div>
              <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-yellow)' }}>
                <div className="parent-stat__label">Late</div>
                <div className="parent-stat__value">{attendanceStats.late}</div>
              </div>
              <div className="parent-stat" style={{ '--stat-accent': '#3b82f6' }}>
                <div className="parent-stat__label">Rate</div>
                <div className="parent-stat__value">{attendanceRate}%</div>
              </div>
            </div>

            <div className="parent-panel">
              <div className="parent-panel__body" style={{ padding: 0 }}>
                {attendance.length === 0 ? (
                  <div className="parent-empty">
                    <div className="parent-empty__text">No attendance records</div>
                  </div>
                ) : (
                  <Table responsive hover size="sm" className="mb-0">
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
                            <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{a.notes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TIMETABLE TAB ==================== */}
        {activeTab === 'timetable' && (
          <div className="parent-section fade-up fade-up-1">
            <div className="parent-section-header">
              <h2 className="parent-section-title">Class Timetable</h2>
            </div>
            {lessons.length === 0 ? (
              <div className="parent-panel">
                <div className="parent-empty">
                  <div className="parent-empty__text">No lessons scheduled</div>
                </div>
              </div>
            ) : (
              <Timetable lessons={lessons} />
            )}
          </div>
        )}

        {/* ==================== DISCIPLINARY TAB ==================== */}
        {activeTab === 'disciplinary' && (
          <div className="parent-section fade-up fade-up-1">
            <div className="parent-section-header">
              <h2 className="parent-section-title">Disciplinary Records</h2>
            </div>

            {/* Summary */}
            {disciplinarySummary && (
              <div className="parent-stats" style={{ marginBottom: 24 }}>
                <div className="parent-stat" style={{ '--stat-accent': 'var(--ink)' }}>
                  <div className="parent-stat__label">Total Incidents</div>
                  <div className="parent-stat__value">{disciplinarySummary.total_incidents || 0}</div>
                </div>
                <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-green)' }}>
                  <div className="parent-stat__label">Resolved</div>
                  <div className="parent-stat__value">{disciplinarySummary.resolved_count || 0}</div>
                </div>
                <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-red)' }}>
                  <div className="parent-stat__label">Suspensions</div>
                  <div className="parent-stat__value">{disciplinarySummary.suspension_count || 0}</div>
                </div>
                <div className="parent-stat" style={{ '--stat-accent': 'var(--skn-yellow)' }}>
                  <div className="parent-stat__label">Last Incident</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', marginTop: 8 }}>
                    {disciplinarySummary.last_incident_date
                      ? new Date(disciplinarySummary.last_incident_date).toLocaleDateString()
                      : 'None'}
                  </div>
                </div>
              </div>
            )}

            <div className="parent-panel">
              <div className="parent-panel__body" style={{ padding: 0 }}>
                {(!disciplinaryRecords || disciplinaryRecords.length === 0) ? (
                  <div className="parent-empty">
                    <div className="parent-empty__icon"><FaCheckCircle /></div>
                    <div className="parent-empty__text">No disciplinary records</div>
                    <div className="parent-empty__hint">No disciplinary incidents on record. Great job!</div>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
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
                          <td style={{ maxWidth: 250, fontSize: 12 }}>
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
              </div>
            </div>
          </div>
        )}

        {/* ==================== REPORT CARDS TAB ==================== */}
        {activeTab === 'report-cards' && (
          <div className="parent-section fade-up fade-up-1">
            <ParentReportCards
              studentId={activeChild?.student?.user_id}
              institutionName={user?.institution_name}
            />
          </div>
        )}
      </div>
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (!reportCards.length) {
    return (
      <div className="parent-panel">
        <div className="parent-empty">
          <div className="parent-empty__icon"><FaFileAlt /></div>
          <div className="parent-empty__text">No Report Cards</div>
          <div className="parent-empty__hint">No published report cards available yet.</div>
        </div>
      </div>
    );
  }

  if (selectedCard) {
    return (
      <>
        <div className="parent-section-header">
          <h2 className="parent-section-title">
            Report Card — Term {selectedCard.term} ({selectedCard.academic_year})
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="parent-btn parent-btn--success" onClick={() => handleDownload(selectedCard.report_card_id)}>
              <FaDownload style={{ marginRight: 4 }} /> Download PDF
            </button>
            <button className="parent-btn parent-btn--secondary" onClick={() => setSelectedCard(null)}>
              Back
            </button>
          </div>
        </div>

        <div className="parent-panel">
          <div className="parent-panel__body">
            <div style={{ display: 'flex', gap: 32, marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(0,0,0,0.5)' }}>
              <span><strong>Class:</strong> {selectedCard.class?.class_name}</span>
              <span><strong>Rank:</strong> {selectedCard.class_rank || '—'}</span>
              <span><strong>Average:</strong> {selectedCard.overall_average != null ? `${selectedCard.overall_average}%` : '—'}</span>
            </div>

            {selectedCard.grades?.length > 0 && (
              <Table responsive size="sm" className="mb-3">
                <thead>
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
                      <td style={{ fontSize: 12 }}>{g.teacher_comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <div style={{ display: 'flex', gap: 32, fontSize: 13, marginBottom: 12 }}>
              <div>
                <strong>Attendance:</strong> {selectedCard.attendance_percentage != null ? `${selectedCard.attendance_percentage}%` : '—'}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>
                  Present: {selectedCard.days_present} | Absent: {selectedCard.days_absent} | Late: {selectedCard.days_late}
                </div>
              </div>
              <div><strong>Conduct:</strong> {selectedCard.conduct_grade || '—'}</div>
            </div>

            {selectedCard.form_teacher_comment && <p style={{ fontSize: 13 }}><strong>Form Teacher:</strong> {selectedCard.form_teacher_comment}</p>}
            {selectedCard.principal_comment && <p style={{ fontSize: 13 }}><strong>Principal:</strong> {selectedCard.principal_comment}</p>}
            {selectedCard.next_term_begins && <p style={{ fontSize: 13 }}><strong>Next Term:</strong> {new Date(selectedCard.next_term_begins).toLocaleDateString()}</p>}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="parent-section-header">
        <h2 className="parent-section-title">Published Report Cards</h2>
      </div>
      <div className="parent-panel">
        <div className="parent-panel__body" style={{ padding: 0 }}>
          <Table responsive hover className="mb-0">
            <thead>
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
                    <button className="parent-btn parent-btn--primary" style={{ marginRight: 4 }} onClick={() => handleView(rc.report_card_id)}>
                      View
                    </button>
                    <button className="parent-btn parent-btn--success" onClick={() => handleDownload(rc.report_card_id)}>
                      <FaDownload />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default ParentDashboard;
