import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { messageService } from '../../services/messageService';

function ConversationView({ conversation, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
  useEffect(() => {
    if (!conversation) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const msgs = await messageService.getMessages(conversation.conversation_id);
        setMessages(msgs);
        // Mark as read
        await messageService.markConversationRead(conversation.conversation_id, user?.user_id);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversation, user?.user_id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = messageService.subscribeToMessages(
      conversation.conversation_id,
      (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.message_id === newMsg.message_id)) return prev;
          return [...prev, newMsg];
        });
        // Mark as read if we receive a new message
        messageService.markConversationRead(conversation.conversation_id, user?.user_id);
      }
    );

    return unsubscribe;
  }, [conversation, user?.user_id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const msg = await messageService.sendMessage(
        conversation.conversation_id,
        user?.user_id,
        newMessage.trim()
      );
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversation) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
        <div className="text-center">
          <FaPaperPlane size={48} className="mb-3 opacity-25" />
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const otherName = conversation.otherParticipants?.[0]?.name || 'Unknown';
  const otherRole = conversation.otherParticipants?.[0]?.role || '';

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="p-3 border-bottom bg-white d-flex align-items-center gap-2">
        {onBack && (
          <Button variant="link" size="sm" className="text-dark p-0 me-2 d-lg-none" onClick={onBack}>
            <FaArrowLeft />
          </Button>
        )}
        <div className="flex-grow-1">
          <h6 className="mb-0 fw-bold">{otherName}</h6>
          <small className="text-muted">
            {otherRole && <Badge bg="light" text="dark" className="me-1">{otherRole}</Badge>}
            {conversation.subject && <span>Re: {conversation.subject}</span>}
            {conversation.student && (
              <span className="ms-1">— About: {conversation.student.name}</span>
            )}
          </small>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-3" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id) === String(user?.user_id);
            return (
              <div
                key={msg.message_id}
                className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-2 px-3 rounded-3 ${isMe ? 'bg-primary text-white' : 'bg-light'}`}
                  style={{ maxWidth: '75%' }}
                >
                  {!isMe && (
                    <small className="d-block fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                      {msg.sender?.name || 'Unknown'}
                    </small>
                  )}
                  <p className="mb-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.message_text}
                  </p>
                  <small className={`d-block text-end ${isMe ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                    {formatTime(msg.created_at)}
                  </small>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-top bg-white">
        <Form onSubmit={handleSend} className="d-flex gap-2">
          <Form.Control
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={sending}
            autoFocus
          />
          <Button type="submit" variant="primary" disabled={!newMessage.trim() || sending}>
            {sending ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default ConversationView;
