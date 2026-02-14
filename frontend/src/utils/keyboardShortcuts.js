/**
 * Keyboard Shortcuts Manager
 * Global keyboard shortcuts for navigation and actions
 */

const shortcuts = {
    'Alt+D': { action: 'dashboard', description: 'Go to Dashboard' },
    'Alt+L': { action: 'lessons', description: 'Go to Lessons/Classes' },
    'Alt+A': { action: 'assignments', description: 'Go to Assignments' },
    'Alt+S': { action: 'search', description: 'Focus Search' },
    'Alt+T': { action: 'timetable', description: 'View Timetable' },
    '?': { action: 'help', description: 'Show Keyboard Shortcuts' }
};

let handlers = {};
let isInitialized = false;

/**
 * Handle keyboard event
 */
const handleKeyDown = (event) => {
    // Build shortcut key string
    const parts = [];
    if (event.altKey) parts.push('Alt');
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // Don't include modifier keys in the key part
    if (!['Alt', 'Control', 'Shift', 'Meta'].includes(event.key)) {
        parts.push(event.key);
    }

    const shortcut = parts.join('+');

    // Check if this shortcut is registered
    if (shortcuts[shortcut]) {
        // Don't trigger if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );

        // Allow '?' to work anywhere
        if (shortcut === '?' && !isInputField) {
            event.preventDefault();
            if (handlers[shortcuts[shortcut].action]) {
                handlers[shortcuts[shortcut].action]();
            }
            return;
        }

        // For other shortcuts, don't trigger in input fields
        if (!isInputField) {
            event.preventDefault();
            const action = shortcuts[shortcut].action;
            if (handlers[action]) {
                handlers[action]();
            }
        }
    }
};

/**
 * Initialize keyboard shortcuts
 */
export const initKeyboardShortcuts = () => {
    if (isInitialized) {
        return;
    }

    document.addEventListener('keydown', handleKeyDown);
    isInitialized = true;
};

/**
 * Cleanup keyboard shortcuts
 */
export const cleanupKeyboardShortcuts = () => {
    document.removeEventListener('keydown', handleKeyDown);
    isInitialized = false;
    handlers = {};
};

/**
 * Register a handler for a specific action
 * @param {string} action - Action name
 * @param {function} handler - Handler function
 */
export const registerShortcutHandler = (action, handler) => {
    handlers[action] = handler;
};

/**
 * Unregister a handler for a specific action
 * @param {string} action - Action name
 */
export const unregisterShortcutHandler = (action) => {
    delete handlers[action];
};

/**
 * Get all available shortcuts
 */
export const getAvailableShortcuts = () => {
    return Object.entries(shortcuts).map(([key, { description }]) => ({
        key,
        description
    }));
};

const keyboardShortcuts = {
    initKeyboardShortcuts,
    cleanupKeyboardShortcuts,
    registerShortcutHandler,
    unregisterShortcutHandler,
    getAvailableShortcuts
};

export default keyboardShortcuts;
