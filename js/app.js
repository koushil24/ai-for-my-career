/* app.js - starts the site: branding, menu, theme, and the pages. */
import { BRAND, ROUTES, TABS } from './config.js';
import { registerPage, startRouter, currentRoute } from './router.js';
import { touchStreak, getStats, getState } from './store.js';

/* ---------- small helpers ---------- */
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let curriculumCache = null;
async function loadCurriculum() {
  if (!curriculumCache) {
    const res = await fetch('data/curriculum.json');
    if (!res.ok) throw new Error('curriculum.json not found');
    curriculumCache = await res.json();
  }
  return curriculumCache;
}

/* ---------- branding, theme, menu ---------- */
function setupBranding() {
  const logo = document.getElementById('brand-logo');
  logo.src = BRAND.logo;
  document.getElementById('brand-title').textContent = BRAND.title;
  document.getElementById('brand-sub').textContent = BRAND.subtitle;
}

function setupTheme() {
  const btn = document.getElementById('theme-toggle');
  const paint = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('afmc.theme', next); } catch (e) { /* ignore */ }
    paint();
  });
  paint();
}

function setupMenu() {
  const side = document.getElementById('sidenav');
  side.innerHTML = '<ul>' + ROUTES.map((r) =>
    `<li><a href="#/${r.id === 'home' ? '' : r.id}" data-route="${r.id}">${esc(r.label)}${r.stage > 1 ? '<span class="soon" title="Coming in a later stage"></span>' : ''}</a></li>`
  ).join('') + '</ul>';

  const tabbar = document.getElementById('tabbar');
  tabbar.innerHTML = TABS.map((t) => t.id === 'more'
    ? `<button type="button" id="more-btn" aria-expanded="false" aria-controls="sidenav"><span aria-hidden="true">${t.icon}</span>${t.label}</button>`
    : `<a href="#/${t.id === 'home' ? '' : t.id}" data-route="${t.id}"><span aria-hidden="true">${t.icon}</span>${t.label}</a>`
  ).join('');

  const scrim = document.getElementById('scrim');
  const moreBtn = document.getElementById('more-btn');
  const setOpen = (open) => {
    side.classList.toggle('open', open);
    scrim.hidden = !open;
    moreBtn.setAttribute('aria-expanded', String(open));
  };
  moreBtn.addEventListener('click', () => setOpen(!side.classList.contains('open')));
  scrim.addEventListener('click', () => setOpen(false));
  side.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

function markActive(id) {
  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === id) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const route = ROUTES.find((r) => r.id === id);
  document.title = route && id !== 'home' ? `${route.label} · ${BRAND.title}` : BRAND.title;
}

/* ---------- pages ---------- */
const LEVEL_NAMES = ['AI User', 'AI Power User', 'AI-Assisted Engineer', 'AI Builder', 'AI + Electrical Specialist'];

function levelIndexForPhase(curriculum, phaseNumber) {
  const i = curriculum.levels.findIndex((l) => phaseNumber >= l.from && phaseNumber <= l.to);
  return i < 0 ? 0 : i;
}

registerPage('home', async () => {
  const c = await loadCurriculum();
  const s = getStats(c.totalLessons);
  const phase = c.phases[s.currentPhase] || c.phases[0];
  const level = levelIndexForPhase(c, s.currentPhase);
  const cards = [
    ['Current level', LEVEL_NAMES[level]],
    ['Current phase', `${phase.number}. ${phase.title}`],
    ['Overall progress', `${s.overallPercent}%`],
    ['Lessons completed', s.lessonsDone],
    ['Quizzes completed', s.quizzesDone],
    ['Projects completed', s.projectsDone],
    ['Skills learned', s.skillsLearned],
    ['Learning streak', `${s.streak} day${s.streak === 1 ? '' : 's'}`],
  ];
  return `
  <section class="hero">
    <h1>${esc(BRAND.title)}</h1>
    <p class="lead">${esc(BRAND.subtitle)}</p>
    <p class="muted">${esc(BRAND.tagline)}</p>
    <div class="actions">
      <a class="btn primary" href="#/roadmap">Start learning</a>
      ${s.lastLesson ? `<a class="btn" href="#/lesson/${esc(s.lastLesson)}">Continue learning</a>` : ''}
      <a class="btn" href="#/roadmap">View roadmap</a>
    </div>
  </section>

  <section aria-labelledby="h-status">
    <h2 id="h-status">Your status</h2>
    <div class="stat-grid">
      ${cards.map(([k, v]) => `<div class="stat"><span class="stat-label">${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}
    </div>
  </section>

  <section aria-labelledby="h-path">
    <h2 id="h-path">Your path</h2>
    <p class="muted">Each step builds on the one before it.</p>
    <ol class="ladder">
      ${LEVEL_NAMES.map((n, i) => `<li${i === level ? ' aria-current="step"' : ''}>${esc(n)}</li>`).join('')}
    </ol>
  </section>

  <section class="split">
    <div class="card">
      <h2>AI + Electrical Engineering</h2>
      <p>Protection relays, relay testing, commissioning, SCADA and IEC 61850 are the core of this platform. Every phase connects back to them.</p>
      <p class="note">Educational examples are not real engineering decisions. For protection settings and commissioning, always follow approved procedures, manufacturer documents and applicable standards.</p>
      <a class="btn" href="#/electrical">Open AI + Electrical</a>
    </div>
    <div class="card">
      <h2>Current AI trends</h2>
      <p>AI changes fast. This section will list what changed, why it matters and how to learn it, using reliable sources and a clear update date.</p>
      <a class="btn" href="#/trends">Open AI trends</a>
    </div>
  </section>`;
});

registerPage('roadmap', async () => {
  const c = await loadCurriculum();
  const st = getState();
  const statusOf = (id) => st.phaseStatus[id] || 'not-started';
  const label = { 'not-started': 'Not started', 'in-progress': 'In progress', completed: 'Completed' };
  const groups = c.levels.map((lv) => {
    const items = c.phases.filter((p) => p.level === lv.id).map((p) => `
      <li class="phase">
        <span class="led ${statusOf(p.id)}" role="img" aria-label="${label[statusOf(p.id)]}"></span>
        <div>
          <h4>Phase ${p.number}: ${esc(p.title)}</h4>
          <p>${esc(p.description)}</p>
          <p class="tags">
            <span class="tag">${label[statusOf(p.id)]}</span>
            ${p.needsLaptop ? '<span class="tag laptop">Best with a laptop</span>' : '<span class="tag phone">Works on your phone</span>'}
          </p>
        </div>
      </li>`).join('');
    return `<section><h3>${esc(lv.name)}</h3><ol class="phases">${items}</ol></section>`;
  }).join('');
  return `<h1>AI Roadmap</h1>
    <p class="lead">27 phases, from zero to AI + Electrical specialist.</p>
    <p class="muted">Tap-to-open phase details, skills and projects arrive in Stage 3.</p>
    ${groups}`;
});

/* Pages that are planned but not built yet */
function comingSoon(id) {
  const r = ROUTES.find((x) => x.id === id);
  return `<h1>${esc(r.label)}</h1>
    <div class="card">
      <p><strong>Coming in Stage ${r.stage}.</strong></p>
      <p>${esc(r.blurb)}</p>
      <a class="btn" href="#/roadmap">Back to roadmap</a>
    </div>`;
}
ROUTES.forEach((r) => { if (!['home', 'roadmap'].includes(r.id)) registerPage(r.id, comingSoon); });
registerPage('__notfound', () => `<h1>Page not found</h1><p>That address does not exist.</p><a class="btn" href="#/">Go home</a>`);

/* ---------- start ---------- */
setupBranding();
setupTheme();
setupMenu();
touchStreak();
startRouter(markActive);
