/**
 * AI Lesson Planner Service
 * Handles API calls to generate AI-powered lesson plans
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

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
    throw new Error('OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
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
      // Handle specific assessment keys
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
      // Handle any other keys
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
    throw new Error('OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
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

3. LESSON COMPONENTS (with strict timing)
   a) Prompter/Hook (1-3 minutes)
      - Engaging opening activity to capture attention
   
   b) Introduction (2-3 minutes)
      - Connect to prior knowledge
      - State lesson objectives
   
   c) Concept Development and Practice (${Math.floor(duration * 0.5)}-${Math.floor(duration * 0.6)} minutes)
      - Main teaching content
      - Step-by-step activities
      - Student actions clearly specified
      - Teacher actions during activities
      - Integration of learning styles and multiple intelligences
      - Formative assessment checkpoints
   
   d) Time to Reflect and Share (3-5 minutes)
      - Students reflect on learning
      - Share key takeaways
      - Address any questions

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
  "lesson_plan": "Complete detailed lesson plan with all sections above, formatted clearly with proper structure",
  "homework_description": "Clear homework assignment with instructions",
  "materials_list": "List of all required materials",
  "assessment_strategies": "Formative and summative assessment approaches"
}

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

export default {
  generateLessonPlan,
  generateEnhancedLessonPlan
};

