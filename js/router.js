/* router.js - shows the right page for the address after "#".
   Example: yoursite/#/roadmap  ->  route "roadmap". */

const pages = {};

export function registerPage(id, renderFn) { pages[id] = renderFn; }

export function currentRoute() {
  const path = location.hash.replace(/^#\/?/, '');
  return path.split('/')[0] || 'home';
}

export function startRouter(onChange) {
  const go = async () => {
    const id = currentRoute();
    const render = pages[id] || pages.__notfound;
    const view = document.getElementById('view');
    view.innerHTML = '<p class="muted">Loading…</p>';
    try {
      view.innerHTML = await render(id);
      if (pages.__after) pages.__after(id, view);
    } catch (err) {
      console.error(err);
      view.innerHTML = '<div class="card"><h2>Something went wrong</h2><p>This page could not load. Check your internet connection and refresh.</p></div>';
    }
    onChange(id);
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', go);
  go();
}
