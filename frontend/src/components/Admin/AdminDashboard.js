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
      
      // Fetch stats with aggressive timeout (1.5 seconds max)
      const statsPromise = supabaseService.getDashboardStats();
      const statsTimeout = new Promise((resolve) => 
        setTimeout(() => {
          console.warn('[AdminDashboard] Stats fetch timed out, using defaults');
          resolve({ totalUsers: 0, totalSubjects: 0, totalInstructors: 0, totalStudents: 0, totalForms: 0, totalClasses: 0 });
        }, 1500)
      );
      
      const data = await Promise.race([statsPromise, statsTimeout]);
      console.log('[AdminDashboard] Stats received:', data);
      
      // Fetch recent activity with timeout (1 second max)
      let recentActivity = [];
      try {
        const activityPromise = supabaseService.getRecentActivity(5);
        const activityTimeout = new Promise((resolve) => 
          setTimeout(() => {
            console.warn('[AdminDashboard] Activity fetch timed out, using empty array');
            resolve([]);
          }, 1000)
        );
        recentActivity = await Promise.race([activityPromise, activityTimeout]);
        console.log('[AdminDashboard] Activity received:', recentActivity?.length || 0);
      } catch (activityError) {
        console.warn('[AdminDashboard] Activity fetch failed:', activityError);
        recentActivity = [];
      }
      
      // Update state immediately
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
      
      // Set defaults immediately on error - dashboard should still display
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
    
    // Always stop loading after max 2 seconds (reduced from 3)
    const maxTimeout = setTimeout(() => {
      console.warn('[AdminDashboard] Max timeout reached, forcing display with defaults');
      setIsLoading(false);
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalInstructors: 0,
        totalStudents: 0,
        totalForms: 0,
        totalClasses: 0,
        recentActivity: []
      });
    }, 2000);
    
    // Fetch data with timeout protection
    const fetchPromise = fetchDashboardStats();
    const timeoutPromise = new Promise(resolve => setTimeout(() => {
      console.warn('[AdminDashboard] Fetch timeout, using defaults');
      setIsLoading(false);
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalInstructors: 0,
        totalStudents: 0,
        totalForms: 0,
        totalClasses: 0,
        recentActivity: []
      });
      resolve();
    }, 2000));
    
    Promise.race([fetchPromise, timeoutPromise]).finally(() => {
      clearTimeout(maxTimeout);
    });
    
    return () => clearTimeout(maxTimeout);
  }, [user]); // Re-run when user changes

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
      {/* Top navbar with notifications */}
      <div className="dashboard-header bg-white py-3 px-4 shadow-sm mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="mb-0">Admin Dashboard</h1>
            <p className="text-muted mb-0">Welcome back, {user?.name || user?.email || 'Admin'}</p>
          </Col>
          <Col xs="auto">
            <Badge pill bg="info" className="me-2">
              <FaBell /> {stats.recentActivity.length} activities
            </Badge>
          </Col>
        </Row>
      </div>

      <Container fluid className="px-4">
        {/* Navigation tabs */}
        <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
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
            {/* Stats cards row */}
            <Row className="g-4 mb-4">
              <Col md={3} sm={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex align-items-center p-4">
                    <div className="icon-bg bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <FaUsers className="text-primary" size={28} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 small">Total Users</h6>
                      <h3 className="mb-0 fw-bold">{stats.totalUsers}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex align-items-center p-4">
                    <div className="icon-bg bg-success bg-opacity-10 rounded-circle p-3 me-3">
                      <FaBook className="text-success" size={28} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 small">Total Subjects</h6>
                      <h3 className="mb-0 fw-bold">{stats.totalCourses}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex align-items-center p-4">
                    <div className="icon-bg bg-info bg-opacity-10 rounded-circle p-3 me-3">
                      <FaChalkboardTeacher className="text-info" size={28} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 small">Instructors</h6>
                      <h3 className="mb-0 fw-bold">{stats.totalInstructors}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex align-items-center p-4">
                    <div className="icon-bg bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                      <FaUserGraduate className="text-warning" size={28} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 small">Students</h6>
                      <h3 className="mb-0 fw-bold">{stats.totalStudents}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Additional stats row */}
            <Row className="g-4 mb-4">
              <Col md={6} sm={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex align-items-center p-4">
                    <div className="icon-bg bg-secondary bg-opacity-10 rounded-circle p-3 me-3">
                      <FaCalendarAlt className="text-secondary" size={28} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 small">Total Forms</h6>
                      <h3 className="mb-0 fw-bold">{stats.totalForms}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} sm={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex align-items-center p-4">
                    <div className="icon-bg bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                      <FaUsers className="text-danger" size={28} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 small">Total Classes</h6>
                      <h3 className="mb-0 fw-bold">{stats.totalClasses}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick access cards */}
            <Row className="g-4 mb-4">
              <Col>
                <h5 className="mb-3 fw-bold">Quick Access</h5>
              </Col>
            </Row>
            <Row className="g-4 mb-4">
              <Col md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="card-title fw-bold">Manage Forms</h5>
                    <p className="card-text text-muted">Create and manage Forms (year groups) for schools.</p>
                    <Button as={Link} to="/admin/forms" variant="primary" className="w-100">Go to Forms</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="card-title fw-bold">Manage Classes</h5>
                    <p className="card-text text-muted">Create classes within Forms and assign tutors.</p>
                    <Button as={Link} to="/admin/classes" variant="primary" className="w-100">Go to Classes</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="card-title fw-bold">Manage Subjects</h5>
                    <p className="card-text text-muted">Create subjects and assign to Forms.</p>
                    <Button as={Link} to="/admin/subjects" variant="primary" className="w-100">Go to Subjects</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="card-title fw-bold">Assign Students</h5>
                    <p className="card-text text-muted">Assign students to classes.</p>
                    <Button as={Link} to="/admin/student-assignment" variant="primary" className="w-100">Assign Students</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="card-title fw-bold">Assign Subjects</h5>
                    <p className="card-text text-muted">Assign subjects to classes and assign teachers.</p>
                    <Button as={Link} to="/admin/class-subject-assignment" variant="primary" className="w-100">Assign Subjects</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="card-title fw-bold">Manage Institutions</h5>
                    <p className="card-text text-muted">Add, edit, or manage educational institutions.</p>
                    <Button onClick={() => setActiveTab('institutions')} variant="secondary" className="w-100">Go to Institutions</Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

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
