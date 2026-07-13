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

#### Scenario: A price override is applied everywhere

- **WHEN** a line for a catalog product carries `custom.price` (an off-peak discounted ticket)
- **THEN** the drawer line subtotal, the cart total, and the checkout summary all use the overridden
  price, and never the catalog price

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
