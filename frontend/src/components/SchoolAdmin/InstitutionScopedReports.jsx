import React from 'react';
import { Container, Card, Alert } from 'react-bootstrap';
import ReportsTab from '../Admin/ReportsTab';

function InstitutionScopedReports({ institutionId }) {
  return (
    <Container>
      <Alert variant="info" className="mb-4">
        <strong>Institution-Scoped Reports:</strong> Showing reports and analytics for your institution only.
      </Alert>
      <ReportsTab institutionId={institutionId} />
    </Container>
  );
}

export default InstitutionScopedReports;

