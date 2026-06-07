import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaBook, FaClipboardList, FaCheckCircle, FaPlay, FaImage,
    FaFileAlt, FaListOl, FaBookOpen, FaLightbulb,
    FaQuestionCircle, FaComments, FaCube, FaLock, FaTrophy, FaVideo, FaDoorOpen,
    FaExpand, FaCompress, FaRobot, FaStickyNote, FaPlus, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useTutor } from '../../contexts/TutorContext';
import supabaseService from '../../services/supabaseService';
import collaborationService from '../../services/collaborationService';
import studentViewService from '../../services/studentViewService';
import ModelViewerComponent from '../InteractiveContent/Viewers/ModelViewerComponent';
import ViewerErrorBoundary from '../InteractiveContent/Viewers/ViewerErrorBoundary';
import './LessonViewStream.css';
import FlashcardViewer from './FlashcardViewer';
import InteractiveVideoViewer from './InteractiveVideoViewer';
import InteractiveBookPlayer from './InteractiveBookPlayer';

import NotesPanel from './NotesPanel';
import DiscussionBoard from './DiscussionBoard';
import CheckpointRenderer from './CheckpointRenderer';
import learnerProgressService from '../../services/learnerProgressService';

function LessonViewStream() {
    const { lessonId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toggleTutor, isEnabled: tutorEnabled, setHideFab } = useTutor();

    const [isLoading, setIsLoading] = useState(true);
    const [lesson, setLesson] = useState(null);
    const [completedContent, setCompletedContent] = useState(new Set());
    const [activeContent, setActiveContent] = useState(null);
    const [virtualClassroom, setVirtualClassroom] = useState(null);
    const [showDiscussionSidebar, setShowDiscussionSidebar] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [toolMenuOpen, setToolMenuOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const viewerPanelRef = useRef(null);

    // Hide the standalone tutor FAB — this page uses the speed dial instead
    useEffect(() => {
        setHideFab(true);
        return () => setHideFab(false);
    }, [setHideFab]);

    useEffect(() => {
        if (lessonId) {
            fetchLessonData();
        }
    }, [lessonId]);

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            ));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        if (lessonId && completedContent.size > 0) {
            localStorage.setItem(`lesson_${lessonId}_completed`, JSON.stringify([...completedContent]));
        }
    }, [completedContent, lessonId]);

    const fetchLessonData = async () => {
        try {
            setIsLoading(true);
            const lessonData = await studentViewService.getLessonWithContent(lessonId);

            if (lessonData && lessonData.content) {
                lessonData.content = lessonData.content
                    .filter(item => item.is_published !== false)
                    .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));

                // Set first item as active if none selected
                if (lessonData.content.length > 0) {
                    setActiveContent(lessonData.content[0]);
                }
            }

            setLesson(lessonData);

            // Load completion progress from Supabase, fall back to localStorage
            if (user?.id && lessonData.content && lessonData.content.length > 0) {
                const contentIds = lessonData.content.map(c => c.content_id);
                try {
                    const dbCompleted = await learnerProgressService.loadCompletedContentIds(user.id, contentIds);
                    if (dbCompleted.size > 0) {
                        setCompletedContent(dbCompleted);
                        localStorage.setItem(`lesson_${lessonId}_completed`, JSON.stringify([...dbCompleted]));
                    } else {
                        // Fall back to localStorage (offline cache / legacy data)
                        const saved = localStorage.getItem(`lesson_${lessonId}_completed`);
                        if (saved) {
                            setCompletedContent(new Set(JSON.parse(saved)));
                        }
                    }
                } catch (err) {
                    console.error('Error loading progress from Supabase:', err);
                    const saved = localStorage.getItem(`lesson_${lessonId}_completed`);
                    if (saved) {
                        setCompletedContent(new Set(JSON.parse(saved)));
                    }
                }
            } else {
                const saved = localStorage.getItem(`lesson_${lessonId}_completed`);
                if (saved) {
                    setCompletedContent(new Set(JSON.parse(saved)));
                }
            }

            // Fetch virtual classroom if session_id exists
            if (lessonData?.session_id) {
                try {
                    const classroom = await collaborationService.getVirtualClassroom(lessonData.session_id);
                    setVirtualClassroom(classroom);
                } catch (err) {
                    console.error('Error fetching virtual classroom:', err);
                }
            }
        } catch (err) {
            console.error('Error fetching lesson:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleContentComplete = (contentId) => {
        setCompletedContent(prev => {
            const newSet = new Set(prev);
            const wasCompleted = newSet.has(contentId);

            if (wasCompleted) {
                newSet.delete(contentId);
            } else {
                newSet.add(contentId);
            }

            // Persist to Supabase (fire-and-forget)
            if (user?.id) {
                learnerProgressService.toggleContentCompletion(user.id, contentId, !wasCompleted);
            }

            return newSet;
        });
    };

    const calculateProgress = () => {
        if (!lesson?.content || lesson.content.length === 0) return 0;
        return Math.round((completedContent.size / lesson.content.length) * 100);
    };

    const calculateXP = () => {
        if (!lesson?.content) return 0;
        const baseXP = completedContent.size * 50;
        const bonusXP = calculateProgress() === 100 ? 500 : 0;
        return baseXP + bonusXP;
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

    const renderTextContent = (content) => {
        const text = content.learning_activities ||
            content.learning_outcomes ||
            content.key_concepts ||
            content.reflection_questions ||
            content.discussion_prompts ||
            content.summary ||
            content.description;

        return (
            <div className="text-content-block">
                {text}
            </div>
        );
    };

    // Fullscreen toggle handler
    const toggleFullscreen = async () => {
        const element = viewerPanelRef.current;
        if (!element) return;

        try {
            if (!isFullscreen) {
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    await element.webkitRequestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    await element.mozRequestFullScreen();
                } else if (element.msRequestFullscreen) {
                    await element.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    if (isLoading) return <div className="lesson-view-container">Loading lesson...</div>;
    if (!lesson) return <div className="lesson-view-container">Lesson not found</div>;

    const progress = calculateProgress();

    return (
        <div className="lesson-view-container">
            {/* Header */}
            <div className="lesson-header">
                <div className="lesson-breadcrumbs">
                    <button className="lesson-back-btn" onClick={() => navigate('/student/dashboard')}>
                        <FaArrowLeft /> Dashboard
                    </button>
                    <span>/</span>
                    <button
                        className="lesson-back-btn"
                        onClick={() => {
                            const csId = lesson.class_subject?.class_subject_id;
                            if (csId) {
                                navigate(`/student/subjects/${csId}`);
                            } else {
                                navigate('/student/subjects');
                            }
                        }}
                    >
                        {lesson.class_subject?.subject_offering?.subject?.subject_name || 'Subject'}
                    </button>
                    <span>/</span>
                    <span style={{ fontWeight: 600 }}>{lesson.lesson_title}</span>
                </div>

                <div className="lesson-title-row">
                    <div>
                        <h1 className="lesson-title-text">{lesson.lesson_title}</h1>
                        <div className="lesson-meta">
                            <span><FaCalendarAlt className="me-2" />{new Date(lesson.lesson_date).toLocaleDateString()}</span>
                            <span><FaClock className="me-2" />{lesson.start_time?.substring(0, 5)} - {lesson.end_time?.substring(0, 5)}</span>
                            <span><FaMapMarkerAlt className="me-2" />{lesson.location || 'Virtual Classroom'}</span>
                        </div>
                        {virtualClassroom && (
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    className="btn btn-success"
                                    onClick={() => {
                                        if (virtualClassroom.meeting_url) {
                                            window.open(virtualClassroom.meeting_url, '_blank', 'width=1200,height=800');
                                            if (lesson.session_id && user?.user_id) {
                                                collaborationService.joinSession(lesson.session_id, user.user_id);
                                            }
                                        }
                                    }}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <FaVideo />
                                    Join Virtual Classroom
                                    <FaDoorOpen />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="xp-badge">
                        <FaTrophy className="me-2" />
                        {calculateXP()} Progress Points
                    </div>
                </div>

                <div className="lesson-progress-container">
                    <div className="lesson-progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-summary">
                    <span>{completedContent.size}/{lesson.content?.length || 0} items completed</span>
                    <span>{progress}%</span>
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--lv-text-muted)' }}>
                            {completedContent.size}/{lesson.content?.length || 0}
                        </span>
                    </div>

                    <div className="sidebar-list">
                        {lesson.content?.map((item, index) => (
                            <div
                                key={item.content_id}
                                className={`content-item ${activeContent?.content_id === item.content_id ? 'active' : ''} ${completedContent.has(item.content_id) ? 'completed' : ''}`}
                                onClick={() => setActiveContent(item)}
                            >
                                <div className="step-icon">
                                    {completedContent.has(item.content_id) ? <FaCheckCircle /> : (index + 1)}
                                </div>
                                <div className="step-info">
                                    <div className="step-title">{item.title}</div>
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
                <div className="lesson-viewer-panel" ref={viewerPanelRef}>
                    {activeContent ? (
                        <>
                            <div className="viewer-header">
                                <div className="viewer-title">{activeContent.title}</div>
                                <div className="d-flex gap-2 align-items-center">
                                    {activeContent.estimated_minutes && (
                                        <span className="xp-badge">
                                            <FaClock className="me-1" /> {activeContent.estimated_minutes} min
                                        </span>
                                    )}
                                    <button
                                        className="fullscreen-toggle-btn"
                                        onClick={toggleFullscreen}
                                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                                        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                                    >
                                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                                    </button>
                                </div>
                            </div>

                            <div className="viewer-content">
                                {/* Description */}
                                {activeContent.description && !['LEARNING_ACTIVITIES', 'KEY_CONCEPTS', 'SUMMARY', 'REFLECTION_QUESTIONS'].includes(activeContent.content_type) && (
                                    <div className="content-description">
                                        {activeContent.description}
                                    </div>
                                )}

                                {/* Content Renderers */}
                                {activeContent.content_type === 'VIDEO' && (
                                    <div className="ratio ratio-16x9 video-wrapper">
                                        {activeContent.url && /\.(mp4|webm|ogg)(\?|$)/i.test(activeContent.url) ? (
                                            <video controls style={{ width: '100%', height: '100%' }}>
                                                <source src={activeContent.url} />
                                            </video>
                                        ) : (
                                            <iframe
                                                src={(() => {
                                                    const url = activeContent.url || '';
                                                    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                                                    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
                                                    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                                                    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                                                    return url;
                                                })()}
                                                title={activeContent.title}
                                                allowFullScreen
                                                style={{ border: 0 }}
                                            />
                                        )}
                                    </div>
                                )}

                                {activeContent.content_type === 'IMAGE' && (
                                    <div className="content-image-container">
                                        <img
                                            src={activeContent.url || activeContent.content_url}
                                            alt={activeContent.title}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === '3D_MODEL' && (
                                    <div className="content-3d-container">
                                        <ViewerErrorBoundary>
                                            <ModelViewerComponent
                                                contentUrl={activeContent.url || activeContent.content_url}
                                                modelProperties={{ autoRotate: true, cameraControls: true }}
                                            />
                                        </ViewerErrorBoundary>
                                    </div>
                                )}

                                {activeContent.content_type === 'FLASHCARD' && activeContent.content_data && (
                                    <div className="content-flashcard-container">
                                        <FlashcardViewer
                                            contentData={activeContent.content_data}
                                            title={activeContent.title}
                                            description={activeContent.description}
                                            contentId={activeContent.content_id}
                                            onComplete={() => toggleContentComplete(activeContent.content_id)}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'INTERACTIVE_VIDEO' && activeContent.content_data && (
                                    <div className="content-interactive-container">
                                        <InteractiveVideoViewer
                                            contentData={activeContent.content_data}
                                            title={activeContent.title}
                                            description={activeContent.description}
                                            contentId={activeContent.content_id}
                                            onComplete={() => toggleContentComplete(activeContent.content_id)}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === 'INTERACTIVE_BOOK' && activeContent.content_data && (
                                    <div className="content-book-container">
                                        <InteractiveBookPlayer
                                            contentData={activeContent.content_data}
                                            title={activeContent.title}
                                            description={activeContent.description}
                                            contentId={activeContent.content_id}
                                            onComplete={() => toggleContentComplete(activeContent.content_id)}
                                        />
                                    </div>
                                )}


                                {['LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS',
                                    'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(activeContent.content_type) && (
                                        renderTextContent(activeContent)
                                    )}

                                {['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'].includes(activeContent.content_type) && (
                                    <div className="content-assessment-placeholder">
                                        <div className="assessment-icon">
                                            {getContentIcon(activeContent.content_type)}
                                        </div>
                                        <h3>{activeContent.title}</h3>
                                        <p>
                                            {activeContent.content_type === 'QUIZ' ? 'Ready to test your knowledge?' :
                                             activeContent.content_type === 'TEST' || activeContent.content_type === 'EXAM' ? 'Complete this assessment.' :
                                             activeContent.content_type === 'SURVEY' ? 'Share your feedback.' :
                                             activeContent.content_type === 'PROJECT' ? 'Work on your project submission.' :
                                             'Complete this assignment.'}
                                        </p>
                                        <button
                                            className="btn-play"
                                            style={{ display: 'inline-flex', width: 'auto' }}
                                            onClick={() => {
                                                if (activeContent.content_type === 'QUIZ') {
                                                    navigate(`/student/quizzes/${activeContent.content_id}`);
                                                } else if (activeContent.url) {
                                                    window.open(activeContent.url, '_blank');
                                                } else {
                                                    navigate(`/student/assignments/${activeContent.content_id}/submit`);
                                                }
                                            }}
                                        >
                                            Start {activeContent.content_type?.replace('_', ' ')}
                                        </button>
                                    </div>
                                )}

                                {/* Fallback for other types */}
                                {!['VIDEO', 'IMAGE', '3D_MODEL', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK',
                                    'LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'REFLECTION_QUESTIONS',
                                    'DISCUSSION_PROMPTS', 'SUMMARY', 'QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT',
                                    'SURVEY', 'CHECKPOINT'].includes(activeContent.content_type) && (
                                        <div className="content-fallback">
                                            <div className="fallback-icon">
                                                {getContentIcon(activeContent.content_type)}
                                            </div>
                                            <h3>{activeContent.content_type?.replace('_', ' ')} Content</h3>
                                            {activeContent.url && (
                                                <a
                                                    href={activeContent.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-play mt-3"
                                                    style={{ display: 'inline-flex', width: 'auto' }}
                                                >
                                                    Open Resource
                                                </a>
                                            )}
                                        </div>
                                    )}

                                {/* Interactive Checkpoint */}
                                {activeContent.content_type === 'CHECKPOINT' && (
                                    <CheckpointRenderer
                                        checkpoint={activeContent.content_data || activeContent.data}
                                        onComplete={() => toggleContentComplete(activeContent.content_id)}
                                    />
                                )}


                            </div>

                            <div className="viewer-actions">
                                <button
                                    className={`btn-complete ${completedContent.has(activeContent.content_id) ? 'completed' : ''}`}
                                    onClick={() => toggleContentComplete(activeContent.content_id)}
                                >
                                    {completedContent.has(activeContent.content_id) ? (
                                        <>
                                            <FaCheckCircle /> Completed
                                        </>
                                    ) : (
                                        <>
                                            Mark as Complete
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                            <FaBookOpen style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }} />
                            <h3>Select a content item to begin</h3>
                        </div>
                    )}
                </div>
            </div>
            {/* Speed Dial — combines Tutor, Discussion, and Notes into one menu */}
            <div className="lesson-speed-dial">
                {toolMenuOpen && (
                    <div className="speed-dial-items">
                        {tutorEnabled && (
                            <button
                                className="speed-dial-item speed-dial-tutor"
                                onClick={() => { toggleTutor(); setToolMenuOpen(false); }}
                                title="AI Tutor"
                            >
                                <FaRobot size={18} />
                                <span className="speed-dial-label">Tutor</span>
                            </button>
                        )}
                        <button
                            className="speed-dial-item speed-dial-discussion"
                            onClick={() => { setShowDiscussionSidebar(!showDiscussionSidebar); setToolMenuOpen(false); }}
                            title="Class Discussion"
                        >
                            <FaComments size={18} />
                            <span className="speed-dial-label">Discussion</span>
                        </button>
                        <button
                            className="speed-dial-item speed-dial-notes"
                            onClick={() => { setNotesOpen(true); setToolMenuOpen(false); }}
                            title="My Notes"
                        >
                            <FaStickyNote size={18} />
                            <span className="speed-dial-label">Notes</span>
                        </button>
                    </div>
                )}
                <button
                    className={`speed-dial-toggle ${toolMenuOpen ? 'open' : ''}`}
                    onClick={() => setToolMenuOpen(prev => !prev)}
                    title="Tools"
                    aria-label="Toggle tools menu"
                >
                    {toolMenuOpen ? <FaTimes size={22} /> : <FaPlus size={22} />}
                </button>
            </div>

            {/* Backdrop to close speed dial when clicking outside */}
            {toolMenuOpen && (
                <div className="speed-dial-backdrop" onClick={() => setToolMenuOpen(false)} />
            )}

            {/* Discussion Sidebar */}
            {showDiscussionSidebar && (
                <>
                    <div
                        className="discussion-sidebar-overlay"
                        onClick={() => setShowDiscussionSidebar(false)}
                    />
                    <div className="discussion-sidebar">
                        <div className="discussion-sidebar-header">
                            <h5 className="mb-0">
                                <FaComments className="me-2" />
                                Class Discussion
                            </h5>
                            <button
                                className="btn-link text-muted p-0"
                                onClick={() => setShowDiscussionSidebar(false)}
                                aria-label="Close discussion"
                                style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }}
                            >

                            </button>
                        </div>
                        <div className="discussion-sidebar-body">
                            <DiscussionBoard lessonId={lessonId} user={user} />
                        </div>
                    </div>
                </>
            )}

            <NotesPanel lessonId={lessonId} show={notesOpen} onToggle={setNotesOpen} />
        </div>
    );
}

export default LessonViewStream;
