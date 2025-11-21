import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaUser, FaBell, FaBook, FaUserGraduate, FaChalkboardTeacher,
  FaCog, FaSignOutAlt, FaBars
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import FlagLogo from './FlagLogo';
import './Navbar.css';

function AppNavbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user || !user.role) return '/login';

    const role = (user.role || '').toLowerCase().trim();
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'instructor': return '/teacher/dashboard';
      case 'student': return '/student/dashboard';
      default: return '/login';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  if (isLoading) return null;

  return (
    <Navbar
      expand="lg"
      fixed="top"
      className={`navbar-glass ${scrolled ? 'scrolled' : ''}`}
    >
      <Container>
        <Navbar.Brand as={Link} to={isAuthenticated ? getDashboardRoute() : '/'} className="d-flex align-items-center gap-2">
          <FlagLogo size="small" showText={true} />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0">
          <FaBars />
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav">
          {isAuthenticated && user ? (
            <Nav className="ms-auto align-items-center gap-2">
              <Nav.Link
                as={Link}
                to={getDashboardRoute()}
                className={`nav-link-custom ${isActive(getDashboardRoute()) ? 'active' : ''}`}
              >
                Dashboard
              </Nav.Link>

              {/* Student Navigation */}
              {user.role?.toLowerCase() === 'student' && (
                <Nav.Link
                  as={Link}
                  to="/student/subjects"
                  className={`nav-link-custom ${isActive('/student/subjects') ? 'active' : ''}`}
                >
                  <FaBook size={14} />
                  My Subjects
                </Nav.Link>
              )}

              {/* Instructor Navigation */}
              {user.role?.toLowerCase() === 'instructor' && (
                <>
                  <Nav.Link
                    as={Link}
                    to="/teacher/dashboard"
                    className={`nav-link-custom ${isActive('/teacher/dashboard') ? 'active' : ''}`}
                  >
                    <FaChalkboardTeacher size={16} />
                    Classes
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/teacher/curriculum"
                    className={`nav-link-custom ${isActive('/teacher/curriculum') ? 'active' : ''}`}
                  >
                    <FaBook size={14} />
                    Curriculum
                  </Nav.Link>
                </>
              )}

              {/* Admin Navigation */}
              {user.role?.toLowerCase() === 'admin' && (
                <NavDropdown title="Management" id="admin-nav-dropdown" className="nav-link-custom p-0">
                  <NavDropdown.Item as={Link} to="/admin/forms">Forms</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/classes">Classes</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/subjects">Subjects</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/teacher/curriculum">Curriculum</NavDropdown.Item>
                </NavDropdown>
              )}

              <div className="vr mx-2 d-none d-lg-block opacity-25"></div>

              {/* Notifications */}
              <Nav.Link href="#" className="nav-link-custom px-2">
                <FaBell size={16} />
              </Nav.Link>

              {/* Profile Dropdown */}
              <NavDropdown
                title={
                  <div className="d-flex align-items-center gap-2">
                    <div className="profile-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : <FaUser size={12} />}
                    </div>
                    <span className="d-none d-lg-block small fw-medium">{user.name?.split(' ')[0]}</span>
                  </div>
                }
                id="profile-dropdown"
                align="end"
                className="profile-dropdown"
              >
                <div className="px-3 py-2">
                  <p className="mb-0 fw-bold small text-dark">{user.name}</p>
                  <p className="mb-0 small text-muted">{user.email}</p>
                  <Badge bg="light" text="dark" className="mt-1 border">{user.role}</Badge>
                </div>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/profile" className="d-flex align-items-center gap-2">
                  <FaUser size={14} /> Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/change-password" className="d-flex align-items-center gap-2">
                  <FaCog size={14} /> Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                  <FaSignOutAlt size={14} /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          ) : (
            <Nav className="ms-auto align-items-center gap-3">
              <Nav.Link as={Link} to="/login" className="nav-link-custom">
                Login
              </Nav.Link>
              <Button as={Link} to="/register" variant="primary" className="nav-btn-primary border-0">
                Get Started
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

// Helper for badge (since I used it in the dropdown but didn't import it)
const Badge = ({ children, className, bg, text }) => (
  <span className={`badge bg-${bg} text-${text} ${className}`}>{children}</span>
);

export default AppNavbar;