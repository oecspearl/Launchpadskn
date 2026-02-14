import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Alert, Spinner,
  Modal, Badge, InputGroup, ButtonGroup, ListGroup
} from 'react-bootstrap';
import {
  FaPlus, FaTrash, FaEdit, FaSave, FaEye, FaClock,
  FaArrowUp, FaArrowDown, FaQuestionCircle, FaPause, FaCog, FaMagic
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import TinyMCEEditor from '../common/TinyMCEEditor';
import {
  InteractiveVideoData,
  VideoCheckpoint,
  CheckpointOption,
  defaultInteractiveVideoSettings,
  createEmptyInteractiveVideoData,
  detectVideoType,
  extractYouTubeVideoId,
  extractVimeoVideoId
} from '../../types/contentTypes';
import { generateInteractiveVideo } from '../../services/aiLessonService';
import './InteractiveVideoCreator.css';

interface InteractiveVideoCreatorProps {
  contentId?: number | null;
  lessonId: number;
  onSave?: (contentId: number) => void;
  onCancel?: () => void;
  initialData?: InteractiveVideoData;
  initialTitle?: string;
  initialDescription?: string;
}

function InteractiveVideoCreator({
  contentId,
  lessonId,
  onSave,
  onCancel,
  initialData,
  initialTitle = '',
  initialDescription = ''
}: InteractiveVideoCreatorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Content metadata
  const [title, setTitle] = useState(initialTitle || 'Interactive Video');
  const [description, setDescription] = useState(initialDescription || '');

  // Video data
  const [videoData, setVideoData] = useState<InteractiveVideoData>(
    initialData || createEmptyInteractiveVideoData()
  );

  // UI state
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState(videoData.videoUrl);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLIFrameElement>(null);

  // Autosave state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI Generation state
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState('');
  const [aiGradeLevel, setAiGradeLevel] = useState('');
  const [aiLearningOutcomes, setAiLearningOutcomes] = useState('');
  const [aiNumCheckpoints, setAiNumCheckpoints] = useState(5);
  const [aiCheckpointTypes, setAiCheckpointTypes] = useState<string[]>(['question', 'quiz', 'reflection']);
  const [aiVideoUrl, setAiVideoUrl] = useState('');
  const [aiAdditionalComments, setAiAdditionalComments] = useState('');
  const [lessonData, setLessonData] = useState<any>(null);

  // Load existing content if editing
  useEffect(() => {
    if (contentId && !initialData) {
      loadExistingContent();
    } else if (initialData) {
      setVideoData(initialData);
      setVideoUrlInput(initialData.videoUrl);
      if (initialTitle) setTitle(initialTitle);
      if (initialDescription) setDescription(initialDescription);
      setIsLoading(false);
    } else if (!contentId) {
      setIsLoading(false);
    }
  }, [contentId]);

  // Track changes for autosave
  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [videoData, title, description]);

  const loadExistingContent = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title || 'Interactive Video');
        setDescription(data.description || '');
        
        if (data.content_data) {
          setVideoData(data.content_data as InteractiveVideoData);
          setVideoUrlInput((data.content_data as InteractiveVideoData).videoUrl || '');
        } else {
          setVideoData(createEmptyInteractiveVideoData());
        }
      }
    } catch (err: any) {
      console.error('Error loading content:', err);
      setError(err.message || 'Failed to load video content');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle video URL change
  const handleVideoUrlChange = (url: string) => {
    setVideoUrlInput(url);
    const videoType = detectVideoType(url);
    setVideoData(prev => ({
      ...prev,
      videoUrl: url,
      videoType
    }));
  };

  // Add checkpoint
  const addCheckpoint = (timestamp?: number) => {
    const newCheckpoint: VideoCheckpoint = {
      id: `checkpoint-${Date.now()}-${Math.random()}`,
      timestamp: timestamp ?? currentTime,
      type: 'question',
      title: '',
      content: '',
      required: false,
      pauseVideo: true,
      order: videoData.checkpoints.length
    };

    setVideoData(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, newCheckpoint].sort((a, b) => a.timestamp - b.timestamp)
    }));

    setEditingCheckpointId(newCheckpoint.id);
  };

  // Update checkpoint
  const updateCheckpoint = (id: string, updates: Partial<VideoCheckpoint>) => {
    setVideoData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.map(cp =>
        cp.id === id ? { ...cp, ...updates } : cp
      )
    }));
  };

  // Delete checkpoint
  const deleteCheckpoint = (id: string) => {
    setVideoData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter(cp => cp.id !== id).map((cp, index) => ({
        ...cp,
        order: index
      }))
    }));
    if (editingCheckpointId === id) {
      setEditingCheckpointId(null);
    }
  };

  // Add option to checkpoint
  const addCheckpointOption = (checkpointId: string) => {
    const newOption: CheckpointOption = {
      id: `option-${Date.now()}-${Math.random()}`,
      text: '',
      isCorrect: false
    };

    updateCheckpoint(checkpointId, {
      options: [...(videoData.checkpoints.find(cp => cp.id === checkpointId)?.options || []), newOption]
    });
  };

  // Update checkpoint option
  const updateCheckpointOption = (checkpointId: string, optionId: string, updates: Partial<CheckpointOption>) => {
    const checkpoint = videoData.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;

    updateCheckpoint(checkpointId, {
      options: checkpoint.options?.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ) || []
    });
  };

  // Delete checkpoint option
  const deleteCheckpointOption = (checkpointId: string, optionId: string) => {
    const checkpoint = videoData.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;

    updateCheckpoint(checkpointId, {
      options: checkpoint.options?.filter(opt => opt.id !== optionId) || []
    });
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save content
  const saveContent = useCallback(async (isPublish = false) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!videoData.videoUrl.trim()) {
      setError('Video URL is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Validate checkpoints before saving
      console.log('[InteractiveVideoCreator] Saving video with data:', {
        title,
        videoUrl: videoData.videoUrl,
        checkpointsCount: videoData.checkpoints.length,
        checkpoints: videoData.checkpoints.map(cp => ({
          id: cp.id,
          timestamp: cp.timestamp,
          type: cp.type,
          content: cp.content?.substring(0, 50)
        }))
      });

      const contentPayload = {
        lesson_id: lessonId,
        content_type: 'INTERACTIVE_VIDEO',
        title: title.trim(),
        description: description.trim() || null,
        url: videoData.videoUrl.trim(),
        content_data: videoData,
        content_section: 'Learning',
        sequence_order: 1,
        is_required: true,
        is_published: isPublish,
        published_at: isPublish ? new Date().toISOString() : null,
        uploaded_by: user?.user_id || user?.userId
      };

      let result;
      if (contentId) {
        const { data, error } = await supabase
          .from('lesson_content')
          .update({
            ...contentPayload,
            updated_at: new Date().toISOString()
          })
          .eq('content_id', contentId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('lesson_content')
          .insert([contentPayload])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setSuccess('Interactive video saved successfully!');

      if (onSave) {
        onSave(result.content_id);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving interactive video:', err);
      setError(err.message || 'Failed to save interactive video');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, videoData, lessonId, contentId, user, onSave]);

  // AI Generation handler
  const handleGenerateInteractiveVideo = async () => {
    if (!aiTopic.trim()) {
      setError('Topic is required for AI generation');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const generatedVideo = await generateInteractiveVideo({
        topic: aiTopic.trim(),
        subject: aiSubject.trim() || undefined,
        gradeLevel: aiGradeLevel.trim() || undefined,
        learningOutcomes: aiLearningOutcomes.trim() || undefined,
        numCheckpoints: aiNumCheckpoints,
        checkpointTypes: aiCheckpointTypes,
        videoUrl: aiVideoUrl.trim() || undefined,
        additionalComments: aiAdditionalComments.trim() || undefined
      });

      // Update video data with generated content
      setVideoData({
        ...videoData,
        videoUrl: generatedVideo.videoUrl,
        videoType: generatedVideo.videoType,
        checkpoints: [...videoData.checkpoints, ...generatedVideo.checkpoints],
        settings: { ...videoData.settings, ...generatedVideo.settings }
      });

      // Update video URL input
      setVideoUrlInput(generatedVideo.videoUrl);
      
      // Update title if empty
      if (!title || title === 'Interactive Video') {
        setTitle(`${aiTopic} - Interactive Video`);
      }

      setSuccess(`Successfully generated interactive video with ${generatedVideo.checkpoints.length} checkpoints!`);
      setShowAIGenerator(false);
      
      // Reset AI form (keep topic and other fields for potential regeneration)
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error generating interactive video:', err);
      setError(err.message || 'Failed to generate interactive video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle checkpoint type selection
  const toggleCheckpointType = (type: string) => {
    setAiCheckpointTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container fluid className="interactive-video-creator">
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Video Configuration</h5>
              <div>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => setShowAIGenerator(true)}
                  className="me-2"
                >
                  <FaMagic className="me-1" /> AI Generate
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="me-2"
                >
                  <FaCog /> Settings
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="me-2"
                >
                  <FaEye /> {previewMode ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => saveContent(true)}
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner size="sm" /> : <FaSave />} Save & Publish
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={title || ''}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <TinyMCEEditor
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description"
                  height={120}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist | link"
                  plugins="lists link"
                  menubar={false}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Video URL *</Form.Label>
                <Form.Control
                  type="url"
                  value={videoUrlInput || ''}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <Form.Text className="text-muted">
                  Supports YouTube, Vimeo, or direct video URLs
                </Form.Text>
              </Form.Group>

              {videoData.videoUrl && (
                <div className="mb-3">
                  <h6>Video Preview</h6>
                  <div className="video-preview-container">
                    {videoData.videoType === 'youtube' && (
                      <iframe
                        ref={videoRef}
                        width="100%"
                        height="400"
                        src={`https://www.youtube.com/embed/${extractYouTubeVideoId(videoData.videoUrl)}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={title}
                      />
                    )}
                    {videoData.videoType === 'vimeo' && (
                      <iframe
                        ref={videoRef}
                        width="100%"
                        height="400"
                        src={`https://player.vimeo.com/video/${extractVimeoVideoId(videoData.videoUrl)}`}
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={title}
                      />
                    )}
                    {videoData.videoType === 'direct' && (
                      <video
                        ref={videoRef as any}
                        width="100%"
                        height="400"
                        controls
                        src={videoData.videoUrl}
                      />
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Interactive Checkpoints</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => addCheckpoint()}
                disabled={!videoData.videoUrl}
              >
                <FaPlus /> Add Checkpoint
              </Button>
            </Card.Header>
            <Card.Body>
              {videoData.checkpoints.length === 0 ? (
                <Alert variant="info">
                  No checkpoints added yet. Click "Add Checkpoint" to create interactive elements at specific timestamps.
                </Alert>
              ) : (
                <ListGroup>
                  {videoData.checkpoints.map((checkpoint, index) => (
                    <ListGroup.Item key={checkpoint.id} className="checkpoint-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <Badge bg="primary" className="me-2">
                              {formatTime(checkpoint.timestamp)}
                            </Badge>
                            <Badge bg="secondary" className="me-2">
                              {checkpoint.type}
                            </Badge>
                            {checkpoint.required && (
                              <Badge bg="warning">Required</Badge>
                            )}
                            {checkpoint.pauseVideo && (
                              <Badge bg="info">Pauses</Badge>
                            )}
                          </div>
                          {checkpoint.title && (
                            <h6 className="mb-1">{checkpoint.title}</h6>
                          )}
                          {checkpoint.content && (
                            <p className="mb-1 text-muted">{checkpoint.content.substring(0, 100)}...</p>
                          )}
                        </div>
                        <div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => setEditingCheckpointId(
                              editingCheckpointId === checkpoint.id ? null : checkpoint.id
                            )}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteCheckpoint(checkpoint.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>

                      {editingCheckpointId === checkpoint.id && (
                        <div className="mt-3 p-3 border rounded bg-light">
                          <Form.Group className="mb-2">
                            <Form.Label>Timestamp (seconds)</Form.Label>
                            <Form.Control
                              type="number"
                              min="0"
                              value={checkpoint.timestamp || 0}
                              onChange={(e) => updateCheckpoint(checkpoint.id, {
                                timestamp: parseFloat(e.target.value) || 0
                              })}
                            />
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                              value={checkpoint.type}
                              onChange={(e) => updateCheckpoint(checkpoint.id, {
                                type: e.target.value as VideoCheckpoint['type']
                              })}
                            >
                              <option value="question">Question</option>
                              <option value="quiz">Quiz</option>
                              <option value="note">Note</option>
                              <option value="pause">Pause</option>
                              <option value="reflection">Reflection</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Label>Title (optional)</Form.Label>
                            <Form.Control
                              type="text"
                              value={checkpoint.title || ''}
                              onChange={(e) => updateCheckpoint(checkpoint.id, {
                                title: e.target.value
                              })}
                              placeholder="Checkpoint title"
                            />
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Label>Content *</Form.Label>
                            <TinyMCEEditor
                              value={checkpoint.content || ''}
                              onChange={(e) => updateCheckpoint(checkpoint.id, {
                                content: e.target.value
                              })}
                              placeholder="Question text, note content, etc."
                              height={150}
                              toolbar="undo redo | formatselect | bold italic | bullist numlist | link"
                              plugins="lists link"
                              menubar={false}
                            />
                          </Form.Group>

                          {(checkpoint.type === 'question' || checkpoint.type === 'quiz') && (
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0">Options</Form.Label>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => addCheckpointOption(checkpoint.id)}
                                >
                                  <FaPlus /> Add Option
                                </Button>
                              </div>
                              {checkpoint.options?.map((option, optIndex) => (
                                <div key={option.id} className="d-flex align-items-center mb-2">
                                  <Form.Check
                                    type="radio"
                                    name={`correct-${checkpoint.id}`}
                                    checked={option.isCorrect}
                                    onChange={() => {
                                      // Uncheck all others, check this one
                                      checkpoint.options?.forEach(opt => {
                                        updateCheckpointOption(checkpoint.id, opt.id, {
                                          isCorrect: opt.id === option.id
                                        });
                                      });
                                    }}
                                    className="me-2"
                                  />
                                  <Form.Control
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updateCheckpointOption(checkpoint.id, option.id, {
                                      text: e.target.value
                                    })}
                                    placeholder="Option text"
                                    className="me-2"
                                  />
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => deleteCheckpointOption(checkpoint.id, option.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {checkpoint.type === 'quiz' && (
                            <Form.Group className="mb-2">
                              <Form.Label>Explanation (shown after answering)</Form.Label>
                              <TinyMCEEditor
                                value={(checkpoint.explanation || '')}
                                onChange={(e) => updateCheckpoint(checkpoint.id, {
                                  explanation: e.target.value
                                })}
                                placeholder="Explanation of the correct answer"
                                height={120}
                                toolbar="undo redo | formatselect | bold italic | bullist numlist | link"
                                plugins="lists link"
                                menubar={false}
                              />
                            </Form.Group>
                          )}

                          <div className="d-flex gap-2">
                            <Form.Check
                              type="checkbox"
                              label="Required (must complete before continuing)"
                              checked={checkpoint.required}
                              onChange={(e) => updateCheckpoint(checkpoint.id, {
                                required: e.target.checked
                              })}
                            />
                            <Form.Check
                              type="checkbox"
                              label="Pause video at this checkpoint"
                              checked={checkpoint.pauseVideo}
                              onChange={(e) => updateCheckpoint(checkpoint.id, {
                                pauseVideo: e.target.checked
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {showSettings && (
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Video Settings</h6>
              </Card.Header>
              <Card.Body>
                <Form.Check
                  type="checkbox"
                  label="Allow skipping checkpoints"
                  checked={videoData.settings.allowSkip}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowSkip: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Show progress indicator"
                  checked={videoData.settings.showProgress}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showProgress: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Show timestamps in progress bar"
                  checked={videoData.settings.showTimestamps}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showTimestamps: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Auto-pause at checkpoints"
                  checked={videoData.settings.autoPause}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, autoPause: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Allow seeking/scrubbing"
                  checked={videoData.settings.allowSeeking}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowSeeking: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Require all checkpoints completed"
                  checked={videoData.settings.requireCompletion}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, requireCompletion: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Show hints for questions"
                  checked={videoData.settings.showHints}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showHints: e.target.checked }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Allow retrying questions"
                  checked={videoData.settings.allowRetry}
                  onChange={(e) => setVideoData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowRetry: e.target.checked }
                  }))}
                  className="mb-2"
                />
                {videoData.settings.allowRetry && (
                  <Form.Group>
                    <Form.Label>Max Attempts</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={String(videoData.settings.maxAttempts || 3)}
                      onChange={(e) => setVideoData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, maxAttempts: parseInt(e.target.value) || 3 }
                      }))}
                    />
                  </Form.Group>
                )}
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Header>
              <h6 className="mb-0">Save Status</h6>
            </Card.Header>
            <Card.Body>
              {lastSaved && (
                <p className="text-muted small mb-2">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
              {hasUnsavedChanges && (
                <Badge bg="warning">Unsaved changes</Badge>
              )}
              <div className="mt-3">
                <Button
                  variant="primary"
                  className="w-100 mb-2"
                  onClick={() => saveContent(false)}
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner size="sm" /> : <FaSave />} Save Draft
                </Button>
                {onCancel && (
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* AI Generator Modal */}
      <Modal show={showAIGenerator} onHide={() => setShowAIGenerator(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            Generate Interactive Video with AI
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-4">
            <strong>AI Interactive Video Generator</strong>
            <br />
            Enter the topic and details below, and AI will find an appropriate video and generate interactive checkpoints for you. You can edit them after generation.
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Topic *</Form.Label>
              <Form.Control
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II, Algebra Basics"
                required
              />
              <Form.Text className="text-muted">
                The main topic or subject matter for the interactive video
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    placeholder="e.g., Biology, History, Mathematics"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Grade Level (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={aiGradeLevel}
                    onChange={(e) => setAiGradeLevel(e.target.value)}
                    placeholder="e.g., Form 1, Grade 5, High School"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Learning Outcomes (Optional)</Form.Label>
              <TinyMCEEditor
                value={aiLearningOutcomes}
                onChange={(e) => setAiLearningOutcomes(e.target.value)}
                placeholder="What students should learn from this video"
                height={150}
                toolbar="undo redo | formatselect | bold italic | bullist numlist"
                plugins="lists"
                menubar={false}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Checkpoints</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="20"
                    value={aiNumCheckpoints}
                    onChange={(e) => setAiNumCheckpoints(parseInt(e.target.value) || 5)}
                  />
                  <Form.Text className="text-muted">
                    Between 1 and 20 checkpoints
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Checkpoint Types</Form.Label>
                  <div>
                    {['question', 'quiz', 'note', 'pause', 'reflection'].map(type => (
                      <Form.Check
                        key={type}
                        type="checkbox"
                        id={`checkpoint-type-${type}`}
                        label={type.charAt(0).toUpperCase() + type.slice(1)}
                        checked={aiCheckpointTypes.includes(type)}
                        onChange={() => toggleCheckpointType(type)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                  <Form.Text className="text-muted">
                    Select the types of interactions to generate
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Video URL (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={aiVideoUrl}
                onChange={(e) => setAiVideoUrl(e.target.value)}
                placeholder="Leave empty to let AI find an appropriate video"
              />
              <Form.Text className="text-muted">
                If left empty, AI will search for an appropriate educational video
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Additional Comments (Optional)</Form.Label>
              <TinyMCEEditor
                value={aiAdditionalComments}
                onChange={(e) => setAiAdditionalComments(e.target.value)}
                placeholder="Any additional instructions or context for the AI (e.g., 'Focus on key concepts', 'Include real-world examples', 'Make questions challenging')"
                height={150}
                toolbar="undo redo | formatselect | bold italic | bullist numlist"
                plugins="lists"
                menubar={false}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAIGenerator(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerateInteractiveVideo}
            disabled={isGenerating || !aiTopic.trim() || aiCheckpointTypes.length === 0}
          >
            {isGenerating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <FaMagic className="me-2" />
                Generate Interactive Video
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default InteractiveVideoCreator;

