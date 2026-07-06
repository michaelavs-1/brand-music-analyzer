// Vercel Serverless Function — proxies requests to the OpenAI API.
// The API key is read from the OPENAI_API_KEY environment variable and is
// NEVER exposed to the browser. The client posts the same body it would have
// sent to https://api.openai.com/v1/chat/completions.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(500).json({ error: { message: 'Server missing OPENAI_API_KEY environment variable' } });
    return;
  }

  // req.body is auto-parsed by Vercel for application/json; fall back to raw string.
  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
  }
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: { message: 'Invalid JSON body' } });
    return;
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: { message: 'Proxy error: ' + (err && err.message ? err.message : String(err)) } });
  }
};
