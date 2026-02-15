import React from 'react';
import SubjectManagement from '../Admin/SubjectManagement';

function InstitutionScopedSubjectManagement() {
  // Subjects and curriculum are shared nationally — no institution scoping needed
  return <SubjectManagement />;
}

export default InstitutionScopedSubjectManagement;

