import { useQuery } from '@tanstack/react-query';
import supabaseService from '../services/supabaseService';
import { classService } from '../services/classService';

export const useStudentData = (user) => {
    const studentId = user?.user_id || user?.userId;

    // 1. Fetch Class Assignment
    const { data: classAssignment, isLoading: isLoadingClass } = useQuery({
        queryKey: ['studentClass', studentId],
        queryFn: () => classService.getStudentClassAssignment(studentId),
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

    // 4. Fetch Assignments (Derived from subjects) — batched to avoid N+1
    const classSubjectIds = subjects?.map(s => s.class_subject_id) || [];
    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['studentAssignments', classSubjectIds.join(',')],
        queryFn: async () => {
            if (!classSubjectIds.length) return [];
            // Fetch all assessments in parallel instead of sequentially
            const results = await Promise.all(
                classSubjectIds.map(id => supabaseService.getAssessmentsByClassSubject(id))
            );
            return results
                .flat()
                .filter(a => a && a.due_date && new Date(a.due_date) >= new Date())
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 5);
        },
        enabled: classSubjectIds.length > 0,
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
