import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Form, Button, Tabs, Tab, Spinner, Alert,
  InputGroup, Badge
} from 'react-bootstrap';
import {
  FaSave, FaEdit, FaUser, FaGraduationCap, FaHeartbeat,
  FaUsers, FaPhone, FaEnvelope, FaMapMarkerAlt
} from 'react-icons/fa';
import studentInformationService from '../../services/studentInformationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function StudentProfile({ studentId, student, profile, onProfileUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('academic');
  const [formData, setFormData] = useState({
    // Academic
    student_number: '',
    enrollment_date: '',
    graduation_date: '',
    graduation_status: 'ENROLLED',
    current_grade_level: '',
    academic_year: new Date().getFullYear().toString(),
    gpa: '',
    cumulative_gpa: '',
    class_rank: '',
    
    // Personal
    date_of_birth: '',
    gender: '',
    nationality: '',
    place_of_birth: '',
    identification_number: '',
    blood_type: '',
    religion: '',
    ethnicity: '',
    
    // Contact
    primary_phone: '',
    secondary_phone: '',
    home_address: '',
    mailing_address: '',
    city: '',
    parish: '',
    country: 'Saint Kitts and Nevis',
    postal_code: '',
    
    // Emergency Contacts
    emergency_contact_1_name: '',
    emergency_contact_1_relationship: '',
    emergency_contact_1_phone: '',
    emergency_contact_1_email: '',
    emergency_contact_2_name: '',
    emergency_contact_2_relationship: '',
    emergency_contact_2_phone: '',
    emergency_contact_2_email: '',
    
    // Family
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_occupation: '',
    guardian_address: '',
    
    // Health
    medical_conditions: '',
    allergies: '',
    medications: '',
    doctor_name: '',
    doctor_phone: '',
    insurance_provider: '',
    insurance_policy_number: '',
    health_notes: '',
    
    // Behavioral
    behavioral_concerns: '',
    behavioral_strengths: '',
    counseling_services: false,
    counseling_notes: '',
    
    // Additional
    photo_url: '',
    notes: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        student_number: profile.student_number || '',
        enrollment_date: profile.enrollment_date || '',
        graduation_date: profile.graduation_date || '',
        graduation_status: profile.graduation_status || 'ENROLLED',
        current_grade_level: profile.current_grade_level || '',
        academic_year: profile.academic_year || new Date().getFullYear().toString(),
        gpa: profile.gpa || '',
        cumulative_gpa: profile.cumulative_gpa || '',
        class_rank: profile.class_rank || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        place_of_birth: profile.place_of_birth || '',
        identification_number: profile.identification_number || '',
        blood_type: profile.blood_type || '',
        religion: profile.religion || '',
        ethnicity: profile.ethnicity || '',
        primary_phone: profile.primary_phone || '',
        secondary_phone: profile.secondary_phone || '',
        home_address: profile.home_address || '',
        mailing_address: profile.mailing_address || '',
        city: profile.city || '',
        parish: profile.parish || '',
        country: profile.country || 'Saint Kitts and Nevis',
        postal_code: profile.postal_code || '',
        emergency_contact_1_name: profile.emergency_contact_1_name || '',
        emergency_contact_1_relationship: profile.emergency_contact_1_relationship || '',
        emergency_contact_1_phone: profile.emergency_contact_1_phone || '',
        emergency_contact_1_email: profile.emergency_contact_1_email || '',
        emergency_contact_2_name: profile.emergency_contact_2_name || '',
        emergency_contact_2_relationship: profile.emergency_contact_2_relationship || '',
        emergency_contact_2_phone: profile.emergency_contact_2_phone || '',
        emergency_contact_2_email: profile.emergency_contact_2_email || '',
        guardian_name: profile.guardian_name || '',
        guardian_relationship: profile.guardian_relationship || '',
        guardian_phone: profile.guardian_phone || '',
        guardian_email: profile.guardian_email || '',
        guardian_occupation: profile.guardian_occupation || '',
        guardian_address: profile.guardian_address || '',
        medical_conditions: profile.medical_conditions || '',
        allergies: profile.allergies || '',
        medications: profile.medications || '',
        doctor_name: profile.doctor_name || '',
        doctor_phone: profile.doctor_phone || '',
        insurance_provider: profile.insurance_provider || '',
        insurance_policy_number: profile.insurance_policy_number || '',
        health_notes: profile.health_notes || '',
        behavioral_concerns: profile.behavioral_concerns || '',
        behavioral_strengths: profile.behavioral_strengths || '',
        counseling_services: profile.counseling_services || false,
        counseling_notes: profile.counseling_notes || '',
        photo_url: profile.photo_url || '',
        notes: profile.notes || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updated_by: user?.user_id,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        cumulative_gpa: formData.cumulative_gpa ? parseFloat(formData.cumulative_gpa) : null,
        class_rank: formData.class_rank ? parseInt(formData.class_rank) : null
      };
      
      await studentInformationService.upsertStudentProfile(studentId, dataToSave);
      setEditing(false);
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Some tables may not exist yet.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Student Profile</h5>
          <div>
            {editing ? (
              <>
                <Button
                  variant="success"
                  size="sm"
                  className="me-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Spinner size="sm" className="me-2" /> : <FaSave className="me-1" />}
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    if (profile) {
                      // Reset form data
                      setFormData({ ...formData });
                    }
                  }}
                >
                  <FaTimes className="me-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <FaEdit className="me-1" />
                Edit
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab}>
            {/* Academic Tab */}
            <Tab eventKey="academic" title={<><FaGraduationCap className="me-1" />Academic</>}>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.student_number}
                      onChange={(e) => handleChange('student_number', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Enrollment Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.enrollment_date}
                      onChange={(e) => handleChange('enrollment_date', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Grade Level</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.current_grade_level}
                      onChange={(e) => handleChange('current_grade_level', e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., Form 3, Grade 9"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.academic_year}
                      onChange={(e) => handleChange('academic_year', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>GPA</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={formData.gpa}
                      onChange={(e) => handleChange('gpa', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cumulative GPA</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={formData.cumulative_gpa}
                      onChange={(e) => handleChange('cumulative_gpa', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class Rank</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.class_rank}
                      onChange={(e) => handleChange('class_rank', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Graduation Status</Form.Label>
                    <Form.Select
                      value={formData.graduation_status}
                      onChange={(e) => handleChange('graduation_status', e.target.value)}
                      disabled={!editing}
                    >
                      <option value="ENROLLED">Enrolled</option>
                      <option value="GRADUATED">Graduated</option>
                      <option value="DROPPED_OUT">Dropped Out</option>
                      <option value="TRANSFERRED">Transferred</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Graduation Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.graduation_date}
                      onChange={(e) => handleChange('graduation_date', e.target.value)}
                      disabled={!editing || formData.graduation_status !== 'GRADUATED'}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Personal Tab */}
            <Tab eventKey="personal" title={<><FaUser className="me-1" />Personal</>}>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      disabled={!editing}
                    >
                      <option value="">Select...</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nationality</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleChange('nationality', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Place of Birth</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.place_of_birth}
                      onChange={(e) => handleChange('place_of_birth', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Identification Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.identification_number}
                      onChange={(e) => handleChange('identification_number', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Blood Type</Form.Label>
                    <Form.Select
                      value={formData.blood_type}
                      onChange={(e) => handleChange('blood_type', e.target.value)}
                      disabled={!editing}
                    >
                      <option value="">Select...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Religion</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.religion}
                      onChange={(e) => handleChange('religion', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ethnicity</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.ethnicity}
                      onChange={(e) => handleChange('ethnicity', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Contact Tab */}
            <Tab eventKey="contact" title={<><FaPhone className="me-1" />Contact</>}>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Primary Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.primary_phone}
                      onChange={(e) => handleChange('primary_phone', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Secondary Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.secondary_phone}
                      onChange={(e) => handleChange('secondary_phone', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Home Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.home_address}
                      onChange={(e) => handleChange('home_address', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Parish</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.parish}
                      onChange={(e) => handleChange('parish', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Emergency Contacts Tab */}
            <Tab eventKey="emergency" title={<><FaUsers className="me-1" />Emergency</>}>
              <Row className="mt-3">
                <Col md={12}>
                  <h6>Emergency Contact 1</h6>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.emergency_contact_1_name}
                      onChange={(e) => handleChange('emergency_contact_1_name', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Relationship</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.emergency_contact_1_relationship}
                      onChange={(e) => handleChange('emergency_contact_1_relationship', e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., Parent, Guardian"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.emergency_contact_1_phone}
                      onChange={(e) => handleChange('emergency_contact_1_phone', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.emergency_contact_1_email}
                      onChange={(e) => handleChange('emergency_contact_1_email', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <hr />
                  <h6>Emergency Contact 2</h6>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.emergency_contact_2_name}
                      onChange={(e) => handleChange('emergency_contact_2_name', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Relationship</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.emergency_contact_2_relationship}
                      onChange={(e) => handleChange('emergency_contact_2_relationship', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.emergency_contact_2_phone}
                      onChange={(e) => handleChange('emergency_contact_2_phone', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.emergency_contact_2_email}
                      onChange={(e) => handleChange('emergency_contact_2_email', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <hr />
                  <h6>Guardian Information</h6>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Guardian Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.guardian_name}
                      onChange={(e) => handleChange('guardian_name', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Relationship</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.guardian_relationship}
                      onChange={(e) => handleChange('guardian_relationship', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.guardian_phone}
                      onChange={(e) => handleChange('guardian_phone', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.guardian_email}
                      onChange={(e) => handleChange('guardian_email', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Occupation</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.guardian_occupation}
                      onChange={(e) => handleChange('guardian_occupation', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.guardian_address}
                      onChange={(e) => handleChange('guardian_address', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Health Tab */}
            <Tab eventKey="health" title={<><FaHeartbeat className="me-1" />Health</>}>
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Medical Conditions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.medical_conditions}
                      onChange={(e) => handleChange('medical_conditions', e.target.value)}
                      disabled={!editing}
                      placeholder="List any medical conditions"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Allergies</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      disabled={!editing}
                      placeholder="List any allergies"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Medications</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.medications}
                      onChange={(e) => handleChange('medications', e.target.value)}
                      disabled={!editing}
                      placeholder="List current medications"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Doctor Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.doctor_name}
                      onChange={(e) => handleChange('doctor_name', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Doctor Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.doctor_phone}
                      onChange={(e) => handleChange('doctor_phone', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Insurance Provider</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.insurance_provider}
                      onChange={(e) => handleChange('insurance_provider', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Policy Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.insurance_policy_number}
                      onChange={(e) => handleChange('insurance_policy_number', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Health Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.health_notes}
                      onChange={(e) => handleChange('health_notes', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Behavioral Tab */}
            <Tab eventKey="behavioral" title={<><FaUser className="me-1" />Behavioral</>}>
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Behavioral Concerns</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.behavioral_concerns}
                      onChange={(e) => handleChange('behavioral_concerns', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Behavioral Strengths</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.behavioral_strengths}
                      onChange={(e) => handleChange('behavioral_strengths', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Receiving Counseling Services"
                      checked={formData.counseling_services}
                      onChange={(e) => handleChange('counseling_services', e.target.checked)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Counseling Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.counseling_notes}
                      onChange={(e) => handleChange('counseling_notes', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Notes Tab */}
            <Tab eventKey="notes" title={<><FaUser className="me-1" />Notes</>}>
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Photo URL</Form.Label>
                    <Form.Control
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => handleChange('photo_url', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Additional Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}

export default StudentProfile;

