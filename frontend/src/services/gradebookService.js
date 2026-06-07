import { supabase } from '../config/supabase';
import { compatClassSubject } from './subjectCompat';

/**
 * Gradebook / grading / attendance data access.
 *
 * Owns every Supabase query previously inlined in the Teacher grading screens
 * (Gradebook, GradeEntry, AttendanceMarking). Components consume these methods
 * instead of importing the Supabase client directly.
 */
export const gradebookService = {
  // ── Class-subject / assessment / lesson context ────────────────────────────

  async getClassSubject(classSubjectId) {
    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        *,
        class:classes(
          *,
          form:forms(*)
        ),
        subject:subjects(*)
      `)
      .eq('class_subject_id', classSubjectId)
      .single();
    if (error) throw error;
    return compatClassSubject(data);
  },

  async getAssessment(assessmentId) {
    const { data, error } = await supabase
      .from('subject_assessments')
      .select(`
        *,
        class_subject:class_subjects(
          *,
          class:classes(
            *,
            form:forms(*)
          ),
          subject:subjects(*)
        )
      `)
      .eq('assessment_id', assessmentId)
      .single();
    if (error) throw error;
    if (data) data.class_subject = compatClassSubject(data.class_subject);
    return data;
  },

  async getAssessments(classSubjectId, term = 'all') {
    let query = supabase
      .from('subject_assessments')
      .select('*')
      .eq('class_subject_id', classSubjectId)
      .order('due_date', { ascending: false });
    if (term !== 'all') {
      query = query.eq('term', parseInt(term));
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getLesson(lessonId) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        class_subject:class_subjects(
          *,
          class:classes(
            *,
            form:forms(*)
          )
        )
      `)
      .eq('lesson_id', lessonId)
      .single();
    if (error) throw error;
    return data;
  },

  async getLessons(classSubjectId) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_subject_id', classSubjectId)
      .order('lesson_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ── Roster ─────────────────────────────────────────────────────────────────

  /** Active students assigned to a class (returns the user records). */
  async getActiveStudentsByClass(classId) {
    const { data, error } = await supabase
      .from('student_class_assignments')
      .select(`
        *,
        student:users(*)
      `)
      .eq('class_id', classId)
      .eq('is_active', true);
    if (error) throw error;
    return (data || []).map(s => s.student).filter(Boolean);
  },

  // ── Grades ───────────────────────────────────────────────────────────────

  async getGrades(studentIds, assessmentIds) {
    if (!studentIds?.length || !assessmentIds?.length) return [];
    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .in('student_id', studentIds)
      .in('assessment_id', assessmentIds);
    if (error) throw error;
    return data || [];
  },

  async getGradesByAssessment(assessmentId) {
    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('assessment_id', assessmentId);
    if (error) throw error;
    return data || [];
  },

  /** Insert or update a single student's grade for an assessment. */
  async saveGrade(payload) {
    const { data: existing } = await supabase
      .from('student_grades')
      .select('grade_id')
      .eq('assessment_id', payload.assessment_id)
      .eq('student_id', payload.student_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('student_grades')
        .update(payload)
        .eq('grade_id', existing.grade_id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('student_grades')
        .insert(payload);
      if (error) throw error;
    }
  },

  // ── Attendance ─────────────────────────────────────────────────────────────

  async getAttendance(studentIds, lessonIds) {
    if (!studentIds?.length || !lessonIds?.length) return [];
    const { data, error } = await supabase
      .from('lesson_attendance')
      .select('*')
      .in('student_id', studentIds)
      .in('lesson_id', lessonIds);
    if (error) throw error;
    return data || [];
  },

  async getAttendanceByLesson(lessonId) {
    const { data, error } = await supabase
      .from('lesson_attendance')
      .select('*')
      .eq('lesson_id', lessonId);
    if (error) throw error;
    return data || [];
  },

  async upsertAttendance(records) {
    const { error } = await supabase
      .from('lesson_attendance')
      .upsert(records, { onConflict: 'lesson_id,student_id' });
    if (error) throw error;
  },
};

export default gradebookService;
