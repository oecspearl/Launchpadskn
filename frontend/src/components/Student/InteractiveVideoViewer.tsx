import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Card, Button, Badge, ProgressBar, Alert,
  Modal, Form, ListGroup
} from 'react-bootstrap';
import {
  FaPlay, FaPause, FaCheckCircle, FaTimesCircle, FaClock,
  FaQuestionCircle, FaExclamationCircle
} from 'react-icons/fa';
import { InteractiveVideoData, VideoCheckpoint } from '../../types/contentTypes';
import {
  extractYouTubeVideoId,
  extractVimeoVideoId
} from '../../types/contentTypes';
import './InteractiveVideoViewer.css';

interface InteractiveVideoViewerProps {
  contentData: InteractiveVideoData;
  title: string;
  description?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

function InteractiveVideoViewer({
  contentData,
  title,
  description,
  onComplete,
  onClose
}: InteractiveVideoViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Start as playing when video loads
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Set<string>>(new Set());
  const [checkpointAnswers, setCheckpointAnswers] = useState<Map<string, any>>(new Map());
  const [checkpointAttempts, setCheckpointAttempts] = useState<Map<string, number>>(new Map());
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLIFrameElement | HTMLVideoElement>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const settings = contentData.settings || {};
  const checkpoints = contentData.checkpoints || [];
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.timestamp - b.timestamp);

  // Debug: Log checkpoints on mount
  useEffect(() => {
    console.log('[InteractiveVideoViewer] Loaded with checkpoints:', {
      total: checkpoints.length,
      checkpoints: sortedCheckpoints.map(cp => ({
        id: cp.id,
        timestamp: cp.timestamp,
        type: cp.type,
        title: cp.title
      }))
    });
  }, []);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Monitor video time (simulated for iframe videos)
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      timeUpdateIntervalRef.current = setInterval(() => {
        // For iframe videos, we can't directly access currentTime
        // This is a limitation - in production, you'd use YouTube/Vimeo APIs
        setCurrentTime(prev => {
          const newTime = prev + 0.5; // Increment by 0.5 seconds
          
          // Check for checkpoints
          const upcomingCheckpoint = sortedCheckpoints.find(
            cp => !completedCheckpoints.has(cp.id) &&
            cp.timestamp <= newTime &&
            cp.timestamp > prev
          );

          if (upcomingCheckpoint) {
            handleCheckpointReached(upcomingCheckpoint);
          }

          return newTime;
        });
      }, 500);
    } else {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [isPlaying, sortedCheckpoints, completedCheckpoints]);

  // Handle checkpoint reached
  const handleCheckpointReached = (checkpoint: VideoCheckpoint) => {
    setActiveCheckpoint(checkpoint);
    setShowCheckpointModal(true);
    setIsCorrect(null);
    setShowExplanation(false);
    setSelectedAnswer(null);

    if (checkpoint.pauseVideo && settings.autoPause) {
      setIsPlaying(false);
    }
  };

  // Handle checkpoint answer submission
  const handleSubmitAnswer = () => {
    if (!activeCheckpoint) return;

    const checkpoint = activeCheckpoint;
    const attempts = checkpointAttempts.get(checkpoint.id) || 0;

    if (checkpoint.type === 'question' || checkpoint.type === 'quiz') {
      if (!selectedAnswer) {
        return;
      }

      const selectedOption = checkpoint.options?.find(opt => opt.id === selectedAnswer);
      const correct = selectedOption?.isCorrect || false;

      setIsCorrect(correct);
      setShowExplanation(true);
      setCheckpointAttempts(new Map(checkpointAttempts.set(checkpoint.id, attempts + 1)));

      if (correct || !checkpoint.required) {
        // Mark as completed
        setCompletedCheckpoints(new Set([...completedCheckpoints, checkpoint.id]));
        setCheckpointAnswers(new Map(checkpointAnswers.set(checkpoint.id, selectedAnswer)));
      }
    } else {
      // For note, pause, reflection types - just mark as viewed
      setCompletedCheckpoints(new Set([...completedCheckpoints, checkpoint.id]));
    }
  };

  // Handle checkpoint skip
  const handleSkipCheckpoint = () => {
    if (!activeCheckpoint) return;

    if (settings.allowSkip && !activeCheckpoint.required) {
      setCompletedCheckpoints(new Set([...completedCheckpoints, activeCheckpoint.id]));
      setShowCheckpointModal(false);
      setActiveCheckpoint(null);
      if (isPlaying === false && settings.autoPause) {
        setIsPlaying(true);
      }
    }
  };

  // Handle checkpoint continue
  const handleContinue = () => {
    setShowCheckpointModal(false);
    setActiveCheckpoint(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setSelectedAnswer(null);

    if (isPlaying === false && settings.autoPause) {
      setIsPlaying(true);
    }
  };

  // Calculate progress
  const progress = checkpoints.length > 0
    ? (completedCheckpoints.size / checkpoints.length) * 100
    : 0;

  // Get video embed URL
  const getVideoEmbedUrl = (): string => {
    if (contentData.videoType === 'youtube') {
      const videoId = extractYouTubeVideoId(contentData.videoUrl);
      return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : '';
    } else if (contentData.videoType === 'vimeo') {
      const videoId = extractVimeoVideoId(contentData.videoUrl);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
    }
    return contentData.videoUrl;
  };

  // Check if all required checkpoints are completed
  const allRequiredCompleted = checkpoints
    .filter(cp => cp.required)
    .every(cp => completedCheckpoints.has(cp.id));

  return (
    <Container fluid className="interactive-video-viewer">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">{title}</h5>
            {description && <p className="text-muted small mb-0">{description}</p>}
          </div>
          {onClose && (
            <Button variant="outline-secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {/* Video Player */}
          <div className="video-container mb-3">
            <div className="video-wrapper">
              {contentData.videoType === 'youtube' && (
                <iframe
                  ref={videoRef as any}
                  width="100%"
                  height="500"
                  src={getVideoEmbedUrl()}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={title}
                  onLoad={() => {
                    // Start time tracking when iframe loads
                    setIsPlaying(true);
                    setCurrentTime(0);
                  }}
                />
              )}
              {contentData.videoType === 'vimeo' && (
                <iframe
                  ref={videoRef as any}
                  width="100%"
                  height="500"
                  src={getVideoEmbedUrl()}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={title}
                  onLoad={() => {
                    // Start time tracking when iframe loads
                    setIsPlaying(true);
                    setCurrentTime(0);
                  }}
                />
              )}
              {contentData.videoType === 'direct' && (
                <video
                  ref={videoRef as any}
                  width="100%"
                  height="500"
                  controls
                  src={contentData.videoUrl}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const newTime = video.currentTime;
                    setCurrentTime(newTime);
                    
                    // Check for checkpoints
                    const upcomingCheckpoint = sortedCheckpoints.find(
                      cp => !completedCheckpoints.has(cp.id) &&
                      cp.timestamp <= newTime &&
                      cp.timestamp > newTime - 1
                    );

                    if (upcomingCheckpoint) {
                      handleCheckpointReached(upcomingCheckpoint);
                      if (upcomingCheckpoint.pauseVideo && settings.autoPause) {
                        video.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={() => {
                    // Initialize time tracking
                    setIsPlaying(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {settings.showProgress && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small">Progress: {completedCheckpoints.size} / {checkpoints.length} checkpoints</span>
                <span className="small text-muted">
                  Time: {formatTime(currentTime)}
                  {contentData.videoType !== 'direct' && (
                    <span className="text-warning ms-2" title="Time tracking is approximate for YouTube/Vimeo videos">
                      (Approximate)
                    </span>
                  )}
                </span>
              </div>
              <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
              
              {/* Checkpoint markers */}
              {settings.showTimestamps && checkpoints.length > 0 && (
                <div className="checkpoint-markers mt-2">
                  {sortedCheckpoints.map((cp) => (
                    <div
                      key={cp.id}
                      className={`checkpoint-marker ${completedCheckpoints.has(cp.id) ? 'completed' : ''} ${activeCheckpoint?.id === cp.id ? 'active' : ''}`}
                      style={{ left: `${(cp.timestamp / 600) * 100}%` }}
                      title={`${formatTime(cp.timestamp)} - ${cp.type}`}
                    >
                      <FaQuestionCircle />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checkpoints List */}
          {checkpoints.length > 0 ? (
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Interactive Checkpoints ({checkpoints.length})</h6>
                <div className="d-flex gap-2">
                  {contentData.videoType !== 'direct' && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        // Manual checkpoint check - useful for YouTube/Vimeo
                        const checkpoint = sortedCheckpoints.find(
                          cp => !completedCheckpoints.has(cp.id) &&
                          Math.abs(cp.timestamp - currentTime) <= 2
                        );
                        if (checkpoint) {
                          handleCheckpointReached(checkpoint);
                        } else {
                          // Show alert if no checkpoint nearby
                          alert(`No checkpoint found near current time (${formatTime(currentTime)}). Checkpoints are at: ${sortedCheckpoints.map(cp => formatTime(cp.timestamp)).join(', ')}`);
                        }
                      }}
                    >
                      Check for Checkpoint
                    </Button>
                  )}
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => {
                      // Debug: Show all checkpoint info
                      console.log('Checkpoints:', sortedCheckpoints);
                      console.log('Current time:', currentTime);
                      console.log('Completed:', Array.from(completedCheckpoints));
                      alert(`Checkpoints: ${sortedCheckpoints.length}\nCurrent time: ${formatTime(currentTime)}\nCompleted: ${completedCheckpoints.size}`);
                    }}
                  >
                    Debug Info
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <ListGroup>
                  {sortedCheckpoints.map((checkpoint) => {
                    const isCompleted = completedCheckpoints.has(checkpoint.id);
                    const isActive = activeCheckpoint?.id === checkpoint.id;
                    
                    return (
                      <ListGroup.Item
                        key={checkpoint.id}
                        className={`checkpoint-list-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          // Allow manual trigger of checkpoints
                          console.log('Manual checkpoint trigger:', checkpoint);
                          handleCheckpointReached(checkpoint);
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <Badge bg="primary" className="me-2">
                                {formatTime(checkpoint.timestamp)}
                              </Badge>
                              <Badge bg="secondary" className="me-2">
                                {checkpoint.type}
                              </Badge>
                              {checkpoint.required && (
                                <Badge bg="warning">Required</Badge>
                              )}
                              {isCompleted && (
                                <Badge bg="success" className="ms-2">
                                  <FaCheckCircle /> Completed
                                </Badge>
                              )}
                            </div>
                            {checkpoint.title && (
                              <h6 className="mb-1">{checkpoint.title}</h6>
                            )}
                            <p className="mb-0 text-muted small">{checkpoint.content}</p>
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="warning" className="mb-3">
              <FaQuestionCircle className="me-2" />
              No checkpoints configured for this video. Checkpoints will appear here when added by the teacher.
            </Alert>
          )}

          {/* Completion Status */}
          {settings.requireCompletion && allRequiredCompleted && (
            <Alert variant="success">
              <FaCheckCircle /> All required checkpoints completed!
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Checkpoint Modal */}
      <Modal
        show={showCheckpointModal}
        onHide={() => {
          if (!activeCheckpoint?.required || settings.allowSkip) {
            handleContinue();
          }
        }}
        backdrop={activeCheckpoint?.required ? 'static' : true}
        keyboard={!activeCheckpoint?.required}
        size="lg"
      >
        <Modal.Header closeButton={!activeCheckpoint?.required || settings.allowSkip}>
          <Modal.Title>
            <FaQuestionCircle className="me-2" />
            {activeCheckpoint?.title || `Checkpoint at ${activeCheckpoint ? formatTime(activeCheckpoint.timestamp) : ''}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeCheckpoint && (
            <>
              <div className="mb-3">
                <Badge bg="primary" className="me-2">
                  {formatTime(activeCheckpoint.timestamp)}
                </Badge>
                <Badge bg="secondary">{activeCheckpoint.type}</Badge>
              </div>

              <p className="mb-3">{activeCheckpoint.content}</p>

              {(activeCheckpoint.type === 'question' || activeCheckpoint.type === 'quiz') && (
                <>
                  {!showExplanation && (
                    <Form>
                      <Form.Label>Select your answer:</Form.Label>
                      {activeCheckpoint.options?.map((option) => (
                        <Form.Check
                          key={option.id}
                          type="radio"
                          name="checkpoint-answer"
                          id={`option-${option.id}`}
                          label={option.text}
                          checked={selectedAnswer === option.id}
                          onChange={() => setSelectedAnswer(option.id)}
                          className="mb-2"
                        />
                      ))}
                    </Form>
                  )}

                  {showExplanation && (
                    <Alert variant={isCorrect ? 'success' : 'danger'}>
                      <div className="d-flex align-items-center mb-2">
                        {isCorrect ? (
                          <FaCheckCircle className="me-2" />
                        ) : (
                          <FaTimesCircle className="me-2" />
                        )}
                        <strong>{isCorrect ? 'Correct!' : 'Incorrect'}</strong>
                      </div>
                      {activeCheckpoint.explanation && (
                        <p className="mb-0 mt-2">{activeCheckpoint.explanation}</p>
                      )}
                      {!isCorrect && settings.allowRetry && (
                        <p className="mb-0 mt-2 small">
                          Attempts: {checkpointAttempts.get(activeCheckpoint.id) || 0}
                          {settings.maxAttempts && ` / ${settings.maxAttempts}`}
                        </p>
                      )}
                    </Alert>
                  )}
                </>
              )}

              {activeCheckpoint.type === 'note' && (
                <Alert variant="info">
                  <FaExclamationCircle className="me-2" />
                  Note: {activeCheckpoint.content}
                </Alert>
              )}

              {activeCheckpoint.type === 'reflection' && (
                <Form.Group>
                  <Form.Label>Your reflection:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Share your thoughts..."
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {activeCheckpoint && (
            <>
              {!showExplanation && (activeCheckpoint.type === 'question' || activeCheckpoint.type === 'quiz') ? (
                <>
                  <Button
                    variant="primary"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                  >
                    Submit Answer
                  </Button>
                  {settings.allowSkip && !activeCheckpoint.required && (
                    <Button variant="outline-secondary" onClick={handleSkipCheckpoint}>
                      Skip
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="primary" onClick={handleContinue}>
                  Continue
                </Button>
              )}
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default InteractiveVideoViewer;

