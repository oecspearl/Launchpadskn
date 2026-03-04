import React, { useState, useEffect } from 'react';
import { Nav, NavDropdown, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaUser, FaBook, FaSignOutAlt, FaBars, FaQuestionCircle, FaCog
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useSidebar } from '../../contexts/SidebarContext';
import FlagLogo from '../common/FlagLogo';
import QuickSearch from '../common/QuickSearch';
import GlobalSearch from '../common/GlobalSearch';
import NotificationCenter from '../common/NotificationCenter';
import MessageIcon from '../common/MessageIcon';
import { registerShortcutHandler, unregisterShortcutHandler } from '../../utils/keyboardShortcuts';
import './TopBar.css';

function TopBar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { toggleMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      registerShortcutHandler('search', () => setShowGlobalSearch(true));
      return () => unregisterShortcutHandler('search');
    }
  }, [isAuthenticated]);

  const getDashboardRoute = () => {
    if (!user || !user.role) return '/login';
    const role = (user.role || '').toLowerCase().trim();
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'school_admin': return '/school-admin/dashboard';
      case 'instructor': return '/teacher/dashboard';
      case 'student': return '/student/dashboard';
      case 'parent': return '/parent/dashboard';
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

  if (isLoading) return null;

  return (
    <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="topbar-inner">
        {/* Left: hamburger (mobile) + brand */}
        <div className="topbar-left">
          {isAuthenticated && (
            <button className="topbar-hamburger" onClick={toggleMobile} aria-label="Toggle sidebar">
              <FaBars size={18} />
            </button>
          )}

          <Link to={isAuthenticated ? getDashboardRoute() : '/'} className="topbar-brand">
            {isAuthenticated && user?.institution_logo_url ? (
              <img src={user.institution_logo_url} alt="" className="topbar-brand-logo" />
            ) : (
              <FlagLogo size="small" showText={!user?.institution_name} />
            )}
            {isAuthenticated && user?.institution_name && (
              <span className="topbar-brand-name">{user.institution_name}</span>
            )}
          </Link>
        </div>

        {/* Right: search + actions + profile */}
        <div className="topbar-right">
          {isAuthenticated && user ? (
            <>
              <QuickSearch onOpenGlobalSearch={() => setShowGlobalSearch(true)} />
              <div className="topbar-divider" />
              <MessageIcon />
              <NotificationCenter />

              <NavDropdown
                title={
                  <div className="topbar-profile-trigger">
                    <div className="topbar-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : <FaUser size={12} />}
                    </div>
                    <span className="topbar-user-name">
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                }
                id="topbar-profile-dropdown"
                align="end"
                className="topbar-profile-dropdown"
              >
                <div className="px-3 py-2">
                  <p className="mb-0 fw-bold small text-dark">{user.name}</p>
                  <p className="mb-0 small text-muted">{user.email}</p>
                  <Badge bg="light" text="dark" className="mt-1 border">{user.role}</Badge>
                  {user.institution_name && (
                    <p className="mb-0 mt-1 small text-muted">{user.institution_name}</p>
                  )}
                </div>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/profile" className="d-flex align-items-center gap-2">
                  <FaUser size={14} /> Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/change-password" className="d-flex align-items-center gap-2">
                  <FaCog size={14} /> Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/help" className="d-flex align-items-center gap-2">
                  <FaQuestionCircle size={14} /> Help
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                  <FaSignOutAlt size={14} /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            </>
          ) : (
            <Nav className="align-items-center gap-3">
              <Nav.Link
                as={Link}
                to="/#curriculum"
                className="topbar-nav-link"
                onClick={(e) => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <FaBook size={14} className="me-1" />
                Curriculum
              </Nav.Link>
              <Nav.Link as={Link} to="/login" className="topbar-nav-link">
                Login
              </Nav.Link>
              <Button as={Link} to="/register" variant="primary" className="topbar-btn-primary border-0">
                Get Started
              </Button>
            </Nav>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <GlobalSearch
          show={showGlobalSearch}
          onHide={() => setShowGlobalSearch(false)}
        />
      )}
    </header>
  );
}

export default TopBar;
