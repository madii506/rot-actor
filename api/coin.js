// GET /api/coin?mint= : one brainrot with its parents, children and live market numbers (Dexscreener).
const L = require('./_lib'); const R = require('./_registry');
module.exports = L.wrap(async (req, res) => {
  const mint = String((req.query || {}).mint || '').trim();
  if (!L.B58.test(mint)) return L.send(res, 400, { ok: false, error: 'that is not a Solana address' });
  const all = await L.cached('coins', 45000, async () => ({ ok: true, ...(await R.list()) })).catch(() => ({ coins: [] }));
  let c = (all.coins || []).find(x => x.mint === mint);
  if (!c) c = await L.cached('one:' + mint, 60000, () => R.byMint(mint));
  if (!c) return L.send(res, 404, { ok: false, error: 'not born on rot.actor' });
  const kids = (all.coins || []).filter(x => x.a === mint || x.b === mint).map(x => ({ mint: x.mint, name: x.name, symbol: x.symbol, icon: x.icon, mcap: x.mcap }));
  let mk = null;
  try { const d = await L.getJson('https://api.dexscreener.com/latest/dex/tokens/' + mint, {}, 7000); const p = (d.pairs || []).sort((x, y) => (y.volume && y.volume.h24 || 0) - (x.volume && x.volume.h24 || 0))[0];
    if (p) mk = { pair: p.pairAddress, dex: p.dexId, price: +p.priceUsd || null, mcap: p.marketCap || p.fdv || null, vol: p.volume || {}, chg: p.priceChange || {}, txns: p.txns || {}, liq: p.liquidity && p.liquidity.usd || null }; } catch (e) { }
  L.send(res, 200, { ok: true, coin: c, kids, market: mk }, 's-maxage=20, stale-while-revalidate=60');
});
