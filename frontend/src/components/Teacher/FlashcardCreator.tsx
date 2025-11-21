import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Alert, Spinner,
  Modal, Badge, InputGroup, ButtonGroup
} from 'react-bootstrap';
import {
  FaPlus, FaTrash, FaEdit, FaSave, FaEye, FaRandom,
  FaArrowUp, FaArrowDown, FaImage, FaTag, FaCog, FaMagic
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import { FlashcardData, Flashcard, defaultFlashcardSettings, createEmptyFlashcardData } from '../../types/contentTypes';
import { generateFlashcards } from '../../services/aiLessonService';
import './FlashcardCreator.css';

interface FlashcardCreatorProps {
  contentId?: number | null; // For editing existing content
  lessonId: number;
  onSave?: (contentId: number) => void;
  onCancel?: () => void;
  initialData?: FlashcardData;
  initialTitle?: string;
  initialDescription?: string;
}

function FlashcardCreator({
  contentId,
  lessonId,
  onSave,
  onCancel,
  initialData,
  initialTitle = '',
  initialDescription = ''
}: FlashcardCreatorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Content metadata
  const [title, setTitle] = useState(initialTitle || 'Flashcard Set');
  const [description, setDescription] = useState(initialDescription || '');

  // Flashcard data
  const [flashcardData, setFlashcardData] = useState<FlashcardData>(
    initialData || createEmptyFlashcardData()
  );

  // UI state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI Generation state
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState('');
  const [aiGradeLevel, setAiGradeLevel] = useState('');
  const [aiNumCards, setAiNumCards] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiContext, setAiContext] = useState('');

  // Autosave state
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing content if editing (only if initialData is not provided)
  useEffect(() => {
    if (contentId && !initialData) {
      loadExistingContent();
    } else if (initialData) {
      // Use initialData if provided (e.g., when previewing from LessonContentManager)
      setFlashcardData(initialData);
      if (initialTitle) setTitle(initialTitle);
      if (initialDescription) setDescription(initialDescription);
      setIsLoading(false);
    } else if (!contentId) {
      // New flashcard set - no loading needed
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
        setTitle(data.title || 'Flashcard Set');
        setDescription(data.description || '');
        
        if (data.content_data) {
          setFlashcardData(data.content_data as FlashcardData);
        }
      }
    } catch (err: any) {
      console.error('Error loading content:', err);
      setError(err.message || 'Failed to load flashcard content');
    } finally {
      setIsLoading(false);
    }
  };

  // Autosave functionality
  const saveContent = useCallback(async (isPublish = false) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (flashcardData.cards.length === 0) {
      setError('Add at least one flashcard');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const contentPayload = {
        lesson_id: lessonId,
        content_type: 'FLASHCARD',
        title: title.trim(),
        description: description.trim() || null,
        content_data: flashcardData,
        content_section: 'Learning',
        sequence_order: 1,
        is_required: true,
        is_published: isPublish,
        published_at: isPublish ? new Date().toISOString() : null,
        uploaded_by: user?.user_id || user?.userId
      };

      let result;
      if (contentId) {
        // Update existing
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
        // Create new
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
      setSuccess('Flashcard set saved successfully!');

      if (onSave) {
        onSave(result.content_id);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving flashcard:', err);
      setError(err.message || 'Failed to save flashcard set');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, flashcardData, lessonId, contentId, user, onSave]);

  // Debounced autosave
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !title.trim() || flashcardData.cards.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      saveContent(false);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, [title, description, flashcardData, autosaveEnabled, hasUnsavedChanges, saveContent]);

  // Track changes
  useEffect(() => {
    if (contentId || flashcardData.cards.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [title, description, flashcardData]);

  // Card management functions
  const addCard = () => {
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      front: '',
      back: '',
      order: flashcardData.cards.length,
      tags: [],
      difficulty: 'medium'
    };

    setFlashcardData({
      ...flashcardData,
      cards: [...flashcardData.cards, newCard]
    });
    setEditingCardId(newCard.id);
  };

  const updateCard = (cardId: string, updates: Partial<Flashcard>) => {
    setFlashcardData({
      ...flashcardData,
      cards: flashcardData.cards.map(card =>
        card.id === cardId ? { ...card, ...updates } : card
      )
    });
  };

  const deleteCard = (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      setFlashcardData({
        ...flashcardData,
        cards: flashcardData.cards.filter(card => card.id !== cardId)
      });
      if (editingCardId === cardId) {
        setEditingCardId(null);
      }
    }
  };

  const moveCard = (cardId: string, direction: 'up' | 'down') => {
    const index = flashcardData.cards.findIndex(c => c.id === cardId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= flashcardData.cards.length) return;

    const newCards = [...flashcardData.cards];
    [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];
    
    // Update order values
    newCards.forEach((card, idx) => {
      card.order = idx;
    });

    setFlashcardData({
      ...flashcardData,
      cards: newCards
    });
  };

  const updateSettings = (updates: Partial<typeof flashcardData.settings>) => {
    setFlashcardData({
      ...flashcardData,
      settings: { ...flashcardData.settings, ...updates }
    });
  };

  // AI Generation handler
  const handleGenerateFlashcards = async () => {
    if (!aiTopic.trim()) {
      setError('Topic is required for AI generation');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const generatedCards = await generateFlashcards({
        topic: aiTopic.trim(),
        subject: aiSubject.trim() || undefined,
        gradeLevel: aiGradeLevel.trim() || undefined,
        numCards: aiNumCards,
        difficulty: aiDifficulty,
        context: aiContext.trim() || undefined
      });

      // Add generated cards to existing set
      const currentMaxOrder = flashcardData.cards.length > 0
        ? Math.max(...flashcardData.cards.map(c => c.order || 0))
        : -1;

      const cardsWithOrder = generatedCards.map((card, index) => ({
        ...card,
        order: currentMaxOrder + index + 1
      }));

      setFlashcardData({
        ...flashcardData,
        cards: [...flashcardData.cards, ...cardsWithOrder]
      });

      setSuccess(`Successfully generated ${generatedCards.length} flashcards!`);
      setShowAIGenerator(false);
      
      // Reset AI form
      setAiTopic('');
      setAiSubject('');
      setAiGradeLevel('');
      setAiNumCards(10);
      setAiDifficulty('medium');
      setAiContext('');

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error generating flashcards:', err);
      setError(err.message || 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading flashcard content...</p>
      </Container>
    );
  }

  return (
    <Container className="flashcard-creator">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Flashcard Creator</h3>
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
                variant="outline-primary"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="me-2"
              >
                <FaEye /> {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="primary"
                onClick={() => saveContent(true)}
                disabled={isSaving || !title.trim() || flashcardData.cards.length === 0}
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

      {!previewMode ? (
        <>
          {/* Content Metadata */}
          <Card className="mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Math Terms, Vocabulary Set"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Description (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this flashcard set"
                />
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Flashcard Settings</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Show Answer</Form.Label>
                      <Form.Select
                        value={flashcardData.settings.showAnswer}
                        onChange={(e) => updateSettings({ showAnswer: e.target.value as any })}
                      >
                        <option value="click">On Click</option>
                        <option value="hover">On Hover</option>
                        <option value="auto">Auto-reveal</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Study Mode</Form.Label>
                      <Form.Select
                        value={flashcardData.settings.studyMode}
                        onChange={(e) => updateSettings({ studyMode: e.target.value as any })}
                      >
                        <option value="sequential">Sequential</option>
                        <option value="random">Random</option>
                        <option value="difficulty">By Difficulty</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="shuffle-cards"
                      label="Shuffle Cards"
                      checked={flashcardData.settings.shuffleCards}
                      onChange={(e) => updateSettings({ shuffleCards: e.target.checked })}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="show-progress"
                      label="Show Progress"
                      checked={flashcardData.settings.showProgress}
                      onChange={(e) => updateSettings({ showProgress: e.target.checked })}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="allow-marking"
                      label="Allow Marking (Known/Unknown)"
                      checked={flashcardData.settings.allowMarking}
                      onChange={(e) => updateSettings({ allowMarking: e.target.checked })}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="auto-advance"
                      label="Auto-advance to Next Card"
                      checked={flashcardData.settings.autoAdvance}
                      onChange={(e) => updateSettings({ autoAdvance: e.target.checked })}
                    />
                  </Col>
                </Row>
                {flashcardData.settings.autoAdvance && (
                  <Form.Group className="mt-3">
                    <Form.Label>Auto-advance Delay (seconds)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="10"
                      value={flashcardData.settings.autoAdvanceDelay}
                      onChange={(e) => updateSettings({ autoAdvanceDelay: parseInt(e.target.value) || 3 })}
                    />
                  </Form.Group>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Cards List */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Flashcards ({flashcardData.cards.length})</h5>
              <div>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => setShowAIGenerator(true)}
                  className="me-2"
                >
                  <FaMagic /> Generate with AI
                </Button>
                <Button variant="primary" size="sm" onClick={addCard}>
                  <FaPlus /> Add Card
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {flashcardData.cards.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No flashcards yet. Click "Add Card" to create your first flashcard.</p>
                </div>
              ) : (
                <div className="flashcard-list">
                  {flashcardData.cards.map((card, index) => (
                    <Card key={card.id} className="mb-3 flashcard-item">
                      <Card.Body>
                        {editingCardId === card.id ? (
                          <FlashcardEditor
                            card={card}
                            onSave={(updates) => {
                              updateCard(card.id, updates);
                              setEditingCardId(null);
                            }}
                            onCancel={() => setEditingCardId(null)}
                          />
                        ) : (
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2">
                                <Badge bg="secondary" className="me-2">#{index + 1}</Badge>
                                {card.difficulty && (
                                  <Badge bg={
                                    card.difficulty === 'easy' ? 'success' :
                                    card.difficulty === 'medium' ? 'warning' : 'danger'
                                  } className="me-2">
                                    {card.difficulty}
                                  </Badge>
                                )}
                                {card.tags && card.tags.length > 0 && (
                                  <div>
                                    {card.tags.map((tag, i) => (
                                      <Badge key={i} bg="info" className="me-1">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="row">
                                <Col md={6}>
                                  <strong>Front:</strong>
                                  <p className="mb-2">{card.front || <em className="text-muted">Empty</em>}</p>
                                </Col>
                                <Col md={6}>
                                  <strong>Back:</strong>
                                  <p className="mb-0">{card.back || <em className="text-muted">Empty</em>}</p>
                                </Col>
                              </div>
                            </div>
                            <ButtonGroup size="sm" className="ms-3">
                              <Button
                                variant="outline-secondary"
                                onClick={() => moveCard(card.id, 'up')}
                                disabled={index === 0}
                              >
                                <FaArrowUp />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                onClick={() => moveCard(card.id, 'down')}
                                disabled={index === flashcardData.cards.length - 1}
                              >
                                <FaArrowDown />
                              </Button>
                              <Button
                                variant="outline-primary"
                                onClick={() => setEditingCardId(card.id)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => deleteCard(card.id)}
                              >
                                <FaTrash />
                              </Button>
                            </ButtonGroup>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      ) : (
        <div className="preview-container">
          {flashcardData.cards.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <Alert variant="warning">
                  No flashcards to preview. Add some cards first.
                </Alert>
                <Button onClick={() => setPreviewMode(false)} className="mt-3">
                  Back to Editor
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <FlashcardPreview
              cards={flashcardData.cards}
              settings={flashcardData.settings}
              onClose={() => setPreviewMode(false)}
            />
          )}
        </div>
      )}

      {/* AI Generation Modal */}
      <Modal show={showAIGenerator} onHide={() => setShowAIGenerator(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            Generate Flashcards with AI
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-4">
            <strong>AI Flashcard Generator</strong>
            <br />
            Enter the topic and details below, and AI will generate flashcards for you. You can edit them after generation.
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
                The main topic or subject matter for the flashcards
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Cards</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={aiNumCards}
                    onChange={(e) => setAiNumCards(parseInt(e.target.value) || 10)}
                  />
                  <Form.Text className="text-muted">
                    Between 1 and 50 cards
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty Level</Form.Label>
                  <Form.Select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Additional Context (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Any additional instructions or context for the AI (e.g., 'Focus on definitions', 'Include examples', 'Cover key dates')"
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
            onClick={handleGenerateFlashcards}
            disabled={isGenerating || !aiTopic.trim()}
          >
            {isGenerating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <FaMagic className="me-2" />
                Generate Flashcards
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

// Flashcard Editor Component (inline editing)
interface FlashcardEditorProps {
  card: Flashcard;
  onSave: (updates: Partial<Flashcard>) => void;
  onCancel: () => void;
}

function FlashcardEditor({ card, onSave, onCancel }: FlashcardEditorProps) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [frontImage, setFrontImage] = useState(card.frontImage || '');
  const [backImage, setBackImage] = useState(card.backImage || '');
  const [difficulty, setDifficulty] = useState(card.difficulty || 'medium');
  const [tags, setTags] = useState(card.tags?.join(', ') || '');

  const handleSave = () => {
    onSave({
      front: front.trim(),
      back: back.trim(),
      frontImage: frontImage.trim() || undefined,
      backImage: backImage.trim() || undefined,
      difficulty: difficulty as any,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    });
  };

  return (
    <div>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Front (Question/Term) *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the front side text..."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Front Image URL (Optional)</Form.Label>
            <InputGroup>
              <InputGroup.Text><FaImage /></InputGroup.Text>
              <Form.Control
                type="url"
                value={frontImage}
                onChange={(e) => setFrontImage(e.target.value)}
                placeholder="https://..."
              />
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Back (Answer/Definition) *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the back side text..."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Back Image URL (Optional)</Form.Label>
            <InputGroup>
              <InputGroup.Text><FaImage /></InputGroup.Text>
              <Form.Control
                type="url"
                value={backImage}
                onChange={(e) => setBackImage(e.target.value)}
                placeholder="https://..."
              />
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Difficulty</Form.Label>
            <Form.Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>Tags (comma-separated)</Form.Label>
            <InputGroup>
              <InputGroup.Text><FaTag /></InputGroup.Text>
              <Form.Control
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!front.trim() || !back.trim()}>
          Save Card
        </Button>
      </div>
    </div>
  );
}

// Flashcard Preview Component
interface FlashcardPreviewProps {
  cards: Flashcard[];
  settings: FlashcardData['settings'];
  onClose: () => void;
}

function FlashcardPreview({ cards, settings, onClose }: FlashcardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Reset index when cards change
  useEffect(() => {
    if (cards && cards.length > 0) {
      // Ensure currentIndex is within bounds
      if (currentIndex >= cards.length) {
        setCurrentIndex(0);
      }
      setShowBack(false);
      setFlipped(false);
    }
  }, [cards?.length]);

  // Safety check for empty cards
  if (!cards || cards.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <p>No cards to preview</p>
          <Button onClick={onClose}>Back to Editor</Button>
        </Card.Body>
      </Card>
    );
  }

  // Ensure currentIndex is within bounds
  const safeIndex = Math.min(currentIndex, cards.length - 1);
  const currentCard = cards[safeIndex];
  const progress = ((safeIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    if (safeIndex < cards.length - 1) {
      setCurrentIndex(safeIndex + 1);
      setShowBack(false);
      setFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
      setShowBack(false);
      setFlipped(false);
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
    if (settings.showAnswer === 'click') {
      setShowBack(!showBack);
    }
  }

  if (!currentCard) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <p>No cards to preview</p>
          <Button onClick={onClose}>Back to Editor</Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Preview Mode</h5>
          {settings.showProgress && (
            <small className="text-muted">
              Card {safeIndex + 1} of {cards.length}
            </small>
          )}
        </div>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Back to Editor
        </Button>
      </Card.Header>
      <Card.Body>
        {settings.showProgress && (
          <div className="progress mb-3" style={{ height: '8px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div
          className={`flashcard-preview ${flipped ? 'flipped' : ''}`}
          onClick={settings.showAnswer === 'click' ? handleFlip : undefined}
          onMouseEnter={settings.showAnswer === 'hover' ? () => setShowBack(true) : undefined}
          onMouseLeave={settings.showAnswer === 'hover' ? () => setShowBack(false) : undefined}
        >
          <div className="flashcard-front">
            <div className="flashcard-content">
              {currentCard.frontImage && (
                <img src={currentCard.frontImage} alt="Front" className="flashcard-image mb-3" />
              )}
              <div className="flashcard-text">{currentCard.front}</div>
            </div>
          </div>
          <div className={`flashcard-back ${showBack || flipped ? 'visible' : ''}`}>
            <div className="flashcard-content">
              {currentCard.backImage && (
                <img src={currentCard.backImage} alt="Back" className="flashcard-image mb-3" />
              )}
              <div className="flashcard-text">{currentCard.back}</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <Button
            variant="outline-secondary"
            onClick={handlePrevious}
            disabled={safeIndex === 0}
          >
            Previous
          </Button>
          {settings.showAnswer === 'click' && (
            <Button variant="primary" onClick={handleFlip}>
              {flipped ? 'Show Front' : 'Show Answer'}
            </Button>
          )}
          <Button
            variant="outline-primary"
            onClick={handleNext}
            disabled={safeIndex === cards.length - 1}
          >
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default FlashcardCreator;

