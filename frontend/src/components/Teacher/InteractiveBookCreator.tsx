import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Alert, Spinner,
  Modal, Badge, InputGroup, ButtonGroup, ListGroup
} from 'react-bootstrap';
import {
  FaPlus, FaTrash, FaEdit, FaSave, FaEye, FaArrowUp, FaArrowDown,
  FaCog, FaMagic, FaBook, FaVideo, FaQuestionCircle, FaImage, FaFileAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import {
  InteractiveBookData,
  BookPage,
  defaultInteractiveBookSettings,
  createEmptyInteractiveBookData
} from '../../types/contentTypes';
import { searchEducationalVideos } from '../../services/youtubeService';
import './InteractiveBookCreator.css';

interface InteractiveBookCreatorProps {
  contentId?: number | null;
  lessonId: number;
  onSave?: (contentId: number) => void;
  onCancel?: () => void;
  initialData?: InteractiveBookData;
  initialTitle?: string;
  initialDescription?: string;
}

function InteractiveBookCreator({
  contentId,
  lessonId,
  onSave,
  onCancel,
  initialData,
  initialTitle = '',
  initialDescription = ''
}: InteractiveBookCreatorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Content metadata
  const [title, setTitle] = useState(initialTitle || 'Interactive Book');
  const [description, setDescription] = useState(initialDescription || '');

  // Book data
  const [bookData, setBookData] = useState<InteractiveBookData>(
    initialData || createEmptyInteractiveBookData()
  );

  // UI state
  const [currentPageIndex, setCurrentPageIndex] = useState<number | null>(null);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmbedContentModal, setShowEmbedContentModal] = useState(false);
  const [availableContent, setAvailableContent] = useState<any[]>([]);

  // Autosave state
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing content if editing
  useEffect(() => {
    if (contentId && !initialData) {
      loadExistingContent();
    } else if (initialData) {
      setBookData(initialData);
      if (initialTitle) setTitle(initialTitle);
      if (initialDescription) setDescription(initialDescription);
      setIsLoading(false);
    } else if (!contentId) {
      setIsLoading(false);
    }
  }, [contentId]);

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
        setTitle(data.title || 'Interactive Book');
        setDescription(data.description || '');
        
        if (data.content_data) {
          setBookData(data.content_data as InteractiveBookData);
        }
      }
    } catch (err: any) {
      console.error('Error loading content:', err);
      setError(err.message || 'Failed to load book content');
    } finally {
      setIsLoading(false);
    }
  };

  // Save content
  const saveContent = useCallback(async (isPublish = false) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (bookData.pages.length === 0) {
      setError('Add at least one page');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const contentPayload = {
        lesson_id: lessonId,
        content_type: 'INTERACTIVE_BOOK',
        title: title.trim(),
        description: description.trim() || null,
        content_data: bookData,
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
      setSuccess('Interactive book saved successfully!');

      if (onSave) {
        onSave(result.content_id);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving book:', err);
      setError(err.message || 'Failed to save interactive book');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, bookData, lessonId, contentId, user, onSave]);

  // Debounced autosave
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !title.trim() || bookData.pages.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      saveContent(false);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, [title, description, bookData, autosaveEnabled, hasUnsavedChanges, saveContent]);

  // Track changes
  useEffect(() => {
    if (contentId || bookData.pages.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [title, description, bookData]);

  // Page management
  const addPage = (pageType: 'content' | 'video' | 'quiz' | 'image' = 'content') => {
    const newPage: BookPage = {
      id: crypto.randomUUID(),
      title: `Page ${bookData.pages.length + 1}`,
      pageType,
      content: pageType === 'content' ? '' : '',
      order: bookData.pages.length
    };

    setBookData({
      ...bookData,
      pages: [...bookData.pages, newPage]
    });

    setCurrentPageIndex(bookData.pages.length);
    setShowAddPageModal(false);
  };

  const updatePage = (pageId: string, updates: Partial<BookPage>) => {
    setBookData({
      ...bookData,
      pages: bookData.pages.map(page =>
        page.id === pageId ? { ...page, ...updates } : page
      )
    });
  };

  const deletePage = (pageId: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      const newPages = bookData.pages.filter(page => page.id !== pageId);
      setBookData({
        ...bookData,
        pages: newPages
      });
      
      if (currentPageIndex !== null && currentPageIndex >= newPages.length) {
        setCurrentPageIndex(newPages.length > 0 ? newPages.length - 1 : null);
      }
    }
  };

  const movePage = (pageId: string, direction: 'up' | 'down') => {
    const index = bookData.pages.findIndex(p => p.id === pageId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= bookData.pages.length) return;

    const newPages = [...bookData.pages];
    [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
    
    // Update order values
    newPages.forEach((page, idx) => {
      page.order = idx;
    });

    setBookData({
      ...bookData,
      pages: newPages
    });

    if (currentPageIndex === index) {
      setCurrentPageIndex(newIndex);
    } else if (currentPageIndex === newIndex) {
      setCurrentPageIndex(index);
    }
  };

  const currentPage = currentPageIndex !== null ? bookData.pages[currentPageIndex] : null;

  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading book content...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="interactive-book-creator">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3><FaBook className="me-2" />Interactive Book Creator</h3>
              {lastSaved && (
                <small className="text-muted">
                  Last saved: {lastSaved.toLocaleTimeString()}
                  {hasUnsavedChanges && ' • Unsaved changes'}
                </small>
              )}
            </div>
            <div>
              <Form.Check
                type="switch"
                id="autosave-switch"
                label="Autosave"
                checked={autosaveEnabled}
                onChange={(e) => setAutosaveEnabled(e.target.checked)}
                className="me-3"
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="me-2"
              >
                <FaCog /> Settings
              </Button>
              <Button
                variant="primary"
                onClick={() => saveContent(true)}
                disabled={isSaving || !title.trim() || bookData.pages.length === 0}
              >
                <FaSave /> {isSaving ? 'Saving...' : 'Save & Publish'}
              </Button>
              {onCancel && (
                <Button variant="outline-secondary" size="sm" onClick={onCancel} className="ms-2">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Row>
        {/* Page List Sidebar */}
        <Col md={3}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Pages ({bookData.pages.length})</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddPageModal(true)}
              >
                <FaPlus /> Add Page
              </Button>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {bookData.pages.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p>No pages yet. Click "Add Page" to create your first page.</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {bookData.pages.map((page, index) => (
                    <ListGroup.Item
                      key={page.id}
                      action
                      active={currentPageIndex === index}
                      onClick={() => setCurrentPageIndex(index)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center">
                          <Badge bg="secondary" className="me-2">#{index + 1}</Badge>
                          {page.pageType === 'content' && <FaFileAlt className="me-2" />}
                          {page.pageType === 'video' && <FaVideo className="me-2" />}
                          {page.pageType === 'quiz' && <FaQuestionCircle className="me-2" />}
                          {page.pageType === 'image' && <FaImage className="me-2" />}
                          <span className="text-truncate" style={{ maxWidth: '150px' }}>
                            {page.title}
                          </span>
                        </div>
                      </div>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(page.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <FaArrowUp />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(page.id, 'down');
                          }}
                          disabled={index === bookData.pages.length - 1}
                        >
                          <FaArrowDown />
                        </Button>
                      </ButtonGroup>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Page Editor */}
        <Col md={9}>
          {currentPage ? (
            <PageEditor
              page={currentPage}
              onUpdate={(updates) => updatePage(currentPage.id, updates)}
              onDelete={() => deletePage(currentPage.id)}
              onEmbedContent={() => setShowEmbedContentModal(true)}
            />
          ) : (
            <Card>
              <Card.Body className="text-center py-5 text-muted">
                <FaBook size={48} className="mb-3" />
                <p>Select a page from the list or add a new page to start editing.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Add Page Modal */}
      <Modal show={showAddPageModal} onHide={() => setShowAddPageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select the type of page you want to add:</p>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" onClick={() => addPage('content')}>
              <FaFileAlt className="me-2" /> Content Page
            </Button>
            <Button variant="outline-primary" onClick={() => addPage('video')}>
              <FaVideo className="me-2" /> Video Page
            </Button>
            <Button variant="outline-primary" onClick={() => addPage('quiz')}>
              <FaQuestionCircle className="me-2" /> Quiz Page
            </Button>
            <Button variant="outline-primary" onClick={() => addPage('image')}>
              <FaImage className="me-2" /> Image Page
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">Book Settings</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter book description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={bookData.subject || ''}
                onChange={(e) => setBookData({ ...bookData, subject: e.target.value })}
                placeholder="e.g., Mathematics, Science"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Grade Level (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={bookData.gradeLevel || ''}
                onChange={(e) => setBookData({ ...bookData, gradeLevel: e.target.value })}
                placeholder="e.g., Form 1, Grade 5"
              />
            </Form.Group>
            <hr />
            <h6>Display Settings</h6>
            <Form.Check
              type="switch"
              id="show-navigation"
              label="Show Navigation Buttons"
              checked={bookData.settings.showNavigation}
              onChange={(e) => setBookData({
                ...bookData,
                settings: { ...bookData.settings, showNavigation: e.target.checked }
              })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="show-progress"
              label="Show Progress Bar"
              checked={bookData.settings.showProgress}
              onChange={(e) => setBookData({
                ...bookData,
                settings: { ...bookData.settings, showProgress: e.target.checked }
              })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="require-completion"
              label="Require Completion of Embedded Activities"
              checked={bookData.settings.requireCompletion}
              onChange={(e) => setBookData({
                ...bookData,
                settings: { ...bookData.settings, requireCompletion: e.target.checked }
              })}
            />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

// Page Editor Component
interface PageEditorProps {
  page: BookPage;
  onUpdate: (updates: Partial<BookPage>) => void;
  onDelete: () => void;
  onEmbedContent: () => void;
}

function PageEditor({ page, onUpdate, onDelete, onEmbedContent }: PageEditorProps) {
  const pageType = page.pageType || 'content';

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Edit Page: {page.title}</h5>
        <ButtonGroup>
          <Button variant="outline-danger" size="sm" onClick={onDelete}>
            <FaTrash /> Delete
          </Button>
        </ButtonGroup>
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Page Title</Form.Label>
          <Form.Control
            type="text"
            value={page.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </Form.Group>

        {/* Content Page Editor */}
        {(!pageType || pageType === 'content') && (
          <ContentPageEditor page={page} onUpdate={onUpdate} />
        )}

        {/* Video Page Editor */}
        {pageType === 'video' && (
          <VideoPageEditor page={page} onUpdate={onUpdate} />
        )}

        {/* Quiz Page Editor */}
        {pageType === 'quiz' && (
          <QuizPageEditor page={page} onUpdate={onUpdate} />
        )}

        {/* Image Page Editor */}
        {pageType === 'image' && (
          <ImagePageEditor page={page} onUpdate={onUpdate} />
        )}

        {/* Audio Recorder */}
        <hr />
        <AudioRecorder
          audioUrl={page.audioUrl}
          onSave={(audioUrl) => onUpdate({ audioUrl })}
        />

        {/* Embedded Content */}
        <hr />
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Embedded Content</Form.Label>
            <Button variant="outline-primary" size="sm" onClick={onEmbedContent}>
              <FaPlus /> Embed Content
            </Button>
          </div>
          {page.embeddedContentId && (
            <Alert variant="info" className="mb-0">
              Embedded content ID: {page.embeddedContentId}
            </Alert>
          )}
          {page.embeddedContent && (
            <Alert variant="info" className="mb-0">
              Embedded content: {page.embeddedContent.type}
            </Alert>
          )}
          {!page.embeddedContentId && !page.embeddedContent && (
            <Form.Text className="text-muted">
              Embed quizzes, flashcards, or other interactive content into this page.
            </Form.Text>
          )}
        </Form.Group>
      </Card.Body>
    </Card>
  );
}

// Content Page Editor
interface ContentPageEditorProps {
  page: BookPage;
  onUpdate: (updates: Partial<BookPage>) => void;
}

function ContentPageEditor({ page, onUpdate }: ContentPageEditorProps) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>Content (HTML supported)</Form.Label>
      <Form.Control
        as="textarea"
        rows={10}
        value={page.content || ''}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Enter page content. HTML is supported."
      />
      <Form.Text className="text-muted">
        You can use HTML tags for formatting (e.g., &lt;p&gt;, &lt;strong&gt;, &lt;img&gt;)
      </Form.Text>
    </Form.Group>
  );
}

// Video Page Editor
interface VideoPageEditorProps {
  page: BookPage;
  onUpdate: (updates: Partial<BookPage>) => void;
}

function VideoPageEditor({ page, onUpdate }: VideoPageEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const videos = await searchEducationalVideos({ query: searchQuery, maxResults: 5 });
      setSearchResults(videos);
    } catch (err: any) {
      console.error('Error searching videos:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectVideo = (video: any) => {
    onUpdate({
      videoData: {
        videoId: video.videoId,
        videoUrl: video.url,
        title: video.title,
        description: video.description
      }
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Video URL or Search</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for YouTube videos or paste a URL"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="primary" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Spinner size="sm" /> : 'Search'}
          </Button>
        </InputGroup>
      </Form.Group>

      {searchResults.length > 0 && (
        <div className="mb-3">
          <h6>Search Results:</h6>
          {searchResults.map((video) => (
            <Card key={video.videoId} className="mb-2">
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <img src={video.thumbnail} alt={video.title} className="img-fluid" />
                  </Col>
                  <Col md={9}>
                    <h6>{video.title}</h6>
                    <p className="text-muted small">{video.description?.substring(0, 100)}...</p>
                    <Button size="sm" onClick={() => selectVideo(video)}>
                      Select This Video
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {page.videoData && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Video Title</Form.Label>
            <Form.Control
              type="text"
              value={page.videoData.title}
              onChange={(e) => onUpdate({
                videoData: { ...page.videoData!, title: e.target.value }
              })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Instructions (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={page.videoData.instructions || ''}
              onChange={(e) => onUpdate({
                videoData: { ...page.videoData!, instructions: e.target.value }
              })}
              placeholder="Instructions for students watching this video"
            />
          </Form.Group>
          <div className="mb-3">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${page.videoData.videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </>
      )}
    </>
  );
}

// Quiz Page Editor
interface QuizPageEditorProps {
  page: BookPage;
  onUpdate: (updates: Partial<BookPage>) => void;
}

function QuizPageEditor({ page, onUpdate }: QuizPageEditorProps) {
  const quizData = page.quizData || {
    questions: [],
    settings: {
      shuffle: false,
      showAnswers: true,
      allowRetry: true
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: crypto.randomUUID(),
      type: 'multiple-choice' as const,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    };
    onUpdate({
      quizData: {
        ...quizData,
        questions: [...quizData.questions, newQuestion]
      }
    });
  };

  const updateQuestion = (questionId: string, updates: any) => {
    onUpdate({
      quizData: {
        ...quizData,
        questions: quizData.questions.map(q =>
          q.id === questionId ? { ...q, ...updates } : q
        )
      }
    });
  };

  const deleteQuestion = (questionId: string) => {
    onUpdate({
      quizData: {
        ...quizData,
        questions: quizData.questions.filter(q => q.id !== questionId)
      }
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6>Quiz Questions ({quizData.questions.length})</h6>
        <Button variant="primary" size="sm" onClick={addQuestion}>
          <FaPlus /> Add Question
        </Button>
      </div>

      {quizData.questions.map((question, index) => (
        <Card key={question.id} className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Question {index + 1}</span>
            <Button variant="outline-danger" size="sm" onClick={() => deleteQuestion(question.id)}>
              <FaTrash />
            </Button>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Question Type</Form.Label>
              <Form.Select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, { type: e.target.value })}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="fill-blank">Fill in the Blank</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Question</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={question.question}
                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
              />
            </Form.Group>
            {question.type === 'multiple-choice' && (
              <>
                {question.options?.map((option, optIndex) => (
                  <Form.Group key={optIndex} className="mb-2">
                    <InputGroup>
                      <InputGroup.Text>
                        <Form.Check
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === option}
                          onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                        />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(question.options || [])];
                          newOptions[optIndex] = e.target.value;
                          updateQuestion(question.id, { options: newOptions });
                        }}
                        placeholder={`Option ${optIndex + 1}`}
                      />
                    </InputGroup>
                  </Form.Group>
                ))}
              </>
            )}
            {question.type === 'true-false' && (
              <Form.Group className="mb-3">
                <Form.Label>Correct Answer</Form.Label>
                <Form.Select
                  value={question.correctAnswer as string}
                  onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Form.Select>
              </Form.Group>
            )}
            {question.type === 'fill-blank' && (
              <Form.Group className="mb-3">
                <Form.Label>Correct Answer(s) - comma separated</Form.Label>
                <Form.Control
                  type="text"
                  value={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                  onChange={(e) => updateQuestion(question.id, {
                    correctAnswer: e.target.value.split(',').map(a => a.trim())
                  })}
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Explanation (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                placeholder="Explanation shown after answering"
              />
            </Form.Group>
          </Card.Body>
        </Card>
      ))}

      <hr />
      <h6>Quiz Settings</h6>
      <Form.Check
        type="switch"
        label="Shuffle Questions"
        checked={quizData.settings.shuffle}
        onChange={(e) => onUpdate({
          quizData: { ...quizData, settings: { ...quizData.settings, shuffle: e.target.checked } }
        })}
        className="mb-2"
      />
      <Form.Check
        type="switch"
        label="Show Answers"
        checked={quizData.settings.showAnswers}
        onChange={(e) => onUpdate({
          quizData: { ...quizData, settings: { ...quizData.settings, showAnswers: e.target.checked } }
        })}
        className="mb-2"
      />
      <Form.Check
        type="switch"
        label="Allow Retry"
        checked={quizData.settings.allowRetry}
        onChange={(e) => onUpdate({
          quizData: { ...quizData, settings: { ...quizData.settings, allowRetry: e.target.checked } }
        })}
      />
    </>
  );
}

// Image Page Editor
interface ImagePageEditorProps {
  page: BookPage;
  onUpdate: (updates: Partial<BookPage>) => void;
}

function ImagePageEditor({ page, onUpdate }: ImagePageEditorProps) {
  const imageData = page.imageData || { imageUrl: '', instructions: '' };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Image URL</Form.Label>
        <Form.Control
          type="url"
          value={imageData.imageUrl}
          onChange={(e) => onUpdate({
            imageData: { ...imageData, imageUrl: e.target.value }
          })}
          placeholder="https://..."
        />
      </Form.Group>
      {imageData.imageUrl && (
        <div className="mb-3">
          <img src={imageData.imageUrl} alt="Preview" className="img-fluid" style={{ maxHeight: '400px' }} />
        </div>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Instructions (Optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={imageData.instructions || ''}
          onChange={(e) => onUpdate({
            imageData: { ...imageData, instructions: e.target.value }
          })}
          placeholder="Instructions for students viewing this image"
        />
      </Form.Group>
    </>
  );
}

// Audio Recorder Component
interface AudioRecorderProps {
  audioUrl?: string;
  onSave: (audioUrl: string) => void;
}

function AudioRecorder({ audioUrl, onSave }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(audioUrl || null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioPreview(base64Audio);
          onSave(base64Audio);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioPreview(null);
    onSave('');
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Audio Narration (Optional)</Form.Label>
      <div className="d-flex gap-2 mb-2">
        {!isRecording ? (
          <Button variant="primary" size="sm" onClick={startRecording}>
            <FaEdit /> Start Recording
          </Button>
        ) : (
          <Button variant="danger" size="sm" onClick={stopRecording}>
            <FaTrash /> Stop Recording
          </Button>
        )}
        {audioPreview && (
          <Button variant="outline-danger" size="sm" onClick={deleteAudio}>
            <FaTrash /> Delete Audio
          </Button>
        )}
      </div>
      {audioPreview && (
        <div className="mt-2">
          <audio controls src={audioPreview} className="w-100" />
        </div>
      )}
      <Form.Text className="text-muted">
        Record audio narration for this page. Click "Start Recording" to begin.
      </Form.Text>
    </Form.Group>
  );
}

export default InteractiveBookCreator;

