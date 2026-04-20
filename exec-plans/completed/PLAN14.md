# PLAN14 — Alarm HTML Kind (`vessel/alarm`)

## Status

Written after repository verification and code-trace review of both the core AvNav alarm flow and the dyninstruments HTML-widget architecture.

This plan is code-grounded against the verified sources named below. It locks the product split, native-parity boundaries, bridge behavior, text contract, ratio-mode contract, and theme-token contract for the Alarm widget.

The coding agent may choose equivalent low-level implementation details where appropriate, but the tuple contract, data contract, render-state policy, interaction boundary, bridge failure contract, and documentation/test outcomes below are explicit plan contracts.

---

## Goal

Add a new native HTML kind `alarm` to the `vessel` cluster that reproduces the **core Alarm widget’s information role and stop-all workflow role** at native dyninstruments quality, while keeping core page injection and core badge ownership outside dyninstruments.

Expected outcomes after completion:

- `dyni_Vessel_Instruments` offers a new `kind: "alarm"`.
- The kind renders as a compact dyn HTML tile, not a canvas widget.
- The widget reads the same alarm source of truth as core AvNav: `nav.alarms.all`.
- The widget preserves native active-alarm ordering semantics by following the practical contract used by `AlarmHandler.sortedActiveAlarms(...)`.
- The widget preserves native label semantics by displaying active alarm **object keys** as the visible alarm names.
- Idle state is stable and visible:
  - caption defaults to `ALARM`
  - value is fixed `NONE`
  - passive interaction
  - blue indicator strip shown
  - standard dyn surface background
- Idle remains visible even if core AvNav suppresses the native injected Alarm badge in the current host context.
- Active state is urgent and visible:
  - caption `ALARM`
  - value uses sorted running alarm names
  - full red alarm background
  - indicator strip hidden
  - whole-tile dispatch interaction only when host stop-all capability is available
  - otherwise passive interaction
- Alarm text formatting is:
  - `0` active alarms → `NONE`
  - `1` active alarm → `name`
  - `2` active alarms → `name1, name2`
  - `3+` active alarms → `name1, name2 +N`
- The `3+` summary rule is driven by active-alarm count, not width.
- Text shrinking follows the `MapZoom` behavior family.
- The widget supports explicit ratio modes:
  - `high`
  - `normal`
  - `flat`
- The widget uses vertical shell sizing `{ kind: "ratio", aspectRatio: 2 }`.
- The visual structure intentionally combines:
  - `mapZoom`-style caption/value composition
  - `aisTarget`-style idle indicator strip
  - Alarm-specific active background extension
- Clicking the active tile stops **all** running alarms when host dispatch is available.
- Host dispatch is routed through `TemporaryHostActionBridge.alarm.stopAll()`.
- Because there is no page-item-click parity path for Alarm, bridge dispatch reuses the mounted native Alarm widget click handler through DOM/React lookup.
- Alarm stop-all capability is available on any current page that mounts the native Alarm badge, not just the bridge’s historical page whitelist.
- Alarm widget colors are resolved from semantic theme tokens owned by `ThemeModel` and included in the `highcontrast` preset.
- `user.css` can override the Alarm widget background, foreground, and strip colors via the new input tokens.

---

## Verified Baseline

The following points were rechecked against the repositories before this plan was written.

1. **Core Alarm is a host-coupled status widget, not a normal instrument tile.** `viewer/components/Page.jsx` creates the widget with `WidgetFactory.createWidget({ name: 'Alarm' })` and injects it directly into `PageLeft` with a page-owned `onClick={alarmClick}` handler.
2. **Core Alarm click behavior is page-owned stop-all logic.** In `viewer/components/Page.jsx`, `alarmClick()` reads `keys.nav.alarms.all` from `globalStore` and calls `AlarmHandler.stopAlarm(k)` for each running alarm.
3. **Core Alarm widget body is thin and presentation-only.** `viewer/components/AlarmWidget.jsx` subscribes to `keys.nav.alarms.all`, uses `AlarmHandler.sortedActiveAlarms(props.alarmInfo)`, builds a comma-separated list, hides itself when the list is empty, forwards clicks through `props.onClick`, and binds `{ name: 'stop' }` to the same action.
4. **Native label semantics use the alarm-map object key.** `AlarmHandler.sortedActiveAlarms(allAlarms)` projects running alarms to `{ name: k, category, repeat }`, and `AlarmWidget.jsx` renders `al.name`. The dyn widget must therefore display active alarm object keys, not `alarm.name` or any alternate field.
5. **Core alarm ordering semantics already exist and should be treated as source-of-truth behavior.** `viewer/nav/alarmhandler.js` exposes `sortedActiveAlarms(allAlarms)` and `compareAlarms(a, b)`.
6. **Core ordering is only partially ordered.** Same-category alarms preserve source order; alarms with a defined category sort before alarms with `undefined` category; `critical` sorts before `info`; there is no extra alphabetical sort layer.
7. **Core Alarm is registered under the literal widget name `Alarm`.** `viewer/components/WidgetList.js` registers `{ name: 'Alarm', wclass: AlarmWidget }`.
8. **Because core Alarm is already registered and page-injected by name, dyninstruments cannot replace the badge without AvNav core ownership.** `WidgetFactory.addWidget(...)` rejects duplicate names, and `Page.jsx` is hard-wired to `Alarm`.
9. **The dyn `vessel` cluster currently has no Alarm kind.** `config/clusters/vessel.js` offers `voltage`, `voltageLinear`, `voltageRadial`, `clock`, `dateTime`, `timeStatus`, `pitch`, and `roll` only.
10. **The dyn kind catalog currently has no `vessel/alarm` tuple.** `cluster/rendering/ClusterKindCatalog.js` contains no Alarm entry under `cluster: "vessel"`.
11. **The renderer router must also be updated.** `cluster/rendering/ClusterRendererRouter.js` is an explicit renderer inventory; adding the kind catalog tuple alone is not enough to make a new HTML renderer routable.
12. **The dyn vessel mapper currently has no Alarm branch or Alarm viewmodel dependency.** `cluster/mappers/VesselMapper.js` is still text/canvas-only for its existing kinds.
13. **The current dyn HTML reference widgets split exactly the responsibilities Alarm needs.** `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js` owns compact caption/value composition and explicit ratio-mode rendering; `shared/widget-kits/nav/AisTargetHtmlFit.js` resolves token-driven accent color styles.
14. **The current theme semantic owner is `ThemeModel`, not `ThemeResolver`.** `shared/theme/ThemeModel.js` owns token definitions, defaults, preset metadata, and `highcontrast`; `ThemeResolver` is the resolver boundary only.
15. **Current theme tokens do not yet include semantic Alarm-widget background/foreground/strip tokens.** `shared/theme/ThemeModel.js` exposes generic `colors.alarm` and AIS role colors, but nothing scoped to the Alarm HTML widget surface.
16. **`highcontrast` does not yet define Alarm-widget-specific colors.** `shared/theme/ThemeModel.js` only overrides generic `colors.pointer`, `colors.warning`, and `colors.alarm` in that preset.
17. **Current host bridge actions do not include Alarm.** `runtime/TemporaryHostActionBridge.js` and `cluster/rendering/ClusterSurfacePolicy.js` currently expose routePoints, map zoom, routeEditor, and AIS actions/capabilities, but nothing for Alarm.
18. **Existing host bridge dispatch patterns split into two buckets.** `TemporaryHostActionBridge` uses synthetic page-item-click dispatch for widgets with page-owned `item.name` handlers (`Zoom`, `ActiveRoute`, `EditRoute`, `AisTarget`) and direct relay APIs for special cases (`routePoints`). Alarm matches neither bucket today.
19. **There is no verified page-item-click parity path for `item.name === "Alarm"`.** Repository search shows no equivalent host `widgetClick` / `onItemClick` Alarm branch. Therefore, bridge parity for Alarm must reuse the mounted core Alarm widget click path directly.
20. **Existing interactive HTML kinds are routed through `ClusterSurfacePolicy`.** `ClusterSurfacePolicy` normalizes host capabilities/actions and makes widgets passive in unsupported or layout-editing contexts.
21. **`mapZoom` already uses the exact default ratio thresholds Alarm wants.** `MapZoomTextHtmlWidget.js` uses default `ratioThresholdNormal = 1.0` and `ratioThresholdFlat = 3.0`.
22. **Per-kind caption defaults already exist in the cluster-config path.** `config/shared/kind-defaults.js` plus `makePerKindTextParams(...)` are the standard route for default captions and user-overridable per-kind text.
23. **Current bridge capability caching is page-oriented, not badge-oriented.** The Alarm addition must include badge-discovery-aware capability invalidation so `alarm.stopAll` does not go stale when `.alarmWidget` appears or disappears.

---

## Scope

### Included

- `vessel/alarm` cluster kind
- Alarm domain normalization from `nav.alarms.all`
- native-compatible active-alarm filtering/sorting
- native-compatible label extraction from the alarm-map object key
- active-alarm text assembly using the explicit formatting rules in this plan
- explicit `high` / `normal` / `flat` HTML layout modes
- idle indicator-strip behavior
- active alarm background behavior
- visible idle behavior even when the host suppresses the native injected Alarm badge
- active-but-passive behavior when host stop-all dispatch is unavailable
- `TemporaryHostActionBridge.alarm.stopAll()`
- `ClusterSurfacePolicy` action/capability wiring for Alarm
- theme-token additions in `ThemeModel`
- `highcontrast` preset coverage for Alarm tokens
- `user.css` override support through ThemeResolver-owned token inputs
- regression tests, roadmap update, and widget/theme documentation

### Excluded

- replacing the core injected Alarm badge
- any AvNav core edit
- any dyn plugin-managed overlay workaround for the badge
- per-alarm acknowledge/dismiss controls
- alarm history/details dialogs
- keyboard stop binding for dyn widgets
- canvas Alarm renderer

---

## Source Anchors

### AvNav source anchors

- `viewer/components/Page.jsx`
- `viewer/components/AlarmWidget.jsx`
- `viewer/components/WidgetList.js`
- `viewer/nav/alarmhandler.js`

### dyninstruments source anchors

- `config/clusters/vessel.js`
- `config/shared/kind-defaults.js`
- `config/components/registry-cluster.js`
- `config/components/registry-shared-foundation.js`
- `config/components/registry-widgets.js`
- `cluster/mappers/VesselMapper.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `cluster/rendering/ClusterSurfacePolicy.js`
- `runtime/TemporaryHostActionBridge.js`
- `shared/theme/ThemeModel.js`
- `shared/theme/ThemeResolver.js`
- `shared/widget-kits/nav/AisTargetHtmlFit.js`
- `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`
- `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
- `documentation/guides/add-new-html-kind.md`
- `documentation/shared/theme-tokens.md`
- `documentation/avnav-api/interactive-widgets.md`
- `ROADMAP.md`

---

## Concept Specification

This section is the authoritative layout and behavior specification for `vessel/alarm`.

### Exposed settings

#### `alarmRatioThresholdNormal`

- type: `FLOAT`
- default: `1.0`
- internal: `true`

#### `alarmRatioThresholdFlat`

- type: `FLOAT`
- default: `3.0`
- internal: `true`

Behavior:

- ratio `< normal threshold` → `high`
- ratio `> flat threshold` → `flat`
- otherwise → `normal`

These thresholds are layout controls only. They do not change the Alarm data contract.

### Tuple contract

`vessel/alarm` means the strict tuple:

```javascript
{ cluster: "vessel", kind: "alarm", viewModelId: "AlarmViewModel", rendererId: "AlarmTextHtmlWidget", surface: "html" }
```

### Cluster config contract

`config/clusters/vessel.js` must continue to register a single `ClusterWidget` cluster with `cluster: "vessel"`.

Required changes:

- add `alarm` to the existing `kind` editable list
- keep generic formatter ownership out of the Alarm path
- keep the standard per-kind caption path enabled so the caption remains user-overridable
- default unit to empty for `kind: "alarm"` via kind-defaults, matching the `dateTime`/`timeStatus` pattern
- add internal editables:
  - `alarmRatioThresholdNormal`
  - `alarmRatioThresholdFlat`

Required vessel-cluster store keys:

- `alarmInfo: "nav.alarms.all"` — added to the base `storeKeys` object alongside `clock` and `gpsValid`, not dynamically managed through `updateFunction`

### Text contract

Alarm uses the standard per-kind caption path, but the value contract is fixed.

Required first-version behavior:

- caption default: `ALARM`
- caption override: allowed through the normal per-kind caption editable path
- idle value: fixed `NONE`
- unit: empty and hidden

The idle value must **not** be sourced from the generic widget `default` text.

### State contract

#### Idle

- caption: configured caption, default `ALARM`
- value: `NONE`
- interaction: passive
- blue strip: visible
- red active background: absent
- visibility: remains visible even if the host suppresses the native injected Alarm badge

#### Active

- caption: configured caption, default `ALARM`
- value is formatted from the sorted active alarm list:
  - `1` active alarm → `name`
  - `2` active alarms → `name1, name2`
  - `3+` active alarms → `name1, name2 +N`
- blue strip: hidden
- red active background: present
- interaction:
  - `dispatch` only when host capability `alarm.stopAll === "dispatch"` and layout editing is off
  - otherwise `passive`

### Native parity contract for labels and ordering

`AlarmViewModel` is the canonical owner of Alarm domain normalization.

Required normalization behavior:

1. read the raw `alarmInfo` object from props
2. treat missing or non-object payloads as empty
3. iterate the raw alarm-map entries in source order
4. keep only entries where `running === true`
5. project each running entry to a normalized active-alarm object containing:
   - `name`: the **object key**
   - `category`
   - `repeat`
6. apply the same ordering contract as core `AlarmHandler.sortedActiveAlarms(allAlarms)`:
   - same-category alarms preserve source order
   - alarms with a defined category sort before alarms with `undefined` category
   - `critical` sorts before `info`
   - no extra alphabetical sort is added
7. derive:
   - `hasActiveAlarms`
   - `activeCount`
   - `alarmNames[]`
   - `alarmText`
   - `state: "idle" | "active"`

This ordering rule is **count-driven only**. Width does not decide whether the widget renders a full list or summarized list.

### Layout and mode contract

Alarm is a compact HTML status/control tile.

The composition contract is:

- `mapZoom` → caption/value layout grammar and ratio-mode strategy
- `aisTarget` → idle indicator-strip concept and token-driven accent styling
- Alarm → active-state full-background extension

Mode contract:

- `high`: caption row above value row
- `normal`: value row with secondary caption row beneath
- `flat`: inline caption + value row

Vertical shell sizing:

```javascript
{ kind: "ratio", aspectRatio: 2 }
```

Text shrinking follows the same behavior family as `MapZoom`.

### Action and bridge contract

Only one action is implemented: **stop all running alarms**.

No per-alarm row actions, acknowledge/silence split, or detail dialog entry are part of this plan.

Because there is no verified `item.name === "Alarm"` page parity path, Alarm dispatch must **not** be implemented through synthetic `onItemClick` dispatch unless such a path is proven during implementation.

Required bridge strategy:

1. locate the mounted native Alarm widget element in the current visible page DOM using `.alarmWidget`
2. use the existing React-fiber helper pattern already present in `TemporaryHostActionBridge`
3. find the effective click handler (`onClick` or equivalent) on the Alarm widget path
4. invoke that handler so the page-owned stop-all logic remains source-of-truth

Capability rule:

- `dispatch` only when the bridge can discover a mounted native `.alarmWidget` click path in the current visible host DOM/React tree
- otherwise `unsupported`

Availability rule:

- this must work on any current page that mounts the native Alarm badge, not only the bridge’s historical page whitelist

Failure contract for `TemporaryHostActionBridge.alarm.stopAll()`:

- unsupported context at capability time → return `false`
- capability was `dispatch` but the native `.alarmWidget` click path cannot be rediscovered at invocation time → throw a `TemporaryHostActionBridge` error
- click path found and invoked → return `true`

### Theme-token contract

Alarm needs semantic widget-surface tokens distinct from generic gauge-sector alarm colors.

Required `ThemeModel` token paths:

- `colors.alarmWidget.bg`
- `colors.alarmWidget.fg`
- `colors.alarmWidget.strip`

Required input vars:

- `--dyni-alarm-widget-bg`
- `--dyni-alarm-widget-fg`
- `--dyni-alarm-widget-strip`

Required default values:

| Token | Base | Night | Highcontrast |
|---|---|---|---|
| `colors.alarmWidget.bg` | `#e04040` | `#991111` | `#ff2200` |
| `colors.alarmWidget.fg` | `#ffffff` | `#ffffff` | `#ffffff` |
| `colors.alarmWidget.strip` | `#4488cc` | `#224466` | `#3399ff` |

Rationale: `bg` is more saturated than the generic `colors.alarm` gauge-sector color to convey full-surface urgency; `fg` is white across all modes for maximum readability on a red field; `strip` uses a nautical-instrument blue that is clearly distinct from the alarm palette.

The renderer reads these resolved tokens through `ThemeResolver.resolveForRoot(...)` like other HTML widgets.

`highcontrast` must explicitly set all three Alarm-widget token values.

---

## Hard Constraints

- **No AvNav core edits.**
- **No dyn badge/overlay workaround.** Alarm is implemented only as `vessel/alarm`.
- **Alarm stays an HTML renderer.** No canvas fallback or parallel canvas implementation.
- **Alarm is a proper HTML kind.** Use viewmodel → mapper → kind catalog/router → HTML shell → shared render-model/fit/markup helpers.
- **No duplicate semantic ownership in theming.** `ThemeModel` is the only semantic owner of the new Alarm tokens.
- **`ThemeResolver` stays resolver-only.** Do not hardcode token semantics there.
- **Interaction remains host-owned.** Dyni requests `stopAll`; it does not implement alarm stopping logic itself.
- **No page-item-click assumption for Alarm.** The bridge must not pretend an `item.name === "Alarm"` parity path exists unless verified during implementation.
- **Layout editing must force passive behavior.**
- **No file exceeds 400 non-empty lines.** Split helpers as needed.
- **Every modified file retains its Module/Documentation/Depends header.**
- **`npm run check:all` must pass at the end.**

---

## Implementation Order

### Mandatory preflight

Read these files before any code changes:

- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/guides/add-new-html-kind.md`
- `documentation/shared/theme-tokens.md`
- `documentation/avnav-api/interactive-widgets.md`

### Phase 1 — Register `vessel/alarm` and lock the config contract

#### Intent

Create the cluster/config/router scaffolding for Alarm before any rendering logic is added.

#### Tasks

1. **`config/clusters/vessel.js`**
   - add `opt("Alarm", "alarm")`
   - add `alarmInfo: "nav.alarms.all"` to the base `storeKeys` object (alongside `clock` and `gpsValid`, always subscribed regardless of kind)
   - add internal ratio-threshold editables:
     - `alarmRatioThresholdNormal`
     - `alarmRatioThresholdFlat`
   - defaults:
     - `alarmRatioThresholdNormal: 1.0`
     - `alarmRatioThresholdFlat: 3.0`
   - keep Alarm on the standard per-kind caption path
   - unit defaults to empty via kind-defaults; no special `updateFunction` branch needed

2. **`config/shared/kind-defaults.js`**
   - add `VESSEL_KIND.alarm = { cap: "ALARM", unit: "" }`

3. **`cluster/rendering/ClusterKindCatalog.js`**
   - add the `vessel/alarm` HTML tuple

4. **`cluster/rendering/ClusterRendererRouter.js`**
   - add `AlarmTextHtmlWidget` to the renderer inventory/spec map so the new kind is actually routable

5. **`config/components/registry-cluster.js`**
   - register `AlarmViewModel`
   - update dependencies so `VesselMapper` depends on `AlarmViewModel`
   - add `AlarmTextHtmlWidget` to `ClusterRendererRouter.deps` — every HTML renderer in the catalog must appear in this dependency list so the component loader resolves it before the router instantiates

6. **`config/components/registry-widgets.js`**
   - add the `AlarmTextHtmlWidget` entry (js path, shadowCss, globalKey, deps) following the existing HTML widget pattern

#### Exit criteria

- `vessel/alarm` is a known kind at config/catalog/router level.
- Component loader knows there will be an Alarm viewmodel and renderer.

### Phase 2 — Build the Alarm domain/viewmodel and mapper routing

#### Intent

Normalize Alarm state in one place and keep `VesselMapper` thin.

#### Files to create

- `cluster/viewmodels/AlarmViewModel.js`

#### Files to modify

- `cluster/mappers/VesselMapper.js`

#### Tasks

1. **`cluster/viewmodels/AlarmViewModel.js`**

   This module is the canonical owner of Alarm domain normalization.

   It must:

   - read raw `alarmInfo`
   - treat missing/non-object alarm payload as empty
   - keep only alarms where `running === true`
   - project active alarms to `{ name: entryKey, category, repeat }`
   - preserve native ordering semantics exactly as defined in the concept specification
   - derive:
     - `hasActiveAlarms`
     - `activeCount`
     - `alarmNames[]`
     - `alarmText`
     - `state: "idle" | "active"`

   Formatting must be explicit:

   - `0` active alarms → `NONE`
   - `1` active alarm → `name`
   - `2` active alarms → `name1, name2`
   - `3+` active alarms → `name1, name2 +N`

   Do not make the `3+` summarization width-dependent.

2. **`cluster/mappers/VesselMapper.js`**
   - add a `req === "alarm"` branch
   - call `AlarmViewModel`
   - produce HTML-kind props for `AlarmTextHtmlWidget`
   - pass through:
     - per-kind caption/default text
     - hidden/empty unit
     - fixed idle `NONE`
     - alarm ratio thresholds
     - normalized Alarm domain payload
   - do not bury Alarm formatting or state logic directly in the mapper

#### Exit criteria

- `VesselMapper` can route `kind: "alarm"` to a coherent Alarm domain payload.
- Domain normalization lives in `AlarmViewModel`, not in the widget shell.

### Phase 3 — Build the shared Alarm render-model / fit / markup helpers

#### Intent

Create the same layered HTML-kind structure used by the other interactive dyn widgets, but scoped to Alarm’s simpler caption/value topology.

#### Files to create

- `shared/widget-kits/vessel/AlarmRenderModel.js`
- `shared/widget-kits/vessel/AlarmHtmlFit.js`
- `shared/widget-kits/vessel/AlarmMarkup.js`

#### Files to modify

- `config/components/registry-shared-foundation.js`
- `config/components/registry-widgets.js`

#### Tasks

1. **`AlarmRenderModel.js`**
   - receive normalized Alarm domain payload
   - choose `idle` vs `active`
   - choose `passive` vs `dispatch` base interaction
   - expose whether the strip is shown
   - expose whether active background is shown
   - expose display texts for caption/value
   - expose mode-independent semantic state for markup and fit
   - do not do text fitting here

2. **`AlarmHtmlFit.js`**
   - resolve theme via `ThemeResolver.resolveForRoot(rootEl)`
   - resolve ratio mode (`high` / `normal` / `flat`) from supplied thresholds, mirroring `mapZoom`
   - measure caption and value text for each mode
   - resolve token-driven inline styles for:
     - active background (`colors.alarmWidget.bg`)
     - active foreground (`colors.alarmWidget.fg`)
     - idle strip (`colors.alarmWidget.strip`)
   - shrink text using the same behavior family as `MapZoom`
   - keep value single-line in v1
   - do not recompute the `3+` summary rule here

3. **`AlarmMarkup.js`**
   - render the base wrapper
   - render the idle strip when requested
   - render mode-specific structure
   - render the full-surface hotspot only in dispatch mode
   - follow the explicit mode contract:
     - `high`: caption row above value row
     - `normal`: value row with secondary caption row beneath
     - `flat`: inline caption + value row

4. **`config/components/registry-shared-foundation.js`**
   - register `AlarmHtmlFit`

5. **`config/components/registry-widgets.js`**
   - register `AlarmRenderModel`
   - register `AlarmMarkup`

#### Exit criteria

- Alarm has shared render/fitting/markup owners.
- The visual composition contract (`mapZoom` + `aisTarget` + Alarm skin) is expressible without widget-shell duplication.

### Phase 4 — Build the Alarm HTML widget shell and interaction wiring

#### Intent

Implement the actual HTML renderer, connect it to `ClusterSurfacePolicy`, and add the missing host action.

#### Files to create

- `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js`
- `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css`

#### Files to modify

- `config/components/registry-widgets.js`
- `cluster/rendering/ClusterSurfacePolicy.js`
- `runtime/TemporaryHostActionBridge.js`
- `cluster/rendering/ClusterRendererRouter.js`

#### Tasks

1. **`AlarmTextHtmlWidget.js`**
   - own the committed HTML root
   - follow the overall structure of the other dyn HTML widgets
   - implement `getVerticalShellSizing()` as `{ kind: "ratio", aspectRatio: 2 }`
   - build the Alarm render model
   - resolve fit via `AlarmHtmlFit`
   - render markup through `AlarmMarkup`
   - bind click handling only when surface policy resolves to dispatch
   - stay passive in layout-editing mode
   - do not invent a new renderer lifecycle

2. **`AlarmTextHtmlWidget.css`**
   - define widget-specific classes for:
     - base shell
     - `mode-high`
     - `mode-normal`
     - `mode-flat`
     - `state-idle`
     - `state-active`
     - passive vs dispatch cursor states
     - strip element
   - do not hardcode final colors in CSS; actual state colors come from resolved token styles

3. **`config/components/registry-widgets.js`**
   - register `AlarmTextHtmlWidget`

4. **`cluster/rendering/ClusterSurfacePolicy.js`**
   - add normalized Alarm action wiring: `actions.alarm.stopAll()`
   - add capability-aware interaction resolution so Alarm becomes dispatch only when:
     - host capabilities report `alarm.stopAll === "dispatch"`
     - widget is in active state
     - widget is not in layout-editing mode
   - all other cases are passive

5. **`runtime/TemporaryHostActionBridge.js`**
   - add host action group `alarm.stopAll()`
   - add capability group `alarm.stopAll`
   - add a small Alarm discovery helper so the bridge file stays under the 400 non-empty-line limit
   - capability is `dispatch` only when the bridge can discover a mounted native `.alarmWidget` click path; otherwise `unsupported`
   - capability invalidation must include alarm badge discoverability, not only page identity
   - `alarm.stopAll()` must implement the locked failure contract:
     - unsupported capability → return `false`
     - rediscovery failure after prior dispatch capability → throw bridge error
     - successful invocation → return `true`

#### Exit criteria

- Alarm HTML widget can render and click.
- Alarm click uses host-owned stop-all behavior, not plugin-owned alarm logic.
- Unsupported contexts degrade cleanly to passive.
- Pages outside the old bridge whitelist still expose dispatch when they mount the native Alarm badge.

### Phase 5 — Add Alarm theme tokens and preset coverage

#### Intent

Make Alarm colors semantic, theme-resolved, preset-aware, and overrideable from `user.css`.

#### Files to modify

- `shared/theme/ThemeModel.js`
- `documentation/shared/theme-tokens.md`
- `README.md` (override examples only if needed)

#### Tasks

1. **`shared/theme/ThemeModel.js`**
   - add semantic token definitions for:
     - `colors.alarmWidget.bg`
     - `colors.alarmWidget.fg`
     - `colors.alarmWidget.strip`
   - add input vars:
     - `--dyni-alarm-widget-bg`
     - `--dyni-alarm-widget-fg`
     - `--dyni-alarm-widget-strip`
   - use the locked default values from the theme-token contract table in the Concept Specification
   - keep semantic ownership in `ThemeModel`, not `ThemeResolver`

2. **`highcontrast` preset**
   - explicitly set all three Alarm-widget token values using the locked highcontrast column from the theme-token contract table
   - guarantee:
     - obvious active-state urgency
     - readable foreground on active background
     - clearly visible idle strip

3. **Documentation**
   - document the new tokens in `documentation/shared/theme-tokens.md`
   - add README example only if the existing docs need a concrete `user.css` snippet

#### Exit criteria

- Alarm colors have semantic token ownership in `ThemeModel`.
- `highcontrast` covers Alarm explicitly.
- `user.css` overrides are documented and reliable.

### Phase 6 — Tests, roadmap, and documentation

#### Intent

Finish the implementation with regression coverage and explicit documentation of the chosen scope boundary.

#### Files to create

- `tests/cluster/viewmodels/AlarmViewModel.test.js`
- `tests/shared/vessel/AlarmRenderModel.test.js`
- `tests/shared/vessel/AlarmHtmlFit.test.js`
- `tests/shared/vessel/AlarmMarkup.test.js`
- `tests/cluster/rendering/AlarmTextHtmlWidget.test.js`

#### Files to modify

- `tests/runtime/TemporaryHostActionBridge.test.js`
- `tests/cluster/rendering/ClusterSurfacePolicy.test.js`
- `tests/cluster/rendering/ClusterRendererRouter.test.js`
- `tests/cluster/rendering/ClusterKindCatalog.test.js`
- `tests/cluster/mappers/VesselMapper.test.js`
- `tests/config/clusters/vessel.test.js`
- `tests/config/shared/kind-defaults.test.js`
- `tests/shared/theme/ThemeModel.test.js`
- `ROADMAP.md`
- `documentation/widgets/` (create or extend an Alarm widget page)
- `documentation/guides/add-new-html-kind.md` only if the Alarm implementation reveals a reusable pattern worth documenting

#### Tasks

1. **Viewmodel tests**
   - cover missing/empty alarm object → idle
   - one running alarm → active
   - two running alarms → exact `name1, name2` output
   - three or more running alarms → exact `name1, name2 +N` output
   - non-running alarms ignored
   - mixed payload examples that prove the locked native label/order contract:
     - display names come from object keys
     - same-category alarms preserve source order
     - defined category sorts before undefined category
     - `critical` sorts before `info`

2. **Render-model / fit / markup tests**
   - idle strip shown only in idle state
   - active red skin shown only in active state
   - mode selection for `high` / `normal` / `flat`
   - active foreground/background styles sourced from theme tokens
   - text shrinking follows the `MapZoom` fit strategy
   - fit logic does not re-decide the `3+` summary semantics

3. **Widget shell tests**
   - passive behavior when idle
   - passive behavior during layout editing
   - active + capability present → dispatch behavior
   - active + capability unavailable → passive behavior
   - click calls `surfacePolicy.actions.alarm.stopAll()` only in dispatch mode
   - `getVerticalShellSizing()` returns `{ kind: "ratio", aspectRatio: 2 }`

4. **Bridge and surface policy tests**
   - capability snapshot includes `alarm.stopAll`
   - capability is `dispatch` only when the native `.alarmWidget` click path is discoverable
   - capability works on pages outside the old bridge whitelist when the native badge is mounted
   - bridge action invokes the discovered core Alarm click path
   - unsupported path returns `false`
   - rediscovery failure after dispatch capability throws the locked bridge error

5. **Router / registry coverage**
   - new `vessel/alarm` kind catalog entry resolves correctly
   - renderer router resolves `AlarmTextHtmlWidget`
   - config/registry tests reflect the new kind and dependencies

6. **Roadmap and docs**
   - update `ROADMAP.md` so Alarm is no longer listed as missing once implementation is complete
   - document the scope boundary explicitly:
     - `vessel/alarm` is covered
     - the injected core Alarm badge is intentionally not replaced
   - document the behavior boundary explicitly:
     - idle Alarm remains visible even when the host suppresses the native injected badge
     - active Alarm remains visible but passive when host stop-all dispatch is unavailable

#### Exit criteria

- Regression coverage exists across domain, rendering, router, surface policy, and bridge layers.
- ROADMAP and docs match the shipped scope.

---

## Affected File Map

| File | Phase | Action |
|---|---:|---|
| `exec-plans/PLAN14.md` | planning | Finalize execution plan |
| `config/clusters/vessel.js` | 1 | Add `alarm` kind, store key, ratio thresholds |
| `config/shared/kind-defaults.js` | 1 | Add `VESSEL_KIND.alarm` |
| `cluster/rendering/ClusterKindCatalog.js` | 1 | Add `vessel/alarm` tuple |
| `cluster/rendering/ClusterRendererRouter.js` | 1, 4, 6 | Register/resolution-path wiring for `AlarmTextHtmlWidget` |
| `config/components/registry-cluster.js` | 1 | Register `AlarmViewModel`; wire VesselMapper dep; add `AlarmTextHtmlWidget` to `ClusterRendererRouter.deps` |
| `cluster/viewmodels/AlarmViewModel.js` | 2 | New Alarm domain normalizer |
| `cluster/mappers/VesselMapper.js` | 2 | Add Alarm mapper branch |
| `shared/widget-kits/vessel/AlarmRenderModel.js` | 3 | New render-model owner |
| `shared/widget-kits/vessel/AlarmHtmlFit.js` | 3 | New fit owner |
| `shared/widget-kits/vessel/AlarmMarkup.js` | 3 | New markup owner |
| `config/components/registry-shared-foundation.js` | 3 | Register `AlarmHtmlFit` |
| `config/components/registry-widgets.js` | 1, 3, 4 | Register render-model, markup, renderer |
| `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js` | 4 | New HTML renderer shell |
| `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css` | 4 | New widget CSS |
| `cluster/rendering/ClusterSurfacePolicy.js` | 4 | Add Alarm normalized action/capability routing |
| `runtime/TemporaryHostActionBridge.js` | 4 | Add `alarm.stopAll()` bridge support |
| `runtime/…` small helper module | 4 | Optional split for Alarm DOM/click-path discovery if needed for file-size budget |
| `shared/theme/ThemeModel.js` | 5 | Add Alarm widget tokens + `highcontrast` values |
| `documentation/shared/theme-tokens.md` | 5 | Document new Alarm tokens |
| `README.md` | 5 | Add override examples if needed |
| `tests/cluster/viewmodels/AlarmViewModel.test.js` | 6 | New tests |
| `tests/shared/vessel/AlarmRenderModel.test.js` | 6 | New tests |
| `tests/shared/vessel/AlarmHtmlFit.test.js` | 6 | New tests |
| `tests/shared/vessel/AlarmMarkup.test.js` | 6 | New tests |
| `tests/cluster/rendering/AlarmTextHtmlWidget.test.js` | 6 | New tests |
| `tests/runtime/TemporaryHostActionBridge.test.js` | 6 | Extend bridge tests |
| `tests/cluster/rendering/ClusterSurfacePolicy.test.js` | 6 | Extend surface policy tests |
| `tests/cluster/rendering/ClusterRendererRouter.test.js` | 6 | Extend router tests |
| `tests/cluster/rendering/ClusterKindCatalog.test.js` | 6 | Extend kind-catalog tests |
| `tests/cluster/mappers/VesselMapper.test.js` | 6 | Extend mapper tests |
| `tests/config/clusters/vessel.test.js` | 6 | Extend vessel config tests |
| `tests/config/shared/kind-defaults.test.js` | 6 | Extend kind-default tests |
| `tests/shared/theme/ThemeModel.test.js` | 6 | Extend theme-token tests |
| `ROADMAP.md` | 6 | Mark Alarm as covered |
| `documentation/widgets/…` | 6 | Add or extend Alarm widget documentation |

---

## Don’ts

- Do not edit AvNav core files.
- Do not try to replace or shadow the injected core Alarm badge.
- Do not add a dyn-managed overlay workaround for badge parity.
- Do not reimplement stop-all alarm logic inside dyninstruments.
- Do not assume an `item.name === "Alarm"` host click path exists.
- Do not make the `3+` summary rule width-dependent.
- Do not collapse `colors.alarmWidget.*` back into generic `colors.alarm`.
- Do not add a canvas Alarm renderer in this rollout.

---

## Deployment Boundaries

This plan ships only the dyn HTML kind and its supporting bridge/theme/test/docs work.

Specifically:

- implemented: `dyni_Vessel_Instruments` → `kind: "alarm"`
- not implemented: injected core Alarm badge replacement
- not implemented: alarm details/history/acknowledge flows
- not implemented: keyboard or alternate host-control paths

The plan is complete when the dyn widget is implementation-ready and independently testable without changing AvNav core ownership of the native badge.

---

## Acceptance Criteria

This plan is complete only when all of the following are true:

1. `dyni_Vessel_Instruments` offers `kind: "alarm"`.
2. `vessel/alarm` routes to an HTML renderer, not canvas.
3. Idle state renders:
   - caption default `ALARM`
   - value `NONE`
   - blue indicator strip
   - passive interaction
4. The Alarm caption is user-overridable through the normal per-kind caption path.
5. Idle remains visible even when the host suppresses the native injected Alarm badge.
6. Active state renders:
   - configured caption
   - sorted alarm text
   - red background
   - no strip
7. Alarm labels come from the active alarm object keys, matching the native practical behavior.
8. For `1–2` active alarms, value is the full joined list with `, `.
9. For `3+` active alarms, value is exactly `firstName, secondName +N`.
10. The `3+` summary rule is driven by active-alarm count, not width.
11. Text shrinking follows `MapZoom` behavior.
12. Alarm supports explicit `high`, `normal`, and `flat` aspect-ratio modes.
13. Ratio thresholds are configurable through internal vessel-cluster parameters for `kind: "alarm"`.
14. `AlarmTextHtmlWidget` uses vertical shell sizing `{ kind: "ratio", aspectRatio: 2 }`.
15. Clicking the active tile stops all alarms through `TemporaryHostActionBridge.alarm.stopAll()` when host dispatch is available.
16. If host stop-all is unavailable, active Alarm remains visible but passive.
17. The bridge reuses the host-owned stop-all flow rather than reimplementing alarm logic in dyni.
18. Alarm stop-all capability works on any current page with a mounted native Alarm badge.
19. The bridge uses native `.alarmWidget` click-path discovery, not synthetic Alarm page-item parity.
20. `alarm.stopAll()` returns `false` when unsupported, throws a bridge error on post-capability rediscovery failure, and returns `true` on successful invocation.
21. Alarm widget colors are backed by new semantic `ThemeModel` tokens.
22. The `highcontrast` preset explicitly defines Alarm widget colors.
23. `user.css` can override Alarm widget colors through the new input vars.
24. Router/registry tests prove the new renderer path is resolvable.
25. No AvNav core files were modified.
26. No dyn badge/overlay workaround was introduced.
27. `npm run check:all` passes.

---

## Related

- `exec-plans/completed/PLAN6.md`
- `exec-plans/completed/PLAN7.md`
- `exec-plans/completed/PLAN8.md`
- `exec-plans/completed/PLAN9.md`
- `exec-plans/completed/PLAN11.md`
- `exec-plans/completed/PLAN13.md`