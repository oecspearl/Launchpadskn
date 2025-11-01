import React, { useState } from 'react';
import { Container, Row, Col, Tabs, Tab, Card } from 'react-bootstrap';
import { FaFolder } from 'react-icons/fa';
import FileUpload from './FileUpload';
import FileList from './FileList';

const FileManagement = ({ courseId, allowedFileTypes = ['COURSE_MATERIAL', 'ASSIGNMENT', 'SUBMISSION', 'OTHER'] }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle successful upload
  const handleUploadSuccess = () => {
    // Trigger a refresh of the file list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="mb-3">
            <FaFolder className="me-2" />
            File Management
          </Card.Title>
          
          <Row>
            <Col md={4} lg={3}>
              <FileUpload 
                courseId={courseId} 
                fileType={activeTab !== 'all' ? activeTab : 'OTHER'}
                onUploadSuccess={handleUploadSuccess}
                isPublic={false}
              />
            </Col>
            
            <Col md={8} lg={9}>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="all" title="All Files">
                  <FileList 
                    courseId={courseId} 
                    refreshTrigger={refreshTrigger} 
                  />
                </Tab>
                
                {allowedFileTypes.includes('COURSE_MATERIAL') && (
                  <Tab eventKey="COURSE_MATERIAL" title="Course Materials">
                    <FileList 
                      courseId={courseId} 
                      fileType="COURSE_MATERIAL" 
                      refreshTrigger={refreshTrigger} 
                    />
                  </Tab>
                )}
                
                {allowedFileTypes.includes('ASSIGNMENT') && (
                  <Tab eventKey="ASSIGNMENT" title="Assignments">
                    <FileList 
                      courseId={courseId} 
                      fileType="ASSIGNMENT" 
                      refreshTrigger={refreshTrigger} 
                    />
                  </Tab>
                )}
                
                {allowedFileTypes.includes('SUBMISSION') && (
                  <Tab eventKey="SUBMISSION" title="Submissions">
                    <FileList 
                      courseId={courseId} 
                      fileType="SUBMISSION" 
                      refreshTrigger={refreshTrigger} 
                    />
                  </Tab>
                )}
                
                {allowedFileTypes.includes('OTHER') && (
                  <Tab eventKey="OTHER" title="Other">
                    <FileList 
                      courseId={courseId} 
                      fileType="OTHER" 
                      refreshTrigger={refreshTrigger} 
                    />
                  </Tab>
                )}
              </Tabs>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FileManagement;
