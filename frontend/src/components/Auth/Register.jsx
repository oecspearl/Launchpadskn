import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserGraduate, FaChalkboardTeacher, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';

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
    <Container className="py-5 register-container min-vh-100 d-flex align-items-center" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <Row className="justify-content-center w-100">
        <Col md={10} lg={8} xl={6}>
          <Card className="shadow-lg border-0 rounded-lg overflow-hidden" style={{ borderRadius: '16px' }}>
            <Card.Header className="text-white text-center py-4" style={{
              backgroundColor: 'var(--theme-primary)',
              borderBottom: '4px solid var(--theme-secondary)'
            }}>
              <h2 className="fw-bold mb-0 h3">
                <FaUserGraduate className="me-2" />
                Student Registration
              </h2>
              <p className="text-white-50 mt-2 mb-0 small">Create your student account to access courses</p>
            </Card.Header>

            <Card.Body className="p-4 bg-white">
              {apiError && (
                <Alert variant="danger" className="animate__animated animate__shakeX shadow-sm border-0 bg-danger-subtle text-danger">
                  {apiError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Full Name</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 text-muted">
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Enter your full name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          isInvalid={!!errors.name}
                          className="border-start-0 bg-light"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Email Address</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 text-muted">
                          <FaEnvelope />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          isInvalid={!!errors.email}
                          className="border-start-0 bg-light"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 text-muted">
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Create password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          isInvalid={!!errors.password}
                          className="border-start-0 bg-light"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </InputGroup>
                      <Form.Text className="text-muted small">
                        At least 8 characters
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Confirm Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 text-muted">
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Confirm password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          isInvalid={!!errors.confirmPassword}
                          className="border-start-0 bg-light"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Enter your phone number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Date of Birth</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Enter your address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small text-uppercase">Emergency Contact</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Emergency contact name and phone"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className="bg-light"
                      />
                      <Form.Text className="text-muted small">
                        e.g., "John Doe - (555) 123-4567"
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

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
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Form>
            </Card.Body>

            <Card.Footer className="text-center py-3 bg-light border-top-0">
              <div>
                Already have an account? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: 'var(--theme-primary)' }}>Login here</Link>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;