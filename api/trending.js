// GET /api/trending : coins people are trading right now, to pick as parents. Jupiter's trending list, minus majors and stables.
const L = require('./_lib');
const SKIP = new Set(['SOL', 'WSOL', 'USDC', 'USDT', 'USDS', 'PYUSD', 'USDG', 'JUP', 'JTO', 'JLP', 'BTC', 'WBTC', 'CBBTC', 'ETH', 'WETH', 'MSOL', 'JITOSOL', 'BSOL', 'INF', 'RAY', 'ORCA', 'PYTH', 'W', 'HNT', 'RENDER', 'EURC', 'USD1', 'FDUSD', 'BNSOL', 'XBTC', 'ZBTC']);
const BACKUP = ['BONK', 'WIF', 'POPCAT', 'FARTCOIN', 'PENGU', 'MEW', 'BOME', 'MOODENG', 'GIGA', 'PNUT', 'CHILLGUY', 'GOAT'];
async function trending() {
  for (const iv of ['1h', '6h', '24h']) {
    try { const j = await L.getJson(`https://lite-api.jup.ag/tokens/v2/toptrending/${iv}?limit=60`, {}, 8000);
      const out = (j || []).filter(t => t && t.id && t.icon && !SKIP.has(String(t.symbol).toUpperCase()) && !/^x[A-Z]/.test(t.symbol || '') && (t.mcap || 0) > 30000).slice(0, 18).map(L.tok);
      if (out.length >= 8) return { via: 'jupiter ' + iv, list: out }; } catch (e) { }
  }
  const out = [];
  for (const s of BACKUP) { try { const j = await L.jup(s); const t = (j || []).filter(x => String(x.symbol).toUpperCase() === s).sort((a, b) => (b.isVerified - a.isVerified) || ((b.mcap || 0) - (a.mcap || 0)))[0]; if (t) out.push(L.tok(t)); } catch (e) { } }
  return { via: 'jupiter search', list: out };
}
module.exports = L.wrap(async (req, res) => {
  const r = await L.cached('trending', 300000, trending);
  L.send(res, 200, { ok: true, ...r }, 's-maxage=300, stale-while-revalidate=900');
});
