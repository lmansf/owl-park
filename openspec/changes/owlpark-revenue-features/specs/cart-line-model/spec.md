## ADDED Requirements

### Requirement: Cart lines carry optional per-line metadata and non-catalog payloads

A cart line SHALL remain `{ id, qty }` by default, and MAY additionally carry an optional unique
`key`, an optional namespaced `meta` object, and an optional `custom` object that overrides or
supplies display fields (`name`, `emoji`, `unit`, `plu`) and the line's `price`. Every total the
storefront shows (cart drawer subtotals, cart total, checkout summary) SHALL be derived from a single
line-resolution helper that prefers `custom` fields over the catalog product's, so no total can
disagree with any line.

#### Scenario: Existing plain cart still works

- **WHEN** a cart stored before this change (an array of `{ id, qty }`) is loaded
- **THEN** every line renders, `addItem`/`removeItem`/`setQty`/`clear`/`totalItemCount`/`onChange`
  behave exactly as before, and the cart total is unchanged

#### Scenario: Two lines of the same product with different metadata stay separate

- **WHEN** a feature adds the same product twice with different `meta` (e.g. two gift memberships for
  different recipients, or the same ticket on two different dates)
- **THEN** the cart holds two distinct lines with distinct `key`s, each with its own metadata and its
  own quantity, and neither merges into the other nor into a plain line for that product

#### Scenario: A non-catalog line is priced and totalled correctly

- **WHEN** a line has a `custom` payload with a `name` and a `price` and no matching catalog product
  (a donation)
- **THEN** the cart drawer renders it with that name and price, the cart total includes it, and the
  checkout summary includes it at the same amount

#### Scenario: A discount is applied everywhere, against the live catalog

- **WHEN** a line for a catalog product carries `custom.discountRate` (an off-peak discounted ticket)
- **THEN** the drawer line subtotal, the cart total, and the checkout summary all use the catalog
  price with that rate taken off, and never the undiscounted catalog price
- **AND WHEN** that product's price changes in `data/products.json` while the line sits in a stored
  cart
- **THEN** the line re-prices itself against the new catalog price, because no discounted amount was
  ever stored

### Requirement: A discount basis can only ever price a line below catalog

The discount a `custom.discountRate` takes off a line SHALL be computed by a single shared helper, so
the saving a feature advertises is exactly the amount charged. Because the rate is read back from a
persisted, hand-editable cart line, the helper SHALL clamp it so the resulting price is never above
the catalog price and never below zero.

#### Scenario: A stored line carrying a nonsense rate is still priced sanely

- **WHEN** a stored line's `custom.discountRate` is negative, greater than 1, or not a number
- **THEN** the line prices at no more than the catalog price and no less than zero, and every total
  showing that line agrees

### Requirement: A donation is money in the cart, not an item in it

A line marked `custom.kind === "donation"` SHALL be excluded from the cart's item count (and so from
the cart badge's number and any feature's count), while still being included in every total. A cart
holding a donation and no purchased line SHALL be labelled as the gift it is rather than shown as an
empty-but-priced cart.

#### Scenario: A donation does not inflate the item count

- **WHEN** the cart holds two tickets and an accepted donation
- **THEN** the cart badge (and the mini cart bar) counts 2 items, and the cart total and checkout
  summary both include the donation amount

#### Scenario: A gift-only cart is labelled, not counted

- **WHEN** the only line left in the cart is a standalone tier donation
- **THEN** the cart badge shows a gift marker rather than "0" beside a real total, and the donation
  remains in the cart

### Requirement: An orphaned round-up donation is dropped by the cart itself

A donation tagged `custom.source === "roundup"` was an offer to round one purchase up, so the cart
SHALL drop it once no purchased line remains. This rule SHALL live in the core cart/product modules
rather than in `conservation-roundup`, so it holds with every feature disabled. A donation that made
no promise about a total (an adopt-an-owl tier gift) SHALL NOT be dropped.

#### Scenario: Emptying the cart of purchases takes the round-up with it

- **WHEN** the shopper accepts a round-up and then removes every ticket and membership from the cart,
  with `conservation-roundup` enabled or disabled
- **THEN** the round-up donation is gone from the stored cart, and the shopper is not charged for it

#### Scenario: A tier gift stands alone

- **WHEN** the shopper adds an adopt-an-owl tier donation and removes every other line
- **THEN** the donation remains in the cart at exactly the amount tapped, and the cart total is that
  amount

### Requirement: Features can mutate the cart without importing it

The cart module SHALL re-run its change notification when a `owl-park-cart-changed` event is
dispatched on `window`, so a feature module — which cannot `import` `js/cart.js` under the single-file
plugin contract — can write `localStorage["owl-park-cart"]` directly and have the storefront re-render.

#### Scenario: A feature adds a line and the storefront updates

- **WHEN** an enabled feature writes a new cart array to `localStorage` and dispatches
  `owl-park-cart-changed` on `window`
- **THEN** the cart drawer, cart count, and cart total re-render from the new lines without a page
  reload

### Requirement: Catalog supports add-on products hidden from the storefront tabs

`data/products.json` SHALL support an `addon` category, and the storefront catalog SHALL render only
products whose category has a corresponding filter tab. Add-on products SHALL have their own PLUs and
SHALL be addable to the cart as ordinary catalog lines.

#### Scenario: Add-ons are absent from every storefront tab

- **WHEN** the shopper views the All, Tickets, or Memberships tab
- **THEN** no `addon` product row is shown

#### Scenario: An added add-on is a normal cart line

- **WHEN** an add-on is added to the cart
- **THEN** it appears with its catalog name, PLU, and price, supports quantity changes and removal,
  and is included in the cart total and the checkout summary

### Requirement: Products declare their admission capacity

Ticket and membership products SHALL declare a `capacity` of `{ adults, kids }`, so that coverage and
break-even math is computed from catalog data rather than hardcoded in feature code.

#### Scenario: Re-pricing or re-capacity-ing a product changes the copy

- **WHEN** a product's `price` or `capacity` is edited in `data/products.json`
- **THEN** every saving, break-even count, and coverage statement a shopper sees changes with it, with
  no code edit
