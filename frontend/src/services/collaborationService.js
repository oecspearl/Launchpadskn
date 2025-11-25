import { supabase } from '../config/supabase';

const collaborationService = {
  // ============================================
  // Session Management
  // ============================================
  
  async getActiveSessions(classSubjectId = null, sessionType = null) {
    try {
      const { data, error } = await supabase.rpc('get_active_sessions', {
        class_subject_id_param: classSubjectId,
        session_type_param: sessionType
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  },

  async createSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async joinSession(sessionId, userId, role = 'PARTICIPANT') {
    try {
      const { data, error } = await supabase.rpc('join_session', {
        session_id_param: sessionId,
        user_id_param: userId,
        role_param: role
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  },

  async leaveSession(sessionId, userId) {
    try {
      const { data, error } = await supabase.rpc('leave_session', {
        session_id_param: sessionId,
        user_id_param: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  },

  async getSessionParticipants(sessionId) {
    try {
      const { data, error } = await supabase.rpc('get_session_participants', {
        session_id_param: sessionId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }
  },

  // ============================================
  // Collaborative Documents
  // ============================================
  
  async getDocument(documentId) {
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  async createDocument(documentData) {
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },

  async updateDocument(documentId, updateData) {
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  async getDocumentChanges(documentId, sinceVersion = 0) {
    try {
      const { data, error } = await supabase
        .from('document_changes')
        .select('*')
        .eq('document_id', documentId)
        .gt('version', sinceVersion)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching document changes:', error);
      throw error;
    }
  },

  async addDocumentChange(changeData) {
    try {
      const { data, error } = await supabase
        .from('document_changes')
        .insert(changeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding document change:', error);
      throw error;
    }
  },

  // ============================================
  // Virtual Classrooms
  // ============================================
  
  async createVirtualClassroom(classroomData) {
    try {
      const { data, error } = await supabase
        .from('virtual_classrooms')
        .insert(classroomData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating virtual classroom:', error);
      throw error;
    }
  },

  async getVirtualClassroom(sessionId) {
    try {
      const { data, error } = await supabase
        .from('virtual_classrooms')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching virtual classroom:', error);
      throw error;
    }
  },

  async createBreakoutRoom(roomData) {
    try {
      const { data, error } = await supabase
        .from('breakout_rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating breakout room:', error);
      throw error;
    }
  },

  // ============================================
  // Whiteboards
  // ============================================
  
  async getWhiteboard(sessionId) {
    try {
      const { data, error } = await supabase
        .from('collaborative_whiteboards')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching whiteboard:', error);
      throw error;
    }
  },

  async createWhiteboard(whiteboardData) {
    try {
      const { data, error } = await supabase
        .from('collaborative_whiteboards')
        .insert(whiteboardData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      throw error;
    }
  },

  async updateWhiteboard(whiteboardId, updateData) {
    try {
      const { data, error } = await supabase
        .from('collaborative_whiteboards')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('whiteboard_id', whiteboardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating whiteboard:', error);
      throw error;
    }
  },

  // ============================================
  // Tutoring
  // ============================================
  
  async getTutoringSessions(tutorId = null, studentId = null, status = null) {
    try {
      const { data, error } = await supabase.rpc('get_tutoring_sessions', {
        tutor_id_param: tutorId,
        student_id_param: studentId,
        status_param: status
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tutoring sessions:', error);
      throw error;
    }
  },

  async createTutoringSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('tutoring_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tutoring session:', error);
      throw error;
    }
  },

  // ============================================
  // Group Projects
  // ============================================
  
  async getGroupProjects(classSubjectId = null, userId = null, status = null) {
    try {
      const { data, error } = await supabase.rpc('get_group_projects', {
        class_subject_id_param: classSubjectId,
        user_id_param: userId,
        status_param: status
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group projects:', error);
      throw error;
    }
  },

  async createGroupProject(projectData) {
    try {
      const { data, error } = await supabase
        .from('group_projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating group project:', error);
      throw error;
    }
  },

  async getProjectTasks(projectId, assignedTo = null, status = null) {
    try {
      const { data, error } = await supabase.rpc('get_project_tasks', {
        project_id_param: projectId,
        assigned_to_param: assignedTo,
        status_param: status
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      throw error;
    }
  },

  async createProjectTask(taskData) {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project task:', error);
      throw error;
    }
  },

  async updateProjectProgress(projectId) {
    try {
      const { data, error } = await supabase.rpc('update_project_progress', {
        project_id_param: projectId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  }
};

export default collaborationService;

