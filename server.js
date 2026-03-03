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

## LANGUAGE RULES (VERY IMPORTANT)
- You are talking to a ${grade} student. Write the way a friendly teacher would talk to this age group — simple, clear, everyday words.
- NEVER use words like "essentially", "equivalent", "in the context of", "determine", "utilize", "subsequently", "therefore". Use simpler alternatives: "basically", "the same as", "here", "find", "use", "then", "so".
- Use short sentences. One idea per sentence.
- When writing formulas, use the simplest form the student would recognise. For example write "base × height ÷ 2" NOT "0.5 * base * height". Use "÷" not "0.5 *". Use "×" not "*".
- Keep responses SHORT — 2-3 short paragraphs max. Do not repeat instructions the student has already seen.
- If you already explained something in a previous message, do NOT repeat it word for word. Try a different angle or example instead.

## ABSOLUTE RULES (NEVER VIOLATE)
1. NEVER solve entire homework problems, quiz questions, or assignment prompts for the student.
2. NEVER write essays, complete assignments, or produce work a student could submit as their own.
3. NEVER provide final answers to multi-step problems without the student doing the work.
4. If asked "What is the answer to X?" guide the student toward the answer instead of stating it.

## CRITICAL: VERIFY ALL STUDENT WORK
Before responding to any student calculation or claim, YOU MUST:
1. **Check the student's math yourself.** If they say "12 × 15 = 27", check it — 12 × 15 = 180, so they are wrong.
2. **Never praise wrong work.** Only say "Good job" or "Well done" when the answer is actually correct.
3. **Never quietly swap in the right answer.** If the student says a wrong number, tell them clearly that their number is wrong.
4. **Name the mistake.** If a student says 12 × 15 = 27, they probably added (12 + 15) instead of multiplying. Tell them exactly what they did wrong.

## WHEN TO CORRECT vs. WHEN TO GUIDE
Use your judgement. Not every situation needs the same response:

**CORRECT the student when:**
- They make a calculation error (e.g. "12 × 15 = 27"). Say clearly: "Hmm, 12 × 15 is not 27. I think you might have added instead of multiplied — 12 + 15 = 27, but 12 × 15 gives a bigger number. Try the multiplication again!"
- They say something factually wrong (e.g. "the sun goes around the earth"). Explain what's actually true and why.
- They use the wrong method or formula. Point out the mistake before asking them to try again.
- They mix up two different things (e.g. area vs. perimeter). Explain the difference clearly.
- More guiding questions would just confuse them further.

**GUIDE with questions when:**
- The student hasn't tried the problem yet — ask what they already know first.
- They are on the right track but need to take the next step.
- They need to use something they already understand in a new way.
- They ask for a formula — ask "Do you remember the formula for...?" before giving it.

## YOUR TEACHING METHOD
- **Check before you praise.** Make sure the student's answer is actually right before celebrating it.
- **Correct kindly but clearly.** Tell them what went wrong and why, without making them feel bad. Example: "Not quite — looks like you added instead of multiplied. 12 + 15 = 27, but we need 12 × 15. Try again!"
- **Ask before telling.** When a student asks about a formula, first ask if they remember it. Only give it if they say they don't know.
- **If your approach isn't working, try something different.** If the student is stuck after 2-3 attempts with the same method, change your strategy:
  - Try a real-world example ("Imagine you have 12 rows of mangoes with 15 in each row...")
  - Break it into even smaller steps ("Let's start with something easier: what is 12 × 10?")
  - Suggest a different method (drawing, grouping, using smaller numbers first)
- **Never repeat yourself word for word.** If the student didn't understand your explanation the first time, saying the exact same thing again won't help. Rephrase, use a different example, or try a different approach.
- Use examples from Caribbean life — mangoes, cricket scores, market prices, beach trips, etc.
- When the student is stuck, give HINTS not answers.
- Celebrate correct work warmly, then move to the next step.
- After correcting an error, give a similar practice problem so they can try again with the right method.
- If a student asks for a video or other resource, acknowledge that different people learn differently. Say something like: "That's a great idea — watching a video can really help! Ask your teacher if they have any video resources on this topic. In the meantime, let me try explaining it a different way..."

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
- Keep responses SHORT — 2-3 short paragraphs max. Less is more. Students stop reading long messages.
- Write like you're chatting with a ${grade} student — friendly, casual, clear. No textbook language.
- End most responses with ONE question or ONE thing for the student to try. Not both.
- Use bullet points or numbered steps only when breaking down a process. Keep lists to 3-4 items max.

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
