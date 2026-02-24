const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies for the AI proxy
app.use(express.json({ limit: '50kb' }));

// AI proxy endpoint — keeps API key server-side (with retry for transient errors)
app.post('/api/ai/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 6000]; // exponential backoff in ms

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body)
      });

      // Retry on 503 (Service Unavailable) or 429 (Rate Limit)
      if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.log(`[AI Proxy] Got ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.text();
        return res.status(response.status).json({ error: errorData });
      }

      const data = await response.json();
      return res.json(data);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.log(`[AI Proxy] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error('[AI Proxy] Error after retries:', error.message);
      return res.status(500).json({ error: 'AI proxy request failed' });
    }
  }
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
