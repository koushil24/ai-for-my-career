# AI for My Career

From Zero to Advanced AI for Electrical Engineering.
A static learning website (HTML, CSS, JavaScript) for GitHub Pages. Progress is saved in your own browser.

## Status
Stages 1 to 4 plus extras: roadmap, syllabus, card lessons with quizzes, Learning Pathway, Listen button, Cloud and DevOps lessons and the first AI Power User lessons.

## Folder guide
- `index.html` - the single page that everything loads into
- `css/` - look and feel (`base.css` colours and layout, `components.css` buttons and cards)
- `js/` - `config.js` branding and menu, `router.js` page switching, `store.js` saved progress, `app.js` pages
- `data/` - content as JSON (`curriculum.json` lists the 27 phases)
- `assets/images/` - logo and favicon

## Notes
Open the live GitHub Pages address to test. Opening `index.html` directly from a file manager will not work, because the site loads its data with `fetch`.

## Updating the site
Upload a file named `update.zip` to the repository root. The workflow in `.github/workflows/unzip.yml` unzips it, replaces matching files, deletes the zip and commits. Check the Actions tab for a green tick.
