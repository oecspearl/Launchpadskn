import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Nav, Badge, Dropdown
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate, FaUserPlus,
  FaBell, FaChartLine, FaCalendarAlt, FaSchool, FaCube
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import InstitutionManagement from './InstitutionManagement';
import StudentManagement from './StudentManagement';
import ManageInstructors from './ManageInstructors';
import ReportsTab from './ReportsTab';
import EnhancedCourseManagement from './EnhancedCourseManagement';
import ClassesTab from './ClassesTab';
import './AdminDashboard.css';

function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  // State to store dashboard statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalForms: 0,
    totalClasses: 0,
    recentActivity: []
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Function to fetch dashboard statistics using Supabase
  const fetchDashboardStats = async () => {
    try {
      console.log('[AdminDashboard] Starting to fetch stats...');

      // Fetch stats with reasonable timeout (5 seconds max)
      // Use Promise.race only to prevent infinite loading, not to replace data
      const statsPromise = supabaseService.getDashboardStats().catch(err => {
        console.warn('[AdminDashboard] Stats fetch error:', err);
        return { totalUsers: 0, totalSubjects: 0, totalInstructors: 0, totalStudents: 0, totalForms: 0, totalClasses: 0 };
      });

      // Timeout to prevent infinite loading, but don't replace data if it's still loading
      let statsResolved = false;
      const statsTimeout = setTimeout(() => {
        if (!statsResolved) {
          console.warn('[AdminDashboard] Stats fetch taking longer than expected...');
        }
      }, 5000);

      const data = await statsPromise;
      statsResolved = true;
      clearTimeout(statsTimeout);

      console.log('[AdminDashboard] Stats received:', data);

      // Fetch recent activity with reasonable timeout (3 seconds max)
      let recentActivity = [];
      try {
        let activityResolved = false;
        const activityPromise = supabaseService.getRecentActivity(5).catch(err => {
          console.warn('[AdminDashboard] Activity fetch error:', err);
          return [];
        });

        const activityTimeout = setTimeout(() => {
          if (!activityResolved) {
            console.warn('[AdminDashboard] Activity fetch taking longer than expected...');
          }
        }, 3000);

        recentActivity = await activityPromise;
        activityResolved = true;
        clearTimeout(activityTimeout);

        console.log('[AdminDashboard] Activity received:', recentActivity?.length || 0);
      } catch (activityError) {
        console.warn('[AdminDashboard] Activity fetch failed:', activityError);
        recentActivity = [];
      }

      // Update state with actual data
      setStats({
        totalUsers: data?.totalUsers || 0,
        totalCourses: data?.totalSubjects || data?.totalCourses || 0,
        totalInstructors: data?.totalInstructors || 0,
        totalStudents: data?.totalStudents || 0,
        totalForms: data?.totalForms || 0,
        totalClasses: data?.totalClasses || 0,
        recentActivity: Array.isArray(recentActivity) ? recentActivity : []
      });

      setIsLoading(false);
      setError(null);

    } catch (err) {
      console.error('[AdminDashboard] Error fetching data:', err);

      // Set defaults only on actual error - dashboard should still display
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalInstructors: 0,
        totalStudents: 0,
        totalForms: 0,
        totalClasses: 0,
        recentActivity: []
      });
      setIsLoading(false);
      setError(null); // Don't show error, just show empty dashboard
    }
  };

  // Fetch dashboard statistics when component mounts
  useEffect(() => {
    console.log('[AdminDashboard] Component mounted, user:', user?.email, 'isAuthenticated:', isAuthenticated);

    // If no user AND not authenticated, don't fetch
    // But also check localStorage as fallback (auth state might be loading)
    if (!user && !isAuthenticated) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('[AdminDashboard] Found stored user, using it:', parsedUser.email);
          // Use stored user temporarily until auth context updates
          setStats(prev => ({ ...prev })); // Trigger a re-render
        } catch (e) {
          console.warn('[AdminDashboard] Could not parse stored user');
        }
      }

      if (!storedUser) {
        console.warn('[AdminDashboard] No user and no stored auth, skipping fetch');
        setIsLoading(false);
        return;
      }
    }

    // If we have a user or stored auth, proceed with fetch
    const userId = user?.userId || user?.id || (() => {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored).userId || JSON.parse(stored).id : null;
      } catch {
        return null;
      }
    })();

    if (!userId) {
      console.warn('[AdminDashboard] No userId available, skipping fetch');
      setIsLoading(false);
      return;
    }

    // Fetch data - let fetchDashboardStats handle its own timeout logic
    // The function will set isLoading to false when done, so we don't need an outer timeout
    fetchDashboardStats();

  }, [user, isAuthenticated]); // Re-run when user or auth state changes

  // Show loading spinner while fetching data (max 3 seconds)
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  // Show error message if data fetching failed (but we won't show this usually)
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>Unable to Load Dashboard Data</Alert.Heading>
          <p>Dashboard is showing with default values. Some statistics may not be available.</p>
          <Button onClick={fetchDashboardStats} variant="outline-primary">Retry</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Modern Hero Header */}
      <div className="dashboard-welcome">
        <div className="dashboard-hero-content">
          <h1>Welcome back, {user?.name || user?.email || 'Admin'}</h1>
          <p>Manage your institutions, students, and educational content</p>
        </div>
      </div>

      <Container className="px-4">
        {/* Navigation tabs - Mobile Friendly */}
        <Nav variant="tabs" className="nav-tabs mb-4" activeKey={activeTab} onSelect={setActiveTab}>
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="institutions">Institutions</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="students">Students</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="instructors">Instructors</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="classes">Classes</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="reports">Reports</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Dashboard content based on active tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            {/* Modern Stats Cards */}
            <div className="stats-section">
              <Row className="g-4">
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="activity-icon user me-3">
                        <FaUsers />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Total Users</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalUsers}</h3>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="activity-icon subject me-3" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890FF' }}>
                        <FaBook />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Total Subjects</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalCourses}</h3>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="activity-icon form me-3" style={{ background: 'rgba(252, 209, 22, 0.1)', color: '#FCD116' }}>
                        <FaChalkboardTeacher />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Instructors</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalInstructors}</h3>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="activity-icon class me-3" style={{ background: 'rgba(206, 17, 38, 0.1)', color: '#CE1126' }}>
                        <FaUserGraduate />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Students</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalStudents}</h3>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Quick Access - Modern Cards */}
            <div className="quick-actions-section">
              <h4 className="section-title">Quick Access</h4>
              <Row className="g-4">
                <Col md={4}>
                  <Link to="/admin/forms" className="text-decoration-none">
                    <Card className="h-100 border-0 shadow-sm activity-item">
                      <Card.Body className="d-flex align-items-start">
                        <div className="activity-icon me-3" style={{ background: 'rgba(0, 150, 57, 0.1)', color: 'var(--theme-primary)' }}>
                          <FaCalendarAlt />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-2">Manage Forms</h6>
                          <p className="text-muted small mb-0">Create and manage Forms (year groups) for schools.</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/admin/classes" className="text-decoration-none">
                    <Card className="h-100 border-0 shadow-sm activity-item">
                      <Card.Body className="d-flex align-items-start">
                        <div className="activity-icon me-3" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890FF' }}>
                          <FaUsers />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-2">Manage Classes</h6>
                          <p className="text-muted small mb-0">Create classes within Forms and assign tutors.</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/admin/subjects" className="text-decoration-none">
                    <Card className="h-100 border-0 shadow-sm activity-item">
                      <Card.Body className="d-flex align-items-start">
                        <div className="activity-icon me-3" style={{ background: 'rgba(252, 209, 22, 0.1)', color: '#FCD116' }}>
                          <FaBook />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-2">Manage Subjects</h6>
                          <p className="text-muted small mb-0">Create subjects and assign to Forms.</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/admin/student-assignment" className="text-decoration-none">
                    <Card className="h-100 border-0 shadow-sm activity-item">
                      <Card.Body className="d-flex align-items-start">
                        <div className="activity-icon me-3" style={{ background: 'rgba(206, 17, 38, 0.1)', color: '#CE1126' }}>
                          <FaUserGraduate />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-2">Assign Students</h6>
                          <p className="text-muted small mb-0">Assign students to classes.</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/admin/users" className="text-decoration-none">
                    <Card className="h-100 border-0 shadow-sm activity-item">
                      <Card.Body className="d-flex align-items-start">
                        <div className="activity-icon me-3" style={{ background: 'rgba(102, 16, 242, 0.1)', color: '#6610f2' }}>
                          <FaUserPlus />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-2">User Management</h6>
                          <p className="text-muted small mb-0">Add, edit, assign roles, and manage users.</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <div onClick={() => setActiveTab('institutions')} style={{ cursor: 'pointer' }}>
                    <Card className="h-100 border-0 shadow-sm activity-item">
                      <Card.Body className="d-flex align-items-start">
                        <div className="activity-icon me-3" style={{ background: 'rgba(253, 126, 20, 0.1)', color: '#fd7e14' }}>
                          <FaSchool />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-2">Manage Institutions</h6>
                          <p className="text-muted small mb-0">Add, edit, or manage educational institutions.</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
              <h4 className="section-title">Recent Activity</h4>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                    <div className="p-3">
                      {stats.recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="activity-item mb-2">
                          <div className={`activity-icon ${activity.type === 'user' ? 'user' : 'subject'}`}>
                            {activity.type === 'user' ? <FaUserGraduate /> : <FaBell />}
                          </div>
                          <div className="activity-content">
                            <div className="activity-text">
                              <strong>{activity.user}</strong> {activity.action} <strong>{activity.target}</strong>
                            </div>
                            <div className="activity-time">
                              <FaCalendarAlt className="me-1" />
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <FaBell className="mb-3" size={32} opacity={0.5} />
                      <p className="mb-0">No recent activity</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'institutions' && <InstitutionManagement />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'instructors' && <ManageInstructors />}
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'reports' && <ReportsTab />}

      </Container>
    </div>
  );
}

export default AdminDashboard;
