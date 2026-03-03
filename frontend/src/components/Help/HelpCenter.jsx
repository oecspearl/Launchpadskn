import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Accordion, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaSearch, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import helpContent from './helpContent';
import './HelpPage.css';

function HelpCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('0');
  const [searchTerm, setSearchTerm] = useState('');

  const role = (user?.role || 'student').toLowerCase();
  const content = helpContent[role] || helpContent.student;
  const Icon = content.icon;

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return content.sections;
    const query = searchTerm.toLowerCase();
    return content.sections.filter(section =>
      section.title.toLowerCase().includes(query)
    );
  }, [content.sections, searchTerm]);

  return (
    <Container fluid className="help-page-container">
      <Row>
        <Col>
          <div className="help-header mb-4">
            <h1 className="display-4">
              <Icon className="me-3" />
              {content.title}
            </h1>
            <p className="lead text-muted">{content.subtitle}</p>
          </div>

          {/* Search */}
          <div className="help-search mb-4">
            <div className="position-relative">
              <FaSearch className="help-search-icon" />
              <Form.Control
                type="text"
                placeholder="Search help topics..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveKey(null);
                }}
                className="help-search-input"
              />
            </div>
          </div>

          {/* Quick Links */}
          {!searchTerm && content.quickLinks && content.quickLinks.length > 0 && (
            <Row className="help-quick-links mb-4">
              {content.quickLinks.map((link, idx) => {
                const LinkIcon = link.icon;
                return (
                  <Col key={idx} sm={6} md={content.quickLinks.length <= 3 ? 4 : 3} className="mb-3">
                    <Card
                      className="help-quick-link-card h-100 border-0 shadow-sm"
                      onClick={() => navigate(link.path)}
                      role="button"
                    >
                      <Card.Body className="d-flex align-items-center gap-3 py-3">
                        <div className="help-quick-link-icon">
                          <LinkIcon size={20} />
                        </div>
                        <div className="flex-grow-1">
                          <span className="fw-semibold">{link.label}</span>
                        </div>
                        <FaArrowRight className="text-muted" size={12} />
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>{content.welcomeMessage.split('!')[0]}!</strong>{' '}
            {content.welcomeMessage.split('!').slice(1).join('!')}
          </Alert>

          {/* Sections */}
          {filteredSections.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No help topics match "{searchTerm}"</p>
            </div>
          ) : (
            <Accordion
              activeKey={activeKey}
              onSelect={(k) => setActiveKey(k)}
              className="help-accordion"
            >
              {filteredSections.map((section, idx) => {
                const SectionIcon = section.icon;
                return (
                  <Accordion.Item eventKey={String(idx)} key={idx}>
                    <Accordion.Header>
                      <SectionIcon className="me-2" />
                      <strong>{section.title}</strong>
                    </Accordion.Header>
                    <Accordion.Body>{section.content}</Accordion.Body>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}

          {/* Footer */}
          <Card className="mt-4 help-footer">
            <Card.Body className="text-center">
              <h5>Need More Help?</h5>
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Contact your school administrator or use the messaging feature to reach out to teachers directly.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default HelpCenter;
