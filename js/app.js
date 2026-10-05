/* app.js - starts the site: branding, menu, theme, and connects the pages. */
import { BRAND, ROUTES, TABS, ICONS, BUILT } from './config.js';
import { registerPage, startRouter } from './router.js';
import { touchStreak, getStats } from './store.js';
import { mountListenBar } from './listen.js';
import { loadCurriculum, loadLessons } from './data.js';
import { esc } from './util.js';
import * as roadmap from './roadmap.js';
import * as lessons from './lessons.js';

/* ---------- branding, theme, menu ---------- */
function setupBranding() {
  document.getElementById('brand-logo').src = BRAND.logo;
  document.getElementById('brand-title').textContent = BRAND.title;
  document.getElementById('brand-sub').textContent = BRAND.subtitle;
}

function setupTheme() {
  const btn = document.getElementById('theme-toggle');
  const paint = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark ? ICONS.sun : ICONS.moon;
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
    `<li><a href="#/${r.id === 'home' ? '' : r.id}" data-route="${r.id}">${esc(r.label)}${BUILT.has(r.id) ? '' : '<span class="soon" title="Coming in a later stage"></span>'}</a></li>`
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
  const menuId = id === 'lesson' ? 'lessons' : id;   // a single lesson highlights "Lessons"
  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === menuId) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const route = ROUTES.find((r) => r.id === menuId);
  document.title = route && id !== 'home' ? `${route.label} · ${BRAND.title}` : BRAND.title;
}

/* ---------- buttons and filters inside pages (one listener for the whole site) ---------- */
const ACTIONS = { ...roadmap.actions, ...lessons.actions };

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && el.tagName !== 'SELECT' && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('select[data-action]') && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
  if (el.matches('[data-filter]')) roadmap.filters.apply();
});
document.addEventListener('input', (e) => { if (e.target.matches('[data-filter]')) roadmap.filters.apply(); });

/* ---------- pages ---------- */
const LEVEL_NAMES = ['AI User', 'AI Power User', 'AI-Assisted Engineer', 'AI Builder', 'AI + Electrical Specialist'];

registerPage('home', async () => {
  const [c, all] = await Promise.all([loadCurriculum(), loadLessons()]);
  const s = getStats(all.length);
  const phase = c.phases[s.currentPhase] || c.phases[0];
  const level = Math.max(0, c.levels.findIndex((l) => phase.number >= l.from && phase.number <= l.to));
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
      <a class="btn primary" href="#/lesson/p1-l1">Start learning</a>
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

registerPage('roadmap', () => roadmap.renderRoadmap());
registerPage('syllabus', async () => {
  const html = await roadmap.renderSyllabus();
  setTimeout(() => roadmap.filters.apply(), 0);   // fill in the "x of 27 phases" line
  return html;
});
registerPage('lessons', () => lessons.renderLessonList());
registerPage('lesson', (id, param) => lessons.renderLesson(id, param));

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
ROUTES.forEach((r) => { if (!BUILT.has(r.id)) registerPage(r.id, comingSoon); });
registerPage('__notfound', () => `<h1>Page not found</h1><p>That address does not exist.</p><a class="btn" href="#/">Go home</a>`);

/* Add the Listen bar to every page after it loads */
registerPage('__after', (id, view) => mountListenBar(view));

/* ---------- start ---------- */
setupBranding();
setupTheme();
setupMenu();
touchStreak();
startRouter(markActive);
