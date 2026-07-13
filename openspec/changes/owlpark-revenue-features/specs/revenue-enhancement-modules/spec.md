## ADDED Requirements

### Requirement: Five revenue modules ship in the plugin system

The system SHALL provide five additional `features/<id>.html` modules — `smart-cart-savings`,
`conservation-roundup`, `visit-addons`, `gift-mode`, and `offpeak-date-nudge` — each registered in
`features/index.json`, each a single self-contained file with a `data-owlpark-manifest` block, an
optional `<style>` scoped to `.owlpark-feat-<id>`, optional markup, and one plain (non-module)
`<script>` IIFE that registers `window.__owlParkFeatures["<id>"] = { activate, deactivate }`. No
module SHALL use `import`/`export` or `type="module"`, or reference a second file.

#### Scenario: Enable and disable leaves no residue

- **WHEN** any of the five modules is enabled and then disabled through the Enhancement Manager
- **THEN** every node it added (including nodes it injected onto product rows, the cart drawer, or the
  checkout modal), every `<style>` it added, and every interval, observer and listener it registered is
  removed, and no `[data-owlpark-feature="<id>"]` node remains in the document

#### Scenario: Modules do not modify the module they supersede

- **WHEN** `smart-cart-savings` is enabled
- **THEN** `features/membership-upsell-modal.html` is unmodified and both modules can run at the same
  time without either breaking

### Requirement: Every shopper-facing number is computed from live data

No module SHALL hardcode a price, a saving, a break-even count, or a discount amount. Every such
number SHALL be derived at render time from `data/products.json` and the current cart.

#### Scenario: Re-pricing a product cannot make the copy lie

- **WHEN** a product's price is changed in `data/products.json` and the storefront is reloaded
- **THEN** every saving, break-even count, round-up amount, and off-peak discount shown by these
  modules reflects the new price

### Requirement: smart-cart-savings offers membership break-even and better-value swaps

`smart-cart-savings` SHALL, from the cart drawer, compare the cart's ticket subtotal against
membership prices and against cheaper equivalent ticket bundles, and offer a one-tap swap when — and
only when — the arithmetic favours the shopper.

#### Scenario: Membership break-even is stated honestly

- **WHEN** the cart's ticket subtotal is $99 and a Family & Household Membership costs $179 and covers
  at least as many admissions as the cart
- **THEN** the module states the day-out cost, the membership price, and the computed break-even
  (`ceil(179 / 99)` = the 2nd visit), and offers a swap that replaces the ticket lines with the
  membership

#### Scenario: Quantity-break swap names a real saving

- **WHEN** the cart holds three General Admission tickets ($102) and a Family Day Pass ($99) admits
  more people for less
- **THEN** the module offers the swap, names the target's actual coverage ("2 adults + up to 3 kids")
  and the exact computed saving ($3.00), and does not claim the target covers the shopper's party

#### Scenario: Nothing is said when the math does not favour the shopper

- **WHEN** a swap would cost the shopper more, or the membership break-even exceeds the plausible
  threshold, or the cart holds no tickets
- **THEN** the module shows no offer at all

### Requirement: conservation-roundup attaches an optional donation

`conservation-roundup` SHALL offer a round-up donation computed from the live non-donation cart
subtotal, plus tiered adopt-an-owl amounts, and SHALL carry an accepted donation as a distinct
non-catalog cart line included in the cart total and the checkout summary.

#### Scenario: Donation is never pre-selected

- **WHEN** the shopper opens the cart with the module enabled
- **THEN** no donation is in the cart, no amount is pre-checked, and the cart total is unchanged until
  the shopper explicitly taps a donation amount

#### Scenario: Accepting a donation keeps every total correct

- **WHEN** the shopper taps the round-up offer
- **THEN** a donation line for exactly the offered amount is added, the cart total increases by exactly
  that amount, the checkout summary lists it, and a Remove control for it is shown

### Requirement: visit-addons offers one-tap contextual add-ons

`visit-addons` SHALL show a rail of `addon` catalog products when the cart contains at least one
ticket, and SHALL add an add-on to the cart in one tap without opening a modal.

#### Scenario: Rail appears only with a ticket in the cart

- **WHEN** the cart contains no ticket
- **THEN** the add-on rail is not shown; **AND WHEN** a ticket is added, the rail appears

#### Scenario: One tap attaches the add-on

- **WHEN** the shopper taps an add-on in the rail
- **THEN** it is added to the cart as a normal catalog line at its catalog price with no modal or
  interstitial, and the rail reflects that it is now in the cart

### Requirement: gift-mode sells memberships as gifts

`gift-mode` SHALL offer a gift path on membership products capturing a recipient name, a personal
message, and a delivery date; SHALL carry them as per-line cart metadata; and SHALL offer a printable
gift certificate on the mocked checkout confirmation.

#### Scenario: Gift details ride the cart line

- **WHEN** the shopper completes the gift panel and adds the membership
- **THEN** the cart holds a line for that membership carrying the recipient, message and delivery date,
  shown as a caption on the cart line, distinct from any non-gift line of the same membership

#### Scenario: Certificate is printable at checkout

- **WHEN** a cart containing a gift line is checked out
- **THEN** the confirmation offers a printable gift certificate naming the recipient, the membership,
  the message, and the delivery date

### Requirement: offpeak-date-nudge steers visitors to quiet dates

`offpeak-date-nudge` SHALL show a visit-date picker on ticket products with a per-date demand level,
SHALL carry the chosen date as per-line cart metadata, and SHALL apply any advertised off-peak
discount to the actual line price.

#### Scenario: Demand data is deterministic and labelled as mocked

- **WHEN** the same date is shown on any page load
- **THEN** it always shows the same demand level, and the UI states that the demand data is demo data

#### Scenario: An advertised saving is actually charged

- **WHEN** a date is advertised as quiet with a saving of $N
- **THEN** adding a ticket for that date creates a line priced exactly $N below the catalog price, and
  the cart total and checkout summary reflect that price

#### Scenario: Date rides the cart line

- **WHEN** the same ticket is added for two different dates
- **THEN** the cart holds two distinct lines, each captioned with its own visit date and demand level
