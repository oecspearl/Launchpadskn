import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert, Tabs, Tab
} from 'react-bootstrap';
import {
  FaPlus, FaWheelchair, FaFileAlt, FaCheckCircle
} from 'react-icons/fa';
import studentInformationService from '../../services/studentInformationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function SpecialNeedsTracking({ studentId, student }) {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNeedModal, setShowNeedModal] = useState(false);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [formData, setFormData] = useState({
    need_type: 'LEARNING_DISABILITY',
    category: '',
    description: '',
    diagnosis_date: '',
    has_iep: false,
    is_active: true
  });

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [needsData, accommodationsData] = await Promise.all([
        studentInformationService.getStudentSpecialNeeds(studentId, false),
        studentInformationService.getStudentAccommodations(studentId, false)
      ]);
      setNeeds(needsData || []);
      setAccommodations(accommodationsData || []);
    } catch (error) {
      console.error('Error loading special needs data:', error);
      setNeeds([]);
      setAccommodations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNeed = async (e) => {
    e.preventDefault();
    try {
      await studentInformationService.createSpecialNeed({
        ...formData,
        student_id: studentId,
        created_by: user?.user_id
      });
      await loadData();
      setShowNeedModal(false);
      alert('Special need recorded successfully!');
    } catch (error) {
      console.error('Error creating special need:', error);
      alert('Failed to create special need. Some tables may not exist yet.');
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Tabs defaultActiveKey="needs" className="mb-3">
        <Tab eventKey="needs" title={
          <>
            <FaWheelchair className="me-1" />
            Special Needs & IEPs
          </>
        }>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Special Needs</h5>
              <Button variant="primary" size="sm" onClick={() => setShowNeedModal(true)}>
                <FaPlus className="me-1" />
                Add Need
              </Button>
            </Card.Header>
            <Card.Body>
              {needs.length === 0 ? (
                <Alert variant="info">No special needs recorded.</Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Category</th>
                      <th>IEP</th>
                      <th>Status</th>
                      <th>Diagnosis Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needs.map((need) => (
                      <tr key={need.need_id}>
                        <td>{need.need_type}</td>
                        <td>{need.category || '-'}</td>
                        <td>
                          {need.has_iep ? (
                            <Badge bg="success"><FaCheckCircle /> Yes</Badge>
                          ) : (
                            <Badge bg="secondary">No</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={need.is_active ? 'success' : 'secondary'}>
                            {need.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {need.diagnosis_date 
                            ? new Date(need.diagnosis_date).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="accommodations" title={
          <>
            <FaFileAlt className="me-1" />
            Accommodations
          </>
        }>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Accommodations</h5>
              <Button variant="primary" size="sm" onClick={() => setShowAccommodationModal(true)}>
                <FaPlus className="me-1" />
                Add Accommodation
              </Button>
            </Card.Header>
            <Card.Body>
              {accommodations.length === 0 ? (
                <Alert variant="info">No accommodations recorded.</Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Frequency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accommodations.map((acc) => (
                      <tr key={acc.accommodation_id}>
                        <td>{acc.accommodation_type}</td>
                        <td>{acc.title}</td>
                        <td>{acc.frequency || '-'}</td>
                        <td>
                          <Badge bg={acc.is_active ? 'success' : 'secondary'}>
                            {acc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Need Modal */}
      <Modal show={showNeedModal} onHide={() => setShowNeedModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Special Need</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitNeed}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Need Type *</Form.Label>
              <Form.Select
                value={formData.need_type}
                onChange={(e) => setFormData({ ...formData, need_type: e.target.value })}
                required
              >
                <option value="LEARNING_DISABILITY">Learning Disability</option>
                <option value="PHYSICAL_DISABILITY">Physical Disability</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="MEDICAL">Medical</option>
                <option value="GIFTED">Gifted</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Diagnosis Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.diagnosis_date}
                onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Has IEP"
                checked={formData.has_iep}
                onChange={(e) => setFormData({ ...formData, has_iep: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNeedModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Need
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default SpecialNeedsTracking;

