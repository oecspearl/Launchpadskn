import { supabase } from '../config/supabase';

export const dashboardService = {
    async getDashboardStats() {
        try {
            console.log('[dashboardService] getDashboardStats called');

            const [
                usersResult,
                subjectsResult,
                classesResult,
                formsResult,
                studentsResult,
                instructorsResult,
                adminsResult
            ] = await Promise.allSettled([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('subjects').select('*', { count: 'exact', head: true }),
                supabase.from('classes').select('*', { count: 'exact', head: true }),
                supabase.from('forms').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'INSTRUCTOR'),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN')
            ]);

            const totalUsers = usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0;
            const totalSubjects = subjectsResult.status === 'fulfilled' ? (subjectsResult.value.count || 0) : 0;
            const totalClasses = classesResult.status === 'fulfilled' ? (classesResult.value.count || 0) : 0;
            const totalForms = formsResult.status === 'fulfilled' ? (formsResult.value.count || 0) : 0;
            const totalStudents = studentsResult.status === 'fulfilled' ? (studentsResult.value.count || 0) : 0;
            const totalInstructors = instructorsResult.status === 'fulfilled' ? (instructorsResult.value.count || 0) : 0;
            const totalAdmins = adminsResult.status === 'fulfilled' ? (adminsResult.value.count || 0) : 0;

            console.log('[dashboardService] Stats:', { totalUsers, totalSubjects, totalClasses, totalForms, totalStudents, totalInstructors, totalAdmins });

            return {
                totalUsers,
                totalSubjects,
                totalCourses: totalSubjects,
                totalClasses,
                totalForms,
                totalStudents,
                totalInstructors,
                totalAdmins
            };
        } catch (error) {
            console.error('[dashboardService] Error in getDashboardStats:', error);
            return {
                totalUsers: 0,
                totalSubjects: 0,
                totalCourses: 0,
                totalClasses: 0,
                totalForms: 0,
                totalStudents: 0,
                totalInstructors: 0,
                totalAdmins: 0
            };
        }
    },

    async getRecentActivity(limit = 10) {
        try {
            console.log('[dashboardService] getRecentActivity called');

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const activityTimeout = 2000;

            const createTimeoutPromise = (timeoutMs) =>
                new Promise((resolve) => setTimeout(() => resolve({ status: 'fulfilled', value: { data: [] } }), timeoutMs));

            const [
                recentUsersResult,
                recentSubjectsResult,
                recentClassesResult,
                recentFormsResult
            ] = await Promise.allSettled([
                Promise.race([
                    supabase
                        .from('users')
                        .select('user_id, email, name, role, created_at')
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(limit),
                    createTimeoutPromise(activityTimeout)
                ]),
                Promise.race([
                    supabase
                        .from('subjects')
                        .select('subject_id, subject_name, created_at')
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(limit),
                    createTimeoutPromise(activityTimeout)
                ]),
                Promise.race([
                    supabase
                        .from('classes')
                        .select('class_id, class_name, created_at')
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(limit),
                    createTimeoutPromise(activityTimeout)
                ]),
                Promise.race([
                    supabase
                        .from('forms')
                        .select('form_id, form_number, form_name, created_at')
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(limit),
                    createTimeoutPromise(activityTimeout)
                ])
            ]);

            const activities = [];

            if (recentUsersResult.status === 'fulfilled' && recentUsersResult.value.data) {
                recentUsersResult.value.data.forEach(user => {
                    const roleText = user.role === 'ADMIN' ? 'admin' :
                        user.role === 'INSTRUCTOR' ? 'instructor' :
                            'student';
                    activities.push({
                        id: `user-${user.user_id}`,
                        type: 'user',
                        user: user.name || user.email,
                        action: 'registered as',
                        target: roleText,
                        time: this.formatRelativeTime(user.created_at),
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
                        time: this.formatRelativeTime(subject.created_at),
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
                        time: this.formatRelativeTime(cls.created_at),
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
                        time: this.formatRelativeTime(form.created_at),
                        timestamp: new Date(form.created_at).getTime()
                    });
                });
            }

            activities.sort((a, b) => b.timestamp - a.timestamp);
            return activities.slice(0, limit);

        } catch (error) {
            console.error('[dashboardService] Error in getRecentActivity:', error);
            return [];
        }
    },

    formatRelativeTime(timestamp) {
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
    }
};
