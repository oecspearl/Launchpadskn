import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Form, Badge
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaTimesCircle, FaClock, FaUserCheck, FaSave
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function AttendanceMarking() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data
  const [lesson, setLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});
  
  useEffect(() => {
    if (lessonId) {
      fetchData();
    }
  }, [lessonId]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get lesson details
      const { data: lessonData } = await supabase
        .from('lessons')
        .select(`
          *,
          class_subject:class_subjects(
            *,
            class:classes(
              *,
              form:forms(*)
            )
          )
        `)
        .eq('lesson_id', lessonId)
        .single();
      
      setLesson(lessonData);
      
      // Get students for this class
      const classId = lessonData?.class_subject?.class_id;
      if (classId) {
        const { data: studentsData } = await supabase
          .from('student_class_assignments')
          .select(`
            *,
            student:users(*)
          `)
          .eq('class_id', classId)
          .eq('is_active', true);
        
        setStudents((studentsData || []).map(s => s.student).filter(Boolean));
        
        // Get existing attendance
        const { data: attendanceData } = await supabase
          .from('lesson_attendance')
          .select('*')
          .eq('lesson_id', lessonId);
        
        const attendanceMap = {};
        const notesMap = {};
        (attendanceData || []).forEach(att => {
          attendanceMap[att.student_id] = att.status;
          notesMap[att.student_id] = att.notes || '';
        });
        
        setAttendance(attendanceMap);
        setAttendanceNotes(notesMap);
      }
      
      setIsLoading(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching data:', err);
      setError('Failed to load attendance data');
      setIsLoading(false);
    }
  };
  
  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };
  
  const handleNoteChange = (studentId, note) => {
    setAttendanceNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Batch upsert attendance for all students
      const now = new Date().toISOString();
      const records = students.map(student => ({
        lesson_id: parseInt(lessonId),
        student_id: student.user_id,
        status: attendance[student.user_id] || 'ABSENT',
        notes: attendanceNotes[student.user_id] || '',
        marked_by: user.userId,
        marked_at: now
      }));

      const { error: upsertError } = await supabase
        .from('lesson_attendance')
        .upsert(records, { onConflict: 'lesson_id,student_id' });

      if (upsertError) throw upsertError;
      
      setSuccess('Attendance saved successfully');
      fetchData(); // Refresh to show saved data
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error saving attendance:', err);
      setError(err.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };
  
  // Calculate stats
  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;
  const lateCount = Object.values(attendance).filter(s => s === 'LATE').length;
  const totalMarked = Object.keys(attendance).length;
  
  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }
  
  if (!lesson) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Lesson not found</Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Mark Attendance</h2>
              <p className="text-muted mb-0">
                {lesson.class_subject?.subject_offering?.subject?.subject_name} • 
                {formatDate(lesson.lesson_date)} • 
                {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
              </p>
            </div>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              <FaSave className="me-2" />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {/* Attendance Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{presentCount}</h3>
              <small>Present</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-danger text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{absentCount}</h3>
              <small>Absent</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{lateCount}</h3>
              <small>Late</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{totalMarked}/{students.length}</h3>
              <small>Marked</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Attendance Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaUserCheck className="me-2" />
            Student Attendance
          </h5>
        </Card.Header>
        <Card.Body>
          {students.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No students in this class</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Excused</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const currentStatus = attendance[student.user_id] || 'ABSENT';
                  return (
                    <tr key={student.user_id}>
                      <td>
                        <strong>{student.name || student.email}</strong>
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="radio"
                          name={`attendance-${student.user_id}`}
                          checked={currentStatus === 'PRESENT'}
                          onChange={() => handleAttendanceChange(student.user_id, 'PRESENT')}
                          label={<FaCheckCircle className="text-success" />}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="radio"
                          name={`attendance-${student.user_id}`}
                          checked={currentStatus === 'ABSENT'}
                          onChange={() => handleAttendanceChange(student.user_id, 'ABSENT')}
                          label={<FaTimesCircle className="text-danger" />}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="radio"
                          name={`attendance-${student.user_id}`}
                          checked={currentStatus === 'LATE'}
                          onChange={() => handleAttendanceChange(student.user_id, 'LATE')}
                          label={<FaClock className="text-warning" />}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="radio"
                          name={`attendance-${student.user_id}`}
                          checked={currentStatus === 'EXCUSED'}
                          onChange={() => handleAttendanceChange(student.user_id, 'EXCUSED')}
                          label={<Badge bg="info">Excused</Badge>}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={attendanceNotes[student.user_id] || ''}
                          onChange={(e) => handleNoteChange(student.user_id, e.target.value)}
                          placeholder="Optional notes"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      <div className="mt-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="primary" className="ms-2" onClick={handleSave} disabled={isSaving}>
          <FaSave className="me-2" />
          {isSaving ? 'Saving...' : 'Save Attendance'}
        </Button>
      </div>
    </Container>
  );
}

export default AttendanceMarking;

