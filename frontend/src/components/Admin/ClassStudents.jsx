import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Alert, Spinner, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { classService } from '../../services/classService';

const ClassStudents = () => {
    const { classId } = useParams();
    const navigate = useNavigate();

    const { data: students, isLoading, error } = useQuery({
        queryKey: ['classStudents', classId],
        queryFn: async () => {
            const data = await classService.getClassRoster(classId);
            return (data || []).map(item => item.student);
        },
        enabled: !!classId
    });

    if (isLoading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">Failed to load students: {error.message}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex align-items-center mb-3">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/admin/classes')} className="me-3">
                    <FaArrowLeft className="me-1" /> Back to Classes
                </Button>
                <h2 className="mb-0">Students in Class {classId}</h2>
            </div>
            {!students || students.length === 0 ? (
                <Alert variant="info">No students enrolled.</Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr key={s.user_id}>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default ClassStudents;
