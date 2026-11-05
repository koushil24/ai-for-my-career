/* search.js - one search box for lessons, planned lessons, roadmap phases and projects. */
import { loadLessons, loadPathway, loadCurriculum } from './data.js';
import { loadHome } from './home.js';
import { esc } from './util.js';

let index = null;
async function buildIndex() {
  if (index) return index;
  const [lessons, pathway, c, H] = await Promise.all([loadLessons(), loadPathway(), loadCurriculum(), loadHome()]);
  index = [];
  lessons.forEach((l) => index.push({ type: 'Lesson', title: l.title, sub: `${l.level} · ${l.minutes} min`, href: `#/lesson/${l.id}`,
    text: [l.title, ...(l.skills || []), ...l.cards.map((x) => `${x.title} ${(x.lines || []).join(' ')}`)].join(' ').toLowerCase() }));
  pathway.modules.forEach((m) => m.lessons.filter((l) => !l.id).forEach((l) => index.push({ type: 'Planned lesson', title: l.title, sub: `Module ${m.number}: ${m.title}`, href: '#/pathway', text: `${l.title} ${m.title}`.toLowerCase() })));
  c.phases.forEach((p) => index.push({ type: 'Roadmap phase', title: `Phase ${p.number}: ${p.title}`, sub: p.description, href: '#/roadmap', text: [p.title, p.description, ...p.topics].join(' ').toLowerCase() }));
  H.projects.forEach((p) => index.push({ type: 'Project', title: p.title, sub: p.tags, href: '#/projects', text: `${p.title} ${p.tags} ${p.desc}`.toLowerCase() }));
  return index;
}

export async function renderSearch(_route, param = '') {
  await buildIndex();
  const q = decodeURIComponent(param || '');
  return `<h1>Search</h1>
    <form class="nx-searchform" role="search" data-no-speak onsubmit="return false">
      <label class="field">Search lessons, topics, projects<input type="search" id="page-search" value="${esc(q)}" placeholder="For example: relay, prompt, cloud" autocomplete="off"></label>
    </form>
    <p id="search-count" class="muted small" role="status"></p>
    <ul class="lesson-list" id="search-results"></ul>`;
}

export async function runSearch() {
  const input = document.getElementById('page-search');
  const list = document.getElementById('search-results');
  if (!input || !list) return;
  await buildIndex();
  const q = input.value.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const hits = words.length ? index.filter((it) => words.every((w) => it.text.includes(w))).slice(0, 40) : [];
  list.innerHTML = hits.map((h) => `<li><a class="lesson-link" href="${esc(h.href)}"><span class="eyebrow">${esc(h.type)}</span><strong>${esc(h.title)}</strong><span class="muted small">${esc(h.sub)}</span></a></li>`).join('');
  document.getElementById('search-count').textContent = words.length ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : 'Type to search.';
}
