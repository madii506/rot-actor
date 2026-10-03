// rot.actor pasta kit: procedural pasta bodies, googly eyes with jiggle physics, spaghetti limbs, gnocchi hands and feet.
import * as THREE from 'three';

// ---------- dough palettes (real coloured pasta) ----------
export const DOUGH = {
  classico: [0xa9681a, 0xeeb047, 0xfbd98c],
  spinaci: [0x355e18, 0x7aa83a, 0xc4df8a],
  pomodoro: [0x8a2313, 0xd9563a, 0xf6a184],
  nero: [0x0e0f12, 0x2a2c33, 0x6d717c],
  barbabietola: [0x67113e, 0xbd3578, 0xf09ac1],
  curcuma: [0xa04d05, 0xf0861a, 0xffc66b],
  viola: [0x3b1a6c, 0x7845c4, 0xc8a9f2],
};
let PAL = DOUGH.classico.map(c => new THREE.Color(c));
export function setDough(name) { PAL = (DOUGH[name] || DOUGH.classico).map(c => new THREE.Color(c)); }

function canvasTex(size, draw, srgb) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
let _bump, _speck;
function textures() {
  if (_bump) return;
  _bump = canvasTex(256, (g, n) => { const img = g.createImageData(n, n); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n * n; i++) { const v = 128 + (r() - .5) * 70 + (r() < .012 ? -90 : 0); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); g.globalAlpha = .5; g.filter = 'blur(1.2px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none'; });
  _speck = canvasTex(512, (g, n) => { g.fillStyle = '#fff'; g.fillRect(0, 0, n, n); let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) { const x = r() * n, y = r() * n, rr = .4 + r() * 1.3, a = .16 + r() * .45; g.fillStyle = r() < .7 ? `rgba(120,80,40,${a})` : `rgba(255,248,225,${a})`; g.beginPath(); g.ellipse(x, y, rr * 1.6, rr, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 90; i++) { const y = r() * n; g.strokeStyle = `rgba(150,110,60,${.05 + r() * .07})`; g.lineWidth = .6 + r(); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(n * .3, y + (r() - .5) * 8, n * .7, y + (r() - .5) * 8, n, y + (r() - .5) * 6); g.stroke(); } }, true);
}
const _mats = {};
export function pastaMaterial() {
  textures(); const k = PAL.map(c => c.getHexString()).join('');
  return _mats[k] || (_mats[k] = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: _speck, vertexColors: true, roughness: .56, bumpMap: _bump, bumpScale: 6,
    sheen: .5, sheenColor: PAL[2].clone(), sheenRoughness: .5, clearcoat: .18, clearcoatRoughness: .45, specularIntensity: .6, side: THREE.DoubleSide }));
}
function shade(geo, fn) {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, fn(p.getX(i), p.getY(i), p.getZ(i)))); if (t < .5) c.copy(PAL[0]).lerp(PAL[1], t * 2); else c.copy(PAL[1]).lerp(PAL[2], (t - .5) * 2); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}
function boxUV(geo, scale = 2) { const p = geo.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = (Math.atan2(p.getX(i), p.getZ(i)) / Math.PI + 1) * scale; uv[i * 2 + 1] = p.getY(i) * scale; } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
const mesh = (geo) => { const m = new THREE.Mesh(geo, pastaMaterial()); m.castShadow = m.receiveShadow = true; return m; };

// ---------- bodies (each ~2.2 tall, centred on the origin, front = +z) ----------
export function rotiniGeo({ L = 2.4, R = .55, core = .15, k = 4, turns = 1.5, seg = 200 } = {}) {
  const shape = new THREE.Shape(); const N = 180;
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, r = core + (R - core) * Math.pow(.5 + .5 * Math.cos(3 * a), k); i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: L, steps: seg, bevelEnabled: false, curveSegments: 1 }); geo.translate(0, 0, -L / 2);
  const p = geo.attributes.position, tl = L * .11;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = L / 2 - Math.abs(z); let s = 1; if (d < tl) { const u = 1 - d / tl; s = .12 + .88 * Math.sqrt(Math.max(0, 1 - u * u)); }
    const a = z / L * turns * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); p.setXYZ(i, (x * ca - y * sa) * s, (x * sa + y * ca) * s, z); }
  geo.rotateX(-Math.PI / 2); geo.computeVertexNormals(); shade(geo, (x, y, z) => (Math.hypot(x, z) - core * .6) / (R - core * .6)); boxUV(geo, 3.2); return geo;
}
export function tubeGeo({ L = 1.9, R = .48, wall = .08, ridges = 16, ridgeH = .022, shear = 0, seg = 72, rings = 24 } = {}) {
  const pos = [], idx = []; const ro = a => R + (ridges ? ridgeH * Math.cos(ridges * a) : 0), ri = () => R - wall;
  const add = (x, y, z) => { pos.push(x, y + shear * x, z); return pos.length / 3 - 1; };
  const grid = (rf, flip) => { const base = pos.length / 3;
    for (let j = 0; j <= rings; j++) { const y = (j / rings - .5) * L; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, r = rf(a); add(Math.cos(a) * r, y, Math.sin(a) * r); } }
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i, b = a + seg + 1; flip ? idx.push(a, a + 1, b, b, a + 1, b + 1) : idx.push(a, b, a + 1, b, b + 1, a + 1); } };
  grid(ro, false); grid(ri, true);
  for (const y of [-L / 2, L / 2]) { const base = pos.length / 3; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; add(Math.cos(a) * ro(a), y, Math.sin(a) * ro(a)); add(Math.cos(a) * ri(a), y, Math.sin(a) * ri(a)); }
    for (let i = 0; i < seg; i++) { const a = base + i * 2, b = a + 2; y > 0 ? idx.push(a, b, a + 1, b, b + 1, a + 1) : idx.push(a, a + 1, b, b, a + 1, b + 1); } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  shade(geo, (x, y, z) => .35 + .65 * ((Math.hypot(x, z) - (R - wall)) / wall)); boxUV(geo, 2.4); return geo;
}
export function elbowGeo({ R = .42, bend = 1.0, arc = Math.PI * .7, wall = .07 } = {}) {
  const curve = new THREE.Curve(); curve.getPoint = (t, v = new THREE.Vector3()) => { const a = -arc / 2 + t * arc; return v.set(Math.sin(a) * bend, Math.cos(a) * bend - bend * .55, 0); };
  const o = new THREE.TubeGeometry(curve, 64, R, 48, false), inn = new THREE.TubeGeometry(curve, 64, R - wall, 48, false);
  const ip = inn.index.array; for (let i = 0; i < ip.length; i += 3) { const t = ip[i]; ip[i] = ip[i + 2]; ip[i + 2] = t; }
  const geos = [o, inn]; for (const t of [0, 1]) { const pt = curve.getPoint(t), tan = curve.getTangent(t), rg = new THREE.RingGeometry(R - wall, R, 48); rg.lookAt(tan.multiplyScalar(t ? 1 : -1)); rg.translate(pt.x, pt.y, pt.z); geos.push(rg); }
  const g = merge(geos); g.computeVertexNormals(); shade(g, (x, y, z) => .55 + .45 * Math.min(1, Math.abs(z) / R)); boxUV(g, 2.4); return g;
}
export function farfalleGeo({ W = 2.3, H = 1.5 } = {}) {
  const geo = new THREE.PlaneGeometry(W, H, 90, 60), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i); const pinch = 1 - .62 * Math.exp(-Math.pow(x / .3, 2));
    y *= pinch; const edge = Math.abs(x) > W * .4 ? .045 * Math.sin(y * 34) : 0; const z = .16 * Math.exp(-Math.pow(x / .22, 2)) * Math.cos(y * 2.2) + .12 * Math.cos(x * 1.6) - .1 + Math.sin(y * 9 + x * 3) * .015;
    p.setXYZ(i, x + edge, y, z); }
  geo.computeVertexNormals(); shade(geo, (x, y, z) => .45 + .55 * (1 - Math.min(1, Math.abs(y) / (H * .5))) - (Math.abs(x) > W * .42 ? .25 : 0)); boxUV(geo, 2.6); return geo;
}
export function gnoccoGeo(size = 1, ridges = 9) {
  const geo = new THREE.SphereGeometry(1, 64, 44), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const rr = 1 + .055 * Math.cos(ridges * Math.atan2(x, z)) * Math.min(1, Math.hypot(x, z) * 1.3);
    p.setXYZ(i, x * .95 * size * rr, y * 1.12 * size, z * .9 * size * rr); }
  geo.computeVertexNormals(); shade(geo, (x, y, z) => .5 + .5 * (y / (1.12 * size)) * .6 + .25 * (z / size)); boxUV(geo, 3); return geo;
}
function merge(geos) { const pos = [], idx = []; let off = 0; for (const g0 of geos) { const g = g0.index ? g0 : g0.toNonIndexed(); const a = g.attributes.position.array; for (let i = 0; i < a.length; i++) pos.push(a[i]); if (g.index) for (const i of g.index.array) idx.push(i + off); else for (let i = 0; i < a.length / 3; i++) idx.push(i + off); off += a.length / 3; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setIndex(idx); return m; }

// ---------- limbs ----------
export function noodle(points, r = .06) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 48, r, 14, false); shade(geo, () => .62); boxUV(geo, 6);
  const g = new THREE.Group(); g.add(mesh(geo)); const cap = new THREE.SphereGeometry(r, 14, 10); shade(cap, () => .62); boxUV(cap, 6);
  for (const t of [0, 1]) { const c = mesh(cap); c.position.copy(curve.getPoint(t)); g.add(c); } return g;
}
export function gnocchi(size = .16, ridges = 7) {
  const geo = new THREE.SphereGeometry(1, 28, 20), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const rr = 1 + .06 * Math.cos(ridges * Math.atan2(y, z)) * Math.min(1, Math.hypot(y, z) * 1.4); p.setXYZ(i, x * 1.25 * size, y * .78 * size * rr, z * size * rr); }
  geo.computeVertexNormals(); shade(geo, (x, y) => .55 + .5 * (y / size)); boxUV(geo, 8); return mesh(geo);
}

// ---------- googly eye with jiggle physics ----------
let EM;
function eyeMats() { return EM || (EM = {
  white: new THREE.MeshPhysicalMaterial({ color: 0xfbfaf4, roughness: .38, clearcoat: .3 }),
  pupil: new THREE.MeshPhysicalMaterial({ color: 0x0b0b0d, roughness: .25, clearcoat: 1, clearcoatRoughness: .15 }),
  dome: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, transparent: true, opacity: .22, clearcoat: 1, clearcoatRoughness: .04, specularIntensity: 1, envMapIntensity: 2, depthWrite: false }),
  rim: new THREE.MeshPhysicalMaterial({ color: 0xf2f2ee, roughness: .2, transparent: true, opacity: .55, clearcoat: 1 }) }); }
export function googlyEye({ r = .3, pupil = .55, look = [0, 0] } = {}) {
  const M = eyeMats(), g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .05, 48), M.white); base.rotation.x = Math.PI / 2; g.add(base);
  const pr = r * pupil, maxOff = r - pr - r * .05;
  const pp = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr, .03, 36), M.pupil); pp.rotation.x = Math.PI / 2; pp.position.set(look[0] * maxOff, look[1] * maxOff, .035); g.add(pp);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.dome); dome.rotation.x = Math.PI / 2; dome.scale.set(1, .42, 1); dome.position.z = .02; g.add(dome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * .07, 12, 48), M.rim); rim.position.z = .02; g.add(rim);
  base.castShadow = pp.castShadow = true;
  g.userData.eye = { pupil: pp, max: maxOff, p: new THREE.Vector2(look[0] * maxOff, look[1] * maxOff), v: new THREE.Vector2(), seed: Math.random() * 10 };
  return g;
}
// step every googly eye under `root` toward a look target (x,y in -1..1, in the root's screen frame) with springy physics
export function stepEyes(root, target, dt, jolt = 0) {
  root.traverse(o => { const e = o.userData && o.userData.eye; if (!e) return;
    const tx = target.x * e.max, ty = target.y * e.max - e.max * .15;
    e.v.x += ((tx - e.p.x) * 60 - e.v.x * 7) * dt + (Math.random() - .5) * jolt; e.v.y += ((ty - e.p.y) * 60 - e.v.y * 7 - 4) * dt + (Math.random() - .5) * jolt;
    e.p.x += e.v.x * dt; e.p.y += e.v.y * dt; const l = e.p.length(); if (l > e.max) { e.p.multiplyScalar(e.max / l); e.v.multiplyScalar(-.35); }
    e.pupil.position.x = e.p.x; e.pupil.position.y = e.p.y; });
}
export { THREE };
