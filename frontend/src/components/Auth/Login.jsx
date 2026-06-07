import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { FaEnvelope, FaLock, FaBuilding, FaDatabase, FaBook, FaChartLine, FaUsers, FaGraduationCap } from 'react-icons/fa';
import SKNFlagLogo from '../common/SKNFlagLogo';
import { toDbRole } from '../../constants/roles';
import './Auth.css';

function getDashboardPath(role) {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'school_admin': return '/school-admin/dashboard';
    case 'instructor':
    case 'teacher': return '/teacher/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/login';
  }
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState('database'); // 'database' or 'ad'

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithAD, user, isAuthenticated } = useAuth();

  // Auto-redirect if already authenticated (but only after a brief delay to ensure component renders)
  useEffect(() => {
    const currentPath = window.location.pathname;

    // CRITICAL: Only run redirect logic if we're actually on login or root page
    // This prevents the redirect from running when user is already on their dashboard
    // (which would happen when AuthContext updates user state after loading profile)
    if (currentPath !== '/login' && currentPath !== '/') {
      console.log('[Login] Not on login/root page, skipping redirect logic. Current path:', currentPath);
      return;
    }

    console.log('[Login] useEffect triggered', {
      isAuthenticated,
      user: user ? { email: user.email, role: user.role } : null,
      pathname: currentPath
    });

    // Small delay to ensure login form renders first
    const checkAuthTimeout = setTimeout(() => {
      // Check localStorage first as it's most reliable
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      // Determine if user is actually logged in
      let actualUser = user;
      let actualIsAuthenticated = isAuthenticated;

      if (!actualUser && storedUser && storedToken) {
        try {
          actualUser = JSON.parse(storedUser);
          actualIsAuthenticated = true;
          console.log('[Login] Using user from localStorage:', actualUser);
        } catch (e) {
          console.error('[Login] Error parsing stored user:', e);
        }
      }

      if (actualIsAuthenticated && actualUser && actualUser.role) {
        const role = toDbRole(actualUser.role);

        const dashboardPath = getDashboardPath(role);

        // Only redirect if we're on login page and user is authenticated
        if ((currentPath === '/login' || currentPath === '/') && dashboardPath !== '/login') {
          navigate(dashboardPath, { replace: true });
        }
      }
    }, 500); // Wait 500ms before checking auth to ensure form renders

    return () => clearTimeout(checkAuthTimeout);
  }, [isAuthenticated, user]);

  // Check if there's a message from redirect (e.g., after registration)
  const message = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let userData;

      if (loginType === 'ad') {
        userData = await loginWithAD(email, password);
      } else {
        userData = await login(email, password);
      }

      if (!userData) {
        throw new Error('Login failed: No user data returned');
      }

      const role = toDbRole(userData?.role);

      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Determine dashboard based on user role
      if (!role || role === '') {
        console.error('Role is empty! userData:', userData);
        setError('Invalid user role. Please contact administrator.');
        return;
      }

      // Determine dashboard path
      const dashboardPath = getDashboardPath(role);

      if (dashboardPath === '/login') {
        setError(`Invalid user role: ${role}. Please contact your administrator.`);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = loginType === 'ad'
        ? err.response?.data?.error || err.message || 'Invalid Active Directory credentials'
        : err.response?.data?.error || err.message || 'Invalid email or password';
      setError(errorMessage);
    } finally {
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
        <div className="auth-form-container">
          <h2 className="auth-form-title">Sign In</h2>
          <p className="auth-form-subtitle">Access your learning dashboard</p>

          {/* Login Type Toggle */}
          <div className="auth-login-toggle">
            <button
              type="button"
              className={`auth-login-toggle-btn ${loginType === 'database' ? 'active' : ''}`}
              onClick={() => setLoginType('database')}
            >
              <FaDatabase size={12} />
              Database
            </button>
            <button
              type="button"
              className={`auth-login-toggle-btn ${loginType === 'ad' ? 'active' : ''}`}
              onClick={() => setLoginType('ad')}
            >
              <FaBuilding size={12} />
              Active Directory
            </button>
          </div>

          {/* Login type info */}
          <div className="auth-type-info">
            <div className="auth-type-info-icon">
              {loginType === 'ad' ? <FaBuilding /> : <FaDatabase />}
            </div>
            <div className="auth-type-info-text">
              {loginType === 'ad'
                ? 'Use your domain credentials (e.g., jadmin@mylab.local)'
                : 'Use your LaunchPad SKN account credentials'}
            </div>
          </div>

          {message && (
            <div className="auth-alert auth-alert--success">{message}</div>
          )}

          {error && (
            <div className="auth-alert auth-alert--error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">
                {loginType === 'ad' ? 'Domain Email' : 'Email Address'}
              </label>
              <input
                type="email"
                className="auth-input"
                placeholder={loginType === 'ad'
                  ? 'jadmin@mylab.local'
                  : 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <div className="auth-field-header">
                <label className="auth-label">Password</label>
                {loginType === 'database' && (
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  {loginType === 'ad' ? 'Authenticating...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {loginType === 'ad' ? 'Login with AD' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {loginType === 'database' ? (
              <>
                <p className="auth-footer-text">
                  New student? <Link to="/register" className="auth-footer-link">Create Account</Link>
                </p>
                <p className="auth-footer-note">
                  Admin or Instructor? Contact your institution administrator for account setup.
                </p>
              </>
            ) : (
              <p className="auth-footer-note">
                Active Directory users are managed by your system administrator.
                {import.meta.env.DEV && (
                  <><br />Test: jadmin@mylab.local, sinstructor@mylab.local, mstudent@mylab.local</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
