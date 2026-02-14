import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, Form, ListGroup, Badge, Modal } from 'react-bootstrap';
import { FaBullseye, FaPlus, FaCheckCircle, FaTrash, FaClock } from 'react-icons/fa';
import { studentGoalService } from '../../services/studentGoalService';

function GoalSetting() {
    const [goals, setGoals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', type: 'daily', target: 1, deadline: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        setLoading(true);
        try {
            const data = await studentGoalService.getGoals();
            setGoals(data);
        } catch (error) {
            console.error("Failed to load goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async () => {
        if (!newGoal.title) return;

        try {
            const addedGoal = await studentGoalService.addGoal(newGoal);
            setGoals([...goals, addedGoal]);
            setShowModal(false);
            setNewGoal({ title: '', type: 'daily', target: 1, deadline: '' });
        } catch (error) {
            console.error("Failed to add goal", error);
        }
    };

    const toggleGoalCompletion = async (id) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const updatedGoal = { ...goal, completed: !goal.completed, progress: !goal.completed ? goal.target : 0 };

        try {
            await studentGoalService.updateGoal(id, updatedGoal);
            setGoals(goals.map(g => g.id === id ? updatedGoal : g));
        } catch (error) {
            console.error("Failed to update goal", error);
        }
    };

    const deleteGoal = async (id) => {
        try {
            await studentGoalService.deleteGoal(id);
            setGoals(goals.filter(g => g.id !== id));
        } catch (error) {
            console.error("Failed to delete goal", error);
        }
    };

    if (loading) return <div>Loading Goals...</div>;

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-primary">
                    <FaBullseye className="me-2" /> My Goals
                </h5>
                <Button variant="outline-primary" size="sm" onClick={() => setShowModal(true)}>
                    <FaPlus className="me-1" /> New Goal
                </Button>
            </Card.Header>
            <Card.Body>
                <ListGroup variant="flush">
                    {goals.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <p>No goals set yet. Start by setting a new learning goal!</p>
                        </div>
                    ) : (
                        goals.map(goal => (
                            <ListGroup.Item key={goal.id} className="border-0 px-0 py-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center">
                                        <Form.Check
                                            type="checkbox"
                                            checked={goal.completed}
                                            onChange={() => toggleGoalCompletion(goal.id)}
                                            className="me-3 fs-5"
                                        />
                                        <div>
                                            <h6 className={`mb-0 fw-bold ${goal.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                                                {goal.title}
                                            </h6>
                                            <small className="text-muted">
                                                <Badge bg={goal.type === 'daily' ? 'info' : 'warning'} className="me-2">
                                                    {goal.type}
                                                </Badge>
                                                {goal.deadline && (
                                                    <span><FaClock className="me-1" /> Due: {goal.deadline}</span>
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                    <Button variant="link" className="text-danger p-0" onClick={() => deleteGoal(goal.id)}>
                                        <FaTrash />
                                    </Button>
                                </div>
                                <ProgressBar
                                    now={(goal.progress / goal.target) * 100}
                                    variant={goal.completed ? "success" : "primary"}
                                    style={{ height: '6px' }}
                                />
                            </ListGroup.Item>
                        ))
                    )}
                </ListGroup>
            </Card.Body>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Set New Goal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Goal Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., Read 2 chapters"
                                value={newGoal.title}
                                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                value={newGoal.type}
                                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="term">Term</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Target Value</Form.Label>
                            <Form.Control
                                type="number"
                                value={newGoal.target}
                                onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Deadline (Optional)</Form.Label>
                            <Form.Control
                                type="date"
                                value={newGoal.deadline}
                                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAddGoal}>Set Goal</Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}

export default GoalSetting;
