/**
 * Supabase Auth Context
 * Updated to use Supabase Auth with session management
 */
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import AuthService from '../services/authServiceSupabase';
import supabaseService from '../services/supabaseService';

const log = (...args) => {
  if (import.meta.env.DEV) console.log('[AuthContext]', ...args);
};
const warn = (...args) => {
  if (import.meta.env.DEV) console.warn('[AuthContext]', ...args);
};

const VALID_ROLES = ['ADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT'];

function normalizeRole(role) {
  const upper = (role || '').toUpperCase().trim();
  if (upper === 'TEACHER') return 'INSTRUCTOR';
  return VALID_ROLES.includes(upper) ? upper : 'STUDENT';
}

// Create AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  // Initialize last login time from localStorage
  useEffect(() => {
    const storedLastLogin = localStorage.getItem('lastLoginTime');
    if (storedLastLogin) {
      setLastLoginTime(storedLastLogin);
    }
  }, []);

  // Guard against double profile loads
  const profileLoadingRef = useRef(false);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    // Get initial session — only runs if INITIAL_SESSION event hasn't fired yet
    const initializeAuth = async () => {
      try {
        log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          warn('Session error:', error.message);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          log('Session found on init, loading profile');
          await loadUserProfile(session.user.id);
        } else {
          log('No session found on init');
          setIsLoading(false);
        }
      } catch (error) {
        warn('Auth initialization error:', error.message);
        if (mounted) setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // Use metadata role only — never infer from email
          const tempRole = normalizeRole(session.user.user_metadata?.role);

          // Store previous login time before updating
          const previousLoginTime = localStorage.getItem('currentLoginTime');
          if (previousLoginTime) {
            localStorage.setItem('lastLoginTime', previousLoginTime);
            setLastLoginTime(previousLoginTime);
          }
          localStorage.setItem('currentLoginTime', new Date().toISOString());

          const tempUser = {
            userId: session.user.id,
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            role: tempRole,
            token: session.access_token,
            refreshToken: session.refresh_token,
            loginTime: Date.now()
          };

          // Store temp user immediately so components can use it
          localStorage.setItem('user', JSON.stringify(tempUser));
          localStorage.setItem('token', session.access_token);
          setUser(tempUser);
          setIsAuthenticated(true);
          setIsLoading(false);

          // Then load full profile in background (non-blocking)
          loadUserProfile(session.user.id).catch(err => {
            warn('Background profile load failed:', err.message);
          });
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            log('INITIAL_SESSION found, loading profile');
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('lastLoginTime');
          localStorage.removeItem('currentLoginTime');
          sessionStorage.removeItem('sessionActive');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (session.access_token) {
            localStorage.setItem('token', session.access_token);
            // Update stored user token without full profile reload
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser);
                parsed.token = session.access_token;
                localStorage.setItem('user', JSON.stringify(parsed));
                setUser(prev => prev ? { ...prev, token: session.access_token } : prev);
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    );

    initializeAuth();

    // Safety timeout: force loading to false after 5 seconds max
    const globalTimeout = setTimeout(() => {
      if (mounted) {
        warn('Global timeout - forcing isLoading to false');
        setIsLoading(false);
      }
    }, 5000);

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(globalTimeout);
    };
  }, []); // Empty deps - only run once on mount

  // Load user profile from users table
  const loadUserProfile = async (userId) => {
    // Prevent concurrent profile loads
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;

    try {
      log('loadUserProfile called for userId:', userId);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        warn('No session available');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      let profile = null;
      try {
        // Try to get user profile with a 2-second timeout
        profile = await Promise.race([
          supabaseService.getUserProfile(userId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 2000))
        ]);
      } catch (err) {
        warn('Profile fetch failed or timed out:', err.message);
      }

      if (profile) {
        // Profile found — use role from database, never from email
        const finalRole = normalizeRole(profile.role);

        // Build userData explicitly — don't spread profile to avoid overwriting critical fields
        const userData = {
          userId: profile.user_id || session.user.id,
          user_id: profile.user_id,
          id: session.user.id,
          email: session.user.email,
          name: profile.name || session.user.email.split('@')[0],
          role: finalRole,
          token: session.access_token,
          refreshToken: session.refresh_token,
          loginTime: Date.now(),
          isFirstLogin: profile.is_first_login ?? profile.isFirstLogin ?? false,
          isActive: profile.is_active ?? profile.isActive ?? true,
          force_password_change: profile.force_password_change ?? false,
          phone: profile.phone || null,
          institution_id: profile.institution_id || null,
          profile_image_url: profile.profile_image_url || null
        };

        // Fetch institution name and logo if user belongs to one
        if (profile.institution_id) {
          try {
            const { data: inst } = await supabase
              .from('institutions')
              .select('name, logo_url, can_add_students')
              .eq('institution_id', profile.institution_id)
              .maybeSingle();
            if (inst) {
              userData.institution_name = inst.name;
              userData.institution_logo_url = inst.logo_url || null;
              userData.can_add_students = inst.can_add_students || false;
            }
          } catch { /* institution info is optional */ }
        }

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', session.access_token);
        sessionStorage.setItem('sessionActive', 'true');

        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        log('User profile loaded:', { role: finalRole, email: userData.email });
      } else {
        // No profile found — use metadata role, default to STUDENT
        const finalRole = normalizeRole(session.user.user_metadata?.role);

        const userData = {
          userId: session.user.id,
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
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
        log('Set fallback user from auth session:', { role: finalRole, email: userData.email });

        // Try to create profile in database for future use
        try {
          const { data: existingProfile } = await supabase
            .from('users')
            .select('user_id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: userData.email,
                name: userData.name,
                role: finalRole,
                is_active: true,
                created_at: new Date().toISOString()
              });

            if (createError && createError.code !== '23505') {
              warn('Could not create profile:', createError.message);
            }
          }
        } catch { /* profile creation is optional */ }
      }
    } finally {
      profileLoadingRef.current = false;
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
    lastLoginTime,
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

