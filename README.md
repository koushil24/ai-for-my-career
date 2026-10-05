# AI for My Career

From Zero to Advanced AI for Electrical Engineering.
A static learning website (HTML, CSS, JavaScript) for GitHub Pages. Progress is saved in your own browser.

## Status
Stage 1 of 14: design system and deployable skeleton (Home, Roadmap, menu, dark/light mode).

## Folder guide
- `index.html` - the single page that everything loads into
- `css/` - look and feel (`base.css` colours and layout, `components.css` buttons and cards)
- `js/` - `config.js` branding and menu, `router.js` page switching, `store.js` saved progress, `app.js` pages
- `data/` - content as JSON (`curriculum.json` lists the 27 phases)
- `assets/images/` - logo and favicon

## Notes
Open the live GitHub Pages address to test. Opening `index.html` directly from a file manager will not work, because the site loads its data with `fetch`.
