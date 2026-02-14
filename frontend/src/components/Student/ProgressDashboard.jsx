import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { FaTrophy, FaClock, FaCheckCircle, FaChartLine, FaAward } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { getStudentProgress, calculateAchievements } from '../../services/progressService';
import SubjectProgressCard from './SubjectProgressCard';
import './ProgressDashboard.css';

/**
 * ProgressDashboard Component
 * Comprehensive view of student academic progress
 */
const ProgressDashboard = () => {
    const { user } = useAuth();
    const [progressData, setProgressData] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProgressData();
    }, [user]);

    const loadProgressData = async () => {
        try {
            setIsLoading(true);
            const data = await getStudentProgress(user.user_id || user.userId);
            setProgressData(data);
            setAchievements(calculateAchievements(data));
        } catch (err) {
            console.error('Error loading progress:', err);
            setError('Failed to load progress data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading your progress...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!progressData) {
        return null;
    }

    const { overallStats, subjectProgress, gradeTrends, completionStats } = progressData;

    // Colors for charts
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <Container className="progress-dashboard mt-4">
            {/* Page Header */}
            <div className="dashboard-header mb-4">
                <h2>My Progress</h2>
                <p className="text-muted">Track your academic performance and achievements</p>
            </div>

            {/* Overall Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm">
                        <Card.Body>
                            <div className="stat-icon bg-primary-subtle">
                                <FaChartLine className="text-primary" />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{overallStats.averageGrade}%</div>
                                <div className="stat-label">Average Grade</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm">
                        <Card.Body>
                            <div className="stat-icon bg-success-subtle">
                                <FaCheckCircle className="text-success" />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{overallStats.completionRate}%</div>
                                <div className="stat-label">Completion Rate</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm">
                        <Card.Body>
                            <div className="stat-icon bg-warning-subtle">
                                <FaClock className="text-warning" />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{overallStats.onTimeRate}%</div>
                                <div className="stat-label">On-Time Rate</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm">
                        <Card.Body>
                            <div className="stat-icon bg-info-subtle">
                                <FaTrophy className="text-info" />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{achievements.length}</div>
                                <div className="stat-label">Achievements</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Achievements Section */}
            {achievements.length > 0 && (
                <Card className="mb-4 border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                        <h5 className="mb-0">
                            <FaAward className="me-2 text-warning" />
                            Your Achievements
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            {achievements.map((achievement) => (
                                <Col md={6} lg={3} key={achievement.id}>
                                    <div className="achievement-badge">
                                        <div className="achievement-icon">{achievement.icon}</div>
                                        <div className="achievement-title">{achievement.title}</div>
                                        <div className="achievement-desc">{achievement.description}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Grade Trend Chart */}
            {gradeTrends.length > 0 && (
                <Card className="mb-4 border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                        <h5 className="mb-0">
                            <FaChartLine className="me-2 text-primary" />
                            Grade Trends
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={gradeTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="average"
                                    stroke=" #3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 6 }}
                                    activeDot={{ r: 8 }}
                                    name="Average Grade"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card.Body>
                </Card>
            )}

            {/* Subject Progress */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                    <h5 className="mb-0">Subject Progress</h5>
                </Card.Header>
                <Card.Body>
                    {subjectProgress.length > 0 ? (
                        <Row className="g-4">
                            {subjectProgress.map((subject) => (
                                <Col md={6} lg={4} key={subject.id}>
                                    <SubjectProgressCard subject={subject} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p className="text-muted text-center py-4">No subjects found</p>
                    )}
                </Card.Body>
            </Card>

            {/* Completion Stats */}
            <Row className="g-4">
                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h6 className="mb-0">Upcoming Assignments</h6>
                        </Card.Header>
                        <Card.Body>
                            {completionStats.upcomingCount > 0 ? (
                                <div>
                                    <div className="mb-3">
                                        <Badge bg="primary" className="me-2">{completionStats.upcomingCount}</Badge>
                                        assignments due this week
                                    </div>
                                    <div className="assignment-list">
                                        {completionStats.upcoming.slice(0, 3).map((assignment, index) => (
                                            <div key={index} className="assignment-item">
                                                <div>{assignment.assessment_name}</div>
                                                <small className="text-muted">
                                                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted mb-0">No upcoming assignments</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h6 className="mb-0">Activity Summary</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="activity-item">
                                <span>Completed this week:</span>
                                <Badge bg="success">{completionStats.weeklyCompleted}</Badge>
                            </div>
                            <div className="activity-item">
                                <span>Completed this month:</span>
                                <Badge bg="info">{completionStats.monthlyCompleted}</Badge>
                            </div>
                            {completionStats.overdueCount > 0 && (
                                <div className="activity-item">
                                    <span>Overdue assignments:</span>
                                    <Badge bg="danger">{completionStats.overdueCount}</Badge>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProgressDashboard;
