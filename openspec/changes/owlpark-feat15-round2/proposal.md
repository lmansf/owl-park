## Why

Owl Park's `features/` plugin system currently ships 20 enhancement modules and is meant to serve as
an ever-growing design-review sandbox. To keep giving reviewers fresh, varied modules to compare
(and to further exercise the single-file plugin contract with new shapes: audio, modals, timers,
list-persistence, row decoration, etc.), the storefront needs another batch of enhancements without
touching the existing 20 or the plugin contract itself.

## What Changes

- Add 15 new self-contained feature modules under `features/`, each a single `features/<id>.html`
  file following the existing manifest + optional scoped `<style>` + optional markup + plain
  `<script>` IIFE contract (no folders, no ES module imports, no separate CSS/JS/HTML files) — see
  `README.md`'s "The `features/` plugin system" section and `AGENTS.md` for the exact rules.
- Register all 15 new files in `features/index.json` so they're discovered by the existing runtime
  loader (`js/feature-loader.js`) and appear automatically in the Enhancement Manager
  (`features-manager.html`) — no loader or manager code changes required.
- Update `README.md`'s enhancement table to document all 35 features (20 existing + 15 new).

## Capabilities

### New Capabilities

- `enhancement-modules-round-2`: The 15 additional concrete `features/` modules being added in this
  change — their ids, categories, one-line behavior, and the requirement that each satisfies the
  existing plugin contract (manifest, symmetric activate/deactivate, no residue on disable).

### Modified Capabilities

(none — the `features/` plugin module format and runtime loader contract are unchanged; only new
concrete module instances are added)

## Impact

- New files: 15 `features/<id>.html` files (listed in `tasks.md`).
- Modified files: `features/index.json` (15 new entries), `README.md` (enhancement table).
- No changes to `js/feature-loader.js`, `js/main.js`, `features-manager.html`, or any of the 20
  existing feature files.
- No new external dependencies. Screenshots for design review captured to the git-ignored
  `.review-screenshots/` folder, same as the original build.
