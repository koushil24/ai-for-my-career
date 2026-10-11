/* pathway.js - the Learning Pathway page: 7 modules, in a suggested order.
   The order is a guide, not a lock. Every lesson can be opened at any time. */
import { loadPathway, loadLessons } from './data.js';
import { getState } from './store.js';
import { esc } from './util.js';

const MODE_LABEL = { phone: 'Phone friendly', mixed: 'Phone + computer practice', computer: 'Needs a computer' };

export async function renderPathway() {
  const [p, lessons] = await Promise.all([loadPathway(), loadLessons()]);
  const state = getState();
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const title = (id) => { const m = p.modules.find((x) => x.id === id); return `Module ${m.number}`; };

  const seq = `<ol class="sequence">${p.sequence.map((s) => `<li><a href="#/pathway" data-jump="${s.module}">${esc(s.label)}</a><span class="muted small"> (${title(s.module)})</span></li>`).join('')}</ol>`;

  const cards = p.modules.map((m) => {
    const planned = m.lessons.length;
    const ready = m.lessons.filter((l) => l.id && byId.has(l.id));
    const done = ready.filter((l) => state.completedLessons.includes(l.id)).length;
    const pct = planned ? Math.round((done / planned) * 100) : 0;
    const after = m.after.length ? m.after.map((id) => title(id)).join(' and ') : 'nothing';
    const rows = m.lessons.map((l) => (l.id && byId.has(l.id)
      ? `<li class="ready"><a href="#/lesson/${esc(l.id)}">${esc(l.title)}</a>${state.completedLessons.includes(l.id) ? ' <span class="tag phone">Done</span>' : ''}</li>`
      : `<li class="planned">${esc(l.title)} <span class="tag">Coming soon</span></li>`)).join('');
    return `<details class="phase-card module-card" id="module-${m.id}" data-tilt-off>
      <summary>
        <span class="phase-title">Module ${m.number}: ${esc(m.title)}</span>
        <span class="tag">${esc(m.level)}</span>
      </summary>
      <div class="phase-body">
        <p>${esc(m.summary)}</p>
        <p class="tags"><span class="tag ${m.mode === 'phone' ? 'phone' : 'laptop'}">${MODE_LABEL[m.mode]}</span><span class="tag">${ready.length} of ${planned} lessons ready</span></p>
        <div class="bar" role="img" aria-label="${pct}% of planned lessons completed"><span style="width:${pct}%"></span></div>
        <p class="muted small">${done} of ${planned} planned lessons completed</p>
        <h5>Suggested before</h5><p>${esc(after === 'nothing' ? 'Nothing. You can start here.' : after)}. This is a suggestion, not a lock.</p>
        ${m.phases.length ? `<h5>Roadmap phases covered</h5><p>${m.phases.map((id) => `<a class="tag" href="#/roadmap">Phase ${id.replace('p', '')}</a>`).join(' ')}</p>` : '<h5>Roadmap phases covered</h5><p class="muted">This module adds new content. A new roadmap phase will be added for it.</p>'}
        <h5>Lessons</h5><ol class="plain module-lessons">${rows}</ol>
        ${m.projects.length ? `<h5>Project${m.projects.length > 1 ? 's' : ''}</h5><ul class="plain">${m.projects.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <p><a class="btn" href="#/lessons/${m.id}">Open this module's lessons</a></p>
      </div></details>`;
  }).join('');

  return `<h1>Learning Pathway</h1>
    <p class="lead">Seven modules, from first AI lesson to advanced AI for electrical engineering.</p>
    <p class="muted">Follow the order if you like, or jump to what you need. Lessons marked "Coming soon" are planned and will be added step by step.</p>
    <h2>Suggested order</h2>${seq}
    <h2>Modules</h2><div class="phase-list">${cards}</div>
    <p class="note">Everything here is for learning. Examples use made-up data. For real protection settings and testing, follow approved procedures, manufacturer documents and applicable standards.</p>`;
}
