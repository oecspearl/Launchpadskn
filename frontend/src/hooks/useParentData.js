import { useQuery } from '@tanstack/react-query';
import { parentService } from '../services/parentService';
import supabaseService from '../services/supabaseService';

export const useParentData = (user, selectedChildId) => {
    const parentId = user?.user_id || user?.userId;

    // 1. Fetch linked children
    const {
        data: children,
        isLoading: isLoadingChildren,
        error: childrenError
    } = useQuery({
        queryKey: ['parentChildren', parentId],
        queryFn: () => parentService.getLinkedChildren(parentId),
        enabled: !!parentId,
    });

    // Determine active child (selected or first)
    const activeChild = children?.find(
        link => link.student?.user_id === selectedChildId
    ) || children?.[0];
    const activeStudentId = activeChild?.student?.user_id;

    // 2. Fetch class assignment for active child
    const { data: classAssignment, isLoading: isLoadingClass } = useQuery({
        queryKey: ['parentChildClass', activeStudentId],
        queryFn: () => parentService.getChildClassAssignment(activeStudentId),
        enabled: !!activeStudentId,
    });

    const classId = classAssignment?.class?.class_id;

    // 3. Fetch subjects
    const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['parentChildSubjects', classId],
        queryFn: () => parentService.getChildSubjects(classId),
        enabled: !!classId,
    });

    // 4. Fetch grades
    const { data: grades, isLoading: isLoadingGrades } = useQuery({
        queryKey: ['parentChildGrades', activeStudentId],
        queryFn: () => parentService.getChildGrades(activeStudentId),
        enabled: !!activeStudentId,
    });

    // 5. Fetch lessons (3 months ahead)
    const { data: lessons, isLoading: isLoadingLessons } = useQuery({
        queryKey: ['parentChildLessons', activeStudentId],
        queryFn: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];
            const futureDate = new Date(today);
            futureDate.setMonth(today.getMonth() + 3);
            const futureDateStr = futureDate.toISOString().split('T')[0];
            return parentService.getChildLessons(activeStudentId, todayStr, futureDateStr);
        },
        enabled: !!activeStudentId,
    });

    // 6. Fetch attendance
    const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
        queryKey: ['parentChildAttendance', activeStudentId],
        queryFn: () => parentService.getChildAttendance(activeStudentId),
        enabled: !!activeStudentId,
    });

    // 7. Fetch disciplinary summary
    const { data: disciplinarySummary, isLoading: isLoadingDisciplinary } = useQuery({
        queryKey: ['parentChildDisciplinary', activeStudentId],
        queryFn: () => parentService.getChildDisciplinarySummary(activeStudentId),
        enabled: !!activeStudentId,
    });

    // 8. Fetch disciplinary records
    const { data: disciplinaryRecords } = useQuery({
        queryKey: ['parentChildDisciplinaryRecords', activeStudentId],
        queryFn: () => parentService.getChildDisciplinaryRecords(activeStudentId),
        enabled: !!activeStudentId,
    });

    // 9. Fetch assignments (derived from subjects)
    const classSubjectIds = subjects?.map(s => s.class_subject_id) || [];
    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['parentChildAssignments', classSubjectIds.join(',')],
        queryFn: async () => {
            if (!classSubjectIds.length) return [];
            const results = await Promise.allSettled(
                classSubjectIds.map(id => supabaseService.getAssessmentsByClassSubject(id))
            );
            return results
                .filter(r => r.status === 'fulfilled')
                .flatMap(r => r.value)
                .filter(a => a && a.due_date && new Date(a.due_date) >= new Date())
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 10);
        },
        enabled: classSubjectIds.length > 0,
    });

    const isLoading = isLoadingChildren || isLoadingClass || isLoadingSubjects ||
        isLoadingGrades || isLoadingLessons || isLoadingAttendance || isLoadingDisciplinary || isLoadingAssignments;

    return {
        children: children || [],
        activeChild,
        activeStudentId,
        classAssignment,
        myClass: classAssignment?.class,
        subjects: subjects || [],
        grades: grades || [],
        lessons: lessons || [],
        attendance: attendance || [],
        assignments: assignments || [],
        disciplinarySummary: disciplinarySummary || null,
        disciplinaryRecords: disciplinaryRecords || [],
        isLoading,
        error: childrenError,
    };
};
