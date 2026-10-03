// small shared helpers
export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const REG = '37T42Tc3emc6bwoZD6382HErftorr3KJ5NX36EAoh2xm';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const short = s => s ? String(s).slice(0, 4) + '…' + String(s).slice(-4) : '';
export const usd = n => n == null || !isFinite(n) ? '—' : n >= 1e9 ? '$' + (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + (+n).toFixed(n < 1 ? 4 : 0);
export const ago = t => { if (!t) return '—'; const s = Math.max(1, (Date.now() - t) / 1000); return s < 60 ? Math.floor(s) + 's' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
export async function api(path, opt = {}, ms = 20000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(path, { ...opt, signal: c.signal }); const j = await r.json().catch(() => ({ ok: false, error: 'bad reply (' + r.status + ')' })); if (!r.ok && j.ok !== false) j.ok = false; return j; }
  catch (e) { return { ok: false, error: e.name === 'AbortError' ? 'timed out' : 'network error' }; } finally { clearTimeout(t); }
}
export const post = (path, body, ms) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, ms);
export const proxied = u => u ? '/api/img?u=' + encodeURIComponent(u) : '';
let toastT; export function toast(msg, ms = 3200) { let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.append(el); } el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms); }
export function loadImg(src) { return new Promise(res => { if (!src) return res(null); const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// confetti (pasta shapes) on a fixed canvas
export function confetti(n = 90) {
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.append(c); const g = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#ffc93f', '#ff5a3d', '#2fbf71', '#ff6fae', '#ffffff', '#7b5cff']; const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6, r: Math.random() * 6, s: 6 + Math.random() * 10, c: cols[Math.floor(Math.random() * cols.length)], k: Math.floor(Math.random() * 3) }));
  let f = 0; (function loop() { g.clearRect(0, 0, W, H); for (const p of P) { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += .12; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; if (p.k === 0) g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); else if (p.k === 1) { g.beginPath(); g.ellipse(0, 0, p.s / 2, p.s / 3, 0, 0, 7); g.fill(); } else { g.beginPath(); g.moveTo(-p.s / 2, -p.s / 3); g.lineTo(0, 0); g.lineTo(-p.s / 2, p.s / 3); g.moveTo(p.s / 2, -p.s / 3); g.lineTo(0, 0); g.lineTo(p.s / 2, p.s / 3); g.fill(); } g.restore(); }
    if (++f < 150) requestAnimationFrame(loop); else c.remove(); })();
}
