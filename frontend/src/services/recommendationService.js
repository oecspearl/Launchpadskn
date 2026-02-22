/**
 * Recommendation Service
 * Generates personalized recommendations from real student data.
 * No network calls — all data is passed in from the dashboard.
 * Dismissed IDs are tracked in sessionStorage (reset each session).
 */

const DISMISSED_KEY = 'rec_dismissed';
const MAX_RECOMMENDATIONS = 5;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const getDismissedIds = () => {
    try {
        const data = sessionStorage.getItem(DISMISSED_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

// ── Generators ──────────────────────────────────────────────

/** Assignments due within 3 days */
const checkDueSoon = (assignments) => {
    if (!assignments?.length) return [];
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return assignments
        .filter(a => {
            const due = new Date(a.due_date);
            return due > now && due <= threeDays;
        })
        .map(a => {
            const daysLeft = Math.ceil((new Date(a.due_date) - now) / (1000 * 60 * 60 * 24));
            return {
                id: `due-soon-${a.assessment_id}`,
                type: 'due_soon',
                title: `Due Soon: ${a.assessment_name || a.title || 'Assignment'}`,
                reason: `This assignment is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
                priority: 'high',
                action: 'Submit Now',
                link: `/student/assignments/${a.assessment_id}/submit`
            };
        });
};

/** Recent assessments with score below 50% */
const checkLowGrades = (grades) => {
    if (!grades?.length) return [];

    return grades
        .filter(g => g.percentage !== null && g.percentage !== undefined && g.percentage < 50)
        .slice(0, 2)
        .map(g => {
            const subjectName = g.assessment?.class_subject?.subject_offering?.subject?.subject_name || 'this subject';
            const assessmentTitle = g.assessment?.title || g.assessment?.assessment_name || 'Assessment';
            return {
                id: `low-grade-${g.assessment_id}`,
                type: 'review',
                title: `Review: ${assessmentTitle}`,
                reason: `You scored ${Math.round(g.percentage)}% in ${subjectName}. Review the material to improve.`,
                priority: 'high',
                action: 'Review Subject',
                link: `/student/subjects/${g.assessment?.class_subject_id}`
            };
        });
};

/** Subjects with average grade below 60% */
const checkLowScoreSubjects = (subjectAverages) => {
    return subjectAverages
        .filter(s => s.average > 0 && s.average < 60)
        .map(s => ({
            id: `low-subject-${s.classSubjectId}`,
            type: 'practice',
            title: `Needs Attention: ${s.name}`,
            reason: `Your average in ${s.name} is ${Math.round(s.average)}%. Extra practice could help.`,
            priority: 'medium',
            action: 'View Subject',
            link: `/student/subjects/${s.classSubjectId}`
        }));
};

/** Recently viewed lessons the student can continue */
const checkContinueLessons = (recentlyViewed) => {
    if (!recentlyViewed?.length) return [];

    return recentlyViewed.slice(0, 2).map(item => ({
        id: `continue-${item.id}`,
        type: 'continue',
        title: `Continue: ${item.title || item.name || 'Lesson'}`,
        reason: 'Pick up where you left off.',
        priority: 'medium',
        action: 'Continue Lesson',
        link: `/student/lessons/${item.id}`
    }));
};

/** Subjects with average between 60–75% that could improve */
const checkImprovableSubjects = (subjectAverages) => {
    return subjectAverages
        .filter(s => s.average >= 60 && s.average < 75)
        .slice(0, 2)
        .map(s => ({
            id: `improve-subject-${s.classSubjectId}`,
            type: 'challenge',
            title: `Room to Grow: ${s.name}`,
            reason: `You're at ${Math.round(s.average)}% in ${s.name}. A bit more effort could push your grade higher.`,
            priority: 'low',
            action: 'View Subject',
            link: `/student/subjects/${s.classSubjectId}`
        }));
};

/** Remind the student if they haven't viewed a lesson in 3+ days */
const checkStreak = (recentlyViewed) => {
    if (!recentlyViewed?.length) {
        return [{
            id: 'streak-start',
            type: 'streak',
            title: 'Start Your Learning Streak',
            reason: 'Begin exploring lessons to build your learning habit.',
            priority: 'low',
            action: 'Browse Subjects',
            link: '/student/subjects'
        }];
    }

    const lastViewed = new Date(recentlyViewed[0].viewedAt);
    const daysSince = Math.floor((new Date() - lastViewed) / (1000 * 60 * 60 * 24));

    if (daysSince >= 3) {
        return [{
            id: 'streak-reminder',
            type: 'streak',
            title: 'Keep Your Streak Going!',
            reason: `It's been ${daysSince} days since your last lesson. Jump back in!`,
            priority: 'low',
            action: 'Browse Subjects',
            link: '/student/subjects'
        }];
    }

    return [];
};

// ── Helpers ─────────────────────────────────────────────────

/** Group grades by subject and compute averages */
const computeSubjectAverages = (grades) => {
    if (!grades?.length) return [];

    const map = {};
    grades.forEach(g => {
        const csId = g.assessment?.class_subject_id;
        if (!csId || g.percentage === null || g.percentage === undefined) return;

        const name = g.assessment?.class_subject?.subject_offering?.subject?.subject_name || 'Subject';
        if (!map[csId]) {
            map[csId] = { classSubjectId: csId, name, total: 0, count: 0 };
        }
        map[csId].total += g.percentage;
        map[csId].count += 1;
    });

    return Object.values(map).map(s => ({
        ...s,
        average: s.total / s.count
    }));
};

// ── Public API ──────────────────────────────────────────────

export const recommendationService = {
    /**
     * Generate recommendations from student data.
     * @param {Object} params
     * @param {Array} params.grades       - student_grades rows with nested assessment
     * @param {Array} params.assignments  - upcoming subject_assessments rows
     * @param {Array} params.recentlyViewed - recently viewed lesson items from localStorage
     * @returns {Array} Sorted recommendations (max 5)
     */
    generateRecommendations: ({ grades, assignments, recentlyViewed }) => {
        const dismissed = getDismissedIds();
        const subjectAverages = computeSubjectAverages(grades);

        const all = [
            ...checkDueSoon(assignments),
            ...checkLowGrades(grades),
            ...checkLowScoreSubjects(subjectAverages),
            ...checkContinueLessons(recentlyViewed),
            ...checkImprovableSubjects(subjectAverages),
            ...checkStreak(recentlyViewed),
        ];

        return all
            .filter(rec => !dismissed.includes(rec.id))
            .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
            .slice(0, MAX_RECOMMENDATIONS);
    },

    /** Mark a recommendation as dismissed for this session */
    dismissRecommendation: (id) => {
        const dismissed = getDismissedIds();
        if (!dismissed.includes(id)) {
            dismissed.push(id);
            sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
        }
    }
};
