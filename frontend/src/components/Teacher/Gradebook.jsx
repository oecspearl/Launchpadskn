import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button, Form,
  Spinner, Alert, Tabs, Tab, InputGroup
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaBook, FaUser, FaChartLine, FaCalendarAlt, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle, FaDownload,
  FaFilter, FaSearch
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { gradebookService } from '../../services/gradebookService';
import { personName } from '../../utils/personName';

function Gradebook() {
  const { classSubjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('grades');
  
  // Data
  const [classSubject, setClassSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [grades, setGrades] = useState({}); // { studentId: { assessmentId: grade } }
  const [attendance, setAttendance] = useState({}); // { studentId: { lessonId: attendance } }
  const [lessons, setLessons] = useState([]);
  
  // Filters
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (classSubjectId) {
      fetchData();
    }
  }, [classSubjectId, selectedTerm]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get class-subject details
      const classSubjectData = await gradebookService.getClassSubject(classSubjectId);
      setClassSubject(classSubjectData);

      // Get students in this class
      const classId = classSubjectData.class_id;
      const studentList = (await gradebookService.getActiveStudentsByClass(classId))
        .sort((a, b) => personName(a).localeCompare(personName(b)));
      setStudents(studentList);

      // Get assessments
      const assessmentsData = await gradebookService.getAssessments(classSubjectId, selectedTerm);
      setAssessments(assessmentsData || []);

      // Get all grades for these students and assessments
      const studentIds = studentList.map(s => s.id);
      const assessmentIds = (assessmentsData || []).map(a => a.id);

      if (studentIds.length > 0 && assessmentIds.length > 0) {
        const gradesData = await gradebookService.getGrades(studentIds, assessmentIds);

        const gradesMap = {};
        (gradesData || []).forEach(grade => {
          if (!gradesMap[grade.student_id]) {
            gradesMap[grade.student_id] = {};
          }
          gradesMap[grade.student_id][grade.assessment_id] = grade;
        });
        setGrades(gradesMap);
      }
      
      // Get lessons for attendance
      const lessonsData = await gradebookService.getLessons(classSubjectId);
      setLessons(lessonsData || []);

      // Get attendance records
      if (studentIds.length > 0 && lessonsData && lessonsData.length > 0) {
        const lessonIds = lessonsData.map(l => l.id);
        // Create a map of lesson id to lesson date for quick lookup
        const lessonDateMap = {};
        lessonsData.forEach(lesson => {
          lessonDateMap[lesson.id] = lesson.date;
        });

        const attendanceData = await gradebookService.getAttendance(studentIds, lessonIds);

        // Group attendance by student and date (not by lesson)
        const attendanceMap = {};
        (attendanceData || []).forEach(att => {
          if (!attendanceMap[att.student_id]) {
            attendanceMap[att.student_id] = {};
          }
          // Use lesson date from the map
          const lessonDate = lessonDateMap[att.lesson_id];
          if (lessonDate) {
            const dateKey = new Date(lessonDate).toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // If multiple lessons on same day, prioritize: PRESENT > LATE > EXCUSED > ABSENT
            if (!attendanceMap[att.student_id][dateKey]) {
              attendanceMap[att.student_id][dateKey] = att;
            } else {
              const existingStatus = attendanceMap[att.student_id][dateKey].status;
              const newStatus = att.status;
              const priority = { 'PRESENT': 4, 'LATE': 3, 'EXCUSED': 2, 'ABSENT': 1 };
              if ((priority[newStatus] || 0) > (priority[existingStatus] || 0)) {
                attendanceMap[att.student_id][dateKey] = att;
              }
            }
          }
        });
        setAttendance(attendanceMap);
      }
      
      setIsLoading(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching gradebook data:', err);
      setError('Failed to load gradebook data');
      setIsLoading(false);
    }
  };
  
  const getGradeBadge = (grade, assessment) => {
    if (!grade || grade.marks_obtained == null) {
      return <Badge bg="secondary">-</Badge>;
    }
    
    const percentage = grade.percentage || 0;
    let variant = 'danger';
    if (percentage >= 70) variant = 'success';
    else if (percentage >= 50) variant = 'warning';
    
    return (
      <Badge bg={variant}>
        {grade.marks_obtained}/{assessment?.total_marks || 'N/A'}
        {' '}({percentage.toFixed(1)}%)
        {grade.grade_letter && ` - ${grade.grade_letter}`}
      </Badge>
    );
  };
  
  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'PRESENT':
        return <FaCheckCircle className="text-success" />;
      case 'ABSENT':
        return <FaTimesCircle className="text-danger" />;
      case 'LATE':
        return <FaClock className="text-warning" />;
      case 'EXCUSED':
        return <FaExclamationTriangle className="text-info" />;
      default:
        return <span className="text-muted">-</span>;
    }
  };
  
  const calculateStudentAverage = (studentId) => {
    const studentGrades = grades[studentId] || {};
    const gradedAssessments = Object.entries(studentGrades)
      .filter(([, g]) => g.marks_obtained != null)
      .map(([assessmentId, g]) => {
        const assessment = assessments.find(a => String(a.id) === String(assessmentId));
        return { marks: g.marks_obtained, total: assessment?.total_marks || 0 };
      })
      .filter(g => g.total > 0);

    if (gradedAssessments.length === 0) return null;

    const totalMarks = gradedAssessments.reduce((sum, g) => sum + g.marks, 0);
    const totalPossible = gradedAssessments.reduce((sum, g) => sum + g.total, 0);
    return ((totalMarks / totalPossible) * 100).toFixed(1);
  };
  
  const calculateAttendancePercentage = (studentId) => {
    const studentAttendance = attendance[studentId] || {};
    const attendanceRecords = Object.values(studentAttendance);
    
    if (attendanceRecords.length === 0) return null;
    
    const presentCount = attendanceRecords.filter(a => 
      a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    
    return ((presentCount / attendanceRecords.length) * 100).toFixed(1);
  };
  
  // Get unique dates from lessons, sorted by date (memoized)
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    lessons.forEach(lesson => {
      if (lesson.date) {
        const dateKey = new Date(lesson.date).toISOString().split('T')[0];
        dates.add(dateKey);
      }
    });
    return Array.from(dates).sort().reverse().slice(0, 30); // Last 30 days
  }, [lessons]);
  
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      personName(student).toLowerCase().includes(search) ||
      (student.email || '').toLowerCase().includes(search)
    );
  });
  
  const escapeCSV = (value) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadCSV = (headers, rows, filename) => {
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (activeTab === 'grades') {
      const headers = ['Student Name', 'Student Email', ...assessments.map(a => a.title), 'Average'];
      const rows = filteredStudents.map(student => [
        personName(student),
        student.email || '',
        ...assessments.map(assessment => {
          const grade = grades[student.id]?.[assessment.id];
          return grade ? `${grade.marks_obtained}/${assessment.total_marks} (${grade.percentage?.toFixed(1)}%)` : '-';
        }),
        calculateStudentAverage(student.id) || '-'
      ]);
      downloadCSV(headers, rows, `gradebook_${classSubject?.subject_offering?.subject?.name || 'grades'}.csv`);
    } else {
      const dates = uniqueDates;
      const dateHeaders = dates.map(dateKey => {
        const date = new Date(dateKey);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      });
      const headers = ['Student Name', 'Student Email', ...dateHeaders, 'Attendance %'];
      const rows = filteredStudents.map(student => {
        const studentAttendance = attendance[student.id] || {};
        return [
          personName(student),
          student.email || '',
          ...dates.map(dateKey => studentAttendance[dateKey]?.status || '-'),
          calculateAttendancePercentage(student.id) || '0'
        ];
      });
      downloadCSV(headers, rows, `attendance_${classSubject?.subject_offering?.subject?.name || 'attendance'}.csv`);
    }
  };
  
  if (isLoading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <FaBook className="me-2" />
                Gradebook
              </h2>
              {classSubject && (
                <p className="text-muted mb-0">
                  {classSubject.subject_offering?.subject?.name || 'Subject'} -
                  {classSubject.class?.name || 'Class'}
                  {classSubject.class?.form?.name && ` (${classSubject.class.form.name})`}
                </p>
              )}
            </div>
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <FaFilter className="me-2" />
                  Filter by Term
                </Form.Label>
                <Form.Select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  <option value="all">All Terms</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <FaSearch className="me-2" />
                  Search Students
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="primary" onClick={exportToCSV}>
                <FaDownload className="me-2" />
                Export to CSV
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="grades" title={
          <span>
            <FaChartLine className="me-2" />
            Grades
          </span>
        }>
          <Card>
            <Card.Body style={{ overflowX: 'auto' }}>
              {assessments.length === 0 ? (
                <Alert variant="info">
                  No assessments found for this class-subject.
                </Alert>
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      {assessments.map(assessment => (
                        <th key={assessment.id} style={{ minWidth: '150px' }}>
                          <div>{assessment.title}</div>
                          <small className="text-muted">
                            {assessment.type} ({assessment.total_marks} pts)
                          </small>
                        </th>
                      ))}
                      <th>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={assessments.length + 2} className="text-center">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const average = calculateStudentAverage(student.id);
                        return (
                          <tr key={student.id}>
                            <td>
                              <strong>{personName(student, student.email)}</strong>
                            </td>
                            {assessments.map(assessment => {
                              const grade = grades[student.id]?.[assessment.id];
                              return (
                                <td key={assessment.id} className="text-center">
                                  {getGradeBadge(grade, assessment)}
                                </td>
                              );
                            })}
                            <td className="text-center">
                              {average ? (
                                <Badge bg={average >= 70 ? 'success' : average >= 50 ? 'warning' : 'danger'}>
                                  {average}%
                                </Badge>
                              ) : (
                                <Badge bg="secondary">-</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="attendance" title={
          <span>
            <FaCalendarAlt className="me-2" />
            Attendance
          </span>
        }>
          <Card>
            <Card.Body style={{ overflowX: 'auto' }}>
              {lessons.length === 0 ? (
                <Alert variant="info">
                  No lessons found for this class-subject.
                </Alert>
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      {uniqueDates.map(dateKey => {
                        const date = new Date(dateKey);
                        return (
                          <th key={dateKey} style={{ minWidth: '100px' }}>
                            <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <small className="text-muted">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </small>
                          </th>
                        );
                      })}
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={uniqueDates.length + 2} className="text-center">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const attendancePercentage = calculateAttendancePercentage(student.id);
                        return (
                          <tr key={student.id}>
                            <td>
                              <strong>{personName(student, student.email)}</strong>
                            </td>
                            {uniqueDates.map(dateKey => {
                              const att = attendance[student.id]?.[dateKey];
                              return (
                                <td key={dateKey} className="text-center">
                                  {getAttendanceIcon(att?.status)}
                                </td>
                              );
                            })}
                            <td className="text-center">
                              {attendancePercentage ? (
                                <Badge bg={attendancePercentage >= 80 ? 'success' : attendancePercentage >= 60 ? 'warning' : 'danger'}>
                                  {attendancePercentage}%
                                </Badge>
                              ) : (
                                <Badge bg="secondary">-</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              )}
              {uniqueDates.length >= 30 && (
                <Alert variant="info" className="mt-3">
                  Showing attendance for the 30 most recent days.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Summary Statistics */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Grade Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Students:</span>
                <strong>{filteredStudents.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Assessments:</span>
                <strong>{assessments.length}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Students with Grades:</span>
                <strong>
                  {filteredStudents.filter(s => {
                    const studentGrades = grades[s.id] || {};
                    return Object.keys(studentGrades).length > 0;
                  }).length}
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Attendance Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Days with Lessons:</span>
                <strong>{uniqueDates.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Lessons:</span>
                <strong>{lessons.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Students with Records:</span>
                <strong>
                  {filteredStudents.filter(s => {
                    const studentAttendance = attendance[s.id] || {};
                    return Object.keys(studentAttendance).length > 0;
                  }).length}
                </strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Average Attendance:</span>
                <strong>
                  {(() => {
                    const percentages = filteredStudents
                      .map(s => parseFloat(calculateAttendancePercentage(s.id) || 0))
                      .filter(p => p > 0);
                    if (percentages.length === 0) return '0%';
                    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
                    return `${avg.toFixed(1)}%`;
                  })()}
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Gradebook;

