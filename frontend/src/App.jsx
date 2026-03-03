import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContextSupabase';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { TutorProvider } from './contexts/TutorContext';

import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineAlert from './components/common/OfflineAlert';
import AppRoutes from './routes/AppRoutes';
import queryClient from './config/queryClient';
import { initKeyboardShortcuts, cleanupKeyboardShortcuts } from './utils/keyboardShortcuts';

const AITutorWidget = lazy(() => import('./components/Student/AITutorWidget'));

function StudentTutorWidget() {
  const { user } = useAuth();
  if (user?.role?.toUpperCase() !== 'STUDENT') return null;
  return (
    <Suspense fallback={null}>
      <AITutorWidget />
    </Suspense>
  );
}

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
        <AuthProvider>
          <ToastProvider>
            <NotificationsProvider>
              <Router>
                <div className="App">
                  <OfflineAlert />
                  <Navbar />
                  <div style={{ paddingTop: '70px' }}>
                    <TutorProvider>
                      <AppRoutes />
                      <StudentTutorWidget />
                    </TutorProvider>
                  </div>
                </div>
              </Router>
            </NotificationsProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;