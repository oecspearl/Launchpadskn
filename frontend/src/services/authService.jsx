/**
 * ⚠️ DEPRECATED: This service is no longer used.
 * Auth has been migrated to Supabase Auth.
 * Use `authServiceSupabase.js` and `AuthContextSupabase.js` instead.
 * 
 * This file is kept for reference only.
 */

import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth/';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to include token in requests, but exclude public auth endpoints
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const publicEndpoints = ['login', 'login-ad', 'register', 'forgot-password', 'reset-password'];
    if (token && !publicEndpoints.includes(config.url)) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class AuthService {
  async login(email, password) {
    try {
      const response = await instance.post('login', { email, password });
      
      if (response.data.token) {
        const loginData = {
          ...response.data,
          loginTime: Date.now()
        };
        localStorage.setItem('user', JSON.stringify(loginData));
        localStorage.setItem('token', response.data.token);
        sessionStorage.setItem('sessionActive', 'true');
      }
      return response.data;
    } catch (error) {
      console.error('Login error', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async loginWithAD(email, password) {
    try {
      const response = await instance.post('login-ad', { email, password });
      
      if (response.data.token) {
        const loginData = {
          ...response.data,
          loginTime: Date.now()
        };
        localStorage.setItem('user', JSON.stringify(loginData));
        localStorage.setItem('token', response.data.token);
        sessionStorage.setItem('sessionActive', 'true');
      }
      return response.data;
    } catch (error) {
      console.error('AD Login error', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async register(name, email, password, role = 'STUDENT', phone = '', dateOfBirth = '', address = '', emergencyContact = '') {
    try {
      const response = await instance.post('register', {
        name,
        email,
        password,
        role,
        phone,
        dateOfBirth,
        address,
        emergencyContact
      });
      return response.data;
    } catch (error) {
      console.error('Registration error', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('sessionActive');
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    const hasToken = !!this.getToken();
    const hasSession = !!sessionStorage.getItem('sessionActive');
    return hasToken && hasSession;
  }

  async sendPasswordResetEmail(email) {
    try {
      const response = await instance.post('forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Send password reset email error', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await instance.post('reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Reset password error', error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new AuthService();