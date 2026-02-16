import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Tab, Nav, Button, Alert, Badge, Table,
  Form, Spinner, OverlayTrigger, Tooltip as BTooltip
} from 'react-bootstrap';
import {
  FaChartLine, FaUsers, FaBook, FaDownload, FaGraduationCap,
  FaClipboardCheck, FaFilePdf, FaFileCsv, FaTrophy, FaExclamationTriangle,
  FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { reportService } from '../../services/reportService';
import {
  exportOverviewPDF, exportAcademicPDF, exportAttendancePDF, exportCSV
} from '../../services/ReportPDFExporter';
import { useAuth } from '../../contexts/AuthContextSupabase';
import Breadcrumb from '../common/Breadcrumb';

const CHART_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
const GRADE_COLORS = { A: '#2ecc71', B: '#3498db', C: '#f39c12', D: '#e67e22', F: '#e74c3c' };

function ReportsTab({ institutionId }) {
  const { user } = useAuth();
  const instName = user?.institution_name || '';

  // Active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Overview state
  const [stats, setStats] = useState(null);
  const [studentsByForm, setStudentsByForm] = useState([]);
  const [userDistribution, setUserDistribution] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Academic state
  const [performanceData, setPerformanceData] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState(null);
  const [rankings, setRankings] = useState({ top: [], bottom: [] });
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicFilters, setAcademicFilters] = useState({ term: '', formId: '', classId: '' });

  // Attendance state
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFilters, setAttendanceFilters] = useState({ startDate: '', endDate: '' });

  // Filter options
  const [forms, setForms] = useState([]);
  const [classes, setClasses] = useState([]);

  const [error, setError] = useState('');

  const breadcrumbItems = [
    { label: 'Dashboard', path: institutionId ? '/school-admin/dashboard' : '/admin/dashboard', type: 'dashboard' },
    { label: 'Reports & Analytics', type: 'reports' }
  ];

  // Load forms for filter dropdowns
  useEffect(() => {
    reportService.getForms(institutionId || null).then(setForms).catch(() => {});
  }, [institutionId]);

  // Load classes when form filter changes
  useEffect(() => {
    if (academicFilters.formId) {
      reportService.getClassesByForm(academicFilters.formId).then(setClasses).catch(() => {});
    } else {
      setClasses([]);
      setAcademicFilters(prev => ({ ...prev, classId: '' }));
    }
  }, [academicFilters.formId]);

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const [s, sf, ud] = await Promise.all([
        reportService.getOverviewStats(institutionId || null),
        reportService.getStudentsByForm(institutionId || null),
        reportService.getUserDistribution(institutionId || null)
      ]);
      setStats(s);
      setStudentsByForm(sf);
      setUserDistribution(ud);
    } catch (err) {
      setError('Failed to load overview data');
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  }, [institutionId]);

  // Fetch academic data
  const fetchAcademic = useCallback(async () => {
    try {
      setAcademicLoading(true);
      const filters = {};
      if (academicFilters.term) filters.term = academicFilters.term;
      if (academicFilters.formId) filters.formId = academicFilters.formId;
      if (academicFilters.classId) filters.classId = academicFilters.classId;

      const [perf, dist, rank] = await Promise.all([
        reportService.getAcademicPerformanceReport(institutionId || null, filters),
        reportService.getGradeDistribution(institutionId || null, filters),
        reportService.getStudentRankings(institutionId || null, { term: academicFilters.term, limit: 10 })
      ]);
      setPerformanceData(perf);
      setGradeDistribution(dist);
      setRankings(rank);
    } catch (err) {
      setError('Failed to load academic data');
      console.error(err);
    } finally {
      setAcademicLoading(false);
    }
  }, [institutionId, academicFilters]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const filters = {};
      if (attendanceFilters.startDate) filters.startDate = attendanceFilters.startDate;
      if (attendanceFilters.endDate) filters.endDate = attendanceFilters.endDate;

      const data = await reportService.getAttendanceByClass(institutionId || null, filters);
      setAttendanceData(data);
    } catch (err) {
      setError('Failed to load attendance data');
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [institutionId, attendanceFilters]);

  // Auto-fetch when tab changes
  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
  }, [activeTab, fetchOverview]);

  useEffect(() => {
    if (activeTab === 'academic') fetchAcademic();
  }, [activeTab, fetchAcademic]);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
  }, [activeTab, fetchAttendance]);

  // Export handlers
  const handleExportOverviewPDF = () => {
    exportOverviewPDF(stats, studentsByForm, userDistribution, instName);
  };

  const handleExportOverviewCSV = () => {
    const allData = [
      ...(studentsByForm || []).map(f => ({ category: 'Students by Form', label: f.name, value: f.students })),
      ...(userDistribution || []).map(u => ({ category: 'User Distribution', label: u.role, value: u.count }))
    ];
    exportCSV(allData, [
      { label: 'Category', key: 'category' },
      { label: 'Label', key: 'label' },
      { label: 'Value', key: 'value' }
    ], 'Overview_Report');
  };

  const handleExportAcademicPDF = () => {
    const filterLabels = {};
    if (academicFilters.term) filterLabels.termLabel = `Term ${academicFilters.term}`;
    if (academicFilters.formId) {
      const f = forms.find(f => String(f.form_id) === String(academicFilters.formId));
      filterLabels.formLabel = f?.form_name || `Form ${f?.form_number}`;
    }
    if (academicFilters.classId) {
      const c = classes.find(c => String(c.class_id) === String(academicFilters.classId));
      filterLabels.classLabel = c?.class_name;
    }
    exportAcademicPDF(performanceData, gradeDistribution, rankings, filterLabels, instName);
  };

  const handleExportAcademicCSV = () => {
    exportCSV(performanceData, [
      { label: 'Form', key: 'formName' },
      { label: 'Class', key: 'className' },
      { label: 'Subject', key: 'subjectName' },
      { label: 'Average %', key: 'averageGrade' },
      { label: 'Highest', key: 'highest' },
      { label: 'Lowest', key: 'lowest' },
      { label: 'Students', key: 'studentCount' }
    ], 'Academic_Performance');
  };

  const handleExportAttendancePDF = () => {
    exportAttendancePDF(attendanceData, attendanceFilters, instName);
  };

  const handleExportAttendanceCSV = () => {
    exportCSV(attendanceData, [
      { label: 'Form', key: 'formName' },
      { label: 'Class', key: 'className' },
      { label: 'Total Records', key: 'totalRecords' },
      { label: 'Present', key: 'present' },
      { label: 'Absent', key: 'absent' },
      { label: 'Late', key: 'late' },
      { label: 'Rate %', key: 'rate' }
    ], 'Attendance_Report');
  };

  // Stat card component
  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-3 p-3 me-3 bg-${color} bg-opacity-10`}>
          {React.cloneElement(icon, { className: `text-${color}`, size: 22 })}
        </div>
        <div>
          <p className="text-muted mb-0 small">{title}</p>
          <h4 className="mb-0 fw-bold">{value}</h4>
        </div>
      </Card.Body>
    </Card>
  );

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="text-muted mt-2">Loading report data...</p>
    </div>
  );

  // No data message
  const NoData = ({ message }) => (
    <div className="text-center py-5">
      <FaChartLine size={48} className="text-muted mb-3" />
      <p className="text-muted">{message || 'No data available'}</p>
    </div>
  );

  // Overview Tab
  const renderOverview = () => {
    if (overviewLoading) return <LoadingSpinner />;
    if (!stats) return <NoData message="Unable to load overview statistics" />;

    return (
      <>
        {/* Stat cards */}
        <Row className="g-3 mb-4">
          <Col xs={6} lg><StatCard title="Students" value={stats.students} icon={<FaGraduationCap />} color="primary" /></Col>
          <Col xs={6} lg><StatCard title="Teachers" value={stats.teachers} icon={<FaUsers />} color="success" /></Col>
          <Col xs={6} lg><StatCard title="Classes" value={stats.classes} icon={<FaBook />} color="info" /></Col>
          <Col xs={6} lg><StatCard title="Subjects" value={stats.subjects} icon={<FaBook />} color="warning" /></Col>
          <Col xs={6} lg><StatCard title="Forms" value={stats.forms} icon={<FaClipboardCheck />} color="secondary" /></Col>
        </Row>

        <Row className="g-4">
          {/* Students by Form Chart */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0 fw-bold">Students by Form</h6>
              </Card.Header>
              <Card.Body>
                {studentsByForm.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentsByForm} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="students" fill="#3498db" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData message="No enrollment data available" />
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* User Distribution Pie */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0 fw-bold">User Distribution</h6>
              </Card.Header>
              <Card.Body>
                {userDistribution.some(u => u.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userDistribution.filter(u => u.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="role"
                        label={({ role, count }) => `${role}: ${count}`}
                      >
                        {userDistribution.filter(u => u.count > 0).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData message="No user data available" />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  // Academic Performance Tab
  const renderAcademic = () => {
    const gradeDistArray = gradeDistribution
      ? Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count }))
      : [];

    return (
      <>
        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Term</Form.Label>
                  <Form.Select
                    size="sm"
                    value={academicFilters.term}
                    onChange={e => setAcademicFilters(prev => ({ ...prev, term: e.target.value }))}
                  >
                    <option value="">All Terms</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Form</Form.Label>
                  <Form.Select
                    size="sm"
                    value={academicFilters.formId}
                    onChange={e => setAcademicFilters(prev => ({ ...prev, formId: e.target.value, classId: '' }))}
                  >
                    <option value="">All Forms</option>
                    {forms.map(f => (
                      <option key={f.form_id} value={f.form_id}>
                        {f.form_name || `Form ${f.form_number}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Class</Form.Label>
                  <Form.Select
                    size="sm"
                    value={academicFilters.classId}
                    onChange={e => setAcademicFilters(prev => ({ ...prev, classId: e.target.value }))}
                    disabled={!academicFilters.formId}
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Button variant="primary" size="sm" onClick={fetchAcademic} disabled={academicLoading}>
                  {academicLoading ? <Spinner animation="border" size="sm" /> : 'Apply Filters'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {academicLoading ? <LoadingSpinner /> : (
          <>
            {/* Grade Distribution Chart */}
            {gradeDistArray.some(g => g.count > 0) && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-bottom">
                  <h6 className="mb-0 fw-bold">Grade Distribution</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={gradeDistArray} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="grade" tick={{ fontSize: 14, fontWeight: 'bold' }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {gradeDistArray.map((entry, i) => (
                          <Cell key={i} fill={GRADE_COLORS[entry.grade] || '#95a5a6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            )}

            {/* Performance Table */}
            {performanceData.length > 0 ? (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-bottom">
                  <h6 className="mb-0 fw-bold">Class Subject Averages</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Form</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th className="text-center">Average</th>
                        <th className="text-center">Highest</th>
                        <th className="text-center">Lowest</th>
                        <th className="text-center">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((r, i) => (
                        <tr key={i}>
                          <td>{r.formName}</td>
                          <td>{r.className}</td>
                          <td>{r.subjectName}</td>
                          <td className="text-center">
                            <Badge bg={r.averageGrade >= 70 ? 'success' : r.averageGrade >= 50 ? 'warning' : 'danger'}>
                              {r.averageGrade}%
                            </Badge>
                          </td>
                          <td className="text-center text-success">{r.highest}%</td>
                          <td className="text-center text-danger">{r.lowest}%</td>
                          <td className="text-center">{r.studentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            ) : (
              !academicLoading && <NoData message="No academic performance data found. Try different filters." />
            )}

            {/* Top / Bottom Students */}
            <Row className="g-4">
              {rankings.top?.length > 0 && (
                <Col lg={6}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom d-flex align-items-center">
                      <FaTrophy className="text-warning me-2" />
                      <h6 className="mb-0 fw-bold">Top Performers</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th width="50">#</th>
                            <th>Student</th>
                            <th className="text-center">Average</th>
                            <th className="text-center">Tests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.top.map((s, i) => (
                            <tr key={s.studentId}>
                              <td>
                                <Badge bg={i < 3 ? 'warning' : 'light'} text={i < 3 ? 'dark' : 'dark'}>
                                  {i + 1}
                                </Badge>
                              </td>
                              <td>{s.name}</td>
                              <td className="text-center">
                                <span className="text-success fw-bold"><FaArrowUp size={10} /> {s.average}%</span>
                              </td>
                              <td className="text-center">{s.assessmentCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              {rankings.bottom?.length > 0 && (
                <Col lg={6}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom d-flex align-items-center">
                      <FaExclamationTriangle className="text-danger me-2" />
                      <h6 className="mb-0 fw-bold">Students Needing Support</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th width="50">#</th>
                            <th>Student</th>
                            <th className="text-center">Average</th>
                            <th className="text-center">Tests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.bottom.map((s, i) => (
                            <tr key={s.studentId}>
                              <td><Badge bg="light" text="dark">{i + 1}</Badge></td>
                              <td>{s.name}</td>
                              <td className="text-center">
                                <span className="text-danger fw-bold"><FaArrowDown size={10} /> {s.average}%</span>
                              </td>
                              <td className="text-center">{s.assessmentCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          </>
        )}
      </>
    );
  };

  // Attendance Tab
  const renderAttendance = () => (
    <>
      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold">Start Date</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={attendanceFilters.startDate}
                  onChange={e => setAttendanceFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold">End Date</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={attendanceFilters.endDate}
                  onChange={e => setAttendanceFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button variant="primary" size="sm" onClick={fetchAttendance} disabled={attendanceLoading}>
                {attendanceLoading ? <Spinner animation="border" size="sm" /> : 'Apply Filters'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {attendanceLoading ? <LoadingSpinner /> : (
        <>
          {/* Attendance Rate Chart */}
          {attendanceData.length > 0 && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0 fw-bold">Attendance Rate by Class</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={attendanceData.map(d => ({ name: `${d.formName} - ${d.className}`, rate: d.rate }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {attendanceData.map((entry, i) => (
                        <Cell key={i} fill={entry.rate >= 90 ? '#2ecc71' : entry.rate >= 80 ? '#f39c12' : '#e74c3c'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}

          {/* Attendance Table */}
          {attendanceData.length > 0 ? (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0 fw-bold">Attendance Details</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Form</th>
                      <th>Class</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Present</th>
                      <th className="text-center">Absent</th>
                      <th className="text-center">Late</th>
                      <th className="text-center">Excused</th>
                      <th className="text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((r, i) => (
                      <tr key={i}>
                        <td>{r.formName}</td>
                        <td>{r.className}</td>
                        <td className="text-center">{r.totalRecords}</td>
                        <td className="text-center text-success">{r.present}</td>
                        <td className="text-center text-danger">{r.absent}</td>
                        <td className="text-center text-warning">{r.late}</td>
                        <td className="text-center">{r.excused || 0}</td>
                        <td className="text-center">
                          <Badge bg={r.rate >= 90 ? 'success' : r.rate >= 80 ? 'warning' : 'danger'}>
                            {r.rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan={2}>Total</td>
                      <td className="text-center">{attendanceData.reduce((s, r) => s + r.totalRecords, 0)}</td>
                      <td className="text-center">{attendanceData.reduce((s, r) => s + r.present, 0)}</td>
                      <td className="text-center">{attendanceData.reduce((s, r) => s + r.absent, 0)}</td>
                      <td className="text-center">{attendanceData.reduce((s, r) => s + r.late, 0)}</td>
                      <td className="text-center">{attendanceData.reduce((s, r) => s + (r.excused || 0), 0)}</td>
                      <td className="text-center">
                        {(() => {
                          const total = attendanceData.reduce((s, r) => s + r.totalRecords, 0);
                          const present = attendanceData.reduce((s, r) => s + r.present + r.late, 0);
                          return total > 0 ? `${Math.round((present / total) * 1000) / 10}%` : '—';
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            !attendanceLoading && <NoData message="No attendance data found. Try different date filters." />
          )}
        </>
      )}
    </>
  );

  // Export buttons per tab
  const renderExportButtons = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <OverlayTrigger placement="bottom" overlay={<BTooltip>Export as PDF</BTooltip>}>
              <Button variant="outline-danger" size="sm" onClick={handleExportOverviewPDF} disabled={overviewLoading}>
                <FaFilePdf className="me-1" /> PDF
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={<BTooltip>Export as CSV</BTooltip>}>
              <Button variant="outline-success" size="sm" onClick={handleExportOverviewCSV} disabled={overviewLoading}>
                <FaFileCsv className="me-1" /> CSV
              </Button>
            </OverlayTrigger>
          </>
        );
      case 'academic':
        return (
          <>
            <OverlayTrigger placement="bottom" overlay={<BTooltip>Export as PDF</BTooltip>}>
              <Button variant="outline-danger" size="sm" onClick={handleExportAcademicPDF} disabled={academicLoading || !performanceData.length}>
                <FaFilePdf className="me-1" /> PDF
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={<BTooltip>Export as CSV</BTooltip>}>
              <Button variant="outline-success" size="sm" onClick={handleExportAcademicCSV} disabled={academicLoading || !performanceData.length}>
                <FaFileCsv className="me-1" /> CSV
              </Button>
            </OverlayTrigger>
          </>
        );
      case 'attendance':
        return (
          <>
            <OverlayTrigger placement="bottom" overlay={<BTooltip>Export as PDF</BTooltip>}>
              <Button variant="outline-danger" size="sm" onClick={handleExportAttendancePDF} disabled={attendanceLoading || !attendanceData.length}>
                <FaFilePdf className="me-1" /> PDF
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={<BTooltip>Export as CSV</BTooltip>}>
              <Button variant="outline-success" size="sm" onClick={handleExportAttendanceCSV} disabled={attendanceLoading || !attendanceData.length}>
                <FaFileCsv className="me-1" /> CSV
              </Button>
            </OverlayTrigger>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container className="py-4">
      <Breadcrumb items={breadcrumbItems} />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h2 className="mb-1">
                <FaChartLine className="me-2 text-primary" />
                Reports & Analytics
              </h2>
              <p className="text-muted mb-0">Comprehensive reports with data insights and export</p>
            </div>
            <div className="d-flex gap-2">
              {renderExportButtons()}
            </div>
          </div>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="pills" className="mb-4 gap-2">
          <Nav.Item>
            <Nav.Link eventKey="overview" className="d-flex align-items-center gap-2">
              <FaUsers size={14} /> Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="academic" className="d-flex align-items-center gap-2">
              <FaGraduationCap size={14} /> Academic Performance
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="attendance" className="d-flex align-items-center gap-2">
              <FaClipboardCheck size={14} /> Attendance
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="overview">{activeTab === 'overview' && renderOverview()}</Tab.Pane>
          <Tab.Pane eventKey="academic">{activeTab === 'academic' && renderAcademic()}</Tab.Pane>
          <Tab.Pane eventKey="attendance">{activeTab === 'attendance' && renderAttendance()}</Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
}

export default ReportsTab;
