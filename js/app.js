// rot.actor main page: smooth scroll, the hero cast, the recipe ride, the lab, the bestiary, the stage, bloodlines.
import { $, $$, esc, short, usd, ago, api, proxied, toast, reduced, confetti } from './util.js';
import { say, setSound, onSound, soundOn, stop } from './tts.js';
import { initLab, connect, disconnect, wallet } from './lab.js';
import { initHero, CAST } from './hero.js';
import { dna, portrait } from './creature.js';
import { houseName } from './names.js';
import { shouldIntro, playIntro } from './intro.js';

const gsap = window.gsap, ST = window.ScrollTrigger; const mobile = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches;
const Q = new URLSearchParams(location.search); const calm = reduced || Q.has('calm');
document.documentElement.classList.toggle('reduced', calm);
const DOUGHS = ['classico', 'spinaci', 'pomodoro', 'nero', 'barbabietola', 'curcuma', 'viola'];
const S = { coins: [], parents: [], cfg: {}, tab: 'new', acts: [], act: 0, claps: 0 };

/* ---------- smooth scroll + triggers ---------- */
let lenis = null;
if (gsap && ST) gsap.registerPlugin(ST);
if (!calm && window.Lenis && !Q.has('nosmooth')) {
  lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
  lenis.on('scroll', () => ST && ST.update()); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
}
function go(hash) { const el = $(hash); if (!el) return; if (lenis) lenis.scrollTo(el, { offset: hash === '#top' ? 0 : -60, duration: 1.4 }); else el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); }
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const h = a.getAttribute('href'); if (h.length < 2 || h.includes('?')) return; e.preventDefault(); closeMenu(); go(h); history.replaceState(null, '', h); });

/* ---------- nav ---------- */
const nav = $('#nav'); const onScroll = () => nav.classList.toggle('solid', scrollY > 40); addEventListener('scroll', onScroll, { passive: true }); onScroll();
function closeMenu() { $('#links').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false'); }
$('#burger').addEventListener('click', () => { const o = !$('#links').classList.contains('open'); $('#links').classList.toggle('open', o); $('#burger').setAttribute('aria-expanded', String(o)); });
onSound(on => { $('#snd').setAttribute('aria-pressed', String(on)); $('#snd').title = on ? 'Sound on' : 'Sound off'; });
$('#snd').addEventListener('click', () => { setSound(!soundOn()); if (soundOn()) say('Mamma mia! Il suono è acceso.', { pitch: 1.2 }); });
wallet.listeners.add(a => { $('#walletBtn').textContent = a ? short(a) : 'Connect wallet'; });
$('#walletBtn').addEventListener('click', async () => { if (wallet.addr) return disconnect(); try { await connect(); } catch (e) { toast('Wallet connection was cancelled.'); } });

/* ---------- googly eyes in the type follow the pointer ---------- */
let mx = innerWidth / 2, my = innerHeight / 3, eyeRaf = 0;
function eyes() { eyeRaf = 0; for (const e of $$('.ge')) { const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue; const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160); e.style.setProperty('--px', (dx / d * k).toFixed(3)); e.style.setProperty('--py', (dy / d * k).toFixed(3)); } }
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!eyeRaf) eyeRaf = requestAnimationFrame(eyes); }, { passive: true });
addEventListener('scroll', () => { if (!eyeRaf) eyeRaf = requestAnimationFrame(eyes); }, { passive: true }); eyes();

/* ---------- split headings ---------- */
for (const h of $$('.split')) { h.innerHTML = h.textContent.trim().split(/\s+/).map(w => `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(' '); }

/* ---------- hero ---------- */
const heroFlat = () => { $('#heroGL').hidden = true; $('.hero-fallback').hidden = false; };
let hero = { ok: false, setProgress() { } };
function startHero() {
  hero = initHero($('#heroGL'), { mobile, onSlow: heroFlat, onPoke: (d, i) => { const lines = ['Mamma mia!', 'Al dente!', 'Che cosa?', 'Ciao bello!', 'Pasta la vista!', 'Bellissimo!']; say(lines[i % lines.length], { pitch: d.pitch, rate: d.rate }); } });
  if (!hero.ok) heroFlat();
  if (gsap && !calm) {
    const tl = gsap.timeline({ delay: .1 });
    tl.from('#heroWord', { y: 60, scale: .8, opacity: 0, duration: .9, ease: 'back.out(1.8)' })
      .from('#heroWord .ge', { scale: 0, duration: .6, stagger: .12, ease: 'back.out(3)' }, '-=.4')
      .from('.tag span', { y: 40, opacity: 0, stagger: .12, duration: .6, ease: 'back.out(2)' }, '-=.3')
      .from('.hero-copy .sub, .hero-copy .cta, .hero-copy .hero-live', { y: 24, opacity: 0, stagger: .08, duration: .5 }, '-=.2');
  }
}
if (gsap && ST && !calm) {
  ST.create({ trigger: '#top', start: 'top top', end: '+=110%', pin: true, pinSpacing: true, scrub: true, onUpdate: s => { hero.ok && hero.setProgress(s.progress); } });
  gsap.to('.hero-copy', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: '+=90%', scrub: true } });
  gsap.to('.sun', { scale: 1.35, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: '+=110%', scrub: true } });
}
if (shouldIntro()) { lenis && lenis.stop(); playIntro({ mobile, onDone: () => { lenis && lenis.start(); startHero(); ST && ST.refresh(); } }); } else startHero();

/* ---------- marquee band ---------- */
if (gsap) {
  const rows = $$('.band-row').map((r, i) => { const w = r.scrollWidth / 2; const tw = gsap.fromTo(r, { x: i ? -w : 0 }, { x: i ? 0 : -w, duration: i ? 34 : 26, ease: 'none', repeat: -1 }); return tw; });
  if (ST && !calm) ST.create({ trigger: '.band', start: 'top bottom', end: 'bottom top', onUpdate: s => { const v = Math.min(5, 1 + Math.abs(s.getVelocity()) / 600); rows.forEach(t => gsap.to(t, { timeScale: v, duration: .2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1 }) })); } });
}

/* ---------- recipe: horizontal ride ---------- */
const exD = dna('rot.actor', 'example', 'x7', { h: 120, s: .6, l: .5 }, { h: 340, s: .8, l: .6, hex: '#ff4d6d' }); exD.pose = 'wave';
const exN = houseName({ name: 'Bonk', symbol: 'BONK', mint: 'ex1' }, { name: 'Fartcoin', symbol: 'FARTCOIN', mint: 'ex2' }, 'k');
const idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 600));
$('#exImg').src = $('#exImg2').src = '/assets/egg.png';
idle(() => { try { const src = portrait(exD, 512); $('#exImg').src = src; $('#exImg2').src = src; } catch (e) { } });
$('#exName').textContent = exN.name; $('#exName2').textContent = exN.name; $('#exTick').textContent = '$' + exN.ticker; $('#exLine').textContent = exN.line;
if (gsap && ST) {
  const track = $('#recTrack'); const dist = () => track.scrollWidth - innerWidth;
  const ride = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#recipe', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: calm ? true : .8, invalidateOnRefresh: true,
    onUpdate: s => { $('#recBar').style.width = (s.progress * 100).toFixed(1) + '%'; $('#recN').textContent = Math.min(4, 1 + Math.floor(s.progress * 3.999)) + '/4'; } } });
  if (!calm) {
    $$('.rec-panel').forEach((p, i) => { gsap.from(p.querySelectorAll('.rec-txt > *'), { y: 60, opacity: 0, stagger: .08, ease: 'back.out(1.6)', scrollTrigger: { trigger: p, containerAnimation: ride, start: 'left 70%', end: 'left 30%', scrub: true } }); });
    gsap.fromTo('.fall.f1', { y: -40, x: 0, rotate: 0 }, { y: 250, x: 60, rotate: 260, ease: 'power1.in', scrollTrigger: { trigger: '.p2', containerAnimation: ride, start: 'left 60%', end: 'center 40%', scrub: true } });
    gsap.fromTo('.fall.f2', { y: -60, x: 0, rotate: 0 }, { y: 250, x: -60, rotate: -300, ease: 'power1.in', scrollTrigger: { trigger: '.p2', containerAnimation: ride, start: 'left 50%', end: 'center 35%', scrub: true } });
    gsap.fromTo('.ex', { y: 160, scale: .5, rotate: -12 }, { y: 0, scale: 1, rotate: 0, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.p3', containerAnimation: ride, start: 'left 80%', end: 'left 20%', scrub: true } });
    gsap.from('.vis-live .bubble', { scale: 0, rotate: -20, transformOrigin: '0% 100%', ease: 'back.out(2)', scrollTrigger: { trigger: '.p4', containerAnimation: ride, start: 'left 60%', end: 'left 25%', scrub: true } });
  }
  gsap.utils.toArray('.lab .split, .bestiary .split, .bloodlines .split, .faq .split').forEach(h => { if (!calm) gsap.from(h.querySelectorAll('.wi'), { yPercent: 110, rotate: 6, stagger: .06, duration: .7, ease: 'back.out(1.7)', scrollTrigger: { trigger: h, start: 'top 85%' } }); });
  ST.batch('[data-r]', { start: 'top 88%', onEnter: els => gsap.to(els, { opacity: 1, y: 0, stagger: .08, duration: .7, ease: 'back.out(1.4)', overwrite: true }) });
  // stage curtains open as you arrive
  gsap.fromTo('.curtain.l', { xPercent: 0, scaleX: 1 }, { xPercent: -88, scaleX: .55, ease: 'none', scrollTrigger: { trigger: '#stage', start: 'top 75%', end: 'top 15%', scrub: true } });
  gsap.fromTo('.curtain.r', { xPercent: 0, scaleX: 1 }, { xPercent: 88, scaleX: .55, ease: 'none', scrollTrigger: { trigger: '#stage', start: 'top 75%', end: 'top 15%', scrub: true } });
  if (!calm) gsap.from('.foot-word', { yPercent: 40, scale: .85, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'top 30%', scrub: true } });
  addEventListener('load', () => ST.refresh());
} else $$('[data-r]').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; });


/* ---------- floating pasta + magnetic buttons ---------- */
const BITS = { '#fuse': [['rotini-classico', 2, 14, 120, -1], ['farfalle-barbabietola', 91, 9, 130, 1], ['penne-spinaci', 4, 80, 95, 1], ['maccheroni-curcuma', 93, 74, 115, -1]],
  '#bestiary': [['gnocco-classico', 88, 6, 120, 1], ['rotini-nero', 3, 40, 110, -1], ['rigatoni-pomodoro', 94, 62, 100, 1]],
  '#bloodlines': [['farfalle-classico', 6, 12, 120, 1], ['rotini-classico', 90, 60, 130, -1]],
  '#faq': [['penne-spinaci', 6, 20, 100, -1], ['farfalle-barbabietola', 90, 70, 120, 1]], '.foot': [['maccheroni-curcuma', 8, 10, 110, 1], ['rotini-nero', 88, 14, 100, -1]] };
for (const [sel, list] of Object.entries(BITS)) { const sec = $(sel); if (!sec) continue; list.slice(0, mobile ? 2 : 9).forEach(([n, x, y, w, dir], i) => { const im = new Image(); im.src = `/assets/bits/${n}.png`; im.alt = ''; im.className = 'bit'; im.loading = 'lazy';
  im.style.cssText = `left:${x}%;top:${y}%;width:${mobile ? w * .6 : w}px`; sec.prepend(im);
  if (gsap && ST && !calm) gsap.fromTo(im, { y: 140 * (1 + i % 2 * .5), rotate: -25 * dir }, { y: -140 * (1 + i % 2 * .5), rotate: 30 * dir, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } }); }); }
if (!mobile && !calm) for (const b of $$('.btn.big, .btn.gold')) { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .28}px`; }); b.addEventListener('pointerleave', () => { b.style.translate = ''; }); }

/* ---------- lab ---------- */
initLab({ mobile });

/* ---------- data: bestiary, stage, bloodlines ---------- */
function look(c) { // rebuild a born coin's DNA from its memo
  const [s, code] = String(c.salt || '').split('.'); const d = dna(c.a, c.b, s || ''); if (code && code.length >= 7) { d.dough = DOUGHS[+code[0]] || d.dough; d.accent = '#' + code.slice(1, 7); } return d;
}
const portraitCache = new Map();
const portQ = []; let portBusy = false;
function pump() { if (portBusy || !portQ.length) return; portBusy = true; idle(() => { const c = portQ.shift(); try { portraitCache.set(c.mint, portrait(look(c), 384)); } catch (e) { portraitCache.set(c.mint, '/assets/egg.png'); }
  for (const im of $$('img[data-port="' + c.mint + '"]')) im.src = portraitCache.get(c.mint); for (const im of $$('image[data-port="' + c.mint + '"]')) im.setAttribute('href', portraitCache.get(c.mint)); portBusy = false; pump(); }); }
function imgFor(c) { if (c.icon) return c.icon; if (portraitCache.has(c.mint)) return portraitCache.get(c.mint); if (!portQ.find(x => x.mint === c.mint)) { portQ.push(c); pump(); } return '/assets/egg.png'; }
const pchip = p => `<span><img src="${esc(p.icon || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">$${esc(p.symbol || short(p.mint))}</span>`;
function card(c) {
  return `<a class="card" href="/c/${esc(c.mint)}" data-m="${esc(c.mint)}"><div class="im"><img src="${esc(imgFor(c))}" data-port="${c.icon ? '' : esc(c.mint)}" alt="" loading="lazy"><span class="gen">GEN ${c.gen ?? 1}</span><button type="button" class="spk" aria-label="Say its name">🔊</button></div>
  <div class="bd"><b>${esc(c.name || 'Newborn')}</b><span class="sym">$${esc(c.symbol || short(c.mint))}</span><div class="par">${pchip(c.pa || { mint: c.a })}<i>×</i>${pchip(c.pb || { mint: c.b })}</div>
  <div class="meta"><span>${usd(c.mcap)}</span><span>${c.curve != null ? (c.curve >= 100 ? 'graduated' : c.curve.toFixed(0) + '% curve') : '—'}</span><span>${ago(c.t)}</span></div><div class="curve"><i style="width:${Math.min(100, c.curve || 0)}%"></i></div></div></a>`;
}
function renderGrid() {
  const l = [...S.coins]; const sort = { new: (a, b) => b.t - a.t, top: (a, b) => (b.mcap || 0) - (a.mcap || 0), gen: (a, b) => (b.gen || 0) - (a.gen || 0) || b.t - a.t, kids: (a, b) => (b.kids || 0) - (a.kids || 0) || b.t - a.t }[S.tab];
  l.sort(sort); $('#grid').innerHTML = l.slice(0, 60).map(card).join(''); $('#bEmpty').hidden = l.length > 0;
}
$('.tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b) return; $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); S.tab = b.dataset.tab; renderGrid(); });
$('#grid').addEventListener('click', e => { const s = e.target.closest('.spk'); if (!s) return; e.preventDefault(); const c = S.coins.find(x => x.mint === s.closest('.card').dataset.m); if (c) { const d = look(c); say(c.name || c.symbol, { pitch: d.pitch, rate: d.rate, force: true }); } });
$('#grid').addEventListener('pointermove', e => { const c = e.target.closest('.card'); if (!c || mobile) return; const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-6px)`; });
$('#grid').addEventListener('pointerout', e => { const c = e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });

function stats() {
  const born = S.coins.length, fams = new Set(S.coins.map(c => [c.a, c.b].sort().join())).size, gen = S.coins.reduce((m, c) => Math.max(m, c.gen || 0), 0);
  const today = S.coins.filter(c => Date.now() - c.t < 864e5).length;
  $('#bBorn').textContent = born; $('#bFam').textContent = fams; $('#bGen').textContent = born ? gen : '—';
  $('#liveBorn').textContent = today + ' born today'; $('#liveFam').textContent = fams + (fams === 1 ? ' family' : ' families'); $('#liveGen').textContent = 'deepest gen ' + (born ? gen : '—');
  const w = S.parents.filter(p => p.symbol); $('#wantedBox').hidden = !w.length;
  $('#wanted').innerHTML = w.map(p => `<a href="/#fuse?a=${esc(p.mint)}" data-fuse="${esc(p.mint)}"><img src="${esc(p.icon || '')}" alt="" onerror="this.style.visibility='hidden'">$${esc(p.symbol)}<em>${p.kids} bambini</em></a>`).join('');
}
$('#wanted').addEventListener('click', e => { const a = e.target.closest('a[data-fuse]'); if (!a) return; e.preventDefault(); location.hash = '#fuse?a=' + a.dataset.fuse; location.reload(); });

/* stage */
function buildActs() {
  const born = S.coins.filter(c => c.name).slice(0, 20).map(c => { const d = look(c); return { img: imgFor(c), name: c.name, sub: `$${c.symbol} · born from $${(c.pa && c.pa.symbol) || '?'} × $${(c.pb && c.pb.symbol) || '?'}`, line: `${c.name}! ${c.name}! Sono nato da ${(c.pa && c.pa.symbol) || 'una moneta'} e ${(c.pb && c.pb.symbol) || 'un\'altra'}!`, d, href: '/c/' + c.mint }; });
  const house = CAST.map((d, i) => { const n = houseName({ name: ['Rotini', 'Penne', 'Gnocco', 'Farfalle', 'Maccheroni', 'Rigatoni'][i], symbol: 'HOUSE' + i, mint: 'h' + i }, { name: ['Spiral', 'Basil', 'Tomato', 'Party', 'Crown', 'Beat'][i], symbol: 'ACT' + i, mint: 'a' + i }, 'house');
    return { img: null, d, name: n.name, sub: 'house act · not a coin', line: n.line }; });
  S.acts = born.length ? born.concat(house.slice(0, 2)) : house; S.act = 0; showAct(false);
}
function showAct(play) {
  const a = S.acts[S.act % S.acts.length]; if (!a) return; if (!a.img) { try { a.img = portrait(a.d, 512); } catch (e) { a.img = '/assets/egg.png'; } }
  $('#actImg').src = a.img; $('#actName').textContent = a.name; $('#actSub').textContent = a.sub; $('#actLine').textContent = a.line; $('#actLine').classList.remove('on'); $('#performer').classList.remove('act');
  if (gsap && !calm) gsap.fromTo('#performer', { y: 80, opacity: 0, rotate: -8 }, { y: 0, opacity: 1, rotate: 0, duration: .7, ease: 'back.out(1.8)' });
  if (play) perform();
}
function perform() {
  const a = S.acts[S.act % S.acts.length]; if (!a) return; $('#performer').classList.add('act'); $('#actLine').classList.add('on');
  const done = () => setTimeout(() => $('#performer').classList.remove('act'), 300);
  if (!say(a.line, { pitch: a.d.pitch, rate: a.d.rate, force: true, onend: done })) setTimeout(done, 2600);
}
$('#actPlay').addEventListener('click', perform);
$('#actNext').addEventListener('click', () => { stop(); S.act++; showAct(true); });
$('#actClap').addEventListener('click', e => { S.claps++; $('#clapN').textContent = S.claps; confetti(40); if (gsap) gsap.fromTo('#performer img', { scale: 1.12 }, { scale: 1, duration: .5, ease: 'elastic.out(1,.4)' }); });

/* bloodlines */
function treeSVG(root, by) {
  const nodes = [], edges = []; let slot = 0;
  const walk = (m, depth) => { const c = by[m]; const n = { m, c, depth, kids: [] }; if (c && depth < 3) { n.kids = [walk(c.a, depth + 1), walk(c.b, depth + 1)]; n.x = (n.kids[0].x + n.kids[1].x) / 2; } else n.x = slot++; nodes.push(n); n.kids.forEach(k => edges.push([k, n])); return n; };
  walk(root, 0); const maxD = Math.max(...nodes.map(n => n.depth)); const W = Math.max(slot, 2) * 190, H = (maxD + 1) * 190;
  const X = n => 95 + n.x * 190, Y = n => 70 + (maxD - n.depth) * 190;
  const label = n => n.c ? (n.c.name || '$' + (n.c.symbol || short(n.m))) : (() => { const p = S.coins.find(x => x.a === n.m) ?.pa || S.coins.find(x => x.b === n.m) ?.pb; return p && p.symbol ? '$' + p.symbol : short(n.m); })();
  const icon = n => n.c ? imgFor(n.c) : ((S.coins.find(x => x.a === n.m) || {}).pa || (S.coins.find(x => x.b === n.m) || {}).pb || {}).icon || '';
  return `<svg viewBox="0 0 ${W} ${H + 40}" role="img" aria-label="Family tree">${edges.map(([k, n]) => { const x1 = X(k), y1 = Y(k) + 46, x2 = X(n), y2 = Y(n) - 46, my = (y1 + y2) / 2; return `<path class="edge" d="M${x1} ${y1} C ${x1} ${my + 30}, ${x2} ${my - 30}, ${x2} ${y2}"/>`; }).join('')}
    ${nodes.map((n, i) => `<g class="node" transform="translate(${X(n)} ${Y(n)})"><clipPath id="cp${i}"><circle r="42"/></clipPath><circle r="46"/>${icon(n) ? `<image href="${esc(icon(n))}" data-port="${n.c && !n.c.icon ? esc(n.m) : ''}" x="-42" y="-42" width="84" height="84" clip-path="url(#cp${i})" preserveAspectRatio="xMidYMid slice"/>` : ''}<text y="76">${esc(String(label(n)).slice(0, 18))}</text><text class="g" y="-56">${n.c ? 'GEN ' + (n.c.gen || 1) : 'GEN 0'}</text></g>`).join('')}</svg>`;
}
function ghostTree() {
  return `<svg viewBox="0 0 760 470" role="img" aria-label="How a bloodline grows"><path class="edge" d="M120 116 C 120 190, 250 190, 250 252"/><path class="edge" d="M380 116 C 380 190, 250 190, 250 252"/><path class="edge" d="M250 344 C 250 400, 440 330, 440 390"/><path class="edge" d="M640 116 C 640 240, 440 250, 440 390"/>
  ${[[120, 70, 'any coin', 'GEN 0'], [380, 70, 'any coin', 'GEN 0'], [640, 70, 'any coin', 'GEN 0'], [250, 298, 'brainrot', 'GEN 1'], [440, 430, 'its bambino', 'GEN 2']].map(([x, y, t, g]) => `<g class="node ghost" transform="translate(${x} ${y})"><circle r="46"/><text y="8" style="font-size:16px">?</text><text y="76">${t}</text><text class="g" y="-56">${g}</text></g>`).join('')}</svg><p class="tree-note">How it grows. Real families appear here as soon as brainrots are born.</p>`;
}
function renderTree() {
  const by = Object.fromEntries(S.coins.map(c => [c.mint, c])); const deepest = [...S.coins].sort((a, b) => (b.gen || 0) - (a.gen || 0) || b.t - a.t)[0];
  $('#tree').innerHTML = deepest ? treeSVG(deepest.mint, by) : ghostTree();
  if (gsap && !calm) { const paths = $$('#tree .edge'); paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.to(paths, { strokeDashoffset: 0, stagger: .15, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: '#tree', start: 'top 75%' } });
    gsap.from('#tree .node', { scale: 0, transformOrigin: '50% 50%', stagger: .08, duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: '#tree', start: 'top 75%' } }); }
}

async function loadCoins() {
  const j = await api('/api/coins', {}, 30000);
  if (j && j.ok) { S.coins = (j.coins || []).filter(c => c && c.mint); S.parents = j.parents || []; S.cfg = j.cfg || {}; } else if (!S.coins.length) { $('#liveBorn').textContent = 'bestiary offline'; }
  renderGrid(); stats(); renderTree(); if (stageReady) buildActs(); cfgUI(); ST && ST.refresh();
}
function cfgUI() {
  const c = S.cfg || {}; if (c.X) { for (const id of ['#navX', '#footX']) { $(id).href = c.X; $(id).hidden = false; } }
  if (c.CA) { $('#rot').hidden = false; $('#rotCA').textContent = c.CA; $('#rotBuy').href = c.BUY || 'https://pump.fun/coin/' + c.CA; $('#rotChart').href = 'https://dexscreener.com/solana/' + c.CA; }
}
$('#rotCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(S.cfg.CA || ''); toast('Copied.'); } catch (e) { toast(S.cfg.CA || ''); } });
document.addEventListener('rot:born', () => setTimeout(loadCoins, 20000));
renderGrid(); renderTree(); loadCoins();
let stageReady = false; new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { stageReady = true; buildActs(); o.disconnect(); } }, { rootMargin: '700px 0px' }).observe($('#stage')); setInterval(() => { if (!document.hidden) loadCoins(); }, 60000);
if (location.hash.startsWith('#fuse')) setTimeout(() => go('#fuse'), 400);
window.__rot = { S, go, loadCoins, ready: true };
