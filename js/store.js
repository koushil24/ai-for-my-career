/* store.js - the ONLY file that touches localStorage for progress.
   All progress lives under one key so it is easy to back up or reset. */

const KEY = 'afmc.v1';

const DEFAULTS = {
  version: 1,
  userId: null,            // reserved: lets login be added later
  currentPhase: 0,
  completedLessons: [],    // lesson ids, e.g. "p1-l1"
  revisionLessons: [],
  quizScores: {},          // quizId -> { score, total, date }
  completedProjects: [],
  skills: {},              // skillId -> 0..100
  phaseStatus: {},         // phaseId -> "in-progress" | "completed"
  notes: [],
  streak: 0,
  lastActiveDate: null,    // "YYYY-MM-DD" in local time
  lastLesson: null,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch (e) {
    return { ...DEFAULTS };   // storage blocked or corrupted: start fresh
  }
}

function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export function getState() { return read(); }

export function updateState(change) {
  const next = { ...read(), ...change };
  write(next);
  return next;
}

function dayString(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* Call once per visit: keeps the learning streak up to date. */
export function touchStreak() {
  const s = read();
  const today = dayString(new Date());
  if (s.lastActiveDate === today) return s;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = s.lastActiveDate === dayString(y) ? s.streak + 1 : 1;
  return updateState({ streak, lastActiveDate: today });
}

/* Numbers shown on the Home cards. */
export function getStats(totalLessons = 0) {
  const s = read();
  const done = s.completedLessons.length;
  return {
    lessonsDone: done,
    quizzesDone: Object.keys(s.quizScores).length,
    projectsDone: s.completedProjects.length,
    skillsLearned: Object.values(s.skills).filter((v) => v > 0).length,
    overallPercent: totalLessons ? Math.round((done / totalLessons) * 100) : 0,
    streak: s.streak,
    currentPhase: s.currentPhase,
    lastLesson: s.lastLesson,
  };
}
