// GET /api/trending : coins people are trading right now, to pick as parents. Jupiter's trending list, minus majors and stables.
const L = require('./_lib');
const SKIP = new Set(['SOL', 'WSOL', 'USDC', 'USDT', 'USDS', 'PYUSD', 'USDG', 'JUP', 'JTO', 'JLP', 'BTC', 'WBTC', 'CBBTC', 'ETH', 'WETH', 'MSOL', 'JITOSOL', 'BSOL', 'INF', 'RAY', 'ORCA', 'PYTH', 'W', 'HNT', 'RENDER', 'EURC', 'USD1', 'FDUSD', 'BNSOL', 'XBTC', 'ZBTC']);
const BACKUP = ['BONK', 'WIF', 'POPCAT', 'FARTCOIN', 'PENGU', 'MEW', 'BOME', 'MOODENG', 'GIGA', 'PNUT', 'CHILLGUY', 'GOAT'];
const isMeme = t => { const s = String(t.symbol || ''); const tags = (t.tags || []).join(' '); return !SKIP.has(s.toUpperCase()) && !/USD|EUR|^x[A-Z]/.test(s) && !/\blst\b|stable/i.test(tags) && t.icon && (t.mcap || 0) > 30000; };
async function classics() { const out = []; for (const s of BACKUP.slice(0, 6)) { try { const j = await L.jup(s); const t = (j || []).filter(x => String(x.symbol).toUpperCase() === s).sort((a, b) => (b.isVerified - a.isVerified) || ((b.mcap || 0) - (a.mcap || 0)))[0]; if (t) out.push(L.tok(t)); } catch (e) { } } return out; }
async function trending() {
  let list = [], via = 'jupiter search';
  for (const iv of ['1h', '6h', '24h']) {
    try { const j = await L.getJson(`https://lite-api.jup.ag/tokens/v2/toptrending/${iv}?limit=80`, {}, 8000);
      const memes = (j || []).filter(t => t && t.id && isMeme(t)).sort((a, b) => (!!b.launchpad - !!a.launchpad));
      if (memes.length >= 6) { list = memes.slice(0, 14).map(L.tok); via = 'jupiter ' + iv; break; } } catch (e) { }
  }
  const have = new Set(list.map(t => t.mint)); for (const c of await L.cached('classics', 3600000, classics)) if (!have.has(c.mint)) list.push(c);
  return { via, list: list.slice(0, 20) };
}
module.exports = L.wrap(async (req, res) => {
  const r = await L.cached('trending', 300000, trending);
  L.send(res, 200, { ok: true, ...r }, 's-maxage=300, stale-while-revalidate=900');
});
