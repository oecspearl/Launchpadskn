import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Badge, Button, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaSearch, FaFilter, FaExclamationCircle, FaInfoCircle, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import { getNotifications, markAsRead, archiveNotifications, deleteNotifications } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { formatDistanceToNow } from 'date-fns';
import './NotificationsList.css';

/**
 * NotificationsList Component
 * Full page view of all notifications with filtering and management
 */
const NotificationsList = () => {
    const { user } = useAuth();
    const { fetchUnreadCount } = useNotifications();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, archived
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        loadNotifications();
    }, [user, filter]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const userId = user.user_id || user.userId;

            const options = {
                limit: 50
            };

            if (filter === 'unread') {
                options.unreadOnly = true;
            } else if (filter === 'archived') {
                options.archived = true;
            }

            const data = await getNotifications(userId, options);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            const userId = user.user_id || user.userId;
            await markAsRead(userId, id);

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
            );
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleArchive = async (id) => {
        try {
            const userId = user.user_id || user.userId;
            await archiveNotifications(userId, id);

            // Remove from list if not viewing archived
            if (filter !== 'archived') {
                setNotifications(prev => prev.filter(n => n.notification_id !== id));
            }
        } catch (error) {
            console.error('Error archiving:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) return;

        try {
            const userId = user.user_id || user.userId;
            await deleteNotifications(userId, id);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;

        const userId = user.user_id || user.userId;

        try {
            if (action === 'read') {
                await markAsRead(userId, selectedIds);
                setNotifications(prev =>
                    prev.map(n => selectedIds.includes(n.notification_id) ? { ...n, is_read: true } : n)
                );
                fetchUnreadCount();
            } else if (action === 'archive') {
                await archiveNotifications(userId, selectedIds);
                if (filter !== 'archived') {
                    setNotifications(prev => prev.filter(n => !selectedIds.includes(n.notification_id)));
                }
            } else if (action === 'delete') {
                if (!window.confirm(`Delete ${selectedIds.length} notifications?`)) return;
                await deleteNotifications(userId, selectedIds);
                setNotifications(prev => prev.filter(n => !selectedIds.includes(n.notification_id)));
            }

            setSelectedIds([]);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(n => n.notification_id));
        }
    };

    // Filter notifications locally by search and type
    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || n.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'grade_posted': return <FaCheck className="text-success" />;
            case 'assignment_due': return <FaExclamationCircle className="text-warning" />;
            case 'deadline_reminder': return <FaExclamationCircle className="text-danger" />;
            case 'system': return <FaGraduationCap className="text-primary" />;
            default: return <FaInfoCircle className="text-info" />;
        }
    };

    return (
        <Container className="notifications-page mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Notifications</h2>
                    <p className="text-muted">Stay updated with your course activities</p>
                </div>
                <Button
                    variant="outline-primary"
                    onClick={() => navigate('/notification-preferences')}
                >
                    <FaBell className="me-2" /> Settings
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                    <Row className="g-3 align-items-center">
                        <Col md={4}>
                            <div className="btn-group w-100">
                                <Button
                                    variant={filter === 'all' ? 'primary' : 'outline-primary'}
                                    onClick={() => setFilter('all')}
                                    size="sm"
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filter === 'unread' ? 'primary' : 'outline-primary'}
                                    onClick={() => setFilter('unread')}
                                    size="sm"
                                >
                                    Unread
                                </Button>
                                <Button
                                    variant={filter === 'archived' ? 'primary' : 'outline-primary'}
                                    onClick={() => setFilter('archived')}
                                    size="sm"
                                >
                                    Archived
                                </Button>
                            </div>
                        </Col>
                        <Col md={4}>
                            <InputGroup size="sm">
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control
                                    placeholder="Search notifications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                size="sm"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="assignment_due">Assignments</option>
                                <option value="grade_posted">Grades</option>
                                <option value="announcement">Announcements</option>
                                <option value="system">System</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    {selectedIds.length > 0 && (
                        <div className="bulk-actions mt-3 p-2 bg-light rounded d-flex align-items-center gap-3">
                            <span className="fw-bold">{selectedIds.length} selected</span>
                            <div className="vr"></div>
                            <Button variant="link" size="sm" onClick={() => handleBulkAction('read')}>
                                Mark Read
                            </Button>
                            <Button variant="link" size="sm" onClick={() => handleBulkAction('archive')}>
                                Archive
                            </Button>
                            <Button variant="link" size="sm" className="text-danger" onClick={() => handleBulkAction('delete')}>
                                Delete
                            </Button>
                        </div>
                    )}
                </Card.Header>

                <ListGroup variant="flush">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notification => (
                            <ListGroup.Item
                                key={notification.notification_id}
                                className={`notification-row ${!notification.is_read ? 'unread' : ''}`}
                            >
                                <div className="d-flex gap-3 align-items-start">
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedIds.includes(notification.notification_id)}
                                        onChange={() => toggleSelection(notification.notification_id)}
                                        className="mt-1"
                                    />

                                    <div className="notification-icon-large">
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-grow-1 cursor-pointer" onClick={() => !selectedIds.length && notification.link_url && navigate(notification.link_url)}>
                                        <div className="d-flex justify-content-between">
                                            <h6 className="mb-1 fw-bold">
                                                {notification.title}
                                                {!notification.is_read && <Badge bg="primary" className="ms-2 dot"> </Badge>}
                                            </h6>
                                            <small className="text-muted">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </small>
                                        </div>
                                        <p className="mb-1 text-secondary">{notification.message}</p>
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.is_read && (
                                            <Button
                                                variant="light"
                                                size="sm"
                                                title="Mark as read"
                                                onClick={() => handleMarkRead(notification.notification_id)}
                                            >
                                                <FaCheck />
                                            </Button>
                                        )}
                                        <Button
                                            variant="light"
                                            size="sm"
                                            title="Archive"
                                            onClick={() => handleArchive(notification.notification_id)}
                                        >
                                            <FaCheckDouble />
                                        </Button>
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <FaBell size={48} className="mb-3 opacity-25" />
                            <p>No notifications found</p>
                        </div>
                    )}
                </ListGroup>
            </Card>
        </Container>
    );
};

export default NotificationsList;
