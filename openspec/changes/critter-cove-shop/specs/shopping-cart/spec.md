## ADDED Requirements

### Requirement: Add, remove, and adjust cart line items

The system SHALL let a shopper add a product to the cart, remove a line item, and change a line
item's quantity, with the cart view reflecting each change immediately.

#### Scenario: Adding a product creates a cart line item

- **WHEN** a shopper clicks "Add to Cart" on a product
- **THEN** a line item for that product appears in the cart with quantity 1 (or its quantity increments if already present)

#### Scenario: Removing a line item

- **WHEN** a shopper clicks remove on a cart line item
- **THEN** that line item disappears from the cart and totals recalculate

#### Scenario: Changing quantity updates totals

- **WHEN** a shopper changes the quantity of a cart line item
- **THEN** the line item subtotal and the cart total recalculate to match the new quantity

### Requirement: Running subtotal and total

The system SHALL display a running subtotal per line item and an overall cart total, kept in sync
with cart contents at all times.

#### Scenario: Total reflects all line items

- **WHEN** the cart contains multiple distinct products with varying quantities
- **THEN** the displayed total equals the sum of each line item's (unit price * quantity)

### Requirement: Cart persists across reloads

The system SHALL persist cart contents (e.g. via localStorage) so that reloading or reopening the
page restores the shopper's cart.

#### Scenario: Cart survives a page reload

- **WHEN** a shopper adds items to the cart and reloads the page
- **THEN** the same items and quantities are still present in the cart

### Requirement: Mocked checkout flow

The system SHALL provide a checkout action that, since there is no real payment backend, simulates
checkout by displaying an order summary and a confirmation, without contacting any external payment
service.

#### Scenario: Completing a mocked checkout

- **WHEN** a shopper with a non-empty cart clicks "Checkout"
- **THEN** the system displays an order summary (items, quantities, total) followed by a confirmation message, and the cart is cleared afterward

#### Scenario: Checkout is disabled on an empty cart

- **WHEN** the cart has no items
- **THEN** the checkout action is disabled or otherwise prevented from completing
