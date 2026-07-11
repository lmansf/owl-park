## ADDED Requirements

### Requirement: Product data model with separate PLU field
The system SHALL model each sellable product (ticket or membership) as a data record with, at
minimum, an internal `id` (stable, never reused, not shown to shoppers) and a separate `plu` field
(a short retail-style lookup code, e.g. `4011` or `FAM1`) that is independent of `id` and can be
reassigned to a different product by editing only the data file, with no changes to layout or logic.

#### Scenario: Reassigning a PLU does not require code changes
- **WHEN** an operator edits the `plu` value for a product in the product data file and reloads the site
- **THEN** the storefront renders the product under its new PLU with no other code changes required

#### Scenario: Product data lives in a single external file
- **WHEN** the storefront loads
- **THEN** it reads product records (id, plu, name, description, price, category, image) from a single
  data file (e.g. `data/products.json`) rather than from inline markup

### Requirement: Catalog covers both tickets and memberships
The system SHALL include at least 3 and at most 5 products, covering at least one ticket-type product
(e.g. general admission, family day pass) and at least one membership-type product (e.g. individual,
family/household membership).

#### Scenario: Storefront lists mixed product types
- **WHEN** a shopper opens the storefront
- **THEN** they see both ticket products and membership products, each showing name, price, and PLU

### Requirement: Presentable storefront listing
The system SHALL render the product catalog as a visually presentable grid/list (not bare-bones
unstyled markup), suitable for design-review screenshots.

#### Scenario: Storefront is screenshot-ready
- **WHEN** the storefront is loaded in a browser at a standard desktop viewport
- **THEN** products are displayed with styled cards, imagery or iconography, and legible typography
