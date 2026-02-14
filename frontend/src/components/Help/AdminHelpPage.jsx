import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Badge, Alert } from 'react-bootstrap';
import {
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate, FaSchool,
  FaCog, FaChartLine, FaFileAlt, FaUserPlus, FaClipboardList,
  FaGraduationCap, FaCalendarAlt, FaDatabase, FaShieldAlt,
  FaSearch, FaFilter, FaDownload, FaUpload, FaEdit, FaTrash,
  FaCheckCircle, FaInfoCircle, FaQuestionCircle, FaArrowRight
} from 'react-icons/fa';
import './HelpPage.css';

function AdminHelpPage() {
  const [activeKey, setActiveKey] = useState('0');

  return (
    <Container fluid className="help-page-container">
      <Row>
        <Col>
          <div className="help-header mb-4">
            <h1 className="display-4">
              <FaShieldAlt className="me-3" />
              Administrator Help Guide
            </h1>
            <p className="lead text-muted">
              Comprehensive guide to managing your Learning Management System
            </p>
          </div>

          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>Welcome, Administrator!</strong> This guide covers all administrative features 
            available in the LaunchPad SKN LMS. Use the sections below to learn about each feature.
          </Alert>

          <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k)} className="help-accordion">
            {/* Dashboard Overview */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaChartLine className="me-2" />
                <strong>Dashboard Overview</strong>
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={6}>
                    <h5>Main Dashboard Features</h5>
                    <ul>
                      <li><strong>Statistics Overview:</strong> View key metrics at a glance</li>
                      <li><strong>Quick Access Cards:</strong> Navigate to major management sections</li>
                      <li><strong>Recent Activity:</strong> Monitor system activity and changes</li>
                      <li><strong>Navigation Tabs:</strong> Access Overview, Institutions, Students, Instructors, Courses, and Reports</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h5>Key Metrics Displayed</h5>
                    <ul>
                      <li>Total number of students</li>
                      <li>Total number of instructors</li>
                      <li>Active courses/subjects</li>
                      <li>System-wide statistics</li>
                    </ul>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            {/* Form Management */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaGraduationCap className="me-2" />
                <strong>Form Management</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Creating and Managing Forms (Year Groups)</h5>
                <p>Forms represent year groups in the Caribbean secondary school system (Form 1, Form 2, etc.)</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>Create Forms:</strong> Add new year groups to the system</li>
                  <li><strong>Edit Forms:</strong> Update form names, academic years, and settings</li>
                  <li><strong>Assign Coordinators:</strong> Assign form coordinators to oversee each form</li>
                  <li><strong>Set Academic Years:</strong> Configure academic year periods</li>
                  <li><strong>View Statistics:</strong> See enrollment counts and form status</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Creating a Form</h6>
                <ol>
                  <li>Navigate to <strong>Admin Dashboard → Forms</strong></li>
                  <li>Click <Badge bg="primary">+ Add New Form</Badge></li>
                  <li>Enter form name (e.g., "Form 1", "Form 2")</li>
                  <li>Set academic year start and end dates</li>
                  <li>Optionally assign a form coordinator</li>
                  <li>Click <Badge bg="success">Save</Badge></li>
                </ol>

                <Alert variant="warning" className="mt-3">
                  <strong>Important:</strong> Forms must be created before classes can be assigned to them.
                </Alert>
              </Accordion.Body>
            </Accordion.Item>

            {/* Class Management */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaUsers className="me-2" />
                <strong>Class Management</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Creating and Managing Classes</h5>
                <p>Classes are groups within a Form (e.g., Form 3A, Form 3B)</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>Create Classes:</strong> Add classes within each Form</li>
                  <li><strong>Assign Form Tutors:</strong> Assign homeroom teachers to classes</li>
                  <li><strong>Set Capacity:</strong> Define maximum enrollment for each class</li>
                  <li><strong>Room Assignment:</strong> Assign physical classroom locations</li>
                  <li><strong>Auto-Generate Codes:</strong> System automatically generates class codes</li>
                  <li><strong>Enrollment Tracking:</strong> View current enrollment counts</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Creating a Class</h6>
                <ol>
                  <li>Navigate to <strong>Admin Dashboard → Classes</strong></li>
                  <li>Select the Form from the dropdown</li>
                  <li>Click <Badge bg="primary">+ Add New Class</Badge></li>
                  <li>Enter class name (e.g., "3A", "3B")</li>
                  <li>Set capacity and room number</li>
                  <li>Assign a form tutor (homeroom teacher)</li>
                  <li>Click <Badge bg="success">Save</Badge></li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            {/* Subject Management */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FaBook className="me-2" />
                <strong>Subject Management</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Managing Subjects and Curriculum</h5>
                <p>The Subject Management section has two main tabs:</p>
                
                <h6 className="mt-3">1. Subjects Tab</h6>
                <ul>
                  <li><strong>Create Subjects:</strong> Add subjects to the catalog (e.g., Mathematics, English Language)</li>
                  <li><strong>CXC Codes:</strong> Set CSEC/CAPE codes for Caribbean examinations</li>
                  <li><strong>Department Assignment:</strong> Assign subjects to academic departments</li>
                  <li><strong>School Linking:</strong> Link subjects to specific schools</li>
                  <li><strong>Edit/Delete:</strong> Update or remove subjects as needed</li>
                </ul>

                <h6 className="mt-3">2. Form Offerings Tab</h6>
                <ul>
                  <li><strong>Add Subjects to Forms:</strong> Define which subjects are offered in each Form</li>
                  <li><strong>Curriculum Framework:</strong> Set curriculum standards and frameworks</li>
                  <li><strong>Learning Outcomes:</strong> Define expected learning outcomes per Form</li>
                  <li><strong>View Offerings:</strong> See all subjects offered in each Form</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Creating a Subject</h6>
                <ol>
                  <li>Navigate to <strong>Admin Dashboard → Subjects</strong></li>
                  <li>Click on <strong>Subjects Tab</strong></li>
                  <li>Click <Badge bg="primary">+ Add New Subject</Badge></li>
                  <li>Enter subject name and code</li>
                  <li>Set CXC code (if applicable)</li>
                  <li>Assign to a department</li>
                  <li>Click <Badge bg="success">Save</Badge></li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            {/* Student Assignment */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <FaUserGraduate className="me-2" />
                <strong>Student Assignment</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Assigning Students to Classes</h5>
                <p>Assign students to their homeroom classes within Forms</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>View All Assignments:</strong> See which students are in which classes</li>
                  <li><strong>Filter by Form/Class:</strong> Narrow down the view</li>
                  <li><strong>Search Students:</strong> Find specific students quickly</li>
                  <li><strong>Assign Students:</strong> Add students to classes</li>
                  <li><strong>Remove Assignments:</strong> Remove students from classes</li>
                  <li><strong>Unassigned View:</strong> See students not yet assigned to any class</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Assigning a Student</h6>
                <ol>
                  <li>Navigate to <strong>Admin Dashboard → Student Assignment</strong></li>
                  <li>Filter by Form and Class (optional)</li>
                  <li>Search for the student by name</li>
                  <li>Click <Badge bg="primary">Assign</Badge> next to the student</li>
                  <li>Select the target class from the dropdown</li>
                  <li>Click <Badge bg="success">Confirm</Badge></li>
                </ol>

                <Alert variant="info" className="mt-3">
                  <strong>Tip:</strong> Use bulk assignment features to assign multiple students at once.
                </Alert>
              </Accordion.Body>
            </Accordion.Item>

            {/* Class-Subject Assignment */}
            <Accordion.Item eventKey="5">
              <Accordion.Header>
                <FaClipboardList className="me-2" />
                <strong>Class-Subject Assignment</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Assigning Subjects to Classes and Teachers</h5>
                <p>Define which subjects each class studies and assign teachers</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>Assign Subjects to Classes:</strong> Define the curriculum for each class</li>
                  <li><strong>Assign Teachers:</strong> Assign instructors to teach specific subjects in specific classes</li>
                  <li><strong>View Current Assignments:</strong> See all class-subject-teacher combinations</li>
                  <li><strong>Filter Options:</strong> Filter by Form, Class, or Subject</li>
                  <li><strong>Remove Assignments:</strong> Unassign subjects or teachers as needed</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Assigning a Subject to a Class</h6>
                <ol>
                  <li>Navigate to <strong>Admin Dashboard → Class-Subject Assignment</strong></li>
                  <li>Select Form and Class from filters</li>
                  <li>Click <Badge bg="primary">+ Assign Subject</Badge></li>
                  <li>Select the subject from the dropdown</li>
                  <li>Select the teacher to assign</li>
                  <li>Click <Badge bg="success">Save</Badge></li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            {/* User Management */}
            <Accordion.Item eventKey="6">
              <Accordion.Header>
                <FaUserPlus className="me-2" />
                <strong>User Management</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Managing System Users</h5>
                <p>Create and manage user accounts for students, teachers, and administrators</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>Create Users:</strong> Add new user accounts</li>
                  <li><strong>Assign Roles:</strong> Set user roles (admin, instructor, student)</li>
                  <li><strong>Edit Users:</strong> Update user information</li>
                  <li><strong>Deactivate Users:</strong> Disable user accounts</li>
                  <li><strong>View User Lists:</strong> See all users with filtering options</li>
                  <li><strong>Bulk Operations:</strong> Import users from CSV files</li>
                </ul>

                <h6 className="mt-3">User Roles:</h6>
                <ul>
                  <li><Badge bg="danger">Admin</Badge> - Full system access</li>
                  <li><Badge bg="primary">Instructor/Teacher</Badge> - Teaching and grading access</li>
                  <li><Badge bg="success">Student</Badge> - Learning and assignment access</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Instructor Management */}
            <Accordion.Item eventKey="7">
              <Accordion.Header>
                <FaChalkboardTeacher className="me-2" />
                <strong>Instructor Management</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Managing Teachers and Instructors</h5>
                <p>Add, edit, and manage instructor accounts and assignments</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>Add Instructors:</strong> Create new teacher accounts</li>
                  <li><strong>View All Instructors:</strong> See complete instructor list</li>
                  <li><strong>Edit Information:</strong> Update instructor details</li>
                  <li><strong>View Assignments:</strong> See which classes/subjects each instructor teaches</li>
                  <li><strong>Department Assignment:</strong> Assign instructors to departments</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Reports and Analytics */}
            <Accordion.Item eventKey="8">
              <Accordion.Header>
                <FaChartLine className="me-2" />
                <strong>Reports and Analytics</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>System Reports and Data Analysis</h5>
                <p>Access comprehensive reports and analytics</p>
                
                <h6 className="mt-3">Available Reports:</h6>
                <ul>
                  <li><strong>Enrollment Reports:</strong> Student enrollment by Form/Class</li>
                  <li><strong>Attendance Reports:</strong> System-wide attendance statistics</li>
                  <li><strong>Grade Reports:</strong> Academic performance analytics</li>
                  <li><strong>User Activity:</strong> System usage and activity logs</li>
                  <li><strong>Curriculum Coverage:</strong> Subject coverage tracking</li>
                  <li><strong>Export Options:</strong> Download reports as PDF or CSV</li>
                </ul>

                <h6 className="mt-3">Accessing Reports:</h6>
                <ol>
                  <li>Navigate to <strong>Admin Dashboard → Reports Tab</strong></li>
                  <li>Select the report type</li>
                  <li>Apply filters (date range, Form, Class, etc.)</li>
                  <li>Click <Badge bg="primary">Generate Report</Badge></li>
                  <li>Download or view the report</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            {/* Best Practices */}
            <Accordion.Item eventKey="9">
              <Accordion.Header>
                <FaCheckCircle className="me-2" />
                <strong>Best Practices & Tips</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Administrative Best Practices</h5>
                
                <h6 className="mt-3">Setup Workflow:</h6>
                <ol>
                  <li><strong>Start with Forms:</strong> Create all Forms first</li>
                  <li><strong>Create Classes:</strong> Add classes within each Form</li>
                  <li><strong>Add Subjects:</strong> Create subject catalog</li>
                  <li><strong>Assign Subjects to Forms:</strong> Define Form offerings</li>
                  <li><strong>Assign Students:</strong> Place students in classes</li>
                  <li><strong>Assign Subjects to Classes:</strong> Define class curriculum</li>
                  <li><strong>Assign Teachers:</strong> Assign instructors to class-subject combinations</li>
                </ol>

                <h6 className="mt-3">Tips for Efficiency:</h6>
                <ul>
                  <li>Use bulk operations when assigning multiple students</li>
                  <li>Regularly review and update class capacities</li>
                  <li>Keep subject catalog organized by department</li>
                  <li>Use filters and search to quickly find information</li>
                  <li>Export reports regularly for record-keeping</li>
                  <li>Review unassigned students periodically</li>
                </ul>

                <Alert variant="success" className="mt-3">
                  <strong>Pro Tip:</strong> Use the search and filter features extensively to manage large datasets efficiently.
                </Alert>
              </Accordion.Body>
            </Accordion.Item>

            {/* Troubleshooting */}
            <Accordion.Item eventKey="10">
              <Accordion.Header>
                <FaQuestionCircle className="me-2" />
                <strong>Troubleshooting</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Common Issues and Solutions</h5>
                
                <h6 className="mt-3">Issue: Cannot assign student to class</h6>
                <p><strong>Solution:</strong> Ensure the class exists and has not reached capacity.</p>

                <h6 className="mt-3">Issue: Subject not appearing in class assignment</h6>
                <p><strong>Solution:</strong> Verify the subject is added to the Form's offerings first.</p>

                <h6 className="mt-3">Issue: Teacher cannot see assigned classes</h6>
                <p><strong>Solution:</strong> Confirm the class-subject assignment includes the teacher.</p>

                <h6 className="mt-3">Issue: Reports not generating</h6>
                <p><strong>Solution:</strong> Check that filters are set correctly and data exists for the selected criteria.</p>

                <Alert variant="warning" className="mt-3">
                  <strong>Need More Help?</strong> Contact your system administrator or refer to the technical documentation.
                </Alert>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <Card className="mt-4 help-footer">
            <Card.Body>
              <h5>Quick Navigation</h5>
              <Row>
                <Col md={4}>
                  <h6>Management Pages</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />Forms Management</li>
                    <li><FaArrowRight className="me-2" />Classes Management</li>
                    <li><FaArrowRight className="me-2" />Subjects Management</li>
                    <li><FaArrowRight className="me-2" />Student Assignment</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>User Management</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />User Management</li>
                    <li><FaArrowRight className="me-2" />Instructor Management</li>
                    <li><FaArrowRight className="me-2" />Enrollment Approval</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Reports & Analytics</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />Dashboard Reports</li>
                    <li><FaArrowRight className="me-2" />Export Data</li>
                    <li><FaArrowRight className="me-2" />System Analytics</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminHelpPage;

