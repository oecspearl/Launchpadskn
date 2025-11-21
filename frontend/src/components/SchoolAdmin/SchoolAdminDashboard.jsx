import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Nav, Badge
} from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate, FaUserPlus,
  FaBell, FaChartLine, FaCalendarAlt, FaSchool, FaClipboardList
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import InstitutionScopedFormManagement from './InstitutionScopedFormManagement';
import InstitutionScopedClassManagement from './InstitutionScopedClassManagement';
import InstitutionScopedSubjectManagement from './InstitutionScopedSubjectManagement';
import InstitutionScopedStudentManagement from './InstitutionScopedStudentManagement';
import InstitutionScopedInstructorManagement from './InstitutionScopedInstructorManagement';
import InstitutionScopedReports from './InstitutionScopedReports';
import './SchoolAdminDashboard.css';

function SchoolAdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // State to store dashboard statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalForms: 0,
    totalClasses: 0,
    recentActivity: []
  });

  // Institution data
  const [institution, setInstitution] = useState(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Determine active tab from route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path.includes('/forms')) return 'forms';
    if (path.includes('/classes')) return 'classes';
    if (path.includes('/subjects')) return 'subjects';
    if (path.includes('/students')) return 'students';
    if (path.includes('/instructors')) return 'instructors';
    if (path.includes('/reports')) return 'reports';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]);

  // Function to fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.institution_id) {
        setError('No institution assigned. Please contact a system administrator.');
        setIsLoading(false);
        return;
      }

      // Load institution details
      const institutionData = await supabaseService.getInstitutionById(user.institution_id);
      setInstitution(institutionData);

      // Fetch institution-scoped stats
      const [students, instructors, classes, forms, subjects] = await Promise.all([
        supabaseService.getUsersByInstitution(user.institution_id, 'STUDENT'),
        supabaseService.getUsersByInstitution(user.institution_id, 'INSTRUCTOR'),
        supabaseService.getClassesByInstitution(user.institution_id),
        supabaseService.getFormsByInstitution(user.institution_id),
        supabaseService.getSubjectsByInstitution(user.institution_id)
      ]);

      setStats({
        totalUsers: (students?.length || 0) + (instructors?.length || 0),
        totalSubjects: subjects?.length || 0,
        totalInstructors: instructors?.length || 0,
        totalStudents: students?.length || 0,
        totalForms: forms?.length || 0,
        totalClasses: classes?.length || 0,
        recentActivity: []
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchDashboardStats();
    }
  }, [user, isAuthenticated]);

  if (isLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user?.institution_id) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <h5>No Institution Assigned</h5>
          <p>You don't have an institution assigned. Please contact a system administrator to assign you to an institution.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="school-admin-dashboard">
      {/* Hero Header */}
      <div className="dashboard-hero fade-in">
        <div className="dashboard-hero-content">
          <h1>Welcome back, {user?.name || user?.email || 'School Admin'}</h1>
          <p>Managing: <strong>{institution?.name || 'Your Institution'}</strong></p>
        </div>
      </div>

      <Container className="px-4">
        {/* Navigation tabs */}
        <Nav variant="tabs" className="nav-tabs mb-4" activeKey={activeTab} onSelect={setActiveTab}>
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="forms">Forms</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="classes">Classes</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="subjects">Subjects</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="students">Students</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="instructors">Instructors</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="reports">Reports</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Dashboard content based on active tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            {/* Stats Cards */}
            <div className="grid-responsive mb-5 slide-up">
              <Card className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaUsers />
                </div>
                <div className="stat-card-title">Total Students</div>
                <div className="stat-value-large">{stats.totalStudents}</div>
              </Card>
              <Card className="stat-card-modern secondary">
                <div className="stat-icon-circle" style={{ background: 'var(--secondary-gradient)' }}>
                  <FaChalkboardTeacher />
                </div>
                <div className="stat-card-title">Instructors</div>
                <div className="stat-value-large">{stats.totalInstructors}</div>
              </Card>
              <Card className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaBook />
                </div>
                <div className="stat-card-title">Total Subjects</div>
                <div className="stat-value-large">{stats.totalSubjects}</div>
              </Card>
              <Card className="stat-card-modern accent">
                <div className="stat-icon-circle" style={{ background: 'var(--accent-gradient)', color: 'var(--skn-black)' }}>
                  <FaUsers />
                </div>
                <div className="stat-card-title">Total Classes</div>
                <div className="stat-value-large">{stats.totalClasses}</div>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid-responsive mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <Card className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaCalendarAlt />
                </div>
                <div className="stat-card-title">Total Forms</div>
                <div className="stat-value-large">{stats.totalForms}</div>
              </Card>
            </div>

            {/* Quick Access */}
            <div className="mb-5">
              <h4 className="section-title mb-4">Quick Access</h4>
              <div className="quick-access-grid">
                <Link to="/school-admin/forms" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="quick-access-card-title">Manage Forms</div>
                  <div className="quick-access-card-description">
                    Create and manage Forms (year groups) for your institution.
                  </div>
                </Link>
                <Link to="/school-admin/classes" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaUsers />
                  </div>
                  <div className="quick-access-card-title">Manage Classes</div>
                  <div className="quick-access-card-description">
                    Create classes within Forms and assign tutors.
                  </div>
                </Link>
                <Link to="/school-admin/subjects" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'var(--secondary-gradient)' }}>
                    <FaBook />
                  </div>
                  <div className="quick-access-card-title">Manage Subjects</div>
                  <div className="quick-access-card-description">
                    Create subjects and assign to Forms.
                  </div>
                </Link>
                <Link to="/school-admin/students" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'var(--accent-gradient)', color: 'var(--skn-black)' }}>
                    <FaUserGraduate />
                  </div>
                  <div className="quick-access-card-title">Manage Students</div>
                  <div className="quick-access-card-description">
                    View and manage students in your institution.
                  </div>
                </Link>
                <Link to="/school-admin/instructors" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaChalkboardTeacher />
                  </div>
                  <div className="quick-access-card-title">Manage Instructors</div>
                  <div className="quick-access-card-description">
                    View and manage instructors in your institution.
                  </div>
                </Link>
                <Link to="/school-admin/reports" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' }}>
                    <FaChartLine />
                  </div>
                  <div className="quick-access-card-title">Reports</div>
                  <div className="quick-access-card-description">
                    View reports and analytics for your institution.
                  </div>
                </Link>
              </div>
            </div>

            {/* Institution Info */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">
                  <FaSchool className="me-2" />
                  Institution Information
                </h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Name:</strong> {institution?.name || 'N/A'}</p>
                    <p><strong>Location:</strong> {institution?.location || 'N/A'}</p>
                    <p><strong>Type:</strong> {institution?.institution_type || 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Contact:</strong> {institution?.contact || 'N/A'}</p>
                    <p><strong>Phone:</strong> {institution?.phone || 'N/A'}</p>
                    {institution?.website && (
                      <p><strong>Website:</strong> <a href={institution.website} target="_blank" rel="noopener noreferrer">{institution.website}</a></p>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'forms' && (
          <InstitutionScopedFormManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'classes' && (
          <InstitutionScopedClassManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'subjects' && (
          <InstitutionScopedSubjectManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'students' && (
          <InstitutionScopedStudentManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'instructors' && (
          <InstitutionScopedInstructorManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'reports' && (
          <InstitutionScopedReports institutionId={user.institution_id} />
        )}
      </Container>
    </div>
  );
}

export default SchoolAdminDashboard;

