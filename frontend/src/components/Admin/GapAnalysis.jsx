import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Badge, Spinner, Alert, Button,
  Form, Modal
} from 'react-bootstrap';
import {
  FaExclamationTriangle, FaCheckCircle, FaTimes, FaLightbulb,
  FaFilter, FaSync
} from 'react-icons/fa';
import curriculumAnalyticsService from '../../services/curriculumAnalyticsService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';

function GapAnalysis({ classSubjectId }) {
  const { user } = useAuth();
  const [gaps, setGaps] = useState([]);
  const [filteredGaps, setFilteredGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [identifying, setIdentifying] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterResolved, setFilterResolved] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedGap, setSelectedGap] = useState(null);

  useEffect(() => {
    if (classSubjectId) {
      loadGaps();
    }
  }, [classSubjectId]);

  useEffect(() => {
    filterGaps();
  }, [gaps, filterSeverity, filterResolved]);

  const loadGaps = async () => {
    setLoading(true);
    try {
      const data = await curriculumAnalyticsService.getGapAnalysis(
        classSubjectId,
        filterResolved
      );
      setGaps(data || []);
    } catch (error) {
      console.error('Error loading gaps:', error);
      setGaps([]);
    } finally {
      setLoading(false);
    }
  };

  const filterGaps = () => {
    let filtered = [...gaps];

    if (filterSeverity !== 'ALL') {
      filtered = filtered.filter(gap => gap.severity === filterSeverity);
    }

    if (!filterResolved) {
      filtered = filtered.filter(gap => !gap.resolved);
    }

    setFilteredGaps(filtered);
  };

  const handleIdentifyGaps = async () => {
    setIdentifying(true);
    try {
      const count = await curriculumAnalyticsService.identifyGaps(classSubjectId);
      await loadGaps();
      alert(`Identified ${count} new gaps.`);
    } catch (error) {
      console.error('Error identifying gaps:', error);
      alert('Failed to identify gaps. Some tables may not exist yet.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleResolveGap = async (gapId) => {
    try {
      const { error } = await supabase
        .from('curriculum_gaps')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.user_id
        })
        .eq('gap_id', gapId);

      if (error) throw error;
      await loadGaps();
      setShowResolveModal(false);
      setSelectedGap(null);
    } catch (error) {
      console.error('Error resolving gap:', error);
      alert('Failed to resolve gap');
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      'CRITICAL': { bg: 'danger', icon: <FaExclamationTriangle /> },
      'HIGH': { bg: 'warning', icon: <FaExclamationTriangle /> },
      'MEDIUM': { bg: 'info', icon: <FaLightbulb /> },
      'LOW': { bg: 'secondary', icon: <FaLightbulb /> }
    };
    const badge = badges[severity] || badges['MEDIUM'];
    return (
      <Badge bg={badge.bg}>
        {badge.icon} {severity}
      </Badge>
    );
  };

  const getGapTypeBadge = (gapType) => {
    const badges = {
      'NOT_COVERED': { bg: 'danger', text: 'Not Covered' },
      'PARTIALLY_COVERED': { bg: 'warning', text: 'Partial' },
      'NO_ASSESSMENT': { bg: 'info', text: 'No Assessment' },
      'LOW_ACHIEVEMENT': { bg: 'warning', text: 'Low Achievement' }
    };
    const badge = badges[gapType] || { bg: 'secondary', text: gapType };
    return <Badge bg={badge.bg}>{badge.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading gap analysis...</p>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <Row>
            <Col md={6}>
              <div className="d-flex gap-2">
                <Form.Select
                  style={{ width: 'auto' }}
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </Form.Select>
                <Form.Check
                  type="checkbox"
                  label="Show Resolved"
                  checked={filterResolved}
                  onChange={(e) => setFilterResolved(e.target.checked)}
                  className="ms-2"
                />
              </div>
            </Col>
            <Col md={6} className="text-end">
              <Button
                variant="primary"
                onClick={handleIdentifyGaps}
                disabled={identifying}
              >
                {identifying ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Identifying...
                  </>
                ) : (
                  <>
                    <FaSync className="me-2" />
                    Identify Gaps
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Header>
      </Card>

      {/* Summary */}
      {filteredGaps.length > 0 && (
        <Row className="mb-3">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Total Gaps</h5>
                <h3>{filteredGaps.length}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Critical</h5>
                <h3 className="text-danger">
                  {filteredGaps.filter(g => g.severity === 'CRITICAL').length}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>High Priority</h5>
                <h3 className="text-warning">
                  {filteredGaps.filter(g => g.severity === 'HIGH').length}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5>Resolved</h5>
                <h3 className="text-success">
                  {gaps.filter(g => g.resolved).length}
                </h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Gaps Table */}
      {filteredGaps.length === 0 ? (
        <Alert variant="success">
          <FaCheckCircle className="me-2" />
          No gaps identified! All curriculum areas are covered.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Identified Curriculum Gaps</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Topic</th>
                  <th>Unit</th>
                  <th>SCO</th>
                  <th>Description</th>
                  <th>Recommended Action</th>
                  <th>Identified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGaps.map((gap) => (
                  <tr key={gap.gap_id}>
                    <td>{getSeverityBadge(gap.severity)}</td>
                    <td>{getGapTypeBadge(gap.gap_type)}</td>
                    <td>{gap.topic_number}</td>
                    <td>{gap.unit_number}</td>
                    <td>
                      <Badge bg="info">{gap.sco_number}</Badge>
                    </td>
                    <td>
                      <small>{gap.description || 'No description'}</small>
                    </td>
                    <td>
                      <small>{gap.recommended_action || 'No recommendation'}</small>
                    </td>
                    <td>
                      <small>
                        {new Date(gap.identified_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {!gap.resolved && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setSelectedGap(gap);
                            setShowResolveModal(true);
                          }}
                        >
                          <FaCheckCircle className="me-1" />
                          Resolve
                        </Button>
                      )}
                      {gap.resolved && (
                        <Badge bg="success">Resolved</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Resolve Gap Modal */}
      <Modal show={showResolveModal} onHide={() => {
        setShowResolveModal(false);
        setSelectedGap(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Gap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGap && (
            <div>
              <p><strong>Gap Type:</strong> {getGapTypeBadge(selectedGap.gap_type)}</p>
              <p><strong>Description:</strong> {selectedGap.description}</p>
              <p><strong>Recommended Action:</strong> {selectedGap.recommended_action}</p>
              <p className="text-muted">
                Marking this gap as resolved will record the resolution timestamp.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowResolveModal(false);
            setSelectedGap(null);
          }}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => handleResolveGap(selectedGap?.gap_id)}>
            <FaCheckCircle className="me-1" />
            Mark as Resolved
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default GapAnalysis;

