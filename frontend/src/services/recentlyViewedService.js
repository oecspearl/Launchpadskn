/**
 * Recently Viewed Service
 * Tracks and manages recently viewed items in localStorage
 */

const STORAGE_KEY = 'lms_recently_viewed';
const MAX_ITEMS_PER_TYPE = 5;

/**
 * Get all recently viewed items
 * @returns {Object} Object with arrays of items by type
 */
export const getRecentlyViewed = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error reading recently viewed:', error);
        return {};
    }
};

/**
 * Add an item to recently viewed
 * @param {string} type - Type of item ('lesson', 'subject', 'assignment', 'class')
 * @param {Object} item - Item data to store
 */
export const addRecentlyViewed = (type, item) => {
    try {
        const recentlyViewed = getRecentlyViewed();

        if (!recentlyViewed[type]) {
            recentlyViewed[type] = [];
        }

        // Remove if already exists (to update timestamp and move to front)
        recentlyViewed[type] = recentlyViewed[type].filter(
            (existing) => existing.id !== item.id
        );

        // Add timestamp
        const itemWithTimestamp = {
            ...item,
            viewedAt: new Date().toISOString()
        };

        // Add to beginning of array
        recentlyViewed[type].unshift(itemWithTimestamp);

        // Limit to MAX_ITEMS_PER_TYPE
        if (recentlyViewed[type].length > MAX_ITEMS_PER_TYPE) {
            recentlyViewed[type] = recentlyViewed[type].slice(0, MAX_ITEMS_PER_TYPE);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error adding recently viewed:', error);
    }
};

/**
 * Get recently viewed items by type
 * @param {string} type - Type of items to retrieve
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} Array of recently viewed items
 */
export const getRecentlyViewedByType = (type, limit = MAX_ITEMS_PER_TYPE) => {
    try {
        const recentlyViewed = getRecentlyViewed();
        const items = recentlyViewed[type] || [];
        return items.slice(0, limit);
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error getting recently viewed by type:', error);
        return [];
    }
};

/**
 * Clear all recently viewed items
 */
export const clearRecentlyViewed = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error clearing recently viewed:', error);
    }
};

/**
 * Clear recently viewed items by type
 * @param {string} type - Type of items to clear
 */
export const clearRecentlyViewedByType = (type) => {
    try {
        const recentlyViewed = getRecentlyViewed();
        delete recentlyViewed[type];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error clearing recently viewed by type:', error);
    }
};

/**
 * Remove a specific item from recently viewed
 * @param {string} type - Type of item
 * @param {string|number} id - Item ID to remove
 */
export const removeRecentlyViewed = (type, id) => {
    try {
        const recentlyViewed = getRecentlyViewed();

        if (recentlyViewed[type]) {
            recentlyViewed[type] = recentlyViewed[type].filter(
                (item) => item.id !== id
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
        }
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error removing recently viewed:', error);
    }
};

const recentlyViewedService = {
    getRecentlyViewed,
    addRecentlyViewed,
    getRecentlyViewedByType,
    clearRecentlyViewed,
    clearRecentlyViewedByType,
    removeRecentlyViewed
};

export default recentlyViewedService;
