import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Button, Tab, Tabs, Row, Col, 
  Alert, Spinner, Badge
} from 'react-bootstrap';
import { FaBook, FaUsers, FaCog, FaMagic } from 'react-icons/fa';
import { generateEnhancedLessonPlan } from '../../services/aiLessonService';
import { supabase } from '../../config/supabase';
import TinyMCEEditor from '../common/TinyMCEEditor';

function EnhancedLessonPlannerForm({ 
  subjectName = '',
  formName = '',
  className = '',
  classSubjectId = null,
  onPlanGenerated 
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [curriculumStandards, setCurriculumStandards] = useState('');
  
  const [formData, setFormData] = useState({
    // Basic Info
    subject: subjectName || '',
    form: formName || '',
    class: className || '',
    topic: '',
    essentialLearningOutcomes: '',
    learningOutcomes: '',
    studentCount: 20,
    duration: 45,
    
    // Teaching Strategy
    pedagogicalStrategies: [],
    learningStyles: [],
    learningPreferences: [],
    multipleIntelligences: [],
    materials: '',
    prerequisiteSkills: '',
    
    // Additional Details
    specialNeeds: false,
    specialNeedsDetails: '',
    additionalInstructions: '',
    referenceUrl: ''
  });

  // Load curriculum standards when form/class/subject changes
  useEffect(() => {
    if (classSubjectId) {
      fetchCurriculumStandards();
    }
  }, [classSubjectId]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('enhanced-planner-form-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedTime = new Date(data.timestamp);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setFormData(prev => ({ ...data.data, ...prev }));
        } else {
          localStorage.removeItem('enhanced-planner-form-data');
        }
      } catch (err) {
        console.error('Error loading saved form data:', err);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const saveData = {
      data: formData,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('enhanced-planner-form-data', JSON.stringify(saveData));
  }, [formData]);

  const fetchCurriculumStandards = async () => {
    if (!classSubjectId) return;
    
    try {
      // First get the class_subject to find the subject_offering_id
      const { data: classSubjectData, error: csError } = await supabase
        .from('class_subjects')
        .select('subject_offering_id')
        .eq('class_subject_id', classSubjectId)
        .single();

      if (csError || !classSubjectData) {
        console.warn('Could not fetch class subject:', csError);
        return;
      }

      // Then get the subject_form_offering with curriculum data
      const { data, error } = await supabase
        .from('subject_form_offerings')
        .select(`
          curriculum_framework,
          learning_outcomes,
          curriculum_structure
        `)
        .eq('offering_id', classSubjectData.subject_offering_id)
        .single();

      if (data && !error) {
        let standards = '';
        
        // Extract from JSONB structure if available
        if (data.curriculum_structure) {
          try {
            const structure = typeof data.curriculum_structure === 'string' 
              ? JSON.parse(data.curriculum_structure) 
              : data.curriculum_structure;
            
            if (structure.topics && Array.isArray(structure.topics)) {
              standards = structure.topics.map(topic => {
                let topicText = `Topic ${topic.topicNumber || ''}: ${topic.title || 'Untitled'}\n`;
                if (topic.overview?.essentialLearningOutcomes) {
                  const outcomes = Array.isArray(topic.overview.essentialLearningOutcomes)
                    ? topic.overview.essentialLearningOutcomes.join('\n')
                    : topic.overview.essentialLearningOutcomes;
                  topicText += outcomes;
                }
                return topicText;
              }).join('\n\n');
            }
          } catch (parseErr) {
            console.warn('Error parsing curriculum structure:', parseErr);
          }
        }
        
        // Add curriculum framework
        if (data.curriculum_framework) {
          standards += (standards ? '\n\n' : '') + data.curriculum_framework;
        }
        
        // Add learning outcomes
        if (data.learning_outcomes) {
          standards += (standards ? '\n\n' : '') + data.learning_outcomes;
        }
        
        setCurriculumStandards(standards);
      }
    } catch (err) {
      console.error('Error fetching curriculum standards:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.subject || !formData.form) {
      setError('Please fill in at least Subject, Form, and Topic.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[EnhancedPlanner] Generating lesson plan with:', formData);
      
      const lessonPlan = await generateEnhancedLessonPlan({
        ...formData,
        curriculumStandards
      });

      console.log('[EnhancedPlanner] Generated lesson plan:', lessonPlan);

      // Convert lesson_plan to string if it's an object
      let lessonPlanContent = lessonPlan.content || lessonPlan.lesson_plan || '';
      if (typeof lessonPlanContent === 'object') {
        lessonPlanContent = JSON.stringify(lessonPlanContent, null, 2);
      }

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('lessonPlanGenerated', {
        detail: {
          lessonPlan: lessonPlanContent,
          lessonTitle: lessonPlan.lesson_title || `${formData.topic} - ${formData.subject}`,
          subject: formData.subject,
          form: formData.form,
          topic: formData.topic,
          metadata: {
            ...formData,
            generatedAt: new Date().toISOString()
          }
        }
      }));

      if (onPlanGenerated) {
        onPlanGenerated(lessonPlan);
      }
    } catch (err) {
      console.error('[EnhancedPlanner] Error:', err);
      setError(err.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearForm = () => {
    if (window.confirm('Are you sure you want to clear all form data?')) {
      setFormData({
        subject: subjectName || '',
        form: formName || '',
        class: className || '',
        topic: '',
        essentialLearningOutcomes: '',
        learningOutcomes: '',
        studentCount: 20,
        duration: 45,
        pedagogicalStrategies: [],
        learningStyles: [],
        learningPreferences: [],
        multipleIntelligences: [],
        materials: '',
        prerequisiteSkills: '',
        specialNeeds: false,
        specialNeedsDetails: '',
        additionalInstructions: '',
        referenceUrl: ''
      });
      localStorage.removeItem('enhanced-planner-form-data');
    }
  };

  return (
    <Card className="h-100">
      <Card.Header className="bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <FaMagic className="me-2" />
            <strong>AI Lesson Plan Generator</strong>
          </div>
          <Button variant="light" size="sm" onClick={clearForm}>
            Clear Form
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          {/* Tab 1: Basic Info */}
          <Tab eventKey="basic" title={
            <span>
              <FaBook className="me-1" />
              Basic Info
            </span>
          }>
            <div className="mt-3">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject *</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject || ''}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Form *</Form.Label>
                    <Form.Control
                      type="text"
                      name="form"
                      value={formData.form || ''}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class</Form.Label>
                    <Form.Control
                      type="text"
                      name="class"
                      value={formData.class || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 3A"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Topic *</Form.Label>
                <Form.Control
                  type="text"
                  name="topic"
                  value={formData.topic || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Algebra"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Essential Learning Outcomes</Form.Label>
                <TinyMCEEditor
                  value={formData.essentialLearningOutcomes || ''}
                  onChange={(e) => handleInputChange({ target: { name: 'essentialLearningOutcomes', value: e.target.value } })}
                  placeholder="Key learning outcomes students should achieve..."
                  height={150}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Learning Outcomes</Form.Label>
                <TinyMCEEditor
                  value={formData.learningOutcomes || ''}
                  onChange={(e) => handleInputChange({ target: { name: 'learningOutcomes', value: e.target.value } })}
                  placeholder="Specific curriculum outcomes..."
                  height={150}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student Count</Form.Label>
                    <Form.Control
                      type="number"
                      name="studentCount"
                      value={formData.studentCount || ''}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duration (minutes)</Form.Label>
                    <Form.Select
                      name="duration"
                      value={formData.duration || ''}
                      onChange={handleInputChange}
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Tab>

          {/* Tab 2: Teaching Strategy */}
          <Tab eventKey="strategy" title={
            <span>
              <FaUsers className="me-1" />
              Teaching Strategy
            </span>
          }>
            <div className="mt-3">
              <Form.Group className="mb-3">
                <Form.Label>Pedagogical Strategies</Form.Label>
                <div>
                  {['Inquiry-Based Learning', 'Project-Based Learning', 'Cooperative Learning', 
                    'Direct Instruction', 'Discovery Learning', 'Problem-Based Learning'].map(strategy => (
                    <Form.Check
                      key={strategy}
                      type="checkbox"
                      label={strategy}
                      checked={formData.pedagogicalStrategies.includes(strategy)}
                      onChange={() => handleMultiSelect('pedagogicalStrategies', strategy)}
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Learning Styles</Form.Label>
                <div>
                  {['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'].map(style => (
                    <Form.Check
                      key={style}
                      type="checkbox"
                      label={style}
                      checked={formData.learningStyles.includes(style)}
                      onChange={() => handleMultiSelect('learningStyles', style)}
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Learning Preferences</Form.Label>
                <div>
                  {['Group work', 'Individual work', 'Pairs', 'Whole class'].map(pref => (
                    <Form.Check
                      key={pref}
                      type="checkbox"
                      label={pref}
                      checked={formData.learningPreferences.includes(pref)}
                      onChange={() => handleMultiSelect('learningPreferences', pref)}
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Multiple Intelligences</Form.Label>
                <div>
                  {['Linguistic', 'Logical-Mathematical', 'Spatial', 'Musical', 
                    'Bodily-Kinesthetic', 'Interpersonal', 'Intrapersonal', 'Naturalistic'].map(intel => (
                    <Form.Check
                      key={intel}
                      type="checkbox"
                      label={intel}
                      checked={formData.multipleIntelligences.includes(intel)}
                      onChange={() => handleMultiSelect('multipleIntelligences', intel)}
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Materials Needed</Form.Label>
                <TinyMCEEditor
                  value={formData.materials || ''}
                  onChange={(e) => handleInputChange({ target: { name: 'materials', value: e.target.value } })}
                  placeholder="List required materials and resources..."
                  height={150}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Prerequisite Skills</Form.Label>
                <TinyMCEEditor
                  value={formData.prerequisiteSkills || ''}
                  onChange={(e) => handleInputChange({ target: { name: 'prerequisiteSkills', value: e.target.value } })}
                  placeholder="Skills or knowledge students should have before this lesson..."
                  height={120}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Form.Group>
            </div>
          </Tab>

          {/* Tab 3: Additional Details */}
          <Tab eventKey="additional" title={
            <span>
              <FaCog className="me-1" />
              Additional Details
            </span>
          }>
            <div className="mt-3">
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Special Needs Accommodations Required"
                  name="specialNeeds"
                  checked={formData.specialNeeds}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {formData.specialNeeds && (
                <Form.Group className="mb-3">
                  <Form.Label>Special Needs Details</Form.Label>
                  <TinyMCEEditor
                    value={formData.specialNeedsDetails || ''}
                    onChange={(e) => handleInputChange({ target: { name: 'specialNeedsDetails', value: e.target.value } })}
                    placeholder="Describe specific accommodations needed..."
                    height={150}
                    toolbar="undo redo | formatselect | bold italic | bullist numlist"
                    plugins="lists"
                    menubar={false}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Additional Instructions</Form.Label>
                <TinyMCEEditor
                  value={formData.additionalInstructions || ''}
                  onChange={(e) => handleInputChange({ target: { name: 'additionalInstructions', value: e.target.value } })}
                  placeholder="Any additional instructions or context for the AI..."
                  height={150}
                  toolbar="undo redo | formatselect | bold italic | bullist numlist"
                  plugins="lists"
                  menubar={false}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Reference URL (Optional)</Form.Label>
                <Form.Control
                  type="url"
                  name="referenceUrl"
                  value={formData.referenceUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </Form.Group>
            </div>
          </Tab>
        </Tabs>

        <div className="d-grid gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Generating Lesson Plan...
              </>
            ) : (
              <>
                <FaMagic className="me-2" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default EnhancedLessonPlannerForm;

