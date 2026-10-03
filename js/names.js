// House name generator: always works, no network. The AI writes better ones when it is reachable.
const SA = ['olino', 'ellino', 'uccio', 'ino', 'etto', 'accio', 'ardo', 'ozzo', 'oni'];
const SB = ['ellini', 'ini', 'ucci', 'olini', 'etti', 'otti', 'oni', 'ella', 'ina'];
const LORE = [
  (a, b) => `Born when ${a} fell into a pot of ${b} and nobody turned off the stove.`,
  (a, b) => `Half ${a}, half ${b}, fully al dente. Speaks only Italian. Owes nobody anything.`,
  (a, b) => `Boiled for eleven minutes with ${a} and ${b}. Climbed out talking.`,
  (a, b) => `${a} and ${b} shared one pot. This is what crawled out of it.`,
  (a, b) => `Nobody asked ${a} and ${b} to have a bambino. It happened anyway.`,
  (a, b) => `Raised on ${a} broth and ${b} sauce. Refuses to be drained.`,
];
const LINE = [
  (n, a, b) => `${n}! ${n}! Mamma mia, sono nato da ${a} e ${b}!`,
  (n, a, b) => `Io sono ${n}. Pasta di ${a}, sugo di ${b}. Capisci?`,
  (n, a, b) => `${n}, ${n}... il bambino di ${a} e ${b} è arrivato!`,
  (n, a, b) => `Ecco ${n}! Metà ${a}, metà ${b}, tutto al dente!`,
];
export function hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s >>> 0) / 4294967296; }; }
const word = s => (String(s || '').replace(/\$/g, '').match(/[A-Za-z]+/g) || ['Pasta']).sort((x, y) => y.length - x.length)[0];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
export function stem(s) {
  const w = word(s); const m = /^[^aeiouy]*[aeiouy]+[^aeiouy]{0,2}/i.exec(w);
  let st = m ? m[0] : w.slice(0, 4); if (st.length < 3) st = w.slice(0, 4); if (st.length > 6) st = st.slice(0, 6);
  return cap(st.replace(/[aeiouy]$/i, '') || st);
}
export function houseName(a, b, salt = '') {
  const r = rng(hash((a.mint || a.symbol || a.name) + '|' + (b.mint || b.symbol || b.name) + '|' + salt));
  const pick = l => l[Math.floor(r() * l.length)];
  const A = a.symbol || a.name, B = b.symbol || b.name;
  const name = (stem(a.name || A) + pick(SA) + ' ' + stem(b.name || B) + pick(SB)).slice(0, 32);
  const ticker = (stem(A) + stem(B)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  const ta = '$' + String(A).toUpperCase(), tb = '$' + String(B).toUpperCase();
  return { name, ticker, lore: pick(LORE)(ta, tb), line: pick(LINE)(name, String(a.name || A), String(b.name || B)), by: 'house' };
}
