import React, { useState } from 'react';
import {
  Card, Button, Form, Badge, Spinner, Alert,
  ListGroup, Modal, Tab, Nav, Row, Col
} from 'react-bootstrap';
import { FaComments, FaPlus, FaThumbsUp, FaReply, FaCheckCircle, FaStar } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import interactiveContentService from '../../services/interactiveContentService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function SocialLearning({ classSubjectId, classSubject, studentId = null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('forums');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ topic_title: '', topic_content: '' });
  const [newPost, setNewPost] = useState({ post_content: '' });

  const actualStudentId = studentId || user?.user_id;

  // Forums - In a real app, you'd fetch forums for the class-subject
  const { data: forums = [] } = useQuery({
    queryKey: ['forums', classSubjectId],
    queryFn: async () => {
      // This would fetch forums from the database
      // For now, return a mock forum
      return [{
        forum_id: 1,
        forum_name: `${classSubject?.subject?.subject_name || 'Subject'} Discussion`,
        description: 'Discuss topics, ask questions, and share ideas',
        total_topics: 0,
        total_posts: 0
      }];
    },
    enabled: !!classSubjectId
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['forum-topics', selectedTopic?.forum_id || forums[0]?.forum_id],
    queryFn: () => interactiveContentService.getForumTopics(selectedTopic?.forum_id || forums[0]?.forum_id),
    enabled: !!(selectedTopic?.forum_id || forums[0]?.forum_id)
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['forum-posts', selectedTopic?.topic_id],
    queryFn: () => interactiveContentService.getForumPosts(selectedTopic?.topic_id),
    enabled: !!selectedTopic?.topic_id
  });

  const createTopicMutation = useMutation({
    mutationFn: (data) => interactiveContentService.createForumTopic({
      ...data,
      forum_id: forums[0]?.forum_id,
      created_by: actualStudentId,
      is_approved: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-topics']);
      setShowTopicModal(false);
      setNewTopic({ topic_title: '', topic_content: '' });
    }
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => interactiveContentService.createForumPost({
      ...data,
      topic_id: selectedTopic?.topic_id,
      created_by: actualStudentId,
      is_approved: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-posts', selectedTopic?.topic_id]);
      setShowPostModal(false);
      setNewPost({ post_content: '' });
    }
  });

  const handleCreateTopic = (e) => {
    e.preventDefault();
    createTopicMutation.mutate(newTopic);
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    createPostMutation.mutate(newPost);
  };

  return (
    <div className="social-learning">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FaComments className="me-2" />
          Social Learning
        </h4>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="forums">Discussion Forums</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="peer-review">Peer Review</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="forums">
            {!selectedTopic ? (
              <Row>
                <Col md={8}>
                  <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Discussion Forums</h6>
                      <Button size="sm" variant="primary" onClick={() => setShowTopicModal(true)}>
                        <FaPlus className="me-1" />
                        New Topic
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      {forums.length === 0 ? (
                        <Alert variant="info">No forums available yet.</Alert>
                      ) : (
                        forums.map((forum) => (
                          <Card key={forum.forum_id} className="mb-3">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h5>{forum.forum_name}</h5>
                                  <p className="text-muted mb-2">{forum.description}</p>
                                  <div>
                                    <Badge bg="secondary" className="me-2">
                                      {topics.length} Topics
                                    </Badge>
                                    <Badge bg="secondary">
                                      {forum.total_posts} Posts
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  variant="outline-primary"
                                  onClick={() => setSelectedTopic({ forum_id: forum.forum_id, type: 'forum' })}
                                >
                                  View Topics
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        ))
                      )}
                    </Card.Body>
                  </Card>

                  {topics.length > 0 && (
                    <Card className="mt-3">
                      <Card.Header>
                        <h6 className="mb-0">Topics</h6>
                      </Card.Header>
                      <Card.Body>
                        <ListGroup variant="flush">
                          {topics.map((topic) => (
                            <ListGroup.Item
                              key={topic.topic_id}
                              className="d-flex justify-content-between align-items-start cursor-pointer"
                              onClick={() => setSelectedTopic({ ...topic, type: 'topic' })}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-1">
                                  {topic.is_pinned && <Badge bg="warning" className="me-2">Pinned</Badge>}
                                  <h6 className="mb-0">{topic.topic_title}</h6>
                                </div>
                                <small className="text-muted">
                                  By {topic.created_by_name} • {new Date(topic.created_at).toLocaleDateString()}
                                </small>
                              </div>
                              <div className="text-end">
                                <div>
                                  <Badge bg="secondary">{topic.reply_count} replies</Badge>
                                </div>
                                {topic.last_reply_at && (
                                  <small className="text-muted d-block">
                                    Last: {new Date(topic.last_reply_at).toLocaleDateString()}
                                  </small>
                                )}
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            ) : selectedTopic.type === 'topic' ? (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <Button variant="link" className="p-0" onClick={() => setSelectedTopic(null)}>
                      ← Back to Topics
                    </Button>
                    <h5 className="mb-0 mt-2">{selectedTopic.topic_title}</h5>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setShowPostModal(true)}>
                    <FaReply className="me-1" />
                    Reply
                  </Button>
                </Card.Header>
                <Card.Body>
                  {posts.length === 0 ? (
                    <Alert variant="info">No replies yet. Be the first to reply!</Alert>
                  ) : (
                    <ListGroup variant="flush">
                      {posts.map((post) => (
                        <ListGroup.Item key={post.post_id} className="mb-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <strong>{post.created_by_name}</strong>
                              {post.is_best_answer && (
                                <Badge bg="success" className="ms-2">
                                  <FaCheckCircle className="me-1" />
                                  Best Answer
                                </Badge>
                              )}
                            </div>
                            <small className="text-muted">
                              {new Date(post.created_at).toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-2">{post.post_content}</p>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary">
                              <FaThumbsUp className="me-1" />
                              Like ({post.like_count || 0})
                            </Button>
                            <Button size="sm" variant="outline-secondary">
                              <FaReply className="me-1" />
                              Reply
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            ) : null}
          </Tab.Pane>

          <Tab.Pane eventKey="peer-review">
            <Card>
              <Card.Body>
                <Alert variant="info">
                  <FaStar className="me-2" />
                  Peer Review feature coming soon! Students will be able to review each other's work here.
                </Alert>
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Create Topic Modal */}
      <Modal show={showTopicModal} onHide={() => setShowTopicModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Topic</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTopic}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Topic Title</Form.Label>
              <Form.Control
                type="text"
                value={newTopic.topic_title}
                onChange={(e) => setNewTopic({ ...newTopic, topic_title: e.target.value })}
                placeholder="Enter topic title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={newTopic.topic_content}
                onChange={(e) => setNewTopic({ ...newTopic, topic_content: e.target.value })}
                placeholder="Enter your question or discussion topic"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTopicModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createTopicMutation.isLoading}>
              {createTopicMutation.isLoading ? 'Creating...' : 'Create Topic'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Create Post Modal */}
      <Modal show={showPostModal} onHide={() => setShowPostModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reply to Topic</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreatePost}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Your Reply</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={newPost.post_content}
                onChange={(e) => setNewPost({ ...newPost, post_content: e.target.value })}
                placeholder="Enter your reply"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPostModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createPostMutation.isLoading}>
              {createPostMutation.isLoading ? 'Posting...' : 'Post Reply'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default SocialLearning;

