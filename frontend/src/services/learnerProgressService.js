import { supabase } from '../config/supabase';

const learnerProgressService = {
  /**
   * Load completed content IDs for a user from the learner_progress table.
   * @param {string} userId - UUID (auth.users.id)
   * @param {number[]} contentIds - Array of lesson_content content_id values
   * @returns {Promise<Set<number>>} Set of completed content_ids
   */
  async loadCompletedContentIds(userId, contentIds) {
    if (!userId || !contentIds || contentIds.length === 0) return new Set();

    try {
      const { data, error } = await supabase
        .from('learner_progress')
        .select('content_id')
        .eq('user_id', userId)
        .in('content_id', contentIds)
        .eq('completed', true);

      if (error) {
        console.error('[LearnerProgress] Error loading progress:', error);
        return new Set();
      }

      return new Set((data || []).map(r => r.content_id));
    } catch (err) {
      console.error('[LearnerProgress] Exception loading progress:', err);
      return new Set();
    }
  },

  /**
   * Toggle completion for a single content item.
   * Uses check-then-insert/update pattern for compatibility.
   * @param {string} userId - UUID
   * @param {number} contentId
   * @param {boolean} completed - The new completed state
   */
  async toggleContentCompletion(userId, contentId, completed) {
    if (!userId || !contentId) return;

    const now = new Date().toISOString();

    try {
      const { data: existing } = await supabase
        .from('learner_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('learner_progress')
          .update({
            completed,
            progress_percentage: completed ? 100 : 0,
            updated_at: now
          })
          .eq('user_id', userId)
          .eq('content_id', contentId);
      } else {
        await supabase
          .from('learner_progress')
          .insert({
            user_id: userId,
            content_id: contentId,
            completed,
            progress_percentage: completed ? 100 : 0,
            created_at: now,
            updated_at: now
          });
      }
    } catch (err) {
      console.error('[LearnerProgress] Error toggling completion:', err);
    }
  }
};

export default learnerProgressService;
