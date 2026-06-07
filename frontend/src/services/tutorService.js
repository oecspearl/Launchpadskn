import { supabase } from '../config/supabase';

const TUTOR_API_URL = '/api/ai/tutor';

const tutorService = {
  // ─── Conversations ────────────────────────────────────────────────

  async getConversations(studentId, limit = 20) {
    const { data, error } = await supabase
      .from('tutor_conversations')
      .select(`
        *,
        class_subject:class_subjects(
          class_subject_id,
          subject_offering:subject_form_offerings(
            subject:subjects(name)
          ),
          class:classes(name, form:forms(name))
        ),
        lesson:lessons(lesson_title, topic)
      `)
      .eq('student_id', studentId)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Tutor] Error loading conversations:', error);
      return [];
    }
    return data || [];
  },

  async getOrCreateConversation(studentId, classSubjectId, lessonId) {
    // Try to find an existing active conversation for this context
    let query = supabase
      .from('tutor_conversations')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else if (classSubjectId) {
      query = query.eq('class_subject_id', classSubjectId).is('lesson_id', null);
    } else {
      query = query.is('class_subject_id', null).is('lesson_id', null);
    }

    const { data: existing } = await query.order('last_message_at', { ascending: false }).limit(1);

    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('tutor_conversations')
      .insert({
        student_id: studentId,
        class_subject_id: classSubjectId || null,
        lesson_id: lessonId || null,
        title: 'Tutoring Session',
        is_active: true,
        message_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[Tutor] Error creating conversation:', error);
      throw error;
    }
    return newConv;
  },

  // ─── Messages ─────────────────────────────────────────────────────

  async getMessages(conversationId, limit = 50) {
    const { data, error } = await supabase
      .from('tutor_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[Tutor] Error loading messages:', error);
      return [];
    }
    return data || [];
  },

  async saveMessage(conversationId, role, content, metadata = null) {
    const insertData = {
      conversation_id: conversationId,
      role,
      content
    };
    if (metadata) insertData.metadata = metadata;

    const { data, error } = await supabase
      .from('tutor_messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Tutor] Error saving message:', error);
      throw error;
    }

    // Update conversation metadata
    await supabase
      .from('tutor_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: supabase.rpc ? undefined : undefined, // handled below
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId);

    // Increment message count
    const { data: conv } = await supabase
      .from('tutor_conversations')
      .select('message_count')
      .eq('conversation_id', conversationId)
      .single();

    if (conv) {
      await supabase
        .from('tutor_conversations')
        .update({ message_count: (conv.message_count || 0) + 1 })
        .eq('conversation_id', conversationId);
    }

    return data;
  },

  // ─── AI Interaction ───────────────────────────────────────────────

  async sendMessage(conversationId, userMessage, messageHistory, studentProfile, currentContext) {
    // 1. Save user message
    await this.saveMessage(conversationId, 'user', userMessage);

    // 2. Build messages for API (last 20 from history + new user message)
    const apiMessages = [
      ...messageHistory.slice(-19).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    // 3. Call tutor API
    const response = await fetch(TUTOR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        studentProfile,
        currentContext
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

    // 4. Save assistant response (with resources metadata if present)
    const metadata = data.resources ? { resources: data.resources } : null;
    const assistantMsg = await this.saveMessage(conversationId, 'assistant', assistantContent, metadata);

    return assistantMsg;
  },

  // ─── Settings / Activation ────────────────────────────────────────

  async isTutorEnabled(studentId, classSubjectId) {
    if (!classSubjectId) return true; // No specific context = enabled

    // Check student override first
    const { data: override } = await supabase
      .from('tutor_student_overrides')
      .select('is_enabled')
      .eq('class_subject_id', classSubjectId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (override) return override.is_enabled;

    // Check class-level setting
    const { data: setting } = await supabase
      .from('tutor_settings')
      .select('is_enabled')
      .eq('class_subject_id', classSubjectId)
      .maybeSingle();

    if (setting) return setting.is_enabled;

    // Default: enabled
    return true;
  },

  async getTutorSettingsForTeacher(teacherId) {
    // Get all class_subjects this teacher owns
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select(`
        class_subject_id,
        subject_offering:subject_form_offerings(
          subject:subjects(name)
        ),
        class:classes(name, id, form:forms(name))
      `)
      .eq('teacher_id', teacherId);

    if (!classSubjects || classSubjects.length === 0) return [];

    // Get existing settings
    const csIds = classSubjects.map(cs => cs.class_subject_id);
    const { data: settings } = await supabase
      .from('tutor_settings')
      .select('*')
      .in('class_subject_id', csIds);

    const settingsMap = {};
    (settings || []).forEach(s => { settingsMap[s.class_subject_id] = s; });

    return classSubjects.map(cs => ({
      ...cs,
      tutorSetting: settingsMap[cs.class_subject_id] || null,
      isEnabled: settingsMap[cs.class_subject_id]?.is_enabled ?? true
    }));
  },

  async updateTutorSetting(classSubjectId, teacherId, isEnabled) {
    const { data: existing } = await supabase
      .from('tutor_settings')
      .select('setting_id')
      .eq('class_subject_id', classSubjectId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('tutor_settings')
        .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
        .eq('class_subject_id', classSubjectId);
    } else {
      await supabase
        .from('tutor_settings')
        .insert({
          class_subject_id: classSubjectId,
          teacher_id: teacherId,
          is_enabled: isEnabled
        });
    }
  },

  async getStudentOverrides(classSubjectId) {
    const { data, error } = await supabase
      .from('tutor_student_overrides')
      .select(`
        *,
        student:users!tutor_student_overrides_student_id_fkey(id, first_name, last_name, email)
      `)
      .eq('class_subject_id', classSubjectId);

    if (error) {
      console.error('[Tutor] Error loading overrides:', error);
      return [];
    }
    return data || [];
  },

  async upsertStudentOverride(classSubjectId, studentId, isEnabled, reason, createdBy) {
    const { data: existing } = await supabase
      .from('tutor_student_overrides')
      .select('override_id')
      .eq('class_subject_id', classSubjectId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('tutor_student_overrides')
        .update({ is_enabled: isEnabled, reason, updated_at: new Date().toISOString() })
        .eq('class_subject_id', classSubjectId)
        .eq('student_id', studentId);
    } else {
      await supabase
        .from('tutor_student_overrides')
        .insert({
          class_subject_id: classSubjectId,
          student_id: studentId,
          is_enabled: isEnabled,
          reason,
          created_by: createdBy
        });
    }
  },

  async deleteStudentOverride(classSubjectId, studentId) {
    await supabase
      .from('tutor_student_overrides')
      .delete()
      .eq('class_subject_id', classSubjectId)
      .eq('student_id', studentId);
  },

  // ─── Student Profile for Tutor ───────────────────────────────────

  async getStudentProfileForTutor(studentId) {
    const profile = { name: '', gradeLevel: '', specialNeeds: '', accommodations: '' };

    // Get basic info
    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', studentId)
      .maybeSingle();

    if (user) profile.name = [user.first_name, user.last_name].filter(Boolean).join(' ');

    // Get student profile (grade level)
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('current_grade_level')
      .eq('student_id', studentId)
      .maybeSingle();

    if (sp) profile.gradeLevel = sp.current_grade_level || '';

    // Get special needs
    const { data: needs } = await supabase
      .from('student_special_needs')
      .select('need_type, diagnosis, accommodations')
      .eq('student_id', studentId);

    if (needs && needs.length > 0) {
      profile.specialNeeds = needs.map(n => `${n.need_type}: ${n.diagnosis || ''}`).join('; ');
      profile.accommodations = needs.map(n => n.accommodations || '').filter(Boolean).join('; ');
    }

    // Get specific accommodations
    const { data: accoms } = await supabase
      .from('student_accommodations')
      .select('accommodation_type, description')
      .eq('student_id', studentId);

    if (accoms && accoms.length > 0) {
      const accomStr = accoms.map(a => `${a.accommodation_type}: ${a.description || ''}`).join('; ');
      profile.accommodations = profile.accommodations
        ? `${profile.accommodations}; ${accomStr}`
        : accomStr;
    }

    return profile;
  }
};

export default tutorService;
