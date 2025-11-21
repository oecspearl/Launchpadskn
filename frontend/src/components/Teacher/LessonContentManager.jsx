import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Modal, ListGroup, Badge
} from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import {
  FaUpload, FaFileAlt, FaLink, FaVideo, FaImage,
  FaTrash, FaEdit, FaPlus, FaDownload, FaExternalLinkAlt, FaBook, FaEye,
  FaArrowUp, FaArrowDown, FaGripVertical, FaClock, FaCheckCircle, FaInfoCircle,
  FaGraduationCap, FaLightbulb, FaQuestionCircle, FaComments, FaClipboardCheck,
  FaClipboardList, FaTasks, FaFileSignature, FaPoll, FaProjectDiagram,
  FaFilePdf, FaMagic
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import QuizBuilder from './QuizBuilder';
import FlashcardCreator from './FlashcardCreator';
import FlashcardViewer from '../Student/FlashcardViewer';
import { generateAssignmentRubric, generateCompleteLessonContent, generateStudentFacingContent } from '../../services/aiLessonService';
import { searchEducationalVideos } from '../../services/youtubeService';
import html2pdf from 'html2pdf.js';

// Ensure html2pdf is available globally for compatibility
if (typeof window !== 'undefined' && !window.html2pdf) {
  window.html2pdf = html2pdf;
}

function LessonContentManager() {
  const { lessonId } = useParams();
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

  useEffect(() => {
    if (lessonId) {
      fetchContent();
      fetchLessonData();
    }
  }, [lessonId]);

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

  // AI Content Generation Functions
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
      if (contentType === 'LINK' || contentType === 'VIDEO' || contentType === 'IMAGE' || contentType === 'DOCUMENT' || assessmentTypes.includes(contentType)) {
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
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      // Get content to check if we need to delete file from storage
      const contentItem = content.find(c => c.content_id === contentId);

      // Delete from database
      const { error } = await supabase
        .from('lesson_content')
        .delete()
        .eq('content_id', contentId);

      if (error) throw error;

      // Delete file from storage if it exists
      if (contentItem?.file_path) {
        try {
          await supabase.storage
            .from('course-content')
            .remove([contentItem.file_path]);
        } catch (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }

      setSuccess('Content deleted successfully');
      fetchContent();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    }
  };

  const handleMoveUp = async (contentId) => {
    const currentIndex = content.findIndex(c => c.content_id === contentId);
    if (currentIndex <= 0) return;

    const currentItem = content[currentIndex];
    const previousItem = content[currentIndex - 1];

    try {
      // Swap sequence orders
      const { error: error1 } = await supabase
        .from('lesson_content')
        .update({ sequence_order: previousItem.sequence_order || currentIndex })
        .eq('content_id', currentItem.content_id);

      const { error: error2 } = await supabase
        .from('lesson_content')
        .update({ sequence_order: currentItem.sequence_order || currentIndex + 1 })
        .eq('content_id', previousItem.content_id);

      if (error1 || error2) throw error1 || error2;

      fetchContent();
    } catch (err) {
      console.error('Error moving content:', err);
      setError('Failed to reorder content');
    }
  };

  const handleMoveDown = async (contentId) => {
    const currentIndex = content.findIndex(c => c.content_id === contentId);
    if (currentIndex >= content.length - 1) return;

    const currentItem = content[currentIndex];
    const nextItem = content[currentIndex + 1];

    try {
      // Swap sequence orders
      const { error: error1 } = await supabase
        .from('lesson_content')
        .update({ sequence_order: nextItem.sequence_order || currentIndex + 2 })
        .eq('content_id', currentItem.content_id);

      const { error: error2 } = await supabase
        .from('lesson_content')
        .update({ sequence_order: currentItem.sequence_order || currentIndex + 1 })
        .eq('content_id', nextItem.content_id);

      if (error1 || error2) throw error1 || error2;

      fetchContent();
    } catch (err) {
      console.error('Error moving content:', err);
      setError('Failed to reorder content');
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
    <Container className="mt-4">
      <Row className="mb-4 pt-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>Lesson Content Management</h4>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={() => handleGenerateAIContent('complete')}
                disabled={isGeneratingContent || !lessonData}
              >
                {isGeneratingContent ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaMagic className="me-2" />
                    AI Generate Content
                  </>
                )}
              </Button>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                <FaPlus className="me-2" />
                Add Content
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Row className="g-4">
        {/* Left Column - Lesson Plan */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '80px', zIndex: 10 }}>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaBook className="me-2" />
                Lesson Plan
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {lessonData?.lesson_plan ? (
                <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                  {lessonData.lesson_plan}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No lesson plan available</p>
                  <small className="text-muted">
                    Lesson plans can be added in the Lesson Planning section
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Lesson Content */}
        <Col lg={8}>
          {content.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <p className="text-muted mb-0">No content added yet</p>
                <Button variant="primary" className="mt-3" onClick={() => handleOpenModal()}>
                  Add First Content
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              {Object.entries(groupContentBySection()).map(([sectionName, sectionContent]) => (
                <Card key={sectionName} className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light border-0 py-3">
                    <h5 className="mb-0">
                      <FaBook className="me-2" />
                      {sectionName} ({sectionContent.length})
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      {sectionContent.map((item, index) => {
                        const isVideo = item.content_type === 'VIDEO' ||
                          (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')));
                        const isImage = item.content_type === 'IMAGE' ||
                          (item.mime_type && item.mime_type.startsWith('image/'));

                        return (
                          <Col md={12} key={item.content_id}>
                            <Card className="h-100 border mb-3">
                              <Card.Body>
                                <div className="d-flex align-items-start">
                                  {/* Sequence Number and Reorder Controls */}
                                  <div className="d-flex flex-column align-items-center me-3" style={{ minWidth: '60px' }}>
                                    <Badge bg="primary" className="mb-2" style={{ fontSize: '1rem', padding: '0.5rem' }}>
                                      {item.sequence_order || index + 1}
                                    </Badge>
                                    <div className="d-flex flex-column gap-1">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleMoveUp(item.content_id)}
                                        disabled={index === 0}
                                        style={{ padding: '0.25rem 0.5rem' }}
                                      >
                                        <FaArrowUp />
                                      </Button>
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleMoveDown(item.content_id)}
                                        disabled={index === sectionContent.length - 1}
                                        style={{ padding: '0.25rem 0.5rem' }}
                                      >
                                        <FaArrowDown />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Content Details */}
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div className="flex-grow-1">
                                        <div className="d-flex align-items-center mb-2 flex-wrap">
                                          {getContentIcon(item.content_type)}
                                          <h6 className="mb-0 me-2">{item.title}</h6>
                                          <Badge bg="secondary" className="me-2">{item.content_type}</Badge>
                                          {item.is_required === false ? (
                                            <Badge bg="info" className="me-2">Optional</Badge>
                                          ) : (
                                            <Badge bg="success" className="me-2">
                                              <FaCheckCircle className="me-1" />
                                              Required
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Description */}
                                        {item.description && (
                                          <p className="text-muted mb-2">{item.description}</p>
                                        )}

                                        {/* Instructions */}
                                        {item.instructions && (
                                          <div className="alert alert-info py-2 px-3 mb-2" style={{ fontSize: '0.9rem' }}>
                                            <FaInfoCircle className="me-2" />
                                            <strong>Instructions:</strong> {item.instructions}
                                          </div>
                                        )}

                                        {/* Content Text for Text-Only Content Types */}
                                        {['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                                          'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(item.content_type) && (
                                            <div className="mb-3 p-3 bg-light rounded border">
                                              <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                                {item.content_type === 'LEARNING_OUTCOMES' && item.learning_outcomes}
                                                {item.content_type === 'LEARNING_ACTIVITIES' && item.learning_activities}
                                                {item.content_type === 'KEY_CONCEPTS' && item.key_concepts}
                                                {item.content_type === 'REFLECTION_QUESTIONS' && item.reflection_questions}
                                                {item.content_type === 'DISCUSSION_PROMPTS' && item.discussion_prompts}
                                                {item.content_type === 'SUMMARY' && item.summary}
                                              </div>
                                            </div>
                                          )}

                                        {/* Learning Outcomes (for non-text-only content types) */}
                                        {!['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                                          'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(item.content_type) &&
                                          item.learning_outcomes && (
                                            <div className="mb-3">
                                              <h6 className="text-primary mb-2">
                                                <FaCheckCircle className="me-2" />
                                                Learning Outcomes
                                              </h6>
                                              <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem' }}>
                                                {item.learning_outcomes}
                                              </div>
                                            </div>
                                          )}

                                        {/* Learning Activities */}
                                        {item.learning_activities && (
                                          <div className="mb-3">
                                            <h6 className="text-success mb-2">
                                              <FaBook className="me-2" />
                                              Learning Activities
                                            </h6>
                                            <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem' }}>
                                              {item.learning_activities}
                                            </div>
                                          </div>
                                        )}

                                        {/* Key Concepts */}
                                        {item.key_concepts && (
                                          <div className="mb-3">
                                            <h6 className="text-warning mb-2">
                                              <FaBook className="me-2" />
                                              Key Concepts
                                            </h6>
                                            <div className="white-space-pre-wrap" style={{ fontSize: '0.95rem' }}>
                                              {item.key_concepts}
                                            </div>
                                          </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="d-flex gap-3 mb-2 flex-wrap">
                                          {item.estimated_minutes && (
                                            <small className="text-muted">
                                              <FaClock className="me-1" />
                                              {item.estimated_minutes} min
                                            </small>
                                          )}
                                          {item.file_name && (
                                            <small className="text-muted">
                                              {item.file_name}
                                              {item.file_size && ` (${formatFileSize(item.file_size)})`}
                                            </small>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Embedded Content Preview */}
                                    {isVideo && item.url && (
                                      <div className="mb-3">
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
                                          <video
                                            controls
                                            className="w-100"
                                            style={{ maxHeight: '300px', cursor: 'pointer' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(item.url, '_blank');
                                            }}
                                          >
                                            <source src={item.url} type={item.mime_type || 'video/mp4'} />
                                            Your browser does not support the video tag.
                                          </video>
                                        )}
                                      </div>
                                    )}

                                    {isImage && (item.url || item.file_path) && (
                                      <div className="mb-3">
                                        <a
                                          href={item.url || signedUrls[item.content_id] || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={async (e) => {
                                            if (item.file_path && !item.url && !signedUrls[item.content_id]) {
                                              e.preventDefault();
                                              const url = await getContentUrl(item);
                                              if (url) {
                                                window.open(url, '_blank');
                                              }
                                            }
                                          }}
                                          style={{ display: 'block', cursor: 'pointer' }}
                                        >
                                          <img
                                            key={`img-${item.content_id}-${signedUrls[item.content_id] ? 'loaded' : 'pending'}`}
                                            src={item.url || signedUrls[item.content_id] || ''}
                                            alt={item.title}
                                            className="img-fluid rounded"
                                            style={{ maxHeight: '200px', width: 'auto', pointerEvents: 'none' }}
                                            onError={async (e) => {
                                              // If image fails to load, try to get signed URL
                                              if (item.file_path && !signedUrls[item.content_id]) {
                                                const url = await getContentUrl(item);
                                                if (url) {
                                                  e.target.src = url;
                                                }
                                              }
                                            }}
                                          />
                                        </a>
                                      </div>
                                    )}

                                    {/* URL Display for non-media content */}
                                    {!isVideo && !isImage && (item.url || item.file_path) && (
                                      <div className="mb-3">
                                        <small className="text-muted d-block">
                                          <a
                                            href={item.url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-decoration-none"
                                            onClick={async (e) => {
                                              if (item.file_path && !item.url) {
                                                e.preventDefault();
                                                const url = await getContentUrl(item);
                                                if (url) {
                                                  window.open(url, '_blank');
                                                }
                                              }
                                            }}
                                          >
                                            {item.url ? (
                                              item.url.length > 60 ? item.url.substring(0, 60) + '...' : item.url
                                            ) : (
                                              item.file_name || 'Click to open file'
                                            )}
                                          </a>
                                        </small>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2 flex-wrap">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handlePreview(item)}
                                        className="d-flex align-items-center"
                                      >
                                        <FaEye className="me-2" />
                                        Preview
                                      </Button>
                                      {(item.url || item.file_path) && (
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={async () => {
                                            const url = await getContentUrl(item);
                                            if (url) {
                                              window.open(url, '_blank');
                                            } else {
                                              alert('Unable to open content. Please try again.');
                                            }
                                          }}
                                          className="d-flex align-items-center"
                                        >
                                          {isVideo ? (
                                            <>
                                              <FaExternalLinkAlt className="me-2" />
                                              Open Video
                                            </>
                                          ) : isImage ? (
                                            <>
                                              <FaExternalLinkAlt className="me-2" />
                                              Open Image
                                            </>
                                          ) : (
                                            <>
                                              <FaDownload className="me-2" />
                                              Download
                                            </>
                                          )}
                                        </Button>
                                      )}
                                      {item.content_type === 'QUIZ' && (
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          className="me-2"
                                          onClick={() => handleOpenQuizBuilder(item)}
                                        >
                                          <FaClipboardCheck className="me-1" />
                                          Create/Edit Quiz
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleOpenModal(item)}
                                      >
                                        <FaEdit className="me-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDelete(item.content_id)}
                                      >
                                        <FaTrash />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </>
          )}
        </Col>
      </Row>

      {/* Add/Edit Content Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContent ? 'Edit Content' : 'Add Content'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Form.Group className="mb-3">
              <Form.Label>Content Type *</Form.Label>
              <Form.Select
                value={contentType}
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
                <Form.Label>Content *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={contentText || ''}
                  onChange={(e) => setContentText(e.target.value || '')}
                  placeholder={`Enter ${contentType.replace('_', ' ').toLowerCase()}...`}
                  required
                />
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
                <Form.Label>URL {
                  contentType === 'QUIZ' ? '(Optional - or create quiz in-app)' :
                    contentType === 'ASSIGNMENT' ? '(Optional)' :
                      '*'
                }</Form.Label>
                <Form.Control
                  type="url"
                  value={url || ''}
                  onChange={(e) => setUrl(e.target.value || '')}
                  placeholder={
                    contentType === 'QUIZ' ? "External Quiz URL (e.g., Google Forms, Kahoot, Quizizz) - OR create quiz in-app after saving" :
                      contentType === 'ASSIGNMENT' ? "Assignment URL (e.g., Google Classroom, assignment link) - Optional" :
                        contentType === 'TEST' ? "Test URL (e.g., test platform link)" :
                          contentType === 'EXAM' ? "Exam URL (e.g., exam platform link)" :
                            contentType === 'PROJECT' ? "Project URL (e.g., project description or submission link)" :
                              contentType === 'SURVEY' ? "Survey URL (e.g., Google Forms, SurveyMonkey)" :
                                "https://..."
                  }
                  required={contentType !== 'QUIZ' && contentType !== 'ASSIGNMENT'}
                />
                {contentType === 'QUIZ' && (
                  <>
                    <Form.Text className="text-muted">
                      You can either enter an external quiz URL (Google Forms, Kahoot, Quizizz) OR create an in-app quiz.
                    </Form.Text>
                    <Alert variant="info" className="mt-2 mb-0">
                      <FaClipboardCheck className="me-2" />
                      <strong>Create In-App Quiz:</strong> Click the "Save & Create Quiz" button below to save this content and immediately open the quiz builder.
                    </Alert>
                  </>
                )}
                {contentType === 'ASSIGNMENT' && (
                  <Form.Text className="text-muted">
                    Optionally enter a URL to your assignment (Google Classroom, assignment platform, or submission link). You can also upload assignment details and rubric PDFs below.
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

      {/* Rubric Generation Modal */}
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
            initialTitle={editingContent?.title}
            initialDescription={editingContent?.description}
            initialData={editingContent?.content_data}
            onSave={(savedContentId) => {
              setShowFlashcardCreator(false);
              setCurrentFlashcardContentId(null);
              fetchContent();
              setSuccess('Flashcard set saved successfully!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            onCancel={() => {
              setShowFlashcardCreator(false);
              setCurrentFlashcardContentId(null);
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
    </Container>
  );
}

export default LessonContentManager;

