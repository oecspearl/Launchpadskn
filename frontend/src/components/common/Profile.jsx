import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaEdit, FaSave, FaTimes, FaCamera } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { userService } from '../../services/userService';
import { supabase } from '../../config/supabase';

function Profile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

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
      setProfileImageUrl(user.profile_image_url || '');
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const userId = user.userId || user.user_id || user.id;
      const ext = file.name.split('.').pop();
      const filePath = `profiles/avatars/${userId}.${ext}`;

      // Delete old file if exists (ignore errors)
      await supabase.storage.from('lms-files').remove([filePath]);

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl + '?t=' + Date.now();

      // Save URL to user profile
      await userService.updateUserProfile(userId, { profile_image_url: imageUrl });

      setProfileImageUrl(imageUrl);
      updateUser({ ...user, profile_image_url: imageUrl });
      setSuccess('Profile photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
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

              {/* Profile Photo */}
              <div className="text-center mb-4">
                <div
                  style={{
                    width: 120, height: 120, borderRadius: '50%', margin: '0 auto',
                    overflow: 'hidden', border: '3px solid #dee2e6', position: 'relative',
                    backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FaUser size={48} color="#6c757d" />
                  )}
                </div>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <><Spinner size="sm" className="me-1" /> Uploading...</>
                    ) : (
                      <><FaCamera className="me-1" /> {profileImageUrl ? 'Change Photo' : 'Upload Photo'}</>
                    )}
                  </Button>
                </div>
              </div>

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