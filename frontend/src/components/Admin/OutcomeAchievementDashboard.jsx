import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Badge, Spinner, Alert, ProgressBar,
  Form, InputGroup
} from 'react-bootstrap';
import {
  FaCheckCircle, FaChartBar, FaSearch, FaUserGraduate
} from 'react-icons/fa';
import curriculumAnalyticsService from '../../services/curriculumAnalyticsService';

function OutcomeAchievementDashboard({ classSubjectId }) {
  const [achievementData, setAchievementData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (classSubjectId) {
      loadAchievementData();
    }
  }, [classSubjectId]);

  useEffect(() => {
    filterData();
  }, [achievementData, searchTerm]);

  const loadAchievementData = async () => {
    setLoading(true);
    try {
      const data = await curriculumAnalyticsService.getOutcomeAchievementSummary(classSubjectId);
      setAchievementData(data || []);
      
      // Calculate summary
      if (data && data.length > 0) {
        const totalSCOs = data.length;
        const avgAchievement = data.reduce((sum, item) => 
          sum + (parseFloat(item.average_achievement_percentage) || 0), 0) / totalSCOs;
        const totalAchieved = data.reduce((sum, item) => sum + (item.achieved_count || 0), 0);
        const totalStudents = data.length > 0 ? data[0].total_students : 0;
        
        setSummary({
          totalSCOs,
          avgAchievement,
          totalAchieved,
          totalStudents,
          achievementRate: totalStudents > 0 ? (totalAchieved / (totalSCOs * totalStudents) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error loading achievement data:', error);
      setAchievementData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...achievementData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.sco_number?.toLowerCase().includes(term) ||
        item.topic_number?.toString().includes(term) ||
        item.unit_number?.toString().includes(term)
      );
    }

    setFilteredData(filtered);
  };

  const getAchievementBadge = (rate) => {
    if (rate >= 80) return { bg: 'success', text: 'Excellent' };
    if (rate >= 60) return { bg: 'info', text: 'Good' };
    if (rate >= 40) return { bg: 'warning', text: 'Fair' };
    return { bg: 'danger', text: 'Needs Improvement' };
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading achievement data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <FaChartBar className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                <h5>Average Achievement</h5>
                <h3>{summary.avgAchievement.toFixed(1)}%</h3>
                <ProgressBar
                  now={summary.avgAchievement}
                  variant={getAchievementBadge(summary.avgAchievement).bg}
                  className="mt-2"
                />
                <small className="text-muted">{summary.totalSCOs} SCOs tracked</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <FaCheckCircle className="text-success mb-2" style={{ fontSize: '2rem' }} />
                <h5>Achievement Rate</h5>
                <h3>{summary.achievementRate.toFixed(1)}%</h3>
                <ProgressBar
                  now={summary.achievementRate}
                  variant={getAchievementBadge(summary.achievementRate).bg}
                  className="mt-2"
                />
                <small className="text-muted">
                  {summary.totalAchieved} achievements across {summary.totalSCOs} SCOs
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <FaUserGraduate className="text-info mb-2" style={{ fontSize: '2rem' }} />
                <h5>Students Tracked</h5>
                <h3>{summary.totalStudents}</h3>
                <Badge bg={getAchievementBadge(summary.avgAchievement).bg} className="mt-2">
                  {getAchievementBadge(summary.avgAchievement).text}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Search */}
      <Card className="mb-3">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by SCO number, topic, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Achievement Table */}
      {filteredData.length === 0 ? (
        <Alert variant="info">
          No achievement data available. Achievement tracking requires student assessments linked to SCOs.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>SCO Achievement Summary</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Unit</th>
                  <th>SCO</th>
                  <th>Total Students</th>
                  <th>Achieved</th>
                  <th>Developing</th>
                  <th>Not Assessed</th>
                  <th>Avg Achievement</th>
                  <th>Achievement Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const badge = getAchievementBadge(item.achievement_rate || 0);
                  
                  return (
                    <tr key={idx}>
                      <td>{item.topic_number}</td>
                      <td>{item.unit_number}</td>
                      <td>
                        <Badge bg="info">{item.sco_number}</Badge>
                      </td>
                      <td>{item.total_students || 0}</td>
                      <td>
                        <Badge bg="success">{item.achieved_count || 0}</Badge>
                      </td>
                      <td>
                        <Badge bg="warning">{item.developing_count || 0}</Badge>
                      </td>
                      <td>
                        <Badge bg="secondary">{item.not_assessed_count || 0}</Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={item.average_achievement_percentage || 0}
                            variant={badge.bg}
                            style={{ width: '80px', height: '20px' }}
                          />
                          <small>{(item.average_achievement_percentage || 0).toFixed(1)}%</small>
                        </div>
                      </td>
                      <td>
                        <strong>{(item.achievement_rate || 0).toFixed(1)}%</strong>
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

export default OutcomeAchievementDashboard;

