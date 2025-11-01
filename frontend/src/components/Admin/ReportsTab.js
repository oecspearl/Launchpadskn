import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Table } from 'react-bootstrap';
import { FaChartLine, FaUsers, FaBook, FaDownload, FaServer, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import analyticsService from '../../services/analyticsService';
import Breadcrumb from '../common/Breadcrumb';

function ReportsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    userTrends: {},
    usersByRole: {},
    courseTrends: {},
    enrollmentTrends: {},
    systemHealth: {}
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/admin/dashboard', type: 'dashboard' },
    { label: 'Reports & Analytics', type: 'reports' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Use mock data for now since analytics endpoints don't exist
      const mockAnalytics = {
        userTrends: {
          totalUsers: 150,
          activeUsers: 120,
          recentUsers: 25,
          monthlyRegistrations: {
            '2024-01': 15,
            '2024-02': 20,
            '2024-03': 18
          }
        },
        usersByRole: {
          'ADMIN': 5,
          'INSTRUCTOR': 25,
          'STUDENT': 120
        },
        courseTrends: {
          totalCourses: 45,
          activeCourses: 38,
          recentCourses: 8,
          monthlyCourses: {
            '2024-01': 5,
            '2024-02': 3,
            '2024-03': 7
          }
        },
        enrollmentTrends: {
          pendingEnrollments: 12
        },
        systemHealth: {
          userService: 'UP',
          institutionService: 'UP',
          courseService: 'UP',
          timestamp: new Date().toISOString()
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      setError('Failed to fetch analytics data');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    try {
      const data = await analyticsService.exportData(type, format);
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError('Failed to export data');
    }
  };

  const getServiceStatus = (status) => {
    return status === 'UP' ? (
      <Badge bg="success"><FaCheckCircle className="me-1" />UP</Badge>
    ) : (
      <Badge bg="danger"><FaExclamationTriangle className="me-1" />DOWN</Badge>
    );
  };

  const renderMetricCard = (title, value, icon, color = 'primary') => (
    <Card className="h-100">
      <Card.Body className="d-flex align-items-center">
        <div className={`icon-bg bg-${color}-light rounded p-3 me-3`}>
          {React.cloneElement(icon, { className: `text-${color}`, size: 24 })}
        </div>
        <div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h3 className="mb-0">{value}</h3>
        </div>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Breadcrumb items={breadcrumbItems} />
      
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaChartLine className="me-2 text-primary" />
                Reports & Analytics
              </h2>
              <p className="text-muted">System performance metrics and data insights</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => handleExport('users', 'json')}>
                <FaDownload className="me-1" />
                Export Users
              </Button>
              <Button variant="outline-success" onClick={() => handleExport('courses', 'json')}>
                <FaDownload className="me-1" />
                Export Courses
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          {renderMetricCard(
            'Total Users', 
            analytics.userTrends.totalUsers || 0, 
            <FaUsers />, 
            'primary'
          )}
        </Col>
        <Col md={3}>
          {renderMetricCard(
            'Active Users', 
            analytics.userTrends.activeUsers || 0, 
            <FaUsers />, 
            'success'
          )}
        </Col>
        <Col md={3}>
          {renderMetricCard(
            'Total Courses', 
            analytics.courseTrends.totalCourses || 0, 
            <FaBook />, 
            'info'
          )}
        </Col>
        <Col md={3}>
          {renderMetricCard(
            'Active Courses', 
            analytics.courseTrends.activeCourses || 0, 
            <FaBook />, 
            'warning'
          )}
        </Col>
      </Row>

      {/* User Role Distribution */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">User Distribution by Role</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.usersByRole).map(([role, count]) => {
                    const total = Object.values(analytics.usersByRole).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={role}>
                        <td>
                          <Badge bg={role === 'ADMIN' ? 'danger' : role === 'INSTRUCTOR' ? 'warning' : 'info'}>
                            {role}
                          </Badge>
                        </td>
                        <td>{count}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Activity (Last 30 Days)</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <div className="text-center">
                    <h4 className="text-primary">{analytics.userTrends.recentUsers || 0}</h4>
                    <small className="text-muted">New Users</small>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <h4 className="text-success">{analytics.courseTrends.recentCourses || 0}</h4>
                    <small className="text-muted">New Courses</small>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <h4 className="text-info">{analytics.enrollmentTrends.pendingEnrollments || 0}</h4>
                    <small className="text-muted">Pending Enrollments</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaServer className="me-2" />
                System Health Status
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h6>User Service</h6>
                    {getServiceStatus(analytics.systemHealth.userService)}
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6>Institution Service</h6>
                    {getServiceStatus(analytics.systemHealth.institutionService)}
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6>Course Service</h6>
                    {getServiceStatus(analytics.systemHealth.courseService)}
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6>Last Updated</h6>
                    <small className="text-muted">
                      {analytics.systemHealth.timestamp ? 
                        new Date(analytics.systemHealth.timestamp).toLocaleString() : 
                        'N/A'
                      }
                    </small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends */}
      <Row className="g-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Monthly User Registrations</h5>
            </Card.Header>
            <Card.Body>
              {analytics.userTrends.monthlyRegistrations && 
               Object.keys(analytics.userTrends.monthlyRegistrations).length > 0 ? (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Registrations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analytics.userTrends.monthlyRegistrations)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, count]) => (
                        <tr key={month}>
                          <td>{month}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No registration data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Monthly Course Creation</h5>
            </Card.Header>
            <Card.Body>
              {analytics.courseTrends.monthlyCourses && 
               Object.keys(analytics.courseTrends.monthlyCourses).length > 0 ? (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Courses Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analytics.courseTrends.monthlyCourses)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, count]) => (
                        <tr key={month}>
                          <td>{month}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No course creation data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ReportsTab;