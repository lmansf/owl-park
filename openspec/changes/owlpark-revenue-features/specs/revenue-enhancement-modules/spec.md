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

An offer SHALL only be made when the target **strictly covers** the cart: its `capacity.adults` is at
least the cart's adults and its `capacity.kids` is at least the cart's kids, each summed from the
ticket lines' product capacity × qty. The two dimensions SHALL NOT be summed into a single head count.
A product with no `capacity` in the catalog admits an **unknown** party, never a party of zero.

With the shipped catalog only the membership half of this module can fire: the Family Day Pass is the
sole ticket admitting more than one person, and it never costs less than a cart it can cover, so no
ticket → ticket swap is reachable today. The swap rule is kept because it is the general, data-driven
one and activates the moment the catalog gains a second group ticket — but it ships **dormant**, and
nobody should read the code as exercised.

#### Scenario: Membership break-even is stated honestly

- **WHEN** the cart holds one Family Day Pass (2 adults + 3 kids, $99) and a Family & Household
  Membership ($179) covers 2 adults + up to 4 kids
- **THEN** the module states the day-out cost, the membership price, and the computed break-even
  (`ceil(179 / 99)` = the 2nd visit), and offers a swap that replaces the ticket lines with the
  membership

#### Scenario: An offer that would leave someone at the gate is not made

- **WHEN** the cart holds three General Admission tickets ($102, three adults) and the only cheaper
  multi-person ticket is a Family Day Pass that admits 2 adults + 3 kids
- **THEN** the module offers neither the swap nor a membership, because no product in the catalog
  covers three adults, and shows nothing at all rather than a saving that admits only two of them

#### Scenario: A swap keeps the visit date and off-peak rate the shopper chose

- **WHEN** the shopper's ticket lines all carry the same `meta.visit` date and `custom.discountRate`,
  and a ticket → ticket swap is offered
- **THEN** the replacement line carries that same visit date and discount basis, and the advertised
  saving is computed against the discounted price the line is actually charged at
- **AND WHEN** the ticket lines carry more than one distinct visit date
- **THEN** no swap is offered, since one replacement line cannot carry two dates
- **AND WHEN** the swap target is a membership (which admits any open day, so the dates do not carry)
- **THEN** the offer copy states that the swap replaces the dated tickets

#### Scenario: Nothing is said when the math does not favour the shopper

- **WHEN** a swap would cost the shopper more, or the membership break-even exceeds the plausible
  threshold, or the target does not strictly cover the cart, or the cart holds no tickets
- **THEN** the module shows no offer at all

#### Scenario: A ticket whose capacity the catalog does not state suppresses every offer

- **WHEN** the cart holds a `ticket` product carrying no `capacity`
- **THEN** the module makes no offer at all, since the party in the cart is unknown and any coverage
  check against it would pass vacuously — recommending a target that admits nobody it needs to

#### Scenario: An offer is applied only if the cart still supports it

- **WHEN** the cart changes between an offer being drawn and its button being tapped
- **THEN** the module recomputes the offer from the cart as it is at the tap, applies it only if it is
  still the same target on the same terms, and otherwise applies nothing and redraws with the offer
  the cart now supports

### Requirement: conservation-roundup attaches an optional donation

`conservation-roundup` SHALL offer a round-up donation computed from the live non-donation cart
subtotal, plus tiered adopt-an-owl amounts, and SHALL carry an accepted donation as a distinct
non-catalog cart line included in the cart total and the checkout summary.

#### Scenario: Donation is never pre-selected

- **WHEN** the shopper opens the cart with the module enabled
- **THEN** no donation is in the cart, no amount is pre-checked, and the cart total is unchanged until
  the shopper explicitly taps a donation amount

#### Scenario: Nothing is rounded when there is nothing to round

- **WHEN** the purchase subtotal is already an exact multiple of the rounding unit and no round-up has
  been accepted
- **THEN** no round-up button is shown — only the plainly labelled adopt-an-owl tiers — because advancing
  a whole total to the next multiple is a flat ask, not a rounding correction, and tapping a stale
  round-up whose subtotal has since become whole adds nothing

#### Scenario: Accepting a donation keeps every total correct

- **WHEN** the shopper taps the round-up offer
- **THEN** a donation line for exactly the offered amount is added (tagged `custom.source = "roundup"`),
  the cart total increases by exactly that amount, the checkout summary lists it, and a Remove control
  for it is shown

#### Scenario: A later cart change never edits the gift, and never leaves a stale promise

- **WHEN** the cart changes after a round-up was accepted, so the order total is no longer a whole $5 —
  including when the purchase subtotal itself has become a whole $5, which suppresses the opening offer
  but not this one, since the pinned gift is then the remainder that breaks the total
- **THEN** the donation stays pinned at exactly the amount the shopper tapped, and the panel states the
  new order total and offers an explicit re-round the shopper can take or ignore — the gift changes
  only on a further tap

#### Scenario: Only the amount the shopper agreed to is ever given

- **WHEN** the cart changes between a round-up being offered and its button being tapped, so the gift
  that would round the order is no longer the amount on the button
- **THEN** no donation is added, and the panel redraws with the round-up the cart now calls for — a
  shopper consents to a number, not to whatever their cart later makes of it

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

#### Scenario: One gift line is one membership for one recipient

- **WHEN** a gift line is in the cart
- **THEN** it carries `custom.fixed`, so the drawer offers no quantity stepper on it and it cannot be
  raised to a quantity that charges for two memberships while yielding the one certificate its named
  recipient gets; a second gift is a second line, added from the panel again with its own recipient

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
