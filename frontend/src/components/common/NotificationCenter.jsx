import React, { useState, useEffect, useRef } from 'react';
import { Dropdown, Badge, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FaBell, FaCheck, FaCheckDouble, FaExclamationCircle, FaInfoCircle, FaGraduationCap, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationCenter.css';

/**
 * NotificationCenter Component
 * Bell icon with dropdown showing recent notifications
 */
const NotificationCenter = () => {
    const { notifications, unreadCount, isLoading, markNotificationAsRead, refreshNotifications } = useNotifications();
    const [show, setShow] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Refresh when dropdown opens
    useEffect(() => {
        if (show) {
            refreshNotifications({ limit: 5 });
        }
    }, [show, refreshNotifications]);

    // Get icon for notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'grade_posted':
                return <FaCheck className="notification-type-icon text-success" />;
            case 'assignment_due':
            case 'deadline_reminder':
                return <FaExclamationCircle className="notification-type-icon text-warning" />;
            case 'announcement':
            case 'lesson_posted':
                return <FaInfoCircle className="notification-type-icon text-info" />;
            case 'system':
                return <FaGraduationCap className="notification-type-icon text-primary" />;
            default:
                return <FaBell className="notification-type-icon text-secondary" />;
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markNotificationAsRead(notification.notification_id);
        }

        // Navigate if has link
        if (notification.link_url) {
            navigate(notification.link_url);
        }

        // Close dropdown
        setShow(false);
    };

    const handleMarkAllRead = async () => {
        await markNotificationAsRead(null); // null = mark all
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return '';
        }
    };

    return (
        <Dropdown
            ref={dropdownRef}
            show={show}
            onToggle={(nextShow) => setShow(nextShow)}
            align="end"
            className="notification-center"
        >
            <Dropdown.Toggle
                as="div"
                className="notification-bell"
                onClick={() => setShow(!show)}
            >
                <FaBell size={18} />
                {unreadCount > 0 && (
                    <Badge bg="danger" className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="notification-dropdown">
                <div className="notification-header">
                    <div className="d-flex align-items-center gap-2">
                        <span className="notification-title">Notifications</span>
                        <FaCog
                            className="text-muted cursor-pointer hover-primary"
                            size={14}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/notification-preferences');
                                setShow(false);
                            }}
                            title="Notification Settings"
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="mark-all-read-btn"
                        >
                            <FaCheckDouble size={14} /> Mark all read
                        </Button>
                    )}
                </div>

                <div className="notification-list">
                    {isLoading ? (
                        <div className="notification-loading">
                            <Spinner animation="border" size="sm" variant="primary" />
                            <span className="ms-2">Loading...</span>
                        </div>
                    ) : notifications.length > 0 ? (
                        <ListGroup variant="flush">
                            {notifications.map((notification) => (
                                <ListGroup.Item
                                    key={notification.notification_id}
                                    action
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                >
                                    <div className="notification-content">
                                        <div className="notification-icon-wrapper">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="notification-text">
                                            <div className="notification-item-title">
                                                {notification.title}
                                                {!notification.is_read && (
                                                    <span className="unread-indicator"></span>
                                                )}
                                            </div>
                                            <div className="notification-item-message">
                                                {notification.message}
                                            </div>
                                            <div className="notification-time">
                                                {formatTimeAgo(notification.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <div className="no-notifications">
                            <FaBell className="no-notifications-icon" />
                            <p>No notifications</p>
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="notification-footer">
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                                navigate('/notifications');
                                setShow(false);
                            }}
                            className="view-all-btn"
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationCenter;
