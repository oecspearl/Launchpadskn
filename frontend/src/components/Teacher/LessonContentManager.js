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
  FaClipboardList, FaTasks, FaFileSignature, FaPoll, FaProjectDiagram
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import { supabase } from '../../config/supabase';
import QuizBuilder from './QuizBuilder';

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
  const [contentSection, setContentSection] = useState('Main Content');
  const [isRequired, setIsRequired] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  useEffect(() => {
    if (lessonId) {
      fetchContent();
    }
  }, [lessonId]);

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
      setContentSection(item.content_section || 'Main Content');
      setIsRequired(item.is_required !== false);
      setEstimatedMinutes(item.estimated_minutes != null ? String(item.estimated_minutes) : '');
      setSelectedFile(null);
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
      setContentSection('Main Content');
      setIsRequired(true);
      setEstimatedMinutes('');
      setSelectedFile(null);
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setUploading(true);
      
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
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
      } else if (contentType === 'FILE' && editingContent) {
        // Keep existing file info if editing and no new file
        fileUrl = editingContent.url;
        filePath = editingContent.file_path;
        fileName = editingContent.file_name;
        fileSize = editingContent.file_size;
        mimeType = editingContent.mime_type;
      }
      
      // Prepare content data
      // Determine the URL: for LINK, VIDEO, IMAGE, DOCUMENT, and all Assessment types use the form URL; for FILE use the uploaded file URL
      // Note: QUIZ can have URL (external) or be created in-app (no URL required)
      const assessmentTypes = ['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'];
      let finalUrl = null;
      if (contentType === 'LINK' || contentType === 'VIDEO' || contentType === 'IMAGE' || contentType === 'DOCUMENT' || assessmentTypes.includes(contentType)) {
        finalUrl = url || null; // Use the URL from the form (optional for QUIZ)
      } else if (contentType === 'FILE') {
        finalUrl = fileUrl; // Use the uploaded file URL
      }
      
      // When updating, preserve existing file info if no new file is uploaded
      if (editingContent && contentType === 'FILE' && !selectedFile) {
        filePath = editingContent.file_path || filePath;
        fileName = editingContent.file_name || fileName;
        fileSize = editingContent.file_size || fileSize;
        mimeType = editingContent.mime_type || mimeType;
        finalUrl = editingContent.url || finalUrl;
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
        content_section: isLearningContent ? 'Main Content' : (contentSection || 'Main Content'),
        is_required: isLearningContent ? true : isRequired,
        estimated_minutes: isLearningContent ? null : (estimatedMinutes ? parseInt(estimatedMinutes) : null),
        sequence_order: sequenceOrder,
        is_published: true,
        uploaded_by: user.user_id || user.userId
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
          updated_at: new Date().toISOString()
        };
        
        // Only include file fields if content type is FILE
        if (contentType === 'FILE') {
          updateData.file_path = updateFields.file_path;
          updateData.file_name = updateFields.file_name;
          updateData.file_size = updateFields.file_size;
          updateData.mime_type = updateFields.mime_type;
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
      fetchContent();
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
      const section = item.content_section || 'Main Content';
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
      
      // For QUIZ content type, check if there's an in-app quiz
      if (item.content_type === 'QUIZ' && !item.url) {
        try {
          const { data: quiz } = await supabase
            .from('quizzes')
            .select('quiz_id, title, is_published, total_points')
            .eq('content_id', item.content_id)
            .single();
          
          if (quiz) {
            // In-app quiz exists - show quiz info instead of URL preview
            setPreviewUrl(null);
            setPreviewingContent({ ...item, hasInAppQuiz: true, quiz });
            setShowPreviewModal(true);
            return;
          }
        } catch (quizError) {
          // No in-app quiz found, continue to check for URL
          console.log('No in-app quiz found, checking for URL');
        }
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
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>Lesson Content Management</h4>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />
              Add Content
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
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
                  setContentType(e.target.value);
                  setSelectedFile(null);
                  setUrl('');
                  setContentText('');
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
                <Form.Label>URL {contentType === 'QUIZ' ? '(Optional - or create quiz in-app)' : '*'}</Form.Label>
                <Form.Control
                  type="url"
                  value={url || ''}
                  onChange={(e) => setUrl(e.target.value || '')}
                  placeholder={
                    contentType === 'QUIZ' ? "External Quiz URL (e.g., Google Forms, Kahoot, Quizizz) - OR create quiz in-app after saving" :
                    contentType === 'ASSIGNMENT' ? "Assignment URL (e.g., Google Classroom, assignment link)" :
                    contentType === 'TEST' ? "Test URL (e.g., test platform link)" :
                    contentType === 'EXAM' ? "Exam URL (e.g., exam platform link)" :
                    contentType === 'PROJECT' ? "Project URL (e.g., project description or submission link)" :
                    contentType === 'SURVEY' ? "Survey URL (e.g., Google Forms, SurveyMonkey)" :
                    "https://..."
                  }
                  required
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
                    Enter the URL to your assignment (Google Classroom, assignment platform, or submission link)
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
                      <Form.Label>Content Section</Form.Label>
                      <Form.Select
                        value={contentSection || 'Main Content'}
                        onChange={(e) => setContentSection(e.target.value || 'Main Content')}
                      >
                        <option value="Introduction">Introduction</option>
                        <option value="Main Content">Main Content</option>
                        <option value="Practice">Practice</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Resources">Resources</option>
                        <option value="Additional Materials">Additional Materials</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Organize content into logical sections
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
                      content_section: contentSection || 'Main Content',
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
              {!['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS', 
                  'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(previewingContent.content_type) && !previewUrl && (
                <div className="text-center py-5">
                  {previewingContent.content_type === 'QUIZ' && previewingContent.hasInAppQuiz ? (
                    <>
                      <Alert variant="success" className="mb-4">
                        <h5>
                          <FaClipboardCheck className="me-2" />
                          In-App Quiz Available
                        </h5>
                        <p className="mb-2">
                          <strong>{previewingContent.quiz.title}</strong>
                        </p>
                        {previewingContent.quiz.total_points && (
                          <p className="mb-0">
                            Total Points: {previewingContent.quiz.total_points}
                          </p>
                        )}
                        <p className="mb-0 mt-2">
                          {previewingContent.quiz.is_published 
                            ? 'This quiz is published and available to students.'
                            : 'This quiz is not yet published.'}
                        </p>
                      </Alert>
                      <div className="d-flex gap-2 justify-content-center">
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
                    </>
                  ) : (
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
                            ? 'This assignment does not have a URL. Please edit the content to add an assignment URL (Google Classroom, assignment platform, etc.).'
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
    </Container>
  );
}

export default LessonContentManager;

