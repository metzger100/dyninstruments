# PLAN8 — AIS Target HTML Widget (`ais/aisTarget`)

## Status

Written from direct inspection of the current AvNav `AisTarget` implementation and the current dyninstruments HTML widget stack.

This plan sets **functional and informational parity** with AvNav, while making **dyninstruments** the sole source of truth for visual structure, HTML contracts, CSS class shape, layout ownership, fit ownership, and interaction wiring style.

AvNav is the reference for:

- which AIS target is summarized
- which fields are shown
- when `TCPA` vs `BRG` is shown
- how `nameOrmmsi` and `passFront` are derived
- color-role precedence
- widget-owned click entry into the host AIS workflow

Dyninstruments is the reference for:

- HTML widget architecture
- mode switching (`high` / `normal` / `flat`)
- class naming and additive state classes
- tile/band styling
- layout-owner and fit-owner split
- hotspot and `catchAll` usage
- CSS scope rules
- docs and regression structure

## Goal

Add a new native HTML widget kind `aisTarget` as `ais/aisTarget`.

Expected outcome:

- a new `ais` cluster exists in dyninstruments
- `ais/aisTarget` is available in layouts as a native HTML kind
- the widget provides the same AIS summary intent and workflow-entry behavior as AvNav
- the widget does **not** copy AvNav’s visual composition, DOM structure, or filler geometry
- the widget follows dyninstruments’ existing HTML style and contracts, with `ActiveRoute` as the primary visual/system reference

## Repo-grounded Findings

### AvNav `AisTarget` behavior that must be preserved

1. The widget summarizes the host-selected AIS target from `nav.ais.nearest`; target selection already happens in `aisdata.js` and must not be reimplemented.
2. The selected target source has host precedence: warning target first, then tracked target, then the target flagged nearest.
3. The widget is a widget-owned click entry point. It raises a click carrying `mmsi`, but the page owns the actual AIS dialog/page workflow.
4. `NavPage` and `GpsPage` both recognize `AisTarget`, but they do not host the same downstream UI. The dyn widget therefore needs workflow-entry parity, not dialog-cloning parity.
5. Compact mode shows a reduced field set: front initial, `DST`, and either `TCPA` or `BRG`, plus optional local state accent.
6. Full mode shows the richer field set: `DST`, `nameOrmmsi`, `frontText`, and either `{DCPA, TCPA}` or `{BRG}`.
7. The branch rule is exact: `tcpa > 0` means show `DCPA` + `TCPA`; otherwise show `BRG`.
8. `nameOrmmsi` fallback order is: AtoN name override when type 21 and usable, then ship name, then MMSI.
9. `passFront` text behavior is: `Front`, `Back`, `Pass`, `Done`, or `-`, based on `cpa` and `passFront`.
10. `legacy` is a real editable and must ship in PLAN8.
11. Color precedence is: warning, then nearest, then tracking, then normal.
12. No valid MMSI means the widget still renders on GPS and during layout editing, but not as a normal active summary everywhere else.

### dyninstruments `ActiveRoute` findings that must shape this widget

1. `ActiveRouteTextHtmlWidget` is the canonical dyninstruments HTML reference for a compact, ratio-driven, text-first summary widget.
2. The standard dyn mode split is `high` / `normal` / `flat`, with ratio thresholds defaulting to `1.2` and `3.8`.
3. Dyn HTML widgets use additive wrapper state classes such as `dyni-<widget>-mode-high`, `dyni-<widget>-open-dispatch`, and `dyni-<widget>-open-passive`.
4. Dyn metric presentation uses compact tiles with a caption line and an inline value/unit row.
5. Dyn widgets separate layout ownership and text-fit ownership into shared modules; CSS is not allowed to become a second geometry owner.
6. Dyn interaction wiring uses full-surface capture only when the renderer intentionally owns interaction. Wrapper `onclick="catchAll"` and a named handler hotspot are added only in active dispatch states.
7. `ActiveRoute` documents the visual contract first and keeps host shell/root ownership outside widget-local CSS.
8. Dyn vertical behavior for compact HTML widgets is presentation-oriented, not an excuse to import foreign layout contracts.

## Product Direction

`ais/aisTarget` is a **dyninstruments widget with AvNav parity**, not a visual clone of AvNav’s `AisTargetWidget`.

That means:

- preserve data semantics and click semantics
- do **not** preserve AvNav DOM shape
- do **not** preserve AvNav row-for-row composition
- do **not** preserve AvNav filler slots purely to mimic appearance
- do **not** import AvNav-specific CSS concepts such as `aisPart`, `AisSmallDisplay`, or `AisFullDisplay`
- do **not** use AvNav core as the visual reference for `high` / `normal` / `flat`

The dyn visual reference is `ActiveRoute`, adapted to AIS content.

## Visual Contract

### Visual language

The widget shall use dyninstruments’ existing HTML summary language:

- one wrapper block
- one identity band or compact identity cell
- metric tiles with caption/value/unit structure
- optional small local state accent element in non-legacy mode
- additive wrapper state classes for mode, data state, branch state, and interaction state
- font family and foreground color from shared dyn helpers/theme owners
- label/value emphasis via theme token weights, matching current dyn HTML widgets

There shall be **no** attempt to recreate the AvNav `WidgetFrame` appearance inside the widget body.

### CSS state classes

Required wrapper/state classes:

- `dyni-ais-target-html`
- `dyni-ais-target-mode-high`
- `dyni-ais-target-mode-normal`
- `dyni-ais-target-mode-flat`
- `dyni-ais-target-data`
- `dyni-ais-target-placeholder`
- `dyni-ais-target-open-dispatch`
- `dyni-ais-target-open-passive`
- `dyni-ais-target-branch-tcpa`
- `dyni-ais-target-branch-heading`
- `dyni-ais-target-legacy`
- `dyni-ais-target-local-accent`
- `dyni-ais-target-color-warning`
- `dyni-ais-target-color-nearest`
- `dyni-ais-target-color-tracking`
- `dyni-ais-target-color-normal`

The renderer may add one neutral no-color state class if that simplifies CSS, but it must stay within the documented class contract.

### Element class contract

Required element classes:

- `.dyni-ais-target-identity`
- `.dyni-ais-target-name`
- `.dyni-ais-target-front`
- `.dyni-ais-target-front-initial`
- `.dyni-ais-target-metrics`
- `.dyni-ais-target-metric`
- `.dyni-ais-target-metric-caption`
- `.dyni-ais-target-metric-value`
- `.dyni-ais-target-metric-unit`
- `.dyni-ais-target-state-accent`
- `.dyni-ais-target-placeholder-text`
- `.dyni-ais-target-open-hotspot`

### Mode rules

`aisTarget` follows the same mode-selection pattern used by `ActiveRoute`.

Defaults:

- `aisTargetRatioThresholdNormal = 1.2`
- `aisTargetRatioThresholdFlat = 3.8`

Rule:

- ratio `< normal threshold` → `high`
- ratio `> flat threshold` → `flat`
- otherwise → `normal`

This widget does **not** introduce a separate AvNav-derived vertical mode contract. If `.widgetContainer.vertical` affects presentation, it must do so in the normal dyn CSS/presentation way rather than by importing foreign visual rules.

### Mode matrix

The field set keeps AvNav parity. The composition uses dyninstruments topology.

#### `flat`

Purpose: compact one-band summary, same information density target as AvNav compact mode.

Visible content:

- `frontInitial`
- `distance`
- `tcpa` **or** `headingTo`
- optional local state accent when non-legacy

Hidden in `flat`:

- `nameOrmmsi`
- `cpa`
- full `frontText`

Topology:

- compact leading identity cell for `frontInitial`
- compact metric rail for `DST` and the secondary metric (`TCPA` or `BRG`)
- optional slim accent element

This is a dyn compact rail, not an AvNav `AisSmallDisplay` clone.

#### `normal`

Purpose: balanced summary widget matching dyn summary styling.

Visible content:

- `nameOrmmsi`
- `frontText`
- `distance`
- `cpa` + `tcpa` when `tcpa > 0`
- `headingTo` when `tcpa <= 0`
- optional local state accent when non-legacy

Topology:

- top identity band containing `nameOrmmsi` and optional local accent
- metric grid below the identity band
- footer/state row for `frontText`

Branch-specific layout:

- `tcpa > 0`: metric grid shows `DST`, `DCPA`, `TCPA`
- `tcpa <= 0`: metric grid shows `DST`, `BRG`

There is **no** blank filler tile whose only purpose is to mimic AvNav spacing.

#### `high`

Purpose: narrow-shell stacked version of the same `normal` information set.

Visible content:

- `nameOrmmsi`
- `frontText`
- `distance`
- `cpa` + `tcpa` when `tcpa > 0`
- `headingTo` when `tcpa <= 0`
- optional local state accent when non-legacy

Topology:

- identity band at top
- stacked metric region optimized for narrow width
- front/state row at bottom

Branch-specific layout:

- `tcpa > 0`: `DST` plus a two-metric secondary row for `DCPA` and `TCPA`
- `tcpa <= 0`: `DST` plus a full-width `BRG` tile

Again, this is a dyn stacked tile layout, not a reproduction of AvNav full-mode rows.

### Visual anti-goals

The implementation must not ship any of these:

- direct copy of AvNav `AisTargetWidget` markup structure
- empty visual filler slots just to imitate AvNav alignment
- AvNav class names or AvNav DOM naming
- a widget-local shell contract that overrides dyn host shell ownership
- a second geometry system hidden in CSS

## Functional Contract

### Target source

Use host-selected target data from:

- `nav.ais.nearest`
- `nav.ais.trackedMmsi`
- `properties.aisMarkAllWarning`
- `properties.style.aisWarningColor`
- `properties.style.aisNearestColor`
- `properties.style.aisTrackingColor`
- `properties.style.aisNormalColor`

Do not re-implement nearest-target selection logic.

### Required derived values

A dedicated `AisTargetViewModel` shall normalize and derive at least:

- `mmsiNormalized`
- `hasValidMmsi`
- `distance`
- `cpa`
- `tcpa`
- `headingTo`
- `nameOrMmsi`
- `frontText`
- `frontInitial`
- `showTcpaBranch`
- `colorRole`
- `hasColor`
- `renderPolicy`

### MMSI normalization

Valid MMSI input for dispatch/render gating:

- finite number → decimal string
- non-empty trimmed string → trimmed string
- anything else → invalid

No dispatch may occur without a valid normalized MMSI.

### Branch rule

The branch rule is exact and must be used consistently in viewmodel, mapper, layout, resize signature, and tests:

- `tcpa > 0` → show `DCPA` and `TCPA`
- otherwise → show `BRG`

### Text formatting

PLAN8 mirrors the relevant AvNav formatter semantics, but through dyninstruments’ own viewmodel/formatter path.

Required subset:

- `distance` → `DST`, unit `nm`
- `cpa` → `DCPA`, unit `nm`
- `tcpa` → `TCPA`, unit `min`
- `headingTo` → `BRG`, unit `°`
- `nameOrmmsi`
- `passFront`

Fixed captions and units are acceptable for PLAN8. No invented per-field editable label system is required.

### `legacy`

`legacy` is required and defaults to `false`.

Behavior:

- `legacy === false`: neutral wrapper, local accent element only
- `legacy === true`: wrapper tint from the active AIS color role, no local accent element

This preserves AvNav behavior, but the accent geometry remains dyn-specific.

### Color-role precedence

Use this order:

1. `warning` when `(warning && aisMarkAllWarning) || nextWarning`
2. else `nearest` when `nearest`
3. else `tracking` when normalized target MMSI matches tracked MMSI
4. else `normal` when there is a valid MMSI
5. else no color

## Render Policy

### Data / placeholder / hidden

Render policy:

- `data` when `hasValidMmsi`
- `placeholder` when there is no valid MMSI and either:
  - current page is `gpspage`, or
  - layout editing is active
- `hidden` otherwise

### Placeholder contract

Placeholder text is fixed as `No AIS`.

Placeholder markup:

- centered placeholder text only
- no fake metric tiles
- no fake units
- no color accent

## Interaction Contract

### Workflow split

The dyn widget owns summary display and click capture.
The host owns the actual AIS info workflow and page-specific dialog behavior.

PLAN8 therefore dispatches only through the existing bridge action:

- `hostActions.ais.showInfo(mmsi)`

No new bridge API is needed.

### Page-aware behavior

Supported dispatch pages are the pages already exposed by the current host capabilities:

- `navpage`
- `gpspage`

On unsupported pages, the widget is passive.

### Capture and dispatch states

Keep these states separate:

- `captureClicks`
- `canDispatchShowInfo`

Rules:

- `captureClicks === true` when the widget is not editing and the host capability for `ais.showInfo` is dispatch-capable, and either:
  - a valid MMSI exists, or
  - the current page is `gpspage` and the widget is visible in placeholder mode
- `canDispatchShowInfo === true` only when `captureClicks === true` and `hasValidMmsi === true`

### Click ownership style

Use the current dyn HTML interaction style:

- wrapper adds `onclick="catchAll"` only when `captureClicks === true`
- named hotspot element uses `onclick="aisTargetShowInfo"`
- named handler is returned only when the widget is in a capture-capable state

Handler behavior:

- when `canDispatchShowInfo === true`, call `hostActions.ais.showInfo(mmsiNormalized)`
- when the widget is capturing only to block host fallthrough, return `false` and do nothing else
- when passive, expose no handler and no hotspot

### Editing mode

In layout-editing mode:

- always passive
- no capture
- no dispatch
- placeholder allowed according to render policy

## Architecture

### Cluster choice

Create a new `ais` cluster.

Reasons:

- `ROADMAP.md` already anticipates an `ais` cluster
- AIS target logic is not route-summary logic
- store keys and color semantics are AIS-specific
- future AIS widgets belong in the same cluster

### Preferred implementation pattern

Use `ActiveRoute` as the primary structural reference:

- shared viewmodel for domain normalization
- mapper branch for renderer payload
- shared layout owner
- shared fit owner
- one HTML widget shell with CSS

Required shared modules:

- `cluster/viewmodels/AisTargetViewModel.js`
- `cluster/mappers/AisMapper.js`
- `shared/widget-kits/ais/AisTargetLayout.js`
- `shared/widget-kits/ais/AisTargetHtmlFit.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`

Optional extraction rule:

- if the widget shell stays readable, keep render-model and markup local to the shell, as `ActiveRoute` does
- only extract `AisTargetRenderModel` or `AisTargetMarkup` if the shell becomes too large or mixed-responsibility

This keeps PLAN8 aligned with dyninstruments’ current HTML practice instead of over-specifying a foreign visual topology.

## Mapper Contract

`AisMapper` shall emit a dedicated renderer payload for `aisTarget`.

Recommended grouped shape:

- `renderer`
- `domain`
- `layout`
- `appearance`
- `labels`
- `units`

Minimum content:

- normalized display data and branch booleans
- ratio thresholds
- `legacy`
- color role inputs or resolved color values
- fixed labels and units

Interaction gating remains renderer-owned because it depends on page capabilities and editing mode.

## Layout and Fit Contract

### Layout ownership

`AisTargetLayout` owns:

- content rects and gaps
- mode-specific band/tile arrangement
- branch-aware tile arrangement
- placeholder geometry

### Fit ownership

`AisTargetHtmlFit` owns:

- text measurement
- font-size output for identity, value, and unit text
- mode-aware tile fitting

### Renderer ownership

The renderer owns:

- escaped HTML markup
- class/state selection
- style attribute injection from fit output
- named handler exposure
- resize signature assembly

### Explicit fit rules

- metric fields use caption/value/unit markup with inline units
- text-only fields (`nameOrMmsi`, `frontText`, `frontInitial`) do not allocate unit geometry
- no CSS-only unit stacking variant in `flat`
- no hidden ghost tiles for fields that are not displayed

## Resize Signature Contract

`resizeSignature` must include all layout-relevant inputs, at minimum:

- resolved mode
- render policy
- branch state (`tcpa` vs `heading`)
- `legacy`
- capture/dispatch state
- shell width
- shell height
- lengths or values of all visible text strings

The signature must change when any visible field set or interaction state changes.

## Implementation Phases

### Phase 1 — Cluster and data path

Create and register:

- `config/clusters/ais.js`
- `cluster/viewmodels/AisTargetViewModel.js`
- `cluster/mappers/AisMapper.js`

Update:

- `plugin.js`
- `config/components/registry-cluster.js`
- `cluster/mappers/ClusterMapperRegistry.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/rendering/ClusterRendererRouter.js`

Phase outcome:

- `ais/aisTarget` can be declared
- renderer wiring exists
- target normalization contract is testable before HTML styling lands

### Phase 2 — Layout, fit, renderer shell, and CSS

Create:

- `shared/widget-kits/ais/AisTargetLayout.js`
- `shared/widget-kits/ais/AisTargetHtmlFit.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`

Update:

- `config/components/registry-shared-foundation.js`
- `config/components/registry-widgets.js`
- `config/components/registry-cluster.js`

Phase outcome:

- dyn-style HTML contract exists
- mode classes and tile layouts render correctly
- interaction wiring follows dyn hotspot/catchAll rules

### Phase 3 — Tests, fixtures, and docs

Add or update:

- cluster config tests
- mapper and viewmodel tests
- shared layout and fit tests
- renderer tests
- layout fixture coverage
- widget documentation
- roadmap coverage

Phase outcome:

- visual contract is documented
- layout and interaction regressions are pinned
- `AisTarget` is marked covered in roadmap/docs

## Test Plan

### ViewModel tests

Pin:

- MMSI normalization
- `nameOrmmsi` fallback order
- `passFront` text derivation
- `tcpa > 0` branch selection
- color-role precedence inputs
- fail-closed behavior for malformed targets

### Mapper tests

Pin:

- renderer selection
- grouped payload shape
- threshold propagation
- `legacy` propagation
- fixed labels/units contract

### Layout/Fit tests

Pin:

- `high` / `normal` / `flat` topology
- `flat` omission of name and `DCPA`
- no blank filler tile in the `BRG` branch
- inline unit placement
- no unit geometry on text-only cells
- placeholder geometry without ghost tiles

### Renderer tests

Pin:

- wrapper state classes
- dispatch vs passive click wiring
- placeholder vs hidden behavior
- GPS placeholder click swallow behavior
- legacy vs non-legacy color output
- escaped output
- resize signature sensitivity to layout-affecting inputs

## Documentation Updates

Create:

- `documentation/widgets/ais-target.md`

Update:

- `documentation/architecture/cluster-widget-system.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/core-key-catalog.md`
- `ROADMAP.md`

The widget doc must follow the same format used by `documentation/widgets/active-route.md`:

- CSS/state table
- element class table
- mode matrix
- layout ownership note
- fit ownership note
- layering and click ownership note
- regression checklist

## Non-goals

PLAN8 does not include:

- AIS dialog implementation
- AIS action buttons such as track/hide/locate
- new bridge API
- map-centering workflow
- duplication of AvNav page/dialog internals
- visual cloning of AvNav `AisTargetWidget`
- importing AvNav filler geometry or row topology into dyn CSS/HTML

## Acceptance Criteria

1. A new `ais` cluster exists and is bootstrap-loaded.
2. Layouts can instantiate `ais/aisTarget` without missing-kind or missing-module failures.
3. The widget consumes `nav.ais.nearest` and does not reimplement host target selection.
4. `legacy` is supported with default `false`.
5. `flat` shows `frontInitial`, `DST`, and either `TCPA` or `BRG`, with no `nameOrmmsi` and no `DCPA`.
6. `normal` and `high` show the richer AIS summary field set, but through dyn identity-band/tile layouts rather than AvNav row cloning.
7. `tcpa > 0` is the sole branch rule for `DCPA/TCPA` versus `BRG`.
8. The `BRG` branch does not allocate a dummy filler tile just to mirror AvNav spacing.
9. Non-legacy mode uses a local dyn accent element instead of full-background tint.
10. Legacy mode tints the wrapper and suppresses the local accent element.
11. Color precedence matches AvNav warning/nearest/tracking/normal semantics.
12. Placeholder behavior is `gpspage` + editing only; otherwise no-valid-MMSI collapses to hidden.
13. On supported pages with valid MMSI, the widget owns the full click surface and dispatches through `hostActions.ais.showInfo(mmsi)`.
14. On GPS placeholder-without-MMSI, the widget swallows the click to prevent host fallthrough.
15. Editing mode is always passive.
16. Widget-local CSS does not override dyn host shell/root ownership.
17. Layout and fit ownership are separated into shared modules.
18. Docs follow the dyn HTML widget visual contract format.
19. Tests pin mode topology, branch switching, placeholder policy, interaction wiring, and no-filler dyn layout behavior.
20. `ROADMAP.md` marks `AisTarget` as covered.

## Related

- `viewer/components/AisTargetWidget.jsx` in AvNav
- `viewer/nav/aisformatter.jsx` in AvNav
- `viewer/nav/aisdata.js` in AvNav
- `viewer/gui/NavPage.jsx` in AvNav
- `viewer/gui/GpsPage.jsx` in AvNav
- `viewer/util/propertyhandler.js` in AvNav
- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` in dyninstruments
- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css` in dyninstruments
- `shared/widget-kits/nav/ActiveRouteLayout.js` in dyninstruments
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js` in dyninstruments
- `documentation/widgets/active-route.md` in dyninstruments
- `documentation/shared/html-widget-visual-style-guide.md` in dyninstruments
- `documentation/guides/add-new-html-kind.md` in dyninstruments
- `ROADMAP.md` in dyninstruments