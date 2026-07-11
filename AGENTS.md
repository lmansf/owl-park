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
- `renderCatalog()` (`js/main.js`) replaces `#catalog-grid`'s `innerHTML` on every tab switch, wiping
  out anything a feature appended onto a `.product-card`. Features that decorate product cards
  (`product-badges`, `product-info-tooltips`, `urgency-stock-indicator`, `live-visitor-counter`,
  `membership-glow`) re-apply via a `MutationObserver` on `#catalog-grid` guarded by an idempotency
  check — see README.md's "Authoring a new feature" section.
- CI (`.github/workflows/ci.yml`) runs on every push/PR: JSON validity, `node --check` on all JS,
  a `features/index.json` <-> `features/` folder consistency check, and an HTTP smoke test of key
  pages/assets over `python3 -m http.server`. There's no separate test suite — this is the whole
  automated check surface.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
