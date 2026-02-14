import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { FaBook } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './SubjectProgressCard.css';

/**
 * SubjectProgressCard Component
 * Display progress for a single subject
 */
const SubjectProgressCard = ({ subject }) => {
    const getGradeColor = (grade) => {
        if (grade >= 90) return '#10b981'; // green
        if (grade >= 80) return '#3b82f6'; // blue
        if (grade >= 70) return '#f59e0b'; // yellow
        if (grade >= 60) return '#ef4444'; // red
        return '#6b7280'; // gray
    };

    const getCompletionColor = (rate) => {
        if (rate === 100) return 'success';
        if (rate >= 75) return 'info';
        if (rate >= 50) return 'warning';
        return 'danger';
    };

    return (
        <Card className="subject-progress-card border-0 shadow-sm h-100">
            <Card.Body>
                <div className="subject-header">
                    <div className="subject-icon">
                        <FaBook />
                    </div>
                    <div className="subject-info">
                        <h6 className="subject-name">{subject.name}</h6>
                        {subject.code && (
                            <span className="subject-code">{subject.code}</span>
                        )}
                    </div>
                </div>

                {subject.teacher && (
                    <div className="subject-teacher">
                        <small className="text-muted">Teacher: {subject.teacher}</small>
                    </div>
                )}

                <div className="progress-section mt-3">
                    {/* Grade Circle */}
                    <div className="grade-circle">
                        <CircularProgressbar
                            value={subject.averageGrade || 0}
                            text={subject.averageGrade ? `${subject.averageGrade}%` : 'N/A'}
                            styles={buildStyles({
                                textSize: '24px',
                                pathColor: getGradeColor(subject.averageGrade),
                                textColor: '#374151',
                                trailColor: '#e5e7eb'
                            })}
                        />
                        <div className="grade-label">Average Grade</div>
                    </div>

                    {/* Completion Stats */}
                    <div className="completion-stats mt-3">
                        <div className="stat-row">
                            <span className="stat-label">Assignments:</span>
                            <span className="stat-value">
                                {subject.completedAssignments} / {subject.totalAssignments}
                            </span>
                        </div>

                        <ProgressBar
                            now={subject.completionRate}
                            variant={getCompletionColor(subject.completionRate)}
                            className="mt-2"
                            style={{ height: '8px' }}
                        />

                        <div className="completion-rate mt-2">
                            <Badge bg={getCompletionColor(subject.completionRate)}>
                                {subject.completionRate}% Complete
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                {subject.averageGrade >= 90 && (
                    <div className="subject-insight success mt-3">
                        <small>🌟 Excellent performance!</small>
                    </div>
                )}
                {subject.completionRate < 50 && subject.totalAssignments > 0 && (
                    <div className="subject-insight warning mt-3">
                        <small>⚠️ Catch up on assignments</small>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default SubjectProgressCard;
