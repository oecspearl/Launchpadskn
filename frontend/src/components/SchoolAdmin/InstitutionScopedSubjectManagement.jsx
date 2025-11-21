import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import SubjectManagement from '../Admin/SubjectManagement';

function InstitutionScopedSubjectManagement({ institutionId }) {
  return (
    <Container>
      <Alert variant="info" className="mb-4">
        <strong>Institution-Scoped View:</strong> Showing subjects for your institution only.
      </Alert>
      <SubjectManagement institutionId={institutionId} />
    </Container>
  );
}

export default InstitutionScopedSubjectManagement;

