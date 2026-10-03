// GET /api/trending : memecoins to pick as parents. Well-known Solana memecoins first (fixed mints), then pump.fun-style memecoins trending on Jupiter right now.
const L = require('./_lib');
const CLASSICS = [
  ['BONK', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'], ['WIF', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'],
  ['POPCAT', '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'], ['FARTCOIN', '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump'],
  ['PENGU', '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv'], ['MEW', 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5'],
  ['BOME', 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'], ['MOODENG', 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY'],
  ['GIGA', '63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9'], ['PNUT', '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump'],
  ['CHILLGUY', 'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump'], ['GOAT', 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump'],
];
const SKIP = new Set(['SOL', 'WSOL', 'USDC', 'USDT', 'USDS', 'PYUSD', 'USDG', 'JUP', 'JTO', 'JLP', 'BTC', 'WBTC', 'CBBTC', 'ETH', 'WETH', 'MSOL', 'JITOSOL', 'BSOL', 'INF', 'RAY', 'ORCA', 'PYTH', 'W', 'HNT', 'RENDER', 'EURC', 'USD1', 'FDUSD', 'BNSOL', 'XBTC', 'ZBTC', 'MET', 'METEORA', 'PUMP', 'KMNO', 'DRIFT', 'CLOUD', 'SPX']);
const PADS = /pump|bonk|moon|believe|bags|stonk|heaven|boop/i; // memecoin launchpads
const isMeme = t => { const raw = String(t.symbol || ''), s = raw.replace(/^\$+/, '').toUpperCase(); const tags = (t.tags || []).join(' ');
  return !!s && !SKIP.has(s) && !/USD|EUR|^x[A-Z]/.test(raw) && !/\blst\b|stable/i.test(tags) && !!t.icon && PADS.test(t.launchpad || '') && (t.mcap || 0) >= 2e6 && (t.liquidity || 0) >= 5e4; };
let C = { t: 0, v: null };
async function classics() {
  if (C.v && Date.now() - C.t < 3600000) return C.v;
  let rows = []; try { rows = (await L.jup(CLASSICS.map(c => c[1]).join(','))) || []; } catch (e) { }
  const by = new Map(rows.filter(t => t && t.id).map(t => [t.id, t]));
  const out = CLASSICS.map(([sym, mint]) => by.has(mint) ? L.tok(by.get(mint)) : { mint, name: sym, symbol: sym, icon: null, mcap: null });
  if (by.size >= 6) C = { t: Date.now(), v: out };
  return out;
}
async function trending() {
  const list = [...await classics()]; const have = new Set(list.map(t => t.mint)); let via = 'classics';
  for (const iv of ['1h', '6h', '24h']) {
    try { const j = await L.getJson(`https://lite-api.jup.ag/tokens/v2/toptrending/${iv}?limit=100`, {}, 8000);
      const memes = (j || []).filter(t => t && t.id && !have.has(t.id) && isMeme(t)).slice(0, 10);
      if (memes.length >= 3) { for (const t of memes) list.push(L.tok(t)); via = 'classics + jupiter ' + iv; break; } } catch (e) { }
  }
  return { via, list: list.slice(0, 22) };
}
module.exports = L.wrap(async (req, res) => {
  const r = await L.cached('trending', 300000, trending);
  L.send(res, 200, { ok: true, ...r }, 's-maxage=300, stale-while-revalidate=900');
});
