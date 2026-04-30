# dyninstruments v1.0.0

## First public release

dyninstruments 1.0.0 is the first stable public release of the AvNav widget plugin.
It delivers a complete instrument set focused on readability, configuration flexibility, and practical route/navigation workflows for day and night operation.

## What this release includes

- Course and heading instruments: compass radial + linear views and heading/course variants (COG, HDT, HDM)
- Speed instruments: SOG and STW in radial, linear, and text forms
- Environment instruments: depth, temperature, and voltage in radial, linear, and text forms
- Wind instruments: apparent/true wind dials and linear views with optional layline sectors
- Navigation widgets: active route, route points, edit route, AIS target, map zoom, and XTE highway display
- Vessel and situational widgets: alarm tile, position coordinates, center display, anchor watch circle, and three-value text widgets
- Default cluster for user-selected SignalK values with text/linear/radial presentation options

## Customization and theming

- Day/night aware behavior aligned with AvNav mode handling
- Preset support via `--dyni-theme-preset`: `default`, `slim`, `bold`, `highcontrast`
- User CSS customization through `--dyni-*` tokens (colors, typography, pointer appearance, radial/linear geometry factors, alarm tile accents)
- Per-kind caption, unit, formatter-unit-token, and scale/range editables for tailoring values to onboard preferences

## Layout and rendering behavior

- Responsive layout modes across instrument families (`high`, `normal`, `flat`) based on tile aspect ratio
- Shared compact-layout behavior for small widgets to preserve legibility
- Dual-surface rendering model:
  - Canvas-based instruments for gauges and dense numeric displays
  - Committed HTML renderers for interactive/navigation-heavy tiles
- Vertical container support, including ratio-based sizing and RoutePoints natural-height behavior

## Quality and validation in the release process

This release is created with project-owned tooling and local quality gates:

- Required gates in `release:create`: `npm run check:core` and `npm run test:coverage:check`
- Advisory gate in `release:create`: `npm run perf:check` (warns, does not block)
- Release artifacts generated in `releases/`:
  - `dyninstruments-1.0.0.zip`
  - `dyninstruments-1.0.0.md`

## Compatibility and install notes

- Requires an AvNav server installation with plugin support
- Pure Android app usage without AvNav server plugin loading is not supported
- Requires a modern browser with ES6 and Canvas 2D support
- Install by extracting the release zip to `.../plugins/dyninstruments/`, restarting AvNav, and adding `dyni_*_Instruments` widgets in the layout editor
