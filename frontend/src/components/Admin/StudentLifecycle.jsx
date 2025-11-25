import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert
} from 'react-bootstrap';
import {
  FaPlus, FaHistory, FaGraduationCap, FaExchangeAlt, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import studentInformationService from '../../services/studentInformationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function StudentLifecycle({ studentId, student }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    event_type: 'ENROLLMENT',
    event_date: new Date().toISOString().split('T')[0],
    academic_year: new Date().getFullYear().toString(),
    term: null,
    status: 'ACTIVE',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (studentId) {
      loadEvents();
    }
  }, [studentId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await studentInformationService.getStudentLifecycle(studentId);
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading lifecycle events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentInformationService.createLifecycleEvent({
        ...formData,
        student_id: studentId,
        created_by: user?.user_id
      });
      await loadEvents();
      setShowModal(false);
      setFormData({
        event_type: 'ENROLLMENT',
        event_date: new Date().toISOString().split('T')[0],
        academic_year: new Date().getFullYear().toString(),
        term: null,
        status: 'ACTIVE',
        reason: '',
        notes: ''
      });
      alert('Lifecycle event created successfully!');
    } catch (error) {
      console.error('Error creating lifecycle event:', error);
      alert('Failed to create lifecycle event. Some tables may not exist yet.');
    }
  };

  const getEventIcon = (type) => {
    const icons = {
      'ENROLLMENT': <FaHistory />,
      'GRADUATION': <FaGraduationCap />,
      'TRANSFER_IN': <FaExchangeAlt />,
      'TRANSFER_OUT': <FaExchangeAlt />,
      'PROMOTION': <FaArrowUp />,
      'RETENTION': <FaArrowDown />
    };
    return icons[type] || <FaHistory />;
  };

  const getEventBadge = (type) => {
    const badges = {
      'ENROLLMENT': 'primary',
      'GRADUATION': 'success',
      'TRANSFER_IN': 'info',
      'TRANSFER_OUT': 'warning',
      'PROMOTION': 'success',
      'RETENTION': 'danger'
    };
    return badges[type] || 'secondary';
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Student Lifecycle Timeline</h5>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <FaPlus className="me-1" />
            Add Event
          </Button>
        </Card.Header>
        <Card.Body>
          {events.length === 0 ? (
            <Alert variant="info">No lifecycle events recorded yet.</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event Type</th>
                  <th>Academic Year</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.event_id}>
                    <td>{new Date(event.event_date).toLocaleDateString()}</td>
                    <td>
                      <Badge bg={getEventBadge(event.event_type)}>
                        {getEventIcon(event.event_type)} {event.event_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>{event.academic_year || '-'}</td>
                    <td>
                      {event.from_school_name || event.from_class_name || event.from_grade || '-'}
                    </td>
                    <td>
                      {event.to_school_name || event.to_class_name || event.to_grade || '-'}
                    </td>
                    <td>{event.status || '-'}</td>
                    <td>
                      <small>{event.notes || '-'}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Event Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Lifecycle Event</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Event Type *</Form.Label>
              <Form.Select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                required
              >
                <option value="ENROLLMENT">Enrollment</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
                <option value="PROMOTION">Promotion</option>
                <option value="RETENTION">Retention</option>
                <option value="GRADUATION">Graduation</option>
                <option value="DROPPED_OUT">Dropped Out</option>
                <option value="RETURN">Return</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Event Date *</Form.Label>
              <Form.Control
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Academic Year</Form.Label>
              <Form.Control
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="TRANSFERRED">Transferred</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Event
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default StudentLifecycle;

