import React, { useState, useEffect } from 'react';
import {
  Card, Button, ProgressBar, Badge, Spinner, Alert,
  ListGroup, Modal, Form
} from 'react-bootstrap';
import { FaRoute, FaCheckCircle, FaLock, FaPlay, FaChartLine } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import interactiveContentService from '../../services/interactiveContentService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function AdaptiveLearningPaths({ classSubjectId, classSubject, studentId = null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPath, setSelectedPath] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPathData, setNewPathData] = useState({
    path_name: '',
    path_type: 'PERFORMANCE_BASED',
    difficulty_level: 'MEDIUM'
  });

  const actualStudentId = studentId || user?.user_id;

  const { data: learningPath, isLoading: isLoadingPath } = useQuery({
    queryKey: ['learning-path', actualStudentId, classSubjectId],
    queryFn: () => interactiveContentService.getStudentLearningPath(actualStudentId, classSubjectId),
    enabled: !!actualStudentId
  });

  const { data: stages = [], isLoading: isLoadingStages } = useQuery({
    queryKey: ['learning-path-stages', learningPath?.path_id],
    queryFn: () => interactiveContentService.getLearningPathStages(learningPath?.path_id),
    enabled: !!learningPath?.path_id
  });

  const createPathMutation = useMutation({
    mutationFn: (data) => interactiveContentService.createLearningPath({
      ...data,
      student_id: actualStudentId,
      class_subject_id: classSubjectId,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['learning-path', actualStudentId, classSubjectId]);
      setShowCreateModal(false);
      setNewPathData({ path_name: '', path_type: 'PERFORMANCE_BASED', difficulty_level: 'MEDIUM' });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ pathId, stageId, score }) =>
      interactiveContentService.updatePathProgress(pathId, stageId, score),
    onSuccess: () => {
      queryClient.invalidateQueries(['learning-path', actualStudentId, classSubjectId]);
      queryClient.invalidateQueries(['learning-path-stages', learningPath?.path_id]);
    }
  });

  const handleCreatePath = (e) => {
    e.preventDefault();
    createPathMutation.mutate(newPathData);
  };

  const handleStageComplete = (stageId, score) => {
    if (learningPath?.path_id) {
      updateProgressMutation.mutate({
        pathId: learningPath.path_id,
        stageId,
        score
      });
    }
  };

  if (isLoadingPath) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading learning path...</p>
      </div>
    );
  }

  return (
    <div className="adaptive-learning-paths">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FaRoute className="me-2" />
          Adaptive Learning Paths
        </h4>
        {!learningPath && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Learning Path
          </Button>
        )}
      </div>

      {!learningPath ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaRoute size={48} className="text-muted mb-3" />
            <h5>No Active Learning Path</h5>
            <p className="text-muted">
              Create a personalized learning path that adapts based on your performance.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Learning Path
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{learningPath.path_name}</h5>
                  <small className="text-muted">
                    {learningPath.path_type.replace('_', ' ')} • {learningPath.difficulty_level}
                  </small>
                </div>
                <Badge bg={learningPath.is_active ? 'success' : 'secondary'}>
                  {learningPath.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Overall Progress</span>
                  <span>{learningPath.overall_progress?.toFixed(1)}%</span>
                </div>
                <ProgressBar
                  now={learningPath.overall_progress || 0}
                  label={`${learningPath.overall_progress?.toFixed(1)}%`}
                  variant="success"
                />
              </div>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted">Current Stage</small>
                  <p className="mb-0">{learningPath.current_stage} / {learningPath.total_stages}</p>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Average Performance</small>
                  <p className="mb-0">{learningPath.average_performance?.toFixed(1)}%</p>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Mastery Level</small>
                  <p className="mb-0">
                    <Badge bg="info">{learningPath.mastery_level}</Badge>
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Learning Stages</h5>
            </Card.Header>
            <Card.Body>
              {isLoadingStages ? (
                <div className="text-center py-3">
                  <Spinner size="sm" />
                </div>
              ) : stages.length === 0 ? (
                <Alert variant="info">No stages available yet. Stages will be added based on your progress.</Alert>
              ) : (
                <ListGroup variant="flush">
                  {stages.map((stage, index) => (
                    <ListGroup.Item key={stage.stage_id} className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          {stage.is_completed ? (
                            <FaCheckCircle className="text-success me-2" />
                          ) : index === 0 || stages[index - 1]?.is_completed ? (
                            <FaPlay className="text-primary me-2" />
                          ) : (
                            <FaLock className="text-muted me-2" />
                          )}
                          <strong>{stage.stage_number}. {stage.stage_name}</strong>
                          {stage.is_completed && stage.score && (
                            <Badge bg="success" className="ms-2">{stage.score}%</Badge>
                          )}
                        </div>
                        {stage.description && (
                          <small className="text-muted">{stage.description}</small>
                        )}
                        {stage.content_type && (
                          <Badge bg="secondary" className="ms-2">{stage.content_type}</Badge>
                        )}
                      </div>
                      {stage.is_completed ? (
                        <Badge bg="success">Completed</Badge>
                      ) : index === 0 || stages[index - 1]?.is_completed ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStageComplete(stage.stage_id, 85)}
                        >
                          Complete Stage
                        </Button>
                      ) : (
                        <Badge bg="secondary">Locked</Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* Create Path Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Learning Path</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreatePath}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Path Name</Form.Label>
              <Form.Control
                type="text"
                value={newPathData.path_name}
                onChange={(e) => setNewPathData({ ...newPathData, path_name: e.target.value })}
                placeholder="e.g., Advanced Mathematics Path"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Path Type</Form.Label>
              <Form.Select
                value={newPathData.path_type}
                onChange={(e) => setNewPathData({ ...newPathData, path_type: e.target.value })}
              >
                <option value="PERFORMANCE_BASED">Performance Based</option>
                <option value="INTEREST_BASED">Interest Based</option>
                <option value="MIXED">Mixed</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Initial Difficulty Level</Form.Label>
              <Form.Select
                value={newPathData.difficulty_level}
                onChange={(e) => setNewPathData({ ...newPathData, difficulty_level: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EXPERT">Expert</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createPathMutation.isLoading}>
              {createPathMutation.isLoading ? 'Creating...' : 'Create Path'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default AdaptiveLearningPaths;

