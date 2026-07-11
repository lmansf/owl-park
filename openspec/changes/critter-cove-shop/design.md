## Context

Owl Park is a demo/test project: a fictional owl park's ticket + membership storefront used as a
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
  static file servers don't expose generically). Authoring a new feature means adding a folder _and_
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

## Follow-up updates (post-launch)

- **Rebrand to Owl Park.** The project (and its GitHub repo) was renamed from "Critter Cove Shop"
  to "Owl Park" shortly after the initial build; copy, icons, and storage keys were updated to
  match, and the catalog's zoo-variety animal references were narrowed to an owl theme.
- **Layout restyle.** The storefront's catalog layout was adapted to follow the structural pattern
  of the National Aquarium's webstore (`cart.aqua.org`) — a full-width hero image band, a labeled
  section header, and single-column bordered rows (title/price/action up top, a divider, then
  description/fine print below) instead of a card grid. Only structure was referenced; no
  branding, copy, or images from that site were reused — Owl Park kept its own colors, artwork
  (an original CSS/SVG night-sky hero), and content.
- **Single-file feature format.** The `features/` plugin format changed from a folder per feature
  (`manifest.json` + `style.css` + `fragment.html` + `script.js`, loaded as an ES module) to one
  self-contained `features/<id>.html` file per feature, with no ES module imports anywhere. This
  mirrors a real constraint of third-party webstores (including the aquarium reference above),
  which typically only allow a site owner to paste a single code snippet into a page body — no
  separate assets, no build step, no import graph. See `README.md`'s "The `features/` plugin
  system" section for the current file format; the "ADDED Requirements" in
  `specs/features-plugin-system/spec.md` describe the original folder-based contract and were not
  revised for this change (deferred until a broader spec update alongside further follow-up work).

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
