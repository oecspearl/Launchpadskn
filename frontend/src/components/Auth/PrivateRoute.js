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
    return <div>Loading...</div>;
  }
  
  // If timeout occurred, treat as not loading and proceed with checks

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Check localStorage as fallback (auth state might be updating)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[PrivateRoute] Found stored auth, checking role:', parsedUser.role);
        
        // If allowed roles are specified, check role from localStorage
        if (allowedRoles && parsedUser && parsedUser.role) {
          const userRole = parsedUser.role.toLowerCase();
          const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
          
          if (normalizedAllowedRoles.includes(userRole)) {
            console.log('[PrivateRoute] Role matches, allowing access');
            return children;
          } else {
            console.log('[PrivateRoute] Role does not match, redirecting to dashboard');
            // Redirect to appropriate dashboard
            if (userRole === 'admin') {
              return <Navigate to="/admin/dashboard" replace />;
            } else if (userRole === 'instructor') {
              return <Navigate to="/teacher/dashboard" replace />;
            } else if (userRole === 'student') {
              return <Navigate to="/student/dashboard" replace />;
            }
          }
        } else if (!allowedRoles) {
          // No role restriction, allow access
          return children;
        }
      } catch (e) {
        console.error('[PrivateRoute] Error parsing stored user:', e);
      }
    }
    
    return <Navigate to="/login" replace />;
  }

  // If allowed roles are specified, check user's role
  if (allowedRoles && user && user.role) {
    // Convert roles to lowercase for case-insensitive comparison
    const userRole = user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user's role
      switch(userRole) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'instructor':
          return <Navigate to="/teacher/dashboard" replace />;
        case 'student':
          return <Navigate to="/student/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  // If all checks pass, render the children
  return children;
}

export default PrivateRoute;