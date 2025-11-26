import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import './OfflineAlert.css';

/**
 * OfflineAlert Component
 * Shows a non-intrusive banner when the user goes offline
 */
const OfflineAlert = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShow(true);
            // Hide "Back Online" message after 3 seconds
            setTimeout(() => setShow(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShow(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!show && isOnline) return null;

    return (
        <div className={`offline-alert-container ${show ? 'show' : ''}`}>
            <Alert
                variant={isOnline ? 'success' : 'warning'}
                className="mb-0 d-flex align-items-center shadow-sm"
            >
                {isOnline ? (
                    <>
                        <FaWifi className="me-2" />
                        <span>You are back online.</span>
                    </>
                ) : (
                    <>
                        <FaExclamationTriangle className="me-2" />
                        <span>You are currently offline. Some features may be unavailable.</span>
                    </>
                )}
            </Alert>
        </div>
    );
};

export default OfflineAlert;
