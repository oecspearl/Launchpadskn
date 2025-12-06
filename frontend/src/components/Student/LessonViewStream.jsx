import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaBook, FaClipboardList, FaCheckCircle, FaPlay, FaImage,
    FaFileAlt, FaRocket, FaGraduationCap, FaLightbulb,
    FaQuestionCircle, FaComments, FaCube, FaLock, FaTrophy, FaVideo, FaDoorOpen
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import collaborationService from '../../services/collaborationService';
import { supabase } from '../../config/supabase';
import ModelViewerComponent from '../InteractiveContent/Viewers/ModelViewerComponent';
import ViewerErrorBoundary from '../InteractiveContent/Viewers/ViewerErrorBoundary';
import './LessonViewStream.css';
import FlashcardViewer from './FlashcardViewer';
import InteractiveVideoViewer from './InteractiveVideoViewer';
import InteractiveBookPlayer from './InteractiveBookPlayer';
import ThemeSelector from './ThemeSelector';
import NotesPanel from './NotesPanel';
import DiscussionBoard from './DiscussionBoard';
import CheckpointRenderer from './CheckpointRenderer';

function LessonViewStream() {
    const { lessonId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [lesson, setLesson] = useState(null);
    const [completedContent, setCompletedContent] = useState(new Set());
    const [activeContent, setActiveContent] = useState(null);
    const [virtualClassroom, setVirtualClassroom] = useState(null);
    const [theme, setTheme] = useState(() => {
        // Load theme from localStorage or default to 'cool-dark'
        return localStorage.getItem('lesson-viewer-theme') || 'cool-dark';
    });
    const [showDiscussionSidebar, setShowDiscussionSidebar] = useState(false);

    useEffect(() => {
        if (lessonId) {
            fetchLessonData();
            const saved = localStorage.getItem(`lesson_${lessonId}_completed`);
            if (saved) {
                setCompletedContent(new Set(JSON.parse(saved)));
            }
        }
    }, [lessonId]);

    useEffect(() => {
        if (lessonId && completedContent.size > 0) {
            localStorage.setItem(`lesson_${lessonId}_completed`, JSON.stringify([...completedContent]));
        }
    }, [completedContent, lessonId]);

    const fetchLessonData = async () => {
        try {
            setIsLoading(true);
            const { data: lessonData, error } = await supabase
                .from('lessons')
                .select(`
          *,
          class_subject:class_subjects(
            *,
            subject_offering:subject_form_offerings(subject:subjects(*)),
            class:classes(*, form:forms(*)),
            teacher:users!class_subjects_teacher_id_fkey(*)
          ),
          content:lesson_content(*)
        `)
                .eq('lesson_id', lessonId)
                .single();

            if (error) throw error;

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

            // Fetch virtual classroom if session_id exists
            if (lessonData?.session_id) {
                try {
                    const classroom = await collaborationService.getVirtualClassroom(lessonData.session_id);
                    setVirtualClassroom(classroom);
                } catch (err) {
                    console.error('Error fetching virtual classroom:', err);
                    // Virtual classroom might not exist yet, that's okay
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
            if (newSet.has(contentId)) {
                newSet.delete(contentId);
            } else {
                newSet.add(contentId);
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
        // Base XP + Bonus for completion
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

    // Helper to render text content
    const renderTextContent = (content) => {
        const text = content.learning_activities ||
            content.learning_outcomes ||
            content.key_concepts ||
            content.reflection_questions ||
            content.discussion_prompts ||
            content.summary ||
            content.description;

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

    // Theme change handler
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('lesson-viewer-theme', newTheme);
    };

    if (isLoading) return <div className={`lesson-view-container theme-${theme}`}>Loading Mission Data...</div>;
    if (!lesson) return <div className={`lesson-view-container theme-${theme}`}>Mission Not Found</div>;

    const progress = calculateProgress();

    return (
        <div className={`lesson-view-container theme-${theme}`}>
            {/* Header */}
            <div className="mission-header">
                <div className="mission-breadcrumbs">
                    <button className="mission-back-btn" onClick={() => navigate('/student/dashboard')}>
                        <FaArrowLeft /> Back to Command Center
                    </button>
                    <span>/</span>
                    <span>{lesson.class_subject?.subject_offering?.subject?.subject_name}</span>
                </div>

                <div className="mission-title-row">
                    <div>
                        <h1 className="mission-title">{lesson.lesson_title}</h1>
                        <div className="mission-meta">
                            <span><FaCalendarAlt className="me-2" />{new Date(lesson.lesson_date).toLocaleDateString()}</span>
                            <span><FaClock className="me-2" />{lesson.start_time?.substring(0, 5)} - {lesson.end_time?.substring(0, 5)}</span>
                            <span><FaMapMarkerAlt className="me-2" />{lesson.location || 'Virtual Classroom'}</span>
                        </div>
                        {virtualClassroom && (
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    className="btn-join-classroom"
                                    onClick={() => {
                                        if (virtualClassroom.meeting_url) {
                                            window.open(virtualClassroom.meeting_url, '_blank', 'width=1200,height=800');
                                            // Join the session
                                            if (lesson.session_id && user?.user_id) {
                                                collaborationService.joinSession(lesson.session_id, user.user_id);
                                            }
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#218838';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#28a745';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                                    }}
                                >
                                    <FaVideo />
                                    Join Virtual Classroom
                                    <FaDoorOpen />
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />
                        <div className="xp-badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            <FaTrophy className="me-2" />
                            {calculateXP()} XP Earned
                        </div>
                    </div>
                </div>

                <div className="mission-progress-container">
                    <div className="mission-progress-bar" style={{ width: `${progress}%` }} />
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
                            {completedContent.size}/{lesson.content?.length || 0} Complete
                        </span>
                    </div>

                    <div className="quest-steps-list">
                        {lesson.content?.map((item, index) => (
                            <div
                                key={item.content_id}
                                className={`quest-step-item ${activeContent?.content_id === item.content_id ? 'active' : ''} ${completedContent.has(item.content_id) ? 'completed' : ''}`}
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
                                {/* Description (only if not text content type) */}
                                {activeContent.description && !['LEARNING_ACTIVITIES', 'KEY_CONCEPTS', 'SUMMARY', 'REFLECTION_QUESTIONS'].includes(activeContent.content_type) && (
                                    <div style={{ marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                        {activeContent.description}
                                    </div>
                                )}

                                {/* Content Renderers */}
                                {activeContent.content_type === 'VIDEO' && (
                                    <div className="ratio ratio-16x9" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <iframe
                                            src={activeContent.url?.replace('watch?v=', 'embed/')}
                                            title={activeContent.title}
                                            allowFullScreen
                                            style={{ border: 0 }}
                                        />
                                    </div>
                                )}

                                {activeContent.content_type === '3D_MODEL' && (
                                    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                                        <ViewerErrorBoundary>
                                            <ModelViewerComponent
                                                contentUrl={activeContent.url || activeContent.content_url}
                                                modelProperties={{ autoRotate: true, cameraControls: true }}
                                            />
                                        </ViewerErrorBoundary>
                                    </div>
                                )}

                                {activeContent.content_type === 'FLASHCARD' && activeContent.content_data && (
                                    <div style={{ height: '600px', width: '100%' }}>
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
                                    <div style={{ width: '100%' }}>
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
                                    <div style={{ width: '100%', height: '80vh' }}>
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

                                {['QUIZ', 'ASSIGNMENT'].includes(activeContent.content_type) && (
                                    <div className="text-center py-5" style={{ background: 'var(--theme-glass)', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '3rem', color: 'var(--theme-primary)', marginBottom: '1rem' }}>
                                            {getContentIcon(activeContent.content_type)}
                                        </div>
                                        <h3 style={{ color: 'var(--theme-text)' }}>{activeContent.title}</h3>
                                        <p className="text-muted mb-4" style={{ color: 'var(--theme-text-muted)' }}>
                                            {activeContent.content_type === 'QUIZ' ? 'Ready to test your knowledge?' : 'Complete this assignment to earn XP.'}
                                        </p>
                                        <button
                                            className="btn-play"
                                            style={{ display: 'inline-flex', width: 'auto' }}
                                            onClick={() => {
                                                if (activeContent.content_type === 'QUIZ') {
                                                    navigate(`/student/quizzes/${activeContent.content_id}`);
                                                } else {
                                                    navigate(`/student/assignments/${activeContent.content_id}/submit`);
                                                }
                                            }}
                                        >
                                            Start {activeContent.content_type === 'QUIZ' ? 'Quiz' : 'Assignment'}
                                        </button>
                                    </div>
                                )}

                                {/* Fallback for other types */}
                                {!['VIDEO', '3D_MODEL', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK',
                                    'LEARNING_ACTIVITIES', 'LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'REFLECTION_QUESTIONS',
                                    'DISCUSSION_PROMPTS', 'SUMMARY', 'QUIZ', 'ASSIGNMENT'].includes(activeContent.content_type) && (
                                        <div className="text-center py-5" style={{ background: 'var(--theme-glass)', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '3rem', color: 'var(--theme-primary)', marginBottom: '1rem' }}>
                                                {getContentIcon(activeContent.content_type)}
                                            </div>
                                            <h3 style={{ color: 'var(--theme-text)' }}>{activeContent.content_type?.replace('_', ' ')} Content</h3>
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

                                {/* Interactive Checkpoint Demo */}
                                {activeContent.content_type === 'CHECKPOINT' && (
                                    <CheckpointRenderer
                                        checkpoint={activeContent.data}
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
                            <FaRocket style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }} />
                            <h3>Select a mission step to begin</h3>
                        </div>
                    )}
                </div>
            </div>
            {/* Floating Discussion Button */}
            <button
                className="floating-discussion-btn"
                onClick={() => setShowDiscussionSidebar(!showDiscussionSidebar)}
                title="Class Discussion"
                aria-label="Toggle class discussion"
            >
                <FaComments />
            </button>

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

            <NotesPanel lessonId={lessonId} />
        </div>
    );
}

export default LessonViewStream;

