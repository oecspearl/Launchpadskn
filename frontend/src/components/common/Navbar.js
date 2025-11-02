import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaBook, FaUserGraduate } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import FlagLogo from './FlagLogo';

function AppNavbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Show nothing while loading auth state to prevent flickering
  if (isLoading) {
    return (
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <FlagLogo size="small" showText={true} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
        </Container>
      </Navbar>
    );
  }

  // Determine dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user || !user.role) {
      console.log('[Navbar] No user or role, returning /login');
      return '/login';
    }
    
    // Convert role to lowercase for case-insensitive comparison
    const role = (user.role || '').toLowerCase().trim();
    console.log('[Navbar] getDashboardRoute called with role:', role, 'user:', user);
    
    switch(role) {
      case 'admin':
        return '/admin/dashboard';
      case 'instructor':
        return '/teacher/dashboard'; // Use new teacher dashboard
      case 'student':
        return '/student/dashboard';
      default:
        console.warn('[Navbar] Unknown role, returning /login. Role was:', role, 'Type:', typeof role);
        return '/login';
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* Brand/Logo */}
        <Navbar.Brand 
          as={Link} 
          to={user && isAuthenticated && user.role ? getDashboardRoute() : '/'} 
          className="d-flex align-items-center"
          onClick={(e) => {
            const route = user && isAuthenticated && user.role ? getDashboardRoute() : '/';
            if (route && (route === '/ldashboard' || route.includes('ldashboard'))) {
              e.preventDefault();
              console.error('[Navbar] Invalid route detected:', route);
              navigate('/login');
            }
          }}
        >
          <FlagLogo size="small" showText={true} />
        </Navbar.Brand>

        {/* Responsive toggle */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {user && isAuthenticated ? (
            // Authenticated user navigation - Login/Register are hidden
            <Nav className="ms-auto align-items-center">
              {/* Dashboard link based on role */}
              <Nav.Link as={Link} to={getDashboardRoute()} className="me-3">
                Dashboard
              </Nav.Link>

              {/* Student-specific navigation */}
              {user.role && user.role.toLowerCase() === 'student' && (
                <Nav.Link as={Link} to="/student/subjects" className="me-3">
                  <FaBook className="me-1" />
                  My Subjects
                </Nav.Link>
              )}

              {/* Teacher-specific navigation */}
              {user.role && user.role.toLowerCase() === 'instructor' && (
                <>
                  <Nav.Link as={Link} to="/teacher/dashboard" className="me-3">
                    <FaUserGraduate className="me-1" />
                    My Classes
                  </Nav.Link>
                  <Nav.Link as={Link} to="/teacher/curriculum" className="me-3">
                    <FaBook className="me-1" />
                    Curriculum
                  </Nav.Link>
                </>
              )}

              {/* Admin-specific navigation */}
              {user.role && user.role.toLowerCase() === 'admin' && (
                <>
                  <Nav.Link as={Link} to="/admin/forms" className="me-3">
                    Forms
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/classes" className="me-3">
                    Classes
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/subjects" className="me-3">
                    Subjects
                  </Nav.Link>
                  <Nav.Link as={Link} to="/teacher/curriculum" className="me-3">
                    <FaBook className="me-1" />
                    Curriculum
                  </Nav.Link>
                </>
              )}

              {/* Notifications */}
              <Nav.Link href="#" className="me-3">
                <FaBell />
              </Nav.Link>

              {/* Profile Dropdown */}
              <NavDropdown 
                title={<><FaUser className="me-1" />{user.name || user.email}</>} 
                id="profile-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  My Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          ) : (
            // Unauthenticated user navigation - ONLY show Login/Register when NOT authenticated
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className="me-3">
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/register">
                Register
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;