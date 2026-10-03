// Reads rot.actor births from chain. Every launch carries the memo "rot:v1:<parentA>:<parentB>:<child>:<salt>" plus the read-only REG key.
const L = require('./_lib'); const C = require('./_cfg'); const X = require('./_pda');
const PUMP = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const TOTAL = 793100000n * 1000000n;
function parse(tx, sig, t) {
  if (!tx) return null; const logs = (tx.meta && tx.meta.logMessages) || [];
  const memo = logs.map(l => /Memo \(len \d+\): "(rot:v1:[^"]+)"/.exec(l)).find(Boolean); if (!memo) return null;
  const [, , a, b, mint, salt] = memo[1].split(':'); if (![a, b, mint].every(x => L.B58.test(x || ''))) return null;
  const keys = tx.transaction.message.accountKeys || []; const dev = keys[0] && (keys[0].pubkey || keys[0]);
  return { mint, a, b, salt: /^[a-z0-9.]{1,20}$/.test(salt || '') ? salt : '', dev: String(dev || ''), sig, t: (t || 0) * 1000 };
}
async function getTx(sig) {
  try { return await L.rpc('getTransaction', [sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }]); }
  catch (e) { return null; }
}
async function meta(mints) {
  const out = {}; const u = [...new Set(mints)].filter(m => L.B58.test(m));
  for (let i = 0; i < u.length; i += 90) { try { const j = await L.jup(u.slice(i, i + 90).join(',')); for (const t of j || []) out[t.id] = L.tok(t); } catch (e) { } }
  return out;
}
async function curves(mints) {
  const out = {}; if (!mints.length) return out;
  try { const pdas = mints.map(m => X.pda([Buffer.from('bonding-curve'), X.b58d(m)], PUMP)); const acc = await L.rpc('getMultipleAccounts', [pdas, { encoding: 'base64', commitment: 'confirmed' }]);
    (acc.value || []).forEach((a, i) => { if (!a) return; const b = Buffer.from(a.data[0], 'base64'); const rTok = b.readBigUInt64LE(24); const done = b[48] === 1; out[mints[i]] = done ? 100 : Math.max(0, Math.min(100, Number((TOTAL - rTok) * 10000n / TOTAL) / 100)); }); } catch (e) { }
  return out;
}
function family(list) {
  const by = Object.fromEntries(list.map(c => [c.mint, c])); const memo = {};
  const gen = (m, d = 0) => { if (!by[m] || d > 60) return 0; if (memo[m] != null) return memo[m]; const c = by[m]; return memo[m] = 1 + Math.max(gen(c.a, d + 1), gen(c.b, d + 1)); };
  const kids = {}; for (const c of list) { kids[c.a] = (kids[c.a] || 0) + 1; kids[c.b] = (kids[c.b] || 0) + 1; }
  for (const c of list) { c.gen = gen(c.mint); c.kids = kids[c.mint] || 0; }
  return kids;
}
async function list() {
  const sigs = await L.rpc('getSignaturesForAddress', [C.REG, { limit: 120, commitment: 'confirmed' }]); const ok = (sigs || []).filter(s => !s.err);
  const txs = []; for (let i = 0; i < ok.length; i += 20) txs.push(...await Promise.all(ok.slice(i, i + 20).map(s => getTx(s.signature))));
  const coins = txs.map((tx, i) => parse(tx, ok[i].signature, ok[i].blockTime)).filter(Boolean);
  const seen = new Set(); const uniq = coins.filter(c => !seen.has(c.mint) && seen.add(c.mint));
  const [m, cv] = await Promise.all([meta(uniq.flatMap(c => [c.mint, c.a, c.b])), curves(uniq.map(c => c.mint))]);
  for (const c of uniq) { Object.assign(c, m[c.mint] || {}, { mint: c.mint }); c.curve = cv[c.mint] ?? null; c.pa = m[c.a] || { mint: c.a }; c.pb = m[c.b] || { mint: c.b }; }
  const kids = family(uniq);
  const parents = Object.entries(kids).sort((x, y) => y[1] - x[1]).slice(0, 12).map(([mint, n]) => ({ ...(m[mint] || { mint }), kids: n }));
  return { coins: uniq, parents };
}
async function byMint(mint) {
  let before, oldest = null;
  for (let p = 0; p < 3; p++) { const s = await L.rpc('getSignaturesForAddress', [mint, { limit: 1000, before, commitment: 'confirmed' }]); if (!s || !s.length) break; oldest = s[s.length - 1]; if (s.length < 1000) break; before = oldest.signature; }
  if (!oldest) return null;
  const c = parse(await getTx(oldest.signature), oldest.signature, oldest.blockTime); if (!c || c.mint !== mint) return null;
  const [m, cv] = await Promise.all([meta([c.mint, c.a, c.b]), curves([c.mint])]);
  Object.assign(c, m[c.mint] || {}, { mint: c.mint }); c.curve = cv[c.mint] ?? null; c.pa = m[c.a] || { mint: c.a }; c.pb = m[c.b] || { mint: c.b }; c.gen = null; return c;
}
module.exports = { list, byMint, meta };
