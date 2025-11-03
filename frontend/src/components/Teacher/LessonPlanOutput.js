import React, { useState, useEffect } from 'react';
import { 
  Card, Tab, Tabs, Button, Form, Alert, Badge
} from 'react-bootstrap';
import { 
  FaEye, FaEdit, FaInfoCircle, FaCopy, FaDownload, FaSave
} from 'react-icons/fa';

function LessonPlanOutput({ onSaveLesson }) {
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

  // Helper function to format structured lesson plan object into readable text
  const formatStructuredLessonPlan = (planObj) => {
    let formatted = '';
    
    // Format Lesson Header
    if (planObj.lesson_header || planObj.LESSON_HEADER) {
      const header = planObj.lesson_header || planObj.LESSON_HEADER;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'LESSON HEADER\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof header === 'string') {
        formatted += header + '\n';
      } else {
        if (header.subject) formatted += `Subject: ${header.subject}\n`;
        if (header.form) formatted += `Form: ${header.form}\n`;
        if (header.class) formatted += `Class: ${header.class}\n`;
        if (header.topic) formatted += `Topic: ${header.topic}\n`;
        if (header.essential_learning_outcomes) formatted += `Essential Learning Outcomes: ${header.essential_learning_outcomes}\n`;
        if (header.specific_learning_outcomes) formatted += `Specific Learning Outcomes: ${header.specific_learning_outcomes}\n`;
        if (header.duration) formatted += `Duration: ${header.duration}\n`;
      }
      formatted += '\n';
    }
    
    // Format Objectives Table
    if (planObj.objectives_table || planObj.OBJECTIVES_TABLE) {
      const objectives = planObj.objectives_table || planObj.OBJECTIVES_TABLE;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'OBJECTIVES TABLE\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof objectives === 'string') {
        formatted += objectives + '\n';
      } else if (objectives.columns && Array.isArray(objectives.columns)) {
        objectives.columns.forEach((col, idx) => {
          formatted += `\nObjective ${idx + 1}:\n`;
          if (col.Knowledge) formatted += `  Knowledge: ${col.Knowledge}\n`;
          if (col.Skills) formatted += `  Skills: ${col.Skills}\n`;
          if (col.Values) formatted += `  Values: ${col.Values}\n`;
        });
      } else {
        // Handle flat object structure
        if (objectives.Knowledge) formatted += `Knowledge: ${objectives.Knowledge}\n`;
        if (objectives.Skills) formatted += `Skills: ${objectives.Skills}\n`;
        if (objectives.Values) formatted += `Values: ${objectives.Values}\n`;
      }
      formatted += '\n';
    }
    
    // Format Lesson Components
    if (planObj.lesson_components || planObj.LESSON_COMPONENTS) {
      const components = planObj.lesson_components || planObj.LESSON_COMPONENTS;
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'LESSON COMPONENTS\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof components === 'string') {
        formatted += components + '\n';
      } else {
        // Handle structured components
        const componentOrder = [
          'Prompter/Hook',
          'prompter_hook',
          'Introduction',
          'introduction',
          'Concept Development and Practice',
          'concept_development',
          'Time to Reflect and Share',
          'reflection',
          'Closure',
          'closure'
        ];
        
        componentOrder.forEach(key => {
          const component = components[key];
          if (component) {
            formatted += `\n${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:\n`;
            if (typeof component === 'string') {
              formatted += `  ${component}\n`;
            } else {
              if (component.timing) formatted += `  Timing: ${component.timing}\n`;
              if (component.description) formatted += `  ${component.description}\n`;
              if (component.activities) {
                formatted += `  Activities:\n`;
                if (Array.isArray(component.activities)) {
                  component.activities.forEach((activity, idx) => {
                    formatted += `    ${idx + 1}. ${activity}\n`;
                  });
                } else {
                  formatted += `    ${component.activities}\n`;
                }
              }
            }
          }
        });
        
        // If no standard keys found, iterate through all keys
        if (!componentOrder.some(key => components[key])) {
          Object.keys(components).forEach(key => {
            const component = components[key];
            formatted += `\n${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:\n`;
            if (typeof component === 'string') {
              formatted += `  ${component}\n`;
            } else {
              if (component.timing) formatted += `  Timing: ${component.timing}\n`;
              if (component.description) formatted += `  ${component.description}\n`;
            }
          });
        }
      }
      formatted += '\n';
    }
    
    // Format Assessment
    if (planObj.assessment || planObj.ASSESSMENT || planObj['4. ASSESSMENT']) {
      const assessment = planObj.assessment || planObj.ASSESSMENT || planObj['4. ASSESSMENT'];
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'ASSESSMENT\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof assessment === 'string') {
        formatted += assessment + '\n';
      } else if (typeof assessment === 'object') {
        if (assessment['Formative Assessment'] || assessment.formative_assessment || assessment.formative_strategies) {
          const formative = assessment['Formative Assessment'] || assessment.formative_assessment || assessment.formative_strategies;
          formatted += `Formative Assessment: ${formative}\n`;
        }
        if (assessment['Assessment Activities'] || assessment.assessment_activities) {
          formatted += `Assessment Activities: ${assessment['Assessment Activities'] || assessment.assessment_activities}\n`;
        }
        if (assessment['Assessment Tools'] || assessment.assessment_tools) {
          formatted += `Assessment Tools: ${assessment['Assessment Tools'] || assessment.assessment_tools}\n`;
        }
        Object.keys(assessment).forEach(key => {
          if (!['Formative Assessment', 'formative_assessment', 'formative_strategies', 
                'Assessment Activities', 'assessment_activities',
                'Assessment Tools', 'assessment_tools'].includes(key)) {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            formatted += `${formattedKey}: ${assessment[key]}\n`;
          }
        });
      }
      formatted += '\n';
    }
    
    // Format Resources
    if (planObj.resources || planObj.RESOURCES || planObj['5. RESOURCES']) {
      const resources = planObj.resources || planObj.RESOURCES || planObj['5. RESOURCES'];
      formatted += '═══════════════════════════════════════════════════════\n';
      formatted += 'RESOURCES\n';
      formatted += '═══════════════════════════════════════════════════════\n';
      if (typeof resources === 'string') {
        formatted += resources + '\n';
      } else if (typeof resources === 'object') {
        Object.keys(resources).forEach(key => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          formatted += `${formattedKey}: ${resources[key]}\n`;
        });
      }
      formatted += '\n';
    }
    
    return formatted.trim() || JSON.stringify(planObj, null, 2);
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
      alert('Lesson plan copied to clipboard!');
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
      <Card className="h-100">
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
    <Card className="h-100">
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
          <Alert variant="success" className="mb-3">
            Lesson plan saved successfully!
          </Alert>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="preview" title={
            <span>
              <FaEye className="me-1" />
              Preview
            </span>
          }>
            <div 
              className="mt-3 p-3 border rounded"
              style={{ 
                maxHeight: '600px', 
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}
            >
              {editedContent || lessonPlan}
            </div>
          </Tab>

          <Tab eventKey="edit" title={
            <span>
              <FaEdit className="me-1" />
              Edit
            </span>
          }>
            <Form className="mt-3">
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={20}
                  value={editedContent || lessonPlan || ''}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </Form.Group>
            </Form>
          </Tab>

          <Tab eventKey="metadata" title={
            <span>
              <FaInfoCircle className="me-1" />
              Details
            </span>
          }>
            <Form className="mt-3">
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
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

export default LessonPlanOutput;

