# Critter Cove Shop

A fictional zoo's ticket & membership storefront, built as a demo/test project and design-review
sandbox. The whole site is vanilla HTML/CSS/JS with **no build step**, because the centerpiece is
a `features/` plugin system that lets you plug and unplug small enhancement modules on the live
page at runtime.

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

`js/cart.js` is a small state module backed by `localStorage` (`critter-cove-cart` key). It
exposes add/remove/set-quantity/clear plus a subscribe hook (`Cart.onChange`) that the storefront
UI (`js/main.js`) uses to re-render the cart drawer any time it changes. The cart persists across
reloads, and totals are always recomputed from current cart lines rather than cached.

Checkout is fully mocked: clicking **Checkout** renders an order summary and a confirmation with a
generated order id, then clears the cart. There's no real payment backend — this is a demo.

## The `features/` plugin system

Each enhancement lives in its own folder under `features/<feature-id>/`:

- `manifest.json` — required. Declares `id`, `name`, `description`, `category`
  (`visual`/`behavioral`/`utility`), `enabledByDefault`, `requiresReload`, and a `files` map naming
  the feature's `css`, `html`, and `js` assets (css/html are optional; `js` is required).
- `style.css` — optional. Plain CSS, injected as a `<style data-feature="...">` tag in `<head>`
  when the feature activates, removed on deactivate.
- `fragment.html` — optional. A raw HTML snippet. The loader wraps it in a tagged container and
  appends it to `#feature-root` (a slot at the top of `<body>`, before the header, on every page).
  Fixed/absolutely-positioned content can appear anywhere on screen regardless of that DOM
  position — only features that want inline top-of-page placement (like a banner) rely on the
  order.
- `script.js` — required. An ES module exporting `activate(ctx)` and `deactivate(ctx)`, where
  `ctx` is `{ mount, featureId }`. `activate` wires up the feature's behavior (DOM injection into
  the rest of the page, event listeners, timers). `deactivate` must undo all of it — clear
  timers/listeners and remove any DOM nodes the feature created outside of `mount` (tag those with
  `data-feature="<id>"` so the loader's cleanup pass can catch anything a feature's own teardown
  misses).

`features/index.json` is the registry: a flat JSON array of feature folder names. The runtime
loader (`js/feature-loader.js`) reads it, fetches each folder's manifest, and can `activateFeature`
/ `deactivateFeature` any of them without a page reload. All 20 shipped features toggle live; none
require a reload, though the manifest/manager UI support a `requiresReload` escape hatch for a
future feature that genuinely needs one.

### Authoring a new feature

1. Create `features/my-feature/` with a `manifest.json`, plus whichever of `style.css`,
   `fragment.html`, `script.js` you need (js is mandatory).
2. In `script.js`, export `activate({ mount, featureId })` and `deactivate({ mount, featureId })`.
   Keep them symmetric: whatever `activate` adds to the page (beyond `mount`, which the loader
   cleans up automatically), `deactivate` must remove.
3. Add `"my-feature"` to the array in `features/index.json`.
4. Reload the storefront or manager UI — your feature now shows up in the Enhancement Manager and
   can be toggled like any other.

## The 20 enhancements

| Feature | Category | Description |
|---|---|---|
| Seasonal Banner | visual | Rotating seasonal promo banner (Summer Safari, Winter Lights) across the top of the storefront. |
| Animal Spotlight | visual | "Animal of the Day" spotlight card featuring a zoo resident, rotating every few seconds. |
| Confetti Checkout | visual | Confetti burst animation on the checkout confirmation screen. |
| Dark Mode | utility/visual | Adds a dark/light theme toggle to the header. |
| Paw Cursor Trail | visual | Decorative paw-print trail that follows the mouse cursor. |
| Product Badges | visual | "Popular" / "Best Value" / "Members' Pick" ribbon badges on product cards. |
| Membership Glow | visual | Highlights the recommended membership tier with a glowing border and ribbon. |
| Weather Widget | visual | Fun mocked "zoo weather" badge encouraging visits on nice days. |
| Event Countdown | behavioral | Live countdown timer to the next feeding time / special event. |
| Cart Reminder Toast | behavioral | Gentle toast reminder if items sit in the cart without checking out. |
| Membership Upsell Modal | behavioral | Modal suggesting a membership upgrade when a ticket-only cart is detected. |
| Urgency Stock Indicator | behavioral | "Only a few left today" urgency messaging on limited passes. |
| Recently Viewed | behavioral | Tracks and displays recently viewed products in a strip. |
| Exit Intent Offer | behavioral | Detects exit intent and offers a one-time discount nudge. |
| Live Visitor Counter | behavioral | Simulated "N people are looking at this" counter on product cards. |
| Loyalty Points Estimate | behavioral | Shows estimated loyalty points earned at checkout. |
| Accessibility Contrast | utility | High-contrast accessibility mode toggle. |
| Font Size Adjuster | utility | Floating control to increase/decrease site font size. |
| Product Info Tooltips | utility | Info icons on product cards with detailed inclusion tooltips. |
| Printable Receipt | utility | Adds a "print/download receipt" button to the checkout confirmation. |

(Each row's exact wording also lives in that feature's `manifest.json` `description` field — this
table mirrors it for convenience.)

## Feature Manager UI

`features-manager.html` (linked from the storefront header as "Enhancement Manager") lists every
feature discovered via `features/index.json`, shows its current on/off state, and gives you a
toggle switch per feature. Toggling calls straight into the loader's `activateFeature`/
`deactivateFeature`, so the effect is visible immediately — switch to the shop tab (or just
navigate back) and the change is already live. Enabled/disabled state is persisted to
`localStorage` (`critter-cove-enabled-features` key) so it survives reloads. "Enable All" /
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
features/index.json        registry of feature folder names
features/<feature-id>/     one folder per enhancement (manifest + assets)
openspec/                  OpenSpec proposal/specs/design/tasks for this project
```

## OpenSpec

The product/PLU model, cart, features plugin system, and manager UI were specced before
implementation — see `openspec/changes/critter-cove-shop/` for the proposal, design doc, per-
capability specs, and task breakdown.
