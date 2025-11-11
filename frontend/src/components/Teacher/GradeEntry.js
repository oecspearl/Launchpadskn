import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Table, Form, Badge, Modal
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaSave, FaEdit, FaTrophy, FaClipboardList
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function GradeEntry() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data
  const [assessment, setAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMarks, setBulkMarks] = useState('');
  
  useEffect(() => {
    if (assessmentId) {
      fetchData();
    }
  }, [assessmentId]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get assessment details
      const { data: assessmentData } = await supabase
        .from('subject_assessments')
        .select(`
          *,
          class_subject:class_subjects(
            *,
            class:classes(
              *,
              form:forms(*)
            ),
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            )
          )
        `)
        .eq('assessment_id', assessmentId)
        .single();
      
      setAssessment(assessmentData);
      
      // Get students for this class
      const classId = assessmentData?.class_subject?.class_id;
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
        
        // Get existing grades
        const { data: gradesData } = await supabase
          .from('student_grades')
          .select('*')
          .eq('assessment_id', assessmentId);
        
        const gradesMap = {};
        (gradesData || []).forEach(grade => {
          gradesMap[grade.student_id] = {
            marks_obtained: grade.marks_obtained,
            percentage: grade.percentage,
            grade_letter: grade.grade_letter,
            comments: grade.comments || ''
          };
        });
        
        setGrades(gradesMap);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load grade entry data');
      setIsLoading(false);
    }
  };
  
  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => {
      const current = prev[studentId] || { marks_obtained: 0, percentage: 0, grade_letter: '', comments: '' };
      
      if (field === 'marks_obtained') {
        const marks = parseFloat(value) || 0;
        const totalMarks = assessment?.total_marks || 100;
        const percentage = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;
        
        // Calculate grade letter (Caribbean grading system)
        let gradeLetter = '';
        if (percentage >= 90) gradeLetter = 'A+';
        else if (percentage >= 80) gradeLetter = 'A';
        else if (percentage >= 70) gradeLetter = 'B+';
        else if (percentage >= 60) gradeLetter = 'B';
        else if (percentage >= 50) gradeLetter = 'C';
        else if (percentage >= 40) gradeLetter = 'D';
        else gradeLetter = 'F';
        
        return {
          ...prev,
          [studentId]: {
            ...current,
            marks_obtained: marks,
            percentage: Math.round(percentage * 100) / 100,
            grade_letter: gradeLetter
          }
        };
      } else {
        return {
          ...prev,
          [studentId]: {
            ...current,
            [field]: value
          }
        };
      }
    });
  };
  
  const handleBulkEntry = () => {
    // Parse bulk marks (format: studentId:marks,studentId:marks or just marks for all)
    const lines = bulkMarks.split('\n').filter(l => l.trim());
    const marksList = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes(':')) {
        const [studentId, marks] = trimmed.split(':').map(s => s.trim());
        if (studentId && marks) {
          marksList[studentId] = parseFloat(marks);
        }
      } else {
        // If no student ID, apply to all students in order
        const marks = parseFloat(trimmed);
        if (!isNaN(marks)) {
          students.forEach((student, index) => {
            if (!marksList[student.user_id] && index < lines.length) {
              marksList[student.user_id] = marks;
            }
          });
        }
      }
    });
    
    // Apply marks
    Object.keys(marksList).forEach(studentId => {
      handleGradeChange(studentId, 'marks_obtained', marksList[studentId]);
    });
    
    setShowBulkModal(false);
    setBulkMarks('');
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Save grades for each student
      for (const student of students) {
        const gradeData = grades[student.user_id];
        
        if (!gradeData || !gradeData.marks_obtained) {
          continue; // Skip students without marks
        }
        
        // Check if grade already exists
        const { data: existing } = await supabase
          .from('student_grades')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('student_id', student.user_id)
          .maybeSingle();
        
        const gradePayload = {
          assessment_id: parseInt(assessmentId),
          student_id: student.user_id,
          marks_obtained: gradeData.marks_obtained,
          total_marks: assessment.total_marks,
          percentage: gradeData.percentage,
          grade_letter: gradeData.grade_letter,
          comments: gradeData.comments || null,
          graded_by: user.userId,
          graded_at: new Date().toISOString()
        };
        
        if (existing) {
          // Update
          const { error } = await supabase
            .from('student_grades')
            .update(gradePayload)
            .eq('grade_id', existing.grade_id);
          
          if (error) throw error;
        } else {
          // Insert
          const { error } = await supabase
            .from('student_grades')
            .insert(gradePayload);
          
          if (error) throw error;
        }
      }
      
      setSuccess('Grades saved successfully');
      fetchData(); // Refresh
    } catch (err) {
      console.error('Error saving grades:', err);
      setError(err.message || 'Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Calculate stats
  const gradedCount = Object.values(grades).filter(g => g.marks_obtained > 0).length;
  const averageMark = students.length > 0 
    ? Object.values(grades)
        .filter(g => g.marks_obtained > 0)
        .reduce((sum, g) => sum + g.marks_obtained, 0) / gradedCount || 0
    : 0;
  
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
  
  if (!assessment) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Assessment not found</Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Grade Entry</h2>
              <p className="text-muted mb-0">
                {assessment.assessment_name} • 
                {assessment.class_subject?.subject_offering?.subject?.subject_name} • 
                Total Marks: {assessment.total_marks}
              </p>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => setShowBulkModal(true)}
              >
                Bulk Entry
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                <FaSave className="me-2" />
                {isSaving ? 'Saving...' : 'Save Grades'}
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {/* Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{gradedCount}/{students.length}</h3>
              <small>Graded</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{Math.round(averageMark * 100) / 100}</h3>
              <small>Average Mark</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center">
              <h3 className="mb-0">{assessment.total_marks}</h3>
              <small>Total Marks</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Grades Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0">
            <FaTrophy className="me-2" />
            Student Grades
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
                  <th>Marks Obtained</th>
                  <th>Total Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const grade = grades[student.user_id] || { marks_obtained: 0, percentage: 0, grade_letter: '', comments: '' };
                  return (
                    <tr key={student.user_id}>
                      <td>
                        <strong>{student.name || student.email}</strong>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          max={assessment.total_marks}
                          value={grade.marks_obtained || ''}
                          onChange={(e) => handleGradeChange(student.user_id, 'marks_obtained', e.target.value)}
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>{assessment.total_marks}</td>
                      <td>
                        <Badge bg={
                          grade.percentage >= 70 ? 'success' :
                          grade.percentage >= 50 ? 'warning' : 'danger'
                        }>
                          {grade.percentage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={
                          grade.grade_letter?.startsWith('A') ? 'success' :
                          grade.grade_letter?.startsWith('B') ? 'info' :
                          grade.grade_letter?.startsWith('C') ? 'warning' : 'danger'
                        }>
                          {grade.grade_letter || '-'}
                        </Badge>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={grade.comments || ''}
                          onChange={(e) => handleGradeChange(student.user_id, 'comments', e.target.value)}
                          placeholder="Optional comments"
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
      
      {/* Bulk Entry Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Bulk Grade Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Enter marks (one per line)</Form.Label>
          <Form.Control
            as="textarea"
            rows={10}
            value={bulkMarks}
            onChange={(e) => setBulkMarks(e.target.value)}
            placeholder={`Format:
1. Just marks (one per line): 
50
65
72
...

2. Student ID: Marks:
student_id_1: 50
student_id_2: 65
...`}
          />
          <Form.Text className="text-muted">
            Enter marks in order of students, or use Student ID: Marks format
          </Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBulkEntry}>
            Apply Marks
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default GradeEntry;

