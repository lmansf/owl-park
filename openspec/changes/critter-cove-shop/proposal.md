## Why

Owl Park needs a demo e-commerce storefront for selling park tickets and memberships that also
serves as a design-review sandbox: the whole point is to let a reviewer plug and unplug small
visual/behavioral enhancement modules at runtime (no build step, no reload where avoidable) and see
how each one changes the storefront. No such demo exists yet in this repo.

## What Changes

- Add a static (vanilla HTML/CSS/JS, no build step) storefront with a product catalog of tickets and
  memberships.
- Introduce a "PLU" field on each product: a short, retail-style lookup code stored separately from
  the product's internal id, trivially reassignable without touching layout/logic.
- Add a shopping cart (add/remove/change qty, running subtotal/total, localStorage persistence) with
  a mocked checkout flow (order summary + confirmation, no real payment backend).
- Add a `features/` plugin system: self-contained enhancement modules (HTML/CSS/JS + manifest per
  folder) that a runtime loader can inject into and cleanly remove from the live page.
- Implement 20 concrete feature modules spanning visual, behavioral, and utility/accessibility
  enhancements relevant to a park ticket/membership storefront.
- Add a feature manager UI page that lists all discovered `features/` modules, shows enabled/disabled
  state, and lets a reviewer toggle each one live; toggle state persists across reloads.

## Capabilities

### New Capabilities
- `product-catalog`: Product/PLU data model for tickets and memberships, and the storefront listing UI.
- `shopping-cart`: Add/remove/quantity cart state, persistence, subtotal/total calculation, and mocked checkout/confirmation.
- `features-plugin-system`: The `features/` module format (manifest + asset files) and the runtime loader/unloader contract.
- `feature-manager-ui`: The UI surface for discovering, toggling, and persisting feature enablement.

### Modified Capabilities
(none — this is a net-new project)

## Impact

- New static site under repo root: `index.html`, `css/`, `js/`, `data/products.json`, `features/`,
  `features-manager.html`, `README.md`.
- No backend, no build tooling, no new external dependencies (payment, auth, etc.).
- Screenshots for design review captured to a git-ignored `.review-screenshots/` folder.
