## 1. Product catalog & cart

- [ ] 1.1 Create `data/products.json` with 3-5 products (mix of tickets + memberships), each with `id`, `plu`, `name`, `description`, `price`, `category`, `image`.
- [ ] 1.2 Build storefront markup/styles (`index.html`, `css/storefront.css`) rendering the catalog as styled cards.
- [ ] 1.3 Implement cart state module (`js/cart.js`): add/remove/qty-change, subtotal/total calc, localStorage persistence.
- [ ] 1.4 Implement cart UI (drawer or panel) wired to cart module, with a mocked checkout flow (order summary + confirmation, cart clears after).

## 2. Features plugin system

- [ ] 2.1 Define feature manifest schema (`manifest.json`: id, name, description, enabledByDefault, files, requiresReload).
- [ ] 2.2 Build `features/index.json` registry listing feature folder names.
- [ ] 2.3 Build runtime loader (`js/feature-loader.js`) with `activate`/`deactivate` contract: injects `<style>`, HTML fragment (in an id-tagged container), and runs feature JS; removes all of it on deactivate.
- [ ] 2.4 Wire loader into both `index.html` and `features-manager.html` to apply persisted enabled-features on load.

## 3. Twenty feature modules

- [ ] 3.1 `seasonal-banner` — rotating seasonal promo banner (Summer Safari / Winter Lights) across the storefront header.
- [ ] 3.2 `animal-spotlight` — "Animal of the Day" spotlight card featuring a zoo resident.
- [ ] 3.3 `confetti-checkout` — confetti burst animation on the checkout confirmation screen.
- [ ] 3.4 `dark-mode` — dark/light theme toggle in the header.
- [ ] 3.5 `paw-cursor-trail` — decorative paw-print trail that follows the mouse cursor.
- [ ] 3.6 `product-badges` — "New" / "Best Value" / "Popular" ribbon badges on product cards.
- [ ] 3.7 `membership-glow` — glowing highlight + ribbon on the recommended membership tier.
- [ ] 3.8 `weather-widget` — mocked "zoo weather" badge encouraging visits on nice days.
- [ ] 3.9 `event-countdown` — countdown timer to the next feeding time / special event.
- [ ] 3.10 `cart-reminder-toast` — toast reminder if items sit in the cart unpurchased.
- [ ] 3.11 `membership-upsell-modal` — modal suggesting a membership upgrade for ticket-only carts.
- [ ] 3.12 `urgency-stock-indicator` — "only a few left today" urgency messaging on limited passes.
- [ ] 3.13 `recently-viewed` — strip tracking and displaying recently viewed products.
- [ ] 3.14 `exit-intent-offer` — exit-intent detection with a one-time discount nudge.
- [ ] 3.15 `live-visitor-counter` — simulated "N people are looking at this" counter on product cards.
- [ ] 3.16 `loyalty-points-estimate` — estimated loyalty points earned, shown at checkout.
- [ ] 3.17 `accessibility-contrast` — high-contrast accessibility mode toggle.
- [ ] 3.18 `font-size-adjuster` — floating control to increase/decrease site font size.
- [ ] 3.19 `product-info-tooltips` — info icons on product cards with detailed inclusion tooltips.
- [ ] 3.20 `printable-receipt` — "print/download receipt" button on the checkout confirmation.

## 4. Feature manager UI

- [ ] 4.1 Build `features-manager.html` listing every registered feature (name, description, current state).
- [ ] 4.2 Wire per-feature toggle controls to the loader's activate/deactivate + persist state to localStorage.
- [ ] 4.3 Add a link from the storefront header to the manager UI and back.

## 5. Docs & review artifacts

- [ ] 5.1 Write README: run instructions (exact static-server command used), products/PLU model, features module format + authoring guide, manager UI usage, list of all 20 enhancements.
- [ ] 5.2 Add `.review-screenshots/` to `.gitignore`.
- [ ] 5.3 Serve the site locally and capture screenshots (storefront, cart with items, manager UI with enhancements toggled) into `.review-screenshots/`.
