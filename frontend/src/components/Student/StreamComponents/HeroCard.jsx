import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaPlay, FaInfoCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaFire, FaCube
} from 'react-icons/fa';
import ModelViewerComponent from '../../InteractiveContent/Viewers/ModelViewerComponent';
import ViewerErrorBoundary from '../../InteractiveContent/Viewers/ViewerErrorBoundary';
import '../LessonsStream.css'; // Use parent CSS

const HeroCard = ({ heroLesson, getGradient, formatDate, formatTime }) => {
    const navigate = useNavigate();

    if (!heroLesson) return null;

    return (
        <div className="hero-section">
            <div className="hero-label">
                <div className="live-indicator" />
                <span>NOW PLAYING / UP NEXT</span>
            </div>

            <div className="hero-card">
                <div className="hero-content">
                    <div className="hero-badge">
                        <FaFire className="me-2" />
                        FEATURED MISSION
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

                    <p style={{ color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6', maxWidth: '600px' }}>
                        {heroLesson.description || "Get ready for your next big learning adventure. Join the session to start earning XP and mastering new skills."}
                    </p>

                    <div className="hero-actions">
                        <button className="btn-play" onClick={() => navigate(`/student/lessons/${heroLesson.lesson_id}`)}>
                            <FaPlay /> Start Mission
                        </button>
                        <button className="btn-details">
                            <FaInfoCircle className="me-2" /> Details
                        </button>
                    </div>
                </div>

                <div className="hero-visual">
                    {heroLesson.content_url ? (
                        <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
                            <ViewerErrorBoundary>
                                <ModelViewerComponent
                                    contentUrl={heroLesson.content_url}
                                    modelProperties={{
                                        autoRotate: true,
                                        cameraControls: true,
                                        shadowIntensity: 1
                                    }}
                                />
                            </ViewerErrorBoundary>
                        </div>
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: getGradient(heroLesson.lesson_title || 'hero')
                        }}>
                            <FaCube style={{ fontSize: '8rem', color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroCard;
