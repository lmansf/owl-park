# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Static site, no build step, no backend. Run locally with `python3 -m http.server 8811` (any static
  server works, but `fetch()` for feature assets/product data requires real HTTP — `file://` won't work).
  See README.md for the product/PLU model, the `features/` plugin contract, and how to author a new
  feature module.
- OpenSpec proposals/specs/designs/tasks live under `openspec/changes/` —
  `critter-cove-shop/` for the initial build, `owlpark-feat15-round2/` for the 15 round-2
  enhancement modules.
- `chrome-devtools-axi` is installed — prefer it for browser verification. On index.html its
  snapshot refs go stale within seconds (the rotating owl-fact ticker mutates the DOM), so drive
  interactions with `eval "() => { document.querySelector(...).click(); ... }"` instead of
  `click @uid`. Chrome serves `data/products.json` from HTTP cache across reloads (python
  http.server sends Last-Modified), so to test fetch-failure paths either restart the browser
  (`chrome-devtools-axi stop` — also wipes localStorage) or monkeypatch `window.fetch`.
- `js/main.js`'s `init()` awaits `loadProducts()` before `applyEnabledFeatures()`, so if the
  products fetch fails NO feature is injected at all — a feature's own products-fetch error
  handling only runs when its independent request fails. To exercise that (or any live toggle)
  in-page: `const l = await import('./js/feature-loader.js')`, then `l.deactivateFeature(f)` /
  `l.activateFeature(f)` on an entry from `l.discoverFeatures()`.
- Each `features/<id>.html` is ONE self-contained file (manifest + style + markup + a plain,
  non-module `<script>` IIFE) — no separate files, no `import`/`export` anywhere, per README.md's
  "The `features/` plugin system" section. The loader re-creates and appends the file's non-manifest
  elements live; creating a _new_ `<script>` element (not `innerHTML`) is what makes it execute.
  Anything a feature injects beyond its own file's static markup must be tagged
  `data-owlpark-feature="<id>"` so `js/feature-loader.js`'s cleanup pass can catch it. Verified via
  automated enable-all/disable-all DOM audits (zero `[data-owlpark-feature]`/stray `<style>` residue
  after disabling) — re-run that style of check after touching the loader or any feature.
- Features can't import `js/cart.js` (no imports allowed at all) — those that need cart contents
  read `localStorage.getItem("owl-park-cart")` directly and poll on an interval to react to changes.
- Sharp edge in `js/feature-loader.js`'s `injectSnippet`: it parses a feature's raw text with
  `DOMParser`, wrapped in a manually-built `<html><body>...</body></html>` shell before parsing —
  don't remove that wrapper. Without it, a feature file whose first elements are `<script>`/`<style>`
  (i.e. no markup fragment before the behavior script) gets silently parsed into `<head>` instead of
  `<body>` by the HTML parsing algorithm, so `parsed.body.childNodes` misses them entirely and the
  feature never activates. This bit 14 of the 20 shipped features until caught by checking
  `window.__owlParkFeatures` registration counts after enable-all, not just DOM-residue counts.
- `renderCatalog()` (`js/main.js`) replaces `#catalog-grid`'s `innerHTML` on every tab switch, wiping
  out anything a feature appended onto a `.product-row`. Features that decorate product rows
  (`product-badges`, `product-info-tooltips`, `urgency-stock-indicator`, `live-visitor-counter`,
  `membership-glow`, `wishlist-favorites`, `discount-badge-strikethrough`) re-apply via a
  `MutationObserver` on `#catalog-grid` guarded by an idempotency check. `js/main.js` likewise
  overwrites `#order-id`'s `textContent` on every checkout (`copy-order-id-button` and
  `order-history-log` observe and re-apply) — see README.md's "Authoring a new feature" section.
- CI (`.github/workflows/ci.yml`) runs on every push/PR: JSON validity, `node --check` on `js/` and
  on each feature's extracted behavior script, a `features/index.json` <-> `features/*.html`
  consistency check, and an HTTP smoke test of key pages/assets over `python3 -m http.server`.
  There's no separate test suite — this is the whole automated check surface.
- When driving Puppeteer against real coordinates (`page.click(selector)`, not `page.evaluate`),
  close the cart drawer (`#close-cart-btn`) before clicking anything else on the page: the drawer's
  full-viewport `#cart-overlay` sits on top and silently absorbs clicks meant for buttons underneath
  it (no error — the click just lands on the overlay instead), which looks like a feature's button
  handler never fired.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
