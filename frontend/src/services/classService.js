import { supabase } from '../config/supabase';
import { ROLES } from '../constants/roles';

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
            .eq('form.school_id', institutionId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getClassesByForm(formId) {
        const { data, error } = await supabase
            .from('classes')
            .select('*, form_tutor:users!classes_form_tutor_id_fkey(name, email)')
            .eq('form_id', formId)
            .eq('is_active', true)
            .order('class_name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getClasses(userRole = null, userId = null) {
        let query = supabase
            .from('classes')
            .select(`
        *,
        form:forms(*),
        form_tutor:users!classes_form_tutor_id_fkey(name, email),
        instructors:class_instructors(
          instructor:users(name, email, user_id)
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
                    .select('class_id')
                    .eq('form_tutor_id', userId)
                    .eq('is_active', true);

                const tutorClassIds = tutorClasses?.map(c => c.class_id) || [];
                const allClassIds = [...new Set([...classIds, ...tutorClassIds])];

                if (allClassIds.length > 0) {
                    query = query.or(`class_id.in.(${allClassIds.join(',')}),published.eq.true`);
                } else {
                    query = query.eq('published', true);
                }
            } else {
                query = query.eq('published', true);
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
                    query = query.or(`class_id.in.(${enrolledClassIds.join(',')}),published.eq.true`);
                } else {
                    query = query.eq('published', true);
                }
            } else {
                query = query.eq('published', true);
            }
        } else {
            query = query.eq('published', true);
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
        form_tutor:users!classes_form_tutor_id_fkey(name, email),
        instructors:class_instructors(
          instructor:users(name, email)
        )
      `)
            .eq('published', true)
            .eq('is_active', true);

        if (filters.form_id) {
            query = query.eq('form_id', filters.form_id);
        }

        if (filters.difficulty) {
            query = query.eq('difficulty', filters.difficulty);
        }

        if (filters.featured) {
            query = query.eq('featured', true);
        }

        if (filters.search) {
            query = query.or(`class_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('featured', { ascending: false }).order('created_at', { ascending: false });

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
          instructor:users(name, email, user_id, role),
          role,
          assigned_at
        ),
        students:student_class_assignments(
          student:users(name, email, user_id),
          enrollment_type,
          enrolled_at,
          progress_percentage
        )
      `)
            .eq('class_id', classId)
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
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('class_id', classId)
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
        let query = supabase
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

        if (filters.classId && filters.classId !== 'all') {
            query = query.eq('class_id', filters.classId);
        }

        if (filters.formId && filters.formId !== 'all') {
            // This is tricky because form_id is on the class, not the assignment directly usually.
            // But let's check the schema. The previous code didn't filter assignments by form directly in the DB query, 
            // it filtered classes by form, then if selectedClass was 'all', it fetched all assignments.
            // Wait, the previous code:
            // if (selectedClass !== 'all') { assignmentQuery = assignmentQuery.eq('class_id', selectedClass); }
            // It didn't filter by formId in the assignment query!
            // It only filtered classes list by form.
            // But if I select a form, and keep class as 'all', should I show assignments for that form?
            // The previous code:
            // if (selectedClass !== 'all') ...
            // It seems it only filters by class_id if a specific class is selected.
            // If only form is selected, it still fetches ALL assignments?
            // Let's look at the previous code again.
            /*
              if (selectedClass !== 'all') {
                assignmentQuery = assignmentQuery.eq('class_id', selectedClass);
              }
              const { data: assignmentsData } = await assignmentQuery...
            */
            // So if I select Form 1, but Class 'All', it fetches ALL assignments for ALL forms?
            // That seems like a bug or limitation in the original code.
            // However, I will replicate the behavior or improve it.
            // If I want to filter by form, I'd need to filter by class.form_id.
            // Supabase supports filtering on joined tables with !inner if needed, but let's stick to the simple case first.
            // I'll just support classId filter for now to match the original behavior's explicit filter.
        }

        const { data, error } = await query.order('academic_year', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getStudentClassAssignment(studentId) {
        // Handle UUID vs numeric ID
        let numericStudentId = studentId;
        if (typeof studentId === 'string' && studentId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', studentId)
                .maybeSingle();
            if (userProfile) numericStudentId = userProfile.user_id;
            else return null;
        }

        const { data, error } = await supabase
            .from('student_class_assignments')
            .select(`
                *,
                class:classes(
                    *,
                    form:forms(*),
                    form_tutor:users!classes_form_tutor_id_fkey(name, email)
                )
            `)
            .eq('student_id', numericStudentId)
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
            .order('lesson_date', { ascending: true })
            .range(from, to);
        if (error) throw error;
        return { lessons: data || [], total: count || 0 };
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
            .select('class_id, published, capacity, current_enrollment')
            .eq('class_id', classId)
            .single();

        if (classError) throw classError;

        if (!classData.published) {
            throw new Error('Class is not available for enrollment');
        }

        if (classData.current_enrollment >= classData.capacity) {
            throw new Error('Class is at full capacity');
        }

        const { data: existing } = await supabase
            .from('student_class_assignments')
            .select('assignment_id, is_active')
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
                        enrollment_type: 'enrolled',
                        enrolled_at: new Date().toISOString(),
                        academic_year: academicYear
                    })
                    .eq('assignment_id', existing.assignment_id)
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
                enrollment_type: 'enrolled',
                enrolled_at: new Date().toISOString(),
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
                is_active: false,
                enrollment_type: 'dropped'
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
            .select('assignment_id, is_active, enrollment_type')
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .maybeSingle();

        if (error) throw error;
        return data && data.is_active ? data : null;
    },

    async updateClassEnrollmentCount(classId) {
        const { count } = await supabase
            .from('student_class_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId)
            .eq('is_active', true);

        await supabase
            .from('classes')
            .update({ current_enrollment: count || 0 })
            .eq('class_id', classId);
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
        instructor:users(name, email, user_id, role)
      `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
    },

    async publishClass(classId) {
        const { data, error } = await supabase
            .from('classes')
            .update({ published: true, updated_at: new Date().toISOString() })
            .eq('class_id', classId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async unpublishClass(classId) {
        const { data, error } = await supabase
            .from('classes')
            .update({ published: false, updated_at: new Date().toISOString() })
            .eq('class_id', classId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async toggleClassFeatured(classId, featured) {
        const { data, error } = await supabase
            .from('classes')
            .update({ featured: featured, updated_at: new Date().toISOString() })
            .eq('class_id', classId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getSubjectsByClass(classId) {
        const { data, error } = await supabase
            .from('class_subjects')
            .select(`
        *,
        subject_offering:subject_form_offerings(
          *,
          subject:subjects(*)
        ),
        teacher:users!class_subjects_teacher_id_fkey(*)
      `)
            .eq('class_id', classId);

        if (error) throw error;
        return data;
    },

    async getAllClassSubjects(filters = {}) {
        let query = supabase
            .from('class_subjects')
            .select(`
        *,
        class:classes(
          *,
          form:forms(*)
        ),
        subject_offering:subject_form_offerings(
          *,
          subject:subjects(*)
        ),
        teacher:users!class_subjects_teacher_id_fkey(name, email, profile_image_url)
      `);

        if (filters.classId && filters.classId !== 'all') {
            query = query.eq('class_id', filters.classId);
        }

        const { data, error } = await query.order('class_id');

        if (error) throw error;
        return data || [];
    },

    async assignSubjectToClass(classId, subjectOfferingId, teacherId) {
        const classIdNum = parseInt(classId);
        const subjectOfferingIdNum = parseInt(subjectOfferingId);
        const teacherIdNum = teacherId ? parseInt(teacherId) : null;

        if (isNaN(classIdNum) || isNaN(subjectOfferingIdNum)) {
            throw new Error('Invalid class or subject offering ID');
        }

        const insertData = {
            class_id: classIdNum,
            subject_offering_id: subjectOfferingIdNum
        };

        if (teacherIdNum) {
            insertData.teacher_id = teacherIdNum;
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
            .eq('class_subject_id', classSubjectId);

        if (error) throw error;
    },

    async getClassesByTeacher(teacherId) {
        const teacherIdNum = typeof teacherId === 'string' && !teacherId.includes('-')
            ? parseInt(teacherId)
            : teacherId;

        if (isNaN(teacherIdNum) || typeof teacherIdNum !== 'number') {
            throw new Error('Invalid teacher ID: must be numeric user_id, not UUID');
        }

        const { data, error } = await supabase
            .from('class_subjects')
            .select(`
        *,
        class:classes(
          *,
          form:forms(*)
        ),
        subject_offering:subject_form_offerings(
          subject:subjects(*)
        )
      `)
            .eq('teacher_id', teacherIdNum);

        if (error) throw error;
        return data;
    },

    // ============================================
    // LESSONS
    // ============================================

    async getLessonsByClassSubject(classSubjectId) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*, content:lesson_content(*)')
            .eq('class_subject_id', classSubjectId)
            .order('lesson_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        if (data && Array.isArray(data)) {
            data.forEach(lesson => {
                if (lesson.lesson_date) {
                    let dateStr = String(lesson.lesson_date);
                    if (dateStr.includes('T')) {
                        dateStr = dateStr.split('T')[0];
                    } else if (dateStr.length > 10) {
                        dateStr = dateStr.substring(0, 10);
                    }
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateStr)) {
                        lesson.lesson_date = dateStr;
                    }
                }
            });
        }

        return data;
    },

    async getLessonsByStudent(studentId, startDate, endDate) {
        let numericStudentId = studentId;
        if (typeof studentId === 'string' && studentId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', studentId)
                .maybeSingle();

            if (userProfile && userProfile.user_id) {
                numericStudentId = userProfile.user_id;
            } else {
                return [];
            }
        }

        const { data: classAssignment } = await supabase
            .from('student_class_assignments')
            .select('class_id')
            .eq('student_id', numericStudentId)
            .eq('is_active', true)
            .maybeSingle();

        if (!classAssignment) return [];

        const { data: classSubjects } = await supabase
            .from('class_subjects')
            .select('class_subject_id')
            .eq('class_id', classAssignment.class_id);

        if (!classSubjects || classSubjects.length === 0) return [];

        const classSubjectIds = classSubjects.map(cs => cs.class_subject_id);

        let query = supabase
            .from('lessons')
            .select(`
        *,
        class_subject:class_subjects(
          subject_offering:subject_form_offerings(
            subject:subjects(*)
          ),
          class:classes(*)
        )
      `)
            .in('class_subject_id', classSubjectIds);

        if (startDate) {
            query = query.gte('lesson_date', startDate);
        }
        if (endDate) {
            query = query.lte('lesson_date', endDate);
        }

        const { data, error } = await query
            .order('lesson_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        if (data && Array.isArray(data)) {
            data.forEach(lesson => {
                if (lesson.lesson_date) {
                    let dateStr = String(lesson.lesson_date);
                    if (dateStr.includes('T')) {
                        dateStr = dateStr.split('T')[0];
                    } else if (dateStr.length > 10) {
                        dateStr = dateStr.substring(0, 10);
                    }
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateStr)) {
                        lesson.lesson_date = dateStr;
                    }
                }
            });
        }

        return data || [];
    },

    async getLessonsByTeacher(teacherId, startDate, endDate) {
        const teacherIdNum = typeof teacherId === 'string' && !teacherId.includes('-')
            ? parseInt(teacherId)
            : teacherId;

        if (isNaN(teacherIdNum) || typeof teacherIdNum !== 'number') {
            throw new Error('Invalid teacher ID: must be numeric user_id, not UUID');
        }

        const { data: classSubjects } = await supabase
            .from('class_subjects')
            .select('class_subject_id')
            .eq('teacher_id', teacherIdNum);

        if (!classSubjects || classSubjects.length === 0) return [];

        const classSubjectIds = classSubjects.map(cs => cs.class_subject_id);

        let query = supabase
            .from('lessons')
            .select(`
        *,
        class_subject:class_subjects(
          subject_offering:subject_form_offerings(
            subject:subjects(*)
          ),
          class:classes(*)
        )
      `)
            .in('class_subject_id', classSubjectIds);

        if (startDate) {
            query = query.gte('lesson_date', startDate);
        }
        if (endDate) {
            query = query.lte('lesson_date', endDate);
        }

        const { data, error } = await query
            .order('lesson_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        if (data && Array.isArray(data)) {
            data.forEach(lesson => {
                if (lesson.lesson_date) {
                    let dateStr = String(lesson.lesson_date);
                    if (dateStr.includes('T')) {
                        dateStr = dateStr.split('T')[0];
                    } else if (dateStr.length > 10) {
                        dateStr = dateStr.substring(0, 10);
                    }
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateStr)) {
                        lesson.lesson_date = dateStr;
                    }
                }
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
                    subject_offering:subject_form_offerings(
                        *,
                        subject:subjects(*)
                    ),
                    class:classes(
                        *,
                        form:forms(*)
                    )
                )
            `)
            .eq('lesson_id', lessonId)
            .single();

        if (error) throw error;

        if (data && data.lesson_date) {
            let dateStr = String(data.lesson_date);
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
                data.lesson_date = dateStr;
            }
        }

        return data;
    },

    async getLessonContent(lessonId) {
        const { data, error } = await supabase
            .from('lesson_content')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('sequence_order', { ascending: true })
            .order('upload_date', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createLesson(lessonData) {
        const payload = {
            ...lessonData,
            class_subject_id: parseInt(lessonData.class_subject_id, 10)
        };

        if (payload.lesson_date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(payload.lesson_date)) {
                const date = new Date(payload.lesson_date);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    payload.lesson_date = `${year}-${month}-${day}`;
                }
            }
        }

        const { data, error } = await supabase
            .from('lessons')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        if (data && data.lesson_date) {
            let dateStr = String(data.lesson_date);
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
                data.lesson_date = dateStr;
            }
        }

        return data;
    },

    async updateLesson(lessonId, updates) {
        const formattedUpdates = { ...updates };
        if (formattedUpdates.lesson_date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(formattedUpdates.lesson_date)) {
                const date = new Date(formattedUpdates.lesson_date);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    formattedUpdates.lesson_date = `${year}-${month}-${day}`;
                }
            }
        }

        const { data, error } = await supabase
            .from('lessons')
            .update({ ...formattedUpdates, updated_at: new Date().toISOString() })
            .eq('lesson_id', lessonId)
            .select()
            .single();

        if (error) throw error;

        if (data && data.lesson_date) {
            let dateStr = String(data.lesson_date);
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            } else if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateStr)) {
                data.lesson_date = dateStr;
            }
        }

        return data;
    },

    async deleteLesson(lessonId) {
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('lesson_id', lessonId);

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
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            )
          )
        )
      `)
            .eq('student_id', studentId);

        if (startDate) {
            query = query.gte('lesson.lesson_date', startDate);
        }
        if (endDate) {
            query = query.lte('lesson.lesson_date', endDate);
        }

        const { data, error } = await query
            .order('lesson.lesson_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
