// A brainrot's own page: rebuilt in 3D from its launch memo, live market numbers, parents and children.
import { $, $$, B58, esc, short, usd, ago, api, toast } from './util.js';
import { THREE, dna, creature, rig, shadowFloor, stepEyes, portrait, slowGuard } from './creature.js';

const DOUGHS = ['classico', 'spinaci', 'pomodoro', 'nero', 'barbabietola', 'curcuma', 'viola'];
const mint = (location.pathname.match(/\/c\/([1-9A-HJ-NP-Za-km-z]{32,44})/) || [])[1] || new URLSearchParams(location.search).get('m') || '';
let D = null, C = null, poke = null;
$('#burger').addEventListener('click', () => { const o = !$('#links').classList.contains('open'); $('#links').classList.toggle('open', o); $('#burger').setAttribute('aria-expanded', String(o)); });
let mx = innerWidth / 2, my = 200; addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; for (const g of $$('.ge')) { const r = g.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160); g.style.setProperty('--px', dx / d * k); g.style.setProperty('--py', dy / d * k); } }, { passive: true });

function look(c) { const [s, code] = String(c.salt || '').split('.'); const d = dna(c.a, c.b, s || ''); if (code && code.length >= 7) { d.dough = DOUGHS[+code[0]] || d.dough; d.accent = '#' + code.slice(1, 7); } return d; }
function scene3d(d) {
  const cv = $('#cGL'); let r; try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return null; }
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const sc = new THREE.Scene(); rig(sc, r); sc.add(shadowFloor(0, .24)); const cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const c = creature(d); c.rotation.y = -.25; sc.add(c); const h = c.userData.height, body = c.userData.body, by = body.position.y;
  const ptr = new THREE.Vector2(), lk = new THREE.Vector2(); let jump = 0, jolt = 0, last = performance.now();
  addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -(((e.clientY - b.top) / b.height) * 2 - 1)); }, { passive: true });
  const size = () => { const w = cv.clientWidth, hh = cv.clientHeight; r.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); const dist = (h * .5 + .7) / Math.tan(15 * Math.PI / 180) * Math.max(1, 1 / cam.aspect); cam.position.set(0, h * .55 + .2, dist); cam.lookAt(0, h * .46, 0); };
  size(); new ResizeObserver(size).observe(cv);
  let dead = false; const guard = slowGuard(() => { r.shadowMap.enabled = false; sc.traverse(o => { if (o.material) o.material.needsUpdate = true; }); r.setPixelRatio(1); size(); }, () => { dead = true; cv.hidden = true; const f = $('#cFlat'); f.src = (C && C.icon) || portrait(d, 512); f.hidden = false; });
  (function loop() { if (dead) return; requestAnimationFrame(loop); if (document.hidden) { last = performance.now(); return; } const now = performance.now(), raw = (now - last) / 1000, dt = Math.min(.05, raw), t = now / 1000; last = now; if (guard(raw) > 1) return; lk.lerp(ptr, .12);
    if (jump > 0) jump = Math.max(0, jump - dt * 1.6); const hop = jump > 0 ? Math.sin((1 - jump) * Math.PI) * .9 : 0;
    body.position.y = by + Math.abs(Math.sin(t * 2.2)) * .08 + hop; c.rotation.y = -.25 + lk.x * .4 + (jump > 0 ? (1 - jump) * Math.PI * 2 : 0); c.rotation.z = Math.sin(t * 1.4) * .05;
    stepEyes(c, { x: lk.x, y: lk.y }, dt, jolt); jolt *= .9; r.render(sc, cam); })();
  cv.addEventListener('click', () => { jump = 1; jolt = 8; });
  return { jump: () => { jump = 1; jolt = 8; } };
}
function stat(k, v, cls = '') { return `<div class="st ${cls}"><small>${k}</small><b>${v}</b></div>`; }
function parentCard(p, isRot) { const href = isRot ? '/c/' + p.mint : 'https://dexscreener.com/solana/' + p.mint;
  return `<a class="pc" href="${esc(href)}" ${isRot ? '' : 'target="_blank" rel="noopener"'}><img src="${esc(p.icon || '')}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(p.name || short(p.mint))}</b><small>$${esc(p.symbol || '—')} · ${usd(p.mcap)}</small></span></a>`; }
async function load(retry) {
  if (!B58.test(mint)) { miss('That link has no coin address in it.'); return; }
  const j = await api('/api/coin?mint=' + mint, {}, 30000);
  if (!j.ok) { if (!retry && /not born/i.test(j.error || '')) { $('#cName').textContent = 'Still confirming…'; setTimeout(() => load(true), 15000); return; } miss(j.error && !/not born/i.test(j.error) ? 'The bestiary could not be read right now (' + j.error + ').' : null); return; }
  C = j.coin; D = look(C); const m = j.market || {};
  $('#cKick').textContent = 'LAUNCHED ' + (C.t ? ago(C.t).toUpperCase() + ' AGO' : 'ON ROT.ACTOR'); $('#cName').textContent = C.name || 'New launch'; $('#cSym').textContent = '$' + (C.symbol || short(C.mint)); $('#cGen').textContent = 'GEN ' + (C.gen || 1);
  const pa = C.pa || { mint: C.a }, pb = C.pb || { mint: C.b };
  $('#cPar').innerHTML = `<small>PARENTS</small><div>${parentCard(pa, false)}<i>×</i>${parentCard(pb, false)}</div>`;
  const line = `${C.name}! ${C.name}! Sono nato da ${pa.symbol || 'una moneta'} e ${pb.symbol || "un'altra"}!`; $('#cLine').textContent = line;
  $('#cBuy').href = 'https://pump.fun/coin/' + C.mint; $('#cFuse').href = '/#fuse?a=' + C.mint; $('#cKidLink').href = '/#fuse?a=' + C.mint;
  $('#cShare').href = 'https://x.com/intent/post?text=' + encodeURIComponent(`${C.name} ($${C.symbol || ''}) launched on rot.actor from $${pa.symbol || '?'} × $${pb.symbol || '?'}\n${location.origin}/c/${C.mint}`);
  $('#cCopy').onclick = async () => { try { await navigator.clipboard.writeText(C.mint); toast('Copied.'); } catch (e) { toast(C.mint); } };
  const chg = m.chg && m.chg.h24 != null ? (m.chg.h24 > 0 ? '+' : '') + (+m.chg.h24).toFixed(1) + '%' : '—';
  $('#cStats').innerHTML = stat('Market cap', usd(m.mcap ?? C.mcap)) + stat('Price', m.price ? '$' + (+m.price).toPrecision(3) : '—') + stat('24h volume', usd(m.vol && m.vol.h24)) + stat('24h', chg, m.chg && m.chg.h24 < 0 ? 'dn' : m.chg && m.chg.h24 > 0 ? 'up' : '')
    + stat('Bonding curve', C.curve != null ? (C.curve >= 100 ? 'graduated' : C.curve.toFixed(1) + '%') : '—') + stat('24h trades', m.txns && m.txns.h24 ? `${m.txns.h24.buys} buys · ${m.txns.h24.sells} sells` : '—');
  if (m.pair) $('#cChart').innerHTML = `<iframe title="Chart" src="https://dexscreener.com/solana/${esc(m.pair)}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15" loading="lazy"></iframe>`;
  const kids = j.kids || []; $('#cKids').innerHTML = kids.map(k => `<a class="card" href="/c/${esc(k.mint)}"><div class="im"><img src="${esc(k.icon || '/assets/rot-egg.png')}" alt="" loading="lazy"></div><div class="bd"><b>${esc(k.name || 'New launch')}</b><span class="sym">$${esc(k.symbol || short(k.mint))} · ${usd(k.mcap)}</span></div></a>`).join(''); $('#cNoKids').hidden = kids.length > 0;
  poke = scene3d(D); if (!poke) { $('#cGL').hidden = true; const f = $('#cFlat'); f.src = C.icon || portrait(D, 512); f.hidden = false; }
}
function miss(t) { $('#coin').classList.add('missing'); $('#cMiss').hidden = false; if (t) $('#cMissT').textContent = t; $('.c-hero').hidden = true; $('#cStats').hidden = true; $('#cChartBox').hidden = true; $('.c-fam').hidden = true; }
load(false);
