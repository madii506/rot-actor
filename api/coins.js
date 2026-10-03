// GET /api/coins : every brainrot born on rot.actor, rebuilt from chain (memo + REG key), with parents, generation, children and curve.
const L = require('./_lib'); const C = require('./_cfg'); const R = require('./_registry');
module.exports = L.wrap(async (req, res) => {
  const out = await L.cached('coins', 45000, async () => { const r = await R.list(); return { ok: true, ts: Date.now(), reg: C.REG, cfg: { CA: C.CA, X: C.X, BUY: C.BUY }, ...r }; });
  L.send(res, 200, out, 's-maxage=30, stale-while-revalidate=120');
});
