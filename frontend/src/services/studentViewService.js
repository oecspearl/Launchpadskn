import { supabase } from '../config/supabase';
import { compatClassSubject } from './subjectCompat';

/**
 * Student-facing view data access.
 *
 * Owns every Supabase query previously inlined in the Student view screens
 * (SubjectView, StudentQuizView, AssignmentSubmission, LessonViewStream,
 * InteractiveBookPlayer). Components consume these methods instead of importing
 * the Supabase client directly.
 */
export const studentViewService = {
  // ── SubjectView ────────────────────────────────────────────────────────────

  async getClassSubjectWithTeacher(classSubjectId) {
    const { data: classSubjectData, error: csError } = await supabase
      .from('class_subjects')
      .select(`
          *,
          subject:subjects(*),
          class:classes(
            *,
            form:forms(*)
          ),
          teacher:users!class_subjects_teacher_id_fkey(*)
        `)
      .eq('id', classSubjectId)
      .single();

    if (csError) throw csError;
    return compatClassSubject(classSubjectData);
  },

  async getPublishedAssignmentContentByLessonIds(lessonIds) {
    const { data, error: lcError } = await supabase
      .from('lesson_content')
      .select(`
              *,
              lesson:lessons(
                lesson_id:id,
                lesson_date:date,
                homework_due_date,
                lesson_title:title,
                class_subject_id
              )
            `)
      .eq('content_type', 'ASSIGNMENT')
      .eq('is_published', true)
      .in('lesson_id', lessonIds);

    return { data, error: lcError };
  },

  // ── StudentQuizView ──────────────────────────────────────────────────────────

  async getUserByAuthId(userIdToLookup) {
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('id', userIdToLookup)
      .maybeSingle();

    return { data: userProfile, error: userError };
  },

  // ── AssignmentSubmission ─────────────────────────────────────────────────────

  async getAssessmentById(assessmentId) {
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('subject_assessments')
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
      .eq('assessment_id', assessmentId)
      .single();

    if (assessmentData) assessmentData.class_subject = compatClassSubject(assessmentData.class_subject);
    return { data: assessmentData, error: assessmentError };
  },

  async getSubmission(assessmentId, studentId) {
    const { data: submissionData } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .maybeSingle();

    return { data: submissionData };
  },

  async uploadSubmissionFile(bucketName, filePath, selectedFile) {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });

    return { data: uploadData, error: uploadError };
  },

  getSubmissionFilePublicUrl(bucketName, filePath) {
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { data: urlData };
  },

  async updateSubmission(submissionData, submissionId) {
    const { error: updateError } = await supabase
      .from('student_submissions')
      .update(submissionData)
      .eq('submission_id', submissionId);

    return { error: updateError };
  },

  async insertSubmission(submissionData) {
    const { error: insertError } = await supabase
      .from('student_submissions')
      .insert(submissionData);

    return { error: insertError };
  },

  // ── LessonViewStream ─────────────────────────────────────────────────────────

  async getLessonWithContent(lessonId) {
    const { data: lessonData, error } = await supabase
      .from('lessons')
      .select(`
          *,
          class_subject:class_subjects(
            *,
            subject:subjects(*),
            class:classes(*, form:forms(*)),
            teacher:users!class_subjects_teacher_id_fkey(*)
          ),
          content:lesson_content(*)
        `)
      .eq('id', lessonId)
      .single();

    if (error) throw error;
    if (lessonData) lessonData.class_subject = compatClassSubject(lessonData.class_subject);
    return lessonData;
  },

  // ── InteractiveBookPlayer ────────────────────────────────────────────────────

  async getLearnerProgress(userId, contentId) {
    const { data: existing } = await supabase
      .from('learner_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    return { data: existing };
  },

  async updateLearnerProgress(progressData, userId, contentId) {
    await supabase
      .from('learner_progress')
      .update(progressData)
      .eq('user_id', userId)
      .eq('content_id', contentId);
  },

  async insertLearnerProgress(progressData) {
    await supabase
      .from('learner_progress')
      .insert([progressData]);
  },

  async getLessonContentById(contentId) {
    const { data, error } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('id', contentId)
      .single();
    if (error) throw error;
    return data;
  },
};

export default studentViewService;
