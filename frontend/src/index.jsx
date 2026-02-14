import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/colors.css';
import './styles/global.css';
import './styles/components.css';
import './styles/mobile-enhancements.css';
import './index.css';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';

// Override console.error to safely handle objects that can't be converted to strings
// This prevents "Cannot convert object to primitive value" errors
// Only wraps the original to catch conversion errors, doesn't modify arguments
const originalConsoleError = console.error;
console.error = function(...args) {
  try {
    // Try to call original - if it throws a conversion error, handle it
    originalConsoleError.apply(console, args);
  } catch (e) {
    // If original throws (likely a conversion error), try to safely log
    if (e && e.message && typeof e.message === 'string' && e.message.includes('Cannot convert')) {
      try {
        const safeArgs = args.map(arg => {
          if (arg === null || arg === undefined) {
            return String(arg);
          }
          if (typeof arg !== 'object') {
            return arg;
          }
          if (arg instanceof Error) {
            return arg.message || String(arg);
          }
          try {
            return JSON.stringify(arg);
          } catch {
            return '[Object]';
          }
        });
        originalConsoleError.apply(console, safeArgs);
      } catch {
        // Silent fail - don't break the app
      }
    } else {
      // Re-throw if it's not a conversion error
      throw e;
    }
  }
};

// Error handler for unhandled errors
window.addEventListener('error', (event) => {
  const errorMsg = event.error?.message || String(event.error || 'Unknown error');
  console.error('Global error:', errorMsg);
});

window.addEventListener('unhandledrejection', (event) => {
  const reasonMsg = event.reason?.message || String(event.reason || 'Unknown rejection');
  console.error('Unhandled promise rejection:', reasonMsg);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Application Error</h1>
        <p>Failed to initialize the application. Please refresh the page.</p>
        <p style="color: red;">Error: ${error.message}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}