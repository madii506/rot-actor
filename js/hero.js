// Hero scene: the house cast on a sunburst stage. Eyes follow the pointer, click one and it jumps, scrolling moves the camera.
import { THREE, creature, rig, shadowFloor, stepEyes, slowGuard } from './creature.js';

export const CAST = [
  { shape: 'rotini', pose: 'wave', hat: 'none', eyes: 2, eyeK: 1.12, dough: 'classico', accent: '#ffd23f', looks: [[.4, .2], [-.3, .4], [0, 0]], tilt: 0, pitch: 1, rate: 1 },
  { shape: 'penne', pose: 'hips', hat: 'bow', eyes: 2, eyeK: 1.05, dough: 'spinaci', accent: '#ff4d6d', looks: [[.3, -.2], [.5, .3], [0, 0]], tilt: .05, pitch: 1.3, rate: 1.05 },
  { shape: 'gnocco', pose: 'up', hat: 'beret', eyes: 2, eyeK: 1, dough: 'pomodoro', accent: '#1fb6ff', looks: [[-.4, .3], [.2, -.4], [0, 0]], tilt: -.05, pitch: .7, rate: .95 },
  { shape: 'farfalle', pose: 'wave', hat: 'party', eyes: 3, eyeK: 1, dough: 'barbabietola', accent: '#ffd23f', looks: [[.2, .5], [-.5, .1], [.3, -.3]], tilt: 0, pitch: 1.6, rate: 1.1 },
  { shape: 'maccheroni', pose: 'point', hat: 'crown', eyes: 2, eyeK: 1.1, dough: 'curcuma', accent: '#7b5cff', looks: [[.6, 0], [.1, .5], [0, 0]], tilt: 0, pitch: 1.1, rate: 1 },
  { shape: 'rigatoni', pose: 'hips', hat: 'phones', eyes: 2, eyeK: 1, dough: 'nero', accent: '#3ddc97', looks: [[-.2, -.5], [.4, .2], [0, 0]], tilt: 0, pitch: .8, rate: .95 },
];

export function initHero(canvas, { mobile = false, onPoke, onSlow } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return { ok: false }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); rig(scene, renderer); scene.add(shadowFloor(0, .2));
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 100);
  const spots = mobile
    ? [[0, 0, .5, 1.1], [-1.75, 0, -.7, .78], [1.75, 0, -.6, .78], [-1.05, 0, 1.5, .62], [1.15, 0, 1.6, .62]]
    : [[3.0, 0, .3, 1.3], [1.0, 0, -1.3, .85], [5.3, 0, -1.0, .9], [1.9, 0, 1.6, .7], [6.3, 0, 1.1, .75], [4.2, 0, 2.2, .62]];
  const cast = spots.map((s, i) => { const c = creature(CAST[i]); c.position.set(s[0], s[1], s[2]); c.scale.setScalar(s[3]); c.rotation.y = -.25 - s[0] * .05; c.userData.base = { ...c.position, s: s[3], ry: c.rotation.y };
    c.userData.ph = i * 1.37; c.userData.jump = 0; scene.add(c); return c; });
  const ptr = new THREE.Vector2(0, 0), look = new THREE.Vector2(0, 0); let progress = 0, visible = true, raf = 0, last = performance.now(), jolt = 0, dead = false;
  const guard = slowGuard(() => { renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); renderer.setPixelRatio(1); size(); },
    () => { dead = true; cancelAnimationFrame(raf); canvas.hidden = true; onSlow && onSlow(); });
  const onMove = e => { const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); };
  addEventListener('pointermove', onMove, { passive: true });
  const ray = new THREE.Raycaster();
  canvas.addEventListener('click', e => { const r = canvas.getBoundingClientRect(); const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); ray.setFromCamera(v, cam);
    const hit = ray.intersectObjects(cast, true)[0]; if (!hit) return; let o = hit.object; while (o.parent && !cast.includes(o)) o = o.parent; poke(o); });
  function poke(c) { c.userData.jump = 1; jolt = 6; onPoke && onPoke(c.userData.dna || CAST[cast.indexOf(c)], cast.indexOf(c)); }
  function size() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { last = performance.now(); loop(); } }, { threshold: 0 }); io.observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) loop(); });
  function loop() {
    raf = 0; if (dead || !visible || document.hidden) { last = performance.now(); return; } raf = requestAnimationFrame(loop);
    const now = performance.now(), raw = (now - last) / 1000, dt = Math.min(.05, raw), t = now / 1000; last = now; if (guard(raw) > 1) return;
    look.lerp(ptr, .12);
    const p = progress, wide = cam.aspect > 1.1;
    if (wide) { cam.position.set(1.2 + p * 1.4, 2.7 - p * .9, 15 - p * 4.5); cam.lookAt(.6 + p * .9, 1.7 - p * .3, 0); } else { cam.position.set(p * .6, 2.5 - p * .6, 15.5 - p * 4); cam.lookAt(0, 1.75 - p * .2, 0); }
    cast.forEach((c, i) => { const b = c.userData.base, ph = c.userData.ph;
      if (c.userData.jump > 0) { c.userData.jump = Math.max(0, c.userData.jump - dt * 1.6); }
      const j = c.userData.jump, hop = Math.sin((1 - j) * Math.PI) * (j > 0 ? 1.1 : 0);
      const dance = Math.abs(Math.sin(t * 2.2 + ph)) * .12 * (i === 0 ? .6 : 1);
      c.position.y = b.y + dance + hop + Math.max(0, p - i * .12) * 0;
      const sq = 1 + Math.sin(t * 4.4 + ph * 2) * .025; c.scale.set(b.s / Math.sqrt(sq), b.s * sq, b.s / Math.sqrt(sq));
      c.rotation.z = Math.sin(t * 1.6 + ph) * .06; c.rotation.y = b.ry + Math.sin(t * .7 + ph) * .18 + look.x * .25 + (j > 0 ? (1 - j) * Math.PI * 2 : 0);
      stepEyes(c, { x: look.x, y: look.y }, dt, jolt);
    });
    jolt *= .9; renderer.render(scene, cam);
  }
  loop();
  return { get ok() { return !dead; }, setProgress(v) { progress = Math.max(0, Math.min(1, v)); }, poke: i => cast[i] && poke(cast[i]), dispose() { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('pointermove', onMove); renderer.dispose(); } };
}
