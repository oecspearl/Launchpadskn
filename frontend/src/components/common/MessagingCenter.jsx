import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, ListGroup, Badge, Button,
  Modal, Form, Spinner, Alert
} from 'react-bootstrap';
import { FaEnvelope, FaPlus, FaUser, FaChild, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { messageService } from '../../services/messageService';
import { supabase } from '../../config/supabase';
import ConversationView from './ConversationView';
import Breadcrumb from './Breadcrumb';

function MessagingCenter() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New conversation state
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvStep, setNewConvStep] = useState(1);
  const [students, setStudents] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  const isTeacher = user?.role?.toUpperCase() === 'INSTRUCTOR';
  const isParent = user?.role?.toUpperCase() === 'PARENT';

  const breadcrumbItems = [
    { label: 'Dashboard', path: isTeacher ? '/teacher/dashboard' : isParent ? '/parent/dashboard' : '/admin/dashboard', type: 'dashboard' },
    { label: 'Messages', type: 'messages' }
  ];

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations(user?.user_id);
      setConversations(data);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (user?.user_id) fetchConversations();
  }, [user?.user_id, fetchConversations]);

  // Load students when opening new conversation
  const handleNewConversation = async () => {
    setShowNewConv(true);
    setNewConvStep(1);
    setSelectedStudent(null);
    setSelectedRecipient(null);
    setNewSubject('');
    setFirstMessage('');

    setStudentsLoading(true);
    try {
      if (isTeacher) {
        const data = await messageService.getTeacherStudents(user?.user_id);
        setStudents(data);
      } else if (isParent) {
        // Parent sees their children
        const { data: links } = await supabase
          .from('parent_student_links')
          .select('student:users!parent_student_links_student_id_fkey(user_id, name, email)')
          .eq('parent_id', user?.user_id)
          .eq('is_active', true);
        setStudents((links || []).map(l => l.student).filter(Boolean));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Load recipients (parents for teacher, teachers for parent) when student selected
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setNewConvStep(2);
    setRecipientsLoading(true);

    try {
      if (isTeacher) {
        const parents = await messageService.getStudentParents(student.user_id);
        setRecipients(parents);
      } else if (isParent) {
        const teachers = await messageService.getStudentTeachers(student.user_id);
        setRecipients(teachers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedStudent || !selectedRecipient || !newSubject.trim()) return;

    try {
      setCreating(true);
      const conversation = await messageService.createConversation(
        user?.institution_id,
        selectedStudent.user_id,
        newSubject.trim(),
        [selectedRecipient.user_id],
        user?.user_id
      );

      // Send first message if provided
      if (firstMessage.trim()) {
        await messageService.sendMessage(
          conversation.conversation_id,
          user?.user_id,
          firstMessage.trim()
        );
      }

      setShowNewConv(false);
      await fetchConversations();

      // Select the new conversation
      const updated = await messageService.getConversations(user?.user_id);
      const newConv = updated.find(c => c.conversation_id === conversation.conversation_id);
      if (newConv) setSelectedConv(newConv);
    } catch (err) {
      setError('Failed to create conversation');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
    // Update unread count locally
    setConversations(prev =>
      prev.map(c =>
        c.conversation_id === conv.conversation_id
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  const formatLastTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Container className="py-4">
      <Breadcrumb items={breadcrumbItems} />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaEnvelope className="me-2 text-primary" />
                Messages
              </h2>
              <p className="text-muted mb-0">Direct messaging between teachers and parents</p>
            </div>
            {(isTeacher || isParent) && (
              <Button variant="primary" size="sm" onClick={handleNewConversation}>
                <FaPlus className="me-1" /> New Message
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
        <Row className="g-0 h-100">
          {/* Conversation List */}
          <Col lg={4} className={`border-end h-100 ${selectedConv ? 'd-none d-lg-block' : ''}`}>
            <div className="d-flex flex-column h-100">
              <div className="p-3 border-bottom">
                <h6 className="mb-0 fw-bold">Conversations</h6>
              </div>
              <div className="flex-grow-1 overflow-auto">
                {loading ? (
                  <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FaEnvelope size={36} className="mb-2 opacity-25" />
                    <p className="small">No conversations yet</p>
                    {(isTeacher || isParent) && (
                      <Button variant="outline-primary" size="sm" onClick={handleNewConversation}>
                        Start a conversation
                      </Button>
                    )}
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {conversations.map(conv => {
                      const isSelected = selectedConv?.conversation_id === conv.conversation_id;
                      const otherName = conv.otherParticipants?.[0]?.name || 'Unknown';
                      const lastMsg = conv.lastMessage?.message_text || '';
                      const preview = lastMsg.length > 50 ? lastMsg.substring(0, 50) + '...' : lastMsg;

                      return (
                        <ListGroup.Item
                          key={conv.conversation_id}
                          action
                          active={isSelected}
                          onClick={() => handleSelectConversation(conv)}
                          className="border-0 border-bottom py-3 px-3"
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
                              <div className="d-flex align-items-center gap-2">
                                <strong className="small">{otherName}</strong>
                                {conv.unreadCount > 0 && (
                                  <Badge bg="danger" pill className="small">{conv.unreadCount}</Badge>
                                )}
                              </div>
                              {conv.subject && (
                                <small className={`d-block ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                                  {conv.subject}
                                </small>
                              )}
                              {preview && (
                                <small
                                  className={`d-block text-truncate ${isSelected ? 'text-white-50' : 'text-muted'}`}
                                  style={{ maxWidth: '100%' }}
                                >
                                  {preview}
                                </small>
                              )}
                            </div>
                            <small className={isSelected ? 'text-white-50' : 'text-muted'} style={{ whiteSpace: 'nowrap' }}>
                              {formatLastTime(conv.last_message_at)}
                            </small>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                )}
              </div>
            </div>
          </Col>

          {/* Conversation View */}
          <Col lg={8} className={`h-100 ${!selectedConv ? 'd-none d-lg-flex' : 'd-flex'}`}>
            <div className="w-100 h-100">
              <ConversationView
                conversation={selectedConv}
                onBack={() => setSelectedConv(null)}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* New Conversation Modal */}
      <Modal show={showNewConv} onHide={() => setShowNewConv(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            {newConvStep === 1 && 'Select Student'}
            {newConvStep === 2 && `Select ${isTeacher ? 'Parent' : 'Teacher'}`}
            {newConvStep === 3 && 'Compose Message'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Step 1: Select Student */}
          {newConvStep === 1 && (
            studentsLoading ? (
              <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : students.length === 0 ? (
              <p className="text-muted text-center py-3">No students found</p>
            ) : (
              <ListGroup>
                {students.map(s => (
                  <ListGroup.Item
                    key={s.user_id}
                    action
                    onClick={() => handleSelectStudent(s)}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaChild className="text-primary" />
                    <div>
                      <strong>{s.name || s.email}</strong>
                      {s.classes?.length > 0 && (
                        <small className="d-block text-muted">
                          {s.classes.map(c => c.class_name).join(', ')}
                        </small>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )
          )}

          {/* Step 2: Select Recipient */}
          {newConvStep === 2 && (
            recipientsLoading ? (
              <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-muted">
                  No {isTeacher ? 'parents' : 'teachers'} found for this student
                </p>
                <Button variant="outline-secondary" size="sm" onClick={() => setNewConvStep(1)}>
                  Back
                </Button>
              </div>
            ) : (
              <>
                <p className="small text-muted mb-2">
                  Student: <strong>{selectedStudent?.name}</strong>
                </p>
                <ListGroup>
                  {recipients.map(r => (
                    <ListGroup.Item
                      key={r.user_id}
                      action
                      onClick={() => { setSelectedRecipient(r); setNewConvStep(3); }}
                      className="d-flex align-items-center gap-2"
                    >
                      <FaUser className="text-success" />
                      <div>
                        <strong>{r.name || r.email}</strong>
                        {r.subjects?.length > 0 && (
                          <small className="d-block text-muted">
                            {r.subjects.join(', ')}
                          </small>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )
          )}

          {/* Step 3: Compose */}
          {newConvStep === 3 && (
            <>
              <div className="mb-3 small text-muted">
                <p className="mb-1">Student: <strong>{selectedStudent?.name}</strong></p>
                <p className="mb-0">To: <strong>{selectedRecipient?.name}</strong></p>
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Subject</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., Academic Progress Update"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold">Message (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  size="sm"
                  placeholder="Type your message..."
                  value={firstMessage}
                  onChange={e => setFirstMessage(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {newConvStep > 1 && (
            <Button variant="outline-secondary" size="sm" onClick={() => setNewConvStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowNewConv(false)}>
            Cancel
          </Button>
          {newConvStep === 3 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateConversation}
              disabled={!newSubject.trim() || creating}
            >
              {creating ? <Spinner animation="border" size="sm" /> : 'Create Conversation'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MessagingCenter;
