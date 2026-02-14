import React from 'react';
import { Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaGamepad, FaTrophy, FaClock } from 'react-icons/fa';
import '../LessonsStream.css';

const QuestGrid = ({ quests, getGradient, formatDate, formatTime, calculateXP }) => {
    const navigate = useNavigate();

    if (!quests || quests.length === 0) return null;

    return (
        <div className="quest-section">
            <div className="section-header">
                <div className="section-title">
                    <FaGamepad className="text-primary" />
                    Quest Log
                </div>
                <Badge bg="primary" pill>{quests.length} New</Badge>
            </div>

            <div className="quest-grid">
                {quests.map((lesson) => (
                    <div
                        key={lesson.lesson_id}
                        className="quest-card"
                        onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div
                            className="quest-visual"
                            style={{ background: getGradient(lesson.lesson_title || 'lesson') }}
                        />
                        <div className="quest-content">
                            <div className="quest-date">{formatDate(lesson.lesson_date)}</div>
                            <h3 className="quest-title">{lesson.lesson_title}</h3>
                            <p className="quest-desc">{lesson.description || 'No description available for this quest.'}</p>

                            <div className="quest-footer">
                                <div className="xp-badge">
                                    <FaTrophy />
                                    {calculateXP(lesson.start_time, lesson.end_time)} XP
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
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
