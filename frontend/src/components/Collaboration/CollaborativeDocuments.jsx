import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert,
  InputGroup
} from 'react-bootstrap';
import {
  FaFileAlt, FaPlus, FaEdit, FaUsers, FaClock, FaSearch
} from 'react-icons/fa';
import collaborationService from '../../services/collaborationService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';

function CollaborativeDocuments({ classSubjectId, sessions }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState('');
  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'TEXT'
  });

  useEffect(() => {
    loadDocuments();
  }, [sessions]);

  useEffect(() => {
    if (selectedDocument) {
      setupRealtimeSubscription();
      return () => {
        // Cleanup subscription
      };
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Load documents from sessions
      const docs = [];
      for (const session of sessions) {
        try {
          const { data } = await supabase
            .from('collaborative_documents')
            .select('*')
            .eq('session_id', session.session_id);
          
          if (data && data.length > 0) {
            docs.push(...data.map(doc => ({ ...doc, session })));
          }
        } catch (error) {
          console.error('Error loading document for session:', error);
        }
      }
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!selectedDocument) return;

    // Subscribe to document changes
    const channel = supabase
      .channel(`document:${selectedDocument.document_id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'collaborative_documents',
        filter: `document_id=eq.${selectedDocument.document_id}`
      }, (payload) => {
        setDocumentContent(payload.new.content || '');
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'document_changes',
        filter: `document_id=eq.${selectedDocument.document_id}`
      }, (payload) => {
        // Handle real-time changes
        console.log('Document change received:', payload);
      })
      .subscribe();

    // Load participants
    loadParticipants(selectedDocument.session_id);
  };

  const loadParticipants = async (sessionId) => {
    try {
      const data = await collaborationService.getSessionParticipants(sessionId);
      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    try {
      // First create session if needed
      let sessionId = sessions[0]?.session_id;
      if (!sessionId) {
        const session = await collaborationService.createSession({
          session_type: 'DOCUMENT',
          title: formData.title,
          class_subject_id: classSubjectId,
          created_by: user?.user_id
        });
        sessionId = session.session_id;
      }

      const doc = await collaborationService.createDocument({
        session_id: sessionId,
        title: formData.title,
        content: formData.content,
        content_type: formData.content_type
      });

      await loadDocuments();
      setShowCreateModal(false);
      setFormData({ title: '', content: '', content_type: 'TEXT' });
      alert('Document created successfully!');
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Some tables may not exist yet.');
    }
  };

  const handleOpenEditor = async (document) => {
    setSelectedDocument(document);
    setDocumentContent(document.content || '');
    setShowEditorModal(true);
    await collaborationService.joinSession(document.session_id, user?.user_id);
  };

  const handleSaveDocument = async () => {
    if (!selectedDocument) return;

    try {
      await collaborationService.updateDocument(selectedDocument.document_id, {
        content: documentContent,
        last_edited_by: user?.user_id
      });
      alert('Document saved!');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Collaborative Documents</h5>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-1" />
            New Document
          </Button>
        </Card.Header>
        <Card.Body>
          {documents.length === 0 ? (
            <Alert variant="info">No collaborative documents yet. Create one to get started!</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Participants</th>
                  <th>Last Edited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.document_id}>
                    <td>{doc.title}</td>
                    <td>
                      <Badge bg="info">{doc.content_type}</Badge>
                    </td>
                    <td>
                      <FaUsers className="me-1" />
                      {doc.session?.participant_count || 0}
                    </td>
                    <td>
                      {doc.last_edited_at 
                        ? new Date(doc.last_edited_at).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenEditor(doc)}
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

      {/* Create Document Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Collaborative Document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDocument}>
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
              <Form.Label>Content Type</Form.Label>
              <Form.Select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              >
                <option value="TEXT">Plain Text</option>
                <option value="RICH_TEXT">Rich Text</option>
                <option value="MARKDOWN">Markdown</option>
                <option value="CODE">Code</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Initial Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Document
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Document Editor Modal */}
      <Modal
        show={showEditorModal}
        onHide={() => {
          setShowEditorModal(false);
          setSelectedDocument(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileAlt className="me-2" />
            {selectedDocument?.title}
            <Badge bg="success" className="ms-2">
              <FaUsers className="me-1" />
              {participants.length} online
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Form.Control
              as="textarea"
              rows={15}
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Start typing... Changes are saved automatically"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div className="text-muted small">
            <FaClock className="me-1" />
            Real-time collaboration enabled. Other users' changes will appear automatically.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditorModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveDocument}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CollaborativeDocuments;

