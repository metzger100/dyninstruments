# PLAN12 — Post-PLAN11 Regression Fixes

## Status

Execution plan for six regressions and issues identified after PLAN11 completion.
Each phase is scoped for one Codex session. Phases are independent and may execute in any order.

---

## Issues Summary

| # | Title | Affected files | Root cause |
|---|-------|---------------|------------|
| 1 | Spring ease on linear compass eases the pointer instead of the scale; no 180° range support | `LinearGaugeEngine.js`, `CompassLinearWidget.js`, `config/clusters/course-heading.js` | `springMotion.resolve()` is applied to `displayState.num` which feeds the pointer; for compass-mode the axis should be eased, not the pointer. Additionally, the visible heading window is hardcoded to 360°; a 180° option is needed. |
| 2 | Coordinates monospace but not aligned; N/E sizes not coupled | `TextLayoutComposite.js`, `PositionCoordinateWidget.js` | `drawTwoRowsWithHeader` uses `ctx.textAlign = "center"`; needs right-alignment and the existing `fitMultiRowBinary` coupling must be surfaced correctly |
| 3 | Radial compass labels clip into major ticks and are too small | `FullCircleRadialLayout.js`, `CompassRadialWidget.js` | `LABEL_SPRITE_RADIUS_FACTOR = 1.6` places labels too close to tick ends; `labelFontFactor = 0.14` produces undersized text |
| 4 | ThreeValueTextWidget: normal/high mode row spacing too large, value row undersized | `TextLayoutComposite.js` | `ROW_SAFE_RATIO = 0.85` and `innerY * 2` per-row padding compound across three rows, wasting ~30% of height as whitespace and compressing the value row |
| 5 | Radial gauge sectors overlay the scale ring line | `SemicircleRadialEngine.js`, `WindRadialWidget.js` | `drawArcRing` / `drawFullCircleRing` is called before sector fills, so sectors paint over the ring stroke |
| 6 | CenterDisplay coordinates not aligned and sizes not coupled | `CenterDisplayTextWidget.js`, `CenterDisplayLayout.js` | `coordAlign` hardcoded to `"center"` in layout; lat/lon fitted independently via `drawFittedLine` instead of sharing a coupled font size |

---

## Phase 1 — Fix spring easing on linear compass (scale eased, pointer fixed) + 180° range support

### Context for Codex

The linear compass (`CompassLinearWidget.js`) uses `LinearGaugeEngine.js` to render a
horizontal heading scale with a fixed center pointer. The scale's visible range is centered
on the current heading via `resolveAxis(props, range, defaultAxis)` which currently
hardcodes `{ min: heading - 180, max: heading + 180 }` — a 360° window. A planned 180°
mode will show `{ min: heading - 90, max: heading + 90 }`.

PLAN11 added `SpringEasing` to `LinearGaugeEngine`. The engine creates `springMotion` at
module scope (line 33) and calls `springMotion.resolve(canvas, displayState.num,
easingEnabled, Date.now())` at line 280 to produce `easedDisplayNum`. This eased value is
used by `drawApi.drawDefaultPointer` (line 367). The result is that the **pointer** animates
smoothly but the **scale** jumps instantly — the opposite of the intended behavior.

For a compass, the correct behavior is:
- The **scale** (axis) animates smoothly toward the new heading (spring-eased).
- The **pointer** is always fixed at the visual center of the scale (no easing on the pointer).
- The marker course indicator is positioned relative to the eased heading.
- All of the above must work for both 360° and 180° visible ranges.

The tick steps are currently hardcoded to `{ major: 30, minor: 10 }` via the `tickSteps`
callback. For a 180° window, denser ticks (`{ major: 15, minor: 5 }`) are appropriate so the
half-range doesn't look sparse.

### Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/shared/spring-easing.md
- documentation/linear/linear-shared-api.md
- documentation/avnav-api/editable-parameters.md

### Task: Fix spring easing for linear compass + add 180° range support

This task has two interleaved goals:
A. Fix the spring easing so the **scale** eases (not the pointer).
B. Add a `compassLinearRange` editable (360° default, 180° option) that controls the
   visible heading window width. Both goals touch the same code paths — `resolveAxis`,
   `tickSteps`, `drawFrame`, and the engine's `springTarget` — so they are implemented
   together.

#### Problem

In `shared/widget-kits/linear/LinearGaugeEngine.js`, the spring easing is applied to the
display value (`displayState.num`) at line 280 and fed to `drawDefaultPointer` at line 367.
For the compass linear widget, this eases the pointer position instead of the scale.

The compass widget (`widgets/linear/CompassLinearWidget/CompassLinearWidget.js`) defines:
- `resolveAxis(props, range, defaultAxis)` — returns `{ min: heading-180, max: heading+180 }`
  (hardcoded 360° window)
- `drawFrame(state, props, display, api)` — calls `api.drawDefaultPointer()` and draws a
  marker
- `tickSteps: function () { return { major: 30, minor: 10 }; }` (hardcoded)

#### Required changes

##### A. Engine: `springTarget: "axis"` mode

1. **`LinearGaugeEngine.js`** — Add support for `cfg.springTarget`:
   - Read `const springTarget = cfg.springTarget === "axis" ? "axis" : "pointer";`
     alongside other config at the top of `createRenderer`.
   - Move the `springMotion.resolve(...)` call BEFORE the axis resolution (before line 182
     where `resolveAxisFn` is called).
   - If `springTarget === "axis"`:
     - Compute `easedDisplayNum` from the raw display value.
     - Create a shallow copy of `p` (or a proxy object) that overrides the raw value key
       (`p.value` or `p[cfg.rawValueKey]`) with the eased value, so that `resolveAxisFn`
       receives the eased heading.
     - The pointer draws at `easedDisplayNum` on the eased axis (visually fixed at center).
     - The static layer cache key already includes `axisMin`/`axisMax` (line 291–292),
       which will change each frame during animation — invalidating the cache. Acceptable
       because the compass already invalidates on every heading change.
   - If `springTarget === "pointer"` (default):
     - Current behavior unchanged: axis is raw, pointer position is eased.
   - Expose `easedDisplayNum` on the `displayState` object:
     `displayState.easedNum = easedDisplayNum;`
     so that `drawFrame` callbacks can access the eased value.

##### B. Compass widget: configurable range + adapted tick steps

2. **`CompassLinearWidget.js`** — Make the visible range configurable:
   - Read `const compassRange = (p.compassLinearRange === 180) ? 180 : 360;`
     Compute `const halfRange = compassRange / 2;`
   - Update `resolveAxis` to use `halfRange`:
     ```js
     function resolveAxis(props, range, defaultAxis) {
       const p = props || {};
       const heading = Number((typeof p.value !== "undefined") ? p.value : p.heading);
       if (!isFinite(heading)) { return defaultAxis; }
       const half = (p.compassLinearRange === 180) ? 90 : 180;
       return { min: heading - half, max: heading + half };
     }
     ```
     Note: `resolveAxis` receives `p` as its first argument from the engine (line 182).
     When `springTarget === "axis"`, the engine overrides `p.value`/`p.heading` with the
     eased value, so `resolveAxis` sees the eased heading. The range prop
     (`p.compassLinearRange`) is unaffected by the override.
   - Update `tickSteps` to adapt based on the range:
     ```js
     tickSteps: function (axisSpan) {
       // axisSpan is computed by the engine as axis.max - axis.min, but the compass
       // resolves its own axis, so use the props-based range instead.
       // However, tickSteps only receives the span. Use it:
       if (axisSpan <= 180) {
         return { major: 15, minor: 5 };
       }
       return { major: 30, minor: 10 };
     }
     ```
     Verify: The engine calls `tickSteps(axis.max - axis.min)` at line 211. For a 360°
     window `axisSpan = 360`, for 180° `axisSpan = 180`. The `tickSteps` callback already
     receives the span. No engine change needed for this.

3. **`CompassLinearWidget.js`** — Set `springTarget: "axis"` in the `createRenderer` spec:
   ```js
   const renderCanvas = engine.createRenderer({
     rawValueKey: "heading",
     unitDefault: "°",
     axisMode: "fixed360",
     springTarget: "axis",           // <-- NEW
     // ... rest unchanged
   });
   ```

4. **`drawFrame` in CompassLinearWidget.js** — Use the eased heading for marker
   calculation:
   ```js
   function drawFrame(state, props, display, api) {
     api.drawDefaultPointer();
     const heading = Number(display && display.easedNum);
     const marker = Number(props && props.markerCourse);
     if (!isFinite(heading) || !isFinite(marker)) { return; }
     const markerWrapped = heading + norm180(marker - heading);
     api.drawMarkerAtValue(markerWrapped, {
       strokeStyle: state.theme.colors.pointer
     });
   }
   ```
   The `norm180` helper wraps the delta to `[-180, +180)`. For a 180° visible axis
   (±90° from heading), markers more than 90° away will be clamped off-screen by
   `mapValueToX(..., true)` inside `drawMarkerAtValue` — correct behavior.

5. **Return `wantsFollowUpFrame`**: The engine already checks
   `springMotion.isActive(canvas)` at line 392. When `springTarget === "axis"`, the spring
   animates the axis, so each frame the static layer cache is invalidated (axis changes),
   and the spring requests follow-up frames until settled. No additional change needed for
   animation scheduling.

##### C. Editable: `compassLinearRange`

6. **`config/clusters/course-heading.js`** — Add the range editable alongside the existing
   compass linear settings (after `compassLinearShowEndLabels` at line 104):
   ```js
   compassLinearRange: {
     type: "SELECT",
     selectList: [
       { name: "360°", value: 360 },
       { name: "180°", value: 180 }
     ],
     default: 360,
     name: "Visible range",
     condition: [{ kind: "hdtLinear" }, { kind: "hdmLinear" }]
   },
   ```
   Follow the `compassLinearTickMinor` pattern: per-widget in the cluster config, condition
   scoped to linear compass kinds only. This matches the PLAN11 convention for per-widget
   editables.

#### Interaction between range and spring

The spring wrap is always 360° (heading values are 0–360°). The visible range
(`compassLinearRange`) only affects the axis window and tick density — not the spring
dynamics. When the heading wraps from 359° to 1°, the spring takes the shortest arc
(−2°) regardless of whether the visible window is 360° or 180°.

For the 180° window, a large heading change (e.g., 90°) causes the static layer to scroll
through many intermediate positions during the spring animation. Each intermediate position
invalidates the static layer cache. This is identical to the 360° case — the compass
already invalidates on every heading change. Performance is bounded by the existing soft cap
(600 consecutive animate frames).

#### Tests

- `springTarget: "axis"` + 360° range: after a heading change, the axis (min/max) smoothly
  transitions while the pointer remains at the center.
- `springTarget: "axis"` + 180° range: same behavior with a narrower window; ticks are
  at 15°/5° intervals.
- `springTarget: "pointer"` (default): existing non-compass linear gauges still ease the
  pointer. No behavioral change.
- Marker position tracks the eased heading correctly in both range modes.
- Marker > 90° from heading in 180° mode is clamped off-screen.
- `wantsFollowUpFrame` is returned while the spring is active.
- `compassLinearRange` editable appears only for `hdtLinear`/`hdmLinear` kinds.
- Wrap-around (e.g., 350° → 10°) takes the short arc in both range modes.

#### Constraints

- Do not change the `SpringEasing` module itself.
- Do not break existing non-compass linear gauges (Speed, Depth, Temp, Voltage, Wind).
- File size limit: no file exceeds 400 non-empty lines.
- Run `npm run check:all` at the end.

---

## Phase 2 — Fix coordinate alignment and size coupling

### Context for Codex

`PositionCoordinateWidget.js` renders stacked lat/lon coordinates using
`TextLayoutComposite.fitTwoRowsWithHeader` and `drawTwoRowsWithHeader`. In
`drawTwoRowsWithHeader` (lines 291–315 of `TextLayoutComposite.js`), both text rows are
drawn with `ctx.textAlign = "center"` (line 312). The `fitMultiRowBinary` call (line 225)
already finds a single `px` that fits ALL rows — so font sizes are coupled to the tighter
constraint. But the visual alignment is wrong: monospace coordinates should be right-aligned
so digits line up vertically.

### Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/shared/text-layout-engine.md

### Task: Right-align stacked coordinates and ensure coupled sizing

#### Problem

In `shared/widget-kits/text/TextLayoutComposite.js`, the `drawTwoRowsWithHeader` function
(line 291) draws both coordinate rows with `ctx.textAlign = "center"` (line 312). Monospace
tabular coordinates need right-alignment so digits align vertically. The font size coupling
is already correct (`fitMultiRowBinary` finds a single px for all rows), but the text
alignment must change.

Additionally, coordinates may render at different sizes if the `fitMultiRowBinary` coupling
is not properly constraining both rows. Verify that both rows always use the shared
`fit.linePx` value.

#### Required changes

1. **`TextLayoutComposite.js` — `fitTwoRowsWithHeader` and `drawTwoRowsWithHeader`**:
   Add an `align` option to the fit/draw API:
   - `fitTwoRowsWithHeader(args)`: Accept `cfg.align` (default: `"center"`). Store it in
     the returned fit object as `fit.align`.
   - `drawTwoRowsWithHeader(args)`: Read `fit.align` and use it for `ctx.textAlign` when
     drawing the top and bottom text rows (lines 311–314). The header row (caption/unit)
     retains its existing left/right alignment.
   - When `align === "right"`:
     - `ctx.textAlign = "right"`
     - Draw x-coordinate: `W - cfg.padX` (same as the unit header alignment).
   - When `align === "center"` (default):
     - Current behavior: `ctx.textAlign = "center"`, draw at `Math.floor(W / 2)`.

2. **`PositionCoordinateWidget.js`**: Pass `align: "right"` to `fitTwoRowsWithHeader` and
   `drawTwoRowsWithHeader` when `coordinatesTabular` is true (which it is by default).
   - In the stacked branch (line 280), add `align: coordinatesTabular ? "right" : "center"`
     to the `fitTwoRowsWithHeader` call args.
   - In the `drawTwoRowsWithHeader` call (line 307), the `fit` object now carries
     `fit.align`, so no extra parameter is needed.

3. **Fit cache key**: The `makeFitCacheKey` call (line 271) must include `align` in the
   key object so that switching between tabular and non-tabular modes invalidates the cache.

#### Verification

- Stacked coordinates (normal/high mode) render right-aligned when `coordinatesTabular`
  is true (default).
- Both lat and lon rows use the same font size (the tighter fit from `fitMultiRowBinary`).
- When `coordinatesTabular` is false, coordinates render center-aligned (existing behavior).
- Flat mode (single inline row) is unaffected.
- Run `npm run check:all` at the end.

---

## Phase 3 — Fix radial compass label sizing and tick clearance

### Context for Codex

`FullCircleRadialLayout.js` computes label geometry for the compass in
`computeModeGeometry` (line 48). Key constants:
- `LABEL_SPRITE_RADIUS_FACTOR = 1.6` — labels placed at `radius - ringW * 1.6`
- `labelFontFactor` defaults to `0.14` — label font px = `radius * 0.14 * compactGeometryScale`
- `ringW = radius * ringWidthFactor * compactGeometryScale` (default `ringWidthFactor = 0.12`)

In `FullCircleRadialEngine.js`, `resolveResponsiveTickLen` (line 28) caps major tick length
at `labelInset - 2` where `labelInset = ringW * labelInsetFactor = ringW * 1.8`. This means
ticks extend inward to `rOuter - (ringW * 1.8 - 2)`. Labels are at
`radius - ringW * 1.6`. The gap between tick ends and label center is approximately
`ringW * 0.2 - 2` pixels — tiny, causing overlap.

The `CompassRadialWidget.js` builds label sprites in `buildCompassLabelSprites` (line 22)
using `state.labels.fontPx` and positions them at `state.labels.spriteRadius` =
`geom.labelRadius`.

### Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/radial/full-circle-dial-engine.md
- documentation/widgets/compass-gauge.md

### Task: Fix radial compass labels — increase size and push inward from ticks

#### Problem

In `shared/widget-kits/radial/FullCircleRadialLayout.js`, the compass labels are:
1. Too small: `labelFontFactor` defaults to 0.14, producing tiny text.
2. Clipping into major ticks: `LABEL_SPRITE_RADIUS_FACTOR = 1.6` places labels too close
   to tick ends. The gap between tick ends and label center is only ~`ringW * 0.2 - 2` px.

#### Required changes

1. **`FullCircleRadialLayout.js`** — Adjust two constants in `computeModeGeometry`:
   - Increase `LABEL_SPRITE_RADIUS_FACTOR` from `1.6` to `2.2`. This pushes labels
     further inward, away from tick ends. The new gap between tick end and label center
     will be `ringW * (1.8 - 1) - 2 + ringW * (2.2 - 1.6)` ≈ `ringW * 0.6` — comfortable
     clearance.
     Verify the exact formula: ticks end at `rOuter - min(tickLen, ringW*1.8 - 2)`. Labels
     center at `radius - ringW * FACTOR`. The clearance is the distance between these two
     radii. With FACTOR=2.2, labels are at `radius - ringW*2.2`, and ticks end at
     approximately `radius - ringW*1.8 + 2`. Gap = `ringW*2.2 - ringW*1.8 + 2 = ringW*0.4 + 2`.
     Good clearance.
   - Increase `labelFontFactor` default from `0.14` to `0.18`. For a 200px radius, this
     changes label size from 28px * cgs → 36px * cgs. Large enough to be legible.

   **NOTE**: These constants only affect layout geometry. The `labelFontFactor` is read from
   the theme (`labels.fontFactor`) with a default fallback. Changing the default fallback
   is safe — no external caller overrides it.

2. **`CompassRadialWidget.js`** — No changes needed. The widget reads
   `state.labels.fontPx` and `state.labels.spriteRadius` from the layout, which will
   reflect the new constants automatically.

3. **`FullCircleRadialEngine.js`** — No changes needed. The `resolveResponsiveTickLen`
   function already caps ticks based on `state.labels.radiusOffset`, which is computed from
   `ringW * labelInsetFactor`. The tick cap is unaffected by `LABEL_SPRITE_RADIUS_FACTOR`.

4. **Check WindRadialWidget**: The wind widget also uses `FullCircleRadialEngine` and
   draws labels via `draw.drawLabels` (not sprites). Its labels use `radiusOffset` (from
   `labels.radiusOffset = geom.labelInsetVal = ringW * labelInsetFactor`) rather than
   `spriteRadius`. Verify that the wind widget's numeric labels still look correct with
   the new `labelFontFactor`. If the wind labels become too large, the fix should scope the
   font factor change to compass-only by passing `labelFontFactor` via the compass's
   layout config. If the wind widget looks fine, no scoping is needed.

#### Tuning guidance

The exact values (2.2, 0.18) are starting points. After applying them:
- Check that labels don't extend past the inner edge of the ring (label center minus half
  font height must be > `radius - ringW * 2 - some margin`).
- Check that at small widget sizes (e.g., 120×120), labels remain legible and don't overlap
  each other. The compass has 8 labels (N, NE, E, SE, S, SW, W, NW); at small sizes,
  adjacent labels may collide. Consider a minimum font size floor of 8px.

#### Tests

- Visual verification: compass labels do not overlap ticks at sizes 120×120, 200×200, 400×400.
- Labels are legible (font size ≥ 8px) at all sizes.
- Wind widget labels remain correctly positioned and sized.
- Run `npm run check:all` at the end.

---

## Phase 4 — Fix row spacing in ThreeValueTextWidget (COG, SOG, AWS, etc.)

### Context for Codex

`ThreeValueTextWidget.js` is the classic three-element numeric display used for COG, SOG,
AWS, and similar kinds. It renders caption / value / unit using two layout functions from
`TextLayoutComposite.js`:
- **High mode** → `fitThreeRowBlock` / `drawThreeRowBlock` (3 stacked rows)
- **Normal mode** → `fitValueUnitCaptionRows` / `drawValueUnitCaptionRows` (value+unit top row, caption bottom row)

Both functions apply per-row padding and safety margins that compound and waste significant
vertical space, making the value row undersized with visible whitespace between rows.

In `TextLayoutComposite.js`:
- `ROW_SAFE_RATIO = 0.85` (line 16) — reserves 15% of each row height as safety margin
- `innerY * 2` is subtracted from each row before applying `ROW_SAFE_RATIO`
- For `fitThreeRowBlock` with `secScale=0.8` and `H=100`, `innerY≈3`:
  - hTop(caption)=31px, hMid(value)=38px, hBot(unit)=31px
  - maxHMid = floor((38 − 6) × 0.85) = 27px — value gets only 27% of widget height
  - Total overhead: 18px (innerY×6) + ~13px (ROW_SAFE_RATIO) ≈ 31px wasted

### Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/shared/text-layout-engine.md

### Task: Reduce row spacing overhead in ThreeValueTextWidget's high and normal modes

#### Problem

In `shared/widget-kits/text/TextLayoutComposite.js`, the `fitThreeRowBlock` (high mode)
and `fitValueUnitCaptionRows` (normal mode) functions apply too much per-row vertical
overhead. This affects `ThreeValueTextWidget` (COG, SOG, AWS, etc.) — the classic
three-element numeric displays.

Two sources of overhead compound across rows:
1. `ROW_SAFE_RATIO = 0.85` (line 16) — 15% safety margin per row is too aggressive.
2. `innerY * 2` subtracted from each row — padding applied top and bottom of every row.

For a 100px-tall widget in high mode with `innerY=3` and `secScale=0.8`:
- 18px lost to innerY (6px × 3 rows)
- ~13px lost to ROW_SAFE_RATIO (15% of remaining per row)
- The value row gets only ~27px out of 100px

#### Required changes

All changes are in `shared/widget-kits/text/TextLayoutComposite.js`.
No changes to `ThreeValueTextWidget.js`, `LinearGaugeLayout.js`, or any widget file.

1. **Increase `ROW_SAFE_RATIO`** from `0.85` to `0.92`:
   - The 15% safety margin was too conservative. Browser glyph overshoot rarely exceeds
     5–8% of font size. A 92% ratio still provides safety while reclaiming ~7% per row.
   - This is a single constant at line 16 used by `fitThreeRowBlock` and
     `fitValueUnitCaptionRows`.

2. **Reduce `innerY` multiplier in `fitThreeRowBlock`** (high mode, line 36):
   - Change the maxH computation for ALL THREE rows from `innerY * 2` to `innerY`:
     ```js
     const maxHTop = Math.max(1, Math.floor((hTop - innerY) * ROW_SAFE_RATIO));
     const maxHMid = Math.max(1, Math.floor((hMid - innerY) * ROW_SAFE_RATIO));
     const maxHBot = Math.max(1, Math.floor((hBot - innerY) * ROW_SAFE_RATIO));
     ```
   - Rationale: The three rows are stacked directly — the bottom padding of one row and
     the top padding of the next overlap visually. Using `innerY * 1` per row provides
     the same visual separation as `innerY * 2` did for a single isolated row.

3. **Reduce `innerY` multiplier in `fitValueUnitCaptionRows`** (normal mode, line 115):
   - Same change: `innerY * 2` → `innerY` for maxH computation:
     ```js
     const maxHTop = Math.max(1, Math.floor((hTop - innerY) * ROW_SAFE_RATIO));
     const maxHBot = Math.max(1, Math.floor((hBot - innerY) * ROW_SAFE_RATIO));
     ```

4. **Reduce `innerY` multiplier in `fitTwoRowsWithHeader`** (line 201) for consistency:
   - The coordinate two-row layout uses the same pattern. Apply the same change:
     ```js
     const maxRowH = Math.max(1, Math.min(row1H, row2H) - innerY);
     ```
     And for header:
     ```js
     const maxHeaderH = Math.max(1, headerH - innerY);
     ```

#### Impact analysis

- **ThreeValueTextWidget** (COG, SOG, AWS, BRG, etc.): Primary fix target. The value
  row will be visibly larger in high and normal modes. High mode: value gets ~35px out
  of 100px instead of 27px (≈30% improvement).
- **PositionCoordinateWidget**: Uses `fitTwoRowsWithHeader` — will also benefit from the
  reduced overhead in its stacked coordinate display (change 4).
- **LinearGaugeEngine**: Uses `LinearGaugeLayout.splitCaptionValueRows` and
  `LinearGaugeTextLayout.drawCaptionRow`/`drawValueUnitRow` — these do NOT use the
  TextLayoutComposite functions and are therefore **unaffected** by this change.
- **SemicircleRadialEngine** / **FullCircleRadialEngine**: Use their own text layout
  modules (`SemicircleRadialTextLayout`, `FullCircleRadialTextLayout`) which do NOT
  use `ROW_SAFE_RATIO` — **unaffected**.
- **CenterDisplayTextWidget**: Uses `TextTileLayout.drawFittedLine` — **unaffected**.

#### Verification

- ThreeValueTextWidget in high mode: value row is visually dominant, no excessive
  whitespace between caption/value/unit rows.
- ThreeValueTextWidget in normal mode: value+unit row fills its allocation efficiently.
- Flat mode: uses `fitInlineTriplet` which does not use `ROW_SAFE_RATIO` — unaffected.
- PositionCoordinateWidget stacked mode: coordinates display correctly with tighter spacing.
- No text clipping at small widget sizes (the 92% safety ratio still prevents overshoot).
- Run `npm run check:all` at the end.

---

## Phase 5 — Fix radial gauge sectors overlaying the scale ring line

### Context for Codex

In `SemicircleRadialEngine.js` (lines 198–213), the draw order is:
1. `draw.drawArcRing(...)` — ring stroke at `rOuter`
2. `for each sector: draw.drawAnnularSector(...)` — filled annular sectors at `rOuter`

The `drawAnnularSector` fills from `rOuter` inward to `rOuter - thickness` (=`ringW`).
Since the ring stroke is at `rOuter`, the sector fill covers the ring. If the ring line
width is increased, only the segments without sectors appear thicker — creating a visually
broken ring.

Same pattern in `WindRadialWidget.js` (lines 106–121): `drawFullCircleRing` first, then
`drawAnnularSector` on top.

### Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/widgets/semicircle-gauges.md
- documentation/widgets/wind-dial.md

### Task: Draw the scale ring after sectors so the ring line is always visible

#### Problem

In `shared/widget-kits/radial/SemicircleRadialEngine.js`, `drawArcRing` (line 198) is
called before the sector loop (lines 202–213). The sectors fill the same annular region as
the ring, painting over the ring stroke. The ring should be drawn AFTER the sectors so it
is always visible on top.

Same issue in `widgets/radial/WindRadialWidget/WindRadialWidget.js` in the `rebuildLayer`
callback for the "back" layer: `api.drawFullCircleRing(layerCtx)` at line 106 is called
before `drawAnnularSector` at lines 107–121.

#### Required changes

1. **`SemicircleRadialEngine.js`**: Move the `draw.drawArcRing(...)` call (currently at
   line 198) to AFTER the sector loop (after line 213). The new order should be:
   ```
   // 1. Draw sectors first (background fills)
   for (let i = 0; i < sectorList.length; i += 1) { ... drawAnnularSector ... }
   // 2. Draw arc ring on top (always visible)
   draw.drawArcRing(ctx, ...);
   // 3. Draw pointer
   if (isFinite(easedAngle)) { draw.drawPointerAtRim(...); }
   // 4. Draw ticks
   draw.drawTicksFromAngles(...);
   // 5. Draw labels
   drawMajorValueLabels(...);
   ```
   
   Ticks and labels should also be drawn after the ring, which they already are in the
   current code. Only the ring needs to move.

2. **`WindRadialWidget.js`**: In the `rebuildLayer` callback for `layerName === "back"`,
   move the `api.drawFullCircleRing(layerCtx)` call to AFTER the sector drawing:
   ```
   if (layerName === "back") {
     // Draw sectors first
     if (display.layEnabled && ...) {
       state.draw.drawAnnularSector(layerCtx, ...); // starboard
       state.draw.drawAnnularSector(layerCtx, ...); // port
     }
     // Draw ring on top
     api.drawFullCircleRing(layerCtx);
     return;
   }
   ```

3. **Linear gauge sectors**: Check `shared/widget-kits/linear/LinearGaugeEngine.js`
   `drawStaticLayer` (line 58). The linear engine draws `drawTrack` before `drawBand`
   sectors, but linear sectors are positioned at `sectorBandY` (above the track), not on
   top of it. No change needed for linear.

#### Verification

- When sectors are defined (e.g., Speed gauge with warning/alarm zones), the ring line is
  fully visible and continuous around the entire arc, including where sectors are drawn.
- When the ring line width is increased via theme, the thicker line is uniform everywhere.
- Wind widget lay-line sectors do not cover the ring in full-circle mode.
- Widgets without sectors (e.g., compass) are unaffected.
- Run `npm run check:all` at the end.

---

## Phase 6 — Fix coordinate alignment and size coupling in CenterDisplay

### Context for Codex

Phase 2 fixed coordinate alignment for `PositionCoordinateWidget` (which uses
`TextLayoutComposite.fitTwoRowsWithHeader`), but `CenterDisplayTextWidget` uses a completely
different rendering pipeline — `TextTileLayout.drawFittedLine` — and was not covered.

`CenterDisplayTextWidget.js` renders lat/lon via `drawCenterPanel` (lines 135–175) which
calls `tileLayout.drawFittedLine(...)` for each coordinate line independently, with
`align: layout.center.coordAlign`. The `coordAlign` value comes from `CenterDisplayLayout.js`
where it is hardcoded to `"center"` in both `splitStackedPanel` (line 193) and
`splitNormalPanel` (line 212).

Each coordinate line is fitted independently via `measureFittedLine` → `fitSingleTextPx`,
so lat and lon can end up at different font sizes. The widget already computes
`coordinatesTabular` (line 299) and selects `monoFamily` when true, but alignment and size
coupling are missing.

### Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/widgets/center-display.md

### Task: Fix coordinate alignment and size coupling in CenterDisplayTextWidget

#### Problem

Two issues remain in `CenterDisplayTextWidget` after Phase 2:
1. **Alignment**: `CenterDisplayLayout.js` hardcodes `coordAlign: "center"` in both
   `splitStackedPanel` (line 193) and `splitNormalPanel` (line 212). When
   `coordinatesTabular` is true (default), monospace coordinates need right-alignment so
   digits line up vertically.
2. **Size coupling**: `drawCenterPanel` (CenterDisplayTextWidget.js lines 151–174) calls
   `drawFittedLine` for latText and lonText independently. Each call runs
   `measureFittedLine` → `fitSingleTextPx` separately, so lat and lon can end up at
   different font sizes. They must share the same (smaller) size.

#### Verified baseline

- `CenterDisplayTextWidget.js` line 299: `const coordinatesTabular = p.coordinatesTabular !== false;`
- `CenterDisplayTextWidget.js` line 301: `const centerValueFamily = coordinatesTabular ? monoFamily : family;`
- `CenterDisplayTextWidget.js` lines 135–175: `drawCenterPanel` draws caption, lat, lon
  via `tileLayout.drawFittedLine(...)` with `align: layout.center.coordAlign`.
- `CenterDisplayLayout.js` line 193: `coordAlign: "center"` in `splitStackedPanel`
  (used by high mode and flat mode).
- `CenterDisplayLayout.js` line 212: `coordAlign: "center"` in `splitNormalPanel`
  (used by normal mode).
- `TextTileLayout.js` `drawFittedLine` (line 262) supports `cfg.align` values:
  `"center"`, `"right"`, `"left"`. It accepts a pre-computed `cfg.fit` (line 269:
  `const fit = cfg.fit || measureFittedLine({...})`), skipping internal measurement
  when provided.
- `TextTileLayout.js` `measureFittedLine` (line 230) returns `{ px, text }`.

#### Required changes

##### 1. Thread `coordinatesTabular` into the layout's `coordAlign`

**`CenterDisplayLayout.js`** — Both `splitStackedPanel` and `splitNormalPanel` must accept
a `coordAlign` parameter:

- `splitStackedPanel(rect, captionRatio, coordAlign)`:
  Change `coordAlign: "center"` (line 193) to `coordAlign: coordAlign || "center"`.
- `splitNormalPanel(rect, gap, captionShare, coordAlign)`:
  Change `coordAlign: "center"` (line 212) to `coordAlign: coordAlign || "center"`.
- In `computeLayout`, read `cfg.coordAlign` and pass it through to both split functions.
  There are 4 call sites to update (flat mode line 116, high mode line 134, normal mode
  line 138, and any other `splitStackedPanel`/`splitNormalPanel` call).

**`CenterDisplayTextWidget.js`** — Pass `coordAlign` when calling `layoutApi.computeLayout`:
```js
const layout = layoutApi.computeLayout({
  // ... existing args ...
  coordAlign: coordinatesTabular ? "right" : "center"
});
```
No changes needed in `drawCenterPanel` — it already reads `layout.center.coordAlign`.

##### 2. Couple lat/lon font sizes

**`CenterDisplayTextWidget.js`** — Modify `drawCenterPanel` to pre-measure both lines and
use the smaller fitted size for both:

```js
function drawCenterPanel(layout, state, displayState, labelFamily, valueFamily, valueWeight, labelWeight, color) {
  var textFillScale = layout.responsive.textFillScale;
  var relationValueMaxPx = computeRelationValueMaxPx(layout, textFillScale);
  state.ctx.fillStyle = color;

  // Draw caption (unchanged)
  state.tileLayout.drawFittedLine({
    textApi: state.radialText,
    ctx: state.ctx,
    text: displayState.positionCaption,
    rect: layout.center.captionRect,
    align: layout.center.captionAlign,
    family: labelFamily,
    weight: labelWeight,
    maxPx: computeResponsiveLineMaxPx(layout.center.captionRect, 0.76, textFillScale),
    padX: state.layoutApi.computeTextPadPx(layout.center.captionRect, layout.responsive),
    color: color
  });

  // Pre-measure lat and lon independently
  var latFit = state.tileLayout.measureFittedLine({
    textApi: state.radialText,
    ctx: state.ctx,
    text: displayState.latText,
    maxW: layout.center.latRect.w,
    maxH: layout.center.latRect.h,
    maxPx: relationValueMaxPx,
    textFillScale: textFillScale,
    family: valueFamily,
    weight: valueWeight
  });
  var lonFit = state.tileLayout.measureFittedLine({
    textApi: state.radialText,
    ctx: state.ctx,
    text: displayState.lonText,
    maxW: layout.center.lonRect.w,
    maxH: layout.center.lonRect.h,
    maxPx: relationValueMaxPx,
    textFillScale: textFillScale,
    family: valueFamily,
    weight: valueWeight
  });

  // Couple: use the smaller px so both lines share the same font size
  var coupledPx = Math.min(latFit.px, lonFit.px);
  var coupledLatFit = coupledPx < latFit.px ? { px: coupledPx, text: latFit.text } : latFit;
  var coupledLonFit = coupledPx < lonFit.px ? { px: coupledPx, text: lonFit.text } : lonFit;

  // Draw lat with coupled fit
  state.tileLayout.drawFittedLine({
    textApi: state.radialText,
    ctx: state.ctx,
    text: displayState.latText,
    rect: layout.center.latRect,
    align: layout.center.coordAlign,
    family: valueFamily,
    weight: valueWeight,
    fit: coupledLatFit,
    padX: state.layoutApi.computeTextPadPx(layout.center.latRect, layout.responsive),
    color: color
  });

  // Draw lon with coupled fit
  state.tileLayout.drawFittedLine({
    textApi: state.radialText,
    ctx: state.ctx,
    text: displayState.lonText,
    rect: layout.center.lonRect,
    align: layout.center.coordAlign,
    family: valueFamily,
    weight: valueWeight,
    fit: coupledLonFit,
    padX: state.layoutApi.computeTextPadPx(layout.center.lonRect, layout.responsive),
    color: color
  });
}
```

##### 3. No changes needed in TextTileLayout.js

`drawFittedLine` already supports `cfg.fit` pass-through and all three alignment values.

##### 4. RoutePointsTextHtmlWidget — already handled

RoutePoints is an HTML widget that applies CSS class `dyni-tabular` for coordinate
alignment (RoutePointsMarkup.js line 85). Not affected by this canvas-level fix.

#### Edge cases

- When `coordinatesTabular` is false (non-default), `coordAlign` falls back to `"center"`
  and lat/lon are fitted independently (existing behavior). Size coupling still applies —
  matched sizes benefit proportional fonts too. If this causes regression for proportional
  fonts, make coupling conditional on `coordinatesTabular`.
- When one coordinate is a placeholder (`"---"`) and the other is a real value, the
  placeholder is shorter. The coupled px is determined by the longer real value — the
  placeholder renders at the same larger size. Correct behavior.
- `relationValueMaxPx` ceiling is shared for both lines. Coupling only further constrains
  below this ceiling — no risk of exceeding bounds.

#### Verification

- CenterDisplay in high/normal/flat modes: lat and lon render at the same font size.
- CenterDisplay with `coordinatesTabular: true` (default): coordinates are right-aligned,
  digits line up vertically.
- CenterDisplay with `coordinatesTabular: false`: coordinates are center-aligned (existing
  behavior).
- PositionCoordinateWidget: Phase 2 fix still works (no regression).
- RoutePoints: HTML tabular alignment still works (no regression).
- Run `npm run check:all` at the end.

- Each issue's visual regression is corrected as described.
- No other widget behavior regresses.
- No file exceeds 400 non-empty lines.
- Every modified file retains its Module/Documentation/Depends header.
- No new smell violations (`npm run check:all` passes).
- Coverage thresholds remain satisfied.
- PLAN10 perf gates remain satisfied (`perf:check` passes).

---

## Acceptance criteria (all phases)

- Each issue's visual regression is corrected as described.
- No other widget behavior regresses.
- No file exceeds 400 non-empty lines.
- Every modified file retains its Module/Documentation/Depends header.
- No new smell violations (`npm run check:all` passes).
- Coverage thresholds remain satisfied.
- PLAN10 perf gates remain satisfied (`perf:check` passes).

---

## Engineering invariants

- **No new modules**: All changes are to existing files. No new shared modules are introduced.
- **No API removals**: All existing engine APIs (`drawDefaultPointer`, `drawMarkerAtValue`, etc.) continue to work.
- **Backward-compatible defaults**: New options (`springTarget`, `align`) default to current behavior.
- **Cache invalidation**: Any change that affects fit/layer cache keys is reflected in the key computation.