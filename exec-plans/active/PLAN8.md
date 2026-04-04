# PLAN8 — AIS Target Widget (`ais/aisTarget`)

## Status

Written after direct repository inspection of the current dyninstruments implementation, the current core AvNav `AisTarget` implementation, and the post-PLAN7 fix commits that corrected `editRoute`.

This plan is code-grounded against the verified sources named in the request. It assumes the **current** dyninstruments HTML-widget stack, not the pre-PLAN7 state. In particular, it treats the current `activeRoute`, `routePoints`, and `editRoute` stacks as the implementation baseline, and it bakes the later `editRoute` fix lessons into the contract so `aisTarget` does not repeat the same planning gaps.

The coding agent may choose equivalent internal helper extraction where that keeps files under control, but the behavior, topology, interaction contract, cluster choice, data contract, registration wiring, and regression coverage below are the plan contract.

---

## Goal

Add a new native HTML widget kind `aisTarget` to dyninstruments as `ais/aisTarget`, reproducing the core AvNav widget’s **target summary** role and **workflow entry** role while keeping the actual AIS info workflow host-owned.

Expected user-visible outcome after completion:

* A new native HTML `aisTarget` widget is available in dyninstruments.
* The widget supports `flat`, `normal`, and `high` modes.
* `.widgetContainer.vertical` is handled explicitly and forces `high`.
* `flat` maps to core AvNav’s horizontal/compact behavior.
* `normal` and `high` map to core AvNav’s non-horizontal/full behavior, with a dyn-specific explicit topology split between the two.
* The widget is page-aware:

  * on `navpage` and `gpspage`, it can enter the host AIS info workflow through the existing bridge action `hostActions.ais.showInfo(mmsi)`
  * on unsupported pages, it stays passive
  * in layout-editing mode, it is always passive
* The widget owns the click surface where core AvNav also treats the widget as the click target.
* The actual AIS info dialog/page behavior remains host-owned.
* Tests, docs, cluster registration, layout fixture coverage, and roadmap coverage are updated.
* The plan explicitly prevents the category of layout/fit/markup and interaction mistakes that had to be corrected after PLAN7.

---

## Verified Baseline

The following points were rechecked against the repos before writing this plan.

1. **Core `AisTargetWidget` is a widget-owned click target.**
   `viewer/components/AisTargetWidget.jsx` defines its own `click(ev)` handler, calls `ev.stopPropagation()`, and forwards `setav(ev, { mmsi: ... })` to `props.onClick`.

2. **Core `AisTargetWidget` reads the nearest/tracked AIS target state, not a page-local summary object.**
   `AisTargetWidget.storeKeys` includes:

   * `target: keys.nav.ais.nearest`
   * `isEditing: keys.gui.global.layoutEditing`
   * `trackedMmsi: keys.nav.ais.trackedMmsi`

3. **Core target selection is already host-owned in AIS data code.**
   `viewer/nav/aisdata.js` resolves the “nearest AIS target” by prioritizing:

   * warning target first
   * otherwise tracked target if present
   * otherwise the target flagged `nearest`
     PLAN8 must consume that result, not re-invent target selection.

4. **Core display density split is only two-way: horizontal vs non-horizontal.**
   In `AisTargetWidget.jsx`, `small = props.mode === "horizontal"`. There is no separate core `high`/`normal` distinction.

5. **Core horizontal/compact mode field set is smaller than full mode.**
   `AisSmallDisplay` renders:

   * front initial (`display.front.substring(0, 1)`)
   * `DST`
   * either `TCPA` or `BRG`
   * optional local color bar/badge
     It does **not** render the ship name or `DCPA`.

6. **Core non-horizontal/full mode field set is:**

   * row 1: `DST` + name/MMSI
   * row 2: `DCPA` + `TCPA` when `tcpa > 0`, else `BRG` + blank second slot
   * row 3: optional color badge + pass-front/back text
     This is explicit in `AisFullDisplay`.

7. **Core branch logic is `tcpa > 0`, not “tcpa exists”.**
   `AisTargetWidget.jsx` shows `DCPA` + `TCPA` only when `target.tcpa > 0`; otherwise it shows `BRG`.

8. **Core field formatting comes from `viewer/nav/aisformatter.jsx`.**
   The relevant subset is:

   * `distance` → headline `DST`, unit `nm`
   * `cpa` → headline `DCPA`, unit `nm`
   * `tcpa` → headline `TCPA`, unit `min`
   * `headingTo` → headline `BRG`, unit `°`
   * `nameOrmmsi` → AtoN name override, then ship name, else MMSI
   * `passFront` → `Front` / `Back` / `Pass` / `Done` / `-` based on `cpa` and `passFront`

9. **Core color behavior has a real legacy split.**
   In `AisTargetWidget.jsx`:

   * `legacy === false` → local badge/bar color only (`display.iconColor`)
   * `legacy === true` → whole widget background tinted, local badge suppressed
     `legacy` is an actual core editable parameter and is not optional parity.

10. **Core color-state precedence is not arbitrary.**
    `viewer/util/propertyhandler.js#getAisColor` uses:

    * warning color when `(target.warning && properties.aisMarkAllWarning) || target.nextWarning`
    * else nearest color when `target.nearest`
    * else tracking color when `target.mmsi === trackedMmsi`
    * else normal color

11. **Core click workflow is page-owned after the widget raises the click.**

    * `viewer/gui/NavPage.jsx`: `widgetClick()` special-cases `item.name == "AisTarget"` and calls `showAisInfo(mmsi)`
    * `viewer/gui/GpsPage.jsx`: `onItemClick()` special-cases `item.name === "AisTarget"` and opens `AisInfoWithFunctions`

12. **Core `navpage` and `gpspage` do not handle `AisTarget` identically.**

    * `NavPage` routes through `showAisInfo(mmsi)`
    * `GpsPage` directly returns `AisInfoWithFunctions`
      The widget is therefore a **workflow entry**, not the workflow implementation.

13. **Core no-MMSI behavior matters.**

    * `AisTargetWidget.jsx` renders only when `target.mmsi !== undefined` **or** `props.mode === "gps"` **or** `props.isEditing`
    * `NavPage.showAisInfo(mmsi)` returns early when MMSI is missing
    * `GpsPage` special-cases `AisTarget` and returns early when `mmsi === undefined`
      This means core can intentionally swallow a GPS-page widget click even when there is no dispatchable target.

14. **Core `AisTarget` is used on both `navpage` and `gpspage`.**
    `viewer/components/WidgetList.js` registers `AisTarget`, and the default layout includes it on both pages.

15. **Current dyn runtime already exposes the required host bridge action.**
    `runtime/TemporaryHostActionBridge.js` provides `hostActions.ais.showInfo(mmsi)` and already normalizes MMSI to string or throws on invalid input.

16. **Current bridge capabilities are page-aware and already correct for this widget.**
    `TemporaryHostActionBridge.buildCapabilitiesSnapshot()` reports:

    * `ais.showInfo === "dispatch"` on `navpage`
    * `ais.showInfo === "dispatch"` on `gpspage`
    * `ais.showInfo === "unsupported"` elsewhere
      No new bridge API is needed.

17. **Current bridge dispatch path is a synthetic page item click, not a direct AIS dialog API.**
    `hostActions.ais.showInfo(mmsi)` dispatches via `dispatchViaPageItemClick("ais.showInfo", pageId, { item: { name: "AisTarget" }, mmsi })`. PLAN8 must reuse that existing path.

18. **Current bridge tests already pin the capability and payload shape.**
    `tests/runtime/TemporaryHostActionBridge.test.js` already verifies `ais.showInfo === "dispatch"` on `gpspage` and the dispatched payload `{ item: { name: "AisTarget" }, mmsi: "123456789" }`.

19. **Current dyn HTML widget architecture already has the right references.**

    * `ActiveRouteTextHtmlWidget` is the closest compact summary-widget reference for ratio-based density switching.
    * `RoutePointsTextHtmlWidget` is the strongest reference for page-aware dispatch/passive interaction.
    * `EditRouteTextHtmlWidget` is the strongest reference for committed `.widgetContainer.vertical` detection and post-commit corrective resize.

20. **Current dyn renderer catalog/router already treats HTML widgets as explicit kind entries.**
    `cluster/rendering/ClusterKindCatalog.js` and `ClusterRendererRouter.js` already register `nav/activeRoute`, `nav/editRoute`, `nav/routePoints`, and `map/zoom`. `AisTarget` needs the same explicit path; it is not “automatic”.

21. **Current roadmap already points toward a separate `ais` cluster.**
    `ROADMAP.md` explicitly lists:

    * planned new cluster: `ais` (for example `aisTarget`)
    * `AisTarget` not covered yet
    * `AisTarget` classified as a “Widget-owned click target with page/API workflow”
      PLAN8 should follow that architecture unless code evidence contradicts it. It does not.

22. **Post-PLAN7 fixes exposed concrete planning gaps that apply here.**

    * `d3751be`: missing real core-exposed editables was a planning gap
    * `2a844ba`, `9c006f3`, `961146c`: layout/fit/markup contract and geometry ownership were underspecified
    * `26f1450`: flat-mode unit placement was over-invented and had to be reverted
      PLAN8 must lock down mode topology, unit/caption presence, measurement ownership, and resize-signature inputs up front.

---

## Concept Specification

This section is the authoritative contract for `ais/aisTarget`.

### Exposed Settings

### `aisTargetRatioThresholdNormal`

* type: `FLOAT`
* default: `1.2`
* internal: `true`

Behavior:

* If shell aspect ratio is below this threshold, the widget resolves to `high`, unless `.widgetContainer.vertical` has already forced `high`.

Rationale:

* `AisTarget` is a compact summary/workflow-entry widget and is closer to `activeRoute`/`editRoute` than to the multi-row list behavior of `routePoints`.

### `aisTargetRatioThresholdFlat`

* type: `FLOAT`
* default: `3.8`
* internal: `true`

Behavior:

* If shell aspect ratio is above this threshold, the widget resolves to `flat`, unless `.widgetContainer.vertical` has already forced `high`.

### `legacy`

* type: `BOOLEAN`
* default: `false`

Behavior:

* `false` → local AIS state badge/bar only
* `true` → full widget background tint, no local badge/bar

This setting is **required in PLAN8**. It is a real core editable and must not be deferred.

### No caption/unit editables in PLAN8

PLAN8 does **not** add caption text editables or unit text editables for AIS fields.

Reason:

* Core `AisTargetWidget` exposes `legacy`, not per-field label/unit editables.
* The PLAN7 `d3751be` fix teaches “do not omit real core editables”, not “invent new editables that core does not expose”.

The visible headlines and units are therefore fixed in PLAN8:

* `DST` / `nm`
* `DCPA` / `nm`
* `TCPA` / `min`
* `BRG` / `°`

---

### Cluster Shape

PLAN8 creates a **new `ais` cluster** with a single native HTML kind `aisTarget`.

This is the correct choice.

Reasons:

1. `ROADMAP.md` already planned a dedicated `ais` cluster.
2. `AisTarget` is not route-summary data and does not belong semantically inside the current `nav` route/waypoint summary grouping.
3. The widget has AIS-specific target, color-state, and host-workflow semantics that should not be mixed into `NavMapper`.
4. A dedicated cluster leaves room for future AIS widgets without reopening `nav` cluster boundaries.

PLAN8 therefore does **not** append `aisTarget` to `nav`.

---

### Mode Rules

Resolved mode is determined by:

* `.widgetContainer.vertical` committed ancestry → force `high`
* else ratio `< aisTargetRatioThresholdNormal` → `high`
* else ratio `> aisTargetRatioThresholdFlat` → `flat`
* else → `normal`

Core parity mapping:

* `flat` = core horizontal-equivalent density
* `normal` = core non-horizontal-equivalent density
* `high` = dyn narrow-shell form of the same non-horizontal-equivalent field set
* `.widgetContainer.vertical` does **not** add extra data beyond `high`; it only forces the `high` topology

### Explicit `.widgetContainer.vertical` behavior

This is not implicit.

PLAN8 contract:

1. committed `.widgetContainer.vertical` ancestry is detected exactly the same way `EditRouteTextHtmlWidget` detects it, via committed host elements (`hostContext.__dyniHostCommitState`)
2. first render may occur before committed ancestry is discoverable
3. the widget must therefore trigger a corrective resize after init, again following the current HTML-widget pattern
4. vertical forces `high`
5. vertical does **not** introduce a special AIS min-height rule
6. vertical does **not** add an aspect-ratio or natural-height contract
7. vertical does **not** change field visibility beyond forcing `high`

This differs from `editRoute`, and the difference is intentional: core AvNav has no AIS-specific vertical shell growth rule to preserve.

---

### State Model

The renderer contract must distinguish at least these states:

* `hasTargetObject`
* `hasValidMmsi`
* `isGpsPage`
* `isLayoutEditing`
* `captureClicks`
* `canDispatchShowInfo`
* `showTcpaBranch` (`tcpa > 0`)
* `legacy`
* `colorRole` = `warning` / `nearest` / `tracking` / `normal` / `none`
* `hasColor`
* `renderPolicy` = `hidden` / `placeholder` / `data`

#### `hasValidMmsi`

This is the interaction/render gating key.

Valid MMSI normalization for PLAN8:

* finite number → decimal string via truncation
* non-empty trimmed string → trimmed string
* otherwise invalid / empty

No dispatch attempt may be made without a valid normalized MMSI.

#### `showTcpaBranch`

`showTcpaBranch === true` only when `tcpa > 0`.

That branch rule must be used consistently for:

* field visibility
* topology selection
* resize signature
* fit inputs

---

### Exact Field Contract

| Field                     | Source meaning                                 | `flat`      | `normal`    | `high`      | Caption box | Value box | Unit box |
| ------------------------- | ---------------------------------------------- | ----------- | ----------- | ----------- | ----------- | --------- | -------- |
| `frontInitial`            | first character of `frontText`                 | yes         | no          | no          | no          | yes       | no       |
| `frontText`               | pass-front/back text                           | no          | yes         | yes         | no          | yes       | no       |
| `distance`                | target distance                                | yes         | yes         | yes         | yes         | yes       | yes      |
| `nameOrMmsi`              | AtoN/name/MMSI text                            | no          | yes         | yes         | no          | yes       | no       |
| `cpa`                     | DCPA                                           | no          | conditional | conditional | yes         | yes       | yes      |
| `tcpa`                    | TCPA                                           | conditional | conditional | conditional | yes         | yes       | yes      |
| `headingTo`               | BRG fallback when no positive TCPA             | conditional | conditional | conditional | yes         | yes       | yes      |
| `stateBadge` / `stateBar` | local AIS state color                          | conditional | conditional | conditional | no          | yes       | no       |
| `fillerSlot`              | empty geometry slot for normal BRG branch only | no          | conditional | no          | no          | no        | no       |

Rules:

* only metric fields (`distance`, `cpa`, `tcpa`, `headingTo`) get caption/value/unit geometry
* text fields (`nameOrMmsi`, `frontText`, `frontInitial`) never reserve unit geometry
* the filler slot is a real layout slot only where explicitly stated, and it contains no hidden caption/unit boxes
* units are inline in **all** modes; PLAN8 must not invent below-value unit stacking

---

### Exact Topology Per Mode

Only spacing constants are implementation-tunable. The box topology is fixed.

#### Shared structural nodes

When `renderPolicy !== "hidden"`, the widget has:

* `wrapper`
* one mode-specific content topology
* no partial click hotspot; click ownership, when active, is wrapper-owned

#### `flat` topology

`flat` is the compact horizontal-equivalent topology.

It contains:

1. `flatUpper`

   * `frontInitialCell`
   * `flatMetricStack`

     * `distanceMetric`
     * `secondaryMetric`

       * `tcpaMetric` when `showTcpaBranch`
       * otherwise `headingMetric`
2. optional `flatStateBar` only when `legacy === false` and `hasColor`

It does **not** contain:

* `nameOrMmsi`
* `cpa`
* `frontText`

Rules:

* `frontInitialCell` has value text only
* `distanceMetric` and `secondaryMetric` use inline caption → value → unit
* the optional state bar is a pure color element, not a text slot
* there is no filler cell in `flat`

#### `normal` topology

`normal` mirrors the core non-horizontal/full layout as closely as possible.

It contains three bands:

1. `rowPrimary`

   * `distanceMetric`
   * `nameCell`
2. `rowSecondary`

   * when `showTcpaBranch`

     * `cpaMetric`
     * `tcpaMetric`
   * otherwise

     * `headingMetric`
     * `secondaryFiller`
3. `rowState`

   * optional `stateBadge` only when `legacy === false` and `hasColor`
   * `frontTextCell`

Rules:

* `rowPrimary` keeps `distanceMetric` and `nameCell` side-by-side
* `rowSecondary` always has two slots in `normal`
* the BRG branch keeps the blank second slot to mirror core topology
* `secondaryFiller` is layout-owned empty space only; it must not create fake metric measurement boxes
* `rowState` always exists in `data` mode, even when no local badge is shown

#### `high` topology

`high` is the dyn explicit narrow-shell form of the same non-horizontal field set.

It contains four bands:

1. `rowDistance`

   * `distanceMetric`
2. `rowName`

   * `nameCell`
3. `rowSecondary`

   * when `showTcpaBranch`

     * `cpaMetric`
     * `tcpaMetric`
   * otherwise

     * `headingMetric` spanning the row
4. `rowState`

   * optional `stateBadge` only when `legacy === false` and `hasColor`
   * `frontTextCell`

Rules:

* unlike `normal`, `high` does **not** preserve a blank second slot for the BRG branch
* `rowName` is always full-width
* `rowState` remains a badge-plus-text row, not a second metric row
* `high` shows the same data set as `normal`, but with a different explicit box topology

#### `.widgetContainer.vertical`

`.widgetContainer.vertical` uses the `high` topology exactly.

It does not introduce a fifth row, extra detail, or special shell height logic.

---

### No-Target State Behavior

This must be explicit because core behavior is conditional.

PLAN8 render policy:

* `data` when `hasValidMmsi`
* `placeholder` when **no valid MMSI** and either:

  * current page is `gpspage`, or
  * layout-editing mode is active
* `hidden` when **no valid MMSI** on all other pages

This is the correct parity target because it matches the core conditions:

* core renders without MMSI in GPS mode
* core renders without MMSI in layout editing
* core returns `null` outside those cases

#### Placeholder contract

Placeholder text is fixed as `No AIS`.

Placeholder topology:

* one centered text value block only
* no metric boxes
* no color badge/bar
* no fake caption/unit geometry

---

### No-MMSI Behavior

If a target object exists but has no valid MMSI:

* treat it exactly as no target for render policy and interaction
* do not try to show local color state
* do not dispatch `hostActions.ais.showInfo`
* do not synthesize a fallback “MMSI” display string from invalid data

---

### Color / Badge / State Contract

The widget must reproduce core state color semantics, but as a local HTML widget.

#### Color role precedence

Use this exact precedence:

1. `warning` when `(warning === true && aisMarkAllWarning === true) || nextWarning === true`
2. else `nearest` when `nearest === true`
3. else `tracking` when `mmsi === trackedMmsi`
4. else `normal` when `hasValidMmsi`
5. else `none`

#### Color value source

The widget must consume the actual host style values from mapped store keys, not hardcoded local constants:

* `properties.style.aisWarningColor`
* `properties.style.aisNearestColor`
* `properties.style.aisTrackingColor`
* `properties.style.aisNormalColor`

#### Presentation split

* `legacy === false`

  * `flat`: optional local state bar
  * `normal` / `high`: optional local state badge
  * wrapper background stays neutral
* `legacy === true`

  * wrapper background tinted
  * local badge/bar suppressed

There is no color output when `colorRole === "none"`.

---

### Click Ownership Rules

This widget is a **widget-owned full-surface click target** on supported pages.

There are two separate booleans and they must stay separate:

#### `captureClicks`

`captureClicks === true` when all of the following are true:

* not layout editing
* host capabilities exist
* `capabilities.ais.showInfo === "dispatch"`
* and either:

  * `hasValidMmsi`, or
  * `pageId === "gpspage"` and the widget is rendered in placeholder mode

#### `canDispatchShowInfo`

`canDispatchShowInfo === true` when:

* `captureClicks === true`
* `hasValidMmsi === true`

#### Click behavior

* full wrapper surface owns click when `captureClicks === true`
* no partial hotspot
* no row-only hotspot
* markup references `catchAll` only in click-capturing states
* named handler is a real named handler such as `aisTargetShowInfo`, never `catchAll`

Handler behavior:

* when `canDispatchShowInfo === true`:

  * call `hostContext.hostActions.ais.showInfo(mmsi)`
* when `captureClicks === true` but `canDispatchShowInfo === false`:

  * swallow click and return `false`
  * do **not** dispatch bridge action

This last rule is required to preserve the core GPS-page behavior and prevent unintended `GpsPage` click-to-navigate fallthrough when the widget is visible but has no dispatchable MMSI.

---

### Layout-Editing Passivity

In layout-editing mode:

* widget is always passive
* no click capture
* no dispatch
* placeholder rendering is allowed per no-target policy
* resize signature must still include editing/passive state so the wrapper click attribute can change deterministically

---

### Widget-Size Rules

PLAN8 does **not** introduce a shell-sizing contract beyond current host sizing.

Explicitly:

* no AIS-specific min-height rule
* no natural-height expansion contract
* no aspect-ratio enforcement
* no vertical-only shell size inflation

All geometry is computed within the host-provided shell rect.

This is deliberate and differs from `editRoute`.

---

### Text Sizing / Fit Rules

The fit contract must be explicit to avoid PLAN7-style drift.

1. `AisTargetLayout` owns box topology and geometric allocation.
2. `AisTargetHtmlFit` only measures text into boxes that actually exist in markup.
3. CSS must not redefine row/column topology independently of layout math.
4. Metric boxes that have caption/value/unit must be measured as such in all modes.
5. Text-only cells (`nameCell`, `frontTextCell`, `frontInitialCell`) must not reserve unit width.
6. The `secondaryFiller` in `normal` BRG branch must remain an empty geometry slot, not a hidden metric slot.
7. Units remain inline in every mode.
8. The fit inputs must include:

   * resolved mode
   * render policy
   * `legacy`
   * `captureClicks`
   * `showTcpaBranch`
   * vertical committed flag
   * every rendered label/value/unit string
   * shell width and height

Unlike `editRoute`, there is no separate vertical width-only anchoring rule here because vertical does not own shell height.

---

### Key / Data Contract

The new `ais` cluster must expose at least these store keys:

* `target: "nav.ais.nearest"`
* `trackedMmsi: "nav.ais.trackedMmsi"`
* `aisMarkAllWarning: "properties.aisMarkAllWarning"`
* `aisWarningColor: "properties.style.aisWarningColor"`
* `aisNearestColor: "properties.style.aisNearestColor"`
* `aisTrackingColor: "properties.style.aisTrackingColor"`
* `aisNormalColor: "properties.style.aisNormalColor"`

No new AvNav store keys are required.

### Viewmodel contract

A dedicated `AisTargetViewModel` is required.

Its job is to normalize host AIS data into a renderer-safe domain object, including:

* normalized `mmsi`
* raw numeric/text fields needed for formatting
* `showTcpaBranch`
* normalized `nameOrMmsi` source fields
* normalized `frontText`
* `frontInitial`
* color-role inputs
* `hasValidMmsi`

It must fail closed on malformed targets and return a safe “no target” domain, not throw.

### Formatter contract

PLAN8 must mirror the core `AisFormatter` subset used by the widget.

That subset includes:

* `distance`
* `cpa`
* `tcpa`
* `headingTo`
* `nameOrmmsi`
* `passFront`

Important constraints:

* do not substitute a generic formatter unless verified equivalent
* `TCPA` minute formatting must follow the core semantics, including the seconds-to-minutes conversion and digit behavior
* `nameOrmmsi` must preserve the AtoN/name/MMSI fallback order
* `passFront` must preserve `Front` / `Back` / `Pass` / `Done` / `-`

### Mapper output contract

`AisMapper` must emit a dedicated renderer payload for `AisTargetTextHtmlWidget`, not generic text-widget output.

Required payload groups:

* `renderer: "AisTargetTextHtmlWidget"`
* `domain`

  * normalized target state and display-ready branch booleans
* `layout`

  * `ratioThresholdNormal`
  * `ratioThresholdFlat`
* `appearance`

  * `legacy`
  * resolved color inputs / role inputs
* fixed `labels`
* fixed `units`

Interaction gating is **not** mapper-owned. It remains render-model-owned because it depends on `hostContext`.

---

## Architecture Notes

### Best existing dyn references

PLAN8 should explicitly borrow from three existing dyn stacks:

1. **`ActiveRouteTextHtmlWidget`**

   * ratio-based mode switching for compact summary widgets
   * HTML-shell renderer structure

2. **`RoutePointsTextHtmlWidget`**

   * page-aware capability gating
   * full-surface `catchAll` ownership only when interaction is active
   * host-action dispatch separation from display

3. **`EditRouteTextHtmlWidget`**

   * committed `.widgetContainer.vertical` detection
   * post-commit corrective resize
   * hard lessons around layout/fit/markup ownership

No single existing widget is a drop-in template. PLAN8 must combine these three references deliberately.

### Dedicated `AisTargetViewModel` is required

`AisTarget` needs its own domain normalization because it is not a plain numeric widget and not a route widget. It has:

* target-presence gating
* MMSI normalization
* AtoN/name/MMSI fallback
* pass-front text derivation
* color-role derivation inputs
* branch logic for `TCPA` vs `BRG`

That is too specific to leave inside a mapper or renderer shell.

### A new `ais` cluster is required

This is not just a roadmap preference. It is the cleanest architectural fit.

Reasons:

* keeps `NavMapper` focused on current route/waypoint/navigation summary kinds
* keeps AIS-specific store keys and color-state logic out of `nav`
* matches roadmap direction
* creates future room for additional AIS widgets without reopening cluster boundaries

### Widget vs host workflow parity split

PLAN8 parity is split exactly like the core code already splits it.

#### Widget-owned in PLAN8

* target summary display
* mode selection
* local color/badge presentation
* full-surface click ownership on supported pages
* no-target / placeholder / hidden behavior
* deciding when to call `hostActions.ais.showInfo(mmsi)`

#### Host-owned and out of scope

* AIS info dialog contents
* dialog buttons and actions
* tracking/hide/locate functions
* page-specific dialog mechanics
* page navigation behavior outside the widget-owned click surface

PLAN8 must **not** attempt to clone `AisInfoWithFunctions` or page dialog logic.

### PLAN7 aftermath lessons being baked in

This plan intentionally closes the gaps that had to be fixed after `editRoute` landed.

1. **Real core editables are included up front.**
   `legacy` is included in PLAN8 from day one.

2. **Topology per mode is fixed up front.**
   `flat`, `normal`, and `high` each have explicit node structure. `high` is not left as “similar to normal”.

3. **Caption/value/unit presence is explicit per field.**
   Name/front/badge/filler have no unit boxes. Metric fields do.

4. **No invented flat-mode unit stacking.**
   Units stay inline in all modes.

5. **Geometry ownership is layout-owned, not CSS-owned.**
   CSS may style the layout but must not silently redefine the measured structure.

6. **Resize-signature inputs are explicit.**
   Mode, vertical, render policy, interaction state, branch state, and all displayed strings must participate.

7. **Vertical behavior is explicit.**
   It forces `high`, but does not own shell growth.

8. **Placeholder and passive states are explicit.**
   No “implicit maybe-null maybe-visible” behavior is left to implementation guesswork.

---

## Hard Constraints

### Architectural constraints

* No implementation inside the core AvNav repo.
* No new bridge API.
* No direct dependency on `AisInfoWithFunctions` or page/dialog internals from the dyn widget.
* No AIS target selection reimplementation beyond consuming `nav.ais.nearest`.
* Use a new `ais` cluster, not `nav`.

### Behavioral constraints

* `flat` must omit name and `DCPA`.
* `normal` and `high` must include the full non-horizontal field set.
* `showTcpaBranch` is `tcpa > 0` only.
* `legacy` must be supported in PLAN8.
* No field may reserve a unit box unless it actually renders a unit.
* No flat-mode unit-below-value variant is allowed.

### Interaction constraints

* Full-surface click ownership only.
* On supported pages, click capture and dispatchability are separate states.
* In layout-editing mode, always passive.
* On unsupported pages, passive.
* With no valid MMSI on GPS page, capture click and no-op to avoid host fallthrough.
* Never dispatch `hostActions.ais.showInfo` without a valid normalized MMSI.

### Vertical-mode and resize-signature constraints

* `.widgetContainer.vertical` is detected from committed ancestry.
* `initFunction.triggerResize()` is required so the first committed vertical rerender can correct mode.
* Vertical does not introduce shell height rules.
* Resize signature must include:

  * mode
  * render policy
  * vertical committed flag
  * `legacy`
  * click capture / dispatchability state
  * branch state
  * all visible strings
  * shell width and height

### Scope boundaries

PLAN8 does **not** include:

* inline AIS detail dialog
* map centering / hide / track buttons
* new route/page workflow
* broad host refactors
* new generic formatter framework work
* merging `AisTarget` into existing `nav` cluster infrastructure

---

## Implementation Order

### Phase 1 — New cluster and bootstrap wiring

Create the new `ais` cluster and register it end to end.

#### Files to create

* `config/clusters/ais.js`
* `cluster/mappers/AisMapper.js`
* `cluster/viewmodels/AisTargetViewModel.js`

#### Files to change

* `plugin.js`

  * load `config/clusters/ais.js`
* `config/components/registry-cluster.js`

  * register `AisTargetViewModel`
  * register `AisMapper`
  * add `AisMapper` to `ClusterMapperRegistry` deps
  * add `AisTargetTextHtmlWidget` to `ClusterRendererRouter` deps
* `cluster/mappers/ClusterMapperRegistry.js`

  * add the `ais` mapper module id
* `cluster/rendering/ClusterKindCatalog.js`

  * add `ais/aisTarget`
* `cluster/rendering/ClusterRendererRouter.js`

  * route `AisTargetTextHtmlWidget`

#### Contract to land in this phase

* new cluster exists
* widget can be declared in layouts
* mapper/viewmodel path is wired
* renderer can be registered even if the HTML implementation is still a stub

#### Tests to update/add in this phase

* `tests/config/clusters/ais.test.js`
* `tests/cluster/mappers/ClusterMapperRegistry.test.js`
* `tests/cluster/rendering/ClusterKindCatalog.test.js`
* `tests/cluster/rendering/ClusterRendererRouter.test.js`
* `tests/config/components.test.js`
* `tests/plugin/plugin-bootstrap.test.js`

---

### Phase 2 — Domain normalization and mapper contract

Implement the AIS-specific data contract cleanly before the HTML renderer.

#### Files to create

* `cluster/viewmodels/AisTargetViewModel.js`
* `cluster/mappers/AisMapper.js`

#### Viewmodel requirements

Normalize:

* target object
* MMSI
* `distance`
* `cpa`
* `tcpa`
* `headingTo`
* `shipname`
* AtoN name
* `type`
* `passFront`
* warning/nearest/tracking inputs
* color-role inputs
* `showTcpaBranch`
* `frontText`
* `frontInitial`
* `nameOrMmsi`

#### Mapper requirements

Emit:

* `renderer`
* `domain`
* `layout`
* `appearance`
* fixed labels
* fixed units

Do **not** put page-capability logic in the mapper.

#### Tests to add

* `tests/cluster/viewmodels/AisTargetViewModel.test.js`
* `tests/cluster/mappers/AisMapper.test.js`

Those tests must pin:

* MMSI normalization
* AtoN/name/MMSI fallback
* `passFront` text behavior
* `tcpa > 0` branch selection
* color-role precedence inputs
* `legacy` and ratio-threshold propagation

---

### Phase 3 — Shared layout, fit, render-model, and markup

Build the measured HTML contract before the renderer shell.

#### Files to create

* `shared/widget-kits/ais/AisTargetLayout.js`
* `shared/widget-kits/ais/AisTargetHtmlFit.js`
* `shared/widget-kits/ais/AisTargetRenderModel.js`
* `shared/widget-kits/ais/AisTargetMarkup.js`

#### Files to change

* `config/components/registry-shared-foundation.js`

  * register `AisTargetLayout`
  * register `AisTargetHtmlFit`
* `config/components/registry-widgets.js`

  * register `AisTargetRenderModel`
  * register `AisTargetMarkup`

#### Layout requirements

`AisTargetLayout.js` owns:

* mode resolution inputs
* row/slot geometry for `flat`, `normal`, and `high`
* explicit handling of:

  * `showTcpaBranch`
  * `secondaryFiller`
  * badge/bar geometry
  * placeholder layout

No CSS-only topology ownership is allowed.

#### Render-model requirements

`AisTargetRenderModel.js` owns:

* render policy (`hidden` / `placeholder` / `data`)
* page-aware click capture state
* page-aware dispatchability
* committed vertical mode forcing
* fixed labels/units
* resize signature parts

It should expose helpers equivalent in spirit to:

* `canCaptureClicks()`
* `canDispatchShowInfo()`
* `buildResizeSignatureParts()`

#### Markup requirements

`AisTargetMarkup.js` must render only nodes that the fit/layout contract actually measures.

It must explicitly:

* add wrapper `onclick="catchAll"` only when `captureClicks === true`
* omit `catchAll` otherwise
* render no hidden fake metric boxes for name/front/filler

#### Tests to add

* `tests/shared/ais/AisTargetLayout.test.js`
* `tests/shared/ais/AisTargetHtmlFit.test.js`
* `tests/shared/ais/AisTargetRenderModel.test.js`
* `tests/shared/ais/AisTargetMarkup.test.js`

Those tests must cover:

* exact topology per mode
* unit-box presence only on metric fields
* no filler metric boxes
* placeholder vs hidden behavior
* vertical forced-high behavior
* resize-signature sensitivity to all layout-affecting inputs

---

### Phase 4 — HTML widget shell and CSS

Add the actual native HTML renderer.

#### Files to create

* `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
* `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`

#### Files to change

* `config/components/registry-widgets.js`

  * register `AisTargetTextHtmlWidget`
* `config/components/registry-cluster.js`

  * add widget dependency
* `cluster/rendering/ClusterRendererRouter.js`

  * ensure HTML surface route reaches the new widget

#### Renderer-shell requirements

The renderer must follow the current HTML widget pattern:

* resolve committed host elements
* detect committed `.widgetContainer.vertical`
* resolve shell rect
* build model
* compute fit
* render markup
* expose named handlers only
* trigger corrective resize on init

Named handler contract:

* `aisTargetShowInfo`

  * if dispatchable, call `hostActions.ais.showInfo(mmsi)`
  * if only click-capturing, return `false`
  * if neither, do not register the handler

#### CSS requirements

CSS may style the layout but must not change the declared structure.

Specific anti-regression rule:

* do not create CSS-only row/column behavior that invalidates `AisTargetLayout` geometry
* do not reintroduce stacked unit placement in flat mode
* do not create fake reserved width for unitless text cells

#### Tests to add

* `tests/cluster/rendering/AisTargetTextHtmlWidget.test.js`

That test must cover:

* wrapper click attribute on supported vs passive contexts
* GPS no-MMSI click capture/no-op state
* vertical-mode correction path
* render-policy differences (`hidden`, `placeholder`, `data`)
* legacy vs non-legacy class/style outputs

---

### Phase 5 — Layout fixture, docs, and roadmap closure

Finalize discoverability and regression coverage.

#### Files to change

* `tests/layouts/gpspage-all-widgets.json`

  * add a native `ais/aisTarget` cluster instance
* `tests/layouts/gpspage-all-widgets.test.js`

  * update expectations
* `documentation/widgets/ais-target.md`

  * new widget doc
* `documentation/architecture/cluster-widget-system.md`

  * add `ais/aisTarget` to architecture coverage
* `documentation/avnav-api/interactive-widgets.md`

  * document the `AisTarget` click-capture vs dispatch split
* `documentation/avnav-api/plugin-lifecycle.md`

  * note that `AisTarget` uses existing `hostActions.ais.showInfo(mmsi)` with no new API
* `documentation/avnav-api/core-key-catalog.md`

  * add new AIS-cluster store-key coverage
* `ROADMAP.md`

  * mark `AisTarget` covered and `ais` cluster started/landed

#### Optional bridge test touch

`runtime/TemporaryHostActionBridge.js` is not expected to change.
`tests/runtime/TemporaryHostActionBridge.test.js` should only be extended if implementation accidentally forces bridge changes. The preferred PLAN8 path is to rely on the existing bridge contract unchanged.

---

## Affected File Map

### New cluster/config files

* `config/clusters/ais.js`
  New cluster definition, store keys, and widget editables.

* `cluster/mappers/AisMapper.js`
  AIS cluster translation.

* `cluster/viewmodels/AisTargetViewModel.js`
  AIS target normalization and display-domain derivation.

### Shared widget-kit files

* `shared/widget-kits/ais/AisTargetLayout.js`
  Topology owner for `flat` / `normal` / `high`.

* `shared/widget-kits/ais/AisTargetHtmlFit.js`
  Text fitting consistent with the layout contract.

* `shared/widget-kits/ais/AisTargetRenderModel.js`
  Render policy, interaction gating, resize signature.

* `shared/widget-kits/ais/AisTargetMarkup.js`
  Markup contract matching layout/fit exactly.

### HTML renderer files

* `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`
  HTML widget shell, host-context integration, handler wiring.

* `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`
  Visual styling only, not topology ownership.

### Registry/router/catalog/bootstrap files

* `plugin.js`
  Load new cluster config file.

* `config/components/registry-cluster.js`
  Register mapper/viewmodel/widget/router deps.

* `config/components/registry-shared-foundation.js`
  Register shared layout/fit modules.

* `config/components/registry-widgets.js`
  Register render-model/markup/widget modules.

* `cluster/mappers/ClusterMapperRegistry.js`
  Add `AisMapper`.

* `cluster/rendering/ClusterKindCatalog.js`
  Add `ais/aisTarget`.

* `cluster/rendering/ClusterRendererRouter.js`
  Route renderer id to HTML surface.

### Tests

* `tests/config/clusters/ais.test.js`
* `tests/cluster/viewmodels/AisTargetViewModel.test.js`
* `tests/cluster/mappers/AisMapper.test.js`
* `tests/shared/ais/AisTargetLayout.test.js`
* `tests/shared/ais/AisTargetHtmlFit.test.js`
* `tests/shared/ais/AisTargetRenderModel.test.js`
* `tests/shared/ais/AisTargetMarkup.test.js`
* `tests/cluster/rendering/AisTargetTextHtmlWidget.test.js`
* `tests/cluster/mappers/ClusterMapperRegistry.test.js`
* `tests/cluster/rendering/ClusterKindCatalog.test.js`
* `tests/cluster/rendering/ClusterRendererRouter.test.js`
* `tests/config/components.test.js`
* `tests/plugin/plugin-bootstrap.test.js`
* `tests/layouts/gpspage-all-widgets.json`
* `tests/layouts/gpspage-all-widgets.test.js`

### Docs

* `documentation/widgets/ais-target.md`
* `documentation/architecture/cluster-widget-system.md`
* `documentation/avnav-api/interactive-widgets.md`
* `documentation/avnav-api/plugin-lifecycle.md`
* `documentation/avnav-api/core-key-catalog.md`
* `ROADMAP.md`

### Reference-only / no change expected

* `runtime/TemporaryHostActionBridge.js`
* `tests/runtime/TemporaryHostActionBridge.test.js`

These were verified and should remain unchanged unless the implementation unexpectedly proves the existing bridge contract insufficient.

---

## Don’ts

* Do not implement any AIS dialog, info panel, tracking action, hide action, or map-centering action in dyn.
* Do not add a new bridge API.
* Do not append `aisTarget` to the existing `nav` cluster.
* Do not omit `legacy`; that would repeat the kind of omission fixed in `d3751be`.
* Do not describe `high` as merely “similar to normal” without using the explicit topology in this plan.
* Do not reserve unit geometry for `nameOrMmsi`, `frontText`, `frontInitial`, badge/bar, or filler.
* Do not invent a flat stacked-unit arrangement.
* Do not let CSS secretly redefine measured row/column behavior.
* Do not make click ownership partial or row-specific.
* Do not dispatch `ais.showInfo` without a valid MMSI.
* Do not leave GPS no-MMSI click behavior to chance; it must be explicitly swallowed when rendered.
* Do not introduce a special vertical shell growth rule for this widget.

---

## Deployment Boundaries

### Boundary A — Structural landing

It is acceptable to land:

* new `ais` cluster
* mapper/viewmodel wiring
* renderer registration
* passive rendering

only if the widget still obeys the exact topology and render-policy contract.

### Boundary B — Interaction landing

Interaction may land after rendering, but only when all of the following are true:

* full-surface capture is page-aware
* dispatch only occurs on supported pages with valid MMSI
* GPS no-MMSI placeholder clicks are swallowed
* layout-editing mode is passive

### Boundary C — Final closure

The feature is not complete until:

* layout fixture coverage is updated
* widget docs exist
* roadmap coverage is updated
* regression tests cover mode topology, no-target behavior, and interaction gating

---

## Acceptance Criteria

1. A new `ais` cluster exists and is bootstrap-loaded by `plugin.js`.
2. The new cluster is registered in component registries, mapper registry, renderer router, and kind catalog.
3. A layout can instantiate `ais/aisTarget` without missing-module or missing-kind failures.
4. `AisTarget` consumes `nav.ais.nearest` and does not reimplement target selection.
5. `legacy` is a supported editable with default `false`.
6. `flat` renders:

   * front initial
   * `DST`
   * either `TCPA` or `BRG`
   * optional local state bar when non-legacy
     and it omits name and `DCPA`.
7. `normal` renders:

   * `DST` + name/MMSI
   * `DCPA` + `TCPA` when `tcpa > 0`, else `BRG` + explicit empty second slot
   * badge + front text row
8. `high` renders:

   * distance row
   * name row
   * `DCPA` + `TCPA` pair row when `tcpa > 0`, else full-width `BRG` row
   * badge + front text row
9. `.widgetContainer.vertical` forces `high` and does not introduce any AIS-specific shell-height rule.
10. Only metric fields (`DST`, `DCPA`, `TCPA`, `BRG`) allocate caption/value/unit geometry.
11. `nameOrMmsi`, `frontText`, `frontInitial`, badge/bar, and filler do not allocate unit boxes.
12. Units remain inline in every mode.
13. Color precedence matches the core warning/nearest/tracking/normal order.
14. `legacy === true` tints the wrapper and suppresses local badge/bar.
15. `legacy === false` keeps neutral wrapper background and uses local badge/bar only.
16. No valid MMSI yields:

* `placeholder` on `gpspage`
* `placeholder` in layout-editing mode
* `hidden` elsewhere

17. On `navpage` and `gpspage`, with valid MMSI and not editing, the widget owns the full click surface and calls `hostActions.ais.showInfo(mmsi)`.
18. On `gpspage`, without valid MMSI but while rendered, the widget still captures and swallows the click so host page fallthrough does not occur.
19. On unsupported pages, the widget is passive.
20. In layout-editing mode, the widget is always passive.
21. Resize signature changes when any layout-affecting text/state input changes, including mode, vertical state, render policy, branch state, interaction state, and visible strings.
22. Shared layout/fit/markup tests prove that CSS is not the hidden owner of geometry.
23. Layout fixture coverage includes a native `ais/aisTarget` instance.
24. `documentation/widgets/ais-target.md` documents:

* mode mapping
* vertical behavior
* placeholder/hidden policy
* legacy behavior
* click ownership and host-owned AIS workflow split

25. `ROADMAP.md` no longer lists `AisTarget` as uncovered.

---

## Related

* `ROADMAP.md`
* `exec-plans/completed/PLAN6.md`
* `exec-plans/active/PLAN7.md`
* `documentation/architecture/cluster-widget-system.md`
* `documentation/avnav-api/plugin-lifecycle.md`
* `documentation/avnav-api/interactive-widgets.md`
* `documentation/avnav-api/core-key-catalog.md`
* `documentation/guides/add-new-html-kind.md`
* `documentation/guides/add-new-cluster.md`
* `documentation/guides/add-new-text-renderer.md`
