/* lessons.js - the lesson list and the lesson page.
   A lesson is a deck of small cards. The same cards can be shown one at a time
   ("Cards" view, swipe on a phone) or as one long page ("Scroll" view).
   Each lesson ends with a quiz card, a free-resources card and a recap card. */
import { loadCurriculum, loadLessons, loadPathway, getGlossary, phaseNumber } from './data.js';
import { getState, updateState } from './store.js';
import { esc } from './util.js';
import { DIAGRAMS } from './diagrams.js';
import { mountListenBar } from './listen.js';

const MODE_KEY = 'afmc.lessonMode';
const KIND_LABEL = {
  idea: 'Big idea', analogy: 'Think of it like this', electrical: 'Electrical example',
  try: 'Practice task', check: 'Quick check', safety: 'Safety note', finish: 'Recap',
  quiz: 'Quiz', resources: 'Free resources',
};
const MODE_LABEL = { phone: 'Phone friendly', mixed: 'Phone + computer practice', computer: 'Needs a computer' };

function getMode() { try { return localStorage.getItem(MODE_KEY) === 'scroll' ? 'scroll' : 'cards'; } catch (e) { return 'cards'; } }
function setModeStored(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ } }

/* ---------- lesson list, with filters ---------- */
export async function renderLessonList(_route, moduleParam = '') {
  const [c, lessons, pathway] = await Promise.all([loadCurriculum(), loadLessons(), loadPathway()]);
  const state = getState();
  const mods = pathway.modules;
  const modName = (id) => (mods.find((m) => m.id === id) || {}).title || '';
  const items = lessons.map((l) => {
    const done = state.completedLessons.includes(l.id);
    const rev = state.revisionLessons.includes(l.id);
    const saved = state.bookmarks.includes(l.id);
    const status = [done ? 'done' : 'todo', rev ? 'revision' : '', saved ? 'bookmarked' : ''].filter(Boolean).join(' ');
    const search = [l.title, ...(l.skills || []), modName(l.module)].join(' ').toLowerCase();
    return `<li data-module="${esc(l.module)}" data-level="${esc(l.level)}" data-mode="${esc(l.mode)}" data-status="${status}" data-search="${esc(search)}">
      <a class="lesson-link" data-tilt href="#/lesson/${esc(l.id)}">
        <span class="eyebrow">Module ${esc(l.module.replace('m', ''))} · Lesson ${l.number}</span>
        <strong>${esc(l.title)}</strong>
        <span class="tags"><span class="tag">${esc(l.level)}</span><span class="tag">${l.minutes} min</span>
        <span class="tag ${l.mode === 'phone' ? 'phone' : 'laptop'}">${MODE_LABEL[l.mode] || ''}</span>
        ${done ? '<span class="tag phone">Completed</span>' : ''}${rev ? '<span class="tag laptop">Revise</span>' : ''}${saved ? '<span class="tag">Bookmarked</span>' : ''}</span>
      </a></li>`;
  }).join('');
  const opt = (v, t, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${esc(t)}</option>`;
  return `<h1>Lessons</h1>
    <p class="lead">Small cards. One idea at a time.</p>
    <div class="controls" data-no-speak>
      <label class="field">Search by topic or skill<input type="search" data-lfilter="text" placeholder="For example: LLM, data, safety" autocomplete="off"></label>
      <label class="field">Module<select data-lfilter="module">${opt('all', 'All modules')}${mods.map((m) => opt(m.id, `${m.number}. ${m.title}`, m.id === moduleParam)).join('')}</select></label>
      <label class="field">Level<select data-lfilter="level">${opt('all', 'All levels')}${['Beginner', 'Intermediate', 'Advanced'].map((v) => opt(v, v)).join('')}</select></label>
      <label class="field">Where can I study it?<select data-lfilter="mode">${opt('all', 'Anywhere')}${opt('phone', 'Phone friendly only')}${opt('computer', 'Needs a computer')}</select></label>
      <label class="field">My lessons<select data-lfilter="status">${opt('all', 'All')}${opt('todo', 'Not completed')}${opt('done', 'Completed')}${opt('revision', 'Marked for revision')}${opt('bookmarked', 'Bookmarked')}</select></label>
    </div>
    <p id="lesson-count" class="muted small" role="status"></p>
    <ul class="lesson-list" id="lesson-filter-list">${items}</ul>
    <p class="muted">More lessons are added step by step. The Learning Pathway shows every lesson that is planned.</p>`;
}

function applyLessonFilter() {
  const list = document.getElementById('lesson-filter-list');
  if (!list) return;
  const get = (k) => document.querySelector(`[data-lfilter="${k}"]`).value;
  const text = get('text').trim().toLowerCase();
  const [module, level, mode, status] = ['module', 'level', 'mode', 'status'].map(get);
  let shown = 0;
  [...list.children].forEach((li) => {
    const d = li.dataset;
    const modeOk = mode === 'all' || (mode === 'phone' ? d.mode === 'phone' : d.mode !== 'phone');
    const ok = (module === 'all' || d.module === module) && (level === 'all' || d.level === level) && modeOk
      && (status === 'all' || d.status.split(' ').includes(status)) && (!text || d.search.includes(text));
    li.hidden = !ok;
    if (ok) shown += 1;
  });
  document.getElementById('lesson-count').textContent = `${shown} of ${list.children.length} lessons shown`;
}
export const filters = { apply: applyLessonFilter };

/* ---------- one lesson ---------- */
function tableHtml(t, title) {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(title)} table">
    <table><thead><tr>${t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${t.rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function quizCard(lesson, state) {
  const best = state.quizScores[lesson.id];
  const qs = lesson.quiz.map((q, i) => `<fieldset class="qq" data-correct="${q.answer}">
    <legend>${i + 1}. ${esc(q.q)}</legend>
    ${q.options.map((o, j) => `<button type="button" class="opt" data-action="quiz-answer" data-o="${j}">${esc(o)}</button>`).join('')}
    <p class="why" hidden>${esc(q.why)}</p></fieldset>`).join('');
  return { kind: 'quiz', html: `<section class="lcard kind-quiz" data-lesson-quiz="${esc(lesson.id)}">
    <p class="eyebrow">Quiz</p><h2>Five questions</h2>
    <p class="muted">Tap an answer. You will see the right answer and why.${best ? ` Best score so far: ${best.best} of ${best.total}.` : ''}</p>
    ${qs}<div class="quiz-result" hidden role="status"></div></section>` };
}

function resourcesCard(lesson) {
  const items = lesson.resources.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>
    <span class="tags"><span class="tag phone">${r.free ? 'Free' : 'Paid'}</span><span class="tag">${esc(r.type)}</span></span></li>`).join('');
  return { kind: 'resources', html: `<section class="lcard kind-resources"><p class="eyebrow">Free resources</p><h2>Keep learning</h2>
    <ul class="resource-list">${items}</ul>
    <p class="muted small">Links checked on ${esc(lesson.checked)}. Links open in a new tab. If one stops working, search for its title.</p></section>` };
}

function cardHtml(card, glossary, lesson, state, next, quizIndex) {
  const lines = card.lines.map((t) => `<p class="big">${esc(t)}</p>`).join('');
  const diagram = card.diagram && DIAGRAMS[card.diagram] ? `<figure class="diagram">${DIAGRAMS[card.diagram]()}</figure>` : '';
  const table = card.table ? tableHtml(card.table, card.title) : '';
  const badge = card.badge ? `<p class="tags"><span class="tag phone">${esc(card.badge)}</span></p>` : '';
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
        ${quizIndex >= 0 ? '<button type="button" class="btn" data-action="goto-quiz">Start quiz</button>' : ''}
        <button type="button" class="btn" disabled>Add note (coming soon)</button>
        ${next ? `<a class="btn primary" href="#/lesson/${esc(next.id)}">Next lesson</a>` : '<a class="btn" href="#/lessons">All lessons</a>'}
      </div>`;
  }
  return { kind: card.kind, html: `<section class="lcard kind-${card.kind}">
    <p class="eyebrow">${KIND_LABEL[card.kind] || 'Idea'}</p><h2>${esc(card.title)}</h2>${badge}${diagram}${lines}${table}
    ${terms ? `<div class="terms" data-no-speak><span class="muted small">Tap a word:</span>${terms}</div>` : ''}${extra}</section>` };
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
  const body = lesson.cards.filter((x) => x.kind !== 'finish');
  const finish = lesson.cards.find((x) => x.kind === 'finish');
  const quizIndex = lesson.quiz ? body.length : -1;
  const parts = body.map((card) => cardHtml(card, glossary, lesson, state, next, quizIndex));
  if (lesson.quiz) parts.push(quizCard(lesson, state));
  if (lesson.resources) parts.push(resourcesCard(lesson));
  if (finish) parts.push(cardHtml(finish, glossary, lesson, state, next, quizIndex));
  const total = parts.length;
  const saved = state.bookmarks.includes(lesson.id);
  const pre = (lesson.prereq || []).map((pid) => lessons.find((l) => l.id === pid)).filter(Boolean);

  return `<article class="lesson" data-lesson="${esc(lesson.id)}" data-phase="${esc(lesson.phase)}" data-mode="${mode}" data-step="0" data-total="${total}" data-quiz-index="${quizIndex}">
    <p class="eyebrow">Module ${esc(lesson.module.replace('m', ''))} · Phase ${phase.number} · Lesson ${lesson.number}</p>
    <h1>${esc(lesson.title)}</h1>
    <p class="tags"><span class="tag">${esc(lesson.level)}</span><span class="tag">${lesson.minutes} min</span>
      <span class="tag ${lesson.mode === 'phone' ? 'phone' : 'laptop'}">${MODE_LABEL[lesson.mode]}</span></p>
    <p class="muted small">Before this: ${pre.length ? pre.map((p) => `<a href="#/lesson/${esc(p.id)}">${esc(p.title)}</a>`).join(', ') : 'nothing. You can start here.'} (A suggestion, not a lock.)</p>
    <div class="head-actions" data-no-speak>
      <div class="seg" role="group" aria-label="Lesson view">
        <button type="button" data-action="set-mode" data-mode="cards" aria-pressed="${mode === 'cards'}">Cards</button>
        <button type="button" data-action="set-mode" data-mode="scroll" aria-pressed="${mode === 'scroll'}">Scroll</button>
      </div>
      <button type="button" class="btn${saved ? ' done' : ''}" data-action="toggle-bookmark" aria-pressed="${saved}">${saved ? 'Bookmarked' : 'Bookmark'}</button>
    </div>
    <div class="deck-bar" data-no-speak><span style="width:${(100 / total).toFixed(1)}%"></span></div>
    <div class="deck">${parts.map((p, i) => p.html.replace('class="lcard', `class="lcard${i === 0 ? ' active' : ''}`)).join('')}</div>
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
  const view = document.getElementById('view');   // restart Listen so it reads the new card
  view.querySelector('.listen')?.remove();
  mountListenBar(view);
}
const lessonEl = () => document.querySelector('.lesson');
const stepOf = (art) => Number(art.dataset.step);

export function attachDeckControls() {
  let sx = 0; let sy = 0;
  document.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const art = lessonEl();
    if (!art || art.dataset.mode !== 'cards' || !e.target.closest('.deck') || e.target.closest('.table-wrap')) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45) goTo(art, stepOf(art) + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    const art = lessonEl();
    if (!art || art.dataset.mode !== 'cards' || e.target.closest('input, select, textarea, button, a, summary, .table-wrap')) return;
    if (e.key === 'ArrowRight') goTo(art, stepOf(art) + 1);
    if (e.key === 'ArrowLeft') goTo(art, stepOf(art) - 1);
  });
}

/* ---------- buttons ---------- */
function toggle(key, id) {
  const set = new Set(getState()[key]);
  if (set.has(id)) set.delete(id); else set.add(id);
  updateState({ [key]: [...set] });
  return set.has(id);
}

function finishQuiz(card) {
  const qs = [...card.querySelectorAll('.qq')];
  const score = qs.filter((f) => f.dataset.right).length;
  const id = card.dataset.lessonQuiz;
  const old = getState().quizScores[id];
  updateState({ quizScores: { ...getState().quizScores, [id]: { score, total: qs.length, best: Math.max(score, old ? old.best : 0), date: new Date().toISOString().slice(0, 10) } } });
  const msg = score === qs.length ? 'Excellent work.' : score >= 3 ? 'Good. Read the explanations for the ones you missed.' : 'Review the lesson cards, then try again.';
  const box = card.querySelector('.quiz-result');
  box.hidden = false;
  box.innerHTML = `<strong>Score: ${score} of ${qs.length}.</strong> ${esc(msg)} <button type="button" class="btn" data-action="quiz-retry">Try again</button>`;
}

export const actions = {
  'card-next': (el) => { const a = el.closest('.lesson'); goTo(a, stepOf(a) + 1); },
  'card-prev': (el) => { const a = el.closest('.lesson'); goTo(a, stepOf(a) - 1); },
  'goto-quiz': (el) => {
    const a = el.closest('.lesson');
    const i = Number(a.dataset.quizIndex);
    if (a.dataset.mode === 'cards') goTo(a, i); else a.querySelectorAll('.lcard')[i].scrollIntoView({ behavior: 'smooth' });
  },
  'set-mode': (el) => {
    const a = el.closest('.lesson');
    a.dataset.mode = el.dataset.mode;
    setModeStored(el.dataset.mode);
    a.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    goTo(a, stepOf(a));
  },
  'toggle-bookmark': (el) => {
    const on = toggle('bookmarks', el.closest('.lesson').dataset.lesson);
    el.setAttribute('aria-pressed', String(on));
    el.textContent = on ? 'Bookmarked' : 'Bookmark';
    el.classList.toggle('done', on);
  },
  'toggle-complete': (el) => {
    const art = el.closest('.lesson');
    const lid = art.dataset.lesson;
    const on = toggle('completedLessons', lid);
    const at = { ...getState().completedAt };
    if (on) at[lid] = new Date().toISOString(); else delete at[lid];
    updateState({ completedAt: at });
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
  'quiz-answer': (el) => {
    const fs = el.closest('.qq');
    if (fs.dataset.done) return;
    fs.dataset.done = '1';
    const correct = Number(fs.dataset.correct);
    fs.querySelectorAll('.opt').forEach((b, j) => {
      b.disabled = true;
      if (j === correct) b.classList.add('right');
      else if (b === el) b.classList.add('wrong');
    });
    if (Number(el.dataset.o) === correct) fs.dataset.right = '1';
    fs.querySelector('.why').hidden = false;
    const card = fs.closest('.lcard');
    if ([...card.querySelectorAll('.qq')].every((f) => f.dataset.done)) finishQuiz(card);
  },
  'quiz-retry': (el) => {
    const card = el.closest('.lcard');
    card.querySelectorAll('.qq').forEach((f) => {
      delete f.dataset.done; delete f.dataset.right;
      f.querySelector('.why').hidden = true;
      f.querySelectorAll('.opt').forEach((b) => { b.disabled = false; b.classList.remove('right', 'wrong'); });
    });
    card.querySelector('.quiz-result').hidden = true;
    card.scrollIntoView({ behavior: 'smooth' });
  },
};
