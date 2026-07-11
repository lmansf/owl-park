## ADDED Requirements

### Requirement: Discoverable manager surface

The system SHALL provide a manager UI, reachable via a link from the storefront, that lists every
feature module discovered under `features/`.

#### Scenario: Manager lists all features

- **WHEN** a reviewer opens the manager UI
- **THEN** every feature folder registered in the feature index appears in the list with its name and description

### Requirement: Per-feature enable/disable toggle

The system SHALL show each feature's current enabled/disabled state and provide a toggle control
that calls the runtime loader to plug or unplug the feature on the live page.

#### Scenario: Toggling a feature on

- **WHEN** a reviewer switches a feature's toggle to on
- **THEN** the feature is injected live (per the features-plugin-system loader contract) and the toggle visibly reflects the enabled state

#### Scenario: Toggling a feature off

- **WHEN** a reviewer switches an enabled feature's toggle to off
- **THEN** the feature is removed live and the toggle visibly reflects the disabled state

### Requirement: Persisted enablement across reloads

The system SHALL persist each feature's enabled/disabled state (e.g. via localStorage) so that
reloading the storefront or the manager UI re-applies the same set of enabled features.

#### Scenario: Enabled features survive reload

- **WHEN** a reviewer enables a set of features and reloads the storefront
- **THEN** the same features are active immediately after reload without needing to re-toggle them
