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

/* The 5 buttons in the phone bottom bar. 'more' opens the full menu. */
export const TABS = [
  { id: 'home',    icon: '🏠', label: 'Home' },
  { id: 'roadmap', icon: '🗺️', label: 'Roadmap' },
  { id: 'lessons', icon: '📘', label: 'Lessons' },
  { id: 'notes',   icon: '📝', label: 'Notes' },
  { id: 'more',    icon: '☰',  label: 'More' },
];
