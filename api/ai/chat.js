// Vercel serverless function: POST /api/ai/chat
// Generic OpenAI chat proxy — keeps OPENAI_API_KEY server-side.
const { callOpenAIWithRetry } = require('../_lib/aiProxy');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const result = await callOpenAIWithRetry(apiKey, req.body);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(200).json(result.data);
};
