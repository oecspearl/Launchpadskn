import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import ClassManagement from '../Admin/ClassManagement';

function InstitutionScopedClassManagement({ institutionId }) {
  // This component wraps ClassManagement and filters by institution
  // The ClassManagement component will be updated to support institution scoping
  return (
    <Container>
      <Alert variant="info" className="mb-4">
        <strong>Institution-Scoped View:</strong> Showing classes for your institution only.
      </Alert>
      <ClassManagement institutionId={institutionId} />
    </Container>
  );
}

export default InstitutionScopedClassManagement;

