import { supabase } from '../config/supabase';
import { compatClassSubject } from './subjectCompat';

/**
 * Teacher tools data access.
 *
 * Owns Supabase queries previously inlined in the Teacher tool screens
 * (EnhancedLessonPlannerForm, TeacherLessonView, InteractiveVideoCreator,
 * FlashcardCreator, TutorSettings, LessonTemplateLibrary). Components consume
 * these methods instead of importing the Supabase client directly.
 */
export const teacherToolsService = {
  // ── EnhancedLessonPlannerForm ──────────────────────────────────────────────

  /** Get a class_subject with form info to match curriculum by form_number. */
  async getClassSubjectCurriculumInfo(classSubjectId) {
    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
          subject_offering_id,
          subject_id,
          subject:subjects(subject_id),
          class:classes(form:forms(form_number))
        `)
      .eq('class_subject_id', classSubjectId)
      .single();
    return { data: compatClassSubject(data), error };
  },

  /** Active subject_form_offerings, optionally filtered by subject_id. */
  async getActiveSubjectFormOfferings(subjectId) {
    let query = supabase
      .from('subject_form_offerings')
      .select('*, form:forms(form_number)')
      .eq('is_active', true);

    if (subjectId) query = query.eq('subject_id', subjectId);

    const { data, error } = await query;
    return { data, error };
  },

  // ── TeacherLessonView ──────────────────────────────────────────────────────

  async getLessonWithContext(lessonId) {
    const { data } = await supabase
      .from('lessons')
      .select(`
          *,
          class_subject:class_subjects(
            *,
            subject:subjects(*),
            class:classes(
              *,
              form:forms(*)
            )
          )
        `)
      .eq('lesson_id', lessonId)
      .single();
    if (data && data.class_subject) {
      data.class_subject = compatClassSubject(data.class_subject);
    }
    return data;
  },

  // ── InteractiveVideoCreator / FlashcardCreator (lesson_content) ─────────────

  async getLessonContentById(contentId) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('content_id', contentId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateLessonContent(contentId, contentPayload) {
    const { data, error } = await supabase
      .from('lesson_content')
      .update({
        ...contentPayload,
        updated_at: new Date().toISOString()
      })
      .eq('content_id', contentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async insertLessonContent(contentPayload) {
    const { data, error } = await supabase
      .from('lesson_content')
      .insert([contentPayload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── TutorSettings ──────────────────────────────────────────────────────────

  async getActiveStudentAssignmentsByClass(classId) {
    const { data } = await supabase
      .from('student_class_assignments')
      .select('student:users(id, first_name, last_name, email)')
      .eq('class_id', classId)
      .eq('is_active', true);
    return data;
  },

  // ── LessonTemplateLibrary ──────────────────────────────────────────────────

  async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('subject_id, subject_name')
      .order('subject_name');
    if (error) throw error;
    return data;
  },

  async getForms() {
    const { data, error } = await supabase
      .from('forms')
      .select('form_id, form_name')
      .order('form_name');
    if (error) throw error;
    return data;
  },

  async insertLesson(lessonPayload) {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert(lessonPayload)
      .select()
      .single();
    if (lessonError) throw lessonError;
    return lesson;
  },

  async insertLessonContentItems(lessonContentItems) {
    const { error: contentInsertError } = await supabase
      .from('lesson_content')
      .insert(lessonContentItems);
    if (contentInsertError) throw contentInsertError;
  },

  async recordTemplateUsage(usage) {
    await supabase
      .from('lesson_template_usage')
      .insert(usage);
  },
};

export default teacherToolsService;
