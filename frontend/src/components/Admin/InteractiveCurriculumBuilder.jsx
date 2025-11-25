import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Card, Row, Col, Form, Badge, Alert,
  Tabs, Tab, InputGroup, Dropdown, Spinner, Tooltip, OverlayTrigger,
  ListGroup
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
      if (!user?.user_id) {
        console.warn('User ID not available for collaborative session');
        return;
      }

      try {
        // Create or get active session
        const { data: existingSession, error: sessionError } = await supabase
          .from('curriculum_editing_sessions')
          .select('*')
          .eq('offering_id', offering.offering_id)
          .eq('is_active', true)
          .maybeSingle();

        if (sessionError && sessionError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is okay
          console.warn('Could not check for existing session (table may not exist):', sessionError.message);
          return;
        }

        let currentSessionId;
        if (existingSession) {
          currentSessionId = existingSession.session_id;
        } else {
          const { data: newSession, error: insertError } = await supabase
            .from('curriculum_editing_sessions')
            .insert({
              offering_id: offering.offering_id,
              created_by: user.user_id
            })
            .select()
            .single();
          
          if (insertError) {
            console.warn('Could not create editing session (table may not exist):', insertError.message);
            return;
          }
          currentSessionId = newSession.session_id;
        }

        setSessionId(currentSessionId);

        // Join as editor
        if (user?.user_id) {
          await supabase
            .from('curriculum_session_editors')
            .upsert({
              session_id: currentSessionId,
              user_id: user.user_id,
              last_seen: new Date().toISOString()
            }, {
              onConflict: 'session_id,user_id'
            });
        }

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
            const { data: editors, error: editorsError } = await supabase
              .from('curriculum_session_editors')
              .select(`
                user_id,
                last_seen,
                users!curriculum_session_editors_user_id_fkey (user_id, email, first_name, last_name)
              `)
              .eq('session_id', currentSessionId)
              .gte('last_seen', new Date(Date.now() - 60000).toISOString()); // Active in last minute

            if (!editorsError && editors) {
              setCollaborators(editors.map(e => {
                const userData = Array.isArray(e.users) ? e.users[0] : e.users;
                return {
                  user_id: e.user_id,
                  name: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'Unknown' : 'Unknown',
                  email: userData?.email
                };
              }));
            }
          })
          .subscribe();

        // Update last_seen periodically
        const updateInterval = setInterval(async () => {
          if (user?.user_id) {
            await supabase
              .from('curriculum_session_editors')
              .update({ last_seen: new Date().toISOString() })
              .eq('session_id', currentSessionId)
              .eq('user_id', user.user_id);
          }
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
    if (!offering || !user?.user_id) return;

    try {
      const { error } = await supabase
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
      
      if (error) {
        // Table might not exist yet - silently fail
        console.warn('Could not log curriculum change (table may not exist):', error.message);
      }
    } catch (error) {
      console.warn('Error logging change:', error);
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
    if (!offering) return;

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
      
      // Broadcast update to other editors (if channel exists)
      try {
        await supabase
          .channel(`curriculum:${offering.offering_id}`)
          .send({
            type: 'broadcast',
            event: 'curriculum_saved',
            payload: { curriculum_structure: curriculumData }
          });
      } catch (broadcastError) {
        // Broadcast might fail if realtime not enabled - that's okay
        console.warn('Could not broadcast update:', broadcastError);
      }
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Failed to save curriculum. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Link resource to curriculum item
  const handleLinkResource = async (resource, linkPath) => {
    if (!offering || !user?.user_id) return;

    try {
      const { error: linkError } = await supabase
        .from('curriculum_resource_links')
        .insert({
          offering_id: offering.offering_id,
          resource_id: resource.resource_id,
          link_path: linkPath,
          created_by: user.user_id
        });

      if (linkError) {
        console.warn('Could not link resource (table may not exist):', linkError.message);
        return;
      }

      // Update resource usage count
      const { error: rpcError } = await supabase.rpc('increment_resource_usage', { 
        resource_id: resource.resource_id 
      });
      
      if (rpcError) {
        console.warn('Could not increment resource usage (function may not exist):', rpcError.message);
      }
    } catch (error) {
      console.warn('Error linking resource:', error);
    }
  };

  // Load change history
  useEffect(() => {
    if (!offering) return;

    const loadHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('curriculum_change_history')
          .select(`
            *,
            users!curriculum_change_history_changed_by_fkey (first_name, last_name, email)
          `)
          .eq('offering_id', offering.offering_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          // Table might not exist yet
          console.warn('Could not load change history (table may not exist):', error.message);
          setChangeHistory([]);
          return;
        }

        if (data) {
          // Transform the data to handle the relationship
          const transformedData = data.map(change => ({
            ...change,
            changed_by_user: Array.isArray(change.users) ? change.users[0] : change.users
          }));
          setChangeHistory(transformedData);
        }
      } catch (error) {
        console.warn('Error loading change history:', error);
        setChangeHistory([]);
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
          <Tab eventKey="frontMatter" title={
            <>
              <FaBook className="me-1" />
              Front Matter
            </>
          }>
            <FrontMatterEditor
              frontMatter={curriculumData.frontMatter}
              offering={offering}
              onUpdate={(updates) => setCurriculumData({
                ...curriculumData,
                frontMatter: { ...curriculumData.frontMatter, ...updates }
              })}
            />
          </Tab>
          <Tab eventKey="builder" title={
            <>
              <FaBook className="me-1" />
              Topics
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

// Topic Editor Component (Full Implementation)
function TopicEditor({ topic, index, onUpdate, onCancel, onLinkResource, onRequestAISuggestions }) {
  const [formData, setFormData] = useState({
    ...topic,
    essentialLearningOutcomes: topic.essentialLearningOutcomes || [],
    gradeLevelGuidelines: topic.gradeLevelGuidelines || [],
    instructionalUnits: topic.instructionalUnits || [],
    resources: topic.resources || {
      webLinks: [],
      videos: [],
      games: [],
      worksheets: []
    },
    closingFramework: topic.closingFramework || {
      essentialEducationCompetencies: [],
      crossCurricularConnections: {
        socialStudies: '',
        science: '',
        english: ''
      },
      localCultureIntegration: '',
      technologyIntegration: '',
      itemsOfInspiration: []
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);

  const handleSave = () => {
    onUpdate(formData);
    onCancel();
  };

  const handleAddOutcome = () => {
    setFormData({
      ...formData,
      essentialLearningOutcomes: [...formData.essentialLearningOutcomes, '']
    });
  };

  const handleRemoveOutcome = (idx) => {
    const updated = formData.essentialLearningOutcomes.filter((_, i) => i !== idx);
    setFormData({ ...formData, essentialLearningOutcomes: updated });
  };

  const handleAddUnit = () => {
    const newUnit = {
      unitNumber: formData.instructionalUnits.length + 1,
      scoNumber: `${formData.topicNumber}.${formData.instructionalUnits.length + 1}`,
      specificCurriculumOutcomes: '',
      inclusiveAssessmentStrategies: '',
      inclusiveLearningStrategies: '',
      activities: []
    };
    setFormData({
      ...formData,
      instructionalUnits: [...formData.instructionalUnits, newUnit]
    });
  };

  const handleUpdateUnit = (unitIndex, updates) => {
    const updatedUnits = [...formData.instructionalUnits];
    updatedUnits[unitIndex] = { ...updatedUnits[unitIndex], ...updates };
    setFormData({ ...formData, instructionalUnits: updatedUnits });
  };

  const handleDeleteUnit = (unitIndex) => {
    const updatedUnits = formData.instructionalUnits.filter((_, i) => i !== unitIndex);
    // Renumber units
    updatedUnits.forEach((unit, idx) => {
      unit.unitNumber = idx + 1;
      unit.scoNumber = `${formData.topicNumber}.${idx + 1}`;
    });
    setFormData({ ...formData, instructionalUnits: updatedUnits });
  };

  const handleAddActivity = (unitIndex) => {
    const unit = formData.instructionalUnits[unitIndex];
    const newActivity = {
      id: Date.now(),
      description: '',
      materials: [],
      duration: '',
      learningObjectives: []
    };
    const updatedActivities = [...(unit.activities || []), newActivity];
    handleUpdateUnit(unitIndex, { activities: updatedActivities });
  };

  const handleAddResource = (resourceType, resource) => {
    const updatedResources = {
      ...formData.resources,
      [resourceType]: [...(formData.resources[resourceType] || []), resource]
    };
    setFormData({ ...formData, resources: updatedResources });
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
        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
          <Tab eventKey="overview" title="Overview">
            <Form.Group className="mb-3">
              <Form.Label>Topic Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Number and Operations"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Strand Identification</Form.Label>
              <Form.Control
                type="text"
                value={formData.strandIdentification || ''}
                onChange={(e) => setFormData({ ...formData, strandIdentification: e.target.value })}
                placeholder="Strand or domain identification"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Essential Learning Outcomes</Form.Label>
              {formData.essentialLearningOutcomes.map((outcome, idx) => (
                <InputGroup key={idx} className="mb-2">
                  <Form.Control
                    type="text"
                    value={outcome}
                    onChange={(e) => {
                      const updated = [...formData.essentialLearningOutcomes];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, essentialLearningOutcomes: updated });
                    }}
                    placeholder="Learning outcome..."
                  />
                  <Button
                    variant="outline-danger"
                    onClick={() => handleRemoveOutcome(idx)}
                  >
                    <FaTrash />
                  </Button>
                </InputGroup>
              ))}
              <Button variant="outline-primary" size="sm" onClick={handleAddOutcome}>
                <FaPlus className="me-1" />
                Add Outcome
              </Button>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Grade Level Guidelines</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={Array.isArray(formData.gradeLevelGuidelines) 
                  ? formData.gradeLevelGuidelines.join('\n') 
                  : formData.gradeLevelGuidelines || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  gradeLevelGuidelines: e.target.value.split('\n').filter(l => l.trim())
                })}
                placeholder="One guideline per line..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Useful Content Knowledge</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.usefulContentKnowledge || ''}
                onChange={(e) => setFormData({ ...formData, usefulContentKnowledge: e.target.value })}
                placeholder="Key content knowledge for this topic..."
              />
            </Form.Group>
          </Tab>

          <Tab eventKey="units" title={`Units (${formData.instructionalUnits.length})`}>
            <div className="mb-3">
              <Button variant="primary" size="sm" onClick={handleAddUnit}>
                <FaPlus className="me-1" />
                Add Unit
              </Button>
            </div>

            <UnitList
              units={formData.instructionalUnits}
              topicNumber={formData.topicNumber}
              onUpdate={handleUpdateUnit}
              onDelete={handleDeleteUnit}
              onAddActivity={handleAddActivity}
            />
          </Tab>

          <Tab eventKey="resources" title="Resources">
            <ResourceManager
              resources={formData.resources}
              onAddResource={handleAddResource}
              onLinkResource={onLinkResource}
            />
          </Tab>

          <Tab eventKey="framework" title="Closing Framework">
            <ClosingFrameworkEditor
              framework={formData.closingFramework}
              onUpdate={(updates) => setFormData({ ...formData, closingFramework: { ...formData.closingFramework, ...updates } })}
            />
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

// Unit List Component with Drag-and-Drop
function UnitList({ units, topicNumber, onUpdate, onDelete, onAddActivity }) {
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveDragId(null);
      return;
    }

    const oldIndex = units.findIndex(u => `unit-${u.unitNumber}` === active.id);
    const newIndex = units.findIndex(u => `unit-${u.unitNumber}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newUnits = arrayMove(units, oldIndex, newIndex);
      // Renumber units
      newUnits.forEach((unit, idx) => {
        unit.unitNumber = idx + 1;
        unit.scoNumber = `${topicNumber}.${idx + 1}`;
        onUpdate(idx, { ...unit, unitNumber: idx + 1, scoNumber: `${topicNumber}.${idx + 1}` });
      });
    }
    setActiveDragId(null);
  };

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  if (units.length === 0) {
    return <Alert variant="info">No units yet. Click "Add Unit" to get started.</Alert>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={units.map(u => `unit-${u.unitNumber}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="units-list">
          {units.map((unit, index) => (
            <SortableUnitItem
              key={`unit-${unit.unitNumber}`}
              unit={unit}
              index={index}
              topicNumber={topicNumber}
              isEditing={editingUnitIndex === index}
              onEdit={() => setEditingUnitIndex(index)}
              onUpdate={(updates) => {
                onUpdate(index, updates);
                setEditingUnitIndex(null);
              }}
              onCancel={() => setEditingUnitIndex(null)}
              onDelete={() => {
                onDelete(index);
                setEditingUnitIndex(null);
              }}
              onAddActivity={() => onAddActivity(index)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeDragId ? (
          <Card className="unit-card dragging">
            <Card.Body>
              Unit {units.find(u => `unit-${u.unitNumber}` === activeDragId)?.unitNumber}
            </Card.Body>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Sortable Unit Item
function SortableUnitItem({ unit, index, topicNumber, isEditing, onEdit, onUpdate, onCancel, onDelete, onAddActivity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `unit-${unit.unitNumber}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  if (isEditing) {
    return (
      <UnitEditor
        unit={unit}
        topicNumber={topicNumber}
        onUpdate={onUpdate}
        onCancel={onCancel}
        onAddActivity={onAddActivity}
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`unit-card mb-3 ${isDragging ? 'dragging' : ''}`}
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
          <Badge bg="info">Unit {unit.unitNumber}</Badge>
          <strong>SCO {unit.scoNumber}</strong>
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
        {unit.specificCurriculumOutcomes && (
          <p className="small text-muted mb-1">
            <strong>SCOs:</strong> {unit.specificCurriculumOutcomes.substring(0, 100)}
            {unit.specificCurriculumOutcomes.length > 100 ? '...' : ''}
          </p>
        )}
        {unit.activities && unit.activities.length > 0 && (
          <Badge bg="secondary">{unit.activities.length} Activities</Badge>
        )}
      </Card.Body>
    </Card>
  );
}

// Unit Editor Component
function UnitEditor({ unit, topicNumber, onUpdate, onCancel, onAddActivity }) {
  const [formData, setFormData] = useState({
    ...unit,
    activities: unit.activities || []
  });

  const handleSave = () => {
    onUpdate(formData);
  };

  const handleUpdateActivity = (activityIndex, updates) => {
    const updatedActivities = [...formData.activities];
    updatedActivities[activityIndex] = { ...updatedActivities[activityIndex], ...updates };
    setFormData({ ...formData, activities: updatedActivities });
  };

  const handleDeleteActivity = (activityIndex) => {
    const updatedActivities = formData.activities.filter((_, i) => i !== activityIndex);
    setFormData({ ...formData, activities: updatedActivities });
  };

  return (
    <Card className="unit-editor mb-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <strong>Editing Unit {unit.unitNumber} - SCO {unit.scoNumber}</strong>
          <div className="d-flex gap-2">
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
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Specific Curriculum Outcomes (SCOs) *</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={formData.specificCurriculumOutcomes || ''}
                onChange={(e) => setFormData({ ...formData, specificCurriculumOutcomes: e.target.value })}
                placeholder="Numbered learning objectives..."
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Inclusive Assessment Strategies</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={formData.inclusiveAssessmentStrategies || ''}
                onChange={(e) => setFormData({ ...formData, inclusiveAssessmentStrategies: e.target.value })}
                placeholder="Assessment methods and strategies..."
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Inclusive Learning Strategies</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={formData.inclusiveLearningStrategies || ''}
                onChange={(e) => setFormData({ ...formData, inclusiveLearningStrategies: e.target.value })}
                placeholder="Teaching and learning strategies..."
              />
            </Form.Group>
          </Col>
        </Row>

        <hr />
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6>Activities ({formData.activities.length})</h6>
          <Button variant="outline-primary" size="sm" onClick={onAddActivity}>
            <FaPlus className="me-1" />
            Add Activity
          </Button>
        </div>

        {formData.activities.map((activity, idx) => (
          <Card key={activity.id || idx} className="mb-2">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <strong>Activity {idx + 1}</strong>
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteActivity(idx)}>
                  <FaTrash />
                </Button>
              </div>
              <Form.Group className="mb-2">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={activity.description || ''}
                  onChange={(e) => handleUpdateActivity(idx, { description: e.target.value })}
                  placeholder="Activity description..."
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Duration</Form.Label>
                    <Form.Control
                      type="text"
                      value={activity.duration || ''}
                      onChange={(e) => handleUpdateActivity(idx, { duration: e.target.value })}
                      placeholder="e.g., 30 minutes"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Materials (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      value={Array.isArray(activity.materials) ? activity.materials.join(', ') : activity.materials || ''}
                      onChange={(e) => handleUpdateActivity(idx, {
                        materials: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                      })}
                      placeholder="Material 1, Material 2..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </Card.Body>
    </Card>
  );
}

// Resource Manager Component
function ResourceManager({ resources, onAddResource, onLinkResource }) {
  const [showResourceLibrary, setShowResourceLibrary] = useState(false);

  return (
    <div>
      <div className="mb-3">
        <Button variant="primary" size="sm" onClick={() => setShowResourceLibrary(true)}>
          <FaLink className="me-1" />
          Link from Library
        </Button>
      </div>

      <Tabs defaultActiveKey="webLinks">
        <Tab eventKey="webLinks" title={`Web Links (${resources.webLinks?.length || 0})`}>
          <ResourceList
            resources={resources.webLinks || []}
            type="webLinks"
            onAdd={(url) => onAddResource('webLinks', { url, title: url })}
          />
        </Tab>
        <Tab eventKey="videos" title={`Videos (${resources.videos?.length || 0})`}>
          <ResourceList
            resources={resources.videos || []}
            type="videos"
            onAdd={(url) => onAddResource('videos', { url, title: url })}
          />
        </Tab>
        <Tab eventKey="games" title={`Games (${resources.games?.length || 0})`}>
          <ResourceList
            resources={resources.games || []}
            type="games"
            onAdd={(url) => onAddResource('games', { url, title: url })}
          />
        </Tab>
        <Tab eventKey="worksheets" title={`Worksheets (${resources.worksheets?.length || 0})`}>
          <ResourceList
            resources={resources.worksheets || []}
            type="worksheets"
            onAdd={(url) => onAddResource('worksheets', { url, title: url })}
          />
        </Tab>
      </Tabs>
    </div>
  );
}

function ResourceList({ resources, type, onAdd }) {
  const [newResource, setNewResource] = useState('');

  const handleAdd = () => {
    if (newResource.trim()) {
      onAdd(newResource);
      setNewResource('');
    }
  };

  return (
    <div>
      <InputGroup className="mb-3">
        <Form.Control
          type="url"
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
          placeholder="Enter resource URL..."
        />
        <Button variant="primary" onClick={handleAdd}>
          <FaPlus />
        </Button>
      </InputGroup>
      {resources.length === 0 ? (
        <Alert variant="info">No {type} added yet.</Alert>
      ) : (
        <ListGroup>
          {resources.map((resource, idx) => (
            <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
              <a href={resource.url || resource} target="_blank" rel="noopener noreferrer">
                {resource.title || resource.url || resource}
              </a>
              <Button variant="outline-danger" size="sm">
                <FaTrash />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}

// Closing Framework Editor Component
function ClosingFrameworkEditor({ framework, onUpdate }) {
  const [formData, setFormData] = useState(framework || {
    essentialEducationCompetencies: [],
    crossCurricularConnections: {
      socialStudies: '',
      science: '',
      english: ''
    },
    localCultureIntegration: '',
    technologyIntegration: '',
    itemsOfInspiration: []
  });

  const handleSave = () => {
    onUpdate(formData);
  };

  const handleAddCompetency = () => {
    setFormData({
      ...formData,
      essentialEducationCompetencies: [...(formData.essentialEducationCompetencies || []), '']
    });
  };

  const handleAddInspiration = () => {
    setFormData({
      ...formData,
      itemsOfInspiration: [...(formData.itemsOfInspiration || []), '']
    });
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>Essential Education Competencies</Form.Label>
        {(formData.essentialEducationCompetencies || []).map((comp, idx) => (
          <InputGroup key={idx} className="mb-2">
            <Form.Control
              type="text"
              value={comp}
              onChange={(e) => {
                const updated = [...formData.essentialEducationCompetencies];
                updated[idx] = e.target.value;
                setFormData({ ...formData, essentialEducationCompetencies: updated });
              }}
            />
            <Button variant="outline-danger" onClick={() => {
              const updated = formData.essentialEducationCompetencies.filter((_, i) => i !== idx);
              setFormData({ ...formData, essentialEducationCompetencies: updated });
            }}>
              <FaTrash />
            </Button>
          </InputGroup>
        ))}
        <Button variant="outline-primary" size="sm" onClick={handleAddCompetency}>
          <FaPlus className="me-1" />
          Add Competency
        </Button>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Cross-Curricular Connections</Form.Label>
        <Row>
          <Col md={4}>
            <Form.Label>Social Studies</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.crossCurricularConnections?.socialStudies || ''}
              onChange={(e) => setFormData({
                ...formData,
                crossCurricularConnections: {
                  ...formData.crossCurricularConnections,
                  socialStudies: e.target.value
                }
              })}
            />
          </Col>
          <Col md={4}>
            <Form.Label>Science</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.crossCurricularConnections?.science || ''}
              onChange={(e) => setFormData({
                ...formData,
                crossCurricularConnections: {
                  ...formData.crossCurricularConnections,
                  science: e.target.value
                }
              })}
            />
          </Col>
          <Col md={4}>
            <Form.Label>English</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.crossCurricularConnections?.english || ''}
              onChange={(e) => setFormData({
                ...formData,
                crossCurricularConnections: {
                  ...formData.crossCurricularConnections,
                  english: e.target.value
                }
              })}
            />
          </Col>
        </Row>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Local Culture Integration</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={formData.localCultureIntegration || ''}
          onChange={(e) => setFormData({ ...formData, localCultureIntegration: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Technology Integration</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={formData.technologyIntegration || ''}
          onChange={(e) => setFormData({ ...formData, technologyIntegration: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Items of Inspiration</Form.Label>
        {(formData.itemsOfInspiration || []).map((item, idx) => (
          <InputGroup key={idx} className="mb-2">
            <Form.Control
              type="text"
              value={item}
              onChange={(e) => {
                const updated = [...formData.itemsOfInspiration];
                updated[idx] = e.target.value;
                setFormData({ ...formData, itemsOfInspiration: updated });
              }}
            />
            <Button variant="outline-danger" onClick={() => {
              const updated = formData.itemsOfInspiration.filter((_, i) => i !== idx);
              setFormData({ ...formData, itemsOfInspiration: updated });
            }}>
              <FaTrash />
            </Button>
          </InputGroup>
        ))}
        <Button variant="outline-primary" size="sm" onClick={handleAddInspiration}>
          <FaPlus className="me-1" />
          Add Item
        </Button>
      </Form.Group>

      <Button variant="primary" onClick={handleSave}>
        <FaCheck className="me-1" />
        Save Framework
      </Button>
    </div>
  );
}

// Front Matter Editor Component
function FrontMatterEditor({ frontMatter, offering, onUpdate }) {
  const [formData, setFormData] = useState({
    coverPage: frontMatter?.coverPage || {
      ministryBranding: true,
      title: '',
      academicYear: offering?.form?.academic_year || '2024-2025',
      subjectName: offering?.subject?.subject_name || ''
    },
    introduction: frontMatter?.introduction || ''
  });

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <h5>Cover Page</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Curriculum Title</Form.Label>
            <Form.Control
              type="text"
              value={formData.coverPage.title || ''}
              onChange={(e) => setFormData({
                ...formData,
                coverPage: { ...formData.coverPage, title: e.target.value }
              })}
              placeholder="e.g., Mathematics Curriculum - Form 1"
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Academic Year</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.coverPage.academicYear || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    coverPage: { ...formData.coverPage, academicYear: e.target.value }
                  })}
                  placeholder="2024-2025"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subject Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.coverPage.subjectName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    coverPage: { ...formData.coverPage, subjectName: e.target.value }
                  })}
                  placeholder="Subject name"
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Check
            type="checkbox"
            label="Include Ministry of Education Branding"
            checked={formData.coverPage.ministryBranding || false}
            onChange={(e) => setFormData({
              ...formData,
              coverPage: { ...formData.coverPage, ministryBranding: e.target.checked }
            })}
          />
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          <h5>Introduction</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>Curriculum Introduction</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={formData.introduction || ''}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
              placeholder="Explain the educational vision and competencies for Saint Kitts and Nevis..."
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Button variant="primary" onClick={handleSave}>
        <FaSave className="me-1" />
        Save Front Matter
      </Button>
    </div>
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

