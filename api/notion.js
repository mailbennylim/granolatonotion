// Vercel serverless function — same logic as the Netlify version,
// but Vercel expects functions in an /api folder and uses a different
// export format: instead of exports.handler, it uses export default
// with a standard Request/Response signature.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { path, token, method = 'GET', body } = req.body;

  if (!path || !token) {
    return res.status(400).json({ message: 'Missing path or token' });
  }

  try {
    const notionRes = await fetch(`https://api.notion.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await notionRes.json();
    return res.status(notionRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
