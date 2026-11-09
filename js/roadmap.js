/* roadmap.js - the Roadmap page: all 27 phases in one place (topics, skills, lessons, projects, status).
   The old separate Syllabus page is merged into this page. */
import { loadCurriculum, loadLessons } from './data.js';
import { getState, updateState } from './store.js';
import { esc, STATUS_LABEL } from './util.js';

function phaseProgress(phase, lessons, state) {
  const mine = lessons.filter((l) => l.phase === phase.id);
  const done = mine.filter((l) => state.completedLessons.includes(l.id)).length;
  return { mine, done, percent: mine.length ? Math.round((done / mine.length) * 100) : 0 };
}

const tags = (list) => (list.length ? `<p class="tags">${list.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : '<p class="muted">Added as we reach this phase.</p>');
const bullets = (list, empty) => (list.length ? `<ul class="plain">${list.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : `<p class="muted">${empty}</p>`);

function prereqText(phase, c) {
  if (!phase.prerequisites.length) return 'None. You can start here.';
  return phase.prerequisites.map((id) => { const p = c.phases.find((x) => x.id === id); return `Phase ${p.number}: ${p.title}`; }).join(', ');
}

function card(phase, c, lessons, state, lastLive) {
  const status = state.phaseStatus[phase.id] || 'not-started';
  const prog = phaseProgress(phase, lessons, state);
  const lessonLinks = prog.mine.length
    ? `<ul class="plain">${prog.mine.map((l) => `<li><a href="#/lesson/${esc(l.id)}">${esc(l.title)}</a>${state.completedLessons.includes(l.id) ? ' <span class="tag phone">Done</span>' : ''}</li>`).join('')}</ul>`
    : '<p class="muted">Lessons for this phase are added step by step.</p>';
  const search = [phase.title, phase.description, ...phase.topics, ...phase.skills].join(' ').toLowerCase();
  return `<details class="phase-card${phase.number <= lastLive ? ' live' : ''}" data-number="${phase.number}" data-level="${phase.level}" data-search="${esc(search)}">
    <summary>
      <span class="led ${status}" role="img" aria-label="${STATUS_LABEL[status]}"></span>
      <span class="phase-title">Phase ${phase.number}: ${esc(phase.title)}</span>
      <span class="tag status-tag">${STATUS_LABEL[status]}</span>
    </summary>
    <div class="phase-body">
      <p>${esc(phase.description)}</p>
      <label class="field">Status
        <select data-action="set-status" data-phase="${phase.id}" data-number="${phase.number}">
          ${Object.keys(STATUS_LABEL).map((k) => `<option value="${k}"${k === status ? ' selected' : ''}>${STATUS_LABEL[k]}</option>`).join('')}
        </select>
      </label>
      ${prog.mine.length ? `<div class="bar" role="img" aria-label="${prog.percent}% of available lessons completed"><span style="width:${prog.percent}%"></span></div><p class="muted small">${prog.done} of ${prog.mine.length} available lessons completed</p>` : ''}
      <h5>Topics</h5>${bullets(phase.topics, 'Topics are added as we reach this phase.')}
      <h5>Before this phase</h5><p>${esc(prereqText(phase, c))} (a suggestion, not a lock)</p>
      <h5>Skills you gain</h5>${tags(phase.skills)}
      <h5>Lessons</h5>${lessonLinks}
      <h5>Projects</h5>${bullets(phase.projects, 'None in this phase.')}
    </div></details>`;
}

export async function renderRoadmap() {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const state = getState();
  const lastLive = Math.max(-1, ...c.phases.filter((p) => (state.phaseStatus[p.id] || 'not-started') !== 'not-started').map((p) => p.number));
  const groups = c.levels.map((lv) => `<section data-group="${lv.id}"><h3>${esc(lv.name)}</h3>
    <div class="phase-list gridline">${c.phases.filter((p) => p.level === lv.id).map((p) => card(p, c, lessons, state, lastLive)).join('')}</div></section>`).join('');
  return `<h1>Roadmap</h1>
    <p class="lead">27 phases, from zero to AI + Electrical specialist.</p>
    <p class="muted">Tap a phase to open its topics, lessons and projects. Set its status as you go. For a simpler route, follow the <a href="#/pathway">Learning Pathway</a>.</p>
    <div class="controls" data-no-speak>
      <label class="field">Search topics<input type="search" data-filter="text" placeholder="For example: RAG, Python, SCADA" autocomplete="off"></label>
      <label class="field">Level
        <select data-filter="level"><option value="all">All levels</option>${c.levels.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
      </label>
    </div>
    <p id="syl-count" class="muted small" role="status"></p>
    <div id="roadmap-root">${groups}</div>`;
}

/* Hide or show phases as the search box or level changes. */
function applyFilter() {
  const root = document.getElementById('roadmap-root');
  if (!root) return;
  const text = document.querySelector('[data-filter="text"]').value.trim().toLowerCase();
  const level = document.querySelector('[data-filter="level"]').value;
  let shown = 0; let total = 0;
  root.querySelectorAll('.phase-card').forEach((el) => {
    total += 1;
    const ok = (level === 'all' || el.dataset.level === level) && (!text || el.dataset.search.includes(text));
    el.hidden = !ok;
    if (ok) shown += 1;
  });
  root.querySelectorAll('section[data-group]').forEach((g) => { g.hidden = ![...g.querySelectorAll('.phase-card')].some((el) => !el.hidden); });
  document.getElementById('syl-count').textContent = `${shown} of ${total} phases shown`;
}

/* Light up the grid line from the first phase to the last phase that has been started. */
function paintLive() {
  const st = getState().phaseStatus;
  const cards = [...document.querySelectorAll('.phase-card[data-number]')];
  const started = cards.map((el) => ({ el, n: Number(el.dataset.number), on: (st[`p${el.dataset.number}`] || 'not-started') !== 'not-started' }));
  const last = Math.max(-1, ...started.filter((x) => x.on).map((x) => x.n));
  started.forEach((x) => x.el.classList.toggle('live', x.n <= last));
}

export const actions = {
  'set-status': (el) => {
    const val = el.value;
    const state = getState();
    const change = { phaseStatus: { ...state.phaseStatus, [el.dataset.phase]: val } };
    if (val === 'in-progress') change.currentPhase = Number(el.dataset.number);
    updateState(change);
    const cardEl = el.closest('.phase-card');
    const led = cardEl.querySelector('.led');
    led.className = `led ${val}`;
    led.setAttribute('aria-label', STATUS_LABEL[val]);
    cardEl.querySelector('.status-tag').textContent = STATUS_LABEL[val];
    paintLive();
  },
};
export const filters = { apply: applyFilter };
