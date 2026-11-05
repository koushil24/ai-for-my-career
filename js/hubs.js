/* hubs.js - the Electrical Engineering page and the Projects page. */
import { loadPathway } from './data.js';
import { getState } from './store.js';
import { esc } from './util.js';
import { loadHome, tile } from './home.js';
import { icon } from './icons.js';

export async function renderElectrical() {
  const [H, pathway] = await Promise.all([loadHome(), loadPathway()]);
  const m6 = pathway.modules.find((m) => m.id === 'm6');
  const done = getState().completedLessons;
  return `<h1>AI + Electrical Engineering</h1>
    <p class="lead">Protection relays, testing, commissioning, SCADA and IEC 61850, learned with the help of AI.</p>
    <p class="note"><strong>Safety:</strong> everything here is for learning. AI never replaces approved protection settings, manufacturer instructions, safety procedures or engineer verification.</p>
    <h2>Topics</h2>
    <div class="nx-tiles nx-tiles-wide">${H.knowledge.map((k) => tile(k, '#/pathway')).join('')}</div>
    <p class="muted small">These topic lessons are planned inside Module 6. The tiles open the Learning Pathway.</p>
    <h2>Module 6 lessons</h2>
    <ol class="plain module-lessons">${m6.lessons.map((l) => (l.id ? `<li class="ready"><a href="#/lesson/${esc(l.id)}">${esc(l.title)}</a>${done.includes(l.id) ? ' <span class="tag phone">Done</span>' : ''}</li>` : `<li class="planned">${esc(l.title)} <span class="tag">Coming soon</span></li>`)).join('')}</ol>
    <p><a class="btn primary" href="#/pathway">Open the Learning Pathway ${icon('arrow', 18)}</a></p>`;
}

export async function renderProjects() {
  const H = await loadHome();
  return `<h1>Projects</h1>
    <p class="lead">Practical projects, from beginner to advanced.</p>
    <p class="note">All projects use fictional or synthetic data. Nothing here uses confidential workplace information, and no project is a certified protection or safety system.</p>
    <div class="nx-projects nx-projects-wide">${H.projects.map((p) => `<article class="nx-proj-card nx-panel">
      <span class="nx-proj-img"><img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></span>
      <div><h2>${esc(p.title)}</h2><p class="muted small">${esc(p.tags)}</p><p>${esc(p.desc)}</p>
      <p class="tags"><span class="nx-status s-${p.status.toLowerCase()}">${esc(p.status)}</span><a class="tag" href="#/lessons/${esc(p.module)}">Related lessons</a></p></div></article>`).join('')}</div>`;
}
