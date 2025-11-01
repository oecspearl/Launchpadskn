import React from 'react';
import { Breadcrumb as BootstrapBreadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaBuilding, FaUniversity, FaBook } from 'react-icons/fa';

function Breadcrumb({ items = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'dashboard':
        return <FaHome className="me-1" />;
      case 'institution':
        return <FaBuilding className="me-1" />;
      case 'department':
        return <FaUniversity className="me-1" />;
      case 'course':
        return <FaBook className="me-1" />;
      default:
        return null;
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <BootstrapBreadcrumb className="bg-light p-3 rounded mb-3">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <BootstrapBreadcrumb.Item
            key={index}
            active={isLast}
            linkAs={isLast ? 'span' : Link}
            linkProps={isLast ? {} : { to: item.path }}
            className={isLast ? 'text-dark fw-bold' : ''}
          >
            {getIcon(item.type)}
            {item.label}
          </BootstrapBreadcrumb.Item>
        );
      })}
    </BootstrapBreadcrumb>
  );
}

export default Breadcrumb;