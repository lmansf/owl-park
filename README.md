# Owl Park

A fictional owl park's ticket & membership storefront, built as a demo/test project and
design-review sandbox. The whole site is vanilla HTML/CSS/JS with **no build step**, because the
centerpiece is a `features/` plugin system that lets you plug and unplug small enhancement modules
on the live page at runtime.

## Running locally

This is a static site — any static file server works. It was built and tested with:

```bash
python3 -m http.server 8811
```

then open `http://localhost:8811/index.html`.

(`npx serve .` works too.) A real HTTP server is required — the loader uses `fetch()` for feature
assets and product data, which doesn't work over a bare `file://` URL.

## Product catalog & the PLU model

Products live in a single data file, [`data/products.json`](data/products.json) — nothing about
the catalog is hardcoded into HTML or JS. Each product has:

- `id` — a stable internal key. Used for cart storage, DOM `data-product-id` attributes, etc.
  Never shown to shoppers, never reused.
- `plu` — a short, retail-style lookup code (e.g. `4011`, `M250`), completely independent of `id`.
  Re-map a product to a different PLU by editing this one field — no template, layout, or logic
  changes needed.
- `category` — `"ticket"` or `"membership"`, used for the storefront filter tabs.
- Display fields: `name`, `tagline`, `description`, `price`, `unit`, `emoji`, `accent` (a hex color
  used as the card's accent), and an optional `featured` flag.

The catalog ships with 5 products: General Admission, Family Day Pass, and Twilight Explorer
tickets, plus Individual and Family & Household memberships.

## Shopping cart

`js/cart.js` is a small state module backed by `localStorage` (`owl-park-cart` key). It
exposes add/remove/set-quantity/clear plus a subscribe hook (`Cart.onChange`) that the storefront
UI (`js/main.js`) uses to re-render the cart drawer any time it changes. The cart persists across
reloads, and totals are always recomputed from current cart lines rather than cached.

Checkout is fully mocked: clicking **Checkout** renders an order summary and a confirmation with a
generated order id, then clears the cart. There's no real payment backend — this is a demo.

## The `features/` plugin system

Each enhancement is ONE self-contained file, `features/<feature-id>.html` — no separate manifest,
CSS, or JS files, and no build step. This mirrors a real constraint of third-party webstores (see
the [Layout inspiration](#layout-inspiration) section below): a site owner is often only allowed to
paste a single code snippet into a page body, with no separate assets and no import graph. Each
file contains, in order:

- `<script type="application/json" data-owlpark-manifest>` — required. A JSON object with `id`,
  `name`, `description`, `category` (`visual`/`behavioral`/`utility`), `enabledByDefault`,
  `requiresReload`. This block is only ever parsed for metadata — the loader never executes or
  re-injects it live.
- an optional `<style>` block — scoped to a `.owlpark-feat-<id>` class to avoid leaking onto the
  host page.
- optional static markup — wrapped in an element carrying that same `.owlpark-feat-<id>` class,
  for features that need an always-present container (a banner, a floating widget).
- a single plain `<script>` (no `type="module"`, no `import`/`export`) — an IIFE that defines
  `activate()`/`deactivate()`, calls `activate()` itself immediately (so the snippet works if
  pasted standalone into any page, no orchestration required), and registers itself:
  `window.__owlParkFeatures["<id>"] = { activate, deactivate }`, so the Owl Park loader can call
  `deactivate()`/`activate()` again later without re-injecting the whole snippet.

`features/index.json` is the registry: a flat JSON array of feature filenames. The runtime loader
(`js/feature-loader.js`) fetches each file's raw text once, parses out the manifest for discovery,
and on activate re-creates every non-manifest element and appends it live — creating a _new_
`<script>` element and appending it (rather than setting `innerHTML`) is what makes the browser
execute it. All 20 shipped features toggle live with zero page reloads; the manifest/manager UI
still support a `requiresReload` escape hatch for a future feature that genuinely needs one.

Because features can't `import` anything (including each other, or `js/cart.js`), any feature that
needs cart contents reads `localStorage.getItem("owl-park-cart")` directly (a JSON array of
`{ id, qty }` objects) and polls on an interval to react to changes, rather than subscribing to a
callback. `fetch("data/products.json")` remains fine to call from a feature — that's a data fetch,
not a code import.

### Authoring a new feature

1. Create `features/my-feature.html` with the four parts above: a `data-owlpark-manifest` script
   block, optional `<style>`, optional static markup, and a plain `<script>` IIFE.
2. In that script, define `activate()`/`deactivate()`, call `activate()` yourself at the bottom,
   and register into `window.__owlParkFeatures["my-feature"]`. Keep them symmetric: whatever
   `activate()` creates, `deactivate()` must remove — and tag anything you create _dynamically_
   (e.g. a badge appended onto an existing `.product-row`) with `data-owlpark-feature="my-feature"`
   yourself, since the loader only auto-tags the file's own top-level elements, not nodes your
   script creates elsewhere on the page.
3. Add `"my-feature.html"` to the array in `features/index.json`.
4. Reload the storefront or manager UI — your feature now shows up in the Enhancement Manager and
   can be toggled like any other.

**Gotcha for per-product-row features:** `renderCatalog()` in `js/main.js` replaces
`#catalog-grid`'s `innerHTML` wholesale on every tab switch, which wipes out any DOM nodes a
feature appended directly onto a `.product-row`. Features that decorate product rows (see
`product-badges`, `product-info-tooltips`, `urgency-stock-indicator`, `live-visitor-counter`, and
`membership-glow`) work around this with a `MutationObserver` on `#catalog-grid` that re-applies
the injection after each re-render, guarded by an idempotency check (skip a row that already has
the feature's tagged node) so it doesn't double-inject.

## The 20 enhancements

| Feature                 | Category   | Description                                                                                     |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Seasonal Banner         | visual     | Rotating seasonal promo banner (Summer Safari, Winter Lights) across the top of the storefront. |
| Owl Spotlight           | visual     | "Owl of the Day" spotlight card featuring an Owl Park resident, rotating every few seconds.     |
| Confetti Checkout       | visual     | Confetti burst animation on the checkout confirmation screen.                                   |
| Dark Mode               | visual     | Dark/light theme toggle in the header.                                                          |
| Feather Cursor Trail    | visual     | Decorative feather trail that follows the mouse cursor.                                         |
| Product Badges          | visual     | "Popular" / "Best Value" / "Members' Pick" ribbon badges on product rows.                       |
| Membership Glow         | visual     | Glowing highlight and ribbon on the recommended membership tier.                                |
| Park Weather Widget     | visual     | Fun mocked "park weather" badge encouraging visits on nice days.                                |
| Feeding Time Countdown  | behavioral | Live countdown timer to the next keeper feeding or special event.                               |
| Cart Reminder Toast     | behavioral | Gentle toast reminder if items sit in the cart without checking out.                            |
| Membership Upsell Modal | behavioral | Suggests a membership upgrade when a ticket-only cart builds up.                                |
| Urgency Stock Indicator | behavioral | "Only a few left today" urgency messaging on limited passes.                                    |
| Recently Viewed         | behavioral | Strip tracking and displaying recently viewed products.                                         |
| Exit Intent Offer       | behavioral | Exit-intent detection with a one-time discount nudge.                                           |
| Live Visitor Counter    | behavioral | Simulated "N people are looking at this" counter on product cards.                              |
| Loyalty Points Estimate | behavioral | Estimated loyalty points earned, shown at checkout.                                             |
| High-Contrast Mode      | utility    | High-contrast accessibility mode toggle for improved readability.                               |
| Font Size Adjuster      | utility    | Floating control to increase or decrease site-wide font size.                                   |
| Product Info Tooltips   | utility    | Info icons on product rows with detailed inclusion tooltips.                                    |
| Printable Receipt       | utility    | Adds a print/download receipt button to the checkout confirmation.                              |

(Each feature also has a `description` in its own `data-owlpark-manifest` block, shown live in the
Feature Manager UI; this table mirrors the same feature set.)

## Layout inspiration

The catalog's list-row layout (title/tagline/price/button up top, a divider, then
description/fine-print below) and the full-width hero image band were adapted from the structural
patterns of a real aquarium webstore, for a design-review comparison — see
`openspec/changes/critter-cove-shop/design.md` for the specific reference and what was and wasn't
carried over (structure only; no branding, copy, or images were reused).

## Feature Manager UI

`features-manager.html` (linked from the storefront header as "Enhancement Manager") lists every
feature discovered via `features/index.json`, shows its current on/off state, and gives you a
toggle switch per feature. Toggling calls straight into the loader's `activateFeature`/
`deactivateFeature`, so the effect is visible immediately — switch to the shop tab (or just
navigate back) and the change is already live. Enabled/disabled state is persisted to
`localStorage` (`owl-park-enabled-features` key) so it survives reloads. "Enable All" /
"Disable All" / "Reset to Defaults" toolbar buttons are provided for quickly comparing states.

## Project structure

```
index.html                 storefront (catalog, cart drawer, checkout modal)
features-manager.html      enhancement manager UI
css/storefront.css         shared site styles
css/manager.css            manager-page-only styles
data/products.json         product catalog + PLU data
js/products.js             product data loading helpers
js/cart.js                 cart state module (localStorage-backed)
js/feature-loader.js       runtime feature discovery/activate/deactivate
js/main.js                 storefront page glue
js/manager.js              manager page glue
features/index.json        registry of feature filenames
features/<feature-id>.html one self-contained file per enhancement
openspec/                  OpenSpec proposal/specs/design/tasks for this project
```

## OpenSpec

The product/PLU model, cart, features plugin system, and manager UI were specced before
implementation — see `openspec/changes/critter-cove-shop/` for the proposal, design doc, per-
capability specs, and task breakdown.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request. Since there's no build step and no
test suite, the checks are static/structural: JSON validity for every `.json` file, `node --check`
syntax validation for every file under `js/` plus every feature's embedded behavior script, a
consistency check that every `features/*.html` file is registered in `features/index.json` (and
vice versa) with a valid manifest whose `id` matches its filename and no `import`/`export`/
`type="module"` anywhere, and an HTTP smoke test that serves the site with `python3 -m http.server`
and fetches the key pages and assets.
