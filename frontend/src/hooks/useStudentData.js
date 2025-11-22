import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import supabaseService from '../services/supabaseService';

export const useStudentData = (user) => {
    const studentId = user?.user_id || user?.userId;

    // 1. Fetch Class Assignment
    const { data: classAssignment, isLoading: isLoadingClass } = useQuery({
        queryKey: ['studentClass', studentId],
        queryFn: async () => {
            if (!studentId) return null;

            let numericStudentId = studentId;
            // Handle UUID vs numeric ID
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
        enabled: !!user,
    });

    const classId = classAssignment?.class?.class_id;

    // 2. Fetch Subjects
    const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['studentSubjects', classId],
        queryFn: () => supabaseService.getSubjectsByClass(classId),
        enabled: !!classId,
    });

    // 3. Fetch Lessons - Get all upcoming lessons (from today onwards)
    const { data: lessons, isLoading: isLoadingLessons } = useQuery({
        queryKey: ['studentLessons', studentId],
        queryFn: async () => {
            if (!studentId) return [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            // Fetch all upcoming lessons (from today onwards, no end date limit)
            // We'll fetch lessons for the next 3 months to cover a reasonable range
            const futureDate = new Date(today);
            futureDate.setMonth(today.getMonth() + 3);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            return supabaseService.getLessonsByStudent(
                studentId, // This might need numeric ID
                todayStr,
                futureDateStr
            );
        },
        enabled: !!studentId,
    });

    // 4. Fetch Assignments (Derived from subjects)
    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['studentAssignments', subjects],
        queryFn: async () => {
            if (!subjects?.length) return [];
            const classSubjectIds = subjects.map(s => s.class_subject_id);
            const allAssessments = [];
            for (const id of classSubjectIds) {
                const assessments = await supabaseService.getAssessmentsByClassSubject(id);
                if (assessments) allAssessments.push(...assessments);
            }
            return allAssessments
                .filter(a => a.due_date && new Date(a.due_date) >= new Date())
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 5);
        },
        enabled: !!subjects?.length,
    });

    // 5. Fetch Grades
    const { data: grades, isLoading: isLoadingGrades } = useQuery({
        queryKey: ['studentGrades', studentId],
        queryFn: () => supabaseService.getStudentGrades(studentId),
        enabled: !!studentId,
    });

    const isLoading = isLoadingClass || isLoadingSubjects || isLoadingLessons || isLoadingAssignments || isLoadingGrades;

    return {
        classAssignment,
        myClass: classAssignment?.class,
        subjects: subjects || [],
        lessons: lessons || [],
        assignments: assignments || [],
        grades: grades || [],
        isLoading,
    };
};
