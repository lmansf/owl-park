## Why

Owl Park ships 35 enhancement modules, but the revenue surface is lopsided. Urgency and scarcity are
covered six ways over (`flash-sale-timer`, `urgency-stock-indicator`, `exit-intent-offer`,
`event-countdown`, `live-visitor-counter`, `seasonal-banner`). The levers that actually move money at
a zoo — cross-sell, add-ons, donations, gifting, and arithmetic-driven membership conversion — are
missing entirely.

The five modules in this change are deliberately the _honest_ kind: every number a shopper sees (a
saving, a break-even count, a donation amount, a demand level) is computed live from
`data/products.json` and the cart, so re-pricing a product can never make the copy lie. No new
urgency theatre.

## What Changes

- Add five self-contained `features/<id>.html` modules following the existing single-file plugin
  contract (manifest + scoped `<style>` + markup + plain `<script>` IIFE, no imports, no build step):
  - `smart-cart-savings` — membership break-even and better-value ticket swaps, computed live.
  - `conservation-roundup` — optional, never pre-selected donation attach in the cart.
  - `visit-addons` — one-tap attach rail for Parking, Fast-Track, Keeper Experience, Souvenir Cup.
  - `gift-mode` — gift memberships with recipient/message/delivery date and a printable certificate.
  - `offpeak-date-nudge` — visit-date picker with deterministic mocked per-date demand and a real
    off-peak discount.
- Extend the cart line model (`js/cart.js` + `js/main.js` rendering) so a line can carry optional
  per-line **metadata** (gift details, visit date) and be a **non-catalog line** (a donation) with its
  own name and price — without breaking the existing `addItem`/`removeItem`/`setQty`/`clear`/
  `onChange` contract or the stored `{ id, qty }` shape of existing carts.
- Add an external-mutation bridge (`owl-park-cart-changed` window event) so features — which cannot
  `import` `js/cart.js` — can write the cart in `localStorage` and have the storefront re-render.
- Add four **add-on products** to `data/products.json` under a new `addon` category, and make the
  storefront catalog show only categories that have a filter tab, so add-ons stay out of the
  Tickets/Memberships tabs and are reachable only through the `visit-addons` rail.
- Add `capacity` (`{ adults, kids }`) to each ticket/membership product so swap and break-even
  coverage math is data-driven rather than hardcoded.
- Update `README.md` (enhancement table, cart line model, catalog category rules).

## Capabilities

### New Capabilities

- `revenue-enhancement-modules`: the five concrete revenue modules — their behavior, their honesty
  requirements (never overstate a saving, never pre-select a donation, never dress mocked demand as
  live data), and their mobile-first constraints.

### Modified Capabilities

- `cart-line-model`: cart lines gain an optional unique `key`, an optional `meta` namespace map, and
  an optional `custom` self-describing payload (name/price for non-catalog lines, or a price override
  for a discounted catalog line). Catalog gains an `addon` category that is not shown in the
  storefront tabs, and per-product `capacity`.

## Non-goals

- No payment backend. Checkout stays mocked; features hook the existing mocked flow.
- No changes to `membership-upsell-modal` (the generic upsell it supersedes), `css/storefront.css`,
  `css/manager.css`, or any of the other modules another workstream is editing.
- Demand data for `offpeak-date-nudge` stays mocked (deterministic, and labelled as mock in the UI
  and in the code). No real capacity service.

## Impact

- New files: `features/{smart-cart-savings,conservation-roundup,visit-addons,gift-mode,offpeak-date-nudge}.html`.
- Modified files: `js/cart.js`, `js/main.js`, `data/products.json`, `features/index.json`, `README.md`,
  `CLAUDE.md`/`AGENTS.md` (cart-model note).
- No new dependencies, no build step, no loader or manager changes.
