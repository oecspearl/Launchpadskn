import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Button, Alert, Spinner, Card, ListGroup, Badge,
  Row, Col, InputGroup
} from 'react-bootstrap';
import { 
  FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaCheckCircle,
  FaArrowUp, FaArrowDown, FaGripVertical
} from 'react-icons/fa';
import supabaseService from '../../services/supabaseService';
import TinyMCEEditor from '../common/TinyMCEEditor';

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  TRUE_FALSE: 'True/False',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
  FILL_BLANK: 'Fill in the Blank'
};

function QuizBuilder({ show, onHide, contentId, quizId = null, onSave }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Quiz metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Questions
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (show) {
      if (quizId) {
        loadQuiz();
      } else {
        resetForm();
      }
    }
  }, [show, quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const quiz = await supabaseService.getQuizById(quizId);
      setTitle(quiz.title || '');
      setDescription(quiz.description || '');
      setInstructions(quiz.instructions || '');
      setTimeLimit(quiz.time_limit_minutes || '');
      setPassingScore(quiz.passing_score || '');
      setAllowMultipleAttempts(quiz.allow_multiple_attempts || false);
      setMaxAttempts(String(quiz.max_attempts || 1));
      setShowResultsImmediately(quiz.show_results_immediately !== false);
      setShowCorrectAnswers(quiz.show_correct_answers !== false);
      setRandomizeQuestions(quiz.randomize_questions || false);
      setRandomizeAnswers(quiz.randomize_answers || false);
      setIsPublished(quiz.is_published || false);

      // Load questions with options and correct answers
      const loadedQuestions = (quiz.questions || []).map((q, index) => ({
        ...q,
        question_order: q.question_order || index + 1,
        options: q.options || [],
        correct_answers: q.correct_answers || []
      }));
      setQuestions(loadedQuestions);
    } catch (err) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setTimeLimit('');
    setPassingScore('');
    setAllowMultipleAttempts(false);
    setMaxAttempts('1');
    setShowResultsImmediately(true);
    setShowCorrectAnswers(true);
    setRandomizeQuestions(false);
    setRandomizeAnswers(false);
    setIsPublished(false);
    setQuestions([]);
    setEditingQuestion(null);
    setError(null);
    setSuccess(null);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      question_id: `temp-${Date.now()}`,
      question_type: 'MULTIPLE_CHOICE',
      question_text: '',
      points: '1',
      explanation: '',
      is_required: true,
      question_order: questions.length + 1,
      options: [],
      correct_answers: []
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion.question_id);
  };

  const handleEditQuestion = (questionId) => {
    setEditingQuestion(questionId);
  };

  const handleSaveQuestion = (questionId) => {
    const questionIndex = questions.findIndex(q => q.question_id === questionId);
    if (questionIndex === -1) return;

    const question = questions[questionIndex];
    
    // Validate question
    if (!question.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type)) {
      if (!question.options || question.options.length === 0) {
        setError('At least one answer option is required');
        return;
      }
      const hasCorrect = question.options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        setError('At least one correct answer is required');
        return;
      }
    } else if (['SHORT_ANSWER', 'FILL_BLANK'].includes(question.question_type)) {
      if (!question.correct_answers || question.correct_answers.length === 0) {
        setError('At least one correct answer is required');
        return;
      }
    }

    setEditingQuestion(null);
    setError(null);
  };

  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.question_id !== questionId));
    if (editingQuestion === questionId) {
      setEditingQuestion(null);
    }
  };

  const handleUpdateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.question_id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleAddOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        const newOption = {
          option_id: `temp-${Date.now()}`,
          option_text: '',
          is_correct: false,
          option_order: (q.options || []).length + 1
        };
        return {
          ...q,
          options: [...(q.options || []), newOption]
        };
      }
      return q;
    }));
  };

  const handleUpdateOption = (questionId, optionId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          options: (q.options || []).map(opt =>
            opt.option_id === optionId ? { ...opt, [field]: value } : opt
          )
        };
      }
      return q;
    }));
  };

  const handleDeleteOption = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          options: (q.options || []).filter(opt => opt.option_id !== optionId)
        };
      }
      return q;
    }));
  };

  const handleAddCorrectAnswer = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        const newAnswer = {
          answer_id: `temp-${Date.now()}`,
          correct_answer: '',
          case_sensitive: false,
          accept_partial: false
        };
        return {
          ...q,
          correct_answers: [...(q.correct_answers || []), newAnswer]
        };
      }
      return q;
    }));
  };

  const handleUpdateCorrectAnswer = (questionId, answerId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          correct_answers: (q.correct_answers || []).map(ans =>
            ans.answer_id === answerId ? { ...ans, [field]: value } : ans
          )
        };
      }
      return q;
    }));
  };

  const handleDeleteCorrectAnswer = (questionId, answerId) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          correct_answers: (q.correct_answers || []).filter(ans => ans.answer_id !== answerId)
        };
      }
      return q;
    }));
  };

  const handleMoveQuestion = (questionId, direction) => {
    const index = questions.findIndex(q => q.question_id === questionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    // Update order
    newQuestions.forEach((q, i) => {
      q.question_order = i + 1;
    });
    
    setQuestions(newQuestions);
  };

  const calculateTotalPoints = () => {
    return questions.reduce((sum, q) => sum + parseFloat(q.points || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate
      if (!title.trim()) {
        throw new Error('Quiz title is required');
      }
      if (questions.length === 0) {
        throw new Error('At least one question is required');
      }

      // Validate all questions
      for (const question of questions) {
        if (!question.question_text.trim()) {
          throw new Error(`Question ${question.question_order} is missing text`);
        }
        if (['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type)) {
          if (!question.options || question.options.length === 0) {
            throw new Error(`Question ${question.question_order} is missing answer options`);
          }
          const hasCorrect = question.options.some(opt => opt.is_correct);
          if (!hasCorrect) {
            throw new Error(`Question ${question.question_order} has no correct answer`);
          }
        } else if (['SHORT_ANSWER', 'FILL_BLANK'].includes(question.question_type)) {
          if (!question.correct_answers || question.correct_answers.length === 0) {
            throw new Error(`Question ${question.question_order} is missing correct answers`);
          }
        }
      }

      // Save quiz
      const quizData = {
        content_id: contentId,
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        passing_score: passingScore ? parseFloat(passingScore) : null,
        allow_multiple_attempts: allowMultipleAttempts,
        max_attempts: parseInt(maxAttempts) || 1,
        show_results_immediately: showResultsImmediately,
        show_correct_answers: showCorrectAnswers,
        randomize_questions: randomizeQuestions,
        randomize_answers: randomizeAnswers,
        is_published: isPublished,
        total_points: calculateTotalPoints()
      };

      if (isPublished && !quizId) {
        quizData.published_at = new Date().toISOString();
      }

      let savedQuiz;
      if (quizId) {
        savedQuiz = await supabaseService.updateQuiz(quizId, quizData);
      } else {
        savedQuiz = await supabaseService.createQuiz(quizData);
      }

      // Save questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionData = {
          quiz_id: savedQuiz.quiz_id,
          question_type: question.question_type,
          question_text: question.question_text.trim(),
          question_order: i + 1,
          points: parseFloat(question.points || 1),
          explanation: question.explanation?.trim() || null,
          is_required: question.is_required !== false
        };

        let savedQuestion;
        if (question.question_id && !question.question_id.toString().startsWith('temp-')) {
          // Update existing question
          savedQuestion = await supabaseService.updateQuizQuestion(question.question_id, questionData);
        } else {
          // Create new question
          savedQuestion = await supabaseService.createQuizQuestion(questionData);
        }

        // Save options for multiple choice/true-false
        if (['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type)) {
          // Delete old options if updating
          if (savedQuestion.question_id && !question.question_id.toString().startsWith('temp-')) {
            const oldOptions = question.options.filter(opt => opt.option_id && !opt.option_id.toString().startsWith('temp-'));
            for (const oldOpt of oldOptions) {
              await supabaseService.deleteAnswerOption(oldOpt.option_id);
            }
          }

          // Create new options
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            const optionData = {
              question_id: savedQuestion.question_id,
              option_text: option.option_text.trim(),
              is_correct: option.is_correct || false,
              option_order: j + 1,
              points: option.points ? parseFloat(option.points) : null
            };

            if (option.option_id && !option.option_id.toString().startsWith('temp-')) {
              await supabaseService.updateAnswerOption(option.option_id, optionData);
            } else {
              await supabaseService.createAnswerOption(optionData);
            }
          }
        }

        // Save correct answers for short answer/fill blank
        if (['SHORT_ANSWER', 'FILL_BLANK'].includes(question.question_type)) {
          // Delete old correct answers
          if (savedQuestion.question_id && !question.question_id.toString().startsWith('temp-')) {
            await supabaseService.deleteCorrectAnswersForQuestion(savedQuestion.question_id);
          }

          // Create new correct answers
          for (const correctAnswer of question.correct_answers || []) {
            const answerData = {
              question_id: savedQuestion.question_id,
              correct_answer: correctAnswer.correct_answer.trim(),
              case_sensitive: correctAnswer.case_sensitive || false,
              accept_partial: correctAnswer.accept_partial || false
            };
            await supabaseService.createCorrectAnswer(answerData);
          }
        }
      }

      // Delete removed questions
      if (quizId) {
        const existingQuiz = await supabaseService.getQuizById(quizId);
        const existingQuestionIds = (existingQuiz.questions || []).map(q => q.question_id);
        const currentQuestionIds = questions
          .filter(q => q.question_id && !q.question_id.toString().startsWith('temp-'))
          .map(q => q.question_id);
        
        for (const oldId of existingQuestionIds) {
          if (!currentQuestionIds.includes(oldId)) {
            await supabaseService.deleteQuizQuestion(oldId);
          }
        }
      }

      setSuccess('Quiz saved successfully!');
      if (onSave) {
        onSave(savedQuiz);
      }
      
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading quiz...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>{quizId ? 'Edit Quiz' : 'Create Quiz'}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Quiz Settings */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Quiz Settings</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Label>Quiz Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={title || ''}
                  onChange={(e) => setTitle(e.target.value || '')}
                  placeholder="Enter quiz title"
                  required
                />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Description</Form.Label>
                <TinyMCEEditor
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value || '')}
                  placeholder="Brief description of the quiz"
                  height={120}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Instructions</Form.Label>
                <TinyMCEEditor
                  value={instructions || ''}
                  onChange={(e) => setInstructions(e.target.value || '')}
                  placeholder="Instructions for students taking this quiz"
                  height={150}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Time Limit (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={timeLimit || ''}
                  onChange={(e) => setTimeLimit(e.target.value || '')}
                  placeholder="Leave empty for no limit"
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Passing Score (%)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore || ''}
                  onChange={(e) => setPassingScore(e.target.value || '')}
                  placeholder="Leave empty for no requirement"
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Allow Multiple Attempts"
                  checked={allowMultipleAttempts}
                  onChange={(e) => setAllowMultipleAttempts(e.target.checked)}
                />
                {allowMultipleAttempts && (
                  <Form.Control
                    type="number"
                    min="1"
                    value={maxAttempts || '1'}
                    onChange={(e) => setMaxAttempts(e.target.value || '1')}
                    className="mt-2"
                    placeholder="Max attempts"
                  />
                )}
              </Col>
              <Col md={6} className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Show Results Immediately"
                  checked={showResultsImmediately}
                  onChange={(e) => setShowResultsImmediately(e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  label="Show Correct Answers"
                  checked={showCorrectAnswers}
                  onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                  className="mt-2"
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Randomize Questions"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  label="Randomize Answer Options"
                  checked={randomizeAnswers}
                  onChange={(e) => setRandomizeAnswers(e.target.checked)}
                  className="mt-2"
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Publish Quiz"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Published quizzes are visible to students
                </Form.Text>
              </Col>
            </Row>
            <div className="mt-3">
              <Badge bg="info">Total Points: {calculateTotalPoints()}</Badge>
              <Badge bg="secondary" className="ms-2">Questions: {questions.length}</Badge>
            </div>
          </Card.Body>
        </Card>

        {/* Questions */}
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Questions</h5>
            <Button variant="primary" size="sm" onClick={handleAddQuestion}>
              <FaPlus className="me-1" />
              Add Question
            </Button>
          </Card.Header>
          <Card.Body>
            {questions.length === 0 ? (
              <Alert variant="info">
                No questions yet. Click "Add Question" to get started.
              </Alert>
            ) : (
              <ListGroup variant="flush">
                {questions.map((question, index) => (
                  <QuestionEditor
                    key={question.question_id}
                    question={question}
                    index={index}
                    isEditing={editingQuestion === question.question_id}
                    onEdit={() => handleEditQuestion(question.question_id)}
                    onSave={() => handleSaveQuestion(question.question_id)}
                    onDelete={() => handleDeleteQuestion(question.question_id)}
                    onUpdate={(field, value) => handleUpdateQuestion(question.question_id, field, value)}
                    onAddOption={() => handleAddOption(question.question_id)}
                    onUpdateOption={(optionId, field, value) => handleUpdateOption(question.question_id, optionId, field, value)}
                    onDeleteOption={(optionId) => handleDeleteOption(question.question_id, optionId)}
                    onAddCorrectAnswer={() => handleAddCorrectAnswer(question.question_id)}
                    onUpdateCorrectAnswer={(answerId, field, value) => handleUpdateCorrectAnswer(question.question_id, answerId, field, value)}
                    onDeleteCorrectAnswer={(answerId) => handleDeleteCorrectAnswer(question.question_id, answerId)}
                    onMoveUp={() => handleMoveQuestion(question.question_id, 'up')}
                    onMoveDown={() => handleMoveQuestion(question.question_id, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < questions.length - 1}
                  />
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Quiz'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// Question Editor Component
function QuestionEditor({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onUpdate,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onAddCorrectAnswer,
  onUpdateCorrectAnswer,
  onDeleteCorrectAnswer,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) {
  if (!isEditing) {
    return (
      <ListGroup.Item>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-2">
              <Badge bg="primary" className="me-2">{index + 1}</Badge>
              <Badge bg="secondary" className="me-2">{QUESTION_TYPES[question.question_type]}</Badge>
              <Badge bg="info">{question.points} pts</Badge>
            </div>
            <p className="mb-0">{question.question_text || '(No question text)'}</p>
            {question.question_type === 'MULTIPLE_CHOICE' && (
              <small className="text-muted">
                {question.options?.length || 0} options
              </small>
            )}
          </div>
          <div className="d-flex gap-1">
            <Button variant="outline-secondary" size="sm" onClick={onMoveUp} disabled={!canMoveUp}>
              <FaArrowUp />
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={onMoveDown} disabled={!canMoveDown}>
              <FaArrowDown />
            </Button>
            <Button variant="outline-primary" size="sm" onClick={onEdit}>
              <FaEdit />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={onDelete}>
              <FaTrash />
            </Button>
          </div>
        </div>
      </ListGroup.Item>
    );
  }

  return (
    <ListGroup.Item className="border-primary">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <Badge bg="primary" className="me-2">Question {index + 1}</Badge>
            <Badge bg="info">{question.points} points</Badge>
          </div>
          <div>
            <Button variant="success" size="sm" onClick={onSave} className="me-2">
              <FaSave className="me-1" />
              Save
            </Button>
            <Button variant="secondary" size="sm" onClick={onSave}>
              <FaTimes />
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Question Type *</Form.Label>
              <Form.Select
                value={question.question_type}
                onChange={(e) => onUpdate('question_type', e.target.value)}
              >
                {Object.entries(QUESTION_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Points *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.5"
                value={question.points || ''}
                onChange={(e) => onUpdate('points', e.target.value || '')}
                required
              />
            </Col>
            <Col md={12} className="mb-3">
              <Form.Label>Question Text *</Form.Label>
              <TinyMCEEditor
                value={question.question_text || ''}
                onChange={(e) => onUpdate('question_text', e.target.value || '')}
                placeholder="Enter your question"
                height={150}
                toolbar="undo redo | formatselect | bold italic | bullist numlist | link"
                plugins="lists link"
                menubar={false}
              />
            </Col>
            <Col md={12} className="mb-3">
              <Form.Label>Explanation (shown after answering)</Form.Label>
              <TinyMCEEditor
                value={question.explanation || ''}
                onChange={(e) => onUpdate('explanation', e.target.value)}
                placeholder="Optional explanation of the correct answer"
                height={120}
                toolbar="undo redo | formatselect | bold italic | bullist numlist | link"
                plugins="lists link"
                menubar={false}
              />
            </Col>
          </Row>

          {/* Multiple Choice / True False Options */}
          {['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type) && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Answer Options *</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={onAddOption}>
                  <FaPlus className="me-1" />
                  Add Option
                </Button>
              </div>
              {(question.options || []).map((option, optIndex) => (
                <InputGroup key={option.option_id} className="mb-2">
                  <InputGroup.Checkbox
                    checked={option.is_correct || false}
                    onChange={(e) => onUpdateOption(option.option_id, 'is_correct', e.target.checked)}
                  />
                  <Form.Control
                    type="text"
                    value={option.option_text || ''}
                    onChange={(e) => onUpdateOption(option.option_id, 'option_text', e.target.value || '')}
                    placeholder={`Option ${optIndex + 1}`}
                  />
                  <Button
                    variant="outline-danger"
                    onClick={() => onDeleteOption(option.option_id)}
                  >
                    <FaTrash />
                  </Button>
                </InputGroup>
              ))}
              {(!question.options || question.options.length === 0) && (
                <Alert variant="warning" className="mb-0">
                  Add at least one answer option and mark the correct one(s)
                </Alert>
              )}
            </div>
          )}

          {/* Short Answer / Fill Blank Correct Answers */}
          {['SHORT_ANSWER', 'FILL_BLANK'].includes(question.question_type) && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Correct Answers *</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={onAddCorrectAnswer}>
                  <FaPlus className="me-1" />
                  Add Answer
                </Button>
              </div>
              {(question.correct_answers || []).map((answer) => (
                <InputGroup key={answer.answer_id} className="mb-2">
                  <Form.Control
                    type="text"
                    value={answer.correct_answer || ''}
                    onChange={(e) => onUpdateCorrectAnswer(answer.answer_id, 'correct_answer', e.target.value || '')}
                    placeholder="Correct answer"
                  />
                  <Form.Check
                    type="checkbox"
                    label="Case Sensitive"
                    checked={answer.case_sensitive || false}
                    onChange={(e) => onUpdateCorrectAnswer(answer.answer_id, 'case_sensitive', e.target.checked)}
                    className="ms-2"
                  />
                  <Form.Check
                    type="checkbox"
                    label="Accept Partial"
                    checked={answer.accept_partial || false}
                    onChange={(e) => onUpdateCorrectAnswer(answer.answer_id, 'accept_partial', e.target.checked)}
                    className="ms-2"
                  />
                  <Button
                    variant="outline-danger"
                    onClick={() => onDeleteCorrectAnswer(answer.answer_id)}
                  >
                    <FaTrash />
                  </Button>
                </InputGroup>
              ))}
              {(!question.correct_answers || question.correct_answers.length === 0) && (
                <Alert variant="warning" className="mb-0">
                  Add at least one correct answer
                </Alert>
              )}
            </div>
          )}

          {/* Essay questions don't need correct answers */}
          {question.question_type === 'ESSAY' && (
            <Alert variant="info">
              Essay questions will be graded manually by the teacher.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </ListGroup.Item>
  );
}

export default QuizBuilder;

