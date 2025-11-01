import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/authService';

// Create AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  // State for user and authentication
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token exists and validate it
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = AuthService.getCurrentUser();
        
        if (storedUser && storedUser.token) {
          // Check if session is active (survives page refresh but not browser restart)
          const sessionActive = sessionStorage.getItem('sessionActive');
          
          if (sessionActive) {
            // Session is active, validate token
            try {
              const response = await fetch('http://localhost:8080/api/users/profile', {
                headers: {
                  'Authorization': `Bearer ${storedUser.token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                // Update stored user with latest data including isFirstLogin
                const updatedUser = { ...storedUser, ...userData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsAuthenticated(true);
              } else {
                AuthService.logout();
              }
            } catch (apiError) {
              console.error('Token validation failed:', apiError);
              AuthService.logout();
            }
          } else {
            // No active session, clear auth data
            AuthService.logout();
          }
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        AuthService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const userData = await AuthService.login(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // AD Login function
  const loginWithAD = async (email, password) => {
    try {
      const userData = await AuthService.loginWithAD(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('AD Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Register function
  const register = async (name, email, password, role) => {
    try {
      return await AuthService.register(name, email, password, role);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = (updatedUser) => {
    const newUserData = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // Password reset functions
  const sendPasswordResetEmail = async (email) => {
    try {
      return await AuthService.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset email error:', error);
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      return await AuthService.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user function
  const updateUser = (updatedUser) => {
    const newUserData = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithAD,
    logout,
    register,
    updateUser,
    updateUserProfile,
    sendPasswordResetEmail,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}