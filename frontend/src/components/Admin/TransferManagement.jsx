import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert
} from 'react-bootstrap';
import {
  FaPlus, FaExchangeAlt, FaCheck, FaTimes, FaClock
} from 'react-icons/fa';
import studentInformationService from '../../services/studentInformationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function TransferManagement({ studentId, student }) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    transfer_type: 'OUTGOING',
    transfer_date: new Date().toISOString().split('T')[0],
    academic_year: new Date().getFullYear().toString(),
    reason: '',
    transfer_status: 'PENDING'
  });

  useEffect(() => {
    if (studentId) {
      loadTransfers();
    }
  }, [studentId]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const data = await studentInformationService.getStudentTransfers(studentId);
      setTransfers(data || []);
    } catch (error) {
      console.error('Error loading transfers:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentInformationService.createTransfer({
        ...formData,
        student_id: studentId,
        requested_by: user?.user_id
      });
      await loadTransfers();
      setShowModal(false);
      alert('Transfer request created successfully!');
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Failed to create transfer. Some tables may not exist yet.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': { bg: 'warning', icon: <FaClock /> },
      'APPROVED': { bg: 'success', icon: <FaCheck /> },
      'REJECTED': { bg: 'danger', icon: <FaTimes /> },
      'COMPLETED': { bg: 'info', icon: <FaCheck /> }
    };
    const badge = badges[status] || badges['PENDING'];
    return <Badge bg={badge.bg}>{badge.icon} {status}</Badge>;
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Transfer Management</h5>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <FaPlus className="me-1" />
            New Transfer
          </Button>
        </Card.Header>
        <Card.Body>
          {transfers.length === 0 ? (
            <Alert variant="info">No transfer records found.</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.transfer_id}>
                    <td>{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                    <td>
                      <Badge bg="info">{transfer.transfer_type}</Badge>
                    </td>
                    <td>{transfer.from_school_name || transfer.from_class_name || '-'}</td>
                    <td>{transfer.to_school_name || transfer.to_class_name || '-'}</td>
                    <td>{getStatusBadge(transfer.transfer_status)}</td>
                    <td>
                      <small>{transfer.reason || '-'}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Transfer Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Transfer Type *</Form.Label>
              <Form.Select
                value={formData.transfer_type}
                onChange={(e) => setFormData({ ...formData, transfer_type: e.target.value })}
                required
              >
                <option value="INCOMING">Incoming</option>
                <option value="OUTGOING">Outgoing</option>
                <option value="INTERNAL">Internal</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Transfer Date *</Form.Label>
              <Form.Control
                type="date"
                value={formData.transfer_date}
                onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
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
              <Form.Label>Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Transfer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default TransferManagement;

