// Vercel serverless function: POST /api/ai/chat
// Generic chat proxy — keeps provider API keys server-side.
// Routes to OpenAI or Anthropic (by request `provider`/model or AI_PROVIDER env),
// with automatic fallback to the other provider on auth/availability errors.
const { callChat } = require('../_lib/aiProxy');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'No AI provider configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY)' });
  }

  const result = await callChat(req.body || {});
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(200).json(result.data);
};
