import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';

function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // Timeout protection: if isLoading is true for more than 3 seconds, force display
  React.useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => setLoadingTimeout(true), 3000);
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Show loading indicator while authentication state is being determined
  if (isLoading && !loadingTimeout) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Use auth context as the source of truth; fall back to localStorage only
  // to bridge the gap while AuthContext is initializing (prevents flash redirects)
  let actualUser = user;
  let actualIsAuthenticated = isAuthenticated;

  if (!actualUser) {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        actualUser = JSON.parse(storedUser);
        actualIsAuthenticated = true;
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }

  // Not authenticated at all — redirect to login
  if (!actualIsAuthenticated || !actualUser) {
    return <Navigate to="/login" replace />;
  }

  // Force password change check
  if (actualUser.force_password_change) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  }

  // Check role permissions
  if (allowedRoles && actualUser.role) {
    const userRole = actualUser.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      // Redirect to correct dashboard based on role
      switch (userRole) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'school_admin':
          return <Navigate to="/school-admin/dashboard" replace />;
        case 'instructor':
        case 'teacher':
          return <Navigate to="/teacher/dashboard" replace />;
        case 'student':
          return <Navigate to="/student/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  return children;
}

export default PrivateRoute;
