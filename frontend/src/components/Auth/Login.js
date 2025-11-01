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
    console.log('[Login] useEffect triggered', { 
      isAuthenticated, 
      user: user ? { email: user.email, role: user.role } : null,
      pathname: window.location.pathname
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
          } else if (role === 'instructor') {
            dashboardPath = '/instructor/dashboard';
          } else if (role === 'student') {
            dashboardPath = '/student/dashboard';
          }
          
          console.log('[Login] Determined dashboard path:', dashboardPath);
          
          const currentPath = window.location.pathname;
          
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
      switch(role) {
        case 'admin':
          dashboardPath = '/admin/dashboard';
          break;
        case 'instructor':
          dashboardPath = '/instructor/dashboard';
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
    <Container fluid className="py-5 login-container min-vh-100 d-flex align-items-center">
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow border-0 rounded-lg overflow-hidden">
            <Card.Header className="text-white text-center py-4" style={{ 
              background: 'linear-gradient(135deg, #009639 0%, #CE1126 100%)',
              borderBottom: '3px solid #FCD116'
            }}>
              <h2 className="fw-bold mb-0">
                <FaSignInAlt className="me-2" />
                Login to LaunchPad SKN
              </h2>
              <p className="text-white-50 mt-2 mb-0">Access your learning dashboard</p>
              
              {/* Login Type Toggle */}
              <div className="mt-3 login-type-toggle">
                <ButtonGroup size="sm">
                  <Button 
                    variant={loginType === 'database' ? 'light' : 'outline-light'}
                    onClick={() => setLoginType('database')}
                    className="px-3"
                  >
                    <FaDatabase className="me-1" />
                    Database Login
                  </Button>
                  <Button 
                    variant={loginType === 'ad' ? 'light' : 'outline-light'}
                    onClick={() => setLoginType('ad')}
                    className="px-3"
                  >
                    <FaBuilding className="me-1" />
                    Active Directory
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            
            <Card.Body className="px-4 py-5">
              {message && (
                <Alert variant="success" className="animate__animated animate__fadeIn">
                  {message}
                </Alert>
              )}
              
              {error && (
                <Alert variant="danger" className="animate__animated animate__shakeX">
                  {error}
                </Alert>
              )}
              
              {/* Login Type Info */}
              <Alert 
                variant={loginType === 'ad' ? 'info' : 'success'} 
                className={`mb-4 ${loginType === 'ad' ? 'ad-login-info' : 'database-login-info'}`}
              >
                <div className="d-flex align-items-center">
                  {loginType === 'ad' ? <FaBuilding className="me-2" /> : <FaDatabase className="me-2" />}
                  <div>
                    <strong>
                      {loginType === 'ad' ? 'Active Directory Login' : 'Database Login'}
                    </strong>
                    <div className="small mt-1">
                      {loginType === 'ad' 
                        ? 'Use your domain credentials (e.g., jadmin@mylab.local)'
                        : 'Use your LaunchPad SKN account credentials'
                      }
                    </div>
                  </div>
                </div>
              </Alert>
              
              <Form onSubmit={handleSubmit} className={`login-form-transition ${loginType === 'ad' ? 'ad-login' : 'database-login'}`}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    {loginType === 'ad' ? 'Domain Email' : 'Email address'}
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaEnvelope />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      placeholder={loginType === 'ad' 
                        ? 'Enter your domain email (e.g., jadmin@mylab.local)'
                        : 'Enter your email'
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="py-2"
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <div className="d-flex justify-content-between">
                    <Form.Label>Password</Form.Label>
                    {loginType === 'database' && (
                      <Link to="/forgot-password" className="text-decoration-none small">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                    />
                  </InputGroup>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isLoading}
                  className="w-100 py-2 mt-3 fw-bold"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {loginType === 'ad' ? 'Authenticating with AD...' : 'Logging in...'}
                    </>
                  ) : (
                    <>
                      {loginType === 'ad' ? <FaBuilding className="me-2" /> : <FaDatabase className="me-2" />}
                      {loginType === 'ad' ? 'Login with AD' : 'Login'}
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
            
            <Card.Footer className="text-center py-4 bg-light">
              {loginType === 'database' && (
                <>
                  <div className="border-bottom pb-3 mb-3">
                    <small className="text-muted">Admin or Instructor?</small>
                    <div className="mt-1">
                      <small>Contact your institution administrator for account setup</small>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-center">
                    <span className="text-muted me-2">🎓</span>
                    <span className="me-2">New Student?</span>
                    <Link to="/register" className="btn btn-outline-primary btn-sm fw-bold">
                      Create Student Account
                    </Link>
                  </div>
                </>
              )}
              
              {loginType === 'ad' && (
                <div className="text-muted">
                  <small>
                    <FaBuilding className="me-1" />
                    Active Directory users are managed by your system administrator
                  </small>
                  <div className="mt-2">
                    <small className="text-info">
                      Test Users: jadmin@mylab.local, sinstructor@mylab.local, mstudent@mylab.local
                    </small>
                  </div>
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