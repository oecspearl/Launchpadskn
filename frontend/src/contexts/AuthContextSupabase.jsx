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
        console.log('[AuthContext] Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] Session error:', error);
          // Check localStorage as fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log('[AuthContext] Using stored user from localStorage:', parsedUser.email);
              setUser(parsedUser);
              setIsAuthenticated(true);
            } catch (e) {
              console.error('[AuthContext] Error parsing stored user:', e);
            }
          }
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[AuthContext] Session found on init, loading profile for:', session.user.email);
          await loadUserProfile(session.user.id);
        } else {
          console.log('[AuthContext] No session found on init');
          // Check localStorage as fallback
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('token');
          
          if (storedUser && storedToken) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log('[AuthContext] No Supabase session but using stored user:', parsedUser.email);
              setUser(parsedUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              // Try to restore Supabase session in background (non-blocking)
              // Only if we have a refresh token
              if (parsedUser.refreshToken) {
                supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error: refreshError }) => {
                  if (refreshError || !refreshedSession) {
                    console.warn('[AuthContext] Could not restore Supabase session, but user remains logged in via localStorage');
                  } else {
                    console.log('[AuthContext] Supabase session restored in background');
                    // Update stored token
                    if (refreshedSession.access_token) {
                      localStorage.setItem('token', refreshedSession.access_token);
                      const updatedUser = { ...parsedUser, token: refreshedSession.access_token };
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                      setUser(updatedUser);
                    }
                    loadUserProfile(refreshedSession.user.id).catch(console.error);
                  }
                }).catch(error => {
                  console.warn('[AuthContext] Error refreshing session:', error);
                  // User stays logged in via localStorage
                });
              }
            } catch (e) {
              console.error('[AuthContext] Error parsing stored user:', e);
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
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
          const emailLower = email?.toLowerCase() || '';
          const isAdmin = emailLower.includes('admin');
          const isTeacher = emailLower.includes('teacher') || emailLower.includes('instructor');

          // Determine role: check email first, then metadata, then default
          let tempRole = session.user.user_metadata?.role;
          if (!tempRole) {
            if (isAdmin) tempRole = 'ADMIN';
            else if (isTeacher) tempRole = 'INSTRUCTOR';
            else tempRole = 'STUDENT';
          }

          const tempUser = {
            userId: session.user.id,
            id: session.user.id, // Also include id for consistency
            email: email,
            name: session.user.user_metadata?.name || email.split('@')[0],
            role: tempRole.toUpperCase(),
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
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session on page load/refresh
          if (session?.user) {
            console.log('[AuthContext] INITIAL_SESSION found, loading profile for:', session.user.email);
            await loadUserProfile(session.user.id);
          } else {
            // No Supabase session found - check if we have stored user data in localStorage
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            
            if (storedUser && storedToken) {
              console.log('[AuthContext] No Supabase session but localStorage has user data. Restoring user from localStorage...');
              try {
                const parsedUser = JSON.parse(storedUser);
                // Immediately set user from localStorage so app doesn't think user is logged out
                setUser(parsedUser);
                setIsAuthenticated(true);
                setIsLoading(false);
                
                // Try to restore Supabase session in background (non-blocking)
                // Check if there's a refresh token we can use
                if (parsedUser.refreshToken) {
                  console.log('[AuthContext] Attempting to restore Supabase session with refresh token...');
                  supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error: refreshError }) => {
                    if (refreshError || !refreshedSession) {
                      console.warn('[AuthContext] Could not refresh Supabase session:', refreshError?.message || 'No session returned');
                      // User stays logged in via localStorage, but Supabase session is invalid
                      // This is okay - user can continue using the app
                    } else {
                      console.log('[AuthContext] Supabase session restored successfully');
                      // Update stored token
                      if (refreshedSession.access_token) {
                        localStorage.setItem('token', refreshedSession.access_token);
                        // Update user with fresh token
                        const updatedUser = { ...parsedUser, token: refreshedSession.access_token };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                      }
                      // Load full profile
                      loadUserProfile(refreshedSession.user.id).catch(console.error);
                    }
                  }).catch(error => {
                    console.warn('[AuthContext] Error refreshing session:', error);
                    // User stays logged in via localStorage
                  });
                } else {
                  console.log('[AuthContext] No refresh token available, user will stay logged in via localStorage');
                }
              } catch (e) {
                console.error('[AuthContext] Error parsing stored user:', e);
                // Clear invalid stored data
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
                setIsLoading(false);
              }
            } else {
              console.log('[AuthContext] No session and no stored user data - user is logged out');
              setUser(null);
              setIsAuthenticated(false);
              setIsLoading(false);
            }
          }
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
      // Normalize TEACHER to INSTRUCTOR for consistency
      let userRole = (profile.role || 'STUDENT').toUpperCase().trim();
      if (userRole === 'TEACHER') {
        userRole = 'INSTRUCTOR';
      }
      const validRoles = ['ADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR', 'STUDENT'];
      const finalRole = validRoles.includes(userRole) ? userRole : (session.user.email.includes('admin') ? 'ADMIN' : 'STUDENT');

      // Combine profile and auth data
      // Map snake_case DB fields to camelCase for consistency
      const userData = {
        userId: profile.user_id || session.user.id, // Keep userId for backward compatibility (may be UUID initially)
        user_id: profile.user_id, // Always include numeric user_id from database
        id: session.user.id, // UUID from Supabase Auth
        email: session.user.email,
        name: profile.name || session.user.email.split('@')[0],
        role: finalRole, // Ensure role is always valid
        token: session.access_token,
        refreshToken: session.refresh_token,
        loginTime: Date.now(),
        // Map database fields to camelCase
        isFirstLogin: profile.is_first_login !== undefined ? profile.is_first_login : profile.isFirstLogin,
        isActive: profile.is_active !== undefined ? profile.is_active : profile.isActive,
        ...profile // Include all profile fields (may be snake_case or camelCase)
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
      const emailLower = email?.toLowerCase() || '';
      const isAdmin = emailLower.includes('admin');
      const isTeacher = emailLower.includes('teacher') || emailLower.includes('instructor');

      // Determine role: check email first, then metadata, then default
      let userRole = session.user.user_metadata?.role;
      if (!userRole) {
        if (isAdmin) userRole = 'ADMIN';
        else if (isTeacher) userRole = 'INSTRUCTOR';
        else userRole = 'STUDENT';
      }

      // Ensure role is valid
      const userRoleUpper = (userRole || 'STUDENT').toUpperCase().trim();
      const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'];
      const finalRole = validRoles.includes(userRoleUpper) ? userRoleUpper : (isAdmin ? 'ADMIN' : 'STUDENT');

      const userData = {
        userId: session.user.id,
        id: session.user.id, // Also include id for consistency
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

      // Try to create profile in database for future use (only if it doesn't exist)
      // Use upsert to avoid 409 conflicts - if profile exists, just update it silently
      try {
        // Check if profile exists first to avoid unnecessary upsert
        const { data: existingProfile } = await supabase
          .from('users')
          .select('user_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!existingProfile) {
          // Only insert if it doesn't exist
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
            // Ignore conflict errors silently
            if (createError.code !== '23505' && createError.status !== 409 && !createError.message?.includes('duplicate')) {
              console.warn('[AuthContext] Could not create profile in database:', createError);
            }
          } else {
            console.log('[AuthContext] Created user profile in database');
          }
        }
        // If profile exists, we don't need to do anything - it's already loaded above
      } catch (createError) {
        // Silently ignore all errors here - profile creation is optional
        // The profile might already exist, which is fine
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

