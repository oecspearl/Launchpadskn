/**
 * Supabase Authentication Service
 * Handles all authentication operations via Supabase Auth
 */
import { supabase } from '../config/supabase';
import supabaseService from './supabaseService';

const log = (...args) => {
  if (import.meta.env.DEV) console.log('[AuthService]', ...args);
};
const warn = (...args) => {
  if (import.meta.env.DEV) console.warn('[AuthService]', ...args);
};

class AuthService {

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      let userData = null;

      // Try to get user profile from users table (by UUID first, then email)
      try {
        const profile = await supabaseService.getUserProfile(authData.user.id);
        userData = {
          userId: profile.user_id || authData.user.id,
          user_id: profile.user_id,
          id: authData.user.id,
          email: authData.user.email,
          name: profile.name || authData.user.email.split('@')[0],
          role: (profile.role || 'STUDENT').toUpperCase().trim(),
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          loginTime: Date.now()
        };
        log('Profile found for:', userData.email);
      } catch (profileError) {
        warn('Profile not found by UUID, trying by email');

        try {
          const { data: emailProfile, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', authData.user.email)
            .maybeSingle();

          if (emailProfile && !emailError) {
            // Found by email - link the UUID
            log('Found profile by email, linking UUID');
            await supabase
              .from('users')
              .update({ id: authData.user.id })
              .eq('user_id', emailProfile.user_id);

            userData = {
              userId: emailProfile.user_id,
              user_id: emailProfile.user_id,
              id: authData.user.id,
              email: emailProfile.email,
              name: emailProfile.name || authData.user.email.split('@')[0],
              role: (emailProfile.role || 'STUDENT').toUpperCase().trim(),
              token: authData.session.access_token,
              refreshToken: authData.session.refresh_token,
              loginTime: Date.now()
            };
          } else {
            // No profile found - create one with role from metadata or default to STUDENT
            warn('No profile found, creating new profile');
            const role = (authData.user.user_metadata?.role || 'STUDENT').toUpperCase().trim();

            userData = {
              userId: authData.user.id,
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.name || authData.user.email.split('@')[0],
              role: role,
              token: authData.session.access_token,
              refreshToken: authData.session.refresh_token,
              loginTime: Date.now()
            };

            // Try to create profile in users table
            try {
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: authData.user.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role,
                  is_active: true,
                  created_at: new Date().toISOString()
                });

              if (createError) {
                warn('Could not create profile:', createError.message);
              }
            } catch (createError) {
              warn('Error creating profile:', createError.message);
            }
          }
        } catch (emailLookupError) {
          warn('Email lookup failed, using defaults');
          userData = {
            userId: authData.user.id,
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.email.split('@')[0],
            role: (authData.user.user_metadata?.role || 'STUDENT').toUpperCase().trim(),
            token: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            loginTime: Date.now()
          };
        }
      }

      // Validate role against known roles - default to STUDENT for unknown roles
      const validRoles = ['ADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR', 'STUDENT'];
      const normalizedRole = (userData.role || '').toUpperCase().trim();
      if (normalizedRole === 'TEACHER') {
        userData.role = 'INSTRUCTOR';
      } else {
        userData.role = validRoles.includes(normalizedRole) ? normalizedRole : 'STUDENT';
      }

      log('Login successful:', { email: userData.email, role: userData.role });

      // Store in localStorage for compatibility
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authData.session.access_token);
      sessionStorage.setItem('sessionActive', 'true');

      return userData;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Login error', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(name, email, password, role = 'STUDENT', phone = '', dateOfBirth = '', address = '', emergencyContact = '') {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            phone,
            date_of_birth: dateOfBirth,
            address,
            emergency_contact: emergencyContact
          }
        }
      });

      if (authError) throw authError;

      // Create user profile - use both id and user_id for dual-ID compatibility
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          role,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          emergency_contact: emergencyContact || null,
          is_active: true,
          is_first_login: true
        });

      if (profileError) {
        // Profile creation failed - log but don't try admin.deleteUser
        // (service role key is not available on client)
        warn('Profile creation failed after signup:', profileError.message);
        throw profileError;
      }

      return {
        userId: authData.user.id,
        email: authData.user.email,
        name,
        role,
        message: 'Registration successful. Please check your email to verify your account.'
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Registration error', error);
      throw error;
    }
  }

  /**
   * Logout - clears all application storage
   */
  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      warn('Logout error:', error.message);
    } finally {
      // Always clear local storage regardless of signOut success
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('lastLoginTime');
      localStorage.removeItem('currentLoginTime');
      sessionStorage.removeItem('sessionActive');
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async isAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('sessionActive');
        return false;
      }

      if (session.access_token) {
        localStorage.setItem('token', session.access_token);
      }

      return true;
    } catch (error) {
      warn('Auth check error:', error.message);
      return false;
    }
  }

  async sendPasswordResetEmail(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return { message: 'Password reset email sent. Please check your inbox.' };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Send password reset email error', error);
      throw error;
    }
  }

  async resetPassword(_token, newPassword) {
    try {
      // Supabase handles reset via magic link that establishes a session automatically
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { message: 'Password reset successful' };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Reset password error', error);
      throw error;
    }
  }

  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { message: 'Password updated successfully' };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Update password error', error);
      throw error;
    }
  }

  async refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token);
      }
      return session;
    } catch (error) {
      warn('Refresh session error:', error.message);
      throw error;
    }
  }
}

export default new AuthService();
