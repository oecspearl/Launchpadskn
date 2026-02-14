import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaArrowLeft, FaUserGraduate, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaUserShield } from 'react-icons/fa';
import { userService } from '../../services/userService';
import { studentService } from '../../services/studentService';

function StudentProfileView() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const { data: student, isLoading, error } = useQuery({
        queryKey: ['student-profile', studentId],
        queryFn: () => userService.getUserProfile(studentId),
        enabled: !!studentId
    });

    const { data: grades = [] } = useQuery({
        queryKey: ['student-grades', studentId],
        queryFn: () => studentService.getStudentGrades(studentId),
        enabled: !!studentId
    });

    if (isLoading) {
        return (
            <Container className="mt-4 text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error || !student) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    {error?.message || 'Student not found'}
                </Alert>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" />
                    Back
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Button
                variant="outline-secondary"
                className="mb-4"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft className="me-2" />
                Back
            </Button>

            <Row>
                <Col md={4}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="text-center py-5">
                            <div className="mb-3">
                                <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                    <FaUserGraduate size={50} className="text-primary" />
                                </div>
                            </div>
                            <h3 className="mb-1">{student.name}</h3>
                            <p className="text-muted mb-3">{student.email}</p>
                            <Badge bg={student.is_active ? 'success' : 'danger'}>
                                {student.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0">Contact Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <div className="d-flex align-items-center text-muted mb-1">
                                    <FaEnvelope className="me-2" /> Email
                                </div>
                                <div>{student.email}</div>
                            </div>
                            {student.phone && (
                                <div className="mb-3">
                                    <div className="d-flex align-items-center text-muted mb-1">
                                        <FaPhone className="me-2" /> Phone
                                    </div>
                                    <div>{student.phone}</div>
                                </div>
                            )}
                            {student.address && (
                                <div className="mb-3">
                                    <div className="d-flex align-items-center text-muted mb-1">
                                        <FaMapMarkerAlt className="me-2" /> Address
                                    </div>
                                    <div>{student.address}</div>
                                </div>
                            )}
                            {student.date_of_birth && (
                                <div className="mb-3">
                                    <div className="d-flex align-items-center text-muted mb-1">
                                        <FaBirthdayCake className="me-2" /> Date of Birth
                                    </div>
                                    <div>{new Date(student.date_of_birth).toLocaleDateString()}</div>
                                </div>
                            )}
                            {student.emergency_contact && (
                                <div>
                                    <div className="d-flex align-items-center text-muted mb-1">
                                        <FaUserShield className="me-2" /> Emergency Contact
                                    </div>
                                    <div>{student.emergency_contact}</div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0">Academic Overview</h5>
                        </Card.Header>
                        <Card.Body>
                            {grades.length === 0 ? (
                                <p className="text-muted text-center py-4">No grades recorded yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Assessment</th>
                                                <th>Grade</th>
                                                <th>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grades.slice(0, 5).map((grade, idx) => (
                                                <tr key={idx}>
                                                    <td>{grade.assessment?.class_subject?.subject_offering?.subject?.subject_name || 'N/A'}</td>
                                                    <td>{grade.assessment?.assessment_name || 'N/A'}</td>
                                                    <td>
                                                        <Badge bg={
                                                            grade.grade_letter === 'A' ? 'success' :
                                                                grade.grade_letter === 'B' ? 'info' :
                                                                    grade.grade_letter === 'C' ? 'warning' : 'danger'
                                                        }>
                                                            {grade.grade_letter}
                                                        </Badge>
                                                    </td>
                                                    <td>{grade.marks_obtained}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default StudentProfileView;
