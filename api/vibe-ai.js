export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server not configured' });

  const body = req.body || {};
  const clip = (s, n) => String(s ?? '').slice(0, n);
  const mode = ['analyze', 'improve', 'ask'].includes(body.mode) ? body.mode : 'ask';
  const lang = { en: 'English', hi: 'Hindi', mr: 'Marathi' }[body.lang] || 'English';
  const message = clip(body.message, 800);
  const context = clip(body.context, 5000);
  const title = clip(body.contextTitle, 80);
  const history = (Array.isArray(body.history) ? body.history : []).slice(-6)
    .map(h => `${h.role === 'user' ? 'User' : 'Vibe AI'}: ${clip(h.text, 600)}`).join('\n');

  const system = `You are Vibe AI, the built-in assistant of VibeClash, a website with AI topic quizzes, friend quizzes, squad votes, trending posts and shareable story cards. Always reply in ${lang}. Be practical, specific and concise. Never invent features the website does not have. If you are unsure of a fact, say so.`;

  let task;
  if (mode === 'analyze') {
    task = `Analyze the website section "${title}" given below. Reply in three parts: 1) What works well (2-3 points). 2) Problems with clarity, mobile use, trust or accuracy (2-4 points). 3) Exact fixes, ordered by impact.`;
  } else if (mode === 'improve') {
    task = `Rewrite the text of the website section "${title}" given below so it is clear, engaging, accurate and easy to read on a phone. Keep the same meaning and structure. Output only the improved text. You may add one very short first line as a note.`;
  } else {
    task = `Answer the user's question. If a website section is given, use it as context.`;
  }

  const parts = [task];
  if (context) parts.push(`SECTION CONTENT:\n${context}`);
  if (history) parts.push(`CONVERSATION SO FAR:\n${history}`);
  if (message) parts.push(`USER MESSAGE:\n${message}`);
  else if (mode !== 'ask') parts.push('USER MESSAGE: (none, just do the task)');

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: parts.join('\n\n') }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 1200 }
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI provider error' });
    const data = await r.json();
    const reply = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || null });
  } catch {
    return res.status(500).json({ error: 'Request failed' });
  }
}
