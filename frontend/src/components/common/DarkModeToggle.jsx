import React from 'react';
import { Button } from 'react-bootstrap';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import './DarkModeToggle.css';

const DarkModeToggle = ({ className = '', size = 'sm', variant = 'outline-secondary' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`dark-mode-toggle ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <>
          <FaSun className="me-1" />
          <span className="d-none d-sm-inline">Light</span>
        </>
      ) : (
        <>
          <FaMoon className="me-1" />
          <span className="d-none d-sm-inline">Dark</span>
        </>
      )}
    </Button>
  );
};

export default DarkModeToggle;

