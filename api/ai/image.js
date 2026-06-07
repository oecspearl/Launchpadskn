// Vercel serverless function: POST /api/ai/image
// Proxies OpenAI image generation (DALL·E) so the API key stays server-side.
// Returns OpenAI's response verbatim, so callers can read data.data[0].url.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const { prompt, model, n, size, quality } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A "prompt" string is required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'dall-e-3',
        prompt: prompt.slice(0, 4000),
        n: n || 1,
        size: size || '1024x1024',
        quality: quality || 'standard'
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Image generation failed' });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('[AI Image Proxy] Error:', err.message);
    return res.status(500).json({ error: 'Image proxy request failed' });
  }
};
