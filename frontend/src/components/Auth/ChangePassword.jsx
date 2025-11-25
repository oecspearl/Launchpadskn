import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaLock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { userService } from '../../services/userService';

function ChangePassword() {
  const { user, updateUser } = useAuth();

  // Debug logging
  console.log('ChangePassword - user:', user);
  console.log('ChangePassword - user.isFirstLogin:', user?.isFirstLogin, 'type:', typeof user?.isFirstLogin);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) throw updateError;

      // Update user profile to mark first login as complete using userService
      if (user.userId || user.id) {
        try {
          await userService.updateUserProfile(user.userId || user.id, {
            is_first_login: false,
            updated_at: new Date().toISOString()
          });
        } catch (profileError) {
          console.warn('Failed to update is_first_login:', profileError);
        }
      }

      // Update local user state
      console.log('ChangePassword - updating user isFirstLogin to false');
      updateUser({ ...user, isFirstLogin: false, is_first_login: false });

      // Navigate to appropriate dashboard
      const role = user.role.toLowerCase();
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'instructor':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <Card.Header className="text-center bg-warning">
              <h4 className="mb-0">
                <FaLock className="me-2" />
                Change Password Required
              </h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                This is your first time logging in. Please change your password to continue.
              </Alert>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ChangePassword;