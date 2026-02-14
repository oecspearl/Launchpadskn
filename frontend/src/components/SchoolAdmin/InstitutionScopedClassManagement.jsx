import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContextSupabase';
import ClassManagement from '../Admin/ClassManagement';

function InstitutionScopedClassManagement({ institutionId: propId }) {
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

  return <ClassManagement institutionId={institutionId} />;
}

export default InstitutionScopedClassManagement;

