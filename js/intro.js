// The intro: a short film before the page. A pot boils in the dark, two coins fall in, the rotini climbs out, the title slams in.
import { $, reduced } from './util.js';
import { initPot } from './pot.js';
import { CAST } from './hero.js';
import { say, setSound } from './tts.js';

export function shouldIntro() {
  const q = new URLSearchParams(location.search);
  if (q.has('intro')) return true; if (q.has('nointro') || q.has('nosmooth') || reduced || location.hash.length > 1) return false;
  try { return !sessionStorage.getItem('rot.intro'); } catch (e) { return true; }
}
export function playIntro({ mobile, onDone }) {
  const el = $('#intro'); el.hidden = false; document.documentElement.classList.add('intro-on');
  let done = false, pot = null; const cap = $('#iCap');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const type = async (txt) => { if (done) return; cap.textContent = ''; cap.classList.add('on'); for (let i = 1; i <= txt.length && !done; i++) { cap.textContent = txt.slice(0, i); await wait(32); } };
  function finish(withSound) {
    if (done && withSound === undefined) return; done = true;
    try { sessionStorage.setItem('rot.intro', '1'); } catch (e) { }
    if (withSound) { setSound(true); say('Mamma mia! Benvenuti a rot punto actor!', { pitch: 1.15, rate: 1 }); }
    el.classList.add('out'); setTimeout(() => { el.hidden = true; el.remove(); document.documentElement.classList.remove('intro-on'); pot && pot.dispose && pot.dispose(); onDone && onDone(); }, 950);
  }
  $('#iSkip').addEventListener('click', () => finish(false));
  $('#iEnter').addEventListener('click', () => finish(false));
  $('#iSound').addEventListener('click', () => finish(true));
  addEventListener('keydown', function k(e) { if (e.key === 'Escape') { removeEventListener('keydown', k); finish(false); } });
  const flat = () => { el.classList.add('flat'); };
  (async () => {
    try { pot = initPot($('#introGL'), { mobile, intro: true, onSlow: flat }); if (!pot.ok) flat(); } catch (e) { flat(); }
    await wait(250); await type('ITALIA · 03:07 · A POT IS BOILING'); await wait(900);
    await type('TWO COINS FALL IN'); 
    if (!done && pot && pot.ok) await pot.fuse({ img: null, label: '$ANY' }, { img: null, label: '$COIN' }, CAST[0]); else await wait(1400);
    if (done) return; await type('SOMETHING CLIMBS OUT'); await wait(700);
    if (done) return; cap.classList.remove('on'); el.classList.add('title'); await wait(700);
    if (!done) el.classList.add('ready');
    setTimeout(() => { if (!done && !el.matches(':hover')) { /* wait for a click; never auto-leave */ } }, 0);
  })();
}
