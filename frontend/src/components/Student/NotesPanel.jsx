import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Offcanvas } from 'react-bootstrap';
import { FaStickyNote, FaSave, FaTrash, FaTimes } from 'react-icons/fa';

function NotesPanel({ lessonId }) {
    const [show, setShow] = useState(false);
    const [note, setNote] = useState('');
    const [savedTime, setSavedTime] = useState(null);

    useEffect(() => {
        // Load note from local storage
        const savedNote = localStorage.getItem(`lesson_note_${lessonId}`);
        if (savedNote) {
            setNote(savedNote);
        }
    }, [lessonId]);

    const handleSave = () => {
        localStorage.setItem(`lesson_note_${lessonId}`, note);
        setSavedTime(new Date().toLocaleTimeString());
        setTimeout(() => setSavedTime(null), 3000);
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear your notes?')) {
            setNote('');
            localStorage.removeItem(`lesson_note_${lessonId}`);
        }
    };

    return (
        <>
            <Button
                variant="primary"
                className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                style={{ width: '60px', height: '60px', zIndex: 1050 }}
                onClick={() => setShow(true)}
            >
                <FaStickyNote size={24} />
            </Button>

            <Offcanvas show={show} onHide={() => setShow(false)} placement="end" backdrop={false} scroll={true}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <FaStickyNote className="me-2 text-warning" />
                        My Notes
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <Form.Group className="flex-grow-1 mb-3">
                        <Form.Control
                            as="textarea"
                            placeholder="Type your notes here..."
                            style={{ height: '100%', resize: 'none' }}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-between align-items-center">
                        <Button variant="outline-danger" size="sm" onClick={handleClear}>
                            <FaTrash className="me-1" /> Clear
                        </Button>
                        <div className="d-flex align-items-center gap-2">
                            {savedTime && <small className="text-muted">Saved at {savedTime}</small>}
                            <Button variant="success" size="sm" onClick={handleSave}>
                                <FaSave className="me-1" /> Save
                            </Button>
                        </div>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default NotesPanel;
