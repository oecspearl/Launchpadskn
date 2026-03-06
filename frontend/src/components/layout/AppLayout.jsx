import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useSidebar } from '../../contexts/SidebarContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Breadcrumb from '../common/Breadcrumb';
import SKNTribar from '../common/SKNTribar';
import './AppLayout.css';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  const isPublicPage = PUBLIC_PATHS.includes(location.pathname) ||
    (!isAuthenticated && location.pathname.startsWith('/curriculum'));

  const showSidebar = isAuthenticated && !isPublicPage;

  // Homepage and other public pages render their own navigation
  const hideChrome = isPublicPage && !isAuthenticated;

  return (
    <div className="app-layout">
      {!hideChrome && <SKNTribar />}
      {!hideChrome && <TopBar />}

      {showSidebar && <Sidebar />}

      <main
        className={`app-content ${showSidebar ? 'with-sidebar' : ''} ${showSidebar && isCollapsed ? 'sidebar-collapsed' : ''} ${hideChrome ? 'no-chrome' : ''}`}
      >
        {showSidebar && <Breadcrumb />}
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
