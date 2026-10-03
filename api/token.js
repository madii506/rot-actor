// GET /api/token?q=<mint | ticker | name> : one token by mint, or up to 8 matches for a ticker or name.
// Sources, in order: Jupiter token search, Dexscreener, pump.fun's own coin API.
const L = require('./_lib');
async function byMint(m) {
  try { const j = await L.jup(m); const t = (j || []).find(x => x.id === m); if (t) return { ...L.tok(t), via: 'jupiter' }; } catch (e) { }
  try { const d = await L.getJson('https://api.dexscreener.com/latest/dex/tokens/' + m, {}, 7000); const p = (d.pairs || []).find(x => x.baseToken && x.baseToken.address === m);
    if (p) return { mint: m, name: p.baseToken.name, symbol: p.baseToken.symbol, icon: (p.info && p.info.imageUrl) || null, mcap: p.marketCap || p.fdv || null, price: +p.priceUsd || null, via: 'dexscreener' }; } catch (e) { }
  try { const c = await L.getJson('https://frontend-api-v3.pump.fun/coins/' + m, { headers: { accept: 'application/json' } }, 7000);
    if (c && c.mint === m) return { mint: m, name: c.name, symbol: c.symbol, icon: c.image_uri || null, mcap: c.usd_market_cap || null, via: 'pump.fun' }; } catch (e) { }
  return null;
}
module.exports = L.wrap(async (req, res) => {
  const q = String((req.query || {}).q || '').trim().slice(0, 64);
  if (!q) return L.send(res, 400, { ok: false, error: 'type a contract address or a ticker' });
  if (L.B58.test(q)) {
    const t = await L.cached('t:' + q, 60000, () => byMint(q));
    if (!t) return L.send(res, 404, { ok: false, error: 'no Solana token found at that address' });
    return L.send(res, 200, { ok: true, token: t }, 's-maxage=60');
  }
  const j = await L.cached('s:' + q.toLowerCase(), 120000, () => L.jup(q.replace(/^\$/, '')));
  const list = (j || []).filter(t => t && t.id && t.symbol).sort((a, b) => (b.isVerified - a.isVerified) || ((b.mcap || 0) - (a.mcap || 0))).slice(0, 8).map(L.tok);
  L.send(res, 200, { ok: true, list }, 's-maxage=120');
});
