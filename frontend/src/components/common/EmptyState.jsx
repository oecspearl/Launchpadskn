import React from 'react';
import { Button } from 'react-bootstrap';
import {
    FaInbox,
    FaSearch,
    FaExclamationTriangle,
    FaCheckCircle,
    FaFolderOpen,
    FaClipboardList
} from 'react-icons/fa';
import './EmptyState.css';

/**
 * EmptyState component - Displays user-friendly empty states with illustrations
 * 
 * @param {string} variant - Type of empty state: 'no-data', 'no-results', 'error', 'success', 'no-assignments', 'no-lessons'
 * @param {string} title - Main heading
 * @param {string} message - Description text
 * @param {object} action - Optional action button { label, onClick, variant }
 * @param {ReactNode} icon - Custom icon (overrides variant icon)
 */
const EmptyState = ({
    variant = 'no-data',
    title,
    message,
    action = null,
    icon = null
}) => {
    const getDefaultIcon = () => {
        if (icon) return icon;

        switch (variant) {
            case 'no-results':
                return <FaSearch className="empty-state-icon" />;
            case 'error':
                return <FaExclamationTriangle className="empty-state-icon" />;
            case 'success':
                return <FaCheckCircle className="empty-state-icon" />;
            case 'no-assignments':
                return <FaClipboardList className="empty-state-icon" />;
            case 'no-lessons':
                return <FaFolderOpen className="empty-state-icon" />;
            case 'no-data':
            default:
                return <FaInbox className="empty-state-icon" />;
        }
    };

    const getDefaultTitle = () => {
        if (title) return title;

        switch (variant) {
            case 'no-results':
                return 'No Results Found';
            case 'error':
                return 'Something Went Wrong';
            case 'success':
                return 'All Done!';
            case 'no-assignments':
                return 'No Assignments';
            case 'no-lessons':
                return 'No Lessons Available';
            case 'no-data':
            default:
                return 'No Data Available';
        }
    };

    const getDefaultMessage = () => {
        if (message) return message;

        switch (variant) {
            case 'no-results':
                return 'Try adjusting your search or filters to find what you\'re looking for.';
            case 'error':
                return 'We encountered an error while loading your data. Please try again.';
            case 'success':
                return 'You\'re all caught up!';
            case 'no-assignments':
                return 'There are no assignments at this time. Check back later!';
            case 'no-lessons':
                return 'No lessons have been scheduled yet.';
            case 'no-data':
            default:
                return 'There\'s nothing here right now.';
        }
    };

    return (
        <div className={`empty-state empty-state-${variant}`}>
            <div className="empty-state-content">
                {getDefaultIcon()}
                <h3 className="empty-state-title">{getDefaultTitle()}</h3>
                <p className="empty-state-message">{getDefaultMessage()}</p>
                {action && (
                    <Button
                        variant={action.variant || 'primary'}
                        onClick={action.onClick}
                        className="empty-state-action mt-3"
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
