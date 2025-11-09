import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Card, Button, Alert, Spinner, ProgressBar,
  Form, Badge, Modal
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaClock, FaCheckCircle, FaTimesCircle,
  FaClipboardCheck, FaExclamationTriangle, FaTrophy
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';

function StudentQuizView() {
  const { contentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (contentId && user) {
      loadQuiz();
    }
  }, [contentId, user]);

  useEffect(() => {
    if (quiz && quiz.time_limit_minutes && attempt && !attempt.submitted_at) {
      startTimer();
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [quiz, attempt]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get quiz by content ID
      const quizData = await supabaseService.getQuizByContentId(contentId);
      
      if (!quizData) {
        setError('Quiz not found or not published');
        setLoading(false);
        return;
      }

      // Check if quiz is published
      if (!quizData.is_published) {
        setError('This quiz is not available yet.');
        setLoading(false);
        return;
      }

      // Randomize questions if enabled
      let questions = [...(quizData.questions || [])];
      if (quizData.randomize_questions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }

      // Randomize answer options if enabled
      if (quizData.randomize_answers) {
        questions = questions.map(q => {
          if (q.options && q.options.length > 0) {
            return {
              ...q,
              options: [...q.options].sort(() => Math.random() - 0.5)
            };
          }
          return q;
        });
      }

      setQuiz({ ...quizData, questions });

      // Get the numeric user_id (not UUID)
      // user.user_id is the numeric database ID, user.userId is the UUID
      let studentId = user.user_id;
      
      console.log('[StudentQuizView] User object:', { 
        user_id: user.user_id, 
        userId: user.userId, 
        id: user.id,
        user_id_type: typeof user.user_id,
        userId_type: typeof user.userId
      });
      
      // If user_id is not available or is a UUID string, fetch it from the database
      if (!studentId || typeof studentId !== 'number') {
        // Check if we have a UUID to look up
        const userIdToLookup = user.userId || user.id;
        if (userIdToLookup && typeof userIdToLookup === 'string' && userIdToLookup.includes('-')) {
          // It's a UUID, need to get the numeric user_id
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .eq('id', userIdToLookup)
            .maybeSingle();
          
          if (userError) {
            console.error('Error fetching user profile:', userError);
            setError('Unable to identify student. Please log in again.');
            setLoading(false);
            return;
          }
          
          if (userProfile && userProfile.user_id) {
            studentId = userProfile.user_id;
          } else {
            setError('Unable to identify student. Please log in again.');
            setLoading(false);
            return;
          }
        } else {
          setError('Unable to identify student. Please log in again.');
          setLoading(false);
          return;
        }
      }
      
      // Ensure studentId is a number
      if (typeof studentId !== 'number') {
        console.error('[StudentQuizView] studentId is not a number:', studentId, typeof studentId);
        setError('Unable to identify student. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('[StudentQuizView] Using studentId:', studentId, 'type:', typeof studentId);
      
      const existingAttempts = await supabaseService.getStudentQuizAttempts(
        quizData.quiz_id,
        studentId
      );

      // Check if student can take quiz
      if (existingAttempts && existingAttempts.length > 0) {
        const latestAttempt = existingAttempts[0];
        if (!quizData.allow_multiple_attempts && latestAttempt.submitted_at) {
          setError('You have already completed this quiz.');
          setLoading(false);
          return;
        }
        if (quizData.max_attempts && existingAttempts.length >= quizData.max_attempts) {
          setError(`You have reached the maximum number of attempts (${quizData.max_attempts}).`);
          setLoading(false);
          return;
        }
        // Check if there's an incomplete attempt
        if (latestAttempt && !latestAttempt.submitted_at) {
          setAttempt(latestAttempt);
          // Load existing responses
          const existingResponses = {};
          (latestAttempt.responses || []).forEach(r => {
            existingResponses[r.question_id] = {
              selected_option_id: r.selected_option_id,
              response_text: r.response_text
            };
          });
          setResponses(existingResponses);
        } else {
          // Create new attempt
          await createNewAttempt(quizData.quiz_id);
        }
      } else {
        // Create new attempt
        await createNewAttempt(quizData.quiz_id);
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err.message || err.details?.message || 'Failed to load quiz. Please try again or contact your teacher.');
    } finally {
      setLoading(false);
    }
  };

  const createNewAttempt = async (quizId) => {
    // Get the numeric user_id (not UUID)
    // user.user_id is the numeric database ID, user.userId is the UUID
    let studentId = user.user_id;
    
    // If user_id is not available or is a UUID string, fetch it from the database
    if (!studentId || typeof studentId !== 'number') {
      // Check if we have a UUID to look up
      const userIdToLookup = user.userId || user.id;
      if (userIdToLookup && typeof userIdToLookup === 'string' && userIdToLookup.includes('-')) {
        // It's a UUID, need to get the numeric user_id
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('user_id')
          .eq('id', userIdToLookup)
          .maybeSingle();
        
        if (userError) {
          console.error('Error fetching user profile:', userError);
          setError('Unable to identify student. Please log in again.');
          return;
        }
        
        if (userProfile && userProfile.user_id) {
          studentId = userProfile.user_id;
        } else {
          setError('Unable to identify student. Please log in again.');
          return;
        }
      } else {
        setError('Unable to identify student. Please log in again.');
        return;
      }
    }
    
    // Ensure studentId is a number
    if (typeof studentId !== 'number') {
      setError('Unable to identify student. Please log in again.');
      return;
    }
    
    try {
      // Get existing attempts to calculate next attempt number
      const existingAttempts = await supabaseService.getStudentQuizAttempts(
        quizId,
        studentId
      );
      
      // Calculate next attempt number
      const nextAttemptNumber = existingAttempts && existingAttempts.length > 0
        ? Math.max(...existingAttempts.map(a => a.attempt_number || 0)) + 1
        : 1;
      
      const attemptData = {
        quiz_id: quizId,
        student_id: studentId,
        attempt_number: nextAttemptNumber,
        started_at: new Date().toISOString()
      };

      const newAttempt = await supabaseService.createQuizAttempt(attemptData);
      setAttempt(newAttempt);
    } catch (err) {
      // If duplicate key error, try to load the existing attempt
      if (err.code === '23505' || err.message?.includes('duplicate key')) {
        console.log('Attempt already exists, loading existing attempt...');
        const existingAttempts = await supabaseService.getStudentQuizAttempts(
          quizId,
          studentId
        );
        if (existingAttempts && existingAttempts.length > 0) {
          const latestAttempt = existingAttempts[0];
          setAttempt(latestAttempt);
          // Load existing responses
          const existingResponses = {};
          (latestAttempt.responses || []).forEach(r => {
            existingResponses[r.question_id] = {
              selected_option_id: r.selected_option_id,
              response_text: r.response_text
            };
          });
          setResponses(existingResponses);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  };

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const timeLimitSeconds = quiz.time_limit_minutes * 60;
    const startTime = new Date(attempt.started_at).getTime();
    const endTime = startTime + (timeLimitSeconds * 1000);

    timerIntervalRef.current = setInterval(() => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        handleAutoSubmit();
      }
    }, 1000);

    // Initial calculation
    const now = new Date().getTime();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    setTimeRemaining(remaining);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResponseChange = (questionId, value, type) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type === 'option' ? 'selected_option_id' : 'response_text']: value
      }
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Prepare responses
      const responseData = quiz.questions.map(question => {
        const response = responses[question.question_id] || {};
        return {
          attempt_id: attempt.attempt_id,
          question_id: question.question_id,
          selected_option_id: response.selected_option_id || null,
          response_text: response.response_text || null
        };
      });

      // Submit quiz
      const submittedAttempt = await supabaseService.submitQuizAttempt(
        attempt.attempt_id,
        responseData
      );

      setAttempt(submittedAttempt);
      setSubmitted(true);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleAutoSubmit = async () => {
    // Auto-submit when time is up
    await handleSubmit();
  };

  const getQuestionResponse = (questionId) => {
    return responses[questionId] || {};
  };

  const getQuestionResult = (question) => {
    if (!submitted || !attempt.responses) return null;
    const response = attempt.responses.find(r => r.question_id === question.question_id);
    return response;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading quiz...</p>
        </div>
      </Container>
    );
  }

  if (error && !quiz) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" />
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  if (submitted && attempt) {
    const percentage = attempt.percentage_score || 0;
    const isPassed = attempt.is_passed;
    const totalQuestions = quiz.questions.length;
    const correctAnswers = (attempt.responses || []).filter(r => r.is_correct).length;

    return (
      <Container className="mt-4">
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-4">
            <div className="d-flex align-items-center">
              <FaClipboardCheck className="me-3 text-primary" style={{ fontSize: '2rem' }} />
              <div>
                <h4 className="mb-0">Quiz Submitted</h4>
                <p className="text-muted mb-0">{quiz.title}</p>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="text-center mb-4">
              <div className="mb-3">
                {isPassed ? (
                  <FaTrophy className="text-warning" style={{ fontSize: '4rem' }} />
                ) : (
                  <FaCheckCircle className="text-primary" style={{ fontSize: '4rem' }} />
                )}
              </div>
              <h2 className={isPassed ? 'text-success' : 'text-primary'}>
                {percentage.toFixed(1)}%
              </h2>
              <p className="text-muted">
                {correctAnswers} out of {totalQuestions} questions correct
              </p>
              {isPassed !== null && (
                <Badge bg={isPassed ? 'success' : 'danger'} className="mb-3">
                  {isPassed ? 'Passed' : 'Not Passed'}
                </Badge>
              )}
              {quiz.passing_score && (
                <p className="text-muted small">
                  Passing Score: {quiz.passing_score}%
                </p>
              )}
            </div>

            {quiz.show_results_immediately && (
              <div className="mt-4">
                <h5 className="mb-3">Question Review</h5>
                {quiz.questions.map((question, index) => {
                  const result = getQuestionResult(question);
                  const isCorrect = result?.is_correct || false;
                  const pointsEarned = result?.points_earned || 0;

                  return (
                    <Card key={question.question_id} className={`mb-3 ${isCorrect ? 'border-success' : 'border-danger'}`}>
                      <Card.Header className={isCorrect ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>Question {index + 1}</strong>
                            <Badge bg={isCorrect ? 'success' : 'danger'} className="ms-2">
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </div>
                          <div>
                            <Badge bg="info">
                              {pointsEarned} / {question.points} points
                            </Badge>
                          </div>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-3"><strong>{question.question_text}</strong></p>
                        
                        {['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type) && (
                          <div>
                            <p className="mb-2"><strong>Your Answer:</strong></p>
                            {question.options?.map(option => {
                              const isSelected = result?.selected_option_id === option.option_id;
                              const isCorrectOption = option.is_correct;
                              return (
                                <div
                                  key={option.option_id}
                                  className={`p-2 mb-2 rounded ${
                                    isSelected && isCorrectOption ? 'bg-success bg-opacity-25' :
                                    isSelected && !isCorrectOption ? 'bg-danger bg-opacity-25' :
                                    isCorrectOption ? 'bg-success bg-opacity-10' :
                                    'bg-light'
                                  }`}
                                >
                                  <div className="d-flex align-items-center">
                                    {isSelected && isCorrectOption && (
                                      <FaCheckCircle className="me-2 text-success" />
                                    )}
                                    {isSelected && !isCorrectOption && (
                                      <FaTimesCircle className="me-2 text-danger" />
                                    )}
                                    {isCorrectOption && !isSelected && (
                                      <FaTimesCircle className="me-2 text-success" />
                                    )}
                                    <span>{option.option_text}</span>
                                    {isCorrectOption && (
                                      <Badge bg="success" className="ms-auto">Correct</Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {['SHORT_ANSWER', 'FILL_BLANK', 'ESSAY'].includes(question.question_type) && (
                          <div>
                            <p className="mb-2"><strong>Your Answer:</strong></p>
                            <div className="p-3 bg-light rounded mb-2">
                              {result?.response_text || '(No answer provided)'}
                            </div>
                            {question.question_type !== 'ESSAY' && quiz.show_correct_answers && (
                              <div>
                                <p className="mb-2"><strong>Correct Answer(s):</strong></p>
                                <ul>
                                  {question.correct_answers?.map((answer, idx) => (
                                    <li key={idx}>{answer.correct_answer}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {question.explanation && (
                          <Alert variant="info" className="mt-3 mb-0">
                            <strong>Explanation:</strong> {question.explanation}
                          </Alert>
                        )}

                        {result?.feedback && (
                          <Alert variant="secondary" className="mt-3 mb-0">
                            <strong>Teacher Feedback:</strong> {result.feedback}
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-4">
              <Button variant="primary" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" />
                Back to Lesson
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!quiz || !attempt) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <p>Unable to load quiz. Please try again.</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" />
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  const answeredCount = Object.keys(responses).filter(
    key => responses[key]?.selected_option_id || responses[key]?.response_text
  ).length;
  const progress = quiz.questions.length > 0 ? (answeredCount / quiz.questions.length) * 100 : 0;

  return (
    <Container className="mt-4">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">{quiz.title}</h4>
              {quiz.description && (
                <p className="text-muted mb-0 small">{quiz.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <div className="text-center">
                <FaClock className="me-2" />
                <strong className={timeRemaining < 300 ? 'text-danger' : ''}>
                  {formatTime(timeRemaining)}
                </strong>
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {quiz.instructions && (
            <Alert variant="info" className="mb-4">
              <strong>Instructions:</strong>
              <div className="mt-2 white-space-pre-wrap">{quiz.instructions}</div>
            </Alert>
          )}

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Progress: {answeredCount} / {quiz.questions.length} questions answered</span>
              <Badge bg="info">{quiz.total_points || 0} total points</Badge>
            </div>
            <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
          </div>

          <Form>
            {quiz.questions.map((question, index) => {
              const response = getQuestionResponse(question.question_id);
              
              return (
                <Card key={question.question_id} className="mb-4">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Question {index + 1}</strong>
                        {question.is_required && (
                          <Badge bg="danger" className="ms-2">Required</Badge>
                        )}
                      </div>
                      <Badge bg="secondary">{question.points} points</Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-3"><strong>{question.question_text}</strong></p>

                    {question.question_type === 'MULTIPLE_CHOICE' && (
                      <div>
                        {question.options?.map((option) => (
                          <Form.Check
                            key={option.option_id}
                            type="radio"
                            name={`question-${question.question_id}`}
                            id={`option-${option.option_id}`}
                            label={option.option_text}
                            checked={response.selected_option_id === option.option_id}
                            onChange={() => handleResponseChange(question.question_id, option.option_id, 'option')}
                            className="mb-2"
                          />
                        ))}
                      </div>
                    )}

                    {question.question_type === 'TRUE_FALSE' && (
                      <div>
                        {question.options?.map((option) => (
                          <Form.Check
                            key={option.option_id}
                            type="radio"
                            name={`question-${question.question_id}`}
                            id={`option-${option.option_id}`}
                            label={option.option_text}
                            checked={response.selected_option_id === option.option_id}
                            onChange={() => handleResponseChange(question.question_id, option.option_id, 'option')}
                            className="mb-2"
                          />
                        ))}
                      </div>
                    )}

                    {['SHORT_ANSWER', 'FILL_BLANK', 'ESSAY'].includes(question.question_type) && (
                      <Form.Control
                        as={question.question_type === 'ESSAY' ? 'textarea' : 'input'}
                        rows={question.question_type === 'ESSAY' ? 6 : 1}
                        value={response.response_text || ''}
                        onChange={(e) => handleResponseChange(question.question_id, e.target.value, 'text')}
                        placeholder={
                          question.question_type === 'ESSAY' ? 'Type your essay answer here...' :
                          question.question_type === 'FILL_BLANK' ? 'Enter your answer...' :
                          'Enter your answer...'
                        }
                      />
                    )}
                  </Card.Body>
                </Card>
              );
            })}

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Confirm Submit Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Submission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to submit this quiz?</p>
          <p className="text-muted small">
            You have answered {answeredCount} out of {quiz.questions.length} questions.
          </p>
          {answeredCount < quiz.questions.length && (
            <Alert variant="warning" className="mb-0">
              <FaExclamationTriangle className="me-2" />
              You have unanswered questions. You can still submit, but unanswered questions will receive 0 points.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              'Submit Quiz'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default StudentQuizView;

