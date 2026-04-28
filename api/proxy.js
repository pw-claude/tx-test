// api/proxy.js
// Proxies all requests to api.createsend.com, forwarding auth and body.
// Called by the frontend as: POST /api/proxy
// Body: { method, path, apiKey, body? }

export default async function handler(req, res) {
  // Allow CORS from same origin (Vercel serves frontend on same domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { method, path, apiKey, body } = req.body || {};

  if (!apiKey) return res.status(400).json({ error: 'apiKey is required' });
  if (!path)   return res.status(400).json({ error: 'path is required' });

  const url = 'https://api.createsend.com' + path;
  const authHeader = 'Basic ' + Buffer.from(apiKey + ':x').toString('base64');

  const fetchOpts = {
    method: method || 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(body);
  }

  try {
    const upstream = await fetch(url, fetchOpts);
    const responseText = await upstream.text();

    let data;
    try { data = JSON.parse(responseText); }
    catch { data = { raw: responseText }; }

    // Forward the exact status code from Campaign Monitor
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed', detail: err.message });
  }
}
