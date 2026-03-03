import React, { useState, useRef, useEffect } from 'react';
import {
  FaRobot, FaTimes, FaPaperPlane, FaHistory, FaArrowLeft, FaBook, FaPlay, FaExternalLinkAlt,
  FaVideo, FaLightbulb, FaGlobe, FaClipboardList, FaPencilAlt
} from 'react-icons/fa';
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

  const QUICK_ACTIONS = [
    { id: 'videos',     label: 'Videos',     icon: FaVideo,         color: '#e74c3c',
      getMessage: (topic) => `Find me a video that explains ${topic}` },
    { id: 'explain',    label: 'Explain',    icon: FaLightbulb,     color: '#f39c12',
      getMessage: (topic) => `Can you explain ${topic} to me step by step?` },
    { id: 'websites',   label: 'Websites',   icon: FaGlobe,         color: '#3498db',
      getMessage: (topic) => `Find me helpful websites about ${topic}` },
    { id: 'worksheets', label: 'Worksheets', icon: FaClipboardList, color: '#27ae60',
      getMessage: (topic) => `Find me practice worksheets or exercises for ${topic}` },
    { id: 'examples',   label: 'Examples',   icon: FaPencilAlt,     color: '#8e44ad',
      getMessage: (topic) => `Show me worked examples for ${topic}` },
  ];

  const getContextTopic = () => {
    if (currentContext?.lessonTitle) return currentContext.lessonTitle;
    if (currentContext?.subjectName) return currentContext.subjectName;
    return 'this topic';
  };

  const handleQuickAction = (action) => {
    if (isSending) return;
    sendMessage(action.getMessage(getContextTopic()));
  };

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

  const renderResources = (metadata) => {
    const resources = metadata?.resources;
    if (!resources) return null;
    const youtubeVideos = resources.youtube || [];
    const webResults = resources.web || [];
    if (youtubeVideos.length === 0 && webResults.length === 0) return null;

    return (
      <div className="tutor-resources">
        {youtubeVideos.map((video) => (
          <a
            key={video.videoId}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tutor-youtube-card"
          >
            <div className="tutor-youtube-thumb">
              {video.thumbnail && <img src={video.thumbnail} alt="" />}
              <div className="tutor-youtube-play"><FaPlay size={14} /></div>
            </div>
            <div className="tutor-youtube-info">
              <p className="tutor-youtube-title">{video.title}</p>
              <p className="tutor-youtube-channel">{video.channelTitle}</p>
            </div>
          </a>
        ))}
        {webResults.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tutor-web-card"
          >
            <div className="tutor-web-info">
              <p className="tutor-web-title">
                <FaExternalLinkAlt size={10} className="me-1" />
                {item.title}
              </p>
              {item.snippet && <p className="tutor-web-snippet">{item.snippet}</p>}
              <p className="tutor-web-source">{item.source}</p>
            </div>
          </a>
        ))}
      </div>
    );
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
                <div className="tutor-welcome-actions">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      className="tutor-welcome-action-card"
                      onClick={() => handleQuickAction(action)}
                      disabled={isSending}
                    >
                      <div className="tutor-welcome-action-icon" style={{ color: action.color }}>
                        <action.icon size={18} />
                      </div>
                      <span className="tutor-welcome-action-label">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.message_id} className={`tutor-msg tutor-msg-${msg.role}`}>
                <div className="tutor-msg-avatar">
                  {msg.role === 'assistant' ? <FaRobot size={12} /> : (user?.name?.[0]?.toUpperCase() || 'S')}
                </div>
                <div>
                  <div className="tutor-msg-bubble">{msg.content}</div>
                  {msg.role === 'assistant' && renderResources(msg.metadata)}
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

          {/* Quick Action Chips */}
          {messages.length > 0 && (
            <div className="tutor-quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className="tutor-quick-action-chip"
                  onClick={() => handleQuickAction(action)}
                  disabled={isSending}
                  title={action.getMessage(getContextTopic())}
                >
                  <action.icon size={11} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

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
