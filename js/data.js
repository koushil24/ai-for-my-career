/* data.js - loads the JSON content files once and remembers them. */

let curriculum = null;
let lessons = null;
let glossary = {};

async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

export async function loadCurriculum() {
  if (!curriculum) curriculum = await getJson('data/curriculum.json');
  return curriculum;
}

/* All lessons from every file listed in data/lessons/index.json.
   To add lessons later: add a new file and list it in index.json. No code changes. */
export async function loadLessons() {
  if (!lessons) {
    const index = await getJson('data/lessons/index.json');
    const files = await Promise.all(index.files.map((f) => getJson(`data/lessons/${f}`)));
    lessons = files.flatMap((f) => f.lessons);
    files.forEach((f) => Object.assign(glossary, f.glossary || {}));
  }
  return lessons;
}

export const phaseNumber = (phaseId) => Number(String(phaseId).replace('p', ''));

/* Word meanings collected from all lesson files (available after loadLessons). */
export const getGlossary = () => glossary;
