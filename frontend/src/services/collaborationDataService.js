import { supabase } from '../config/supabase';

/**
 * Collaboration / messaging data access.
 *
 * Owns Supabase queries previously inlined in CollaborativeDocuments and
 * MessagingCenter. Components consume these methods instead of importing the
 * Supabase client directly for data queries.
 */
export const collaborationDataService = {
  /** Collaborative documents for a given session. */
  async getDocumentsBySession(sessionId) {
    const { data, error } = await supabase
      .from('collaborative_documents')
      .select('*')
      .eq('session_id', sessionId);
    if (error) throw error;
    return data;
  },

  /** Active parent-student links (returns the joined student records). */
  async getParentStudentLinks(parentId) {
    const { data, error } = await supabase
      .from('parent_student_links')
      .select('student:users!parent_student_links_student_id_fkey(id, first_name, last_name, email)')
      .eq('parent_id', parentId)
      .eq('is_active', true);
    if (error) throw error;
    return data;
  },
};

export default collaborationDataService;
