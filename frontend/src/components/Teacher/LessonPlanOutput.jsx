import React, { useState, useEffect } from 'react';
import {
  Card, Tab, Tabs, Button, Form, Alert, Badge
} from 'react-bootstrap';
import {
  FaEye, FaEdit, FaInfoCircle, FaCopy, FaDownload, FaSave
} from 'react-icons/fa';
import StructuredLessonPlanDisplay from './StructuredLessonPlanDisplay';
import TinyMCEEditor from '../Editor/TextEditor';
import { useToast } from '../../contexts/ToastContext';
import { lessonPlanToString } from '../../utils/lessonPlanFormatter';
import './LessonPlanOutput.css';

function LessonPlanOutput({ onSaveLesson }) {
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('preview');
  const [lessonPlan, setLessonPlan] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [metadata, setMetadata] = useState({
    title: '',
    subject: '',
    form: '',
    topic: ''
  });
  const [saved, setSaved] = useState(false);

  // Lesson-plan formatting lives in ../../utils/lessonPlanFormatter (shared
  // with EnhancedLessonPlannerForm and LessonPlanning) so the object->markdown
  // logic has a single source of truth.

  useEffect(() => {
    // Listen for lesson plan generation event
    const handleLessonPlanGenerated = (event) => {
      const { lessonPlan: content, lessonTitle, subject, form, topic, metadata: meta } = event.detail;

      // Convert to string if it's an object
      const contentString = lessonPlanToString(content);

      setLessonPlan(contentString);
      setEditedContent(contentString);
      setMetadata({
        title: lessonTitle || '',
        subject: subject || '',
        form: form || '',
        topic: topic || ''
      });
      setActiveTab('preview');
      setSaved(false);

      // Save to localStorage
      const savedPlan = {
        content: contentString,
        lessonTitle,
        subject,
        form,
        topic,
        metadata: meta,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('currentLessonPlan', JSON.stringify(savedPlan));
    };

    window.addEventListener('lessonPlanGenerated', handleLessonPlanGenerated);

    // Load from localStorage on mount
    const saved = localStorage.getItem('currentLessonPlan');
    if (saved) {
      try {
        const savedPlan = JSON.parse(saved);
        const contentString = lessonPlanToString(savedPlan.content);
        setLessonPlan(contentString);
        setEditedContent(contentString);
        setMetadata({
          title: savedPlan.lessonTitle || '',
          subject: savedPlan.subject || '',
          form: savedPlan.form || '',
          topic: savedPlan.topic || ''
        });
      } catch (err) {
        console.error('Error loading saved lesson plan:', err);
      }
    }

    return () => {
      window.removeEventListener('lessonPlanGenerated', handleLessonPlanGenerated);
    };
  }, []);

  const handleCopy = () => {
    const textToCopy = editedContent || lessonPlan || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      showSuccess('Lesson plan copied to clipboard!');
    });
  };

  const handleDownload = () => {
    const textToDownload = editedContent || lessonPlan || '';
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-plan-${metadata.title || 'lesson'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSaveLesson) {
      const lessonData = {
        lesson_title: metadata.title || 'Generated Lesson Plan',
        topic: metadata.topic,
        learning_objectives: '', // Extract from lesson plan if needed
        lesson_plan: editedContent || lessonPlan,
        homework_description: '' // Extract from lesson plan if needed
      };
      onSaveLesson(lessonData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!lessonPlan && !editedContent) {
    return (
      <Card className="h-100 lesson-plan-output-card">
        <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
          <div className="text-center text-muted">
            <FaInfoCircle size={48} className="mb-3" />
            <p>No lesson plan generated yet.</p>
            <p className="small">Fill out the form and click "Generate Lesson Plan" to get started.</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100 lesson-plan-output-card">
      <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
        <strong>Generated Lesson Plan</strong>
        <div>
          <Button variant="light" size="sm" className="me-2" onClick={handleCopy}>
            <FaCopy className="me-1" />
            Copy
          </Button>
          <Button variant="light" size="sm" className="me-2" onClick={handleDownload}>
            <FaDownload className="me-1" />
            Download
          </Button>
          {onSaveLesson && (
            <Button variant="light" size="sm" onClick={handleSave}>
              <FaSave className="me-1" />
              Save
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {saved && (
          <Alert variant="success" className="mb-3" style={{ flexShrink: 0 }}>
            Lesson plan saved successfully!
          </Alert>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="lesson-plan-output-tabs"
        >
          <Tab eventKey="preview" title={
            <span>
              <FaEye className="me-1" />
              Preview
            </span>
          }>
            <div className="lesson-plan-preview-container">
              <StructuredLessonPlanDisplay lessonPlanText={editedContent || lessonPlan} />
            </div>
          </Tab>

          <Tab eventKey="edit" title={
            <span>
              <FaEdit className="me-1" />
              Edit
            </span>
          }>
            <div className="lesson-plan-edit-container">
              <Form>
                <Form.Group>
                  <TinyMCEEditor
                    value={editedContent || lessonPlan || ''}
                    onChange={(e) => setEditedContent(e.target.value)}
                    height={600}
                  />
                </Form.Group>
              </Form>
            </div>
          </Tab>

          <Tab eventKey="metadata" title={
            <span>
              <FaInfoCircle className="me-1" />
              Details
            </span>
          }>
            <div className="lesson-plan-metadata-container">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Lesson Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={metadata.subject}
                    onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Form</Form.Label>
                  <Form.Control
                    type="text"
                    value={metadata.form}
                    onChange={(e) => setMetadata({ ...metadata, form: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Topic</Form.Label>
                  <Form.Control
                    type="text"
                    value={metadata.topic}
                    onChange={(e) => setMetadata({ ...metadata, topic: e.target.value })}
                  />
                </Form.Group>
              </Form>
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

export default LessonPlanOutput;

