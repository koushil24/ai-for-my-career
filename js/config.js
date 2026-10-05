/* config.js - branding and navigation. Change the site name, logo or menu HERE only. */

export const BRAND = {
  title: 'AI for My Career',
  subtitle: 'From Zero to Advanced AI for Electrical Engineering',
  tagline: 'Learn AI. Build Skills. Engineer the Future.',
  logo: 'assets/images/logo1.jpg',
};

/* Every section of the site.
   stage = the build stage in which the real page arrives (see README roadmap).
   blurb = what the page will contain. Shown on "coming soon" pages. */
export const ROUTES = [
  { id: 'home',       label: 'Home',          stage: 1,  blurb: '' },
  { id: 'dashboard',  label: 'Dashboard',     stage: 6,  blurb: 'Your overall progress, quiz scores, streak and the next lesson to study.' },
  { id: 'roadmap',    label: 'AI Roadmap',    stage: 1,  blurb: '' },
  { id: 'syllabus',   label: 'Syllabus',      stage: 3,  blurb: 'Every phase broken into modules, topics, objectives, exercises and quizzes.' },
  { id: 'courses',    label: 'Courses',       stage: 4,  blurb: 'Phases grouped as courses you can open and study in order.' },
  { id: 'lessons',    label: 'Lessons',       stage: 4,  blurb: 'Short lessons: simple explanation, technical explanation, electrical example, exercise and quiz.' },
  { id: 'practice',   label: 'Practice',      stage: 9,  blurb: 'Exercises by category and level: Beginner, Intermediate, Advanced.' },
  { id: 'quizzes',    label: 'Quizzes',       stage: 5,  blurb: 'Multiple choice, true/false, scenario and electrical questions with explanations.' },
  { id: 'projects',   label: 'Projects',      stage: 8,  blurb: 'Portfolio projects from Beginner to Advanced, using simulated data.' },
  { id: 'python',     label: 'Python',        stage: 9,  blurb: 'Python from zero. Best used once you have a laptop.' },
  { id: 'ml',         label: 'Machine Learning', stage: 9, blurb: 'Introduction to machine learning with electrical examples.' },
  { id: 'genai',      label: 'Generative AI', stage: 9,  blurb: 'How LLMs work and how to use them well.' },
  { id: 'rag',        label: 'RAG',           stage: 9,  blurb: 'Retrieval-Augmented Generation: AI that answers from your documents.' },
  { id: 'agents',     label: 'AI Agents',     stage: 9,  blurb: 'Agents, tools, planning and human-in-the-loop design.' },
  { id: 'mcp',        label: 'MCP',           stage: 9,  blurb: 'Model Context Protocol explained with simple diagrams.' },
  { id: 'automation', label: 'AI Automation', stage: 9,  blurb: 'Workflows, APIs, webhooks and human approval steps.' },
  { id: 'electrical', label: 'AI + Electrical', stage: 10, blurb: 'Protection relays, testing, SCADA and IEC 61850 meet AI.' },
  { id: 'trends',     label: 'AI Trends',     stage: 11, blurb: 'What changed, why it matters, and how you can learn it. Updated from reliable sources.' },
  { id: 'career',     label: 'Career',        stage: 11, blurb: 'Future roles and the skills each one needs. No job or salary promises.' },
  { id: 'resources',  label: 'Resources',     stage: 11, blurb: 'Official documentation, courses, books and tools, labelled free or paid.' },
  { id: 'notes',      label: 'Notes',         stage: 7,  blurb: 'Your own notes with tags and categories, saved on this device.' },
  { id: 'progress',   label: 'Progress',      stage: 6,  blurb: 'Charts for each phase and skill.' },
  { id: 'about',      label: 'About',         stage: 13, blurb: 'Why this project exists and how it is built.' },
];

/* Simple line icons (no emoji). Each one is a small SVG that takes the text colour. */
const svg = (inner) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

export const ICONS = {
  home:    svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  roadmap: svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  lessons: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>'),
  notes:   svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  more:    svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  sun:     svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon:    svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
};

/* The 5 buttons in the phone bottom bar. 'more' opens the full menu. */
export const TABS = [
  { id: 'home',    icon: ICONS.home,    label: 'Home' },
  { id: 'roadmap', icon: ICONS.roadmap, label: 'Roadmap' },
  { id: 'lessons', icon: ICONS.lessons, label: 'Lessons' },
  { id: 'notes',   icon: ICONS.notes,   label: 'Notes' },
  { id: 'more',    icon: ICONS.more,    label: 'More' },
];
