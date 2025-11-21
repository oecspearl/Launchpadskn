import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import StudentManagement from '../Admin/StudentManagement';

function InstitutionScopedStudentManagement({ institutionId }) {
  return (
    <Container>
      <Alert variant="info" className="mb-4">
        <strong>Institution-Scoped View:</strong> Showing students for your institution only.
      </Alert>
      <StudentManagement institutionId={institutionId} />
    </Container>
  );
}

export default InstitutionScopedStudentManagement;

