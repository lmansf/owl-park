## Context

Critter Cove Shop is a demo/test project: a fictional zoo's ticket + membership storefront used as a
design-review sandbox. There is no real backend, payment processor, or build pipeline. The
distinguishing requirement is the `features/` system: small enhancement snippets that a reviewer can
plug and unplug at runtime to compare visual/behavioral variants, without a compiler step. That
constraint (no build step) shapes every other decision below.

## Goals / Non-Goals

**Goals:**
- A static, no-build-step site (plain HTML/CSS/JS) that runs from any static file server.
- A product/PLU data model that is trivially re-mappable.
- A cart with persistence and a mocked checkout.
- A `features/` plugin format + runtime loader that can inject/remove a feature's assets live.
- 20 working feature modules and a manager UI to toggle them.

**Non-Goals:**
- Real payment processing, authentication, or a backend/database.
- A framework or bundler (React/Vite/webpack, etc.) — plain JS modules only.
- Production-grade e-commerce concerns (tax, shipping, inventory backend, fraud checks).

## Decisions

- **No build step, native ES modules.** Each feature is loaded via `fetch` for its HTML/CSS text and
  dynamic `import()` for its JS, so nothing needs bundling. Alternative considered: a bundler-based
  plugin system (e.g. webpack module federation) — rejected because the task's hard requirement is
  runtime plug/unplug of raw snippets, not a compiled bundle.
- **PLU stored as a plain field in `data/products.json`, separate from `id`.** `id` is the stable key
  used internally (cart storage keys, DOM ids); `plu` is purely a display/lookup label an operator can
  edit freely. Alternative: use PLU as the primary key — rejected because retail PLUs are meant to be
  reassignable, and reassigning a primary key would break stored cart references.
- **Cart persisted as a JSON blob in `localStorage`** keyed by product `id` + quantity. Simple, no
  backend, survives reloads, meets the spec.
- **Feature registry is a static `features/index.json` listing feature folder names**, read by the
  loader to discover manifests (rather than trying to directory-list `features/` via `fetch`, which
  static file servers don't expose generically). Authoring a new feature means adding a folder *and*
  a one-line entry in this index.
- **Loader contract**: each feature module exports (as an ES module) `activate(context)` and
  `deactivate(context)` functions. `activate` injects a `<style>` tag (feature CSS), an HTML fragment
  (if any) into a designated mount point or specified selector, and runs the feature's behavior;
  `deactivate` removes exactly the nodes/listeners it added. This avoids reload for all 20 features;
  none of them need a hard reload, so no feature declares `requiresReload: true` in practice, but the
  manifest field and manager-UI affordance exist per spec in case a future feature needs it.
- **Manager UI is a separate page (`features-manager.html`)** reachable from a header link on the
  storefront, sharing the same loader module so toggle state and injected DOM stay consistent whether
  reached from the storefront or the manager page.
- **Enablement persisted in `localStorage`** under a single key mapping feature id -> boolean,
  separate from cart storage.

## Risks / Trade-offs

- [Two pages (storefront, manager) both need feature state applied on load] → Mitigation: a shared
  `js/feature-loader.js` module is imported by both pages and applies enabled features from
  localStorage on `DOMContentLoaded`.
- [Feature JS could leak listeners/DOM if a feature author forgets teardown] → Mitigation: loader
  wraps injected HTML in a container element tagged with the feature id, so `deactivate` can always
  remove the whole container by id even if the feature's own teardown misses something; document this
  pattern in the README's "authoring a new feature" section.
- [`fetch` of local files requires a real HTTP server, not `file://`] → Mitigation: README documents
  running via `python3 -m http.server` or `npx serve` explicitly.
