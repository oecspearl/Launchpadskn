import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Alert, 
  Nav, Badge, Dropdown
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate, 
  FaBell
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import InstitutionManagement from './InstitutionManagement';
import StudentManagement from './StudentManagement';
import ManageInstructors from './ManageInstructors';
import ReportsTab from './ReportsTab';
import EnhancedCourseManagement from './EnhancedCourseManagement';
import './AdminDashboard.css'; // We'll create this file for custom styling

function AdminDashboard() {
  const { user } = useAuth();
  
  // State to store dashboard statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    recentActivity: [],
    pendingRequests: []
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Function to fetch dashboard statistics using Supabase
  const fetchDashboardStats = async () => {
      try {
        console.log('[AdminDashboard] Fetching stats...');
        // Get dashboard stats from Supabase
        const data = await supabaseService.getDashboardStats();
        console.log('[AdminDashboard] Stats received:', data);
        
        // Get pending enrollments (if using old course structure)
        // For now, using empty array until we migrate enrollment system
        const pendingEnrollments = [];
        
        // Convert pending enrollments to notification format
        const pendingRequests = pendingEnrollments.map(enrollment => ({
          id: enrollment.enrollmentId || enrollment.id,
          type: 'enrollment',
          student: enrollment.student?.name || 'Unknown',
          course: enrollment.course?.title || 'Unknown Course',
          requestedOn: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'
        }));
        
        const enhancedData = {
          totalUsers: data?.totalUsers || 0,
          totalCourses: data?.totalSubjects || data?.totalCourses || 0, // Using subjects as courses for now
          totalInstructors: data?.totalInstructors || 0,
          totalStudents: data?.totalStudents || 0,
          pendingRequests,
          recentActivity: [
            { id: 1, type: 'enrollment', user: 'John Doe', action: 'enrolled in', target: 'Introduction to Computer Science', time: '2 hours ago' },
            { id: 2, type: 'course', user: 'Jane Smith', action: 'created a new course', target: 'Advanced Mathematics', time: '1 day ago' },
            { id: 3, type: 'user', user: 'Admin', action: 'approved instructor account for', target: 'Dr. Robert Johnson', time: '2 days ago' }
          ]
        };
        
        setStats(enhancedData);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // Set default stats on error - don't block the UI
        setStats({
          totalUsers: 0,
          totalCourses: 0,
          totalInstructors: 0,
          totalStudents: 0,
          recentActivity: [],
          pendingRequests: []
        });
        setIsLoading(false);
        // Don't set error for now - just show empty stats
        // setError('Failed to load dashboard statistics. Using default values.');
      }
    };

  // Fetch dashboard statistics when component mounts
  useEffect(() => {
    console.log('[AdminDashboard] useEffect triggered, user:', user);
    if (user) {
      fetchDashboardStats();
    } else {
      // If no user, still stop loading after a timeout
      setTimeout(() => {
        console.warn('[AdminDashboard] No user after timeout, stopping loading');
        setIsLoading(false);
      }, 2000);
    }
  }, [user]);

  // Periodic refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </Container>
    );
  }

  // Show error message if data fetching failed
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Dashboard</Alert.Heading>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline-danger">Retry</Button>
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
            <p className="text-muted mb-0">Welcome back, {user?.name || 'Admin'}</p>
          </Col>
          <Col xs="auto">
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="notification-dropdown" className="position-relative">
                <FaBell />
                <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
                  {stats.pendingRequests.length}
                </Badge>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-sm notification-menu">
                <Dropdown.Header>Notifications</Dropdown.Header>
                {stats.pendingRequests.map((request, index) => (
                  <Dropdown.Item key={index} className="notification-item">
                    <div className="d-flex">
                      <div className={`notification-icon ${request.type === 'enrollment' ? 'bg-info' : 'bg-warning'}`}>
                        {request.type === 'enrollment' ? <FaUserGraduate /> : <FaChalkboardTeacher />}
                      </div>
                      <div className="ms-3">
                        <p className="mb-0 fw-bold">{request.type === 'enrollment' ? 'Course Enrollment Request' : 'Instructor Approval'}</p>
                        <p className="mb-0 small">
                          {request.type === 'enrollment' 
                            ? `${request.student} requested to join ${request.course}` 
                            : `${request.name} from ${request.department} needs approval`}
                        </p>
                        <small className="text-muted">{request.requestedOn}</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item className="text-center text-primary">View All Notifications</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
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
              <Col md={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex align-items-center">
                    <div className="icon-bg bg-primary-light rounded p-3 me-3">
                      <FaUsers className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Users</h6>
                      <h3 className="mb-0">{stats.totalUsers}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex align-items-center">
                    <div className="icon-bg bg-success-light rounded p-3 me-3">
                      <FaBook className="text-success" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Courses</h6>
                      <h3 className="mb-0">{stats.totalCourses}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex align-items-center">
                    <div className="icon-bg bg-info-light rounded p-3 me-3">
                      <FaChalkboardTeacher className="text-info" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Instructors</h6>
                      <h3 className="mb-0">{stats.totalInstructors}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex align-items-center">
                    <div className="icon-bg bg-warning-light rounded p-3 me-3">
                      <FaUserGraduate className="text-warning" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Students</h6>
                      <h3 className="mb-0">{stats.totalStudents}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick access cards */}
            <h5 className="mb-3">Quick Access</h5>
            <Row className="g-4 mb-4">
              <Col md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">Manage Forms</h5>
                    <p className="card-text">Create and manage Forms (year groups) for schools.</p>
                    <Button as={Link} to="/admin/forms" variant="primary">Go to Forms</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">Manage Classes</h5>
                    <p className="card-text">Create classes within Forms and assign tutors.</p>
                    <Button as={Link} to="/admin/classes" variant="primary">Go to Classes</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">Manage Subjects</h5>
                    <p className="card-text">Create subjects and assign to Forms.</p>
                    <Button as={Link} to="/admin/subjects" variant="primary">Go to Subjects</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">Assign Students</h5>
                    <p className="card-text">Assign students to classes.</p>
                    <Button as={Link} to="/admin/student-assignment" variant="primary">Assign Students</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">Assign Subjects</h5>
                    <p className="card-text">Assign subjects to classes and assign teachers.</p>
                    <Button as={Link} to="/admin/class-subject-assignment" variant="primary">Assign Subjects</Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">Manage Institutions</h5>
                    <p className="card-text">Add, edit, or manage educational institutions.</p>
                    <Button onClick={() => setActiveTab('institutions')} variant="secondary">Go to Institutions</Button>
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