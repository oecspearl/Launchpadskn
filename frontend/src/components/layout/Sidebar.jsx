import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useSidebar } from '../../contexts/SidebarContext';
import { messageService } from '../../services/messageService';
import SKNFlagLogo from '../common/SKNFlagLogo';
import sidebarNavConfig from '../../config/sidebarNavConfig';
import { toDbRole } from '../../constants/roles';
import './Sidebar.css';

const DASHBOARD_ROUTES = {
  admin: '/admin/dashboard',
  school_admin: '/school-admin/dashboard',
  instructor: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard',
};

const PORTAL_SUBTITLES = {
  admin: 'SKN · Admin Console',
  school_admin: 'SKN · School Admin',
  instructor: 'SKN · Teacher Portal',
  student: 'SKN · Student Portal',
  parent: 'SKN · Parent Portal',
};

function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const location = useLocation();

  const role = toDbRole(user?.role);
  const menuItems = sidebarNavConfig[role] || [];

  const brandRoute = DASHBOARD_ROUTES[role] || '/';
  const brandName = user?.institution_name || 'LaunchPad';
  const brandSub = PORTAL_SUBTITLES[role] || 'SKN · LaunchPad';

  // Live counts resolved against item.badgeKey in the nav config.
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user?.user_id) return undefined;
    messageService.getUnreadCount(user.user_id).then(setUnreadMessages).catch(() => {});
    const unsubscribe = messageService.subscribeToUnreadCount(user.user_id, setUnreadMessages);
    return unsubscribe;
  }, [user?.user_id]);

  const badgeCounts = { messages: unreadMessages };

  // Returns { text, variant } for an item, or null when nothing to show.
  const resolveBadge = (item) => {
    if (item.badgeKey) {
      const count = badgeCounts[item.badgeKey] || 0;
      if (count <= 0) return null;
      return { text: count > 99 ? '99+' : String(count), variant: item.badgeVariant || 'red' };
    }
    if (item.badge) {
      return { text: String(item.badge.text), variant: item.badge.variant || 'green' };
    }
    return null;
  };

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
        {/* Brand header — top of the sidebar column */}
        <Link to={brandRoute} className="sidebar-brand" onClick={closeMobile} title={brandName}>
          <span className="sidebar-brand-logo">
            {user?.institution_logo_url ? (
              <img src={user.institution_logo_url} alt="" />
            ) : (
              <SKNFlagLogo width={34} height={22} />
            )}
          </span>
          {!isCollapsed && (
            <span className="sidebar-brand-text">
              <span className="sidebar-brand-name">{brandName}</span>
              <span className="sidebar-brand-sub">{brandSub}</span>
            </span>
          )}
        </Link>

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
            const badge = resolveBadge(item);

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
                {!isCollapsed && badge && (
                  <span className={`sidebar-item-badge sidebar-item-badge--${badge.variant}`}>
                    {badge.text}
                  </span>
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
