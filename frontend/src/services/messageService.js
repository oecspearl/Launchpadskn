import { supabase } from '../config/supabase';

export const messageService = {
  /**
   * Get all conversations for a user
   */
  async getConversations(userId) {
    // Get conversation IDs this user participates in
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!participations?.length) return [];

    const convIds = participations.map(p => p.conversation_id);

    // Get conversations with details
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        *,
        student:users!conversations_student_id_fkey(user_id, name, email),
        creator:users!conversations_created_by_fkey(user_id, name, email)
      `)
      .in('conversation_id', convIds)
      .order('last_message_at', { ascending: false });

    if (!conversations?.length) return [];

    // Get participants for each conversation
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, last_read_at, user:users(user_id, name, email, role)')
      .in('conversation_id', convIds)
      .eq('is_active', true);

    // Get last message for each conversation
    const lastMessages = {};
    for (const convId of convIds) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('message_id, message_text, sender_id, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (msgs?.length) lastMessages[convId] = msgs[0];
    }

    // Get unread counts
    const unreadCounts = {};
    const myParticipations = {};
    (allParticipants || []).forEach(p => {
      if (String(p.user_id) === String(userId)) {
        myParticipations[p.conversation_id] = p;
      }
    });

    for (const convId of convIds) {
      const myPart = myParticipations[convId];
      const lastReadAt = myPart?.last_read_at;

      let countQuery = supabase
        .from('messages')
        .select('message_id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .neq('sender_id', userId);

      if (lastReadAt) {
        countQuery = countQuery.gt('created_at', lastReadAt);
      }

      const { count } = await countQuery;
      unreadCounts[convId] = count || 0;
    }

    // Build participant map
    const participantMap = {};
    (allParticipants || []).forEach(p => {
      if (!participantMap[p.conversation_id]) participantMap[p.conversation_id] = [];
      participantMap[p.conversation_id].push(p.user);
    });

    return conversations.map(c => ({
      ...c,
      participants: participantMap[c.conversation_id] || [],
      otherParticipants: (participantMap[c.conversation_id] || []).filter(p => String(p.user_id) !== String(userId)),
      lastMessage: lastMessages[c.conversation_id] || null,
      unreadCount: unreadCounts[c.conversation_id] || 0
    }));
  },

  /**
   * Get messages for a conversation (paginated)
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(user_id, name, email, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, messageText) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: messageText
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(user_id, name, email, role)
      `)
      .single();

    if (error) throw error;

    // Update last_message_at on conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('conversation_id', conversationId);

    return data;
  },

  /**
   * Create a new conversation
   */
  async createConversation(institutionId, studentId, subject, participantIds, createdBy) {
    // Insert conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        institution_id: institutionId,
        student_id: studentId,
        subject,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;

    // Add participants (including creator)
    const allParticipants = [...new Set([...participantIds, createdBy])];
    const participantInserts = allParticipants.map(uid => ({
      conversation_id: conversation.conversation_id,
      user_id: uid,
      last_read_at: String(uid) === String(createdBy) ? new Date().toISOString() : null
    }));

    await supabase.from('conversation_participants').insert(participantInserts);

    return conversation;
  },

  /**
   * Get total unread message count for a user
   */
  async getUnreadCount(userId) {
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!participations?.length) return 0;

    let total = 0;
    for (const p of participations) {
      let query = supabase
        .from('messages')
        .select('message_id', { count: 'exact', head: true })
        .eq('conversation_id', p.conversation_id)
        .neq('sender_id', userId);

      if (p.last_read_at) {
        query = query.gt('created_at', p.last_read_at);
      }

      const { count } = await query;
      total += (count || 0);
    }

    return total;
  },

  /**
   * Mark conversation as read
   */
  async markConversationRead(conversationId, userId) {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Subscribe to new messages in a conversation (Supabase Realtime)
   */
  subscribeToMessages(conversationId, callback) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from('users')
            .select('user_id, name, email, role')
            .eq('user_id', payload.new.sender_id)
            .single();

          callback({ ...payload.new, sender });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to unread count changes for a user
   */
  subscribeToUnreadCount(userId, callback) {
    const channel = supabase
      .channel(`unread:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async () => {
          const count = await messageService.getUnreadCount(userId);
          callback(count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get students that a teacher teaches (via class_subjects)
   */
  async getTeacherStudents(teacherId) {
    // Get class_subjects for this teacher
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('class_id')
      .eq('teacher_id', teacherId);

    if (!classSubjects?.length) return [];

    const classIds = [...new Set(classSubjects.map(cs => cs.class_id))];

    // Get students in those classes
    const { data: assignments } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        class_id,
        student:users!student_class_assignments_student_id_fkey(user_id, name, email),
        class:classes(class_id, class_name, form:forms(form_name, form_number))
      `)
      .in('class_id', classIds)
      .eq('is_active', true);

    if (!assignments?.length) return [];

    // Deduplicate by student_id
    const studentMap = {};
    assignments.forEach(a => {
      if (!studentMap[a.student_id]) {
        studentMap[a.student_id] = {
          ...a.student,
          classes: []
        };
      }
      studentMap[a.student_id].classes.push(a.class);
    });

    return Object.values(studentMap);
  },

  /**
   * Get parents for a student
   */
  async getStudentParents(studentId) {
    const { data } = await supabase
      .from('parent_student_links')
      .select(`
        parent_id,
        parent:users!parent_student_links_parent_id_fkey(user_id, name, email)
      `)
      .eq('student_id', studentId)
      .eq('is_active', true);

    return (data || []).map(d => d.parent).filter(Boolean);
  },

  /**
   * Get teachers for a student's subjects (for parent to initiate conversation)
   */
  async getStudentTeachers(studentId) {
    // Get student's class
    const { data: assignment } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .maybeSingle();

    if (!assignment) return [];

    // Get class_subjects with teachers
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select(`
        teacher_id,
        teacher:users!class_subjects_teacher_id_fkey(user_id, name, email),
        subject_offering:subject_form_offerings(subject:subjects(subject_name))
      `)
      .eq('class_id', assignment.class_id);

    if (!classSubjects?.length) return [];

    // Deduplicate by teacher_id
    const teacherMap = {};
    classSubjects.forEach(cs => {
      if (!cs.teacher) return;
      if (!teacherMap[cs.teacher_id]) {
        teacherMap[cs.teacher_id] = {
          ...cs.teacher,
          subjects: []
        };
      }
      const subjectName = cs.subject_offering?.subject?.subject_name;
      if (subjectName) teacherMap[cs.teacher_id].subjects.push(subjectName);
    });

    return Object.values(teacherMap);
  }
};
