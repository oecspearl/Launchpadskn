import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Tabs, Tab, Button, Spinner, Alert,
  ProgressBar, Badge, Table, Form
} from 'react-bootstrap';
import {
  FaChartLine, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaSync, FaDownload, FaFilter, FaCalendarAlt
} from 'react-icons/fa';
import curriculumAnalyticsService from '../../services/curriculumAnalyticsService';
import CoverageTracking from './CoverageTracking';
import TimeAllocationAnalysis from './TimeAllocationAnalysis';
import OutcomeAchievementDashboard from './OutcomeAchievementDashboard';
import GapAnalysis from './GapAnalysis';
import './CurriculumAnalytics.css';

function CurriculumAnalytics({ classSubjectId, classSubject }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coverage');
  const [coverageSummary, setCoverageSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState(null);

  useEffect(() => {
    if (classSubjectId) {
      loadAnalytics();
    }
  }, [classSubjectId, academicYear, term]);

  const loadAnalytics = async () => {
    if (!classSubjectId) return;

    setLoading(true);
    try {
      const summary = await curriculumAnalyticsService.getCoverageSummary(classSubjectId);
      setCoverageSummary(summary);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Update coverage from lessons
      await curriculumAnalyticsService.updateCoverageFromLessons(classSubjectId);
      
      // Calculate time allocation
      if (academicYear) {
        await curriculumAnalyticsService.calculateTimeAllocation(classSubjectId, academicYear, term);
      }
      
      // Identify gaps
      await curriculumAnalyticsService.identifyGaps(classSubjectId);
      
      // Reload summary
      await loadAnalytics();
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      alert('Failed to refresh analytics. Some tables may not exist yet.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-3">Loading curriculum analytics...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="curriculum-analytics py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>
                <FaChartLine className="me-2" />
                Curriculum Analytics
              </h3>
              {classSubject && (
                <p className="text-muted mb-0">
                  {classSubject.subject?.subject_name} - {classSubject.class?.class_name}
                </p>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Form.Select
                style={{ width: 'auto' }}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </Form.Select>
              <Form.Select
                style={{ width: 'auto' }}
                value={term || ''}
                onChange={(e) => setTerm(e.target.value || null)}
              >
                <option value="">All Terms</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </Form.Select>
              <Button
                variant="outline-primary"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <FaSync className="me-2" />
                    Refresh Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      {coverageSummary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="summary-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Coverage</h6>
                    <h3 className="mb-0">
                      {coverageSummary.overall_coverage_percentage?.toFixed(1) || 0}%
                    </h3>
                  </div>
                  <FaChartLine className="text-primary" style={{ fontSize: '2rem' }} />
                </div>
                <ProgressBar
                  now={coverageSummary.overall_coverage_percentage || 0}
                  variant={
                    coverageSummary.overall_coverage_percentage >= 80 ? 'success' :
                    coverageSummary.overall_coverage_percentage >= 50 ? 'warning' : 'danger'
                  }
                  className="mt-2"
                />
                <small className="text-muted">
                  {coverageSummary.covered_scos || 0} / {coverageSummary.total_scos || 0} SCOs
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="summary-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Topics</h6>
                    <h3 className="mb-0">
                      {coverageSummary.covered_topics || 0} / {coverageSummary.total_topics || 0}
                    </h3>
                  </div>
                  <FaCheckCircle className="text-success" style={{ fontSize: '2rem' }} />
                </div>
                <ProgressBar
                  now={coverageSummary.total_topics > 0 
                    ? (coverageSummary.covered_topics / coverageSummary.total_topics * 100) 
                    : 0}
                  variant="info"
                  className="mt-2"
                />
                <small className="text-muted">
                  {coverageSummary.completed_count || 0} completed
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="summary-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Units</h6>
                    <h3 className="mb-0">
                      {coverageSummary.covered_units || 0} / {coverageSummary.total_units || 0}
                    </h3>
                  </div>
                  <FaClock className="text-warning" style={{ fontSize: '2rem' }} />
                </div>
                <ProgressBar
                  now={coverageSummary.total_units > 0 
                    ? (coverageSummary.covered_units / coverageSummary.total_units * 100) 
                    : 0}
                  variant="warning"
                  className="mt-2"
                />
                <small className="text-muted">
                  {coverageSummary.in_progress_count || 0} in progress
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="summary-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Status</h6>
                    <h3 className="mb-0">
                      <Badge bg={
                        coverageSummary.not_started_count > coverageSummary.completed_count ? 'danger' :
                        coverageSummary.in_progress_count > 0 ? 'warning' : 'success'
                      }>
                        {coverageSummary.completed_count || 0} Complete
                      </Badge>
                    </h3>
                  </div>
                  <FaExclamationTriangle className="text-danger" style={{ fontSize: '2rem' }} />
                </div>
                <div className="mt-2">
                  <small className="text-muted d-block">
                    {coverageSummary.not_started_count || 0} not started
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Analytics Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="coverage" title={
          <>
            <FaChartLine className="me-1" />
            Coverage Tracking
          </>
        }>
          <CoverageTracking
            classSubjectId={classSubjectId}
            coverageSummary={coverageSummary}
          />
        </Tab>

        <Tab eventKey="time" title={
          <>
            <FaClock className="me-1" />
            Time Allocation
          </>
        }>
          <TimeAllocationAnalysis
            classSubjectId={classSubjectId}
            academicYear={academicYear}
            term={term}
          />
        </Tab>

        <Tab eventKey="outcomes" title={
          <>
            <FaCheckCircle className="me-1" />
            Outcome Achievement
          </>
        }>
          <OutcomeAchievementDashboard
            classSubjectId={classSubjectId}
          />
        </Tab>

        <Tab eventKey="gaps" title={
          <>
            <FaExclamationTriangle className="me-1" />
            Gap Analysis
          </>
        }>
          <GapAnalysis
            classSubjectId={classSubjectId}
          />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default CurriculumAnalytics;

