export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    if (url.pathname !== '/generate' || request.method !== 'POST') {
      return cors(new Response('Not found', { status: 404 }));
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return cors(new Response('Invalid JSON', { status: 400 }));
    }

    const { topic, language, promptType, mode } = body;
    if (!topic || !language || !promptType || !mode) {
      return cors(new Response('Missing fields', { status: 400 }));
    }

    const answerRule =
      mode === 'scored'
        ? 'answer MUST be exactly "Yes" or "No"'
        : mode === 'flip'
        ? 'answer is a concise 1–2 sentence explanation'
        : 'answer is an empty string ""';

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Generate exactly 10 "${promptType}" about "${topic}" in ${language} language.

Return ONLY a valid JSON array, no markdown, no explanation. Each object must have exactly:
{"question": "...", "answer": "..."}

Rules:
- ${answerRule}
- Questions must be varied and engaging
- No duplicate questions`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return cors(new Response(`Anthropic error: ${err}`, { status: 502 }));
    }

    const data = await anthropicRes.json();
    const raw = data.content[0]?.text ?? '';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let cards;
    try {
      cards = JSON.parse(cleaned);
    } catch {
      return cors(new Response('Failed to parse AI response', { status: 502 }));
    }

    return cors(new Response(JSON.stringify(cards), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
  },
};

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'content-type');
  return new Response(response.body, { status: response.status, headers });
}
