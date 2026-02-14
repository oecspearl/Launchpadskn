import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert, Row, Col
} from 'react-bootstrap';
import {
  FaUserFriends, FaPlus, FaStar, FaClock, FaCalendarAlt
} from 'react-icons/fa';
import collaborationService from '../../services/collaborationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function PeerToPeerLearning({ classSubjectId }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    topic: '',
    session_type: 'TUTORING',
    scheduled_start: '',
    learning_objectives: ''
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await collaborationService.getTutoringSessions(null, null, null);
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading tutoring sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      // Create collaboration session
      const session = await collaborationService.createSession({
        session_type: 'TUTORING',
        title: `Tutoring: ${formData.topic}`,
        class_subject_id: classSubjectId,
        created_by: user?.user_id
      });

      // Create tutoring session
      await collaborationService.createTutoringSession({
        session_id: session.session_id,
        tutor_id: user?.user_id,
        student_id: parseInt(formData.student_id),
        topic: formData.topic,
        session_type: formData.session_type,
        scheduled_start: formData.scheduled_start,
        learning_objectives: formData.learning_objectives,
        status: 'SCHEDULED'
      });

      await loadSessions();
      setShowCreateModal(false);
      setFormData({
        student_id: '',
        topic: '',
        session_type: 'TUTORING',
        scheduled_start: '',
        learning_objectives: ''
      });
      alert('Tutoring session created successfully!');
    } catch (error) {
      console.error('Error creating tutoring session:', error);
      alert('Failed to create session. Some tables may not exist yet.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'SCHEDULED': 'info',
      'IN_PROGRESS': 'warning',
      'COMPLETED': 'success',
      'CANCELLED': 'danger'
    };
    return badges[status] || 'secondary';
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Peer-to-Peer Learning</h5>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-1" />
            Schedule Session
          </Button>
        </Card.Header>
        <Card.Body>
          {sessions.length === 0 ? (
            <Alert variant="info">No tutoring sessions scheduled yet.</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Student</th>
                  <th>Topic</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th>Ratings</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.tutoring_id}>
                    <td>{session.tutor_name || 'N/A'}</td>
                    <td>{session.student_name || 'N/A'}</td>
                    <td>{session.topic || '-'}</td>
                    <td>
                      {session.scheduled_start 
                        ? new Date(session.scheduled_start).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      <Badge bg={getStatusBadge(session.status)}>
                        {session.status}
                      </Badge>
                    </td>
                    <td>
                      {session.tutor_rating && (
                        <span className="me-2">
                          Tutor: <FaStar className="text-warning" /> {session.tutor_rating}
                        </span>
                      )}
                      {session.student_rating && (
                        <span>
                          Student: <FaStar className="text-warning" /> {session.student_rating}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Session Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Schedule Tutoring Session</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSession}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Student ID *</Form.Label>
              <Form.Control
                type="number"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
                placeholder="Enter student user ID"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Session Type</Form.Label>
              <Form.Select
                value={formData.session_type}
                onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
              >
                <option value="TUTORING">Tutoring</option>
                <option value="MENTORING">Mentoring</option>
                <option value="PEER_STUDY">Peer Study</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Topic *</Form.Label>
              <Form.Control
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Scheduled Start *</Form.Label>
              <Form.Control
                type="datetime-local"
                value={formData.scheduled_start}
                onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Learning Objectives</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.learning_objectives}
                onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Schedule Session
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default PeerToPeerLearning;

