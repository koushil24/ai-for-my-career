/* app.js - starts the site: header, menus, loading screen, theme, and connects the pages. */
import { BRAND, ROUTES, TABS, TOPNAV, ICONS, BUILT } from './config.js';
import { registerPage, startRouter } from './router.js';
import { touchStreak } from './store.js';
import { mountListenBar } from './listen.js';
import { esc } from './util.js';
import { icon } from './icons.js';
import * as roadmap from './roadmap.js';
import * as lessons from './lessons.js';
import { renderPathway } from './pathway.js';
import { renderHome } from './home.js';
import { renderElectrical, renderProjects } from './hubs.js';
import { renderSearch, runSearch } from './search.js';
import * as progress from './progress.js';

lessons.attachDeckControls();

/* ---------- loading screen ---------- */
function hideLoader() {
  const el = document.getElementById('loader');
  if (!el || el.dataset.gone) return;
  el.dataset.gone = '1';
  const picked = document.documentElement.getAttribute('data-loader');
  try { sessionStorage.setItem('afmc.loaded', '1'); } catch (e) { /* ignore */ }
  if (!picked || picked === '0') { el.remove(); return; }
  const shown = performance.now() - (window.__t0 || 0);
  setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 700); }, Math.max(0, 2400 - shown));  // show the animation for at least 2.4 s
}

/* ---------- branding, theme, menu ---------- */
function setupBranding() {
  document.getElementById('brand-logo-dark').src = BRAND.logoDark;
  document.getElementById('brand-logo-light').src = BRAND.logoLight;
  document.getElementById('brand-title').textContent = BRAND.title.toUpperCase();
  document.getElementById('brand-sub').textContent = BRAND.subtitle;
  document.querySelector('.search-link').innerHTML = icon('search', 22);
  document.querySelector('.hdr-menu').innerHTML = ICONS.more;
  document.querySelector('.progress-link').innerHTML = icon('growth', 22);
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
  side.innerHTML = '<ul>' + ROUTES.filter((r) => BUILT.has(r.id)).map((r) =>
    `<li><a href="#/${r.id === 'home' ? '' : r.id}" data-route="${r.id}">${esc(r.label)}${BUILT.has(r.id) ? '' : '<span class="soon" title="Coming in a later stage"></span>'}</a></li>`
  ).join('') + '</ul>';

  document.getElementById('topnav').innerHTML = TOPNAV.filter((t) => BUILT.has(t.id)).map((t) =>
    `<a href="#/${t.id === 'home' ? '' : t.id}" data-route="${t.id}">${esc(t.label)}</a>`).join('') +
    '<button type="button" class="more-toggle" aria-expanded="false" aria-controls="sidenav">More</button>';

  document.getElementById('tabbar').innerHTML = TABS.map((t) => t.id === 'more'
    ? `<button type="button" class="more-toggle" aria-expanded="false" aria-controls="sidenav"><span aria-hidden="true">${t.icon}</span>${t.label}</button>`
    : `<a href="#/${t.id === 'home' ? '' : t.id}" data-route="${t.id}"><span aria-hidden="true">${t.icon}</span>${t.label}</a>`
  ).join('');

  const scrim = document.getElementById('scrim');
  const toggles = [...document.querySelectorAll('.more-toggle')];
  const setOpen = (open) => {
    side.classList.toggle('open', open);
    scrim.hidden = !open;
    toggles.forEach((b) => b.setAttribute('aria-expanded', String(open)));
  };
  toggles.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!side.classList.contains('open')); }));
  scrim.addEventListener('click', () => setOpen(false));
  side.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (side.classList.contains('open') && !e.target.closest('#sidenav')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  document.getElementById('topsearch').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('q').value.trim();
    location.hash = q ? `#/search/${encodeURIComponent(q)}` : '#/search';
  });
}

function markActive(id) {
  const menuId = id === 'lesson' ? 'lessons' : id;   // a single lesson highlights "Lessons"
  document.body.dataset.page = id;
  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === menuId) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const route = ROUTES.find((r) => r.id === menuId);
  document.title = route && id !== 'home' ? `${route.label} · ${BRAND.title}` : BRAND.title;
  hideLoader();
}

/* ---------- buttons and filters inside pages (one listener for the whole site) ---------- */
const ACTIONS = { ...roadmap.actions, ...lessons.actions, ...progress.actions };

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && el.tagName !== 'SELECT' && el.type !== 'file' && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('select[data-action], input[type="file"][data-action]') && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
  if (el.matches('[data-filter]')) roadmap.filters.apply();
  if (el.matches('[data-lfilter]')) lessons.filters.apply();
});
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-filter]')) roadmap.filters.apply();
  if (e.target.matches('[data-lfilter]')) lessons.filters.apply();
  if (e.target.id === 'page-search') runSearch();
});

/* ---------- 3D tilt for cards (mouse and pen only; phones get a press effect in CSS) ---------- */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest('[data-tilt]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2)}deg`);
  });
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest && e.target.closest('[data-tilt]');
    if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  });
}

/* ---------- pages ---------- */
registerPage('home', () => renderHome());
const roadmapPage = async () => {
  const html = await roadmap.renderRoadmap();
  setTimeout(() => roadmap.filters.apply(), 0);   // fill in the "x of 27 phases shown" line
  return html;
};
registerPage('roadmap', roadmapPage);
registerPage('syllabus', roadmapPage);   // old address still works: the Syllabus is now part of the Roadmap
registerPage('progress', () => progress.renderProgress());
registerPage('lessons', (id, param) => {
  const html = lessons.renderLessonList(id, param);
  html.then(() => setTimeout(() => lessons.filters.apply(), 0));
  return html;
});
registerPage('lesson', (id, param) => lessons.renderLesson(id, param));
registerPage('pathway', () => renderPathway());
registerPage('electrical', () => renderElectrical());
registerPage('projects', () => renderProjects());
registerPage('search', async (id, param) => {
  const html = await renderSearch(id, param);
  setTimeout(() => runSearch(), 0);
  return html;
});

/* Pages that are planned but not built yet */
function comingSoon(id) {
  const r = ROUTES.find((x) => x.id === id);
  return `<h1>${esc(r.label)}</h1>
    <div class="card">
      <p><strong>Coming soon.</strong></p>
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
