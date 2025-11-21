import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();

  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 8) {
      return setError('Password must be at least 8 characters long');
    }
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setMessage('Your password has been successfully reset. Redirecting to login...');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successful. Please log in with your new password.' } 
        });
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.error || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container className="py-5 reset-password-container bg-light min-vh-100 d-flex align-items-center">
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow border-0 rounded-lg overflow-hidden">
            <Card.Header className="bg-primary text-white text-center py-4">
              <h2 className="fw-bold mb-0">Create New Password</h2>
              <p className="text-white-50 mt-2 mb-0">Enter your new password below</p>
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
              
              {token && (
                <Alert variant="info" className="mb-4">
                  <strong>Development Mode:</strong> Using token: {token.substring(0, 8)}...{token.substring(token.length - 8)}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>New Password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock />
                    </InputGroup.Text>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={toggleShowPassword}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Password must be at least 8 characters long.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock />
                    </InputGroup.Text>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="py-2"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={toggleShowConfirmPassword}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="py-2" 
                    disabled={isLoading || !token}
                  >
                    {isLoading ? 'Processing...' : 'Reset Password'}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    className="py-2" 
                    onClick={() => navigate('/login')}
                  >
                    <FaArrowLeft className="me-2" />
                    Back to Login
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ResetPassword;
