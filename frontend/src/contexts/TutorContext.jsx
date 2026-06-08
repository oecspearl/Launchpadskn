import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContextSupabase';
import { supabase } from '../config/supabase';
import tutorService from '../services/tutorService';
import { isRole, ROLES } from '../constants/roles';

const TutorContext = createContext(null);

export function TutorProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [hideFab, setHideFab] = useState(false);

  const isStudent = isRole(user, ROLES.STUDENT);
  const studentId = user?.user_id;
  const prevPathRef = useRef(null);

  // Load student profile once
  useEffect(() => {
    if (!isStudent || !studentId) return;
    tutorService.getStudentProfileForTutor(studentId)
      .then(profile => setStudentProfile(profile))
      .catch(() => {
        // Fallback to basic info from auth
        setStudentProfile({ name: user?.name || '', gradeLevel: '', specialNeeds: '', accommodations: '' });
      });
  }, [isStudent, studentId, user?.name]);

  // Derive context from current URL
  useEffect(() => {
    if (!isStudent) return;
    const path = location.pathname;
    if (path === prevPathRef.current) return;
    prevPathRef.current = path;

    deriveContextFromRoute(path);
  }, [isStudent, location.pathname]);

  const deriveContextFromRoute = async (path) => {
    // Match /student/lessons/:lessonId
    const lessonMatch = path.match(/^\/student\/lessons\/(\d+)/);
    if (lessonMatch) {
      const lessonId = parseInt(lessonMatch[1]);
      try {
        const { data: lesson } = await supabase
          .from('lessons')
          .select(`
            lesson_id:id, lesson_title:title, topic, learning_objectives,
            class_subject:class_subjects(
              class_subject_id:id,
              subject_offering:subject_form_offerings(
                subject:subjects(subject_name:name)
              )
            )
          `)
          .eq('id', lessonId)
          .single();

        if (lesson) {
          setCurrentContext({
            classSubjectId: lesson.class_subject?.class_subject_id,
            lessonId: lesson.lesson_id,
            subjectName: lesson.class_subject?.subject_offering?.subject?.subject_name || '',
            lessonTitle: lesson.lesson_title || '',
            lessonTopic: lesson.topic || '',
            learningObjectives: lesson.learning_objectives || ''
          });
          return;
        }
      } catch (err) {
        console.warn('[Tutor] Could not fetch lesson context:', err);
      }
    }

    // Match /student/subjects/:classSubjectId
    const subjectMatch = path.match(/^\/student\/subjects\/(\d+)/);
    if (subjectMatch) {
      const classSubjectId = parseInt(subjectMatch[1]);
      try {
        const { data: cs } = await supabase
          .from('class_subjects')
          .select(`
            class_subject_id:id,
            subject_offering:subject_form_offerings(
              subject:subjects(subject_name:name)
            )
          `)
          .eq('id', classSubjectId)
          .single();

        if (cs) {
          setCurrentContext({
            classSubjectId: cs.class_subject_id,
            lessonId: null,
            subjectName: cs.subject_offering?.subject?.subject_name || '',
            lessonTitle: '',
            lessonTopic: '',
            learningObjectives: ''
          });
          return;
        }
      } catch (err) {
        console.warn('[Tutor] Could not fetch subject context:', err);
      }
    }

    // No specific context (dashboard, etc.)
    setCurrentContext(null);
  };

  // Check if tutor is enabled when context changes
  useEffect(() => {
    if (!isStudent || !studentId) {
      setIsEnabled(false);
      return;
    }

    if (currentContext?.classSubjectId) {
      tutorService.isTutorEnabled(studentId, currentContext.classSubjectId)
        .then(enabled => setIsEnabled(enabled))
        .catch(() => setIsEnabled(true));
    } else {
      setIsEnabled(true); // General help always available
    }
  }, [isStudent, studentId, currentContext?.classSubjectId]);

  // Reset conversation when context changes significantly
  useEffect(() => {
    setActiveConversation(null);
    setMessages([]);
    setError(null);
  }, [currentContext?.classSubjectId, currentContext?.lessonId]);

  // Public methods
  const toggleTutor = useCallback(() => setIsOpen(prev => !prev), []);
  const closeTutor = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isSending || !studentId) return;

    setIsSending(true);
    setError(null);

    try {
      // Get or create conversation on first message
      let conv = activeConversation;
      if (!conv) {
        conv = await tutorService.getOrCreateConversation(
          studentId,
          currentContext?.classSubjectId,
          currentContext?.lessonId
        );
        setActiveConversation(conv);
      }

      // Optimistically add user message
      const tempUserMsg = { message_id: `temp-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, tempUserMsg]);

      // Call API
      const assistantMsg = await tutorService.sendMessage(
        conv.conversation_id,
        text,
        messages,
        studentProfile,
        currentContext
      );

      // Replace temp message with real ones and add assistant response
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.message_id !== tempUserMsg.message_id);
        return [
          ...withoutTemp,
          { message_id: `user-${Date.now()}`, role: 'user', content: text, created_at: tempUserMsg.created_at },
          assistantMsg
        ];
      });
    } catch (err) {
      console.error('[Tutor] Error sending message:', err);
      setError('Failed to get a response. Please try again.');
      // Remove the temp message on error
      setMessages(prev => prev.filter(m => !String(m.message_id).startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, currentContext, isSending, messages, studentId, studentProfile]);

  const loadConversation = useCallback(async (conversationId) => {
    try {
      const msgs = await tutorService.getMessages(conversationId);
      setMessages(msgs);
      setActiveConversation({ conversation_id: conversationId });
    } catch (err) {
      console.error('[Tutor] Error loading conversation:', err);
    }
  }, []);

  const loadConversationHistory = useCallback(async () => {
    if (!studentId) return;
    try {
      const convs = await tutorService.getConversations(studentId);
      setConversationHistory(convs);
    } catch (err) {
      console.error('[Tutor] Error loading history:', err);
    }
  }, [studentId]);

  const startNewConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setError(null);
  }, []);

  const contextValue = {
    isOpen, isEnabled, isSending, error, hideFab,
    currentContext, activeConversation, messages, conversationHistory, studentProfile,
    toggleTutor, closeTutor, setHideFab,
    sendMessage, loadConversation, loadConversationHistory, startNewConversation
  };

  return (
    <TutorContext.Provider value={contextValue}>
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error('useTutor must be used within TutorProvider');
  }
  return context;
}
