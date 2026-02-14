import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, ProgressBar, Badge, Spinner, Alert,
  Form, InputGroup
} from 'react-bootstrap';
import {
  FaSearch, FaCheckCircle, FaClock, FaTimes, FaChartBar
} from 'react-icons/fa';
import curriculumAnalyticsService from '../../services/curriculumAnalyticsService';

function CoverageTracking({ classSubjectId, coverageSummary }) {
  const [coverage, setCoverage] = useState([]);
  const [filteredCoverage, setFilteredCoverage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (classSubjectId) {
      loadCoverage();
    }
  }, [classSubjectId]);

  useEffect(() => {
    filterCoverage();
  }, [coverage, searchTerm, filterStatus]);

  const loadCoverage = async () => {
    setLoading(true);
    try {
      const data = await curriculumAnalyticsService.getCurriculumCoverage(classSubjectId);
      setCoverage(data || []);
    } catch (error) {
      console.error('Error loading coverage:', error);
      setCoverage([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCoverage = () => {
    let filtered = [...coverage];

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.topic_title?.toLowerCase().includes(term) ||
        item.sco_title?.toLowerCase().includes(term) ||
        item.sco_number?.toLowerCase().includes(term)
      );
    }

    setFilteredCoverage(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'COMPLETED': { bg: 'success', icon: <FaCheckCircle /> },
      'IN_PROGRESS': { bg: 'warning', icon: <FaClock /> },
      'NOT_STARTED': { bg: 'secondary', icon: <FaTimes /> },
      'SKIPPED': { bg: 'danger', icon: <FaTimes /> }
    };
    const badge = badges[status] || badges['NOT_STARTED'];
    return (
      <Badge bg={badge.bg}>
        {badge.icon} {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getProgressVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  // Group by topic
  const groupedByTopic = filteredCoverage.reduce((acc, item) => {
    const key = item.topic_number || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        topic_number: item.topic_number,
        topic_title: item.topic_title,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading coverage data...</p>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search topics, units, or SCOs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="SKIPPED">Skipped</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-end">
                <Badge bg="info">
                  {filteredCoverage.length} items
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Header>
      </Card>

      {filteredCoverage.length === 0 ? (
        <Alert variant="info">
          No coverage data available. Click "Refresh Data" to generate coverage from lessons.
        </Alert>
      ) : (
        <div className="coverage-tracking">
          {Object.values(groupedByTopic).map((topic) => {
            const topicCoverage = topic.items.reduce((sum, item) => 
              sum + (parseFloat(item.coverage_percentage) || 0), 0) / topic.items.length;
            
            return (
              <Card key={topic.topic_number} className="mb-3">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">
                        Topic {topic.topic_number}: {topic.topic_title || 'Untitled Topic'}
                      </h5>
                      <small className="text-muted">
                        {topic.items.length} SCOs
                      </small>
                    </div>
                    <div>
                      <ProgressBar
                        now={topicCoverage}
                        variant={getProgressVariant(topicCoverage)}
                        style={{ width: '200px', height: '20px' }}
                        label={`${topicCoverage.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>SCO</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Coverage</th>
                        <th>Lessons</th>
                        <th>First Taught</th>
                        <th>Last Taught</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.unit_number}</td>
                          <td>
                            <Badge bg="info">{item.sco_number}</Badge>
                          </td>
                          <td>
                            <small>{item.sco_title || 'No title'}</small>
                          </td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <ProgressBar
                                now={item.coverage_percentage || 0}
                                variant={getProgressVariant(item.coverage_percentage || 0)}
                                style={{ width: '100px', height: '20px' }}
                              />
                              <small>{item.coverage_percentage?.toFixed(0) || 0}%</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg="secondary">{item.lessons_count || 0}</Badge>
                          </td>
                          <td>
                            <small>
                              {item.first_taught_date 
                                ? new Date(item.first_taught_date).toLocaleDateString()
                                : '-'}
                            </small>
                          </td>
                          <td>
                            <small>
                              {item.last_taught_date 
                                ? new Date(item.last_taught_date).toLocaleDateString()
                                : '-'}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CoverageTracking;

