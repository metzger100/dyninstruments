# PLAN8 — AIS Target Summary Widget (`ais/aisTarget`)

## Status

This plan is written from direct inspection of the current AvNav AIS target implementation and the current dyninstruments HTML widget stack.

It targets **functional and informational parity for the active-target summary state** of AvNav `AisTargetWidget`, while making **dyninstruments** the sole source of truth for:

- HTML widget architecture
- wrapper/class contracts
- mode switching and responsive layout
- layout ownership and fit ownership
- click-capture style and named-handler wiring
- widget-local CSS scope
- documentation and regression structure

Throughout this plan, `ais/aisTarget` is documentation shorthand for the tuple:

- `cluster: "ais"`
- `kind: "aisTarget"`

Layouts and tests must use the actual `cluster` + `kind` fields used by the current dyninstruments system.

## Goal

Add a new native HTML widget kind `aisTarget` in a new `ais` cluster.

Expected outcome:

- dyninstruments ships a new `ais` cluster
- layouts can instantiate the widget with `cluster: "ais"` and `kind: "aisTarget"`
- the widget reproduces the current AvNav active-target summary role and click-entry behavior
- the widget follows current dyninstruments HTML widget conventions, using `activeRoute`, `editRoute`, and `routePoints` as the live reference set
- the widget does **not** copy AvNav’s internal widget-body DOM structure, filler geometry, class names, or CSS concepts

## Scope Boundary

This plan preserves AvNav parity for the **active summary contract**:

- which target is summarized
- which values are shown
- the exact `tcpa > 0` branch rule
- `nameOrMmsi` derivation
- `frontText` derivation from `passFront`
- color-role precedence
- widget-owned click entry into the host AIS info workflow

This plan does **not** require parity for AvNav’s internal widget-body layout, filler cells, or page-specific dialog wrappers.

This plan also defines a dyn-specific placeholder presentation for the no-target case. That placeholder is a dyn contract, not an AvNav visual parity requirement.

## Repo-grounded Findings

### AvNav behavior that must be preserved

1. The summarized target comes from `nav.ais.nearest`; target selection is already resolved in `viewer/nav/aisdata.js` and must not be reimplemented in dyninstruments.
2. Current target precedence in `viewer/nav/aisdata.js` is:
  - warning target first
  - tracked target second
  - nearest flagged target third
3. `viewer/components/AisTargetWidget.jsx` is a click-entry widget. It emits click context containing `mmsi`; the page owns the actual AIS info workflow.
4. `viewer/gui/NavPage.jsx` and `viewer/gui/GpsPage.jsx` both dispatch into the host AIS info flow, but they do not wrap it identically:
  - `NavPage` opens `GuardedAisDialog` around `AisInfoWithFunctions`
  - `GpsPage` opens `AisInfoWithFunctions` directly
    Therefore dyninstruments must match workflow-entry behavior, not clone page wrapper structure.
5. Compact AvNav mode shows:
  - `frontInitial`
  - `DST`
  - either `TCPA` or `BRG`
  - optional local color badge in non-legacy mode
6. Full AvNav mode shows:
  - `DST`
  - `nameOrMmsi`
  - `frontText`
  - either `DCPA` + `TCPA`, or `BRG`
7. The branch rule is exact in `viewer/components/AisTargetWidget.jsx`:
  - `tcpa > 0` -> show `DCPA` and `TCPA`
  - otherwise -> show `BRG`
8. The current AvNav formatter behavior in `viewer/nav/aisformatter.jsx` is:
  - `nameOrmmsi`: AtoN name when `type == 21` and usable, else ship name, else MMSI
  - `passFront`: `Front`, `Back`, `Pass`, `Done`, or `-`
9. `legacy` is a real editable in `viewer/components/AisTargetWidget.jsx` and defaults to `false`.
10. Current AvNav color precedence in `viewer/util/propertyhandler.js` is:
  - warning
  - nearest
  - tracking
  - normal
11. AvNav renders the widget body when `target.mmsi !== undefined`, or on GPS page, or in layout editing. Otherwise it returns `null`.
12. AvNav’s body structure includes widget-specific classes and filler geometry such as `AisSmallDisplay`, `AisFullDisplay`, `aisPart`, and a blank filler cell in the `BRG` branch. Those structures are not dyninstruments contracts and must not be imported.

### dyninstruments conventions that must shape the widget

1. Native HTML routing is governed by `cluster/rendering/ClusterKindCatalog.js` and `cluster/rendering/ClusterRendererRouter.js`.
2. Current native HTML reference widgets are:
  - `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`
  - `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`
  - `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`
3. `documentation/widgets/active-route.md` is the canonical simple HTML-kind reference, but `editRoute` and `routePoints` are also current live references for grouped payloads, renderer-side render-model ownership, and page-aware interaction.
4. Current dyn HTML mode selection is `high` / `normal` / `flat`, using ratio thresholds with defaults `1.2` and `3.8`.
5. Current dyn HTML widgets use additive wrapper state classes such as:
  - `dyni-active-route-mode-high`
  - `dyni-edit-route-open-passive`
  - `dyni-route-points-mode-flat`
6. Current dyn HTML widgets separate:
  - viewmodel-owned domain normalization
  - mapper-owned renderer payload composition
  - renderer-side render-model ownership for page/editing/capability policy when needed
  - layout owner geometry
  - fit owner text measurement and font sizing
7. Current dyn interaction style uses `onclick="catchAll"` only when the widget intentionally owns empty-space clicks.
8. `runtime/TemporaryHostActionBridge.js` already exposes `hostActions.ais.showInfo(mmsi)` and reports dispatch support on `navpage` and `gpspage`.
9. Widget-local CSS is not allowed to take over shell/root ownership. That boundary is documented in `documentation/shared/html-widget-visual-style-guide.md`.

## Product Direction

`aisTarget` is a dyninstruments widget with AvNav active-summary parity.

That means:

- preserve AvNav data semantics
- preserve AvNav workflow-entry semantics
- use current dyninstruments HTML architecture and styling language
- do **not** preserve AvNav row topology
- do **not** preserve AvNav filler cells or blank alignment slots
- do **not** preserve AvNav class names such as `aisPart`, `AisSmallDisplay`, or `AisFullDisplay`
- do **not** create a widget-local shell contract that overrides dyn shell ownership

## Architecture

### Cluster and tuple

Create a new cluster config:

- `config/clusters/ais.js`

Add a new route tuple:

```javascript
{ cluster: "ais", kind: "aisTarget", viewModelId: "AisTargetViewModel", rendererId: "AisTargetTextHtmlWidget", surface: "html" }
```

Rationale:

- AIS target semantics are not route-summary semantics
- source keys and color roles are AIS-specific
- `ROADMAP.md` already anticipates AIS coverage
- future AIS widgets should live in the same cluster

### Implementation pattern

Follow the current dyn HTML split used by `editRoute` and `routePoints`:

- domain normalization in a shared viewmodel
- renderer-facing grouped payload from the mapper
- renderer-side render model for page/editing/capability policy
- shared layout owner
- shared fit owner
- shared markup owner
- HTML shell renderer plus CSS

Required modules:

- `config/clusters/ais.js`
- `cluster/viewmodels/AisTargetViewModel.js`
- `cluster/mappers/AisMapper.js`
- `shared/widget-kits/ais/AisTargetRenderModel.js`
- `shared/widget-kits/ais/AisTargetLayout.js`
- `shared/widget-kits/ais/AisTargetHtmlFit.js`
- `shared/widget-kits/ais/AisTargetMarkup.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`

Required registration touchpoints:

- `plugin.js`
- `config/components/registry-cluster.js`
- `config/components/registry-shared-foundation.js`
- `config/components/registry-widgets.js`
- `cluster/mappers/ClusterMapperRegistry.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/rendering/ClusterRendererRouter.js`

No change to `config/shared/kind-defaults.js` is required for PLAN8 because labels and units are widget-owned and fixed in the first version.

### Ownership split

#### `AisTargetViewModel`

Owns only domain normalization and parity-derived data.

It must **not** own page-aware render policy, editing policy, or host capability policy.

Required outputs:

- `mmsiRaw`
- `mmsiNormalized`
- `hasTargetIdentity`
- `hasDispatchMmsi`
- `distance`
- `cpa`
- `tcpa`
- `headingTo`
- `nameOrMmsi`
- `frontText`
- `frontInitial`
- `showTcpaBranch`
- `warning`
- `nextWarning`
- `nearest`
- `trackedMatch`
- `colorRole`
- `hasColorRole`

#### `AisMapper`

Owns mapper routing and grouped renderer payload composition.

Recommended output shape:

```javascript
{
  renderer: "AisTargetTextHtmlWidget",
  domain: { ... },
  layout: { ... },
  appearance: { ... },
  labels: { ... },
  units: { ... },
  default: "---"
}
```

#### `AisTargetRenderModel`

Owns renderer-facing behavior that depends on current runtime context rather than raw AIS domain data.

Required responsibilities:

- page-aware render state (`data`, `placeholder`, `hidden`)
- layout-editing gating via `HtmlWidgetUtils.isEditingMode(props)`
- capability gating via `hostActions.getCapabilities()`
- dispatch vs capture-only vs passive interaction mode
- placeholder policy
- wrapper class/state selection inputs
- resize-signature inputs

#### `AisTargetLayout`

Owns:

- mode-specific geometry
- branch-aware metric arrangement
- placeholder geometry
- compact identity-band and metric-rail arrangement

#### `AisTargetHtmlFit`

Owns:

- text measurement
- mode-aware font sizing for identity, metric values, units, and front text
- inline style output only

#### `AisTargetMarkup`

Owns:

- escaped HTML assembly
- wrapper/class contract
- hotspot markup
- renderer-applied inline style attributes from fit output

#### `AisTargetTextHtmlWidget`

Owns the HTML surface shell contract:

- `renderHtml`
- `namedHandlers`
- `resizeSignature`
- optional `initFunction` if committed DOM facts are needed for a corrective rerender

## Cluster Config Contract

`config/clusters/ais.js` must register a `ClusterWidget` cluster with:

- `cluster: "ais"`
- a `kind` editable containing at least `aisTarget`
- AIS source store keys
- widget-specific editables only

Required store keys:

- `target: "nav.ais.nearest"`
- `trackedMmsi: "nav.ais.trackedMmsi"`
- `aisMarkAllWarning: "properties.aisMarkAllWarning"`
- `aisWarningColor: "properties.style.aisWarningColor"`
- `aisNearestColor: "properties.style.aisNearestColor"`
- `aisTrackingColor: "properties.style.aisTrackingColor"`
- `aisNormalColor: "properties.style.aisNormalColor"`

Required editables:

- `kind`
- `legacy`
- `aisTargetRatioThresholdNormal`
- `aisTargetRatioThresholdFlat`
- `className`

The generic text-widget editables `caption`, `unit`, `formatter`, and `formatterParameters` must stay disabled for this kind because the HTML body owns the metric labels and unit strings.

## Functional Contract

### Target source

The widget must consume the host-selected target from `nav.ais.nearest`.

It must not reimplement warning/nearest/tracking target selection.

### Identity and dispatch gating

Use two distinct identity states:

- `hasTargetIdentity` -> `target.mmsi !== undefined`
- `hasDispatchMmsi` -> normalized MMSI is a non-empty dispatch-safe string

`hasTargetIdentity` controls whether the widget is in active-data state.

`hasDispatchMmsi` controls click dispatch and tracking-match checks.

### MMSI normalization

Normalization rules for dispatch and tracked-match checks:

- finite number -> decimal string
- non-empty trimmed string -> trimmed string
- anything else -> invalid dispatch MMSI

No dispatch may occur without `hasDispatchMmsi === true`.

### Derived values

#### `nameOrMmsi`

Must match current AvNav formatter behavior from `viewer/nav/aisformatter.jsx`:

1. AtoN `name` when `type == 21` and usable
2. otherwise `shipname` when usable
3. otherwise MMSI

#### `frontText`

Must match current AvNav `passFront` formatter behavior:

- `-` when `cpa` is absent/falsy
- `Front` when `passFront > 0`
- `Back` when `passFront < 0`
- `Pass` when `passFront === 0`
- `Done` when `cpa` exists but `passFront` is absent

#### `frontInitial`

Must be the first character of `frontText` when `frontText` is non-empty; otherwise `-`.

### Branch rule

This rule is exact and must be used consistently in viewmodel output, render model, layout, markup, resize signature, and tests:

- `tcpa > 0` -> show `DCPA` and `TCPA`
- otherwise -> show `BRG`

### Formatting parity

Rendered values must match current AvNav display semantics for the active-target state.

Required fields:

- `distance` -> caption `DST`, unit `nm`, distance formatting parity with AvNav
- `cpa` -> caption `DCPA`, unit `nm`, distance formatting parity with AvNav
- `tcpa` -> caption `TCPA`, unit `min`, same minute conversion/display semantics as current AvNav `aisformatter.jsx`
- `headingTo` -> caption `BRG`, unit `°`, direction-formatting parity with AvNav
- `nameOrMmsi`
- `frontText`

For PLAN8, labels and units are fixed widget-owned strings:

- `DST`
- `DCPA`
- `TCPA`
- `BRG`
- `nm`
- `min`
- `°`

### Color-role precedence

Color role must match current AvNav semantics exactly:

1. `warning` when `(warning && aisMarkAllWarning) || nextWarning`
2. else `nearest` when `nearest`
3. else `tracking` when `trackedMatch`
4. else `normal` when color is applicable
5. else no color role

Color is applicable only when a usable target MMSI exists for color treatment, matching current AvNav behavior.

### `legacy`

`legacy` is required and defaults to `false`.

Behavior:

- `legacy === false`:
  - keep wrapper visually neutral
  - show a local dyn-specific accent element when color exists
- `legacy === true`:
  - tint the wrapper using the resolved AIS color
  - suppress the local accent element

This preserves the functional legacy split from AvNav without copying AvNav body geometry.

## Render-State Contract

Render state is renderer-side policy owned by `AisTargetRenderModel`.

States:

- `data`
- `placeholder`
- `hidden`

Rules:

- `data` when `hasTargetIdentity === true`
- `placeholder` when `hasTargetIdentity === false` and either:
  - current page is `gpspage`, or
  - layout editing is active
- `hidden` otherwise

### Placeholder contract

Placeholder presentation is a dyn-specific contract.

Required behavior:

- fixed centered placeholder text: `No AIS`
- no fake metric tiles
- no fake units
- no active color accent
- no claim of AvNav visual parity for the placeholder body

## Interaction Contract

### Workflow ownership

The widget owns summary display and click capture.

The host owns the actual AIS info workflow.

Dispatch target:

- `hostActions.ais.showInfo(mmsi)`

No new bridge API is required.

### Supported pages

Current dispatch-capable host pages are determined by `hostActions.getCapabilities()` and currently correspond to:

- `navpage`
- `gpspage`

On other pages, the widget is passive.

### Interaction states

Keep these states distinct:

- `captureClicks`
- `canDispatchShowInfo`

Rules:

- editing mode -> always passive
- if render state is `data` and `hasDispatchMmsi === true` and `ais.showInfo === "dispatch"` -> capture and dispatch
- if render state is `placeholder` on `gpspage` and `ais.showInfo === "dispatch"` -> capture only, swallow click, do not dispatch
- otherwise -> passive

### Click ownership style

Follow the current dyn HTML interaction contract:

- wrapper adds `onclick="catchAll"` only when `captureClicks === true`
- hotspot element exists only when `captureClicks === true`
- hotspot uses a named handler such as `onclick="aisTargetShowInfo"`
- `namedHandlers()` should return the named handler only when capture is active

Handler behavior:

- dispatch state -> call `hostActions.ais.showInfo(mmsiNormalized)`
- capture-only placeholder state -> return `false`
- passive state -> expose no named handler and no hotspot

## Visual Contract

### Visual language

The widget must use current dyninstruments HTML summary language:

- one wrapper block
- one identity band or compact identity cell
- metric tiles using caption + value + unit structure
- optional small local accent element in non-legacy mode
- additive wrapper state classes
- shared theme/font ownership from existing dyn helpers
- dyn-controlled layout and fit ownership with no CSS back-door geometry system

The widget must not attempt to reproduce AvNav `WidgetFrame` internals inside the widget body.

### Required wrapper state classes

- `dyni-ais-target-html`
- `dyni-ais-target-mode-high`
- `dyni-ais-target-mode-normal`
- `dyni-ais-target-mode-flat`
- `dyni-ais-target-data`
- `dyni-ais-target-placeholder`
- `dyni-ais-target-open-dispatch`
- `dyni-ais-target-open-capture`
- `dyni-ais-target-open-passive`
- `dyni-ais-target-branch-tcpa`
- `dyni-ais-target-branch-brg`
- `dyni-ais-target-legacy`
- `dyni-ais-target-local-accent`
- `dyni-ais-target-color-warning`
- `dyni-ais-target-color-nearest`
- `dyni-ais-target-color-tracking`
- `dyni-ais-target-color-normal`

### Required element classes

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

Use the current dyn ratio-mode pattern:

- `aisTargetRatioThresholdNormal = 1.2`
- `aisTargetRatioThresholdFlat = 3.8`

Rule:

- ratio `< normal threshold` -> `high`
- ratio `> flat threshold` -> `flat`
- otherwise -> `normal`

The widget does not introduce an AvNav-specific vertical mode contract.

If committed host ancestry such as `.widgetContainer.vertical` affects final presentation, it must do so through the standard dyn renderer/layout lifecycle rather than by importing foreign layout rules.

### Mode matrix

The field set follows AvNav active-summary parity. The topology follows dyn styling.

#### `flat`

Purpose: one-band compact summary with AvNav compact information density.

Visible content:

- `frontInitial`
- `distance`
- `tcpa` or `headingTo`
- optional local accent when non-legacy and color exists

Hidden in `flat`:

- `nameOrMmsi`
- `cpa`
- full `frontText`

Topology:

- compact leading identity cell for `frontInitial`
- compact metric rail for `DST` and secondary metric
- optional slim accent element

#### `normal`

Purpose: balanced dyn summary widget.

Visible content:

- `nameOrMmsi`
- `frontText`
- `distance`
- `cpa` + `tcpa` when `tcpa > 0`
- `headingTo` when `tcpa <= 0`
- optional local accent when non-legacy and color exists

Topology:

- identity band at top with `nameOrMmsi` and optional accent
- metric grid below
- footer/state row for `frontText`

Branch layouts:

- `tcpa` branch -> `DST`, `DCPA`, `TCPA`
- `BRG` branch -> `DST`, `BRG`

#### `high`

Purpose: narrow stacked version of the same richer information set.

Visible content:

- `nameOrMmsi`
- `frontText`
- `distance`
- `cpa` + `tcpa` when `tcpa > 0`
- `headingTo` when `tcpa <= 0`
- optional local accent when non-legacy and color exists

Topology:

- identity band at top
- stacked metric region for narrow width
- front/state row at bottom

Branch layouts:

- `tcpa` branch -> `DST` plus a secondary row for `DCPA` and `TCPA`
- `BRG` branch -> `DST` plus a full-width `BRG` tile

### Visual anti-goals

The implementation must not ship any of the following:

- AvNav body markup copied from `viewer/components/AisTargetWidget.jsx`
- blank filler cells used only to imitate AvNav spacing
- AvNav class names or DOM naming
- widget-local shell/root CSS takeover
- a second hidden geometry system in CSS

## Layout, Fit, and Markup Contract

### Layout ownership

`AisTargetLayout` owns:

- content rectangles and gaps
- branch-aware tile arrangement
- mode-specific band/grid/rail topology
- placeholder geometry

### Fit ownership

`AisTargetHtmlFit` owns:

- text measurement
- value/unit font-size output
- name/front-text fitting
- mode-aware font-size adjustments

### Markup ownership

`AisTargetMarkup` owns:

- escaped output
- element ordering
- class emission
- inline style application from fit results
- hotspot emission when active

### Explicit fit rules

- metric fields use caption/value/unit markup with inline units
- `nameOrMmsi`, `frontText`, and `frontInitial` are text-only fields and do not allocate unit geometry
- no ghost tiles for hidden fields
- no filler tile in the `BRG` branch
- fitted text uses font-size reduction, not ellipsis mutation of content

## Resize Signature Contract

`resizeSignature` must include all layout-relevant inputs, at minimum:

- resolved mode
- render state
- branch state (`tcpa` vs `brg`)
- `legacy`
- interaction state (`dispatch`, `capture-only`, `passive`)
- rounded shell width
- rounded shell height
- lengths of all visible text strings

The signature must change whenever the visible field set, layout branch, or click-ownership state changes.

## Documentation Contract

Create:

- `documentation/widgets/ais-target.md`

Update:

- `documentation/architecture/cluster-widget-system.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/core-key-catalog.md`
- `ROADMAP.md`

The new widget doc must follow the current dyn HTML widget documentation style used by:

- `documentation/widgets/active-route.md`
- `documentation/widgets/edit-route.md`
- `documentation/widgets/route-points.md`

Required doc sections:

- overview
- ownership split
- module registration
- props / grouped mapper payload
- wrapper state table
- element class table
- mode matrix
- interaction contract
- layout ownership note
- fit ownership note
- regression checklist

## Implementation Phases

### Phase 1 — Cluster, mapper, and kind routing

Create:

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

- `cluster: "ais"`, `kind: "aisTarget"` is a recognized tuple
- mapper output is testable before HTML work lands
- no missing cluster or renderer route failures remain

### Phase 2 — Shared HTML owners and shell renderer

Create:

- `shared/widget-kits/ais/AisTargetRenderModel.js`
- `shared/widget-kits/ais/AisTargetLayout.js`
- `shared/widget-kits/ais/AisTargetHtmlFit.js`
- `shared/widget-kits/ais/AisTargetMarkup.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`

Update:

- `config/components/registry-shared-foundation.js`
- `config/components/registry-widgets.js`

Phase outcome:

- dyn HTML structure exists
- mode classes and branch-aware tile layouts render correctly
- page-aware interaction follows current dyn handler ownership rules

### Phase 3 — Tests and docs

Add or update:

- cluster config tests
- mapper tests
- viewmodel tests
- render-model tests
- layout tests
- fit tests
- markup tests
- renderer tests
- widget documentation
- roadmap coverage

Phase outcome:

- behavior is pinned by automated tests
- visual and interaction contracts are documented
- AIS target coverage is visible in roadmap/docs

## Test Plan

### Cluster config tests

Pin:

- new `ais` cluster registration
- `kind === "aisTarget"` availability
- required store keys
- `legacy` and ratio-threshold editables
- disabled generic text editables

### ViewModel tests

Pin:

- `hasTargetIdentity` vs `hasDispatchMmsi`
- MMSI normalization
- `nameOrMmsi` fallback order
- `frontText` derivation
- `frontInitial` derivation
- exact `tcpa > 0` branch selection
- color-role precedence
- tracked-match normalization behavior

### Mapper tests

Pin:

- `kind === "aisTarget"` renderer selection
- grouped payload shape
- threshold propagation
- `legacy` propagation
- fixed labels and units

### Render-model tests

Pin:

- `data` / `placeholder` / `hidden` render-state rules
- supported-page dispatch gating
- GPS placeholder capture-only behavior
- editing-mode passive behavior
- wrapper state selection inputs
- resize-signature parts

### Layout/Fit tests

Pin:

- `high` / `normal` / `flat` topology
- `flat` omission of `nameOrMmsi` and `DCPA`
- `BRG` branch has no filler tile
- text-only fields have no unit geometry
- placeholder geometry has no ghost tiles

### Markup tests

Pin:

- required wrapper state classes
- required element classes
- hotspot emission only in capture states
- escaped output
- legacy vs non-legacy markup differences

### Renderer tests

Pin:

- dispatch mode emits `catchAll`, hotspot, and named handler
- capture-only placeholder mode swallows click without dispatch
- passive mode emits no hotspot and no named handler
- supported pages dispatch through `hostActions.ais.showInfo(mmsi)`
- unsupported pages remain passive
- resize signature changes on field-set and interaction-state changes

## Non-goals

PLAN8 does not include:

- AIS dialog implementation
- AIS control buttons such as track, hide, locate, or center-on-map
- new host bridge APIs
- reproduction of page-specific dialog wrappers
- import of AvNav filler geometry
- visual cloning of AvNav `AisTargetWidget`
- per-field editable label or unit customization in the first version

## Acceptance Criteria

1. A new `ais` cluster exists and is bootstrap-loaded.
2. Layouts can instantiate the widget using `cluster: "ais"` and `kind: "aisTarget"`.
3. `ClusterKindCatalog` contains the strict tuple for `ais/aisTarget` with `surface: "html"`.
4. The widget consumes `nav.ais.nearest` and does not reimplement target selection.
5. Active-summary field content matches current AvNav behavior for:
  - `nameOrMmsi`
  - `frontText`
  - `frontInitial`
  - `DST`
  - `DCPA`
  - `TCPA`
  - `BRG`
6. `tcpa > 0` is the only branch rule for `DCPA/TCPA` versus `BRG`.
7. `flat` shows `frontInitial`, `DST`, and either `TCPA` or `BRG`, with no `nameOrMmsi` and no `DCPA`.
8. `normal` and `high` show the richer AIS summary field set through dyn identity-band/tile layouts.
9. The `BRG` branch contains no dummy filler tile.
10. `legacy` defaults to `false` and is fully supported.
11. Non-legacy mode uses a local dyn accent element when color exists.
12. Legacy mode tints the wrapper and suppresses the local accent element.
13. Color precedence matches AvNav warning/nearest/tracking/normal semantics.
14. Render state follows:
  - `data` when a target identity exists
  - `placeholder` on GPS or in layout editing when no target identity exists
  - `hidden` otherwise
15. Placeholder presentation is dyn-owned and explicitly not an AvNav body clone.
16. On supported pages with valid dispatch MMSI, the widget owns the click surface and dispatches through `hostActions.ais.showInfo(mmsi)`.
17. On GPS placeholder-without-dispatch-MMSI, the widget captures and swallows the click to prevent host fallthrough.
18. Editing mode is always passive.
19. Widget-local CSS does not override dyn shell/root ownership.
20. Layout, fit, render-model, and markup ownership are separated into shared modules.
21. Docs follow the current dyn HTML widget documentation format.
22. Tests pin field parity, branch switching, render-state policy, interaction wiring, and no-filler layout behavior.
23. `ROADMAP.md` marks AIS target coverage.

## Related

AvNav:

- `viewer/components/AisTargetWidget.jsx`
- `viewer/nav/aisformatter.jsx`
- `viewer/nav/aisdata.js`
- `viewer/gui/NavPage.jsx`
- `viewer/gui/GpsPage.jsx`
- `viewer/util/propertyhandler.js`

Dyninstruments:

- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`
- `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`
- `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`
- `shared/widget-kits/nav/ActiveRouteLayout.js`
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js`
- `shared/widget-kits/nav/EditRouteRenderModel.js`
- `shared/widget-kits/nav/RoutePointsRenderModel.js`
- `documentation/widgets/active-route.md`
- `documentation/widgets/edit-route.md`
- `documentation/widgets/route-points.md`
- `documentation/shared/html-widget-visual-style-guide.md`
- `documentation/guides/add-new-html-kind.md`
- `runtime/TemporaryHostActionBridge.js`
- `ROADMAP.md`