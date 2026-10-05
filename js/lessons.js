/* lessons.js - the lesson list and the lesson page. */
import { loadCurriculum, loadLessons, phaseNumber } from './data.js';
import { getState, updateState } from './store.js';
import { esc } from './util.js';

const list = (items) => `<ul class="plain">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const paras = (items) => items.map((p) => `<p>${esc(p)}</p>`).join('');

export async function renderLessonList() {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const state = getState();
  const phases = c.phases.filter((p) => lessons.some((l) => l.phase === p.id));
  const body = phases.map((p) => `<section><h3>Phase ${p.number}: ${esc(p.title)}</h3><ul class="lesson-list">
    ${lessons.filter((l) => l.phase === p.id).map((l) => {
      const done = state.completedLessons.includes(l.id);
      const rev = state.revisionLessons.includes(l.id);
      return `<li><a class="lesson-link" href="#/lesson/${esc(l.id)}">
        <strong>Lesson ${l.number}: ${esc(l.title)}</strong>
        <span class="tags"><span class="tag">${esc(l.difficulty)}</span><span class="tag">${l.minutes} min</span>
        ${done ? '<span class="tag phone">Completed</span>' : ''}${rev ? '<span class="tag laptop">Revise</span>' : ''}</span></a></li>`;
    }).join('')}</ul></section>`).join('');
  return `<h1>Lessons</h1>
    <p class="lead">Short lessons you can study on your phone.</p>${body}
    <p class="muted">More lessons are added step by step. The roadmap shows every phase that is coming.</p>`;
}

export async function renderLesson(_route, id) {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return '<h1>Lesson not found</h1><p>That lesson does not exist yet.</p><a class="btn" href="#/lessons">All lessons</a>';
  const phase = c.phases.find((p) => p.id === lesson.phase);
  const state = updateState({ lastLesson: lesson.id });
  const done = state.completedLessons.includes(lesson.id);
  const rev = state.revisionLessons.includes(lesson.id);
  const next = lesson.next && lessons.find((l) => l.id === lesson.next);

  return `<article class="lesson" data-lesson="${esc(lesson.id)}" data-phase="${esc(lesson.phase)}">
    <p class="muted small">Phase ${phase.number}: ${esc(phase.title)} · Lesson ${lesson.number}</p>
    <h1>${esc(lesson.title)}</h1>
    <p class="tags"><span class="tag">${esc(lesson.difficulty)}</span><span class="tag">${lesson.minutes} min</span></p>

    <section class="card"><h2>You will learn</h2>${list(lesson.objectives)}</section>
    <section><h2>Simple analogy</h2><p>${esc(lesson.analogy)}</p></section>
    <section><h2>In simple words</h2>${paras(lesson.simple)}</section>
    <section><h2>Technical explanation</h2>${paras(lesson.technical)}</section>
    <section><h2>Electrical example</h2>${paras(lesson.electrical)}<p class="note"><strong>Safety:</strong> ${esc(lesson.safety)}</p></section>
    <section><h2>Real-world examples</h2>${list(lesson.realWorld)}</section>
    <section class="card"><h2>Exercise</h2><p>${esc(lesson.exercise)}</p></section>
    <section class="card"><h2>Mini challenge</h2><p>${esc(lesson.challenge)}</p></section>
    <section><h2>Quick check</h2><p class="muted small">Think of your answer first, then tap the question.</p>
      ${lesson.quickCheck.map((q) => `<details class="qa"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join('')}</section>
    <section><h2>Common mistakes</h2>${list(lesson.mistakes)}</section>
    <section><h2>Career application</h2><p>${esc(lesson.career)}</p></section>

    <div class="lesson-actions" data-no-speak>
      <button type="button" class="btn${done ? ' done' : ' primary'}" data-action="toggle-complete" aria-pressed="${done}">${done ? 'Completed (tap to undo)' : 'Mark complete'}</button>
      <button type="button" class="btn${rev ? ' done' : ''}" data-action="toggle-revision" aria-pressed="${rev}">${rev ? 'Marked for revision' : 'Mark for revision'}</button>
      <button type="button" class="btn" disabled>Add note (coming soon)</button>
      <button type="button" class="btn" disabled>Start quiz (coming soon)</button>
      ${next ? `<a class="btn primary" href="#/lesson/${esc(next.id)}">Next lesson</a>` : '<a class="btn" href="#/lessons">All lessons</a>'}
    </div>
  </article>`;
}

function toggle(key, id) {
  const set = new Set(getState()[key]);
  if (set.has(id)) set.delete(id); else set.add(id);
  updateState({ [key]: [...set] });
  return set.has(id);
}

export const actions = {
  'toggle-complete': (el) => {
    const art = el.closest('.lesson');
    const on = toggle('completedLessons', art.dataset.lesson);
    el.setAttribute('aria-pressed', String(on));
    el.textContent = on ? 'Completed (tap to undo)' : 'Mark complete';
    el.classList.toggle('done', on);
    el.classList.toggle('primary', !on);
    if (on) {
      const state = getState();
      const status = state.phaseStatus[art.dataset.phase] || 'not-started';
      if (status === 'not-started') {
        updateState({ phaseStatus: { ...state.phaseStatus, [art.dataset.phase]: 'in-progress' }, currentPhase: phaseNumber(art.dataset.phase) });
      }
    }
  },
  'toggle-revision': (el) => {
    const on = toggle('revisionLessons', el.closest('.lesson').dataset.lesson);
    el.setAttribute('aria-pressed', String(on));
    el.textContent = on ? 'Marked for revision' : 'Mark for revision';
    el.classList.toggle('done', on);
  },
};
