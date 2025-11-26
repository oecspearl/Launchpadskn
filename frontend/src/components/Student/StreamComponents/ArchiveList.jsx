import React from 'react';
import { Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaCheckCircle } from 'react-icons/fa';
import '../LessonsStream.css';

const ArchiveList = ({ archives, formatDate, calculateXP }) => {
    const navigate = useNavigate();

    if (!archives || archives.length === 0) return null;

    return (
        <div className="quest-section">
            <div className="section-header">
                <div className="section-title">
                    <FaHistory className="text-secondary" />
                    Completed Missions
                </div>
            </div>

            <div className="archive-list">
                {archives.map((lesson) => (
                    <div
                        key={lesson.lesson_id}
                        className="archive-item"
                        onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                    >
                        <div className="archive-status">
                            <FaCheckCircle />
                        </div>
                        <div className="archive-info">
                            <h4 className="archive-title" style={{ fontSize: '1rem' }}>{lesson.lesson_title}</h4>
                            <small style={{ color: '#64748b' }}>{formatDate(lesson.lesson_date)} • {calculateXP(lesson.start_time, lesson.end_time)} XP Earned</small>
                        </div>
                        <div className="archive-action">
                            <Badge bg="secondary">Replay</Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArchiveList;
