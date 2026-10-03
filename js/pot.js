// The pot: a boiling pasta pot. Two parent coins fall in, a brainrot climbs out.
import { THREE, creature, rig, shadowFloor, stepEyes, slowGuard } from './creature.js';
import { rotiniGeo, tubeGeo, setDough, pastaMaterial } from './pasta.js';

function coinTexture(img, label) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
  if (img) { g.save(); g.beginPath(); g.arc(128, 128, 112, 0, 7); g.clip(); const k = Math.max(224 / img.width, 224 / img.height); g.drawImage(img, 128 - img.width * k / 2, 128 - img.height * k / 2, img.width * k, img.height * k); g.restore(); }
  else { g.fillStyle = '#b8860b'; g.font = '900 64px Bagel, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(label || '?').slice(0, 5), 128, 132); }
  g.lineWidth = 14; g.strokeStyle = '#f4b52c'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function softDot() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; }

export function initPot(canvas, { mobile = false, onSlow, intro = false } = {}) {
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return { ok: false }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); rig(scene, renderer, { env: .85 }); scene.add(shadowFloor(0, .25)); const born = performance.now();
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
  // pot body (red enamel outside, cream inside)
  const prof = [[0, 0], [1.45, 0], [1.62, .12], [1.68, .5], [1.7, 1.45], [1.82, 1.5], [1.82, 1.6], [1.6, 1.6], [1.55, 1.4], [1.52, .25], [0, .2]].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Group(); scene.add(pot);
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0xe8432c, roughness: .22, clearcoat: 1, clearcoatRoughness: .08 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), enamel); body.material.side = THREE.DoubleSide; body.castShadow = body.receiveShadow = true; pot.add(body);
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 1, roughness: .2 });
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(.36, .09, 14, 32, Math.PI), steel); h.position.set(s * 1.86, 1.25, 0); h.rotation.set(0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2); h.castShadow = true; pot.add(h); }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.76, .07, 12, 80), steel); rim.rotation.x = Math.PI / 2; rim.position.y = 1.6; pot.add(rim);
  // soup surface with waves
  const soupGeo = new THREE.RingGeometry(.001, 1.56, 72, 14); soupGeo.rotateX(-Math.PI / 2); const sp = soupGeo.attributes.position, base = Float32Array.from(sp.array);
  const soupMat = new THREE.MeshPhysicalMaterial({ color: 0xf2b74a, roughness: .15, clearcoat: 1, clearcoatRoughness: .05, emissive: 0xff8a00, emissiveIntensity: .0, transmission: 0 });
  const soup = new THREE.Mesh(soupGeo, soupMat); soup.position.y = 1.28; soup.receiveShadow = true; pot.add(soup);
  // floating pasta bits
  const bits = []; setDough('classico');
  for (let i = 0; i < (mobile ? 4 : 7); i++) { const m = new THREE.Mesh(i % 2 ? tubeGeo({ L: .5, R: .13, wall: .03, ridges: 10, seg: 24, rings: 6 }) : rotiniGeo({ L: .55, R: .13, core: .04, seg: 40 }), pastaMaterial());
    const a = i / 7 * Math.PI * 2 + .4, r = .5 + (i % 3) * .32; m.position.set(Math.cos(a) * r, 1.3, Math.sin(a) * r); m.rotation.set(Math.PI / 2 + (i % 2) * .4, a, .3); m.scale.setScalar(1); m.userData = { a, r, ph: i }; pot.add(m); bits.push(m); }
  // bubbles + steam
  const dot = softDot(); const bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xffe3a0, roughness: .05, clearcoat: 1, transparent: true, opacity: .7 });
  const bubbles = Array.from({ length: 14 }, () => { const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), bubbleMat); b.userData.t = Math.random(); pot.add(b); return b; });
  const steam = Array.from({ length: mobile ? 10 : 18 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, transparent: true, opacity: 0, depthWrite: false })); s.userData.t = Math.random(); scene.add(s); return s; });
  const drops = []; const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xf6bf55, roughness: .1, clearcoat: 1 });
  let child = null, coins = [], ptr = new THREE.Vector2(), look = new THREE.Vector2(), jolt = 0, boil = 0, visible = true, raf = 0, last = performance.now(), anims = [], dead = false;
  const guard = slowGuard(() => { renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); renderer.setPixelRatio(1); size(); },
    () => { dead = true; cancelAnimationFrame(raf); anims.forEach(a => a.res()); anims = []; onSlow && onSlow(); });
  addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); }, { passive: true });
  function size() { const w = canvas.clientWidth || 400, h = canvas.clientHeight || 400; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize', size); new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { last = performance.now(); loop(); } }).observe(canvas);
  const tween = (ms, fn, ease = x => x) => new Promise(res => { if (dead) return res(); anims.push({ t0: performance.now(), ms, fn, ease, res }); });
  const back = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2), outC = x => 1 - Math.pow(1 - x, 3), inQ = x => x * x;
  function splash(n = 26) { for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.05 + Math.random() * .06, 8, 6), dropMat); d.position.set((Math.random() - .5) * .6, 1.35, (Math.random() - .5) * .6); d.userData.v = new THREE.Vector3((Math.random() - .5) * 5, 3 + Math.random() * 4, (Math.random() - .5) * 5); scene.add(d); drops.push(d); } boil = 1; jolt = 8; }
  function loop() {
    raf = 0; if (dead || !visible || document.hidden) { last = performance.now(); return; } raf = requestAnimationFrame(loop);
    const now = performance.now(), raw = (now - last) / 1000, dt = Math.min(.05, raw), t = now / 1000; last = now; if (guard(raw) > 1) return; look.lerp(ptr, .12);
    const wide = cam.aspect > 1, z0 = wide ? 8.2 : 10.5, k = intro ? Math.min(1, (now - born) / 2600) : 1, e = 1 - Math.pow(1 - k, 3);
    cam.position.set(Math.sin(t * .15) * .4 + (1 - e) * 2.5, (wide ? 4.3 : 4.8) + (1 - e) * 2.4, z0 + (1 - e) * 9); cam.lookAt(0, child ? 2.1 : 1.45, 0);
    for (let i = 0; i < sp.count; i++) { const x = base[i * 3], z = base[i * 3 + 2], r = Math.hypot(x, z); sp.setY(i, (Math.sin(r * 6 - t * 3) * .025 + Math.sin(x * 4 + t * 2.1) * Math.cos(z * 3.6 - t * 1.7) * .02) * (1 + boil * 3) * Math.min(1, (1.56 - r) * 4)); }
    sp.needsUpdate = true; soupGeo.computeVertexNormals(); soupMat.emissiveIntensity = boil * .5; boil = Math.max(0, boil - dt * .6);
    bits.forEach(b => { const u = b.userData; u.a += dt * .12; b.position.set(Math.cos(u.a) * u.r, 1.3 + Math.sin(t * 2 + u.ph) * .03, Math.sin(u.a) * u.r); b.rotation.z += dt * .2; });
    bubbles.forEach(b => { const u = b.userData; u.t += dt * (.5 + boil); if (u.t > 1) { u.t = 0; const a = Math.random() * 7, r = Math.random() * 1.3; u.x = Math.cos(a) * r; u.z = Math.sin(a) * r; } const k = u.t; b.position.set(u.x || 0, 1.3 + k * .05, u.z || 0); b.scale.setScalar(k < .85 ? k * 1.4 : (1 - k) * 8); });
    steam.forEach(s => { const u = s.userData; u.t += dt * (.18 + boil * .5); if (u.t > 1) { u.t = 0; u.x = (Math.random() - .5) * 2.2; u.z = (Math.random() - .5) * 1.6; } s.position.set((u.x || 0) + Math.sin(t + u.t * 4) * .3, 1.5 + u.t * 3.2, u.z || 0); s.scale.setScalar(.6 + u.t * 1.8); s.material.opacity = Math.sin(u.t * Math.PI) * (.28 + boil * .4); });
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.userData.v.y -= 12 * dt; d.position.addScaledVector(d.userData.v, dt); if (d.position.y < 0) { scene.remove(d); drops.splice(i, 1); } }
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i], k = Math.min(1, (now - a.t0) / a.ms); a.fn(a.ease(k), k); if (k >= 1) { anims.splice(i, 1); a.res(); } }
    if (child) { child.rotation.y = -.2 + look.x * .35 + Math.sin(t * .8) * .08; const b = child.userData.body; if (b) b.position.y = child.userData.by + Math.abs(Math.sin(t * 2.4)) * .05; stepEyes(child, { x: look.x, y: look.y }, dt, jolt); }
    jolt *= .9; renderer.render(scene, cam);
  }
  loop();
  function clearChild() { if (child) { scene.remove(child); child = null; } }
  async function rise(d) {
    clearChild(); child = creature(d); child.userData.by = child.userData.body.position.y; child.scale.setScalar(.01); child.position.set(0, .4, 0); scene.add(child);
    const h = child.userData.height; jolt = 10;
    await tween(1100, (k) => { child.position.y = .4 + k * 1.0; child.scale.setScalar(Math.max(.01, k) * (2.3 / Math.max(2.3, h))); child.rotation.y = (1 - k) * Math.PI * 2 - .2; }, back);
  }
  return {
    get ok() { return !dead; }, canvas,
    async fuse(a, b, d) {
      coins.forEach(c => scene.remove(c)); coins = []; clearChild();
      const mk = (img, label, x) => { const tex = coinTexture(img, label); const side = new THREE.MeshPhysicalMaterial({ color: 0xf2b73a, metalness: .9, roughness: .25 });
        const face = new THREE.MeshPhysicalMaterial({ map: tex, roughness: .35, metalness: .2, clearcoat: .8 }); const m = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .12, 48), [side, face, face]);
        m.position.set(x, 3.6, 0); m.rotation.x = Math.PI / 2; m.castShadow = true; scene.add(m); coins.push(m); return m; };
      const A = mk(a.img, a.label, -2.1), B = mk(b.img, b.label, 2.1);
      await tween(500, k => { A.position.y = B.position.y = 3.6 + Math.sin(k * Math.PI) * .25; A.rotation.z = B.rotation.z = k * Math.PI * 2; }, outC);
      await tween(800, k => { A.position.set(-2.1 * (1 - k), 3.6 + Math.sin(k * Math.PI) * .9 - k * 2.4, 0); B.position.set(2.1 * (1 - k), 3.6 + Math.sin(k * Math.PI) * .9 - k * 2.4, 0); A.rotation.y = B.rotation.y = k * 6; }, inQ);
      coins.forEach(c => scene.remove(c)); coins = []; splash();
      await tween(500, () => { });
      await rise(d);
    },
    async swap(d) { splash(14); await rise(d); },
    dispose() { dead = true; cancelAnimationFrame(raf); renderer.dispose(); },
    reset() { clearChild(); coins.forEach(c => scene.remove(c)); coins = []; },
    stir() { boil = 1; jolt = 6; },
  };
}
