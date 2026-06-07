// Vercel serverless function: POST /api/ai/tutor
// Builds the Socratic tutor system prompt server-side and supports tool calling.
const {
  TUTOR_TOOLS,
  executeTutorToolCall,
  callOpenAIWithRetry,
  buildTutorSystemPrompt
} = require('../_lib/aiProxy');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const { messages, studentProfile, currentContext } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const systemPrompt = buildTutorSystemPrompt(studentProfile, currentContext);

  const openAIMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20)
  ];

  // Only expose tools whose API keys are configured
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

  if (availableTools.length > 0) {
    requestBody.tools = availableTools;
    requestBody.tool_choice = 'auto';
  }

  let result = await callOpenAIWithRetry(apiKey, requestBody);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  // Function-calling loop
  const collectedResources = { youtube: [], web: [] };
  const choice = result.data?.choices?.[0];

  if (choice?.finish_reason === 'tool_calls' && choice.message?.tool_calls) {
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

    const followUpBody = {
      model: 'gpt-4o-mini',
      messages: [...openAIMessages, choice.message, ...toolResults],
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

  const hasResources = collectedResources.youtube.length > 0 || collectedResources.web.length > 0;
  const responseData = { ...result.data };
  if (hasResources) {
    responseData.resources = collectedResources;
  }

  return res.status(200).json(responseData);
};
