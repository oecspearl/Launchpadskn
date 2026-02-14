import React, { useState } from 'react';
import { Container, Nav, Tab } from 'react-bootstrap';
import { FaRoute, FaTrophy, FaComments, FaFlask, FaCube } from 'react-icons/fa';
import AdaptiveLearningPaths from './AdaptiveLearningPaths';
import Gamification from './Gamification';
import SocialLearning from './SocialLearning';
import VirtualLabs from './VirtualLabs';
import ARVRIntegration from './ARVRIntegration';
import './InteractiveContentHub.css';

function InteractiveContentHub({ classSubjectId, classSubject, studentId = null }) {
  const [activeTab, setActiveTab] = useState('learning-paths');

  return (
    <Container fluid className="interactive-content-hub">
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="learning-paths">
              <FaRoute className="me-2" />
              Learning Paths
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="gamification">
              <FaTrophy className="me-2" />
              Gamification
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="social">
              <FaComments className="me-2" />
              Social Learning
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="labs">
              <FaFlask className="me-2" />
              Virtual Labs
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="arvr">
              <FaCube className="me-2" />
              AR/VR
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="learning-paths">
            <AdaptiveLearningPaths
              classSubjectId={classSubjectId}
              classSubject={classSubject}
              studentId={studentId}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="gamification">
            <Gamification
              classSubjectId={classSubjectId}
              classSubject={classSubject}
              studentId={studentId}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="social">
            <SocialLearning
              classSubjectId={classSubjectId}
              classSubject={classSubject}
              studentId={studentId}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="labs">
            <VirtualLabs
              classSubjectId={classSubjectId}
              classSubject={classSubject}
              studentId={studentId}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="arvr">
            <ARVRIntegration
              classSubjectId={classSubjectId}
              classSubject={classSubject}
              studentId={studentId}
            />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
}

export default InteractiveContentHub;

