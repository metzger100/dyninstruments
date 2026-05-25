# PLAN31 — Analog Clock Radial Widget

## Status

Plan ready to implement. Verified against repository state at v3.2.0.

## Goal

After PLAN31 is complete:

1. A new `ClockRadialWidget` exists as a full-circle dial rendering an analog clock with hour, minute, and second hands. The widget uses the shared `FullCircleRadialEngine` and follows the established full-circle dial architecture (CompassRadialWidget/WindRadialWidget).

2. The clock face displays a 12-hour dial with a ring, major ticks at 30° intervals (hours 1–12), minor ticks at 6° intervals (5-minute marks), and numeral labels "1" through "12" at each hour position. Hour, minute, and second hands are drawn per-frame as dynamic pointers from the dial center.

3. The widget supports the three standard full-circle layout modes (`flat`, `normal`, `high`) for rendering a digital time readout alongside the clock face. When `hideTextualMetrics` is enabled, only the analog clock face is shown without any digital text.

4. The existing `hideSeconds` editable parameter from the vessel cluster is reused: when enabled, the second hand is hidden and the `formatClock` formatter is selected for digital display instead of `formatTime`.

5. The `clockRadial` kind is added to the `vessel` cluster (alongside existing `clock`, `dateTime`, `timeStatus`). The route entry maps through `VesselMapper` with `ClockRadialWidget` as the renderer, `surface: "canvas-dom"`, and `shellSizing: { kind: "ratio", aspectRatio: 1 }`.

6. A new documentation file `documentation/widgets/clock-gauge.md` covers the widget's architecture, props, drawing flow, cache behavior, and layout modes. `documentation/TABLEOFCONTENTS.md` is updated to reference it. `README.md` is not affected (no new theming tokens, no new cluster, no user-facing config changes beyond a new kind option in an existing cluster).

7. Tests verify the widget registration, route wiring, time parsing, hand angle computation, and `hideSeconds`/`hideTextualMetrics` behavior. `tests/layouts/gpspage-all-widgets.json` and its test are updated to include the `clockRadial` kind in the vessel cluster.

8. All existing tests and checks pass (`npm run check:all`).

---

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/radial/full-circle-dial-engine.md`
5. `documentation/radial/full-circle-dial-style-guide.md`
6. `documentation/radial/gauge-shared-api.md`
7. `documentation/guides/add-new-full-circle-dial.md`
8. `documentation/architecture/cluster-widget-system.md`
9. `documentation/architecture/component-system.md`
10. `documentation/conventions/testing-infrastructure.md`
11. `documentation/guides/documentation-maintenance.md`

---

## Product Decisions Resolved During Scoping

| Decision | Resolution | Rationale |
|---|---|---|
| 24-hour vs 12-hour face | 12-hour face only | Analog clocks are conventionally 12-hour; a 24-hour face would require non-standard label layout and user confusion |
| Second hand behavior | Continuous (smooth) by default; no stepping animation | Clock second hand is a visual detail, not a navigation instrument — simplicity preferred. The hand is drawn at the computed angle each frame without spring easing |
| Where to parse time | In the widget, not the mapper | Mapper boundary is declarative only; time-string parsing is widget-internal display logic |
| Mapper output for `clockRadial` | Pass `p.clock` as `value` (raw timestamp/string), plus caption, unit, thresholds | Widget owns parsing; mapper stays clean |
| Hand lengths | Fixed proportions: hour 0.45R, minute 0.65R, second 0.80R | Conventionally distinct lengths for readability; no separate geometry tokens needed for initial release |
| Second hand color | `tokens.colors.pointer` (shared pointer red `#ff2b2b`) | Avoids adding a new semantic token for a single-widget use case; second hand is still a "pointer" |
| Hour/minute hand color | `state.color` (resolved text/foreground color) | Follows convention: the rotating card elements (hands) use the foreground color; the second hand is the accent pointer |
| `hideSeconds` interaction | `hideSeconds === true` skips second-hand drawing AND selects `formatClock` for digital display text | Consistent with existing formatter swap contract in `hide-seconds.md` |
| Default aspect ratio | `1:1` (square) | Clock face is circular; square shell is the natural fit |
| Ratio thresholds | `clockRadialRatioThresholdNormal: 0.7`, `clockRadialRatioThresholdFlat: 2.0` | Conservative defaults similar to WindRadialWidget; user can adjust in layout editor |
| Easing | None — hands teleport | A clock should show the exact time, not animate toward it. SpringEasing is not listed as a dependency |
| Text modes content | Digital time readout in `HH:MM:SS` or `HH:MM` format | Provides a familiar digital fallback in compact layouts; `FullCircleRadialTextLayout.drawSingleModeText` renders it |

---

## Verified Baseline (Repository-Verified Facts)

### Vessel cluster — existing clock kinds

1. `config/clusters/vessel.js` defines the `vessel` cluster with store key `clock: "nav.gps.rtime"` (line 28).
2. The `kind` selector includes `clock` (line 43), `dateTime` (line 44), `timeStatus` (line 45).
3. `hideSeconds` editable parameter (BOOLEAN, default `false`) applies to `clock`, `dateTime`, `timeStatus` (lines 286–294).
4. `captionUnitScale` (FLOAT, default `0.8`) applies to `clock`, `dateTime`, `timeStatus` (lines 235–248).
5. `stableDigits` (BOOLEAN) applies to `clock`, `dateTime`, `timeStatus` (lines 250–263).
6. `ratioThresholdNormal` (FLOAT, default `1.0`) applies to `clock`, `timeStatus` (lines 319–330).
7. `ratioThresholdFlat` (FLOAT, default `3.0`) applies to `clock`, `timeStatus` (lines 331–343).
8. `dateTimeRatioThresholdNormal`/`dateTimeRatioThresholdFlat` exist for `dateTime` only (lines 344–363).

### Vessel cluster routes

9. `config/cluster-routes/vessel.js` routes `clock` -> `VesselMapper` -> `ThreeValueTextWidget`, `surface: "canvas-dom"`, `aspectRatio: 2` (lines 53–60).
10. `config/cluster-routes/vessel.js` routes `dateTime` -> `VesselMapper` -> `PositionCoordinateWidget`, `surface: "canvas-dom"`, `aspectRatio: 2` (lines 61–68).
11. `config/cluster-routes/vessel.js` routes `timeStatus` -> `VesselMapper` -> `PositionCoordinateWidget`, `surface: "canvas-dom"`, `aspectRatio: 2` (lines 69–76).

### Vessel mapper

12. `cluster/mappers/VesselMapper.js` translates `clock` kind via `out(p.clock, cap("clock"), unit("clock"), p.hideSeconds === true ? "formatClock" : "formatTime", [])` (lines 80–82).
13. `out()` is `toolkit.out` — resolves to `{ value, caption, unit, formatter, formatterParameters }` shape.
14. No `clockRadial` kind exists in `VesselMapper.js`.

### Component registry — gauge widgets

15. `config/components/registry-widgets-gauge.js` defines `CompassRadialWidget` with deps `["FullCircleRadialEngine", "FullCircleRadialTextLayout", "SpringEasing", "StableDigits"]` (lines 28–33).
16. `config/components/registry-widgets-gauge.js` defines `WindRadialWidget` with deps `["FullCircleRadialEngine", "FullCircleRadialTextLayout", "ValueMath", "SpringEasing", "StableDigits", "PlaceholderNormalize"]` (lines 112–117).
17. No `ClockRadialWidget` entry exists.

### FullCircleRadialEngine API

18. `FullCircleRadialEngine.createRenderer(spec)` accepts `ratioProps`, `cacheLayers`, `buildStaticKey`, `rebuildLayer`, `drawFrame`, `drawMode`, optional `layout`, `hideTextualMetricsProp`, optional `ratioDefaults`.
19. Callback `api` provides `drawFullCircleRing`, `drawFullCircleTicks`, `drawFixedPointer`, `drawCachedLayer`, `getCacheMeta`, `setCacheMeta`.
20. Callback `state.draw` provides `draw.drawRimMarker`, `draw.drawPointerAtRim`, and other `RadialToolkit.draw` members.
21. `state.angle.degToCanvasRad(deg, cfg, rotationDeg)` converts degrees to canvas radians. `cfg` is an optional object `{ zeroDegAt, clockwise }` (defaults to `{ zeroDegAt: "north", clockwise: true }`).
22. `state` includes `ctx`, `canvas`, `W`, `H`, `mode`, `theme`, `color`, `valueWeight`, `labelWeight`, `geom`, `labels`, `slots`.

### FullCircleRadialTextLayout

23. `FullCircleRadialTextLayout.drawSingleModeText(state, mode, display, options)` renders caption/value/unit in `flat`/`normal`/`high` layouts.

### CompassRadialWidget — reference implementation

24. `CompassRadialWidget.js` (181 lines) follows UMD wrapper pattern, requires `FullCircleRadialEngine` + `FullCircleRadialTextLayout` + `SpringEasing` + `StableDigits`.
25. Uses `engine.createRenderer({ ratioProps, cacheLayers: ["face"], layout: { highTopFactor: 0.9, highBottomFactor: 0.9 }, buildStaticKey, rebuildLayer, drawFrame, drawMode })`.
26. `buildStaticKey` returns `{ labelPx, labelRadius, labelsSig }` for cache invalidation.
27. `rebuildLayer` draws ring + ticks via `api.drawFullCircleRing(layerCtx)` and `api.drawFullCircleTicks(layerCtx, { startDeg: 0, endDeg: 360, stepMajor: 30, stepMinor: 10 })`.
28. `drawFrame` applies `rotationDeg` transformation, draws fixed pointer, optional marker, and cached labels.
29. `drawMode` implements `flat`/`normal`/`high` calling `textLayout.drawSingleModeText`.

### Kind defaults

30. `config/shared/kind-defaults.js` line 259: `clock: { cap: "TIME", unit: "" }`.

### Layout tests

31. `tests/layouts/gpspage-all-widgets.json` includes `dyni_Vessel_Instruments` widget entries with `kind: "clock"` and `kind: "dateTime"`.
32. `tests/layouts/gpspage-all-widgets.test.js` references vessel widget kinds.

### Tests

33. CompassRadialWidget has dedicated tests under `tests/widgets/radial/CompassRadialWidget/`.
34. WindRadialWidget has dedicated tests under `tests/widgets/radial/WindRadialWidget/`.

### Negative facts

35. No `clockRadial` kind string exists anywhere in the repository.
36. No `ClockRadialWidget` file or module registration exists.
37. No `clock-gauge.md` documentation file exists.
38. No geometry tokens specific to a clock exist — all full-circle geometry is shared via `FullCircleRadialLayout` + theme weights.

---

## Hard Constraints

1. **No changes to `FullCircleRadialEngine` or `FullCircleRadialLayout`.** The existing shared engine and layout APIs are sufficient. Clock-specific behavior is confined to the widget wrapper callbacks.
2. **No new semantic theme tokens.** The clock uses existing `tokens.colors.pointer` for the second hand and resolved foreground color (`state.color`) for hour/minute hands. No new token paths are introduced.
3. **No changes to `FullCircleRadialTextLayout`.** Digital time display in text modes uses the existing `drawSingleModeText` with a standard display object shape `{ caption, value, unit, secScale }`.
4. **No changes to `VesselMapper` structure.** The mapper remains a single `translate()` function with declarative branch logic. Only one new `if` branch is added.
5. **No new cluster.** The clock radial stays in the existing `vessel` cluster.
6. **No easing imports.** `ClockRadialWidget` does not depend on `SpringEasing`. Clock hands are drawn at computed positions without interpolation.
7. **No changes to `hideSeconds` editable parameter definition.** The existing vessel-cluster parameter is reused as-is.
8. **File size target: <=400 lines** for `ClockRadialWidget.js`.
9. **No `ratioDefaults` in widget spec.** Config-backed wrappers omit `ratioDefaults` and trust the editable-default contract.
10. **Must use canonical shared utilities** — `componentContext.format.applyFormatter`, `componentContext.canvas.setupCanvas`, `GeometryScale.scaleStroke` for hand widths, `PlaceholderNormalize.normalize` for display text. No local helper redefinitions of functionality available in shared modules.

---

## Implementation Order

### Phase 1: ClockRadialWidget — Widget Module

**Intent:** Create the `ClockRadialWidget` full-circle dial component using `FullCircleRadialEngine` with clock-specific static face layer and three-hand per-frame drawing.

**Dependencies:** None.

**Deliverables:**

1. `widgets/radial/ClockRadialWidget/ClockRadialWidget.js` — UMD wrapper module:
   - Module header: `Module: ClockRadialWidget - 12-hour analog clock with hour/minute/second hands`, `Documentation: documentation/widgets/clock-gauge.md`, `Depends: FullCircleRadialEngine, FullCircleRadialTextLayout, GeometryScale, PlaceholderNormalize`
   - Requires `FullCircleRadialEngine` + `FullCircleRadialTextLayout` + `GeometryScale` + `PlaceholderNormalize`
   - **Time parsing helper** `parseTime(rawValue)`:
     - Input: raw store value (string `"HH:MM:SS"`, Date object, or number timestamp)
     - Output: `{ hours: number, minutes: number, seconds: number } | null`
     - Uses `new Date()` / `Date.parse()` / regex fallback
     - Returns `null` on unparseable input
   - **Hand angle helper** `computeHandAngles(time)`:
     - `hourAngle = (time.hours % 12) * 30 + time.minutes * 0.5` (30°/hour + 0.5°/minute)
     - `minuteAngle = time.minutes * 6 + time.seconds * 0.1` (6°/minute + 0.1°/second)
     - `secondAngle = time.seconds * 6` (6°/second)
     - Returns `{ hourAngle, minuteAngle, secondAngle }` in degrees (0 at 12 o'clock, clockwise)
   - **Display builder** `clockDisplay(state, props)`:
     - Parses `props.value` via `parseTime()`
     - Formats digital text via `componentContext.format.applyFormatter()` using formatter name from props (`formatTime` or `formatClock`)
     - Normalizes through `PlaceholderNormalize.normalize()`
     - Returns `{ caption, value: displayText, unit, secScale, time: { hours, minutes, seconds } | null, hands: { hourAngle, minuteAngle, secondAngle } | null }`
   - **Static key** `buildStaticKey(state, props)`:
     - `{ labelPx: state.labels.fontPx, labelRadius: state.labels.spriteRadius, tickSig: "1-12|major30|minor6" }`
- **Layer rebuild** `rebuildLayer(layerCtx, layerName, state, props, api)`:
      - Layer `"face"` only
      - `api.drawFullCircleRing(layerCtx)` — standard ring
      - `api.drawFullCircleTicks(layerCtx, { startDeg: 0, endDeg: 360, stepMajor: 30, stepMinor: 6 })` — hours at 30°, 5-min marks at 6°
      - Draw hour numeral labels "1" through "12" on `layerCtx` (the offscreen cached-layer context) at each 30° position. Use `layerCtx.textAlign = "center"`, `layerCtx.textBaseline = "middle"`. Position at `(cx + Math.cos(rad) * labelRadius, cy + Math.sin(rad) * labelRadius)` where `cx = state.geom.cx`, `cy = state.geom.cy`, `labelRadius = state.labels.spriteRadius`, `rad = state.angle.degToCanvasRad(hour * 30)`. Font: `state.labelWeight + " " + state.labels.fontPx + "px " + state.family`, fillStyle: `state.color`. NOTE: `rebuildLayer` receives `layerCtx` (the offscreen cached-layer canvas context), NOT `state.ctx`; labels must be drawn on `layerCtx` so they are part of the cached static face layer.
   - **Frame draw** `drawFrame(state, props, api)`:
     - Get `display = clockDisplay(state, props)`
     - `api.drawCachedLayer("face")`
     - If `display.hands`:
       - Draw hour hand: line from `(cx, cy)` to angle `display.hands.hourAngle`, length `state.geom.rOuter * 0.45`, width `gs.scaleStroke(state.geom.rOuter, HOUR_HAND_WIDTH_FACTOR, state.valueWeight, 2)`, style `state.color`
       - Draw minute hand: line from `(cx, cy)` to angle `display.hands.minuteAngle`, length `state.geom.rOuter * 0.65`, width `gs.scaleStroke(state.geom.rOuter, MINUTE_HAND_WIDTH_FACTOR, state.valueWeight, 1)`, style `state.color`
       - Draw second hand (if `!props.hideSeconds`): line from `(cx, cy)` to angle `display.hands.secondAngle`, length `state.geom.rOuter * 0.80`, width `gs.scaleStroke(state.geom.rOuter, SECOND_HAND_WIDTH_FACTOR, state.valueWeight, 1)`, style `state.theme.colors.pointer`
       - (where `gs = componentContext.components.require("GeometryScale")`, and `HOUR_HAND_WIDTH_FACTOR`, `MINUTE_HAND_WIDTH_FACTOR`, `SECOND_HAND_WIDTH_FACTOR` are module-level constants)
     - Draw center cap: small filled circle at `(cx, cy)` in `state.color`, radius `state.geom.rOuter * 0.03`
    - **Hand drawing helper** `drawHand(state, angleDeg, length, width, style)` — closure inside `create()`, called from `drawFrame`:
      - Uses `state.ctx`, `state.geom.cx`, `state.geom.cy` to draw from center to tip
      - Converts `angleDeg` via `state.angle.degToCanvasRad(angleDeg)` to get tip `(x, y)`
      - Draws line with `ctx.lineCap = "round"`, appropriate width and style
   - **Mode callbacks** `drawMode`:
     - `flat`: `textLayout.drawSingleModeText(state, "flat", display, { side: "left", align: "left" })`
     - `normal`: `textLayout.drawSingleModeText(state, "normal", display)`
     - `high`: `textLayout.drawSingleModeText(state, "high", display, { slot: "top" })`
     - (These render the digital time text; hidden when `hideTextualMetrics` is true via engine)
   - **Renderer spec**:
     ```javascript
     const renderCanvas = engine.createRenderer({
       ratioProps: { normal: "clockRadialRatioThresholdNormal", flat: "clockRadialRatioThresholdFlat" },
       hideTextualMetricsProp: "clockRadialHideTextualMetrics",
       cacheLayers: ["face"],
       // layout: omitted — engine defaults are appropriate for the clock's
       // minimal text content (caption + HH:MM:SS + no unit).
       buildStaticKey,
       rebuildLayer,
       drawFrame,
       drawMode
     });
     ```
   - **Translate function**: returns `{}` (no-op, ClusterWidget handles translation)
   - **Return**: `{ id: "ClockRadialWidget", wantsHideNativeHead: true, renderCanvas, translateFunction }`

2. **Static labels implementation detail**: Hour labels are drawn directly in `rebuildLayer` via `layerCtx.fillText()` at precomputed positions. Unlike CompassRadialWidget which needs upright sprite labels (rotated card), the clock face is static — labels can be rendered directly with standard text alignment at their radial positions without sprite caching. The `rebuildLayer` callback receives `layerCtx` (the offscreen cached-layer canvas context, separate from `state.ctx`). Cached-layer dimensions match `state.W` × `state.H` with `state.dpr` scaling applied by the engine. Label positions are computed from `state` geometry:
   - `labelRadius = state.labels.spriteRadius` (precomputed by layout)
   - `font = state.labelWeight + " " + state.labels.fontPx + "px " + state.family`
   - `angleDeg = hour * 30` → canvas radians via `state.angle.degToCanvasRad(angleDeg)`
   - Position: `x = cx + Math.cos(rad) * labelRadius`, `y = cy + Math.sin(rad) * labelRadius`

**Exit condition:** File exists at `widgets/radial/ClockRadialWidget/ClockRadialWidget.js`. File is <=400 lines. Module passes `npm run check:core`.

---

### Phase 2: Component Registration + Cluster Wiring

**Intent:** Register the widget module, add the `clockRadial` kind to the vessel cluster config, wire the route, and extend the mapper.

**Dependencies:** Phase 1.

**Deliverables:**

1. `config/components/registry-widgets-gauge.js` — Add entry:
   ```javascript
   w.ClockRadialWidget = {
       js: BASE + "widgets/radial/ClockRadialWidget/ClockRadialWidget.js",
       css: undefined,
       globalKey: "DyniClockRadialWidget",
       deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout", "GeometryScale", "PlaceholderNormalize"]
   };
   ```

2. `config/clusters/vessel.js` — Add kind option in editable parameters:
   - Add `opt("Analog clock [Radial]", "clockRadial")` to the `kind` SELECT list (after `opt("Clock (local time)", "clock")`)

3. `config/clusters/vessel.js` — Add ratio threshold parameters:
   ```javascript
   clockRadialRatioThresholdNormal: {
     type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.7,
     internal: true,
     name: "ClockRadial: Normal Threshold",
     condition: { kind: "clockRadial" }
   },
   clockRadialRatioThresholdFlat: {
     type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.0,
     internal: true,
     name: "ClockRadial: Flat Threshold",
     condition: { kind: "clockRadial" }
   },
   ```

4. `config/clusters/vessel.js` — Add `hideTextualMetrics` parameter:
   ```javascript
   clockRadialHideTextualMetrics: {
     type: "BOOLEAN",
     default: false,
     name: "Hide textual metrics",
     condition: { kind: "clockRadial" }
   },
   ```

5. `config/clusters/vessel.js` — Extend existing parameter conditions to include `clockRadial`:
   - `captionUnitScale` → add `{ kind: "clockRadial" }`
   - `hideSeconds` → add `{ kind: "clockRadial" }`
   - Note: `stableDigits` is deliberately **not** extended to `clockRadial` — clock time strings have inherently stable digit counts (`HH:MM:SS`), so the feature serves no purpose here.

6. `config/cluster-routes/vessel.js` — Add route entry:
   ```javascript
   {
     cluster: "vessel",
     kind: "clockRadial",
     mapperId: "VesselMapper",
     rendererId: "ClockRadialWidget",
     surface: "canvas-dom",
     shellSizing: { kind: "ratio", aspectRatio: 1 }
   },
   ```

7. `cluster/mappers/VesselMapper.js` — Add `clockRadial` branch before the return `{}`:
   ```javascript
   if (req === "clockRadial") {
     return {
       value: p.clock,
       caption: cap("clockRadial"),
       unit: unit("clockRadial"),
       formatter: p.hideSeconds === true ? "formatClock" : "formatTime",
       formatterParameters: [],
       rendererProps: {
         clockRadialRatioThresholdNormal: num(p.clockRadialRatioThresholdNormal),
         clockRadialRatioThresholdFlat: num(p.clockRadialRatioThresholdFlat),
         captionUnitScale: num(p.captionUnitScale),
         clockRadialHideTextualMetrics: !!p.clockRadialHideTextualMetrics,
         hideSeconds: p.hideSeconds === true
       }
     };
   }
   ```

8. `config/shared/kind-defaults.js` — Add default for `clockRadial` to `VESSEL_KIND`:
   ```javascript
   clockRadial: { cap: "TIME", unit: "" },
   ```
   `makePerKindTextParams(VESSEL_KIND)` in `config/clusters/vessel.js` automatically generates `caption_clockRadial` and `unit_clockRadial` editable parameters with these defaults and `condition: { kind: "clockRadial" }`. No explicit exclusion is needed — the defaults are appropriate for a clock widget, and users may customize them.

**Exit condition:** `npm run check:core` passes. The `clockRadial` kind appears in the vessel cluster's kind selector. Route, mapper, and component registration are all wired. No circular dependency issues.

---

### Phase 3: Widget Formatting — Time String Parsing + Digital Display

**Intent:** Verify the widget correctly receives the raw time value from the store, parses it, and drives both the analog hands and the digital text display.

**Dependencies:** Phase 2 (mapper must pass formatter and value correctly).

**Additional work on Phase 1 file:**

1. Verify `componentContext.format.applyFormatter(value, formatter, formatterParameters)` is used for digital display text, consistent with how `ThreeValueTextWidget` renders time.
2. The formatter name `"formatTime"` (HH:MM:SS) or `"formatClock"` (HH:MM) is resolved from `props.formatter` (set by mapper).
3. Time parsing must handle:
   - ISO 8601 date strings (e.g. `"2026-05-25T14:30:25Z"`)
   - Simple time strings (e.g. `"14:30:25"`)
   - JavaScript Date objects and millisecond timestamps
   - Invalid/unparseable values → return `null`, hands hidden, dial still drawn
4. Placeholder normalization through `PlaceholderNormalize.normalize()` on the formatter output.

**Exit condition:** The widget's `clockDisplay()` function handles all time formats correctly. Hands render at correct angles for known test times (e.g. 12:00:00 → all hands at 0°, 3:00:00 → hour at 90°, minute at 0°, second at 0°).

---

### Phase 4: Tests

**Intent:** Add tests for the widget module, route wiring, and layout coverage.

**Dependencies:** Phases 1–3.

**Deliverables:**

1. `tests/widgets/radial/ClockRadialWidget/ClockRadialWidget.test.js` — Widget unit tests:
   - Module exports `id: "ClockRadialWidget"` and `create` function
   - `parseTime()` correctly parses ISO strings, simple time strings, Date objects, timestamps
   - `parseTime()` returns `null` for invalid inputs
   - `computeHandAngles()` produces correct angles for known times:
     - `{ hours: 12, minutes: 0, seconds: 0 }` → hour=0°, minute=0°, second=0°
     - `{ hours: 3, minutes: 0, seconds: 0 }` → hour=90°, minute=0°, second=0°
     - `{ hours: 6, minutes: 30, seconds: 0 }` → hour=195° (6*30 + 30*0.5), minute=180°, second=0°
     - `{ hours: 9, minutes: 15, seconds: 30 }` → hour=277.5°, minute=93°, second=180°
   - `create()` returns `wantsHideNativeHead: true`
   - `renderCanvas` is a function
   - `hideSeconds` in props skips second hand and uses `formatClock`
   - `hideTextualMetrics` suppresses digital text modes

 2. `tests/config/cluster-routes.test.js` — Route count increases from 61 to 62; existing generic assertions auto-validate schema for the new route. No additional per-route assertion needed.

 3. `tests/config/clusters/vessel.test.js` — Extend existing assertions:
    - Kind list `arrayContaining` includes `"clockRadial"`
    - `captionUnitScale.condition` includes `{ kind: "clockRadial" }`
    - `hideSeconds.condition` includes `{ kind: "clockRadial" }`

 4. `tests/layouts/gpspage-all-widgets.json` — Add a `clockRadial` widget entry under `dyni_Vessel_Instruments`:
    ```json
    { "kind": "clockRadial" }
    ```

 5. `tests/layouts/gpspage-all-widgets.test.js` — Add assertion for `clockRadial` widget presence.

**Exit condition:** `npm test` passes. All new test cases pass. Coverage thresholds maintained.

---

### Phase 5: Documentation

**Intent:** Create the clock-gauge module documentation and update the table of contents.

**Dependencies:** Phases 1–4 (code complete).

**Deliverables:**

1. `documentation/widgets/clock-gauge.md` — New file following the same structure as `compass-gauge.md`:
   - **Overview**: Analog clock radial widget, 12-hour face, three hands
   - **Module Registration**: component registry entry
   - **Props table**: `value`, `hideSeconds`, `formatter`, `clockRadialRatioThresholdNormal`, `clockRadialRatioThresholdFlat`, `clockRadialHideTextualMetrics`, `captionUnitScale`
   - **Clock Dial Drawing**: ring, ticks (major 30°, minor 6°), hour labels 1–12, hands (hour/minute/second), center cap
   - **Background Cache Behavior**: static face cache, dynamic hands per-frame, cache key inputs, invalidation triggers, non-triggers
   - **Layout Modes**: `flat`/`normal`/`high` digital time placement via `drawSingleModeText`
   - **Internal Value Formatting**: time parsing, formatter dispatch, placeholder normalization
   - **Exports**: `{ id, wantsHideNativeHead, renderCanvas, translateFunction }`
   - **Related**: links to full-circle-dial-engine.md, full-circle-dial-style-guide.md, compass-gauge.md, add-new-full-circle-dial.md

2. `documentation/TABLEOFCONTENTS.md` — Add entry under "Module Reference (Renderers)":
   - `Analog clock radial renderer (draw flow, props, layout modes)` → `[widgets/clock-gauge.md](widgets/clock-gauge.md)`

**Exit condition:** `npm run check:docs` passes. Documentation is consistent with implementation.

---

## User-Facing Documentation Impact

README.md changes are **not required**. This plan adds a new kind option to an existing cluster (`vessel`). The cluster was already documented as supporting "Clock (local time)". Adding "Analog clock [Radial]" as an additional option in the same cluster does not change the theming surface, cluster availability, installation, configuration keys, or development workflow. The existing README cluster description for `dyni_Vessel_Instruments` already covers time-related instruments.

| Section | Change |
|---|---|
| `documentation/widgets/clock-gauge.md` | New file: full widget documentation |
| `documentation/TABLEOFCONTENTS.md` | Add reference to new clock-gauge.md |
| `README.md` | No changes required |

---

## File Inventory

### New files (3)

| File | Description |
|---|---|
| `widgets/radial/ClockRadialWidget/ClockRadialWidget.js` | UMD widget wrapper, <=400 lines |
| `tests/widgets/radial/ClockRadialWidget/ClockRadialWidget.test.js` | Widget unit tests (time parsing, hand angles, exports, hideSeconds, hideTextualMetrics) |
| `documentation/widgets/clock-gauge.md` | Widget documentation |

### Modified files (10)

| File | Change scope |
|---|---|
| `config/components/registry-widgets-gauge.js` | Add `ClockRadialWidget` entry (~7 lines) |
| `config/clusters/vessel.js` | Add `clockRadial` kind option, threshold params, `hideTextualMetrics`, extend conditions (~25 lines) |
| `config/cluster-routes/vessel.js` | Add `clockRadial` route entry (~8 lines) |
| `cluster/mappers/VesselMapper.js` | Add `clockRadial` mapper branch (~15 lines) |
| `config/shared/kind-defaults.js` | Add `clockRadial` default caption/unit (~1 line) |
| `tests/config/cluster-routes.test.js` | Update route count 61→62 (~2 lines) |
| `tests/config/clusters/vessel.test.js` | Extend kind list, captionUnitScale, hideSeconds condition assertions (~5 lines) |
| `tests/layouts/gpspage-all-widgets.json` | Add `clockRadial` widget entry (~3 lines) |
| `tests/layouts/gpspage-all-widgets.test.js` | Add `clockRadial` assertion (~2 lines) |
| `documentation/TABLEOFCONTENTS.md` | Add clock-gauge.md reference (~1 line) |

---

## Acceptance Criteria

### Gate

- [ ] `npm run check:all` passes (`check:core` + `test:coverage:check` + `perf:check`)
- [ ] Completed mandatory preflight reads

### Widget correctness

- [ ] `ClockRadialWidget` parses time values (ISO strings, simple `HH:MM:SS`, Date objects, timestamps)
- [ ] Hands render at correct angles: 12:00:00 → all at 0°, 3:00:00 → hour 90°/minute 0°/second 0°, 6:30:00 → hour 195°/minute 180°
- [ ] Clock face displays ring, 12 major ticks, 60 minor ticks, labels 1–12
- [ ] `hideSeconds === true` suppresses second-hand drawing
- [ ] `hideSeconds === true` selects `formatClock` (HH:MM) over `formatTime` (HH:MM:SS)
- [ ] `hideTextualMetrics === true` suppresses digital text modes entirely
- [ ] Center cap circle is drawn over hands

### Registration + wiring

- [ ] `clockRadial` appears in vessel cluster kind selector
- [ ] Route maps `clockRadial` to `VesselMapper` → `ClockRadialWidget`, `canvas-dom`, aspectRatio 1
- [ ] Component loads via `DyniClockRadialWidget` global key

### Layout modes

- [ ] Resize through `flat`, `normal`, `high` layouts — digital text positions correctly
- [ ] Null/unparseable time input renders dial without hands (graceful degradation)

### Tests

- [ ] All existing tests pass
- [ ] New widget tests pass (time parsing, hand angles, exports)
- [ ] Layout test coverage includes `clockRadial` entry

### Documentation

- [ ] `clock-gauge.md` covers all required sections
- [ ] `TABLEOFCONTENTS.md` references new doc

---

## Related

- `documentation/radial/full-circle-dial-engine.md`
- `documentation/radial/full-circle-dial-style-guide.md`
- `documentation/radial/gauge-shared-api.md`
- `documentation/widgets/compass-gauge.md`
- `documentation/widgets/wind-dial.md`
- `documentation/guides/add-new-full-circle-dial.md`
- `documentation/architecture/cluster-widget-system.md`
- `documentation/architecture/component-system.md`
- `documentation/shared/hide-seconds.md`
- `exec-plans/completed/PLAN30.md`
