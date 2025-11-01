import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCopy } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { sendPasswordResetEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setResetEmail('');
    setCopied(false);
    setIsLoading(true);

    try {
      const response = await sendPasswordResetEmail(email);
      setMessage('Password reset request successful!');
      
      // For development environment, display the token
      if (response.token) {
        setResetToken(response.token);
        setResetEmail(response.email || email);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.error || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToResetPage = () => {
    navigate(`/reset-password?token=${resetToken}`);
  };

  return (
    <Container fluid className="py-5 forgot-password-container bg-light min-vh-100 d-flex align-items-center">
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow border-0 rounded-lg overflow-hidden">
            <Card.Header className="bg-primary text-white text-center py-4">
              <h2 className="fw-bold mb-0">Reset Your Password</h2>
              <p className="text-white-50 mt-2 mb-0">Enter your email to receive a password reset link</p>
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
              
              {resetToken && (
                <Alert variant="info" className="animate__animated animate__fadeIn">
                  <div className="mb-2"><strong>Development Mode:</strong> Use the token below to reset your password</div>
                  <div className="d-flex align-items-center mb-2">
                    <div className="text-truncate me-2" style={{ maxWidth: '80%' }}>
                      <strong>Token:</strong> {resetToken}
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(resetToken)}
                      className="ms-auto"
                    >
                      <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong> {resetEmail}
                  </div>
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      onClick={goToResetPage}
                    >
                      Continue to Reset Password
                    </Button>
                  </div>
                </Alert>
              )}
              
              {!resetToken && (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label>Email address</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaEnvelope />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="py-2"
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      <strong>Development Mode:</strong> No email will be sent. The reset token will be displayed here.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="py-2" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Request Reset Token'}
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
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPassword;
