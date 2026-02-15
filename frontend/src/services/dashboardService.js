import { supabase } from '../config/supabase';

// Helper function for formatting relative time
const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'N/A';

    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return time.toLocaleDateString();
};

const log = (...args) => { if (import.meta.env.DEV) console.log('[dashboardService]', ...args); };

export const dashboardService = {
    async getDashboardStats(institutionId = null) {
        try {
            log('getDashboardStats called', institutionId ? `for institution ${institutionId}` : '(global)');

            if (institutionId) {
                // Institution-scoped stats
                const [
                    studentsResult,
                    instructorsResult,
                    subjectsResult,
                    classesResult,
                    formsResult,
                    parentsResult
                ] = await Promise.allSettled([
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('role', 'STUDENT'),
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('role', 'INSTRUCTOR'),
                    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', institutionId),
                    supabase.from('classes').select('*, form:forms!inner(*)', { count: 'exact', head: true }).eq('form.school_id', institutionId),
                    supabase.from('forms').select('*', { count: 'exact', head: true }).eq('school_id', institutionId),
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('role', 'PARENT')
                ]);

                const totalStudents = studentsResult.status === 'fulfilled' ? (studentsResult.value.count || 0) : 0;
                const totalInstructors = instructorsResult.status === 'fulfilled' ? (instructorsResult.value.count || 0) : 0;
                const totalSubjects = subjectsResult.status === 'fulfilled' ? (subjectsResult.value.count || 0) : 0;
                const totalClasses = classesResult.status === 'fulfilled' ? (classesResult.value.count || 0) : 0;
                const totalForms = formsResult.status === 'fulfilled' ? (formsResult.value.count || 0) : 0;
                const totalParents = parentsResult.status === 'fulfilled' ? (parentsResult.value.count || 0) : 0;
                const totalUsers = totalStudents + totalInstructors + totalParents;

                log('Institution stats:', { totalUsers, totalSubjects, totalClasses, totalForms, totalStudents, totalInstructors, totalParents });

                return {
                    totalUsers,
                    totalSubjects,
                    totalCourses: totalSubjects,
                    totalClasses,
                    totalForms,
                    totalStudents,
                    totalInstructors,
                    totalAdmins: 0,
                    totalParents
                };
            }

            // Global stats (no institution filter)
            const [
                usersResult,
                subjectsResult,
                classesResult,
                formsResult,
                studentsResult,
                instructorsResult,
                adminsResult,
                parentsResult
            ] = await Promise.allSettled([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('subjects').select('*', { count: 'exact', head: true }),
                supabase.from('classes').select('*', { count: 'exact', head: true }),
                supabase.from('forms').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'INSTRUCTOR'),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'PARENT')
            ]);

            const totalUsers = usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0;
            const totalSubjects = subjectsResult.status === 'fulfilled' ? (subjectsResult.value.count || 0) : 0;
            const totalClasses = classesResult.status === 'fulfilled' ? (classesResult.value.count || 0) : 0;
            const totalForms = formsResult.status === 'fulfilled' ? (formsResult.value.count || 0) : 0;
            const totalStudents = studentsResult.status === 'fulfilled' ? (studentsResult.value.count || 0) : 0;
            const totalInstructors = instructorsResult.status === 'fulfilled' ? (instructorsResult.value.count || 0) : 0;
            const totalAdmins = adminsResult.status === 'fulfilled' ? (adminsResult.value.count || 0) : 0;
            const totalParents = parentsResult.status === 'fulfilled' ? (parentsResult.value.count || 0) : 0;

            log('Stats:', { totalUsers, totalSubjects, totalClasses, totalForms, totalStudents, totalInstructors, totalAdmins, totalParents });

            return {
                totalUsers,
                totalSubjects,
                totalCourses: totalSubjects,
                totalClasses,
                totalForms,
                totalStudents,
                totalInstructors,
                totalAdmins,
                totalParents
            };
        } catch (error) {
            if (import.meta.env.DEV) console.error('[dashboardService] Error in getDashboardStats:', error);
            return {
                totalUsers: 0,
                totalSubjects: 0,
                totalCourses: 0,
                totalClasses: 0,
                totalForms: 0,
                totalStudents: 0,
                totalInstructors: 0,
                totalAdmins: 0,
                totalParents: 0
            };
        }
    },

    async getRecentActivity(limit = 10, institutionId = null) {
        try {
            log('getRecentActivity called', institutionId ? `for institution ${institutionId}` : '(global)');

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const activityTimeout = 2000;

            const createTimeoutPromise = (timeoutMs) =>
                new Promise((resolve) => setTimeout(() => resolve({ status: 'fulfilled', value: { data: [] } }), timeoutMs));

            // Build institution-scoped queries when institutionId is provided
            let usersQuery = supabase
                .from('users')
                .select('user_id, email, name, role, created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            let subjectsQuery = supabase
                .from('subjects')
                .select('subject_id, subject_name, created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            let classesQuery = supabase
                .from('classes')
                .select('class_id, class_name, created_at, form:forms!inner(school_id)')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            let formsQuery = supabase
                .from('forms')
                .select('form_id, form_number, form_name, created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            if (institutionId) {
                usersQuery = usersQuery.eq('institution_id', institutionId);
                subjectsQuery = subjectsQuery.eq('school_id', institutionId);
                classesQuery = classesQuery.eq('form.school_id', institutionId);
                formsQuery = formsQuery.eq('school_id', institutionId);
            }

            const [
                recentUsersResult,
                recentSubjectsResult,
                recentClassesResult,
                recentFormsResult
            ] = await Promise.allSettled([
                Promise.race([usersQuery, createTimeoutPromise(activityTimeout)]),
                Promise.race([subjectsQuery, createTimeoutPromise(activityTimeout)]),
                Promise.race([classesQuery, createTimeoutPromise(activityTimeout)]),
                Promise.race([formsQuery, createTimeoutPromise(activityTimeout)])
            ]);

            const activities = [];

            if (recentUsersResult.status === 'fulfilled' && recentUsersResult.value.data) {
                recentUsersResult.value.data.forEach(user => {
                    const roleText = user.role === 'ADMIN' ? 'admin' :
                        user.role === 'INSTRUCTOR' ? 'instructor' :
                            user.role === 'PARENT' ? 'parent' :
                                'student';
                    activities.push({
                        id: `user-${user.user_id}`,
                        type: 'user',
                        user: user.name || user.email,
                        action: 'registered as',
                        target: roleText,
                        time: formatRelativeTime(user.created_at),
                        timestamp: new Date(user.created_at).getTime()
                    });
                });
            }

            if (recentSubjectsResult.status === 'fulfilled' && recentSubjectsResult.value.data) {
                recentSubjectsResult.value.data.forEach(subject => {
                    activities.push({
                        id: `subject-${subject.subject_id}`,
                        type: 'subject',
                        user: 'Admin',
                        action: 'created subject',
                        target: subject.subject_name,
                        time: formatRelativeTime(subject.created_at),
                        timestamp: new Date(subject.created_at).getTime()
                    });
                });
            }

            if (recentClassesResult.status === 'fulfilled' && recentClassesResult.value.data) {
                recentClassesResult.value.data.forEach(cls => {
                    activities.push({
                        id: `class-${cls.class_id}`,
                        type: 'class',
                        user: 'Admin',
                        action: 'created class',
                        target: cls.class_name,
                        time: formatRelativeTime(cls.created_at),
                        timestamp: new Date(cls.created_at).getTime()
                    });
                });
            }

            if (recentFormsResult.status === 'fulfilled' && recentFormsResult.value.data) {
                recentFormsResult.value.data.forEach(form => {
                    activities.push({
                        id: `form-${form.form_id}`,
                        type: 'form',
                        user: 'Admin',
                        action: 'created form',
                        target: form.form_name || `Form ${form.form_number}`,
                        time: formatRelativeTime(form.created_at),
                        timestamp: new Date(form.created_at).getTime()
                    });
                });
            }

            activities.sort((a, b) => b.timestamp - a.timestamp);
            return activities.slice(0, limit);

        } catch (error) {
            if (import.meta.env.DEV) console.error('[dashboardService] Error in getRecentActivity:', error);
            return [];
        }
    },

    formatRelativeTime
};
