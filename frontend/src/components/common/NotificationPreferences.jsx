import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaBell, FaEnvelope, FaMobile, FaClock, FaSave } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { getPreferences, updatePreferences } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import './NotificationPreferences.css';

/**
 * NotificationPreferences Component
 * Manage notification settings
 */
const NotificationPreferences = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState({
        assignment_notifications: true,
        grade_notifications: true,
        announcement_notifications: true,
        deadline_reminders: true,
        system_notifications: true,
        in_app_enabled: true,
        email_enabled: false,
        push_enabled: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        digest_enabled: false
    });

    useEffect(() => {
        loadPreferences();
    }, [user]);

    const loadPreferences = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const userId = user.user_id || user.userId;
            const data = await getPreferences(userId);

            // Format time strings to HH:MM for input[type="time"]
            const formatTime = (timeStr) => {
                if (!timeStr) return '22:00';
                return timeStr.substring(0, 5);
            };

            setPreferences({
                ...data,
                quiet_hours_start: formatTime(data.quiet_hours_start),
                quiet_hours_end: formatTime(data.quiet_hours_end)
            });
        } catch (error) {
            console.error('Error loading preferences:', error);
            showError('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const userId = user.user_id || user.userId;
            await updatePreferences(userId, preferences);
            showSuccess('Preferences saved successfully');
        } catch (error) {
            console.error('Error saving preferences:', error);
            showError('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading preferences...</p>
            </Container>
        );
    }

    return (
        <Container className="notification-preferences mt-4">
            <div className="preferences-header mb-4">
                <h2>Notification Settings</h2>
                <p className="text-muted">Manage how and when you receive notifications</p>
            </div>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col lg={8}>
                        {/* Notification Types */}
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="mb-0">
                                    <FaBell className="me-2 text-primary" />
                                    What to Notify Me About
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="preference-group">
                                    <Form.Check
                                        type="switch"
                                        id="assignment_notifications"
                                        name="assignment_notifications"
                                        label={
                                            <div>
                                                <div className="fw-bold">Assignments</div>
                                                <small className="text-muted">New assignments and updates</small>
                                            </div>
                                        }
                                        checked={preferences.assignment_notifications}
                                        onChange={handleChange}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="deadline_reminders"
                                        name="deadline_reminders"
                                        label={
                                            <div>
                                                <div className="fw-bold">Deadlines</div>
                                                <small className="text-muted">Reminders when assignments are due soon</small>
                                            </div>
                                        }
                                        checked={preferences.deadline_reminders}
                                        onChange={handleChange}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="grade_notifications"
                                        name="grade_notifications"
                                        label={
                                            <div>
                                                <div className="fw-bold">Grades & Feedback</div>
                                                <small className="text-muted">When assignments are graded or feedback is posted</small>
                                            </div>
                                        }
                                        checked={preferences.grade_notifications}
                                        onChange={handleChange}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="announcement_notifications"
                                        name="announcement_notifications"
                                        label={
                                            <div>
                                                <div className="fw-bold">Announcements</div>
                                                <small className="text-muted">Course announcements and lesson updates</small>
                                            </div>
                                        }
                                        checked={preferences.announcement_notifications}
                                        onChange={handleChange}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="system_notifications"
                                        name="system_notifications"
                                        label={
                                            <div>
                                                <div className="fw-bold">System Updates</div>
                                                <small className="text-muted">Maintenance and platform updates</small>
                                            </div>
                                        }
                                        checked={preferences.system_notifications}
                                        onChange={handleChange}
                                    />
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Delivery Methods */}
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="mb-0">
                                    <FaEnvelope className="me-2 text-primary" />
                                    How to Notify Me
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="preference-group">
                                    <Form.Check
                                        type="switch"
                                        id="in_app_enabled"
                                        name="in_app_enabled"
                                        label="In-App Notifications (Bell Icon)"
                                        checked={preferences.in_app_enabled}
                                        onChange={handleChange}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="email_enabled"
                                        name="email_enabled"
                                        label="Email Notifications"
                                        checked={preferences.email_enabled}
                                        onChange={handleChange}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="push_enabled"
                                        name="push_enabled"
                                        label="Push Notifications (Browser)"
                                        checked={preferences.push_enabled}
                                        onChange={handleChange}
                                        disabled // TODO: Implement push support
                                    />
                                    {preferences.push_enabled && (
                                        <Alert variant="info" className="mt-2 py-2 small">
                                            Push notifications require browser permission.
                                        </Alert>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Quiet Hours */}
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="mb-0">
                                    <FaClock className="me-2 text-primary" />
                                    Quiet Hours
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Check
                                    type="switch"
                                    id="quiet_hours_enabled"
                                    name="quiet_hours_enabled"
                                    label="Enable Quiet Hours"
                                    checked={preferences.quiet_hours_enabled}
                                    onChange={handleChange}
                                    className="mb-3"
                                />

                                {preferences.quiet_hours_enabled && (
                                    <Row className="g-3 align-items-center">
                                        <Col xs={6}>
                                            <Form.Group>
                                                <Form.Label>Start Time</Form.Label>
                                                <Form.Control
                                                    type="time"
                                                    name="quiet_hours_start"
                                                    value={preferences.quiet_hours_start}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Group>
                                                <Form.Label>End Time</Form.Label>
                                                <Form.Control
                                                    type="time"
                                                    name="quiet_hours_end"
                                                    value={preferences.quiet_hours_end}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12}>
                                            <small className="text-muted">
                                                Notifications received during these hours will be silenced but still saved.
                                            </small>
                                        </Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>

                        <div className="d-flex justify-content-end mb-5">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={saving}
                                className="px-4"
                            >
                                {saving ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="me-2" /> Save Preferences
                                    </>
                                )}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
};

export default NotificationPreferences;
