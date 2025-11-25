import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert
} from 'react-bootstrap';
import {
  FaVideo, FaPlus, FaUsers, FaDoorOpen, FaComments
} from 'react-icons/fa';
import collaborationService from '../../services/collaborationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function VirtualClassrooms({ classSubjectId, sessions }) {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recording_enabled: false,
    breakout_rooms_enabled: false
  });

  useEffect(() => {
    loadClassrooms();
  }, [sessions]);

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const rooms = [];
      for (const session of sessions) {
        try {
          const classroom = await collaborationService.getVirtualClassroom(session.session_id);
          if (classroom) {
            rooms.push({ ...classroom, session });
          }
        } catch (error) {
          // Classroom might not exist yet
        }
      }
      setClassrooms(rooms);
    } catch (error) {
      console.error('Error loading classrooms:', error);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      // Create session first
      const session = await collaborationService.createSession({
        session_type: 'CLASSROOM',
        title: formData.title,
        description: formData.description,
        class_subject_id: classSubjectId,
        created_by: user?.user_id
      });

      // Generate Jitsi meeting URL (or use your video provider)
      const meetingId = `launchpad-${session.session_id}-${Date.now()}`;
      const meetingUrl = `https://meet.jit.si/${meetingId}`;

      // Create virtual classroom
      await collaborationService.createVirtualClassroom({
        session_id: session.session_id,
        meeting_url: meetingUrl,
        meeting_id: meetingId,
        recording_enabled: formData.recording_enabled,
        breakout_rooms_enabled: formData.breakout_rooms_enabled
      });

      await loadClassrooms();
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        recording_enabled: false,
        breakout_rooms_enabled: false
      });
      alert('Virtual classroom created successfully!');
    } catch (error) {
      console.error('Error creating classroom:', error);
      alert('Failed to create classroom. Some tables may not exist yet.');
    }
  };

  const handleJoinClassroom = (classroom) => {
    // Open Jitsi meeting in new window
    window.open(classroom.meeting_url, '_blank', 'width=1200,height=800');
    
    // Join the session
    collaborationService.joinSession(classroom.session_id, user?.user_id);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Virtual Classrooms</h5>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-1" />
            New Classroom
          </Button>
        </Card.Header>
        <Card.Body>
          {classrooms.length === 0 ? (
            <Alert variant="info">No virtual classrooms yet. Create one to start a video session!</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Features</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map((classroom) => (
                  <tr key={classroom.classroom_id}>
                    <td>{classroom.session?.title || 'Untitled'}</td>
                    <td>
                      {classroom.is_live ? (
                        <Badge bg="danger">Live</Badge>
                      ) : (
                        <Badge bg="secondary">Scheduled</Badge>
                      )}
                    </td>
                    <td>
                      {classroom.recording_enabled && (
                        <Badge bg="info" className="me-1">Recording</Badge>
                      )}
                      {classroom.breakout_rooms_enabled && (
                        <Badge bg="success" className="me-1">Breakout Rooms</Badge>
                      )}
                      {classroom.chat_enabled && (
                        <Badge bg="primary" className="me-1">Chat</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleJoinClassroom(classroom)}
                      >
                        <FaDoorOpen className="me-1" />
                        Join
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Classroom Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Virtual Classroom</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateClassroom}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Recording"
                checked={formData.recording_enabled}
                onChange={(e) => setFormData({ ...formData, recording_enabled: e.target.checked })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Breakout Rooms"
                checked={formData.breakout_rooms_enabled}
                onChange={(e) => setFormData({ ...formData, breakout_rooms_enabled: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Classroom
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default VirtualClassrooms;

