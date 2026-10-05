/* listen.js - "Listen" bar: reads the current page aloud.
   Uses the text-to-speech built into the phone/browser (free, no API key). */

const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const RATE_KEY = 'afmc.listenRate';
const RATES = [0.8, 1, 1.25, 1.5];

let chunks = [];
let index = 0;           // which chunk is being read
let state = 'idle';      // idle | playing | paused
let session = 0;         // changes on every start/stop so old callbacks are ignored
let rate = loadRate();
let viewEl = null;
let ui = null;

function loadRate() {
  try {
    const r = parseFloat(localStorage.getItem(RATE_KEY));
    return RATES.includes(r) ? r : 1;
  } catch (e) { return 1; }
}
function saveRate(r) { try { localStorage.setItem(RATE_KEY, String(r)); } catch (e) { /* ignore */ } }

/* All readable text on the page, except the Listen bar itself. */
function pageText(view) {
  return [...view.children]
    .filter((el) => !el.hasAttribute('data-no-speak'))
    .map((el) => el.innerText.trim())
    .filter(Boolean)
    .join('\n');
}

/* Phones stop reading very long text, so we read it in short pieces. */
export function toChunks(text) {
  let parts = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  // very long sentences: break them at commas, semicolons or colons
  parts = parts.flatMap((p) => (p.length > 220 ? p.split(/(?<=[,;:])\s+/) : [p]));
  // still too long (no punctuation): break by words
  parts = parts.flatMap((p) => {
    if (p.length <= 220) return [p];
    const words = p.split(' '); const pieces = []; let line = '';
    for (const w of words) { if (line && (line + ' ' + w).length > 180) { pieces.push(line); line = w; } else line = line ? line + ' ' + w : w; }
    if (line) pieces.push(line);
    return pieces;
  });
  const out = [];
  let cur = '';
  for (const p of parts) {
    if (cur && (cur + ' ' + p).length > 180) { out.push(cur); cur = p; }
    else cur = cur ? cur + ' ' + p : p;
  }
  if (cur) out.push(cur);
  return out;
}

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang.startsWith('en')) || null;
}

function speakChunk() {
  if (index >= chunks.length) { finish(); return; }
  const mine = session;
  const u = new SpeechSynthesisUtterance(chunks[index]);
  const voice = pickVoice();
  if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-IN'; }
  u.rate = rate;
  u.onend = () => {
    if (mine !== session || state !== 'playing') return;
    index += 1;
    speakChunk();
  };
  u.onerror = (e) => {
    if (mine !== session) return;
    if (e.error === 'canceled' || e.error === 'interrupted') return;
    finish('Could not read this page aloud on this device.');
  };
  speechSynthesis.speak(u);
}

function play() {
  session += 1;
  speechSynthesis.cancel();
  state = 'playing';
  paint();
  const mine = session;
  setTimeout(() => { if (mine === session && state === 'playing') speakChunk(); }, 60);
}

function start() {
  chunks = toChunks(pageText(viewEl));
  index = 0;
  if (!chunks.length) { paint('Nothing to read on this page.'); return; }
  play();
}
function pause() { state = 'paused'; session += 1; speechSynthesis.cancel(); paint(); }
function stop() { state = 'idle'; session += 1; speechSynthesis.cancel(); index = 0; paint(); }
function finish(message = 'Finished.') { state = 'idle'; index = 0; paint(message); }

function paint(message = '') {
  if (!ui) return;
  const label = { idle: '▶ Listen', playing: '⏸ Pause', paused: '▶ Resume' }[state];
  ui.main.textContent = label;
  ui.stop.hidden = state === 'idle';
  ui.status.textContent = message || (state === 'playing' ? 'Reading…' : state === 'paused' ? 'Paused.' : '');
}

/* Called after every page loads: adds a fresh Listen bar at the top. */
export function mountListenBar(view) {
  session += 1;
  if (supported) speechSynthesis.cancel();
  state = 'idle';
  index = 0;
  viewEl = view;

  const bar = document.createElement('div');
  bar.className = 'listen';
  bar.setAttribute('data-no-speak', '');
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Listen to this page');
  bar.innerHTML = supported
    ? `<button type="button" class="btn primary" data-act="main"></button>
       <button type="button" class="btn" data-act="stop" hidden>⏹ Stop</button>
       <label class="speed">Speed
         <select data-act="rate">${RATES.map((r) => `<option value="${r}"${r === rate ? ' selected' : ''}>${r}x</option>`).join('')}</select>
       </label>
       <span class="listen-status" role="status" aria-live="polite"></span>`
    : '<span class="listen-status">Listening is not supported in this browser.</span>';
  view.prepend(bar);

  if (!supported) { ui = null; return; }
  ui = { main: bar.querySelector('[data-act="main"]'), stop: bar.querySelector('[data-act="stop"]'), status: bar.querySelector('.listen-status') };
  paint();

  bar.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'main') { state === 'playing' ? pause() : state === 'paused' ? play() : start(); }
    if (act === 'stop') stop();
  });
  bar.addEventListener('change', (e) => {
    if (e.target.dataset.act !== 'rate') return;
    rate = parseFloat(e.target.value);
    saveRate(rate);
    if (state === 'playing') play();   // restart the current piece at the new speed
  });
}
