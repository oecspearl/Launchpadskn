import { supabase } from '../config/supabase';

export const reportService = {
  /**
   * Get overview stats for the reports dashboard
   */
  async getOverviewStats(institutionId = null) {
    const queries = [];

    // Students count
    let studentQ = supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'STUDENT').eq('is_active', true);
    if (institutionId) studentQ = studentQ.eq('institution_id', institutionId);
    queries.push(studentQ);

    // Teachers count
    let teacherQ = supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'INSTRUCTOR').eq('is_active', true);
    if (institutionId) teacherQ = teacherQ.eq('institution_id', institutionId);
    queries.push(teacherQ);

    // Classes count
    let classQ = supabase.from('classes').select('class_id', { count: 'exact', head: true }).eq('is_active', true);
    if (institutionId) {
      const { data: forms } = await supabase.from('forms').select('form_id').eq('school_id', institutionId).eq('is_active', true);
      if (forms?.length) classQ = classQ.in('form_id', forms.map(f => f.form_id));
      else return { students: 0, teachers: 0, classes: 0, subjects: 0, forms: 0 };
    }
    queries.push(classQ);

    // Subjects count
    let subjectQ = supabase.from('subjects').select('subject_id', { count: 'exact', head: true }).eq('is_active', true);
    if (institutionId) subjectQ = subjectQ.eq('school_id', institutionId);
    queries.push(subjectQ);

    // Forms count
    let formQ = supabase.from('forms').select('form_id', { count: 'exact', head: true }).eq('is_active', true);
    if (institutionId) formQ = formQ.eq('school_id', institutionId);
    queries.push(formQ);

    const results = await Promise.allSettled(queries);
    return {
      students: results[0]?.value?.count || 0,
      teachers: results[1]?.value?.count || 0,
      classes: results[2]?.value?.count || 0,
      subjects: results[3]?.value?.count || 0,
      forms: results[4]?.value?.count || 0
    };
  },

  /**
   * Get students grouped by form for the overview chart
   */
  async getStudentsByForm(institutionId = null) {
    let formsQuery = supabase.from('forms').select('form_id, form_name, form_number').eq('is_active', true).order('form_number');
    if (institutionId) formsQuery = formsQuery.eq('school_id', institutionId);
    const { data: forms } = await formsQuery;
    if (!forms?.length) return [];

    const formIds = forms.map(f => f.form_id);
    const { data: classes } = await supabase.from('classes').select('class_id, form_id').eq('is_active', true).in('form_id', formIds);
    if (!classes?.length) return forms.map(f => ({ name: f.form_name || `Form ${f.form_number}`, students: 0 }));

    const classIds = classes.map(c => c.class_id);
    const { data: assignments } = await supabase.from('student_class_assignments').select('class_id').eq('is_active', true).in('class_id', classIds);

    const classToForm = {};
    classes.forEach(c => { classToForm[c.class_id] = c.form_id; });

    const formCounts = {};
    formIds.forEach(id => { formCounts[id] = 0; });
    (assignments || []).forEach(a => {
      const fid = classToForm[a.class_id];
      if (fid) formCounts[fid]++;
    });

    return forms.map(f => ({
      name: f.form_name || `Form ${f.form_number}`,
      students: formCounts[f.form_id] || 0
    }));
  },

  /**
   * Get user distribution by role
   */
  async getUserDistribution(institutionId = null) {
    const roles = ['STUDENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'PARENT'];
    const results = [];
    for (const role of roles) {
      let q = supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', role).eq('is_active', true);
      if (institutionId) q = q.eq('institution_id', institutionId);
      const { count } = await q;
      results.push({ role, count: count || 0 });
    }
    return results;
  },

  /**
   * Get academic performance report — class averages per subject
   */
  async getAcademicPerformanceReport(institutionId, { term, formId, classId } = {}) {
    // Get relevant class_subjects
    let classSubjectQuery = supabase.from('class_subjects').select(`
      class_subject_id,
      class:classes(class_id, class_name, form_id, form:forms(form_name, form_number, school_id)),
      subject_offering:subject_form_offerings(subject:subjects(subject_id, subject_name))
    `);

    const { data: classSubjects } = await classSubjectQuery;
    if (!classSubjects?.length) return [];

    // Filter by institution/form/class
    let filtered = classSubjects.filter(cs => cs.class && cs.subject_offering?.subject);
    if (institutionId) filtered = filtered.filter(cs => String(cs.class?.form?.school_id) === String(institutionId));
    if (formId) filtered = filtered.filter(cs => String(cs.class?.form_id) === String(formId));
    if (classId) filtered = filtered.filter(cs => String(cs.class?.class_id) === String(classId));
    if (!filtered.length) return [];

    const csIds = filtered.map(cs => cs.class_subject_id);

    // Get assessments for these class_subjects
    let assessmentQuery = supabase.from('subject_assessments').select('assessment_id, class_subject_id, assessment_name, total_marks, term').in('class_subject_id', csIds);
    if (term) assessmentQuery = assessmentQuery.eq('term', term);
    const { data: assessments } = await assessmentQuery;
    if (!assessments?.length) return [];

    const assessmentIds = assessments.map(a => a.assessment_id);

    // Get grades
    const { data: grades } = await supabase.from('student_grades').select('assessment_id, marks_obtained, percentage').in('assessment_id', assessmentIds);

    // Aggregate: group grades by class_subject_id
    const assessmentToCS = {};
    assessments.forEach(a => { assessmentToCS[a.assessment_id] = a.class_subject_id; });

    const csGrades = {};
    (grades || []).forEach(g => {
      if (g.percentage == null) return;
      const csId = assessmentToCS[g.assessment_id];
      if (!csGrades[csId]) csGrades[csId] = [];
      csGrades[csId].push(g.percentage);
    });

    // Build result rows
    const csMap = {};
    filtered.forEach(cs => { csMap[cs.class_subject_id] = cs; });

    return Object.entries(csGrades).map(([csId, percentages]) => {
      const cs = csMap[csId];
      const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      return {
        className: cs?.class?.class_name || '',
        formName: cs?.class?.form?.form_name || `Form ${cs?.class?.form?.form_number}`,
        subjectName: cs?.subject_offering?.subject?.subject_name || '',
        averageGrade: Math.round(avg * 10) / 10,
        studentCount: percentages.length,
        highest: Math.max(...percentages),
        lowest: Math.min(...percentages)
      };
    }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  },

  /**
   * Get grade distribution (A/B/C/D/F counts)
   */
  async getGradeDistribution(institutionId, { term } = {}) {
    // Get all grades for the institution
    let assessmentQuery = supabase.from('subject_assessments').select(`
      assessment_id, term,
      class_subject:class_subjects(class:classes(form:forms(school_id)))
    `);
    if (term) assessmentQuery = assessmentQuery.eq('term', term);
    const { data: assessments } = await assessmentQuery;

    let filtered = (assessments || []).filter(a => a.class_subject?.class?.form);
    if (institutionId) filtered = filtered.filter(a => String(a.class_subject.class.form.school_id) === String(institutionId));
    if (!filtered.length) return { A: 0, B: 0, C: 0, D: 0, F: 0 };

    const aIds = filtered.map(a => a.assessment_id);
    const { data: grades } = await supabase.from('student_grades').select('percentage').in('assessment_id', aIds);

    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    (grades || []).forEach(g => {
      if (g.percentage == null) return;
      if (g.percentage >= 80) dist.A++;
      else if (g.percentage >= 70) dist.B++;
      else if (g.percentage >= 60) dist.C++;
      else if (g.percentage >= 50) dist.D++;
      else dist.F++;
    });
    return dist;
  },

  /**
   * Get top/bottom students by average grade
   */
  async getStudentRankings(institutionId, { term, limit = 10 } = {}) {
    let studentQuery = supabase.from('users').select('user_id, name, email').eq('role', 'STUDENT').eq('is_active', true);
    if (institutionId) studentQuery = studentQuery.eq('institution_id', institutionId);
    const { data: students } = await studentQuery;
    if (!students?.length) return { top: [], bottom: [] };

    const studentIds = students.map(s => s.user_id);

    let gradeQuery = supabase.from('student_grades').select('student_id, percentage, assessment:subject_assessments(term)').in('student_id', studentIds);
    const { data: grades } = await gradeQuery;

    // Filter by term if specified
    let filtered = (grades || []).filter(g => g.percentage != null);
    if (term) filtered = filtered.filter(g => g.assessment?.term === Number(term));

    // Group by student
    const studentGrades = {};
    filtered.forEach(g => {
      if (!studentGrades[g.student_id]) studentGrades[g.student_id] = [];
      studentGrades[g.student_id].push(g.percentage);
    });

    const studentMap = {};
    students.forEach(s => { studentMap[s.user_id] = s; });

    const ranked = Object.entries(studentGrades).map(([sid, pcts]) => ({
      studentId: sid,
      name: studentMap[sid]?.name || studentMap[sid]?.email || 'Unknown',
      average: Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10,
      assessmentCount: pcts.length
    })).sort((a, b) => b.average - a.average);

    return {
      top: ranked.slice(0, limit),
      bottom: ranked.slice(-limit).reverse()
    };
  },

  /**
   * Get attendance report by class
   */
  async getAttendanceByClass(institutionId, { startDate, endDate } = {}) {
    // Get forms and classes for the institution
    let formsQuery = supabase.from('forms').select('form_id').eq('is_active', true);
    if (institutionId) formsQuery = formsQuery.eq('school_id', institutionId);
    const { data: forms } = await formsQuery;
    if (!forms?.length) return [];

    const formIds = forms.map(f => f.form_id);
    const { data: classes } = await supabase.from('classes').select('class_id, class_name, form_id, form:forms(form_name, form_number)').eq('is_active', true).in('form_id', formIds);
    if (!classes?.length) return [];

    const classIds = classes.map(c => c.class_id);

    // Get lessons for these classes
    let lessonQuery = supabase.from('lessons').select('lesson_id, class_subject:class_subjects(class_id)').in('class_subject_id',
      (await supabase.from('class_subjects').select('class_subject_id').in('class_id', classIds)).data?.map(cs => cs.class_subject_id) || []
    );
    if (startDate) lessonQuery = lessonQuery.gte('lesson_date', startDate);
    if (endDate) lessonQuery = lessonQuery.lte('lesson_date', endDate);
    const { data: lessons } = await lessonQuery;
    if (!lessons?.length) return classes.map(c => ({ className: c.class_name, formName: c.form?.form_name || `Form ${c.form?.form_number}`, totalRecords: 0, present: 0, absent: 0, late: 0, rate: 0 }));

    const lessonIds = lessons.map(l => l.lesson_id);
    const lessonToClass = {};
    lessons.forEach(l => { if (l.class_subject) lessonToClass[l.lesson_id] = l.class_subject.class_id; });

    // Get attendance
    const { data: attendance } = await supabase.from('lesson_attendance').select('lesson_id, status').in('lesson_id', lessonIds);

    // Aggregate by class
    const classStats = {};
    classIds.forEach(id => { classStats[id] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }; });

    (attendance || []).forEach(a => {
      const cid = lessonToClass[a.lesson_id];
      if (!cid || !classStats[cid]) return;
      classStats[cid].total++;
      const status = (a.status || '').toLowerCase();
      if (status === 'present') classStats[cid].present++;
      else if (status === 'absent') classStats[cid].absent++;
      else if (status === 'late') classStats[cid].late++;
      else if (status === 'excused') classStats[cid].excused++;
    });

    const classMap = {};
    classes.forEach(c => { classMap[c.class_id] = c; });

    return Object.entries(classStats)
      .filter(([, s]) => s.total > 0)
      .map(([cid, s]) => {
        const c = classMap[cid];
        const rate = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 1000) / 10 : 0;
        return {
          className: c?.class_name || '',
          formName: c?.form?.form_name || `Form ${c?.form?.form_number}`,
          totalRecords: s.total,
          present: s.present,
          absent: s.absent,
          late: s.late,
          excused: s.excused,
          rate
        };
      })
      .sort((a, b) => a.formName.localeCompare(b.formName) || a.className.localeCompare(b.className));
  },

  /**
   * Get forms list for filter dropdowns
   */
  async getForms(institutionId) {
    let q = supabase.from('forms').select('form_id, form_name, form_number').eq('is_active', true).order('form_number');
    if (institutionId) q = q.eq('school_id', institutionId);
    const { data } = await q;
    return data || [];
  },

  /**
   * Get classes for a form (for filter dropdowns)
   */
  async getClassesByForm(formId) {
    const { data } = await supabase.from('classes').select('class_id, class_name, class_code').eq('form_id', formId).eq('is_active', true).order('class_name');
    return data || [];
  }
};
