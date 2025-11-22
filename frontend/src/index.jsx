import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/colors.css';
import './styles/global.css';
import './styles/components.css';
import './styles/mobile-enhancements.css';
import './styles/dark-mode.css';
import './index.css';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';

// Error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
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