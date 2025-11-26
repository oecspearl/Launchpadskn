import React, { useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaTimes
} from 'react-icons/fa';
import './Toast.css';

/**
 * Toast notification component
 * Displays temporary notification messages with auto-dismiss
 * 
 * @param {string} message - Toast message text
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {function} onClose - Callback when toast is dismissed
 */
const Toast = ({ message, type = 'info', onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="toast-icon" />;
            case 'error':
                return <FaExclamationCircle className="toast-icon" />;
            case 'warning':
                return <FaExclamationTriangle className="toast-icon" />;
            case 'info':
            default:
                return <FaInfoCircle className="toast-icon" />;
        }
    };

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-visible' : ''}`}>
            <div className="toast-content">
                {getIcon()}
                <span className="toast-message">{message}</span>
            </div>
            <button
                className="toast-close"
                onClick={handleClose}
                aria-label="Close notification"
            >
                <FaTimes />
            </button>
        </div>
    );
};

export default Toast;
