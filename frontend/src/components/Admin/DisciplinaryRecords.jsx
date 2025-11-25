import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert, Row, Col
} from 'react-bootstrap';
import {
  FaPlus, FaExclamationTriangle, FaCheckCircle, FaClock
} from 'react-icons/fa';
import studentInformationService from '../../services/studentInformationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function DisciplinaryRecords({ studentId, student }) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    incident_date: new Date().toISOString().split('T')[0],
    incident_type: 'MINOR_INFRACTION',
    severity: 'MINOR',
    description: '',
    action_taken: 'VERBAL_WARNING',
    location: ''
  });

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incidentsData, summaryData] = await Promise.all([
        studentInformationService.getStudentDisciplinaryRecords(studentId),
        studentInformationService.getDisciplinarySummary(studentId)
      ]);
      setIncidents(incidentsData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading disciplinary data:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentInformationService.createDisciplinaryIncident({
        ...formData,
        student_id: studentId,
        academic_year: new Date().getFullYear().toString(),
        reported_by: user?.user_id,
        created_by: user?.user_id
      });
      await loadData();
      setShowModal(false);
      alert('Disciplinary incident recorded successfully!');
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Failed to create incident. Some tables may not exist yet.');
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      'MINOR': 'secondary',
      'MODERATE': 'warning',
      'MAJOR': 'danger',
      'SEVERE': 'danger'
    };
    return badges[severity] || 'secondary';
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <Row className="mb-3">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Total Incidents</h5>
                <h3>{summary.total_incidents || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Resolved</h5>
                <h3 className="text-success">{summary.resolved_incidents || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Suspensions</h5>
                <h3 className="text-warning">{summary.total_suspensions || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Last Incident</h5>
                <h6>
                  {summary.last_incident_date 
                    ? new Date(summary.last_incident_date).toLocaleDateString()
                    : 'None'}
                </h6>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Disciplinary Incidents</h5>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <FaPlus className="me-1" />
            Record Incident
          </Button>
        </Card.Header>
        <Card.Body>
          {incidents.length === 0 ? (
            <Alert variant="success">
              <FaCheckCircle className="me-2" />
              No disciplinary incidents recorded.
            </Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Action Taken</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.incident_id}>
                    <td>{new Date(incident.incident_date).toLocaleDateString()}</td>
                    <td>
                      <Badge bg="info">{incident.incident_type.replace('_', ' ')}</Badge>
                    </td>
                    <td>
                      <Badge bg={getSeverityBadge(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </td>
                    <td>
                      <small>{incident.description?.substring(0, 50)}...</small>
                    </td>
                    <td>{incident.action_taken || '-'}</td>
                    <td>
                      {incident.resolved ? (
                        <Badge bg="success"><FaCheckCircle /> Resolved</Badge>
                      ) : (
                        <Badge bg="warning"><FaClock /> Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Incident Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Record Disciplinary Incident</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Incident Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Incident Type *</Form.Label>
                  <Form.Select
                    value={formData.incident_type}
                    onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                    required
                  >
                    <option value="MINOR_INFRACTION">Minor Infraction</option>
                    <option value="MAJOR_INFRACTION">Major Infraction</option>
                    <option value="VIOLENCE">Violence</option>
                    <option value="DRUGS">Drugs</option>
                    <option value="THEFT">Theft</option>
                    <option value="VANDALISM">Vandalism</option>
                    <option value="DISRESPECT">Disrespect</option>
                    <option value="TRUANCY">Truancy</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Severity *</Form.Label>
                  <Form.Select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    required
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="MAJOR">Major</option>
                    <option value="SEVERE">Severe</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Action Taken</Form.Label>
                  <Form.Select
                    value={formData.action_taken}
                    onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                  >
                    <option value="VERBAL_WARNING">Verbal Warning</option>
                    <option value="WRITTEN_WARNING">Written Warning</option>
                    <option value="DETENTION">Detention</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="PARENT_MEETING">Parent Meeting</option>
                    <option value="COUNSELING">Counseling</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Record Incident
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default DisciplinaryRecords;

