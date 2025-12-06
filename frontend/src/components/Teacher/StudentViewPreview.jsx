import React, { useState, useEffect } from 'react';
import {
    FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaBook, FaClipboardList, FaCheckCircle, FaPlay, FaImage,
    FaFileAlt, FaRocket, FaGraduationCap, FaLightbulb,
    FaQuestionCircle, FaComments, FaCube, FaLock, FaTrophy, FaVideo, FaDoorOpen
} from 'react-icons/fa';
import '../Student/LessonViewStream.css';
import FlashcardViewer from '../Student/FlashcardViewer';
import InteractiveVideoViewer from '../Student/InteractiveVideoViewer';
import InteractiveBookPlayer from '../Student/InteractiveBookPlayer';
import QuizViewer from '../Student/QuizViewer';
import ModelViewerComponent from '../InteractiveContent/Viewers/ModelViewerComponent';

import { useParams, useNavigate } from 'react-router-dom';
import supabaseService from '../../services/supabaseService';

function StudentViewPreview() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lessonData, setLessonData] = useState(null);
    const [content, setContent] = useState([]);
    const [activeContent, setActiveContent] = useState(null);
    const [theme, setTheme] = useState('cool-dark');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLessonData = async () => {
            if (!lessonId) return;
            try {
                setLoading(true);
                // Fetch lesson details
                const lesson = await supabaseService.getLessonById(lessonId);
                setLessonData(lesson);

                // Fetch lesson content
                const contentData = await supabaseService.getLessonContent(lessonId);
                setContent(contentData);

                if (contentData && contentData.length > 0) {
                    setActiveContent(contentData[0]);
                }
            } catch (error) {
                console.error('Error fetching lesson preview data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLessonData();
    }, [lessonId]);

    const handleExit = () => {
        navigate(`/teacher/lesson/${lessonId}/content`);
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'VIDEO': return <FaPlay />;
            case 'IMAGE': return <FaImage />;
            case 'QUIZ': return <FaClipboardList />;
            case 'ASSIGNMENT': return <FaBook />;
            case '3D_MODEL': return <FaCube />;
            default: return <FaFileAlt />;
        }
    };

    const renderTextContent = (item) => {
        const text = item.learning_activities ||
            item.learning_outcomes ||
            item.key_concepts ||
            item.reflection_questions ||
            item.discussion_prompts ||
            item.summary ||
            item.description ||
            item.content_text; // Fallback

        return (
            <div style={{
                background: 'var(--theme-glass)',
                padding: '2rem',
                borderRadius: '12px',
                lineHeight: '1.8',
                fontSize: '1.1rem',
                color: 'var(--theme-text)',
                whiteSpace: 'pre-wrap'
            }}>
                {text}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#0f172a', color: 'white' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!lessonData) return <div>Lesson not found</div>;

    return (
        <div className={`lesson-view-container theme-${theme}`} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1050, overflowY: 'auto' }}>
            {/* Header */}
            <div className="mission-header">
                <div className="mission-breadcrumbs">
                    <button className="mission-back-btn" onClick={handleExit}>
                        <FaArrowLeft /> Exit Preview
                    </button>
                    <span>/</span>
                    <span>Student View Preview</span>
                </div>

                <div className="mission-title-row">
                    <div>
                        <h1 className="mission-title">{lessonData.lesson_title || 'Untitled Lesson'}</h1>
                        <div className="mission-meta">
                            <span><FaCalendarAlt className="me-2" />{new Date().toLocaleDateString()}</span>
                            <span><FaClock className="me-2" />45 min</span>
                            <span><FaMapMarkerAlt className="me-2" />Virtual Classroom</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            style={{
                                background: 'var(--theme-glass)',
                                color: 'var(--theme-text)',
                                border: '1px solid var(--theme-glass-border)',
                                padding: '0.5rem',
                                borderRadius: '8px'
                            }}
                        >
                            <option value="cool-dark">Cool Dark</option>
                            <option value="warm-dark">Warm Dark</option>
                            <option value="light">Light</option>
                            <option value="high-contrast">High Contrast</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="mission-content-grid">
                {/* Sidebar: Quest Steps */}
                <div className="quest-steps-panel">
                    <div className="quest-steps-header">
                        <div className="quest-steps-title">
                            <FaRocket className="text-primary" />
                            Mission Steps
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Preview Mode
                        </span>
                    </div>

                    <div className="quest-steps-list">
                        {content?.map((item, index) => (
                            <div
                                key={item.content_id || index}
                                className={`quest-step-item ${activeContent === item ? 'active' : ''}`}
                                onClick={() => setActiveContent(item)}
                            >
                                <div className="step-icon">
                                    {index + 1}
                                </div>
                                <div className="step-info">
                                    <div className="step-title">{item.title || 'Untitled Content'}</div>
                                    <div className="step-meta">
                                        {getContentIcon(item.content_type)}
                                        <span className="ms-1">{item.content_type?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Viewer */}
                <div className="mission-viewer-panel">
                    {activeContent ? (
                        <>
                            <div className="viewer-header">
                                <div className="viewer-title">{activeContent.title}</div>
                                <div className="d-flex gap-2">
                                    {activeContent.estimated_minutes && (
                                        <span className="xp-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                                            <FaClock className="me-1" /> {activeContent.estimated_minutes} min
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="viewer-content">
                                {/* Render content based on type */}
                                {activeContent.content_type === 'VIDEO' && (
                                    <div className="ratio ratio-16x9">
                                        <iframe
                                            src={activeContent.url?.replace('watch?v=', 'embed/')}
                                            title={activeContent.title}
                                            allowFullScreen
                                            style={{ border: 0, borderRadius: '12px' }}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'IMAGE' && (
                                    <img
                                        src={activeContent.url || activeContent.signedUrl}
                                        alt={activeContent.title}
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '600px', width: 'auto', display: 'block', margin: '0 auto' }}
                                    />
                                )}

                                {['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                                    'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(activeContent.content_type) &&
                                    renderTextContent(activeContent)
                                }

                                {activeContent.content_type === 'FLASHCARD' && (
                                    <FlashcardViewer
                                        contentId={activeContent.content_id}
                                        contentData={activeContent.content_data}
                                        title={activeContent.title}
                                    />
                                )}

                                {activeContent.content_type === 'INTERACTIVE_VIDEO' && (
                                    <InteractiveVideoViewer
                                        contentId={activeContent.content_id}
                                        contentData={activeContent.content_data}
                                        title={activeContent.title}
                                    />
                                )}

                                {activeContent.content_type === 'INTERACTIVE_BOOK' && (
                                    <InteractiveBookPlayer
                                        contentId={activeContent.content_id}
                                        contentData={activeContent.content_data}
                                        title={activeContent.title}
                                    />
                                )}

                                {activeContent.content_type === 'QUIZ' && (
                                    <QuizViewer
                                        contentId={activeContent.content_id}
                                        contentData={activeContent.content_data}
                                        title={activeContent.title}
                                    />
                                )}

                                {activeContent.content_type === '3D_MODEL' && (
                                    <div style={{ height: '500px', width: '100%' }}>
                                        <ModelViewerComponent
                                            contentUrl={activeContent.url}
                                            poster={activeContent.thumbnail_url}
                                            alt={activeContent.title}
                                        />
                                    </div>
                                )}

                                {/* Fallback for other types */}
                                {!['VIDEO', 'IMAGE', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK', '3D_MODEL', 'QUIZ',
                                    'LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                                    'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(activeContent.content_type) && (
                                        <div className="text-center py-5">
                                            <FaFileAlt size={48} className="mb-3 text-muted" />
                                            <h3>{activeContent.content_type?.replace('_', ' ')}</h3>
                                            <p className="text-muted">Preview not available for this content type.</p>
                                            {activeContent.url && (
                                                <a href={activeContent.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                                    Open Resource
                                                </a>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </>
                    ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                            <FaRocket size={48} className="mb-3" />
                            <h3>Select a mission step to preview</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentViewPreview;
