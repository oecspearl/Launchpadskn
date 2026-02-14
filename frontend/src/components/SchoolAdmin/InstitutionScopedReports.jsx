import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContextSupabase';
import ReportsTab from '../Admin/ReportsTab';

function InstitutionScopedReports({ institutionId: propId }) {
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

  return <ReportsTab institutionId={institutionId} />;
}

export default InstitutionScopedReports;

