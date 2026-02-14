import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContextSupabase';
import SubjectManagement from '../Admin/SubjectManagement';

function InstitutionScopedSubjectManagement({ institutionId: propId }) {
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

  return <SubjectManagement institutionId={institutionId} />;
}

export default InstitutionScopedSubjectManagement;

