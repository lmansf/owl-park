## ADDED Requirements

### Requirement: Self-contained feature module folders
The system SHALL organize each enhancement as its own folder under `features/`, containing a
manifest file plus the feature's own HTML/CSS/JS assets, such that a feature can be copied,
added, or deleted as a unit without editing files outside its folder (aside from registration in a
top-level feature index).

#### Scenario: A feature folder is self-contained
- **WHEN** a feature folder is deleted from `features/`
- **THEN** the rest of the storefront continues to function, and the feature simply no longer appears in the manager UI (once its manifest reference is likewise removed or fails to resolve)

### Requirement: Feature manifest format
The system SHALL require each feature folder to include a manifest (e.g. `manifest.json`) declaring
at minimum: a unique `id`, a display `name`, a one-line `description`, an `enabledByDefault` boolean,
and a `files` list identifying its CSS/JS/HTML assets and their kind.

#### Scenario: Manifest declares assets
- **WHEN** the loader reads a feature's manifest
- **THEN** it can determine, without inspecting file contents, which files are CSS, which are JS, and which (if any) are HTML fragments to inject

### Requirement: Runtime inject and remove without reload
The system SHALL provide a runtime loader capable of injecting a feature's CSS/JS/HTML into the live
page and later cleanly removing it, without a full page reload, for any feature that does not
inherently require one. If a specific feature genuinely requires a reload (e.g. it must run
initialization logic only expressible at load time), that feature's manifest SHALL declare this and
the manager UI SHALL surface it, but this SHALL be the exception rather than the default.

#### Scenario: Enabling a feature live
- **WHEN** a feature is toggled on in the manager UI
- **THEN** its CSS is injected into the document, its JS executes/mounts, and any HTML fragment appears on the page without a reload

#### Scenario: Disabling a feature live
- **WHEN** a feature is toggled off in the manager UI
- **THEN** its injected CSS and HTML are removed from the document and its JS's teardown (if any) runs, leaving no residual DOM nodes or event listeners from that feature

#### Scenario: Reload-only feature is labeled
- **WHEN** a feature's manifest declares that it requires a reload
- **THEN** the manager UI indicates this to the user when the feature is toggled
