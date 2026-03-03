const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies for the AI proxy
app.use(express.json({ limit: '50kb' }));

// ─── Search result cache (30-min TTL) ─────────────────────────────────
const searchCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function getCachedSearch(key) {
  const entry = searchCache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  if (entry) searchCache.delete(key);
  return null;
}

function setCachedSearch(key, data) {
  searchCache.set(key, { data, time: Date.now() });
  // Evict old entries if cache grows too large
  if (searchCache.size > 200) {
    const oldest = searchCache.keys().next().value;
    searchCache.delete(oldest);
  }
}

// ─── YouTube Search (server-side) ─────────────────────────────────────
async function searchYouTubeVideos(query, maxResults = 2) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !query) return [];

  const cacheKey = `yt:${query.toLowerCase().trim()}:${maxResults}`;
  const cached = getCachedSearch(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${query} educational tutorial`,
      type: 'video',
      videoCategoryId: '27',
      maxResults: String(Math.min(maxResults, 5)),
      order: 'relevance',
      safeSearch: 'strict',
      key: apiKey
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!response.ok) {
      console.error('[Tutor Search] YouTube API error:', response.status);
      return [];
    }

    const data = await response.json();
    const videos = (data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || '',
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    setCachedSearch(cacheKey, videos);
    return videos;
  } catch (err) {
    console.error('[Tutor Search] YouTube error:', err.message);
    return [];
  }
}

// ─── Google Custom Search (server-side) ───────────────────────────────
async function searchWebResources(query, maxResults = 2) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !engineId || !query) return [];

  const cacheKey = `web:${query.toLowerCase().trim()}:${maxResults}`;
  const cached = getCachedSearch(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: engineId,
      q: `${query} educational`,
      num: String(Math.min(maxResults, 5)),
      safe: 'active'
    });

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!response.ok) {
      console.error('[Tutor Search] Google Search API error:', response.status);
      return [];
    }

    const data = await response.json();
    const results = (data.items || []).map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || '',
      source: new URL(item.link).hostname.replace('www.', '')
    }));

    setCachedSearch(cacheKey, results);
    return results;
  } catch (err) {
    console.error('[Tutor Search] Google Search error:', err.message);
    return [];
  }
}

// ─── OpenAI Tool Definitions for Tutor ────────────────────────────────
const TUTOR_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_youtube_videos',
      description: 'Search YouTube for educational videos. Use when: the student asks for a video, needs a visual explanation, is stuck and a video would help, or seeing the concept demonstrated would benefit them.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query — include the topic and subject for best results' },
          max_results: { type: 'integer', description: 'Number of results (1-3)' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_web_resources',
      description: 'Search the web for educational articles, tutorials, and interactive tools. Use when: the student needs written explanations, practice exercises, or reference material beyond what you can provide in chat.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query — include the topic and educational context' },
          max_results: { type: 'integer', description: 'Number of results (1-3)' }
        },
        required: ['query']
      }
    }
  }
];

// Execute a tool call from OpenAI
async function executeTutorToolCall(toolCall) {
  const { name, arguments: argsStr } = toolCall.function;
  let args;
  try {
    args = JSON.parse(argsStr);
  } catch {
    return { result: '[]', type: null, data: [] };
  }

  if (name === 'search_youtube_videos') {
    const results = await searchYouTubeVideos(args.query, args.max_results || 2);
    return { result: JSON.stringify(results), type: 'youtube', data: results };
  }
  if (name === 'search_web_resources') {
    const results = await searchWebResources(args.query, args.max_results || 2);
    return { result: JSON.stringify(results), type: 'web', data: results };
  }
  return { result: '[]', type: null, data: [] };
}

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

## CRITICAL: VERIFY ALL STUDENT WORK AND ACKNOWLEDGE CORRECT ANSWERS
Before responding to any student calculation or claim, YOU MUST:
1. **Check the student's math yourself.** If they say "12 × 15 = 27", check it — 12 × 15 = 180, so they are wrong.
2. **Never praise wrong work.** Only say "Good job" or "Well done" when the answer is actually correct.
3. **Never quietly swap in the right answer.** If the student says a wrong number, tell them clearly that their number is wrong.
4. **Name the mistake.** If a student says 12 × 15 = 27, they probably added (12 + 15) instead of multiplying. Tell them exactly what they did wrong.
5. **When the student gives the correct answer, CONFIRM IT immediately.** Do NOT ask them to recalculate something they already answered correctly. If they say "180 ÷ 2 = 90", and that's right, say "Yes! 90 is correct!" and move on. Asking a student to redo correct work is frustrating and discouraging.
6. **Read the student's FULL message.** If a student writes "180 ÷ 2, which is 90" — they already gave the answer (90). Do not respond as if they only said "180 ÷ 2" and ignore the "which is 90" part.

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
- **Ask before telling.** When a student asks about a formula or method, ALWAYS ask if they remember it first. Example: "Do you remember the formula for the area of a triangle?" Only provide it after they say they don't know or give a wrong formula. NEVER skip this step and jump straight to giving the formula.
- **When a student struggles with arithmetic, use the break-apart method.** Do NOT teach long multiplication with carry-overs — it's confusing in text. Instead, break the multiplication into easier parts. Example for 12 × 15: "Let's break this up! What is 12 × 10? And what is 12 × 5? Now add those two answers together." This is much easier to follow.
- **If your approach isn't working, try something different.** If the student is stuck after 2-3 attempts with the same method, change your strategy:
  - Try a real-world example ("Imagine you have 12 rows of mangoes with 15 in each row...")
  - Break it into even smaller steps ("Let's start with something easier: what is 12 × 10?")
  - Suggest a different method (drawing, grouping, using smaller numbers first)
- **Never repeat yourself word for word.** If the student didn't understand your explanation the first time, saying the exact same thing again won't help. Rephrase, use a different example, or try a different approach.
- Use examples from Caribbean life — mangoes, cricket scores, market prices, beach trips, etc.
- When the student is stuck, give HINTS not answers.
- Celebrate correct work warmly, then move to the next step.
- After correcting an error, give a similar practice problem so they can try again with the right method.
## RESOURCES AND TOOLS
You have tools that can search for educational videos and web resources. Use them wisely:

**When to search:**
- The student asks for a video, link, or extra help
- The student is stuck and a visual explanation or tutorial would help
- You think a video would make the concept clearer
- The student needs practice exercises or reference material

**How to use results:**
- Introduce resources naturally: "I found a great video that explains this!" — don't just dump links
- If no results come back, don't mention the failed search — just keep helping normally
- Don't search on every message — only when it would genuinely help
- Include the subject and grade level in your search queries for better results

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

// AI Tutor endpoint — constructs system prompt server-side, supports tool calling
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

  // Check if any search tools are available (keys configured)
  const hasYouTube = !!process.env.YOUTUBE_API_KEY;
  const hasWebSearch = !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID);
  const availableTools = TUTOR_TOOLS.filter(t => {
    if (t.function.name === 'search_youtube_videos') return hasYouTube;
    if (t.function.name === 'search_web_resources') return hasWebSearch;
    return false;
  });

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: openAIMessages,
    temperature: 0.7,
    max_tokens: 800,
    presence_penalty: 0.3,
    frequency_penalty: 0.2
  };

  // Only include tools if at least one search API is configured
  if (availableTools.length > 0) {
    requestBody.tools = availableTools;
    requestBody.tool_choice = 'auto';
  }

  let result = await callOpenAIWithRetry(apiKey, requestBody);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  // Handle tool calls (function calling loop)
  const collectedResources = { youtube: [], web: [] };
  const choice = result.data?.choices?.[0];

  if (choice?.finish_reason === 'tool_calls' && choice.message?.tool_calls) {
    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      choice.message.tool_calls.map(async (tc) => {
        const execResult = await executeTutorToolCall(tc);
        if (execResult.type === 'youtube') collectedResources.youtube.push(...execResult.data);
        if (execResult.type === 'web') collectedResources.web.push(...execResult.data);
        return {
          role: 'tool',
          tool_call_id: tc.id,
          content: execResult.result
        };
      })
    );

    // Send tool results back to OpenAI for final response
    const followUpMessages = [
      ...openAIMessages,
      choice.message,
      ...toolResults
    ];

    const followUpBody = {
      model: 'gpt-4o-mini',
      messages: followUpMessages,
      temperature: 0.7,
      max_tokens: 800,
      presence_penalty: 0.3,
      frequency_penalty: 0.2
    };

    result = await callOpenAIWithRetry(apiKey, followUpBody);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
  }

  // Attach resources if any were found
  const hasResources = collectedResources.youtube.length > 0 || collectedResources.web.length > 0;
  const responseData = { ...result.data };
  if (hasResources) {
    responseData.resources = collectedResources;
  }

  return res.json(responseData);
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
