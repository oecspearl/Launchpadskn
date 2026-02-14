import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContextSupabase';
import StudentManagement from '../Admin/StudentManagement';

function InstitutionScopedStudentManagement({ institutionId: propId }) {
  const { user } = useAuth();
  const institutionId = propId || user?.institution_id;

  if (!institutionId) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          No institution assigned to your account. Please contact an administrator.
        </Alert>
      </Container>
    );
  }

  return <StudentManagement institutionId={institutionId} />;
}

export default InstitutionScopedStudentManagement;
