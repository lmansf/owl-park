## Context

The existing 20 features establish clear patterns for the single-file contract: row-decorator
features that re-apply via a `MutationObserver` on `#catalog-grid` (`product-badges`,
`urgency-stock-indicator`), header-button toggles (`dark-mode`, `font-size-adjuster`), checkout-modal
hooks keyed off `#checkout-modal`'s `class` mutations (`confetti-checkout`, `printable-receipt`), and
cart-polling features that read `localStorage.getItem("owl-park-cart")` directly since features can't
import `js/cart.js` (`cart-reminder-toast`, `recently-viewed`). This batch of 15 reuses those same
four shapes plus a few new ones (audio synthesis, generated-file download, clipboard copy) but stays
within the same constraints.

## Goals / Non-Goals

**Goals:**

- Ship 15 new modules that are genuinely distinct from each other and from the existing 20 (no
  reskins of an existing feature's behavior).
- Every module is symmetric (`deactivate()` undoes exactly what `activate()` created) and leaves
  zero DOM/style residue after disable, matching the existing verification bar.
- Reuse existing theme CSS custom properties (`--cove-teal`, `--cove-teal-dark`, `--cove-sand`,
  `--cove-ink`, `--cove-orange`, `--cove-green`, `--cove-border`) so new features look native to the
  storefront rather than bolted on.

**Non-Goals:**

- No changes to `js/feature-loader.js`, `js/main.js`, or `features-manager.html` — the existing
  loader/manager contract already supports everything these 15 modules need.
- No real backend integration (promo codes, calendar files, clipboard shares, "orders" are all
  mocked/local, consistent with the storefront's fully-mocked checkout).
- No audio *files* — an ambient-sound feature must synthesize tones with the Web Audio API rather
  than ship/reference a separate asset file, since a feature is exactly one `.html` file.

## Decisions

- **Row-decorator features use the established `MutationObserver` + idempotency-check pattern.**
  `wishlist-favorites` and `discount-badge-strikethrough` both decorate `.product-row` elements, so
  both follow the exact `applyToRows()` / observe `#catalog-grid` / guard-by-tagged-child shape
  already used by `product-badges` and `urgency-stock-indicator`, rather than inventing a new
  re-render strategy.
- **Checkout-modal features observe `#checkout-modal`'s `class` attribute**, the same hook
  `confetti-checkout` and `printable-receipt` use, instead of patching `js/main.js`'s checkout
  handler (which features cannot do — they only ever run after the page's own scripts, and can't
  import or monkey-patch `js/main.js` cleanly without risking double-handling clicks).
- **`ambient-park-sounds` uses the Web Audio API (oscillators/gain nodes) to synthesize a short
  looping ambience** instead of an `<audio>` tag pointed at a media file, because the single-file
  constraint rules out shipping a separate audio asset.
- **`add-to-calendar-button` generates an `.ics` file client-side via a `Blob` + object URL**,
  downloaded through a synthetic anchor click, requiring no server and no new dependency.
- **`order-history-log` and `wishlist-favorites` persist to `localStorage`** (new, feature-owned
  keys, e.g. `owl-park-order-history`, `owl-park-wishlist`) rather than `sessionStorage`, since both
  are meant to survive across page reloads (unlike `recently-viewed`, which is intentionally
  session-scoped).
- **`keyboard-shortcuts-helper` binds shortcuts on `document` with a `keydown` listener removed in
  `deactivate()`**, following the same addEventListener/removeEventListener symmetry as
  `recently-viewed`'s capturing `mouseenter` listener.

## Risks / Trade-offs

- [Two or more new features attach listeners to the same host elements (e.g. both a checkout-modal
  observer and existing `confetti-checkout`/`printable-receipt` observers)] → Each observer is scoped
  to its own callback and only reads (never mutates) shared state before making its own additions
  under its own `data-owlpark-feature` tag, so multiple independent observers on `#checkout-modal`
  coexist safely, same as the existing two already do today.
- [`ambient-park-sounds` autoplay may be blocked by browser autoplay policies until a user gesture]
  → Ship it as an explicit toggle button (user click *is* the gesture that starts the
  `AudioContext`), never auto-playing on `activate()`.
- [`keyboard-shortcuts-helper`'s shortcuts could collide with browser/OS shortcuts or interfere while
  a user is typing] → Only bind single-letter shortcuts, and ignore keydown events whose target is an
  `input`/`textarea` or has `isContentEditable`.

## Migration Plan

Purely additive: new files plus new `features/index.json` entries and a README table update. No
existing feature, loader code, or data file changes. Rollback is deleting the 15 new `features/*.html`
files and reverting the two edited files.

## Open Questions

None — scope, contract, and verification bar all match the existing 20 features precedent.
