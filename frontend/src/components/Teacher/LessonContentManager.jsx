import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Modal, ListGroup, Badge, Tabs, Tab, Accordion
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUpload, FaFileAlt, FaLink, FaVideo, FaImage,
  FaTrash, FaEdit, FaPlus, FaDownload, FaExternalLinkAlt, FaBook, FaEye,
  FaArrowUp, FaArrowDown, FaGripVertical, FaClock, FaCheckCircle, FaInfoCircle,
  FaGraduationCap, FaLightbulb, FaQuestionCircle, FaComments, FaClipboardCheck,
  FaClipboardList, FaTasks, FaFileSignature, FaPoll, FaProjectDiagram,
  FaFilePdf, FaMagic, FaShare, FaDatabase, FaRobot, FaBrain, FaRocket, FaLayerGroup, FaChevronRight,
  FaChevronDown, FaEllipsisH
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
import './LessonContentManager-redesign.css';

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

  // Unified AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiAssistantTab, setAiAssistantTab] = useState('quick'); // 'quick', 'custom', 'quiz', 'wizard'
  
  // Master AI Generation state (used in custom tab)
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
  
  // UI State for redesign
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [lessonPlanExpanded, setLessonPlanExpanded] = useState(false);
  
  // Initialize expanded sections
  useEffect(() => {
    if (content.length > 0) {
      const sections = Object.keys(groupContentBySection());
      setExpandedSections(sections);
    }
  }, [content]);

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
      // Don't clear error here - let user see it if it was from 3D model fetch
    }
  }, [contentType]);

  // Load selected 3D model when editing existing content with metadata
  useEffect(() => {
    if (contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') {
      if (editingContent && editingContent.metadata && editingContent.metadata.arvr_content_id && available3DModels.length > 0) {
        const arvrContentId = editingContent.metadata.arvr_content_id;
        // Convert to number if it's a string, handle empty strings
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
        setSelected3DModel(null);
      }
    }
  }, [available3DModels, editingContent, contentType]);

  const fetchLessonData = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          class_subject:class_subjects(
            *,
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            ),
            class:classes(
              *,
              form:forms(*)
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

  const fetchAvailable3DModels = async () => {
    try {
      setLoading3DModels(true);
      setError(null); // Clear any previous errors
      const { data, error } = await supabase
        .from('arvr_content')
        .select('*, subjects:subject_id (subject_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching 3D models:', error);
        if (error.code === '42P01') {
          // Table doesn't exist
          setError('The arvr_content table does not exist. Please run the database migration script: database/add-interactive-content-tables.sql');
          setAvailable3DModels([]);
          return;
        }
        // Show other errors to user
        setError(`Failed to load 3D models: ${error.message || 'Unknown error'}`);
        setAvailable3DModels([]);
        return;
      }
      setAvailable3DModels(data || []);
      if (data && data.length === 0) {
        // No error, just no models available
        console.log('No 3D models found in database');
      }
    } catch (err) {
      console.error('Error fetching 3D models:', err);
      setError(`Failed to load 3D models: ${err.message || 'Unknown error'}`);
      setAvailable3DModels([]);
    } finally {
      setLoading3DModels(false);
    }
  };

  // Preload signed URLs for images stored in Supabase Storage
  useEffect(() => {
    const preloadImageUrls = async () => {
      const imageItems = content.filter(item => {
        const isImage = item.content_type === 'IMAGE' ||
          (item.mime_type && item.mime_type.startsWith('image/'));
        return isImage && item.file_path && !item.url?.includes('http');
      });

      const promises = imageItems.map(async (item) => {
        try {
          const { data, error } = await supabase.storage
            .from('course-content')
            .createSignedUrl(item.file_path, 3600);

          if (!error && data?.signedUrl) {
            setSignedUrls(prev => {
              if (prev[item.content_id]) return prev; // Avoid duplicate
              return { ...prev, [item.content_id]: data.signedUrl };
            });
          }
        } catch (err) {
          console.error('Error preloading signed URL for image:', err);
        }
      });

      await Promise.all(promises);
    };

    if (content.length > 0) {
      preloadImageUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sequence_order', { ascending: true })
        .order('upload_date', { ascending: true });

      if (fetchError) throw fetchError;
      setContent(data || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load lesson content');
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingContent(item);
      setContentType(item.content_type);
      setTitle(item.title || '');
      setUrl(item.url || '');

      // Load content text based on content type
      const textContentTypes = ['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
        'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'];
      if (textContentTypes.includes(item.content_type)) {
        const fieldMap = {
          'LEARNING_OUTCOMES': item.learning_outcomes,
          'LEARNING_ACTIVITIES': item.learning_activities,
          'KEY_CONCEPTS': item.key_concepts,
          'REFLECTION_QUESTIONS': item.reflection_questions,
          'DISCUSSION_PROMPTS': item.discussion_prompts,
          'SUMMARY': item.summary
        };
        setContentText(fieldMap[item.content_type] || '');
      } else {
        setContentText('');
      }

      setDescription(item.description || '');
      setInstructions(item.instructions || '');
      setLearningOutcomes(item.learning_outcomes || '');
      setLearningActivities(item.learning_activities || '');
      setKeyConcepts(item.key_concepts || '');
      setReflectionQuestions(item.reflection_questions || '');
      setDiscussionPrompts(item.discussion_prompts || '');
      setSummary(item.summary || '');
      setContentSection(item.content_section || 'Learning');
      setIsRequired(item.is_required !== false);
      setEstimatedMinutes(item.estimated_minutes != null ? String(item.estimated_minutes) : '');
      setSelectedFile(null);
      setAssignmentDetailsFile(null);
      setAssignmentRubricFile(null);
      setUploadedRubricFileInfo(null);
      // Load prerequisites when editing
      setSelectedPrerequisites(item.prerequisite_content_ids || []);
    } else {
      setEditingContent(null);
      setContentType('FILE');
      setTitle('');
      setUrl('');
      setContentText('');
      setDescription('');
      setInstructions('');
      setLearningOutcomes('');
      setLearningActivities('');
      setKeyConcepts('');
      setReflectionQuestions('');
      setDiscussionPrompts('');
      setSummary('');
      setContentSection('Learning');
      setIsRequired(true);
      setEstimatedMinutes('');
      setSelectedFile(null);
      setAssignmentDetailsFile(null);
      setAssignmentRubricFile(null);
      setUploadedRubricFileInfo(null);
      setSelectedPrerequisites([]);
      setTitle('');
      setUrl('');
      setContentText('');
      setDescription('');
      setInstructions('');
      setLearningOutcomes('');
      setLearningActivities('');
      setKeyConcepts('');
      setReflectionQuestions('');
      setDiscussionPrompts('');
      setSummary('');
      setContentSection('Learning');
      setIsRequired(true);
      setEstimatedMinutes('');
      setSelectedFile(null);
      setAssignmentDetailsFile(null);
      setAssignmentRubricFile(null);
      setUploadedRubricFileInfo(null);
      setSelectedPrerequisites([]);
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContent(null);
    setContentType('FILE');
    setTitle('');
    setUrl('');
    setContentText('');
    setDescription('');
    setInstructions('');
    setLearningOutcomes('');
    setLearningActivities('');
    setKeyConcepts('');
    setReflectionQuestions('');
    setDiscussionPrompts('');
    setSummary('');
    setContentSection('Main Content');
    setIsRequired(true);
    setEstimatedMinutes('');
    setSelectedFile(null);
    setAssignmentDetailsFile(null);
    setAssignmentRubricFile(null);
    setUploadedRubricFileInfo(null);
    setSelectedPrerequisites([]);
    setUploading(false); // Reset uploading state when closing modal
    setError(null);
    setSuccess(null);
  };

  const handleOpenQuizBuilder = async (contentItem = null) => {
    if (contentItem) {
      // Check if quiz exists for this content
      try {
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('quiz_id')
          .eq('content_id', contentItem.content_id)
          .single();

        if (quiz) {
          setCurrentQuizId(quiz.quiz_id);
        } else {
          setCurrentQuizId(null);
        }
        setCurrentQuizContentId(contentItem.content_id);
      } catch (err) {
        // No quiz exists yet
        setCurrentQuizId(null);
        setCurrentQuizContentId(contentItem.content_id);
      }
    } else {
      // Creating new quiz - need to save content first
      setCurrentQuizContentId(null);
      setCurrentQuizId(null);
    }
    setShowQuizBuilder(true);
  };

  const handleCloseQuizBuilder = () => {
    setShowQuizBuilder(false);
    setCurrentQuizContentId(null);
    setCurrentQuizId(null);
    fetchContent(); // Refresh to show quiz status
  };

  const handleQuizSaved = () => {
    fetchContent(); // Refresh content list
  };

  // Per-content-type AI generation handler
  const handleGeneratePerContentType = async (contentType) => {
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

    setPerContentAIGenerating(true);
    setError(null);

    try {
      // Generate based on content type
      if (contentType === 'QUIZ') {
        const quiz = await generateQuiz({
          topic,
          subject: subjectName,
          form: formName,
          lessonTitle,
          learningObjectives,
          numQuestions: perContentAIQuantity || 5,
          bloomLevel: 'mixed',
          lessonPlan
        });
        setGeneratedQuiz(quiz);
        setShowModal(false);
        setAiAssistantTab('quiz');
        setShowAIAssistant(true);
        setPerContentAIGenerating(false);
        return;
      } else if (contentType === 'FLASHCARD') {
        const flashcards = await generateFlashcards({
          topic,
          subject: subjectName,
          gradeLevel: formName,
          numCards: perContentAIQuantity || 10,
          difficulty: 'medium',
          context: perContentAIPrompt || ''
        });
        // Convert flashcards to FlashcardData format
        const flashcardData = {
          cards: flashcards.map((card, idx) => ({
            id: `card-${idx}`,
            front: card.front,
            back: card.back,
            tags: card.tags || [],
            difficulty: card.difficulty || 'medium'
          })),
          settings: {
            showProgress: true,
            shuffleCards: false,
            cardStyle: 'default'
          }
        };
        // Store generated flashcards and open creator
        setGeneratedFlashcardData(flashcardData);
        if (title && title.trim()) {
          setTitle(title.trim());
        } else {
          setTitle(`Flashcards: ${topic}`);
        }
        setShowModal(false);
        setShowFlashcardCreator(true);
        setCurrentFlashcardContentId(null);
        setPerContentAIGenerating(false);
        return;
      } else if (contentType === 'INTERACTIVE_VIDEO') {
        const interactiveVideo = await generateInteractiveVideo({
          topic,
          subject: subjectName,
          gradeLevel: formName,
          learningOutcomes: learningObjectives,
          numCheckpoints: perContentAIQuantity || 5,
          checkpointTypes: ['question', 'quiz', 'reflection'],
          videoUrl: '',
          additionalComments: perContentAIPrompt || ''
        });
        // Store generated video data (already in correct format)
        setGeneratedInteractiveVideoData(interactiveVideo);
        if (title && title.trim()) {
          setTitle(title.trim());
        } else {
          setTitle(`Interactive Video: ${topic}`);
        }
        setUrl(interactiveVideo.videoUrl || '');
        setShowModal(false);
        setShowInteractiveVideoCreator(true);
        setCurrentInteractiveVideoContentId(null);
        setPerContentAIGenerating(false);
        return;
      } else if (contentType === 'INTERACTIVE_BOOK') {
        const interactiveBook = await generateInteractiveBook({
          topic,
          subject: subjectName,
          gradeLevel: formName,
          numPages: perContentAIQuantity || 5,
          pageTypes: ['content', 'video', 'quiz'],
          learningOutcomes: learningObjectives,
          additionalComments: perContentAIPrompt || ''
        });
        // Store generated book data and open creator
        setGeneratedInteractiveBookData(interactiveBook);
        if (title && title.trim()) {
          setTitle(title.trim());
        } else {
          setTitle(`Interactive Book: ${topic}`);
        }
        setShowModal(false);
        setShowInteractiveBookCreator(true);
        setCurrentInteractiveBookContentId(null);
        setPerContentAIGenerating(false);
        return;
      } else if (contentType === 'VIDEO') {
        // Search for educational videos
        const videos = await searchEducationalVideos({
          query: topic,
          subject: subjectName,
          form: formName,
          maxResults: 3
        });
        if (videos && videos.length > 0) {
          setUrl(videos[0].url);
          setDescription(videos[0].description || `Educational video about ${topic}`);
          setSuccess(`Found video: ${videos[0].title}. URL added!`);
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('No suitable videos found. Please enter a video URL manually.');
        }
        setPerContentAIGenerating(false);
        return;
      } else if (contentType === 'ASSIGNMENT') {
        // Generate assignment rubric and description
        const rubric = await generateAssignmentRubric({
          assignmentTitle: title || `Assignment: ${topic}`,
          assignmentDescription: description || `Complete this assignment on ${topic}`,
          subject: subjectName,
          form: formName,
          learningObjectives: learningObjectives,
          topic: topic
        });
        // Populate assignment description with rubric
        setDescription(rubric);
        setSuccess('Assignment rubric generated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setPerContentAIGenerating(false);
        return;
      } else {
        // For text content types, use student-facing content generation
        const studentContent = await generateStudentFacingContent({
          lessonTitle,
          topic,
          subject: subjectName,
          form: formName,
          lessonPlan,
          learningObjectives
        });

        // Extract the relevant field based on content type
        const fieldMap = {
          'LEARNING_OUTCOMES': studentContent.learning_outcomes || '',
          'KEY_CONCEPTS': studentContent.key_concepts || '',
          'LEARNING_ACTIVITIES': studentContent.learning_activities || '',
          'REFLECTION_QUESTIONS': studentContent.reflection_questions || '',
          'DISCUSSION_PROMPTS': studentContent.discussion_prompts || '',
          'SUMMARY': studentContent.summary || ''
        };

        const generatedContent = fieldMap[contentType] || '';
        
        if (!generatedContent) {
          setError(`Unable to generate ${contentType.replace('_', ' ').toLowerCase()}. Please try again.`);
          return;
        }

        // Populate the content text field
        setContentText(generatedContent);
        setSuccess(`${contentType.replace('_', ' ')} generated successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err.message || 'Failed to generate content. Please check your API key and try again.');
    } finally {
      setPerContentAIGenerating(false);
    }
  };

  // Master AI generation handler
  const handleMasterAIGeneration = async () => {
    if (!lessonData) {
      setError('Lesson data not loaded. Please wait...');
      return;
    }

    // Validate at least one content type is selected
    const selectedTypes = Object.entries(masterAISelections)
      .filter(([_, value]) => value.selected);
    
    if (selectedTypes.length === 0) {
      setError('Please select at least one content type to generate.');
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

    setIsGeneratingContent(true);
    setError(null);
    setShowMasterAIGenerator(false);

    try {
      const contentItems = [];

      // Generate quiz if selected
      if (masterAISelections.QUIZ.selected) {
        const quiz = await generateQuiz({
          topic,
          subject: subjectName,
          form: formName,
          lessonTitle,
          learningObjectives,
          numQuestions: masterAISelections.QUIZ.quantity,
          bloomLevel: 'mixed',
          lessonPlan
        });

        contentItems.push({
          content_type: 'QUIZ',
          title: quiz.quiz_title,
          description: quiz.quiz_description,
          content_section: 'Assessment',
          sequence_order: contentItems.length + 1,
          is_required: true,
          estimated_minutes: masterAISelections.QUIZ.quantity * 2,
          quiz_questions: quiz.quiz_questions
        });
      }

      // Generate student-facing content for text types
      if (selectedTypes.some(([type]) => ['LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'LEARNING_ACTIVITIES', 
          'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(type))) {
        const studentContent = await generateStudentFacingContent({
          lessonTitle,
          topic,
          subject: subjectName,
          form: formName,
          lessonPlan,
          learningObjectives
        });

        // Add selected text content types
        if (masterAISelections.LEARNING_OUTCOMES.selected) {
          contentItems.push({
            content_type: 'LEARNING_OUTCOMES',
            title: 'Learning Outcomes',
            content_text: studentContent.learning_outcomes || '',
            content_section: 'Introduction',
            sequence_order: contentItems.length + 1,
            is_required: true,
            estimated_minutes: 5
          });
        }

        if (masterAISelections.KEY_CONCEPTS.selected) {
          contentItems.push({
            content_type: 'KEY_CONCEPTS',
            title: 'Key Concepts',
            content_text: studentContent.key_concepts || '',
            content_section: 'Learning',
            sequence_order: contentItems.length + 1,
            is_required: true,
            estimated_minutes: 10
          });
        }

        if (masterAISelections.LEARNING_ACTIVITIES.selected) {
          contentItems.push({
            content_type: 'LEARNING_ACTIVITIES',
            title: 'Learning Activities',
            content_text: studentContent.learning_activities || '',
            content_section: 'Learning',
            sequence_order: contentItems.length + 1,
            is_required: true,
            estimated_minutes: 20
          });
        }

        if (masterAISelections.REFLECTION_QUESTIONS.selected) {
          contentItems.push({
            content_type: 'REFLECTION_QUESTIONS',
            title: 'Reflection Questions',
            content_text: studentContent.reflection_questions || '',
            content_section: 'Assessment',
            sequence_order: contentItems.length + 1,
            is_required: false,
            estimated_minutes: 5
          });
        }

        if (masterAISelections.DISCUSSION_PROMPTS.selected) {
          contentItems.push({
            content_type: 'DISCUSSION_PROMPTS',
            title: 'Discussion Prompts',
            content_text: studentContent.discussion_prompts || '',
            content_section: 'Assessment',
            sequence_order: contentItems.length + 1,
            is_required: false,
            estimated_minutes: 10
          });
        }

        if (masterAISelections.SUMMARY.selected) {
          contentItems.push({
            content_type: 'SUMMARY',
            title: 'Lesson Summary',
            content_text: studentContent.summary || '',
            content_section: 'Closure',
            sequence_order: contentItems.length + 1,
            is_required: true,
            estimated_minutes: 5
          });
        }
      }

      setGeneratedContentItems(contentItems);
      setShowAIContentModal(true);
    } catch (err) {
      console.error('Error generating master AI content:', err);
      setError(err.message || 'Failed to generate content. Please check your API key and try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // AI Content Generation Functions
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
      // Get current max sequence order
      const maxSequence = content.length > 0
        ? Math.max(...content.map(c => c.sequence_order || 0))
        : 0;

      // Use pending title if available (from Add Content modal), otherwise use generated title
      const quizTitle = pendingQuizTitle || generatedQuiz.quiz_title || `Quiz: ${lessonData.topic || 'Lesson Quiz'}`;

      // Create quiz content item
      const contentData = {
        lesson_id: parseInt(lessonId),
        content_type: 'QUIZ',
        title: quizTitle,
        description: generatedQuiz.quiz_description || '',
        content_section: 'Assessment',
        sequence_order: maxSequence + 1,
        is_required: true,
        estimated_minutes: quizParams.numQuestions * 2, // Estimate 2 minutes per question
        is_published: true,
        uploaded_by: user.user_id || user.userId
      };

      const { data: contentItem, error: contentError } = await supabase
        .from('lesson_content')
        .insert([contentData])
        .select()
        .single();

      if (contentError) throw contentError;

      // Create quiz
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

      // Create questions
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

        // Create options for multiple choice/true-false
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
          // For SHORT_ANSWER or FILL_BLANK, store correct answer
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
      setPendingQuizTitle(null); // Clear pending title
      fetchContent(); // Refresh content list
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
        // Generate complete lesson content structure
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
        // Generate student-facing content
        const studentContent = await generateStudentFacingContent({
          lessonTitle,
          topic,
          subject: subjectName,
          form: formName,
          lessonPlan,
          learningObjectives
        });

        // Convert student content to content items format
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
    } catch (err) {
      console.error('Error generating AI content:', err);
      setError(err.message || 'Failed to generate content. Please check your API key and try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleApplyTemplate = async (template) => {
    setIsGeneratingContent(true);
    setShowWizard(false);

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
            url: '', // User needs to fill this
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
            description: 'Deep dive into the topic.',
            content_section: 'Lecture',
            sequence_order: 3,
            is_required: true,
            estimated_minutes: 20
          },
          {
            content_type: 'ASSIGNMENT',
            title: 'Lecture Reflection',
            content_text: 'Write a brief reflection on the lecture.',
            content_section: 'Assessment',
            sequence_order: 4,
            is_required: true,
            estimated_minutes: 20
          }
        ];
      }

      setGeneratedContentItems(contentItems);
      setShowAIContentModal(true); // Reuse the AI content modal to review/save items
    } catch (err) {
      console.error('Error applying template:', err);
      setError('Failed to apply template');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 45;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end - start) / (1000 * 60));
  };

  const handleSaveAIContent = async () => {
    if (!generatedContentItems || generatedContentItems.length === 0) {
      setError('No content items to save');
      return;
    }

    setUploading(true);
    setError(null);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Get current max sequence order
      const maxSequence = content.length > 0
        ? Math.max(...content.map(c => c.sequence_order || 0))
        : 0;

      // Create all content items
      for (const item of generatedContentItems) {
        try {
          console.log('[AI Content] Processing item:', {
            type: item.content_type,
            title: item.title,
            hasQuizQuestions: !!item.quiz_questions,
            quizQuestionCount: item.quiz_questions?.length || 0,
            hasAssignmentDesc: !!item.assignment_description,
            assignmentDesc: item.assignment_description?.substring(0, 50) || 'none'
          });

          const fieldMap = {
            'LEARNING_OUTCOMES': 'learning_outcomes',
            'LEARNING_ACTIVITIES': 'learning_activities',
            'KEY_CONCEPTS': 'key_concepts',
            'REFLECTION_QUESTIONS': 'reflection_questions',
            'DISCUSSION_PROMPTS': 'discussion_prompts',
            'SUMMARY': 'summary'
          };

          const contentData = {
            lesson_id: parseInt(lessonId),
            content_type: item.content_type,
            title: item.title,
            content_section: item.content_section || 'Learning',
            sequence_order: (item.sequence_order || 0) + maxSequence,
            is_required: item.is_required !== false,
            estimated_minutes: item.estimated_minutes || null,
            is_published: true,
            uploaded_by: user.user_id || user.userId
          };

          // Handle different content types
          if (item.content_type === 'VIDEO') {
            // Video content
            if (!item.url || !item.url.trim()) {
              console.warn('Video content item missing URL, skipping:', item.title);
              errorCount++;
              continue;
            }
            contentData.url = item.url.trim();
            contentData.description = item.description || item.content_text || `Educational video: ${item.title}`;
            contentData.content_type = 'VIDEO';

            const { error: insertError } = await supabase
              .from('lesson_content')
              .insert([contentData]);

            if (insertError) throw insertError;
            successCount++;
            continue; // Skip to next item
          } else if (item.content_type === 'QUIZ') {
            // Quiz content - create content item first, then quiz with questions
            contentData.description = item.content_text || '';

            const { data: contentResult, error: contentError } = await supabase
              .from('lesson_content')
              .insert([contentData])
              .select()
              .single();

            if (contentError) throw contentError;

            // Create quiz
            const totalPoints = item.quiz_questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;
            const quizData = {
              content_id: contentResult.content_id,
              title: item.title,
              description: item.content_text || '',
              instructions: 'Complete this quiz to test your understanding.',
              total_points: totalPoints,
              passing_score: 70,
              allow_multiple_attempts: true,
              max_attempts: 3,
              show_results_immediately: true,
              show_correct_answers: true,
              is_published: true,
              published_at: new Date().toISOString(),
              created_by: user.user_id || user.userId
            };

            const { data: quiz, error: quizError } = await supabase
              .from('quizzes')
              .insert([quizData])
              .select()
              .single();

            if (quizError) throw quizError;

            // Create questions
            console.log('[AI Content] Quiz questions received:', item.quiz_questions);

            if (item.quiz_questions && Array.isArray(item.quiz_questions) && item.quiz_questions.length > 0) {
              for (let qIdx = 0; qIdx < item.quiz_questions.length; qIdx++) {
                const q = item.quiz_questions[qIdx];

                // Validate question has required fields
                if (!q.question_text || !q.question_text.trim()) {
                  console.warn(`Skipping question ${qIdx + 1}: missing question_text`);
                  continue;
                }

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

                if (questionError) {
                  console.error('Error creating question:', questionError);
                  throw questionError;
                }

                // Create options for multiple choice/true-false
                if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                  const optionsData = q.options.map((opt, optIdx) => {
                    // Handle different option formats
                    const optionText = typeof opt === 'string' ? opt : (opt.text || opt.option_text || '');
                    const isCorrect = typeof opt === 'object' ? (opt.is_correct || false) : false;

                    return {
                      question_id: question.question_id,
                      option_text: optionText,
                      is_correct: isCorrect,
                      option_order: optIdx + 1
                    };
                  }).filter(opt => opt.option_text && opt.option_text.trim());

                  if (optionsData.length > 0) {
                    const { error: optionsError } = await supabase
                      .from('quiz_answer_options')
                      .insert(optionsData);

                    if (optionsError) {
                      console.error('Error creating options:', optionsError);
                      throw optionsError;
                    }
                  }
                }

                // Create correct answers for short answer/fill blank
                if (q.correct_answer && (q.question_type === 'SHORT_ANSWER' || q.question_type === 'FILL_BLANK')) {
                  const answerData = {
                    question_id: question.question_id,
                    correct_answer: q.correct_answer
                    // Note: points column doesn't exist in quiz_correct_answers table
                    // Points are stored in the quiz_questions table instead
                  };

                  const { error: answerError } = await supabase
                    .from('quiz_correct_answers')
                    .insert([answerData]);

                  if (answerError) {
                    console.error('Error creating correct answer:', answerError);
                    throw answerError;
                  }
                }
              }
            } else {
              // If no questions provided, create a default question
              console.warn('[AI Content] No quiz questions provided, creating default question');
              const lessonTopic = lessonData?.topic || lessonData?.lesson_title || 'this topic';
              const defaultQuestion = {
                quiz_id: quiz.quiz_id,
                question_type: 'MULTIPLE_CHOICE',
                question_text: `What is the main concept of ${lessonTopic}?`,
                question_order: 1,
                points: 1,
                explanation: 'This is a default question. Please edit the quiz to add proper questions.',
                is_required: true
              };

              const { data: question, error: questionError } = await supabase
                .from('quiz_questions')
                .insert([defaultQuestion])
                .select()
                .single();

              if (questionError) {
                console.error('Error creating default question:', questionError);
                throw questionError;
              }

              // Add default options
              const defaultOptions = [
                { question_id: question.question_id, option_text: 'Option A', is_correct: false, option_order: 1 },
                { question_id: question.question_id, option_text: 'Option B', is_correct: true, option_order: 2 },
                { question_id: question.question_id, option_text: 'Option C', is_correct: false, option_order: 3 }
              ];

              const { error: optionsError } = await supabase
                .from('quiz_answer_options')
                .insert(defaultOptions);

              if (optionsError) {
                console.error('Error creating default options:', optionsError);
              }
            }

            successCount++;
          } else if (item.content_type === 'ASSIGNMENT') {
            // Assignment content - create content item, then generate rubric
            // Use assignment_description if available, otherwise use content_text
            const lessonTopic = lessonData?.topic || lessonData?.lesson_title || 'this topic';
            const assignmentDesc = item.assignment_description || item.content_text || `Complete this assignment to demonstrate your understanding of ${lessonTopic}`;

            // Ensure we have a meaningful description (not generic placeholder text)
            const isGenericText = !assignmentDesc ||
              assignmentDesc.trim() === '' ||
              assignmentDesc.toLowerCase().includes('complete this assignment to demonstrate your understanding') ||
              assignmentDesc.length < 50; // Too short to be meaningful

            if (isGenericText) {
              // Generate a better default description
              const subjectName = lessonData.class_subject?.subject_offering?.subject?.subject_name || 'the subject';
              const formName = lessonData.class_subject?.class?.form?.form_name || '';
              const betterDesc = `Assignment: ${lessonTopic}\n\nInstructions:\nComplete this assignment to demonstrate your understanding of ${lessonTopic} in ${subjectName}${formName ? ` (${formName} level)` : ''}.\n\nRequirements:\n1. Review the lesson materials\n2. Complete all required tasks\n3. Submit your work by the due date\n\nNote: This is a default assignment description. Please edit to add specific instructions.`;
              contentData.description = betterDesc;
              contentData.instructions = betterDesc;
              console.warn('[AI Content] Assignment has generic description, using enhanced default');
            } else {
              contentData.description = assignmentDesc;
              contentData.instructions = assignmentDesc;
            }
            contentData.content_type = 'ASSIGNMENT';

            console.log('[AI Content] Creating assignment with description:', contentData.description.substring(0, 100));

            const { data: contentResult, error: contentError } = await supabase
              .from('lesson_content')
              .insert([contentData])
              .select()
              .single();

            if (contentError) {
              console.error('Error creating assignment content:', contentError);
              throw contentError;
            }

            // Generate rubric using AI and store it
            let rubricText = null;
            try {
              const subjectName = lessonData.class_subject?.subject_offering?.subject?.subject_name || 'General';
              const formName = lessonData.class_subject?.class?.form?.form_name || '';

              rubricText = await generateAssignmentRubric({
                assignmentTitle: item.title,
                assignmentDescription: item.assignment_description || item.content_text,
                subject: subjectName,
                gradeLevel: formName,
                totalPoints: item.total_points || 100,
                criteria: item.rubric_criteria?.map(c => `${c.criterion}: ${c.description} (${c.points} points)`) || []
              });

              // Store rubric text in instructions field (can be used to generate PDF later)
              if (rubricText) {
                contentData.instructions = (contentData.instructions || '') + '\n\n--- RUBRIC ---\n\n' + rubricText;

                // Update the content with rubric
                const { error: updateError } = await supabase
                  .from('lesson_content')
                  .update({ instructions: contentData.instructions })
                  .eq('content_id', contentResult.content_id);

                if (updateError) {
                  console.warn('Failed to update assignment with rubric text:', updateError);
                }
              }
            } catch (rubricError) {
              console.warn('Failed to generate rubric, continuing without it:', rubricError);
              // Continue even if rubric generation fails
            }

            successCount++;
          } else {
            // Text-based content types
            const fieldName = fieldMap[item.content_type];
            if (fieldName) {
              contentData[fieldName] = item.content_text || '';
            }

            const { error: insertError } = await supabase
              .from('lesson_content')
              .insert([contentData]);

            if (insertError) throw insertError;
            successCount++;
          }
        } catch (itemError) {
          console.error('Error saving content item:', itemError);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully created ${successCount} content item${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}`);
        setShowAIContentModal(false);
        setGeneratedContentItems([]);
        fetchContent(); // Refresh content list
      } else {
        setError(`Failed to create content items. ${errorCount} error${errorCount !== 1 ? 's' : ''} occurred.`);
      }
    } catch (err) {
      console.error('Error saving AI content:', err);
      setError(err.message || 'Failed to save generated content');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseAIContentModal = () => {
    setShowAIContentModal(false);
    setGeneratedContentItems([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setUploading(true);

      // Validate required fields based on content type
      if (contentType === 'LINK' && !url?.trim()) {
        setError('URL is required for link content');
        setUploading(false);
        return;
      }

      if (contentType === 'VIDEO' && !url?.trim()) {
        setError('Video URL is required');
        setUploading(false);
        return;
      }

      if (contentType === 'IMAGE' && !url?.trim()) {
        setError('Image URL is required');
        setUploading(false);
        return;
      }

      if (contentType === 'DOCUMENT' && !url?.trim()) {
        setError('Document URL is required');
        setUploading(false);
        return;
      }

      if (!title?.trim()) {
        setError('Title is required');
        setUploading(false);
        return;
      }

      let fileUrl = null;
      let filePath = null;
      let fileName = null;
      let fileSize = null;
      let mimeType = null;

      // Handle file upload if it's a FILE type
      if (contentType === 'FILE' && selectedFile) {
        const bucketName = 'course-content'; // Using existing bucket
        const timestamp = Date.now();
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        filePath = `lessons/${lessonId}/${timestamp}-${sanitizedFileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          // Provide helpful error message for bucket not found
          if (uploadError.message && uploadError.message.includes('Bucket not found')) {
            throw new Error(`Storage bucket '${bucketName}' not found. Please create the bucket in Supabase Storage: Settings → Storage → Create Bucket. Bucket name: 'course-content'`);
          }
          throw uploadError;
        }

        // For FILE type, don't store a URL - we'll use signed URLs on-demand
        // Public URLs don't work for private buckets anyway
        fileUrl = null; // Don't store URL for FILE type - use file_path with signed URLs instead
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
      } else if (contentType === 'FILE' && editingContent) {
        // Keep existing file info if editing and no new file
        fileUrl = null; // Don't use stored URL for FILE type
        filePath = editingContent.file_path;
        fileName = editingContent.file_name;
        fileSize = editingContent.file_size;
        mimeType = editingContent.mime_type;
      }

      // Prepare content data
      // Determine the URL: for LINK, VIDEO, IMAGE, DOCUMENT, and all Assessment types use the form URL; for FILE don't store URL
      // Note: QUIZ can have URL (external) or be created in-app (no URL required)
      const assessmentTypes = ['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'];
      let finalUrl = null;
      if (contentType === '3D_MODEL') {
        if (!selected3DModel) {
          setError('Please select a 3D model');
          setUploading(false);
          return;
        }
        finalUrl = selected3DModel.content_url;
      } else if (contentType === 'LINK' || contentType === 'VIDEO' || contentType === 'IMAGE' || contentType === 'DOCUMENT' || assessmentTypes.includes(contentType)) {
        finalUrl = url || null; // Use the URL from the form (optional for QUIZ)
      } else if (contentType === 'FILE') {
        finalUrl = null; // Don't store URL for FILE type - always use file_path with signed URLs
      }

      // When updating, preserve existing file info if no new file is uploaded
      if (editingContent && contentType === 'FILE' && !selectedFile) {
        filePath = editingContent.file_path || filePath;
        fileName = editingContent.file_name || fileName;
        fileSize = editingContent.file_size || fileSize;
        mimeType = editingContent.mime_type || mimeType;
        finalUrl = null; // Don't preserve URL for FILE type
      }

      // Handle assignment details PDF upload
      let assignmentDetailsFilePath = null;
      let assignmentDetailsFileName = null;
      let assignmentDetailsFileSize = null;
      let assignmentDetailsMimeType = null;

      if (contentType === 'ASSIGNMENT' && assignmentDetailsFile) {
        const bucketName = 'course-content';
        const timestamp = Date.now();
        const sanitizedFileName = assignmentDetailsFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        assignmentDetailsFilePath = `assignments/${lessonId}/details/${timestamp}-${sanitizedFileName}`;

        const { error: detailsUploadError } = await supabase.storage
          .from(bucketName)
          .upload(assignmentDetailsFilePath, assignmentDetailsFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (detailsUploadError) {
          if (detailsUploadError.message && detailsUploadError.message.includes('Bucket not found')) {
            throw new Error(`Storage bucket '${bucketName}' not found. Please create the bucket in Supabase Storage: Settings → Storage → Create Bucket. Bucket name: 'course-content'`);
          }
          throw detailsUploadError;
        }

        assignmentDetailsFileName = assignmentDetailsFile.name;
        assignmentDetailsFileSize = assignmentDetailsFile.size;
        assignmentDetailsMimeType = assignmentDetailsFile.type;
      } else if (contentType === 'ASSIGNMENT' && editingContent) {
        // Keep existing assignment details file info if editing and no new file
        assignmentDetailsFilePath = editingContent.assignment_details_file_path;
        assignmentDetailsFileName = editingContent.assignment_details_file_name;
        assignmentDetailsFileSize = editingContent.assignment_details_file_size;
        assignmentDetailsMimeType = editingContent.assignment_details_mime_type;
      }

      // Handle assignment rubric PDF upload
      let assignmentRubricFilePath = null;
      let assignmentRubricFileName = null;
      let assignmentRubricFileSize = null;
      let assignmentRubricMimeType = null;

      if (contentType === 'ASSIGNMENT') {
        // Check if we have a pre-uploaded rubric from the rubric generator
        if (uploadedRubricFileInfo) {
          assignmentRubricFilePath = uploadedRubricFileInfo.file_path;
          assignmentRubricFileName = uploadedRubricFileInfo.file_name;
          assignmentRubricFileSize = uploadedRubricFileInfo.file_size;
          assignmentRubricMimeType = uploadedRubricFileInfo.mime_type;
        } else if (assignmentRubricFile) {
          // Upload new rubric file from file input
          const bucketName = 'course-content';
          const timestamp = Date.now();
          const sanitizedFileName = assignmentRubricFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          assignmentRubricFilePath = `assignments/${lessonId}/rubric/${timestamp}-${sanitizedFileName}`;

          const { error: rubricUploadError } = await supabase.storage
            .from(bucketName)
            .upload(assignmentRubricFilePath, assignmentRubricFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (rubricUploadError) {
            if (rubricUploadError.message && rubricUploadError.message.includes('Bucket not found')) {
              throw new Error(`Storage bucket '${bucketName}' not found. Please create the bucket in Supabase Storage: Settings → Storage → Create Bucket. Bucket name: 'course-content'`);
            }
            throw rubricUploadError;
          }

          assignmentRubricFileName = assignmentRubricFile.name;
          assignmentRubricFileSize = assignmentRubricFile.size;
          assignmentRubricMimeType = assignmentRubricFile.type;
        } else if (editingContent) {
          // Keep existing assignment rubric file info if editing and no new file
          assignmentRubricFilePath = editingContent.assignment_rubric_file_path;
          assignmentRubricFileName = editingContent.assignment_rubric_file_name;
          assignmentRubricFileSize = editingContent.assignment_rubric_file_size;
          assignmentRubricMimeType = editingContent.assignment_rubric_mime_type;
        }
      }

      // Get the next sequence order if creating new content
      let sequenceOrder = 0;
      if (!editingContent) {
        const maxOrder = content.length > 0
          ? Math.max(...content.map(c => c.sequence_order || 0))
          : 0;
        sequenceOrder = maxOrder + 1;
      } else {
        sequenceOrder = editingContent.sequence_order || 0;
      }

      // Map content text to appropriate field based on content type
      const textContentTypes = ['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
        'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'];
      const contentTextValue = contentText?.trim() || '';
      const isLearningContent = textContentTypes.includes(contentType);

      const contentData = {
        lesson_id: parseInt(lessonId),
        content_type: contentType,
        title: (title?.trim() || (selectedFile ? selectedFile.name : 'Untitled')),
        url: finalUrl,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        // For Learning Content types, only set the specific field; for Media & Files, set description, instructions, key_concepts
        description: isLearningContent ? null : (description?.trim() || null),
        instructions: isLearningContent ? null : (instructions?.trim() || null),
        learning_outcomes: contentType === 'LEARNING_OUTCOMES' ? contentTextValue : (isLearningContent ? null : (learningOutcomes?.trim() || null)),
        learning_activities: contentType === 'LEARNING_ACTIVITIES' ? contentTextValue : (isLearningContent ? null : (learningActivities?.trim() || null)),
        key_concepts: contentType === 'KEY_CONCEPTS' ? contentTextValue : (isLearningContent ? null : (keyConcepts?.trim() || null)),
        reflection_questions: contentType === 'REFLECTION_QUESTIONS' ? contentTextValue : (isLearningContent ? null : (reflectionQuestions?.trim() || null)),
        discussion_prompts: contentType === 'DISCUSSION_PROMPTS' ? contentTextValue : (isLearningContent ? null : (discussionPrompts?.trim() || null)),
        summary: contentType === 'SUMMARY' ? contentTextValue : (isLearningContent ? null : (summary?.trim() || null)),
        // For Learning Content types, use default values
        content_section: isLearningContent ? 'Learning' : (contentSection || 'Learning'),
        is_required: isLearningContent ? true : isRequired,
        estimated_minutes: isLearningContent ? null : (estimatedMinutes ? parseInt(estimatedMinutes) : null),
        sequence_order: sequenceOrder,
        is_published: true,
        uploaded_by: user.user_id || user.userId,
        // Assignment PDF fields
        assignment_details_file_path: contentType === 'ASSIGNMENT' ? assignmentDetailsFilePath : null,
        assignment_details_file_name: contentType === 'ASSIGNMENT' ? assignmentDetailsFileName : null,
        assignment_details_file_size: contentType === 'ASSIGNMENT' ? assignmentDetailsFileSize : null,
        assignment_details_mime_type: contentType === 'ASSIGNMENT' ? assignmentDetailsMimeType : null,
        assignment_rubric_file_path: contentType === 'ASSIGNMENT' ? assignmentRubricFilePath : null,
        assignment_rubric_file_name: contentType === 'ASSIGNMENT' ? assignmentRubricFileName : null,
        assignment_rubric_file_size: contentType === 'ASSIGNMENT' ? assignmentRubricFileSize : null,
        assignment_rubric_mime_type: contentType === 'ASSIGNMENT' ? assignmentRubricMimeType : null,
        // Prerequisites - only for non-learning content types
        prerequisite_content_ids: isLearningContent ? null : (selectedPrerequisites.length > 0 ? selectedPrerequisites : null)
      };

      // Add metadata for 3D_MODEL and AR_OVERLAY content types
      if ((contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') && selected3DModel) {
        // Ensure content_id is a valid number, not empty string
        const arvrContentId = selected3DModel.content_id;
        if (arvrContentId && arvrContentId !== '') {
          contentData.metadata = {
            arvr_content_id: typeof arvrContentId === 'string' ? parseInt(arvrContentId) : arvrContentId,
            content_type: selected3DModel.content_type
          };
          // For AR_OVERLAY, also store the content URL from the AR/VR content
          if (contentType === 'AR_OVERLAY' && selected3DModel.content_url) {
            contentData.url = selected3DModel.content_url;
          }
        }
      } else if ((contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') && !selected3DModel) {
        // If switching away from 3D model or clearing selection, remove metadata
        contentData.metadata = null;
      }

      if (editingContent) {
        // Update existing content - exclude fields that shouldn't be updated
        const { lesson_id, uploaded_by, ...updateFields } = contentData;

        // Only include file-related fields if content type is FILE or if they have values
        const updateData = {
          content_type: updateFields.content_type,
          title: updateFields.title,
          url: updateFields.url,
          description: updateFields.description,
          instructions: updateFields.instructions,
          learning_outcomes: updateFields.learning_outcomes,
          learning_activities: updateFields.learning_activities,
          key_concepts: updateFields.key_concepts,
          reflection_questions: updateFields.reflection_questions,
          discussion_prompts: updateFields.discussion_prompts,
          summary: updateFields.summary,
          content_section: updateFields.content_section,
          is_required: updateFields.is_required,
          estimated_minutes: updateFields.estimated_minutes,
          sequence_order: updateFields.sequence_order,
          is_published: updateFields.is_published,
          prerequisite_content_ids: updateFields.prerequisite_content_ids,
          updated_at: new Date().toISOString()
        };

        // Include metadata if it exists (for 3D_MODEL)
        // Clean metadata to ensure no empty strings in BIGINT fields
        if (updateFields.metadata) {
          const cleanedMetadata = { ...updateFields.metadata };
          // Convert empty strings to null for BIGINT fields
          if (cleanedMetadata.arvr_content_id === '' || cleanedMetadata.arvr_content_id === null) {
            cleanedMetadata.arvr_content_id = null;
          } else if (typeof cleanedMetadata.arvr_content_id === 'string') {
            const parsed = parseInt(cleanedMetadata.arvr_content_id);
            cleanedMetadata.arvr_content_id = isNaN(parsed) ? null : parsed;
          }
          // Only include metadata if it has valid data
          if (cleanedMetadata.arvr_content_id !== null && cleanedMetadata.arvr_content_id !== undefined) {
            updateData.metadata = cleanedMetadata;
          } else {
            // Remove metadata if arvr_content_id is invalid
            updateData.metadata = null;
          }
        } else if ((contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') && !selected3DModel) {
          // If no 3D model selected, remove metadata
          updateData.metadata = null;
        }

        // Only include file fields if content type is FILE
        if (contentType === 'FILE') {
          updateData.file_path = updateFields.file_path;
          updateData.file_name = updateFields.file_name;
          updateData.file_size = updateFields.file_size;
          updateData.mime_type = updateFields.mime_type;
        }

        // Include assignment PDF fields if content type is ASSIGNMENT
        if (contentType === 'ASSIGNMENT') {
          updateData.assignment_details_file_path = updateFields.assignment_details_file_path;
          updateData.assignment_details_file_name = updateFields.assignment_details_file_name;
          updateData.assignment_details_file_size = updateFields.assignment_details_file_size;
          updateData.assignment_details_mime_type = updateFields.assignment_details_mime_type;
          updateData.assignment_rubric_file_path = updateFields.assignment_rubric_file_path;
          updateData.assignment_rubric_file_name = updateFields.assignment_rubric_file_name;
          updateData.assignment_rubric_file_size = updateFields.assignment_rubric_file_size;
          updateData.assignment_rubric_mime_type = updateFields.assignment_rubric_mime_type;
        }

        console.log('Updating content with data:', updateData);

        const { error: updateError } = await supabase
          .from('lesson_content')
          .update(updateData)
          .eq('content_id', editingContent.content_id);

        if (updateError) {
          console.error('Update error details:', updateError);
          console.error('Update error code:', updateError.code);
          console.error('Update error message:', updateError.message);
          console.error('Update error details:', updateError.details);
          console.error('Update error hint:', updateError.hint);
          setError(updateError.message || 'Failed to update content. Please check the console for details.');
          throw updateError;
        }
        setSuccess('Content updated successfully');
      } else {
        // Create new content - add published_at timestamp
        const insertData = {
          ...contentData,
          published_at: new Date().toISOString()
        };

        const { data: result, error: insertError } = await supabase
          .from('lesson_content')
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }
        setSuccess('Content added successfully');

        // If it's a QUIZ content type and no URL was provided, offer to create quiz
        if (contentType === 'QUIZ' && !url && result) {
          setTimeout(() => {
            if (window.confirm('Would you like to create an in-app quiz for this content?')) {
              setCurrentQuizContentId(result.content_id);
              setCurrentQuizId(null);
              setShowQuizBuilder(true);
            }
          }, 500);
        }
      }

      handleCloseModal();

      // Refresh content list (don't let errors here prevent state reset)
      try {
        await fetchContent();
      } catch (fetchError) {
        console.error('Error refreshing content list:', fetchError);
        // Don't show error to user - content was saved successfully
      }
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err.message || 'Failed to save content');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId) => {
    console.log('Attempting to delete content with ID:', contentId);
    if (!window.confirm('Are you sure you want to delete this content?')) {
      console.log('Deletion cancelled by user');
      return;
    }

    try {
      // Get content to check if we need to delete file from storage
      const contentItem = content.find(c => c.content_id === contentId);
      console.log('Found content item for deletion:', contentItem);

      // Delete from database
      const { error } = await supabase
        .from('lesson_content')
        .delete()
        .eq('content_id', contentId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      // Delete file from storage if it exists
      if (contentItem?.file_path) {
        try {
          await supabase.storage
            .from('course-content')
            .remove([contentItem.file_path]);
          console.log('Deleted file from storage:', contentItem.file_path);
        } catch (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }

      setSuccess('Content deleted successfully');
      console.log('Deletion successful, refreshing content list');
      fetchContent();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Create a copy of the current content grouped by section
    const sections = groupContentBySection();
    const sourceSectionId = source.droppableId;
    const destSectionId = destination.droppableId;

    const sourceList = [...(sections[sourceSectionId] || [])];
    const destList = sourceSectionId === destSectionId
      ? sourceList
      : [...(sections[destSectionId] || [])];

    // Remove from source
    const [removed] = sourceList.splice(source.index, 1);

    // If moving to a different section, update the content_section
    if (sourceSectionId !== destSectionId) {
      removed.content_section = destSectionId;
    }

    // Add to destination
    destList.splice(destination.index, 0, removed);

    // Update sections object
    sections[sourceSectionId] = sourceList;
    if (sourceSectionId !== destSectionId) {
      sections[destSectionId] = destList;
    }

    // Flatten to create new content array
    const newContent = [];
    Object.entries(sections).forEach(([_, sectionItems]) => {
      newContent.push(...sectionItems);
    });

    // Update sequence_order for all items
    const updatedContent = newContent.map((item, index) => ({
      ...item,
      sequence_order: index + 1
    }));

    // Optimistic update
    setContent(updatedContent);

    try {
      // Prepare updates for Supabase
      const updates = updatedContent.map(item => ({
        ...item,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('lesson_content')
        .upsert(updates, { onConflict: 'content_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error reordering content:', err);
      setError('Failed to save new order');
      fetchContent(); // Revert on error
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
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const getContentUrl = async (item) => {
    // If item has a direct URL that's already accessible, use it
    if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
      return item.url;
    }

    // If it's a file stored in Supabase Storage, generate signed URL
    if (item.file_path) {
      // Check cache first
      if (signedUrls[item.content_id]) {
        return signedUrls[item.content_id];
      }

      try {
        const { data, error } = await supabase.storage
          .from('course-content')
          .createSignedUrl(item.file_path, 3600);

        if (error) {
          console.error('Error generating signed URL:', error);
          // Try to get public URL as fallback
          try {
            const { data: publicUrlData } = supabase.storage
              .from('course-content')
              .getPublicUrl(item.file_path);

            if (publicUrlData?.publicUrl) {
              console.log('Using public URL as fallback:', publicUrlData.publicUrl);
              return publicUrlData.publicUrl;
            }
          } catch (publicUrlError) {
            console.error('Error getting public URL:', publicUrlError);
          }

          // Final fallback to item.url if available
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
        // Fallback to item.url if available
        if (item.url) {
          return item.url;
        }
        return null;
      }
    }

    // Return direct URL if available (even if not http)
    if (item.url) {
      return item.url;
    }

    // No URL or file_path available
    return null;
  };

  const handleContentClick = async (item) => {
    const url = await getContentUrl(item);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handlePreview = async (item) => {
    try {
      console.log('Previewing item:', item);

      // For FLASHCARD content type, open flashcard creator in edit mode
      if (item.content_type === 'FLASHCARD') {
        setEditingContent(item);
        setCurrentFlashcardContentId(item.content_id);
        setShowFlashcardCreator(true);
        return;
      }

      // For INTERACTIVE_VIDEO content type, open interactive video creator in edit mode
      if (item.content_type === 'INTERACTIVE_VIDEO') {
        setEditingContent(item);
        setCurrentInteractiveVideoContentId(item.content_id);
        setShowInteractiveVideoCreator(true);
        return;
      }

      // For INTERACTIVE_BOOK content type, open interactive book creator in edit mode
      if (item.content_type === 'INTERACTIVE_BOOK') {
        setEditingContent(item);
        setCurrentInteractiveBookContentId(item.content_id);
        setShowInteractiveBookCreator(true);
        return;
      }

      // For QUIZ content type, load full quiz details if it's an in-app quiz
      if (item.content_type === 'QUIZ') {
        try {
          // Try to get full quiz data with questions
          const fullQuiz = await supabaseService.getQuizByContentId(item.content_id);

          if (fullQuiz) {
            // In-app quiz exists - show full quiz preview
            setPreviewUrl(null);
            setPreviewingContent({ ...item, hasInAppQuiz: true, quiz: fullQuiz });
            setShowPreviewModal(true);
            return;
          }
        } catch (quizError) {
          // No in-app quiz found, continue to check for URL
          console.log('No in-app quiz found, checking for URL');
        }
      }

      // For ASSIGNMENT content type, prepare full assignment preview
      if (item.content_type === 'ASSIGNMENT') {
        setPreviewUrl(null);
        setPreviewingContent(item);
        setShowPreviewModal(true);
        return;
      }

      const url = await getContentUrl(item);
      console.log('Got URL:', url);

      if (url) {
        setPreviewingContent(item);
        setPreviewUrl(url);
        setShowPreviewModal(true);
      } else {
        // Show preview modal anyway with a message that URL is missing
        setPreviewingContent(item);
        setPreviewUrl(null);
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error('Error previewing content:', err);
      // Show preview modal with error message
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

  // Format rubric text to display tables with clear borders
  const formatRubricForDisplay = (rubricText) => {
    if (!rubricText) return '';

    // Convert markdown-style tables to HTML tables
    const lines = rubricText.split('\n');
    const processedLines = [];
    let inTable = false;
    let tableRows = [];
    let tableHeaders = [];
    let headerSeparatorFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line is a table row (contains |)
      if (line.includes('|') && line.split('|').filter(c => c.trim()).length > 1) {
        // Check if it's a header separator (contains dashes and optional colons)
        if (line.match(/^[\|\s\-:]+$/) && !headerSeparatorFound) {
          // This is a separator row - mark that we have headers
          headerSeparatorFound = true;
          inTable = true;
          continue;
        }

        // Extract cells - split by | and filter out empty strings
        const rawCells = line.split('|');
        const cells = rawCells
          .map(c => c.trim())
          .filter((c, idx) => {
            // Keep first and last if they're not empty, or all middle ones
            if (idx === 0 || idx === rawCells.length - 1) {
              return c.length > 0;
            }
            return true;
          });

        // Ensure we have valid cells
        if (cells.length < 2) {
          // Not a valid table row, treat as regular text
          if (inTable && tableRows.length > 0) {
            // Close the table first
            processedLines.push(buildTableHTML(tableHeaders, tableRows, headerSeparatorFound));
            tableRows = [];
            tableHeaders = [];
            inTable = false;
            headerSeparatorFound = false;
          }
          if (line) {
            processedLines.push(`<p style="margin: 0.5rem 0;">${escapeHtml(line)}</p>`);
          } else {
            processedLines.push('<br />');
          }
          continue;
        }

        if (!inTable && !headerSeparatorFound) {
          // First row - treat as headers
          tableHeaders = cells;
          tableRows.push(cells);
        } else if (headerSeparatorFound && tableRows.length === 0) {
          // We had a separator, so previous row was headers, this is first data row
          tableRows.push(cells);
        } else {
          // Data row
          tableRows.push(cells);
        }
        inTable = true;
      } else {
        // Not a table row
        if (inTable && tableRows.length > 0) {
          // Close the table
          processedLines.push(buildTableHTML(tableHeaders, tableRows, headerSeparatorFound));
          tableRows = [];
          tableHeaders = [];
          inTable = false;
          headerSeparatorFound = false;
        }

        // Add regular text
        if (line) {
          processedLines.push(`<p style="margin: 0.5rem 0;">${escapeHtml(line)}</p>`);
        } else {
          processedLines.push('<br />');
        }
      }
    }

    // Handle any remaining table
    if (inTable && tableRows.length > 0) {
      processedLines.push(buildTableHTML(tableHeaders, tableRows, headerSeparatorFound));
    }

    return processedLines.join('\n');
  };

  // Helper function to build table HTML with proper structure
  const buildTableHTML = (headers, rows, hasHeaders) => {
    // Determine number of columns from headers or first row
    const numCols = headers.length > 0 ? headers.length : (rows.length > 0 ? rows[0].length : 0);
    if (numCols === 0) return '';

    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 1rem 0; table-layout: fixed; border: 2px solid #212529;">';

    // Add headers if we have them
    if (hasHeaders && headers.length > 0) {
      tableHtml += '<thead><tr>';
      headers.forEach((header, idx) => {
        const colWidth = idx === 0 ? '20%' : `${80 / (headers.length - 1)}%`;
        tableHtml += `<th style="border: 2px solid #212529; padding: 0.75rem; background-color: #f8f9fa; font-weight: 600; text-align: left; width: ${colWidth}; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(header)}</th>`;
      });
      tableHtml += '</tr></thead>';
    }

    // Add body rows
    tableHtml += '<tbody>';
    const rowsToRender = hasHeaders && headers.length > 0 ? rows : rows;
    rowsToRender.forEach(row => {
      tableHtml += '<tr>';
      // Ensure row has correct number of cells
      const paddedRow = [...row];
      while (paddedRow.length < numCols) {
        paddedRow.push('');
      }
      paddedRow.slice(0, numCols).forEach((cell, idx) => {
        const colWidth = idx === 0 ? '20%' : `${80 / (numCols - 1)}%`;
        tableHtml += `<td style="border: 1px solid #212529; padding: 0.75rem; width: ${colWidth}; word-wrap: break-word; overflow-wrap: break-word; vertical-align: top;">${escapeHtml(cell)}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    return tableHtml;
  };

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <div className="lesson-content-manager-redesign">
      <div className="content-manager-container">
        {/* Header */}
        <div className="content-header">
          <div className="breadcrumb-nav">
            <span onClick={() => navigate('/teacher/lessons')} className="breadcrumb-link">Lessons</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Content Manager</span>
          </div>
          
          <div className="header-main">
            <div className="header-left">
              <h1 className="lesson-title">
                {lessonData?.lesson_title || 'Lesson Content'}
              </h1>
              {lessonData && (
                <div className="lesson-meta">
                  <span>{lessonData.class_subject?.subject_offering?.subject?.subject_name}</span>
                  <span className="meta-dot"></span>
                  <span>{lessonData.class_subject?.class?.form?.form_name}</span>
                  <span className="meta-dot"></span>
                  <span>{lessonData.topic}</span>
                </div>
              )}
            </div>
            <div className="header-right">
              <span className="content-stats-text">
                {content.length} Items · {content.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0)} Minutes
              </span>
            </div>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="tabs-actions-bar">
          <div className="tabs-left">
            <button 
              className="tab-button"
              onClick={() => navigate(`/teacher/content-library?lessonId=${lessonId}`)}
            >
              Library
            </button>
            <button 
              className="tab-button active"
              onClick={() => navigate(`/teacher/lesson/${lessonId}/preview`)}
            >
              Preview
            </button>
          </div>
          <div className="tabs-right">
            <button
              className="btn-secondary"
              onClick={() => navigate(`/teacher/lesson/${lessonId}/preview`)}
            >
              <FaEye className="me-1" size={14} />
              Student View
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setAiAssistantTab('quick');
                setShowAIAssistant(true);
              }}
              disabled={isGeneratingContent || isGeneratingQuiz || !lessonData}
            >
              {(isGeneratingContent || isGeneratingQuiz) ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Generating...
                </>
              ) : (
                'AI Assistant'
              )}
            </button>
            <button 
              className="btn-primary"
              onClick={() => handleOpenModal()}
            >
              <FaPlus className="me-1" size={14} />
              Add Content
            </button>
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

        {/* Main Content */}
        <div className="main-content-layout">
          {/* Left Sidebar - Lesson Plan Reference */}
          <div className={`lesson-plan-sidebar ${!lessonPlanExpanded ? 'collapsed' : ''}`}>
            <div className="lesson-plan-card">
              <Accordion 
                activeKey={lessonPlanExpanded ? "0" : ""}
                onSelect={(eventKey) => {
                  setLessonPlanExpanded(eventKey === "0");
                }}
              >
                <Accordion.Item eventKey="0">
                  <Accordion.Header className="lesson-plan-accordion-header">
                    <div className="d-flex align-items-center gap-2 w-100">
                      <FaBook className="lesson-plan-icon" />
                      {lessonPlanExpanded && (
                        <>
                          <h2 className="mb-0">Lesson Plan Reference</h2>
                          {lessonData?.lesson_plan && (
                            <Badge bg="secondary" className="ms-auto">
                              {(() => {
                                const sections = lessonData.lesson_plan.match(/LESSON COMPONENTS|ASSESSMENT|RESOURCES/gi);
                                return sections ? sections.length : 0;
                              })()} sections
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="lesson-plan-body">
                    {lessonData?.lesson_plan ? (
                      <StructuredLessonPlanDisplay lessonPlanText={lessonData.lesson_plan} />
                    ) : (
                      <div className="empty-plan-state">
                        <FaInfoCircle className="empty-icon" />
                        <p>No lesson plan available</p>
                        <small>Add a lesson plan to guide content creation</small>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="content-area">
            {content.length === 0 ? (
              <div className="empty-content-card">
                <div className="empty-content-state">
                  <FaLayerGroup className="empty-icon" />
                  <h4>No Content Yet</h4>
                  <p>Start building your lesson by adding content items or using the AI Assistant</p>
                  <div className="empty-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setAiAssistantTab('quick');
                        setShowAIAssistant(true);
                      }}
                    >
                      <FaRobot className="me-2" />
                      Use AI Assistant
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                      <FaPlus className="me-2" />
                      Add Content
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                {Object.entries(groupContentBySection()).map(([sectionName, sectionContent]) => {
                  const isExpanded = expandedSections.includes(sectionName);
                  const sectionColors = {
                    'Learning': 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                    'Assessment': 'bg-violet-50 text-violet-700 hover:bg-violet-100',
                    'Introduction': 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                    'Practice': 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                    'Review': 'bg-purple-50 text-purple-700 hover:bg-purple-100',
                    'Closure': 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  };
                  const sectionColor = sectionColors[sectionName] || 'bg-gray-50 text-gray-700 hover:bg-gray-100';
                  
                  return (
                    <div key={sectionName} className="content-section-new">
                      <button 
                        onClick={() => toggleSection(sectionName)}
                        className={`section-header-button ${sectionColor}`}
                      >
                        {isExpanded ? <FaChevronDown size={16} /> : <FaChevronRight size={16} />}
                        {getSectionIcon(sectionName)}
                        <span className="section-title">{sectionName}</span>
                        <span className="section-badge">{sectionContent.length}</span>
                      </button>
                      
                      {isExpanded && (
                        <Droppable droppableId={sectionName}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="section-content-list"
                            >
                              {sectionContent.map((item, index) => {
                                const isVideo = item.content_type === 'VIDEO' ||
                                  (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')));
                                const isImage = item.content_type === 'IMAGE' ||
                                  (item.mime_type && item.mime_type.startsWith('image/'));
                                
                                // Get icon and color for content type
                                const iconConfig = {
                                  'KEY_CONCEPTS': { icon: FaLightbulb, color: 'bg-amber-500' },
                                  'LEARNING_ACTIVITIES': { icon: FaBook, color: 'bg-emerald-500' },
                                  'REFLECTION_QUESTIONS': { icon: FaQuestionCircle, color: 'bg-blue-500' },
                                  'LEARNING_OUTCOMES': { icon: FaCheckCircle, color: 'bg-green-500' },
                                  'DISCUSSION_PROMPTS': { icon: FaComments, color: 'bg-purple-500' },
                                  'SUMMARY': { icon: FaClipboardList, color: 'bg-gray-500' }
                                };
                                const config = iconConfig[item.content_type] || { icon: FaFileAlt, color: 'bg-gray-500' };
                                const ContentIcon = config.icon;
                                
                                // Get content text
                                const contentText = 
                                  item.content_type === 'LEARNING_OUTCOMES' ? item.learning_outcomes :
                                  item.content_type === 'LEARNING_ACTIVITIES' ? item.learning_activities :
                                  item.content_type === 'KEY_CONCEPTS' ? item.key_concepts :
                                  item.content_type === 'REFLECTION_QUESTIONS' ? item.reflection_questions :
                                  item.content_type === 'DISCUSSION_PROMPTS' ? item.discussion_prompts :
                                  item.content_type === 'SUMMARY' ? item.summary : '';
                                
                                const contentLines = contentText ? contentText.split('\n').filter(line => line.trim()).join('. ') : '';
                                
                                return (
                                  <Draggable
                                    key={item.content_id}
                                    draggableId={String(item.content_id)}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`content-item-new ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                        onMouseEnter={() => setHoveredItem(item.content_id)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                      >
                                        {/* Drag handle - only visible on hover */}
                                        <div 
                                          className={`drag-handle-new ${hoveredItem === item.content_id ? 'visible' : ''}`}
                                          {...provided.dragHandleProps}
                                        >
                                          <FaGripVertical size={16} />
                                        </div>
                                        
                                        <div className="content-item-main">
                                          <div className={`content-icon-badge ${config.color}`}>
                                            <ContentIcon size={14} />
                                          </div>
                                          
                                          <div className="content-item-info">
                                            <div className="content-item-header">
                                              <span className="content-item-title">
                                                {item.title || item.content_type.replace(/_/g, ' ')}
                                              </span>
                                              {item.estimated_minutes && (
                                                <span className="content-item-time">
                                                  <FaClock size={10} />
                                                  {item.estimated_minutes} min
                                                </span>
                                              )}
                                              {item.is_required !== undefined && (
                                                <span className={`content-item-badge ${item.is_required !== false ? 'badge-required' : 'badge-optional'}`}>
                                                  {item.is_required !== false ? 'Required' : 'Optional'}
                                                </span>
                                              )}
                                            </div>
                                            {contentLines && (
                                              <p className="content-item-text">{contentLines}</p>
                                            )}
                                          </div>
                                          
                                          {/* Action menu - only visible on hover */}
                                          <div className={`action-menu-wrapper ${hoveredItem === item.content_id ? 'visible' : ''}`}>
                                            <div className="relative">
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setShowActionMenu(showActionMenu === item.content_id ? null : item.content_id);
                                                }}
                                                className="action-menu-button"
                                              >
                                                <FaEllipsisH size={16} />
                                              </button>
                                              {showActionMenu === item.content_id && (
                                                <div className="action-menu-dropdown">
                                                  <button 
                                                    className="action-menu-item"
                                                    onClick={() => {
                                                      setShowActionMenu(null);
                                                      handlePreview(item);
                                                    }}
                                                  >
                                                    <FaEye size={14} />
                                                    Preview
                                                  </button>
                                                  <button 
                                                    className="action-menu-item"
                                                    onClick={() => {
                                                      setShowActionMenu(null);
                                                      handleOpenModal(item);
                                                    }}
                                                  >
                                                    <FaEdit size={14} />
                                                    Edit
                                                  </button>
                                                  <button 
                                                    className="action-menu-item delete"
                                                    onClick={() => {
                                                      setShowActionMenu(null);
                                                      handleDelete(item.content_id);
                                                    }}
                                                  >
                                                    <FaTrash size={14} />
                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Video/Image Preview */}
                                        {isVideo && item.url && (
                                          <div className="content-preview">
                                            {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                              <div className="ratio ratio-16x9">
                                                <iframe
                                                  src={getYouTubeEmbedUrl(item.url)}
                                                  title={item.title}
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                  allowFullScreen
                                                  style={{ border: 0 }}
                                                />
                                              </div>
                                            ) : (
                                              <video controls className="w-100 rounded" style={{ maxHeight: '200px' }}>
                                                <source src={item.url} type={item.mime_type || 'video/mp4'} />
                                              </video>
                                            )}
                                          </div>
                                        )}
                                        
                                        {isImage && (item.url || item.file_path) && (
                                          <div className="content-preview">
                                            <img
                                              src={item.url || signedUrls[item.content_id] || ''}
                                              alt={item.title}
                                              className="img-fluid rounded"
                                              style={{ maxHeight: '150px', width: 'auto' }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  );
                })}
              </DragDropContext>
            )}
          </div>
        </div>

      {/* Add/Edit Content Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContent ? 'Edit Content' : 'Add Content'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
                <strong>Error:</strong> {error}
              </Alert>
            )}
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
                  setAssignmentDetailsFile(null);
                  setAssignmentRubricFile(null);
                  setUploadedRubricFileInfo(null);

                  // Open flashcard creator if FLASHCARD is selected
                  if (newType === 'FLASHCARD' && !editingContent) {
                    setShowModal(false);
                    setShowFlashcardCreator(true);
                    setCurrentFlashcardContentId(null);
                    return;
                  }

                  // Open interactive video creator if INTERACTIVE_VIDEO is selected
                  if (newType === 'INTERACTIVE_VIDEO' && !editingContent) {
                    setShowModal(false);
                    setShowInteractiveVideoCreator(true);
                    setCurrentInteractiveVideoContentId(null);
                    return;
                  }

                  // Open interactive book creator if INTERACTIVE_BOOK is selected
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
                  <option value="AR_OVERLAY">AR Content (Augmented Reality)</option>
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

            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={title || ''}
                onChange={(e) => setTitle(e.target.value || '')}
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
                    onClick={async (e) => {
                      e.preventDefault();
                      await handleGeneratePerContentType(contentType);
                    }}
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
                {perContentAIGenerating && (
                  <Alert variant="info" className="mb-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating {contentType.replace('_', ' ').toLowerCase()}...
                  </Alert>
                )}
                {!perContentAIGenerating && (
                  <>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={contentText || ''}
                      onChange={(e) => setContentText(e.target.value || '')}
                      placeholder={`Enter ${contentType.replace('_', ' ').toLowerCase()}...`}
                      required
                    />
                    <div className="mt-2">
                      <Form.Control
                        type="text"
                        placeholder="Optional: Add specific instructions for AI generation"
                        value={perContentAIPrompt}
                        onChange={(e) => setPerContentAIPrompt(e.target.value)}
                        className="mb-2"
                      />
                      {['LEARNING_ACTIVITIES', 'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS'].includes(contentType) && (
                        <Form.Control
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Number of items (e.g., 3 activities, 5 questions)"
                          value={perContentAIQuantity}
                          onChange={(e) => setPerContentAIQuantity(parseInt(e.target.value) || 1)}
                          className="mb-2"
                        />
                      )}
                    </div>
                  </>
                )}
                <Form.Text className="text-muted">
                  {contentType === 'LEARNING_OUTCOMES' && 'What will students learn from this content?'}
                  {contentType === 'LEARNING_ACTIVITIES' && 'Activities students should complete'}
                  {contentType === 'KEY_CONCEPTS' && 'Key concepts or terms covered in this content'}
                  {contentType === 'REFLECTION_QUESTIONS' && 'Questions for students to reflect on'}
                  {contentType === 'DISCUSSION_PROMPTS' && 'Discussion topics or prompts for students'}
                  {contentType === 'SUMMARY' && 'Brief summary of this content'}
                </Form.Text>
              </Form.Group>
            ) : contentType === 'FILE' ? (
              <Form.Group className="mb-3">
                <Form.Label>File *</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  required={!editingContent}
                />
                {editingContent && !selectedFile && (
                  <Form.Text className="text-muted">
                    Current file: {editingContent.file_name || 'No file'}
                  </Form.Text>
                )}
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0">URL {
                    contentType === 'QUIZ' ? '(Optional - or create quiz in-app)' :
                      contentType === 'ASSIGNMENT' ? '(Optional)' :
                        contentType === 'VIDEO' ? '(Optional - or find with AI)' :
                          '*'
                  }</Form.Label>
                  {['QUIZ', 'ASSIGNMENT', 'VIDEO', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK'].includes(contentType) && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={async (e) => {
                        e.preventDefault();
                        await handleGeneratePerContentType(contentType);
                      }}
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
                  )}
                </div>
                {perContentAIGenerating && ['QUIZ', 'ASSIGNMENT', 'VIDEO', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK'].includes(contentType) && (
                  <Alert variant="info" className="mb-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating {contentType.replace('_', ' ').toLowerCase()}...
                  </Alert>
                )}
                {!perContentAIGenerating && (
                  <Form.Control
                    type="url"
                    value={url || ''}
                    onChange={(e) => setUrl(e.target.value || '')}
                    placeholder={
                      contentType === 'QUIZ' ? "External Quiz URL (e.g., Google Forms, Kahoot, Quizizz) - OR create quiz in-app after saving" :
                        contentType === 'ASSIGNMENT' ? "Assignment URL (e.g., Google Classroom, assignment link) - Optional" :
                          contentType === 'VIDEO' ? "Video URL (e.g., YouTube) - OR use AI to find one" :
                            contentType === 'TEST' ? "Test URL (e.g., test platform link)" :
                              contentType === 'EXAM' ? "Exam URL (e.g., exam platform link)" :
                                contentType === 'PROJECT' ? "Project URL (e.g., project description or submission link)" :
                                  contentType === 'SURVEY' ? "Survey URL (e.g., Google Forms, SurveyMonkey)" :
                                    "https://..."
                    }
                    required={contentType !== 'QUIZ' && contentType !== 'ASSIGNMENT' && contentType !== 'VIDEO'}
                  />
                )}
                {['QUIZ', 'ASSIGNMENT', 'VIDEO', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK'].includes(contentType) && !perContentAIGenerating && (
                  <div className="mt-2">
                    <Form.Control
                      type="text"
                      placeholder="Optional: Add specific instructions for AI generation"
                      value={perContentAIPrompt}
                      onChange={(e) => setPerContentAIPrompt(e.target.value)}
                      className="mb-2"
                    />
                    {['QUIZ', 'FLASHCARD', 'INTERACTIVE_VIDEO', 'INTERACTIVE_BOOK'].includes(contentType) && (
                      <Form.Control
                        type="number"
                        min="1"
                        max={contentType === 'QUIZ' ? 20 : contentType === 'FLASHCARD' ? 50 : 20}
                        placeholder={
                          contentType === 'QUIZ' ? "Number of questions (1-20)" :
                            contentType === 'FLASHCARD' ? "Number of flashcards (1-50)" :
                              contentType === 'INTERACTIVE_VIDEO' ? "Number of checkpoints (1-20)" :
                                contentType === 'INTERACTIVE_BOOK' ? "Number of pages (1-20)" :
                                  ""
                        }
                        value={perContentAIQuantity}
                        onChange={(e) => setPerContentAIQuantity(parseInt(e.target.value) || 1)}
                        className="mb-2"
                      />
                    )}
                  </div>
                )}
                {contentType === 'QUIZ' && (
                  <>
                    <Form.Text className="text-muted">
                      You can either enter an external quiz URL (Google Forms, Kahoot, Quizizz) OR create an in-app quiz with AI.
                    </Form.Text>
                    <Alert variant="info" className="mt-2 mb-0">
                      <FaClipboardCheck className="me-2" />
                      <strong>Create In-App Quiz:</strong> Use AI to generate a quiz, or click the "Save & Create Quiz" button below to manually create one.
                    </Alert>
                  </>
                )}
                {contentType === 'ASSIGNMENT' && (
                  <Form.Text className="text-muted">
                    Optionally enter a URL to your assignment (Google Classroom, assignment platform, or submission link). Use AI to generate an assignment rubric, or upload assignment details and rubric PDFs below.
                  </Form.Text>
                )}
                {contentType === 'VIDEO' && (
                  <Form.Text className="text-muted">
                    Enter a video URL manually, or use AI to search for educational videos related to your lesson topic.
                  </Form.Text>
                )}
                {contentType === 'FLASHCARD' && (
                  <Form.Text className="text-muted">
                    Use AI to generate flashcards, or create them manually using the flashcard creator.
                  </Form.Text>
                )}
                {contentType === 'INTERACTIVE_VIDEO' && (
                  <Form.Text className="text-muted">
                    Use AI to generate an interactive video with checkpoints, or create one manually.
                  </Form.Text>
                )}
                {contentType === 'INTERACTIVE_BOOK' && (
                  <Form.Text className="text-muted">
                    Use AI to generate an interactive book with multiple pages, or create one manually.
                  </Form.Text>
                )}
                {contentType === 'TEST' && (
                  <Form.Text className="text-muted">
                    Enter the URL to your test (test platform, Google Forms, or assessment tool)
                  </Form.Text>
                )}
                {contentType === 'EXAM' && (
                  <Form.Text className="text-muted">
                    Enter the URL to your exam (exam platform, Google Forms, or assessment tool)
                  </Form.Text>
                )}
                {contentType === 'PROJECT' && (
                  <Form.Text className="text-muted">
                    Enter the URL to your project (project description, submission link, or project management tool)
                  </Form.Text>
                )}
                {contentType === 'SURVEY' && (
                  <Form.Text className="text-muted">
                    Enter the URL to your survey or poll (Google Forms, SurveyMonkey, or other survey platform)
                  </Form.Text>
                )}
              </Form.Group>
            )}

            {/* 3D Model / AR Content Selector */}
            {(contentType === '3D_MODEL' || contentType === 'AR_OVERLAY') && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Select {contentType === 'AR_OVERLAY' ? 'AR Content' : '3D Model'} *
                </Form.Label>
                {contentType === 'AR_OVERLAY' && (
                  <Alert variant="info" className="mb-3">
                    <strong>AR Content:</strong> Select an AR Overlay from the list below. Students will be able to superimpose this 3D object into their world view using their device camera.
                  </Alert>
                )}
                {loading3DModels ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <p className="text-muted mt-2">Loading 3D models...</p>
                  </div>
                ) : available3DModels.length === 0 ? (
                  <Alert variant="warning">
                    <strong>No {contentType === 'AR_OVERLAY' ? 'AR content' : '3D models'} available.</strong>
                    <div className="mt-2">
                      <p className="mb-2">To add {contentType === 'AR_OVERLAY' ? 'AR content' : '3D models'}:</p>
                      <ol className="mb-0">
                        <li>Go to <strong>Admin Dashboard → AR/VR Content</strong></li>
                        <li>Click <strong>"Add {contentType === 'AR_OVERLAY' ? 'AR Overlay' : '3D Model'}"</strong></li>
                        <li>{contentType === 'AR_OVERLAY' ? 'Select "AR Overlay" as content type and upload your 3D model' : 'Upload your 3D model file (GLTF/GLB format)'}</li>
                      </ol>
                    </div>
                  </Alert>
                ) : (
                  <>
                    <Form.Select
                      value={selected3DModel?.content_id || ''}
                      onChange={(e) => {
                        const modelId = e.target.value;
                        const model = available3DModels.find(m => m.content_id.toString() === modelId);
                        setSelected3DModel(model || null);
                        if (model) {
                          setUrl(model.content_url || '');
                          setTitle(model.content_name || title);
                          setDescription(model.description || description);
                        }
                      }}
                      required
                    >
                      <option value="">-- Select {contentType === 'AR_OVERLAY' ? 'AR Content' : '3D Model'} --</option>
                      {available3DModels
                        .filter(model => {
                          // For AR_OVERLAY, only show AR_OVERLAY content types
                          // For 3D_MODEL, show 3D_MODEL and other non-AR types
                          if (contentType === 'AR_OVERLAY') {
                            return model.content_type === 'AR_OVERLAY';
                          } else {
                            return model.content_type === '3D_MODEL' || model.content_type === 'VR_EXPERIENCE';
                          }
                        })
                        .map((model) => (
                          <option key={model.content_id} value={model.content_id}>
                            {model.content_name} ({model.content_type.replace('_', ' ')}) - {model.subjects?.subject_name || 'All Subjects'}
                          </option>
                        ))}
                    </Form.Select>
                    {selected3DModel && (
                      <div className="mt-3">
                        <Card>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">{selected3DModel.content_name}</h6>
                                <Badge bg="primary" className="me-2">
                                  {selected3DModel.content_type.replace('_', ' ')}
                                </Badge>
                                {selected3DModel.model_format && (
                                  <Badge bg="secondary">{selected3DModel.model_format}</Badge>
                                )}
                              </div>
                            </div>
                            {selected3DModel.description && (
                              <p className="text-muted small mb-2">{selected3DModel.description}</p>
                            )}
                            <div className="small text-muted">
                              <div><strong>Format:</strong> {selected3DModel.model_format || 'N/A'}</div>
                              {selected3DModel.estimated_duration_minutes && (
                                <div><strong>Duration:</strong> ~{selected3DModel.estimated_duration_minutes} minutes</div>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    )}
                    <Form.Text className="text-muted">
                      {contentType === 'AR_OVERLAY'
                        ? 'Select AR content from your library. Students will be able to superimpose this 3D object into their real-world view using Web AR.'
                        : 'Select a 3D model from your library. Students will be able to view and interact with it in the lesson.'}
                    </Form.Text>
                    {contentType === 'AR_OVERLAY' && selected3DModel && (
                      <Alert variant="success" className="mt-2">
                        <strong>✓ AR Content Selected</strong>
                        <p className="mb-0 mt-2">
                          Students will be able to:
                        </p>
                        <ul className="mb-0 mt-2">
                          <li>View this 3D model in Augmented Reality</li>
                          <li>Superimpose the object into their real-world view</li>
                          <li>Place the object on detected surfaces</li>
                          <li>Move around to view from different angles</li>
                        </ul>
                      </Alert>
                    )}
                  </>
                )}
                {error && error.includes('arvr_content') && (
                  <Alert variant="danger" className="mt-2">
                    <strong>Database Error:</strong> {error}
                  </Alert>
                )}
              </Form.Group>
            )}

            {/* Assignment PDF upload fields */}
            {contentType === 'ASSIGNMENT' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Assignment Details PDF (Optional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setAssignmentDetailsFile(e.target.files[0] || null)}
                  />
                  <Form.Text className="text-muted">
                    Upload a PDF file containing the assignment details, instructions, and requirements.
                  </Form.Text>
                  {editingContent && editingContent.assignment_details_file_name && !assignmentDetailsFile && (
                    <Alert variant="info" className="mt-2 mb-0">
                      <FaFilePdf className="me-2" />
                      Current file: <strong>{editingContent.assignment_details_file_name}</strong>
                      {' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={async () => {
                          try {
                            const bucketName = 'course-content';
                            const { data, error } = await supabase.storage
                              .from(bucketName)
                              .createSignedUrl(editingContent.assignment_details_file_path, 3600);
                            if (error) throw error;
                            if (data) {
                              window.open(data.signedUrl, '_blank');
                            }
                          } catch (err) {
                            console.error('Error generating signed URL:', err);
                            setError('Failed to open file. Please try again.');
                          }
                        }}
                      >
                        View
                      </Button>
                    </Alert>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Assignment Rubric PDF (Optional)</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={async () => {
                        if (!title.trim()) {
                          setError('Please enter an assignment title first');
                          return;
                        }
                        setGeneratingRubric(true);
                        setError(null);
                        try {
                          const subjectName = lessonData?.class_subject?.subject_offering?.subject?.subject_name || 'General';
                          const formName = lessonData?.class_subject?.class?.form?.form_name || 'General';

                          const rubric = await generateAssignmentRubric({
                            assignmentTitle: title.trim(),
                            assignmentDescription: description?.trim() || instructions?.trim() || '',
                            subject: subjectName,
                            gradeLevel: formName,
                            totalPoints: 100
                          });

                          setGeneratedRubric(rubric);
                          setShowRubricModal(true);
                        } catch (err) {
                          console.error('Error generating rubric:', err);
                          setError(err.message || 'Failed to generate rubric. Please check your OpenAI API key configuration.');
                        } finally {
                          setGeneratingRubric(false);
                        }
                      }}
                      disabled={generatingRubric || !title.trim()}
                    >
                      {generatingRubric ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaLightbulb className="me-2" />
                          Generate Rubric with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <Form.Control
                    type="file"
                    accept=".pdf,application/pdf,.txt,text/plain"
                    onChange={(e) => {
                      setAssignmentRubricFile(e.target.files[0] || null);
                      setUploadedRubricFileInfo(null); // Clear pre-uploaded rubric if user selects a new file
                    }}
                  />
                  <Form.Text className="text-muted">
                    Upload a PDF or text file containing the grading rubric for this assignment, or use AI to generate one.
                  </Form.Text>
                  {uploadedRubricFileInfo && (
                    <Alert variant="success" className="mt-2 mb-0">
                      <FaFilePdf className="me-2" />
                      Rubric uploaded: <strong>{uploadedRubricFileInfo.file_name}</strong>
                      {' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={async () => {
                          try {
                            const bucketName = 'course-content';
                            const { data, error } = await supabase.storage
                              .from(bucketName)
                              .createSignedUrl(uploadedRubricFileInfo.file_path, 3600);
                            if (error) throw error;
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            }
                          } catch (err) {
                            console.error('Error generating signed URL:', err);
                            setError('Failed to open file. Please try again.');
                          }
                        }}
                      >
                        View
                      </Button>
                    </Alert>
                  )}
                  {editingContent && editingContent.assignment_rubric_file_name && !assignmentRubricFile && !uploadedRubricFileInfo && (
                    <Alert variant="info" className="mt-2 mb-0">
                      <FaFilePdf className="me-2" />
                      Current file: <strong>{editingContent.assignment_rubric_file_name}</strong>
                      {editingContent.assignment_rubric_file_size && (
                        <small className="text-muted ms-2">
                          ({formatFileSize(editingContent.assignment_rubric_file_size)})
                        </small>
                      )}
                      {' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={async () => {
                          try {
                            const bucketName = 'course-content';
                            const { data, error } = await supabase.storage
                              .from(bucketName)
                              .createSignedUrl(editingContent.assignment_rubric_file_path, 3600);
                            if (error) throw error;
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            }
                          } catch (err) {
                            console.error('Error generating signed URL:', err);
                            setError('Failed to open file. Please try again.');
                          }
                        }}
                      >
                        View
                      </Button>
                    </Alert>
                  )}
                </Form.Group>
              </>
            )}

            {/* Only show these fields for Media & Files content types */}
            {!['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
              'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(contentType) && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={description || ''}
                      onChange={(e) => setDescription(e.target.value || '')}
                      placeholder="Brief description of this content"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Instructions for Students</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={instructions || ''}
                      onChange={(e) => setInstructions(e.target.value || '')}
                      placeholder="Instructions on how students should use this content (e.g., 'Watch this video and take notes', 'Complete this reading before the next lesson')"
                    />
                    <Form.Text className="text-muted">
                      Provide clear instructions to guide students on how to engage with this content.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Key Concepts</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={keyConcepts || ''}
                      onChange={(e) => setKeyConcepts(e.target.value || '')}
                      placeholder="Key concepts or terms covered in this content (one per line or comma-separated)"
                    />
                    <Form.Text className="text-muted">
                      List the main concepts or terms students should understand.
                    </Form.Text>
                  </Form.Group>
                </>
              )}

            {/* Only show these fields for Media & Files content types */}
            {!['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
              'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(contentType) && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Content Category</Form.Label>
                        <Form.Select
                          value={contentSection || 'Learning'}
                          onChange={(e) => setContentSection(e.target.value || 'Learning')}
                        >
                          <option value="Learning">Learning</option>
                          <option value="Assessments">Assessments</option>
                          <option value="Resources">Resources</option>
                          <option value="Practice">Practice</option>
                          <option value="Homework">Homework</option>
                          <option value="Introduction">Introduction</option>
                          <option value="Main Content">Main Content</option>
                          <option value="Additional Materials">Additional Materials</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Categorize content for better organization in student view
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Estimated Time (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={estimatedMinutes || ''}
                          onChange={(e) => setEstimatedMinutes(e.target.value || '')}
                          placeholder="e.g., 15"
                        />
                        <Form.Text className="text-muted">
                          How long should students spend on this content?
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Required Content"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                    />
                    <Form.Text className="text-muted">
                      Uncheck if this content is optional for students
                    </Form.Text>
                  </Form.Group>

                  {/* Prerequisites Selection */}
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Prerequisites <small className="text-muted">(Optional)</small>
                    </Form.Label>
                    <Form.Text className="d-block mb-2 text-muted">
                      Select content items that students must complete before accessing this content.
                      If no prerequisites are selected, the system will use sequence order automatically.
                    </Form.Text>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      padding: '0.75rem'
                    }}>
                      {content
                        .filter(item => !editingContent || item.content_id !== editingContent.content_id)
                        .map(item => (
                          <Form.Check
                            key={item.content_id}
                            type="checkbox"
                            id={`prereq-${item.content_id}`}
                            label={`${item.title} (${item.content_type})`}
                            checked={selectedPrerequisites.includes(item.content_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPrerequisites([...selectedPrerequisites, item.content_id]);
                              } else {
                                setSelectedPrerequisites(selectedPrerequisites.filter(id => id !== item.content_id));
                              }
                            }}
                            className="mb-2"
                          />
                        ))}
                      {content.filter(item => !editingContent || item.content_id !== editingContent.content_id).length === 0 && (
                        <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                          No other content items available. Add more content to set prerequisites.
                        </p>
                      )}
                    </div>
                  </Form.Group>
                </>
              )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={uploading}>
              Cancel
            </Button>
            {contentType === 'QUIZ' && !editingContent && (
              <Button
                variant="outline-success"
                onClick={async (e) => {
                  e.preventDefault();
                  // Save content first, then open quiz builder
                  try {
                    setError(null);
                    setSuccess(null);
                    setUploading(true);

                    if (!title.trim()) {
                      setError('Title is required');
                      setUploading(false);
                      return;
                    }

                    const contentData = {
                      lesson_id: parseInt(lessonId),
                      content_type: contentType,
                      title: title.trim(),
                      url: url?.trim() || null,
                      description: description?.trim() || null,
                      instructions: instructions?.trim() || null,
                      key_concepts: keyConcepts?.trim() || null,
                      content_section: contentSection || 'Learning',
                      is_required: isRequired,
                      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
                      sequence_order: content.length > 0 ? Math.max(...content.map(c => c.sequence_order || 0)) + 1 : 1,
                      is_published: true,
                      published_at: new Date().toISOString(),
                      uploaded_by: user.user_id || user.userId
                    };

                    const { data: result, error: insertError } = await supabase
                      .from('lesson_content')
                      .insert(contentData)
                      .select()
                      .single();

                    if (insertError) throw insertError;

                    handleCloseModal();
                    fetchContent();

                    // Open quiz builder
                    setCurrentQuizContentId(result.content_id);
                    setCurrentQuizId(null);
                    setShowQuizBuilder(true);
                  } catch (err) {
                    console.error('Error saving content:', err);
                    setError(err.message || 'Failed to save content');
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading || !title.trim()}
                className="me-2"
              >
                <FaClipboardCheck className="me-2" />
                Save & Create Quiz
              </Button>
            )}
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingContent ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                editingContent ? 'Update' : 'Add'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={handleClosePreviewModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2" />
            Preview: {previewingContent?.title || 'Content Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: '400px' }}>
          {previewingContent && (
            <>
              {(() => {
                // Skip IIFE rendering for full quiz/assignment previews
                if (previewingContent.content_type === 'QUIZ' && previewingContent.hasInAppQuiz) {
                  return null;
                }
                if (previewingContent.content_type === 'ASSIGNMENT') {
                  return null;
                }

                if (previewingContent.content_type === 'FLASHCARD') {
                  // Flashcard preview handled separately
                } else if (previewingContent.content_type === 'INTERACTIVE_VIDEO') {
                  // Interactive video preview - handled separately in modal
                  return null;
                } else if (previewingContent.content_type === 'INTERACTIVE_BOOK') {
                  // Interactive book preview - handled separately in modal
                  return null;
                } else if (previewingContent.content_type === 'FLASHCARD') {
                  return (
                    <div className="p-3">
                      <FlashcardViewer
                        contentData={previewingContent.content_data || { cards: [], settings: {} }}
                        title={previewingContent.title}
                        description={previewingContent.description}
                      />
                    </div>
                  );
                }

                const isTextContent = ['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                  'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(previewingContent.content_type);

                if (isTextContent) {
                  const contentText =
                    previewingContent.content_type === 'LEARNING_OUTCOMES' ? previewingContent.learning_outcomes :
                      previewingContent.content_type === 'LEARNING_ACTIVITIES' ? previewingContent.learning_activities :
                        previewingContent.content_type === 'KEY_CONCEPTS' ? previewingContent.key_concepts :
                          previewingContent.content_type === 'REFLECTION_QUESTIONS' ? previewingContent.reflection_questions :
                            previewingContent.content_type === 'DISCUSSION_PROMPTS' ? previewingContent.discussion_prompts :
                              previewingContent.content_type === 'SUMMARY' ? previewingContent.summary : '';

                  return (
                    <div className="p-4">
                      <div className="mb-3">
                        <h5 className="mb-3">{previewingContent.title}</h5>
                        <div className="white-space-pre-wrap" style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                          {contentText || 'No content available.'}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (previewUrl) {
                  const isVideo = previewingContent.content_type === 'VIDEO' ||
                    (previewUrl && (previewUrl.includes('youtube.com') || previewUrl.includes('youtu.be')));
                  const isImage = previewingContent.content_type === 'IMAGE' ||
                    (previewingContent.mime_type && previewingContent.mime_type.startsWith('image/'));

                  if (isVideo) {
                    if (previewUrl.includes('youtube.com') || previewUrl.includes('youtu.be')) {
                      return (
                        <div className="ratio ratio-16x9">
                          <iframe
                            src={getYouTubeEmbedUrl(previewUrl)}
                            title={previewingContent.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ border: 0 }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <video controls className="w-100" style={{ maxHeight: '500px' }}>
                          <source src={previewUrl} type={previewingContent.mime_type || 'video/mp4'} />
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                  } else if (isImage) {
                    return (
                      <div className="text-center">
                        <img
                          src={previewUrl}
                          alt={previewingContent.title}
                          className="img-fluid"
                          style={{ maxHeight: '500px', maxWidth: '100%' }}
                        />
                      </div>
                    );
                  } else {
                    const assessmentTypes = ['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'];
                    const isAssessment = assessmentTypes.includes(previewingContent.content_type);
                    const assessmentLabels = {
                      'QUIZ': 'Quiz',
                      'ASSIGNMENT': 'Assignment',
                      'TEST': 'Test',
                      'EXAM': 'Exam',
                      'PROJECT': 'Project',
                      'SURVEY': 'Survey'
                    };
                    const label = assessmentLabels[previewingContent.content_type] || 'Content';
                    return (
                      <div className="text-center py-5">
                        {isAssessment ? (
                          <>
                            <h5 className="mb-3">{label}: {previewingContent.title}</h5>
                            <p className="mb-3">Click the button below to open the {label.toLowerCase()} in a new tab.</p>
                          </>
                        ) : (
                          <p className="mb-3">Preview not available for this content type.</p>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => window.open(previewUrl, '_blank')}
                        >
                          <FaExternalLinkAlt className="me-2" />
                          {isAssessment ? `Open ${label}` : 'Open in New Tab'}
                        </Button>
                      </div>
                    );
                  }
                  return null;
                }

                return null;
              })()}
              {/* Full Quiz Preview */}
              {previewingContent.content_type === 'QUIZ' && previewingContent.hasInAppQuiz && previewingContent.quiz && (
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <Alert variant="success" className="mb-4">
                    <h5>
                      <FaClipboardCheck className="me-2" />
                      In-App Quiz Preview
                    </h5>
                    <div className="mb-2">
                      <strong>Quiz Title:</strong> {previewingContent.quiz.title || previewingContent.title}
                    </div>
                    {previewingContent.quiz.description && (
                      <div className="mb-2">
                        <strong>Description:</strong> {previewingContent.quiz.description}
                      </div>
                    )}
                    <div className="d-flex gap-4 flex-wrap">
                      {previewingContent.quiz.total_points && (
                        <div>
                          <strong>Total Points:</strong> {previewingContent.quiz.total_points}
                        </div>
                      )}
                      {previewingContent.quiz.time_limit_minutes && (
                        <div>
                          <strong>Time Limit:</strong> {previewingContent.quiz.time_limit_minutes} minutes
                        </div>
                      )}
                      {previewingContent.quiz.passing_score && (
                        <div>
                          <strong>Passing Score:</strong> {previewingContent.quiz.passing_score}%
                        </div>
                      )}
                      <div>
                        <strong>Status:</strong>{' '}
                        <Badge bg={previewingContent.quiz.is_published ? 'success' : 'warning'}>
                          {previewingContent.quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </Alert>

                  {previewingContent.quiz.questions && previewingContent.quiz.questions.length > 0 ? (
                    <div>
                      <h6 className="mb-3">Questions ({previewingContent.quiz.questions.length})</h6>
                      {previewingContent.quiz.questions.map((question, index) => (
                        <Card key={question.question_id || index} className="mb-3">
                          <Card.Header className="bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>Question {index + 1}</strong>
                              <Badge bg="info">{question.points || 0} points</Badge>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <p className="mb-3"><strong>{question.question_text}</strong></p>
                            <Badge bg="secondary" className="mb-3">{question.question_type}</Badge>

                            {['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type) && question.options && (
                              <div className="mt-3">
                                <strong>Answer Options:</strong>
                                <ListGroup className="mt-2">
                                  {question.options.map((option, optIndex) => (
                                    <ListGroup.Item
                                      key={option.option_id || optIndex}
                                      className={option.is_correct ? 'bg-success bg-opacity-25' : ''}
                                    >
                                      <div className="d-flex align-items-center">
                                        {option.is_correct && (
                                          <FaCheckCircle className="me-2 text-success" />
                                        )}
                                        <span>{option.option_text}</span>
                                        {option.is_correct && (
                                          <Badge bg="success" className="ms-auto">Correct</Badge>
                                        )}
                                      </div>
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              </div>
                            )}

                            {['SHORT_ANSWER', 'FILL_BLANK'].includes(question.question_type) && question.correct_answers && question.correct_answers.length > 0 && (
                              <div className="mt-3">
                                <strong>Correct Answer(s):</strong>
                                <ul className="mt-2">
                                  {question.correct_answers.map((answer, ansIndex) => (
                                    <li key={ansIndex}>
                                      {answer.correct_answer}
                                      {answer.case_sensitive && <Badge bg="info" className="ms-2">Case Sensitive</Badge>}
                                      {answer.accept_partial && <Badge bg="info" className="ms-2">Partial Match</Badge>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {question.explanation && (
                              <Alert variant="info" className="mt-3 mb-0">
                                <strong>Explanation:</strong> {question.explanation}
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="warning">
                      No questions added to this quiz yet.
                    </Alert>
                  )}

                  <div className="d-flex gap-2 justify-content-center mt-4">
                    <Button
                      variant="success"
                      onClick={() => {
                        handleClosePreviewModal();
                        handleOpenQuizBuilder(previewingContent);
                      }}
                    >
                      <FaClipboardCheck className="me-2" />
                      {previewingContent.quiz.is_published ? 'Edit Quiz' : 'Edit & Publish Quiz'}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        handleClosePreviewModal();
                        handleOpenModal(previewingContent);
                      }}
                    >
                      <FaEdit className="me-2" />
                      Edit Content
                    </Button>
                  </div>
                </div>
              )}

              {/* Full Assignment Preview */}
              {previewingContent.content_type === 'ASSIGNMENT' && (
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <Alert variant="info" className="mb-4">
                    <h5>
                      <FaTasks className="me-2" />
                      Assignment Preview
                    </h5>
                    <div className="mb-2">
                      <strong>Title:</strong> {previewingContent.title}
                    </div>
                    {previewingContent.description && (
                      <div className="mb-2">
                        <strong>Description:</strong> {previewingContent.description}
                      </div>
                    )}
                    {previewingContent.instructions && (
                      <div className="mb-2">
                        <strong>Instructions:</strong> {previewingContent.instructions}
                      </div>
                    )}
                    {previewingContent.estimated_minutes && (
                      <div>
                        <strong>Estimated Time:</strong> {previewingContent.estimated_minutes} minutes
                      </div>
                    )}
                  </Alert>

                  {/* Assignment Details PDF */}
                  {previewingContent.assignment_details_file_name && (
                    <Card className="mb-3">
                      <Card.Header className="bg-primary text-white">
                        <FaFilePdf className="me-2" />
                        Assignment Details PDF
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{previewingContent.assignment_details_file_name}</strong>
                            {previewingContent.assignment_details_file_size && (
                              <small className="text-muted ms-2">
                                ({formatFileSize(previewingContent.assignment_details_file_size)})
                              </small>
                            )}
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('course-content')
                                  .createSignedUrl(previewingContent.assignment_details_file_path, 3600);

                                if (error) throw error;
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                }
                              } catch (err) {
                                console.error('Error opening assignment details:', err);
                                setError('Unable to open assignment details PDF.');
                              }
                            }}
                          >
                            <FaFilePdf className="me-2" />
                            View PDF
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Assignment Rubric PDF */}
                  {previewingContent.assignment_rubric_file_name && (
                    <Card className="mb-3">
                      <Card.Header className="bg-success text-white">
                        <FaFilePdf className="me-2" />
                        Grading Rubric PDF
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{previewingContent.assignment_rubric_file_name}</strong>
                            {previewingContent.assignment_rubric_file_size && (
                              <small className="text-muted ms-2">
                                ({formatFileSize(previewingContent.assignment_rubric_file_size)})
                              </small>
                            )}
                          </div>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('course-content')
                                  .createSignedUrl(previewingContent.assignment_rubric_file_path, 3600);

                                if (error) throw error;
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                }
                              } catch (err) {
                                console.error('Error opening assignment rubric:', err);
                                setError('Unable to open assignment rubric PDF.');
                              }
                            }}
                          >
                            <FaFilePdf className="me-2" />
                            View PDF
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Assignment URL */}
                  {previewingContent.url && (
                    <Card className="mb-3">
                      <Card.Header className="bg-secondary text-white">
                        <FaExternalLinkAlt className="me-2" />
                        Assignment Link
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-3">
                            <a href={previewingContent.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {previewingContent.url}
                            </a>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(previewingContent.url, '_blank')}
                          >
                            <FaExternalLinkAlt className="me-2" />
                            Open Link
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Additional Assignment Information */}
                  {(previewingContent.learning_outcomes || previewingContent.key_concepts || previewingContent.reflection_questions) && (
                    <div className="mt-4">
                      {previewingContent.learning_outcomes && (
                        <Card className="mb-3">
                          <Card.Header className="bg-light">
                            <strong>Learning Outcomes</strong>
                          </Card.Header>
                          <Card.Body>
                            <div className="white-space-pre-wrap">{previewingContent.learning_outcomes}</div>
                          </Card.Body>
                        </Card>
                      )}
                      {previewingContent.key_concepts && (
                        <Card className="mb-3">
                          <Card.Header className="bg-light">
                            <strong>Key Concepts</strong>
                          </Card.Header>
                          <Card.Body>
                            <div className="white-space-pre-wrap">{previewingContent.key_concepts}</div>
                          </Card.Body>
                        </Card>
                      )}
                      {previewingContent.reflection_questions && (
                        <Card className="mb-3">
                          <Card.Header className="bg-light">
                            <strong>Reflection Questions</strong>
                          </Card.Header>
                          <Card.Body>
                            <div className="white-space-pre-wrap">{previewingContent.reflection_questions}</div>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  )}

                  {!previewingContent.assignment_details_file_name &&
                    !previewingContent.assignment_rubric_file_name &&
                    !previewingContent.url && (
                      <Alert variant="warning">
                        No assignment materials uploaded yet. Add assignment details PDF, rubric PDF, or an assignment URL.
                      </Alert>
                    )}

                  <div className="d-flex gap-2 justify-content-center mt-4">
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleClosePreviewModal();
                        handleOpenModal(previewingContent);
                      }}
                    >
                      <FaEdit className="me-2" />
                      Edit Assignment
                    </Button>
                  </div>
                </div>
              )}

              {!['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(previewingContent.content_type) &&
                !previewUrl &&
                previewingContent.content_type !== 'QUIZ' &&
                previewingContent.content_type !== 'ASSIGNMENT' && (
                  <div className="text-center py-5">
                    {(
                      <>
                        <Alert variant="warning" className="mb-4">
                          <h5>No URL Available</h5>
                          <p className="mb-0">
                            {previewingContent.content_type === 'VIDEO'
                              ? 'This video content does not have a URL. Please edit the content to add a video URL (YouTube link or direct video URL).'
                              : previewingContent.content_type === 'IMAGE'
                                ? 'This image content does not have a URL. Please edit the content to add an image URL.'
                                : previewingContent.content_type === 'QUIZ'
                                  ? 'This quiz does not have a URL or an in-app quiz. You can either add an external quiz URL (Google Forms, Kahoot, Quizizz, etc.) or create an in-app quiz.'
                                  : previewingContent.content_type === 'ASSIGNMENT'
                                    ? (previewingContent.assignment_details_file_name || previewingContent.assignment_rubric_file_name)
                                      ? 'This assignment does not have a URL, but it has uploaded PDFs (details and/or rubric). You can optionally add an assignment URL (Google Classroom, assignment platform, etc.).'
                                      : 'This assignment does not have a URL. You can optionally add an assignment URL (Google Classroom, assignment platform, etc.) or upload assignment details and rubric PDFs.'
                                    : previewingContent.content_type === 'TEST'
                                      ? 'This test does not have a URL. Please edit the content to add a test URL (test platform, Google Forms, etc.).'
                                      : previewingContent.content_type === 'EXAM'
                                        ? 'This exam does not have a URL. Please edit the content to add an exam URL (exam platform, Google Forms, etc.).'
                                        : previewingContent.content_type === 'PROJECT'
                                          ? 'This project does not have a URL. Please edit the content to add a project URL (project description, submission link, etc.).'
                                          : previewingContent.content_type === 'SURVEY'
                                            ? 'This survey does not have a URL. Please edit the content to add a survey URL (Google Forms, SurveyMonkey, etc.).'
                                            : previewingContent.file_path
                                              ? 'Unable to generate preview URL. The file may not be accessible or you may not have permission to view it.'
                                              : 'This content does not have a URL or file path. Please edit the content to add a URL or upload a file.'}
                          </p>
                        </Alert>
                        <div className="d-flex gap-2 justify-content-center">
                          {previewingContent.content_type === 'QUIZ' && (
                            <Button
                              variant="success"
                              onClick={() => {
                                handleClosePreviewModal();
                                handleOpenQuizBuilder(previewingContent);
                              }}
                            >
                              <FaClipboardCheck className="me-2" />
                              Create In-App Quiz
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            onClick={() => {
                              handleClosePreviewModal();
                              handleOpenModal(previewingContent);
                            }}
                          >
                            <FaEdit className="me-2" />
                            {previewingContent.content_type === 'QUIZ' ? 'Edit Content or Add URL' : 'Edit Content to Add URL'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePreviewModal}>
            Close
          </Button>
          {previewUrl ? (
            <Button
              variant="primary"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <FaExternalLinkAlt className="me-2" />
              Open in New Tab
            </Button>
          ) : previewingContent && (
            <Button
              variant="primary"
              onClick={() => {
                handleClosePreviewModal();
                handleOpenModal(previewingContent);
              }}
            >
              <FaEdit className="me-2" />
              Edit Content
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Quiz Builder Modal */}
      <QuizBuilder
        show={showQuizBuilder}
        onHide={handleCloseQuizBuilder}
        contentId={currentQuizContentId}
        quizId={currentQuizId}
        onSave={handleQuizSaved}
      />

      {/* Wizard Modal */}
      <Modal show={showWizard} onHide={() => setShowWizard(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2 text-primary" />
            Content Wizard
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">
            Select a template to quickly structure your lesson content. You can customize the content after selecting a template.
          </p>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm hover-card" onClick={() => handleApplyTemplate('standard')} style={{ cursor: 'pointer' }}>
                <Card.Body className="text-center p-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <FaBook className="text-primary" size={32} />
                  </div>
                  <h5>Standard Lesson</h5>
                  <p className="small text-muted mb-0">
                    Classic structure with outcomes, video, key concepts, quiz, and summary.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm hover-card" onClick={() => handleApplyTemplate('interactive')} style={{ cursor: 'pointer' }}>
                <Card.Body className="text-center p-4">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <FaProjectDiagram className="text-success" size={32} />
                  </div>
                  <h5>Interactive</h5>
                  <p className="small text-muted mb-0">
                    Engaging flow with interactive book, flashcards, and gamified quiz.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm hover-card" onClick={() => handleApplyTemplate('video_lecture')} style={{ cursor: 'pointer' }}>
                <Card.Body className="text-center p-4">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <FaVideo className="text-danger" size={32} />
                  </div>
                  <h5>Video Lecture</h5>
                  <p className="small text-muted mb-0">
                    Video-centric lesson with discussion prompts and reflection assignment.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      {/* AI Content Generation Modal */}
      <Modal show={showRubricModal} onHide={() => setShowRubricModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaLightbulb className="me-2" />
            Generated Assignment Rubric
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {generatedRubric ? (
            <>
              <Alert variant="success" className="mb-3">
                <strong>Rubric Generated Successfully!</strong>
                <p className="mb-0 mt-2">Review the rubric below. You can copy it, download it as a text file, or use it to create a PDF.</p>
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>Generated Rubric</Form.Label>
                <div
                  className="rubric-display"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                  dangerouslySetInnerHTML={{ __html: formatRubricForDisplay(generatedRubric) }}
                />
              </Form.Group>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedRubric);
                    setSuccess('Rubric copied to clipboard!');
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                >
                  <FaDownload className="me-2" />
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => {
                    const blob = new Blob([generatedRubric], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${title.trim().replace(/[^a-z0-9]/gi, '_')}_rubric.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setSuccess('Rubric downloaded!');
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                >
                  <FaDownload className="me-2" />
                  Download as Text
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      const rubricText = generatedRubric;
                      const assignmentTitle = title;

                      // Function to generate PDF
                      const generatePDF = () => {
                        try {
                          const rubricHtml = formatRubricForDisplay(rubricText);

                          // Create a temporary container for the PDF content
                          const tempDiv = document.createElement('div');
                          tempDiv.style.position = 'absolute';
                          tempDiv.style.left = '-9999px';
                          tempDiv.style.width = '210mm'; // A4 width
                          tempDiv.style.padding = '20mm';
                          tempDiv.style.fontFamily = 'Arial, sans-serif';
                          tempDiv.style.fontSize = '12pt';
                          tempDiv.style.color = '#212529';
                          tempDiv.style.lineHeight = '1.6';
                          tempDiv.style.backgroundColor = '#ffffff';

                          tempDiv.innerHTML = `
                            <div style="margin-bottom: 20px;">
                              <h1 style="color: #212529; border-bottom: 3px solid #212529; padding-bottom: 10px; margin-bottom: 20px; font-size: 24pt; margin-top: 0;">
                                Assignment Rubric: ${escapeHtml(assignmentTitle)}
                              </h1>
                            </div>
                            <div style="margin-top: 20px;">
                              ${rubricHtml}
                            </div>
                          `;

                          // Add styles for tables - more specific and robust
                          const style = document.createElement('style');
                          style.textContent = `
                            * {
                              box-sizing: border-box !important;
                            }
                            table {
                              border-collapse: collapse !important;
                              width: 100% !important;
                              margin: 1rem 0 !important;
                              page-break-inside: avoid !important;
                              border: 2px solid #212529 !important;
                              table-layout: fixed !important;
                              word-wrap: break-word !important;
                            }
                            thead {
                              display: table-header-group !important;
                            }
                            tbody {
                              display: table-row-group !important;
                            }
                            tr {
                              display: table-row !important;
                              page-break-inside: avoid !important;
                            }
                            th {
                              border: 2px solid #212529 !important;
                              padding: 0.75rem !important;
                              background-color: #f8f9fa !important;
                              font-weight: 600 !important;
                              text-align: left !important;
                              font-size: 11pt !important;
                              display: table-cell !important;
                              vertical-align: top !important;
                              word-wrap: break-word !important;
                              overflow-wrap: break-word !important;
                            }
                            td {
                              border: 1px solid #212529 !important;
                              padding: 0.75rem !important;
                              font-size: 10pt !important;
                              display: table-cell !important;
                              vertical-align: top !important;
                              word-wrap: break-word !important;
                              overflow-wrap: break-word !important;
                            }
                            p {
                              margin: 0.5rem 0 !important;
                              line-height: 1.6 !important;
                            }
                          `;
                          tempDiv.appendChild(style);

                          document.body.appendChild(tempDiv);

                          // Configure html2pdf options
                          const opt = {
                            margin: [10, 10, 10, 10],
                            filename: `${assignmentTitle.trim().replace(/[^a-z0-9]/gi, '_')}_rubric.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: {
                              scale: 2,
                              useCORS: true,
                              logging: false,
                              letterRendering: true,
                              backgroundColor: '#ffffff'
                            },
                            jsPDF: {
                              unit: 'mm',
                              format: 'a4',
                              orientation: 'portrait'
                            },
                            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                          };

                          // Generate and download PDF
                          html2pdf()
                            .set(opt)
                            .from(tempDiv)
                            .save()
                            .then(() => {
                              document.body.removeChild(tempDiv);
                              setSuccess('PDF downloaded successfully!');
                              setTimeout(() => setSuccess(null), 3000);
                            })
                            .catch((err) => {
                              console.error('Error generating PDF:', err);
                              if (document.body.contains(tempDiv)) {
                                document.body.removeChild(tempDiv);
                              }
                              setError('Failed to generate PDF. Please try again.');
                            });
                        } catch (err) {
                          console.error('Error in PDF generation:', err);
                          setError('Failed to generate PDF. Please try again.');
                        }
                      };

                      // Generate PDF using imported library
                      generatePDF();
                    } catch (err) {
                      console.error('Error setting up PDF generation:', err);
                      setError('Failed to generate PDF. Please try again.');
                    }
                  }}
                >
                  <FaFilePdf className="me-2" />
                  Download as PDF
                </Button>
                {contentType === 'ASSIGNMENT' && (
                  <Button
                    variant="success"
                    onClick={async () => {
                      if (!title || !title.trim()) {
                        setError('Please enter an assignment title first');
                        return;
                      }

                      if (!generatedRubric) {
                        setError('No rubric generated. Please generate a rubric first.');
                        return;
                      }

                      try {
                        setGeneratingRubric(true);
                        setError(null);

                        const rubricText = generatedRubric;
                        const assignmentTitle = title;

                        // Helper function to generate PDF blob
                        const generatePDFBlob = () => {
                          return new Promise((resolve, reject) => {
                            try {
                              const rubricHtml = formatRubricForDisplay(rubricText);

                              // Create a temporary container for the PDF content
                              const tempDiv = document.createElement('div');
                              tempDiv.style.position = 'absolute';
                              tempDiv.style.left = '-9999px';
                              tempDiv.style.width = '210mm'; // A4 width
                              tempDiv.style.padding = '20mm';
                              tempDiv.style.fontFamily = 'Arial, sans-serif';
                              tempDiv.style.fontSize = '12pt';
                              tempDiv.style.color = '#212529';
                              tempDiv.style.lineHeight = '1.6';
                              tempDiv.style.backgroundColor = '#ffffff';

                              tempDiv.innerHTML = `
                                <div style="margin-bottom: 20px;">
                                  <h1 style="color: #212529; border-bottom: 3px solid #212529; padding-bottom: 10px; margin-bottom: 20px; font-size: 24pt; margin-top: 0;">
                                    Assignment Rubric: ${escapeHtml(assignmentTitle)}
                                  </h1>
                                </div>
                                <div style="margin-top: 20px;">
                                  ${rubricHtml}
                                </div>
                              `;

                              // Add styles for tables - more specific and robust
                              const style = document.createElement('style');
                              style.textContent = `
                                * {
                                  box-sizing: border-box !important;
                                }
                                table {
                                  border-collapse: collapse !important;
                                  width: 100% !important;
                                  margin: 1rem 0 !important;
                                  page-break-inside: avoid !important;
                                  border: 2px solid #212529 !important;
                                  table-layout: fixed !important;
                                  word-wrap: break-word !important;
                                }
                                thead {
                                  display: table-header-group !important;
                                }
                                tbody {
                                  display: table-row-group !important;
                                }
                                tr {
                                  display: table-row !important;
                                  page-break-inside: avoid !important;
                                }
                                th {
                                  border: 2px solid #212529 !important;
                                  padding: 0.75rem !important;
                                  background-color: #f8f9fa !important;
                                  font-weight: 600 !important;
                                  text-align: left !important;
                                  font-size: 11pt !important;
                                  display: table-cell !important;
                                  vertical-align: top !important;
                                  word-wrap: break-word !important;
                                  overflow-wrap: break-word !important;
                                }
                                td {
                                  border: 1px solid #212529 !important;
                                  padding: 0.75rem !important;
                                  font-size: 10pt !important;
                                  display: table-cell !important;
                                  vertical-align: top !important;
                                  word-wrap: break-word !important;
                                  overflow-wrap: break-word !important;
                                }
                                p {
                                  margin: 0.5rem 0 !important;
                                  line-height: 1.6 !important;
                                }
                              `;
                              tempDiv.appendChild(style);

                              document.body.appendChild(tempDiv);

                              // Configure html2pdf options
                              const opt = {
                                margin: [10, 10, 10, 10],
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: {
                                  scale: 2,
                                  useCORS: true,
                                  logging: false,
                                  letterRendering: true,
                                  backgroundColor: '#ffffff'
                                },
                                jsPDF: {
                                  unit: 'mm',
                                  format: 'a4',
                                  orientation: 'portrait'
                                },
                                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                              };

                              // Generate PDF blob
                              html2pdf()
                                .set(opt)
                                .from(tempDiv)
                                .outputPdf()
                                .then((pdf) => {
                                  // Get blob from jsPDF instance
                                  const pdfBlob = pdf.output('blob');
                                  document.body.removeChild(tempDiv);
                                  resolve(pdfBlob);
                                })
                                .catch((err) => {
                                  console.error('Error generating PDF:', err);
                                  if (document.body.contains(tempDiv)) {
                                    document.body.removeChild(tempDiv);
                                  }
                                  reject(err);
                                });
                            } catch (err) {
                              console.error('Error in PDF generation:', err);
                              reject(err);
                            }
                          });
                        };

                        // Generate PDF blob using imported library
                        const pdfBlob = await generatePDFBlob();

                        // Create a File object from the PDF blob
                        const fileName = `${title.trim().replace(/[^a-z0-9]/gi, '_')}_rubric_${Date.now()}.pdf`;
                        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

                        // Upload to Supabase Storage
                        const bucketName = 'course-content';
                        const timestamp = Date.now();
                        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                        const filePath = `assignments/${lessonId}/rubric/${timestamp}-${sanitizedFileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from(bucketName)
                          .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false
                          });

                        if (uploadError) {
                          console.error('Upload error:', uploadError);
                          if (uploadError.message && uploadError.message.includes('Bucket not found')) {
                            throw new Error(`Storage bucket '${bucketName}' not found. Please create the bucket in Supabase Storage: Settings → Storage → Create Bucket. Bucket name: 'course-content'`);
                          }
                          throw new Error(uploadError.message || 'Failed to upload rubric file');
                        }

                        // Update the assignment content with the rubric file
                        if (editingContent) {
                          // Update existing assignment immediately
                          const { error: updateError } = await supabase
                            .from('lesson_content')
                            .update({
                              assignment_rubric_file_path: filePath,
                              assignment_rubric_file_name: file.name,
                              assignment_rubric_file_size: file.size,
                              assignment_rubric_mime_type: file.type
                            })
                            .eq('content_id', editingContent.content_id);

                          if (updateError) {
                            console.error('Update error:', updateError);
                            throw new Error(updateError.message || 'Failed to update assignment with rubric');
                          }

                          setSuccess('Rubric uploaded successfully and attached to the assignment!');
                          setGeneratingRubric(false); // Reset before closing modal

                          // Refresh the content to get updated assignment data
                          await fetchContent();

                          // Fetch the updated assignment content directly from the database
                          if (editingContent) {
                            const { data: updatedContentData, error: fetchError } = await supabase
                              .from('lesson_content')
                              .select('*')
                              .eq('content_id', editingContent.content_id)
                              .single();

                            if (!fetchError && updatedContentData) {
                              setEditingContent(updatedContentData);
                            }
                          }

                          setTimeout(() => {
                            setShowRubricModal(false);
                            setSuccess(null);
                          }, 2000);
                        } else {
                          // If creating new assignment, store the uploaded file info
                          // so it can be used when the form is submitted
                          setUploadedRubricFileInfo({
                            file_path: filePath,
                            file_name: file.name,
                            file_size: file.size,
                            mime_type: file.type
                          });

                          setSuccess('Rubric uploaded successfully! It will be attached when you save the assignment.');
                          setGeneratingRubric(false); // Reset before closing modal

                          setTimeout(() => {
                            setShowRubricModal(false);
                            setSuccess(null);
                          }, 2000);
                        }
                      } catch (err) {
                        console.error('Error uploading rubric:', err);
                        setError(err.message || 'Failed to upload rubric. Please try again.');
                        setGeneratingRubric(false); // Always reset on error
                      }
                    }}
                    disabled={generatingRubric || !title || !title.trim() || !generatedRubric}
                  >
                    {generatingRubric ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaFilePdf className="me-2" />
                        Add to Assignment
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Alert variant="warning">
              No rubric generated. Please try again.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRubricModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* AI Generated Content Preview Modal */}
      <Modal
        show={showAIContentModal}
        onHide={handleCloseAIContentModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            AI Generated Content Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {generatedContentItems.length > 0 ? (
            <>
              <Alert variant="info" className="mb-3">
                <strong>{generatedContentItems.length} content item{generatedContentItems.length !== 1 ? 's' : ''}</strong> generated.
                Review the content below and click "Save All" to add them to your lesson.
              </Alert>
              <ListGroup variant="flush">
                {generatedContentItems.map((item, index) => (
                  <ListGroup.Item key={index} className="mb-3 border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">
                          <Badge
                            bg={
                              item.content_type === 'VIDEO' ? 'danger' :
                                item.content_type === 'QUIZ' ? 'warning' :
                                  item.content_type === 'ASSIGNMENT' ? 'success' :
                                    'primary'
                            }
                            className="me-2"
                          >
                            {item.content_type}
                          </Badge>
                          {item.title}
                        </h6>
                        <small className="text-muted">
                          Section: {item.content_section} |
                          Sequence: {item.sequence_order} |
                          {item.is_required ? 'Required' : 'Optional'}
                          {item.estimated_minutes && ` | ~${item.estimated_minutes} min`}
                        </small>
                      </div>
                    </div>

                    {/* Video Content */}
                    {item.content_type === 'VIDEO' && item.url && (
                      <div className="mt-2">
                        <Alert variant="info" className="mb-2">
                          <strong>Video URL:</strong> <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                        </Alert>
                        {item.description && (
                          <div className="text-muted small">{item.description}</div>
                        )}
                      </div>
                    )}

                    {/* Quiz Content */}
                    {item.content_type === 'QUIZ' && item.quiz_questions && (
                      <div className="mt-2">
                        <Alert variant="warning" className="mb-2">
                          <strong>{item.quiz_questions.length} question{item.quiz_questions.length !== 1 ? 's' : ''}</strong> will be created
                        </Alert>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {item.quiz_questions.slice(0, 3).map((q, qIdx) => (
                            <div key={qIdx} className="mb-2 p-2 bg-light rounded">
                              <small><strong>Q{qIdx + 1}:</strong> {q.question_text}</small>
                              {q.options && (
                                <div className="mt-1">
                                  {q.options.slice(0, 2).map((opt, optIdx) => (
                                    <small key={optIdx} className="d-block text-muted">
                                      • {opt.text || opt.option_text || opt}
                                    </small>
                                  ))}
                                  {q.options.length > 2 && (
                                    <small className="text-muted">... and {q.options.length - 2} more</small>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {item.quiz_questions.length > 3 && (
                            <small className="text-muted">... and {item.quiz_questions.length - 3} more questions</small>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Assignment Content */}
                    {item.content_type === 'ASSIGNMENT' && (
                      <div className="mt-2">
                        <Alert variant="success" className="mb-2">
                          <strong>Assignment:</strong> {item.total_points || 100} points
                          {item.rubric_criteria && (
                            <div className="mt-1">
                              <small><strong>Rubric:</strong> {item.rubric_criteria.length} criteria</small>
                            </div>
                          )}
                        </Alert>
                        <div style={{
                          maxHeight: '150px',
                          overflowY: 'auto',
                          padding: '10px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {item.assignment_description || item.content_text}
                        </div>
                        {item.rubric_criteria && item.rubric_criteria.length > 0 && (
                          <div className="mt-2">
                            <small><strong>Rubric Criteria:</strong></small>
                            <ul className="small mb-0">
                              {item.rubric_criteria.slice(0, 3).map((crit, critIdx) => (
                                <li key={critIdx}>
                                  {crit.criterion} ({crit.points} pts): {crit.description}
                                </li>
                              ))}
                              {item.rubric_criteria.length > 3 && (
                                <li className="text-muted">... and {item.rubric_criteria.length - 3} more criteria</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flashcard Content */}
                    {item.content_type === 'FLASHCARD' && item.content_data && (
                      <div className="mt-2">
                        <Alert variant="info" className="mb-2">
                          <strong>Flashcard Set:</strong> {item.content_data?.cards?.length || 0} card{item.content_data?.cards?.length !== 1 ? 's' : ''}
                        </Alert>
                        {item.description && (
                          <div className="text-muted small">{item.description}</div>
                        )}
                      </div>
                    )}

                    {/* Text Content */}
                    {!['VIDEO', 'QUIZ', 'ASSIGNMENT', 'FLASHCARD'].includes(item.content_type) && item.content_text && (
                      <div className="mt-2" style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {item.content_text}
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          ) : (
            <Alert variant="warning">
              No content items generated. Please try again.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseAIContentModal}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSaveAIContent}
            disabled={uploading || generatedContentItems.length === 0}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Save All ({generatedContentItems.length})
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Flashcard Creator Modal */}
      <Modal
        show={showFlashcardCreator}
        onHide={() => {
          setShowFlashcardCreator(false);
          setCurrentFlashcardContentId(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentFlashcardContentId ? 'Edit Flashcard Set' : 'Create Flashcard Set'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <FlashcardCreator
            contentId={currentFlashcardContentId}
            lessonId={parseInt(lessonId)}
            initialTitle={editingContent?.title || title || 'Flashcard Set'}
            initialDescription={editingContent?.description || description || ''}
            initialData={editingContent?.content_data || generatedFlashcardData}
            onSave={(savedContentId) => {
              setShowFlashcardCreator(false);
              setCurrentFlashcardContentId(null);
              setGeneratedFlashcardData(null);
              fetchContent();
              setSuccess('Flashcard set saved successfully!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            onCancel={() => {
              setShowFlashcardCreator(false);
              setCurrentFlashcardContentId(null);
              setGeneratedFlashcardData(null);
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Interactive Video Creator Modal */}
      <Modal
        show={showInteractiveVideoCreator}
        onHide={() => {
          setShowInteractiveVideoCreator(false);
          setCurrentInteractiveVideoContentId(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentInteractiveVideoContentId ? 'Edit Interactive Video' : 'Create Interactive Video'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <InteractiveVideoCreator
            contentId={currentInteractiveVideoContentId}
            lessonId={parseInt(lessonId)}
            initialTitle={editingContent?.title || title || 'Interactive Video'}
            initialDescription={editingContent?.description || description || ''}
            initialData={editingContent?.content_data || generatedInteractiveVideoData}
            onSave={(savedContentId) => {
              setShowInteractiveVideoCreator(false);
              setCurrentInteractiveVideoContentId(null);
              setGeneratedInteractiveVideoData(null);
              fetchContent();
              setSuccess('Interactive video saved successfully!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            onCancel={() => {
              setShowInteractiveVideoCreator(false);
              setCurrentInteractiveVideoContentId(null);
              setGeneratedInteractiveVideoData(null);
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Interactive Book Creator Modal */}
      <Modal
        show={showInteractiveBookCreator}
        onHide={() => {
          setShowInteractiveBookCreator(false);
          setCurrentInteractiveBookContentId(null);
        }}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentInteractiveBookContentId ? 'Edit Interactive Book' : 'Create Interactive Book'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <InteractiveBookCreator
            contentId={currentInteractiveBookContentId}
            lessonId={parseInt(lessonId)}
            initialTitle={editingContent?.title || title || 'Interactive Book'}
            initialDescription={editingContent?.description || description || ''}
            initialData={editingContent?.content_data || generatedInteractiveBookData}
            onSave={(savedContentId) => {
              setShowInteractiveBookCreator(false);
              setCurrentInteractiveBookContentId(null);
              setGeneratedInteractiveBookData(null);
              fetchContent();
              setSuccess('Interactive book saved successfully!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            onCancel={() => {
              setShowInteractiveBookCreator(false);
              setCurrentInteractiveBookContentId(null);
              setGeneratedInteractiveBookData(null);
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Quiz Builder Modal */}
      {showQuizBuilder && (
        <Modal
          show={showQuizBuilder}
          onHide={() => {
            setShowQuizBuilder(false);
            setCurrentQuizContentId(null);
            setCurrentQuizId(null);
          }}
          size="xl"
          fullscreen="lg-down"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {currentQuizId ? 'Edit Quiz' : 'Create Quiz'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0 }}>
            <QuizBuilder
              contentId={currentQuizContentId}
              quizId={currentQuizId}
              lessonId={parseInt(lessonId)}
              onSave={() => {
                setShowQuizBuilder(false);
                setCurrentQuizContentId(null);
                setCurrentQuizId(null);
                fetchContent();
                setSuccess('Quiz saved successfully!');
                setTimeout(() => setSuccess(null), 3000);
              }}
              onCancel={() => {
                setShowQuizBuilder(false);
                setCurrentQuizContentId(null);
                setCurrentQuizId(null);
              }}
            />
          </Modal.Body>
        </Modal>
      )}

      {/* ========== UNIFIED AI ASSISTANT MODAL ========== */}
      <Modal
        show={showAIAssistant}
        onHide={() => {
          setShowAIAssistant(false);
          setGeneratedQuiz(null);
          setQuizParams({ numQuestions: 5, bloomLevel: 'mixed' });
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
        }}
        size="xl"
        centered
        className="ai-assistant-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaRobot className="me-2" />
            AI Content Assistant
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {lessonData && (
            <Alert variant="light" className="lesson-context-alert mb-3">
              <strong>Lesson Context</strong>
              <div className="context-details mt-2">
                <span><strong>Subject:</strong> {lessonData.class_subject?.subject_offering?.subject?.subject_name || 'N/A'}</span>
                <span><strong>Form:</strong> {lessonData.class_subject?.class?.form?.form_name || 'N/A'}</span>
                <span><strong>Topic:</strong> {lessonData.topic || lessonData.lesson_title || 'N/A'}</span>
              </div>
            </Alert>
          )}

          <Tabs
            activeKey={aiAssistantTab}
            onSelect={(k) => setAiAssistantTab(k)}
            className="ai-assistant-tabs mb-3"
          >
            {/* Quick Generate Tab */}
            <Tab eventKey="quick" title={<><FaRocket className="me-1" /> Quick Generate</>}>
              <div className="tab-content-area p-3">
                <p className="tab-description text-muted mb-4">
                  Instantly generate a complete set of lesson content with one click.
                </p>
                <Row className="g-3">
                  <Col md={6}>
                    <Card 
                      className="quick-option-card h-100 border-0 shadow-sm"
                      onClick={() => {
                        handleGenerateAIContent('complete');
                        setShowAIAssistant(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="text-center p-4">
                        <FaMagic className="option-icon text-primary mb-3" size={32} />
                        <h5>Complete Lesson</h5>
                        <p className="text-muted small mb-0">
                          Generate all content types including outcomes, concepts, activities, and summary
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card 
                      className="quick-option-card h-100 border-0 shadow-sm"
                      onClick={() => {
                        handleGenerateAIContent('student');
                        setShowAIAssistant(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="text-center p-4">
                        <FaGraduationCap className="option-icon text-success mb-3" size={32} />
                        <h5>Student Materials</h5>
                        <p className="text-muted small mb-0">
                          Generate student-facing content: key concepts, activities, and reflection questions
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Custom Generator Tab */}
            <Tab eventKey="custom" title={<><FaBrain className="me-1" /> Custom Generator</>}>
              <div className="tab-content-area p-3">
                <p className="tab-description text-muted mb-4">
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

                <Row className="g-4">
                  <Col md={6}>
                    <div className="type-category">
                      <h6 className="text-uppercase text-muted small mb-3">Learning Content</h6>
                      {['LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'LEARNING_ACTIVITIES', 'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].map((type) => (
                        <div key={type} className="type-option mb-2">
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
                              className="quantity-input mt-2"
                              placeholder="Quantity"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <div className="type-category">
                      <h6 className="text-uppercase text-muted small mb-3">Assessments</h6>
                      <div className="type-option mb-2">
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
                            className="quantity-input mt-2"
                            placeholder="Questions"
                          />
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleMasterAIGeneration();
                      setShowAIAssistant(false);
                    }}
                    disabled={isGeneratingContent || Object.values(masterAISelections).every(s => !s.selected)}
                    className="w-100"
                    size="lg"
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
              </div>
            </Tab>

            {/* Quiz Generator Tab */}
            <Tab eventKey="quiz" title={<><FaClipboardCheck className="me-1" /> Quiz Generator</>}>
              <div className="tab-content-area p-3">
                <p className="tab-description text-muted mb-4">
                  Generate an assessment quiz based on the lesson content.
                </p>
                
                {!generatedQuiz ? (
                  <>
                    <Form>
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
                    </Form>

                    <Button
                      variant="success"
                      onClick={() => {
                        handleGenerateQuiz();
                        setShowAIAssistant(false);
                      }}
                      disabled={isGeneratingQuiz}
                      className="w-100"
                      size="lg"
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
                  </>
                ) : (
                  <div>
                    <Alert variant="success" className="mb-3">
                      <strong>Quiz Generated Successfully!</strong>
                      <p className="mb-0 mt-2">
                        Review the {generatedQuiz.quiz_questions.length} questions below.
                      </p>
                    </Alert>

                    <div className="mb-3">
                      <h5>{generatedQuiz.quiz_title}</h5>
                      <p className="text-muted">{generatedQuiz.quiz_description}</p>
                    </div>

                    <ListGroup variant="flush" className="mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {generatedQuiz.quiz_questions.map((q, idx) => (
                        <ListGroup.Item key={idx} className="mb-2 border rounded p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                Question {idx + 1} ({q.question_type.replace('_', ' ')})
                                <Badge bg="info" className="ms-2">{q.points} pts</Badge>
                              </h6>
                              <p className="mb-2">{q.question_text}</p>
                              {q.options && q.options.length > 0 && (
                                <div className="ms-3">
                                  {q.options.map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 mb-1 rounded ${opt.is_correct ? 'bg-success bg-opacity-10 border border-success' : 'bg-light'}`}
                                    >
                                      {opt.is_correct && <FaCheckCircle className="text-success me-2" />}
                                      {opt.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {q.explanation && (
                                <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                                  <small><strong>Explanation:</strong> {q.explanation}</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>

                    <div className="d-flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setGeneratedQuiz(null)}
                        className="flex-fill"
                      >
                        Generate New Quiz
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => {
                          handleSaveGeneratedQuiz();
                          setShowAIAssistant(false);
                        }}
                        disabled={uploading}
                        className="flex-fill"
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
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            {/* Templates Tab */}
            <Tab eventKey="templates" title={<><FaLayerGroup className="me-1" /> Templates</>}>
              <div className="tab-content-area p-3">
                <p className="tab-description text-muted mb-4">
                  Start with a pre-built lesson structure template.
                </p>
                
                <Row className="g-3">
                  <Col md={4}>
                    <Card 
                      className="template-card h-100 border-0 shadow-sm"
                      onClick={() => {
                        handleApplyTemplate('standard');
                        setShowAIAssistant(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="p-4">
                        <h5>📚 Standard Lesson</h5>
                        <p className="small text-muted mb-2">Outcomes → Video → Concepts → Quiz → Summary</p>
                        <ul className="small mb-0">
                          <li>Learning Outcomes</li>
                          <li>Introduction Video</li>
                          <li>Key Concepts</li>
                          <li>Quiz</li>
                          <li>Summary</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={4}>
                    <Card 
                      className="template-card h-100 border-0 shadow-sm"
                      onClick={() => {
                        handleApplyTemplate('interactive');
                        setShowAIAssistant(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="p-4">
                        <h5>🎮 Interactive Learning</h5>
                        <p className="small text-muted mb-2">Book → Flashcards → Assessment</p>
                        <ul className="small mb-0">
                          <li>Interactive Book</li>
                          <li>Vocabulary Flashcards</li>
                          <li>Final Quiz</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={4}>
                    <Card 
                      className="template-card h-100 border-0 shadow-sm"
                      onClick={() => {
                        handleApplyTemplate('video_lecture');
                        setShowAIAssistant(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="p-4">
                        <h5>🎬 Video Lecture</h5>
                        <p className="small text-muted mb-2">Multi-part video with discussions</p>
                        <ul className="small mb-0">
                          <li>Lecture Part 1</li>
                          <li>Discussion</li>
                          <li>Lecture Part 2</li>
                          <li>Reflection</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>

      {/* Legacy Quiz Generator Modal (kept for backward compatibility) */}
      <Modal
        show={showQuizGenerator && !showAIAssistant}
        onHide={() => {
          setShowQuizGenerator(false);
          setGeneratedQuiz(null);
          setQuizParams({ numQuestions: 5, bloomLevel: 'mixed' });
          setPendingQuizTitle(null);
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            AI Quiz Generator
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {!generatedQuiz ? (
            <>
              <Alert variant="info" className="mb-4">
                <strong>Generate a high-quality quiz</strong> that aligns with your lesson objectives, uses grade-appropriate language, includes meaningful distractors, and incorporates Bloom's Taxonomy levels.
                {pendingQuizTitle && (
                  <div className="mt-2">
                    <strong>Quiz Title:</strong> {pendingQuizTitle}
                  </div>
                )}
              </Alert>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Number of Questions</strong>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="20"
                    value={quizParams.numQuestions}
                    onChange={(e) => setQuizParams({
                      ...quizParams,
                      numQuestions: parseInt(e.target.value) || 5
                    })}
                  />
                  <Form.Text className="text-muted">
                    Choose between 1 and 20 questions (recommended: 5-10)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Bloom's Taxonomy Level</strong>
                  </Form.Label>
                  <Form.Select
                    value={quizParams.bloomLevel}
                    onChange={(e) => setQuizParams({
                      ...quizParams,
                      bloomLevel: e.target.value
                    })}
                  >
                    <option value="mixed">Mixed (Recommended - Questions across all levels)</option>
                    <option value="remember">Remember (Recall facts and basic concepts)</option>
                    <option value="understand">Understand (Explain ideas or concepts)</option>
                    <option value="apply">Apply (Use information in new situations)</option>
                    <option value="analyze">Analyze (Draw connections among ideas)</option>
                    <option value="evaluate">Evaluate (Justify a stand or decision)</option>
                    <option value="create">Create (Produce new or original work)</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select the cognitive level(s) for your quiz questions
                  </Form.Text>
                </Form.Group>

                {lessonData && (
                  <Alert variant="light" className="mb-3">
                    <strong>Lesson Context:</strong>
                    <div className="mt-2">
                      <div><strong>Subject:</strong> {lessonData.class_subject?.subject_offering?.subject?.subject_name || 'N/A'}</div>
                      <div><strong>Form:</strong> {lessonData.class_subject?.class?.form?.form_name || 'N/A'}</div>
                      <div><strong>Topic:</strong> {lessonData.topic || lessonData.lesson_title || 'N/A'}</div>
                      {lessonData.learning_objectives && (
                        <div className="mt-2">
                          <strong>Learning Objectives:</strong>
                          <ul className="mb-0 mt-1">
                            {lessonData.learning_objectives.split(/[,\n]/).map((obj, idx) => (
                              obj.trim() && <li key={idx}>{obj.trim()}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Alert>
                )}
              </Form>
            </>
          ) : (
            <>
              <Alert variant="success" className="mb-3">
                <strong>Quiz Generated Successfully!</strong>
                <p className="mb-0 mt-2">
                  Review the {generatedQuiz.quiz_questions.length} questions below. Each question:
                </p>
                <ul className="mb-0 mt-2">
                  <li>Aligns with your learning objectives</li>
                  <li>Uses grade-appropriate language</li>
                  <li>Includes meaningful distractors</li>
                  <li>Incorporates Bloom's Taxonomy levels</li>
                </ul>
              </Alert>

              <div className="mb-3">
                <h5>{generatedQuiz.quiz_title}</h5>
                <p className="text-muted">{generatedQuiz.quiz_description}</p>
              </div>

              <ListGroup variant="flush" className="mb-3">
                {generatedQuiz.quiz_questions.map((q, idx) => (
                  <ListGroup.Item key={idx} className="mb-3 border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">
                          Question {idx + 1} ({q.question_type.replace('_', ' ')})
                          <Badge bg="info" className="ms-2">{q.points} pts</Badge>
                          {q.bloom_level && (
                            <Badge bg="secondary" className="ms-2">
                              {q.bloom_level.charAt(0).toUpperCase() + q.bloom_level.slice(1)}
                            </Badge>
                          )}
                        </h6>
                        <p className="mb-2">{q.question_text}</p>
                        {q.aligned_objective && (
                          <small className="text-muted d-block mb-2">
                            <strong>Aligned with:</strong> {q.aligned_objective}
                          </small>
                        )}
                        {q.options && q.options.length > 0 && (
                          <div className="ms-3">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`p-2 mb-1 rounded ${opt.is_correct ? 'bg-success bg-opacity-10 border border-success' : 'bg-light'}`}
                              >
                                {opt.is_correct && <FaCheckCircle className="text-success me-2" />}
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.correct_answer && (
                          <div className="ms-3 p-2 bg-success bg-opacity-10 border border-success rounded">
                            <strong>Correct Answer:</strong> {q.correct_answer}
                          </div>
                        )}
                        {q.explanation && (
                          <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                            <small><strong>Explanation:</strong> {q.explanation}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!generatedQuiz ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowQuizGenerator(false);
                  setQuizParams({ numQuestions: 5, bloomLevel: 'mixed' });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz || !lessonData}
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
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setGeneratedQuiz(null);
                  setQuizParams({ numQuestions: 5, bloomLevel: 'mixed' });
                }}
              >
                Generate New Quiz
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
                    <FaSave className="me-2" />
                    Save Quiz to Lesson
                  </>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      </div>
    </div>
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

// Export both named and default for compatibility
export { LessonContentManager };
export default LessonContentManager;
