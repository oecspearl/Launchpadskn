import React from 'react';
import { Modal, Table, Badge } from 'react-bootstrap';
import { FaKeyboard } from 'react-icons/fa';
import './KeyboardShortcutsModal.css';

/**
 * Keyboard Shortcuts Modal
 * Displays available keyboard shortcuts to users
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {function} onHide - Callback when modal is closed
 */
const KeyboardShortcutsModal = ({ show, onHide }) => {
    const shortcuts = [
        {
            category: 'Navigation', items: [
                { keys: ['Alt', 'D'], description: 'Go to Dashboard' },
                { keys: ['Alt', 'L'], description: 'Go to Lessons/Classes' },
                { keys: ['Alt', 'A'], description: 'Go to Assignments' },
                { keys: ['Alt', 'T'], description: 'View Timetable' },
                { keys: ['Alt', 'S'], description: 'Focus Search' }
            ]
        },
        {
            category: 'General', items: [
                { keys: ['?'], description: 'Show Keyboard Shortcuts' },
                { keys: ['Esc'], description: 'Close Modals/Dialogs' }
            ]
        }
    ];

    const renderKey = (key) => (
        <Badge bg="light" text="dark" className="keyboard-key me-1">
            {key}
        </Badge>
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="d-flex align-items-center">
                    <FaKeyboard className="me-2 text-primary" />
                    Keyboard Shortcuts
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
                <p className="text-muted mb-4">
                    Use these keyboard shortcuts to navigate faster
                </p>

                {shortcuts.map((section, idx) => (
                    <div key={idx} className="mb-4">
                        <h6 className="text-uppercase text-muted small fw-bold mb-3">
                            {section.category}
                        </h6>
                        <Table hover className="shortcuts-table mb-0">
                            <tbody>
                                {section.items.map((shortcut, itemIdx) => (
                                    <tr key={itemIdx}>
                                        <td className="shortcut-keys">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <React.Fragment key={keyIdx}>
                                                    {keyIdx > 0 && <span className="key-separator">+</span>}
                                                    {renderKey(key)}
                                                </React.Fragment>
                                            ))}
                                        </td>
                                        <td className="shortcut-description">{shortcut.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                ))}

                <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                        <strong>Pro Tip:</strong> Press <Badge bg="light" text="dark">?</Badge> anytime to see these shortcuts
                    </small>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default KeyboardShortcutsModal;
