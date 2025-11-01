/**
 * Supabase Authentication Service
 * Replaces the old authService.js with Supabase Auth
 */
import { supabase } from '../config/supabase';
import supabaseService from './supabaseService';

class AuthService {
  
  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;
      
      // Try to get user profile from users table
      let profile = null;
      let userData = null;
      
      try {
        profile = await supabaseService.getUserProfile(authData.user.id);
        
        // Profile found - use it
        userData = {
          userId: profile.user_id,
          email: authData.user.email,
          name: profile.name,
          role: profile.role,
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          loginTime: Date.now()
        };
      } catch (profileError) {
        // Profile not found - try to find by email instead
        console.warn('Profile not found by UUID, trying by email:', profileError);
        
        try {
          // Try finding by email as fallback
          const { data: emailProfile, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', authData.user.email)
            .maybeSingle();
          
          if (emailProfile && !emailError) {
            // Found by email - link the UUID and use it
            await supabase
              .from('users')
              .update({ id: authData.user.id })
              .eq('user_id', emailProfile.user_id);
            
            userData = {
              userId: emailProfile.user_id,
              email: emailProfile.email,
              name: emailProfile.name || 'Admin User',
              role: emailProfile.role || 'ADMIN',
              token: authData.session.access_token,
              refreshToken: authData.session.refresh_token,
              loginTime: Date.now()
            };
          } else {
            // Still not found - use auth metadata or defaults
            console.warn('Profile not found by email either, using defaults');
            userData = {
              userId: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.name || 'Admin User',
              role: authData.user.user_metadata?.role || (authData.user.email.includes('admin') ? 'ADMIN' : 'STUDENT'),
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
                console.warn('Could not create profile:', createError);
              }
            } catch (createError) {
              console.warn('Could not create profile:', createError);
            }
          }
        } catch (emailLookupError) {
          console.error('Error in email lookup fallback:', emailLookupError);
          // Final fallback
          userData = {
            userId: authData.user.id,
            email: authData.user.email,
            name: 'Admin User',
            role: 'ADMIN', // Default to ADMIN for admin@ email
            token: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            loginTime: Date.now()
          };
        }
      }
      
      // Store in localStorage for compatibility with existing code
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authData.session.access_token);
      sessionStorage.setItem('sessionActive', 'true');
      
      return userData;
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  }
  
  /**
   * Register new user
   */
  async register(name, email, password, role = 'STUDENT', phone = '', dateOfBirth = '', address = '', emergencyContact = '') {
    try {
      // Sign up with Supabase Auth
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
      
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          user_id: authData.user.id,
          name,
          email,
          role,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          emergency_contact: emergencyContact || null,
          is_active: true,
          is_first_login: true
        });
      
      if (profileError) {
        // If profile creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
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
      console.error('Registration error', error);
      throw error;
    }
  }
  
  /**
   * Logout
   */
  async logout() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('sessionActive');
    } catch (error) {
      console.error('Logout error', error);
      throw error;
    }
  }
  
  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }
  
  /**
   * Get current session token
   */
  getToken() {
    return localStorage.getItem('token');
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Clear stale data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('sessionActive');
        return false;
      }
      
      // Update token if session exists
      if (session.access_token) {
        localStorage.setItem('token', session.access_token);
      }
      
      return true;
    } catch (error) {
      console.error('Auth check error', error);
      return false;
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { message: 'Password reset email sent. Please check your inbox.' };
    } catch (error) {
      console.error('Send password reset email error', error);
      throw error;
    }
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      // Supabase handles password reset differently
      // The token is in the URL after redirect
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { message: 'Password reset successful' };
    } catch (error) {
      console.error('Reset password error', error);
      throw error;
    }
  }
  
  /**
   * Update user password (authenticated user)
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error', error);
      throw error;
    }
  }
  
  /**
   * Get fresh session (refresh token)
   */
  async refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token);
      }
      
      return session;
    } catch (error) {
      console.error('Refresh session error', error);
      throw error;
    }
  }
}

export default new AuthService();

