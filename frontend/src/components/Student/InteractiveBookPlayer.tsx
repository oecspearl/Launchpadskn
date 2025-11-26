import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Row, Col, Card, Button, ProgressBar, Alert,
  ButtonGroup, ListGroup, Badge, Form
} from 'react-bootstrap';
import {
  FaArrowLeft, FaArrowRight, FaBook, FaCheckCircle, FaVolumeUp,
  FaPlay, FaPause, FaBookOpen, FaExpand, FaCompress
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { InteractiveBookData, BookPage, ContentType } from '../../types/contentTypes';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContextSupabase';
import FlashcardViewer from './FlashcardViewer';
import './InteractiveBookPlayer.css';

interface InteractiveBookPlayerProps {
  contentData: InteractiveBookData;
  title: string;
  description?: string;
  contentId: number;
  onComplete?: () => void;
  onClose?: () => void;
}

function InteractiveBookPlayer({
  contentData,
  title,
  description,
  contentId,
  onComplete,
  onClose
}: InteractiveBookPlayerProps) {
  const { user } = useAuth() as any;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([0]));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const pages = contentData.pages || [];
  const currentPage = pages[currentPageIndex];
  const progress = pages.length > 0 ? ((viewedPages.size / pages.length) * 100) : 0;

  // Track page views
  useEffect(() => {
    if (currentPageIndex !== null && !viewedPages.has(currentPageIndex)) {
      setViewedPages(prev => new Set([...prev, currentPageIndex]));
    }
  }, [currentPageIndex, viewedPages]);

  // Save progress
  useEffect(() => {
    if (user && contentId && viewedPages.size > 0) {
      saveProgress();
    }
  }, [viewedPages, user, contentId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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

  // Cleanup on unmount - exit fullscreen if still active
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        exitFullscreen();
      }
    };
  }, []);

  const saveProgress = async () => {
    try {
      const progressData = {
        user_id: user?.user_id || user?.userId,
        content_id: contentId,
        progress_percentage: progress,
        viewed_pages: Array.from(viewedPages),
        last_page_index: currentPageIndex,
        updated_at: new Date().toISOString()
      };

      // Check if progress exists
      const { data: existing } = await supabase
        .from('learner_progress')
        .select('*')
        .eq('user_id', progressData.user_id)
        .eq('content_id', contentId)
        .single();

      if (existing) {
        await supabase
          .from('learner_progress')
          .update(progressData)
          .eq('user_id', progressData.user_id)
          .eq('content_id', contentId);
      } else {
        await supabase
          .from('learner_progress')
          .insert([{ ...progressData, created_at: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);
    }
  };

  const enterFullscreen = async () => {
    const element = playerRef.current;
    if (!element) return;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  if (!currentPage || pages.length === 0) {
    return (
      <Container className="interactive-book-player">
        <Alert variant="warning">
          No pages available in this book.
        </Alert>
        {onClose && (
          <Button variant="secondary" onClick={onClose} className="mt-3">
            <FaArrowLeft /> Back
          </Button>
        )}
      </Container>
    );
  }

  return (
    <Container fluid className="interactive-book-player" ref={playerRef}>
      {/* Header */}
      <div className="book-header mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h4><FaBook className="me-2" />{title}</h4>
            {description && <p className="text-muted mb-0">{description}</p>}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </Button>
            {onClose && (
              <Button variant="outline-secondary" size="sm" onClick={onClose}>
                <FaArrowLeft /> Back
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {contentData.settings.showProgress && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <span className="text-muted">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <ProgressBar now={progress} variant="primary" />
          </div>
        )}
      </div>

      <Row>
        {/* Desktop: Sidebar with Table of Contents */}
        {!isMobile && (
          <Col md={3}>
            <Card>
              <Card.Header>
                <h6 className="mb-0"><FaBookOpen className="me-2" />Table of Contents</h6>
              </Card.Header>
              <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {pages.map((page, index) => (
                    <ListGroup.Item
                      key={page.id}
                      action
                      active={currentPageIndex === index}
                      onClick={() => goToPage(index)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span className="text-truncate" style={{ maxWidth: '200px' }}>
                        {page.title}
                      </span>
                      {viewedPages.has(index) && (
                        <FaCheckCircle className="text-success ms-2" />
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Main Content */}
        <Col md={isMobile ? 12 : 9}>
          <Card className="page-content-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{currentPage.title}</h5>
              {isMobile && (
                <Form.Select
                  value={currentPageIndex.toString()}
                  onChange={(e) => goToPage(parseInt(e.target.value))}
                  style={{ maxWidth: '200px' }}
                >
                  {pages.map((page, index) => (
                    <option key={page.id} value={index}>
                      Page {index + 1}: {page.title}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Card.Header>
            <Card.Body>
              {/* Render page content based on type */}
              {(!currentPage.pageType || currentPage.pageType === 'content') && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(currentPage.content || '')
                  }}
                />
              )}

              {currentPage.pageType === 'video' && currentPage.videoData && (
                <VideoPageContent videoData={currentPage.videoData} />
              )}

              {currentPage.pageType === 'quiz' && currentPage.quizData && (
                <QuizPageContent quizData={currentPage.quizData} />
              )}

              {currentPage.pageType === 'image' && currentPage.imageData && (
                <ImagePageContent imageData={currentPage.imageData} />
              )}

              {/* Embedded Content */}
              {currentPage.embeddedContentId && (
                <EmbeddedContentRenderer
                  contentId={parseInt(currentPage.embeddedContentId)}
                  page={currentPage}
                />
              )}

              {currentPage.embeddedContent && !currentPage.embeddedContentId && (
                <EmbeddedContentRenderer
                  contentId={null}
                  page={currentPage}
                />
              )}

              {/* Audio Player */}
              {currentPage.audioUrl && (
                <AudioPlayer audioUrl={currentPage.audioUrl} />
              )}
            </Card.Body>
          </Card>

          {/* Navigation */}
          {contentData.settings.showNavigation && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Button
                variant="outline-secondary"
                onClick={handlePrevious}
                disabled={currentPageIndex === 0}
              >
                <FaArrowLeft /> Previous
              </Button>
              <span className="text-muted">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={currentPageIndex === pages.length - 1}
              >
                {currentPageIndex === pages.length - 1 ? 'Complete' : 'Next'} <FaArrowRight />
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

// Video Page Content
interface VideoPageContentProps {
  videoData: any;
}

function VideoPageContent({ videoData }: VideoPageContentProps) {
  return (
    <div className="video-page-content">
      {videoData.instructions && (
        <Alert variant="info" className="mb-3">
          {videoData.instructions}
        </Alert>
      )}
      <div className="video-container">
        <iframe
          width="100%"
          height="500"
          src={`https://www.youtube.com/embed/${videoData.videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {videoData.description && (
        <p className="text-muted mt-3">{videoData.description}</p>
      )}
    </div>
  );
}

// Quiz Page Content
interface QuizPageContentProps {
  quizData: any;
}

function QuizPageContent({ quizData }: QuizPageContentProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSubmit = () => {
    let correct = 0;
    quizData.questions.forEach((q: any) => {
      const userAnswer = responses[q.id];
      if (Array.isArray(q.correctAnswer)) {
        if (q.correctAnswer.includes(userAnswer)) correct++;
      } else if (userAnswer === String(q.correctAnswer)) {
        correct++;
      }
    });
    setScore(correct);
    setSubmitted(true);
  };

  return (
    <div className="quiz-page-content">
      {quizData.questions.map((question: any, index: number) => (
        <Card key={question.id} className="mb-3">
          <Card.Body>
            <h6>Question {index + 1}: {question.question}</h6>
            {question.type === 'multiple-choice' && question.options && (
              <div>
                {question.options.map((option: string, optIndex: number) => (
                  <Form.Check
                    key={optIndex}
                    type="radio"
                    id={`question-${question.id}-option-${optIndex}`}
                    name={`question-${question.id}`}
                    label={option}
                    checked={responses[question.id] === option}
                    onChange={() => setResponses({ ...responses, [question.id]: option })}
                    disabled={submitted}
                    className="mb-2"
                  />
                ))}
              </div>
            )}
            {question.type === 'true-false' && (
              <div>
                <Form.Check
                  type="radio"
                  id={`question-${question.id}-true`}
                  name={`question-${question.id}`}
                  label="True"
                  checked={responses[question.id] === 'true'}
                  onChange={() => setResponses({ ...responses, [question.id]: 'true' })}
                  disabled={submitted}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id={`question-${question.id}-false`}
                  name={`question-${question.id}`}
                  label="False"
                  checked={responses[question.id] === 'false'}
                  onChange={() => setResponses({ ...responses, [question.id]: 'false' })}
                  disabled={submitted}
                />
              </div>
            )}
            {submitted && question.explanation && (
              <Alert variant="info" className="mt-2">
                {question.explanation}
              </Alert>
            )}
          </Card.Body>
        </Card>
      ))}
      {!submitted ? (
        <Button variant="primary" onClick={handleSubmit}>
          Submit Quiz
        </Button>
      ) : (
        <Alert variant={score === quizData.questions.length ? 'success' : 'warning'}>
          Score: {score} / {quizData.questions.length}
        </Alert>
      )}
    </div>
  );
}

// Image Page Content
interface ImagePageContentProps {
  imageData: any;
}

function ImagePageContent({ imageData }: ImagePageContentProps) {
  // Debug: Log the image data to console
  console.log('ImagePageContent received imageData:', imageData);

  return (
    <div className="image-page-content">
      {imageData.instructions && (
        <Alert variant="info" className="mb-3">
          {imageData.instructions}
        </Alert>
      )}
      {imageData.imageUrl ? (
        <img
          src={imageData.imageUrl}
          alt={imageData.imageDescription || imageData.caption || "Page content"}
          className="img-fluid"
          style={{ maxHeight: '600px', width: 'auto', margin: '0 auto', display: 'block' }}
          onError={(e) => {
            console.error('Image failed to load:', imageData.imageUrl);
            // If image fails to load, show error message
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.innerHTML = `<strong>Image failed to load</strong><br/>URL: ${imageData.imageUrl}`;
            target.parentElement?.appendChild(errorDiv);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageData.imageUrl);
          }}
        />
      ) : imageData.url ? (
        // Fallback: try 'url' field instead of 'imageUrl'
        <img
          src={imageData.url}
          alt={imageData.imageDescription || imageData.caption || "Page content"}
          className="img-fluid"
          style={{ maxHeight: '600px', width: 'auto', margin: '0 auto', display: 'block' }}
          onError={(e) => {
            console.error('Image failed to load:', imageData.url);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.innerHTML = `<strong>Image failed to load</strong><br/>URL: ${imageData.url}`;
            target.parentElement?.appendChild(errorDiv);
          }}
        />
      ) : imageData.imageDescription || imageData.caption ? (
        <Alert variant="warning">
          <strong>Image Description:</strong> {imageData.imageDescription || imageData.caption}
          <br />
          <small>Image URL is missing. Please contact your teacher.</small>
          <br />
          <small className="text-muted">Debug: {JSON.stringify(imageData)}</small>
        </Alert>
      ) : (
        <Alert variant="warning">
          No image available for this page.
          <br />
          <small className="text-muted">Debug: {JSON.stringify(imageData)}</small>
        </Alert>
      )}
      {imageData.caption && (
        <p className="text-center text-muted mt-2">{imageData.caption}</p>
      )}
    </div>
  );
}

// Embedded Content Renderer
interface EmbeddedContentRendererProps {
  contentId: number | null;
  page: BookPage;
}

function EmbeddedContentRenderer({ contentId, page }: EmbeddedContentRendererProps) {
  // Try to fetch referenced content
  const { data: embeddedContent } = useQuery({
    queryKey: ['/api/content', contentId],
    enabled: !!contentId,
    queryFn: async () => {
      if (!contentId) return null;
      const { data, error } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('content_id', contentId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Determine which data to use
  const shouldUseFetched = contentId && embeddedContent;
  const shouldFallbackToLegacy = !shouldUseFetched && page.embeddedContent;

  const effectiveEmbeddedData = shouldUseFetched
    ? embeddedContent?.content_data
    : (shouldFallbackToLegacy ? page.embeddedContent!.data : null);

  const effectiveEmbeddedType = shouldUseFetched
    ? embeddedContent?.content_type
    : (shouldFallbackToLegacy ? page.embeddedContent!.type : null);

  const effectiveEmbeddedId = contentId || null;

  if (!effectiveEmbeddedData) {
    return null;
  }

  // Render appropriate player based on type
  if (effectiveEmbeddedType === 'QUIZ') {
    // Import and use QuizPlayer if available
    return (
      <div className="embedded-content mt-4">
        <hr />
        <h6>Embedded Quiz</h6>
        <QuizPageContent quizData={effectiveEmbeddedData} />
      </div>
    );
  }

  if (effectiveEmbeddedType === 'FLASHCARD') {
    return (
      <div className="embedded-content mt-4">
        <hr />
        <h6>Embedded Flashcards</h6>
        <FlashcardViewer
          contentData={effectiveEmbeddedData}
          title="Embedded Flashcards"
        />
      </div>
    );
  }

  return (
    <div className="embedded-content mt-4">
      <hr />
      <Alert variant="info">
        Embedded content: {effectiveEmbeddedType}
      </Alert>
    </div>
  );
}

// Audio Player
interface AudioPlayerProps {
  audioUrl: string;
}

function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player mt-4">
      <hr />
      <div className="d-flex align-items-center gap-3">
        <Button variant="outline-primary" onClick={togglePlay}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </Button>
        <div className="flex-grow-1">
          <ProgressBar
            now={duration > 0 ? (currentTime / duration) * 100 : 0}
            style={{ height: '8px' }}
          />
          <div className="d-flex justify-content-between mt-1">
            <small className="text-muted">{formatTime(currentTime)}</small>
            <small className="text-muted">{formatTime(duration)}</small>
          </div>
        </div>
        <FaVolumeUp className="text-muted" />
      </div>
      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
    </div>
  );
}

export default InteractiveBookPlayer;

