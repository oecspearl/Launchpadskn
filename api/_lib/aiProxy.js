// Shared AI-proxy logic for Vercel serverless functions.
// Ported from server.js so the OpenAI key stays server-side.
// Files/dirs under api/ that start with "_" are NOT exposed as routes.

// ─── Search result cache (30-min TTL, per warm instance) ──────────────
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

// ─── Anthropic provider ───────────────────────────────────────────────
// Translates an OpenAI chat-completions request/response to/from Anthropic's
// Messages API so callers (chat + tutor, incl. tool-calling) stay unchanged.

function mapModelToAnthropic(model) {
  const m = (model || '').toLowerCase();
  if (m.startsWith('claude')) return model;
  return process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
}

function toAnthropicRequest(body) {
  const systemParts = [];
  const messages = [];

  for (const m of body.messages || []) {
    if (m.role === 'system') {
      if (typeof m.content === 'string') systemParts.push(m.content);
      continue;
    }
    if (m.role === 'tool') {
      // OpenAI tool result -> Anthropic tool_result block (in a user turn)
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }]
      });
      continue;
    }
    if (m.role === 'assistant' && Array.isArray(m.tool_calls)) {
      const content = [];
      if (m.content) content.push({ type: 'text', text: m.content });
      for (const tc of m.tool_calls) {
        let input = {};
        try { input = JSON.parse(tc.function.arguments || '{}'); } catch { /* ignore */ }
        content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
      }
      messages.push({ role: 'assistant', content });
      continue;
    }
    messages.push({ role: m.role, content: m.content });
  }

  // Large JSON generations (lesson plans/content) were written against the
  // GPT-3.5 token caps and truncate (-> invalid JSON). Claude supports more,
  // so give big requests headroom; leave small ones (e.g. the tutor) as-is.
  let maxTokens = body.max_tokens || 1024;
  if (maxTokens >= 2000) maxTokens = Math.max(maxTokens, 8192);

  const req = {
    model: mapModelToAnthropic(body.model),
    max_tokens: maxTokens,
    messages
  };
  if (systemParts.length) req.system = systemParts.join('\n\n');
  if (body.temperature != null) req.temperature = body.temperature;
  if (Array.isArray(body.tools) && body.tools.length) {
    req.tools = body.tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }));
  }
  return req;
}

function fromAnthropicResponse(data) {
  const blocks = Array.isArray(data.content) ? data.content : [];
  const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('');
  const toolUses = blocks.filter(b => b.type === 'tool_use');

  const message = { role: 'assistant', content: text || null };
  if (toolUses.length) {
    message.tool_calls = toolUses.map(tu => ({
      id: tu.id,
      type: 'function',
      function: { name: tu.name, arguments: JSON.stringify(tu.input || {}) }
    }));
  }

  const finishMap = { tool_use: 'tool_calls', end_turn: 'stop', max_tokens: 'length', stop_sequence: 'stop' };
  const usage = data.usage
    ? {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
      }
    : undefined;

  return {
    id: data.id,
    choices: [{ index: 0, message, finish_reason: finishMap[data.stop_reason] || 'stop' }],
    usage
  };
}

async function callAnthropicWithRetry(apiKey, requestBody) {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 6000];
  const anthropicBody = toAnthropicRequest(requestBody);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(anthropicBody)
      });

      if ((response.status === 529 || response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 6000));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.text();
        return { error: errorData, status: response.status };
      }

      const data = await response.json();
      return { data: fromAnthropicResponse(data), status: 200 };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 6000));
        continue;
      }
      console.error('[AI Proxy] Anthropic error after retries:', error.message);
      return { error: 'AI proxy request failed', status: 500 };
    }
  }
}

// ─── Provider dispatcher (OpenAI + Anthropic, with fallback) ───────────
function pickProvider(body) {
  if (body && body.provider) return String(body.provider).toLowerCase(); // per-request override
  if (process.env.AI_PROVIDER) return process.env.AI_PROVIDER.toLowerCase(); // operator override
  const model = ((body && body.model) || '').toLowerCase();
  if (model.startsWith('claude')) return 'anthropic';
  if (/^(gpt|o1|o3|o4)/.test(model)) return 'openai';
  return process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
}

function isFallbackError(result) {
  return [401, 403, 429, 500, 502, 503, 529].includes(result.status);
}

/**
 * Unified chat call. Routes to OpenAI or Anthropic based on the request's
 * `provider`/model (or AI_PROVIDER env), and falls back to the other provider
 * on auth/availability errors. Returns an OpenAI-shaped { data, status } / { error, status }.
 */
async function callChat(requestBody) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  let provider = pickProvider(requestBody);
  if (provider === 'openai' && !openaiKey && anthropicKey) provider = 'anthropic';
  if (provider === 'anthropic' && !anthropicKey && openaiKey) provider = 'openai';

  const tryProvider = (p) => {
    if (p === 'anthropic') {
      if (!anthropicKey) return Promise.resolve({ error: 'Anthropic API key not configured', status: 500 });
      return callAnthropicWithRetry(anthropicKey, requestBody);
    }
    if (!openaiKey) return Promise.resolve({ error: 'OpenAI API key not configured', status: 500 });
    const { provider: _p, ...openaiBody } = requestBody; // OpenAI rejects unknown fields
    return callOpenAIWithRetry(openaiKey, openaiBody);
  };

  let result = await tryProvider(provider);
  if (result.error && isFallbackError(result)) {
    const other = provider === 'openai' ? 'anthropic' : 'openai';
    const otherKey = other === 'openai' ? openaiKey : anthropicKey;
    if (otherKey) {
      console.log(`[AI Proxy] ${provider} failed (${result.status}); falling back to ${other}`);
      const fb = await tryProvider(other);
      if (!fb.error) return fb;
    }
  }
  return result;
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
5. NEVER give a formula, definition, or method UNLESS the student has first attempted to recall it. You MUST ask "Do you remember...?" and WAIT for their reply before providing any formula.

**EXAMPLE — Rule 5 in action:**
- Student: "How do I find the area of a triangle?"
- WRONG: "The area of a triangle is base × height ÷ 2. Now let's plug in..."  ← You gave the formula without asking!
- RIGHT: "Good question! Do you remember the formula for the area of a triangle? Give it a try!"  ← Now wait for the student to respond before saying anything else about the formula.

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
- They ask about a formula or method — you MUST ask "Do you remember...?" and wait for their reply (Absolute Rule #5). Never include the formula in the same message as the question.

## YOUR TEACHING METHOD
- **Check before you praise.** Make sure the student's answer is actually right before celebrating it.
- **Correct kindly but clearly.** Tell them what went wrong and why, without making them feel bad. Example: "Not quite — looks like you added instead of multiplied. 12 + 15 = 27, but we need 12 × 15. Try again!"
- **Ask before telling (see Absolute Rule #5).** When a student asks about a formula, concept, or method — your FIRST response must be a question like "Do you remember...?" or "What do you think the formula is?" You must WAIT for their reply. Only provide the formula AFTER they say they don't know or give a wrong one. Your response to a new topic should NEVER contain the formula itself.
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

**Worksheets and practice materials:**
- When a student asks for worksheets, exercises, or practice problems, use the web search tool.
- Add "worksheet", "practice problems", "exercises" to your search query alongside the topic.
- After finding resources, briefly explain what each one offers.

**Worked examples:**
- When a student asks for worked examples, provide 2-3 step-by-step examples directly.
- Use numbers and scenarios appropriate for the student's grade level.
- Show every step clearly. After examples, ask if they want to try one on their own.

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

module.exports = {
  TUTOR_TOOLS,
  executeTutorToolCall,
  callOpenAIWithRetry,
  callAnthropicWithRetry,
  callChat,
  buildTutorSystemPrompt
};
