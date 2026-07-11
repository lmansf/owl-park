# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Static site, no build step, no backend. Run locally with `python3 -m http.server 8811` (any static
  server works, but `fetch()` for feature assets/product data requires real HTTP — `file://` won't work).
  See README.md for the product/PLU model, the `features/` plugin contract, and how to author a new
  feature module.
- OpenSpec proposal/specs/design/tasks for this project's initial build live under
  `openspec/changes/critter-cove-shop/`.
- `chrome-devtools-axi` is not installed in this environment. For browser verification/screenshots, use
  `google-chrome --headless --no-sandbox` directly, or `npm install puppeteer-core` pointed at
  `executablePath: "/usr/bin/google-chrome"` for anything needing DOM interaction (clicks, toggles).
- Every `features/<id>/script.js` must export symmetric `activate`/`deactivate`; anything a feature
  injects outside the loader-managed `mount` element must be tagged `data-feature="<id>"` so
  `js/feature-loader.js`'s cleanup pass can catch it. Verified via automated enable-all/disable-all DOM
  audits (zero `[data-feature]` residue after disabling) — re-run that style of check after touching
  the loader or any feature's teardown logic.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
