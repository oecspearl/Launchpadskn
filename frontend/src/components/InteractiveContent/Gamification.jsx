import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Badge, ProgressBar, Spinner, Alert,
  ListGroup, Tab, Nav, Table
} from 'react-bootstrap';
import { FaTrophy, FaMedal, FaStar, FaFire, FaCrown, FaAward } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import interactiveContentService from '../../services/interactiveContentService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function Gamification({ classSubjectId, classSubject, studentId = null }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const actualStudentId = studentId || user?.user_id;

  const { data: gamification, isLoading } = useQuery({
    queryKey: ['gamification', actualStudentId, classSubjectId],
    queryFn: () => interactiveContentService.getStudentGamification(actualStudentId, classSubjectId),
    enabled: !!actualStudentId
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['student-badges', actualStudentId, classSubjectId],
    queryFn: () => interactiveContentService.getStudentBadges(actualStudentId, classSubjectId),
    enabled: !!actualStudentId
  });

  const calculateLevelProgress = () => {
    if (!gamification) return 0;
    return (gamification.experience_points / gamification.experience_to_next_level) * 100;
  };

  const getLevelColor = (level) => {
    if (level >= 20) return 'danger';
    if (level >= 15) return 'warning';
    if (level >= 10) return 'info';
    if (level >= 5) return 'primary';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading gamification data...</p>
      </div>
    );
  }

  if (!gamification) {
    return (
      <Alert variant="info">
        <FaTrophy className="me-2" />
        Gamification profile will be created automatically when you start earning points!
      </Alert>
    );
  }

  return (
    <div className="gamification">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FaTrophy className="me-2" />
          Gamification
        </h4>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="badges">Badges</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="leaderboard">Leaderboard</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="overview">
            <Row>
              <Col md={4}>
                <Card className="mb-3">
                  <Card.Body className="text-center">
                    <FaCrown size={48} className={`text-${getLevelColor(gamification.current_level)} mb-3`} />
                    <h2>Level {gamification.current_level}</h2>
                    <ProgressBar
                      now={calculateLevelProgress()}
                      label={`${gamification.experience_points}/${gamification.experience_to_next_level} XP`}
                      variant={getLevelColor(gamification.current_level)}
                      className="mb-2"
                    />
                    <small className="text-muted">
                      {gamification.experience_to_next_level - gamification.experience_points} XP to next level
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="mb-3">
                  <Card.Body>
                    <h6 className="text-muted mb-3">Total Points</h6>
                    <h2 className="text-primary">{gamification.total_points.toLocaleString()}</h2>
                    <div className="mt-3">
                      <small className="text-muted">This Week</small>
                      <p className="mb-0">{gamification.points_this_week || 0}</p>
                    </div>
                    <div>
                      <small className="text-muted">This Month</small>
                      <p className="mb-0">{gamification.points_this_month || 0}</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="mb-3">
                  <Card.Body>
                    <h6 className="text-muted mb-3">
                      <FaFire className="me-2" />
                      Streak
                    </h6>
                    <h2 className="text-warning">{gamification.current_streak}</h2>
                    <small className="text-muted">days in a row</small>
                    <div className="mt-3">
                      <small className="text-muted">Longest Streak</small>
                      <p className="mb-0">{gamification.longest_streak}</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Statistics</h6>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Lessons Completed</span>
                        <Badge bg="primary">{gamification.lessons_completed}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Quizzes Passed</span>
                        <Badge bg="success">{gamification.quizzes_passed}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Assignments Submitted</span>
                        <Badge bg="info">{gamification.assignments_submitted || 0}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Perfect Scores</span>
                        <Badge bg="warning">{gamification.perfect_scores || 0}</Badge>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Rankings</h6>
                  </Card.Header>
                  <Card.Body>
                    {gamification.class_rank ? (
                      <div className="mb-3">
                        <h5>
                          <FaMedal className="me-2 text-warning" />
                          Class Rank: #{gamification.class_rank}
                        </h5>
                      </div>
                    ) : (
                      <Alert variant="info">Rankings will appear once more students join!</Alert>
                    )}
                    {gamification.school_rank && (
                      <div>
                        <h6>
                          <FaStar className="me-2 text-primary" />
                          School Rank: #{gamification.school_rank}
                        </h6>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="badges">
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  <FaAward className="me-2" />
                  Earned Badges ({badges.length})
                </h6>
              </Card.Header>
              <Card.Body>
                {badges.length === 0 ? (
                  <Alert variant="info">No badges earned yet. Complete activities to earn badges!</Alert>
                ) : (
                  <Row>
                    {badges.map((badge) => (
                      <Col md={4} key={badge.badge_id} className="mb-3">
                        <Card className="h-100">
                          <Card.Body className="text-center">
                            <div className="mb-2">
                              {badge.icon_url ? (
                                <img src={badge.icon_url} alt={badge.badge_name} style={{ width: '64px', height: '64px' }} />
                              ) : (
                                <FaMedal size={48} className={`text-${badge.rarity?.toLowerCase() || 'secondary'}`} />
                              )}
                            </div>
                            <h6>{badge.badge_name}</h6>
                            <p className="text-muted small mb-2">{badge.description}</p>
                            <Badge bg={badge.rarity?.toLowerCase() || 'secondary'}>
                              {badge.rarity || 'COMMON'}
                            </Badge>
                            <div className="mt-2">
                              <small className="text-muted">
                                Earned: {new Date(badge.earned_at).toLocaleDateString()}
                              </small>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="leaderboard">
            <Alert variant="info">
              Leaderboard feature coming soon! Rankings will be displayed here.
            </Alert>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
}

export default Gamification;

