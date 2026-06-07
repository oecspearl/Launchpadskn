export const ROLES = {
    ADMIN: 'ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    INSTRUCTOR: 'INSTRUCTOR',
    TEACHER: 'TEACHER', // Alias for INSTRUCTOR
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
    CURRICULUM_DESIGNER: 'CURRICULUM_DESIGNER',
    SUPER_ADMIN: 'SUPER_ADMIN'
};

export const INSTITUTION_TYPES = {
    SECONDARY_SCHOOL: 'SECONDARY_SCHOOL',
    PRIMARY_SCHOOL: 'PRIMARY_SCHOOL',
    TERTIARY_INSTITUTION: 'TERTIARY_INSTITUTION',
    MINISTRY_OF_EDUCATION: 'MINISTRY_OF_EDUCATION',
    OTHER: 'OTHER'
};

export const INSTITUTION_TYPE_LABELS = {
    SECONDARY_SCHOOL: 'Secondary School',
    PRIMARY_SCHOOL: 'Primary School',
    TERTIARY_INSTITUTION: 'Tertiary Institution',
    MINISTRY_OF_EDUCATION: 'Ministry of Education',
    OTHER: 'Other'
};

// ─── Role normalization — single source of truth ──────────────────────────────
// The app holds roles UPPERCASE in memory; the database stores them lowercase.
// These three helpers are the only place that decides how a role is cased or
// mapped, so every component/service stays consistent.

// Roles that have a dedicated in-app experience. SUPER_ADMIN folds to ADMIN and
// TEACHER folds to INSTRUCTOR (alias); anything unknown falls back to STUDENT.
const VALID_APP_ROLES = [
    ROLES.ADMIN, ROLES.SCHOOL_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT, ROLES.PARENT
];

/**
 * Canonical IN-APP role (UPPERCASE). Use for `user.role` and all comparisons.
 */
export function normalizeRole(role) {
    const upper = (role || '').toString().toUpperCase().trim();
    if (upper === 'TEACHER') return ROLES.INSTRUCTOR;
    if (upper === ROLES.SUPER_ADMIN) return ROLES.ADMIN;
    return VALID_APP_ROLES.includes(upper) ? upper : ROLES.STUDENT;
}

/**
 * DB role value (lowercase, TEACHER -> instructor). Use for inserts/updates and
 * `.eq('role', ...)` queries against the `users` table.
 */
export function toDbRole(role) {
    const lower = (role || '').toString().toLowerCase().trim();
    return lower === 'teacher' ? 'instructor' : lower;
}

/**
 * Casing-agnostic role check. Accepts a role string or a user object:
 *   isRole(user, ROLES.STUDENT)  |  isRole(user?.role, ROLES.INSTRUCTOR)
 */
export function isRole(roleOrUser, target) {
    const role = roleOrUser && typeof roleOrUser === 'object' ? roleOrUser.role : roleOrUser;
    return normalizeRole(role) === normalizeRole(target);
}
