/* util.js - tiny helpers shared by all pages. */

/* Makes text safe to put inside HTML. Always use this for data from JSON files. */
export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const STATUS_LABEL = { 'not-started': 'Not started', 'in-progress': 'In progress', completed: 'Completed' };
