import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import './Breadcrumb.css';

/**
 * Breadcrumb navigation component
 * Automatically generates breadcrumbs from the current route
 * 
 * @param {Array} customCrumbs - Optional custom breadcrumb items [{ label, path }]
 */
const Breadcrumb = ({ customCrumbs = null }) => {
  const location = useLocation();

  const generateBreadcrumbs = () => {
    if (customCrumbs) {
      return customCrumbs;
    }

    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on home page
    if (pathnames.length === 0) {
      return [];
    }

    const breadcrumbs = pathnames.map((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;

      // Format label: capitalize and replace hyphens/underscores
      let label = value
        .replace(/-|_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      // Handle UUIDs and IDs - show them as "Details" or specific label
      if (/^[0-9]+$/.test(value) || /^[a-f0-9-]{36}$/.test(value)) {
        label = 'Details';
      }

      // Specific route labels
      const routeLabels = {
        '/student': 'Student Portal',
        '/teacher': 'Teacher Portal',
        '/admin': 'Admin Portal',
        '/schooladmin': 'School Admin Portal',
        '/lessons': 'Lessons',
        '/subjects': 'Subjects',
        '/assignments': 'Assignments',
        '/classes': 'Classes',
        '/grades': 'Grades',
        '/timetable': 'Timetable',
        '/users': 'User Management',
        '/institutions': 'Institutions',
        '/curriculum': 'Curriculum',
      };

      if (routeLabels[path]) {
        label = routeLabels[path];
      }

      return { label, path };
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {/* Home Link */}
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <FaHome className="breadcrumb-home-icon" />
            <span className="breadcrumb-home-text">Home</span>
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