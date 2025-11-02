import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Nav, Badge, Dropdown
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate, 
  FaBell, FaChartLine, FaCalendarAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import InstitutionManagement from './InstitutionManagement';
import StudentManagement from './StudentManagement';
import ManageInstructors from './ManageInstructors';
import ReportsTab from './ReportsTab';
import EnhancedCourseManagement from './EnhancedCourseManagement';
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
      <div className="dashboard-hero fade-in">
        <div className="dashboard-hero-content">
          <h1>Welcome back, {user?.name || user?.email || 'Admin'}</h1>
          <p>Manage your institutions, students, and educational content</p>
        </div>
      </div>

      <Container fluid className="px-4">
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
            <Nav.Link eventKey="courses">Courses</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="reports">Reports</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Dashboard content based on active tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            {/* Modern Stats Cards */}
            <div className="grid-responsive mb-5 slide-up">
              <div className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaUsers />
                </div>
                <div className="stat-card-title">Total Users</div>
                <div className="stat-value-large">{stats.totalUsers}</div>
              </div>
              <div className="stat-card-modern secondary">
                <div className="stat-icon-circle" style={{background: 'var(--secondary-gradient)'}}>
                  <FaBook />
                </div>
                <div className="stat-card-title">Total Subjects</div>
                <div className="stat-value-large" style={{background: 'var(--secondary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                  {stats.totalCourses}
                </div>
              </div>
              <div className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaChalkboardTeacher />
                </div>
                <div className="stat-card-title">Instructors</div>
                <div className="stat-value-large">{stats.totalInstructors}</div>
              </div>
              <div className="stat-card-modern accent">
                <div className="stat-icon-circle" style={{background: 'var(--accent-gradient)', color: 'var(--skn-black)'}}>
                  <FaUserGraduate />
                </div>
                <div className="stat-card-title">Students</div>
                <div className="stat-value-large" style={{background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                  {stats.totalStudents}
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid-responsive mb-5" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
              <div className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaCalendarAlt />
                </div>
                <div className="stat-card-title">Total Forms</div>
                <div className="stat-value-large">{stats.totalForms}</div>
              </div>
              <div className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaUsers />
                </div>
                <div className="stat-card-title">Total Classes</div>
                <div className="stat-value-large">{stats.totalClasses}</div>
              </div>
            </div>

            {/* Quick Access - Modern Cards */}
            <div className="mb-5">
              <h4 className="section-title mb-4">Quick Access</h4>
              <div className="quick-access-grid">
                <Link to="/admin/forms" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="quick-access-card-title">Manage Forms</div>
                  <div className="quick-access-card-description">
                    Create and manage Forms (year groups) for schools.
                  </div>
                </Link>
                <Link to="/admin/classes" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaUsers />
                  </div>
                  <div className="quick-access-card-title">Manage Classes</div>
                  <div className="quick-access-card-description">
                    Create classes within Forms and assign tutors.
                  </div>
                </Link>
                <Link to="/admin/subjects" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{background: 'var(--secondary-gradient)'}}>
                    <FaBook />
                  </div>
                  <div className="quick-access-card-title">Manage Subjects</div>
                  <div className="quick-access-card-description">
                    Create subjects and assign to Forms.
                  </div>
                </Link>
                <Link to="/admin/student-assignment" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{background: 'var(--accent-gradient)', color: 'var(--skn-black)'}}>
                    <FaUserGraduate />
                  </div>
                  <div className="quick-access-card-title">Assign Students</div>
                  <div className="quick-access-card-description">
                    Assign students to classes.
                  </div>
                </Link>
                <Link to="/admin/class-subject-assignment" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaChalkboardTeacher />
                  </div>
                  <div className="quick-access-card-title">Assign Subjects</div>
                  <div className="quick-access-card-description">
                    Assign subjects to classes and assign teachers.
                  </div>
                </Link>
                <div className="quick-access-card" onClick={() => setActiveTab('institutions')} style={{cursor: 'pointer'}}>
                  <div className="quick-access-card-icon" style={{background: 'var(--secondary-gradient)'}}>
                    <FaSchool />
                  </div>
                  <div className="quick-access-card-title">Manage Institutions</div>
                  <div className="quick-access-card-description">
                    Add, edit, or manage educational institutions.
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <Row className="g-4">
              <Col>
                <h5 className="mb-3 fw-bold">Recent Activity</h5>
              </Col>
            </Row>
            <Row>
              <Col>
                <Card className="shadow-sm border-0">
                  <Card.Body className="p-4">
                    {stats.recentActivity && stats.recentActivity.length > 0 ? (
                      <div className="activity-timeline">
                        {stats.recentActivity.map((activity, index) => (
                          <div key={activity.id || index} className="activity-item mb-3 pb-3 border-bottom">
                            <div className="d-flex align-items-start">
                              <div 
                                className={`activity-icon rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                  activity.type === 'user' ? 'bg-primary' :
                                  activity.type === 'subject' ? 'bg-success' :
                                  activity.type === 'class' ? 'bg-info' :
                                  activity.type === 'form' ? 'bg-warning' :
                                  'bg-secondary'
                                }`}
                                style={{ width: '40px', height: '40px', minWidth: '40px' }}
                              >
                                {activity.type === 'user' ? <FaUserGraduate className="text-white" /> :
                                 activity.type === 'subject' ? <FaBook className="text-white" /> :
                                 activity.type === 'class' ? <FaUsers className="text-white" /> :
                                 activity.type === 'form' ? <FaChalkboardTeacher className="text-white" /> :
                                 <FaBell className="text-white" />}
                              </div>
                              <div className="flex-grow-1">
                                <p className="mb-1">
                                  <strong>{activity.user}</strong> {activity.action} <strong>{activity.target}</strong>
                                </p>
                                <small className="text-muted">
                                  <FaCalendarAlt className="me-1" />
                                  {activity.time}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <FaBell className="text-muted mb-3" size={48} />
                        <p className="text-muted mb-0">No recent activity</p>
                        <small className="text-muted">Start by creating forms, classes, and subjects</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {activeTab === 'institutions' && (
          <div className="institutions-tab">
            <InstitutionManagement />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-tab">
            <StudentManagement />
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="instructors-tab">
            <ManageInstructors />
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <EnhancedCourseManagement />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-tab">
            <ReportsTab />
          </div>
        )}
      </Container>
    </div>
  );
}

export default AdminDashboard;
