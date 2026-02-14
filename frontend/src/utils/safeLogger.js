/**
 * Safe logging utility to prevent "Cannot convert object to primitive value" errors
 * when logging complex objects with circular references.
 *
 * DEV-ONLY wrappers: devLog, devWarn, devError only log in development mode.
 */

const isDev = import.meta.env.DEV;

/** Log only in development */
export function devLog(...args) { if (isDev) console.log(...args); }
/** Warn only in development */
export function devWarn(...args) { if (isDev) console.warn(...args); }
/** Error only in development */
export function devError(...args) { if (isDev) safeError(...args); }

/**
 * Safely converts an error or object to a string representation
 * @param {any} obj - The object to convert
 * @returns {string} - String representation of the object
 */
export function safeStringify(obj) {
  if (obj === null || obj === undefined) {
    return String(obj);
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (obj instanceof Error) {
    return obj.message || obj.toString();
  }

  // Try to stringify, but catch circular reference errors
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  } catch (e) {
    // If stringify fails, try to extract useful info
    try {
      if (obj.message) return obj.message;
      if (obj.toString) return obj.toString();
      return '[Object]';
    } catch {
      return '[Unable to stringify]';
    }
  }
}

/**
 * Safely logs an error with multiple arguments
 * @param {...any} args - Arguments to log
 */
export function safeError(...args) {
  try {
    const seen = new WeakSet();
    const safeArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          message: arg.message || 'Unknown error',
          stack: arg.stack,
          name: arg.name
        };
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(JSON.stringify(arg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            return value;
          }));
        } catch {
          return '[Object]';
        }
      }
      return arg;
    });
    console.error(...safeArgs);
  } catch (e) {
    // Last resort: log a simple message
    try {
      console.error('Error logging failed:', String(e?.message || e));
    } catch {
      // If even that fails, do nothing
    }
  }
}

/**
 * Safely logs a warning with multiple arguments
 * @param {...any} args - Arguments to log
 */
export function safeWarn(...args) {
  try {
    const seen = new WeakSet();
    const safeArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          message: arg.message || 'Unknown warning',
          stack: arg.stack,
          name: arg.name
        };
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(JSON.stringify(arg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            return value;
          }));
        } catch {
          return '[Object]';
        }
      }
      return arg;
    });
    console.warn(...safeArgs);
  } catch (e) {
    // Last resort: log a simple message
    try {
      console.warn('Warning logging failed:', String(e?.message || e));
    } catch {
      // If even that fails, do nothing
    }
  }
}

