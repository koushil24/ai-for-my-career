/* progress.js - the Progress page: lessons, modules, quiz scores, revision list, bookmarks and backup. */
import { loadLessons, loadPathway } from './data.js';
import { getState, getStats, exportState, importState, resetState } from './store.js';
import { esc } from './util.js';

export async function renderProgress() {
  const [lessons, pathway] = await Promise.all([loadLessons(), loadPathway()]);
  const st = getState();
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const done = st.completedLessons.filter((id) => byId.has(id)).length;
  const planned = pathway.modules.reduce((n, m) => n + m.lessons.length, 0);
  const stats = getStats(lessons.length);
  const link = (id) => `<a href="#/lesson/${esc(id)}">${esc(byId.get(id).title)}</a>`;

  const mods = pathway.modules.map((m) => {
    const ready = m.lessons.filter((l) => l.id && byId.has(l.id));
    const d = ready.filter((l) => st.completedLessons.includes(l.id)).length;
    const pct = ready.length ? Math.round((d / ready.length) * 100) : 0;
    return `<li><span>Module ${m.number}: ${esc(m.title)}</span><b>${ready.length ? `${d} of ${ready.length}` : 'Coming soon'}</b>
      <i><u style="width:${pct}%"></u></i></li>`;
  }).join('');

  const quizRows = Object.entries(st.quizScores).filter(([id]) => byId.has(id))
    .map(([id, q]) => `<li>${link(id)} <span class="tag phone">Best ${q.best} of ${q.total}</span> <span class="muted small">last ${q.score} of ${q.total}${q.date ? ', ' + esc(q.date) : ''}</span></li>`).join('');
  const rev = st.revisionLessons.filter((id) => byId.has(id)).map((id) => `<li>${link(id)}</li>`).join('');
  const bm = st.bookmarks.filter((id) => byId.has(id)).map((id) => `<li>${link(id)}</li>`).join('');
  const next = lessons.find((l) => !st.completedLessons.includes(l.id));
  const empty = (t) => `<p class="muted">${t}</p>`;

  return `<h1>Progress</h1>
    <p class="lead">Saved privately on this device. Nothing is sent to a server.</p>
    <div class="stat-grid">
      <div class="stat"><span class="stat-label">Lessons completed</span><strong>${done} of ${lessons.length} available</strong></div>
      <div class="stat"><span class="stat-label">Planned in total</span><strong>${planned}</strong></div>
      <div class="stat"><span class="stat-label">Learning streak</span><strong>${stats.streak} day${stats.streak === 1 ? '' : 's'}</strong></div>
      <div class="stat"><span class="stat-label">This week</span><strong>${stats.weekCount} of ${stats.weeklyGoal} lessons</strong></div>
    </div>
    ${next ? `<p><a class="btn primary" href="#/lesson/${esc(st.lastLesson && !st.completedLessons.includes(st.lastLesson) && byId.has(st.lastLesson) ? st.lastLesson : next.id)}">Continue learning</a></p>` : '<p class="note">You have completed every available lesson. More are added step by step.</p>'}
    <h2>By module</h2>
    <ul class="nx-skillbars progress-mods">${mods}</ul>
    <h2>Quiz scores</h2>${quizRows ? `<ul class="plain">${quizRows}</ul>` : empty('No quizzes taken yet. Each lesson has one near the end.')}
    <h2>Marked for revision</h2>${rev ? `<ul class="plain">${rev}</ul>` : empty('Nothing marked yet.')}
    <h2>Bookmarked</h2>${bm ? `<ul class="plain">${bm}</ul>` : empty('Nothing bookmarked yet.')}
    <h2>Backup</h2>
    <p class="muted">Your progress lives in this browser only. Clearing browser data erases it, so save a backup file now and then.</p>
    <div class="lesson-actions" data-no-speak>
      <button type="button" class="btn" data-action="export-progress">Download backup</button>
      <label class="btn">Restore backup<input type="file" accept="application/json,.json" data-action="import-progress" class="sr-only"></label>
      <button type="button" class="btn" data-action="reset-progress">Reset progress</button>
    </div>
    <p id="backup-msg" class="muted small" role="status"></p>`;
}

const say = (t) => { const el = document.getElementById('backup-msg'); if (el) el.textContent = t; };

export const actions = {
  'export-progress': () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ai-for-my-career-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say('Backup downloaded. Keep the file somewhere safe.');
  },
  'import-progress': (el) => {
    const file = el.files && el.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importState(String(reader.result)); say('Backup restored. Reloading…'); setTimeout(() => location.reload(), 600); }
      catch (e) { say('That file could not be used. Choose a backup made by this site.'); }
    };
    reader.readAsText(file);
  },
  'reset-progress': () => {
    if (window.confirm('Erase all progress on this device? This cannot be undone. Download a backup first if unsure.')) {
      resetState(); say('Progress erased. Reloading…'); setTimeout(() => location.reload(), 600);
    }
  },
};
