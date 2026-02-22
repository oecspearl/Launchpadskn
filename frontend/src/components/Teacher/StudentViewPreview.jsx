import React, { useState, useEffect } from 'react';
import {
    FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaBook, FaClipboardList, FaCheckCircle, FaPlay, FaImage,
    FaFileAlt, FaListOl, FaBookOpen, FaLightbulb,
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
import DOMPurify from 'dompurify';

function StudentViewPreview() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lessonData, setLessonData] = useState(null);
    const [content, setContent] = useState([]);
    const [activeContent, setActiveContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLessonData = async () => {
            if (!lessonId) return;
            try {
                setLoading(true);
                const lesson = await supabaseService.getLessonById(lessonId);
                setLessonData(lesson);

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
        if (lessonId) {
            navigate(`/teacher/lessons/${lessonId}/content`, { replace: true });
        } else {
            navigate('/teacher/dashboard', { replace: true });
        }
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
            item.content_text;

        return (
            <div
                className="text-content-block"
                dangerouslySetInnerHTML={{
                    __html: text ? DOMPurify.sanitize(text) : '<p class="text-muted">No content available.</p>'
                }}
            />
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#f8fafc' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!lessonData) return (
        <div className="lesson-view-container" style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1600px', height: '100%', zIndex: 1050, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Lesson not found</div>
        </div>
    );

    return (
        <div className="lesson-view-container" style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1600px', height: '100%', zIndex: 1050, overflowY: 'auto' }}>
            {/* Header */}
            <div className="lesson-header">
                <div className="lesson-breadcrumbs">
                    <button className="lesson-back-btn" onClick={handleExit}>
                        <FaArrowLeft /> Exit Preview
                    </button>
                    <span>/</span>
                    <span>Student View Preview</span>
                </div>

                <div className="lesson-title-row">
                    <div>
                        <h1 className="lesson-title-text">{lessonData.lesson_title || 'Untitled Lesson'}</h1>
                        <div className="lesson-meta">
                            <span><FaCalendarAlt className="me-2" />{new Date().toLocaleDateString()}</span>
                            <span><FaClock className="me-2" />45 min</span>
                            <span><FaMapMarkerAlt className="me-2" />Virtual Classroom</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="lesson-content-grid">
                {/* Sidebar: Lesson Contents */}
                <div className="content-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            <FaListOl className="text-primary" />
                            Lesson Contents
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--lv-text-muted, #94a3b8)' }}>
                            Preview Mode
                        </span>
                    </div>

                    <div className="sidebar-list">
                        {content?.map((item, index) => (
                            <div
                                key={item.content_id || index}
                                className={`content-item ${activeContent === item ? 'active' : ''}`}
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
                <div className="lesson-viewer-panel">
                    {activeContent ? (
                        <>
                            <div className="viewer-header">
                                <div className="viewer-title">{activeContent.title}</div>
                                <div className="d-flex gap-2">
                                    {activeContent.estimated_minutes && (
                                        <span className="xp-badge">
                                            <FaClock className="me-1" /> {activeContent.estimated_minutes} min
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="viewer-content">
                                {activeContent.content_type === 'VIDEO' && (
                                    <div className="ratio ratio-16x9 video-wrapper">
                                        <iframe
                                            src={activeContent.url?.replace('watch?v=', 'embed/')}
                                            title={activeContent.title}
                                            allowFullScreen
                                            style={{ border: 0 }}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'IMAGE' && (
                                    <div className="content-image-container">
                                        <img
                                            src={activeContent.url || activeContent.signedUrl}
                                            alt={activeContent.title}
                                        />
                                    </div>
                                )}

                                {['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                                    'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(activeContent.content_type) &&
                                    renderTextContent(activeContent)
                                }

                                {activeContent.content_type === 'FLASHCARD' && (
                                    <div className="content-flashcard-container">
                                        <FlashcardViewer
                                            contentId={activeContent.content_id}
                                            contentData={activeContent.content_data}
                                            title={activeContent.title}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'INTERACTIVE_VIDEO' && (
                                    <div className="content-interactive-container">
                                        <InteractiveVideoViewer
                                            contentId={activeContent.content_id}
                                            contentData={activeContent.content_data}
                                            title={activeContent.title}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'INTERACTIVE_BOOK' && (
                                    <div className="content-book-container">
                                        <InteractiveBookPlayer
                                            contentId={activeContent.content_id}
                                            contentData={activeContent.content_data}
                                            title={activeContent.title}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'QUIZ' && (
                                    <QuizViewer
                                        contentId={activeContent.content_id}
                                        contentData={activeContent.content_data}
                                        title={activeContent.title}
                                    />
                                )}

                                {activeContent.content_type === '3D_MODEL' && (
                                    <div className="content-3d-container">
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
                                        <div className="content-fallback">
                                            <div className="fallback-icon"><FaFileAlt /></div>
                                            <h3>{activeContent.content_type?.replace('_', ' ')}</h3>
                                            <p>Preview not available for this content type.</p>
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
                            <FaBookOpen size={48} className="mb-3" />
                            <h3>Select a content item to preview</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentViewPreview;
