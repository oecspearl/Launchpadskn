import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Modal, ListGroup, Badge, ProgressBar, Tab, Tabs
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUpload, FaFileAlt, FaLink, FaVideo, FaImage,
  FaTrash, FaEdit, FaPlus, FaDownload, FaExternalLinkAlt, FaBook, FaEye,
  FaArrowUp, FaArrowDown, FaGripVertical, FaClock, FaCheckCircle, FaInfoCircle,
  FaGraduationCap, FaLightbulb, FaQuestionCircle, FaComments, FaClipboardCheck,
  FaClipboardList, FaTasks, FaFileSignature, FaPoll, FaProjectDiagram,
  FaFilePdf, FaMagic, FaShare, FaDatabase, FaRobot, FaChevronRight,
  FaBrain, FaLayerGroup, FaRocket, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import contentLibraryService from '../../services/contentLibraryService';
import autoTaggingService from '../../services/autoTaggingService';
import { supabase } from '../../config/supabase';
import QuizBuilder from './QuizBuilder';
import FlashcardCreator from './FlashcardCreator';
import FlashcardViewer from '../Student/FlashcardViewer';
import InteractiveVideoCreator from './InteractiveVideoCreator';
import InteractiveBookCreator from './InteractiveBookCreator';
import { generateAssignmentRubric, generateCompleteLessonContent, generateStudentFacingContent, generateQuiz, generateFlashcards, generateInteractiveVideo, generateInteractiveBook } from '../../services/aiLessonService';
import { searchEducationalVideos } from '../../services/youtubeService';
import html2pdf from 'html2pdf.js';
import StructuredLessonPlanDisplay from './StructuredLessonPlanDisplay';
import './LessonContentManager.css';

// Ensure html2pdf is available globally for compatibility
if (typeof window !== 'undefined' && !window.html2pdf) {
  window.html2pdf = html2pdf;
}

function LessonContentManager() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [content, setContent] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewingContent, setPreviewingContent] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState({}); // Cache for signed URLs
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [currentQuizContentId, setCurrentQuizContentId] = useState(null);
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [showFlashcardCreator, setShowFlashcardCreator] = useState(false);
  const [currentFlashcardContentId, setCurrentFlashcardContentId] = useState(null);
  const [showInteractiveVideoCreator, setShowInteractiveVideoCreator] = useState(false);
  const [currentInteractiveVideoContentId, setCurrentInteractiveVideoContentId] = useState(null);
  const [showInteractiveBookCreator, setShowInteractiveBookCreator] = useState(false);
  const [currentInteractiveBookContentId, setCurrentInteractiveBookContentId] = useState(null);
  const [selected3DModel, setSelected3DModel] = useState(null);
  const [available3DModels, setAvailable3DModels] = useState([]);
  const [loading3DModels, setLoading3DModels] = useState(false);

  // Form state
  const [contentType, setContentType] = useState('FILE');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [contentText, setContentText] = useState(''); // For text-only content types
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [learningActivities, setLearningActivities] = useState('');
  const [keyConcepts, setKeyConcepts] = useState('');
  const [reflectionQuestions, setReflectionQuestions] = useState('');
  const [discussionPrompts, setDiscussionPrompts] = useState('');
  const [summary, setSummary] = useState('');
  const [contentSection, setContentSection] = useState('Learning');
  const [isRequired, setIsRequired] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [assignmentDetailsFile, setAssignmentDetailsFile] = useState(null);
  const [assignmentRubricFile, setAssignmentRubricFile] = useState(null);
  const [uploadedRubricFileInfo, setUploadedRubricFileInfo] = useState(null); // Store uploaded rubric file info
  const [lessonData, setLessonData] = useState(null);
  const [generatedRubric, setGeneratedRubric] = useState(null);
  const [generatingRubric, setGeneratingRubric] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [selectedPrerequisites, setSelectedPrerequisites] = useState([]); // Array of content_id values
  
  // AI Content Generation state
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContentItems, setGeneratedContentItems] = useState([]);
  const [showAIContentModal, setShowAIContentModal] = useState(false);
  const [aiGenerationMode, setAiGenerationMode] = useState('complete'); // 'complete' or 'student'
  const [showWizard, setShowWizard] = useState(false);
  const [showStudentView, setShowStudentView] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Quiz Generation state
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [quizParams, setQuizParams] = useState({
    numQuestions: 5,
    bloomLevel: 'mixed'
  });
  const [pendingQuizTitle, setPendingQuizTitle] = useState(null); // Store title from Add Content modal

  // Master AI Generation state
  const [showMasterAIGenerator, setShowMasterAIGenerator] = useState(false);
  const [masterAISelections, setMasterAISelections] = useState({
    LEARNING_OUTCOMES: { selected: false, quantity: 1 },
    KEY_CONCEPTS: { selected: false, quantity: 1 },
    LEARNING_ACTIVITIES: { selected: false, quantity: 3 },
    REFLECTION_QUESTIONS: { selected: false, quantity: 5 },
    DISCUSSION_PROMPTS: { selected: false, quantity: 3 },
    SUMMARY: { selected: false, quantity: 1 },
    QUIZ: { selected: false, quantity: 5 },
    ASSIGNMENT: { selected: false, quantity: 1 },
    VIDEO: { selected: false, quantity: 1 }
  });
  const [masterAIPrompt, setMasterAIPrompt] = useState('');

  // Per-content-type AI generation state
  const [perContentAIGenerating, setPerContentAIGenerating] = useState(false);
  const [perContentAIPrompt, setPerContentAIPrompt] = useState('');
  const [perContentAIQuantity, setPerContentAIQuantity] = useState(1);
  
  // Generated data for creators
  const [generatedFlashcardData, setGeneratedFlashcardData] = useState(null);
  const [generatedInteractiveVideoData, setGeneratedInteractiveVideoData] = useState(null);
  const [generatedInteractiveBookData, setGeneratedInteractiveBookData] = useState(null);

  // ========== NEW: Unified AI Assistant Modal State ==========
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiAssistantTab, setAiAssistantTab] = useState('quick');

  useEffect(() => {
    if (lessonId) {
      fetchContent();
      fetchLessonData();
    }
  }, [lessonId]);

  // Fetch available 3D models when 3D_MODEL or AR_OVERLAY content type is selected
  useEffect(() => {
    if (contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') {
      fetchAvailable3DModels();
    } else {
      // Reset when switching away from 3D_MODEL or AR_OVERLAY
      setSelected3DModel(null);
      setAvailable3DModels([]);
      setLoading3DModels(false);
    }
  }, [contentType]);

  // Load selected 3D model when editing existing content with metadata
  useEffect(() => {
    if (contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') {
      if (editingContent && editingContent.metadata && editingContent.metadata.arvr_content_id && available3DModels.length > 0) {
        const arvrContentId = editingContent.metadata.arvr_content_id;
        let id = null;
        if (arvrContentId !== '' && arvrContentId !== null && arvrContentId !== undefined) {
          id = typeof arvrContentId === 'string' ? parseInt(arvrContentId) : arvrContentId;
          if (isNaN(id)) id = null;
        }

        if (id) {
          const model = available3DModels.find(m => m.content_id === id);
          if (model && !selected3DModel) {
            setSelected3DModel(model);
          }
        }
      } else if (!editingContent && selected3DModel) {
        // Clear selection when not editing
      }
    }
  }, [editingContent, available3DModels, contentType]);

  const fetchAvailable3DModels = async () => {
    setLoading3DModels(true);
    try {
      const { data, error } = await supabase
        .from('arvr_content')
        .select('*')
        .order('title');
      
      if (error) throw error;
      setAvailable3DModels(data || []);
    } catch (err) {
      console.error('Error fetching 3D models:', err);
      setError('Failed to load 3D models');
    } finally {
      setLoading3DModels(false);
    }
  };

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessonData = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          class_subject:class_subject_id (
            *,
            class:class_id (
              *,
              form:form_id (*)
            ),
            subject_offering:subject_offering_id (
              *,
              subject:subject_id (*)
            )
          )
        `)
        .eq('lesson_id', lessonId)
        .single();

      if (error) throw error;
      setLessonData(data);
    } catch (err) {
      console.error('Error fetching lesson data:', err);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 45;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end - start) / 60000);
  };

  // Reset form fields
  const resetForm = () => {
    setContentType('FILE');
    setTitle('');
    setUrl('');
    setContentText('');
    setDescription('');
    setInstructions('');
    setContentSection('Learning');
    setIsRequired(true);
    setEstimatedMinutes('');
    setSelectedFile(null);
    setAssignmentDetailsFile(null);
    setAssignmentRubricFile(null);
    setUploadedRubricFileInfo(null);
    setSelectedPrerequisites([]);
    setSelected3DModel(null);
    setEditingContent(null);
    setGeneratedRubric(null);
    setPerContentAIPrompt('');
    setPerContentAIQuantity(1);
  };

  const handleOpenModal = (item = null) => {
    // Always reset form first to ensure all values are properly initialized
    resetForm();
    
    if (item) {
      setEditingContent(item);
      setContentType(item.content_type || 'FILE');
      setTitle(item.title ?? '');
      setUrl(item.url ?? '');
      setContentText(item.content_text ?? '');
      setDescription(item.description ?? '');
      setInstructions(item.instructions ?? '');
      setContentSection(item.content_section || 'Learning');
      setIsRequired(item.is_required !== false);
      setEstimatedMinutes(item.estimated_minutes?.toString() ?? '');
      setSelectedPrerequisites(item.prerequisites || []);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // ========== AI Generation Functions ==========
  
  const handleGeneratePerContentType = async (type) => {
    if (!lessonData) {
      setError('Lesson data not loaded');
      return;
    }

    const subjectName = lessonData.class_subject?.subject_offering?.subject?.subject_name || 'General';
    const formName = lessonData.class_subject?.class?.form?.form_name || '';
    const topic = lessonData.topic || lessonData.lesson_title || '';

    if (!topic || !subjectName || !formName) {
      setError('Missing lesson information. Please ensure the lesson has a topic, subject, and form assigned.');
      return;
    }

    setPerContentAIGenerating(true);
    setError(null);

    try {
      const learningObjectives = lessonData.learning_objectives || '';
      const lessonPlan = lessonData.lesson_plan || '';

      const result = await generateStudentFacingContent({
        lessonTitle: lessonData.lesson_title || 'Untitled Lesson',
        topic,
        subject: subjectName,
        form: formName,
        lessonPlan,
        learningObjectives,
        contentType: type,
        quantity: perContentAIQuantity || 1,
        additionalPrompt: perContentAIPrompt || ''
      });

      // Map result to contentText field
      const typeMap = {
        'LEARNING_OUTCOMES': 'learning_outcomes',
        'KEY_CONCEPTS': 'key_concepts',
        'LEARNING_ACTIVITIES': 'learning_activities',
        'REFLECTION_QUESTIONS': 'reflection_questions',
        'DISCUSSION_PROMPTS': 'discussion_prompts',
        'SUMMARY': 'summary'
      };

      const resultKey = typeMap[type] || type.toLowerCase().replace(/_/g, '_');
      if (result && result[resultKey]) {
        setContentText(result[resultKey]);
        setSuccess(`Successfully generated ${type.replace(/_/g, ' ')}!`);
      } else {
        setError(`No content generated for ${type.replace(/_/g, ' ')}. The AI response may be incomplete. Please try again.`);
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err.message || 'Failed to generate content. Please check your API key and try again.');
    } finally {
      setPerContentAIGenerating(false);
    }
  };

  const handleMasterAIGeneration = async () => {
    if (!lessonData) {
      setError('Lesson data not loaded. Please wait...');
      return;
    }

    const selectedTypes = Object.entries(masterAISelections)
      .filter(([_, value]) => value.selected)
      .map(([key, value]) => ({ type: key, quantity: value.quantity }));

    if (selectedTypes.length === 0) {
      setError('Please select at least one content type to generate');
      return;
    }

    setIsGeneratingContent(true);
    setError(null);

    try {
      const subjectName = lessonData.class_subject?.subject_offering?.subject?.subject_name || 'General';
      const formName = lessonData.class_subject?.class?.form?.form_name || '';
      const topic = lessonData.topic || lessonData.lesson_title || '';
      const lessonTitle = lessonData.lesson_title || 'Untitled Lesson';
      const learningObjectives = lessonData.learning_objectives || '';
      const lessonPlan = lessonData.lesson_plan || '';

      if (!topic || !subjectName || !formName) {
        setError('Missing lesson information. Please ensure the lesson has a topic, subject, and form assigned.');
        return;
      }

      const contentItems = [];
      let sequenceOrder = content.length > 0 ? Math.max(...content.map(c => c.sequence_order || 0)) : 0;
      let hasQuiz = false;
      let hasAssignment = false;
      let hasVideo = false;

      // Separate special types from regular content types
      const regularTypes = selectedTypes.filter(({ type }) => 
        !['QUIZ', 'ASSIGNMENT', 'VIDEO'].includes(type)
      );
      const quizType = selectedTypes.find(({ type }) => type === 'QUIZ');
      const assignmentType = selectedTypes.find(({ type }) => type === 'ASSIGNMENT');
      const videoType = selectedTypes.find(({ type }) => type === 'VIDEO');

      // Generate regular content types
      for (const { type, quantity } of regularTypes) {
        try {
          const result = await generateStudentFacingContent({
            lessonTitle,
            topic,
            subject: subjectName,
            form: formName,
            lessonPlan,
            learningObjectives,
            contentType: type,
            quantity,
            additionalPrompt: masterAIPrompt
          });

          const typeMap = {
            'LEARNING_OUTCOMES': 'learning_outcomes',
            'KEY_CONCEPTS': 'key_concepts',
            'LEARNING_ACTIVITIES': 'learning_activities',
            'REFLECTION_QUESTIONS': 'reflection_questions',
            'DISCUSSION_PROMPTS': 'discussion_prompts',
            'SUMMARY': 'summary'
          };

          const resultKey = typeMap[type] || type.toLowerCase();
          if (result && result[resultKey]) {
            sequenceOrder++;
            contentItems.push({
              content_type: type,
              title: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              content_text: result[resultKey],
              content_section: getSectionForType(type),
              sequence_order: sequenceOrder,
              is_required: true,
              estimated_minutes: getEstimatedMinutesForType(type)
            });
          }
        } catch (err) {
          console.error(`Error generating ${type}:`, err);
          setError(`Failed to generate ${type}. ${err.message}`);
        }
      }

      // Handle Quiz generation
      if (quizType) {
        try {
          const quiz = await generateQuiz({
            topic,
            subject: subjectName,
            form: formName,
            lessonTitle,
            learningObjectives,
            numQuestions: quizType.quantity,
            bloomLevel: 'mixed',
            lessonPlan
          });

          setGeneratedQuiz(quiz);
          hasQuiz = true;
        } catch (err) {
          console.error('Error generating quiz:', err);
          setError(`Failed to generate quiz. ${err.message}`);
        }
      }

      // Handle Assignment generation (placeholder - would need assignment generation service)
      if (assignmentType) {
        setError('Assignment generation is not yet implemented. Please create assignments manually.');
        hasAssignment = true;
      }

      // Handle Video generation (placeholder - would need video generation service)
      if (videoType) {
        setError('Video generation is not yet implemented. Please add video links manually.');
        hasVideo = true;
      }

      // Save generated content items
      if (contentItems.length > 0) {
        try {
          for (const item of contentItems) {
            const contentData = {
              lesson_id: parseInt(lessonId),
              ...item,
              is_published: true,
              uploaded_by: user.user_id || user.userId
            };

            const { error: contentError } = await supabase
              .from('lesson_content')
              .insert([contentData]);

            if (contentError) {
              console.error('Error saving content item:', contentError);
              throw new Error(`Failed to save ${item.title}: ${contentError.message}`);
            }
          }

          setSuccess(`Successfully generated and saved ${contentItems.length} content item(s)!`);
          fetchContent();
        } catch (saveError) {
          console.error('Error saving content items:', saveError);
          setError(saveError.message || 'Failed to save some content items. Please check and try again.');
        }
      }

      // Show quiz generator if quiz was generated
      if (hasQuiz && generatedQuiz) {
        setShowAIAssistant(false);
        setShowQuizGenerator(true);
        if (contentItems.length > 0) {
          // Don't reset if we also have content items - user might want to generate more
          return;
        }
      } else if (contentItems.length > 0) {
        // Only close if we have saved content items
        setShowAIAssistant(false);
      } else if (hasAssignment || hasVideo) {
        // For assignment/video, show error but don't close modal so user can try again
        // Error message already set above
        return;
      } else if (hasQuiz && !generatedQuiz) {
        // Quiz generation failed
        return;
      }

      // Reset selections only if we successfully generated something
      if (contentItems.length > 0 || (hasQuiz && generatedQuiz)) {
        setMasterAISelections({
          LEARNING_OUTCOMES: { selected: false, quantity: 1 },
          KEY_CONCEPTS: { selected: false, quantity: 1 },
          LEARNING_ACTIVITIES: { selected: false, quantity: 3 },
          REFLECTION_QUESTIONS: { selected: false, quantity: 5 },
          DISCUSSION_PROMPTS: { selected: false, quantity: 3 },
          SUMMARY: { selected: false, quantity: 1 },
          QUIZ: { selected: false, quantity: 5 },
          ASSIGNMENT: { selected: false, quantity: 1 },
          VIDEO: { selected: false, quantity: 1 }
        });
        setMasterAIPrompt('');
      }

    } catch (err) {
      console.error('Error generating master AI content:', err);
      setError(err.message || 'Failed to generate content. Please check your API key and try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const getSectionForType = (type) => {
    const sectionMap = {
      'LEARNING_OUTCOMES': 'Introduction',
      'KEY_CONCEPTS': 'Learning',
      'LEARNING_ACTIVITIES': 'Learning',
      'REFLECTION_QUESTIONS': 'Assessment',
      'DISCUSSION_PROMPTS': 'Assessment',
      'SUMMARY': 'Closure'
    };
    return sectionMap[type] || 'Learning';
  };

  const getEstimatedMinutesForType = (type) => {
    const minutesMap = {
      'LEARNING_OUTCOMES': 5,
      'KEY_CONCEPTS': 10,
      'LEARNING_ACTIVITIES': 20,
      'REFLECTION_QUESTIONS': 5,
      'DISCUSSION_PROMPTS': 10,
      'SUMMARY': 5
    };
    return minutesMap[type] || 10;
  };

  // Handle Quiz Generation
  const handleGenerateQuiz = async () => {
    if (!lessonData) {
      setError('Lesson data not loaded. Please wait...');
      return;
    }

    const subjectName = lessonData.class_subject?.subject_offering?.subject?.subject_name || 'General';
    const formName = lessonData.class_subject?.class?.form?.form_name || '';
    const topic = lessonData.topic || lessonData.lesson_title || '';
    const lessonTitle = lessonData.lesson_title || 'Untitled Lesson';
    const learningObjectives = lessonData.learning_objectives || '';
    const lessonPlan = lessonData.lesson_plan || '';

    if (!topic || !subjectName || !formName) {
      setError('Missing lesson information. Please ensure the lesson has a topic, subject, and form assigned.');
      return;
    }

    setIsGeneratingQuiz(true);
    setError(null);

    try {
      const quiz = await generateQuiz({
        topic,
        subject: subjectName,
        form: formName,
        lessonTitle,
        learningObjectives,
        numQuestions: quizParams.numQuestions,
        bloomLevel: quizParams.bloomLevel,
        lessonPlan
      });

      setGeneratedQuiz(quiz);
      setShowQuizGenerator(true);
      setShowAIAssistant(false);
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err.message || 'Failed to generate quiz. Please check your API key and try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSaveGeneratedQuiz = async () => {
    if (!generatedQuiz || !generatedQuiz.quiz_questions || generatedQuiz.quiz_questions.length === 0) {
      setError('No quiz to save');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const maxSequence = content.length > 0
        ? Math.max(...content.map(c => c.sequence_order || 0))
        : 0;

      const quizTitle = pendingQuizTitle || generatedQuiz.quiz_title || `Quiz: ${lessonData.topic || 'Lesson Quiz'}`;

      const contentData = {
        lesson_id: parseInt(lessonId),
        content_type: 'QUIZ',
        title: quizTitle,
        description: generatedQuiz.quiz_description || '',
        content_section: 'Assessment',
        sequence_order: maxSequence + 1,
        is_required: true,
        estimated_minutes: quizParams.numQuestions * 2,
        is_published: true,
        uploaded_by: user.user_id || user.userId
      };

      const { data: contentItem, error: contentError } = await supabase
        .from('lesson_content')
        .insert([contentData])
        .select()
        .single();

      if (contentError) throw contentError;

      const quizData = {
        content_id: contentItem.content_id,
        title: generatedQuiz.quiz_title || `Quiz: ${lessonData.topic || 'Lesson Quiz'}`,
        description: generatedQuiz.quiz_description || '',
        instructions: 'Complete all questions. Read each question carefully before answering.',
        time_limit_minutes: null,
        passing_score: 70,
        allow_multiple_attempts: false,
        max_attempts: 1,
        show_results_immediately: true,
        show_correct_answers: true,
        randomize_questions: false,
        randomize_answers: false,
        is_published: true,
        created_by: user.user_id || user.userId
      };

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert([quizData])
        .select()
        .single();

      if (quizError) throw quizError;

      for (let qIdx = 0; qIdx < generatedQuiz.quiz_questions.length; qIdx++) {
        const q = generatedQuiz.quiz_questions[qIdx];

        const questionData = {
          quiz_id: quiz.quiz_id,
          question_type: q.question_type || 'MULTIPLE_CHOICE',
          question_text: q.question_text.trim(),
          question_order: qIdx + 1,
          points: q.points || 1,
          explanation: q.explanation || null,
          is_required: true
        };

        const { data: question, error: questionError } = await supabase
          .from('quiz_questions')
          .insert([questionData])
          .select()
          .single();

        if (questionError) throw questionError;

        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          const optionsData = q.options.map((opt, optIdx) => ({
            question_id: question.question_id,
            option_text: opt.text || String(opt),
            is_correct: opt.is_correct === true || opt.is_correct === 'true',
            option_order: optIdx + 1
          }));

          const { error: optionsError } = await supabase
            .from('quiz_options')
            .insert(optionsData);

          if (optionsError) throw optionsError;
        } else if (q.correct_answer) {
          const { error: answerError } = await supabase
            .from('quiz_questions')
            .update({ correct_answer: q.correct_answer })
            .eq('question_id', question.question_id);

          if (answerError) throw answerError;
        }
      }

      setSuccess(`Quiz "${quizTitle}" created successfully with ${generatedQuiz.quiz_questions.length} questions!`);
      setShowQuizGenerator(false);
      setGeneratedQuiz(null);
      setPendingQuizTitle(null);
      fetchContent();
    } catch (err) {
      console.error('Error saving quiz:', err);
      setError(err.message || 'Failed to save quiz');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAIContent = async (mode = 'complete') => {
    if (!lessonData) {
      setError('Lesson data not loaded. Please wait...');
      return;
    }

    const subjectName = lessonData.class_subject?.subject_offering?.subject?.subject_name || 'General';
    const formName = lessonData.class_subject?.class?.form?.form_name || '';
    const topic = lessonData.topic || lessonData.lesson_title || '';
    const lessonTitle = lessonData.lesson_title || 'Untitled Lesson';
    const learningObjectives = lessonData.learning_objectives || '';
    const lessonPlan = lessonData.lesson_plan || '';
    const duration = lessonData.start_time && lessonData.end_time
      ? calculateDuration(lessonData.start_time, lessonData.end_time)
      : 45;

    if (!topic || !subjectName || !formName) {
      setError('Missing lesson information. Please ensure the lesson has a topic, subject, and form assigned.');
      return;
    }

    setIsGeneratingContent(true);
    setError(null);
    setAiGenerationMode(mode);

    try {
      if (mode === 'complete') {
        const contentItems = await generateCompleteLessonContent({
          lessonTitle,
          topic,
          subject: subjectName,
          form: formName,
          learningObjectives,
          lessonPlan,
          duration
        });
        setGeneratedContentItems(contentItems);
        setShowAIContentModal(true);
      } else if (mode === 'student') {
        const studentContent = await generateStudentFacingContent({
          lessonTitle,
          topic,
          subject: subjectName,
          form: formName,
          lessonPlan,
          learningObjectives
        });

        const contentItems = [];
        if (studentContent.key_concepts) {
          contentItems.push({
            content_type: 'KEY_CONCEPTS',
            title: 'Key Concepts',
            content_text: studentContent.key_concepts,
            content_section: 'Learning',
            sequence_order: 1,
            is_required: true,
            estimated_minutes: 10
          });
        }
        if (studentContent.learning_activities) {
          contentItems.push({
            content_type: 'LEARNING_ACTIVITIES',
            title: 'Learning Activities',
            content_text: studentContent.learning_activities,
            content_section: 'Learning',
            sequence_order: 2,
            is_required: true,
            estimated_minutes: 20
          });
        }
        if (studentContent.reflection_questions) {
          contentItems.push({
            content_type: 'REFLECTION_QUESTIONS',
            title: 'Reflection Questions',
            content_text: studentContent.reflection_questions,
            content_section: 'Assessment',
            sequence_order: 3,
            is_required: false,
            estimated_minutes: 5
          });
        }
        if (studentContent.discussion_prompts) {
          contentItems.push({
            content_type: 'DISCUSSION_PROMPTS',
            title: 'Discussion Prompts',
            content_text: studentContent.discussion_prompts,
            content_section: 'Assessment',
            sequence_order: 4,
            is_required: false,
            estimated_minutes: 10
          });
        }
        if (studentContent.summary) {
          contentItems.push({
            content_type: 'SUMMARY',
            title: 'Lesson Summary',
            content_text: studentContent.summary,
            content_section: 'Closure',
            sequence_order: 5,
            is_required: true,
            estimated_minutes: 5
          });
        }
        setGeneratedContentItems(contentItems);
        setShowAIContentModal(true);
      }
      setShowAIAssistant(false);
    } catch (err) {
      console.error('Error generating AI content:', err);
      setError(err.message || 'Failed to generate content. Please check your API key and try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleApplyTemplate = async (template) => {
    setIsGeneratingContent(true);
    setShowAIAssistant(false);

    try {
      let contentItems = [];

      if (template === 'standard') {
        contentItems = [
          {
            content_type: 'LEARNING_OUTCOMES',
            title: 'Learning Outcomes',
            content_text: 'By the end of this lesson, students will be able to...',
            content_section: 'Introduction',
            sequence_order: 1,
            is_required: true,
            estimated_minutes: 5
          },
          {
            content_type: 'VIDEO',
            title: 'Introduction Video',
            url: '',
            description: 'Watch this video to understand the core concepts.',
            content_section: 'Learning',
            sequence_order: 2,
            is_required: true,
            estimated_minutes: 15
          },
          {
            content_type: 'KEY_CONCEPTS',
            title: 'Key Concepts',
            content_text: '- Concept 1\n- Concept 2\n- Concept 3',
            content_section: 'Learning',
            sequence_order: 3,
            is_required: true,
            estimated_minutes: 10
          },
          {
            content_type: 'QUIZ',
            title: 'Check for Understanding',
            content_text: 'Short quiz to verify learning.',
            content_section: 'Assessment',
            sequence_order: 4,
            is_required: true,
            estimated_minutes: 10
          },
          {
            content_type: 'SUMMARY',
            title: 'Lesson Summary',
            content_text: 'In this lesson, we covered...',
            content_section: 'Closure',
            sequence_order: 5,
            is_required: true,
            estimated_minutes: 5
          }
        ];
      } else if (template === 'interactive') {
        contentItems = [
          {
            content_type: 'INTERACTIVE_BOOK',
            title: 'Interactive Lesson Book',
            description: 'Read through the interactive book and complete the embedded activities.',
            content_section: 'Learning',
            sequence_order: 1,
            is_required: true,
            estimated_minutes: 30
          },
          {
            content_type: 'FLASHCARD',
            title: 'Vocabulary Flashcards',
            description: 'Review these terms before the quiz.',
            content_section: 'Review',
            sequence_order: 2,
            is_required: false,
            estimated_minutes: 10
          },
          {
            content_type: 'QUIZ',
            title: 'Final Quiz',
            content_text: 'Assessment of the interactive lesson.',
            content_section: 'Assessment',
            sequence_order: 3,
            is_required: true,
            estimated_minutes: 15
          }
        ];
      } else if (template === 'video_lecture') {
        contentItems = [
          {
            content_type: 'VIDEO',
            title: 'Lecture Part 1',
            url: '',
            description: 'Introduction to the topic.',
            content_section: 'Lecture',
            sequence_order: 1,
            is_required: true,
            estimated_minutes: 15
          },
          {
            content_type: 'DISCUSSION_PROMPTS',
            title: 'Discussion: Part 1',
            content_text: 'What are your thoughts on...',
            content_section: 'Lecture',
            sequence_order: 2,
            is_required: true,
            estimated_minutes: 10
          },
          {
            content_type: 'VIDEO',
            title: 'Lecture Part 2',
            url: '',
            description: 'Deep dive into key concepts.',
            content_section: 'Lecture',
            sequence_order: 3,
            is_required: true,
            estimated_minutes: 15
          },
          {
            content_type: 'REFLECTION_QUESTIONS',
            title: 'Reflection',
            content_text: 'How does this apply to...',
            content_section: 'Closure',
            sequence_order: 4,
            is_required: false,
            estimated_minutes: 5
          }
        ];
      }

      setGeneratedContentItems(contentItems);
      setShowAIContentModal(true);
    } catch (err) {
      console.error('Error applying template:', err);
      setError(err.message || 'Failed to apply template');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSaveGeneratedContent = async () => {
    if (!generatedContentItems || generatedContentItems.length === 0) {
      setError('No content to save');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const maxSequence = content.length > 0
        ? Math.max(...content.map(c => c.sequence_order || 0))
        : 0;

      for (let i = 0; i < generatedContentItems.length; i++) {
        const item = generatedContentItems[i];
        const contentData = {
          lesson_id: parseInt(lessonId),
          content_type: item.content_type,
          title: item.title,
          description: item.description || '',
          content_text: item.content_text || '',
          url: item.url || null,
          content_section: item.content_section || 'Learning',
          sequence_order: maxSequence + i + 1,
          is_required: item.is_required !== false,
          estimated_minutes: item.estimated_minutes || 10,
          is_published: true,
          uploaded_by: user.user_id || user.userId
        };

        const { error: contentError } = await supabase
          .from('lesson_content')
          .insert([contentData]);

        if (contentError) throw contentError;
      }

      setSuccess(`Successfully added ${generatedContentItems.length} content item(s)!`);
      setShowAIContentModal(false);
      setGeneratedContentItems([]);
      fetchContent();
    } catch (err) {
      console.error('Error saving generated content:', err);
      setError(err.message || 'Failed to save content');
    } finally {
      setUploading(false);
    }
  };

  // Content CRUD Operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      let fileUrl = url;
      let filePath = null;
      let fileName = null;
      let fileSize = null;
      let mimeType = null;

      // Handle file upload
      if (selectedFile && contentType === 'FILE') {
        const fileExt = selectedFile.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        filePath = `lessons/${lessonId}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-content')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
      }

      const maxSequence = content.length > 0
        ? Math.max(...content.map(c => c.sequence_order || 0))
        : 0;

      const contentData = {
        lesson_id: parseInt(lessonId),
        content_type: contentType,
        title: title,
        description: description || null,
        instructions: instructions || null,
        content_text: contentText || null,
        url: fileUrl || null,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        content_section: contentSection,
        sequence_order: editingContent ? editingContent.sequence_order : maxSequence + 1,
        is_required: isRequired,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        prerequisites: selectedPrerequisites.length > 0 ? selectedPrerequisites : null,
        is_published: true,
        uploaded_by: user.user_id || user.userId
      };

      // Handle 3D model metadata
      if ((contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') && selected3DModel) {
        contentData.metadata = {
          arvr_content_id: selected3DModel.content_id
        };
      }

      if (editingContent) {
        const { error: updateError } = await supabase
          .from('lesson_content')
          .update(contentData)
          .eq('content_id', editingContent.content_id);

        if (updateError) throw updateError;
        setSuccess('Content updated successfully!');
      } else {
        const { error: insertError } = await supabase
          .from('lesson_content')
          .insert([contentData]);

        if (insertError) throw insertError;
        setSuccess('Content added successfully!');
      }

      handleCloseModal();
      fetchContent();
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err.message || 'Failed to save content');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('lesson_content')
        .delete()
        .eq('content_id', contentId);

      if (error) throw error;
      setSuccess('Content deleted successfully!');
      fetchContent();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    }
  };

  // Drag and Drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(content);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence_order: index + 1
    }));

    setContent(updatedItems);

    // Save to database
    try {
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('lesson_content')
          .update({ sequence_order: item.sequence_order })
          .eq('content_id', item.content_id);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error reordering content:', err);
      setError('Failed to save new order');
      fetchContent();
    }
  };

  // Group content by section
  const groupContentBySection = () => {
    const sections = {};
    content.forEach(item => {
      const section = item.content_section || 'Learning';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(item);
    });
    return sections;
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return <FaVideo className="me-2" />;
      case 'IMAGE':
        return <FaImage className="me-2" />;
      case 'LINK':
        return <FaLink className="me-2" />;
      case 'QUIZ':
        return <FaClipboardCheck className="me-2 text-danger" />;
      case 'ASSIGNMENT':
        return <FaTasks className="me-2 text-warning" />;
      case 'TEST':
        return <FaClipboardList className="me-2 text-info" />;
      case 'EXAM':
        return <FaFileSignature className="me-2 text-danger" />;
      case 'PROJECT':
        return <FaProjectDiagram className="me-2 text-success" />;
      case 'SURVEY':
        return <FaPoll className="me-2 text-primary" />;
      case 'LEARNING_OUTCOMES':
        return <FaGraduationCap className="me-2 text-primary" />;
      case 'LEARNING_ACTIVITIES':
        return <FaBook className="me-2 text-success" />;
      case 'KEY_CONCEPTS':
        return <FaLightbulb className="me-2 text-warning" />;
      case 'REFLECTION_QUESTIONS':
        return <FaQuestionCircle className="me-2 text-info" />;
      case 'DISCUSSION_PROMPTS':
        return <FaComments className="me-2 text-purple" />;
      case 'SUMMARY':
        return <FaFileAlt className="me-2 text-secondary" />;
      default:
        return <FaFileAlt className="me-2" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const getContentUrl = async (item) => {
    if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
      return item.url;
    }

    if (item.file_path) {
      if (signedUrls[item.content_id]) {
        return signedUrls[item.content_id];
      }

      try {
        const { data, error } = await supabase.storage
          .from('course-content')
          .createSignedUrl(item.file_path, 3600);

        if (error) {
          try {
            const { data: publicUrlData } = supabase.storage
              .from('course-content')
              .getPublicUrl(item.file_path);

            if (publicUrlData?.publicUrl) {
              return publicUrlData.publicUrl;
            }
          } catch (publicUrlError) {
            console.error('Error getting public URL:', publicUrlError);
          }

          if (item.url) {
            return item.url;
          }
          throw error;
        }

        if (data?.signedUrl) {
          setSignedUrls(prev => ({ ...prev, [item.content_id]: data.signedUrl }));
          return data.signedUrl;
        }
      } catch (err) {
        console.error('Error generating signed URL:', err);
        if (item.url) {
          return item.url;
        }
        return null;
      }
    }

    if (item.url) {
      return item.url;
    }

    return null;
  };

  const handlePreview = async (item) => {
    try {
      if (item.content_type === 'FLASHCARD') {
        setEditingContent(item);
        setCurrentFlashcardContentId(item.content_id);
        setShowFlashcardCreator(true);
        return;
      }

      if (item.content_type === 'INTERACTIVE_VIDEO') {
        setEditingContent(item);
        setCurrentInteractiveVideoContentId(item.content_id);
        setShowInteractiveVideoCreator(true);
        return;
      }

      if (item.content_type === 'INTERACTIVE_BOOK') {
        setEditingContent(item);
        setCurrentInteractiveBookContentId(item.content_id);
        setShowInteractiveBookCreator(true);
        return;
      }

      if (item.content_type === 'QUIZ') {
        try {
          const fullQuiz = await supabaseService.getQuizByContentId(item.content_id);

          if (fullQuiz) {
            setPreviewUrl(null);
            setPreviewingContent({ ...item, hasInAppQuiz: true, quiz: fullQuiz });
            setShowPreviewModal(true);
            return;
          }
        } catch (quizError) {
          console.log('No in-app quiz found, checking for URL');
        }
      }

      if (item.content_type === 'ASSIGNMENT') {
        setPreviewUrl(null);
        setPreviewingContent(item);
        setShowPreviewModal(true);
        return;
      }

      const url = await getContentUrl(item);

      if (url) {
        setPreviewingContent(item);
        setPreviewUrl(url);
        setShowPreviewModal(true);
      } else {
        setPreviewingContent(item);
        setPreviewUrl(null);
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error('Error previewing content:', err);
      setPreviewingContent(item);
      setPreviewUrl(null);
      setShowPreviewModal(true);
    }
  };

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewingContent(null);
    setPreviewUrl(null);
  };

  const handleOpenQuizBuilder = (item) => {
    setCurrentQuizContentId(item.content_id);
    setShowQuizBuilder(true);
  };

  // ========== RENDER ==========
  
  if (isLoading) {
    return (
      <Container className="lesson-content-manager">
        <div className="loading-state">
          <Spinner animation="border" variant="primary" />
          <p>Loading lesson content...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="lesson-content-manager">
      {/* Enhanced Header */}
      <div className="content-manager-header">
        <Row className="align-items-center">
          <Col>
            <div className="header-breadcrumb">
              <span onClick={() => navigate('/teacher/lessons')} className="breadcrumb-link">Lessons</span>
              <FaChevronRight className="breadcrumb-separator" />
              <span className="breadcrumb-current">Content Manager</span>
            </div>
            <h2>
              <FaLayerGroup className="me-3" />
              {lessonData?.lesson_title || 'Lesson Content'}
            </h2>
            {lessonData && (
              <p className="header-meta">
                {lessonData.class_subject?.subject_offering?.subject?.subject_name} • 
                {lessonData.class_subject?.class?.form?.form_name} • 
                {lessonData.topic}
              </p>
            )}
          </Col>
        </Row>
      </div>

      {/* Streamlined Action Bar */}
      <div className="content-action-bar">
        <div className="action-bar-left">
          <div className="content-stats">
            <div className="stat-item">
              <span className="stat-number">{content.length}</span>
              <span className="stat-label">Items</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {content.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0)}
              </span>
              <span className="stat-label">Minutes</span>
            </div>
          </div>
        </div>
        
        <div className="action-bar-right">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(`/teacher/content-library?lessonId=${lessonId}`)}
            className="action-btn"
          >
            <FaDatabase className="me-2" />
            Library
          </Button>
          
          <Button
            variant="outline-secondary"
            onClick={() => navigate(`/teacher/lesson/${lessonId}/preview`)}
            className="action-btn"
          >
            <FaEye className="me-2" />
            Preview
          </Button>

          {/* UNIFIED AI ASSISTANT BUTTON */}
          <Button
            variant="ai-assistant"
            onClick={() => setShowAIAssistant(true)}
            disabled={isGeneratingContent || !lessonData}
            className="action-btn ai-btn"
          >
            {isGeneratingContent ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <FaRobot className="me-2" />
                AI Assistant
              </>
            )}
          </Button>

          <Button 
            variant="primary" 
            onClick={() => handleOpenModal()}
            className="action-btn primary-btn"
          >
            <FaPlus className="me-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="content-alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="content-alert">
          {success}
        </Alert>
      )}

      {/* Main Content Area */}
      <Row className="content-main-area">
        {/* Left Column - Lesson Plan Reference */}
        <Col lg={4} className="lesson-plan-column">
          <Card className="lesson-plan-card">
            <Card.Header>
              <FaBook className="me-2" />
              Lesson Plan Reference
            </Card.Header>
            <Card.Body>
              {lessonData?.lesson_plan ? (
                <StructuredLessonPlanDisplay lessonPlanText={lessonData.lesson_plan} />
              ) : (
                <div className="empty-plan-state">
                  <FaInfoCircle className="empty-icon" />
                  <p>No lesson plan available</p>
                  <small>Add a lesson plan to guide content creation</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Content Items */}
        <Col lg={8} className="content-items-column">
          {content.length === 0 ? (
            <Card className="empty-content-card">
              <Card.Body>
                <div className="empty-content-state">
                  <FaLayerGroup className="empty-icon" />
                  <h4>No Content Yet</h4>
                  <p>Start building your lesson by adding content items or using the AI Assistant</p>
                  <div className="empty-actions">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setShowAIAssistant(true)}
                      className="me-2"
                    >
                      <FaRobot className="me-2" />
                      Use AI Assistant
                    </Button>
                    <Button variant="primary" onClick={() => handleOpenModal()}>
                      <FaPlus className="me-2" />
                      Add Content
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              {Object.entries(groupContentBySection()).map(([sectionName, sectionContent]) => (
                <div key={sectionName} className="content-section">
                  <div className="content-section-header">
                    <h4>
                      {getSectionIcon(sectionName)}
                      {sectionName}
                      <Badge bg="secondary" className="ms-2">{sectionContent.length}</Badge>
                    </h4>
                  </div>
                  
                  <Droppable droppableId={sectionName}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="content-grid"
                      >
                        {sectionContent.map((item, index) => (
                          <Draggable
                            key={item.content_id}
                            draggableId={String(item.content_id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`content-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                              >
                                <div className="content-card-header">
                                  <div
                                    className="content-drag-handle"
                                    {...provided.dragHandleProps}
                                  >
                                    <FaGripVertical />
                                  </div>
                                  
                                  <div className={`content-type-badge type-${item.content_type.toLowerCase()}`}>
                                    {getContentIcon(item.content_type)}
                                  </div>
                                  
                                  <div className="content-info">
                                    <div className="content-title">
                                      {item.title}
                                    </div>
                                    {item.description && (
                                      <div className="content-description">
                                        {item.description}
                                      </div>
                                    )}
                                    <div className="content-meta">
                                      <span className="content-meta-item">
                                        <Badge bg="light" text="dark">{item.content_type}</Badge>
                                      </span>
                                      {item.estimated_minutes && (
                                        <span className="content-meta-item">
                                          <FaClock /> {item.estimated_minutes} min
                                        </span>
                                      )}
                                      <span className={`content-badge ${item.is_required !== false ? 'badge-required' : 'badge-optional'}`}>
                                        {item.is_required !== false ? 'Required' : 'Optional'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="content-actions">
                                    <button
                                      className="content-action-btn btn-preview"
                                      onClick={() => handlePreview(item)}
                                      title="Preview"
                                    >
                                      <FaEye />
                                    </button>
                                    <button
                                      className="content-action-btn btn-edit"
                                      onClick={() => handleOpenModal(item)}
                                      title="Edit"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      className="content-action-btn btn-delete"
                                      onClick={() => handleDelete(item.content_id)}
                                      title="Delete"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </DragDropContext>
          )}
        </Col>
      </Row>

      {/* ========== UNIFIED AI ASSISTANT MODAL ========== */}
      <Modal
        show={showAIAssistant}
        onHide={() => setShowAIAssistant(false)}
        size="lg"
        centered
        className="ai-assistant-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaRobot className="me-2" />
            AI Content Assistant
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lessonData && (
            <Alert variant="light" className="lesson-context-alert">
              <strong>Lesson Context</strong>
              <div className="context-details">
                <span><strong>Subject:</strong> {lessonData.class_subject?.subject_offering?.subject?.subject_name || 'N/A'}</span>
                <span><strong>Form:</strong> {lessonData.class_subject?.class?.form?.form_name || 'N/A'}</span>
                <span><strong>Topic:</strong> {lessonData.topic || lessonData.lesson_title || 'N/A'}</span>
              </div>
            </Alert>
          )}

          <Tabs
            activeKey={aiAssistantTab}
            onSelect={(k) => setAiAssistantTab(k)}
            className="ai-assistant-tabs"
          >
            {/* Quick Generate Tab */}
            <Tab eventKey="quick" title={<><FaRocket className="me-1" /> Quick Generate</>}>
              <div className="tab-content-area">
                <p className="tab-description">
                  Instantly generate a complete set of lesson content with one click.
                </p>
                <div className="quick-options">
                  <Card 
                    className="quick-option-card"
                    onClick={() => handleGenerateAIContent('complete')}
                  >
                    <Card.Body>
                      <FaMagic className="option-icon text-primary" />
                      <h5>Complete Lesson</h5>
                      <p>Generate all content types including outcomes, concepts, activities, and summary</p>
                    </Card.Body>
                  </Card>
                  
                  <Card 
                    className="quick-option-card"
                    onClick={() => handleGenerateAIContent('student')}
                  >
                    <Card.Body>
                      <FaGraduationCap className="option-icon text-success" />
                      <h5>Student Materials</h5>
                      <p>Generate student-facing content: key concepts, activities, and reflection questions</p>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </Tab>

            {/* Custom Generator Tab */}
            <Tab eventKey="custom" title={<><FaBrain className="me-1" /> Custom Generator</>}>
              <div className="tab-content-area">
                <p className="tab-description">
                  Select specific content types to generate with customizable quantities.
                </p>
                
                <Form.Group className="mb-4">
                  <Form.Label><strong>Additional Instructions (Optional)</strong></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={masterAIPrompt || ''}
                    onChange={(e) => setMasterAIPrompt(e.target.value)}
                    placeholder="Add specific instructions (e.g., focus on practical examples, include real-world applications)"
                  />
                </Form.Group>

                <div className="content-type-grid">
                  <div className="type-category">
                    <h6>Learning Content</h6>
                    {['LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'LEARNING_ACTIVITIES', 'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].map((type) => (
                      <div key={type} className="type-option">
                        <Form.Check
                          type="checkbox"
                          id={`ai-type-${type}`}
                          label={type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          checked={masterAISelections[type]?.selected || false}
                          onChange={(e) => {
                            setMasterAISelections({
                              ...masterAISelections,
                              [type]: { ...masterAISelections[type], selected: e.target.checked }
                            });
                          }}
                        />
                        {masterAISelections[type]?.selected && ['LEARNING_ACTIVITIES', 'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS'].includes(type) && (
                          <Form.Control
                            type="number"
                            min="1"
                            max="10"
                            value={masterAISelections[type]?.quantity || 1}
                            onChange={(e) => {
                              setMasterAISelections({
                                ...masterAISelections,
                                [type]: { ...masterAISelections[type], quantity: parseInt(e.target.value) || 1 }
                              });
                            }}
                            className="quantity-input"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="type-category">
                    <h6>Assessments</h6>
                    <div className="type-option">
                      <Form.Check
                        type="checkbox"
                        id="ai-type-QUIZ"
                        label="Quiz"
                        checked={masterAISelections.QUIZ?.selected || false}
                        onChange={(e) => {
                          setMasterAISelections({
                            ...masterAISelections,
                            QUIZ: { ...masterAISelections.QUIZ, selected: e.target.checked }
                          });
                        }}
                      />
                      {masterAISelections.QUIZ?.selected && (
                        <Form.Control
                          type="number"
                          min="1"
                          max="20"
                          value={masterAISelections.QUIZ?.quantity || 5}
                          onChange={(e) => {
                            setMasterAISelections({
                              ...masterAISelections,
                              QUIZ: { ...masterAISelections.QUIZ, quantity: parseInt(e.target.value) || 5 }
                            });
                          }}
                          className="quantity-input"
                          placeholder="Questions"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleMasterAIGeneration}
                  disabled={isGeneratingContent || Object.values(masterAISelections).every(s => !s.selected)}
                  className="generate-btn"
                >
                  {isGeneratingContent ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaMagic className="me-2" />
                      Generate Selected Content
                    </>
                  )}
                </Button>
              </div>
            </Tab>

            {/* Quiz Generator Tab */}
            <Tab eventKey="quiz" title={<><FaClipboardCheck className="me-1" /> Quiz Generator</>}>
              <div className="tab-content-area">
                <p className="tab-description">
                  Generate an assessment quiz based on the lesson content.
                </p>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Number of Questions</strong></Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="20"
                        value={quizParams?.numQuestions || 5}
                        onChange={(e) => setQuizParams({ ...quizParams, numQuestions: parseInt(e.target.value) || 5 })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Bloom's Taxonomy Level</strong></Form.Label>
                      <Form.Select
                        value={quizParams?.bloomLevel || 'mixed'}
                        onChange={(e) => setQuizParams({ ...quizParams, bloomLevel: e.target.value })}
                      >
                        <option value="mixed">Mixed Levels</option>
                        <option value="remember">Remember</option>
                        <option value="understand">Understand</option>
                        <option value="apply">Apply</option>
                        <option value="analyze">Analyze</option>
                        <option value="evaluate">Evaluate</option>
                        <option value="create">Create</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  variant="success"
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="generate-btn"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <FaMagic className="me-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </div>
            </Tab>

            {/* Templates Tab */}
            <Tab eventKey="templates" title={<><FaLayerGroup className="me-1" /> Templates</>}>
              <div className="tab-content-area">
                <p className="tab-description">
                  Start with a pre-built lesson structure template.
                </p>
                
                <div className="template-grid">
                  <Card 
                    className="template-card"
                    onClick={() => handleApplyTemplate('standard')}
                  >
                    <Card.Body>
                      <h5>📚 Standard Lesson</h5>
                      <p>Outcomes → Video → Concepts → Quiz → Summary</p>
                      <ul>
                        <li>Learning Outcomes</li>
                        <li>Introduction Video</li>
                        <li>Key Concepts</li>
                        <li>Quiz</li>
                        <li>Summary</li>
                      </ul>
                    </Card.Body>
                  </Card>
                  
                  <Card 
                    className="template-card"
                    onClick={() => handleApplyTemplate('interactive')}
                  >
                    <Card.Body>
                      <h5>🎮 Interactive Learning</h5>
                      <p>Book → Flashcards → Assessment</p>
                      <ul>
                        <li>Interactive Book</li>
                        <li>Vocabulary Flashcards</li>
                        <li>Final Quiz</li>
                      </ul>
                    </Card.Body>
                  </Card>
                  
                  <Card 
                    className="template-card"
                    onClick={() => handleApplyTemplate('video_lecture')}
                  >
                    <Card.Body>
                      <h5>🎬 Video Lecture</h5>
                      <p>Multi-part video with discussions</p>
                      <ul>
                        <li>Lecture Part 1</li>
                        <li>Discussion</li>
                        <li>Lecture Part 2</li>
                        <li>Reflection</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>

      {/* Add/Edit Content Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        className="content-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContent ? 'Edit Content' : 'Add New Content'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Content Type *</Form.Label>
                  <Form.Select
                    value={contentType || 'FILE'}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setContentType(newType);
                      setSelectedFile(null);
                      setUrl('');
                      setContentText('');

                      if (newType === 'FLASHCARD' && !editingContent) {
                        setShowModal(false);
                        setShowFlashcardCreator(true);
                        setCurrentFlashcardContentId(null);
                        return;
                      }

                      if (newType === 'INTERACTIVE_VIDEO' && !editingContent) {
                        setShowModal(false);
                        setShowInteractiveVideoCreator(true);
                        setCurrentInteractiveVideoContentId(null);
                        return;
                      }

                      if (newType === 'INTERACTIVE_BOOK' && !editingContent) {
                        setShowModal(false);
                        setShowInteractiveBookCreator(true);
                        setCurrentInteractiveBookContentId(null);
                        return;
                      }
                    }}
                    required
                  >
                    <optgroup label="Media & Files">
                      <option value="FILE">File Upload</option>
                      <option value="LINK">External Link</option>
                      <option value="VIDEO">Video Link</option>
                      <option value="IMAGE">Image Link</option>
                      <option value="DOCUMENT">Document Link</option>
                    </optgroup>
                    <optgroup label="Assessments">
                      <option value="QUIZ">Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="TEST">Test</option>
                      <option value="EXAM">Exam</option>
                      <option value="PROJECT">Project</option>
                      <option value="SURVEY">Survey/Poll</option>
                    </optgroup>
                    <optgroup label="Interactive Content">
                      <option value="FLASHCARD">Flashcard Set</option>
                      <option value="INTERACTIVE_VIDEO">Interactive Video</option>
                      <option value="INTERACTIVE_BOOK">Interactive Book</option>
                      <option value="3D_MODEL">3D Model</option>
                      <option value="AR_OVERLAY">AR Content</option>
                    </optgroup>
                    <optgroup label="Learning Content">
                      <option value="LEARNING_OUTCOMES">Learning Outcomes</option>
                      <option value="LEARNING_ACTIVITIES">Learning Activities</option>
                      <option value="KEY_CONCEPTS">Key Concepts</option>
                      <option value="REFLECTION_QUESTIONS">Reflection Questions</option>
                      <option value="DISCUSSION_PROMPTS">Discussion Prompts</option>
                      <option value="SUMMARY">Summary</option>
                    </optgroup>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section *</Form.Label>
                  <Form.Select
                    value={contentSection || 'Learning'}
                    onChange={(e) => setContentSection(e.target.value)}
                    required
                  >
                    <option value="Introduction">Introduction</option>
                    <option value="Learning">Learning</option>
                    <option value="Practice">Practice</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Review">Review</option>
                    <option value="Closure">Closure</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={title || ''}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Content title"
                required
              />
            </Form.Group>

            {['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
              'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(contentType) ? (
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0">Content *</Form.Label>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleGeneratePerContentType(contentType)}
                    disabled={perContentAIGenerating || !lessonData}
                  >
                    {perContentAIGenerating ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaMagic className="me-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={contentText || ''}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder={`Enter ${contentType.replace(/_/g, ' ').toLowerCase()}...`}
                  required
                />
              </Form.Group>
            ) : contentType === 'FILE' ? (
              <Form.Group className="mb-3">
                <Form.Label>Upload File</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                {selectedFile && (
                  <small className="text-muted">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </small>
                )}
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>URL</Form.Label>
                <Form.Control
                  type="url"
                  value={url || ''}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this content"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estimated Minutes</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={estimatedMinutes || ''}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="e.g., 15"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Required?</Form.Label>
                  <Form.Check
                    type="switch"
                    id="is-required-switch"
                    label={isRequired ? 'Yes - Required' : 'No - Optional'}
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* 3D Model Selection */}
            {(contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') && (
              <Form.Group className="mb-3">
                <Form.Label>Select 3D Model</Form.Label>
                {loading3DModels ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading models...</span>
                  </div>
                ) : (
                  <Form.Select
                    value={selected3DModel?.content_id || ''}
                    onChange={(e) => {
                      const model = available3DModels.find(m => m.content_id === parseInt(e.target.value));
                      setSelected3DModel(model || null);
                    }}
                  >
                    <option value="">Select a 3D model...</option>
                    {available3DModels.map(model => (
                      <option key={model.content_id} value={model.content_id}>
                        {model.title}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                editingContent ? 'Update Content' : 'Add Content'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Generated Content Review Modal */}
      <Modal
        show={showAIContentModal}
        onHide={() => {
          setShowAIContentModal(false);
          setGeneratedContentItems([]);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            Review Generated Content
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Review the generated content below. You can edit individual items after saving.
          </Alert>
          <ListGroup>
            {generatedContentItems.map((item, index) => (
              <ListGroup.Item key={index}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{item.title}</strong>
                    <Badge bg="secondary" className="ms-2">{item.content_type}</Badge>
                    <Badge bg="info" className="ms-2">{item.content_section}</Badge>
                  </div>
                  <Badge bg="light" text="dark">
                    <FaClock className="me-1" />
                    {item.estimated_minutes} min
                  </Badge>
                </div>
                {item.content_text && (
                  <div className="mt-2 text-muted" style={{ fontSize: '0.875rem' }}>
                    {item.content_text.substring(0, 150)}...
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAIContentModal(false);
              setGeneratedContentItems([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveGeneratedContent}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Save All ({generatedContentItems.length} items)
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quiz Generator Results Modal */}
      <Modal
        show={showQuizGenerator && generatedQuiz}
        onHide={() => {
          setShowQuizGenerator(false);
          setGeneratedQuiz(null);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaClipboardCheck className="me-2" />
            Generated Quiz Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {generatedQuiz && (
            <>
              <h5>{generatedQuiz.quiz_title}</h5>
              <p className="text-muted">{generatedQuiz.quiz_description}</p>
              
              <ListGroup className="mb-3">
                {generatedQuiz.quiz_questions?.map((q, idx) => (
                  <ListGroup.Item key={idx}>
                    <div className="d-flex justify-content-between">
                      <strong>Q{idx + 1}:</strong>
                      <Badge bg="info">{q.question_type}</Badge>
                    </div>
                    <p className="mb-2">{q.question_text}</p>
                    {q.options && (
                      <ul className="mb-0">
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx} className={opt.is_correct ? 'text-success fw-bold' : ''}>
                            {opt.text || opt}
                            {opt.is_correct && ' ✓'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowQuizGenerator(false);
              setGeneratedQuiz(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSaveGeneratedQuiz}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Save Quiz
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={handleClosePreviewModal}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {previewingContent?.title || 'Content Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewingContent && (
            <div className="preview-content">
              {previewingContent.content_text && (
                <div className="mb-3">
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {previewingContent.content_text}
                  </pre>
                </div>
              )}
              {previewUrl && previewingContent.content_type === 'VIDEO' && (
                <div className="ratio ratio-16x9">
                  <iframe
                    src={getYouTubeEmbedUrl(previewUrl)}
                    title={previewingContent.title}
                    allowFullScreen
                  />
                </div>
              )}
              {previewUrl && previewingContent.content_type === 'IMAGE' && (
                <img src={previewUrl} alt={previewingContent.title} className="img-fluid" />
              )}
              {previewUrl && !['VIDEO', 'IMAGE'].includes(previewingContent.content_type) && (
                <div className="text-center">
                  <Button
                    variant="primary"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <FaExternalLinkAlt className="me-2" />
                    Open in New Tab
                  </Button>
                </div>
              )}
              {previewingContent.hasInAppQuiz && previewingContent.quiz && (
                <div>
                  <h5>Quiz Questions</h5>
                  <ListGroup>
                    {previewingContent.quiz.questions?.map((q, idx) => (
                      <ListGroup.Item key={idx}>
                        <strong>Q{idx + 1}:</strong> {q.question_text}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePreviewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quiz Builder */}
      {showQuizBuilder && (
        <QuizBuilder
          contentId={currentQuizContentId}
          quizId={currentQuizId}
          onClose={() => {
            setShowQuizBuilder(false);
            setCurrentQuizContentId(null);
            setCurrentQuizId(null);
            fetchContent();
          }}
        />
      )}

      {/* Flashcard Creator */}
      {showFlashcardCreator && (
        <FlashcardCreator
          lessonId={lessonId}
          contentId={currentFlashcardContentId}
          onClose={() => {
            setShowFlashcardCreator(false);
            setCurrentFlashcardContentId(null);
            setEditingContent(null);
            setGeneratedFlashcardData(null);
            fetchContent();
          }}
          initialData={generatedFlashcardData}
        />
      )}

      {/* Interactive Video Creator */}
      {showInteractiveVideoCreator && (
        <InteractiveVideoCreator
          lessonId={lessonId}
          contentId={currentInteractiveVideoContentId}
          onClose={() => {
            setShowInteractiveVideoCreator(false);
            setCurrentInteractiveVideoContentId(null);
            setEditingContent(null);
            setGeneratedInteractiveVideoData(null);
            fetchContent();
          }}
          initialData={generatedInteractiveVideoData}
        />
      )}

      {/* Interactive Book Creator */}
      {showInteractiveBookCreator && (
        <InteractiveBookCreator
          lessonId={lessonId}
          contentId={currentInteractiveBookContentId}
          onClose={() => {
            setShowInteractiveBookCreator(false);
            setCurrentInteractiveBookContentId(null);
            setEditingContent(null);
            setGeneratedInteractiveBookData(null);
            fetchContent();
          }}
          initialData={generatedInteractiveBookData}
        />
      )}
    </Container>
  );
}

// Helper function for section icons
function getSectionIcon(sectionName) {
  const icons = {
    'Introduction': <FaGraduationCap className="section-icon" />,
    'Learning': <FaBook className="section-icon" />,
    'Practice': <FaTasks className="section-icon" />,
    'Assessment': <FaClipboardCheck className="section-icon" />,
    'Review': <FaLightbulb className="section-icon" />,
    'Closure': <FaCheckCircle className="section-icon" />
  };
  return icons[sectionName] || <FaBook className="section-icon" />;
}

export default LessonContentManager;