/**
 * Supabase Auth Context
 * Updated to use Supabase Auth with session management
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../config/supabase';
import AuthService from '../services/authServiceSupabase';
import supabaseService from '../services/supabaseService';

// Create AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] SIGNED_IN event, loading profile for:', session.user.email);
          setIsLoading(true); // Set loading while fetching profile
          
          // Immediately set a basic user from session to prevent dashboards from showing "no user"
          const email = session.user.email;
          const isAdmin = email && email.toLowerCase().includes('admin');
          const tempUser = {
            userId: session.user.id,
            email: email,
            name: session.user.user_metadata?.name || email.split('@')[0],
            role: isAdmin ? 'ADMIN' : (session.user.user_metadata?.role || 'STUDENT').toUpperCase(),
            token: session.access_token,
            refreshToken: session.refresh_token,
            loginTime: Date.now()
          };
          
          // Store temp user immediately so components can use it
          localStorage.setItem('user', JSON.stringify(tempUser));
          localStorage.setItem('token', session.access_token);
          setUser(tempUser);
          setIsAuthenticated(true);
          setIsLoading(false); // Set to false immediately so dashboards can render
          
          // Then load full profile in background (non-blocking)
          loadUserProfile(session.user.id).catch(error => {
            console.warn('[AuthContext] Background profile load failed:', error);
            // User is already set from temp user above, so we can continue
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          sessionStorage.removeItem('sessionActive');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update token in localStorage
          if (session.access_token) {
            localStorage.setItem('token', session.access_token);
          }
          await loadUserProfile(session.user.id).catch(() => {
            // Ensure loading is cleared even on error
            setIsLoading(false);
          });
        }
      }
    );

    initializeAuth();

    // Safety timeout: force loading to false after 10 seconds max
    const globalTimeout = setTimeout(() => {
      console.warn('[AuthContext] Global timeout - forcing isLoading to false');
      setIsLoading(false);
    }, 10000);

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
      clearTimeout(globalTimeout);
    };
  }, []); // Empty deps - only run once on mount

  // Load user profile from users table
  const loadUserProfile = async (userId) => {
    console.log('[AuthContext] loadUserProfile called for userId:', userId);
    
    // First get session - we need this regardless
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[AuthContext] No session available:', sessionError);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    console.log('[AuthContext] Session found, email:', session.user.email);
    
    try {
      // Try to get user profile from users table with shorter timeout (2 seconds)
      const profilePromise = supabaseService.getUserProfile(userId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
      );
      
      let profile;
      try {
        profile = await Promise.race([profilePromise, timeoutPromise]);
        console.log('[AuthContext] Profile found in database:', profile);
      } catch (raceError) {
        // If it times out or fails, throw to fall through to fallback
        console.warn('[AuthContext] Profile fetch failed or timed out:', raceError);
        throw raceError;
      }
      
      // Ensure role is set and valid
      const userRole = (profile.role || 'STUDENT').toUpperCase().trim();
      const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'];
      const finalRole = validRoles.includes(userRole) ? userRole : (session.user.email.includes('admin') ? 'ADMIN' : 'STUDENT');
      
      // Combine profile and auth data
      const userData = {
        userId: profile.user_id || session.user.id,
        email: session.user.email,
        name: profile.name || session.user.email.split('@')[0],
        role: finalRole, // Ensure role is always valid
        token: session.access_token,
        refreshToken: session.refresh_token,
        loginTime: Date.now(),
        ...profile // Include all profile fields
      };
      
      // Override role to ensure consistency
      userData.role = finalRole;
      
      // Store in localStorage for compatibility
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', session.access_token);
      sessionStorage.setItem('sessionActive', 'true');
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      console.log('[AuthContext] User profile loaded, user set:', { 
        role: userData.role, 
        email: userData.email,
        profileRole: profile.role,
        finalRole: finalRole
      });
    } catch (error) {
      console.warn('[AuthContext] Profile not found in database or timeout, using fallback:', error);
      
      // Profile doesn't exist or timed out - create minimal user from auth session
      // This ensures redirect can still happen
      const email = session.user.email;
      const isAdmin = email && email.toLowerCase().includes('admin');
      const userRole = session.user.user_metadata?.role || (isAdmin ? 'ADMIN' : 'STUDENT');
      
      // Ensure role is valid
      const userRoleUpper = (userRole || 'STUDENT').toUpperCase().trim();
      const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'];
      const finalRole = validRoles.includes(userRoleUpper) ? userRoleUpper : (isAdmin ? 'ADMIN' : 'STUDENT');
      
      const userData = {
        userId: session.user.id,
        email: email,
        name: session.user.user_metadata?.name || email.split('@')[0],
        role: finalRole,
        token: session.access_token,
        refreshToken: session.refresh_token,
        loginTime: Date.now()
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', session.access_token);
      sessionStorage.setItem('sessionActive', 'true');
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      console.log('[AuthContext] Set fallback user from auth session:', { 
        role: userData.role, 
        email: userData.email 
      });
      
      // Try to create profile in database for future use
      try {
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: email,
            name: userData.name,
            role: finalRole,
            is_active: true,
            created_at: new Date().toISOString()
          });
        
        if (createError) {
          console.warn('[AuthContext] Could not create profile in database:', createError);
        } else {
          console.log('[AuthContext] Created user profile in database');
        }
      } catch (createError) {
        console.warn('[AuthContext] Error creating profile:', createError);
      }
      
      // Ensure loading is set to false
      setIsLoading(false);
    }
  };

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

  // Logout function
  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if logout fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('sessionActive');
    }
  };

  // Register function
  const register = async (name, email, password, role = 'STUDENT', phone = '', dateOfBirth = '', address = '', emergencyContact = '') => {
    try {
      return await AuthService.register(name, email, password, role, phone, dateOfBirth, address, emergencyContact);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updatedUser) => {
    try {
      if (!user?.userId) throw new Error('No user logged in');
      
      // Update in database
      const updated = await supabaseService.updateUserProfile(user.userId, updatedUser);
      
      // Update local state
      const newUserData = { ...user, ...updated };
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
      
      return updated;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
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

  // Update user function (for compatibility)
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
    loginWithAD: login, // Fallback for AD login (can implement later)
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

