import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Card, Row, Col, Form, Badge, Alert,
  Tabs, Tab, InputGroup, Dropdown, Spinner, Tooltip, OverlayTrigger
} from 'react-bootstrap';
import {
  FaGripVertical, FaPlus, FaEdit, FaTrash, FaSave, FaCopy,
  FaLink, FaLightbulb, FaUsers, FaBook, FaHistory, FaMagic,
  FaSearch, FaFilter, FaTimes, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContextSupabase';
import ResourceLibrary from './ResourceLibrary';
import CurriculumTemplateManager from './CurriculumTemplateManager';
import AISuggestionPanel from './AISuggestionPanel';
import './InteractiveCurriculumBuilder.css';

function InteractiveCurriculumBuilder({ show, onHide, offering, onSave }) {
  const { user } = useAuth();
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
  
  const [activeTab, setActiveTab] = useState('builder');
  const [editingTopicIndex, setEditingTopicIndex] = useState(null);
  const [showResourceLibrary, setShowResourceLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [selectedContext, setSelectedContext] = useState(null); // For AI suggestions

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize curriculum data
  useEffect(() => {
    if (offering && offering.curriculum_structure) {
      setCurriculumData(offering.curriculum_structure);
    } else if (offering) {
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

  // Set up collaborative editing session
  useEffect(() => {
    if (!show || !offering || !user) return;

    let sessionSubscription = null;
    let editorsSubscription = null;

    const setupCollaborativeSession = async () => {
      try {
        // Create or get active session
        const { data: existingSession } = await supabase
          .from('curriculum_editing_sessions')
          .select('*')
          .eq('offering_id', offering.offering_id)
          .eq('is_active', true)
          .single();

        let currentSessionId;
        if (existingSession) {
          currentSessionId = existingSession.session_id;
        } else {
          const { data: newSession, error } = await supabase
            .from('curriculum_editing_sessions')
            .insert({
              offering_id: offering.offering_id,
              created_by: user.user_id
            })
            .select()
            .single();
          
          if (error) throw error;
          currentSessionId = newSession.session_id;
        }

        setSessionId(currentSessionId);

        // Join as editor
        await supabase
          .from('curriculum_session_editors')
          .upsert({
            session_id: currentSessionId,
            user_id: user.user_id,
            last_seen: new Date().toISOString()
          });

        // Subscribe to curriculum changes
        sessionSubscription = supabase
          .channel(`curriculum:${offering.offering_id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'subject_form_offerings',
            filter: `offering_id=eq.${offering.offering_id}`
          }, (payload) => {
            if (payload.new.curriculum_structure) {
              setCurriculumData(payload.new.curriculum_structure);
            }
          })
          .subscribe();

        // Subscribe to active editors
        editorsSubscription = supabase
          .channel(`editors:${currentSessionId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'curriculum_session_editors',
            filter: `session_id=eq.${currentSessionId}`
          }, async () => {
            const { data: editors } = await supabase
              .from('curriculum_session_editors')
              .select(`
                user_id,
                last_seen,
                users:user_id (user_id, email, first_name, last_name)
              `)
              .eq('session_id', currentSessionId)
              .gte('last_seen', new Date(Date.now() - 60000).toISOString()); // Active in last minute

            if (editors) {
              setCollaborators(editors.map(e => ({
                user_id: e.user_id,
                name: e.users ? `${e.users.first_name || ''} ${e.users.last_name || ''}`.trim() : e.users?.email || 'Unknown',
                email: e.users?.email
              })));
            }
          })
          .subscribe();

        // Update last_seen periodically
        const updateInterval = setInterval(async () => {
          await supabase
            .from('curriculum_session_editors')
            .update({ last_seen: new Date().toISOString() })
            .eq('session_id', currentSessionId)
            .eq('user_id', user.user_id);
        }, 30000); // Every 30 seconds

        return () => {
          clearInterval(updateInterval);
          if (sessionSubscription) sessionSubscription.unsubscribe();
          if (editorsSubscription) editorsSubscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up collaborative session:', error);
      }
    };

    setupCollaborativeSession();

    return () => {
      if (sessionSubscription) sessionSubscription.unsubscribe();
      if (editorsSubscription) editorsSubscription.unsubscribe();
    };
  }, [show, offering, user]);

  // Handle drag end for topics
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveDragId(null);
      return;
    }

    const oldIndex = curriculumData.topics.findIndex(t => `topic-${t.topicNumber}` === active.id);
    const newIndex = curriculumData.topics.findIndex(t => `topic-${t.topicNumber}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTopics = arrayMove(curriculumData.topics, oldIndex, newIndex);
      // Update topic numbers
      newTopics.forEach((topic, index) => {
        topic.topicNumber = index + 1;
        if (topic.instructionalUnits) {
          topic.instructionalUnits.forEach((unit, unitIndex) => {
            unit.scoNumber = `${topic.topicNumber}.${unitIndex + 1}`;
          });
        }
      });

      setCurriculumData({
        ...curriculumData,
        topics: newTopics
      });

      // Log change
      logChange('REORDER', `topics[${oldIndex}]`, { oldIndex, newIndex }, null);
    }

    setActiveDragId(null);
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  // Log curriculum changes
  const logChange = async (changeType, changePath, oldValue, newValue, description) => {
    if (!offering || !user) return;

    try {
      await supabase
        .from('curriculum_change_history')
        .insert({
          offering_id: offering.offering_id,
          changed_by: user.user_id,
          change_type: changeType,
          change_path: changePath,
          old_value: oldValue,
          new_value: newValue,
          change_description: description
        });
    } catch (error) {
      console.error('Error logging change:', error);
    }
  };

  // Add new topic
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

    const newTopics = [...curriculumData.topics, newTopic];
    setCurriculumData({ ...curriculumData, topics: newTopics });
    setEditingTopicIndex(newTopics.length - 1);
    logChange('CREATE', `topics[${newTopics.length - 1}]`, null, newTopic, 'Added new topic');
  };

  // Save curriculum
  const handleSave = async () => {
    if (!offering || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('subject_form_offerings')
        .update({
          curriculum_structure: curriculumData,
          curriculum_updated_at: new Date().toISOString()
        })
        .eq('offering_id', offering.offering_id);

      if (error) throw error;

      setLastSaved(new Date());
      if (onSave) onSave(curriculumData);
      
      // Broadcast update to other editors
      await supabase
        .channel(`curriculum:${offering.offering_id}`)
        .send({
          type: 'broadcast',
          event: 'curriculum_saved',
          payload: { curriculum_structure: curriculumData }
        });
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Failed to save curriculum. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Link resource to curriculum item
  const handleLinkResource = async (resource, linkPath) => {
    if (!offering) return;

    try {
      await supabase
        .from('curriculum_resource_links')
        .insert({
          offering_id: offering.offering_id,
          resource_id: resource.resource_id,
          link_path: linkPath,
          created_by: user.user_id
        });

      // Update resource usage count
      await supabase.rpc('increment_resource_usage', { resource_id: resource.resource_id });
    } catch (error) {
      console.error('Error linking resource:', error);
    }
  };

  // Load change history
  useEffect(() => {
    if (!offering) return;

    const loadHistory = async () => {
      const { data } = await supabase
        .from('curriculum_change_history')
        .select(`
          *,
          changed_by_user:users!curriculum_change_history_changed_by_fkey (first_name, last_name, email)
        `)
        .eq('offering_id', offering.offering_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setChangeHistory(data);
      }
    };

    loadHistory();
  }, [offering]);

  const getDraggedItem = () => {
    if (!activeDragId) return null;
    const topicIndex = curriculumData.topics.findIndex(t => `topic-${t.topicNumber}` === activeDragId);
    if (topicIndex !== -1) {
      return curriculumData.topics[topicIndex];
    }
    return null;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaBook className="me-2" />
          Interactive Curriculum Builder
          {offering && (
            <Badge bg="info" className="ms-2">
              {offering.subject?.subject_name} - Form {offering.form?.form_number}
            </Badge>
          )}
        </Modal.Title>
        <div className="d-flex align-items-center gap-2">
          {collaborators.length > 0 && (
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip>
                  Active Editors: {collaborators.map(c => c.name).join(', ')}
                </Tooltip>
              }
            >
              <div className="d-flex align-items-center">
                <FaUsers className="me-1" />
                <Badge bg="success">{collaborators.length}</Badge>
              </div>
            </OverlayTrigger>
          )}
          {lastSaved && (
            <small className="text-muted">
              Saved {lastSaved.toLocaleTimeString()}
            </small>
          )}
        </div>
      </Modal.Header>

      <Modal.Body className="curriculum-builder-body">
        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
          <Tab eventKey="builder" title={
            <>
              <FaBook className="me-1" />
              Builder
            </>
          }>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-2">
                <Button variant="primary" size="sm" onClick={handleAddTopic}>
                  <FaPlus className="me-1" />
                  Add Topic
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowResourceLibrary(true)}
                >
                  <FaLink className="me-1" />
                  Resource Library
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <FaCopy className="me-1" />
                  Templates
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => setShowAISuggestions(true)}
                >
                  <FaMagic className="me-1" />
                  AI Suggestions
                </Button>
              </div>
              <Button
                variant="success"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Save Curriculum
                  </>
                )}
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={curriculumData.topics.map(t => `topic-${t.topicNumber}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="topics-list">
                  {curriculumData.topics.length === 0 ? (
                    <Alert variant="info">
                      <FaExclamationTriangle className="me-2" />
                      No topics yet. Click "Add Topic" to get started.
                    </Alert>
                  ) : (
                    curriculumData.topics.map((topic, index) => (
                      <SortableTopicItem
                        key={`topic-${topic.topicNumber}`}
                        topic={topic}
                        index={index}
                        isEditing={editingTopicIndex === index}
                        onEdit={() => setEditingTopicIndex(index)}
                        onUpdate={(updates) => {
                          const newTopics = [...curriculumData.topics];
                          newTopics[index] = { ...newTopics[index], ...updates };
                          setCurriculumData({ ...curriculumData, topics: newTopics });
                        }}
                        onDelete={() => {
                          const newTopics = curriculumData.topics.filter((_, i) => i !== index);
                          newTopics.forEach((t, i) => {
                            t.topicNumber = i + 1;
                            if (t.instructionalUnits) {
                              t.instructionalUnits.forEach((unit, ui) => {
                                unit.scoNumber = `${t.topicNumber}.${ui + 1}`;
                              });
                            }
                          });
                          setCurriculumData({ ...curriculumData, topics: newTopics });
                          setEditingTopicIndex(null);
                          logChange('DELETE', `topics[${index}]`, topic, null, 'Deleted topic');
                        }}
                        onLinkResource={(resource) => handleLinkResource(resource, `topics[${index}]`)}
                        onRequestAISuggestions={() => {
                          setSelectedContext({ type: 'TOPIC', path: `topics[${index}]`, topic });
                          setShowAISuggestions(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeDragId ? (
                  <Card className="topic-card dragging">
                    <Card.Body>
                      {getDraggedItem()?.title || 'Topic'}
                    </Card.Body>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </Tab>

          <Tab eventKey="history" title={
            <>
              <FaHistory className="me-1" />
              History
            </>
          }>
            <ChangeHistoryView history={changeHistory} />
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Modal.Footer>

      {/* Resource Library Modal */}
      <ResourceLibrary
        show={showResourceLibrary}
        onHide={() => setShowResourceLibrary(false)}
        offering={offering}
        onSelectResource={(resource, linkPath) => {
          handleLinkResource(resource, linkPath);
          setShowResourceLibrary(false);
        }}
      />

      {/* Template Manager Modal */}
      <CurriculumTemplateManager
        show={showTemplates}
        onHide={() => setShowTemplates(false)}
        offering={offering}
        onSelectTemplate={(template) => {
          setCurriculumData(template.curriculum_structure);
          setShowTemplates(false);
        }}
        onSaveTemplate={(templateData) => {
          // Save current curriculum as template
          // Implementation in TemplateManager
        }}
      />

      {/* AI Suggestions Panel */}
      <AISuggestionPanel
        show={showAISuggestions}
        onHide={() => {
          setShowAISuggestions(false);
          setSelectedContext(null);
        }}
        context={selectedContext}
        offering={offering}
        onApplySuggestion={(suggestion) => {
          // Apply suggestion to curriculum
          // Implementation depends on suggestion type
        }}
      />
    </Modal>
  );
}

// Sortable Topic Item Component
function SortableTopicItem({ topic, index, isEditing, onEdit, onUpdate, onDelete, onLinkResource, onRequestAISuggestions }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `topic-${topic.topicNumber}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  if (isEditing) {
    return (
      <TopicEditor
        topic={topic}
        index={index}
        onUpdate={onUpdate}
        onCancel={() => onEdit(null)}
        onLinkResource={onLinkResource}
        onRequestAISuggestions={onRequestAISuggestions}
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`topic-card mb-3 ${isDragging ? 'dragging' : ''}`}
    >
      <Card.Header className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div
                {...attributes}
                {...listeners}
                className="drag-handle"
                style={{ cursor: 'grab' }}
              >
            <FaGripVertical />
          </div>
          <Badge bg="secondary">Topic {topic.topicNumber}</Badge>
          <strong>{topic.title || 'Untitled Topic'}</strong>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={onEdit}>
            <FaEdit />
          </Button>
          <Button variant="outline-danger" size="sm" onClick={onDelete}>
            <FaTrash />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {topic.strandIdentification && (
          <p><strong>Strand:</strong> {topic.strandIdentification}</p>
        )}
        {topic.instructionalUnits && topic.instructionalUnits.length > 0 && (
          <p><strong>Units:</strong> {topic.instructionalUnits.length}</p>
        )}
      </Card.Body>
    </Card>
  );
}

// Topic Editor Component (simplified - full implementation would be more detailed)
function TopicEditor({ topic, index, onUpdate, onCancel, onLinkResource, onRequestAISuggestions }) {
  const [formData, setFormData] = useState(topic);

  const handleSave = () => {
    onUpdate(formData);
    onCancel();
  };

  return (
    <Card className="topic-editor mb-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <strong>Editing Topic {topic.topicNumber}</strong>
          <div className="d-flex gap-2">
            <Button variant="outline-info" size="sm" onClick={onRequestAISuggestions}>
              <FaMagic className="me-1" />
              AI Suggestions
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              <FaCheck className="me-1" />
              Save
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Topic Title</Form.Label>
            <Form.Control
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter topic title"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Strand Identification</Form.Label>
            <Form.Control
              type="text"
              value={formData.strandIdentification || ''}
              onChange={(e) => setFormData({ ...formData, strandIdentification: e.target.value })}
              placeholder="Enter strand identification"
            />
          </Form.Group>
          {/* Add more fields as needed */}
        </Form>
      </Card.Body>
    </Card>
  );
}

// Change History View Component
function ChangeHistoryView({ history }) {
  if (!history || history.length === 0) {
    return <Alert variant="info">No change history available.</Alert>;
  }

  return (
    <div className="change-history">
      {history.map((change) => (
        <Card key={change.change_id} className="mb-2">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <div>
                <Badge bg={
                  change.change_type === 'CREATE' ? 'success' :
                  change.change_type === 'UPDATE' ? 'info' :
                  change.change_type === 'DELETE' ? 'danger' : 'secondary'
                }>
                  {change.change_type}
                </Badge>
                <span className="ms-2">
                  {change.changed_by_user?.first_name} {change.changed_by_user?.last_name}
                </span>
              </div>
              <small className="text-muted">
                {new Date(change.created_at).toLocaleString()}
              </small>
            </div>
            <div className="mt-2">
              <small><strong>Path:</strong> {change.change_path}</small>
              {change.change_description && (
                <p className="mb-0 mt-1">{change.change_description}</p>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export default InteractiveCurriculumBuilder;

