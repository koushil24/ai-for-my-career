/* home.js - the Home page, laid out like the AI for My Career design.
   Every number on it is worked out from the learner's real progress. Nothing is made up. */
import { loadLessons, loadPathway } from './data.js';
import { getState, getStats } from './store.js';
import { esc } from './util.js';
import { icon } from './icons.js';
import { BRAND } from './config.js';

let homeData = null;
export async function loadHome() {
  if (!homeData) { const r = await fetch('data/home.json'); if (!r.ok) throw new Error('home.json missing'); homeData = await r.json(); }
  return homeData;
}

/* the two transparent logos: CSS shows the right one for the current theme */
export const logoPair = (cls) =>
  `<img class="${cls} logo-for-dark" src="${BRAND.logoDark}" alt="K24 Electrical logo"><img class="${cls} logo-for-light" src="${BRAND.logoLight}" alt="" aria-hidden="true">`;

/* a picture tile. If the image file is not uploaded yet, the tile still looks fine (icon on a gradient). */
export function tile(item, href, extra = '') {
  return `<a class="nx-tile" data-tilt href="${esc(href)}" ${extra}>
    <span class="nx-tile-icon">${icon(item.icon, 20)}</span>
    <img src="${esc(item.image)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">
    <span class="nx-tile-label">${esc(item.label)}</span></a>`;
}

function modulesProgress(pathway, completed, ids) {
  let planned = 0; let done = 0;
  pathway.modules.filter((m) => ids.includes(m.id)).forEach((m) => {
    planned += m.lessons.length;
    done += m.lessons.filter((l) => l.id && completed.includes(l.id)).length;
  });
  return { planned, done, percent: planned ? Math.round((done / planned) * 100) : 0 };
}

function donut(percent) {
  const r = 52; const c = 2 * Math.PI * r;
  return `<div class="nx-donut" role="img" aria-label="Overall progress ${percent} percent">
    <svg viewBox="0 0 120 120"><circle class="d-track" cx="60" cy="60" r="${r}"/><circle class="d-fill" cx="60" cy="60" r="${r}" stroke-dasharray="${((percent / 100) * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
    <div><small>Overall progress</small><strong>${percent}%</strong></div></div>`;
}

function weekBars(state) {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toDateString()); }
  const counts = days.map((ds) => state.completedLessons.filter((id) => state.completedAt && state.completedAt[id] && new Date(state.completedAt[id]).toDateString() === ds).length);
  const max = Math.max(1, ...counts);
  return `<div class="nx-bars" role="img" aria-label="Lessons completed in the last 7 days: ${counts.join(', ')}">${counts.map((n) => `<span style="height:${Math.max(8, (n / max) * 100)}%"></span>`).join('')}</div>`;
}

export async function renderHome() {
  const [H, pathway, lessons] = await Promise.all([loadHome(), loadPathway(), loadLessons()]);
  const state = getState();
  const completed = state.completedLessons;
  const allIds = pathway.modules.map((m) => m.id);
  const overall = modulesProgress(pathway, completed, allIds);
  const aiSkills = modulesProgress(pathway, completed, ['m1', 'm2']);
  const elec = modulesProgress(pathway, completed, ['m6']);
  const stats = getStats(overall.planned);
  const scores = Object.values(state.quizScores);
  const quizAvg = scores.length ? Math.round((scores.reduce((a, s) => a + s.best / s.total, 0) / scores.length) * 100) : null;
  const lastLesson = state.lastLesson && lessons.find((l) => l.id === state.lastLesson);

  const levels = H.levels.map((lv, i) => {
    const p = modulesProgress(pathway, completed, lv.modules);
    return `<li class="nx-level" data-tilt>
      <span class="nx-level-icon">${icon(lv.icon, 26)}</span>
      <div><p class="nx-level-num">${esc(lv.num)}</p><h3>${esc(lv.name)}</h3><p>${esc(lv.text)}</p></div>
      <div class="nx-meter"><span class="nx-meter-pct">${p.percent}%</span><span class="nx-meter-bar"><i style="width:${p.percent}%"></i></span></div>
      ${i < H.levels.length - 1 ? `<span class="nx-link" aria-hidden="true">${icon('arrow', 18)}</span>` : ''}</li>`;
  }).join('');

  return `
  <section class="nx-hero" aria-labelledby="hero-title">
    <div class="nx-hero-art"><img src="${esc(H.hero.image)}" alt="" decoding="async" fetchpriority="high" onerror="this.remove()"></div>
    <div class="nx-hero-copy">
      ${logoPair('nx-hero-logo')}
      <h1 id="hero-title">${esc(H.hero.title)}</h1>
      <p class="nx-tagline">${esc(H.hero.tagline)}</p>
      <p class="nx-text">${esc(H.hero.text)}</p>
      <div class="actions">
        <a class="btn primary" href="#/lesson/p1-l1">Start Learning ${icon('arrow', 18)}</a>
        ${lastLesson ? `<a class="btn" href="#/lesson/${esc(lastLesson.id)}">Continue</a>` : ''}
        <a class="btn" href="#/roadmap">Explore Roadmap</a>
      </div>
    </div>
    <ul class="nx-topics">${H.hero.topics.map((t) => `<li><a href="${esc(t.href)}">${icon(t.icon, 18)}<span>${esc(t.label)}</span></a></li>`).join('')}</ul>
    <p class="nx-slogan">${esc(H.hero.slogan)}</p>
  </section>

  <nav class="nx-quick" aria-label="Quick access">
    ${[['Roadmap', 'roadmap', '#/roadmap'], ['AI Skills', 'ai', '#/pathway'], ['Lessons', 'book', '#/lessons'], ['Projects', 'doc', '#/projects'], ['Career', 'growth', '#/career'], ['Progress', 'user', '#/progress']]
      .map(([l, i, h]) => `<a href="${h}">${icon(i, 24)}<span>${l}</span></a>`).join('')}
  </nav>

  <section class="nx-section" aria-labelledby="h-roadmap">
    <h2 id="h-roadmap" class="nx-h">AI CAREER ROADMAP</h2>
    <p class="muted">Your step-by-step journey to become an AI + Electrical Engineering expert. Percentages show your real lessons completed.</p>
    <ol class="nx-levels">${levels}</ol>
  </section>

  <div class="nx-cols">
    <section class="nx-panel" aria-labelledby="h-know">
      <div class="nx-panel-head"><h2 id="h-know">Engineering Knowledge</h2><a href="#/electrical">View All ${icon('arrow', 14)}</a></div>
      <p class="muted small">Core electrical engineering topics, powered by AI.</p>
      <div class="nx-tiles">${H.knowledge.map((k) => tile(k, '#/electrical')).join('')}</div>
    </section>

    <section class="nx-panel" aria-labelledby="h-tools">
      <div class="nx-panel-head"><h2 id="h-tools">AI Toolkit</h2><a href="#/pathway">View All ${icon('arrow', 14)}</a></div>
      <p class="muted small">Your personal AI assistant suite.</p>
      <div class="nx-tools">${H.toolkit.map((t) => `<a class="nx-tool" data-tilt href="${esc(t.href)}"${t.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
        ${icon(t.icon, 26)}<strong>${esc(t.label)}</strong><small>${esc(t.sub)}</small>${t.external ? '<span class="sr-only"> (opens a new tab)</span>' : ''}</a>`).join('')}</div>
    </section>

    <section class="nx-panel" aria-labelledby="h-prog">
      <div class="nx-panel-head"><h2 id="h-prog">Your Progress</h2><a href="#/progress">View Details ${icon('arrow', 14)}</a></div>
      <div class="nx-prog">
        ${donut(overall.percent)}
        <ul class="nx-skillbars">
          <li><span>AI Skills</span><b>${aiSkills.percent}%</b><i><u style="width:${aiSkills.percent}%"></u></i></li>
          <li><span>Electrical Skills</span><b>${elec.percent}%</b><i><u style="width:${elec.percent}%"></u></i></li>
          <li><span>Projects Completed</span><b>${stats.projectsDone}</b><i><u style="width:${Math.min(100, stats.projectsDone * 20)}%"></u></i></li>
          <li><span>Quiz Average</span><b>${quizAvg === null ? 'None yet' : `${quizAvg}%`}</b><i><u style="width:${quizAvg || 0}%"></u></i></li>
        </ul>
      </div>
      <div class="nx-mini">
        <div class="nx-stat">${icon('flame', 22)}<div><small>Learning Streak</small><strong>${stats.streak} day${stats.streak === 1 ? '' : 's'}</strong></div></div>
        <div class="nx-stat">${icon('check', 22)}<div><small>Lessons Completed</small><strong>${stats.lessonsDone} <span>/ ${overall.planned} planned</span></strong></div></div>
        <div class="nx-stat nx-week"><small>Last 7 days</small>${weekBars(state)}</div>
      </div>
      <p class="muted small">This week: ${stats.weekCount} of ${stats.weeklyGoal} lessons. Saved privately on this device.</p>
    </section>
  </div>

  <div class="nx-cols nx-cols-2">
    <section class="nx-panel" aria-labelledby="h-proj">
      <div class="nx-panel-head"><h2 id="h-proj">My AI + Engineering Projects</h2><a href="#/projects">View All ${icon('arrow', 14)}</a></div>
      <p class="muted small">Practical skills with fictional or synthetic data. Statuses are honest: none are finished yet.</p>
      <div class="nx-projects">${H.projects.map((p) => `<a class="nx-proj" data-tilt href="#/projects">
        <span class="nx-proj-img"><img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></span>
        <strong>${esc(p.title)}</strong><small>${esc(p.tags)}</small><em class="nx-status s-${p.status.toLowerCase()}">${esc(p.status)}</em></a>`).join('')}</div>
    </section>

    <section class="nx-panel" aria-labelledby="h-career">
      <div class="nx-panel-head"><h2 id="h-career">Build Your Future Career</h2><a href="#/pathway">View Full Path ${icon('arrow', 14)}</a></div>
      <p class="muted small">From engineer to AI specialist. These are example roles, not job guarantees.</p>
      <ol class="nx-roles">${H.roles.map((r) => `<li><span class="nx-role-dot">${icon('user', 18)}</span><span>${esc(r)}</span></li>`).join('')}</ol>
    </section>
  </div>

  <footer class="nx-footer">
    <div class="nx-foot-brand">${logoPair('nx-foot-logo')}<p><strong>AI FOR MY CAREER</strong><br><span class="muted">Learn · Apply · Grow</span></p></div>
    <p class="nx-quote">"The best time to learn AI for your career is now. The second best time is today."</p>
    <ul class="nx-foot-icons"><li>${icon('book', 22)}<span>Learn</span></li><li>${icon('gear', 22)}<span>Build</span></li><li>${icon('growth', 22)}<span>Grow</span></li><li>${icon('shield', 22)}<span>Succeed</span></li></ul>
    <p class="muted small">Powered by K24 Electrical. Content is for learning only and is not engineering advice.</p>
  </footer>`;
}
