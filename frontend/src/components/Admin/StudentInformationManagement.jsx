import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Tabs, Tab, Button, Spinner, Alert,
  Badge, Form, InputGroup
} from 'react-bootstrap';
import {
  FaUser, FaHistory, FaExchangeAlt, FaWheelchair, FaExclamationTriangle,
  FaEdit, FaSave, FaTimes, FaSearch
} from 'react-icons/fa';
import studentInformationService from '../../services/studentInformationService';
import StudentProfile from './StudentProfile';
import StudentLifecycle from './StudentLifecycle';
import TransferManagement from './TransferManagement';
import SpecialNeedsTracking from './SpecialNeedsTracking';
import DisciplinaryRecords from './DisciplinaryRecords';
import './StudentInformationManagement.css';

function StudentInformationManagement({ studentId, student }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [studentProfile, setStudentProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (studentId) {
      loadStudentProfile();
    }
  }, [studentId]);

  const loadStudentProfile = async () => {
    setLoading(true);
    try {
      const profile = await studentInformationService.getStudentProfile(studentId);
      setStudentProfile(profile);
    } catch (error) {
      console.error('Error loading student profile:', error);
      // Profile might not exist yet, that's okay
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-3">Loading student information...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="student-information-management py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>
                <FaUser className="me-2" />
                Student Information Management
              </h3>
              {student && (
                <p className="text-muted mb-0">
                  {student.name} ({student.email})
                </p>
              )}
            </div>
            <div>
              {studentProfile && (
                <Badge bg={
                  studentProfile.graduation_status === 'GRADUATED' ? 'success' :
                  studentProfile.graduation_status === 'ENROLLED' ? 'primary' :
                  studentProfile.graduation_status === 'TRANSFERRED' ? 'info' :
                  'secondary'
                } className="me-2" style={{ fontSize: '1rem', padding: '0.5rem' }}>
                  {studentProfile.graduation_status || 'ENROLLED'}
                </Badge>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Quick Stats */}
      {studentProfile && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Student Number</h6>
                    <h5 className="mb-0">{studentProfile.student_number || 'Not Assigned'}</h5>
                  </div>
                  <FaUser className="text-primary" style={{ fontSize: '2rem' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">GPA</h6>
                    <h5 className="mb-0">
                      {studentProfile.gpa ? studentProfile.gpa.toFixed(2) : 'N/A'}
                    </h5>
                  </div>
                  <FaUser className="text-success" style={{ fontSize: '2rem' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Grade Level</h6>
                    <h5 className="mb-0">{studentProfile.current_grade_level || 'N/A'}</h5>
                  </div>
                  <FaUser className="text-info" style={{ fontSize: '2rem' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Academic Year</h6>
                    <h5 className="mb-0">{studentProfile.academic_year || 'N/A'}</h5>
                  </div>
                  <FaUser className="text-warning" style={{ fontSize: '2rem' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="profile" title={
          <>
            <FaUser className="me-1" />
            Profile
          </>
        }>
          <StudentProfile
            studentId={studentId}
            student={student}
            profile={studentProfile}
            onProfileUpdate={loadStudentProfile}
          />
        </Tab>

        <Tab eventKey="lifecycle" title={
          <>
            <FaHistory className="me-1" />
            Lifecycle
          </>
        }>
          <StudentLifecycle
            studentId={studentId}
            student={student}
          />
        </Tab>

        <Tab eventKey="transfers" title={
          <>
            <FaExchangeAlt className="me-1" />
            Transfers
          </>
        }>
          <TransferManagement
            studentId={studentId}
            student={student}
          />
        </Tab>

        <Tab eventKey="special-needs" title={
          <>
            <FaWheelchair className="me-1" />
            Special Needs
          </>
        }>
          <SpecialNeedsTracking
            studentId={studentId}
            student={student}
          />
        </Tab>

        <Tab eventKey="disciplinary" title={
          <>
            <FaExclamationTriangle className="me-1" />
            Disciplinary
          </>
        }>
          <DisciplinaryRecords
            studentId={studentId}
            student={student}
          />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default StudentInformationManagement;

