import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Tabs, Tab, Button, Spinner, Alert,
  Badge, Modal, Form
} from 'react-bootstrap';
import {
  FaFileAlt, FaVideo, FaPaintBrush, FaUserFriends, FaProjectDiagram,
  FaPlus, FaUsers, FaClock
} from 'react-icons/fa';
import collaborationService from '../../services/collaborationService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import CollaborativeDocuments from './CollaborativeDocuments';
import VirtualClassrooms from './VirtualClassrooms';
import WhiteboardCollaboration from './WhiteboardCollaboration';
import PeerToPeerLearning from './PeerToPeerLearning';
import GroupProjectManagement from './GroupProjectManagement';
import './CollaborationHub.css';

function CollaborationHub({ classSubjectId, classSubject }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [sessions, setSessions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    session_type: 'DOCUMENT',
    title: '',
    description: '',
    is_public: false
  });

  useEffect(() => {
    if (classSubjectId) {
      loadSessions();
    }
  }, [classSubjectId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await collaborationService.getActiveSessions(classSubjectId);
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const sessionData = {
        ...createFormData,
        class_subject_id: classSubjectId,
        created_by: user?.user_id,
        is_active: true
      };
      
      const session = await collaborationService.createSession(sessionData);
      await loadSessions();
      setShowCreateModal(false);
      setCreateFormData({
        session_type: 'DOCUMENT',
        title: '',
        description: '',
        is_public: false
      });
      alert('Collaboration session created successfully!');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Some tables may not exist yet.');
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-3">Loading collaboration hub...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="collaboration-hub py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Collaboration Hub</h3>
              {classSubject && (
                <p className="text-muted mb-0">
                  {classSubject.subject?.subject_name} - {classSubject.class?.class_name}
                </p>
              )}
            </div>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <FaPlus className="me-2" />
              New Session
            </Button>
          </div>
        </Col>
      </Row>

      {/* Active Sessions Summary */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Active Sessions</h6>
                  <h3>{sessions.length}</h3>
                </div>
                <FaUsers className="text-primary" style={{ fontSize: '2rem' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Documents</h6>
                  <h3>{sessions.filter(s => s.session_type === 'DOCUMENT').length}</h3>
                </div>
                <FaFileAlt className="text-info" style={{ fontSize: '2rem' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Classrooms</h6>
                  <h3>{sessions.filter(s => s.session_type === 'CLASSROOM').length}</h3>
                </div>
                <FaVideo className="text-success" style={{ fontSize: '2rem' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Projects</h6>
                  <h3>{sessions.filter(s => s.session_type === 'PROJECT').length}</h3>
                </div>
                <FaProjectDiagram className="text-warning" style={{ fontSize: '2rem' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="documents" title={
          <>
            <FaFileAlt className="me-1" />
            Documents
          </>
        }>
          <CollaborativeDocuments
            classSubjectId={classSubjectId}
            sessions={sessions.filter(s => s.session_type === 'DOCUMENT')}
          />
        </Tab>

        <Tab eventKey="classrooms" title={
          <>
            <FaVideo className="me-1" />
            Virtual Classrooms
          </>
        }>
          <VirtualClassrooms
            classSubjectId={classSubjectId}
            sessions={sessions.filter(s => s.session_type === 'CLASSROOM')}
          />
        </Tab>

        <Tab eventKey="whiteboards" title={
          <>
            <FaPaintBrush className="me-1" />
            Whiteboards
          </>
        }>
          <WhiteboardCollaboration
            classSubjectId={classSubjectId}
            sessions={sessions.filter(s => s.session_type === 'WHITEBOARD')}
          />
        </Tab>

        <Tab eventKey="tutoring" title={
          <>
            <FaUserFriends className="me-1" />
            Peer Learning
          </>
        }>
          <PeerToPeerLearning
            classSubjectId={classSubjectId}
          />
        </Tab>

        <Tab eventKey="projects" title={
          <>
            <FaProjectDiagram className="me-1" />
            Group Projects
          </>
        }>
          <GroupProjectManagement
            classSubjectId={classSubjectId}
            sessions={sessions.filter(s => s.session_type === 'PROJECT')}
          />
        </Tab>
      </Tabs>

      {/* Create Session Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Collaboration Session</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSession}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Session Type *</Form.Label>
              <Form.Select
                value={createFormData.session_type}
                onChange={(e) => setCreateFormData({ ...createFormData, session_type: e.target.value })}
                required
              >
                <option value="DOCUMENT">Collaborative Document</option>
                <option value="CLASSROOM">Virtual Classroom</option>
                <option value="WHITEBOARD">Whiteboard</option>
                <option value="PROJECT">Group Project</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={createFormData.title}
                onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Public Session (visible to all students)"
                checked={createFormData.is_public}
                onChange={(e) => setCreateFormData({ ...createFormData, is_public: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Session
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default CollaborationHub;

