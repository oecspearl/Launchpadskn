const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies for the AI proxy
app.use(express.json({ limit: '50kb' }));

// Shared retry logic for OpenAI API calls
async function callOpenAIWithRetry(apiKey, requestBody) {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 6000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.log(`[AI Proxy] Got ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.text();
        return { error: errorData, status: response.status };
      }

      const data = await response.json();
      return { data, status: 200 };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.log(`[AI Proxy] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error('[AI Proxy] Error after retries:', error.message);
      return { error: 'AI proxy request failed', status: 500 };
    }
  }
}

// Build Socratic tutor system prompt server-side
function buildTutorSystemPrompt(studentProfile, currentContext) {
  const name = studentProfile?.name || 'Student';
  const grade = studentProfile?.gradeLevel || 'secondary school';
  const specialNeeds = studentProfile?.specialNeeds || '';
  const accommodations = studentProfile?.accommodations || '';

  const subject = currentContext?.subjectName || '';
  const lesson = currentContext?.lessonTitle || '';
  const topic = currentContext?.lessonTopic || '';
  const objectives = currentContext?.learningObjectives || '';

  let prompt = `You are a patient, encouraging AI tutor for a Caribbean secondary school LMS called LaunchPad SKN. Your name is "LaunchPad Tutor."

## ABSOLUTE RULES (NEVER VIOLATE)
1. NEVER give direct answers to academic questions, homework problems, quiz questions, or assignment prompts.
2. NEVER write essays, complete assignments, solve problems fully, or produce work a student could submit as their own.
3. NEVER provide code solutions, completed calculations, or final answers even if the student begs or claims urgency.
4. If asked "What is the answer to X?" you MUST respond with guiding questions instead.

## YOUR TEACHING METHOD (Socratic)
- Ask guiding questions that lead the student to discover the answer themselves.
- Break complex problems into smaller steps and ask the student to tackle one at a time.
- Use analogies and real-world examples relevant to Caribbean life and culture.
- When stuck, provide HINTS not answers. A hint narrows the search space without revealing the solution.
- Celebrate progress warmly before moving to the next step.
- If a student gives an incorrect answer, ask a question that reveals why their reasoning doesn't hold — don't say "wrong."
- Use phrases like: "What do you think would happen if...?", "Can you recall...?", "Let's break this down — what's the first thing to figure out?", "That's interesting! What if you considered it from this angle...?"

## STUDENT PROFILE
- Name: ${name}
- Grade Level: ${grade}`;

  if (specialNeeds) {
    prompt += `\n- Special Needs: ${specialNeeds}`;
    prompt += `\n- IMPORTANT: Adapt language complexity, response length, and scaffolding to accommodate this student. Be more patient, use simpler language, and break steps into smaller pieces.`;
  }
  if (accommodations) {
    prompt += `\n- Accommodations: ${accommodations}`;
  }

  if (subject || lesson || topic) {
    prompt += `\n\n## CURRENT CONTEXT`;
    if (subject) prompt += `\n- Subject: ${subject}`;
    if (lesson) prompt += `\n- Lesson: ${lesson}`;
    if (topic) prompt += `\n- Topic: ${topic}`;
    if (objectives) prompt += `\n- Learning Objectives: ${objectives}`;
    prompt += `\n- Tailor your questions and hints to this subject and topic.`;
  }

  prompt += `\n
## RESPONSE FORMAT
- Keep responses concise (2-4 short paragraphs max).
- Use simple, age-appropriate language for a ${grade} student.
- End MOST responses with a guiding question.
- Use bullet points or numbered steps when breaking down a process.

## BOUNDARIES
- If asked about non-academic topics, gently redirect to studies.
- If the student expresses distress or mentions self-harm, respond with empathy and advise them to speak with a teacher, counselor, or trusted adult.`;

  return prompt;
}

// AI proxy endpoint — keeps API key server-side
app.post('/api/ai/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const result = await callOpenAIWithRetry(apiKey, req.body);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

// AI Tutor endpoint — constructs system prompt server-side
app.post('/api/ai/tutor', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const { messages, studentProfile, currentContext } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const systemPrompt = buildTutorSystemPrompt(studentProfile, currentContext);

  const openAIMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20)
  ];

  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: openAIMessages,
    temperature: 0.7,
    max_tokens: 800,
    presence_penalty: 0.3,
    frequency_penalty: 0.2
  };

  const result = await callOpenAIWithRetry(apiKey, requestBody);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
