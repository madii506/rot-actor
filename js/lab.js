// The lab: pick two parents, fuse them in the pot, name the bambino, launch it on pump.fun from your own wallet.
import { $, $$, B58, REG, esc, short, usd, api, post, proxied, toast, loadImg, confetti } from './util.js';
import { dna, tint, portrait } from './creature.js';
import { houseName } from './names.js';
import { say, stop } from './tts.js';
import { initPot } from './pot.js';

const MEMO = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', CB = 'ComputeBudget111111111111111111111111111111';
const DOUGHS = ['classico', 'spinaci', 'pomodoro', 'nero', 'barbabietola', 'curcuma', 'viola'];
const S = { a: null, b: null, ta: null, tb: null, salt: '', d: null, nm: null, img: null, own: null, busy: false, pot: null, trend: [] };
export const wallet = { addr: null, listeners: new Set() };
const provider = () => (window.phantom && window.phantom.solana) || window.solflare || window.backpack || window.solana || null;
export async function connect() {
  const p = provider(); if (!p) { toast('No Solana wallet found. Install Phantom, Solflare or Backpack.'); return null; }
  const r = await p.connect(); wallet.addr = ((r && r.publicKey) || p.publicKey).toString(); wallet.listeners.forEach(f => f(wallet.addr)); return p;
}
export async function disconnect() { const p = provider(); try { p && p.disconnect && await p.disconnect(); } catch (e) { } wallet.addr = null; wallet.listeners.forEach(f => f(null)); }

const deb = (() => { const m = new Map(); return (k, f, ms = 320) => { clearTimeout(m.get(k)); m.set(k, setTimeout(f, ms)); }; })();
function chosenHTML(t) { return `<img src="${esc(proxied(t.icon))}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(t.name)}</b><small>$${esc(t.symbol)} · ${usd(t.mcap)}</small><code>${esc(short(t.mint))}</code></div><button type="button" class="clr" aria-label="Remove">×</button>`; }
function setParent(k, t) {
  const other = k === 'a' ? S.b : S.a; if (t && other && other.mint === t.mint) { toast('Pick two different coins.'); return; }
  S[k] = t; S['t' + k] = null; const box = $('#c' + k), pick = $('#q' + k).closest('.pick');
  if (t) { box.innerHTML = chosenHTML(t); box.hidden = false; pick.hidden = true; $('#d' + k).innerHTML = ''; box.closest('.slot').classList.add('full'); }
  else { box.hidden = true; pick.hidden = false; $('#q' + k).value = ''; box.closest('.slot').classList.remove('full'); }
  $('#fuseBtn').disabled = !(S.a && S.b) || S.busy; $('#fuseBtn').classList.toggle('ready', !!(S.a && S.b));
  const nowB = S.a && S.b; $('#potHint').textContent = nowB ? `$${S.a.symbol} × $${S.b.symbol}. Into the pot?` : S.a || S.b ? 'One more coin.' : 'Pick two coins.';
  renderChips();
}
async function lookup(k) {
  const q = $('#q' + k).value.trim(), drop = $('#d' + k); if (q.length < 2) { drop.innerHTML = ''; return; }
  drop.innerHTML = '<div class="dl">Looking…</div>';
  const j = await api('/api/token?q=' + encodeURIComponent(q));
  if ($('#q' + k).value.trim() !== q) return;
  if (!j.ok) { drop.innerHTML = `<div class="dl err">${esc(j.error || 'Nothing found')}</div>`; return; }
  if (j.token) { drop.innerHTML = ''; setParent(k, j.token); return; }
  const l = j.list || []; drop.innerHTML = l.length ? l.map((t, i) => `<button type="button" data-i="${i}"><img src="${esc(proxied(t.icon))}" alt="" onerror="this.style.visibility='hidden'"><span><b>$${esc(t.symbol)}</b> ${esc(t.name)}</span><em>${usd(t.mcap)}</em>${t.verified ? '<i title="verified">✓</i>' : ''}</button>`).join('') : '<div class="dl">No coin with that ticker.</div>';
  drop._list = l;
}
function renderChips() {
  const el = $('#chips'); if (!S.trend.length) { el.innerHTML = '<span class="dl">Trending list unavailable right now. Paste any contract address above.</span>'; return; }
  el.innerHTML = S.trend.map((t, i) => `<button type="button" class="chip${(S.a && S.a.mint === t.mint) || (S.b && S.b.mint === t.mint) ? ' on' : ''}" data-i="${i}"><img src="${esc(proxied(t.icon))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">$${esc(t.symbol)}</button>`).join('');
}
const rndSalt = () => Math.random().toString(36).slice(2, 6);
const code = d => DOUGHS.indexOf(d.dough) + d.accent.replace('#', '').slice(0, 6).toLowerCase();
let typing = 0;
function caption(name, line) { const el = $('#cap'); el.innerHTML = '<b></b><span></span>'; el.classList.add('on'); const b = el.querySelector('b'), s = el.querySelector('span'); const my = ++typing; let i = 0;
  (function tick() { if (my !== typing) return; b.textContent = name.slice(0, ++i); if (i < name.length) setTimeout(tick, 45); else s.textContent = line; })(); }
async function nameIt() {
  const a = { name: S.a.name, symbol: S.a.symbol, mint: S.a.mint }, b = { name: S.b.name, symbol: S.b.symbol, mint: S.b.mint };
  const j = await post('/api/name', { a, b, shape: S.d.shape, salt: S.salt }, 16000);
  return j && j.ok ? j : houseName(a, b, S.salt);
}
function fill() {
  const n = S.nm; $('#fName').value = n.name; $('#fTick').value = n.ticker; $('#fLore').value = n.lore;
  $('#certName').textContent = n.name; $('#certPar').innerHTML = `$${esc(S.a.symbol)} <i>×</i> $${esc(S.b.symbol)} <em>${esc(S.d.shape)} · ${esc(S.d.dough)}</em>`;
  $('#certNo').textContent = (Date.now() % 1e6).toString().padStart(6, '0'); $('#certBy').textContent = n.by === 'ai' ? 'named by AI' : 'named by the house';
  check();
}
function paint() { S.img = portrait(S.d, 512); if (!S.own) $('#certImg').src = S.img; $('#potFlat').src = S.img; }
function check() { const ok = !!(S.d && $('#fName').value.trim() && /^[A-Za-z0-9]{1,10}$/.test($('#fTick').value.trim())); $('#launchBtn').disabled = !ok || S.busy; return ok; }

async function fuse() {
  if (!S.a || !S.b || S.busy) return; S.busy = true; $('#fuseBtn').disabled = true; $('#fuseBtn').textContent = 'Boiling…'; $('#potTools').hidden = true; stop();
  $('#cap').classList.remove('on'); $('#born').hidden = true; $('#log').hidden = true; $('#log').innerHTML = '';
  try {
    const [ia, ib] = await Promise.all([loadImg(proxied(S.a.icon)), loadImg(proxied(S.b.icon))]);
    S.ta = ia ? tint(ia) : null; S.tb = ib ? tint(ib) : null; S.salt = rndSalt(); S.d = dna(S.a.mint, S.b.mint, S.salt, S.ta, S.tb);
    const naming = nameIt();
    ensurePot(); if (S.pot && S.pot.ok) await S.pot.fuse({ img: ia, label: S.a.symbol }, { img: ib, label: S.b.symbol }, S.d);
    S.nm = await naming; paint(); fill(); caption(S.nm.name, S.nm.line);
    say(S.nm.line, { pitch: S.d.pitch, rate: S.d.rate });
    $('#potTools').hidden = false; $('#cert').classList.remove('just'); void $('#cert').offsetWidth; $('#cert').classList.add('just');
    if (innerWidth < 980) setTimeout(() => $('#cert').scrollIntoView({ behavior: 'smooth', block: 'start' }), 900);
  } catch (e) { toast('The pot boiled over: ' + (e.message || e)); }
  finally { S.busy = false; $('#fuseBtn').disabled = !(S.a && S.b); $('#fuseBtn').textContent = 'Fuse again'; check(); }
}

/* ---------- launch (pump.fun create via PumpPortal, tagged with the rot.actor memo + REG key) ---------- */
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64e = u => { let s = ''; const a = new Uint8Array(u); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const rpc = async (method, params) => { const j = await post('/api/rpc', { method, params }, 25000); if (j.error) throw new Error(j.error.message || j.error); if (!('result' in j)) throw new Error('rpc unavailable'); return j.result; };
const script = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src + ' did not load')); document.head.append(s); });
// web3.js reads a global Buffer for u64 fields (lookup tables, transfers), so load the polyfill first
async function loadWeb3() { if (!window.Buffer) await script('/vendor/buffer.min.js'); if (!window.solanaWeb3) await script('/vendor/web3.min.js'); }
async function tag(vtx, text, payer) {
  const W = window.solanaWeb3, msg = vtx.message, looks = msg.addressTableLookups || []; let alts = [];
  if (looks.length) { const r = await rpc('getMultipleAccounts', [looks.map(l => l.accountKey.toBase58()), { encoding: 'base64' }]); alts = r.value.map((a, i) => new W.AddressLookupTableAccount({ key: looks[i].accountKey, state: W.AddressLookupTableAccount.deserialize(b64d(a.data[0])) })); }
  const dec = W.TransactionMessage.decompile(msg, { addressLookupTableAccounts: alts });
  for (const ix of dec.instructions) if (ix.programId.toBase58() === CB && ix.data[0] === 2) { const dv = new DataView(ix.data.buffer, ix.data.byteOffset, ix.data.length); dv.setUint32(1, dv.getUint32(1, true) + 30000, true); }
  dec.instructions.push(new W.TransactionInstruction({ programId: new W.PublicKey(MEMO), keys: [], data: new TextEncoder().encode(text) }));
  const t = W.SystemProgram.transfer({ fromPubkey: payer, toPubkey: payer, lamports: 0 }); t.keys.push({ pubkey: new W.PublicKey(REG), isSigner: false, isWritable: false }); dec.instructions.push(t);
  const tagged = new W.VersionedTransaction(dec.compileToV0Message(alts));
  const sim = await rpc('simulateTransaction', [b64e(tagged.serialize()), { encoding: 'base64', sigVerify: false, replaceRecentBlockhash: true, commitment: 'confirmed' }]);
  if (sim && sim.value && sim.value.err) { const logs = (sim.value.logs || []).join(' '); throw new Error(/insufficient|0x1\b/i.test(logs + JSON.stringify(sim.value.err)) ? 'not enough SOL in this wallet for the launch and dev buy' : 'the launch failed simulation: ' + JSON.stringify(sim.value.err)); }
  return tagged;
}
function log(t, cls = '') { const el = $('#log'); el.hidden = false; const li = document.createElement('li'); li.className = cls; li.innerHTML = t; el.appendChild(li); return li; }
async function shrink(dataURL) { const img = await loadImg(dataURL); if (!img) return dataURL; const Z = 512, c = document.createElement('canvas'); c.width = c.height = Z; const g = c.getContext('2d'); const k = Math.max(Z / img.width, Z / img.height); g.drawImage(img, (Z - img.width * k) / 2, (Z - img.height * k) / 2, img.width * k, img.height * k); let d = c.toDataURL('image/png'); if (d.length > 1.2e6) d = c.toDataURL('image/jpeg', .9); return d; }
async function launch(e) {
  e && e.preventDefault(); if (S.busy || !check()) return;
  const name = $('#fName').value.trim().slice(0, 32), sym = $('#fTick').value.trim().toUpperCase().slice(0, 10), lore = $('#fLore').value.trim(), x = $('#fX').value.trim(), buy = Math.max(0, +($('#fBuy').value || 0));
  if (x && !/^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/?$/.test(x)) { toast('The X link should look like https://x.com/yourhandle'); return; }
  S.busy = true; $('#launchBtn').disabled = true; $('#log').innerHTML = ''; $('#born').hidden = true;
  try {
    log('Connecting your wallet…'); const p = await connect(); if (!p) throw new Error('no wallet'); log('Wallet ' + esc(short(wallet.addr)) + ' connected.', 'ok');
    await loadWeb3(); const W = window.solanaWeb3; const mintKp = W.Keypair.generate(); const mint = mintKp.publicKey.toBase58();
    const desc = `${lore} Born on rot.actor from $${S.a.symbol} × $${S.b.symbol}.`.slice(0, 500);
    log('1/5 Uploading the brainrot and its papers…');
    const ip = await post('/api/launch', { op: 'ipfs', image: await shrink(S.own || S.img), name, symbol: sym, description: desc, twitter: x, website: location.origin + '/c/' + mint }, 45000);
    if (!ip.ok) throw new Error(ip.error || 'metadata upload failed');
    log('2/5 Building the pump.fun launch…');
    const tj = await post('/api/launch', { op: 'tx', publicKey: wallet.addr, mint, name, symbol: sym, uri: ip.uri, amount: buy }, 30000);
    if (!tj.ok) throw new Error(tj.error || 'launch build failed');
    const memo = `rot:v1:${S.a.mint}:${S.b.mint}:${mint}:${S.salt}.${code(S.d)}`;
    log('3/5 Writing the bloodline into it…'); const vtx = await tag(W.VersionedTransaction.deserialize(b64d(tj.tx)), memo, new W.PublicKey(wallet.addr)); log('Bloodline: <code>' + esc(short(S.a.mint)) + ' × ' + esc(short(S.b.mint)) + '</code>', 'ok');
    log('4/5 Approve it in your wallet…'); const signed = await p.signTransaction(vtx); signed.sign([mintKp]);
    const sig = await rpc('sendTransaction', [b64e(signed.serialize()), { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 }]);
    log(`5/5 Sent <a href="https://solscan.io/tx/${esc(sig)}" target="_blank" rel="noopener">${esc(short(sig))}</a>. Waiting for Solana…`);
    let ok = false;
    for (let i = 0; i < 40 && !ok; i++) { await new Promise(r => setTimeout(r, 1500)); try { const st = await rpc('getSignatureStatuses', [[sig]]); const v = st.value && st.value[0]; if (v && v.err) throw new Error('the launch failed on chain'); if (v && /confirmed|finalized/.test(v.confirmationStatus || '')) ok = true; } catch (er) { if (/failed on chain/.test(er.message)) throw er; } }
    if (!ok) { log('Not confirmed yet. Open the transaction link, it may still land.', 'err'); return; }
    confetti(140); say(S.nm ? S.nm.line : name, { pitch: S.d.pitch, rate: S.d.rate });
    const share = encodeURIComponent(`${name} ($${sym}) was just born on rot.actor\n$${S.a.symbol} × $${S.b.symbol} went into the pot. This came out.\n${location.origin}/c/${mint}`);
    $('#born').innerHTML = `<b>It's alive.</b><span>$${esc(sym)} is live on pump.fun.</span><div class="row"><a class="btn gold" href="https://pump.fun/coin/${esc(mint)}" target="_blank" rel="noopener">Open on pump.fun</a><a class="btn" href="/c/${esc(mint)}">Its page</a><a class="btn" href="https://x.com/intent/post?text=${share}" target="_blank" rel="noopener">Post it</a></div>`;
    $('#born').hidden = false; log('Live. Its page fills in within a minute.', 'ok'); document.dispatchEvent(new CustomEvent('rot:born', { detail: { mint } }));
  } catch (er) { if (er.message !== 'no wallet') log(esc(/reject|denied|cancel/i.test(er.message) ? 'You cancelled it in your wallet.' : er.message || String(er)), 'err'); }
  finally { S.busy = false; check(); }
}

function flat() { $('#potBox').classList.add('flat'); $('#potGL').hidden = true; }
function ensurePot() { if (!S.pot) { S.pot = initPot($('#potGL'), { mobile: S.mobile, onSlow: () => { flat(); if (S.img) $('#potFlat').src = S.img; } }); if (!S.pot.ok) flat(); } return S.pot; }
export function initLab({ mobile = false } = {}) {
  S.mobile = mobile; new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { ensurePot(); o.disconnect(); } }, { rootMargin: '900px 0px' }).observe($('#potBox'));
  for (const k of ['a', 'b']) {
    $('#q' + k).addEventListener('input', () => deb(k, () => lookup(k)));
    $('#q' + k).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); lookup(k); } });
    $('#d' + k).addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; setParent(k, $('#d' + k)._list[+b.dataset.i]); });
    $('#c' + k).addEventListener('click', e => { if (e.target.closest('.clr')) setParent(k, null); });
  }
  $('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const t = S.trend[+b.dataset.i]; if ((S.a && S.a.mint === t.mint)) return setParent('a', null); if (S.b && S.b.mint === t.mint) return setParent('b', null); setParent(!S.a ? 'a' : 'b', t); });
  $('#rnd').addEventListener('click', () => { if (S.trend.length < 2) return toast('Trending list is still loading.'); const i = Math.floor(Math.random() * S.trend.length); let j = Math.floor(Math.random() * (S.trend.length - 1)); if (j >= i) j++; setParent('a', null); setParent('b', null); setParent('a', S.trend[i]); setParent('b', S.trend[j]); const pt = ensurePot(); pt.ok && pt.stir(); });
  $('#fuseBtn').addEventListener('click', fuse);
  $('#reLook').addEventListener('click', async () => { if (!S.d || S.busy) return; S.salt = rndSalt(); S.d = dna(S.a.mint, S.b.mint, S.salt, S.ta, S.tb); if (ensurePot().ok) await S.pot.swap(S.d); paint(); fill(); });
  $('#reName').addEventListener('click', async () => { if (!S.d || S.busy) return; $('#reName').disabled = true; S.salt = rndSalt(); S.nm = await nameIt(); $('#reName').disabled = false; fill(); caption(S.nm.name, S.nm.line); say(S.nm.line, { pitch: S.d.pitch, rate: S.d.rate }); });
  $('#hear').addEventListener('click', () => { if (S.nm) say(S.nm.line, { pitch: S.d.pitch, rate: S.d.rate, force: true }); });
  ['#fName', '#fTick'].forEach(id => $(id).addEventListener('input', () => { if (id === '#fTick') $(id).value = $(id).value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (id === '#fName') $('#certName').textContent = $('#fName').value || '—'; check(); }));
  $$('[data-buy]').forEach(b => b.addEventListener('click', () => { $('#fBuy').value = b.dataset.buy; }));
  $('#fImg').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; if (f.size > 8e6) { toast('Images up to 8 MB.'); e.target.value = ''; return; } const r = new FileReader(); r.onload = () => { S.own = r.result; $('#certImg').src = S.own; $('#ownClr').hidden = false; }; r.readAsDataURL(f); });
  $('#ownClr').addEventListener('click', () => { S.own = null; $('#fImg').value = ''; $('#ownClr').hidden = true; if (S.img) $('#certImg').src = S.img; });
  $('#cert').addEventListener('submit', launch);
  api('/api/trending').then(j => { S.trend = (j && j.ok && j.list) || []; renderChips(); });
  renderChips();
  // deep link: /#fuse?a=<mint>&b=<mint>
  const q = new URLSearchParams((location.hash.split('?')[1]) || location.search.slice(1));
  for (const k of ['a', 'b']) { const m = q.get(k); if (m && B58.test(m)) api('/api/token?q=' + m).then(j => { if (j.ok && j.token) setParent(k, j.token); }); }
  return { setParent };
}
