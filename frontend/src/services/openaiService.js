/**
 * OpenAI Service for Lesson Generation
 * 
 * This service calls the backend API endpoint which handles OpenAI API calls securely.
 * The API key is stored on the backend server.
 */

// Backend API URL - defaults to gateway, can be overridden with environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const LESSON_GENERATION_ENDPOINT = `${API_BASE_URL}/api/lessons/generate`;

/**
 * Generate a lesson plan using the backend OpenAI service
 * 
 * @param {Object} params - Parameters for lesson generation
 * @param {Object} params.curriculumData - Curriculum data from subject_form_offerings
 * @param {string} params.topic - Optional specific topic for the lesson
 * @param {string} params.lessonDate - Date of the lesson
 * @param {number} params.duration - Duration in minutes (optional)
 * @param {Object} params.teacherPreferences - Teacher's preferences and requirements
 * @returns {Promise<Object>} Generated lesson data
 */
const generateLesson = async ({ curriculumData, topic, lessonDate, duration = 45, teacherPreferences = null }) => {
  try {
    // Get auth token - try multiple sources
    let token = localStorage.getItem('token');
    
    // If no token in localStorage, try to get from Supabase session
    if (!token) {
      try {
        const { supabase } = await import('../config/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
          localStorage.setItem('token', token); // Cache it
        }
      } catch (e) {
        console.warn('Could not get Supabase session:', e);
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No authentication token found. Request may fail if authentication is required.');
    }
    
    console.log('Sending lesson generation request to:', LESSON_GENERATION_ENDPOINT);
    
    const requestBody = {
      curriculumData: curriculumData,
      topic: topic || null,
      lessonDate: lessonDate,
      duration: duration,
      teacherPreferences: teacherPreferences || null
    };
    
    const response = await fetch(LESSON_GENERATION_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Response is not JSON, likely an HTML error page
      let errorText = 'Unknown error';
      try {
        const text = await response.text();
        errorText = text.substring(0, 500);
        console.error('Non-JSON response received:', errorText);
      } catch (e) {
        console.error('Could not read error response:', e);
      }
      
      let errorMessage = `Server returned non-JSON response (Status: ${response.status} ${response.statusText}). `;
      if (response.status === 401 || response.status === 403) {
        errorMessage += 'Authentication failed. Please ensure you are logged in and have the correct permissions (INSTRUCTOR, TEACHER, or ADMIN role).';
      } else if (response.status === 404) {
        errorMessage += `Endpoint not found. Please check if the backend service is running at ${LESSON_GENERATION_ENDPOINT}`;
      } else {
        errorMessage += 'Please check if the backend service is running and accessible.';
      }
      throw new Error(errorMessage);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Backend API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the lesson data in the expected format
    return {
      lesson_title: data.lessonTitle || '',
      topic: data.topic || topic || '',
      learning_objectives: data.learningObjectives || '',
      lesson_plan: data.lessonPlan || ''
    };
    
  } catch (error) {
    console.error('Error generating lesson:', error);
    throw error;
  }
};

/**
 * Format curriculum data into a readable context string
 * (Kept for backward compatibility, but formatting is now done on backend)
 */
const formatCurriculumContext = (curriculumData) => {
  if (!curriculumData) return '';

  let context = '';

  // Add subject and form information
  if (curriculumData.subject) {
    context += `Subject: ${curriculumData.subject.subject_name || ''}\n`;
    if (curriculumData.subject.description) {
      context += `Subject Description: ${curriculumData.subject.description}\n`;
    }
  }

  if (curriculumData.form) {
    context += `Form/Grade Level: ${curriculumData.form.form_name || ''}\n`;
  }

  // Add basic curriculum fields
  if (curriculumData.curriculum_framework) {
    context += `\nCurriculum Framework:\n${curriculumData.curriculum_framework}\n`;
  }

  if (curriculumData.learning_outcomes) {
    context += `\nLearning Outcomes:\n${curriculumData.learning_outcomes}\n`;
  }

  // Add structured curriculum if available
  if (curriculumData.curriculum_structure) {
    const structure = curriculumData.curriculum_structure;
    
    if (structure.frontMatter?.introduction) {
      context += `\nCurriculum Introduction:\n${structure.frontMatter.introduction}\n`;
    }

    if (structure.topics && Array.isArray(structure.topics)) {
      context += `\nCurriculum Topics:\n`;
      structure.topics.forEach((topic, index) => {
        context += `\nTopic ${topic.topicNumber || index + 1}: ${topic.title || 'Untitled Topic'}\n`;
        
        if (topic.overview) {
          if (topic.overview.strandIdentification) {
            context += `  Strand: ${topic.overview.strandIdentification}\n`;
          }
          if (topic.overview.essentialLearningOutcomes && Array.isArray(topic.overview.essentialLearningOutcomes)) {
            context += `  Essential Learning Outcomes:\n`;
            topic.overview.essentialLearningOutcomes.forEach(outcome => {
              context += `    - ${outcome}\n`;
            });
          }
        }

        if (topic.instructionalUnits && Array.isArray(topic.instructionalUnits)) {
          context += `  Instructional Units:\n`;
          topic.instructionalUnits.forEach((unit, unitIndex) => {
            context += `    Unit ${unit.unitNumber || unitIndex + 1}:\n`;
            if (unit.specificCurriculumOutcomes) {
              context += `      Specific Curriculum Outcome: ${unit.specificCurriculumOutcomes}\n`;
            }
            if (unit.inclusiveAssessmentStrategies) {
              context += `      Assessment Strategy: ${unit.inclusiveAssessmentStrategies}\n`;
            }
            if (unit.inclusiveLearningStrategies) {
              context += `      Learning Strategy: ${unit.inclusiveLearningStrategies}\n`;
            }
          });
        }
      });
    }
  }

  return context;
};


const openaiService = {
  generateLesson,
  formatCurriculumContext
};

export default openaiService;

