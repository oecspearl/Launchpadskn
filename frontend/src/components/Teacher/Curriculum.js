import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Badge, Accordion, ListGroup, InputGroup, Modal
} from 'react-bootstrap';
import {
  FaBook, FaGraduationCap, FaSearch, FaFilter, FaDownload,
  FaClock, FaCheckCircle, FaInfoCircle, FaListOl, FaEye, FaChevronRight, FaEdit
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { Link } from 'react-router-dom';
import './Curriculum.css';

function Curriculum() {
  const { user } = useAuth();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data
  const [curriculumContent, setCurriculumContent] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [forms, setForms] = useState([]);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected curriculum for detailed view
  const [selectedOffering, setSelectedOffering] = useState(null);
  
  // Fetch curriculum content
  const fetchCurriculum = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user's school (assuming teacher belongs to a school)
      // For now, get all curriculum content (teachers can see all schools' curriculum)
      const schoolId = null; // TODO: Get from user profile if available
      const curriculum = await supabaseService.getCurriculumContent(
        schoolId,
        selectedForm ? parseInt(selectedForm) : null,
        selectedSubject ? parseInt(selectedSubject) : null
      );
      
      setCurriculumContent(curriculum || []);
      
      // Also fetch subjects and forms for filters
      if (!subjects.length) {
        const allSubjects = await supabaseService.getSubjectsBySchool(schoolId);
        setSubjects(allSubjects || []);
      }
      
      if (!forms.length) {
        const allForms = await supabaseService.getFormsBySchool(schoolId);
        setForms(allForms || []);
      }
      
    } catch (err) {
      console.error('[Curriculum] Error fetching curriculum:', err);
      setError('Failed to load curriculum content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, selectedForm, subjects.length, forms.length]);
  
  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);
  
  // Filter curriculum based on search query
  const filteredCurriculum = curriculumContent.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const subjectName = item.subject?.subject_name?.toLowerCase() || '';
    const formName = item.form?.form_name?.toLowerCase() || '';
    const framework = item.curriculum_framework?.toLowerCase() || '';
    const outcomes = item.learning_outcomes?.toLowerCase() || '';
    
    return subjectName.includes(query) || 
           formName.includes(query) ||
           framework.includes(query) ||
           outcomes.includes(query);
  });
  
  // Group curriculum by form for better organization
  const curriculumByForm = filteredCurriculum.reduce((acc, item) => {
    const formName = item.form?.form_name || 'Unknown Form';
    if (!acc[formName]) {
      acc[formName] = [];
    }
    acc[formName].push(item);
    return acc;
  }, {});
  
  // Group curriculum by subject for alternative view
  const curriculumBySubject = filteredCurriculum.reduce((acc, item) => {
    const subjectName = item.subject?.subject_name || 'Unknown Subject';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(item);
    return acc;
  }, {});
  
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedForm(''); // Reset form when subject changes
  };
  
  const handleFormChange = (e) => {
    setSelectedForm(e.target.value);
    setSelectedSubject(''); // Reset subject when form changes
  };
  
  const clearFilters = () => {
    setSelectedSubject('');
    setSelectedForm('');
    setSearchQuery('');
  };
  
  const formatCurriculumText = (text) => {
    if (!text) return 'Not available';
    
    // Split by common delimiters and format as list
    const lines = text.split(/\n|;|•|\*/).filter(line => line.trim());
    
    if (lines.length === 1) {
      return <p className="mb-0">{text}</p>;
    }
    
    return (
      <ul className="curriculum-list">
        {lines.map((line, idx) => (
          <li key={idx}>{line.trim()}</li>
        ))}
      </ul>
    );
  };
  
  // Check if curriculum has structured data
  const hasStructuredCurriculum = (offering) => {
    return offering.curriculum_structure && 
           offering.curriculum_structure.topics && 
           offering.curriculum_structure.topics.length > 0;
  };
  
  // Get topic count from structured curriculum
  const getTopicCount = (offering) => {
    if (hasStructuredCurriculum(offering)) {
      return offering.curriculum_structure.topics.length;
    }
    return 0;
  };
  
  return (
    <Container fluid className="curriculum-page py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div>
              <h1 className="mb-2">
                <FaBook className="me-2 text-primary" />
                Curriculum Content
              </h1>
              <p className="text-muted">
                Access curriculum frameworks and learning outcomes for all subjects
              </p>
            </div>
          </div>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>
                <FaFilter className="me-1" />
                Filter by Subject
              </Form.Label>
              <Form.Select
                value={selectedSubject}
                onChange={handleSubjectChange}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={4}>
              <Form.Label>
                <FaGraduationCap className="me-1" />
                Filter by Form
              </Form.Label>
              <Form.Select
                value={selectedForm}
                onChange={handleFormChange}
              >
                <option value="">All Forms</option>
                {forms.map(form => (
                  <option key={form.form_id} value={form.form_id}>
                    {form.form_name} (Form {form.form_number})
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={4}>
              <Form.Label>
                <FaSearch className="me-1" />
                Search
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search curriculum content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline-secondary"
                  onClick={clearFilters}
                  disabled={!selectedSubject && !selectedForm && !searchQuery}
                >
                  Clear
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Error</Alert.Heading>
          {error}
        </Alert>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading curriculum content...</p>
        </div>
      )}
      
      {/* Curriculum Content */}
      {!isLoading && !error && (
        <>
          {filteredCurriculum.length === 0 ? (
            <Alert variant="info">
              <FaInfoCircle className="me-2" />
              No curriculum content found. {selectedSubject || selectedForm || searchQuery 
                ? 'Try adjusting your filters.' 
                : 'Curriculum content will appear here once it\'s added by administrators.'}
            </Alert>
          ) : (
            <Row>
              <Col>
                <Accordion defaultActiveKey="0" className="curriculum-accordion">
                  {Object.entries(curriculumByForm).map(([formName, items], formIdx) => (
                    <Accordion.Item 
                      eventKey={formIdx.toString()} 
                      key={formName}
                      className="mb-3"
                    >
                      <Accordion.Header>
                        <div className="d-flex align-items-center w-100">
                          <FaGraduationCap className="me-2 text-primary" />
                          <strong>{formName}</strong>
                          <Badge bg="secondary" className="ms-auto me-3">
                            {items.length} {items.length === 1 ? 'Subject' : 'Subjects'}
                          </Badge>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {items.map((offering, idx) => (
                            <Col key={offering.offering_id} md={6} lg={4} className="mb-3">
                              <Card className="h-100 curriculum-card shadow-sm">
                                <Card.Header className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center">
                                    <FaBook className="me-2 text-primary" />
                                    <strong>{offering.subject?.subject_name}</strong>
                                  </div>
                                  {offering.is_compulsory && (
                                    <Badge bg="success">Required</Badge>
                                  )}
                                </Card.Header>
                                <Card.Body>
                                  {/* Subject Code */}
                                  {offering.subject?.cxc_code && (
                                    <div className="mb-2">
                                      <small className="text-muted">
                                        <strong>CXC Code:</strong> {offering.subject.cxc_code}
                                      </small>
                                    </div>
                                  )}
                                  
                                  {/* Weekly Periods */}
                                  <div className="mb-3">
                                    <Badge bg="info" className="me-2">
                                      <FaClock className="me-1" />
                                      {offering.weekly_periods || 5} periods/week
                                    </Badge>
                                    {offering.curriculum_version && (
                                      <Badge bg="secondary" className="me-2">
                                        {offering.curriculum_version}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Structured Curriculum Indicator */}
                                  {hasStructuredCurriculum(offering) ? (
                                    <div className="mb-3">
                                      <Alert variant="success" className="py-2 mb-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                          <div>
                                            <FaCheckCircle className="me-2" />
                                            <strong>Enhanced Structured Curriculum Available</strong>
                                            <br />
                                            <small>
                                              {getTopicCount(offering)} {getTopicCount(offering) === 1 ? 'Topic' : 'Topics'} with detailed units, activities, and resources
                                            </small>
                                          </div>
                                        </div>
                                      </Alert>
                                      
                                      {/* Front Matter Preview */}
                                      {offering.curriculum_structure.frontMatter?.introduction && (
                                        <div className="mb-3">
                                          <h6 className="d-flex align-items-center mb-2">
                                            <FaBook className="me-1 text-primary" />
                                            Introduction
                                          </h6>
                                          <div className="curriculum-content">
                                            <p>{offering.curriculum_structure.frontMatter.introduction}</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Topics Preview */}
                                      <div className="mb-3">
                                        <h6 className="d-flex align-items-center mb-2">
                                          <FaListOl className="me-1 text-primary" />
                                          Topics ({getTopicCount(offering)})
                                        </h6>
                                        <ul className="curriculum-list">
                                          {offering.curriculum_structure.topics.slice(0, 3).map((topic, idx) => (
                                            <li key={idx}>
                                              <strong>Topic {topic.topicNumber}:</strong> {topic.title}
                                              {topic.instructionalUnits && (
                                                <span className="text-muted ms-2">
                                                  ({topic.instructionalUnits.length} {topic.instructionalUnits.length === 1 ? 'unit' : 'units'})
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                          {offering.curriculum_structure.topics.length > 3 && (
                                            <li className="text-muted">
                                              ... and {offering.curriculum_structure.topics.length - 3} more topics
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                      
                                      {/* View Full Curriculum Button */}
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        className="w-100"
                                        onClick={() => setSelectedOffering(offering)}
                                      >
                                        <FaEye className="me-2" />
                                        View Full Structured Curriculum
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Curriculum Framework (Fallback for non-structured) */}
                                      <div className="mb-3">
                                        <h6 className="d-flex align-items-center mb-2">
                                          <FaListOl className="me-1 text-primary" />
                                          Curriculum Framework
                                        </h6>
                                        <div className="curriculum-content">
                                          {formatCurriculumText(offering.curriculum_framework)}
                                        </div>
                                      </div>
                                      
                                      {/* Learning Outcomes */}
                                      {offering.learning_outcomes && (
                                        <div className="mb-2">
                                          <h6 className="d-flex align-items-center mb-2">
                                            <FaCheckCircle className="me-1 text-success" />
                                            Learning Outcomes
                                          </h6>
                                          <div className="curriculum-content">
                                            {formatCurriculumText(offering.learning_outcomes)}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </Card.Body>
                                <Card.Footer className="text-muted">
                                  <small>
                                    {offering.subject?.subject_code}
                                  </small>
                                </Card.Footer>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Col>
            </Row>
          )}
          
          {/* Summary */}
          {filteredCurriculum.length > 0 && (
            <Card className="mt-4 bg-light">
              <Card.Body>
                <Row className="text-center">
                  <Col md={3}>
                    <h4 className="text-primary mb-1">
                      {Object.keys(curriculumByForm).length}
                    </h4>
                    <small className="text-muted">Forms</small>
                  </Col>
                  <Col md={3}>
                    <h4 className="text-primary mb-1">
                      {filteredCurriculum.length}
                    </h4>
                    <small className="text-muted">Subject-Form Combinations</small>
                  </Col>
                  <Col md={3}>
                    <h4 className="text-primary mb-1">
                      {new Set(filteredCurriculum.map(c => c.subject_id)).size}
                    </h4>
                    <small className="text-muted">Unique Subjects</small>
                  </Col>
                  <Col md={3}>
                    <h4 className="text-primary mb-1">
                      {filteredCurriculum.filter(c => c.is_compulsory).length}
                    </h4>
                    <small className="text-muted">Compulsory Subjects</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </>
      )}
      
      {/* Structured Curriculum Detail Modal */}
      {selectedOffering && selectedOffering.curriculum_structure && (
        <StructuredCurriculumView
          offering={selectedOffering}
          onClose={() => setSelectedOffering(null)}
        />
      )}
    </Container>
  );
}

// Structured Curriculum Detail View Component
function StructuredCurriculumView({ offering, onClose }) {
  const curriculum = offering.curriculum_structure;
  
  // Helper to check if structured curriculum exists
  const hasStructuredCurriculum = (offering) => {
    return offering.curriculum_structure && 
           offering.curriculum_structure.topics && 
           offering.curriculum_structure.topics.length > 0;
  };
  
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title">
                <FaBook className="me-2" />
                {offering.subject?.subject_name} - {offering.form?.form_name}
              </h5>
              {offering.curriculum_version && (
                <small className="text-muted">{offering.curriculum_version}</small>
              )}
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Front Matter */}
            {curriculum.frontMatter && (
              <div className="mb-4">
                <h4>Front Matter</h4>
                {curriculum.frontMatter.coverPage && (
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>{curriculum.frontMatter.coverPage.title}</h5>
                      <p className="text-muted mb-0">
                        {curriculum.frontMatter.coverPage.jurisdiction} • {curriculum.frontMatter.coverPage.series}
                      </p>
                    </Card.Body>
                  </Card>
                )}
                {curriculum.frontMatter.introduction && (
                  <div className="mb-3">
                    <h6>Introduction</h6>
                    <p>{curriculum.frontMatter.introduction}</p>
                  </div>
                )}
                {curriculum.frontMatter.tableOfContents && curriculum.frontMatter.tableOfContents.length > 0 && (
                  <div className="mb-3">
                    <h6>Table of Contents</h6>
                    <ul>
                      {curriculum.frontMatter.tableOfContents.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Topics */}
            {curriculum.topics && curriculum.topics.length > 0 && (
              <div>
                <h4 className="mb-3">Topics</h4>
                <Accordion defaultActiveKey="0">
                  {curriculum.topics.map((topic, topicIdx) => (
                    <Accordion.Item eventKey={topicIdx.toString()} key={topicIdx}>
                      <Accordion.Header>
                        <div className="d-flex align-items-center w-100">
                          <Badge bg="primary" className="me-2">
                            Topic {topic.topicNumber}
                          </Badge>
                          <strong>{topic.title}</strong>
                          {topic.instructionalUnits && (
                            <Badge bg="secondary" className="ms-auto me-2">
                              {topic.instructionalUnits.length} {topic.instructionalUnits.length === 1 ? 'Unit' : 'Units'}
                            </Badge>
                          )}
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        {/* Topic Overview */}
                        {topic.overview && (
                          <div className="mb-4">
                            <h5>Overview</h5>
                            {topic.overview.strandIdentification && (
                              <p><strong>Strand:</strong> {topic.overview.strandIdentification}</p>
                            )}
                            {topic.overview.essentialLearningOutcomes && topic.overview.essentialLearningOutcomes.length > 0 && (
                              <div className="mb-3">
                                <strong>Essential Learning Outcomes:</strong>
                                <ul>
                                  {topic.overview.essentialLearningOutcomes.map((outcome, idx) => (
                                    <li key={idx}>{outcome}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {topic.overview.gradeLevelGuidelines && topic.overview.gradeLevelGuidelines.length > 0 && (
                              <div className="mb-3">
                                <strong>Grade Level Guidelines:</strong>
                                <ul>
                                  {topic.overview.gradeLevelGuidelines.map((guideline, idx) => (
                                    <li key={idx}>{guideline}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Instructional Units */}
                        {topic.instructionalUnits && topic.instructionalUnits.length > 0 && (
                          <div className="mb-4">
                            <h5>Instructional Units</h5>
                            {topic.instructionalUnits.map((unit, unitIdx) => (
                              <Card key={unitIdx} className="mb-3">
                                <Card.Header>
                                  <div className="d-flex align-items-center">
                                    <Badge bg="info" className="me-2">
                                      {unit.scoNumber}
                                    </Badge>
                                    <strong>Unit {unit.unitNumber}</strong>
                                  </div>
                                </Card.Header>
                                <Card.Body>
                                  <Row>
                                    <Col md={4}>
                                      <h6>Specific Curriculum Outcomes (SCOs)</h6>
                                      <p>{unit.specificCurriculumOutcomes || 'Not specified'}</p>
                                    </Col>
                                    <Col md={4}>
                                      <h6>Inclusive Assessment Strategies</h6>
                                      <p>{unit.inclusiveAssessmentStrategies || 'Not specified'}</p>
                                    </Col>
                                    <Col md={4}>
                                      <h6>Inclusive Learning Strategies</h6>
                                      <p>{unit.inclusiveLearningStrategies || 'Not specified'}</p>
                                    </Col>
                                  </Row>
                                  
                                  {/* Activities */}
                                  {unit.activities && unit.activities.length > 0 && (
                                    <div className="mt-3">
                                      <h6>Activities</h6>
                                      {unit.activities.map((activity, actIdx) => (
                                        <div key={actIdx} className="mb-2 p-2 bg-light rounded">
                                          <strong>{activity.title}</strong>
                                          {activity.description && (
                                            <p className="mb-0 text-muted small">{activity.description}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </Card.Body>
                              </Card>
                            ))}
                          </div>
                        )}
                        
                        {/* Useful Content Knowledge */}
                        {topic.usefulContentKnowledge && (
                          <div className="mb-4">
                            <h5>Useful Content Knowledge for Teachers</h5>
                            <p>{topic.usefulContentKnowledge}</p>
                          </div>
                        )}
                        
                        {/* Closing Framework */}
                        {topic.closingFramework && (
                          <div className="mb-4">
                            <h5>Closing Framework</h5>
                            {topic.closingFramework.essentialEducationCompetencies && topic.closingFramework.essentialEducationCompetencies.length > 0 && (
                              <div className="mb-3">
                                <strong>Essential Education Competencies:</strong>
                                <ul>
                                  {topic.closingFramework.essentialEducationCompetencies.map((comp, idx) => (
                                    <li key={idx}>{comp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {topic.closingFramework.localCultureIntegration && (
                              <div className="mb-3">
                                <strong>Local Culture Integration:</strong>
                                <p>{topic.closingFramework.localCultureIntegration}</p>
                              </div>
                            )}
                            {topic.closingFramework.technologyIntegration && (
                              <div className="mb-3">
                                <strong>Technology Integration:</strong>
                                <p>{topic.closingFramework.technologyIntegration}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Resources */}
                        {topic.resources && (
                          <div className="mb-3">
                            <h5>Resources</h5>
                            {(topic.resources.webLinks?.length > 0 || 
                              topic.resources.videos?.length > 0 || 
                              topic.resources.games?.length > 0 || 
                              topic.resources.worksheets?.length > 0) ? (
                              <>
                                {topic.resources.webLinks?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Web Links:</strong>
                                    <ul>
                                      {topic.resources.webLinks.map((link, idx) => (
                                        <li key={idx}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {topic.resources.videos?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Videos:</strong>
                                    <ul>
                                      {topic.resources.videos.map((video, idx) => (
                                        <li key={idx}><a href={video} target="_blank" rel="noopener noreferrer">{video}</a></li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {topic.resources.games?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Games:</strong>
                                    <ul>
                                      {topic.resources.games.map((game, idx) => (
                                        <li key={idx}><a href={game} target="_blank" rel="noopener noreferrer">{game}</a></li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {topic.resources.worksheets?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Worksheets:</strong>
                                    <ul>
                                      {topic.resources.worksheets.map((ws, idx) => (
                                        <li key={idx}><a href={ws} target="_blank" rel="noopener noreferrer">{ws}</a></li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-muted">No resources added yet</p>
                            )}
                          </div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {hasStructuredCurriculum(offering) && (
              <Button 
                variant="primary"
                onClick={() => {
                  // Navigate to admin structured editor if user is admin
                  // For now, just show message
                  alert('Full editing available in Admin → Subjects → Form Offerings → Structured Editor');
                  onClose();
                }}
              >
                <FaEdit className="me-2" />
                Edit in Admin
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Curriculum;

