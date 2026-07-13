# Design

## 1. The cart line model extension

Today a cart line is `{ id, qty }` and every price is looked up in `data/products.json` by `id`.
Three of the five features need more than that:

- `gift-mode` needs per-line gift details (recipient, message, delivery date).
- `offpeak-date-nudge` needs a per-line visit date **and** a per-line discount off the catalog price.
- `conservation-roundup` needs a line that is not a catalog product at all.

### The line shape

```jsonc
{
  "id": "prod-ga-ticket",       // catalog id, or a synthetic id for a non-catalog line
  "qty": 1,
  "key": "prod-ga-ticket#v3",   // OPTIONAL. Unique line key. Absent => key === id (a "plain" line)
  "meta": {                      // OPTIONAL. Namespaced, one key per feature.
    "visit": { "date": "2026-07-22", "note": "📅 Visit Wed 22 Jul · quiet day" }
  },
  "custom": {                    // OPTIONAL. Self-describing overrides.
    "discountRate": 0.12,        //   share off the LIVE catalog price (off-peak); never an amount
    "price": 30.0,               //   whole price of a line with NO catalog product (donation)
    "name": "Owl Rehabilitation Fund", // only for non-catalog lines
    "emoji": "🦉",
    "unit": "donation",
    "kind": "donation",          //   marks a line that is not admission (excluded from savings math)
    "fixed": true,               //   render without a quantity stepper
    "source": "roundup"          //   which offer the line came from (a round-up gift vs a tier gift)
  }
}
```

Every field beyond `id`/`qty` is optional, so existing stored carts keep working untouched.

**Why a `key` and not just `id`:** two gift memberships for different recipients, or two GA tickets on
different dates, are different lines that must not merge. `lineKey(line) = line.key || line.id`.
`addItem(id)` still merges into the plain line for that product (unchanged behavior); keyed lines are
produced by the features, which write `localStorage` directly because the plugin contract forbids them
importing `js/cart.js`. `Cart` therefore grows no keyed-line constructor it would have no caller for —
`removeItem`/`setQty` match on `lineKey`, which for a plain line _is_ the product id, so every existing
caller is unaffected.

**Why `custom` carries the pricing basis:** it keeps the price where the total is computed.
`resolveLine()` (in `js/products.js`) returns `{ name, price, emoji, plu, unit, fixed }` for a line,
preferring `line.custom` fields over the catalog product's, so the cart drawer, the cart total, and
the checkout summary all get the right number from one place. A donation line has no catalog product
at all and is resolved entirely from `custom`. There is no code path where a total is computed from
anything but `resolveLine()`.

**Why a discounted line stores a rate, not a price:** a cart persists indefinitely and outlives the
catalog it was priced against, so an absolute off-peak price stored in `localStorage` is a hardcoded
price that keeps charging the old amount after a re-price. An off-peak line therefore carries
`custom.discountRate` and `resolveLine()` re-applies it to today's catalog price on every render.
`discountOf(price, rate)` is the one rounding, shared by the date chip's "save $4" label and the
charged line price, so the advertised saving is always exactly what is charged. `custom.price` stays
absolute for a line with **no** catalog product: a donation is the shopper's chosen amount, not a
product price.

**Why the pricing rules are also on `window.OwlPark`:** feature modules cannot `import`, so before
this they each re-derived `product.price × qty` — which drops non-catalog lines (a donation showed as
$0.00 in the mini cart bar) and ignores off-peak discounts, producing two different totals for one
cart. `js/products.js` publishes `resolveLine`, `cartTotal`, `itemCount`, `isGiftOnly` and
`discountOf` on `window.OwlPark`, and every feature that prices or counts lines goes through them.

**Why a donation is not an item, and an orphaned round-up is dropped:** a charitable gift is given,
not bought, so `itemCount()` (and `Cart.totalItemCount()` through it) skips a `custom.kind ===
"donation"` line, and a cart holding a gift and nothing else — `isGiftOnly()` — badges as 🎁 rather
than claiming "0 items" beside a real total. A round-up gift, though, was an offer to round _one
purchase_ up, so once nothing is left to round there is no order left to carry it:
`withoutOrphanedGifts()` drops a `custom.source === "roundup"` line when no purchased line remains,
and `readCart()` applies that on every read, so a shopper who emptied their cart is never still
charged for it. The rule lives in `js/products.js`, not in `conservation-roundup`, so it holds with
every feature switched off — a feature is not the last line of defence for a charge. A tier gift is a
deliberate standalone donation and is left alone. Dropping is not recomputing: a pinned amount is
still never quietly changed.

**Why `meta` is namespaced with a `note`:** `js/main.js` stays feature-agnostic — it renders
`Object.values(line.meta).map(v => v.note)` as small caption lines under the cart line name (with
`textContent`, never `innerHTML`, per the README's dynamic-string gotcha). Gift mode and off-peak can
therefore both decorate the same line without colliding, and core never learns what a "gift" is.

### The external-mutation bridge

Features cannot `import` `js/cart.js` (the single-file plugin contract forbids imports), so a feature
that mutates the cart writes `localStorage["owl-park-cart"]` directly — as existing features already
do for reads — and then dispatches `new CustomEvent("owl-park-cart-changed")` on `window`.
`js/cart.js` listens for that event and re-runs its `onChange` notification, so `js/main.js`
re-renders. On the manager page (no cart module loaded) the event is simply unobserved — harmless.

The bridge runs both ways: `writeCart()` in `js/cart.js` raises the same event, so a core mutation
(Add to Cart, the drawer's +/-/Remove, `clear`) reaches feature panels at once rather than up to one
700 ms poll later — a panel acting on a cart it has not seen yet acts on the wrong one. The event
dispatches synchronously, so a listener that writes the cart back re-enters `writeCart()` while
earlier listeners have already run against the older lines; that nested write is therefore stored and
**re-announced once the dispatch in flight unwinds**, rather than dropped — otherwise the drawer,
whose listener runs first, would keep rendering lines a later listener had already replaced. Two
listeners writing at each other would recur forever, so the restatements are capped
(`MAX_RESTATEMENTS`, after which the module warns and stops). The cap bounds writes made *through*
this module only: a feature writes the storage key and dispatches the event itself, so it must not
write the cart from its own `owl-park-cart-changed` handler. It is a latency fix, not a guarantee:
a panel whose button mutates the cart still recomputes its offer from a fresh cart read **at click
time** and declines to apply an offer the cart no longer supports.

Rejected alternative: exposing `window.OwlParkCart`. It would only exist on the storefront page, so
features would need the `localStorage` fallback anyway; the event bridge keeps one write path.

## 2. Catalog changes

- **`addon` category.** Parking, Fast-Track Entry, Behind-the-Scenes Keeper Experience and Souvenir
  Owl Cup become real catalog products with their own PLUs (`A2xx`) and `"category": "addon"`.
  `renderCatalog()` now shows only products whose category has a filter tab (`ticket`, `membership`),
  derived from the `.tab-btn[data-filter]` elements rather than hardcoded — so any future category
  without a tab is automatically storefront-invisible. Add-ons reach the cart only through the
  `visit-addons` rail, but they are ordinary catalog lines once there (correct name, PLU, price,
  stepper, totals).
- **`capacity: { adults, kids }`** on tickets and memberships. This is what makes the
  `smart-cart-savings` coverage math honest and data-driven — no "3 tickets" or "family of 5"
  constants in feature code.

## 3. Honesty rules (the point of this change)

- **Never state a saving that isn't arithmetic.** `smart-cart-savings` only renders a swap when
  `candidateCost < currentTicketSubtotal`, and it prints the difference it actually computed.
- **Never overstate coverage.** Coverage is checked per dimension, never as a head count: a candidate
  is offered only when `candidate.capacity.adults >= basket.adults && candidate.capacity.kids >=
  basket.kids`, where the basket's adults and kids are summed from each ticket line's product capacity
  × qty. Summing the two into one scalar would offer a party of three adults a pass that admits two —
  a "saving" that leaves someone at the gate. A swap card names the target's real capacity in the copy
  ("covers 2 adults + up to 3 kids"), and with strict coverage it can honestly say that target admits
  everyone the cart's tickets admit. With the current catalog this means three General Admission
  tickets get no offer at all: nothing in the catalog covers three adults, so there is nothing
  truthful to say.
- **A swap never loses what the shopper entered.** A ticket → ticket swap carries the visit date
  (`meta.visit`) and the off-peak basis (`custom.discountRate`) onto the replacement line, and quotes
  the saving against the discounted price it will actually charge. A swap can only carry one date, so
  tickets on more than one date get no swap offer rather than a swap that quietly drops one. A ticket →
  membership swap does drop the dates — a membership admits any open day — and says so in the copy.
- **Break-even is computed, never written.** `ceil(membershipPrice / ticketSubtotal)` → "pays for
  itself on your Nth visit". If that count exceeds `MAX_PLAUSIBLE_BREAK_EVEN` (4), the feature says
  nothing rather than making a weak claim.
- **The donation is opt-in only, and never edited behind the shopper's back.** Nothing is
  pre-selected, nothing is added to a total until the shopper taps an amount, and a donation already
  in the cart shows an explicit Remove control. The round-up amount is recomputed from the live
  non-donation subtotal each time the offer renders; once added, the gift is **pinned** at the amount
  the shopper actually tapped. Silently re-computing a charitable gift they already consented to is a
  dark pattern, so when a later cart change means the order total is no longer a whole $5, the panel
  says so and offers an explicit re-round the shopper can take or ignore. The round-up gift is tagged
  `custom.source = "roundup"` so the panel can tell it from a tier gift, which promised nothing about
  the total and so is never re-offered. A subtotal that is *already* a whole $5 gets no *opening*
  round-up button at all: "round up to $105 and give $5" on an order of exactly $100 is a flat $5 ask
  wearing rounding clothes. `roundUp()` returns null there, so the opening offer and its click-time
  revalidation both decline it and only the honestly labelled tiers remain. The re-round is a separate
  question and asks it of the **order total**, not the subtotal (`reRound()`): a pinned gift whose
  order total is off a whole $5 is a broken promise even when the subtotal has since landed on one, so
  the notice and the re-round still appear — the gift there is itself the remainder to round away.
- **Mocked demand is labelled as mocked.** `offpeak-date-nudge` derives demand from a documented
  deterministic hash of the ISO date (same date ⇒ same demand, forever) and says "demo demand data" in
  the UI. The off-peak discount it advertises is genuinely applied to the line price, so the total the
  shopper pays matches the saving they were promised.

## 4. Per-feature design

| Feature | Mounts on | Cart interaction |
| --- | --- | --- |
| `smart-cart-savings` | cart drawer, above the total row | reads cart + products; swap rewrites ticket lines |
| `conservation-roundup` | cart drawer, above the total row | adds/removes one `custom.kind === "donation"` line |
| `visit-addons` | cart drawer, horizontally scrolling rail | adds plain `addon` catalog lines |
| `gift-mode` | membership product rows (inline panel) + checkout modal (certificate) | adds a keyed line with `meta.gift` |
| `offpeak-date-nudge` | ticket product rows (inline date rail) | adds a keyed line with `meta.visit` + `custom.discountRate` |

Row-mounted features (`gift-mode`, `offpeak-date-nudge`) re-apply through a `MutationObserver` on
`#catalog-grid` with an idempotency guard, because `renderCatalog()` replaces the grid's `innerHTML`
on every tab switch (README gotcha). `gift-mode`'s certificate hooks the mocked checkout: it snapshots
the cart from a **document-level capture-phase** click listener on `#checkout-btn` (which runs before
`js/main.js`'s own handler calls `Cart.clear()`), then injects the certificate button when `#order-id`
mutates.

## 5. Mobile-first

Every control is ≥44×44px; captions and labels are not tap targets. The two rails (add-ons, dates)
scroll inside their own `overflow-x: auto` container, never the page. Panels that overlay use
`padding-bottom: env(safe-area-inset-bottom)`. Nothing depends on hover: hover styling is additive
only, and every affordance is a real button or input.
