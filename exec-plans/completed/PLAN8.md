# PLAN8 — AIS Target Summary Widget (`map/aisTarget`)

## Status

Written after repository verification and code-trace review of both the core AvNav AIS summary flow and the dyninstruments HTML-widget architecture.

This plan is code-grounded against the verified sources named below. It keeps the same rigor level as the existing native HTML plans, but narrows the parity target to the AIS summary widget itself. The plan separates three concerns that the code already separates:

1. **core AIS summary behavior** (`viewer/components/AisTargetWidget.jsx`, `viewer/nav/aisformatter.jsx`, `viewer/util/propertyhandler.js`)
2. **host page AIS info workflow** (`viewer/gui/NavPage.jsx`, `viewer/gui/GpsPage.jsx`)
3. **dyn host-bridge dispatch constraints** (`runtime/TemporaryHostActionBridge.js`)

The coding agent may choose equivalent rendering mechanics where appropriate, but the data contract, render-state policy, interaction boundary, parity split, and documentation/test outcomes below are explicit plan contracts.

---

## Goal

Add a new native HTML kind `aisTarget` to the existing `map` cluster that reproduces the **core AIS target widget’s summary role and workflow-entry role** at native dyninstruments quality, while keeping all detailed AIS actions and dialogs host-owned.

Expected outcomes after completion:

- A new `AisTargetTextHtmlWidget` renders a compact summary of the host-selected AIS target from `nav.ais.nearest`.
  
- The widget preserves the core summary data model for the displayed fields:
  
  - `nameOrMmsi`
  - `frontText` and `frontInitial`
  - `distance`
  - `cpa` and `tcpa` when `tcpa > 0`
  - `headingTo` when `tcpa <= 0`
  - warning / nearest / tracking / normal state-role derivation
- The widget preserves the core summary formatting semantics by using the same formatter rules as AvNav for:
  
  - `distance`
  - `cpa`
  - `tcpa`
  - `headingTo`
- The core density split is preserved through dyn mode mapping:
  
  - `flat` = horizontal-equivalent density
  - `normal` and `high` = non-horizontal-equivalent density
  - committed `.widgetContainer.vertical` forces `high`
- The widget remains a **summary/workflow-entry widget only**. It does **not** embed track/hide/center/locate buttons, dialog controls, or inline AIS actions.
  
- Clicking the widget opens the host AIS information workflow **only** when the host bridge reports `ais.showInfo === "dispatch"`; today that means `navpage` and `gpspage`.
  
- On unsupported or passive contexts, the widget stays passive and does not steal clicks.
  
- In layout-editing mode, the widget is always passive.
  
- The native HTML implementation follows the same architectural layering already used for complex dyn HTML widgets: viewmodel → mapper → kind catalog/router → HTML shell → shared render-model/layout/fit/markup helpers.
  
- Documentation and regression coverage make the parity boundary explicit: **summary-widget parity** is required, but **dialog/action parity** remains host-owned.
  

---

## Verified Baseline

The following points were rechecked against the repositories before this plan was written.

1. **Core `AisTargetWidget` is a summary widget with workflow-entry click behavior.**
  `viewer/components/AisTargetWidget.jsx` renders only summary content inside `WidgetFrame` and forwards clicks through `props.onClick(...)` with the target MMSI attached.
  
2. **Core `AisTargetWidget` reads the selected target from `nav.ais.nearest`.**
  `AisTargetWidget.storeKeys` binds `target: keys.nav.ais.nearest` and `trackedMmsi: keys.nav.ais.trackedMmsi`.
  
3. **Core render gating is `target.mmsi !== undefined || props.mode === "gps" || props.isEditing`.**
  When none of those conditions are true, the core widget returns `null`.
  
4. **Core density split is only horizontal vs non-horizontal.**
  `props.mode === "horizontal"` selects the small layout; all other modes use the full layout. There is no separate core field contract for “normal” vs “high”.
  
5. **Core branch selection is `target.tcpa > 0`.**
  In both the small and full layouts, `tcpa > 0` shows `TCPA` and, in the full layout, also `DCPA`; otherwise the widget shows `headingTo` / `BRG`.
  
6. **Core small-layout fields are exactly: front initial, `DST`, and either `TCPA` or `BRG`.**
  The small layout does not render `name` or `DCPA`.
  
7. **Core full-layout fields are exactly: `DST`, `name`, branch-specific secondary metric(s), and full `frontText`.**
  In the `BRG` branch, the second column is an empty filler cell in the core React markup.
  
8. **Core derived text comes from `AisFormatter`.**
  `nameOrmmsi` prefers AtoN `name`, then `shipname`, then MMSI. `passFront` returns `-`, `Front`, `Back`, `Pass`, or `Done` by rule.
  
9. **Core numeric formatting is explicit and stable.**
  `AisFormatter` uses `Formatter.formatDistance(...)` for `distance` and `cpa`, `Formatter.formatDirection(...)` for `headingTo`, and `Formatter.formatDecimal(v.tcpa / 60, 3, Math.abs(v.tcpa) > 60 ? 0 : 2)` for `tcpa`.
  
10. **Core color-role precedence is defined in `PropertyHandler.getAisColor`.**
  The order is: warning when `(warning && aisMarkAllWarning) || nextWarning`, else nearest, else tracked by raw MMSI equality, else normal.
  
11. **Core tracking-color selection uses raw equality, not normalized dispatch equality.**
  `PropertyHandler.getAisColor` compares `currentObject.mmsi === globalStore.getData(keys.nav.ais.trackedMmsi)`.
  
12. **The current dyn bridge already exposes the needed host action and capability snapshot.**
  `runtime/TemporaryHostActionBridge.js` exposes `hostActions.ais.showInfo(mmsi)` and a capability snapshot with `pageId` plus `ais.showInfo` state.
  
13. **Current bridge dispatch support for AIS is page-limited.**
  `ais.showInfo` is `dispatch` on `navpage` and `gpspage`, and `unsupported` elsewhere.
  
14. **Bridge MMSI normalization is already defined.**
  `TemporaryHostActionBridge.normalizeMmsi(...)` accepts finite numbers by truncating them to string form and accepts non-empty trimmed strings.
  
15. **Bridge dispatch path for AIS is already page-item-click based.**
  `hostActions.ais.showInfo(mmsi)` dispatches a synthetic page click with `item: { name: "AisTarget" }` and the normalized `mmsi`.
  
16. **Host page AIS info workflow is page-owned.**
  `viewer/gui/NavPage.jsx` and `viewer/gui/GpsPage.jsx` already react to `item.name === "AisTarget"` and open the host AIS info flow.
  
17. **The dyn `map` cluster does not expose an AIS summary kind today.**
  `config/clusters/map.js` currently offers only `centerDisplay` and `zoom`.
  
18. **No native `map/aisTarget` tuple exists today.**
  There is no `aisTarget` tuple in `cluster/rendering/ClusterKindCatalog.js`, no `MapMapper` routing branch for it, and no native AIS HTML widget registered in the dyn widget registries.
  

---

## Scope

This plan covers the AIS target summary widget only.

### Included

- target summary display
- target-derived text and numeric fields
- color-role and state-role derivation
- page-aware render-state handling where page identity is available from host capabilities
- placeholder and hidden-state behavior
- explicit vertical-container lifecycle handling for native HTML rendering
- map-cluster registration, mapper routing, renderer structure, tests, theme-token wiring, and documentation

### Excluded

- AIS dialog implementation
- AIS control buttons such as track, hide, center, or locate
- host bridge API changes
- reuse of AvNav widget-body DOM, class names, filler geometry, or CSS topology
- intrinsic-height list growth or scrolling behavior
- legacy wrapper-tint mode

---

## Source Anchors

### AvNav source anchors

- `viewer/components/AisTargetWidget.jsx`
- `viewer/nav/aisformatter.jsx`
- `viewer/nav/aisdata.js`
- `viewer/util/formatter.js`
- `viewer/util/propertyhandler.js`
- `viewer/gui/NavPage.jsx`
- `viewer/gui/GpsPage.jsx`

### dyninstruments source anchors

- `plugin.js`
- `config/clusters/map.js`
- `config/components/registry-cluster.js`
- `config/components/registry-shared-foundation.js`
- `config/components/registry-widgets.js`
- `config/shared/editable-param-utils.js`
- `config/shared/kind-defaults.js`
- `cluster/mappers/MapMapper.js`
- `cluster/mappers/ClusterMapperToolkit.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `runtime/TemporaryHostActionBridge.js`
- `shared/theme/ThemeResolver.js`
- `shared/widget-kits/html/HtmlWidgetUtils.js`
- `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`
- `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`
- `documentation/guides/add-new-html-kind.md`
- `documentation/shared/theme-tokens.md`
- `documentation/widgets/edit-route.md`
- `documentation/widgets/route-points.md`
- `ROADMAP.md`

---

## Concept Specification

This section is the authoritative layout and behavior specification for `map/aisTarget`.

### Exposed settings

#### `aisTargetRatioThresholdNormal`

- type: `FLOAT`
- default: `1.2`
- internal: `true`

#### `aisTargetRatioThresholdFlat`

- type: `FLOAT`
- default: `3.8`
- internal: `true`

Behavior:

- ratio `< normal threshold` → `high`
- ratio `> flat threshold` → `flat`
- otherwise → `normal`
- committed `.widgetContainer.vertical` forces `high`

These thresholds are layout controls only. They do not change the data contract.

### Tuple contract

`map/aisTarget` means the strict tuple:

```javascript
{ cluster: "map", kind: "aisTarget", viewModelId: "AisTargetViewModel", rendererId: "AisTargetTextHtmlWidget", surface: "html" }
```

### Cluster config contract

`config/clusters/map.js` must continue to register a single `ClusterWidget` cluster with `cluster: "map"`.

Required changes:

- add `aisTarget` to the existing `kind` editable list
- keep generic single-value text-body editables disabled:
  - `caption: false`
  - `unit: false`
  - `formatter: false`
  - `formatterParameters: false`
- keep `className: true`
- add internal editables:
  - `aisTargetRatioThresholdNormal`
  - `aisTargetRatioThresholdFlat`

Required map-cluster store keys:

- `target: "nav.ais.nearest"`
- `trackedMmsi: "nav.ais.trackedMmsi"`
- `aisMarkAllWarning: "properties.aisMarkAllWarning"`

Do not add AvNav style color properties as widget store keys.

### Per-metric captions and units

The widget must use per-kind text defaults through `MAP_KIND` plus `makePerKindTextParams(MAP_KIND)`.

Required `MAP_KIND` entries:

- `aisTargetDst`
- `aisTargetCpa`
- `aisTargetTcpa`
- `aisTargetBrg`

Required first-version defaults:

- `aisTargetDst` → caption `DST`, unit `nm`
- `aisTargetCpa` → caption `DCPA`, unit `nm`
- `aisTargetTcpa` → caption `TCPA`, unit `min`
- `aisTargetBrg` → caption `BRG`, unit `°`

The widget body does not use the generic single `caption` / `unit` editables.

### Required modules

Create:

- `cluster/viewmodels/AisTargetViewModel.js`
- `shared/widget-kits/nav/AisTargetRenderModel.js`
- `shared/widget-kits/nav/AisTargetLayout.js`
- `shared/widget-kits/nav/AisTargetHtmlFit.js`
- `shared/widget-kits/nav/AisTargetMarkup.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`

Do not introduce:

- `config/clusters/ais.js`
- `cluster/mappers/AisMapper.js`
- `shared/widget-kits/nav/AisTargetDomEffects.js`

A separate DOM-effects module is not part of this plan. The renderer shell owns the single corrective rerender needed for committed vertical-container facts.

### Registry contract

#### `config/components/registry-cluster.js`

Add:

- `AisTargetViewModel`

Update:

- `MapMapper.deps` to include `AisTargetViewModel`
- `ClusterRendererRouter.deps` to include `AisTargetTextHtmlWidget`

Do not add a separate AIS cluster registration.

#### `config/components/registry-shared-foundation.js`

Add:

- `AisTargetLayout`
- `AisTargetHtmlFit`

`AisTargetHtmlFit` must depend on:

- `ThemeResolver`
- `RadialTextLayout`
- `TextTileLayout`
- `AisTargetLayout`
- `HtmlWidgetUtils`

#### `config/components/registry-widgets.js`

Add:

- `AisTargetRenderModel`
- `AisTargetMarkup`
- `AisTargetTextHtmlWidget`

`AisTargetRenderModel` must depend on:

- `AisTargetLayout`
- `HtmlWidgetUtils`

`AisTargetTextHtmlWidget` must depend on:

- `AisTargetHtmlFit`
- `HtmlWidgetUtils`
- `AisTargetRenderModel`
- `AisTargetMarkup`

#### `cluster/rendering/ClusterKindCatalog.js`

Add the strict `map/aisTarget` tuple with `surface: "html"`.

#### `cluster/rendering/ClusterRendererRouter.js`

Add:

- `AisTargetTextHtmlWidget: Helpers.getModule("AisTargetTextHtmlWidget").create(def, Helpers)`

No renderer-props forwarding shim is part of this plan.

---

## Architecture Notes

### Ownership split

The intended split follows the dyn complex-HTML pattern already used by `editRoute` and `routePoints`:

- mapper produces declarative renderer payload
- viewmodel normalizes domain inputs
- render model resolves visible fields, render state, interaction state, and formatted display strings
- layout owns geometry
- fit owns text measurement and style-only fit decisions
- markup owns escaped HTML assembly
- shell renderer owns lifecycle entrypoints, committed-DOM detection, and named-handler wiring

### `AisTargetViewModel`

`AisTargetViewModel` owns domain normalization and AvNav-parity derived fields only.

It must not own:

- page-aware render-state policy
- dispatch policy
- text formatting through `Helpers.applyFormatter`
- theme-token resolution
- DOM concerns
- committed vertical-container detection

Required outputs:

- `mmsiRaw`
- `mmsiNormalized`
- `trackedMmsiRaw`
- `hasTargetIdentity`
- `hasDispatchMmsi`
- `hasColorMmsi`
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

### `MapMapper`

`MapMapper` owns kind routing for the `map` cluster and declarative renderer payload composition for `aisTarget`.

Required payload shape:

```javascript
{
  renderer: "AisTargetTextHtmlWidget",
  domain: { ... },
  layout: { ... },
  captions: { ... },
  units: { ... },
  default: "---"
}
```

Rules:

- `domain` comes from `AisTargetViewModel`
- `captions` and `units` come from `ClusterMapperToolkit` and therefore from editable defaults or user overrides
- the payload stays declarative
- the mapper does not build HTML and does not format visible strings

### Shared AIS normalization: keep scope contained

This plan should **not** widen into a broad shared AIS-domain refactor across unrelated widgets.

Reason:

- the new widget needs only a summary-specific subset of AIS state
- the bridge, mapper, and renderer already provide clear ownership boundaries
- broad “common AIS utility” refactors would expand risk without changing user-visible behavior in the first implementation

This plan therefore adds a dedicated `AisTargetViewModel` and keeps normalization self-contained.

### Core parity split

The following matrix is the authoritative parity boundary.

| Concern | Core behavior (verified) | PLAN8 parity target | Host-owned / out of scope |
| --- | --- | --- | --- |
| target source | `AisTargetWidget.storeKeys.target = nav.ais.nearest` | use `nav.ais.nearest` exactly | none |
| tracked-MMSI comparison | raw equality in `PropertyHandler.getAisColor` | same raw-equality rule for tracked state | none |
| name fallback | AtoN `name` → `shipname` → MMSI | same exact order | none |
| front-text derivation | `-` / `Front` / `Back` / `Pass` / `Done` from `AisFormatter.passFront` | same exact rule | none |
| numeric formatting | `formatDistance`, `formatDirection`, `formatDecimal` with AIS-specific parameters | same formatter semantics | none |
| branch rule | `tcpa > 0` selects `DCPA/TCPA`, else `BRG` | same exact rule | none |
| density split | horizontal vs non-horizontal only | `flat` = horizontal-equivalent, `normal/high` = non-horizontal-equivalent | no separate core “high” layout exists |
| small-layout visible fields | front initial + `DST` + `TCPA` or `BRG` | same visible field set in `flat` | none |
| full-layout visible fields | `DST`, `name`, branch-specific secondaries, full front text | same content set in `normal/high` through dyn-owned topology | none |
| full-layout filler cell | blank filler cell in `BRG` branch | no filler cell; dyn-owned layout may omit ghost geometry | filler geometry is not a parity target |
| color precedence | warning → nearest → tracking → normal | same state precedence | concrete colors are dyn theme-owned |
| color sources | AvNav style properties | use theme tokens instead of AvNav style-property reads | AvNav style-property wiring |
| no-target visibility | render on GPS mode or layout editing; otherwise null | `placeholder` on `gpspage` or layout editing, `hidden` otherwise | exact core body-empty rendering is not required |
| click role | summary widget forwards click with MMSI | full-surface workflow-entry click only when dispatch-capable | no inline AIS controls |
| AIS detail actions | page/dialog owned | do not embed | host-owned |

### Interaction chain to preserve

The native widget must enter the **host** workflow, not recreate it.

Required dispatch chain:

1. widget full-surface click
2. `hostActions.ais.showInfo(mmsi)`
3. `TemporaryHostActionBridge` dispatches synthetic `{ item: { name: "AisTarget" }, mmsi }`
4. host page `onItemClick` / `widgetClick` receives it
5. host page opens the AIS info flow

This is the correct parity path because it keeps AIS dialog and page logic in host-owned code.

### Why dispatch must be `navpage` / `gpspage` only

This is grounded in the verified bridge capabilities and the verified host pages.

- The bridge reports `ais.showInfo === "dispatch"` only on `navpage` and `gpspage`.
- `NavPage.jsx` and `GpsPage.jsx` already react to `item.name === "AisTarget"`.
- No bridge or host API change is needed for first implementation.

The widget must therefore not invent dispatch support on other pages.

### No separate DOM-effects module is needed

This widget has:

- no row selection
- no scroll container
- no list visibility pass
- no post-render scrolling work

The only lifecycle-specific behavior required is the single corrective rerender after attach for committed vertical-container facts.

---

## Functional Contract

### Target source

The widget consumes the host-selected target from `nav.ais.nearest`.

It does not reimplement target selection.

### Identity and dispatch gating

Use separate identity states:

- `hasTargetIdentity` → `target.mmsi !== undefined`
- `hasDispatchMmsi` → normalized MMSI is a non-empty dispatch-safe string

`hasTargetIdentity` controls whether the widget is in `data` state.

`hasDispatchMmsi` controls dispatch eligibility.

### MMSI normalization

Dispatch normalization must match `runtime/TemporaryHostActionBridge.js`:

- finite number → `String(Math.trunc(mmsi))`
- non-empty trimmed string → trimmed string
- anything else → invalid dispatch MMSI

No dispatch occurs unless `hasDispatchMmsi === true`.

### Raw equality rules

These rules remain separate from dispatch normalization:

- `trackedMatch` uses raw equality: `mmsiRaw === trackedMmsiRaw`
- `hasColorMmsi` is true only when `mmsiRaw` is truthy and not `""`

### Derived values

#### `nameOrMmsi`

Derive exactly as AvNav formatter `nameOrmmsi`:

1. AtoN `name` when `type == 21` and usable
2. otherwise `shipname` when usable
3. otherwise MMSI

#### `frontText`

Derive exactly as AvNav formatter `passFront`:

- `-` when `cpa` is absent or falsy
- `Front` when `passFront > 0`
- `Back` when `passFront < 0`
- `Pass` when `passFront === 0`
- `Done` when `cpa` exists but `passFront` is absent

#### `frontInitial`

Use the first character of `frontText` when present; otherwise `-`.

### Branch rule

Use one branch rule everywhere that affects visible layout or behavior:

- `tcpa > 0` → show `DCPA` and `TCPA`
- otherwise → show `BRG`

This rule must be applied consistently in the viewmodel, render model, layout, markup, resize signature, and tests.

### Formatting parity

Rendered values must preserve AvNav summary formatting semantics.

Required fields:

- `distance`
- `cpa`
- `tcpa`
- `headingTo`
- `nameOrMmsi`
- `frontText`

Formatter mapping:

- `distance` → `formatDistance(distance, distanceUnit)`
- `cpa` → `formatDistance(cpa, cpaUnit)`
- `headingTo` → `formatDirection(headingTo)`
- `tcpa` → `formatDecimal(tcpa / 60, 3, Math.abs(tcpa) > 60 ? 0 : 2)`

Implementation rule:

- `AisTargetRenderModel` formats numeric display strings through `Helpers.applyFormatter`
- `tcpa` may use value-derived formatter parameters because AvNav changes fractional precision based on the raw `tcpa` magnitude
- `nameOrMmsi`, `frontText`, and `frontInitial` remain plain text outputs from the domain layer

### Color-role precedence

Role resolution must follow AvNav semantics:

1. `warning` when `(warning && aisMarkAllWarning) || nextWarning`
2. else `nearest` when `nearest`
3. else `tracking` when `trackedMatch`
4. else `normal` when `hasColorMmsi`
5. else no color role

This rule defines state only.

Concrete color values come from dyn theme tokens, not from AvNav style properties.

---

## Render-State and Interaction Contract

### Render-state policy

Render-state policy belongs to `AisTargetRenderModel`.

States:

- `data`
- `placeholder`
- `hidden`

Rules:

- `data` when `hasTargetIdentity === true`
- `placeholder` when `hasTargetIdentity === false` and layout editing is active
- `placeholder` when `hasTargetIdentity === false`, a host capability snapshot is available, and `capabilities.pageId === "gpspage"`
- `hidden` otherwise

Notes:

- `pageId` is used only when provided by `hostActions.getCapabilities()`
- when no capability snapshot is available, the widget must not guess page identity
- outside layout editing, missing capability data therefore fails closed to `hidden`

### Placeholder contract

Placeholder presentation is dyn-owned.

Required behavior:

- fixed centered placeholder text `No AIS`
- no fake metric tiles
- no fake units
- no active accent color
- no claim of body-structure parity with AvNav

### Workflow ownership

The widget owns summary display and the data-state click surface.

The host owns the AIS information workflow.

Dispatch target:

- `hostActions.ais.showInfo(mmsi)`

No bridge API change is required.

### Interaction states

Use these states:

- `dispatch`
- `passive`

Rules:

- layout editing → `passive`
- `data` + valid dispatch MMSI + `ais.showInfo === "dispatch"` → `dispatch`
- all other cases → `passive`

Placeholder state is always passive.

### Click ownership rules

Follow the dyn HTML ownership rules:

- wrapper adds `onclick="catchAll"` only in dispatch mode
- hotspot element exists only in dispatch mode
- `namedHandlers()` must never return `catchAll`

Handler registration policy:

- `dispatch` mode → return `{ aisTargetShowInfo }`
- `passive` mode → return `{}`

Handler behavior:

- `aisTargetShowInfo` calls `hostActions.ais.showInfo(mmsiNormalized)`

---

## Layout, Theme, and Vertical Lifecycle Contract

### Theme contract

AIS role colors are theme-owned.

Add and document these tokens in `shared/theme/ThemeResolver.js` and `documentation/shared/theme-tokens.md`:

- `colors.ais.warning`
- `colors.ais.nearest`
- `colors.ais.tracking`
- `colors.ais.normal`

The plan does not require specific default hex values.

### Visual language

The widget uses the dyn complex-HTML summary language established by `editRoute` and `routePoints`:

- one wrapper block
- explicit additive wrapper state classes
- compact identity area
- metric tiles with caption/value/unit structure
- optional local accent surface when a color role exists
- shell/render-model/layout/fit/markup ownership split

It must not reproduce AvNav `WidgetFrame` internals inside the widget body.

### Required wrapper state classes

- `dyni-ais-target-html`
- `dyni-ais-target-mode-high`
- `dyni-ais-target-mode-normal`
- `dyni-ais-target-mode-flat`
- `dyni-ais-target-data`
- `dyni-ais-target-placeholder`
- `dyni-ais-target-hidden`
- `dyni-ais-target-open-dispatch`
- `dyni-ais-target-open-passive`
- `dyni-ais-target-branch-tcpa`
- `dyni-ais-target-branch-brg`
- `dyni-ais-target-color-warning`
- `dyni-ais-target-color-nearest`
- `dyni-ais-target-color-tracking`
- `dyni-ais-target-color-normal`
- `dyni-ais-target-vertical`

Color-role classes describe state. They do not replace theme-token resolution.

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

### Mode matrix

| State | `flat` | `normal` | `high` | `.widgetContainer.vertical` |
| --- | --- | --- | --- | --- |
| no target | hidden outside GPS/editing; placeholder only by render-state rule | same | same | same as `high` |
| target present, `tcpa > 0` | `frontInitial`, `DST`, `TCPA`, optional accent | `nameOrMmsi`, `frontText`, `DST`, `DCPA`, `TCPA`, optional accent | same field set as `normal` | same as `high` |
| target present, `tcpa <= 0` | `frontInitial`, `DST`, `BRG`, optional accent | `nameOrMmsi`, `frontText`, `DST`, `BRG`, optional accent | same field set as `normal` | same as `high` |
| layout editing | passive only | passive only | passive only | passive only |

Rules:

- `flat` must render only `frontInitial`, `distance`, and branch-specific `tcpa` or `headingTo`
- `normal` and `high` must render `nameOrMmsi`, `frontText`, `distance`, and the branch-specific secondary metrics
- `normal` and `high` use the same content set; they may differ in geometry and fit only
- no ghost tile is allowed in the `BRG` branch

### `.widgetContainer.vertical`

This is an explicit implementation contract.

Behavior:

1. First render may not know committed ancestry; assume normal host-sized rendering.
2. After attach, `initFunction().triggerResize()` requests one corrective rerender.
3. The corrective rerender resolves committed ancestry via `targetEl.closest(".widgetContainer.vertical")`.
4. If committed vertical ancestry is present:
  - force mode = `high`
  - apply the widget-owned vertical shell profile
  - treat width as the stable anchor for vertical sizing decisions
  - derive an **effective vertical layout height** from the widget-owned shell profile instead of trusting raw `shellRect.height`
5. All layout geometry, content-rect construction, and fit-box measurement in committed vertical mode must use that effective height.
6. Later updates re-evaluate committed ancestry through the normal render path.
7. No widget-owned observer is required.

Required vertical shell profile for native HTML rendering:

- `height: auto`
- `aspect-ratio: 7 / 8`
- `min-height: 8em`

This shell profile is a dyn implementation rule. It is not a claim about a core AvNav aspect-ratio contract.

### Layout, fit, and markup ownership

`AisTargetLayout` owns:

- content rectangles and gaps
- mode-specific topology
- branch-aware metric arrangement
- placeholder geometry
- vertical shell profile metadata

`AisTargetHtmlFit` owns:

- text measurement
- mode-aware font sizing
- inline style output only
- theme-token lookup through `ThemeResolver`
- role-to-color style resolution for the accent surface

`AisTargetMarkup` owns:

- escaped HTML assembly
- wrapper/class contract
- hotspot markup
- inline style emission from fit results
- wrapper-style emission from render-model/layout metadata

### Explicit fit rules

- metric fields use caption/value/unit markup with inline units
- `nameOrMmsi`, `frontText`, and `frontInitial` are text-only fields
- no ghost tiles for hidden fields
- no filler tile in the `BRG` branch
- text fitting reduces font size; it does not mutate content text

### Resize signature contract

`resizeSignature` must include all layout-relevant inputs, at minimum:

- resolved mode
- render state
- branch state
- interaction state
- committed vertical state
- rounded shell width
- rounded shell height in non-vertical mode only
- effective vertical layout height in committed vertical mode
- lengths of all visible text strings

Rules:

- the signature must change whenever the visible field set, layout branch, or interaction state changes
- in committed vertical mode, raw shell height must not participate in the signature when the widget-owned shell profile controls effective height

---

## Hard Constraints

### Architectural

- preserve the existing dyn registration model
- use UMD modules only
- keep each new or changed file within the 400-line budget
- do not change `HtmlSurfaceController` internals
- do not change `TemporaryHostActionBridge` internals
- do not change core AvNav code
- do not refactor existing `editRoute` or `routePoints` stacks except for strictly additive dependency registration updates

### Behavioral

- `aisTarget` must use `nav.ais.nearest` as its source
- `tcpa > 0` is the only branch rule for `DCPA/TCPA` versus `BRG`
- `flat` must render only `frontInitial`, `DST`, and either `TCPA` or `BRG`
- `normal` and `high` must render `nameOrMmsi`, `frontText`, `DST`, and the branch-specific secondary metrics
- committed `.widgetContainer.vertical` must force `high`
- placeholder state must render only `No AIS` and must omit metric tiles
- the widget must remain summary-only
- the widget must not read or expose AvNav style color stores
- text-fit must not trim, abbreviate, or ellipsize emitted text
- the widget must fail closed on malformed target data and never throw

### Interaction

- full-surface click only; no partial-surface click ownership
- use a hotspot overlay plus wrapper `catchAll` only when dispatch mode is active
- `namedHandlers()` must return `{ aisTargetShowInfo: fn }` only in dispatch mode and `{}` otherwise
- never return `catchAll` from `namedHandlers()`
- in layout-editing mode, the widget must be passive even on supported pages
- on unsupported or passive pages, the widget must not steal clicks

### Vertical-mode lifecycle

- first render must tolerate missing committed ancestry and render as non-vertical
- `initFunction().triggerResize()` must request one corrective rerender after attach
- committed vertical ancestry must be re-evaluated during later updates
- in committed vertical mode, the widget must derive a stable effective layout height from its own shell profile and use that height for layout and fit geometry
- in vertical mode, the resize signature must exclude raw shell height when the widget’s own profile controls effective height
- vertical anchor inputs used by render-model, layout, and fit must stay internally consistent

---

## Implementation Order

### Phase 1 — Map-cluster contract and kind registration

Create or update the map-cluster contract so the new kind can exist without changing cluster ownership.

Work items:

- add `aisTarget` to the existing `map` cluster kind list in `config/clusters/map.js`
- add required map store keys for `target`, `trackedMmsi`, and `aisMarkAllWarning`
- add internal ratio-threshold editables
- add the four AIS metric `MAP_KIND` entries and per-kind caption/unit editables
- register `AisTargetViewModel` in `registry-cluster.js`
- update `MapMapper` dependency registration to include `AisTargetViewModel`
- add the `map/aisTarget` tuple to `ClusterKindCatalog.js`
- add `AisTargetTextHtmlWidget` to `ClusterRendererRouter` dependencies

Outcome:

- `map/aisTarget` is a valid kind/tuple in configuration and renderer routing
- the map cluster still remains a single cluster definition
- no new bootstrap path or cluster registry key is introduced

### Phase 2 — Domain normalization and mapper payload

Build the AIS-specific domain layer and ensure mapper output is declarative and testable before any HTML rendering work starts.

Work items:

- create `cluster/viewmodels/AisTargetViewModel.js`
- implement target identity, dispatch normalization, tracked-match state, color-role precedence, and derived text fields
- keep formatter execution out of the viewmodel
- add `MapMapper` routing for `kind === "aisTarget"`
- make `MapMapper` emit grouped payload sections: `domain`, `layout`, `captions`, `units`, `default`
- add mapper coverage for threshold propagation and editable caption/unit propagation

Outcome:

- domain semantics are isolated and testable
- the mapper can fully describe renderer inputs without HTML knowledge
- raw tracked-MMSI equality and dispatch-MMSI normalization are kept separate

### Phase 3 — Shared render-model, layout, fit, and markup owners

Create the four shared owners that define behavior, geometry, fit, and markup without yet depending on shell-specific lifecycle code.

Work items:

- create `AisTargetRenderModel.js`
- implement render-state resolution, interaction-state resolution, branch selection, formatter calls, metric visibility, and resize-signature parts
- create `AisTargetLayout.js`
- implement `flat` / `normal` / `high` topology, placeholder geometry, branch-aware metric placement, and vertical-profile metadata
- create `AisTargetHtmlFit.js`
- implement font sizing, text-box measurement, and theme-token-to-inline-style mapping for the accent surface
- create `AisTargetMarkup.js`
- implement escaped wrapper markup, class emission, metric markup, optional accent markup, and conditional hotspot markup
- register the new shared modules in `registry-shared-foundation.js` and `registry-widgets.js`
- extend `ThemeResolver.js` with the AIS token family and tests

Outcome:

- widget behavior is decomposed into pure, testable owners
- layout and fit rules are explicit before the renderer shell is introduced
- theme-owned color mapping is available without reading AvNav style stores

### Phase 4 — HTML renderer shell and vertical lifecycle integration

Add the actual native HTML widget shell and wire it into the router using the already-tested shared owners.

Work items:

- create `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- create `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`
- implement `renderHtml`, `namedHandlers`, `resizeSignature`, `initFunction`, and `translateFunction`
- detect committed vertical ancestry through committed DOM ancestry only
- request one attach-time corrective rerender with `triggerResize()`
- ensure dispatch mode emits wrapper `catchAll`, hotspot markup, and `{ aisTargetShowInfo }`
- ensure passive mode emits no hotspot and `{}`
- add renderer integration tests for field-set changes, interaction changes, and vertical resize-signature behavior
- update dependency-registry tests for the new component registrations and dependency arrays

Outcome:

- the new widget kind is user-visible and host-integrated
- the vertical-container contract is implemented end-to-end
- click ownership is correct in both dispatch and passive contexts

### Phase 5 — Regression coverage, documentation, and status tracking

Finish the work by locking down behavior and documenting the exact parity boundary.

Work items:

- add map-cluster config tests
- add viewmodel tests
- add mapper tests
- add render-model tests
- add layout tests
- add fit tests
- add markup tests
- add renderer tests
- add theme-token tests
- create `documentation/widgets/ais-target.md`
- update `documentation/architecture/cluster-widget-system.md`
- update `documentation/TABLEOFCONTENTS.md`
- update `documentation/avnav-api/core-key-catalog.md`
- update `documentation/avnav-api/core-formatter-catalog.md`
- update `documentation/shared/theme-tokens.md`
- update `ROADMAP.md`
- update any additional docs only if implementation reveals a real gap

Outcome:

- parity boundaries are documented, not implied
- roadmap and documentation reflect actual coverage
- quality checks can validate the widget without relying on manual interpretation

---

## Affected File Map

| File | Likely phase | Planned change |
| --- | --- | --- |
| `cluster/viewmodels/AisTargetViewModel.js` | 2   | Create new AIS summary viewmodel |
| `tests/cluster/viewmodels/AisTargetViewModel.test.js` | 5   | Create viewmodel tests |
| `cluster/mappers/MapMapper.js` | 2   | Add `aisTarget` mapper branch and instantiate new viewmodel |
| `tests/cluster/mappers/MapMapper.test.js` | 5   | Add mapper tests for payload shape and caption/unit propagation |
| `config/clusters/map.js` | 1   | Add kind option, AIS store keys, and internal thresholds |
| `tests/config/clusters/map.test.js` | 5   | Add cluster config coverage |
| `config/shared/kind-defaults.js` | 1   | Add `MAP_KIND` entries for AIS metric captions and units |
| `config/components/registry-cluster.js` | 1   | Register `AisTargetViewModel`; update mapper/router deps |
| `config/components/registry-shared-foundation.js` | 3   | Register `AisTargetLayout` and `AisTargetHtmlFit` |
| `config/components/registry-widgets.js` | 3   | Register `AisTargetRenderModel`, `AisTargetMarkup`, and renderer |
| `cluster/rendering/ClusterKindCatalog.js` | 1   | Add `map/aisTarget` tuple |
| `cluster/rendering/ClusterRendererRouter.js` | 1, 4 | Add renderer dependency and factory wiring |
| `tests/config/components.test.js` | 4   | Update component-registration and dependency-array coverage |
| `shared/widget-kits/nav/AisTargetRenderModel.js` | 3   | Create render-model owner |
| `tests/shared/nav/AisTargetRenderModel.test.js` | 5   | Create render-model tests |
| `shared/widget-kits/nav/AisTargetLayout.js` | 3   | Create layout owner |
| `tests/shared/nav/AisTargetLayout.test.js` | 5   | Create layout tests |
| `shared/widget-kits/nav/AisTargetHtmlFit.js` | 3   | Create fit owner |
| `tests/shared/nav/AisTargetHtmlFit.test.js` | 5   | Create fit tests |
| `shared/widget-kits/nav/AisTargetMarkup.js` | 3   | Create markup owner |
| `tests/shared/nav/AisTargetMarkup.test.js` | 5   | Create markup tests |
| `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js` | 4   | Create HTML renderer shell |
| `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css` | 4   | Create widget CSS |
| `tests/cluster/rendering/AisTargetTextHtmlWidget.test.js` | 5   | Create renderer integration tests |
| `shared/theme/ThemeResolver.js` | 3   | Add AIS theme-token family |
| `tests/shared/theme/ThemeResolver.test.js` | 5   | Add theme-token coverage |
| `documentation/widgets/ais-target.md` | 5   | Create widget documentation |
| `documentation/architecture/cluster-widget-system.md` | 5   | Add `map/aisTarget` architecture references |
| `documentation/TABLEOFCONTENTS.md` | 5   | Add the AIS target widget doc entry |
| `documentation/avnav-api/core-key-catalog.md` | 5   | Document key usage if coverage is updated |
| `documentation/avnav-api/core-formatter-catalog.md` | 5   | Document formatter coverage if needed |
| `documentation/shared/theme-tokens.md` | 5   | Document AIS token family |
| `ROADMAP.md` | 5   | Update coverage/status |
| `runtime/TemporaryHostActionBridge.js` | reference only | No source change planned; existing AIS bridge action is reused |
| `viewer/components/AisTargetWidget.jsx` | reference only | Core summary behavior reference only |
| `viewer/nav/aisformatter.jsx` | reference only | Core formatter semantics reference only |
| `viewer/util/propertyhandler.js` | reference only | Core color-role precedence reference only |
| `viewer/gui/NavPage.jsx` | reference only | Existing host workflow reference only |
| `viewer/gui/GpsPage.jsx` | reference only | Existing host workflow reference only |

---

## Don'ts

- Do not change core AvNav code.
- Do not change `TemporaryHostActionBridge` internals.
- Do not change `HtmlSurfaceController` internals.
- Do not create a new `ais` cluster or `AisMapper`.
- Do not widen this work into a broad shared AIS-domain refactor.
- Do not reuse AvNav widget-body DOM, filler geometry, class names, or CSS topology.
- Do not read AvNav `properties.style.ais*Color` values in the widget.
- Do not introduce legacy full-wrapper tint behavior.
- Do not embed AIS buttons or inline controls in the widget.
- Do not replicate AIS dialog logic inside the renderer.
- Do not enable dispatch on unsupported pages.
- Do not steal clicks in passive mode.
- Do not omit the layout-editing passive rule.
- Do not return `catchAll` from `namedHandlers()`.
- Do not use ellipsis, abbreviation, or trimmed text output.
- Do not add filler tiles to imitate the core `BRG` branch spacing.
- Do not claim that the vertical `7 / 8` shell profile is a core AvNav aspect-ratio rule.
- Do not leave committed vertical geometry half-specified: once the widget owns vertical shell sizing, layout and fit must use the modeled effective height rather than raw shell height.
- Do not use the documentation phase to slip in code changes.

---

## Deployment Boundaries

| Deployable unit | Phases | Notes |
| --- | --- | --- |
| Map-cluster contract and kind registration | 1   | Additive; no change to existing widget behavior |
| Domain normalization and mapper payload | 2   | Additive; still not user-visible |
| Shared render-model, layout, fit, markup, and theme tokens | 3   | Additive shared modules |
| HTML renderer shell + CSS + router integration | 4   | User-visible new widget kind |
| Tests, documentation, and roadmap/status updates | 5   | After code phases only |

---

## Acceptance Criteria

### ViewModel and mapper

- `AisTargetViewModel.build()` uses `nav.ais.nearest` as the target source of truth.
- Missing or malformed target data yields `hasTargetIdentity: false` and no throw.
- `mmsiNormalized` matches bridge normalization semantics.
- `trackedMatch` uses raw equality against `trackedMmsiRaw`.
- `nameOrMmsi` fallback order matches AvNav formatter semantics.
- `frontText` and `frontInitial` match formatter semantics.
- `colorRole` precedence matches `PropertyHandler.getAisColor` semantics.
- `MapMapper.translate()` returns grouped `renderer + domain + layout + captions + units + default` payload for `aisTarget`.
- Map-cluster editables expose the four metric caption/unit pairs plus the two internal thresholds.

### Render-model, layout, fit, and markup

- `data` / `placeholder` / `hidden` rules match the render-state contract.
- GPS-page placeholder appears only when capability snapshot exposes `pageId === "gpspage"` and no target identity exists.
- Dispatch gating uses host capabilities and valid normalized MMSI.
- `distance`, `cpa`, `headingTo`, and `tcpa` preserve AvNav formatting semantics.
- `flat` exposes only `frontInitial`, `DST`, and `TCPA` or `BRG`.
- `normal` and `high` expose `nameOrMmsi`, `frontText`, `DST`, and branch-specific secondary metrics.
- `normal` and `high` may differ in geometry only, not in the field set.
- The `BRG` branch contains no filler tile.
- Placeholder geometry contains no ghost tiles.
- Accent style selection comes from theme tokens, not AvNav style-store reads.
- Text fitting reduces font size only; it never mutates emitted text.

### Renderer and interaction

- First render works without committed ancestry.
- `initFunction().triggerResize()` requests one corrective rerender after attach.
- Later updates re-evaluate committed vertical ancestry.
- Dispatch mode emits wrapper `catchAll`, hotspot markup, and `{ aisTargetShowInfo }`.
- Passive mode emits no hotspot and returns `{}`.
- Supported pages dispatch through `hostActions.ais.showInfo(mmsi)`.
- In layout-editing mode, the widget is passive even on supported pages.
- Placeholder state is always passive.
- Resize signature changes when visible field set, branch state, interaction state, or effective vertical height changes.
- Vertical mode excludes raw shell height from resize signature when effective height is widget-owned.

### Kind catalog and router

- `map/aisTarget` resolves to `surface: "html"` and `rendererId: "AisTargetTextHtmlWidget"`.
- `ClusterRendererRouter` creates and manages the HTML surface for the new kind.
- No separate cluster registry key is introduced.

### Documentation and quality gate

- `documentation/widgets/ais-target.md` exists and documents layout, states, interaction, and parity boundaries.
- `documentation/architecture/cluster-widget-system.md` mentions the new kind.
- `documentation/shared/theme-tokens.md` documents the AIS token family.
- `documentation/TABLEOFCONTENTS.md` links to the AIS target widget documentation.
- `ROADMAP.md` reflects the new coverage state.
- Dependency-registry tests cover the new component registrations and dependency arrays.
- `npm run check:all` passes.
- All new or changed files remain within the 400-line budget.
- No new smell-rule violations are introduced.
- Existing bridge tests continue to pass without requiring bridge source changes.

---

## Related

- [PLAN6.md](../completed/PLAN6.md) — route-points HTML kind plan
- [PLAN7.md](./PLAN7.md) — edit-route HTML kind plan
- [core-principles.md](../../documentation/core-principles.md) — architectural principles
- [coding-standards.md](../../documentation/conventions/coding-standards.md) — UMD templates and file-size rules
- [smell-prevention.md](../../documentation/conventions/smell-prevention.md) — duplication and suppression guidance
- [edit-route.md](../../documentation/widgets/edit-route.md) — complex summary-widget reference
- [route-points.md](../../documentation/widgets/route-points.md) — page-aware interaction reference
- [add-new-html-kind.md](../../documentation/guides/add-new-html-kind.md) — HTML kind authoring workflow
- [cluster-widget-system.md](../../documentation/architecture/cluster-widget-system.md) — cluster routing architecture
- [plugin-lifecycle.md](../../documentation/avnav-api/plugin-lifecycle.md) — host action bridge overview
- [interactive-widgets.md](../../documentation/avnav-api/interactive-widgets.md) — `catchAll` and passive/dispatch rules