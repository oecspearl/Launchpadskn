import { supabase } from '../config/supabase';
import { ROLES } from '../constants/roles';
import { compatClassSubject } from './subjectCompat';
import { compatLessonRead, compatLessonWrite, compatLessonContentRead } from './lessonCompat';

export const classService = {
    // ============================================
    // CLASSES
    // ============================================

    async getClassesByInstitution(institutionId) {
        const { data, error } = await supabase
            .from('classes')
            .select(`
        *,
        form:forms!inner(*)
      `)
            .eq('form.institution_id', institutionId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getClassesByForm(formId) {
        const { data, error } = await supabase
            .from('classes')
            .select('*, form_tutor:users!classes_form_tutor_id_fkey(first_name, last_name, email)')
            .eq('form_id', formId)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getClasses(userRole = null, userId = null) {
        let query = supabase
            .from('classes')
            .select(`
        *,
        form:forms(*),
        form_tutor:users!classes_form_tutor_id_fkey(first_name, last_name, email),
        instructors:class_instructors(
          instructor:users(first_name, last_name, email, id)
        )
      `)
            .eq('is_active', true);

        if (userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN || userRole === ROLES.CURRICULUM_DESIGNER) {
            // Admins see all classes
        } else if (userRole === ROLES.INSTRUCTOR || userRole === ROLES.TEACHER) {
            if (userId) {
                const { data: instructorClasses } = await supabase
                    .from('class_instructors')
                    .select('class_id')
                    .eq('instructor_id', userId)
                    .eq('is_active', true);

                const classIds = instructorClasses?.map(c => c.class_id) || [];

                const { data: tutorClasses } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('form_tutor_id', userId)
                    .eq('is_active', true);

                const tutorClassIds = tutorClasses?.map(c => c.id) || [];
                const allClassIds = [...new Set([...classIds, ...tutorClassIds])];

                if (allClassIds.length > 0) {
                    query = query.in('id', allClassIds);
                } else {
                    // No classes for this instructor; return none.
                    query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
                }
            }
        } else if (userRole === ROLES.STUDENT) {
            if (userId) {
                const { data: enrollments } = await supabase
                    .from('student_class_assignments')
                    .select('class_id')
                    .eq('student_id', userId)
                    .eq('is_active', true);

                const enrolledClassIds = enrollments?.map(e => e.class_id) || [];

                if (enrolledClassIds.length > 0) {
                    query = query.in('id', enrolledClassIds);
                } else {
                    // No enrollments; return none.
                    query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
                }
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getPublishedClasses(filters = {}) {
        let query = supabase
            .from('classes')
            .select(`
        *,
        form:forms(*),
        form_tutor:users!classes_form_tutor_id_fkey(first_name, last_name, email),
        instructors:class_instructors(
          instructor:users(first_name, last_name, email)
        )
      `)
            .eq('is_active', true);

        if (filters.form_id) {
            query = query.eq('form_id', filters.form_id);
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getClassById(classId) {
        const { data, error } = await supabase
            .from('classes')
            .select(`
        *,
        form_tutor:users!classes_form_tutor_id_fkey(*),
        form:forms(*),
        instructors:class_instructors(
          instructor:users(first_name, last_name, email, id, role),
          role
        ),
        students:student_class_assignments(
          student:users(first_name, last_name, email, id)
        )
      `)
            .eq('id', classId)
            .single();

        if (error) throw error;
        return data;
    },

    async createClass(classData) {
        const { data, error } = await supabase
            .from('classes')
            .insert(classData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateClass(classId, updates) {
        const { data, error } = await supabase
            .from('classes')
            .update({ ...updates })
            .eq('id', classId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getClassRoster(classId) {
        const { data, error } = await supabase
            .from('student_class_assignments')
            .select(`
        *,
        student:users(*)
      `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) throw error;
        return data;
    },

    async getAllStudentAssignments(filters = {}) {
        let query;

        if (filters.institutionId) {
            // Institution-scoped: use inner join to filter by institution via forms.school_id
            query = supabase
                .from('student_class_assignments')
                .select(`
        *,
        student:users(*),
        class:classes!inner(
          *,
          form:forms!inner(*)
        )
      `)
                .eq('is_active', true)
                .eq('class.form.institution_id', filters.institutionId);
        } else {
            query = supabase
                .from('student_class_assignments')
                .select(`
        *,
        student:users(*),
        class:classes(
          *,
          form:forms(*)
        )
      `)
                .eq('is_active', true);
        }

        if (filters.classId && filters.classId !== 'all') {
            query = query.eq('class_id', filters.classId);
        }

        const { data, error } = await query.order('academic_year', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getStudentClassAssignment(studentId) {
        const { data, error } = await supabase
            .from('student_class_assignments')
            .select(`
                *,
                class:classes(
                    *,
                    form:forms(*),
                    form_tutor:users!classes_form_tutor_id_fkey(first_name, last_name, email)
                )
            `)
            .eq('student_id', studentId)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Get paginated lessons for a specific class subject.
     * @param {string|number} classSubjectId - The ID of the class_subject.
     * @param {number} page - 1‑based page number (default 1).
     * @param {number} pageSize - Number of lessons per page (default 20).
     * @returns {{ lessons: any[], total: number }}
     */
    async getLessonsByClassSubjectPaginated(classSubjectId, page = 1, pageSize = 20) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact' })
            .eq('class_subject_id', classSubjectId)
            .order('date', { ascending: true })
            .range(from, to);
        if (error) throw error;
        return { lessons: (data || []).map(compatLessonRead), total: count || 0 };
    },


    async assignStudentToClass(studentId, classId, academicYear) {
        const { data, error } = await supabase
            .from('student_class_assignments')
            .insert({
                student_id: studentId,
                class_id: classId,
                academic_year: academicYear,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async enrollStudentInClass(studentId, classId, academicYear) {
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('id, capacity')
            .eq('id', classId)
            .single();

        if (classError) throw classError;

        // Enrollment is derived from student_class_assignments; check live count
        // against capacity instead of a non-existent current_enrollment column.
        const currentEnrollment = await this.updateClassEnrollmentCount(classId);
        if (classData.capacity != null && currentEnrollment >= classData.capacity) {
            throw new Error('Class is at full capacity');
        }

        const { data: existing } = await supabase
            .from('student_class_assignments')
            .select('id, is_active')
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .maybeSingle();

        if (existing) {
            if (existing.is_active) {
                throw new Error('Already enrolled in this class');
            } else {
                const { data, error } = await supabase
                    .from('student_class_assignments')
                    .update({
                        is_active: true,
                        academic_year: academicYear
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                await this.updateClassEnrollmentCount(classId);
                return data;
            }
        }

        const { data, error } = await supabase
            .from('student_class_assignments')
            .insert({
                student_id: studentId,
                class_id: classId,
                academic_year: academicYear,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        await this.updateClassEnrollmentCount(classId);
        return data;
    },

    async dropEnrollment(studentId, classId) {
        const { data, error } = await supabase
            .from('student_class_assignments')
            .update({
                is_active: false
            })
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .select()
            .single();

        if (error) throw error;
        await this.updateClassEnrollmentCount(classId);
        return data;
    },

    async checkEnrollment(studentId, classId) {
        const { data, error } = await supabase
            .from('student_class_assignments')
            .select('id, is_active')
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .maybeSingle();

        if (error) throw error;
        return data && data.is_active ? data : null;
    },

    async updateClassEnrollmentCount(classId) {
        // The classes table has no current_enrollment column; enrollment is
        // derived from student_class_assignments. Return the live count instead
        // of writing a non-existent column.
        const { count } = await supabase
            .from('student_class_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId)
            .eq('is_active', true);
        return count || 0;
    },

    async removeStudentFromClass(studentId, classId) {
        const { data, error } = await supabase
            .from('student_class_assignments')
            .update({ is_active: false })
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .select()
            .single();

        if (error) throw error;
        await this.updateClassEnrollmentCount(classId);
        return data;
    },

    async addClassInstructor(classId, instructorId, role = 'instructor') {
        const { data, error } = await supabase
            .from('class_instructors')
            .insert({
                class_id: classId,
                instructor_id: instructorId,
                role: role,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async removeClassInstructor(classId, instructorId) {
        const { data, error } = await supabase
            .from('class_instructors')
            .update({ is_active: false })
            .eq('class_id', classId)
            .eq('instructor_id', instructorId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getClassInstructors(classId) {
        const { data, error } = await supabase
            .from('class_instructors')
            .select(`
        *,
        instructor:users(first_name, last_name, email, id, role)
      `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
    },

    async publishClass(classId) {
        // The classes table has no published/updated_at columns; classes are not
        // publish-gated. Return the class row unchanged.
        const { data, error } = await supabase
            .from('classes')
            .select()
            .eq('id', classId)
            .single();

        if (error) throw error;
        return data;
    },

    async unpublishClass(classId) {
        // No published column to toggle; return the class row unchanged.
        const { data, error } = await supabase
            .from('classes')
            .select()
            .eq('id', classId)
            .single();

        if (error) throw error;
        return data;
    },

    async toggleClassFeatured(classId) {
        // No featured column to toggle; return the class row unchanged.
        const { data, error } = await supabase
            .from('classes')
            .select()
            .eq('id', classId)
            .single();

        if (error) throw error;
        return data;
    },

    async getSubjectsByClass(classId) {
        const { data, error } = await supabase
            .from('class_subjects')
            .select(`
        *,
        subject:subjects(*),
        teacher:users!class_subjects_teacher_id_fkey(*)
      `)
            .eq('class_id', classId);

        if (error) throw error;
        return data;
    },

    async getAllClassSubjects(filters = {}) {
        let query;

        if (filters.institutionId) {
            // Institution-scoped: filter via class → form → school_id
            query = supabase
                .from('class_subjects')
                .select(`
        *,
        class:classes!inner(
          *,
          form:forms!inner(*)
        ),
        subject:subjects(*),
        teacher:users!class_subjects_teacher_id_fkey(first_name, last_name, email, profile_image_url)
      `)
                .eq('class.form.institution_id', filters.institutionId);
        } else {
            query = supabase
                .from('class_subjects')
                .select(`
        *,
        class:classes(
          *,
          form:forms(*)
        ),
        subject:subjects(*),
        teacher:users!class_subjects_teacher_id_fkey(first_name, last_name, email, profile_image_url)
      `);
        }

        if (filters.classId && filters.classId !== 'all') {
            query = query.eq('class_id', filters.classId);
        }

        const { data, error } = await query.order('class_id');

        if (error) throw error;
        return (data || []).map(compatClassSubject);
    },

    async assignSubjectToClass(classId, subjectId, teacherId) {
        if (!classId || !subjectId) {
            throw new Error('Invalid class or subject ID');
        }

        // class_subjects links directly to subjects via subject_id (no offering id)
        const insertData = {
            class_id: classId,
            subject_id: subjectId
        };

        if (teacherId) {
            insertData.teacher_id = teacherId;
        }

        const { data, error } = await supabase
            .from('class_subjects')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('This subject is already assigned to this class');
            }
            if (error.code === '23503') {
                throw new Error('Invalid class, subject offering, or teacher selected');
            }
            throw error;
        }
        return data;
    },

    async removeSubjectFromClass(classSubjectId) {
        const { error } = await supabase
            .from('class_subjects')
            .delete()
            .eq('id', classSubjectId);

        if (error) throw error;
    },

    async getClassesByTeacher(teacherId) {
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
            .eq('teacher_id', teacherId);

        if (error) throw error;
        // The live schema links class_subjects -> subjects directly via
        // subject_id (there is no subject_form_offerings relationship).
        // Re-expose the legacy `subject_offering.subject` shape so existing
        // callers keep working alongside the new direct `subject`.
        return (data || []).map(row => ({
            ...row,
            subject_offering: row.subject ? { subject: row.subject } : null,
        }));
    },

    // ============================================
    // LESSONS
    // ============================================

    async getLessonsByClassSubject(classSubjectId) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*, content:lesson_content(*)')
            .eq('class_subject_id', classSubjectId)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        if (data && Array.isArray(data)) {
            data.forEach(lesson => {
                if (lesson.date) {
                    let dateStr = String(lesson.date);
                    if (dateStr.includes('T')) {
                        dateStr = dateStr.split('T')[0];
                    } else if (dateStr.length > 10) {
                        dateStr = dateStr.substring(0, 10);
                    }
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateStr)) {
                        lesson.date = dateStr;
                    }
                }
            });
        }

        return (data || []).map(compatLessonRead);
    },

    async getLessonsByStudent(studentId, startDate, endDate) {
        const { data: classAssignment } = await supabase
            .from('student_class_assignments')
            .select('class_id')
            .eq('student_id', studentId)
            .eq('is_active', true)
            .maybeSingle();

        if (!classAssignment) return [];

        const { data: classSubjects } = await supabase
            .from('class_subjects')
            .select('id')
            .eq('class_id', classAssignment.class_id);

        if (!classSubjects || classSubjects.length === 0) return [];

        const classSubjectIds = classSubjects.map(cs => cs.id);

        let query = supabase
            .from('lessons')
            .select(`
        *,
        class_subject:class_subjects(
          subject:subjects(*),
          class:classes(*)
        )
      `)
            .in('class_subject_id', classSubjectIds);

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data, error } = await query
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        if (data && Array.isArray(data)) {
            data.forEach(lesson => {
                if (lesson.date) {
                    let dateStr = String(lesson.date);
                    if (dateStr.includes('T')) {
                        dateStr = dateStr.split('T')[0];
                    } else if (dateStr.length > 10) {
                        dateStr = dateStr.substring(0, 10);
                    }
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateStr)) {
                        lesson.date = dateStr;
                    }
                }
                lesson.class_subject = compatClassSubject(lesson.class_subject);
                Object.assign(lesson, compatLessonRead(lesson));
            });
        }

        return data || [];
    },

    async getLessonsByTeacher(teacherId, startDate, endDate) {
        const { data: classSubjects } = await supabase
            .from('class_subjects')
            .select('id')
            .eq('teacher_id', teacherId);

        if (!classSubjects || classSubjects.length === 0) return [];

        const classSubjectIds = classSubjects.map(cs => cs.id);

        let query = supabase
            .from('lessons')
            .select(`
        *,
        class_subject:class_subjects(
          subject:subjects(*),
          class:classes(*)
        )
      `)
            .in('class_subject_id', classSubjectIds);

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data, error } = await query
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        if (data && Array.isArray(data)) {
            data.forEach(lesson => {
                if (lesson.date) {
                    let dateStr = String(lesson.date);
                    if (dateStr.includes('T')) {
                        dateStr = dateStr.split('T')[0];
                    } else if (dateStr.length > 10) {
                        dateStr = dateStr.substring(0, 10);
                    }
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateStr)) {
                        lesson.date = dateStr;
                    }
                }
                lesson.class_subject = compatClassSubject(lesson.class_subject);
                Object.assign(lesson, compatLessonRead(lesson));
            });
        }

        return data || [];
    },

    async getLessonById(lessonId) {
        const { data, error } = await supabase
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
            .eq('id', lessonId)
            .single();

        if (error) throw error;

        if (data && data.date) {
            let dateStr = String(data.date);
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
                data.date = dateStr;
            }
        }

        if (data && data.class_subject) {
            data.class_subject = compatClassSubject(data.class_subject);
        }

        return compatLessonRead(data);
    },

    async getLessonContent(lessonId) {
        const { data, error } = await supabase
            .from('lesson_content')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(compatLessonContentRead);
    },

    async createLesson(lessonData) {
        const payload = compatLessonWrite({
            ...lessonData,
            class_subject_id: lessonData.class_subject_id
        });

        if (payload.date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(payload.date)) {
                const date = new Date(payload.date);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    payload.date = `${year}-${month}-${day}`;
                }
            }
        }

        const { data, error } = await supabase
            .from('lessons')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        if (data && data.date) {
            let dateStr = String(data.date);
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
                data.date = dateStr;
            }
        }

        return compatLessonRead(data);
    },

    async updateLesson(lessonId, updates) {
        const formattedUpdates = compatLessonWrite({ ...updates });
        if (formattedUpdates.date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(formattedUpdates.date)) {
                const date = new Date(formattedUpdates.date);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    formattedUpdates.date = `${year}-${month}-${day}`;
                }
            }
        }

        const { data, error } = await supabase
            .from('lessons')
            .update({ ...formattedUpdates, updated_at: new Date().toISOString() })
            .eq('id', lessonId)
            .select()
            .single();

        if (error) throw error;

        if (data && data.date) {
            let dateStr = String(data.date);
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
                data.date = dateStr;
            }
        }

        return compatLessonRead(data);
    },

    async deleteLesson(lessonId) {
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);

        if (error) throw error;
    },

    // ============================================
    // ATTENDANCE
    // ============================================

    async getLessonAttendance(lessonId) {
        const { data, error } = await supabase
            .from('lesson_attendance')
            .select(`
        *,
        student:users(*)
      `)
            .eq('lesson_id', lessonId);

        if (error) throw error;
        return data;
    },

    async markAttendance(lessonId, attendanceRecords) {
        await supabase
            .from('lesson_attendance')
            .delete()
            .eq('lesson_id', lessonId);

        const records = attendanceRecords.map(record => ({
            lesson_id: lessonId,
            student_id: record.student_id,
            status: record.status,
            notes: record.notes || null
        }));

        const { data, error } = await supabase
            .from('lesson_attendance')
            .insert(records)
            .select();

        if (error) throw error;
        return data;
    },

    async getStudentAttendance(studentId, startDate, endDate) {
        let query = supabase
            .from('lesson_attendance')
            .select(`
        *,
        lesson:lessons(
          *,
          class_subject:class_subjects(
            subject:subjects(*)
          )
        )
      `)
            .eq('student_id', studentId);

        if (startDate) {
            query = query.gte('lesson.date', startDate);
        }
        if (endDate) {
            query = query.lte('lesson.date', endDate);
        }

        const { data, error } = await query
            .order('lesson.date', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => {
            if (row.lesson && row.lesson.class_subject) {
                row.lesson.class_subject = compatClassSubject(row.lesson.class_subject);
            }
            if (row.lesson) {
                row.lesson = compatLessonRead(row.lesson);
            }
            return row;
        });
    }
};
