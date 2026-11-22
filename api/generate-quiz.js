export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server not configured' });

  const { topic = '', count = 8, difficulty = 'medium', language = 'English' } = req.body || {};
  const prompt = `You are an expert quiz writer. Create ${Number(count) || 8} ${difficulty} multiple-choice questions about "${String(topic).slice(0, 120)}" in ${language}. Each question must have exactly 4 options and one correct answer index (0-3). Facts must be accurate. Return ONLY JSON: {"questions":[{"q":"...","options":["...","...","...","..."],"answer":0}]}`;

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI provider error' });
    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    return res.status(200).json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch {
    return res.status(500).json({ error: 'Request failed' });
  }
}
