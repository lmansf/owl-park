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
  A feature that WRITES the cart writes that key and then dispatches `owl-park-cart-changed` on
  `window`; `js/cart.js` listens and re-notifies so the storefront re-renders. `js/cart.js`'s own
  `writeCart()` raises that same event, so a core mutation reaches feature panels at once instead of
  up to one poll interval later (the dispatch is guarded against re-entry, so it can't loop). It's a
  latency fix, not a guarantee: a feature panel whose button mutates the cart must still recompute its
  offer from a fresh cart read AT CLICK TIME and decline an offer the cart no longer supports. A cart
  line is
  `{ id, qty }` plus optional `key` / `meta` / `custom` — `resolveLine()` (`js/products.js`) is the
  only place a line's price and display fields are decided, so every total agrees. A discounted line
  (off-peak) stores `custom.discountRate`, a basis re-applied to the live catalog price on every
  render — never a discounted amount, which a persisted cart would outlive; `custom.price` is an
  absolute only for a line with no catalog product (the donation). Since features can't import
  `js/products.js` either, those rules are published on `window.OwlPark` (`resolveLine`, `cartTotal`,
  `discountOf`) — a feature that prices cart lines MUST use them instead of `product.price × qty`,
  which drops donation lines and ignores off-peak discounts. That API is an import side effect of
  `js/products.js`, so EVERY page that activates features must import it: `js/main.js` does, and
  `js/manager.js` imports it purely for that (features-manager.html activates default-on features
  too, and a feature that reached for `window.OwlPark` there used to throw on every poll tick).
  See README.md's "The cart line model".
- Only product categories that have a filter tab in `index.html` are rendered in the catalog
  (`renderCatalog()` derives the list from `.tab-btn[data-filter]`), which is what keeps the `addon`
  products out of the storefront — they're attached from the cart by `visit-addons`.
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
  `order-history-log` observe and re-apply) and replaces `#cart-items`' `innerHTML` on every cart
  change (`smart-cart-savings`, `conservation-roundup`, `visit-addons` re-mount the same way) — see
  README.md's "Authoring a new feature" section. Mount cart panels in `#cart-items` (it scrolls), not
  `.cart-footer` (it doesn't — tall content there pushes Total and Checkout off a phone screen).
- CI (`.github/workflows/ci.yml`) runs on every push/PR: JSON validity, `node --check` on `js/` and
  on each feature's extracted behavior script, a `features/index.json` <-> `features/*.html`
  consistency check, and an HTTP smoke test of key pages/assets over `python3 -m http.server`.
  There's no separate test suite — this is the whole automated check surface.
- When driving Puppeteer against real coordinates (`page.click(selector)`, not `page.evaluate`),
  close the cart drawer (`#close-cart-btn`) before clicking anything else on the page: the drawer's
  full-viewport `#cart-overlay` sits on top and silently absorbs clicks meant for buttons underneath
  it (no error — the click just lands on the overlay instead), which looks like a feature's button
  handler never fired.
- Mobile/iOS invariants (see the `--safe-*` and `--tap` tokens at the top of `css/storefront.css`):
  edge-anchored chrome pads itself with `env(safe-area-inset-*)`, tappable controls hold a 44px
  floor, and the one text input (`promo-code-field`) stays at `font-size: 16px` or iOS Safari zooms
  the page on focus. Feature files can't use the storefront's CSS vars (they must work pasted
  standalone), so they call `env(...)` and `44px` literally. `.header-actions` is the header's
  extension point — features `prepend()` buttons into it, so `css/storefront.css` sizes
  `.header-actions > button, > a` centrally, and below 560px the strip scrolls horizontally with
  the cart pinned (otherwise the sticky header grows unbounded with each feature enabled).
- Verifying mobile with chrome-devtools-axi: `emulate --viewport "375x667x2,mobile,touch"` must be
  re-applied **after** every `open`/reload, and `window.innerWidth` lies under emulation — read
  `document.documentElement.clientWidth` instead. Chrome injects no real safe-area insets, so test
  them by overriding the `--safe-*` custom properties on `:root` and asserting the layout shifts.
  CSS edits need `chrome-devtools-axi stop` first: the HTTP cache otherwise serves the old
  stylesheet across reloads and you will "fix" things that never changed.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
