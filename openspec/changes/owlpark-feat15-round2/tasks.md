## 1. Fifteen new feature modules

- [ ] 1.1 `wishlist-favorites` (behavioral) — heart/favorite toggle on product rows; favorited
      product ids persist in `localStorage` across reloads.
- [ ] 1.2 `promo-code-field` (behavioral) — a promo code input in the cart drawer that applies a
      mock percentage discount (e.g. `OWL10`) to the displayed cart total.
- [ ] 1.3 `flash-sale-timer` (behavioral) — a limited-time flash-sale countdown banner across the
      storefront advertising a mock discount that expires on its own countdown.
- [ ] 1.4 `park-guide-tour` (behavioral) — a "Take a tour" button that walks a visitor through the
      catalog, cart button, and Enhancement Manager link with sequential highlighted tooltips.
- [ ] 1.5 `share-your-visit` (behavioral) — a "Share your visit" button on the checkout confirmation
      that copies a shareable text blurb about the purchase to the clipboard.
- [ ] 1.6 `ticket-comparison-table` (utility) — a "Compare" toggle opening a modal that lists every
      product's key attributes side by side.
- [ ] 1.7 `add-to-calendar-button` (utility) — an "Add to Calendar" button on the checkout
      confirmation that downloads a generated `.ics` file for the visit.
- [ ] 1.8 `copy-order-id-button` (utility) — a copy-to-clipboard icon button next to the order id on
      the checkout confirmation.
- [ ] 1.9 `ambient-park-sounds` (utility) — a header toggle that plays/stops a synthesized looping
      ambient soundscape via the Web Audio API.
- [ ] 1.10 `order-history-log` (utility) — persists a running log of mock completed orders
      (id/date/total) in `localStorage`, viewable via a "My Orders" panel.
- [ ] 1.11 `keyboard-shortcuts-helper` (utility) — a floating "?" button showing a shortcuts
      cheat-sheet, and wires up the shortcuts it documents (open cart, switch tabs, close modals).
- [ ] 1.12 `sticky-mini-cart-bar` (visual) — a persistent floating bar showing live item
      count/total with a "View Cart" button once the cart is non-empty.
- [ ] 1.13 `species-fact-ticker` (visual) — a horizontally scrolling marquee of rotating owl facts
      below the hero.
- [ ] 1.14 `discount-badge-strikethrough` (visual) — a fake "was $X" strikethrough price plus a
      sale-percentage badge on select product rows.
- [ ] 1.15 `park-map-modal` (visual) — a "View Park Map" link opening a modal with a simple SVG
      zoo map.

## 2. Registry & docs

- [ ] 2.1 Add all 15 new filenames to `features/index.json`.
- [ ] 2.2 Update `README.md`'s enhancement table to list all 35 features (20 existing + 15 new).

## 3. Verification

- [ ] 3.1 Headless-Chrome/Puppeteer pass: discover, enable, and disable each of the 15 new features
      individually and via Enable All / Disable All, asserting zero console errors and zero
      `[data-owlpark-feature]`/stray `<style>` DOM residue after disable.
- [ ] 3.2 Confirm each new feature registers into `window.__owlParkFeatures` on activation (not just
      DOM presence), per the sharp-edge note in `AGENTS.md` about the `injectSnippet` HTML-parsing
      gotcha.
- [ ] 3.3 Capture fresh screenshots to `.review-screenshots/` (storefront, and the Enhancement
      Manager UI with a mix of old and new features toggled on) for design review.
