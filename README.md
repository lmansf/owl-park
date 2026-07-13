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
- `category` — `"ticket"`, `"membership"`, or `"addon"`. The storefront renders **only the categories
  that have a filter tab** (`renderCatalog()` derives that list from the `.tab-btn[data-filter]`
  elements). `addon` has no tab, so add-ons never appear in the catalog: they are attached from the
  cart by the `visit-addons` feature, and are ordinary catalog lines once they're in it. Give a future
  category a tab in `index.html` and it becomes storefront-visible with no JS change.
- `capacity` — `{ adults, kids }` on tickets and memberships: how many people the product admits.
  This is what lets `smart-cart-savings` compute coverage and membership break-even from catalog data
  instead of hardcoding party sizes.
- Display fields: `name`, `tagline`, `description`, `price`, `unit`, `emoji`, `accent` (a hex color
  used as the card's accent), and an optional `featured` flag.

The catalog ships with 5 sellable products — General Admission, Family Day Pass, and Twilight
Explorer tickets, plus Individual and Family & Household memberships — and 4 add-ons (Parking,
Fast-Track Entry, Behind-the-Scenes Keeper Experience, Souvenir Owl Cup).

## Shopping cart

`js/cart.js` is a small state module backed by `localStorage` (`owl-park-cart` key). It
exposes add/remove/set-quantity/clear plus a subscribe hook (`Cart.onChange`) that the storefront
UI (`js/main.js`) uses to re-render the cart drawer any time it changes. The cart persists across
reloads, and totals are always recomputed from current cart lines rather than cached.

### The cart line model

A line is `{ id, qty }` — plus three optional fields that let a line carry more than a product id:

- `key` — a unique line key. Absent means the line is _plain_ and its key **is** its product id, so a
  cart stored before these fields existed keeps working. `removeItem`/`setQty` address a line by its
  key, which for a plain line is the product id, so every existing call site is unaffected. Two lines
  of the same product with different metadata (two gift memberships, one ticket on two dates) get
  distinct keys and never merge.
- `meta` — a namespaced map, one entry per feature (`{ gift: {...}, visit: {...} }`). An entry may
  carry a `note` string, which `js/main.js` renders as a caption on the cart line and in the checkout
  summary (as text, never markup). Core never learns what a "gift" is.
- `custom` — self-describing overrides: `price` (a discounted catalog line, e.g. an off-peak ticket —
  or the whole price of a line with no catalog product at all, e.g. a donation), plus
  `name`/`emoji`/`unit`/`plu`/`kind`/`fixed` (`fixed` hides the quantity stepper).

`resolveLine(line, products)` in `js/products.js` is the **single** place a line's price and display
fields are decided (`custom` wins over the catalog product). The drawer subtotals, the cart total and
the checkout summary all go through it, so no total can disagree with any line.

Features can't `import` `js/cart.js`, so a feature that _mutates_ the cart writes
`localStorage["owl-park-cart"]` directly and then dispatches `owl-park-cart-changed` on `window`;
`js/cart.js` listens for that event and re-runs its `onChange` notification, so the page re-renders.

Checkout is fully mocked: clicking **Checkout** renders an order summary and a confirmation with a
generated order id, then clears the cart. There's no real payment backend — this is a demo.

## Mobile & touch

The storefront is built to be usable one-handed on a phone: the whole shopper path (browsing,
cart drawer, checkout) fits an iPhone-sized screen with no pinch-zoom and no sideways scrolling.
Both pages set `viewport-fit=cover` so the page can paint under the notch, which means the layout
is responsible for keeping content out from under it. Four rules hold that together, and any new
markup — site or feature — is expected to follow them:

- **Safe areas.** `css/storefront.css` exposes the iOS insets as `--safe-top` / `--safe-right` /
  `--safe-bottom` / `--safe-left` (each an `env(safe-area-inset-*, 0px)`, so they collapse to `0px`
  on hardware without a notch). Anything edge-anchored — the sticky header, the cart drawer and its
  footer, modal overlays, the footer, floating feature widgets — adds the relevant inset to its own
  padding or offset rather than sitting flush against the edge.
- **44px tap targets.** `--tap` is the iOS HIG's 44pt minimum. Every tappable control holds it as a
  floor. Where the artwork must stay small (the manager's toggle switch, the tooltip info dot, the
  wishlist heart), the _hit area_ is grown to 44px around the visible mark instead of the mark being
  enlarged.
- **Dynamic viewport units.** `100%`/`100vh` on a fixed element resolves against iOS Safari's
  _large_ viewport, which is taller than what's actually visible — the bottom of the element ends up
  behind the browser chrome. Full-height layers (the cart drawer, every modal overlay) use `100dvh`,
  and overlong cards cap to `max-height: 100%` and scroll internally so their buttons stay reachable.
- **16px form fields.** iOS Safari zooms the page in on focus for any input with a smaller
  `font-size`. The site's one text input (`promo-code-field`) stays at exactly `16px`.

Two layout behaviors are worth knowing about because they're easy to mistake for bugs:

- `.header-actions` is the header's extension point — features `prepend()` their buttons into it, so
  `css/storefront.css` sizes `.header-actions > button, > a` centrally rather than each feature file
  doing it. Below 560px (and on a short landscape phone) the strip becomes one horizontally
  scrollable row with the cart button pinned to the right edge; otherwise the *sticky* header grows a
  new 44px row per enabled feature and eats the screen.
- Hover-only affordances get a touch path. On a phone, `product-info-tooltips` opens as an in-flow
  panel under the product title — it pushes the row down instead of floating over the content below
  it — while desktop keeps the familiar floating panel anchored at the icon. Rows also drop their
  hover-lift under `@media (hover: none)`, where iOS would otherwise leave a tapped row stuck in the
  hovered state.

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
execute it. All 40 shipped features toggle live with zero page reloads; the manifest/manager UI
still support a `requiresReload` escape hatch for a future feature that genuinely needs one.

Because features can't `import` anything (including each other, or `js/cart.js`), any feature that
needs cart contents reads `localStorage.getItem("owl-park-cart")` directly (a JSON array of lines —
see [the cart line model](#the-cart-line-model)) and polls on an interval to react to changes, rather
than subscribing to a callback. A feature that _writes_ the cart writes that same key and then
dispatches `owl-park-cart-changed` on `window` so the storefront re-renders.
`fetch("data/products.json")` remains fine to call from a feature — that's a data fetch, not a code
import.

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
`product-badges`, `product-info-tooltips`, `urgency-stock-indicator`, `live-visitor-counter`,
`membership-glow`, `wishlist-favorites`, and `discount-badge-strikethrough`) work around this with
a `MutationObserver` on `#catalog-grid` that re-applies the injection after each re-render, guarded
by an idempotency check (skip a row that already has the feature's tagged node) so it doesn't
double-inject.

**Gotcha for checkout-confirmation features:** similarly, `js/main.js` overwrites `#order-id`'s
`textContent` wholesale on every checkout, wiping any node a feature appended inside it. Features
that decorate the confirmation (see `copy-order-id-button` and `order-history-log`) use a
`MutationObserver` on the checkout modal / order-id element to re-apply (or react) after each
checkout, with the same idempotency guard.

**Gotcha for cart-drawer features:** `renderCart()` replaces `#cart-items`' `innerHTML` on every cart
change, so a panel mounted there needs the same `MutationObserver` + idempotency re-mount (see
`smart-cart-savings`, `conservation-roundup`, `visit-addons`). Mount panels there rather than in
`.cart-footer`: the footer doesn't scroll, so anything tall enough pushes the total and the Checkout
button off the bottom of a phone screen, while `#cart-items` scrolls and keeps them pinned.

**Gotcha for rendering dynamic strings:** build any DOM whose text comes from `localStorage` (or
any other value your file doesn't hardcode) with `createElement` + `textContent`, never by
concatenating the value into an `innerHTML` string — a corrupted or hand-edited stored value must
render as literal text, not as markup (see `order-history-log` and `ticket-comparison-table`).
Purely static shells (headings, close buttons) can keep using `innerHTML`.

**Gotcha for features that fetch `data/products.json`:** cart lines in `localStorage` carry only
`{ id, qty }`, so any price or total is derived from a product list your feature fetched itself.
Don't render that derived value until the fetch resolves — show nothing rather than a wrong number
(see `sticky-mini-cart-bar`, which stays hidden, and logs to the console, if its fetch fails).

**Gotcha for mobile ergonomics in a feature file:** a feature must keep working when pasted
standalone into a page that has none of the storefront's CSS, so it can't lean on the `--safe-*` and
`--tap` tokens from the [Mobile & touch](#mobile--touch) section — feature files spell the same rules
out literally, writing `env(safe-area-inset-*, 0px)` and `44px` inline (see `promo-code-field`,
`font-size-adjuster`, `sticky-mini-cart-bar`). The one thing a feature does _not_ have to do itself
is size a button it prepends into `.header-actions`; the header sizes its own children.

**Gotcha for bottom-anchored feature widgets:** three modules pin controls into the same bottom band
at the same `1.2rem` offset — `keyboard-shortcuts-helper` (bottom-left), `font-size-adjuster`
(bottom-right), and the centred `sticky-mini-cart-bar`. On a phone the mini-cart bar would otherwise
run underneath the corner widgets, which sit above it and silently absorb taps meant for its "View
Cart" button. It resolves this below 560px by ending short of whichever widget is present, using
`body:has(.owlpark-feat-keyboard-shortcuts-helper-btn)` / `body:has(.owlpark-feat-font-size-adjuster)`
selectors — so renaming either of those elements silently reintroduces the dead zone. A new
bottom-anchored widget has to be fitted into this shared band deliberately.

## The 40 enhancements

| Feature                 | Category   | Description                                                                                    |
| ----------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| Seasonal Banner         | visual     | Rotating seasonal promo banner (Summer Nights, Winter Roost) across the top of the storefront. |
| Owl Spotlight           | visual     | "Owl of the Day" spotlight card featuring an Owl Park resident, rotating every few seconds.    |
| Confetti Checkout       | visual     | Confetti burst animation on the checkout confirmation screen.                                  |
| Dark Mode               | visual     | Dark/light theme toggle in the header.                                                         |
| Feather Cursor Trail    | visual     | Decorative feather trail that follows the mouse cursor.                                        |
| Product Badges          | visual     | "Popular" / "Best Value" / "Members' Pick" ribbon badges on product rows.                      |
| Membership Glow         | visual     | Glowing highlight and ribbon on the recommended membership tier.                               |
| Park Weather Widget     | visual     | Fun mocked "park weather" badge encouraging visits on nice days.                               |
| Feeding Time Countdown  | behavioral | Live countdown timer to the next keeper feeding or special event.                              |
| Cart Reminder Toast     | behavioral | Gentle toast reminder if items sit in the cart without checking out.                           |
| Membership Upsell Modal | behavioral | Suggests a membership upgrade when a ticket-only cart builds up.                               |
| Urgency Stock Indicator | behavioral | "Only a few left today" urgency messaging on limited passes.                                   |
| Recently Viewed         | behavioral | Strip tracking and displaying recently viewed products.                                        |
| Exit Intent Offer       | behavioral | Exit-intent detection with a one-time discount nudge.                                          |
| Live Visitor Counter    | behavioral | Simulated "N people are looking at this" counter on product cards.                             |
| Loyalty Points Estimate | behavioral | Estimated loyalty points earned, shown at checkout.                                            |
| High-Contrast Mode      | utility    | High-contrast accessibility mode toggle for improved readability.                              |
| Font Size Adjuster      | utility    | Floating control to increase or decrease site-wide font size.                                  |
| Product Info Tooltips   | utility    | Info icons on product rows with inclusion fine print — hover on desktop, tap on touch.         |
| Printable Receipt       | utility    | Adds a print/download receipt button to the checkout confirmation.                             |
| Wishlist Favorites      | behavioral | Heart icon on product rows to save favorites, persisted across visits.                         |
| Promo Code Field        | behavioral | Promo code field in the cart that applies a mock percentage discount.                          |
| Flash Sale Timer        | behavioral | Limited-time flash-sale countdown banner with an expiring mock discount.                        |
| Park Guide Tour         | behavioral | Guided walkthrough tooltip tour of the storefront's key sections.                               |
| Share Your Visit        | behavioral | Copies a shareable blurb about your order to the clipboard at checkout.                         |
| Ticket Comparison Table | utility    | Side-by-side comparison table of every ticket and membership.                                  |
| Add to Calendar Button  | utility    | Downloads an .ics calendar file for your visit from the checkout confirmation.                 |
| Copy Order ID Button    | utility    | One-click copy button for the order id on the checkout confirmation.                            |
| Ambient Park Sounds     | utility    | Toggle a synthesized looping ambient park soundscape.                                          |
| Order History Log       | utility    | Keeps a running local log of past mock orders, viewable anytime.                                |
| Keyboard Shortcuts Helper | utility  | Floating shortcuts cheat-sheet plus working keyboard shortcuts.                                 |
| Sticky Mini Cart Bar    | visual     | Persistent floating mini-cart bar showing live item count and total.                            |
| Species Fact Ticker     | visual     | Scrolling marquee ticker of rotating owl facts below the hero.                                  |
| Discount Badge Strikethrough | visual | "Was $X" strikethrough pricing with a sale-percent badge on select rows.                    |
| Park Map Modal          | visual     | Opens a simple illustrated park map in a modal.                                                |
| Smart Cart Savings      | behavioral | Membership break-even and better-value ticket swaps, computed live from the cart and catalog.  |
| Conservation Round-Up   | behavioral | Opt-in round-up donation and adopt-an-owl tiers for the Owl Rehabilitation Fund.               |
| Visit Add-Ons           | behavioral | One-tap rail of visit add-ons in the cart once a ticket is in it.                              |
| Gift Mode               | behavioral | Gift memberships: recipient, message and delivery date, with a printable certificate.          |
| Off-Peak Date Nudge     | behavioral | Visit-date picker with per-date demand and a real off-peak discount on quiet days.             |

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

The manager reflows at phone width: the toolbar wraps, and each feature row drops its status word
onto its own line so the name and the toggle aren't fighting for the same 343px. `css/manager.css`
reads the `--safe-*` and `--tap` tokens from `css/storefront.css`, which the manager page loads
first — the toggle switch keeps its 44x24 track but takes a full 44x44 hit area.

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
openspec/                  OpenSpec proposals/specs/designs/tasks for the specced changes
```

## OpenSpec

Some of the work here was specced before implementation, and those specs live under
`openspec/changes/`: the product/PLU model, cart, features plugin system, and manager UI in
`openspec/changes/critter-cove-shop/` (proposal, design doc, per-capability specs, task
breakdown), the 15 round-2 enhancement modules in `openspec/changes/owlpark-feat15-round2/`, and
the 5 revenue modules plus the cart line model they needed in
`openspec/changes/owlpark-revenue-features/`.

Not every change goes through OpenSpec. The mobile/touch responsiveness pass, for example, shipped
without one — its durable invariants are recorded in the "Mobile & touch" section above rather
than in a change directory. Don't assume an `openspec/changes/` entry exists for a given behavior;
the code and this README are the source of truth for anything not listed above.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request. Since there's no build step and no
test suite, the checks are static/structural: JSON validity for every `.json` file, `node --check`
syntax validation for every file under `js/` plus every feature's embedded behavior script, a
consistency check that every `features/*.html` file is registered in `features/index.json` (and
vice versa) with a valid manifest whose `id` matches its filename and no `import`/`export`/
`type="module"` anywhere, and an HTTP smoke test that serves the site with `python3 -m http.server`
and fetches the key pages and assets.
