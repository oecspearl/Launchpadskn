import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import './QuickActions.css';

/**
 * QuickActions Component
 * Displays quick action buttons for common tasks
 * 
 * @param {Array} actions - Array of action objects { icon, label, onClick, variant }
 * @param {string} title - Section title
 */
const QuickActions = ({ actions = [], title = "Quick Actions" }) => {
    if (!actions || actions.length === 0) {
        return null;
    }

    return (
        <Card className="quick-actions-card border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
                <h6 className="mb-0 fw-bold">{title}</h6>
            </Card.Header>
            <Card.Body className="p-0">
                <div className="quick-actions-grid">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={`quick-action-btn ${action.variant || 'primary'}`}
                            title={action.label}
                        >
                            <div className="quick-action-icon">
                                {action.icon}
                            </div>
                            <span className="quick-action-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

export default QuickActions;
