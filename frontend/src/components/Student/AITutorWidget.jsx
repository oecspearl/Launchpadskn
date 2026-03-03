import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaHistory, FaArrowLeft, FaBook } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useTutor } from '../../contexts/TutorContext';
import './AITutorWidget.css';

function AITutorWidget() {
  const { user } = useAuth();
  const {
    isOpen, isEnabled, isSending, error,
    currentContext, messages, conversationHistory,
    toggleTutor, closeTutor,
    sendMessage, loadConversation, loadConversationHistory, startNewConversation
  } = useTutor();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isStudent = user?.role?.toUpperCase() === 'STUDENT';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  if (!isStudent || !isEnabled) return null;

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpenHistory = () => {
    loadConversationHistory();
    setShowHistory(true);
  };

  const handleSelectConversation = (conv) => {
    loadConversation(conv.conversation_id);
    setShowHistory(false);
  };

  const handleNewConversation = () => {
    startNewConversation();
    setShowHistory(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getContextLabel = () => {
    if (currentContext?.lessonTitle && currentContext?.subjectName) {
      return `${currentContext.subjectName} — ${currentContext.lessonTitle}`;
    }
    if (currentContext?.subjectName) {
      return currentContext.subjectName;
    }
    return null;
  };

  const getWelcomeMessage = () => {
    const name = user?.name?.split(' ')[0] || 'there';
    if (currentContext?.lessonTitle) {
      return `I'm here to help you with "${currentContext.lessonTitle}". What would you like to explore?`;
    }
    if (currentContext?.subjectName) {
      return `I'm ready to help with ${currentContext.subjectName}. What topic are you working on?`;
    }
    return `Hi ${name}! I'm your LaunchPad Tutor. Ask me about any of your subjects and I'll help guide you to the answers.`;
  };

  const getConversationTitle = (conv) => {
    const subject = conv.class_subject?.subject_offering?.subject?.subject_name;
    const lesson = conv.lesson?.lesson_title;
    if (lesson && subject) return `${subject} — ${lesson}`;
    if (subject) return subject;
    if (conv.title) return conv.title;
    return 'General Help';
  };

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button className="tutor-fab" onClick={toggleTutor} title="Open AI Tutor">
          <FaRobot size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="tutor-panel">
          {/* Header */}
          <div className="tutor-header">
            <div className="tutor-header-avatar">
              <FaRobot size={18} />
            </div>
            <div className="tutor-header-info">
              <p className="tutor-header-title">LaunchPad Tutor</p>
              <p className="tutor-header-subtitle">
                {isSending ? 'Thinking...' : 'Ask me anything — I\'ll guide you'}
              </p>
            </div>
            <div className="tutor-header-actions">
              <button className="tutor-header-btn" onClick={handleOpenHistory} title="Conversation History">
                <FaHistory size={14} />
              </button>
              <button className="tutor-header-btn" onClick={closeTutor} title="Close">
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Context Bar */}
          {getContextLabel() && (
            <div className="tutor-context-bar">
              <FaBook size={11} />
              <span>Studying: {getContextLabel()}</span>
            </div>
          )}

          {/* History Overlay */}
          {showHistory && (
            <div className="tutor-history-overlay">
              <div className="tutor-history-header">
                <button
                  onClick={() => setShowHistory(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <FaArrowLeft size={14} />
                </button>
                <span>Conversation History</span>
              </div>
              <div style={{ padding: '8px 12px' }}>
                <button
                  onClick={handleNewConversation}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: '1.5px dashed #667eea', background: '#f8f9ff',
                    color: '#667eea', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                  }}
                >
                  + New Conversation
                </button>
              </div>
              <div className="tutor-history-list">
                {conversationHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#6c757d', fontSize: '0.85rem' }}>
                    No previous conversations
                  </div>
                ) : (
                  conversationHistory.map(conv => (
                    <div
                      key={conv.conversation_id}
                      className="tutor-history-item"
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="tutor-history-item-title">
                        {getConversationTitle(conv)}
                      </div>
                      <div className="tutor-history-item-meta">
                        {conv.message_count} messages &middot; {formatTime(conv.last_message_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="tutor-messages">
            {messages.length === 0 && !isSending && (
              <div className="tutor-welcome">
                <div className="tutor-welcome-icon">
                  <FaRobot size={24} />
                </div>
                <h6>Welcome!</h6>
                <p>{getWelcomeMessage()}</p>
                <p style={{ fontSize: '0.78rem', color: '#adb5bd', marginTop: '8px' }}>
                  I won't give you answers directly — I'll help you figure them out yourself!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.message_id} className={`tutor-msg tutor-msg-${msg.role}`}>
                <div className="tutor-msg-avatar">
                  {msg.role === 'assistant' ? <FaRobot size={12} /> : (user?.name?.[0]?.toUpperCase() || 'S')}
                </div>
                <div>
                  <div className="tutor-msg-bubble">{msg.content}</div>
                  <div className="tutor-msg-time">{formatTime(msg.created_at)}</div>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="tutor-typing">
                <div className="tutor-msg-avatar" style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'
                }}>
                  <FaRobot size={12} />
                </div>
                <div className="tutor-typing-dots">
                  <div className="tutor-typing-dot" />
                  <div className="tutor-typing-dot" />
                  <div className="tutor-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && <div className="tutor-error">{error}</div>}

          {/* Input */}
          <div className="tutor-input-area">
            <textarea
              ref={inputRef}
              className="tutor-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              disabled={isSending}
            />
            <button
              className="tutor-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              title="Send"
            >
              <FaPaperPlane size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AITutorWidget;
