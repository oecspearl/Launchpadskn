import { lazy } from 'react';

/**
 * Safely lazy-loads a component, catching any initialization errors
 * that might occur during module loading
 * @param {Function} importFunc - Function that returns a promise for the component
 * @param {string} componentName - Name of the component for error messages
 * @returns {React.LazyExoticComponent} - Lazy-loaded component
 */
export function safeLazy(importFunc, componentName = 'Component') {
  return lazy(() => {
    return importFunc().catch((error) => {
      // Safely log the error without causing "Cannot convert object to primitive value"
      const errorMessage = error?.message || String(error) || 'Unknown error';
      console.error(`Failed to load ${componentName}:`, errorMessage);
      
      // Return a fallback component that shows an error message
      return {
        default: () => {
          return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>Failed to load {componentName}</h3>
              <p>Error: {errorMessage}</p>
              <button onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          );
        }
      };
    });
  });
}

