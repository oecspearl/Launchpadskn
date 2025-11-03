/**
 * AI Lesson Planner Service
 * Handles API calls to generate AI-powered lesson plans
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

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

Please provide a detailed lesson plan in the following JSON format:
{
  "lesson_title": "A clear, engaging lesson title",
  "learning_objectives": "List 3-5 specific learning objectives that students should achieve by the end of this lesson. Each objective should be measurable and clear.",
  "lesson_plan": "Provide a detailed step-by-step lesson plan including:\n1. Introduction/Warm-up (5-10 minutes)\n2. Main Content (with clear explanations and activities)\n3. Practice/Application activities\n4. Assessment/Check for understanding\n5. Closure/Summary\nMake it appropriate for ${duration} minutes.",
  "homework_description": "Provide a meaningful homework assignment that reinforces the lesson content and extends learning. Include specific instructions."
}

Make the lesson plan engaging, age-appropriate for ${gradeLevel}, and aligned with best educational practices. Ensure activities are practical and can be executed in a classroom setting.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational lesson planner. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
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

export default {
  generateLessonPlan
};

