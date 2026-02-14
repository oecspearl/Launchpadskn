import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert
} from 'react-bootstrap';
import {
  FaPaintBrush, FaPlus, FaEdit, FaUsers
} from 'react-icons/fa';
import collaborationService from '../../services/collaborationService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';

function WhiteboardCollaboration({ classSubjectId, sessions }) {
  const { user } = useAuth();
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedWhiteboard, setSelectedWhiteboard] = useState(null);
  const [formData, setFormData] = useState({
    title: ''
  });

  useEffect(() => {
    loadWhiteboards();
  }, [sessions]);

  const loadWhiteboards = async () => {
    setLoading(true);
    try {
      const boards = [];
      for (const session of sessions) {
        try {
          const whiteboard = await collaborationService.getWhiteboard(session.session_id);
          if (whiteboard) {
            boards.push({ ...whiteboard, session });
          }
        } catch (error) {
          // Whiteboard might not exist yet
        }
      }
      setWhiteboards(boards);
    } catch (error) {
      console.error('Error loading whiteboards:', error);
      setWhiteboards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWhiteboard = async (e) => {
    e.preventDefault();
    try {
      // Create session first
      const session = await collaborationService.createSession({
        session_type: 'WHITEBOARD',
        title: formData.title,
        class_subject_id: classSubjectId,
        created_by: user?.user_id
      });

      // Create whiteboard
      await collaborationService.createWhiteboard({
        session_id: session.session_id,
        title: formData.title,
        canvas_data: { elements: [] }
      });

      await loadWhiteboards();
      setShowCreateModal(false);
      setFormData({ title: '' });
      alert('Whiteboard created successfully!');
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      alert('Failed to create whiteboard. Some tables may not exist yet.');
    }
  };

  const handleOpenWhiteboard = async (whiteboard) => {
    setSelectedWhiteboard(whiteboard);
    setShowEditorModal(true);
    await collaborationService.joinSession(whiteboard.session_id, user?.user_id);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Collaborative Whiteboards</h5>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-1" />
            New Whiteboard
          </Button>
        </Card.Header>
        <Card.Body>
          {whiteboards.length === 0 ? (
            <Alert variant="info">No whiteboards yet. Create one to start drawing together!</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Last Edited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {whiteboards.map((whiteboard) => (
                  <tr key={whiteboard.whiteboard_id}>
                    <td>{whiteboard.title}</td>
                    <td>
                      {whiteboard.last_edited_at 
                        ? new Date(whiteboard.last_edited_at).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenWhiteboard(whiteboard)}
                      >
                        <FaEdit className="me-1" />
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Whiteboard Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Whiteboard</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateWhiteboard}>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Whiteboard
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Whiteboard Editor Modal */}
      <Modal
        show={showEditorModal}
        onHide={() => {
          setShowEditorModal(false);
          setSelectedWhiteboard(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPaintBrush className="me-2" />
            {selectedWhiteboard?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="whiteboard-container" style={{
            width: '100%',
            height: '600px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            position: 'relative'
          }}>
            <div className="text-center p-5">
              <FaPaintBrush size={64} className="text-muted mb-3" />
              <h5>Whiteboard Canvas</h5>
              <p className="text-muted">
                Whiteboard functionality can be integrated with libraries like Fabric.js, Konva.js, or Excalidraw
              </p>
              <p className="text-muted small">
                Real-time collaboration will sync drawing actions across all participants
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditorModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default WhiteboardCollaboration;

