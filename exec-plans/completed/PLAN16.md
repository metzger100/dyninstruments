# PLAN16 — Hide textual metrics in graphical widgets

## Status

Signed off after repository verification, code-trace review, and product decisions resolved.

This plan lands **after PLAN15** and therefore assumes:

- `DefaultLinearWidget`
- `DefaultRadialWidget`

exist under the PLAN15 contract, including the corrected user-selected formatter pass-through behavior in `DefaultMapper`.

No additional repository-grounded correction was required for PLAN16 in the cross-plan pass. Its implementation remains scoped to hide-textual-metrics plumbing and rendering behavior, and it remains safe to land before PLAN17.

## Goal

Add a **single widget-level toggle** for graphical widgets:

- UI label: **Hide textual metrics**
- default: `false`

It hides **live metric readouts** only. It does **not** hide:

- scale labels
- tick/end labels
- degree numerals
- compass-cardinal dial-face labels
- disconnected / state-screen messaging

Applies to graphical widgets only.

---

## Family split

### Hide only

- `SpeedRadialWidget`
- `DepthRadialWidget`
- `TemperatureRadialWidget`
- `VoltageRadialWidget`
- `DefaultRadialWidget`
- `CompassRadialWidget`
- `WindRadialWidget`

Behavior: hide live metric text, keep geometry unchanged.

### Hide + reclaim space

- `SpeedLinearWidget`
- `DepthLinearWidget`
- `TemperatureLinearWidget`
- `VoltageLinearWidget`
- `CompassLinearWidget`
- `WindLinearWidget`
- `DefaultLinearWidget`
- `XteDisplayWidget`

Behavior: hide live metric text and recompute graphics-only layout.

---

## XTE final behavior

### When `hideTextualMetrics === true`

- hide all four metric tiles: `COG`, `BRG`, `XTE`, `DST`
- hide waypoint name too
- reserve no waypoint-name space
- do not run waypoint-name fit heuristics
- do not derive `noTarget` from `wpName`
- use a graphics-only layout with:
  - no metric rects
  - no name rect
  - enlarged highway rect

### When `hideTextualMetrics === false`

- preserve current XTE layout and waypoint behavior
- preserve current static highway frame behavior
- remove the old “all four values required before highway draws” gate

### XTE rendering gate

- **static highway frame** renders in data mode from the active layout
- **dynamic highway overlay** renders iff `xte` is finite
- `cog`, `dtw`, and `btw` no longer gate dynamic highway drawing

### Public semantics

Public label remains **Hide textual metrics**.

For XTE that means:

- metric tiles hidden
- waypoint name hidden
- `showWpName` remains a separate editable for normal mode only and has no effect while `hideTextualMetrics === true`

---

## Public editable contract

Add one boolean editable per relevant graphical kind, default `false`, UI name **Hide textual metrics**.

Recommended props:

- `xteHideTextualMetrics`
- `speedLinearHideTextualMetrics`
- `depthLinearHideTextualMetrics`
- `tempLinearHideTextualMetrics`
- `voltageLinearHideTextualMetrics`
- `compassLinearHideTextualMetrics`
- `windLinearHideTextualMetrics`
- `speedRadialHideTextualMetrics`
- `depthRadialHideTextualMetrics`
- `tempRadialHideTextualMetrics`
- `voltageRadialHideTextualMetrics`
- `compassRadialHideTextualMetrics`
- `windRadialHideTextualMetrics`
- `defaultLinearHideTextualMetrics`
- `defaultRadialHideTextualMetrics`

---

## Implementation

### Phase 1 — config + mapper plumbing

Modify:

- `config/clusters/nav.js`
- `config/clusters/course-heading.js`
- `config/clusters/speed.js`
- `config/clusters/environment.js`
- `config/clusters/vessel.js`
- `config/clusters/wind.js`
- `config/clusters/default.js` after PLAN15

Add one boolean editable per relevant graphical kind:

- type: `BOOLEAN`
- default: `false`
- name: `Hide textual metrics`

Forward the booleans in:

- `NavMapper`
- `CourseHeadingMapper`
- `SpeedMapper`
- `EnvironmentMapper`
- `VesselMapper`
- `WindMapper`
- `DefaultMapper` after PLAN15

Boolean coercion only.

---

### Phase 2 — shared linear graphics-only layout

Files:

- `shared/widget-kits/linear/LinearGaugeLayout.js`
- `shared/widget-kits/linear/LinearGaugeEngine.js`
- `shared/widget-kits/linear/LinearGaugeTextLayout.js`

Implementation owner: **layout**

`LinearGaugeLayout.computeLayout(...)` accepts `hideTextualMetrics`.

Graphics-only branch returns:

- `captionBox = null`
- `valueBox = null`
- `inlineBox = null`
- `textTopBox = null`
- `textBottomBox = null`

and recomputes:

- `trackBox`
- `trackY`
- `scaleX0`
- `scaleX1`

by mode:

- `flat`: remove right text panel, use full width, vertical center
- `normal`: remove lower inline band, promote scale into reclaimed height
- `high`: remove stacked/split text bands, center gauge with no dead strips

Shared/default text drawing then no-ops naturally.

`WindLinearWidget` custom text also disappears naturally because its target boxes are absent.

---

### Phase 3 — XTE graphics-only layout

Files:

- `widgets/text/XteDisplayWidget/XteDisplayWidget.js`
- `shared/widget-kits/xte/XteHighwayLayout.js`
- `shared/widget-kits/xte/XteHighwayPrimitives.js`

Implementation owners: **widget + layout**

Required behavior:

- add `hideTextualMetrics` prop
- add graphics-only layout path in `XteHighwayLayout`
- in graphics-only mode return:
  - no metric rects
  - no name rect
  - enlarged highway rect

Renderer requirement:

- branch before any code that assumes `layout.metricRects.*` or `layout.nameRect`
- skip metric spacing, stable-digit metric fit probing, waypoint fit, and tile rendering in graphics-only mode
- still compute geometry and draw the **static highway frame**
- draw the **dynamic overlay** iff `xte` is finite

Do not reintroduce:

- `reserveNameSpace`
- waypoint-fit-driven geometry
- forced internal graphics-only mode switching

---

### Phase 4 — radial-family suppression

#### Semicircle radial

Files:

- `shared/widget-kits/radial/SemicircleRadialEngine.js`
- `shared/widget-kits/radial/SemicircleRadialTextLayout.js`

Behavior:

- geometry unchanged
- mode unchanged
- skip the shared live readout text draw step when `hideTextualMetrics === true`

#### Full-circle radial

Files:

- `shared/widget-kits/radial/FullCircleRadialEngine.js`

Behavior:

- geometry unchanged
- mode unchanged
- centrally skip widget `drawMode` when `hideTextualMetrics === true`

This hides live metric readouts while preserving dial-face labels.

---

### Phase 5 — PLAN15 default parity

- `DefaultLinearWidget` uses shared linear graphics-only layout
- `DefaultRadialWidget` uses shared semicircle hide-only behavior
- `config/clusters/default.js` exposes:
  - `kind === "linearGauge"` → `defaultLinearHideTextualMetrics`
  - `kind === "radialGauge"` → `defaultRadialHideTextualMetrics`
- `DefaultMapper` forwards them

---

## Testing

### Config / mapper

Cover:

- editable exists
- default is `false`
- conditions match intended kinds only
- mapper forwards the boolean

### Linear

Cover:

- graphics-only layout nulls text boxes
- track geometry expands into reclaimed area
- vertical rebalance happens
- wind custom text disappears because target boxes are absent
- tick/end labels remain visible

### XTE

Cover:

- graphics-only layout has no metric rects
- graphics-only layout has no name rect
- highway rect expands into reclaimed space
- waypoint rendering is fully disabled when hide-text is on
- `wpName` no longer triggers `noTarget` when hide-text is on
- **static highway frame remains visible in data mode when `xte` is missing**
- **dynamic highway overlay renders whenever `xte` is finite**
- dynamic overlay does not render when `xte` is missing
- `cog` / `dtw` / `btw` no longer gate dynamic overlay
- normal mode keeps disconnected state behavior

### Radial

Semicircle:

- live readout draw path is skipped
- geometry/mode unchanged
- scale labels remain visible

Full-circle:

- engine suppresses `drawMode` when hidden
- dial-face labels remain visible
- geometry/mode unchanged

### Default / regression

Cover:

- prop wiring
- omitted/false leaves visuals unchanged

---

## Documentation

Update:

- `documentation/widgets/xte-display.md`
- `documentation/linear/linear-gauge-style-guide.md`
- `documentation/linear/linear-shared-api.md`
- `documentation/radial/gauge-style-guide.md`
- `documentation/radial/full-circle-dial-style-guide.md`
- `documentation/TABLEOFCONTENTS.md` if needed
- `ROADMAP.md` if tracked there

Document explicitly:

- checkbox name and default
- what “textual metrics” means
- family split: reclaim-space vs hide-only
- XTE hides waypoint name too
- static XTE highway frame remains visible in data mode
- XTE dynamic overlay depends only on finite `xte`
- dial-face and scale labels remain visible
- state screens are unaffected

---

## Acceptance criteria

1. Every relevant graphical widget kind exposes **Hide textual metrics** with default `false`.
2. Existing widgets are visually unchanged when the option is off.
3. Semicircle radial, compass radial, wind radial, and default radial hide live metric text without changing dial layout.
4. All linear gauges and default linear hide live metric text and recompute graphics-only layout using freed space.
5. XTE hides all metric tiles and the waypoint name and recomputes a graphics-only highway layout.
6. In XTE data mode, the **static highway frame** remains visible; the **dynamic highway overlay** depends only on finite `xte`.
7. In graphics-only XTE, blank `wpName` does not trigger the `noTarget` state.
8. Scale labels, end labels, degree numerals, and compass-cardinal dial-face labels remain visible.
9. No per-metric sub-controls are introduced.
10. Tests cover editable plumbing, layout behavior, XTE frame/overlay gating, state behavior, and default-off regressions.
11. Docs explain the family split and the exact meaning of **textual metrics**.

---

## Recommended implementation order

1. config + mapper plumbing
2. shared linear graphics-only layout
3. XTE graphics-only layout and `xte`-only dynamic overlay gate
4. radial-family suppression
5. PLAN15 default parity
6. tests
7. docs

This plan is ready for implementation.