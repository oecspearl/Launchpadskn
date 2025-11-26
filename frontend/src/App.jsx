import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContextSupabase';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineAlert from './components/common/OfflineAlert';
import AppRoutes from './routes/AppRoutes';
import queryClient from './config/queryClient';
import { initKeyboardShortcuts, cleanupKeyboardShortcuts } from './utils/keyboardShortcuts';

function App() {
  // Initialize keyboard shortcuts on mount
  useEffect(() => {
    initKeyboardShortcuts();
    return () => {
      cleanupKeyboardShortcuts();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <NotificationsProvider>
                <Router>
                  <div className="App">
                    <OfflineAlert />
                    <Navbar />
                    <Container className="mt-4">
                      <AppRoutes />
                    </Container>
                  </div>
                </Router>
              </NotificationsProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;