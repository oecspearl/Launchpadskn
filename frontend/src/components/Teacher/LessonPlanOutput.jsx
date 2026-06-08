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

  // Turn a structured lesson-plan object (any nesting the AI returns) into
  // readable markdown. Sections become headings, sub_activities become
  // subsections, an objectives "columns" array becomes a table, plain
  // key/value pairs become bold labels.
  const humanizeKey = (k) =>
    String(k)
      .replace(/^\s*\d+[.)]\s*/, '')   // strip "1. " / "2) " prefixes
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const objectivesTable = (columns) => {
    if (!Array.isArray(columns) || columns.length === 0) return '';
    const keys = Object.keys(columns[0] || {});
    if (keys.length === 0) return '';
    const esc = (v) => String(v ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
    let md = '| ' + keys.map(humanizeKey).join(' | ') + ' |\n';
    md += '| ' + keys.map(() => '---').join(' | ') + ' |\n';
    columns.forEach((row) => {
      md += '| ' + keys.map((k) => esc(row[k])).join(' | ') + ' |\n';
    });
    return md + '\n';
  };

  const toMarkdown = (value, depth = 2) => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') {
      return `${value}\n\n`;
    }
    if (Array.isArray(value)) {
      let md = '';
      value.forEach((item, i) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const title = item.name || item.title || `Item ${i + 1}`;
          md += `${'#'.repeat(Math.min(depth, 6))} ${humanizeKey(title)}\n\n`;
          const rest = { ...item };
          delete rest.name;
          delete rest.title;
          md += toMarkdown(rest, depth + 1);
        } else {
          md += `- ${item}\n`;
        }
      });
      return md + '\n';
    }
    if (typeof value === 'object') {
      if (Array.isArray(value.columns)) return objectivesTable(value.columns);
      let md = '';
      for (const [k, v] of Object.entries(value)) {
        const label = humanizeKey(k);
        if (v && typeof v === 'object') {
          md += `${'#'.repeat(Math.min(depth, 6))} ${label}\n\n`;
          md += toMarkdown(v, depth + 1);
        } else if (v != null && String(v).trim()) {
          md += `**${label}:** ${v}\n\n`;
        }
      }
      return md;
    }
    return '';
  };

  const formatStructuredLessonPlan = (planObj) => {
    if (!planObj || typeof planObj !== 'object') return String(planObj || '');
    let md = '';
    if (planObj.lesson_title) md += `# ${planObj.lesson_title}\n\n`;
    if (planObj.learning_objectives) {
      md += `## Learning Objectives\n\n${planObj.learning_objectives}\n\n`;
    }
    const body = planObj.lesson_plan;
    if (body && typeof body === 'object') {
      md += toMarkdown(body, 2);
    } else if (typeof body === 'string') {
      md += body;
    } else {
      // planObj itself is the structured plan body
      const { lesson_title, learning_objectives, ...rest } = planObj;
      md += toMarkdown(rest, 2);
    }
    return md.trim() || JSON.stringify(planObj, null, 2);
  };

  // Helper function to convert lesson plan to string
  const lessonPlanToString = (plan) => {
    if (!plan) return '';
    if (typeof plan === 'string') return plan;
    if (typeof plan === 'object') {
      return formatStructuredLessonPlan(plan);
    }
    return String(plan);
  };

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

