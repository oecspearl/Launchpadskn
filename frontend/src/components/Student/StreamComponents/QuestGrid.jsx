import React from 'react';
import { Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import '../LessonsStream.css';

const QuestGrid = ({ quests, getGradient, formatDate, formatTime, calculateXP }) => {
    const navigate = useNavigate();

    if (!quests || quests.length === 0) return null;

    return (
        <div className="quest-section">
            <div className="section-header">
                <div className="section-title">
                    <FaCalendarAlt className="text-primary" />
                    Upcoming Lessons
                </div>
                <Badge bg="primary" pill>{quests.length} New</Badge>
            </div>

            <div className="quest-grid">
                {quests.map((lesson) => (
                    <div
                        key={lesson.lesson_id}
                        className="quest-card"
                        onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                    >
                        <div className="quest-visual" />
                        <div className="quest-content">
                            <div className="quest-date">{formatDate(lesson.lesson_date)}</div>
                            <h3 className="quest-title">{lesson.lesson_title}</h3>
                            <p className="quest-desc">{lesson.description || 'No description available.'}</p>

                            <div className="quest-footer">
                                <div className="xp-badge">
                                    <FaClock />
                                    {calculateXP(lesson.start_time, lesson.end_time)} min
                                </div>
                                <div style={{ color: 'var(--ls-text-muted)', fontSize: '0.85rem' }}>
                                    <FaClock className="me-1" />
                                    {formatTime(lesson.start_time)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuestGrid;
