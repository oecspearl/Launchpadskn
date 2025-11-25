import React, { useState } from 'react';
import {
  Card, Button, Row, Col, Badge, Spinner, Alert,
  ListGroup, Modal, Form, ProgressBar
} from 'react-bootstrap';
import { FaFlask, FaPlay, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import interactiveContentService from '../../services/interactiveContentService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function VirtualLabs({ classSubjectId, classSubject, studentId = null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLab, setSelectedLab] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [labSession, setLabSession] = useState(null);
  const actualStudentId = studentId || user?.user_id;

  const subjectId = classSubject?.subject?.subject_id;

  const { data: labs = [], isLoading: isLoadingLabs } = useQuery({
    queryKey: ['virtual-labs', subjectId],
    queryFn: () => interactiveContentService.getVirtualLabs(subjectId),
    enabled: !!subjectId
  });

  const { data: labSessions = [] } = useQuery({
    queryKey: ['lab-sessions', actualStudentId, classSubjectId],
    queryFn: async () => {
      // This would fetch lab sessions from the database
      // For now, return empty array
      return [];
    },
    enabled: !!actualStudentId
  });

  const createLabSessionMutation = useMutation({
    mutationFn: (labId) => interactiveContentService.createLabSession({
      lab_id: labId,
      student_id: actualStudentId,
      class_subject_id: classSubjectId,
      session_state: {},
      actions_log: []
    }),
    onSuccess: (data) => {
      setLabSession(data);
      setShowLabModal(true);
      queryClient.invalidateQueries(['lab-sessions', actualStudentId, classSubjectId]);
    }
  });

  const updateLabSessionMutation = useMutation({
    mutationFn: ({ sessionId, updateData }) =>
      interactiveContentService.updateLabSession(sessionId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-sessions', actualStudentId, classSubjectId]);
    }
  });

  const handleStartLab = (labId) => {
    createLabSessionMutation.mutate(labId);
  };

  const handleCompleteLab = () => {
    if (labSession) {
      updateLabSessionMutation.mutate({
        sessionId: labSession.session_id,
        updateData: {
          is_completed: true,
          completed_at: new Date().toISOString(),
          completion_percentage: 100
        }
      });
      setShowLabModal(false);
      setLabSession(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HARD': return 'danger';
      case 'EXPERT': return 'dark';
      default: return 'secondary';
    }
  };

  if (isLoadingLabs) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading virtual labs...</p>
      </div>
    );
  }

  return (
    <div className="virtual-labs">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FaFlask className="me-2" />
          Virtual Labs & Simulations
        </h4>
      </div>

      {labs.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaFlask size={48} className="text-muted mb-3" />
            <h5>No Virtual Labs Available</h5>
            <p className="text-muted">
              Virtual labs and simulations will appear here for {classSubject?.subject?.subject_name || 'this subject'}.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {labs.map((lab) => {
              const session = labSessions.find(s => s.lab_id === lab.lab_id);
              return (
                <Col md={6} lg={4} key={lab.lab_id} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5>{lab.lab_name}</h5>
                        <Badge bg={getDifficultyColor(lab.difficulty_level)}>
                          {lab.difficulty_level}
                        </Badge>
                      </div>
                      <p className="text-muted small">{lab.description}</p>
                      <div className="mb-3">
                        <Badge bg="secondary" className="me-2">{lab.lab_type}</Badge>
                        {lab.simulation_type && (
                          <Badge bg="info">{lab.simulation_type}</Badge>
                        )}
                      </div>
                      {lab.estimated_duration_minutes && (
                        <div className="mb-3">
                          <FaClock className="me-1" />
                          <small className="text-muted">
                            {lab.estimated_duration_minutes} minutes
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
                                setLabSession(session);
                                setSelectedLab(lab);
                                setShowLabModal(true);
                              }}
                            >
                              <FaPlay className="me-1" />
                              Continue Lab
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          block
                          onClick={() => handleStartLab(lab.lab_id)}
                          disabled={createLabSessionMutation.isLoading}
                        >
                          <FaPlay className="me-1" />
                          {createLabSessionMutation.isLoading ? 'Starting...' : 'Start Lab'}
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

      {/* Lab Session Modal */}
      <Modal
        show={showLabModal}
        onHide={() => {
          setShowLabModal(false);
          setLabSession(null);
          setSelectedLab(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFlask className="me-2" />
            {selectedLab?.lab_name || 'Virtual Lab'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLab && (
            <div>
              <Alert variant="info">
                <h6>Lab Instructions</h6>
                <p>{selectedLab.description}</p>
                {selectedLab.instructions_url && (
                  <a href={selectedLab.instructions_url} target="_blank" rel="noopener noreferrer">
                    View Full Instructions
                  </a>
                )}
              </Alert>
              <div className="text-center py-5">
                <FaFlask size={64} className="text-primary mb-3" />
                <h5>Lab Simulation</h5>
                <p className="text-muted">
                  The interactive lab simulation would be embedded here.
                  <br />
                  This could include PhET simulations, interactive 3D models, or custom lab interfaces.
                </p>
                {selectedLab.model_url && (
                  <Button variant="outline-primary" href={selectedLab.model_url} target="_blank">
                    Open Lab Simulation
                  </Button>
                )}
              </div>
              {labSession && (
                <div className="mt-4">
                  <h6>Session Progress</h6>
                  <ProgressBar
                    now={labSession.completion_percentage || 0}
                    label={`${labSession.completion_percentage || 0}%`}
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
              setShowLabModal(false);
              setLabSession(null);
              setSelectedLab(null);
            }}
          >
            Close
          </Button>
          {labSession && !labSession.is_completed && (
            <Button variant="success" onClick={handleCompleteLab}>
              <FaCheckCircle className="me-1" />
              Complete Lab
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default VirtualLabs;

