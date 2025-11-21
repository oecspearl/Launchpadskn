import React, { useState } from 'react';
import { Nav, Tabs, Tab } from 'react-bootstrap';
import { FaUsers, FaBook, FaChalkboardTeacher } from 'react-icons/fa';
import ClassManagement from './ClassManagement';
import ClassSubjectAssignment from './ClassSubjectAssignment';

function ClassesTab() {
  const [activeSubTab, setActiveSubTab] = useState('classes');

  return (
    <div className="classes-tab">
      <Tabs
        activeKey={activeSubTab}
        onSelect={(k) => setActiveSubTab(k || 'classes')}
        className="mb-4"
      >
        <Tab eventKey="classes" title={
          <span>
            <FaUsers className="me-2" />
            Manage Classes
          </span>
        }>
          <div className="mt-4">
            <ClassManagement />
          </div>
        </Tab>
        
        <Tab eventKey="assignments" title={
          <span>
            <FaBook className="me-2" />
            <FaChalkboardTeacher className="me-2" />
            Class-Subject Assignment
          </span>
        }>
          <div className="mt-4">
            <ClassSubjectAssignment />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

export default ClassesTab;

