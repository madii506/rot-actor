// Creature engine: two parents (+ a salt) -> DNA -> a 3D pasta brainrot. Same DNA, same creature, everywhere on the site.
import { THREE, setDough, pastaMaterial, rotiniGeo, tubeGeo, elbowGeo, farfalleGeo, gnoccoGeo, noodle, gnocchi, googlyEye, stepEyes } from './pasta.js';
import { RoomEnvironment } from '/vendor/RoomEnvironment.js';
import { hash, rng } from './names.js';

export const SHAPES = ['rotini', 'penne', 'rigatoni', 'maccheroni', 'farfalle', 'gnocco'];
const HATS = ['none', 'crown', 'toque', 'party', 'beret', 'bow', 'phones', 'none'];
const POSES = ['wave', 'hips', 'up', 'point'];
const DOUGHS = ['classico', 'spinaci', 'pomodoro', 'nero', 'barbabietola', 'curcuma', 'viola'];
const ACCENTS = ['#ff4d6d', '#ffd23f', '#3ddc97', '#7b5cff', '#ff8a3d', '#1fb6ff', '#ffffff'];

// dominant colour of an image (same-origin or CORS-clean) -> {h,s,l,hex}
export function tint(img) {
  try { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data; let R = 0, G = 0, B = 0, n = 0, R2 = 0, G2 = 0, B2 = 0, n2 = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      R2 += r; G2 += gg; B2 += b; n2++; if (mx - mn > 40 && mx > 50) { R += r; G += gg; B += b; n++; } }
    const [r, gg, b] = n > 20 ? [R / n, G / n, B / n] : n2 ? [R2 / n2, G2 / n2, B2 / n2] : [200, 160, 80];
    const col = new THREE.Color(r / 255, gg / 255, b / 255); const hsl = {}; col.getHSL(hsl);
    return { h: hsl.h * 360, s: hsl.s, l: hsl.l, hex: '#' + col.getHexString() };
  } catch (e) { return null; }
}
function doughFor(t, r) {
  if (!t) return DOUGHS[Math.floor(r() * DOUGHS.length)];
  if (t.s < .18) return t.l < .35 ? 'nero' : 'classico';
  const h = t.h; return h < 18 || h >= 335 ? 'pomodoro' : h < 48 ? 'curcuma' : h < 70 ? 'classico' : h < 170 ? 'spinaci' : h < 255 ? 'viola' : 'barbabietola';
}
export function dna(a, b, salt = '', ta = null, tb = null) {
  const r = rng(hash(String(a) + '|' + String(b) + '|' + salt)); const pick = l => l[Math.floor(r() * l.length)];
  const d = { shape: pick(SHAPES), pose: pick(POSES), hat: pick(HATS), eyes: r() < .14 ? 3 : 2, eyeK: .85 + r() * .4, dough: null, accent: null,
    looks: [[r() * 2 - 1, r() * 2 - 1], [r() * 2 - 1, r() * 2 - 1], [r() * 2 - 1, r() * 2 - 1]], tilt: (r() - .5) * .25, pitch: .6 + r() * .9, rate: .92 + r() * .2 };
  d.dough = doughFor(ta, r);
  d.accent = tb && tb.s > .2 ? tb.hex : pick(ACCENTS);
  if (d.dough === 'nero' && d.accent === '#ffffff') d.accent = '#ffd23f';
  return d;
}

// body specs: geometry + anchors (eyes, shoulders, hips, top), all in body space
function bodySpec(shape) {
  switch (shape) {
    case 'penne': return { geo: () => tubeGeo({ L: 1.9, R: .48, shear: .45 }), eyeY: .42, eyeZ: .5, sep: .27, er: .26, sh: [.1, .1], hip: -.78, top: 1.25, wide: .5 };
    case 'rigatoni': return { geo: () => tubeGeo({ L: 1.75, R: .58, ridges: 22, wall: .09 }), eyeY: .36, eyeZ: .6, sep: .3, er: .28, sh: [.1, .05], hip: -.72, top: .9, wide: .6 };
    case 'maccheroni': return { geo: () => elbowGeo({ R: .42, bend: 1, arc: Math.PI * .7 }), eyeY: .46, eyeZ: .43, sep: .26, er: .24, sh: [.6, .1], hip: -.38, top: .9, wide: .9 };
    case 'farfalle': return { geo: () => farfalleGeo({}), eyeY: .08, eyeZ: .26, sep: .27, er: .23, sh: [.25, -.05], hip: -.38, top: .32, wide: 1.1 };
    case 'gnocco': return { geo: () => gnoccoGeo(.95), eyeY: .36, eyeZ: .8, sep: .34, er: .3, sh: [.6, -.05], hip: -.8, top: 1.07, wide: .85 };
    default: return { geo: () => rotiniGeo({}), eyeY: .72, eyeZ: .57, sep: .32, er: .3, sh: [.05, .05], hip: -.95, top: 1.2, wide: .55 };
  }
}
function accMat(hex, metal) { return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), roughness: metal ? .25 : .45, metalness: metal ? .9 : 0, clearcoat: .6, clearcoatRoughness: .2 }); }
function hat(kind, accent, top, wide) {
  const g = new THREE.Group(); g.position.y = top;
  if (kind === 'crown') { const geo = new THREE.CylinderGeometry(.3, .27, .32, 40, 4, true); const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) > .1) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, .02 + .14 * Math.abs(Math.sin(a * 3.5))); }
      geo.computeVertexNormals(); const m = new THREE.Mesh(geo, accMat('#ffcf3f', true)); m.material.side = THREE.DoubleSide; g.add(m);
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const s = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 8), accMat(accent)); s.position.set(Math.cos(a) * .29, -.05, Math.sin(a) * .29); g.add(s); }
      g.position.y += .08; }
  else if (kind === 'toque') { const w = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .7, sheen: .6 }); const band = new THREE.Mesh(new THREE.CylinderGeometry(.26, .27, .2, 32), w); band.position.y = .06; g.add(band);
      for (const [x, y, z, r] of [[0, .35, 0, .24], [-.17, .28, .05, .19], [.17, .29, .03, .19], [0, .27, -.16, .19], [0, .3, .15, .18]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), w); s.position.set(x, y, z); g.add(s); } }
  else if (kind === 'party') { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : accent; x.fillRect(0, i * 8, 64, 8); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const cone = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 32), new THREE.MeshPhysicalMaterial({ map: t, roughness: .5 })); cone.position.y = .3; cone.rotation.z = -.15; g.add(cone);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(.07, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .9 })); pom.position.set(.045, .6, 0); g.add(pom); }
  else if (kind === 'beret') { const b = new THREE.Mesh(new THREE.SphereGeometry(.36, 32, 16), accMat(accent)); b.scale.set(1, .3, 1); b.position.set(.04, .05, 0); b.rotation.z = -.2; g.add(b);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(.02, .025, .08, 8), accMat(accent)); st.position.set(.02, .16, 0); g.add(st); }
  else if (kind === 'phones') { const band = new THREE.Mesh(new THREE.TorusGeometry(wide * .78, .045, 10, 40, Math.PI), accMat('#22252c')); band.position.y = -.12; g.add(band);
      for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 24), accMat(accent)); cup.rotation.z = Math.PI / 2; cup.position.set(s * wide * .78, -.14, 0); g.add(cup); } }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
function bowTie(accent) { const g = new THREE.Group(), m = accMat(accent);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.12, .22, 4), m); c.rotation.z = s * Math.PI / 2; c.position.x = s * .11; c.scale.z = .5; g.add(c); }
  const k = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 10), m); g.add(k); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }

// build a creature; feet stand on y = 0. Returns a Group with userData {height, spec}
export function creature(d, { legs = true, arms = true, eyes = true } = {}) {
  setDough(d.dough); const S = bodySpec(d.shape), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const bm = new THREE.Mesh(S.geo(), pastaMaterial()); bm.castShadow = bm.receiveShadow = true; body.add(bm);
  // eyes
  const er = S.er * d.eyeK; const n = d.eyes;
  const spots = n === 3 ? [[-S.sep * 1.05, S.eyeY - .02, er * .95], [S.sep * 1.05, S.eyeY, er * .95], [0, S.eyeY + er * 1.55, er * .72]] : [[-S.sep, S.eyeY, er], [S.sep, S.eyeY + .04, er * 1.06]];
  if (eyes) spots.forEach((s, i) => { const e = googlyEye({ r: s[2], look: d.looks[i] }); e.position.set(s[0], s[1], S.eyeZ + .02); e.rotation.y = s[0] * .5; body.add(e); });
  // limbs
  const shY = S.sh[1], shX = S.sh[0];
  if (arms) {
    const hand = (side, pose) => { const s = side;
      const P = { wave: s > 0 ? [.95, shY + .95, .25] : [.42, shY - .55, .32], hips: [.44, shY - .62, .32], up: [.95, shY + .9, .2], point: s > 0 ? [.62, shY + .25, .95] : [.42, shY - .55, .32] }[pose];
      return [s * P[0] + s * (S.wide - .5) * .6, P[1], P[2]]; };
    for (const s of [-1, 1]) { const h = hand(s, d.pose), sx = s * (shX + .02), mid = [s * (Math.abs(h[0]) * .75 + .25), (shY + h[1]) / 2 + (h[1] > shY ? -.15 : .12), h[2] * .5 + .1];
      body.add(noodle([[sx * .3, shY, 0], [s * (S.wide + .12), shY + .02, .08], mid, h], .055)); const g = gnocchi(.12); g.position.set(h[0], h[1], h[2] + .03); g.rotation.z = -s * .5; body.add(g); }
  }
  let foot = 0;
  if (legs) { const len = .78, hip = S.hip; foot = hip - len - .07;
    for (const s of [-1, 1]) { body.add(noodle([[s * .08, hip + .15, 0], [s * .2, hip - len * .45, .04], [s * .3, hip - len, .08]], .06)); const f = gnocchi(.17); f.position.set(s * .36, hip - len - .04, .16); f.rotation.y = s * .25; body.add(f); } }
  else foot = S.hip;
  // accessory
  if (d.hat === 'bow') { const b = bowTie(d.accent); b.position.set(0, S.eyeY - S.er * 1.7, S.eyeZ + .06); body.add(b); }
  else if (d.hat !== 'none') body.add(hat(d.hat, d.accent, S.top, S.wide));
  body.position.y = -foot + .1; body.rotation.z = d.tilt * .3;
  const box = new THREE.Box3().setFromObject(root); root.userData = { height: box.max.y - box.min.y, top: box.max.y, spec: S, body, dna: d };
  return root;
}

// shared light rig + environment for any scene
export function rig(scene, renderer, { shadows = true, env = .7 } = {}) {
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = env; pm.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2d64c2, .65));
  const key = new THREE.DirectionalLight(0xfff0d6, 2.4); key.position.set(-3, 7, 6); key.castShadow = shadows;
  if (shadows) { key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 40 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02; }
  scene.add(key); const rim = new THREE.DirectionalLight(0xbfe0ff, 2); rim.position.set(3.5, 2.5, -4); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffe2b0, .9); rim2.position.set(-4, 1, -3); scene.add(rim2); const fill = new THREE.DirectionalLight(0xffffff, .5); fill.position.set(4, .5, 3); scene.add(fill);
  return { key };
}
export function shadowFloor(y = 0, opacity = .22) { const f = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity })); f.rotation.x = -Math.PI / 2; f.position.y = y; f.receiveShadow = true; return f; }

// comic sunburst canvas (also used as CSS background)
export function sunburst(W, H, { cx = .5, cy = .45, rays = 28, a = '#3a90f0', b = '#2f82e6', edge = '#0b3f9a', dots = true } = {}) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), X = W * cx, Y = H * cy, R = Math.hypot(W, H);
  g.fillStyle = b; g.fillRect(0, 0, W, H); g.fillStyle = a;
  for (let i = 0; i < rays; i++) { const a0 = i / rays * Math.PI * 2, a1 = a0 + Math.PI / rays; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a0) * R, Y + Math.sin(a0) * R); g.lineTo(X + Math.cos(a1) * R, Y + Math.sin(a1) * R); g.fill(); }
  let gr = g.createRadialGradient(X, Y, 0, X, Y, Math.min(W, H) * .55); gr.addColorStop(0, 'rgba(160,215,255,.55)'); gr.addColorStop(1, 'rgba(160,215,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(X, Y, Math.min(W, H) * .25, X, Y, R * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, edge); g.globalAlpha = .85; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  if (dots) { const st = Math.round(Math.min(W, H) / 38); for (let y = st / 2; y < H; y += st) for (let x = st / 2 + ((y / st) % 2 ? st / 2 : 0); x < W; x += st) { const dd = Math.hypot((x - X) / W, (y - Y) / H) * 1.9, r = Math.max(0, dd - .55) * st * .55; if (r > .4) { g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(x, y, Math.min(r, st * .48), 0, 7); g.fill(); } } }
  return c;
}

// one offscreen renderer for portraits (coin images, cards)
let SNAP;
export function portrait(d, size = 512) {
  if (!SNAP) { const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); rig(scene, r); scene.add(shadowFloor(0, .24)); const cam = new THREE.PerspectiveCamera(30, 1, .1, 100); SNAP = { r, scene, cam, bg: null, cur: null }; }
  const { r, scene, cam } = SNAP; r.setPixelRatio(1); r.setSize(size, size, false);
  if (!SNAP.bg || SNAP.bgSize !== size) { const t = new THREE.CanvasTexture(sunburst(size, size, { cx: .5, cy: .46, rays: 24 })); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; SNAP.bgSize = size; }
  if (SNAP.cur) scene.remove(SNAP.cur);
  const c = creature(d); c.rotation.y = -.28; scene.add(c); SNAP.cur = c;
  const h = c.userData.height, dist = (h * .5 + .55) / Math.tan(15 * Math.PI / 180);
  cam.position.set(0, h * .52 + .15, dist); cam.lookAt(0, h * .47, 0);
  r.render(scene, cam); return r.domElement.toDataURL('image/png');
}
// frame-time guard: degrade (shadows off, lower DPR), then give up on 3D when a device can't keep up
export function slowGuard(degrade, giveUp, { force = /force3d/.test(location.search) } = {}) {
  const ts = []; let stage = 0, n = 0, big = 0;
  return dt => { if (force || stage > 1) return stage; n++; ts.push(dt); if (ts.length > 24) ts.shift(); big = dt > .45 ? big + 1 : 0;
    const avg = ts.reduce((a, b) => a + b, 0) / ts.length;
    if (big >= 3 || (stage === 1 && n > 30 && avg > .1)) { stage = 2; giveUp(); }
    else if (stage === 0 && n > 30 && avg > .07) { stage = 1; n = 0; ts.length = 0; degrade(); }
    return stage; };
}
export { THREE, stepEyes };
