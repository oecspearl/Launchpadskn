import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, ProgressBar, Form, Badge, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaTrophy, FaClipboardCheck } from 'react-icons/fa';
import supabaseService from '../../services/supabaseService';

function QuizViewer({ contentId, contentData, title }) {
    const [responses, setResponses] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [quizData, setQuizData] = useState(contentData);
    const [loading, setLoading] = useState(!contentData);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!contentData && contentId) {
            const fetchQuiz = async () => {
                try {
                    setLoading(true);
                    const data = await supabaseService.getQuizByContentId(contentId);
                    if (data) {
                        setQuizData(data);
                    } else {
                        setError('Quiz data not found.');
                    }
                } catch (err) {
                    console.error('Error fetching quiz:', err);
                    setError('Failed to load quiz data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchQuiz();
        } else if (contentData) {
            setQuizData(contentData);
            setLoading(false);
        }
    }, [contentId, contentData]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-3">Loading quiz...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    // Guard clause
    if (!quizData) {
        return <Alert variant="danger">Quiz data is missing.</Alert>;
    }

    const quiz = quizData;
    const questions = quiz.questions || [];

    const handleResponseChange = (questionId, value, type) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [type === 'option' ? 'selected_option_id' : 'response_text']: value
            }
        }));
    };

    const handleSubmit = () => {
        let correctCount = 0;
        questions.forEach(q => {
            const response = responses[q.question_id];
            if (!response) return;

            // Simple grading logic for preview
            if (q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'TRUE_FALSE') {
                const selectedOption = q.options?.find(opt => opt.option_id === response.selected_option_id);
                if (selectedOption?.is_correct) correctCount++;
            } else {
                // For text answers, just mark as correct for preview purposes or check against answer key if available
                if (q.correct_answers && q.correct_answers.some(a => a.correct_answer === response.response_text)) {
                    correctCount++;
                }
            }
        });
        setScore(correctCount);
        setSubmitted(true);
    };

    const answeredCount = Object.keys(responses).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    if (submitted) {
        const percentage = (score / questions.length) * 100;
        return (
            <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                    <FaTrophy className="text-warning mb-3" style={{ fontSize: '3rem' }} />
                    <h3>Quiz Completed!</h3>
                    <h2 className="text-primary">{percentage.toFixed(0)}%</h2>
                    <p>You got {score} out of {questions.length} correct.</p>
                    <Button variant="outline-primary" onClick={() => { setSubmitted(false); setResponses({}); setScore(null); }}>
                        Retake Quiz
                    </Button>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm">
            <Card.Body>
                <div className="mb-4">
                    <h5>{title}</h5>
                    {quiz.description && <p className="text-muted">{quiz.description}</p>}
                    <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
                </div>

                <Form>
                    {questions.map((question, index) => {
                        const response = responses[question.question_id] || {};
                        return (
                            <Card key={question.question_id} className="mb-4">
                                <Card.Header className="bg-light">
                                    <strong>Question {index + 1}</strong>
                                </Card.Header>
                                <Card.Body>
                                    <p className="mb-3"><strong>{question.question_text}</strong></p>

                                    {(question.question_type === 'MULTIPLE_CHOICE' || question.question_type === 'TRUE_FALSE') && (
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
                                            rows={question.question_type === 'ESSAY' ? 3 : 1}
                                            value={response.response_text || ''}
                                            onChange={(e) => handleResponseChange(question.question_id, e.target.value, 'text')}
                                            placeholder="Enter your answer..."
                                        />
                                    )}
                                </Card.Body>
                            </Card>
                        );
                    })}

                    <Button variant="primary" onClick={handleSubmit}>
                        Submit Quiz
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default QuizViewer;
