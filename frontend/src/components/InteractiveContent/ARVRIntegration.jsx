import React, { useState, useCallback } from 'react';
import {
  Card, Button, Row, Col, Badge, Spinner, Alert,
  ListGroup, Modal, ProgressBar
} from 'react-bootstrap';
import { FaCube, FaPlay, FaCheckCircle, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import interactiveContentService from '../../services/interactiveContentService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import ThreeDModelViewer from './Viewers/ThreeDModelViewer';
import WebXRViewer from './Viewers/WebXRViewer';
import ARViewer from './Viewers/ARViewer';
import VirtualFieldTripViewer from './Viewers/VirtualFieldTripViewer';

function ARVRIntegration({ classSubjectId, classSubject, studentId = null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentSession, setContentSession] = useState(null);
  const actualStudentId = studentId || user?.user_id;

  const subjectId = classSubject?.subject?.subject_id;

  const { data: arvrContent = [], isLoading: isLoadingContent } = useQuery({
    queryKey: ['arvr-content', subjectId, classSubjectId],
    queryFn: () => interactiveContentService.getARVRContent(subjectId, null, classSubjectId),
    enabled: !!subjectId
  });

  const { data: arvrSessions = [] } = useQuery({
    queryKey: ['arvr-sessions', actualStudentId, classSubjectId],
    queryFn: async () => {
      // This would fetch AR/VR sessions from the database
      return [];
    },
    enabled: !!actualStudentId
  });

  const createARVRSessionMutation = useMutation({
    mutationFn: (contentId) => interactiveContentService.createARVRSession({
      content_id: contentId,
      student_id: actualStudentId,
      class_subject_id: classSubjectId,
      session_state: {},
      interactions_log: []
    }),
    onSuccess: (data) => {
      setContentSession(data);
      setShowContentModal(true);
      queryClient.invalidateQueries(['arvr-sessions', actualStudentId, classSubjectId]);
    }
  });

  const updateARVRSessionMutation = useMutation({
    mutationFn: ({ sessionId, updateData }) =>
      interactiveContentService.updateARVRSession(sessionId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(['arvr-sessions', actualStudentId, classSubjectId]);
    }
  });

  // Handle interactions and state changes
  const handleInteraction = useCallback((interaction) => {
    if (contentSession) {
      const currentLog = contentSession.interactions_log || [];
      const updatedLog = [...currentLog, interaction];
      
      updateARVRSessionMutation.mutate({
        sessionId: contentSession.session_id,
        updateData: {
          interactions_log: updatedLog
        }
      });
    }
  }, [contentSession, updateARVRSessionMutation]);

  const handleStateChange = useCallback((state) => {
    if (contentSession) {
      updateARVRSessionMutation.mutate({
        sessionId: contentSession.session_id,
        updateData: {
          session_state: state,
          last_accessed: new Date().toISOString()
        }
      });
    }
  }, [contentSession, updateARVRSessionMutation]);

  const handleStartContent = (contentId) => {
    createARVRSessionMutation.mutate(contentId);
  };

  const handleCompleteContent = () => {
    if (contentSession) {
      updateARVRSessionMutation.mutate({
        sessionId: contentSession.session_id,
        updateData: {
          is_completed: true,
          completed_at: new Date().toISOString(),
          completion_percentage: 100
        }
      });
      setShowContentModal(false);
      setContentSession(null);
    }
  };

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case '3D_MODEL': return <FaCube />;
      case 'AR_OVERLAY': return <FaGlobe />;
      case 'VR_EXPERIENCE': return <FaCube />;
      case 'FIELD_TRIP': return <FaMapMarkerAlt />;
      default: return <FaCube />;
    }
  };

  const getContentTypeColor = (contentType) => {
    switch (contentType) {
      case '3D_MODEL': return 'primary';
      case 'AR_OVERLAY': return 'info';
      case 'VR_EXPERIENCE': return 'warning';
      case 'FIELD_TRIP': return 'success';
      default: return 'secondary';
    }
  };

  if (isLoadingContent) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading AR/VR content...</p>
      </div>
    );
  }

  return (
    <div className="arvr-integration">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FaCube className="me-2" />
          AR/VR Integration
        </h4>
      </div>

      {arvrContent.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaCube size={48} className="text-muted mb-3" />
            <h5>No AR/VR Content Available</h5>
            <p className="text-muted">
              AR/VR content including 3D models, virtual field trips, and immersive experiences will appear here.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {arvrContent.map((content) => {
              const session = arvrSessions.find(s => s.content_id === content.content_id);
              return (
                <Col md={6} lg={4} key={content.content_id} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5>{content.content_name}</h5>
                        <Badge bg={getContentTypeColor(content.content_type)}>
                          {getContentTypeIcon(content.content_type)}
                          {' '}
                          {content.content_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted small">{content.description}</p>
                      <div className="mb-3">
                        {content.location_name && (
                          <div className="mb-2">
                            <FaMapMarkerAlt className="me-1" />
                            <small className="text-muted">{content.location_name}</small>
                          </div>
                        )}
                        {content.platform && (
                          <Badge bg="secondary" className="me-2">{content.platform}</Badge>
                        )}
                        {content.model_format && (
                          <Badge bg="info">{content.model_format}</Badge>
                        )}
                      </div>
                      {content.estimated_duration_minutes && (
                        <div className="mb-3">
                          <small className="text-muted">
                            Duration: {content.estimated_duration_minutes} minutes
                          </small>
                        </div>
                      )}
                      {session ? (
                        <div>
                          <div className="mb-2">
                            <small className="text-muted">Progress</small>
                            <ProgressBar
                              now={session.completion_percentage || 0}
                              label={`${session.completion_percentage || 0}%`}
                              variant={session.is_completed ? 'success' : 'primary'}
                            />
                          </div>
                          {session.is_completed ? (
                            <Button variant="success" size="sm" block disabled>
                              <FaCheckCircle className="me-1" />
                              Completed
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              block
                              onClick={() => {
                                setContentSession(session);
                                setSelectedContent(content);
                                setShowContentModal(true);
                              }}
                            >
                              <FaPlay className="me-1" />
                              Continue Experience
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          block
                          onClick={() => handleStartContent(content.content_id)}
                          disabled={createARVRSessionMutation.isLoading}
                        >
                          <FaPlay className="me-1" />
                          {createARVRSessionMutation.isLoading ? 'Starting...' : 'Start Experience'}
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}

      {/* AR/VR Content Modal */}
      <Modal
        show={showContentModal}
        onHide={() => {
          setShowContentModal(false);
          setContentSession(null);
          setSelectedContent(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {getContentTypeIcon(selectedContent?.content_type)}
            {' '}
            {selectedContent?.content_name || 'AR/VR Experience'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContent && (
            <div>
              <Alert variant="info">
                <h6>Experience Overview</h6>
                <p>{selectedContent.description}</p>
                {selectedContent.location_name && (
                  <p>
                    <FaMapMarkerAlt className="me-1" />
                    <strong>Location:</strong> {selectedContent.location_name}
                  </p>
                )}
              </Alert>

              {/* 3D Model Viewer */}
              {selectedContent.content_type === '3D_MODEL' && (
                <ThreeDModelViewer
                  contentUrl={selectedContent.content_url}
                  modelFormat={selectedContent.model_format}
                  modelProperties={selectedContent.model_properties || {}}
                  annotations={selectedContent.annotations || []}
                  interactionMode={selectedContent.interaction_mode || 'INTERACTIVE'}
                  onInteraction={handleInteraction}
                  onStateChange={handleStateChange}
                />
              )}

              {/* VR Experience Viewer */}
              {selectedContent.content_type === 'VR_EXPERIENCE' && (
                <WebXRViewer
                  contentUrl={selectedContent.content_url}
                  sceneConfig={selectedContent.vr_scene_config || {}}
                  onInteraction={handleInteraction}
                  onStateChange={handleStateChange}
                  onVREnter={() => {
                    handleInteraction({ type: 'vr_enter', timestamp: new Date().toISOString() });
                  }}
                  onVRExit={() => {
                    handleInteraction({ type: 'vr_exit', timestamp: new Date().toISOString() });
                  }}
                />
              )}

              {/* AR Overlay Viewer */}
              {selectedContent.content_type === 'AR_OVERLAY' && (
                <ARViewer
                  contentUrl={selectedContent.content_url}
                  arMarkerUrl={selectedContent.ar_marker_url}
                  modelFormat={selectedContent.model_format}
                  platform={selectedContent.platform || 'WEBXR'}
                  onInteraction={handleInteraction}
                  onStateChange={handleStateChange}
                />
              )}

              {/* Virtual Field Trip Viewer */}
              {selectedContent.content_type === 'FIELD_TRIP' && (
                <VirtualFieldTripViewer
                  virtualTourUrl={selectedContent.virtual_tour_url}
                  locationName={selectedContent.location_name}
                  locationCoordinates={selectedContent.location_coordinates}
                  scenes={selectedContent.vr_scene_config?.scenes || []}
                  onStateChange={handleStateChange}
                  onInteraction={handleInteraction}
                />
              )}

              {/* Fallback for unsupported types */}
              {!['3D_MODEL', 'VR_EXPERIENCE', 'AR_OVERLAY', 'FIELD_TRIP'].includes(selectedContent.content_type) && (
                <div className="text-center py-5">
                  <FaCube size={64} className="text-muted mb-3" />
                  <h5>Content Type: {selectedContent.content_type}</h5>
                  <p className="text-muted">
                    Viewer for this content type is not yet implemented.
                  </p>
                  {selectedContent.content_url && (
                    <Button variant="outline-primary" href={selectedContent.content_url} target="_blank">
                      Open External Link
                    </Button>
                  )}
                </div>
              )}
              {contentSession && (
                <div className="mt-4">
                  <h6>Session Progress</h6>
                  <ProgressBar
                    now={contentSession.completion_percentage || 0}
                    label={`${contentSession.completion_percentage || 0}%`}
                    variant="primary"
                  />
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowContentModal(false);
              setContentSession(null);
              setSelectedContent(null);
            }}
          >
            Close
          </Button>
          {contentSession && !contentSession.is_completed && (
            <Button variant="success" onClick={handleCompleteContent}>
              <FaCheckCircle className="me-1" />
              Complete Experience
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ARVRIntegration;

