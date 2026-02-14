import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Badge, Spinner, Alert,
  ProgressBar, Tabs, Tab
} from 'react-bootstrap';
import {
  FaProjectDiagram, FaPlus, FaTasks, FaUsers, FaCheckCircle, FaClock
} from 'react-icons/fa';
import collaborationService from '../../services/collaborationService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function GroupProjectManagement({ classSubjectId, sessions }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'ASSIGNMENT',
    due_date: ''
  });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'MEDIUM',
    due_date: ''
  });

  useEffect(() => {
    loadProjects();
  }, [classSubjectId]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject.project_id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await collaborationService.getGroupProjects(classSubjectId, user?.user_id);
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (projectId) => {
    try {
      const data = await collaborationService.getProjectTasks(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      // Create session
      const session = await collaborationService.createSession({
        session_type: 'PROJECT',
        title: formData.title,
        description: formData.description,
        class_subject_id: classSubjectId,
        created_by: user?.user_id
      });

      // Create project
      await collaborationService.createGroupProject({
        session_id: session.session_id,
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        class_subject_id: classSubjectId,
        due_date: formData.due_date,
        team_leader_id: user?.user_id,
        status: 'PLANNING'
      });

      await loadProjects();
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        project_type: 'ASSIGNMENT',
        due_date: ''
      });
      alert('Group project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Some tables may not exist yet.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await collaborationService.createProjectTask({
        project_id: selectedProject.project_id,
        title: taskFormData.title,
        description: taskFormData.description,
        assigned_to: taskFormData.assigned_to ? parseInt(taskFormData.assigned_to) : null,
        priority: taskFormData.priority,
        due_date: taskFormData.due_date,
        created_by: user?.user_id,
        status: 'TODO'
      });

      await loadTasks(selectedProject.project_id);
      await collaborationService.updateProjectProgress(selectedProject.project_id);
      await loadProjects();
      setShowTaskModal(false);
      setTaskFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'MEDIUM',
        due_date: ''
      });
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'CRITICAL': 'danger',
      'HIGH': 'warning',
      'MEDIUM': 'info',
      'LOW': 'secondary'
    };
    return badges[priority] || 'secondary';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'COMPLETED': 'success',
      'IN_PROGRESS': 'warning',
      'IN_REVIEW': 'info',
      'TODO': 'secondary',
      'BLOCKED': 'danger'
    };
    return badges[status] || 'secondary';
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Group Projects</h5>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-1" />
            New Project
          </Button>
        </Card.Header>
        <Card.Body>
          {projects.length === 0 ? (
            <Alert variant="info">No group projects yet. Create one to get started!</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Leader</th>
                  <th>Members</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.project_id}>
                    <td>{project.title}</td>
                    <td>{project.team_leader_name || 'N/A'}</td>
                    <td>
                      <FaUsers className="me-1" />
                      {project.member_count || 0}
                    </td>
                    <td>
                      <ProgressBar
                        now={project.progress_percentage || 0}
                        label={`${project.progress_percentage || 0}%`}
                        variant={
                          project.progress_percentage >= 80 ? 'success' :
                          project.progress_percentage >= 50 ? 'warning' : 'danger'
                        }
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <Badge bg="info">{project.status}</Badge>
                    </td>
                    <td>
                      {project.due_date 
                        ? new Date(project.due_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                      >
                        <FaTasks className="me-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          show={!!selectedProject}
          onHide={() => setSelectedProject(null)}
          size="xl"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaProjectDiagram className="me-2" />
              {selectedProject.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultActiveKey="tasks">
              <Tab eventKey="tasks" title={<><FaTasks className="me-1" />Tasks</>}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Project Tasks</h6>
                  <Button variant="primary" size="sm" onClick={() => setShowTaskModal(true)}>
                    <FaPlus className="me-1" />
                    Add Task
                  </Button>
                </div>
                {tasks.length === 0 ? (
                  <Alert variant="info">No tasks yet. Add one to get started!</Alert>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Assigned To</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.task_id}>
                          <td>{task.title}</td>
                          <td>{task.assigned_to_name || 'Unassigned'}</td>
                          <td>
                            <Badge bg={getPriorityBadge(task.priority)}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getStatusBadge(task.status)}>
                              {task.status}
                            </Badge>
                          </td>
                          <td>
                            <ProgressBar
                              now={task.progress_percentage || 0}
                              variant="info"
                              style={{ width: '80px' }}
                            />
                          </td>
                          <td>
                            {task.due_date 
                              ? new Date(task.due_date).toLocaleDateString()
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedProject(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Create Project Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Group Project</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateProject}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Type</Form.Label>
              <Form.Select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
              >
                <option value="ASSIGNMENT">Assignment</option>
                <option value="PRESENTATION">Presentation</option>
                <option value="RESEARCH">Research</option>
                <option value="PORTFOLIO">Portfolio</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Project
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Create Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Task</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTask}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assigned To (User ID)</Form.Label>
              <Form.Control
                type="number"
                value={taskFormData.assigned_to}
                onChange={(e) => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}
                placeholder="Optional"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="datetime-local"
                value={taskFormData.due_date}
                onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default GroupProjectManagement;

