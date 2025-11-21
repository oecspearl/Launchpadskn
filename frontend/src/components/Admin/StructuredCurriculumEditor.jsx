import React, { useState } from 'react';
import {
  Modal, Form, Button, Tabs, Tab, Accordion,
  Card, Row, Col, InputGroup, Badge, Alert, Table
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaSave, FaBook, FaListOl,
  FaCheckCircle, FaGraduationCap, FaLightbulb, FaLink,
  FaYoutube, FaGamepad, FaFileAlt
} from 'react-icons/fa';
import './StructuredCurriculumEditor.css';

function StructuredCurriculumEditor({ show, onHide, offering, onSave }) {
  const [curriculumData, setCurriculumData] = useState({
    frontMatter: {
      coverPage: {
        ministryBranding: true,
        title: '',
        academicYear: '',
        subjectName: ''
      },
      tableOfContents: [],
      introduction: ''
    },
    topics: []
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [editingTopicIndex, setEditingTopicIndex] = useState(null);
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);

  // Initialize with existing data if editing
  React.useEffect(() => {
    if (offering && offering.curriculum_structure) {
      setCurriculumData(offering.curriculum_structure);
    } else if (offering) {
      // Initialize from existing TEXT fields
      setCurriculumData({
        frontMatter: {
          coverPage: {
            ministryBranding: true,
            title: `${offering.subject?.subject_name || 'Subject'} - Form ${offering.form?.form_number || ''}`,
            academicYear: offering.form?.academic_year || '2024-2025',
            subjectName: offering.subject?.subject_name || ''
          },
          tableOfContents: [],
          introduction: offering.curriculum_framework || ''
        },
        topics: []
      });
    }
  }, [offering]);

  const handleAddTopic = () => {
    const newTopic = {
      topicNumber: curriculumData.topics.length + 1,
      title: '',
      strandIdentification: '',
      essentialLearningOutcomes: [],
      gradeLevelGuidelines: [],
      instructionalUnits: [],
      usefulContentKnowledge: '',
      closingFramework: {
        essentialEducationCompetencies: [],
        crossCurricularConnections: {
          socialStudies: '',
          science: '',
          english: ''
        },
        localCultureIntegration: '',
        technologyIntegration: '',
        itemsOfInspiration: []
      },
      resources: {
        webLinks: [],
        videos: [],
        games: [],
        worksheets: []
      }
    };
    
    setCurriculumData({
      ...curriculumData,
      topics: [...curriculumData.topics, newTopic]
    });
    setEditingTopicIndex(curriculumData.topics.length);
  };

  const handleUpdateTopic = (index, updates) => {
    const newTopics = [...curriculumData.topics];
    newTopics[index] = { ...newTopics[index], ...updates };
    setCurriculumData({ ...curriculumData, topics: newTopics });
  };

  const handleAddUnit = (topicIndex) => {
    const topic = curriculumData.topics[topicIndex];
    const newUnit = {
      unitNumber: (topic.instructionalUnits?.length || 0) + 1,
      scoNumber: `${topic.topicNumber}.${(topic.instructionalUnits?.length || 0) + 1}`,
      specificCurriculumOutcomes: '',
      inclusiveAssessmentStrategies: '',
      inclusiveLearningStrategies: ''
    };
    
    const updatedUnits = [...(topic.instructionalUnits || []), newUnit];
    handleUpdateTopic(topicIndex, { instructionalUnits: updatedUnits });
    setEditingUnitIndex(updatedUnits.length - 1);
  };

  const handleAddLearningOutcome = (topicIndex) => {
    const topic = curriculumData.topics[topicIndex];
    const newOutcome = '';
    const updatedOutcomes = [...(topic.essentialLearningOutcomes || []), newOutcome];
    handleUpdateTopic(topicIndex, { essentialLearningOutcomes: updatedOutcomes });
  };

  const handleAddResource = (topicIndex, resourceType, resource) => {
    const topic = curriculumData.topics[topicIndex];
    const updatedResources = {
      ...topic.resources,
      [resourceType]: [...(topic.resources?.[resourceType] || []), resource]
    };
    handleUpdateTopic(topicIndex, { resources: updatedResources });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        curriculum_structure: curriculumData,
        curriculum_version: `Form ${offering?.form?.form_number || ''} ${offering?.subject?.subject_name || 'Curriculum'} v1.0`,
        curriculum_updated_at: new Date().toISOString()
      });
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaBook className="me-2" />
          Structured Curriculum Editor
          {offering && (
            <Badge bg="secondary" className="ms-2">
              {offering.subject?.subject_name} - Form {offering.form?.form_number}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="curriculum-editor-body">
        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
          {/* Front Matter Tab */}
          <Tab eventKey="frontMatter" title="Front Matter">
            <Card className="mb-3">
              <Card.Header>
                <h5>Cover Page</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Curriculum Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={curriculumData.frontMatter?.coverPage?.title || ''}
                        onChange={(e) => setCurriculumData({
                          ...curriculumData,
                          frontMatter: {
                            ...curriculumData.frontMatter,
                            coverPage: {
                              ...curriculumData.frontMatter?.coverPage,
                              title: e.target.value
                            }
                          }
                        })}
                        placeholder="Form 1 Mathematics Curriculum"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Academic Year</Form.Label>
                      <Form.Control
                        type="text"
                        value={curriculumData.frontMatter?.coverPage?.academicYear || ''}
                        onChange={(e) => setCurriculumData({
                          ...curriculumData,
                          frontMatter: {
                            ...curriculumData.frontMatter,
                            coverPage: {
                              ...curriculumData.frontMatter?.coverPage,
                              academicYear: e.target.value
                            }
                          }
                        })}
                        placeholder="2024-2025"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Check
                  type="checkbox"
                  label="Include Ministry of Education Branding"
                  checked={curriculumData.frontMatter?.coverPage?.ministryBranding || false}
                  onChange={(e) => setCurriculumData({
                    ...curriculumData,
                    frontMatter: {
                      ...curriculumData.frontMatter,
                      coverPage: {
                        ...curriculumData.frontMatter?.coverPage,
                        ministryBranding: e.target.checked
                      }
                    }
                  })}
                />
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>
                <h5>Introduction</h5>
              </Card.Header>
              <Card.Body>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={curriculumData.frontMatter?.introduction || ''}
                  onChange={(e) => setCurriculumData({
                    ...curriculumData,
                    frontMatter: {
                      ...curriculumData.frontMatter,
                      introduction: e.target.value
                    }
                  })}
                  placeholder="Explain the educational vision and competencies for Saint Kitts and Nevis..."
                />
              </Card.Body>
            </Card>
          </Tab>

          {/* Topics Tab */}
          <Tab eventKey="topics" title={`Topics (${curriculumData.topics?.length || 0})`}>
            <div className="mb-3">
              <Button variant="primary" onClick={handleAddTopic}>
                <FaPlus className="me-2" />
                Add Topic
              </Button>
            </div>

            <Accordion defaultActiveKey="0">
              {curriculumData.topics?.map((topic, topicIndex) => (
                <Accordion.Item eventKey={topicIndex.toString()} key={topicIndex}>
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="primary" className="me-2">
                        Topic {topic.topicNumber || topicIndex + 1}
                      </Badge>
                      <strong>{topic.title || 'Untitled Topic'}</strong>
                      <Button
                        variant="link"
                        size="sm"
                        className="ms-auto me-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTopicIndex(topicIndex);
                          setActiveTab('editTopic');
                        }}
                      >
                        <FaEdit />
                      </Button>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <TopicView 
                      topic={topic} 
                      topicIndex={topicIndex}
                      onUpdate={(updates) => handleUpdateTopic(topicIndex, updates)}
                      onAddUnit={() => handleAddUnit(topicIndex)}
                      onAddOutcome={() => handleAddLearningOutcome(topicIndex)}
                      onAddResource={(type, resource) => handleAddResource(topicIndex, type, resource)}
                    />
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>

            {(!curriculumData.topics || curriculumData.topics.length === 0) && (
              <Alert variant="info">
                <FaBook className="me-2" />
                No topics added yet. Click "Add Topic" to get started.
              </Alert>
            )}
          </Tab>

          {/* Edit Topic Tab (shown when editing) */}
          {editingTopicIndex !== null && curriculumData.topics[editingTopicIndex] && (
            <Tab eventKey="editTopic" title="Edit Topic">
              <TopicEditor
                topic={curriculumData.topics[editingTopicIndex]}
                topicIndex={editingTopicIndex}
                onUpdate={(updates) => {
                  handleUpdateTopic(editingTopicIndex, updates);
                  setEditingTopicIndex(null);
                  setActiveTab('topics');
                }}
                onCancel={() => {
                  setEditingTopicIndex(null);
                  setActiveTab('topics');
                }}
              />
            </Tab>
          )}
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <FaSave className="me-2" />
          Save Curriculum
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// Topic Editor Component
function TopicEditor({ topic, topicIndex, onUpdate, onCancel }) {
  const [localTopic, setLocalTopic] = useState(topic);

  const handleSave = () => {
    onUpdate(localTopic);
  };

  return (
    <div className="topic-editor">
      <Card className="mb-3">
        <Card.Header>
          <h5>Topic Overview</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Topic Title *</Form.Label>
            <Form.Control
              type="text"
              value={localTopic.title || ''}
              onChange={(e) => setLocalTopic({ ...localTopic, title: e.target.value })}
              placeholder="e.g., Number and Operations"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Strand Identification</Form.Label>
            <Form.Control
              type="text"
              value={localTopic.strandIdentification || ''}
              onChange={(e) => setLocalTopic({ ...localTopic, strandIdentification: e.target.value })}
              placeholder="Strand or domain identification"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Essential Learning Outcomes</Form.Label>
            {(localTopic.essentialLearningOutcomes || []).map((outcome, idx) => (
              <InputGroup key={idx} className="mb-2">
                <Form.Control
                  type="text"
                  value={outcome}
                  onChange={(e) => {
                    const updated = [...localTopic.essentialLearningOutcomes];
                    updated[idx] = e.target.value;
                    setLocalTopic({ ...localTopic, essentialLearningOutcomes: updated });
                  }}
                  placeholder="Learning outcome..."
                />
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    const updated = localTopic.essentialLearningOutcomes.filter((_, i) => i !== idx);
                    setLocalTopic({ ...localTopic, essentialLearningOutcomes: updated });
                  }}
                >
                  <FaTrash />
                </Button>
              </InputGroup>
            ))}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setLocalTopic({
                ...localTopic,
                essentialLearningOutcomes: [...(localTopic.essentialLearningOutcomes || []), '']
              })}
            >
              <FaPlus className="me-1" />
              Add Outcome
            </Button>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Grade Level Guidelines</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={localTopic.gradeLevelGuidelines?.join('\n') || ''}
              onChange={(e) => setLocalTopic({
                ...localTopic,
                gradeLevelGuidelines: e.target.value.split('\n').filter(l => l.trim())
              })}
              placeholder="One guideline per line..."
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Instructional Units */}
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>Instructional Units</h5>
          <Button variant="outline-primary" size="sm" onClick={() => {
            const newUnit = {
              unitNumber: (localTopic.instructionalUnits?.length || 0) + 1,
              scoNumber: `${localTopic.topicNumber}.${(localTopic.instructionalUnits?.length || 0) + 1}`,
              specificCurriculumOutcomes: '',
              inclusiveAssessmentStrategies: '',
              inclusiveLearningStrategies: ''
            };
            setLocalTopic({
              ...localTopic,
              instructionalUnits: [...(localTopic.instructionalUnits || []), newUnit]
            });
          }}>
            <FaPlus className="me-1" />
            Add Unit
          </Button>
        </Card.Header>
        <Card.Body>
          {(localTopic.instructionalUnits || []).map((unit, unitIdx) => (
            <Card key={unitIdx} className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <Badge bg="info">Unit {unit.unitNumber}</Badge>
                    <strong className="ms-2">SCO {unit.scoNumber}</strong>
                  </span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      const updated = localTopic.instructionalUnits.filter((_, i) => i !== unitIdx);
                      setLocalTopic({ ...localTopic, instructionalUnits: updated });
                    }}
                  >
                    <FaTrash />
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaListOl className="me-1" />
                        Specific Curriculum Outcomes (SCOs)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={unit.specificCurriculumOutcomes || ''}
                        onChange={(e) => {
                          const updated = [...localTopic.instructionalUnits];
                          updated[unitIdx] = { ...unit, specificCurriculumOutcomes: e.target.value };
                          setLocalTopic({ ...localTopic, instructionalUnits: updated });
                        }}
                        placeholder="Numbered learning objectives..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaCheckCircle className="me-1" />
                        Inclusive Assessment Strategies
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={unit.inclusiveAssessmentStrategies || ''}
                        onChange={(e) => {
                          const updated = [...localTopic.instructionalUnits];
                          updated[unitIdx] = { ...unit, inclusiveAssessmentStrategies: e.target.value };
                          setLocalTopic({ ...localTopic, instructionalUnits: updated });
                        }}
                        placeholder="Activities, games, assessment methods..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaGraduationCap className="me-1" />
                        Inclusive Learning Strategies
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={unit.inclusiveLearningStrategies || ''}
                        onChange={(e) => {
                          const updated = [...localTopic.instructionalUnits];
                          updated[unitIdx] = { ...unit, inclusiveLearningStrategies: e.target.value };
                          setLocalTopic({ ...localTopic, instructionalUnits: updated });
                        }}
                        placeholder="Teaching approaches and activities..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          {(!localTopic.instructionalUnits || localTopic.instructionalUnits.length === 0) && (
            <Alert variant="info" className="mb-0">
              No instructional units added yet. Click "Add Unit" to create one.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Useful Content Knowledge */}
      <Card className="mb-3">
        <Card.Header>
          <h5>Useful Content Knowledge for Teachers</h5>
        </Card.Header>
        <Card.Body>
          <Form.Control
            as="textarea"
            rows={6}
            value={localTopic.usefulContentKnowledge || ''}
            onChange={(e) => setLocalTopic({ ...localTopic, usefulContentKnowledge: e.target.value })}
            placeholder="Definitions, mathematical concepts, background information teachers need..."
          />
        </Card.Body>
      </Card>

      {/* Closing Framework */}
      <Card className="mb-3">
        <Card.Header>
          <h5>Closing Framework</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Essential Education Competencies</Form.Label>
            {(localTopic.closingFramework?.essentialEducationCompetencies || []).map((comp, idx) => (
              <InputGroup key={idx} className="mb-2">
                <Form.Control
                  type="text"
                  value={comp}
                  onChange={(e) => {
                    const updated = [...(localTopic.closingFramework?.essentialEducationCompetencies || [])];
                    updated[idx] = e.target.value;
                    setLocalTopic({
                      ...localTopic,
                      closingFramework: {
                        ...localTopic.closingFramework,
                        essentialEducationCompetencies: updated
                      }
                    });
                  }}
                  placeholder="Competency addressed..."
                />
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    const updated = (localTopic.closingFramework?.essentialEducationCompetencies || []).filter((_, i) => i !== idx);
                    setLocalTopic({
                      ...localTopic,
                      closingFramework: {
                        ...localTopic.closingFramework,
                        essentialEducationCompetencies: updated
                      }
                    });
                  }}
                >
                  <FaTrash />
                </Button>
              </InputGroup>
            ))}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setLocalTopic({
                ...localTopic,
                closingFramework: {
                  ...localTopic.closingFramework,
                  essentialEducationCompetencies: [...(localTopic.closingFramework?.essentialEducationCompetencies || []), '']
                }
              })}
            >
              <FaPlus className="me-1" />
              Add Competency
            </Button>
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Social Studies Connection</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={localTopic.closingFramework?.crossCurricularConnections?.socialStudies || ''}
                  onChange={(e) => setLocalTopic({
                    ...localTopic,
                    closingFramework: {
                      ...localTopic.closingFramework,
                      crossCurricularConnections: {
                        ...localTopic.closingFramework?.crossCurricularConnections,
                        socialStudies: e.target.value
                      }
                    }
                  })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Science Connection</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={localTopic.closingFramework?.crossCurricularConnections?.science || ''}
                  onChange={(e) => setLocalTopic({
                    ...localTopic,
                    closingFramework: {
                      ...localTopic.closingFramework,
                      crossCurricularConnections: {
                        ...localTopic.closingFramework?.crossCurricularConnections,
                        science: e.target.value
                      }
                    }
                  })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>English Connection</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={localTopic.closingFramework?.crossCurricularConnections?.english || ''}
                  onChange={(e) => setLocalTopic({
                    ...localTopic,
                    closingFramework: {
                      ...localTopic.closingFramework,
                      crossCurricularConnections: {
                        ...localTopic.closingFramework?.crossCurricularConnections,
                        english: e.target.value
                      }
                    }
                  })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Local Culture Integration</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={localTopic.closingFramework?.localCultureIntegration || ''}
              onChange={(e) => setLocalTopic({
                ...localTopic,
                closingFramework: {
                  ...localTopic.closingFramework,
                  localCultureIntegration: e.target.value
                }
              })}
              placeholder="How this topic connects to Saint Kitts and Nevis culture..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Technology Integration</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={localTopic.closingFramework?.technologyIntegration || ''}
              onChange={(e) => setLocalTopic({
                ...localTopic,
                closingFramework: {
                  ...localTopic.closingFramework,
                  technologyIntegration: e.target.value
                }
              })}
              placeholder="Technology tools, apps, and digital resources..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Items of Inspiration</Form.Label>
            {(localTopic.closingFramework?.itemsOfInspiration || []).map((item, idx) => (
              <InputGroup key={idx} className="mb-2">
                <Form.Control
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const updated = [...(localTopic.closingFramework?.itemsOfInspiration || [])];
                    updated[idx] = e.target.value;
                    setLocalTopic({
                      ...localTopic,
                      closingFramework: {
                        ...localTopic.closingFramework,
                        itemsOfInspiration: updated
                      }
                    });
                  }}
                  placeholder="Teaching tip, quote, or research connection..."
                />
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    const updated = (localTopic.closingFramework?.itemsOfInspiration || []).filter((_, i) => i !== idx);
                    setLocalTopic({
                      ...localTopic,
                      closingFramework: {
                        ...localTopic.closingFramework,
                        itemsOfInspiration: updated
                      }
                    });
                  }}
                >
                  <FaTrash />
                </Button>
              </InputGroup>
            ))}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setLocalTopic({
                ...localTopic,
                closingFramework: {
                  ...localTopic.closingFramework,
                  itemsOfInspiration: [...(localTopic.closingFramework?.itemsOfInspiration || []), '']
                }
              })}
            >
              <FaPlus className="me-1" />
              Add Inspiration Item
            </Button>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Resources */}
      <Card className="mb-3">
        <Card.Header>
          <h5>Resources</h5>
        </Card.Header>
        <Card.Body>
          <ResourceSection
            title="Web Links"
            icon={<FaLink />}
            resources={localTopic.resources?.webLinks || []}
            onAdd={(url) => setLocalTopic({
              ...localTopic,
              resources: {
                ...localTopic.resources,
                webLinks: [...(localTopic.resources?.webLinks || []), url]
              }
            })}
            onRemove={(idx) => {
              const updated = (localTopic.resources?.webLinks || []).filter((_, i) => i !== idx);
              setLocalTopic({
                ...localTopic,
                resources: {
                  ...localTopic.resources,
                  webLinks: updated
                }
              });
            }}
          />
          <ResourceSection
            title="Videos"
            icon={<FaYoutube />}
            resources={localTopic.resources?.videos || []}
            onAdd={(url) => setLocalTopic({
              ...localTopic,
              resources: {
                ...localTopic.resources,
                videos: [...(localTopic.resources?.videos || []), url]
              }
            })}
            onRemove={(idx) => {
              const updated = (localTopic.resources?.videos || []).filter((_, i) => i !== idx);
              setLocalTopic({
                ...localTopic,
                resources: {
                  ...localTopic.resources,
                  videos: updated
                }
              });
            }}
          />
          <ResourceSection
            title="Games & Interactive"
            icon={<FaGamepad />}
            resources={localTopic.resources?.games || []}
            onAdd={(url) => setLocalTopic({
              ...localTopic,
              resources: {
                ...localTopic.resources,
                games: [...(localTopic.resources?.games || []), url]
              }
            })}
            onRemove={(idx) => {
              const updated = (localTopic.resources?.games || []).filter((_, i) => i !== idx);
              setLocalTopic({
                ...localTopic,
                resources: {
                  ...localTopic.resources,
                  games: updated
                }
              });
            }}
          />
          <ResourceSection
            title="Worksheets"
            icon={<FaFileAlt />}
            resources={localTopic.resources?.worksheets || []}
            onAdd={(url) => setLocalTopic({
              ...localTopic,
              resources: {
                ...localTopic.resources,
                worksheets: [...(localTopic.resources?.worksheets || []), url]
              }
            })}
            onRemove={(idx) => {
              const updated = (localTopic.resources?.worksheets || []).filter((_, i) => i !== idx);
              setLocalTopic({
                ...localTopic,
                resources: {
                  ...localTopic.resources,
                  worksheets: updated
                }
              });
            }}
          />
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <FaSave className="me-2" />
          Save Topic
        </Button>
      </div>
    </div>
  );
}

// Topic View Component (simplified view in accordion)
function TopicView({ topic, topicIndex, onUpdate, onAddUnit, onAddOutcome, onAddResource }) {
  return (
    <div>
      <div className="mb-3">
        <strong>Strand:</strong> {topic.strandIdentification || 'Not specified'}
      </div>
      
      {topic.essentialLearningOutcomes && topic.essentialLearningOutcomes.length > 0 && (
        <div className="mb-3">
          <strong>Essential Learning Outcomes:</strong>
          <ul>
            {topic.essentialLearningOutcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </div>
      )}

      {topic.instructionalUnits && topic.instructionalUnits.length > 0 && (
        <div className="mb-3">
          <strong>Instructional Units ({topic.instructionalUnits.length}):</strong>
          <Table responsive className="mt-2">
            <thead>
              <tr>
                <th>SCO</th>
                <th>Curriculum Outcomes</th>
                <th>Assessment Strategies</th>
                <th>Learning Strategies</th>
              </tr>
            </thead>
            <tbody>
              {topic.instructionalUnits.map((unit, idx) => (
                <tr key={idx}>
                  <td><Badge bg="info">{unit.scoNumber}</Badge></td>
                  <td>{unit.specificCurriculumOutcomes?.substring(0, 100)}...</td>
                  <td>{unit.inclusiveAssessmentStrategies?.substring(0, 100)}...</td>
                  <td>{unit.inclusiveLearningStrategies?.substring(0, 100)}...</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Resource Section Component
function ResourceSection({ title, icon, resources, onAdd, onRemove }) {
  const [newResource, setNewResource] = useState('');

  const handleAdd = () => {
    if (newResource.trim()) {
      onAdd(newResource.trim());
      setNewResource('');
    }
  };

  return (
    <div className="mb-3">
      <h6>
        {icon} {title}
      </h6>
      {resources.map((resource, idx) => (
        <div key={idx} className="d-flex align-items-center mb-2">
          <a href={resource} target="_blank" rel="noopener noreferrer" className="flex-grow-1">
            {resource}
          </a>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onRemove(idx)}
          >
            <FaTrash />
          </Button>
        </div>
      ))}
      <InputGroup>
        <Form.Control
          type="url"
          placeholder="Enter URL..."
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="outline-primary" onClick={handleAdd}>
          <FaPlus />
        </Button>
      </InputGroup>
    </div>
  );
}

export default StructuredCurriculumEditor;

