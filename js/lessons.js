/* lessons.js - the lesson list and the lesson page.
   A lesson is a deck of small cards. The same cards can be shown one at a time
   ("Cards" view, swipe on a phone) or as one long page ("Scroll" view). */
import { loadCurriculum, loadLessons, getGlossary, phaseNumber } from './data.js';
import { getState, updateState } from './store.js';
import { esc } from './util.js';
import { DIAGRAMS } from './diagrams.js';
import { mountListenBar } from './listen.js';

const MODE_KEY = 'afmc.lessonMode';
const KIND_LABEL = {
  idea: 'Big idea', analogy: 'Think of it like this', electrical: 'Electrical example',
  try: 'Try it', check: 'Quick check', safety: 'Safety note', finish: 'Lesson complete',
};

function getMode() { try { return localStorage.getItem(MODE_KEY) === 'scroll' ? 'scroll' : 'cards'; } catch (e) { return 'cards'; } }
function setModeStored(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ } }

/* ---------- lesson list ---------- */
export async function renderLessonList() {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const state = getState();
  const phases = c.phases.filter((p) => lessons.some((l) => l.phase === p.id));
  const body = phases.map((p) => `<section><h3>Phase ${p.number}: ${esc(p.title)}</h3><ul class="lesson-list">
    ${lessons.filter((l) => l.phase === p.id).map((l) => {
      const done = state.completedLessons.includes(l.id);
      const rev = state.revisionLessons.includes(l.id);
      return `<li><a class="lesson-link" data-tilt href="#/lesson/${esc(l.id)}">
        <span class="eyebrow">Lesson ${l.number}</span>
        <strong>${esc(l.title)}</strong>
        <span class="tags"><span class="tag">${esc(l.difficulty)}</span><span class="tag">${l.minutes} min</span><span class="tag">${l.cards.length} cards</span>
        ${done ? '<span class="tag phone">Completed</span>' : ''}${rev ? '<span class="tag laptop">Revise</span>' : ''}</span></a></li>`;
    }).join('')}</ul></section>`).join('');
  return `<h1>Lessons</h1>
    <p class="lead">Small cards. One idea at a time.</p>${body}
    <p class="muted">More lessons are added step by step. The roadmap shows every phase that is coming.</p>`;
}

/* ---------- one lesson ---------- */
function cardHtml(card, i, lesson, glossary, state, next) {
  const lines = card.lines.map((t) => `<p class="big">${esc(t)}</p>`).join('');
  const diagram = card.diagram && DIAGRAMS[card.diagram] ? `<figure class="diagram">${DIAGRAMS[card.diagram]()}</figure>` : '';
  const qa = (card.qa || []).map((q) => `<details class="qa"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join('');
  const terms = (card.terms || []).filter((k) => glossary[k]).map((k) =>
    `<details class="term"><summary>${esc(glossary[k].name)}</summary><p>${esc(glossary[k].def)}</p></details>`).join('');
  let extra = '';
  if (card.kind === 'finish') {
    const done = state.completedLessons.includes(lesson.id);
    const rev = state.revisionLessons.includes(lesson.id);
    extra = `<p class="muted">${esc(lesson.career)}</p>
      <div class="lesson-actions" data-no-speak>
        <button type="button" class="btn${done ? ' done' : ' primary'}" data-action="toggle-complete" aria-pressed="${done}">${done ? 'Completed (tap to undo)' : 'Mark complete'}</button>
        <button type="button" class="btn${rev ? ' done' : ''}" data-action="toggle-revision" aria-pressed="${rev}">${rev ? 'Marked for revision' : 'Mark for revision'}</button>
        <button type="button" class="btn" disabled>Add note (coming soon)</button>
        <button type="button" class="btn" disabled>Start quiz (coming soon)</button>
        ${next ? `<a class="btn primary" href="#/lesson/${esc(next.id)}">Next lesson</a>` : '<a class="btn" href="#/lessons">All lessons</a>'}
      </div>`;
  }
  return `<section class="lcard kind-${card.kind}${i === 0 ? ' active' : ''}">
    <p class="eyebrow">${KIND_LABEL[card.kind] || 'Idea'}</p>
    <h2>${esc(card.title)}</h2>${diagram}${lines}${qa}
    ${terms ? `<div class="terms" data-no-speak><span class="muted small">Tap a word:</span>${terms}</div>` : ''}${extra}
  </section>`;
}

export async function renderLesson(_route, id) {
  const [c, lessons] = await Promise.all([loadCurriculum(), loadLessons()]);
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return '<h1>Lesson not found</h1><p>That lesson does not exist yet.</p><a class="btn" href="#/lessons">All lessons</a>';
  const phase = c.phases.find((p) => p.id === lesson.phase);
  const state = updateState({ lastLesson: lesson.id });
  const next = lesson.next && lessons.find((l) => l.id === lesson.next);
  const glossary = getGlossary();
  const mode = getMode();
  const total = lesson.cards.length;

  return `<article class="lesson" data-lesson="${esc(lesson.id)}" data-phase="${esc(lesson.phase)}" data-mode="${mode}" data-step="0" data-total="${total}">
    <p class="eyebrow">Phase ${phase.number} · Lesson ${lesson.number}</p>
    <h1>${esc(lesson.title)}</h1>
    <div class="seg" role="group" aria-label="Lesson view" data-no-speak>
      <button type="button" data-action="set-mode" data-mode="cards" aria-pressed="${mode === 'cards'}">Cards</button>
      <button type="button" data-action="set-mode" data-mode="scroll" aria-pressed="${mode === 'scroll'}">Scroll</button>
    </div>
    <div class="deck-bar" data-no-speak><span style="width:${(100 / total).toFixed(1)}%"></span></div>
    <div class="deck">${lesson.cards.map((card, i) => cardHtml(card, i, lesson, glossary, state, next)).join('')}</div>
    <div class="deck-nav" data-no-speak>
      <button type="button" class="btn" data-action="card-prev" disabled>Back</button>
      <span class="deck-count">Card 1 of ${total}</span>
      <button type="button" class="btn primary" data-action="card-next">Next</button>
    </div>
  </article>`;
}

/* ---------- moving between cards ---------- */
function goTo(article, n) {
  const total = Number(article.dataset.total);
  const step = Math.max(0, Math.min(total - 1, n));
  article.dataset.step = String(step);
  article.querySelectorAll('.lcard').forEach((el, i) => el.classList.toggle('active', i === step));
  article.querySelector('.deck-bar span').style.width = `${(((step + 1) / total) * 100).toFixed(1)}%`;
  article.querySelector('.deck-count').textContent = `Card ${step + 1} of ${total}`;
  article.querySelector('[data-action="card-prev"]').disabled = step === 0;
  article.querySelector('[data-action="card-next"]').disabled = step === total - 1;
  window.scrollTo(0, 0);
  // restart the Listen bar so it reads the new card, not the old one
  const view = document.getElementById('view');
  view.querySelector('.listen')?.remove();
  mountListenBar(view);
}

const lessonEl = () => document.querySelector('.lesson');
const step = (art) => Number(art.dataset.step);

export function attachDeckControls() {
  let sx = 0; let sy = 0;
  document.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const art = lessonEl();
    if (!art || art.dataset.mode !== 'cards' || !e.target.closest('.deck')) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45) goTo(art, step(art) + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    const art = lessonEl();
    if (!art || art.dataset.mode !== 'cards' || e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') goTo(art, step(art) + 1);
    if (e.key === 'ArrowLeft') goTo(art, step(art) - 1);
  });
}

/* ---------- buttons ---------- */
function toggle(key, id) {
  const set = new Set(getState()[key]);
  if (set.has(id)) set.delete(id); else set.add(id);
  updateState({ [key]: [...set] });
  return set.has(id);
}

export const actions = {
  'card-next': (el) => { const a = el.closest('.lesson'); goTo(a, step(a) + 1); },
  'card-prev': (el) => { const a = el.closest('.lesson'); goTo(a, step(a) - 1); },
  'set-mode': (el) => {
    const a = el.closest('.lesson');
    a.dataset.mode = el.dataset.mode;
    setModeStored(el.dataset.mode);
    a.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    goTo(a, step(a));
  },
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
