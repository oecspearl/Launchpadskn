import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { FaEye, FaClock } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import './RecentlyViewed.css';

/**
 * RecentlyViewed Component
 * Displays recently viewed items
 *  
 * @param {Array} items - Array of recently viewed items
 * @param {Function} onItemClick - Callback when an item is clicked
 * @param {string} title - Section title
 */
const RecentlyViewed = ({ items = [], onItemClick, title = "Recently Viewed" }) => {
    if (!items || items.length === 0) {
        return null;
    }

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return '';
        }
    };

    return (
        <Card className="recently-viewed-card border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 d-flex align-items-center">
                <FaEye className="me-2 text-primary" />
                <h6 className="mb-0 fw-bold">{title}</h6>
            </Card.Header>
            <Card.Body className="p-0">
                <ListGroup variant="flush">
                    {items.map((item, index) => (
                        <ListGroup.Item
                            key={index}
                            action
                            onClick={() => onItemClick && onItemClick(item)}
                            className="recently-viewed-item"
                        >
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                    <div className="recently-viewed-title">{item.title || item.name || 'Untitled'}</div>
                                    {item.subtitle && (
                                        <small className="text-muted d-block">{item.subtitle}</small>
                                    )}
                                </div>
                                {item.viewedAt && (
                                    <small className="text-muted ms-2">
                                        <FaClock className="me-1" />
                                        {formatTimeAgo(item.viewedAt)}
                                    </small>
                                )}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

export default RecentlyViewed;
