/**
 * Search Service
 * Global search across lessons, assignments, subjects, and users using Fuse.js
 */

import Fuse from 'fuse.js';
import { classService } from './classService';
import { studentService } from './studentService';

const SEARCH_HISTORY_KEY = 'lms_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Search configuration for Fuse.js
 */
const fuseOptions = {
    threshold: 0.3, // 0 = perfect match, 1 = match anything
    keys: [], // Will be set per search type
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
};

/**
 * Perform global search across all content types
 * @param {string} query - Search query
 * @param {Object} user - Current user object
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Categorized search results
 */
export const globalSearch = async (query, user, filters = {}) => {
    if (!query || query.length < 2) {
        return {
            lessons: [],
            assignments: [],
            subjects: [],
            users: [],
            totalResults: 0
        };
    }

    const results = {
        lessons: [],
        assignments: [],
        subjects: [],
        users: [],
        totalResults: 0
    };

    try {
        // Search lessons
        if (!filters.type || filters.type === 'lessons') {
            results.lessons = await searchLessons(query, user);
        }

        // Search assignments
        if (!filters.type || filters.type === 'assignments') {
            results.assignments = await searchAssignments(query, user);
        }

        // Search subjects
        if (!filters.type || filters.type === 'subjects') {
            results.subjects = await searchSubjects(query, user);
        }

        // Search users (admins/teachers only)
        if ((!filters.type || filters.type === 'users') && ['ADMIN', 'INSTRUCTOR'].includes(user?.role)) {
            results.users = await searchUsers(query);
        }

        results.totalResults =
            results.lessons.length +
            results.assignments.length +
            results.subjects.length +
            results.users.length;

        // Save to search history
        saveSearchHistory(query);

        return results;
    } catch (error) {
        console.error('Search error:', error);
        return results;
    }
};

/**
 * Search lessons
 */
const searchLessons = async (query, user) => {
    try {
        let lessons = [];

        // Get lessons based on user role
        if (user.role === 'STUDENT') {
            // Get student's class lessons
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // Last month
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // Next month

            lessons = await classService.getLessonsForStudent(
                user.user_id,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
        } else if (user.role === 'INSTRUCTOR') {
            // Get teacher's lessons
            const teacherId = user.user_id || user.userId || user.id;
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            lessons = await classService.getLessonsByTeacher(
                teacherId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
        }

        // Configure search
        const fuse = new Fuse(lessons, {
            ...fuseOptions,
            keys: [
                'lesson_title',
                'lesson_description',
                'class_subject.subject_offering.subject.subject_name'
            ]
        });

        const searchResults = fuse.search(query);

        return searchResults.slice(0, 10).map(result => ({
            ...result.item,
            type: 'lesson',
            searchScore: result.score,
            matchedFields: result.matches?.map(m => m.key) || []
        }));
    } catch (error) {
        console.error('Lesson search error:', error);
        return [];
    }
};

/**
 * Search assignments
 */
const searchAssignments = async (query, user) => {
    try {
        let assignments = [];

        if (user.role === 'STUDENT') {
            // Get student's assignments
            assignments = await studentService.getStudentAssignments(user.user_id);
        } else if (user.role === 'INSTRUCTOR') {
            // Get teacher's class subjects and their assignments
            const teacherId = user.user_id || user.userId || user.id;
            const classSubjects = await classService.getClassesByTeacher(teacherId);

            for (const cs of classSubjects) {
                const csAssignments = await studentService.getAssessmentsByClassSubject(cs.class_subject_id);
                assignments.push(...(csAssignments || []));
            }
        }

        const fuse = new Fuse(assignments, {
            ...fuseOptions,
            keys: ['assessment_name', 'description', 'assessment_type']
        });

        const searchResults = fuse.search(query);

        return searchResults.slice(0, 10).map(result => ({
            ...result.item,
            type: 'assignment',
            searchScore: result.score,
            matchedFields: result.matches?.map(m => m.key) || []
        }));
    } catch (error) {
        console.error('Assignment search error:', error);
        return [];
    }
};

/**
 * Search subjects
 */
const searchSubjects = async (query, user) => {
    try {
        let subjects = [];

        if (user.role === 'STUDENT') {
            // Get student's subjects
            const classData = await classService.getStudentClass(user.user_id);
            subjects = classData?.class_subjects || [];
        } else if (user.role === 'INSTRUCTOR') {
            // Get teacher's subjects
            const teacherId = user.user_id || user.userId || user.id;
            subjects = await classService.getClassesByTeacher(teacherId);
        }

        const fuse = new Fuse(subjects, {
            ...fuseOptions,
            keys: [
                'subject_offering.subject.subject_name',
                'subject_offering.subject.subject_code',
                'teacher.name'
            ]
        });

        const searchResults = fuse.search(query);

        return searchResults.slice(0, 10).map(result => ({
            ...result.item,
            type: 'subject',
            searchScore: result.score,
            matchedFields: result.matches?.map(m => m.key) || []
        }));
    } catch (error) {
        console.error('Subject search error:', error);
        return [];
    }
};

/**
 * Search users (admin/teacher only)
 */
const searchUsers = async (query) => {
    try {
        // This would need a backend endpoint to search users
        // For now, return empty array
        // TODO: Implement user search endpoint
        return [];
    } catch (error) {
        console.error('User search error:', error);
        return [];
    }
};

/**
 * Get search history from localStorage
 * @returns {Array<string>} Recent searches
 */
export const getSearchHistory = () => {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error reading search history:', error);
        return [];
    }
};

/**
 * Save search query to history
 * @param {string} query - Search query
 */
export const saveSearchHistory = (query) => {
    try {
        if (!query || query.trim().length < 2) return;

        const history = getSearchHistory();

        // Remove if already exists
        const filtered = history.filter(item => item.toLowerCase() !== query.toLowerCase());

        // Add to beginning
        const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);

        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
};

/**
 * Clear search history
 */
export const clearSearchHistory = () => {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing search history:', error);
    }
};

/**
 * Generate search suggestions based on query
 * @param {string} query - Partial query
 * @returns {Array<string>} Suggestions
 */
export const getSearchSuggestions = (query) => {
    const history = getSearchHistory();

    if (!query || query.length < 2) {
        return history.slice(0, 5);
    }

    // Filter history by query
    const matching = history.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
    );

    return matching.slice(0, 5);
};

const searchService = {
    globalSearch,
    getSearchHistory,
    saveSearchHistory,
    clearSearchHistory,
    getSearchSuggestions
};

export default searchService;
