import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Nav, Badge, Modal, Form
} from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate, FaUserPlus,
  FaBell, FaChartLine, FaCalendarAlt, FaSchool, FaClipboardList,
  FaCamera, FaMapMarkerAlt, FaEdit, FaPhone, FaEnvelope, FaGlobe, FaUserTie
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import { INSTITUTION_TYPE_LABELS } from '../../constants/roles';
import InstitutionScopedFormManagement from './InstitutionScopedFormManagement';
import InstitutionScopedClassManagement from './InstitutionScopedClassManagement';
import InstitutionScopedSubjectManagement from './InstitutionScopedSubjectManagement';
import InstitutionScopedStudentManagement from './InstitutionScopedStudentManagement';
import InstitutionScopedInstructorManagement from './InstitutionScopedInstructorManagement';
import InstitutionScopedReports from './InstitutionScopedReports';
import './SchoolAdminDashboard.css';

function SchoolAdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // State to store dashboard statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalForms: 0,
    totalClasses: 0,
    recentActivity: []
  });

  // Institution data
  const [institution, setInstitution] = useState(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  const editLogoInputRef = useRef(null);

  // Edit institution modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Determine active tab from route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path.includes('/forms')) return 'forms';
    if (path.includes('/classes')) return 'classes';
    if (path.includes('/subjects')) return 'subjects';
    if (path.includes('/students')) return 'students';
    if (path.includes('/instructors')) return 'instructors';
    if (path.includes('/reports')) return 'reports';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]);

  // Function to fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.institution_id) {
        setError('No institution assigned. Please contact a system administrator.');
        setIsLoading(false);
        return;
      }

      // Load institution details
      const institutionData = await supabaseService.getInstitutionById(user.institution_id);
      setInstitution(institutionData);

      // Fetch institution-scoped stats
      const [students, instructors, classes, forms, subjects] = await Promise.all([
        supabaseService.getUsersByInstitution(user.institution_id, 'STUDENT'),
        supabaseService.getUsersByInstitution(user.institution_id, 'INSTRUCTOR'),
        supabaseService.getClassesByInstitution(user.institution_id),
        supabaseService.getFormsByInstitution(user.institution_id),
        supabaseService.getSubjectsByInstitution(user.institution_id)
      ]);

      setStats({
        totalUsers: (students?.length || 0) + (instructors?.length || 0),
        totalSubjects: subjects?.length || 0,
        totalInstructors: instructors?.length || 0,
        totalStudents: students?.length || 0,
        totalForms: forms?.length || 0,
        totalClasses: classes?.length || 0,
        recentActivity: []
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchDashboardStats();
    }
  }, [user, isAuthenticated]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    setError(null);
    try {
      const instId = user.institution_id;
      const ext = file.name.split('.').pop();
      const filePath = `institutions/logos/${instId}.${ext}`;

      await supabase.storage.from('lms-files').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl + '?t=' + Date.now();

      await supabaseService.updateInstitution(instId, { logo_url: logoUrl });

      setInstitution(prev => ({ ...prev, logo_url: logoUrl, logoUrl }));
    } catch (err) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      name: institution?.name || '',
      location: institution?.location || '',
      address: institution?.address || '',
      contact: institution?.contact || '',
      phone: institution?.phone || '',
      website: institution?.website || '',
      principal: institution?.principal || '',
      logo_url: institution?.logo_url || institution?.logoUrl || ''
    });
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setEditError('Logo must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    setEditError('');
    try {
      const instId = user.institution_id;
      const ext = file.name.split('.').pop();
      const filePath = `institutions/logos/${instId}.${ext}`;

      await supabase.storage.from('lms-files').remove([filePath]);
      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);
      const logoUrl = urlData.publicUrl + '?t=' + Date.now();
      setEditFormData(prev => ({ ...prev, logo_url: logoUrl }));
    } catch (err) {
      setEditError(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    setEditSuccess('');
    try {
      await supabaseService.updateInstitution(user.institution_id, editFormData);
      setInstitution(prev => ({ ...prev, ...editFormData }));
      setEditSuccess('Institution profile updated successfully');
      setTimeout(() => setShowEditModal(false), 1200);
    } catch (err) {
      setEditError(err.message || 'Failed to update institution');
    } finally {
      setSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user?.institution_id) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <h5>No Institution Assigned</h5>
          <p>You don't have an institution assigned. Please contact a system administrator to assign you to an institution.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="school-admin-dashboard">
      {/* Hero Header */}
      <div className="dashboard-hero fade-in">
        <div className="dashboard-hero-content">
          <h1>Welcome back, {user?.name || user?.email || 'School Admin'}</h1>
          <p>Managing: <strong>{institution?.name || 'Your Institution'}</strong></p>
        </div>
      </div>

      <Container className="px-4">
        {/* Navigation tabs */}
        <Nav variant="tabs" className="nav-tabs mb-4" activeKey={activeTab} onSelect={setActiveTab}>
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="forms">Forms</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="classes">Classes</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="subjects">Subjects</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="students">Students</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="instructors">Instructors</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="reports">Reports</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Dashboard content based on active tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            {/* Stats Cards */}
            <div className="grid-responsive mb-5 slide-up">
              <Card className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaUsers />
                </div>
                <div className="stat-card-title">Total Students</div>
                <div className="stat-value-large">{stats.totalStudents}</div>
              </Card>
              <Card className="stat-card-modern secondary">
                <div className="stat-icon-circle" style={{ background: 'var(--secondary-gradient)' }}>
                  <FaChalkboardTeacher />
                </div>
                <div className="stat-card-title">Instructors</div>
                <div className="stat-value-large">{stats.totalInstructors}</div>
              </Card>
              <Card className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaBook />
                </div>
                <div className="stat-card-title">Total Subjects</div>
                <div className="stat-value-large">{stats.totalSubjects}</div>
              </Card>
              <Card className="stat-card-modern accent">
                <div className="stat-icon-circle" style={{ background: 'var(--accent-gradient)', color: 'var(--skn-black)' }}>
                  <FaUsers />
                </div>
                <div className="stat-card-title">Total Classes</div>
                <div className="stat-value-large">{stats.totalClasses}</div>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid-responsive mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <Card className="stat-card-modern">
                <div className="stat-icon-circle">
                  <FaCalendarAlt />
                </div>
                <div className="stat-card-title">Total Forms</div>
                <div className="stat-value-large">{stats.totalForms}</div>
              </Card>
            </div>

            {/* Quick Access */}
            <div className="mb-5">
              <h4 className="section-title mb-4">Quick Access</h4>
              <div className="quick-access-grid">
                <Link to="/school-admin/forms" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="quick-access-card-title">Manage Forms</div>
                  <div className="quick-access-card-description">
                    Create and manage Forms (year groups) for your institution.
                  </div>
                </Link>
                <Link to="/school-admin/classes" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaUsers />
                  </div>
                  <div className="quick-access-card-title">Manage Classes</div>
                  <div className="quick-access-card-description">
                    Create classes within Forms and assign tutors.
                  </div>
                </Link>
                <Link to="/school-admin/subjects" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'var(--secondary-gradient)' }}>
                    <FaBook />
                  </div>
                  <div className="quick-access-card-title">Manage Subjects</div>
                  <div className="quick-access-card-description">
                    Create subjects and assign to Forms.
                  </div>
                </Link>
                <Link to="/school-admin/students" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'var(--accent-gradient)', color: 'var(--skn-black)' }}>
                    <FaUserGraduate />
                  </div>
                  <div className="quick-access-card-title">Manage Students</div>
                  <div className="quick-access-card-description">
                    View and manage students in your institution.
                  </div>
                </Link>
                <Link to="/school-admin/instructors" className="quick-access-card">
                  <div className="quick-access-card-icon">
                    <FaChalkboardTeacher />
                  </div>
                  <div className="quick-access-card-title">Manage Instructors</div>
                  <div className="quick-access-card-description">
                    View and manage instructors in your institution.
                  </div>
                </Link>
                <Link to="/school-admin/reports" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' }}>
                    <FaChartLine />
                  </div>
                  <div className="quick-access-card-title">Reports</div>
                  <div className="quick-access-card-description">
                    View reports and analytics for your institution.
                  </div>
                </Link>
                <Link to="/school-admin/report-cards" className="quick-access-card">
                  <div className="quick-access-card-icon" style={{ background: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)' }}>
                    <FaClipboardList />
                  </div>
                  <div className="quick-access-card-title">Report Cards</div>
                  <div className="quick-access-card-description">
                    Generate and manage student report cards.
                  </div>
                </Link>
              </div>
            </div>

            {/* Institution Profile */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">
                    <FaSchool className="me-2" />
                    Institution Profile
                  </h5>
                  <Button variant="outline-primary" size="sm" onClick={openEditModal}>
                    <FaEdit className="me-1" /> Edit Profile
                  </Button>
                </div>
                <Row>
                  <Col md={3} className="text-center mb-3 mb-md-0">
                    <div className="position-relative d-inline-block">
                      {(institution?.logo_url || institution?.logoUrl) ? (
                        <img
                          src={institution.logo_url || institution.logoUrl}
                          alt="School Logo"
                          style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 8, border: '2px solid #dee2e6' }}
                        />
                      ) : (
                        <div style={{
                          width: 100, height: 100, borderRadius: 8, border: '2px dashed #dee2e6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa'
                        }}>
                          <FaSchool size={32} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <Badge bg="primary" className="mt-2">
                      {INSTITUTION_TYPE_LABELS[institution?.institution_type || institution?.institutionType] || 'Secondary School'}
                    </Badge>
                  </Col>
                  <Col md={4}>
                    <p className="mb-2"><strong>Name:</strong> {institution?.name || 'N/A'}</p>
                    {institution?.principal && (
                      <p className="mb-2"><FaUserTie className="me-1 text-muted" /> <strong>Principal:</strong> {institution.principal}</p>
                    )}
                    <p className="mb-2"><FaMapMarkerAlt className="me-1 text-muted" /> <strong>Location:</strong> {institution?.location || 'N/A'}</p>
                    {institution?.address && (
                      <p className="mb-2"><strong>Address:</strong> {institution.address}</p>
                    )}
                  </Col>
                  <Col md={5}>
                    {institution?.contact && (
                      <p className="mb-2"><FaEnvelope className="me-1 text-muted" /> <strong>Email:</strong> {institution.contact}</p>
                    )}
                    <p className="mb-2"><FaPhone className="me-1 text-muted" /> <strong>Phone:</strong> {institution?.phone || 'N/A'}</p>
                    {institution?.website && (
                      <p className="mb-2"><FaGlobe className="me-1 text-muted" /> <strong>Website:</strong> <a href={institution.website} target="_blank" rel="noopener noreferrer">{institution.website}</a></p>
                    )}
                    {institution?.established_year && (
                      <p className="mb-2"><strong>Established:</strong> {institution.established_year}</p>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'forms' && (
          <InstitutionScopedFormManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'classes' && (
          <InstitutionScopedClassManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'subjects' && (
          <InstitutionScopedSubjectManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'students' && (
          <InstitutionScopedStudentManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'instructors' && (
          <InstitutionScopedInstructorManagement institutionId={user.institution_id} />
        )}

        {activeTab === 'reports' && (
          <InstitutionScopedReports institutionId={user.institution_id} />
        )}
      </Container>

      {/* Edit Institution Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Institution Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editError && <Alert variant="danger" dismissible onClose={() => setEditError('')}>{editError}</Alert>}
            {editSuccess && <Alert variant="success">{editSuccess}</Alert>}

            {/* Logo Upload */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                {editFormData.logo_url ? (
                  <img
                    src={editFormData.logo_url}
                    alt="School Logo"
                    style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12, border: '2px solid #dee2e6' }}
                  />
                ) : (
                  <div style={{
                    width: 120, height: 120, borderRadius: 12, border: '2px dashed #dee2e6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa'
                  }}>
                    <FaSchool size={40} className="text-muted" />
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input type="file" ref={editLogoInputRef} onChange={handleEditLogoUpload} accept="image/*" style={{ display: 'none' }} />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => editLogoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <><Spinner size="sm" className="me-1" /> Uploading...</>
                  ) : (
                    <><FaCamera className="me-1" /> {editFormData.logo_url ? 'Change Logo' : 'Upload Logo'}</>
                  )}
                </Button>
              </div>
            </div>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>School Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={editFormData.name || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FaUserTie className="me-1" /> Principal / Head</Form.Label>
                  <Form.Control
                    type="text"
                    name="principal"
                    value={editFormData.principal || ''}
                    onChange={handleEditInputChange}
                    placeholder="Name of principal or head of school"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FaPhone className="me-1" /> Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. +1 (869) 465-1234"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FaEnvelope className="me-1" /> Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="contact"
                    value={editFormData.contact || ''}
                    onChange={handleEditInputChange}
                    placeholder="school@example.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FaMapMarkerAlt className="me-1" /> Location (City/Parish)</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={editFormData.location || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Basseterre, St. Kitts"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FaGlobe className="me-1" /> Website</Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={editFormData.website || ''}
                    onChange={handleEditInputChange}
                    placeholder="https://www.school.edu"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Full Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={editFormData.address || ''}
                onChange={handleEditInputChange}
                placeholder="Street address, parish, country..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={savingEdit}>
              {savingEdit ? <><Spinner size="sm" className="me-1" /> Saving...</> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default SchoolAdminDashboard;

