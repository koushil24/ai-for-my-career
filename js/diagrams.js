/* diagrams.js - small SVG pictures used inside lesson cards.
   A card asks for one by name, for example  "diagram": "circles"  in the lesson JSON.
   Colours come from CSS (see .diagram in depth.css), so they follow dark/light mode. */

const DEFS = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="d-head-fill"/></marker></defs>';

const box = (x, y, w, h, lines) =>
  `<rect class="d-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>` +
  lines.map((t, i) => `<text class="d-text" x="${x + w / 2}" y="${y + h / 2 + (i - (lines.length - 1) / 2) * 14 + 4}" text-anchor="middle">${t}</text>`).join('');

const arrow = (x1, y, x2) => `<line class="d-arrow" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" marker-end="url(#ah)"/>`;
const label = (x, y, t) => `<text class="d-label" x="${x}" y="${y}">${t}</text>`;
const wrap = (h, desc, inner) =>
  `<svg class="diagram-svg" viewBox="0 0 320 ${h}" role="img" aria-label="${desc}" xmlns="http://www.w3.org/2000/svg">${DEFS}${inner}</svg>`;

export const DIAGRAMS = {
  'rule-vs-learn': () => wrap(182, 'Top row: a relay measures current, applies a fixed rule, then trips or not. Bottom row: AI studies 1,000 past cases, learns the pattern, then predicts new cases.',
    label(8, 16, 'RULEBOOK (A RELAY)') +
    box(8, 24, 84, 52, ['Measured', 'current']) + arrow(92, 50, 122) +
    box(122, 24, 84, 52, ['Fixed rule', 'by a person']) + arrow(206, 50, 236) +
    box(236, 24, 76, 52, ['Trip or', 'no trip']) +
    label(8, 108, 'APPRENTICE (AI)') +
    box(8, 116, 84, 52, ['1,000 past', 'cases']) + arrow(92, 142, 122) +
    box(122, 116, 84, 52, ['Learns the', 'pattern']) + arrow(206, 142, 236) +
    box(236, 116, 76, 52, ['Predicts', 'new cases'])),

  'train-infer': () => wrap(160, 'Training: examples go into training and produce a model. Using it: new input goes into the model and an answer comes out.',
    label(8, 14, '1. TRAINING (SLOW)') +
    box(8, 22, 84, 44, ['Examples', '(data)']) + arrow(92, 44, 122) +
    box(122, 22, 84, 44, ['Training']) + arrow(206, 44, 236) +
    box(236, 22, 76, 44, ['Model']) +
    label(8, 98, '2. USING IT (FAST)') +
    box(8, 106, 84, 44, ['New', 'input']) + arrow(92, 128, 122) +
    box(122, 106, 84, 44, ['Model']) + arrow(206, 128, 236) +
    box(236, 106, 76, 44, ['Answer'])),

  'circles': () => wrap(230, 'Three circles inside each other: AI is the biggest, machine learning is inside AI, deep learning is inside machine learning.',
    '<circle class="d-ring r1" cx="160" cy="115" r="108"/><circle class="d-ring r2" cx="160" cy="115" r="78"/><circle class="d-ring r3" cx="160" cy="115" r="46"/>' +
    '<text class="d-text" x="160" y="30" text-anchor="middle">AI</text>' +
    '<text class="d-text" x="160" y="58" text-anchor="middle">Machine learning</text>' +
    '<text class="d-text" x="160" y="112" text-anchor="middle">Deep</text><text class="d-text" x="160" y="127" text-anchor="middle">learning</text>'),
};
