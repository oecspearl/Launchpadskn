/**
 * Progress Service
 * Calculate and track student academic progress
 */

import { studentService } from './studentService';
import { classService } from './classService';

/**
 * Get comprehensive progress data for a student
 * @param {number} studentId - Student user ID
 * @returns {Promise<Object>} Progress data
 */
export const getStudentProgress = async (studentId) => {
    try {
        // Fetch student data
        const [assignments, classData] = await Promise.all([
            studentService.getStudentAssignments(studentId),
            classService.getStudentClass(studentId)
        ]);

        const subjects = classData?.class_subjects || [];

        // Calculate overall stats
        const overallStats = calculateOverallStats(assignments);

        // Calculate subject-wise progress
        const subjectProgress = calculateSubjectProgress(assignments, subjects);

        // Calculate grade trends
        const gradeTrends = calculateGradeTrends(assignments);

        // Calculate completion stats
        const completionStats = calculateCompletionStats(assignments);

        return {
            overallStats,
            subjectProgress,
            gradeTrends,
            completionStats,
            assignments,
            subjects
        };
    } catch (error) {
        console.error('Error fetching student progress:', error);
        throw error;
    }
};

/**
 * Calculate overall statistics
 */
const calculateOverallStats = (assignments) => {
    if (!assignments || assignments.length === 0) {
        return {
            averageGrade: 0,
            totalAssignments: 0,
            completedAssignments: 0,
            pendingAssignments: 0,
            completionRate: 0,
            onTimeRate: 0
        };
    }

    const completed = assignments.filter(a => a.submission_status === 'submitted' || a.status === 'graded');
    const graded = assignments.filter(a => a.grade !== null && a.grade !== undefined);

    const totalGrade = graded.reduce((sum, a) => sum + (parseFloat(a.grade) || 0), 0);
    const averageGrade = graded.length > 0 ? (totalGrade / graded.length).toFixed(2) : 0;

    const completionRate = assignments.length > 0
        ? ((completed.length / assignments.length) * 100).toFixed(1)
        : 0;

    // Calculate on-time submissions
    const onTimeSubmissions = completed.filter(a => {
        if (!a.submission_date || !a.due_date) return false;
        return new Date(a.submission_date) <= new Date(a.due_date);
    });

    const onTimeRate = completed.length > 0
        ? ((onTimeSubmissions.length / completed.length) * 100).toFixed(1)
        : 0;

    return {
        averageGrade: parseFloat(averageGrade),
        totalAssignments: assignments.length,
        completedAssignments: completed.length,
        pendingAssignments: assignments.length - completed.length,
        completionRate: parseFloat(completionRate),
        onTimeRate: parseFloat(onTimeRate)
    };
};

/**
 * Calculate progress by subject
 */
const calculateSubjectProgress = (assignments, subjects) => {
    const subjectMap = {};

    // Initialize subject map
    subjects.forEach(subject => {
        const subjectName = subject.subject_offering?.subject?.subject_name || 'Unknown';
        const subjectId = subject.class_subject_id;

        subjectMap[subjectId] = {
            id: subjectId,
            name: subjectName,
            code: subject.subject_offering?.subject?.subject_code || '',
            teacher: subject.teacher?.name || '',
            assignments: [],
            totalAssignments: 0,
            completedAssignments: 0,
            averageGrade: 0,
            completionRate: 0
        };
    });

    // Group assignments by subject
    assignments.forEach(assignment => {
        const subjectId = assignment.class_subject_id;
        if (subjectMap[subjectId]) {
            subjectMap[subjectId].assignments.push(assignment);
        }
    });

    // Calculate stats for each subject
    Object.values(subjectMap).forEach(subject => {
        const subjectAssignments = subject.assignments;
        subject.totalAssignments = subjectAssignments.length;

        const completed = subjectAssignments.filter(a =>
            a.submission_status === 'submitted' || a.status === 'graded'
        );
        subject.completedAssignments = completed.length;

        const graded = subjectAssignments.filter(a => a.grade !== null && a.grade !== undefined);
        if (graded.length > 0) {
            const totalGrade = graded.reduce((sum, a) => sum + (parseFloat(a.grade) || 0), 0);
            subject.averageGrade = parseFloat((totalGrade / graded.length).toFixed(2));
        }

        subject.completionRate = subject.totalAssignments > 0
            ? parseFloat(((subject.completedAssignments / subject.totalAssignments) * 100).toFixed(1))
            : 0;
    });

    return Object.values(subjectMap);
};

/**
 * Calculate grade trends over time
 */
const calculateGradeTrends = (assignments) => {
    const graded = assignments
        .filter(a => a.grade !== null && a.grade !== undefined && a.due_date)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (graded.length === 0) return [];

    // Group by month
    const monthlyGrades = {};

    graded.forEach(assignment => {
        const date = new Date(assignment.due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyGrades[monthKey]) {
            monthlyGrades[monthKey] = {
                month: monthKey,
                grades: [],
                date: date
            };
        }

        monthlyGrades[monthKey].grades.push(parseFloat(assignment.grade));
    });

    // Calculate average per month
    const trends = Object.values(monthlyGrades)
        .map(item => ({
            month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            average: parseFloat((item.grades.reduce((a, b) => a + b, 0) / item.grades.length).toFixed(2)),
            count: item.grades.length
        }))
        .slice(-6); // Last 6 months

    return trends;
};

/**
 * Calculate completion statistics
 */
const calculateCompletionStats = (assignments) => {
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyCompleted = assignments.filter(a => {
        if (!a.submission_date) return false;
        return new Date(a.submission_date) >= thisWeek;
    }).length;

    const monthlyCompleted = assignments.filter(a => {
        if (!a.submission_date) return false;
        return new Date(a.submission_date) >= thisMonth;
    }).length;

    const upcoming = assignments.filter(a => {
        if (!a.due_date || a.submission_status === 'submitted') return false;
        const dueDate = new Date(a.due_date);
        return dueDate > now && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    const overdue = assignments.filter(a => {
        if (!a.due_date || a.submission_status === 'submitted') return false;
        return new Date(a.due_date) < now;
    });

    return {
        weeklyCompleted,
        monthlyCompleted,
        upcomingCount: upcoming.length,
        overdueCount: overdue.length,
        upcoming: upcoming.slice(0, 5),
        overdue: overdue.slice(0, 5)
    };
};

/**
 * Calculate achievement badges
 */
export const calculateAchievements = (progressData) => {
    const achievements = [];
    const { overallStats, completionStats } = progressData;

    // Perfect score badge
    if (overallStats.averageGrade >= 95) {
        achievements.push({
            id: 'perfect_score',
            title: 'Perfect Scholar',
            description: 'Maintained 95%+ average',
            icon: '🏆',
            color: 'gold'
        });
    }

    // Completion champion
    if (overallStats.completionRate === 100) {
        achievements.push({
            id: 'completion_champion',
            title: 'Completion Champion',
            description: 'Completed all assignments',
            icon: '✅',
            color: 'success'
        });
    }

    // On-time master
    if (overallStats.onTimeRate >= 95) {
        achievements.push({
            id: 'on_time_master',
            title: 'Punctuality Master',
            description: '95%+ on-time submissions',
            icon: '⏰',
            color: 'primary'
        });
    }

    // Consistent learner
    if (completionStats.weeklyCompleted >= 5) {
        achievements.push({
            id: 'consistent_learner',
            title: 'Consistent Learner',
            description: '5+ assignments this week',
            icon: '📚',
            color: 'info'
        });
    }

    return achievements;
};

const progressService = {
    getStudentProgress,
    calculateAchievements
};

export default progressService;
