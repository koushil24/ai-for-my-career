/* roadmap.js - the Roadmap and Syllabus pages. */
import { loadCurriculum, loadLessons } from './data.js';
import { getState, updateState } from './store.js';
import { esc, STATUS_LABEL } from './util.js';

function phaseProgress(phase, lessons, state) {
  const mine = lessons.filter((l) => l.phase === phase.id);
  const done = mine.filter((l) => state.completedLessons.includes(l.id)).length;
  return { mine, done, percent: mine.length ? Math.round((done / mine.length) * 100) : 0 };
}

function tags(list) { return list.length ? `<p class="tags">${list.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : '<p class="muted">Added as we reach this phase.</p>'; }

function prereqText(phase, c) {
  if (!phase.prerequisites.length) return 'None. You can start here.';
  return phase.prerequisites.map((id) => { const p = c.phases.find((x) => x.id === id); return `Phase ${p.number}: ${p.title}`; }).join(', ');
}

function card(phase, c, lessons, state, mode) {
  const status = state.phaseStatus[phase.id] || 'not-started';
  const prog = phaseProgress(phase, lessons, state);
  const lessonLinks = prog.mine.length
    ? `<ul class="plain">${prog.mine.map((l) => `<li><a href="#/lesson/${esc(l.id)}">${esc(l.title)}</a></li>`).join('')}</ul>`
    : '<p class="muted">Lessons for this phase are added step by step.</p>';

  const body = mode === 'roadmap'
    ? `<p>${esc(phase.description)}</p>
       <label class="field">Status
         <select data-action="set-status" data-phase="${phase.id}" data-number="${phase.number}">
           ${Object.keys(STATUS_LABEL).map((k) => `<option value="${k}"${k === status ? ' selected' : ''}>${STATUS_LABEL[k]}</option>`).join('')}
         </select>
       </label>
       ${prog.mine.length ? `<div class="bar" role="img" aria-label="${prog.percent}% of available lessons completed"><span style="width:${prog.percent}%"></span></div><p class="muted small">${prog.done} of ${prog.mine.length} available lessons completed</p>` : ''}
       <h5>Before this phase</h5><p>${esc(prereqText(phase, c))}</p>
       <h5>Skills you gain</h5>${tags(phase.skills)}
       <h5>Lessons</h5>${lessonLinks}
       <h5>Projects</h5>${phase.projects.length ? `<ul class="plain">${phase.projects.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="muted">None in this phase.</p>'}
       <p><a href="#/syllabus">See all topics in the syllabus</a></p>`
    : `<p>${esc(phase.description)}</p>
       <h5>Topics</h5><ul class="plain">${phase.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
       <h5>Before this phase</h5><p>${esc(prereqText(phase, c))}</p>
       <h5>Projects</h5>${phase.projects.length ? `<ul class="plain">${phase.projects.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="muted">None in this phase.</p>'}
       <h5>Lessons, exercises and quiz</h5>${lessonLinks}`;

  const lastLive = Math.max(-1, ...c.phases.filter((x) => (state.phaseStatus[x.id] || 'not-started') !== 'not-started').map((x) => x.number));
  const live = phase.number <= lastLive;
  const search = [phase.title, phase.description, ...phase.topics].join(' ').toLowerCase();
  return `<details class="phase-card${live ? ' live' : ''}" data-number="${phase.number}" data-level="${phase.level}" data-search="${esc(search)}">
    <summary>
      <span class="led ${status}" role="img" aria-label="${STATUS_LABEL[status]}"></span>
      <span class="phase-title">Phase ${phase.number}: ${esc(phase.title)}</span>
      <span class="tag status-tag">${STATUS_LABEL[status]}</span>
    </summary>
    <div class="phase-body">${body}</div>
  </details>`;
}

export async function renderRoadmap() {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const state = getState();
  const groups = c.levels.map((lv) => `<section><h3>${esc(lv.name)}</h3>
    <div class="phase-list gridline">${c.phases.filter((p) => p.level === lv.id).map((p) => card(p, c, lessons, state, 'roadmap')).join('')}</div></section>`).join('');
  return `<h1>AI Roadmap</h1>
    <p class="lead">27 phases, from zero to AI + Electrical specialist.</p>
    <p class="muted">Tap a phase to open it. Set its status as you go.</p>${groups}`;
}

export async function renderSyllabus() {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const state = getState();
  return `<h1>Syllabus</h1>
    <p class="lead">Every phase with its topics, projects and prerequisites.</p>
    <div class="controls" data-no-speak>
      <label class="field">Search<input type="search" data-filter="text" placeholder="For example: RAG, Python, SCADA" autocomplete="off"></label>
      <label class="field">Level
        <select data-filter="level"><option value="all">All levels</option>${c.levels.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
      </label>
    </div>
    <p id="syl-count" class="muted small" role="status"></p>
    <div class="phase-list" id="syl-list">${c.phases.map((p) => card(p, c, lessons, state, 'syllabus')).join('')}</div>`;
}

/* Hide or show syllabus cards as the search box or level changes. */
function applyFilter() {
  const list = document.getElementById('syl-list');
  if (!list) return;
  const text = document.querySelector('[data-filter="text"]').value.trim().toLowerCase();
  const level = document.querySelector('[data-filter="level"]').value;
  let shown = 0;
  list.querySelectorAll('.phase-card').forEach((el) => {
    const ok = (level === 'all' || el.dataset.level === level) && (!text || el.dataset.search.includes(text));
    el.hidden = !ok;
    if (ok) shown += 1;
  });
  document.getElementById('syl-count').textContent = `${shown} of ${list.children.length} phases shown`;
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
