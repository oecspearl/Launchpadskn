import { supabase } from '../config/supabase';

/**
 * Curriculum data access.
 *
 * Owns the Supabase table queries previously inlined in the Admin curriculum
 * screens (AISuggestionPanel, ARVRContentManager, GapAnalysis, ResourceLibrary,
 * CurriculumTemplateManager). Components consume these methods instead of
 * importing the Supabase client directly for table queries.
 */
export const curriculumDataService = {
  // ── AI suggestions (AISuggestionPanel) ─────────────────────────────────────

  async getAISuggestions(offeringId, contextType, contextPath) {
    const { data, error } = await supabase
      .from('curriculum_ai_suggestions')
      .select('*')
      .eq('offering_id', offeringId)
      .eq('context_type', contextType)
      .eq('context_path', contextPath)
      .eq('used', false)
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  },

  async insertAISuggestions(suggestionsToInsert) {
    const { error } = await supabase
      .from('curriculum_ai_suggestions')
      .insert(suggestionsToInsert);

    if (error) throw error;
  },

  async markAISuggestionUsed(suggestionId) {
    await supabase
      .from('curriculum_ai_suggestions')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('suggestion_id', suggestionId);
  },

  // ── AR/VR content (ARVRContentManager) ─────────────────────────────────────

  async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getAllARVRContent() {
    const { data, error } = await supabase
      .from('arvr_content')
      .select('*, subjects:subject_id (subject_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createARVRContent(cleanedData) {
    const { data: result, error } = await supabase
      .from('arvr_content')
      .insert(cleanedData)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    return result;
  },

  async updateARVRContent(id, cleanedData) {
    const { data: result, error } = await supabase
      .from('arvr_content')
      .update(cleanedData)
      .eq('content_id', id)
      .select()
      .single();
    if (error) {
      console.error('Update error details:', error);
      throw error;
    }
    return result;
  },

  async deleteARVRContent(id) {
    const { error } = await supabase
      .from('arvr_content')
      .delete()
      .eq('content_id', id);
    if (error) throw error;
  },

  // ── Curriculum gaps (GapAnalysis) ──────────────────────────────────────────

  async resolveGap(gapId, resolvedBy) {
    const { error } = await supabase
      .from('curriculum_gaps')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
      })
      .eq('gap_id', gapId);

    if (error) throw error;
  },

  // ── Resource library (ResourceLibrary) ─────────────────────────────────────

  async getResources(offering) {
    let query = supabase
      .from('curriculum_resources')
      .select('*')
      .order('usage_count', { ascending: false });

    // Filter by subject if offering is provided
    if (offering?.subject_id) {
      query = query.or(`subject_id.eq.${offering.subject_id},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createResource(insertData) {
    const { data, error } = await supabase
      .from('curriculum_resources')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ── Curriculum templates (CurriculumTemplateManager) ───────────────────────

  async getTemplates(userId) {
    let query = supabase
      .from('curriculum_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    // Show public templates and user's own templates
    if (userId) {
      query = query.or(`is_public.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTemplate(insertData) {
    const { data, error } = await supabase
      .from('curriculum_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(templateId, userId) {
    const { error } = await supabase
      .from('curriculum_templates')
      .delete()
      .eq('template_id', templateId)
      .eq('created_by', userId); // Only allow deleting own templates

    if (error) throw error;
  }
};

export default curriculumDataService;
