import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, InputGroup, ButtonGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { FaEnvelope, FaLock, FaSignInAlt, FaBuilding, FaDatabase } from 'react-icons/fa';

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
        const role = (actualUser.role || '').toLowerCase().trim();
        console.log('[Login] User authenticated, attempting redirect...', { role, email: actualUser.email });

        if (role) {
          let dashboardPath = '/login';

          if (role === 'admin') {
            dashboardPath = '/admin/dashboard';
          } else if (role === 'instructor' || role === 'teacher') {
            dashboardPath = '/teacher/dashboard';
          } else if (role === 'student') {
            dashboardPath = '/student/dashboard';
          }

          console.log('[Login] Determined dashboard path:', dashboardPath);

          // Only redirect if we're on login page and user is authenticated
          if (currentPath === '/login' && dashboardPath !== '/login') {
            console.log('[Login] On login page but authenticated, redirecting to:', dashboardPath);
            // User is authenticated but on login page, redirect
            window.location.replace(dashboardPath);
          } else if (currentPath === '/' && dashboardPath !== '/login') {
            console.log('[Login] On root path, redirecting authenticated user to dashboard');
            // User is on root path (/) and authenticated, redirect to dashboard
            window.location.replace(dashboardPath);
          }
        }
      } else {
        console.log('[Login] Not authenticated, showing login form', {
          isAuthenticated: actualIsAuthenticated,
          hasUser: !!actualUser,
          hasRole: !!actualUser?.role,
          hasStoredUser: !!storedUser
        });
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

      console.log('Login successful, userData:', userData);

      // Check if userData was returned
      if (!userData) {
        console.error('Login returned no userData');
        throw new Error('Login failed: No user data returned');
      }

      // Ensure role matching is case-insensitive
      const role = (userData?.role || '').toLowerCase();

      console.log('User role:', role, 'Full userData:', JSON.stringify(userData, null, 2));

      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Determine dashboard based on user role
      if (!role || role === '') {
        console.error('Role is empty! userData:', userData);
        setError('Invalid user role. Please contact administrator.');
        return;
      }

      // Determine dashboard path
      let dashboardPath = '/login';
      switch (role) {
        case 'admin':
          dashboardPath = '/admin/dashboard';
          break;
        case 'instructor':
          dashboardPath = '/teacher/dashboard';
          break;
        case 'student':
          dashboardPath = '/student/dashboard';
          break;
        default:
          console.warn('Unknown role:', role, 'userData:', userData);
          setError(`Invalid user role: ${role}. Expected: admin, instructor, or student`);
          dashboardPath = '/admin/dashboard'; // Fallback to admin
      }

      console.log('[Login] handleSubmit - Navigating to:', dashboardPath);

      // Clear loading state
      setIsLoading(false);

      // Use window.location.replace() for immediate redirect (most reliable)
      console.log('[Login] Using window.location.replace() for redirect');
      window.location.replace(dashboardPath);
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
    <Container className="py-5 login-container min-vh-100 d-flex align-items-center" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-lg border-0 rounded-lg overflow-hidden" style={{ borderRadius: '16px' }}>
            <Card.Header className="text-white text-center py-4" style={{
              backgroundColor: 'var(--theme-primary)',
              borderBottom: '4px solid var(--theme-secondary)'
            }}>
              <h2 className="fw-bold mb-0 h3">
                <FaSignInAlt className="me-2" />
                Welcome Back
              </h2>
              <p className="text-white-50 mt-2 mb-0 small">Sign in to LaunchPad SKN</p>

              {/* Login Type Toggle */}
              <div className="mt-3 login-type-toggle">
                <ButtonGroup size="sm">
                  <Button
                    variant={loginType === 'database' ? 'light' : 'outline-light'}
                    onClick={() => setLoginType('database')}
                    className="px-3 fw-medium"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <FaDatabase className="me-1" />
                    Database
                  </Button>
                  <Button
                    variant={loginType === 'ad' ? 'light' : 'outline-light'}
                    onClick={() => setLoginType('ad')}
                    className="px-3 fw-medium"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <FaBuilding className="me-1" />
                    Active Directory
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>

            <Card.Body className="px-4 py-5 bg-white">
              {message && (
                <Alert variant="success" className="animate__animated animate__fadeIn shadow-sm border-0 bg-success-subtle text-success">
                  {message}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="animate__animated animate__shakeX shadow-sm border-0 bg-danger-subtle text-danger">
                  {error}
                </Alert>
              )}

              {/* Login Type Info */}
              <Alert
                variant={loginType === 'ad' ? 'info' : 'success'}
                className={`mb-4 border-0 shadow-sm ${loginType === 'ad' ? 'bg-info-subtle text-info-emphasis' : 'bg-success-subtle text-success-emphasis'}`}
              >
                <div className="d-flex align-items-center">
                  {loginType === 'ad' ? <FaBuilding className="me-2" /> : <FaDatabase className="me-2" />}
                  <div>
                    <strong className="d-block" style={{ fontSize: '0.9rem' }}>
                      {loginType === 'ad' ? 'Active Directory Login' : 'Database Login'}
                    </strong>
                    <div className="small opacity-75">
                      {loginType === 'ad'
                        ? 'Use your domain credentials'
                        : 'Use your LaunchPad SKN account'
                      }
                    </div>
                  </div>
                </div>
              </Alert>

              <Form onSubmit={handleSubmit} className={`login-form-transition ${loginType === 'ad' ? 'ad-login' : 'database-login'}`}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-secondary small text-uppercase">
                    {loginType === 'ad' ? 'Domain Email' : 'Email address'}
                  </Form.Label>
                  <InputGroup className="input-group-lg">
                    <InputGroup.Text className="bg-light border-end-0 text-muted">
                      <FaEnvelope />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      placeholder={loginType === 'ad'
                        ? 'e.g., jadmin@mylab.local'
                        : 'name@example.com'
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-start-0 bg-light"
                      style={{ fontSize: '0.95rem' }}
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-semibold text-secondary small text-uppercase mb-0">Password</Form.Label>
                    {loginType === 'database' && (
                      <Link to="/forgot-password" style={{ color: 'var(--theme-primary)', fontSize: '0.85rem', fontWeight: '500' }} className="text-decoration-none">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <InputGroup className="input-group-lg">
                    <InputGroup.Text className="bg-light border-end-0 text-muted">
                      <FaLock />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-start-0 bg-light"
                      style={{ fontSize: '0.95rem' }}
                    />
                  </InputGroup>
                </Form.Group>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-100 py-3 mt-2 fw-bold shadow-sm border-0"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    fontSize: '1rem',
                    letterSpacing: '0.5px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'var(--theme-primary-dark)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'var(--theme-primary)'}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {loginType === 'ad' ? 'Authenticating...' : 'Logging in...'}
                    </>
                  ) : (
                    <>
                      {loginType === 'ad' ? <FaBuilding className="me-2" /> : <FaDatabase className="me-2" />}
                      {loginType === 'ad' ? 'Login with AD' : 'Sign In'}
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>

            <Card.Footer className="text-center py-4 bg-light border-top-0">
              {loginType === 'database' && (
                <>
                  <div className="d-flex align-items-center justify-content-center">
                    <span className="text-muted me-2 small">Don't have an account?</span>
                    <Link to="/register" className="fw-bold text-decoration-none" style={{ color: 'var(--theme-primary)' }}>
                      Create Student Account
                    </Link>
                  </div>
                </>
              )}

              {loginType === 'ad' && (
                <div className="text-muted small">
                  <FaBuilding className="me-1" />
                  Managed by your system administrator
                </div>
              )}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;