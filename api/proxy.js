export default async function handler(req, res) {

 const allowedOrigins = [
  'https://www.skool.com',
  'https://skool.com',
  'https://land-tool-38we.vercel.app',
]; 

  const origin = req.headers.origin || '';
if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
} else {
  return res.status(403).json({ error: 'Forbidden: origin not allowed' });
}

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MLIT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { endpoint, ...params } = req.query;

  const allowedEndpoints = ['XIT001', 'XIT002', 'XKT001'];
  if (!endpoint || !allowedEndpoints.includes(endpoint)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  for (const [key, value] of Object.entries(params)) {
    if (!/^[a-zA-Z0-9_\-]+$/.test(String(value))) {
      return res.status(400).json({ error: `Invalid parameter: ${key}` });
    }
  }

  const query = new URLSearchParams(params).toString();
  const url = `https://www.reinfolib.mlit.go.jp/ex-api/external/${endpoint}?${query}`;

  try {
    const response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `API error: ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
