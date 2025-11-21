import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';

function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // Timeout protection: if isLoading is true for more than 3 seconds, force it to false
  React.useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('[PrivateRoute] Loading timeout - forcing display');
        setLoadingTimeout(true);
      }, 3000);

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Show loading indicator while authentication state is being determined
  // But timeout after 3 seconds to prevent infinite loading
  if (isLoading && !loadingTimeout) {
    console.log('[PrivateRoute] Loading auth state...');
    return <div>Loading...</div>;
  }

  // CRITICAL FIX: Check localStorage FIRST before making any redirect decisions
  // This prevents redirect loops when isAuthenticated is temporarily false
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  // Determine the actual user (from context or localStorage)
  let actualUser = user;
  let actualIsAuthenticated = isAuthenticated;

  if (!actualUser && storedUser && storedToken) {
    try {
      actualUser = JSON.parse(storedUser);
      actualIsAuthenticated = true;
      console.log('[PrivateRoute] Using stored auth. User:', actualUser.email, 'Role:', actualUser.role);
    } catch (e) {
      console.error('[PrivateRoute] Error parsing stored user:', e);
      // Clear invalid localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }

  // If no authentication at all (neither context nor localStorage), redirect to login
  if (!actualIsAuthenticated || !actualUser) {
    console.log('[PrivateRoute] No authentication found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated - now check role permissions
  if (allowedRoles && actualUser && actualUser.role) {
    const userRole = actualUser.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    console.log('[PrivateRoute] Checking role access. User role:', userRole, 'Allowed roles:', normalizedAllowedRoles);

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log('[PrivateRoute] Role mismatch! Redirecting to correct dashboard');
      // User is authenticated but accessing wrong dashboard - redirect to correct one
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
          console.error('[PrivateRoute] Unknown role:', userRole);
          return <Navigate to="/login" replace />;
      }
    }
  }

  // All checks passed - allow access
  console.log('[PrivateRoute] Access granted');
  return children;
}

export default PrivateRoute;