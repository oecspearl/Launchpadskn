import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';

function FirstTimeLoginCheck({ children }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && user.role?.toLowerCase() === 'instructor') {
      console.log('FirstTimeLoginCheck - user.isFirstLogin:', user.isFirstLogin, 'type:', typeof user.isFirstLogin);
      // Handle both boolean and string values
      const isFirstLogin = user.isFirstLogin === true || user.isFirstLogin === 'true';
      if (isFirstLogin) {
        navigate('/change-password');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // If user needs to change password, don't render children
  if (isAuthenticated && user && user.role?.toLowerCase() === 'instructor') {
    const isFirstLogin = user.isFirstLogin === true || user.isFirstLogin === 'true';
    if (isFirstLogin) {
      return null;
    }
  }

  return children;
}

export default FirstTimeLoginCheck;