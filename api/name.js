// POST /api/name {a:{name,symbol,mint}, b:{...}, shape, salt} -> {name, ticker, lore, line}
// Written by an AI model through Vercel AI Gateway. If no model answers, the browser uses the house generator instead.
const L = require('./_lib');
const MODELS = ['openai/gpt-4.1-mini', 'openai/gpt-4o-mini', 'google/gemini-2.5-flash', 'anthropic/claude-haiku-4.5'];
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
function prompt(a, b, shape) {
  return [{ role: 'system', content: 'You name Italian-brainrot creatures for a memecoin launchpad. Every creature is born when two Solana memecoins are boiled in one pot of pasta. Reply with JSON only.' },
    { role: 'user', content: `Parent A: "${clean(a.name, 40)}" ($${clean(a.symbol, 12)}). Parent B: "${clean(b.name, 40)}" ($${clean(b.symbol, 12)}). Its body is ${clean(shape, 20)} pasta.
Return JSON with exactly these keys:
"name": a two-word sing-song pseudo-Italian name that audibly blends both parents, in the style of Italian brainrot names (example: "Bonkolino Fartellini"). Max 28 characters. No real people, no slurs.
"ticker": 3 to 10 uppercase letters taken from the name.
"lore": one absurd English sentence, max 170 characters, about how it was born from both parents. Mention both tickers.
"line": the dramatic line it shouts on stage in Italian (simple, funny, max 120 characters), starting with its own name.
No price talk, no promises, no calls to buy.` }];
}
async function ask(model, messages, token) {
  const r = await L.get('https://ai-gateway.vercel.sh/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({ model, messages, temperature: 1, max_tokens: 400, response_format: { type: 'json_object' } }) }, 15000);
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && (j.error.message || j.error.type)) || ('gateway ' + r.status));
  const txt = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || ''; const m = /\{[\s\S]*\}/.exec(txt); if (!m) throw new Error('no json');
  const o = JSON.parse(m[0]);
  const out = { name: clean(o.name, 32), ticker: clean(o.ticker, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''), lore: clean(o.lore, 220), line: clean(o.line, 160) };
  if (out.name.length < 4 || out.ticker.length < 2 || !out.lore || !out.line) throw new Error('incomplete');
  return out;
}
module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { ok: false, error: 'POST only' });
  const b = await L.body(req); const A = b.a || {}, B = b.b || {};
  if (!A.symbol || !B.symbol) return L.send(res, 400, { ok: false, error: 'two parents needed' });
  const token = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (!token) return L.send(res, 503, { ok: false, error: 'no AI key on this deployment' });
  let last;
  for (const model of MODELS) { try { const t0 = Date.now(); const out = await ask(model, prompt(A, B, b.shape || 'rotini'), token); return L.send(res, 200, { ok: true, by: 'ai', model, ms: Date.now() - t0, ...out }); } catch (e) { last = e; } }
  L.send(res, 503, { ok: false, error: 'no model answered: ' + String(last && last.message || last).slice(0, 120) });
});
