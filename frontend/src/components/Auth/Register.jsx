import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { FaBook, FaChartLine, FaUsers, FaGraduationCap } from 'react-icons/fa';
import SKNFlagLogo from '../common/SKNFlagLogo';
import './Auth.css';

function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    role: 'STUDENT'
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validate name (combined first and last name)
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...registrationData } = formData;

      // Call Supabase registration via AuthContext
      const result = await registerUser(
        registrationData.name,
        registrationData.email,
        registrationData.password,
        'STUDENT', // Force student role for this registration page
        registrationData.phone,
        registrationData.dateOfBirth,
        registrationData.address,
        registrationData.emergencyContact
      );

      console.log('Registration successful:', result);

      // Redirect to login with success message
      navigate('/login', {
        state: {
          message: result?.message || 'Registration successful! Please check your email to verify your account, then log in.'
        }
      });
    } catch (error) {
      // Handle registration errors
      console.error('Registration error:', error);

      // Extract error message from Supabase error
      let errorMessage = 'Registration failed. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Common Supabase error messages
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (errorMessage.includes('Password')) {
        errorMessage = 'Password does not meet requirements. Please use a stronger password.';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Invalid email address. Please enter a valid email.';
      }

      setApiError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel — Brand */}
      <div className="auth-left">
        <div className="auth-left-border" />
        <div className="auth-left-content">
          <div className="auth-brand-logo">
            <SKNFlagLogo width={56} height={38} />
          </div>
          <h1 className="auth-brand-name">
            Launch<span className="skn-highlight">Pad</span>
          </h1>
          <p className="auth-brand-tagline">
            SKN Learning Management System
          </p>

          <ul className="auth-features">
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><FaBook /></div>
              <div className="auth-feature-text">
                <strong>Course Management</strong>
                Access and manage your courses, assignments, and resources
              </div>
            </li>
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><FaChartLine /></div>
              <div className="auth-feature-text">
                <strong>Progress Tracking</strong>
                Monitor performance with real-time analytics and insights
              </div>
            </li>
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><FaUsers /></div>
              <div className="auth-feature-text">
                <strong>Collaboration</strong>
                Connect with instructors and peers through integrated tools
              </div>
            </li>
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><FaGraduationCap /></div>
              <div className="auth-feature-text">
                <strong>AI-Powered Learning</strong>
                Personalized tutoring and adaptive content delivery
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="auth-right">
        <div className="auth-form-container" style={{ maxWidth: 520 }}>
          <h2 className="auth-form-title">Student Registration</h2>
          <p className="auth-form-subtitle">Create your student account to access courses</p>

          {apiError && (
            <div className="auth-alert auth-alert--error">{apiError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                className={`auth-input ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Enter your full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <div className="auth-field-error">{errors.name}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="auth-field-error">{errors.email}</div>}
            </div>

            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className={`auth-input ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Create password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password
                  ? <div className="auth-field-error">{errors.password}</div>
                  : <div className="auth-field-hint">Minimum 8 characters</div>
                }
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <input
                  type="password"
                  className={`auth-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Confirm password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <div className="auth-field-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-label">Phone Number</label>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="Enter phone number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Date of Birth</label>
                <input
                  type="date"
                  className="auth-input"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Address</label>
              <textarea
                className="auth-input auth-textarea"
                placeholder="Enter your address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Emergency Contact</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Emergency contact name and phone"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
              />
              <div className="auth-field-hint">e.g., "John Doe - (555) 123-4567"</div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account? <Link to="/login" className="auth-footer-link">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
