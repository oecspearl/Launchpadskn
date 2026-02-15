import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Alert, Spinner, Badge, Row, Col
} from 'react-bootstrap';
import { FaUserFriends, FaPlus, FaTrash, FaSearch, FaUserPlus } from 'react-icons/fa';
import { parentService } from '../../services/parentService';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function ParentLinkManager({ studentId, student }) {
  const { user: currentUser } = useAuth();
  const [linkedParents, setLinkedParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalMode, setModalMode] = useState('search'); // 'search' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Link form
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [relationship, setRelationship] = useState('PARENT');
  const [isPrimary, setIsPrimary] = useState(false);

  // Create form
  const [newParent, setNewParent] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  useEffect(() => {
    if (studentId) loadLinkedParents();
  }, [studentId]);

  const loadLinkedParents = async () => {
    setLoading(true);
    try {
      const data = await parentService.getParentsByStudent(studentId);
      setLinkedParents(data);
    } catch (err) {
      console.error('Error loading parents:', err);
      setError('Failed to load linked parents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const allParents = await userService.getUsersByRole('PARENT');
      const filtered = (allParents || []).filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Exclude already linked parents
      const linkedIds = new Set(linkedParents.map(lp => lp.parent?.user_id));
      setSearchResults(filtered.filter(p => !linkedIds.has(p.user_id)));
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search parents');
    } finally {
      setSearching(false);
    }
  };

  const handleLinkExisting = async () => {
    if (!selectedParentId) return;
    setSaving(true);
    setError('');
    try {
      const adminId = currentUser?.user_id || currentUser?.userId;
      await parentService.linkParentToStudent(
        selectedParentId, studentId, relationship, isPrimary, adminId
      );
      setSuccess('Parent linked successfully!');
      setShowLinkModal(false);
      resetModal();
      loadLinkedParents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Link error:', err);
      setError(err.message || 'Failed to link parent');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndLink = async () => {
    if (!newParent.email || !newParent.password) {
      setError('Email and password are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Create the parent account
      const createdUser = await userService.createUser({
        email: newParent.email,
        password: newParent.password,
        role: 'PARENT',
        institution_id: currentUser?.institution_id
      });

      // Update name and phone if provided
      if (newParent.name || newParent.phone) {
        await userService.updateUserProfile(createdUser.id, {
          name: newParent.name || newParent.email.split('@')[0],
          phone: newParent.phone || null
        });
      }

      // Get numeric user_id for the link
      const profile = await userService.getUserProfile(createdUser.id);
      const parentUserId = profile.user_id;

      // Link to student
      const adminId = currentUser?.user_id || currentUser?.userId;
      await parentService.linkParentToStudent(
        parentUserId, studentId, relationship, isPrimary, adminId
      );

      setSuccess('Parent account created and linked successfully!');
      setShowLinkModal(false);
      resetModal();
      loadLinkedParents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Create & link error:', err);
      setError(err.message || 'Failed to create parent account');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Are you sure you want to unlink this parent?')) return;
    try {
      await parentService.unlinkParentFromStudent(linkId);
      setSuccess('Parent unlinked successfully');
      loadLinkedParents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Unlink error:', err);
      setError(err.message || 'Failed to unlink parent');
    }
  };

  const resetModal = () => {
    setModalMode('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedParentId(null);
    setRelationship('PARENT');
    setIsPrimary(false);
    setNewParent({ name: '', email: '', password: '', phone: '' });
    setError('');
  };

  const openModal = () => {
    resetModal();
    setShowLinkModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="mt-2">Loading parent links...</p>
      </div>
    );
  }

  return (
    <div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <FaUserFriends className="me-2" />
          Linked Parents/Guardians
        </h5>
        <Button variant="primary" size="sm" onClick={openModal}>
          <FaPlus className="me-1" /> Link Parent
        </Button>
      </div>

      {linkedParents.length === 0 ? (
        <Card className="text-center py-4 border">
          <Card.Body>
            <FaUserFriends size={40} className="text-muted mb-3" />
            <p className="text-muted mb-0">No parents/guardians linked to this student yet.</p>
          </Card.Body>
        </Card>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Relationship</th>
              <th>Primary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {linkedParents.map(link => (
              <tr key={link.link_id}>
                <td>{link.parent?.name || '-'}</td>
                <td>{link.parent?.email || '-'}</td>
                <td>{link.parent?.phone || '-'}</td>
                <td><Badge bg="outline-primary" className="border">{link.relationship}</Badge></td>
                <td>
                  {link.is_primary_contact && (
                    <Badge bg="success">Primary</Badge>
                  )}
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleUnlink(link.link_id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Link Parent Modal */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'search' ? 'Link Existing Parent' : 'Create New Parent Account'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          {/* Mode Toggle */}
          <div className="d-flex gap-2 mb-3">
            <Button
              variant={modalMode === 'search' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setModalMode('search')}
            >
              <FaSearch className="me-1" /> Find Existing
            </Button>
            <Button
              variant={modalMode === 'create' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setModalMode('create')}
            >
              <FaUserPlus className="me-1" /> Create New
            </Button>
          </div>

          {modalMode === 'search' ? (
            <>
              {/* Search for existing parent */}
              <div className="d-flex gap-2 mb-3">
                <Form.Control
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline-primary" onClick={handleSearch} disabled={searching}>
                  {searching ? <Spinner size="sm" /> : <FaSearch />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <Table responsive hover size="sm" className="mb-3">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map(p => (
                      <tr
                        key={p.user_id}
                        className={selectedParentId === p.user_id ? 'table-primary' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedParentId(p.user_id)}
                      >
                        <td>
                          <Form.Check
                            type="radio"
                            checked={selectedParentId === p.user_id}
                            onChange={() => setSelectedParentId(p.user_id)}
                          />
                        </td>
                        <td>{p.name || '-'}</td>
                        <td>{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {searchResults.length === 0 && searchTerm && !searching && (
                <p className="text-muted small">
                  No parent accounts found. Try a different search or create a new account.
                </p>
              )}
            </>
          ) : (
            <>
              {/* Create new parent form */}
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      value={newParent.name}
                      onChange={(e) => setNewParent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Parent's full name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      value={newParent.email}
                      onChange={(e) => setNewParent(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="parent@example.com"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Password *</Form.Label>
                    <Form.Control
                      type="password"
                      value={newParent.password}
                      onChange={(e) => setNewParent(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Temporary password"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      value={newParent.phone}
                      onChange={(e) => setNewParent(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}

          <hr />

          {/* Common fields */}
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Relationship</Form.Label>
                <Form.Select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="PARENT">Parent</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="GRANDPARENT">Grandparent</option>
                  <option value="OTHER">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mt-4">
                <Form.Check
                  type="checkbox"
                  label="Primary Contact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>Cancel</Button>
          {modalMode === 'search' ? (
            <Button
              variant="primary"
              onClick={handleLinkExisting}
              disabled={!selectedParentId || saving}
            >
              {saving ? <><Spinner size="sm" className="me-1" /> Linking...</> : 'Link Parent'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreateAndLink}
              disabled={!newParent.email || !newParent.password || saving}
            >
              {saving ? <><Spinner size="sm" className="me-1" /> Creating...</> : 'Create & Link'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ParentLinkManager;
