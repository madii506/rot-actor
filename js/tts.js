// The brainrot voice: the browser's own speech engine, Italian when the device has it. Off until the visitor turns sound on or presses a speak button.
let voices = [], on = false; const subs = new Set();
function load() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { load(); speechSynthesis.onvoiceschanged = load; }
export const canSpeak = () => 'speechSynthesis' in window;
export const soundOn = () => on;
export function setSound(v) { on = !!v; try { localStorage.setItem('rot.sound', on ? '1' : '0'); } catch (e) { } subs.forEach(f => f(on)); if (!on) stop(); }
export function onSound(f) { subs.add(f); f(on); }
try { on = localStorage.getItem('rot.sound') === '1'; } catch (e) { }
export function stop() { try { speechSynthesis.cancel(); } catch (e) { } }
export function say(text, { pitch = 1, rate = 1, force = false, onword, onend } = {}) {
  if (!canSpeak() || (!on && !force)) { onend && onend(); return false; }
  stop(); const u = new SpeechSynthesisUtterance(String(text).slice(0, 300));
  const it = voices.find(v => /^it(-|_|$)/i.test(v.lang)) || voices.find(v => /ital/i.test(v.name)); if (it) { u.voice = it; u.lang = it.lang; } else u.lang = 'it-IT';
  u.pitch = Math.max(.1, Math.min(2, pitch)); u.rate = Math.max(.6, Math.min(1.4, rate)); u.volume = 1;
  if (onword) u.onboundary = e => onword(e.charIndex); u.onend = () => onend && onend(); u.onerror = () => onend && onend();
  try { speechSynthesis.speak(u); } catch (e) { onend && onend(); return false; } return true;
}
