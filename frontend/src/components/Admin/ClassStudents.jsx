import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Table, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../../config/supabase';

const ClassStudents = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data, error } = await supabase
                    .from('student_class_assignments')
                    .select('users!inner(*)')
                    .eq('class_id', classId)
                    .eq('is_active', true);
                if (error) throw error;
                // data contains objects with a "users" field
                const studentList = (data || []).map(item => item.users);
                setStudents(studentList);
            } catch (err) {
                console.error('Error loading students:', err);
                setError('Failed to load students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [classId]);

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2>Students in Class {classId}</h2>
            {students.length === 0 ? (
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
