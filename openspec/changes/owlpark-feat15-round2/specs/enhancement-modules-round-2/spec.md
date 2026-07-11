## ADDED Requirements

### Requirement: Fifteen new feature modules ship in the plugin system

The system SHALL provide 15 additional `features/<id>.html` modules — `wishlist-favorites`,
`promo-code-field`, `flash-sale-timer`, `park-guide-tour`, `share-your-visit`,
`ticket-comparison-table`, `add-to-calendar-button`, `copy-order-id-button`, `ambient-park-sounds`,
`order-history-log`, `keyboard-shortcuts-helper`, `sticky-mini-cart-bar`, `species-fact-ticker`,
`discount-badge-strikethrough`, and `park-map-modal` — each registered in `features/index.json` so
the existing runtime loader discovers and can toggle it without any loader or manager code changes.

#### Scenario: New module discovered by the loader

- **WHEN** the storefront or Enhancement Manager loads and fetches `features/index.json`
- **THEN** all 15 new feature ids appear in the discovered feature list with a valid manifest (`id`,
  `name`, `description`, `category`, `enabledByDefault`, `requiresReload`)

#### Scenario: New module is distinct from existing 20

- **WHEN** any of the 15 new modules is compared against the 20 modules already shipped
- **THEN** its id does not collide with an existing id, and its core behavior (what it visually adds
  or what interaction it changes) is not a reskin of an existing module's behavior

### Requirement: New modules satisfy the existing single-file plugin contract

Each of the 15 new modules SHALL follow the same file contract as the existing 20: one
self-contained `features/<id>.html` file with a `data-owlpark-manifest` JSON block, an optional
`<style>` scoped to `.owlpark-feat-<id>`, optional static markup, and a single plain (non-module)
`<script>` IIFE that calls `activate()` immediately and registers
`window.__owlParkFeatures["<id>"] = { activate, deactivate }`. No module SHALL use `import`/`export`,
`type="module"`, or reference a second file.

#### Scenario: Feature activates and deactivates without residue

- **WHEN** a new module is enabled and then disabled through the Enhancement Manager
- **THEN** every DOM node and `<style>` element it added is removed, any interval/timeout/listener it
  registered is cleared, and no node tagged `data-owlpark-feature="<id>"` remains in the document

#### Scenario: Feature works standalone

- **WHEN** a new module's file is pasted into any HTML page on its own, outside the Owl Park loader
- **THEN** its script executes immediately (via its own `activate()` call at the bottom of the IIFE)
  without throwing, same as every existing feature
