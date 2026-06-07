import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { toDbRole } from '../../constants/roles';
import './Breadcrumb.css';

const routeLabels = {
  // Role prefixes
  '/student': 'Student',
  '/teacher': 'Teacher',
  '/admin': 'Admin',
  '/school-admin': 'School Admin',
  '/parent': 'Parent',

  // Student
  '/student/dashboard': 'Dashboard',
  '/student/subjects': 'My Subjects',
  '/student/progress': 'Progress',
  '/student/help': 'Help',
  '/student/courses/register': 'Course Registration',

  // Teacher
  '/teacher/dashboard': 'Dashboard',
  '/teacher/lessons/create': 'Create Lesson',
  '/teacher/content-library': 'Content Library',
  '/teacher/lesson-templates': 'Lesson Templates',
  '/teacher/curriculum': 'Curriculum',
  '/teacher/report-cards': 'Report Cards',
  '/teacher/tutor-settings': 'AI Tutor Settings',
  '/teacher/help': 'Help',

  // Admin
  '/admin/dashboard': 'Dashboard',
  '/admin/forms': 'Forms',
  '/admin/classes': 'Classes',
  '/admin/subjects': 'Subjects',
  '/admin/students': 'Students',
  '/admin/instructors': 'Instructors',
  '/admin/courses': 'Courses',
  '/admin/departments': 'Departments',
  '/admin/users': 'Users',
  '/admin/arvr-content': 'AR/VR Content',
  '/admin/student-assignment': 'Student Assignment',
  '/admin/class-subject-assignment': 'Class-Subject Assignment',
  '/admin/course-assignment': 'Course Assignment',
  '/admin/enrollment-approval': 'Enrollment Approval',
  '/admin/help': 'Help',

  // School Admin
  '/school-admin/dashboard': 'Dashboard',
  '/school-admin/forms': 'Forms',
  '/school-admin/classes': 'Classes',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/students': 'Students',
  '/school-admin/instructors': 'Instructors',
  '/school-admin/reports': 'Reports',
  '/school-admin/report-cards': 'Report Cards',

  // Parent
  '/parent/dashboard': 'Dashboard',

  // Common
  '/messages': 'Messages',
  '/profile': 'Profile',
  '/change-password': 'Settings',
  '/help': 'Help',
  '/notifications': 'Notifications',
  '/notification-preferences': 'Notification Preferences',
  '/curriculum': 'Curriculum',
};

const getDashboardRoute = (role) => {
  switch (toDbRole(role)) {
    case 'admin': return '/admin/dashboard';
    case 'school_admin': return '/school-admin/dashboard';
    case 'instructor': return '/teacher/dashboard';
    case 'student': return '/student/dashboard';
    case 'parent': return '/parent/dashboard';
    default: return '/';
  }
};

/**
 * Breadcrumb navigation component
 * Automatically generates breadcrumbs from the current route
 *
 * @param {Array} customCrumbs - Optional custom breadcrumb items [{ label, path }]
 */
const Breadcrumb = ({ customCrumbs = null }) => {
  const location = useLocation();
  const { user } = useAuth();

  const dashboardRoute = getDashboardRoute(user?.role);

  const generateBreadcrumbs = () => {
    if (customCrumbs) {
      return customCrumbs;
    }

    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
      return [];
    }

    // Don't show breadcrumb if we're on the dashboard itself
    const fullPath = location.pathname;
    if (fullPath === dashboardRoute) {
      return [];
    }

    const breadcrumbs = [];

    for (let index = 0; index < pathnames.length; index++) {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;

      // Skip the role prefix segment if the full path has a known label
      if (index === 0 && routeLabels[path] && pathnames.length > 1) {
        continue;
      }

      let label = routeLabels[path];

      if (!label) {
        const value = pathnames[index];
        // Handle UUIDs and numeric IDs
        if (/^[0-9]+$/.test(value) || /^[a-f0-9-]{36}$/.test(value)) {
          label = 'Details';
        } else {
          label = value
            .replace(/-|_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
      }

      breadcrumbs.push({ label, path });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {/* Home Link — goes to role dashboard */}
        <li className="breadcrumb-item">
          <Link to={dashboardRoute} className="breadcrumb-link">
            <FaHome className="breadcrumb-home-icon" />
            <span className="breadcrumb-home-text">Dashboard</span>
          </Link>
        </li>

        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.path} className="breadcrumb-item">
              <FaChevronRight className="breadcrumb-separator" />
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} className="breadcrumb-link">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
