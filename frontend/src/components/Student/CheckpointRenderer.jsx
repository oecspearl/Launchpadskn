import React, { useState } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import { FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';

function CheckpointRenderer({ checkpoint, onComplete }) {
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Mock checkpoint structure if not provided
    const data = checkpoint || {
        type: 'QUIZ',
        question: 'What is the main function of the mitochondria?',
        options: ['Energy production', 'Protein synthesis', 'Waste removal', 'Cell division'],
        correctAnswer: 'Energy production'
    };

    const handleSubmit = () => {
        setSubmitted(true);
        if (data.type === 'QUIZ') {
            setIsCorrect(answer === data.correctAnswer);
        } else {
            setIsCorrect(true); // Reflection/Open-ended always "correct" on submission
        }
        if (onComplete) onComplete(true);
    };

    return (
        <div className="checkpoint-container my-4 p-4 rounded-3 border border-primary bg-light-subtle">
            <div className="d-flex align-items-center mb-3">
                <FaQuestionCircle className="text-primary me-2" size={24} />
                <h5 className="mb-0 fw-bold">Checkpoint</h5>
            </div>

            <p className="lead mb-3">{data.question}</p>

            {data.type === 'QUIZ' && (
                <div className="d-flex flex-column gap-2 mb-3">
                    {data.options.map((option, idx) => (
                        <Button
                            key={idx}
                            variant={submitted ? (option === data.correctAnswer ? 'success' : (answer === option ? 'danger' : 'outline-secondary')) : (answer === option ? 'primary' : 'outline-primary')}
                            className="text-start"
                            onClick={() => !submitted && setAnswer(option)}
                            disabled={submitted}
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            )}

            {data.type === 'REFLECTION' && (
                <Form.Group className="mb-3">
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Type your reflection here..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={submitted}
                    />
                </Form.Group>
            )}

            {!submitted ? (
                <Button onClick={handleSubmit} disabled={!answer}>
                    Submit Answer
                </Button>
            ) : (
                <div className={`mt-3 p-3 rounded ${isCorrect ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                    <div className="d-flex align-items-center">
                        <FaCheckCircle className="me-2" />
                        <strong>{isCorrect ? 'Correct!' : 'Incorrect. Try again next time.'}</strong>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CheckpointRenderer;
