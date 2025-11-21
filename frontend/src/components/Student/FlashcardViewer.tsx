import React, { useState, useEffect } from 'react';
import {
  Container, Card, Button, Badge, ProgressBar, Alert,
  ButtonGroup, Row, Col
} from 'react-bootstrap';
import {
  FaArrowLeft, FaArrowRight, FaRandom, FaRedo, FaCheckCircle,
  FaTimesCircle, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { FlashcardData, Flashcard } from '../../types/contentTypes';
import './FlashcardViewer.css';

interface FlashcardViewerProps {
  contentData: FlashcardData;
  title: string;
  description?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

function FlashcardViewer({
  contentData,
  title,
  description,
  onComplete,
  onClose
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [cardOrder, setCardOrder] = useState<number[]>([]);
  const [markedCards, setMarkedCards] = useState<Set<string>>(new Set());
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [studyMode, setStudyMode] = useState<'study' | 'review'>('study');

  const settings = contentData.settings || {};
  const cards = contentData.cards || [];

  // Initialize card order based on study mode
  useEffect(() => {
    if (cards.length === 0) return;

    let order: number[] = [];

    if (settings.studyMode === 'random' || settings.shuffleCards) {
      // Random order
      order = Array.from({ length: cards.length }, (_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    } else if (settings.studyMode === 'difficulty') {
      // Order by difficulty: easy -> medium -> hard
      const difficultyOrder = ['easy', 'medium', 'hard'];
      order = cards
        .map((_, index) => ({ index, difficulty: cards[index].difficulty || 'medium' }))
        .sort((a, b) => {
          const aIdx = difficultyOrder.indexOf(a.difficulty);
          const bIdx = difficultyOrder.indexOf(b.difficulty);
          return aIdx - bIdx;
        })
        .map(item => item.index);
    } else {
      // Sequential order
      order = cards.map((_, index) => index);
    }

    setCardOrder(order);
    setCurrentIndex(0);
    setShowBack(false);
    setFlipped(false);
  }, [cards, settings.studyMode, settings.shuffleCards]);

  // Ensure currentIndex is within bounds
  const safeIndex = Math.min(currentIndex, cardOrder.length - 1);
  const currentCardIndex = cardOrder[safeIndex];
  const currentCard = currentCardIndex !== undefined ? cards[currentCardIndex] : null;
  const progress = cardOrder.length > 0 ? ((safeIndex + 1) / cardOrder.length) * 100 : 0;
  const isFirstCard = safeIndex === 0;
  const isLastCard = safeIndex === cardOrder.length - 1;

  const handleNext = () => {
    if (safeIndex < cardOrder.length - 1) {
      setCurrentIndex(safeIndex + 1);
      setShowBack(false);
      setFlipped(false);
    } else if (onComplete) {
      onComplete();
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
    if (settings.showAnswer === 'click') {
      setFlipped(!flipped);
      setShowBack(!showBack);
    }
  };

  const handleMarkCard = (status: 'known' | 'unknown') => {
    if (!currentCard) return;

    const newMarked = new Set(markedCards);
    const newKnown = new Set(knownCards);

    newMarked.add(currentCard.id);

    if (status === 'known') {
      newKnown.add(currentCard.id);
    } else {
      newKnown.delete(currentCard.id);
    }

    setMarkedCards(newMarked);
    setKnownCards(newKnown);
  };

  const handleShuffle = () => {
    const newOrder = [...cardOrder];
    for (let i = newOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
    }
    setCardOrder(newOrder);
    setCurrentIndex(0);
    setShowBack(false);
    setFlipped(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setShowBack(false);
    setFlipped(false);
    setMarkedCards(new Set());
    setKnownCards(new Set());
  };

  // Auto-advance logic
  useEffect(() => {
    if (settings.autoAdvance && showBack && flipped && currentCard && safeIndex < cardOrder.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(safeIndex + 1);
        setShowBack(false);
        setFlipped(false);
      }, (settings.autoAdvanceDelay || 3) * 1000);
      return () => clearTimeout(timer);
    } else if (settings.autoAdvance && showBack && flipped && currentCard && safeIndex === cardOrder.length - 1 && onComplete) {
      // Auto-complete on last card
      const timer = setTimeout(() => {
        onComplete();
      }, (settings.autoAdvanceDelay || 3) * 1000);
      return () => clearTimeout(timer);
    }
  }, [showBack, flipped, settings.autoAdvance, settings.autoAdvanceDelay, safeIndex, cardOrder.length, onComplete, currentCard]);

  if (!currentCard || cards.length === 0) {
    return (
      <Container className="flashcard-viewer">
        <Alert variant="warning">
          No flashcards available in this set.
        </Alert>
        {onClose && (
          <Button variant="secondary" onClick={onClose} className="mt-3">
            <FaArrowLeft /> Back
          </Button>
        )}
      </Container>
    );
  }

  const isKnown = knownCards.has(currentCard.id);
  const isMarked = markedCards.has(currentCard.id);

  return (
    <Container fluid className="flashcard-viewer">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>{title}</h4>
          {description && <p className="text-muted mb-0">{description}</p>}
        </div>
        {onClose && (
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            <FaArrowLeft /> Back
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {settings.showProgress && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted">
              Card {safeIndex + 1} of {cardOrder.length}
            </span>
            <span className="text-muted">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <ProgressBar now={progress} variant="primary" />
        </div>
      )}

      {/* Flashcard */}
      <Card className="flashcard-display mb-4">
        <Card.Body>
          <div
            className={`flashcard-container ${flipped ? 'flipped' : ''}`}
            onClick={settings.showAnswer === 'click' ? handleFlip : undefined}
            onMouseEnter={settings.showAnswer === 'hover' ? () => setShowBack(true) : undefined}
            onMouseLeave={settings.showAnswer === 'hover' ? () => setShowBack(false) : undefined}
          >
            <div className="flashcard-front">
              <div className="flashcard-content">
                {currentCard.frontImage && (
                  <img
                    src={currentCard.frontImage}
                    alt="Front"
                    className="flashcard-image mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flashcard-text">{currentCard.front}</div>
                {currentCard.tags && currentCard.tags.length > 0 && (
                  <div className="flashcard-tags mt-3">
                    {currentCard.tags.map((tag, idx) => (
                      <Badge key={idx} bg="secondary" className="me-1">{tag}</Badge>
                    ))}
                  </div>
                )}
                {currentCard.difficulty && (
                  <Badge
                    bg={
                      currentCard.difficulty === 'easy' ? 'success' :
                        currentCard.difficulty === 'medium' ? 'warning' : 'danger'
                    }
                    className="mt-2"
                  >
                    {currentCard.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            <div className={`flashcard-back ${showBack || flipped ? 'visible' : ''}`}>
              <div className="flashcard-content">
                {currentCard.backImage && (
                  <img
                    src={currentCard.backImage}
                    alt="Back"
                    className="flashcard-image mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flashcard-text">{currentCard.back}</div>
              </div>
            </div>
          </div>

          {settings.showAnswer === 'click' && (
            <div className="text-center mt-3">
              <Button
                variant="outline-primary"
                onClick={handleFlip}
                className="me-2"
              >
                {flipped ? <FaEyeSlash /> : <FaEye />} {flipped ? 'Show Front' : 'Show Answer'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Controls */}
      <Row className="mb-3">
        <Col md={6}>
          <ButtonGroup className="w-100">
            <Button
              variant="outline-secondary"
              onClick={handlePrevious}
              disabled={isFirstCard}
            >
              <FaArrowLeft /> Previous
            </Button>
            <Button
              variant="outline-primary"
              onClick={handleNext}
              disabled={isLastCard}
            >
              Next <FaArrowRight />
            </Button>
          </ButtonGroup>
        </Col>
        <Col md={6}>
          <ButtonGroup className="w-100">
            <Button
              variant="outline-info"
              onClick={handleShuffle}
              title="Shuffle cards"
            >
              <FaRandom /> Shuffle
            </Button>
            <Button
              variant="outline-warning"
              onClick={handleReset}
              title="Reset to beginning"
            >
              <FaRedo /> Reset
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {/* Marking Controls */}
      {settings.allowMarking && (
        <Card className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <span className="me-3">Did you know this?</span>
              <ButtonGroup>
                <Button
                  variant={isKnown ? 'success' : 'outline-success'}
                  size="sm"
                  onClick={() => handleMarkCard('known')}
                >
                  <FaCheckCircle /> Known
                </Button>
                <Button
                  variant={!isKnown && isMarked ? 'danger' : 'outline-danger'}
                  size="sm"
                  onClick={() => handleMarkCard('unknown')}
                >
                  <FaTimesCircle /> Unknown
                </Button>
              </ButtonGroup>
            </div>
            {isMarked && (
              <div className="mt-2">
                <small className="text-muted">
                  Status: {isKnown ? 'Marked as known' : 'Marked as unknown'}
                </small>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Statistics */}
      {settings.allowMarking && markedCards.size > 0 && (
        <Alert variant="info" className="mb-0">
          <strong>Progress:</strong> {knownCards.size} known, {markedCards.size - knownCards.size} unknown
        </Alert>
      )}
    </Container>
  );
}

export default FlashcardViewer;

