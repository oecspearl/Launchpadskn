import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContextSupabase';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { TutorProvider } from './contexts/TutorContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';

import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineAlert from './components/common/OfflineAlert';
import AppLayout from './components/layout/AppLayout';
import AppRoutes from './routes/AppRoutes';
import queryClient from './config/queryClient';
import { initKeyboardShortcuts, cleanupKeyboardShortcuts } from './utils/keyboardShortcuts';
import { isRole, ROLES } from './constants/roles';

const AITutorWidget = lazy(() => import('./components/Student/AITutorWidget'));

function StudentTutorWidget() {
  const { user } = useAuth();
  if (!isRole(user, ROLES.STUDENT)) return null;
  return (
    <Suspense fallback={null}>
      <AITutorWidget />
    </Suspense>
  );
}

function App() {
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
                <SidebarProvider>
                  <BreadcrumbProvider>
                    <div className="App">
                      <OfflineAlert />
                      <AppLayout>
                        <TutorProvider>
                          <AppRoutes />
                          <StudentTutorWidget />
                        </TutorProvider>
                      </AppLayout>
                    </div>
                  </BreadcrumbProvider>
                </SidebarProvider>
              </Router>
            </NotificationsProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;