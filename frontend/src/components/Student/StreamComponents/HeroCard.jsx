import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaPlay, FaInfoCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaGraduationCap
} from 'react-icons/fa';
import '../LessonsStream.css';

const HeroCard = ({ heroLesson, getGradient, formatDate, formatTime }) => {
    const navigate = useNavigate();

    if (!heroLesson) return null;

    return (
        <div className="hero-section">
            <div className="hero-label">
                <div className="live-indicator" />
                <span>UP NEXT</span>
            </div>

            <div className="hero-card">
                <div className="hero-content">
                    <div className="hero-badge">
                        <FaGraduationCap className="me-2" />
                        NEXT LESSON
                    </div>

                    <h2 className="hero-title">{heroLesson.lesson_title}</h2>

                    <div className="hero-meta">
                        <div className="d-flex align-items-center gap-2">
                            <FaCalendarAlt /> {formatDate(heroLesson.lesson_date)}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <FaClock /> {formatTime(heroLesson.start_time)} - {formatTime(heroLesson.end_time)}
                        </div>
                        {heroLesson.location && (
                            <div className="d-flex align-items-center gap-2">
                                <FaMapMarkerAlt /> {heroLesson.location}
                            </div>
                        )}
                    </div>

                    <p style={{ color: 'var(--ls-text-muted)', marginBottom: '1.5rem', lineHeight: '1.6', maxWidth: '600px' }}>
                        {heroLesson.description || "Your next lesson is ready. Open it to continue your learning progress."}
                    </p>

                    <div className="hero-actions">
                        <button className="btn-play" onClick={() => navigate(`/student/lessons/${heroLesson.lesson_id}`)}>
                            <FaPlay /> Open Lesson
                        </button>
                        <button className="btn-details">
                            <FaInfoCircle className="me-2" /> Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroCard;
