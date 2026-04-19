# PLAN12 — Post-PLAN11 Regression Fixes

## Status

Execution plan for five regressions and issues identified after PLAN11 completion.
Each phase is scoped for one Codex session. Phases are independent and may execute in any order.

---

## Issues Summary

| # | Title | Affected files | Root cause |
|---|-------|---------------|------------|
| 1 | Spring ease on linear compass eases the pointer instead of the scale | `LinearGaugeEngine.js`, `CompassLinearWidget.js` | `springMotion.resolve()` is applied to `displayState.num` which feeds the pointer; for compass-mode the axis should be eased, not the pointer |
| 2 | Coordinates monospace but not aligned; N/E sizes not coupled | `TextLayoutComposite.js`, `PositionCoordinateWidget.js` | `drawTwoRowsWithHeader` uses `ctx.textAlign = "center"`; needs right-alignment and the existing `fitMultiRowBinary` coupling must be surfaced correctly |
| 3 | Radial compass labels clip into major ticks and are too small | `FullCircleRadialLayout.js`, `CompassRadialWidget.js` | `LABEL_SPRITE_RADIUS_FACTOR = 1.6` places labels too close to tick ends; `labelFontFactor = 0.14` produces undersized text |
| 4 | Normal/high mode row spacing too large, value row undersized | `LinearGaugeLayout.js`, `LinearGaugeTextLayout.js` | `HIGH_TEXT_GAP_FACTOR = 1.2` and `HIGH_CAPTION_SHARE_RATIO = 0.36` plus `splitCaptionValueRows` secScale compounding steals vertical space from the value row |
| 5 | Radial gauge sectors overlay the scale ring line | `SemicircleRadialEngine.js`, `WindRadialWidget.js` | `drawArcRing` / `drawFullCircleRing` is called before sector fills, so sectors paint over the ring stroke |

---

## Phase 1 — Fix spring easing on linear compass (scale eased, pointer fixed)

### Context for Codex

The linear compass (`CompassLinearWidget.js`) uses `LinearGaugeEngine.js` to render a horizontal heading scale with a fixed center pointer. The scale's visible range is centered on the current heading via `resolveAxis(props, range, defaultAxis)` which returns `{ min: heading - 180, max: heading + 180 }`. The pointer is drawn at the heading value on the scale, which visually sits at the center.

PLAN11 added `SpringEasing` to `LinearGaugeEngine`. The engine creates `springMotion` at module scope (line 33) and calls `springMotion.resolve(canvas, displayState.num, easingEnabled, Date.now())` at line 280 to produce `easedDisplayNum`. This eased value is used by `drawApi.drawDefaultPointer` (line 367). The result is that the **pointer** animates smoothly but the **scale** jumps instantly — the opposite of the intended behavior.

For a compass, the correct behavior is:
- The **scale** (axis) animates smoothly toward the new heading (spring-eased).
- The **pointer** is always fixed at the visual center of the scale (no easing on the pointer itself).
- The marker course indicator must also be positioned relative to the eased heading.

### Prompt

```
## Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/shared/spring-easing.md
- documentation/linear/linear-shared-api.md

## Task: Fix spring easing for linear compass — ease the scale, not the pointer

### Problem

In `shared/widget-kits/linear/LinearGaugeEngine.js`, the spring easing is applied to the
display value (`displayState.num`) at line 280 and fed to `drawDefaultPointer` at line 367.
For the compass linear widget, this eases the pointer position instead of the scale.

The compass widget (`widgets/linear/CompassLinearWidget/CompassLinearWidget.js`) defines:
- `resolveAxis(props, range, defaultAxis)` — returns `{ min: heading-180, max: heading+180 }`
- `drawFrame(state, props, display, api)` — calls `api.drawDefaultPointer()` and draws a marker

The **scale** should ease (the axis slides smoothly) and the **pointer** should be fixed at
the center of the visible range.

### Required changes

1. **`CompassLinearWidget.js`**: The compass must own its own spring motion instance
   (via `SpringEasing.create(def, Helpers).createMotion({ wrap: 360 })`), apply it to the
   raw heading BEFORE passing it to `resolveAxis`, and draw the pointer at the eased
   heading value (which is always the visual center of the eased axis). The marker must
   be positioned relative to the eased heading.

   - Add `SpringEasing` to the Depends header and to `getModule` calls.
   - Create `const springMotion = Helpers.getModule("SpringEasing").create(def, Helpers).createMotion({ wrap: 360 });`
   - In `resolveAxis`: accept the heading value that will be passed from the engine's
     render path. The easing must happen at the call site that supplies the heading to
     `resolveAxis`, not inside `resolveAxis` itself (resolveAxis is called by the engine
     during the render path before the easer runs).
   - Change the approach: instead of easing inside `resolveAxis`, the compass should
     use the engine's `drawFrame` callback. In `drawFrame`, resolve the eased heading
     via `springMotion.resolve(state.canvas || api.canvas, display.num, props.easing !== false, Date.now())`,
     then recompute the axis from the eased heading, remap the pointer and marker
     positions to the eased axis.
   
   Actually, the simplest correct approach:
   - Override `resolveAxis` to accept `props` and use a spring-eased heading internally.
     But `resolveAxis` doesn't have access to the canvas element needed for per-instance
     spring state.
   
   **Recommended approach**: Modify `resolveAxis` in CompassLinearWidget to use the raw
   heading for axis computation. Then in `drawFrame`:
   a. Compute the eased heading via the compass's own `springMotion.resolve(...)`.
   b. The axis provided by the engine is based on the raw heading.
   c. The pointer should be drawn at the raw heading value on the raw axis (which is the
      center — this is already correct).
   d. The STATIC LAYER (ticks, labels) must shift to reflect the eased heading. This means
      the axis passed to the static layer should use the eased heading.
   
   But the static layer is cached — it can't ease per-frame. So the correct design is:
   
   **Final approach**:
   a. `resolveAxis` uses a spring-eased heading. To get per-instance state, the heading
      easing must happen BEFORE `resolveAxis` is called, which means the eased heading
      must be threaded through `props`.
   b. The engine calls `resolveAxisFn(p, range, defaultAxis, hookApiBase)` at line 182.
      The compass's `resolveAxis` reads the heading from `props`.
   c. The compass can pre-process the heading using a separate mechanism: add an
      `interceptProps` or `preprocessValue` hook to the engine spec. Or: have the compass
      modify `p.heading` in-place inside a `beforeRender` callback.
   
   **Simplest correct approach given the engine architecture**:
   - The engine already has the spring easing for the pointer (`easedDisplayNum`).
   - For compass-mode (`axisMode: "fixed360"`), the engine should use the eased value
     to compute the axis instead of using it for the pointer.
   - Add a new engine spec flag: `springTarget: "axis"` (default: `"pointer"`).
   - When `springTarget === "axis"`:
     - The spring eases the display value as before, producing `easedDisplayNum`.
     - `resolveAxis` receives the eased value in the heading prop instead of the raw value.
     - The static layer key includes the eased heading (invalidating the cache each frame
       during animation — acceptable since compass already invalidates on heading change).
     - The pointer draws at the **eased** value (which is the center of the eased axis).
     - In compass's `drawFrame`, `api.drawDefaultPointer()` uses `easedDisplayNum` which
       is the eased heading — this puts the pointer at the center of the eased axis. Correct.
   - When `springTarget === "pointer"` (default, current behavior):
     - No change. The axis is raw, the pointer is eased.

2. **`LinearGaugeEngine.js`**: Add support for `cfg.springTarget`.
   - Read `cfg.springTarget` alongside other config (default: `"pointer"`).
   - Move the `springMotion.resolve(...)` call to just before the axis resolution.
   - If `springTarget === "axis"`:
     - Compute `easedDisplayNum` from the raw heading.
     - Override the raw value key in `p` (or pass eased heading to resolveAxisFn) before
       calling `resolveAxisFn`.
     - The `resolveAxis` callback receives the eased heading as `p.value` or `p.heading`.
     - The pointer draws at `easedDisplayNum` on the eased axis (which is visually fixed
       at center).
     - The static layer cache key must include the eased axis min/max (already does via
       `axisMin`/`axisMax` in the static key).
   - If `springTarget === "pointer"` (default):
     - Current behavior: axis is raw, pointer position is eased.

3. **`CompassLinearWidget.js`**: Set `springTarget: "axis"` in the `createRenderer` spec.
   - The compass's `drawFrame` continues to call `api.drawDefaultPointer()` — but now it
     draws at the eased heading position on the eased axis (center).
   - The marker must be positioned relative to the eased heading:
     `const markerWrapped = easedHeading + norm180(marker - easedHeading);`
     The `drawFrame` callback needs access to the eased heading. Pass it via `displayState`
     or as a property on `drawApi`.
   - Expose `easedDisplayNum` on the `displayState` object or on `drawApi` so that
     `drawFrame` callbacks can use it. Add `displayState.easedNum = easedDisplayNum;`
     in the engine after computing it.

4. **`drawFrame` in CompassLinearWidget.js**: Update to use the eased heading for the
   marker calculation:
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

5. **Return `wantsFollowUpFrame`**: The engine already checks `springMotion.isActive(canvas)`
   at line 392. When `springTarget === "axis"`, the spring animates the axis, so each frame
   the static layer cache is invalidated (axis changes), and the spring requests follow-up
   frames until settled. This is correct and no additional change is needed for animation
   scheduling.

### Tests

- Verify that with `springTarget: "axis"`, after a heading change, the axis (min/max)
  smoothly transitions while the pointer remains at the center of the axis.
- Verify that with `springTarget: "pointer"` (default), existing non-compass linear gauges
  still ease the pointer.
- Verify the marker position tracks the eased heading correctly.
- Verify `wantsFollowUpFrame` is returned while the spring is active.

### Constraints

- Do not change the `SpringEasing` module itself.
- Do not break existing non-compass linear gauges (Speed, Depth, etc.).
- File size limit: no file exceeds 400 non-empty lines.
- Run `npm run check:all` at the end.
```

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

### Prompt

```
## Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/shared/text-layout-engine.md

## Task: Right-align stacked coordinates and ensure coupled sizing

### Problem

In `shared/widget-kits/text/TextLayoutComposite.js`, the `drawTwoRowsWithHeader` function
(line 291) draws both coordinate rows with `ctx.textAlign = "center"` (line 312). Monospace
tabular coordinates need right-alignment so digits align vertically. The font size coupling
is already correct (`fitMultiRowBinary` finds a single px for all rows), but the text
alignment must change.

Additionally, coordinates may render at different sizes if the `fitMultiRowBinary` coupling
is not properly constraining both rows. Verify that both rows always use the shared
`fit.linePx` value.

### Required changes

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

### Verification

- Stacked coordinates (normal/high mode) render right-aligned when `coordinatesTabular`
  is true (default).
- Both lat and lon rows use the same font size (the tighter fit from `fitMultiRowBinary`).
- When `coordinatesTabular` is false, coordinates render center-aligned (existing behavior).
- Flat mode (single inline row) is unaffected.
- Run `npm run check:all` at the end.
```

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

### Prompt

```
## Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/radial/full-circle-dial-engine.md
- documentation/widgets/compass-gauge.md

## Task: Fix radial compass labels — increase size and push inward from ticks

### Problem

In `shared/widget-kits/radial/FullCircleRadialLayout.js`, the compass labels are:
1. Too small: `labelFontFactor` defaults to 0.14, producing tiny text.
2. Clipping into major ticks: `LABEL_SPRITE_RADIUS_FACTOR = 1.6` places labels too close
   to tick ends. The gap between tick ends and label center is only ~`ringW * 0.2 - 2` px.

### Required changes

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

### Tuning guidance

The exact values (2.2, 0.18) are starting points. After applying them:
- Check that labels don't extend past the inner edge of the ring (label center minus half
  font height must be > `radius - ringW * 2 - some margin`).
- Check that at small widget sizes (e.g., 120×120), labels remain legible and don't overlap
  each other. The compass has 8 labels (N, NE, E, SE, S, SW, W, NW); at small sizes,
  adjacent labels may collide. Consider a minimum font size floor of 8px.

### Tests

- Visual verification: compass labels do not overlap ticks at sizes 120×120, 200×200, 400×400.
- Labels are legible (font size ≥ 8px) at all sizes.
- Wind widget labels remain correctly positioned and sized.
- Run `npm run check:all` at the end.
```

---

## Phase 4 — Fix row spacing in normal and high modes for linear gauges

### Context for Codex

`LinearGaugeLayout.js` defines layout constants for the linear gauge engine. In **high mode**
(`computeStackedLayout`, line 89), the vertical budget is split as:
- `HIGH_TEXT_GAP_FACTOR = 1.2` — gap between scale area and text area = `gap * 1.2`
- `HIGH_SCALE_HEIGHT_RATIO = 0.44` — scale gets 44% of `(contentRect.h - textGap)`
- `HIGH_CAPTION_SHARE_RATIO = 0.36` — caption row gets 36% of the remaining text area

Then `splitCaptionValueRows` (line 223) re-distributes caption and value rows using
`secScale` (default 0.8), giving caption 44% and value 56% of the combined text height.
The compounding of these allocations leaves the value row significantly undersized with
visible whitespace between the scale and the text rows.

In **normal mode** (inline variant, `computeInlineLayout`, line 135):
- `NORMAL_INLINE_HEIGHT_RATIO = 0.42` — inline text band gets 42% of content height
- The track gap (`NORMAL_TOP_MARGIN_RATIO = 0.05`) plus `NORMAL_SCALE_HEIGHT_RATIO = 0.50`
  take significant vertical space

### Prompt

```
## Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/linear/linear-shared-api.md

## Task: Reduce row spacing and increase value row allocation in linear gauge normal/high modes

### Problem

In `shared/widget-kits/linear/LinearGaugeLayout.js`:
- **High mode**: Too much vertical space allocated to the gap and caption, leaving the value
  row undersized. `HIGH_TEXT_GAP_FACTOR = 1.2`, `HIGH_SCALE_HEIGHT_RATIO = 0.44`, and
  `HIGH_CAPTION_SHARE_RATIO = 0.36` compound to compress the value row.
- **Normal mode** (inline): The inline text band (`NORMAL_INLINE_HEIGHT_RATIO = 0.42`) is
  compressed because the scale and top margin take too much space.

Additionally, `splitCaptionValueRows` (line 223) re-distributes using `secScale=0.8`,
giving caption 44% of the combined text height — further shrinking the value area.

### Required changes

1. **`LinearGaugeLayout.js`** — Adjust high-mode constants:
   - Reduce `HIGH_TEXT_GAP_FACTOR` from `1.2` to `0.6`. The gap between scale and text
     should be minimal — just enough visual separation.
   - Reduce `HIGH_SCALE_HEIGHT_RATIO` from `0.44` to `0.38`. Give more vertical budget
     to the text area below the scale.
   - Reduce `HIGH_CAPTION_SHARE_RATIO` from `0.36` to `0.28`. Caption is secondary
     information; the value row should dominate.

2. **`LinearGaugeLayout.js`** — Adjust normal-mode constants:
   - Increase `NORMAL_INLINE_HEIGHT_RATIO` from `0.42` to `0.48`. Give more height to
     the inline text band.
   - Reduce `NORMAL_TOP_MARGIN_RATIO` from `0.05` to `0.03`. Less wasted space above
     the scale.

3. **`LinearGaugeLayout.js` — `splitCaptionValueRows`**: Bias the split toward the value row:
   - Change the caption share formula from `ratio / (1 + ratio)` to a formula that gives
     less space to caption. With `secScale = 0.8`:
     - Current: `captionShare = 0.8 / 1.8 = 0.44` → caption gets 44%.
     - Target: caption should get ~30–35%.
     - New formula: `const captionShare = (ratio * 0.75) / (1 + ratio);`
       With `secScale = 0.8`: `captionShare = 0.6 / 1.8 = 0.33` → caption gets 33%.
     - This preserves the secScale sensitivity (larger secScale = larger caption) while
       shifting the balance toward the value row.

### Verification

- In high mode at various aspect ratios, the value row is visually dominant and the gap
  between scale and text is minimal.
- In normal mode, the inline text band uses the available space efficiently.
- Caption text remains legible (not clipped or invisible).
- Flat mode is unaffected (uses separate layout function).
- Run `npm run check:all` at the end.
```

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

### Prompt

```
## Mandatory preflight

Read these files before any code changes:
- documentation/TABLEOFCONTENTS.md
- documentation/conventions/coding-standards.md
- documentation/conventions/smell-prevention.md
- documentation/widgets/semicircle-gauges.md
- documentation/widgets/wind-dial.md

## Task: Draw the scale ring after sectors so the ring line is always visible

### Problem

In `shared/widget-kits/radial/SemicircleRadialEngine.js`, `drawArcRing` (line 198) is
called before the sector loop (lines 202–213). The sectors fill the same annular region as
the ring, painting over the ring stroke. The ring should be drawn AFTER the sectors so it
is always visible on top.

Same issue in `widgets/radial/WindRadialWidget/WindRadialWidget.js` in the `rebuildLayer`
callback for the "back" layer: `api.drawFullCircleRing(layerCtx)` at line 106 is called
before `drawAnnularSector` at lines 107–121.

### Required changes

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

### Verification

- When sectors are defined (e.g., Speed gauge with warning/alarm zones), the ring line is
  fully visible and continuous around the entire arc, including where sectors are drawn.
- When the ring line width is increased via theme, the thicker line is uniform everywhere.
- Wind widget lay-line sectors do not cover the ring in full-circle mode.
- Widgets without sectors (e.g., compass) are unaffected.
- Run `npm run check:all` at the end.
```

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
