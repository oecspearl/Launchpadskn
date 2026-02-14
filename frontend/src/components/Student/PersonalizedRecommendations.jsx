import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Badge } from 'react-bootstrap';
import { FaLightbulb, FaArrowRight, FaTimes } from 'react-icons/fa';
import { recommendationService } from '../../services/recommendationService';

function PersonalizedRecommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const data = await recommendationService.getRecommendations();
            setRecommendations(data);
        } catch (error) {
            console.error("Failed to load recommendations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (id) => {
        try {
            await recommendationService.dismissRecommendation(id);
            setRecommendations(recommendations.filter(rec => rec.id !== id));
        } catch (error) {
            console.error("Failed to dismiss recommendation", error);
        }
    };

    if (loading) return <div>Loading Recommendations...</div>;

    if (recommendations.length === 0) {
        return (
            <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center text-muted py-5">
                    <FaLightbulb size={40} className="mb-3 text-warning opacity-50" />
                    <p>No new recommendations at the moment. Keep up the good work!</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark">
                    <FaLightbulb className="me-2 text-warning" />
                    Recommended for You
                </h5>
            </Card.Header>
            <Card.Body className="p-0">
                <ListGroup variant="flush">
                    {recommendations.map((rec) => (
                        <ListGroup.Item key={rec.id} className="border-0 p-3 action-hover">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="d-flex align-items-center mb-1">
                                        <Badge
                                            bg={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}
                                            className="me-2"
                                        >
                                            {rec.type.toUpperCase()}
                                        </Badge>
                                        <h6 className="mb-0 fw-bold">{rec.title}</h6>
                                    </div>
                                    <p className="text-muted small mb-2">{rec.reason}</p>
                                    <Button variant="outline-primary" size="sm" className="rounded-pill">
                                        {rec.action} <FaArrowRight className="ms-1" size={10} />
                                    </Button>
                                </div>
                                <Button
                                    variant="link"
                                    className="text-muted p-0 ms-2"
                                    onClick={() => handleDismiss(rec.id)}
                                >
                                    <FaTimes />
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
}

export default PersonalizedRecommendations;
