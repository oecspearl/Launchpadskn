import { supabase } from '../config/supabase';

const teacherCollaborationService = {
  // ============================================
  // COMMENTS
  // ============================================

  async getComments(libraryId = null, templateId = null) {
    try {
      let query = supabase
        .from('content_comments')
        .select(`
          *,
          user:users(
            user_id,
            name,
            email
          ),
          parent_comment:content_comments!content_comments_parent_comment_id_fkey(
            comment_id,
            comment_text,
            user:users(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (libraryId) {
        query = query.eq('library_id', libraryId);
      }

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  async addComment(commentData) {
    try {
      const { data, error } = await supabase
        .from('content_comments')
        .insert({
          ...commentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          user:users(
            user_id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  async updateComment(commentId, updates) {
    try {
      const { data, error } = await supabase
        .from('content_comments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('comment_id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  async deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from('content_comments')
        .delete()
        .eq('comment_id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // ============================================
  // CONTENT REQUESTS
  // ============================================

  async getContentRequests(filters = {}) {
    try {
      let query = supabase
        .from('content_requests')
        .select(`
          *,
          requested_by_user:users!content_requests_requested_by_fkey(
            user_id,
            name,
            email
          ),
          fulfilled_by_user:users!content_requests_fulfilled_by_fkey(
            user_id,
            name,
            email
          ),
          subject:subjects(
            subject_id,
            subject_name
          ),
          form:forms(
            form_id,
            form_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.requestedBy) {
        query = query.eq('requested_by', filters.requestedBy);
      }

      if (filters.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching content requests:', error);
      throw error;
    }
  },

  async createContentRequest(requestData) {
    try {
      const { data, error } = await supabase
        .from('content_requests')
        .insert({
          ...requestData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          requested_by_user:users!content_requests_requested_by_fkey(
            user_id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating content request:', error);
      throw error;
    }
  },

  async fulfillContentRequest(requestId, fulfilledBy, fulfilledContentId) {
    try {
      const { data, error } = await supabase
        .from('content_requests')
        .update({
          status: 'FULFILLED',
          fulfilled_by: fulfilledBy,
          fulfilled_content_id: fulfilledContentId,
          fulfilled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fulfilling content request:', error);
      throw error;
    }
  },

  // ============================================
  // COLLABORATION
  // ============================================

  async getCollaborators(libraryId = null, templateId = null) {
    try {
      let query = supabase
        .from('content_collaboration')
        .select(`
          *,
          collaborator:users!content_collaboration_collaborator_id_fkey(
            user_id,
            name,
            email
          ),
          invited_by_user:users!content_collaboration_invited_by_fkey(
            user_id,
            name,
            email
          )
        `)
        .eq('is_active', true);

      if (libraryId) {
        query = query.eq('library_id', libraryId);
      }

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      throw error;
    }
  },

  async inviteCollaborator(collaborationData) {
    try {
      const { data, error } = await supabase
        .from('content_collaboration')
        .insert({
          ...collaborationData,
          invited_at: new Date().toISOString()
        })
        .select(`
          *,
          collaborator:users!content_collaboration_collaborator_id_fkey(
            user_id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      throw error;
    }
  },

  async removeCollaborator(collaborationId) {
    try {
      const { error } = await supabase
        .from('content_collaboration')
        .update({ is_active: false })
        .eq('collaboration_id', collaborationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  },

  // ============================================
  // SUGGESTIONS
  // ============================================

  async getSuggestions(libraryId = null, templateId = null) {
    try {
      let query = supabase
        .from('content_suggestions')
        .select(`
          *,
          suggested_by_user:users!content_suggestions_suggested_by_fkey(
            user_id,
            name,
            email
          ),
          reviewed_by_user:users!content_suggestions_reviewed_by_fkey(
            user_id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (libraryId) {
        query = query.eq('library_id', libraryId);
      }

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  async createSuggestion(suggestionData) {
    try {
      const { data, error } = await supabase
        .from('content_suggestions')
        .insert({
          ...suggestionData,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          suggested_by_user:users!content_suggestions_suggested_by_fkey(
            user_id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  },

  async reviewSuggestion(suggestionId, reviewedBy, status) {
    try {
      const { data, error } = await supabase
        .from('content_suggestions')
        .update({
          status: status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString()
        })
        .eq('suggestion_id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
      throw error;
    }
  }
};

export default teacherCollaborationService;

