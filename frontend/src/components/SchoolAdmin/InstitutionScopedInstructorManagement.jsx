import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import ManageInstructors from '../Admin/ManageInstructors';

function InstitutionScopedInstructorManagement({ institutionId }) {
  return (
    <Container>
      <Alert variant="info" className="mb-4">
        <strong>Institution-Scoped View:</strong> Showing instructors for your institution only.
      </Alert>
      <ManageInstructors institutionId={institutionId} />
    </Container>
  );
}

export default InstitutionScopedInstructorManagement;

