import { supabase } from '../config/supabase';

/**
 * Grade letter from percentage
 */
function getGradeLetter(pct) {
  if (pct == null) return '';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export const reportCardService = {
  /**
   * Generate report cards for all students in a class for a given term.
   * Creates DRAFT report cards with grades and attendance aggregated from existing data.
   */
  async generateReportCards(classId, academicYear, term, generatedBy, institutionId) {
    // 1. Get students in this class
    const { data: assignments } = await supabase
      .from('student_class_assignments')
      .select('student_id, student:users(user_id, name, email)')
      .eq('class_id', classId)
      .eq('is_active', true);

    if (!assignments?.length) throw new Error('No students found in this class');

    // 2. Get class info
    const { data: classInfo } = await supabase
      .from('classes')
      .select('class_id, class_name, form_id, form:forms(form_id, form_name, form_number)')
      .eq('class_id', classId)
      .single();

    if (!classInfo) throw new Error('Class not found');

    // 3. Get class_subjects with teacher info
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select(`
        class_subject_id,
        teacher_id,
        teacher:users!class_subjects_teacher_id_fkey(user_id, name),
        subject_offering:subject_form_offerings(
          subject:subjects(subject_id, subject_name)
        )
      `)
      .eq('class_id', classId);

    if (!classSubjects?.length) throw new Error('No subjects assigned to this class');

    const csIds = classSubjects.map(cs => cs.class_subject_id);

    // 4. Get all assessments for this class, term
    const { data: assessments } = await supabase
      .from('subject_assessments')
      .select('assessment_id, class_subject_id, assessment_type, total_marks, weight, term')
      .in('class_subject_id', csIds)
      .eq('term', term);

    const assessmentIds = (assessments || []).map(a => a.assessment_id);

    // 5. Get all grades
    let allGrades = [];
    if (assessmentIds.length) {
      const { data: grades } = await supabase
        .from('student_grades')
        .select('assessment_id, student_id, marks_obtained, percentage')
        .in('assessment_id', assessmentIds);
      allGrades = grades || [];
    }

    // Build lookup: assessmentId -> class_subject_id + type
    const assessmentMap = {};
    (assessments || []).forEach(a => {
      assessmentMap[a.assessment_id] = a;
    });

    // Build lookup: class_subject_id -> subject info
    const csMap = {};
    classSubjects.forEach(cs => {
      csMap[cs.class_subject_id] = cs;
    });

    // 6. Get attendance for all students (via lessons linked to class_subjects)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('lesson_id, class_subject_id')
      .in('class_subject_id', csIds);

    const lessonIds = (lessons || []).map(l => l.lesson_id);
    let allAttendance = [];
    if (lessonIds.length) {
      const { data: attendance } = await supabase
        .from('lesson_attendance')
        .select('lesson_id, student_id, status')
        .in('lesson_id', lessonIds);
      allAttendance = attendance || [];
    }

    // 7. Check for existing draft report cards (prevent duplicates)
    const { data: existing } = await supabase
      .from('report_cards')
      .select('report_card_id, student_id')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    const existingStudentIds = new Set((existing || []).map(e => String(e.student_id)));

    // 8. Generate per student
    const studentIds = assignments.map(a => a.student_id);
    const newStudents = studentIds.filter(sid => !existingStudentIds.has(String(sid)));

    if (!newStudents.length && existing?.length) {
      throw new Error(`Report cards already exist for this class/term. ${existing.length} report cards found.`);
    }

    const reportCards = [];

    for (const studentId of newStudents) {
      // Aggregate grades by subject
      const subjectGrades = {};

      allGrades
        .filter(g => String(g.student_id) === String(studentId))
        .forEach(g => {
          const assessment = assessmentMap[g.assessment_id];
          if (!assessment) return;
          const csId = assessment.class_subject_id;
          if (!subjectGrades[csId]) subjectGrades[csId] = { coursework: [], exam: [] };

          if (assessment.assessment_type === 'EXAM' || assessment.assessment_type === 'MOCK_EXAM') {
            subjectGrades[csId].exam.push(g.percentage);
          } else {
            subjectGrades[csId].coursework.push(g.percentage);
          }
        });

      // Build grade rows per subject
      const gradeRows = [];
      let totalFinalMark = 0;
      let subjectCount = 0;

      classSubjects.forEach(cs => {
        const sg = subjectGrades[cs.class_subject_id] || { coursework: [], exam: [] };
        const courseworkAvg = sg.coursework.length
          ? Math.round((sg.coursework.reduce((a, b) => a + b, 0) / sg.coursework.length) * 10) / 10
          : null;
        const examMark = sg.exam.length
          ? Math.round((sg.exam.reduce((a, b) => a + b, 0) / sg.exam.length) * 10) / 10
          : null;

        // Final mark: if both exist, 60% coursework + 40% exam; otherwise whichever exists
        let finalMark = null;
        if (courseworkAvg != null && examMark != null) {
          finalMark = Math.round((courseworkAvg * 0.6 + examMark * 0.4) * 10) / 10;
        } else if (courseworkAvg != null) {
          finalMark = courseworkAvg;
        } else if (examMark != null) {
          finalMark = examMark;
        }

        if (finalMark != null) {
          totalFinalMark += finalMark;
          subjectCount++;
        }

        gradeRows.push({
          subject_id: cs.subject_offering?.subject?.subject_id,
          subject_name: cs.subject_offering?.subject?.subject_name || '',
          teacher_id: cs.teacher_id,
          teacher_name: cs.teacher?.name || '',
          coursework_avg: courseworkAvg,
          exam_mark: examMark,
          final_mark: finalMark,
          grade_letter: getGradeLetter(finalMark),
          effort_grade: null,
          teacher_comment: null
        });
      });

      const overallAvg = subjectCount > 0 ? Math.round((totalFinalMark / subjectCount) * 10) / 10 : null;

      // Attendance summary
      const studentAtt = allAttendance.filter(a => String(a.student_id) === String(studentId));
      const present = studentAtt.filter(a => a.status?.toUpperCase() === 'PRESENT').length;
      const absent = studentAtt.filter(a => a.status?.toUpperCase() === 'ABSENT').length;
      const late = studentAtt.filter(a => a.status?.toUpperCase() === 'LATE').length;
      const totalDays = studentAtt.length;
      const attPct = totalDays > 0 ? Math.round(((present + late) / totalDays) * 1000) / 10 : null;

      reportCards.push({
        student_id: studentId,
        institution_id: institutionId,
        academic_year: academicYear,
        term,
        class_id: classId,
        form_id: classInfo.form_id,
        status: 'DRAFT',
        attendance_percentage: attPct,
        days_present: present,
        days_absent: absent,
        days_late: late,
        total_school_days: totalDays,
        overall_average: overallAvg,
        generated_by: generatedBy,
        grades: gradeRows
      });
    }

    // 9. Insert report cards and grades
    const results = [];
    for (const rc of reportCards) {
      const grades = rc.grades;
      delete rc.grades;

      const { data: inserted, error } = await supabase
        .from('report_cards')
        .insert(rc)
        .select()
        .single();

      if (error) {
        console.error('Failed to insert report card:', error);
        continue;
      }

      // Insert grade rows
      if (grades.length) {
        const gradeInserts = grades.map(g => ({
          ...g,
          report_card_id: inserted.report_card_id
        }));
        await supabase.from('report_card_grades').insert(gradeInserts);
      }

      results.push(inserted);
    }

    // 10. Calculate class ranks
    if (results.length) {
      const allCards = [...results];
      allCards.sort((a, b) => (b.overall_average || 0) - (a.overall_average || 0));
      for (let i = 0; i < allCards.length; i++) {
        await supabase
          .from('report_cards')
          .update({ class_rank: i + 1 })
          .eq('report_card_id', allCards[i].report_card_id);
      }
    }

    return { generated: results.length, total: studentIds.length };
  },

  /**
   * Get report cards for a class + term
   */
  async getReportCardsByClass(classId, academicYear, term) {
    let query = supabase
      .from('report_cards')
      .select(`
        *,
        student:users!report_cards_student_id_fkey(user_id, name, email)
      `)
      .eq('class_id', classId)
      .order('class_rank', { ascending: true });

    if (academicYear) query = query.eq('academic_year', academicYear);
    if (term) query = query.eq('term', term);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single report card with all grades
   */
  async getReportCard(reportCardId) {
    const { data, error } = await supabase
      .from('report_cards')
      .select(`
        *,
        student:users!report_cards_student_id_fkey(user_id, name, email),
        class:classes(class_name),
        form:forms(form_name, form_number)
      `)
      .eq('report_card_id', reportCardId)
      .single();

    if (error) throw error;

    const { data: grades } = await supabase
      .from('report_card_grades')
      .select('*')
      .eq('report_card_id', reportCardId)
      .order('subject_name');

    return { ...data, grades: grades || [] };
  },

  /**
   * Get report cards for a student (parent/student view)
   */
  async getReportCardsByStudent(studentId) {
    const { data, error } = await supabase
      .from('report_cards')
      .select(`
        *,
        class:classes(class_name),
        form:forms(form_name, form_number)
      `)
      .eq('student_id', studentId)
      .eq('status', 'PUBLISHED')
      .order('academic_year', { ascending: false })
      .order('term', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update report card (admin edits: principal comment, conduct, next term date)
   */
  async updateReportCard(reportCardId, updates) {
    const allowed = ['principal_comment', 'form_teacher_comment', 'conduct_grade', 'next_term_begins'];
    const filtered = {};
    allowed.forEach(k => { if (updates[k] !== undefined) filtered[k] = updates[k]; });
    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('report_cards')
      .update(filtered)
      .eq('report_card_id', reportCardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update subject comment and effort grade (teacher)
   */
  async updateSubjectComment(gradeId, teacherComment, effortGrade) {
    const { data, error } = await supabase
      .from('report_card_grades')
      .update({
        teacher_comment: teacherComment,
        effort_grade: effortGrade,
        updated_at: new Date().toISOString()
      })
      .eq('id', gradeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Change status of report cards (DRAFT → REVIEW → PUBLISHED)
   */
  async updateStatus(reportCardIds, newStatus, userId) {
    const updates = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'PUBLISHED') {
      updates.published_by = userId;
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('report_cards')
      .update(updates)
      .in('report_card_id', reportCardIds);

    if (error) throw error;
    return true;
  },

  /**
   * Get report cards in REVIEW status that need a specific teacher's comments
   */
  async getTeacherReviewCards(teacherId) {
    // Get grades where this teacher is listed and report card is in REVIEW
    const { data: grades, error } = await supabase
      .from('report_card_grades')
      .select(`
        *,
        report_card:report_cards(
          report_card_id, student_id, academic_year, term, status, class_id,
          student:users!report_cards_student_id_fkey(user_id, name, email),
          class:classes(class_name),
          form:forms(form_name, form_number)
        )
      `)
      .eq('teacher_id', teacherId);

    if (error) throw error;

    // Filter to only REVIEW status
    const reviewGrades = (grades || []).filter(g => g.report_card?.status === 'REVIEW');

    // Group by report card
    const cardMap = {};
    reviewGrades.forEach(g => {
      const rcId = g.report_card?.report_card_id;
      if (!rcId) return;
      if (!cardMap[rcId]) {
        cardMap[rcId] = {
          ...g.report_card,
          subjects: []
        };
      }
      cardMap[rcId].subjects.push({
        id: g.id,
        subject_name: g.subject_name,
        final_mark: g.final_mark,
        grade_letter: g.grade_letter,
        effort_grade: g.effort_grade,
        teacher_comment: g.teacher_comment
      });
    });

    return Object.values(cardMap);
  },

  /**
   * Delete draft report cards for a class/term (to allow regeneration)
   */
  async deleteDraftReportCards(classId, academicYear, term) {
    const { data: cards } = await supabase
      .from('report_cards')
      .select('report_card_id')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .eq('status', 'DRAFT');

    if (!cards?.length) return 0;

    const ids = cards.map(c => c.report_card_id);
    const { error } = await supabase
      .from('report_cards')
      .delete()
      .in('report_card_id', ids);

    if (error) throw error;
    return ids.length;
  },

  /**
   * Get forms and classes for dropdown filters
   */
  async getForms(institutionId) {
    let q = supabase.from('forms').select('form_id, form_name, form_number').eq('is_active', true).order('form_number');
    if (institutionId) q = q.eq('school_id', institutionId);
    const { data } = await q;
    return data || [];
  },

  async getClassesByForm(formId) {
    const { data } = await supabase
      .from('classes')
      .select('class_id, class_name, class_code')
      .eq('form_id', formId)
      .eq('is_active', true)
      .order('class_name');
    return data || [];
  }
};
