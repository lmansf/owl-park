## 1. Cart + catalog model

- [x] 1.1 `data/products.json`: add `capacity: { adults, kids }` to the 3 tickets and 2 memberships.
- [x] 1.2 `data/products.json`: add 4 `addon` products (Parking, Fast-Track Entry, Behind-the-Scenes
      Keeper Experience, Souvenir Owl Cup) with their own PLUs.
- [x] 1.3 `js/products.js`: add `resolveLine(line, products)` — the single place a line's
      name/price/emoji/plu/unit is decided (catalog product, overridden by `line.custom`).
- [x] 1.4 `js/cart.js`: optional `key`/`meta`/`custom` on lines; `addItem(id, options)` creates a keyed
      line when options are given and merges as before when they are not; `removeItem`/`setQty` match on
      line key (which equals the product id for plain lines); add `setLineMeta`; listen for the
      `owl-park-cart-changed` window event and re-notify. Existing contract unchanged.
- [x] 1.5 `js/main.js`: render cart lines and the checkout summary through `resolveLine`; use the line
      key in the drawer's data attributes; render `meta.*.note` captions with `textContent`; hide the
      quantity stepper on `custom.fixed` lines; show only categories that have a filter tab in the
      catalog.

## 2. The five modules

- [x] 2.1 `features/smart-cart-savings.html` (behavioral) — membership break-even + quantity-break swap
      in the cart drawer; fires only when the arithmetic favours the shopper.
- [x] 2.2 `features/conservation-roundup.html` (behavioral) — round-up + adopt-an-owl tiers; opt-in
      only; adds a non-catalog donation line.
- [x] 2.3 `features/visit-addons.html` (behavioral) — one-tap add-on rail in the cart drawer, shown only
      when a ticket is in the cart.
- [x] 2.4 `features/gift-mode.html` (behavioral) — gift panel on membership rows; per-line gift metadata;
      printable certificate on the mocked checkout confirmation.
- [x] 2.5 `features/offpeak-date-nudge.html` (behavioral) — date rail on ticket rows; deterministic
      mocked demand; real off-peak discount carried on the line price.
- [x] 2.6 Register all five in `features/index.json`.

## 3. Docs

- [x] 3.1 `README.md`: enhancement table (40 features), the extended cart line model + the
      `owl-park-cart-changed` bridge, the `addon` category / tab-derived catalog visibility, `capacity`.
- [x] 3.2 `CLAUDE.md`/`AGENTS.md`: cart-model + cart-mutation-from-a-feature note.

## 4. Verification

- [x] 4.1 Enable-all / disable-all DOM residue audit (zero `[data-owlpark-feature]` and stray `<style>`
      after disable; `window.__owlParkFeatures` registration count after enable-all).
- [x] 4.2 Drive each of the five end to end in Chrome: add to cart, see the offer, take it, confirm the
      total changes by exactly the amount promised, check out.
- [x] 4.3 Re-check every flow at a 375x667 iPhone viewport: no horizontal page scroll, 44pt targets,
      rails scroll inside their own container.
- [x] 4.4 Confirm CI's structural checks pass (JSON validity, `node --check` on each feature script,
      index.json consistency, HTTP smoke test).
