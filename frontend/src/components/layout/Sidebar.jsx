import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useSidebar } from '../../contexts/SidebarContext';
import sidebarNavConfig from '../../config/sidebarNavConfig';
import './Sidebar.css';

function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const location = useLocation();

  const role = (user?.role || '').toLowerCase().trim();
  const menuItems = sidebarNavConfig[role] || [];

  const isItemActive = (path) => {
    if (location.pathname === path) return true;
    // For dashboard paths, only exact match
    if (path.endsWith('/dashboard')) return false;
    // For other paths, match child routes
    return location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="sidebar-divider" />;
            }

            if (item.section) {
              return (
                <div key={`section-${index}`} className="sidebar-section">
                  {!isCollapsed && <span>{item.section}</span>}
                </div>
              );
            }

            const Icon = item.icon;
            const active = isItemActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={closeMobile}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar-item-icon">
                  <Icon size={18} />
                </span>
                {!isCollapsed && (
                  <span className="sidebar-item-label">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* XP Progress (student only) */}
        {role === 'student' && !isCollapsed && (
          <div className="sidebar-xp">
            <div className="sidebar-xp__label">
              <span className="sidebar-xp__text">Level 1 · Learner</span>
              <span className="sidebar-xp__value">0 XP</span>
            </div>
            <div className="sidebar-xp__track">
              <div className="sidebar-xp__fill" style={{ width: '0%' }} />
            </div>
            <div className="sidebar-xp__sublabel">Keep learning to earn XP</div>
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
