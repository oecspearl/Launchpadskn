import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUser, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { userService } from '../../services/userService';

function Profile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        emergencyContact: user.emergencyContact || ''
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (updates) => userService.updateUserProfile(user.userId || user.id, updates),
    onSuccess: (data) => {
      // Update local auth context
      const updatedUser = {
        ...user,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        emergencyContact: formData.emergencyContact
      };
      updateUser(updatedUser);

      // Invalidate relevant queries
      queryClient.invalidateQueries(['user-profile']);

      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      setTimeout(() => setError(''), 3000);
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    updateProfileMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      date_of_birth: formData.dateOfBirth || null,
      emergency_contact: formData.emergencyContact || null,
      updated_at: new Date().toISOString()
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth || '',
      emergencyContact: user.emergencyContact || ''
    });
    setEditing(false);
    setError('');
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <FaUser className="me-2" />
                  My Profile
                </h4>
                {!editing ? (
                  <Button variant="outline-primary" onClick={() => setEditing(true)}>
                    <FaEdit className="me-1" />
                    Edit Profile
                  </Button>
                ) : (
                  <div>
                    <Button
                      variant="success"
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="me-2"
                    >
                      <FaSave className="me-1" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline-secondary" onClick={handleCancel}>
                      <FaTimes className="me-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Enter your address"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Emergency Contact</Form.Label>
                <Form.Control
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Emergency contact information"
                />
              </Form.Group>

              <hr />

              <Row>
                <Col md={6}>
                  <p><strong>Role:</strong> {user?.role}</p>
                  <p><strong>Account Status:</strong> {user?.isActive ? 'Active' : 'Inactive'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;