/**
 * AI Lesson Planner Service
 * Handles API calls to generate AI-powered lesson plans
 */

import { findBestVideoForLesson, searchEducationalVideos, getVideoDetails } from './youtubeService';
import { detectVideoType, extractYouTubeVideoId } from '../types/contentTypes';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Debug: Log API key status (without exposing the key)
console.log('[AI Service] API Key configured:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'No');
console.log('[AI Service] API Key starts with:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'N/A');

/**
 * Generate a lesson plan using AI
 * @param {Object} params - Lesson planning parameters
 * @param {string} params.subject - Subject name
 * @param {string} params.topic - Lesson topic
 * @param {string} params.gradeLevel - Grade level or form
 * @param {number} params.duration - Lesson duration in minutes
 * @param {string} params.previousTopics - Previous topics covered (optional)
 * @param {string} params.learningStyle - Preferred learning style (optional)
 * @returns {Promise<Object>} Generated lesson plan with title, objectives, plan, and homework
 */
export const generateLessonPlan = async ({
  subject,
  topic,
  gradeLevel,
  duration,
  previousTopics = '',
  learningStyle = ''
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!subject || !topic || !gradeLevel || !duration) {
    throw new Error('Missing required parameters: subject, topic, gradeLevel, and duration are required.');
  }

  const prompt = `You are an expert educational lesson planner. Create a comprehensive lesson plan based on the following information:

Subject: ${subject}
Topic: ${topic}
Grade Level: ${gradeLevel}
Duration: ${duration} minutes
${previousTopics ? `Previous Topics Covered: ${previousTopics}` : ''}
${learningStyle ? `Preferred Learning Style: ${learningStyle}` : ''}

IMPORTANT: You must respond with ONLY valid JSON, no additional text, no markdown formatting, no code blocks. The response must be a single JSON object that can be parsed directly.

Respond with this exact JSON structure:
{
  "lesson_title": "A clear, engaging lesson title",
  "learning_objectives": "List 3-5 specific learning objectives that students should achieve by the end of this lesson. Each objective should be measurable and clear.",
  "lesson_plan": "Provide a detailed step-by-step lesson plan including: 1. Introduction/Warm-up (5-10 minutes), 2. Main Content (with clear explanations and activities), 3. Practice/Application activities, 4. Assessment/Check for understanding, 5. Closure/Summary. Make it appropriate for ${duration} minutes.",
  "homework_description": "Provide a meaningful homework assignment that reinforces the lesson content and extends learning. Include specific instructions."
}

Make the lesson plan engaging, age-appropriate for ${gradeLevel}, and aligned with best educational practices. Ensure activities are practical and can be executed in a classroom setting. Remember: respond with ONLY the JSON object, nothing else.`;

  try {
    console.log('[AI Service] Making API request to OpenAI...');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational lesson planner. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };
    console.log('[AI Service] Request body (excluding API key):', { ...requestBody, messages: requestBody.messages });

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[AI Service] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AI Service] API error response:', errorData);
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('[AI Service] API response received:', data);
    const content = data.choices[0]?.message?.content;
    console.log('[AI Service] Extracted content:', content);
    console.log('[AI Service] Content type:', typeof content);
    console.log('[AI Service] Content length:', content?.length);

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Try to parse JSON from the response
    let lessonPlan;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        lessonPlan = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object directly
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          lessonPlan = JSON.parse(jsonObjectMatch[0]);
        } else {
          lessonPlan = JSON.parse(content);
        }
      }
      console.log('Successfully parsed lesson plan:', lessonPlan);
    } catch (parseError) {
      // If JSON parsing fails, try to extract structured data manually
      console.warn('Failed to parse JSON response, attempting manual extraction:', parseError);
      console.log('Raw content:', content);
      lessonPlan = {
        lesson_title: extractField(content, 'lesson_title') || `${topic} - ${subject}`,
        learning_objectives: extractField(content, 'learning_objectives') || 'Students will learn the key concepts of this topic.',
        lesson_plan: extractField(content, 'lesson_plan') || content,
        homework_description: extractField(content, 'homework_description') || 'Complete practice exercises related to the lesson.'
      };
      console.log('Extracted lesson plan:', lessonPlan);
    }

    // Ensure all required fields exist
    if (!lessonPlan.lesson_title) lessonPlan.lesson_title = `${topic} - ${subject}`;
    if (!lessonPlan.learning_objectives) lessonPlan.learning_objectives = '';
    if (!lessonPlan.lesson_plan) lessonPlan.lesson_plan = '';
    if (!lessonPlan.homework_description) lessonPlan.homework_description = '';

    return lessonPlan;
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    throw error;
  }
};

/**
 * Format structured lesson plan object into readable text
 * @param {Object} planObj - Structured lesson plan object
 * @returns {string} Formatted lesson plan text
 */
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
  if (planObj.lesson_components || planObj.LESSON_COMPONENTS || planObj['3. LESSON COMPONENTS']) {
    const components = planObj.lesson_components || planObj.LESSON_COMPONENTS || planObj['3. LESSON COMPONENTS'];
    formatted += '═══════════════════════════════════════════════════════\n';
    formatted += 'LESSON COMPONENTS\n';
    formatted += '═══════════════════════════════════════════════════════\n';
    if (typeof components === 'string') {
      formatted += components + '\n';
    } else {
      // Handle structured components with enhanced details
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
            if (component.timing) formatted += `  ⏱️ Timing: ${component.timing}\n\n`;
            if (component.description) formatted += `  📝 Description: ${component.description}\n\n`;

            // Enhanced teacher instructions
            if (component.teacher_instructions) {
              formatted += `  👨‍🏫 TEACHER INSTRUCTIONS:\n`;
              formatted += `  ${component.teacher_instructions.split('\n').join('\n  ')}\n\n`;
            }

            // Teacher dialogue/script
            if (component.teacher_dialogue) {
              formatted += `  💬 TEACHER DIALOGUE/SCRIPT:\n`;
              formatted += `  "${component.teacher_dialogue}"\n\n`;
            }

            // Student-level explanation
            if (component.student_explanation) {
              formatted += `  📚 STUDENT-LEVEL EXPLANATION:\n`;
              formatted += `  ${component.student_explanation.split('\n').join('\n  ')}\n\n`;
            }

            // Student actions
            if (component.student_actions) {
              formatted += `  ✋ STUDENT ACTIONS:\n`;
              formatted += `  ${component.student_actions.split('\n').join('\n  ')}\n\n`;
            }

            // Expected responses
            if (component.expected_responses) {
              formatted += `  💭 EXPECTED STUDENT RESPONSES:\n`;
              formatted += `  ${component.expected_responses.split('\n').join('\n  ')}\n\n`;
            }

            // Connection to prior knowledge
            if (component.connection_to_prior_knowledge) {
              formatted += `  🔗 CONNECTION TO PRIOR KNOWLEDGE:\n`;
              formatted += `  ${component.connection_to_prior_knowledge.split('\n').join('\n  ')}\n\n`;
            }

            // Concept Development sub-activities
            if (component.sub_activities && Array.isArray(component.sub_activities)) {
              formatted += `  📖 SUB-ACTIVITIES:\n\n`;
              component.sub_activities.forEach((subActivity, idx) => {
                formatted += `    Activity ${idx + 1}: ${subActivity.name || `Activity ${idx + 1}`}\n`;
                if (subActivity.timing) formatted += `    ⏱️ Timing: ${subActivity.timing}\n\n`;

                if (subActivity.teacher_instructions) {
                  formatted += `    👨‍🏫 Teacher Instructions:\n`;
                  formatted += `    ${subActivity.teacher_instructions.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.teacher_dialogue) {
                  formatted += `    💬 Teacher Dialogue:\n`;
                  formatted += `    "${subActivity.teacher_dialogue}"\n\n`;
                }

                if (subActivity.student_explanation) {
                  formatted += `    📚 Student-Level Explanation:\n`;
                  formatted += `    ${subActivity.student_explanation.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.examples) {
                  formatted += `    📝 Examples:\n`;
                  formatted += `    ${subActivity.examples.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.student_actions) {
                  formatted += `    ✋ Student Actions:\n`;
                  formatted += `    ${subActivity.student_actions.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.practice_exercises) {
                  formatted += `    ✏️ Practice Exercises:\n`;
                  formatted += `    ${subActivity.practice_exercises.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.common_misconceptions) {
                  formatted += `    ⚠️ Common Misconceptions:\n`;
                  formatted += `    ${subActivity.common_misconceptions.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.formative_checkpoint) {
                  formatted += `    ✅ Formative Checkpoint:\n`;
                  formatted += `    ${subActivity.formative_checkpoint.split('\n').join('\n    ')}\n\n`;
                }

                if (subActivity.learning_style_integration) {
                  formatted += `    🎯 Learning Style Integration:\n`;
                  formatted += `    ${subActivity.learning_style_integration.split('\n').join('\n    ')}\n\n`;
                }

                formatted += `    ${'─'.repeat(50)}\n\n`;
              });
            }

            // Transitions
            if (component.transitions) {
              formatted += `  🔄 TRANSITIONS:\n`;
              formatted += `  ${component.transitions.split('\n').join('\n  ')}\n\n`;
            }

            // Reflection questions
            if (component.reflection_questions) {
              formatted += `  🤔 REFLECTION QUESTIONS:\n`;
              formatted += `  ${component.reflection_questions.split('\n').join('\n  ')}\n\n`;
            }

            // Sharing process
            if (component.sharing_process) {
              formatted += `  💬 SHARING PROCESS:\n`;
              formatted += `  ${component.sharing_process.split('\n').join('\n  ')}\n\n`;
            }

            // Student language guide
            if (component.student_language_guide) {
              formatted += `  📝 STUDENT LANGUAGE GUIDE:\n`;
              formatted += `  ${component.student_language_guide.split('\n').join('\n  ')}\n\n`;
            }

            // Addressing questions
            if (component.addressing_questions) {
              formatted += `  ❓ ADDRESSING QUESTIONS:\n`;
              formatted += `  ${component.addressing_questions.split('\n').join('\n  ')}\n\n`;
            }

            // Connection to next lesson
            if (component.connection_to_next_lesson) {
              formatted += `  🔗 CONNECTION TO NEXT LESSON:\n`;
              formatted += `  ${component.connection_to_next_lesson.split('\n').join('\n  ')}\n\n`;
            }

            // Legacy support for activities array
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
            if (component.timing) formatted += `  ⏱️ Timing: ${component.timing}\n`;
            if (component.description) formatted += `  📝 Description: ${component.description}\n`;
            if (component.teacher_instructions) formatted += `  👨‍🏫 Instructions: ${component.teacher_instructions}\n`;
            if (component.student_explanation) formatted += `  📚 Student Explanation: ${component.student_explanation}\n`;
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
      // Handle specific assessment keys with enhanced formatting
      if (assessment.formative_strategies) {
        formatted += `📊 FORMATIVE ASSESSMENT STRATEGIES:\n${assessment.formative_strategies}\n\n`;
      } else if (assessment['Formative Assessment'] || assessment.formative_assessment) {
        const formative = assessment['Formative Assessment'] || assessment.formative_assessment;
        formatted += `📊 FORMATIVE ASSESSMENT:\n${formative}\n\n`;
      }

      if (assessment.assessment_activities) {
        formatted += `📝 ASSESSMENT ACTIVITIES:\n${assessment.assessment_activities}\n\n`;
      } else if (assessment['Assessment Activities']) {
        formatted += `📝 ASSESSMENT ACTIVITIES:\n${assessment['Assessment Activities']}\n\n`;
      }

      if (assessment.assessment_tools) {
        formatted += `🛠️ ASSESSMENT TOOLS:\n${assessment.assessment_tools}\n\n`;
      } else if (assessment['Assessment Tools']) {
        formatted += `🛠️ ASSESSMENT TOOLS:\n${assessment['Assessment Tools']}\n\n`;
      }

      if (assessment.checkpoint_questions) {
        formatted += `✅ CHECKPOINT QUESTIONS:\n${assessment.checkpoint_questions}\n\n`;
      }

      // Handle any other keys
      Object.keys(assessment).forEach(key => {
        if (!['Formative Assessment', 'formative_assessment', 'formative_strategies',
          'Assessment Activities', 'assessment_activities',
          'Assessment Tools', 'assessment_tools', 'checkpoint_questions'].includes(key)) {
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
        if (typeof resources[key] === 'string') {
          formatted += `📚 ${formattedKey}:\n${resources[key]}\n\n`;
        } else {
          formatted += `📚 ${formattedKey}: ${JSON.stringify(resources[key], null, 2)}\n\n`;
        }
      });
    }
    formatted += '\n';
  }

  // Format Student Content (if present)
  if (planObj.student_content) {
    formatted += '═══════════════════════════════════════════════════════\n';
    formatted += 'STUDENT-FACING CONTENT\n';
    formatted += '═══════════════════════════════════════════════════════\n';
    formatted += `${planObj.student_content}\n\n`;
  }

  return formatted.trim() || JSON.stringify(planObj, null, 2);
};

/**
 * Extract a field value from text content (handles multi-line strings)
 * @param {string} content - Text content
 * @param {string} fieldName - Field name to extract
 * @returns {string} Extracted field value
 */
const extractField = (content, fieldName) => {
  // Try to match field with quoted string (handles escaped quotes and newlines)
  const quotedPattern = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  let match = content.match(quotedPattern);
  if (match && match[1]) {
    return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
  }

  // Try to match field with unquoted string (until next field or end)
  const unquotedPattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
  match = content.match(unquotedPattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Try to match field without quotes (until next field, comma, or closing brace)
  const noQuotePattern = new RegExp(`"${fieldName}"\\s*:\\s*([^,}]+)`, 'i');
  match = content.match(noQuotePattern);
  if (match && match[1]) {
    return match[1].trim().replace(/^["']|["']$/g, '');
  }

  return null;
};

/**
 * Generate an enhanced lesson plan with comprehensive details
 * Uses the OECS-style comprehensive prompt with curriculum standards
 */
export const generateEnhancedLessonPlan = async (formData) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const {
    subject,
    form,
    class: className,
    topic,
    essentialLearningOutcomes,
    learningOutcomes,
    studentCount,
    duration,
    pedagogicalStrategies = [],
    learningStyles = [],
    learningPreferences = [],
    multipleIntelligences = [],
    materials,
    prerequisiteSkills,
    specialNeeds,
    specialNeedsDetails,
    additionalInstructions,
    referenceUrl,
    curriculumStandards = ''
  } = formData;

  if (!subject || !form || !topic || !duration) {
    throw new Error('Missing required parameters: subject, form, topic, and duration are required.');
  }

  // Build comprehensive prompt
  let prompt = `You are an expert educational lesson planner for Caribbean secondary schools. Create a comprehensive lesson plan that follows best practices and aligns with curriculum standards.

CRITICAL INSTRUCTIONS:
- Use ONLY the information provided below
- Do NOT invent fictional names, places, or content
- Follow a structured lesson plan format suitable for Caribbean secondary education
- Ensure all activities are practical and can be executed in a classroom setting
- Align all content with the provided curriculum standards

LESSON INFORMATION:
Subject: ${subject}
Form: ${form}
${className ? `Class: ${className}` : ''}
Topic: ${topic}
Duration: ${duration} minutes
Student Count: ${studentCount || 20}

${essentialLearningOutcomes ? `Essential Learning Outcomes:\n${essentialLearningOutcomes}\n` : ''}
${learningOutcomes ? `Learning Outcomes:\n${learningOutcomes}\n` : ''}

CURRICULUM STANDARDS:
${curriculumStandards || 'No specific curriculum standards provided. Use general best practices for this subject and form level.'}

TEACHING STRATEGIES:
${pedagogicalStrategies.length > 0 ? pedagogicalStrategies.join(', ') : 'Use appropriate pedagogical strategies based on the topic and student needs.'}

LEARNING STYLES:
${learningStyles.length > 0 ? learningStyles.join(', ') : 'Cater to multiple learning styles.'}

LEARNING PREFERENCES:
${learningPreferences.length > 0 ? learningPreferences.join(', ') : 'Use a mix of individual, pair, and group work.'}

MULTIPLE INTELLIGENCES:
${multipleIntelligences.length > 0 ? multipleIntelligences.join(', ') : 'Address various intelligences in activities.'}

${materials ? `MATERIALS NEEDED:\n${materials}\n` : ''}
${prerequisiteSkills ? `PREREQUISITE SKILLS:\n${prerequisiteSkills}\n` : ''}
${specialNeeds && specialNeedsDetails ? `SPECIAL NEEDS ACCOMMODATIONS:\n${specialNeedsDetails}\n` : ''}
${additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}\n` : ''}
${referenceUrl ? `REFERENCE URL: ${referenceUrl}\n` : ''}

LESSON PLAN STRUCTURE:
Create a detailed lesson plan with the following sections:

1. LESSON HEADER
   - Subject, Form, Class (if applicable)
   - Topic
   - Essential Learning Outcomes
   - Specific Learning Outcomes
   - Duration

2. OBJECTIVES TABLE
   Create a table with three columns:
   - Knowledge: What students will know
   - Skills: What students will be able to do
   - Values: Attitudes and values to be developed

3. LESSON COMPONENTS (with strict timing and DETAILED instructions)
   For EACH component, provide:
   - Exact timing (e.g., "Minutes 1-3: Hook Activity")
   - Detailed step-by-step instructions that a teacher can follow verbatim
   - Student-level explanations and content written at the appropriate reading level for ${form} students
   - Teacher dialogue/script for explaining concepts clearly
   - Specific student actions and expected responses
   - Clear transition phrases between activities
   
   a) Prompter/Hook (1-3 minutes)
      - Engaging opening activity to capture attention
      - Detailed step-by-step instructions for the teacher
      - Student-facing explanation of what they're doing and why
      - Expected student responses or reactions
   
   b) Introduction (2-3 minutes)
      - Connect to prior knowledge with specific questions or prompts
      - State lesson objectives in student-friendly language
      - Teacher script for introducing the topic
      - Student-level explanation of what they'll learn today
   
   c) Concept Development and Practice (${Math.floor(duration * 0.5)}-${Math.floor(duration * 0.6)} minutes)
      This is the MAIN section - provide EXTENSIVE detail:
      - Break down into 3-5 sub-activities with clear progression
      - For EACH sub-activity, include:
        * Step-by-step instructions (numbered 1, 2, 3, etc.)
        * Teacher actions and dialogue (what to say, how to explain)
        * Student actions (what students should do at each step)
        * Student-level explanations of concepts (written in language appropriate for ${form} students)
        * Examples and demonstrations with full explanations
        * Common misconceptions to address
        * Formative assessment checkpoints with specific questions to ask
        * Timing for each sub-activity
      - Integration of learning styles and multiple intelligences
      - Clear transitions between activities
      - Practice exercises with step-by-step solutions/explanations
      - Content written at ${form} level - use age-appropriate vocabulary and explanations
   
   d) Time to Reflect and Share (3-5 minutes)
      - Specific reflection questions at student level
      - Step-by-step process for sharing
      - Student-friendly language for expressing understanding
      - How to address common questions or misconceptions

4. ASSESSMENT
   - Formative assessment strategies during lesson
   - Assessment activities aligned with learning outcomes
   - Assessment tools (rubrics, checklists, etc.)

5. RESOURCES
   - Organized by lesson phase
   - Include materials, references, and digital resources

6. HOMEWORK/EXTENSION
   - Meaningful assignment that reinforces learning
   - Extends learning beyond the classroom
   - Clear instructions

${specialNeeds && specialNeedsDetails ? `7. SPECIAL NEEDS ACCOMMODATIONS\n   - Detailed accommodations for students with special needs\n   - Modifications for activities and assessments\n` : ''}

IMPORTANT: Respond with ONLY valid JSON in this exact structure:
{
  "lesson_title": "Engaging lesson title",
  "learning_objectives": "Detailed learning objectives aligned with curriculum standards",
  "lesson_plan": {
    "1. LESSON HEADER": {
      "Subject": "${subject}",
      "Form": "${form}",
      "Class": "${className || 'N/A'}",
      "Topic": "${topic}",
      "Essential Learning Outcomes": "${essentialLearningOutcomes || 'As specified'}",
      "Specific Learning Outcomes": "${learningOutcomes || 'As specified'}",
      "Duration": "${duration} minutes"
    },
    "2. OBJECTIVES TABLE": {
      "columns": [
        {
          "Knowledge": "What students will know (detailed)",
          "Skills": "What students will be able to do (detailed)",
          "Values": "Attitudes and values to be developed (detailed)"
        }
      ]
    },
    "3. LESSON COMPONENTS": {
      "Prompter/Hook": {
        "timing": "1-3 minutes",
        "description": "Brief description",
        "teacher_instructions": "Detailed step-by-step instructions for the teacher",
        "teacher_dialogue": "What the teacher should say (script)",
        "student_explanation": "Student-level explanation of what they're doing and why",
        "student_actions": "What students should do, step by step",
        "expected_responses": "What students might say or do"
      },
      "Introduction": {
        "timing": "2-3 minutes",
        "description": "Brief description",
        "teacher_instructions": "Detailed step-by-step instructions",
        "teacher_dialogue": "Teacher script for introducing topic",
        "student_explanation": "Student-friendly explanation of what they'll learn",
        "connection_to_prior_knowledge": "Specific questions or prompts to connect to previous learning"
      },
      "Concept Development and Practice": {
        "timing": "${Math.floor(duration * 0.5)}-${Math.floor(duration * 0.6)} minutes",
        "description": "Overview of this section",
        "sub_activities": [
          {
            "name": "Activity name (e.g., 'Understanding Basic Concepts')",
            "timing": "Specific minutes (e.g., 'Minutes 5-12')",
            "teacher_instructions": "Detailed numbered step-by-step instructions (1, 2, 3, etc.)",
            "teacher_dialogue": "What to say, how to explain concepts",
            "student_explanation": "Clear explanation of concepts written at ${form} level - use age-appropriate vocabulary",
            "examples": "Detailed examples with full explanations at student level",
            "student_actions": "Step-by-step what students should do",
            "practice_exercises": "Practice problems/activities with step-by-step solutions and explanations",
            "common_misconceptions": "Common mistakes students might make and how to address them",
            "formative_checkpoint": "Specific questions to ask students to check understanding",
            "learning_style_integration": "How this activity addresses different learning styles"
          }
        ],
        "transitions": "Clear phrases for moving between activities"
      },
      "Time to Reflect and Share": {
        "timing": "3-5 minutes",
        "description": "Brief description",
        "reflection_questions": "Student-level questions for reflection",
        "sharing_process": "Step-by-step how students will share",
        "student_language_guide": "Examples of how students might express their understanding",
        "addressing_questions": "How to handle common questions or misconceptions"
      },
      "Closure": {
        "timing": "2-3 minutes",
        "description": "Brief description",
        "teacher_instructions": "Step-by-step closure process",
        "teacher_dialogue": "What to say to wrap up",
        "student_explanation": "Student-level summary of key takeaways",
        "connection_to_next_lesson": "How this connects to future learning"
      }
    },
    "4. ASSESSMENT": {
      "formative_strategies": "Detailed formative assessment approaches during lesson",
      "assessment_activities": "Specific assessment activities with instructions",
      "assessment_tools": "Rubrics, checklists, or other tools with detailed criteria",
      "checkpoint_questions": "Specific questions to ask at each checkpoint"
    },
    "5. RESOURCES": {
      "Introduction": "Resources for introduction phase",
      "Concept Development and Practice": "Resources for main teaching phase",
      "Time to Reflect and Share": "Resources for reflection phase",
      "digital_resources": "Any online resources or tools needed"
    },
    "6. HOMEWORK/EXTENSION": {
      "Description": "Clear homework assignment with detailed instructions",
      "student_explanation": "Student-friendly explanation of the homework",
      "step_by_step_instructions": "Numbered steps for completing the homework",
      "extension_activities": "Optional extension activities for advanced students"
    }
  },
  "homework_description": "Clear homework assignment with detailed step-by-step instructions",
  "materials_list": "Detailed list of all required materials with quantities",
  "assessment_strategies": "Comprehensive formative and summative assessment approaches",
  "student_content": "Key concepts and explanations written specifically at ${form} level - this should be student-facing content they can understand"
}

CRITICAL REQUIREMENTS:
- All student-level explanations must be written at the appropriate reading/comprehension level for ${form} students
- Use age-appropriate vocabulary and examples
- Provide extensive step-by-step instructions that a teacher can follow verbatim
- Include teacher dialogue/scripts for explaining concepts
- Break down complex concepts into simple, understandable explanations for students
- Include detailed examples with full explanations at student level
- Address common misconceptions students at this level might have
- Make all content practical and classroom-ready

Remember: Use ONLY the provided information. Make the lesson plan practical, engaging, and aligned with Caribbean secondary education standards.`;

  try {
    console.log('[AI Service] Generating enhanced lesson plan...');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational lesson planner for Caribbean secondary schools. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      max_tokens: 4096 // Maximum supported by GPT-3.5-turbo model
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Parse JSON response
    let lessonPlan;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        lessonPlan = JSON.parse(jsonMatch[1]);
      } else {
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          lessonPlan = JSON.parse(jsonObjectMatch[0]);
        } else {
          lessonPlan = JSON.parse(content);
        }
      }
      console.log('[AI Service] Successfully parsed enhanced lesson plan');
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse JSON, using fallback:', parseError);
      lessonPlan = {
        lesson_title: `${topic} - ${subject}`,
        learning_objectives: essentialLearningOutcomes || learningOutcomes || 'Students will learn the key concepts of this topic.',
        lesson_plan: content,
        homework_description: 'Complete practice exercises related to the lesson.',
        materials_list: materials || 'Standard classroom materials',
        assessment_strategies: 'Formative assessment through observation and questioning during activities.'
      };
    }

    // Ensure all fields exist and convert lesson_plan to string if it's an object
    lessonPlan.lesson_title = lessonPlan.lesson_title || `${topic} - ${subject}`;
    lessonPlan.learning_objectives = lessonPlan.learning_objectives || '';

    // Convert lesson_plan to string if it's an object, formatting it nicely
    if (lessonPlan.lesson_plan && typeof lessonPlan.lesson_plan === 'object') {
      lessonPlan.lesson_plan = formatStructuredLessonPlan(lessonPlan.lesson_plan);
    } else {
      lessonPlan.lesson_plan = lessonPlan.lesson_plan || lessonPlan.content || '';
    }

    lessonPlan.homework_description = lessonPlan.homework_description || '';
    lessonPlan.materials_list = lessonPlan.materials_list || materials || '';
    lessonPlan.assessment_strategies = lessonPlan.assessment_strategies || '';

    // Add metadata
    lessonPlan.metadata = {
      subject,
      form,
      class: className,
      topic,
      duration,
      studentCount,
      generatedAt: new Date().toISOString()
    };

    return lessonPlan;
  } catch (error) {
    console.error('[AI Service] Error generating enhanced lesson plan:', error);
    throw error;
  }
};

/**
 * Generate an assignment rubric using AI
 * @param {Object} params - Rubric generation parameters
 * @param {string} params.assignmentTitle - Title of the assignment
 * @param {string} params.assignmentDescription - Description of the assignment
 * @param {string} params.subject - Subject name
 * @param {string} params.gradeLevel - Grade level or form
 * @param {number} params.totalPoints - Total points for the assignment (optional)
 * @param {Array} params.criteria - Array of criteria to include in rubric (optional)
 * @returns {Promise<string>} Generated rubric text
 */
export const generateAssignmentRubric = async ({
  assignmentTitle,
  assignmentDescription,
  subject,
  gradeLevel,
  totalPoints = 100,
  criteria = []
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!assignmentTitle || !subject || !gradeLevel) {
    throw new Error('Missing required parameters: assignmentTitle, subject, and gradeLevel are required.');
  }

  const criteriaText = criteria.length > 0
    ? `\nSpecific criteria to include:\n${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : '';

  const prompt = `Generate a comprehensive grading rubric for an assignment with the following details:

Assignment Title: ${assignmentTitle}
Subject: ${subject}
Grade Level: ${gradeLevel}
Total Points: ${totalPoints}
${assignmentDescription ? `Assignment Description: ${assignmentDescription}` : ''}${criteriaText}

Create a detailed rubric that includes:
1. Clear evaluation criteria (at least 4-5 criteria relevant to the assignment)
2. Performance levels (e.g., Excellent, Good, Satisfactory, Needs Improvement, or use point-based levels)
3. Descriptions for each performance level for each criterion
4. Point allocation for each criterion (should total ${totalPoints} points)
5. Clear, specific, and measurable standards

Format the rubric as a well-structured document that can be used directly for grading. Use clear headings and organize it in a table or structured format.

Respond with ONLY the rubric content, formatted clearly and professionally. Do not include any introductory text, explanations, or markdown code blocks.`;

  try {
    console.log('[AI Service] Generating assignment rubric...');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessment specialist. Generate clear, detailed, and professional grading rubrics for assignments. Format your response as a well-structured rubric document that teachers can use directly for grading.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5, // Moderate temperature for balanced creativity and consistency
      max_tokens: 2000
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Clean up the content (remove markdown code blocks if present)
    let rubric = content.trim();
    rubric = rubric.replace(/```(?:markdown|text)?\s*/g, '').replace(/```\s*/g, '').trim();

    return rubric;
  } catch (error) {
    console.error('[AI Service] Error generating rubric:', error);
    throw error;
  }
};

/**
 * Generate complete lesson content structure with multiple content items
 * @param {Object} params - Lesson content generation parameters
 * @param {string} params.lessonTitle - Title of the lesson
 * @param {string} params.topic - Lesson topic
 * @param {string} params.subject - Subject name
 * @param {string} params.form - Form/grade level
 * @param {string} params.learningObjectives - Learning objectives for the lesson
 * @param {string} params.lessonPlan - Lesson plan text (optional)
 * @param {number} params.duration - Lesson duration in minutes
 * @returns {Promise<Array>} Array of content items to be created
 */
export const generateCompleteLessonContent = async ({
  lessonTitle,
  topic,
  subject,
  form,
  learningObjectives,
  lessonPlan = '',
  duration = 45
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!lessonTitle || !topic || !subject || !form) {
    throw new Error('Missing required parameters: lessonTitle, topic, subject, and form are required.');
  }

  let prompt = `You are an expert educational content creator. Generate a complete set of lesson content items for a lesson with the following details:

Subject: ${subject}
Form: ${form}
Topic: ${topic}
Lesson Title: ${lessonTitle}
Duration: ${duration} minutes
${learningObjectives ? `Learning Objectives:\n${learningObjectives}\n` : ''}
${lessonPlan ? `Lesson Plan:\n${lessonPlan.substring(0, 2000)}\n` : ''}

Generate a comprehensive set of content items that should be included in this lesson. For each content item, provide:
1. Content type (one of: LEARNING_OUTCOMES, LEARNING_ACTIVITIES, KEY_CONCEPTS, REFLECTION_QUESTIONS, DISCUSSION_PROMPTS, SUMMARY, VIDEO, QUIZ, ASSIGNMENT)
2. Title
3. The actual content text (appropriate for ${form} students) - for VIDEO, provide a suggested video URL or embed code; for QUIZ, provide quiz description and suggested questions; for ASSIGNMENT, provide assignment description
4. Content section (Introduction, Learning, Assessment, Resources, or Closure)
5. Sequence order (1, 2, 3, etc.)
6. Whether it's required (true/false)
7. Estimated minutes to complete (if applicable)
8. For VIDEO: url field with a suggested YouTube or educational video URL
9. For QUIZ: quiz_questions array with 3-5 questions (each with question_text, question_type, options array, correct_answer)
10. For ASSIGNMENT: assignment_description, total_points, and rubric_criteria array

IMPORTANT: You must respond with ONLY valid JSON, no additional text, no markdown formatting, no code blocks. The response must be a single JSON array that can be parsed directly.

Respond with this exact JSON structure (MUST include all required items in this order):
[
  {
    "content_type": "LEARNING_OUTCOMES",
    "title": "Learning Outcomes",
    "content_text": "By the end of this lesson, ${form} students will be able to:\n1. [Outcome 1 - written in simple language for ${form} students]\n2. [Outcome 2 - age-appropriate for ${form}]\n3. [Outcome 3 - clear and understandable for ${form} level]",
    "content_section": "Introduction",
    "sequence_order": 1,
    "is_required": true,
    "estimated_minutes": null
  },
  {
    "content_type": "KEY_CONCEPTS",
    "title": "Key Concepts",
    "content_text": "Main concepts explained in simple language for ${form} students:\n\n1. [Concept 1 - explained clearly at ${form} level]\n2. [Concept 2 - using age-appropriate vocabulary]\n3. [Concept 3 - easy to understand for ${form} students]",
    "content_section": "Learning",
    "sequence_order": 2,
    "is_required": true,
    "estimated_minutes": 10
  },
  {
    "content_type": "VIDEO",
    "title": "Video: ${topic}",
    "content_text": "Watch this video to understand ${topic} - designed for ${form} students",
    "url": "https://www.youtube.com/watch?v=... (use actual URL provided below)",
    "content_section": "Learning",
    "sequence_order": 3,
    "is_required": true,
    "estimated_minutes": 10,
    "description": "Educational video about ${topic} appropriate for ${form} level"
  },
  {
    "content_type": "LEARNING_ACTIVITIES",
    "title": "Learning Activities",
    "content_text": "Activities for ${form} students to practice ${topic}:\n\n1. [Activity 1 - age-appropriate, clear instructions for ${form} students]\n2. [Activity 2 - simple and engaging for ${form} level]\n3. [Activity 3 - practical and fun for ${form} students]",
    "content_section": "Learning",
    "sequence_order": 4,
    "is_required": true,
    "estimated_minutes": 20
  },
  {
    "content_type": "QUIZ",
    "title": "Knowledge Check: ${topic}",
    "content_text": "Test your understanding with this quiz",
    "content_section": "Assessment",
    "sequence_order": 5,
    "is_required": true,
    "estimated_minutes": 15,
    "quiz_questions": [
      {
        "question_text": "Question about ${topic} written in simple language for ${form} students?",
        "question_type": "MULTIPLE_CHOICE",
        "points": 2,
        "options": [
          {"text": "Option A - simple answer for ${form} level", "is_correct": false},
          {"text": "Option B - correct answer", "is_correct": true},
          {"text": "Option C - simple answer for ${form} level", "is_correct": false},
          {"text": "Option D - simple answer for ${form} level", "is_correct": false}
        ],
        "explanation": "Explanation written clearly for ${form} students"
      },
      {
        "question_text": "Another question about ${topic} for ${form} students?",
        "question_type": "TRUE_FALSE",
        "points": 1,
        "options": [
          {"text": "True", "is_correct": true},
          {"text": "False", "is_correct": false}
        ],
        "explanation": "Simple explanation for ${form} level"
      },
      {
        "question_text": "A third question about ${topic} appropriate for ${form}?",
        "question_type": "SHORT_ANSWER",
        "points": 3,
        "correct_answer": "Expected answer for ${form} students"
      }
    ]
  },
  {
    "content_type": "ASSIGNMENT",
    "title": "Assignment: ${topic}",
    "content_text": "Complete this assignment to demonstrate your understanding of ${topic}",
    "content_section": "Assessment",
    "sequence_order": 6,
    "is_required": true,
    "estimated_minutes": 60,
    "assignment_description": "Detailed assignment instructions written clearly for ${form} students:\n\n1. [Step 1 - clear instructions at ${form} level]\n2. [Step 2 - simple and easy to follow]\n3. [Step 3 - age-appropriate for ${form}]\n\nWhat to submit:\n- [Requirement 1]\n- [Requirement 2]\n- [Requirement 3]\n\nDue date: [Specify due date]\n\nThis assignment is designed for ${form} students and uses language appropriate for your level.",
    "total_points": 100,
    "rubric_criteria": [
      {
        "criterion": "Understanding of Concepts",
        "points": 30,
        "description": "Demonstrates clear understanding of key concepts (${form} level)"
      },
      {
        "criterion": "Application",
        "points": 30,
        "description": "Applies concepts correctly to solve problems (appropriate for ${form})"
      },
      {
        "criterion": "Presentation",
        "points": 20,
        "description": "Clear, organized, and well-presented work (${form} standards)"
      },
      {
        "criterion": "Completeness",
        "points": 20,
        "description": "All required components are included (${form} level requirements)"
      }
    ]
  },
  {
    "content_type": "SUMMARY",
    "title": "Lesson Summary",
    "content_text": "Summary for ${form} students:\n\nToday we learned about ${topic}. Here's what ${form} students should remember:\n1. [Key point 1 - in simple language]\n2. [Key point 2 - easy to understand]\n3. [Key point 3 - age-appropriate]",
    "content_section": "Closure",
    "sequence_order": 7,
    "is_required": true,
    "estimated_minutes": 5
  }
]

NOTE: The VIDEO must be in the Learning section (content_section: "Learning") and should come before or within the LEARNING_ACTIVITIES section.

Generate content items that provide a complete learning experience. YOU MUST INCLUDE ALL OF THE FOLLOWING:

REQUIRED CONTENT ITEMS (must be included in this exact order):
1. LEARNING_OUTCOMES - Learning outcomes written clearly at ${form} student level (3-5 outcomes)
2. KEY_CONCEPTS - Key concepts explained in simple, age-appropriate language for ${form} students (3-5 main concepts)
3. LEARNING_ACTIVITIES - Must include at least ONE VIDEO in this section, plus 2-3 other learning activities, all written at ${form} level
4. ASSESSMENT - Assessment activities (can include QUIZ and/or ASSIGNMENT), written at ${form} level
5. SUMMARY - Lesson summary written clearly at ${form} student level (concise, age-appropriate)

ADDITIONAL CONTENT (optional but recommended):
- REFLECTION_QUESTIONS - Questions for students to reflect (${form} level)
- DISCUSSION_PROMPTS - Discussion topics (${form} level)

CRITICAL REQUIREMENTS - STUDENT LEVEL LANGUAGE:
- ALL content MUST be written at ${form} reading/comprehension level
- Use age-appropriate vocabulary - imagine you're explaining to ${form} students directly
- Avoid complex jargon, technical terms, or advanced vocabulary
- Use simple, clear sentences that ${form} students can easily understand
- Break down complex ideas into simple explanations
- Use examples and analogies appropriate for ${form} level
- Write as if speaking directly to ${form} students

STRUCTURE REQUIREMENTS:
- The VIDEO MUST be placed in the "Learning" content section (content_section: "Learning")
- At least 1 VIDEO must be included and it should be part of the Learning Activities
- The VIDEO should come after KEY_CONCEPTS and before or within LEARNING_ACTIVITIES
- Include at least 1 QUIZ with 3-5 questions appropriate for ${form} level (use simple language in questions)
- Include at least 1 ASSIGNMENT with detailed instructions written for ${form} students and rubric criteria (4-5 criteria, totaling 100 points)
- Content is practical and classroom-ready
- Sequence makes logical sense (Introduction → Learning → Assessment → Closure)
- Content is specific to the topic "${topic}" and subject "${subject}"

TECHNICAL REQUIREMENTS:
- For VIDEO: Use the actual YouTube URL provided below (not a placeholder)
- For QUIZ: Create questions appropriate for ${form} level with clear correct answers (questions should use simple language). You MUST include the quiz_questions array with at least 3-5 questions, each with question_text, question_type, points, and either options (for MULTIPLE_CHOICE/TRUE_FALSE) or correct_answer (for SHORT_ANSWER/FILL_BLANK)
- For ASSIGNMENT: Create meaningful assignments with DETAILED instructions written for ${form} students. The assignment_description field MUST contain comprehensive, step-by-step instructions (at least 200 characters). Do NOT use generic text like "Complete this assignment to demonstrate your understanding" - provide actual detailed instructions including: what students need to do, how to do it, what to submit, and any specific requirements. Also include rubric criteria (4-5 criteria, totaling 100 points)

Remember: Respond with ONLY the JSON array, nothing else.`;

  try {
    console.log('[AI Service] Generating complete lesson content...');

    // Search for relevant YouTube videos first
    let videoInfo = null;
    let videoOptions = [];
    try {
      console.log('[AI Service] Searching for YouTube videos...');

      // Search for multiple videos to give options
      videoOptions = await searchEducationalVideos({
        query: topic,
        subject,
        form,
        maxResults: 3
      });

      if (videoOptions && videoOptions.length > 0) {
        // Use the first (most relevant) video
        videoInfo = videoOptions[0];
        console.log('[AI Service] Found', videoOptions.length, 'videos. Using:', videoInfo.title);

        // Update prompt to include the actual video URL
        prompt = prompt.replace(
          '"url": "https://www.youtube.com/watch?v=... or embed code"',
          `"url": "${videoInfo.url}"`
        );

        // Add video information to the prompt for better context
        const videoList = videoOptions.map((v, idx) =>
          `${idx + 1}. "${v.title}" by ${v.channelTitle} - ${v.url}`
        ).join('\n');

        prompt += `\n\nIMPORTANT: Use this actual YouTube video URL in the VIDEO content item:\n${videoInfo.url}\nVideo Title: ${videoInfo.title}\nChannel: ${videoInfo.channelTitle}\nDescription: ${videoInfo.description?.substring(0, 200) || 'Educational video'}\n\nAdditional video options found:\n${videoList}`;
      } else {
        console.warn('[AI Service] No YouTube video found, will use placeholder');
      }
    } catch (videoError) {
      console.warn('[AI Service] Error searching for videos, continuing without video:', videoError);
      // Continue without video if search fails
    }

    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. You MUST respond with ONLY valid JSON array, no markdown, no code blocks, no additional text. The response must be parseable JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Parse JSON array from response
    let contentItems;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        contentItems = JSON.parse(jsonMatch[1]);
      } else {
        const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
        if (jsonArrayMatch) {
          contentItems = JSON.parse(jsonArrayMatch[0]);
        } else {
          contentItems = JSON.parse(content);
        }
      }
      console.log('[AI Service] Successfully parsed content items:', contentItems.length);
      // Log quiz and assignment items for debugging
      contentItems.forEach((item, idx) => {
        if (item.content_type === 'QUIZ') {
          console.log(`[AI Service] Quiz item ${idx + 1}:`, {
            title: item.title,
            hasQuestions: !!item.quiz_questions,
            questionCount: item.quiz_questions?.length || 0,
            questions: item.quiz_questions
          });
        }
        if (item.content_type === 'ASSIGNMENT') {
          console.log(`[AI Service] Assignment item ${idx + 1}:`, {
            title: item.title,
            hasDescription: !!item.assignment_description,
            description: item.assignment_description?.substring(0, 100) || item.content_text?.substring(0, 100),
            hasRubric: !!item.rubric_criteria,
            rubricCount: item.rubric_criteria?.length || 0
          });
        }
      });
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse JSON, using fallback:', parseError);
      console.log('[AI Service] Raw content:', content.substring(0, 500));
      // Fallback: create basic content structure
      contentItems = [
        {
          content_type: 'LEARNING_OUTCOMES',
          title: 'Learning Outcomes',
          content_text: learningObjectives || 'Students will learn the key concepts of this topic.',
          content_section: 'Introduction',
          sequence_order: 1,
          is_required: true,
          estimated_minutes: null
        },
        {
          content_type: 'KEY_CONCEPTS',
          title: 'Key Concepts',
          content_text: `Main concepts for ${topic} in ${subject}.`,
          content_section: 'Learning',
          sequence_order: 2,
          is_required: true,
          estimated_minutes: 10
        },
        {
          content_type: 'SUMMARY',
          title: 'Lesson Summary',
          content_text: `Summary of ${topic}.`,
          content_section: 'Closure',
          sequence_order: 3,
          is_required: true,
          estimated_minutes: 5
        }
      ];
    }

    // Validate and ensure all required fields, and ensure student-level language
    contentItems = contentItems.map((item, index) => {
      const mappedItem = {
        content_type: item.content_type || 'SUMMARY',
        title: item.title || `Content Item ${index + 1}`,
        content_text: item.content_text || item.content || '',
        content_section: item.content_section || 'Learning',
        sequence_order: item.sequence_order || index + 1,
        is_required: item.is_required !== false,
        estimated_minutes: item.estimated_minutes || null
      };

      // For VIDEO content, ensure we use the actual video URL if available
      // AND ensure it's in the Learning section
      if (item.content_type === 'VIDEO') {
        if (videoInfo) {
          mappedItem.url = videoInfo.url;
          mappedItem.description = videoInfo.description || item.description || item.content_text || '';
          mappedItem.title = videoInfo.title || item.title;
        } else if (item.url) {
          mappedItem.url = item.url;
          mappedItem.description = item.description || item.content_text || '';
        }
        // Force video to be in Learning section
        mappedItem.content_section = 'Learning';
        // Ensure description mentions student level
        if (mappedItem.description && !mappedItem.description.toLowerCase().includes(form.toLowerCase())) {
          mappedItem.description = `${mappedItem.description} (for ${form} students)`;
        }
      }

      // For QUIZ content, ensure quiz_questions array is preserved
      if (item.content_type === 'QUIZ') {
        mappedItem.quiz_questions = item.quiz_questions || [];
        if (mappedItem.quiz_questions.length === 0) {
          console.warn('[AI Service] Quiz has no questions:', item.title);
        }
      }

      // For ASSIGNMENT content, ensure assignment_description is preserved
      if (item.content_type === 'ASSIGNMENT') {
        mappedItem.assignment_description = item.assignment_description || item.content_text || '';
        mappedItem.total_points = item.total_points || 100;
        mappedItem.rubric_criteria = item.rubric_criteria || [];
        if (!mappedItem.assignment_description || mappedItem.assignment_description.trim() === '') {
          console.warn('[AI Service] Assignment has no description:', item.title);
        }
      }

      // Ensure all text content mentions student level if not already present
      if (mappedItem.content_text && !mappedItem.content_text.toLowerCase().includes(form.toLowerCase()) &&
        ['LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'LEARNING_ACTIVITIES', 'SUMMARY'].includes(mappedItem.content_type)) {
        // Add a note that content is for this form level
        mappedItem.content_text = `${mappedItem.content_text}\n\n(Content designed for ${form} students)`;
      }

      return mappedItem;
    });

    // Ensure required content types are present
    const requiredTypes = ['LEARNING_OUTCOMES', 'KEY_CONCEPTS', 'LEARNING_ACTIVITIES', 'SUMMARY'];
    const hasRequiredTypes = requiredTypes.map(type =>
      contentItems.some(item => item.content_type === type)
    );

    // Add missing required content types
    if (!hasRequiredTypes[0]) {
      // Add Learning Outcomes
      contentItems.unshift({
        content_type: 'LEARNING_OUTCOMES',
        title: 'Learning Outcomes',
        content_text: learningObjectives || `By the end of this lesson, ${form} students will be able to:\n1. Understand key concepts of ${topic}\n2. Apply knowledge to solve problems\n3. Demonstrate understanding through activities`,
        content_section: 'Introduction',
        sequence_order: 1,
        is_required: true,
        estimated_minutes: null
      });
    }

    if (!hasRequiredTypes[1]) {
      // Add Key Concepts
      const conceptsIndex = contentItems.findIndex(item => item.content_type === 'LEARNING_OUTCOMES') + 1;
      contentItems.splice(conceptsIndex, 0, {
        content_type: 'KEY_CONCEPTS',
        title: 'Key Concepts',
        content_text: `Main concepts for ${topic} in ${subject}, explained clearly for ${form} students:\n\n1. [First key concept]\n2. [Second key concept]\n3. [Third key concept]`,
        content_section: 'Learning',
        sequence_order: conceptsIndex + 1,
        is_required: true,
        estimated_minutes: 10
      });
    }

    // Ensure there's a video in Learning Activities section
    const hasVideoInLearning = contentItems.some(item =>
      item.content_type === 'VIDEO' && item.content_section === 'Learning'
    );
    const hasLearningActivities = contentItems.some(item =>
      item.content_type === 'LEARNING_ACTIVITIES'
    );

    if (!hasVideoInLearning && videoInfo) {
      // Find the Learning Activities item or insert after Key Concepts
      const learningIndex = contentItems.findIndex(item =>
        item.content_type === 'LEARNING_ACTIVITIES' || item.content_type === 'KEY_CONCEPTS'
      );
      const insertIndex = learningIndex >= 0 ? learningIndex + 1 : 2;

      contentItems.splice(insertIndex, 0, {
        content_type: 'VIDEO',
        title: videoInfo.title,
        content_text: `Watch this video to understand ${topic} at ${form} level`,
        url: videoInfo.url,
        description: videoInfo.description || `Educational video about ${topic} for ${form} students`,
        content_section: 'Learning',
        sequence_order: insertIndex + 1,
        is_required: true,
        estimated_minutes: 10
      });
    }

    if (!hasLearningActivities) {
      // Add Learning Activities after video or key concepts
      const afterIndex = contentItems.findIndex(item =>
        item.content_type === 'VIDEO' && item.content_section === 'Learning'
      ) + 1;
      const insertIndex = afterIndex > 0 ? afterIndex : contentItems.findIndex(item => item.content_type === 'KEY_CONCEPTS') + 1;

      contentItems.splice(insertIndex, 0, {
        content_type: 'LEARNING_ACTIVITIES',
        title: 'Learning Activities',
        content_text: `Activities for ${form} students to practice ${topic}:\n\n1. [Activity 1 - age-appropriate for ${form}]\n2. [Activity 2 - age-appropriate for ${form}]\n3. [Activity 3 - age-appropriate for ${form}]`,
        content_section: 'Learning',
        sequence_order: insertIndex + 1,
        is_required: true,
        estimated_minutes: 20
      });
    }

    // Ensure Assessment section exists (QUIZ or ASSIGNMENT)
    const hasAssessment = contentItems.some(item =>
      ['QUIZ', 'ASSIGNMENT'].includes(item.content_type) || item.content_section === 'Assessment'
    );

    if (!hasAssessment) {
      // Add a QUIZ as assessment
      const assessmentIndex = contentItems.length;
      contentItems.splice(assessmentIndex, 0, {
        content_type: 'QUIZ',
        title: `Knowledge Check: ${topic}`,
        content_text: `Test your understanding of ${topic} with this quiz designed for ${form} students`,
        content_section: 'Assessment',
        sequence_order: assessmentIndex + 1,
        is_required: true,
        estimated_minutes: 15,
        quiz_questions: [
          {
            question_text: `What is the main concept of ${topic}?`,
            question_type: 'MULTIPLE_CHOICE',
            points: 2,
            options: [
              { text: 'Option A', is_correct: false },
              { text: 'Option B', is_correct: true },
              { text: 'Option C', is_correct: false }
            ]
          }
        ]
      });
    }

    if (!hasRequiredTypes[3]) {
      // Add Summary at the end
      contentItems.push({
        content_type: 'SUMMARY',
        title: 'Lesson Summary',
        content_text: `Summary of ${topic} for ${form} students:\n\nToday we learned about ${topic}. The main points are:\n1. [Key point 1]\n2. [Key point 2]\n3. [Key point 3]`,
        content_section: 'Closure',
        sequence_order: contentItems.length + 1,
        is_required: true,
        estimated_minutes: 5
      });
    }

    // Reorder sequence numbers to be sequential
    contentItems = contentItems.map((item, index) => ({
      ...item,
      sequence_order: index + 1
    }));

    return contentItems;
  } catch (error) {
    console.error('[AI Service] Error generating complete lesson content:', error);
    throw error;
  }
};

/**
 * Generate student-facing content from a lesson plan
 * @param {Object} params - Student content generation parameters
 * @param {string} params.lessonTitle - Title of the lesson
 * @param {string} params.topic - Lesson topic
 * @param {string} params.subject - Subject name
 * @param {string} params.form - Form/grade level
 * @param {string} params.lessonPlan - Full lesson plan text
 * @param {string} params.learningObjectives - Learning objectives
 * @returns {Promise<Object>} Student-facing content object
 */
export const generateStudentFacingContent = async ({
  lessonTitle,
  topic,
  subject,
  form,
  lessonPlan,
  learningObjectives
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!lessonTitle || !topic || !subject || !form) {
    throw new Error('Missing required parameters: lessonTitle, topic, subject, and form are required.');
  }

  const prompt = `You are an expert educational content creator specializing in student-facing materials. Create clear, engaging, and age-appropriate content for ${form} students based on this lesson:

Subject: ${subject}
Form: ${form}
Topic: ${topic}
Lesson Title: ${lessonTitle}
${learningObjectives ? `Learning Objectives:\n${learningObjectives}\n` : ''}
${lessonPlan ? `Lesson Plan:\n${lessonPlan.substring(0, 3000)}\n` : ''}

Generate student-facing content that includes:

1. KEY_CONCEPTS: Main concepts explained in simple, clear language at ${form} level (3-5 key concepts)
2. LEARNING_ACTIVITIES: Step-by-step activities students can follow (2-3 activities)
3. REFLECTION_QUESTIONS: Thought-provoking questions for students to think about (3-5 questions)
4. DISCUSSION_PROMPTS: Questions for class discussion (2-3 prompts)
5. SUMMARY: A clear summary of what students learned (concise, at ${form} level)

IMPORTANT: You must respond with ONLY valid JSON, no additional text, no markdown formatting, no code blocks.

Respond with this exact JSON structure:
{
  "key_concepts": "Clear explanation of 3-5 main concepts, written at ${form} level. Use simple language and examples students can relate to.",
  "learning_activities": "Step-by-step activities (2-3 activities) that students can complete. Make instructions clear and easy to follow.",
  "reflection_questions": "3-5 thoughtful questions that help students reflect on what they learned. Questions should be open-ended and encourage critical thinking.",
  "discussion_prompts": "2-3 discussion questions or prompts that encourage class participation and deeper thinking about the topic.",
  "summary": "A concise summary (2-3 paragraphs) of the lesson's main points, written clearly at ${form} level. Help students understand what they learned and why it matters."
}

Make all content:
- Written at ${form} reading/comprehension level
- Clear and engaging
- Practical and actionable
- Specific to the topic "${topic}" in ${subject}
- Free of jargon or overly complex language

Remember: Respond with ONLY the JSON object, nothing else.`;

  try {
    console.log('[AI Service] Generating student-facing content...');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator for students. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Parse JSON from response
    let studentContent;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        studentContent = JSON.parse(jsonMatch[1]);
      } else {
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          studentContent = JSON.parse(jsonObjectMatch[0]);
        } else {
          studentContent = JSON.parse(content);
        }
      }
      console.log('[AI Service] Successfully parsed student content');
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse JSON, using fallback:', parseError);
      studentContent = {
        key_concepts: `Key concepts for ${topic} in ${subject}.`,
        learning_activities: `Activities related to ${topic}.`,
        reflection_questions: `What did you learn about ${topic}?`,
        discussion_prompts: `Let's discuss ${topic}.`,
        summary: `Summary of ${topic}.`
      };
    }

    // Ensure all fields exist
    studentContent.key_concepts = studentContent.key_concepts || '';
    studentContent.learning_activities = studentContent.learning_activities || '';
    studentContent.reflection_questions = studentContent.reflection_questions || '';
    studentContent.discussion_prompts = studentContent.discussion_prompts || '';
    studentContent.summary = studentContent.summary || '';

    return studentContent;
  } catch (error) {
    console.error('[AI Service] Error generating student-facing content:', error);
    throw error;
  }
};

/**
 * Generate flashcards using AI
 * @param {Object} params - Flashcard generation parameters
 * @param {string} params.topic - Topic or subject matter for flashcards
 * @param {string} params.subject - Subject name (optional)
 * @param {string} params.gradeLevel - Grade level or form (optional)
 * @param {number} params.numCards - Number of flashcards to generate (default: 10)
 * @param {string} params.difficulty - Difficulty level: 'easy', 'medium', or 'hard' (optional)
 * @param {string} params.context - Additional context or instructions (optional)
 * @returns {Promise<Array>} Generated flashcards array
 */
export const generateFlashcards = async ({
  topic,
  subject = '',
  gradeLevel = '',
  numCards = 10,
  difficulty = 'medium',
  context = ''
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!topic) {
    throw new Error('Missing required parameter: topic is required.');
  }

  if (numCards < 1 || numCards > 50) {
    throw new Error('Number of cards must be between 1 and 50.');
  }

  const prompt = `You are an expert educational content creator. Generate ${numCards} flashcards for the topic "${topic}".

${subject ? `Subject: ${subject}\n` : ''}${gradeLevel ? `Grade Level: ${gradeLevel}\n` : ''}Difficulty Level: ${difficulty}
${context ? `Additional Context: ${context}\n` : ''}

IMPORTANT: You must respond with ONLY valid JSON, no additional text, no markdown formatting, no code blocks. The response must be a single JSON array that can be parsed directly.

Create flashcards that are:
- Clear and concise (front side should be a question, term, or concept; back side should be the answer, definition, or explanation)
- Age-appropriate for ${gradeLevel || 'the specified grade level'}
- Educational and accurate
- Varied in content (mix of definitions, questions, concepts, etc.)
- Appropriate difficulty level: ${difficulty}

Respond with this exact JSON structure (an array of flashcard objects):
[
  {
    "front": "Question or term on the front of the card",
    "back": "Answer or definition on the back of the card",
    "difficulty": "${difficulty}",
    "tags": ["tag1", "tag2"]
  },
  {
    "front": "Another question or term",
    "back": "Another answer or definition",
    "difficulty": "${difficulty}",
    "tags": ["tag1", "tag3"]
  }
]

Each flashcard object must have:
- "front": string (the question, term, or concept - keep it concise)
- "back": string (the answer, definition, or explanation - can be more detailed)
- "difficulty": string (one of: "easy", "medium", "hard")
- "tags": array of strings (relevant tags for categorization, 1-3 tags per card)

Generate exactly ${numCards} flashcards. Make them diverse and cover different aspects of "${topic}".

Remember: Respond with ONLY the JSON array, nothing else.`;

  try {
    console.log('[AI Service] Generating flashcards...');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only - specifically a JSON array of flashcard objects.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Parse JSON from the response
    let flashcards;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON array directly
        const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
        if (jsonArrayMatch) {
          flashcards = JSON.parse(jsonArrayMatch[0]);
        } else {
          flashcards = JSON.parse(content);
        }
      }
      console.log('[AI Service] Successfully parsed flashcards:', flashcards);
    } catch (parseError) {
      console.error('[AI Service] Failed to parse JSON response:', parseError);
      console.log('[AI Service] Raw content:', content);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate and format flashcards
    if (!Array.isArray(flashcards)) {
      throw new Error('AI response is not an array of flashcards');
    }

    // Transform to match our Flashcard interface
    const formattedFlashcards = flashcards.map((card, index) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `card-${Date.now()}-${index}`,
      front: card.front || '',
      back: card.back || '',
      frontImage: card.frontImage || undefined,
      backImage: card.backImage || undefined,
      tags: Array.isArray(card.tags) ? card.tags : (card.tags ? [card.tags] : []),
      difficulty: card.difficulty || difficulty,
      order: index
    })).filter(card => card.front && card.back); // Filter out invalid cards

    if (formattedFlashcards.length === 0) {
      throw new Error('No valid flashcards were generated. Please try again.');
    }

    return formattedFlashcards;
  } catch (error) {
    console.error('[AI Service] Error generating flashcards:', error);
    throw error;
  }
};

/**
 * Generate interactive video with checkpoints using AI
 * @param {Object} params - Interactive video generation parameters
 * @param {string} params.topic - Topic or subject matter for the video
 * @param {string} params.subject - Subject name (optional)
 * @param {string} params.gradeLevel - Grade level or form (optional)
 * @param {string} params.learningOutcomes - Learning outcomes to align with (optional)
 * @param {number} params.numCheckpoints - Number of checkpoints to generate (default: 5)
 * @param {Array<string>} params.checkpointTypes - Types of checkpoints to generate: 'question', 'quiz', 'note', 'pause', 'reflection' (default: ['question', 'quiz', 'reflection'])
 * @param {string} params.videoUrl - Optional video URL (if not provided, will search for appropriate video)
 * @param {string} params.additionalComments - Additional context or instructions (optional)
 * @returns {Promise<Object>} Generated interactive video data with video URL and checkpoints
 */
export const generateInteractiveVideo = async ({
  topic,
  subject = '',
  gradeLevel = '',
  learningOutcomes = '',
  numCheckpoints = 5,
  checkpointTypes = ['question', 'quiz', 'reflection'],
  videoUrl = '',
  additionalComments = ''
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!topic) {
    throw new Error('Missing required parameter: topic is required.');
  }

  if (numCheckpoints < 1 || numCheckpoints > 20) {
    throw new Error('Number of checkpoints must be between 1 and 20.');
  }

  try {
    console.log('[AI Service] Generating interactive video...');

    // Step 1: Find appropriate video if not provided
    let selectedVideo = null;
    let videoUrlToUse = videoUrl;

    if (!videoUrlToUse) {
      console.log('[AI Service] Searching for appropriate video...');
      try {
        const videos = await searchEducationalVideos({
          query: topic,
          subject: subject,
          form: gradeLevel,
          maxResults: 3
        });

        if (videos && videos.length > 0) {
          // Use the first (most relevant) video
          selectedVideo = videos[0];
          videoUrlToUse = selectedVideo.url;
          console.log('[AI Service] Selected video:', selectedVideo.title);
        } else {
          throw new Error('No suitable video found. Please provide a video URL.');
        }
      } catch (videoError) {
        console.error('[AI Service] Error finding video:', videoError);
        throw new Error('Could not find an appropriate video. Please provide a video URL manually.');
      }
    }

    // Step 2: Get video details if YouTube video
    let videoTitle = '';
    let videoDescription = '';
    if (videoUrlToUse.includes('youtube.com') || videoUrlToUse.includes('youtu.be')) {
      try {
        const videoId = extractYouTubeVideoId(videoUrlToUse);
        if (videoId) {
          const videoDetails = await getVideoDetails(videoId);
          if (videoDetails) {
            videoTitle = videoDetails.title || '';
            videoDescription = videoDetails.description || '';
          }
        }
      } catch (err) {
        console.warn('[AI Service] Could not get video details:', err);
      }
    }

    // Step 3: Generate checkpoints using AI
    const checkpointTypesStr = checkpointTypes.join(', ');
    const prompt = `You are an expert educational content creator. Generate ${numCheckpoints} interactive video checkpoints for an educational video.

Video Information:
${videoTitle ? `Title: ${videoTitle}` : ''}
${videoDescription ? `Description: ${videoDescription.substring(0, 500)}...` : ''}
${videoUrlToUse ? `URL: ${videoUrlToUse}` : ''}

Topic: ${topic}
${subject ? `Subject: ${subject}` : ''}
${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
${learningOutcomes ? `Learning Outcomes: ${learningOutcomes}` : ''}
${additionalComments ? `Additional Context: ${additionalComments}` : ''}

Checkpoint Types to Generate: ${checkpointTypesStr}

IMPORTANT: You must respond with ONLY valid JSON, no additional text, no markdown formatting, no code blocks. The response must be a single JSON object that can be parsed directly.

Create checkpoints that are:
- Distributed throughout the video (from early to late in the video)
- Age-appropriate for ${gradeLevel || 'the specified grade level'}
- Aligned with the learning outcomes: ${learningOutcomes || 'general understanding of the topic'}
- Educational and engaging
- Varied in type (mix of ${checkpointTypesStr})
- Clear and concise

For each checkpoint:
- "question" type: Should have multiple choice options (3-4 options) with one correct answer
- "quiz" type: Should have multiple choice options (3-4 options) with one correct answer and an explanation
- "note" type: Should provide important information or key points
- "pause" type: Should prompt students to reflect or think about what they've learned
- "reflection" type: Should ask open-ended questions for students to reflect on

Respond with this exact JSON structure:
{
  "videoUrl": "${videoUrlToUse}",
  "checkpoints": [
    {
      "timestamp": 30,
      "type": "question",
      "title": "Checkpoint Title",
      "content": "Question or content text",
      "options": [
        {"text": "Option 1", "isCorrect": true},
        {"text": "Option 2", "isCorrect": false},
        {"text": "Option 3", "isCorrect": false}
      ],
      "required": true,
      "pauseVideo": true
    },
    {
      "timestamp": 120,
      "type": "quiz",
      "title": "Quiz Checkpoint",
      "content": "Quiz question text",
      "options": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false}
      ],
      "explanation": "Explanation of the correct answer",
      "required": true,
      "pauseVideo": true
    },
    {
      "timestamp": 180,
      "type": "note",
      "title": "Key Point",
      "content": "Important information or note",
      "required": false,
      "pauseVideo": false
    },
    {
      "timestamp": 240,
      "type": "reflection",
      "title": "Reflection Question",
      "content": "Open-ended reflection question",
      "required": false,
      "pauseVideo": true
    }
  ]
}

Generate exactly ${numCheckpoints} checkpoints. Distribute timestamps throughout a typical video length (assume video is 5-15 minutes). Make timestamps realistic and spaced appropriately.

Remember: Respond with ONLY the JSON object, nothing else.`;

    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Parse JSON from the response
    let videoData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        videoData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object directly
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          videoData = JSON.parse(jsonObjectMatch[0]);
        } else {
          videoData = JSON.parse(content);
        }
      }
      console.log('[AI Service] Successfully parsed video data:', videoData);
    } catch (parseError) {
      console.error('[AI Service] Failed to parse JSON response:', parseError);
      console.log('[AI Service] Raw content:', content);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate and format checkpoints
    if (!videoData.checkpoints || !Array.isArray(videoData.checkpoints)) {
      throw new Error('AI response does not contain valid checkpoints array');
    }

    // Transform checkpoints to match our VideoCheckpoint interface
    const formattedCheckpoints = videoData.checkpoints.map((cp, index) => {
      const checkpoint = {
        id: crypto.randomUUID ? crypto.randomUUID() : `checkpoint-${Date.now()}-${index}`,
        timestamp: Math.max(0, Math.floor(cp.timestamp || 0)),
        type: cp.type || 'question',
        title: cp.title || `${cp.type} Checkpoint`,
        content: cp.content || '',
        required: cp.required !== undefined ? cp.required : true,
        pauseVideo: cp.pauseVideo !== undefined ? cp.pauseVideo : true
      };

      // Add options for question/quiz types
      if ((cp.type === 'question' || cp.type === 'quiz') && cp.options && Array.isArray(cp.options)) {
        checkpoint.options = cp.options.map((opt, optIndex) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : `option-${Date.now()}-${index}-${optIndex}`,
          text: opt.text || '',
          isCorrect: opt.isCorrect || false
        }));

        // Set correct answer ID
        const correctOption = checkpoint.options.find(opt => opt.isCorrect);
        if (correctOption) {
          checkpoint.correctAnswerId = correctOption.id;
        }
      }

      // Add explanation for quiz type
      if (cp.type === 'quiz' && cp.explanation) {
        checkpoint.explanation = cp.explanation;
      }

      return checkpoint;
    }).filter(cp => cp.content && cp.timestamp >= 0); // Filter out invalid checkpoints

    if (formattedCheckpoints.length === 0) {
      throw new Error('No valid checkpoints were generated. Please try again.');
    }

    // Return formatted interactive video data
    return {
      videoUrl: videoData.videoUrl || videoUrlToUse,
      videoType: detectVideoType(videoData.videoUrl || videoUrlToUse),
      checkpoints: formattedCheckpoints,
      settings: {
        showProgress: true,
        showTimestamps: true,
        autoPause: true,
        allowSkip: false,
        allowRetry: true,
        maxAttempts: 3,
        showHints: true,
        requireCompletion: false
      }
    };
  } catch (error) {
    console.error('[AI Service] Error generating interactive video:', error);
    throw error;
  }
};

/**
 * Generate interactive book with multiple pages using AI
 * @param {Object} params - Interactive book generation parameters
 * @param {string} params.topic - Main topic or subject matter for the book
 * @param {string} params.subject - Subject name (optional)
 * @param {string} params.gradeLevel - Grade level or form (optional)
 * @param {number} params.numPages - Number of pages to generate (default: 5)
 * @param {Array<string>} params.pageTypes - Types of pages to include: 'content', 'video', 'quiz', 'image' (default: ['content', 'video', 'quiz'])
 * @param {string} params.learningOutcomes - Learning outcomes to align with (optional)
 * @param {string} params.additionalComments - Additional context or instructions (optional)
 * @returns {Promise<Object>} Generated interactive book data with pages array
 */
export const generateInteractiveBook = async ({
  topic,
  subject = '',
  gradeLevel = '',
  numPages = 5,
  pageTypes = ['content', 'video', 'quiz'],
  learningOutcomes = '',
  additionalComments = ''
}) => {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  if (!topic) {
    throw new Error('Missing required parameter: topic is required.');
  }

  if (numPages < 1 || numPages > 20) {
    throw new Error('Number of pages must be between 1 and 20.');
  }

  try {
    console.log('[AI Service] Generating interactive book...');

    const pageTypesStr = pageTypes.join(', ');
    const prompt = `You are an expert educational content creator. Generate an interactive book with ${numPages} pages about "${topic}".

${subject ? `Subject: ${subject}` : ''}
${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
${learningOutcomes ? `Learning Outcomes: ${learningOutcomes}` : ''}
${additionalComments ? `Additional Context: ${additionalComments}` : ''}

Page Types to Use: ${pageTypesStr}

Generate ${numPages} pages with a mix of the following types:
- content: Rich text pages with educational content, explanations, examples
- video: Pages with YouTube video embeds (provide video ID and title)
- quiz: Pages with interactive quiz questions (multiple choice, true/false, fill-in-the-blank)
- image: Pages with educational images and instructions

IMPORTANT: You must respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only.

Respond with this exact JSON structure:
{
  "pages": [
    {
      "id": "unique-id-1",
      "title": "Page Title",
      "pageType": "content|video|quiz|image",
      "content": "HTML content for content pages (can include <p>, <h2>, <ul>, <li>, <strong>, <em> tags)",
      "videoData": {
        "videoId": "youtube-video-id",
        "videoUrl": "https://www.youtube.com/watch?v=...",
        "title": "Video Title",
        "description": "Video description",
        "instructions": "Instructions for students"
      },
      "quizData": {
        "questions": [
          {
            "id": "question-id",
            "type": "multiple-choice|true-false|fill-blank",
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Option 1",
            "explanation": "Explanation of the answer"
          }
        ],
        "settings": {
          "shuffle": false,
          "showAnswers": true,
          "allowRetry": true
        }
      },
      "imageData": {
        "imageUrl": "https://example.com/image.jpg",
        "instructions": "Instructions for viewing the image"
      }
    }
  ],
  "subject": "${subject || ''}",
  "gradeLevel": "${gradeLevel || ''}",
  "settings": {
    "showNavigation": true,
    "showProgress": true,
    "requireCompletion": false
  }
}

Requirements:
- Each page must have a unique id (use UUID format or simple unique strings)
- Content pages should have rich, educational HTML content appropriate for ${gradeLevel || 'the grade level'}
- Video pages must include a valid YouTube video ID (search for educational videos about "${topic}")
- Quiz pages should have 2-5 questions relevant to the content
- Image pages should include educational image URLs and clear instructions
- Make content age-appropriate and engaging
- Ensure pages flow logically from one to the next
- Use clear, educational language

Remember: Respond with ONLY the JSON object, nothing else.`;

    const requestBody = {
      model: 'gpt-4', // Use GPT-4 for better structured output
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no additional text. The response must be parseable JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from AI');
    }

    // Parse JSON from the response
    let bookData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        bookData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object directly
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          bookData = JSON.parse(jsonObjectMatch[0]);
        } else {
          bookData = JSON.parse(content);
        }
      }
      console.log('[AI Service] Successfully parsed book data:', bookData);
    } catch (parseError) {
      console.error('[AI Service] Failed to parse JSON response:', parseError);
      console.log('[AI Service] Raw content:', content);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate and format pages
    if (!bookData.pages || !Array.isArray(bookData.pages)) {
      throw new Error('AI response does not contain valid pages array');
    }

    // Transform pages to match our BookPage interface
    const formattedPages = bookData.pages.map((page, index) => {
      const formattedPage = {
        id: page.id || `page-${Date.now()}-${index}`,
        title: page.title || `Page ${index + 1}`,
        pageType: page.pageType || 'content',
        content: page.content || '',
        order: index
      };

      // Add page-specific data
      if (page.pageType === 'video' && page.videoData) {
        formattedPage.videoData = {
          videoId: page.videoData.videoId || '',
          videoUrl: page.videoData.videoUrl || `https://www.youtube.com/watch?v=${page.videoData.videoId}`,
          title: page.videoData.title || '',
          description: page.videoData.description || '',
          instructions: page.videoData.instructions || ''
        };
      }

      if (page.pageType === 'quiz' && page.quizData) {
        formattedPage.quizData = {
          questions: (page.quizData.questions || []).map((q, qIndex) => ({
            id: q.id || `question-${index}-${qIndex}`,
            type: q.type || 'multiple-choice',
            question: q.question || '',
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || ''
          })),
          settings: {
            shuffle: page.quizData.settings?.shuffle || false,
            showAnswers: page.quizData.settings?.showAnswers !== false,
            allowRetry: page.quizData.settings?.allowRetry !== false
          }
        };
      }

      if (page.pageType === 'image' && page.imageData) {
        formattedPage.imageData = {
          imageUrl: page.imageData.imageUrl || '',
          instructions: page.imageData.instructions || ''
        };
      }

      return formattedPage;
    }).filter((page) => page.title && (page.content || page.videoData || page.quizData || page.imageData));

    if (formattedPages.length === 0) {
      throw new Error('No valid pages were generated. Please try again.');
    }

    // Return formatted interactive book data
    return {
      pages: formattedPages,
      subject: bookData.subject || subject || '',
      gradeLevel: bookData.gradeLevel || gradeLevel || '',
      settings: {
        showNavigation: bookData.settings?.showNavigation !== false,
        showProgress: bookData.settings?.showProgress !== false,
        requireCompletion: bookData.settings?.requireCompletion || false
      }
    };
  } catch (error) {
    console.error('[AI Service] Error generating interactive book:', error);
    throw error;
  }
};

export default {
  generateLessonPlan,
  generateEnhancedLessonPlan,
  generateAssignmentRubric,
  generateCompleteLessonContent,
  generateStudentFacingContent,
  generateFlashcards,
  generateInteractiveVideo,
  generateInteractiveBook
};

