import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Badge, Spinner, Alert, Form,
  ProgressBar
} from 'react-bootstrap';
import {
  FaClock, FaChartBar, FaArrowUp, FaArrowDown, FaEquals
} from 'react-icons/fa';
import curriculumAnalyticsService from '../../services/curriculumAnalyticsService';

function TimeAllocationAnalysis({ classSubjectId, academicYear, term }) {
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (classSubjectId) {
      loadTimeAllocation();
    }
  }, [classSubjectId, academicYear, term]);

  const loadTimeAllocation = async () => {
    setLoading(true);
    try {
      const data = await curriculumAnalyticsService.getTimeAllocationAnalysis(
        classSubjectId,
        academicYear,
        term
      );
      setTimeData(data || []);
      
      // Calculate summary
      const totalPlanned = data.reduce((sum, item) => 
        sum + (parseFloat(item.planned_hours) || 0), 0);
      const totalActual = data.reduce((sum, item) => 
        sum + (parseFloat(item.actual_hours) || 0), 0);
      const variance = totalActual - totalPlanned;
      const variancePercent = totalPlanned > 0 ? (variance / totalPlanned * 100) : 0;
      
      setSummary({
        totalPlanned,
        totalActual,
        variance,
        variancePercent,
        itemCount: data.length
      });
    } catch (error) {
      console.error('Error loading time allocation:', error);
      setTimeData([]);
    } finally {
      setLoading(false);
    }
  };

  const getVarianceIcon = (variance) => {
    if (variance > 0) return <FaArrowUp className="text-danger" />;
    if (variance < 0) return <FaArrowDown className="text-success" />;
    return <FaEquals className="text-info" />;
  };

  const getVarianceBadge = (variancePercent) => {
    const absPercent = Math.abs(variancePercent);
    if (absPercent < 5) return { bg: 'success', text: 'On Track' };
    if (absPercent < 15) return { bg: 'warning', text: 'Slight Variance' };
    return { bg: 'danger', text: 'Significant Variance' };
  };

  const formatHours = (hours) => {
    if (!hours) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading time allocation data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <FaClock className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                <h5>Planned Time</h5>
                <h3>{formatHours(summary.totalPlanned)}</h3>
                <small className="text-muted">{summary.itemCount} items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <FaChartBar className="text-success mb-2" style={{ fontSize: '2rem' }} />
                <h5>Actual Time</h5>
                <h3>{formatHours(summary.totalActual)}</h3>
                <small className="text-muted">Total spent</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                {getVarianceIcon(summary.variance)}
                <h5>Variance</h5>
                <h3 className={summary.variance >= 0 ? 'text-danger' : 'text-success'}>
                  {summary.variance >= 0 ? '+' : ''}{formatHours(summary.variance)}
                </h3>
                <small className="text-muted">
                  {summary.variancePercent >= 0 ? '+' : ''}{summary.variancePercent.toFixed(1)}%
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <Badge bg={getVarianceBadge(summary.variancePercent).bg} style={{ fontSize: '1.2rem', padding: '0.5rem' }}>
                  {getVarianceBadge(summary.variancePercent).text}
                </Badge>
                <h5 className="mt-2">Status</h5>
                <ProgressBar
                  now={Math.abs(summary.variancePercent)}
                  max={50}
                  variant={getVarianceBadge(summary.variancePercent).bg}
                  className="mt-2"
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Detailed Table */}
      {timeData.length === 0 ? (
        <Alert variant="info">
          No time allocation data available. Time allocation is calculated from completed lessons.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Time Allocation by SCO</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Unit</th>
                  <th>SCO</th>
                  <th>Planned</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>Variance %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {timeData.map((item, idx) => {
                  const variance = (parseFloat(item.actual_hours) || 0) - (parseFloat(item.planned_hours) || 0);
                  const variancePercent = (parseFloat(item.planned_hours) || 0) > 0
                    ? (variance / parseFloat(item.planned_hours) * 100)
                    : 0;
                  const badge = getVarianceBadge(variancePercent);
                  
                  return (
                    <tr key={idx}>
                      <td>{item.topic_number}</td>
                      <td>{item.unit_number}</td>
                      <td>
                        <Badge bg="info">{item.sco_number}</Badge>
                      </td>
                      <td>{formatHours(item.planned_hours)}</td>
                      <td>{formatHours(item.actual_hours)}</td>
                      <td>
                        <span className={variance >= 0 ? 'text-danger' : 'text-success'}>
                          {getVarianceIcon(variance)}
                          {variance >= 0 ? '+' : ''}{formatHours(variance)}
                        </span>
                      </td>
                      <td>
                        <small>
                          {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                        </small>
                      </td>
                      <td>
                        <Badge bg={badge.bg}>{badge.text}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default TimeAllocationAnalysis;

