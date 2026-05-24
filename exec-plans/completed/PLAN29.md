# PLAN29 — XteDisplayLinear: Linear Gauge XTE Widget for Small/Flat Layouts

## Status

Plan ready to implement. Verified against repository at commit 98613c0 (v3.2.0).

## Goal

After PLAN29 is complete:

1. The nav cluster offers a new `xteDisplayLinear` kind — a canvas-dom widget that renders cross-track error as a horizontal linear gauge bar with integrated text metric tiles, optimized for small and flat widget slots where the full 2.5D highway `xteDisplay` wastes space.

2. The widget shows the same four navigation metrics as `xteDisplay` — XTE (with L/R side suffix), COG, DST, BRG — as text metric tiles alongside a horizontal gauge bar, with an optional waypoint name header. A `hideTextualMetrics` toggle removes all metric tiles, leaving the gauge bar only.

3. The gauge bar uses `LinearCanvasPrimitives` (track, ticks, bands) and `LinearGaugeMath` for visual consistency with shipped linear instruments. The pointer is a custom upward-pointing triangle drawn below the track (unlike standard linear widgets where the pointer points downward from above). The axis is `range`-mode with symmetric `[-xteScale, +xteScale]` bounds derived by the mapper from unit-aware per-token scale editables. The pointer is spring-eased by default. Tick labels appear only at min and max positions.

4. Overflow behavior matches the highway widget: when `abs(xte) > xteScale`, the pointer clamps at the gauge edge and renders in the alarm color. No sector bands are drawn by default.

5. Three responsive layout modes mirror the highway widget's structure, with the gauge bar replacing the highway rect:

   - **flat** (`ratio > flatThreshold`): gauge bar left (~58%), optional name header + 2×2 metric grid right
   - **normal** (`normalThreshold ≤ ratio ≤ flatThreshold`): gauge bar top (~64%), 4-column metric row bottom (~36%)
   - **high** (`ratio < normalThreshold`): COG/BRG top strip (~14%), gauge bar middle (~68%), XTE/DST bottom strip (~18%)

6. State screens match the highway widget: `disconnected` (GPS Lost) when `wpServer === false`, `noTarget` (No Waypoint) when waypoint name is empty string, `data` otherwise. State screens render via the shared `StateScreenCanvasOverlay` on a cleared canvas.

7. All new editables are conditioned on `kind: "xteDisplayLinear"` and follow gauge-prefixed naming. Unit-aware scale editables use per-token fields (`xteLinearScale_{token}`) with the same default values as the highway widget's `xteDisplayScale_{token}` fields. The new kind has its own `formatUnit_xteDisplayLinearXte` and `formatUnit_xteDisplayLinearDst` selectors and per-token unit display labels, independent of the highway widget.

8. Shared editables in the nav cluster are audited and scoped for the new kind: `stableDigits` condition includes `xteDisplayLinear`, `captionUnitScale` condition excludes it (the widget uses its own metric tile layout), `caption_xteDisplayLinear`/`unit_xteDisplayLinear` hiding is handled by existing `makePerKindTextParams`/`makeUnitAwareTextParams` machinery.

9. The widget follows all project conventions: UMD component pattern, `renderCanvas(canvas, props)` canvas-dom renderer, `CanvasLayerCache` for static gauge layer, responsive ratio-mode adaptation, `GeometryScale` for stroke/pointer geometry, mandatory file headers, and ≤400-line file targets.

10. All existing tests pass. New tests cover the layout module, the widget renderer, the mapper translation, route resolution, and static cluster config assertions.

---

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/linear/linear-gauge-style-guide.md`
5. `documentation/linear/linear-shared-api.md`
6. `documentation/guides/add-new-linear-gauge.md`
7. `documentation/guides/add-new-cluster.md`
8. `documentation/guides/add-new-html-kind.md` (Step 8 shared-editable audit applies to all new kinds)
9. `documentation/widgets/xte-display.md`
10. `documentation/shared/theme-tokens.md`
11. `documentation/conventions/testing-infrastructure.md`
12. `documentation/guides/layout-file-conventions.md`

---

## Product Decisions Resolved During Scoping

| Decision | Resolution | Rationale |
|---|---|---|
| Axis mode | `range` with symmetric `[-xteScale, +xteScale]` | Reuses engine-proven range profile; zero engine changes; mapper derives bounds |
| Data scope | All four metrics (COG, XTE, DST, BRG) + optional waypoint name | Matches highway feature set; `hideTextualMetrics` toggle for gauge-only mode |
| Architecture | Custom canvas widget using `LinearCanvasPrimitives` + `TextTileLayout` | Engine owns full canvas — cannot render gauge into sub-rect with external tiles |
| Layout modes | Mirror highway widget structure (flat/normal/high) | Consistent UX; bar replaces highway rect, metric tile placement unchanged |
| Sectors | No sector bands; alarm-colored pointer clamping at overflow | Matches highway overflow behavior; keeps gauge bar visually clean |
| Spring easing | Pointer animates, editable toggle | Matches highway's easing behavior |
| Tick labels | Numeric distance labels at min and max only; 3 major ticks (min, center, max); 3 minor ticks per interval | Clean XTE-optimized scale; L/R is on the metric tile text |
| Pointer direction | Custom upward-pointing triangle below the track | XTE-specific: pointer rises toward the scale from below, unlike standard linear widgets |
| Unit-aware scale | Own per-token scale editables (same defaults as highway) | Independent config per kind; no coupling between highway and linear scale |
| Cluster | Nav cluster — same store keys as `xteDisplay` | XTE is a nav concept; data lives in nav store keys |
| Widget registry | `registry-widgets-vessel.js` | Same registry as `XteDisplayWidget` |
| Layout file | Add to `left_small` slot on navpage (currently empty) | Small slot showcases the flat/small optimization |

---

## Verified Baseline (Repository-Verified Facts)

### Nav cluster configuration

1. Nav cluster config: `config/clusters/nav.js`. Cluster name: `dyni_Nav_Instruments`. Cluster ID: `nav`.
2. Nav cluster kind SELECT currently lists 11 kinds: `wpEta`, `rteEta`, `dst`, `rteDistance`, `vmg`, `activeRoute`, `editRoute`, `routePoints`, `positionBoat`, `positionWp`, `xteDisplay`.
3. `xteDisplay` kind editables: `leadingZero` (BOOLEAN, default `true`), `xteRatioThresholdNormal` (FLOAT, default `0.85`), `xteRatioThresholdFlat` (FLOAT, default `2.3`), `showWpNameXteDisplay` (BOOLEAN, default `false`), `easing` (BOOLEAN, default `true`), `xteHideTextualMetrics` (BOOLEAN, default `false`), `xteDisplayScale_{token}` (5 per-unit FLOAT fields).
4. Shared `stableDigits` editable condition array includes `xteDisplay` plus 8 other kinds.
5. Shared `captionUnitScale` editable condition is `NAV_TEXT_KIND_CONDITION` — an array of 7 text kinds (`wpEta`, `rteEta`, `dst`, `rteDistance`, `vmg`, `positionBoat`, `positionWp`). It does not include `xteDisplay` and must not include `xteDisplayLinear`.
6. `caption`/`unit` suppression: `caption: false, unit: false, formatter: false, formatterParameters: false` followed by `...makePerKindCaptionParams(NAV_UNIT_AWARE_KIND)` and `...makePerKindTextParams(NAV_TEXT_KIND)`.
7. Nav store keys: `xte: "nav.wp.xte"`, `cog: "nav.gps.course"`, `dtw: "nav.wp.distance"`, `btw: "nav.wp.course"`, `wpName: "nav.wp.name"`, `wpServer: "nav.wp.server"`. All already present — no new store keys needed.

### Nav mapper

8. `NavMapper` (`cluster/mappers/NavMapper.js`) handles `xteDisplay` kind: emits `display`, `captions`, `units`, `formatUnits`, `xteScale`, `layout`, `stableDigits`.
9. The mapper uses `toolkit.formatUnit(metricKey, family)` to resolve format tokens and `toolkit.unitText(metricKey, family, token)` for display labels. `toolkit.unitNumber(scaleBaseKey, token)` resolves per-token scale numbers.
10. `toolkit.num()` normalizes string editables to finite numbers.

### Nav routes

11. Nav cluster routes: `config/cluster-routes/nav.js`. The `xteDisplay` route entry: `cluster: "nav"`, `kind: "xteDisplay"`, `mapperId: "NavMapper"`, `rendererId: "XteDisplayWidget"`, `surface: "canvas-dom"`, `shellSizing: { kind: "ratio", aspectRatio: 2 }`.

### XteDisplayWidget (highway reference)

12. `XteDisplayWidget` (`widgets/text/XteDisplayWidget/XteDisplayWidget.js`, 335 lines) is registered in `config/components/registry-widgets-vessel.js` with deps: `GaugeToolkit`, `CanvasLayerCache`, `XteHighwayPrimitives`, `XteHighwayLayout`, `TextTileLayout`, `SpringEasing`, `PlaceholderNormalize`, `StableDigits`, `UnitAwareFormatter`, `StateScreenLabels`, `StateScreenPrecedence`, `StateScreenCanvasOverlay`.
13. `XteHighwayLayout` (`shared/widget-kits/xte/XteHighwayLayout.js`, 294 lines) registered in `registry-shared-foundation-layout.js` with deps: `ResponsiveScaleProfile`, `LayoutRectMath`, `LayoutSizingHelpers`, `ValueMath`.
14. The highway layout computes mode via `ratio = W / H` with configurable thresholds. It produces `highway`, `nameRect`, and `metricRects` (cog, xte, dtw, btw) plus `responsive` state.
15. The highway layout uses `LayoutSizingHelpers` factories for `createContentRect` and `computeMetricTileSpacing`.

### Linear gauge system

16. `LinearCanvasPrimitives` (`shared/widget-kits/linear/LinearCanvasPrimitives.js`) provides: `drawTrack(ctx, x0, x1, y, opts)`, `drawBand(ctx, x0, x1, y, thickness, opts)`, `drawTick(ctx, x, y, len, opts)`, `drawPointer(ctx, x, y, opts)`. Registered in `registry-shared-foundation-geometry.js`.
17. `LinearGaugeMath` (`shared/widget-kits/linear/LinearGaugeMath.js`) provides: `mapValueToX(value, minV, maxV, x0, x1, doClamp)`, `buildTicks(minV, maxV, majorStep, minorStep)`, `formatTickLabel(value)`. Registered in `registry-shared-foundation-geometry.js`.
18. `LinearGaugeEngineDrawing` provides `drawStaticLayer()`, `drawPointerAtValue()`, `drawMarkerAtValue()` — these are engine-coupled and not designed for external use.
19. `GeometryScale` (`shared/widget-kits/layout/GeometryScale.js`) provides `scale(primaryDim, factor, floor)`, `scaleStroke(primaryDim, factor, strokeWeight, floor)`, `scalePointer(primaryDim, factor, weight, floor)`. Registered in `registry-shared-foundation-geometry.js`.
20. Linear theme tokens: `tokens.linear.track.widthFactor`, `tokens.linear.track.lineWidthFactor`, `tokens.linear.ticks.majorLenFactor`, `majorWidthFactor`, `minorLenFactor`, `minorWidthFactor`, `tokens.linear.pointer.sideFactor`, `depthFactor`, `tokens.linear.labels.insetFactor`, `fontFactor`.

### Unit format families

21. `shared/unit-format-families.js` has `xteDisplayXte: freezeBinding("distance", "nm", "xte")` and `xteDisplayDst: freezeBinding("distance", "nm", "dtw")`. New bindings needed: `xteDisplayLinearXte` and `xteDisplayLinearDst`.

### Kind defaults

22. `config/shared/kind-defaults.js` `NAV_TEXT_KIND` has: `xteDisplayCog` (cap: "COG", unit: "°", kind: "xteDisplay"), `xteDisplayBrg` (cap: "BRG", unit: "°", kind: "xteDisplay"). New entries needed for the `xteDisplayLinear` kind.
23. `NAV_UNIT_AWARE_KIND` has: `xteDisplayXte` (cap: "XTE", kind: "xteDisplay"), `xteDisplayDst` (cap: "DST", kind: "xteDisplay"). New entries needed for the `xteDisplayLinear` kind.

### Layout files

24. `layouts/dyni-sailboat.json` pages: `navpage`, `gpspage1`, `gpspage2`, `gpspage3`, `gpspage4`, `editroutepage`. Next sequential page would be `gpspage5`.
25. Navpage `left_small` slot is currently empty (`[]`). This is the target slot for the new widget.
26. Navpage already has `xteDisplay` on the `left` slot.

### Test files

27. `tests/cluster/mappers/NavMapper.test.js` covers `xteDisplay` kind mapper output.
28. `tests/config/clusters/nav.test.js` validates nav cluster definition and kind enumeration.
29. `tests/config/clusters/static-clusters.test.js` validates cross-cluster editable assertions including `xteHideTextualMetrics`, `xteDisplayScale_*` fields.
30. `tests/widgets/text/XteDisplayWidget.test.js` tests the highway widget renderer with a full harness.
31. `tests/shared/xte/XteHighwayLayout.test.js` tests the highway layout module.
32. `tests/layouts/gpspage-all-widgets.json` and `tests/layouts/gpspage-all-widgets.test.js` validate layout structure.
33. `tests/layouts/bundled-layouts.test.js` validates bundled layout files.

### Negative facts

34. No `xteDisplayLinear` kind exists anywhere in the repository.
35. No `XteDisplayLinearWidget` component exists.
36. No `XteLinearLayout` module exists.
37. No `xteDisplayLinearXte` or `xteDisplayLinearDst` metric bindings exist in `unit-format-families.js`.
38. No `xteDisplayLinearCog`, `xteDisplayLinearBrg`, `xteDisplayLinearXte`, or `xteDisplayLinearDst` kind-default entries exist.

---

## Hard Constraints

1. **No changes to `LinearGaugeEngine`, `LinearGaugeEngineDrawing`, `LinearGaugeLayout`, or `LinearGaugeTextLayout`.** The new widget uses `LinearCanvasPrimitives`, `LinearGaugeMath`, and `GeometryScale` directly.
2. **No changes to `XteDisplayWidget`, `XteHighwayLayout`, or `XteHighwayPrimitives`.** The highway widget is untouched.
3. **No new theme token definitions.** The linear gauge visual uses existing `tokens.linear.*`, `tokens.colors.*`, and `tokens.surface.*` tokens.
4. **No new axis mode in `LinearGaugeMath`.** The `range` axis mode with mapper-derived symmetric bounds is sufficient.
5. **No new shared utilities.** All shared helpers (`ValueMath`, `LayoutRectMath`, `LayoutSizingHelpers`, `ResponsiveScaleProfile`, etc.) are consumed as-is.
6. **Layout page naming must use sequential `gpspage{N}` keys.** No domain-specific page IDs.
7. **File size ≤400 lines per file.** Split into shared modules if a file approaches the limit.
8. **Responsive ownership stays with layout module and `ResponsiveScaleProfile`.** No user-visible responsive `Math.max()` / `clamp()` floors in the widget renderer.

---

## Implementation Order

### Phase 1: Kind Defaults and Unit Format Bindings

**Intent:** Register the new kind's caption/unit defaults and unit format family bindings so that editable parameter generators and mapper toolkit methods resolve correctly.

**Dependencies:** None.

**Deliverables:**

1. `config/shared/kind-defaults.js` — Add 4 new kind-default entries:

   In `NAV_TEXT_KIND`:
   ```javascript
   xteDisplayLinearCog: {
     cap: "COG",
     unit: "\u00b0",
     kind: "xteDisplayLinear",
     captionName: "Track caption",
     unitName: "Track unit"
   },
   xteDisplayLinearBrg: {
     cap: "BRG",
     unit: "\u00b0",
     kind: "xteDisplayLinear",
     captionName: "BRG caption",
     unitName: "BRG unit"
   }
   ```

   In `NAV_UNIT_AWARE_KIND`:
   ```javascript
   xteDisplayLinearXte: {
     cap: "XTE",
     kind: "xteDisplayLinear",
     captionName: "XTE caption",
     unitName: "XTE unit"
   },
   xteDisplayLinearDst: {
     cap: "DST",
     kind: "xteDisplayLinear",
     captionName: "DST caption",
     unitName: "DST unit"
   }
   ```

2. `shared/unit-format-families.js` — Add 2 metric bindings in `metricBindings`:
   ```javascript
   xteDisplayLinearXte: freezeBinding("distance", "nm", "xte"),
   xteDisplayLinearDst: freezeBinding("distance", "nm", "dtw"),
   ```

**Exit condition:** The editable parameter utils can generate caption/unit/formatUnit editables for the new kind. No runtime tests yet.

### Phase 2: Nav Cluster Config (Editables)

**Intent:** Add `xteDisplayLinear` as a selectable kind with all required editables, audit shared editables for the new kind.

**Dependencies:** Phase 1 (kind defaults and metric bindings must exist).

**Deliverables:**

1. `config/clusters/nav.js` — Modify the kind SELECT list to add:
   ```javascript
   opt("XTE linear gauge", "xteDisplayLinear")
   ```

2. `config/clusters/nav.js` — Add kind-specific editables conditioned on `{ kind: "xteDisplayLinear" }`:

   | Editable key | Type | Default | Name | Notes |
   |---|---|---|---|---|
   | `xteLinearLeadingZero` | BOOLEAN | `true` | Leading zero for headings | COG/BRG formatting |
   | `xteLinearRatioThresholdNormal` | FLOAT | `0.85` | XTE Linear 3-Rows Threshold | `internal: true`, `min: 0.5`, `max: 2.0`, `step: 0.05` |
   | `xteLinearRatioThresholdFlat` | FLOAT | `2.3` | XTE Linear 1-Row Threshold | `internal: true`, `min: 1.0`, `max: 6.0`, `step: 0.05` |
   | `xteLinearShowWpName` | BOOLEAN | `false` | Show waypoint name | — |
   | `xteLinearEasing` | BOOLEAN | `true` | Smooth motion | — |
   | `xteLinearHideTextualMetrics` | BOOLEAN | `false` | Hide textual metrics | — |
   | `xteLinearTickMajor` | FLOAT | `1.0` | Major tick step | `internal: true`, `min: 0.1`, `max: 20`, `step: 0.1` |
   | `xteLinearTickMinor` | FLOAT | `0.25` | Minor tick step | `internal: true`, `min: 0.05`, `max: 10`, `step: 0.05` |
   | `xteLinearShowEndLabels` | BOOLEAN | `true` | Show min/max labels | — |

3. `config/clusters/nav.js` — Add per-token scale editables using the same pattern as `makeXteDisplayScaleParams()`:

   Define `XTE_LINEAR_SCALE_FIELDS` with same token→default/min/max/step as `XTE_DISPLAY_SCALE_FIELDS`. Create `makeXteLinearScaleParams()` that produces `xteLinearScale_{token}` fields conditioned on `{ kind: "xteDisplayLinear", formatUnit_xteDisplayLinearXte: token }`.

   Spread `...makeXteLinearScaleParams()` into `editableParameters`.

4. **Shared editable audit** (Step 8 of `add-new-html-kind.md`):

   - `stableDigits`: Add `{ kind: "xteDisplayLinear" }` to the condition array.
   - `captionUnitScale`: Condition is already `NAV_TEXT_KIND_CONDITION` which does not include `xteDisplay` or `xteDisplayLinear`. No change needed.
   - `coordinatesTabular`: Condition does not include `xteDisplay` or `xteDisplayLinear`. No change needed.
   - `hideSeconds`: Not relevant to XTE kinds. No change needed.
   - `ratioThresholdNormal`/`ratioThresholdFlat` (shared): Condition is `NAV_TEXT_KIND_CONDITION`. The new kind uses its own `xteLinearRatioThreshold*` editables. No change needed.
   - `caption_xteDisplayLinear*` and `unit_xteDisplayLinear*`: Auto-generated by `...makePerKindCaptionParams(NAV_UNIT_AWARE_KIND)` and `...makePerKindTextParams(NAV_TEXT_KIND)` from the Phase 1 kind-default entries. No explicit overrides needed.

5. `config/clusters/nav.js` — Update the `updateFunction` to include `xteDisplayLinear` in the `needsWp` check:
   ```javascript
   const needsWp = (kind === "dst" || kind === "positionWp" || kind === "xteDisplay" || kind === "xteDisplayLinear");
   ```

6. `config/clusters/nav.js` — Update the cluster `description` string to include the new kind:
   ```javascript
   description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Active route / Edit route / Route points / Positions / XTE display / XTE linear gauge)"
   ```

**Exit condition:** `node -e "require('./config/clusters/nav.js')"` equivalent eval succeeds with the new kind and editables. Shared editables scoped correctly.

### Phase 3: Route Metadata

**Intent:** Add route entry so `xteDisplayLinear` resolves to the new renderer on canvas-dom surface.

**Dependencies:** Phase 2 (kind must be registered).

**Deliverable:**

1. `config/cluster-routes/nav.js` — Add route entry:
   ```javascript
   {
     cluster: "nav",
     kind: "xteDisplayLinear",
     mapperId: "NavMapper",
     rendererId: "XteDisplayLinearWidget",
     surface: "canvas-dom",
     shellSizing: { kind: "ratio", aspectRatio: 2 }
   }
   ```

**Exit condition:** Route metadata is parseable. No runtime test yet (renderer does not exist).

### Phase 4: Mapper Wiring

**Intent:** Add `xteDisplayLinear` kind branch to `NavMapper` that produces the renderer props payload.

**Dependencies:** Phase 1 (metric bindings), Phase 2 (editables).

**Deliverable:**

1. `cluster/mappers/NavMapper.js` — Add `if (req === "xteDisplayLinear") { ... }` branch. Output shape:

   ```javascript
   {
     display: {
       xte: num(p.xte),
       cog: num(p.cog),
       dtw: num(p.dtw),
       btw: num(p.btw),
       wpName: typeof p.wpName === "string" ? p.wpName : "",
       disconnect: p.disconnect === true
     },
     captions: {
       xte: cap("xteDisplayLinearXte"),
       track: cap("xteDisplayLinearCog"),
       dtw: cap("xteDisplayLinearDst"),
       brg: cap("xteDisplayLinearBrg")
     },
     units: {
       xte: toolkit.unitText("xteDisplayLinearXte", "distance", xteToken),
       track: unit("xteDisplayLinearCog"),
       dtw: toolkit.unitText("xteDisplayLinearDst", "distance", dtwToken),
       brg: unit("xteDisplayLinearBrg")
     },
     formatUnits: {
       xte: xteToken,
       dtw: dtwToken
     },
     xteScale: toolkit.unitNumber("xteLinearScale", xteToken),
     layout: {
       leadingZero: p.xteLinearLeadingZero !== false,
       showWpName: p.xteLinearShowWpName === true,
       hideTextualMetrics: !!p.xteLinearHideTextualMetrics,
       easing: p.xteLinearEasing !== false,
       ratioThresholdNormal: num(p.xteLinearRatioThresholdNormal),
       ratioThresholdFlat: num(p.xteLinearRatioThresholdFlat),
       tickMajor: num(p.xteLinearTickMajor),
       tickMinor: num(p.xteLinearTickMinor),
       showEndLabels: !!p.xteLinearShowEndLabels
     },
     stableDigits: p.stableDigits === true
   }
   ```

   Where `xteToken = toolkit.formatUnit("xteDisplayLinearXte", "distance")` and `dtwToken = toolkit.formatUnit("xteDisplayLinearDst", "distance")`.

**Exit condition:** Mapper returns expected payload shape when called with `kind: "xteDisplayLinear"`. No runtime rendering yet.

### Phase 5: Shared Layout Module — `XteLinearLayout.js`

**Intent:** Create the responsive layout module that computes the gauge bar rect, metric tile rects, optional waypoint name rect, and responsive state. Mirrors `XteHighwayLayout` structure with the highway rect replaced by a gauge bar rect.

**Dependencies:** None (uses existing shared modules).

**Deliverable:**

1. `shared/widget-kits/xte/XteLinearLayout.js` (~250 lines)

   UMD module. `Depends: ResponsiveScaleProfile, LayoutRectMath, LayoutSizingHelpers, ValueMath`.

   Public API:
   - `computeMode(W, H, normalThreshold, flatThreshold)` → `"high" | "normal" | "flat"`
   - `computeInsets(W, H)` → `{ padX, padY, gap, responsive }`
   - `createContentRect(W, H, insets)` → `{ x, y, w, h }`
   - `computeLayout({ contentRect, gap, mode, responsive, hideTextualMetrics, showWpName, hasWaypointName })` → `{ gaugeBar, nameRect, metricRects: { cog, xte, dtw, btw }, responsive }`
   - `computeMetricTileSpacing(rect, responsive)` → `{ padX, captionHeightPx }`

   Layout mode geometry (mirroring highway proportions from `XteHighwayLayout`):

   **flat:**
   - `gaugeBar`: left ~58% of content width, full content height
   - Right panel: optional name header (~22% of panel height) + 2×2 metric grid
   - Grid order: row 1 = COG, BRG; row 2 = XTE, DST
   - When `hideTextualMetrics`: gauge bar uses full content width, vertically centered
   - When `showWpName` disabled: header band removed, metric rows grow

   **normal:**
   - `gaugeBar`: top ~64% of content height, full content width
   - Bottom band: ~36% height, 4 equal metric columns
   - Column order: COG | XTE | DST | BRG
   - Waypoint name in gauge bar zone (small band near top edge) if space allows
   - When `hideTextualMetrics`: gauge bar uses full content area

   **high:**
   - Top strip: ~14% height, 2 equal columns (COG, BRG)
   - `gaugeBar`: middle ~68% height, full content width
   - Bottom strip: ~18% height, 2 equal columns (XTE, DST)
   - Waypoint name optional, hides first in constrained sizes
   - When `hideTextualMetrics`: gauge bar uses full content area minus minimal name zone

   Responsive scaling follows `ResponsiveScaleProfile` via `LayoutSizingHelpers` factories, same pattern as `XteHighwayLayout`. Constants are module-owned; no hardcoded pixel floors.

**Exit condition:** Module loads, exports expected API. Unit tests pass (Phase 9).

### Phase 6: Widget Renderer — `XteDisplayLinearWidget.js`

**Intent:** Create the canvas-dom renderer that combines `XteLinearLayout`, `LinearCanvasPrimitives`, `LinearGaugeMath`, `TextTileLayout`, and supporting modules into the full XTE linear gauge rendering pipeline.

**Dependencies:** Phase 5 (layout module).

**Deliverable:**

1. `widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js` (~350 lines)

   UMD module. Component deps:
   - `GaugeToolkit` — theme resolution, value helpers, text API
   - `CanvasLayerCache` — static gauge layer caching
   - `LinearCanvasPrimitives` — track/ticks/pointer/band drawing
   - `LinearGaugeMath` — value-to-X mapping, tick generation, tick label formatting
   - `GeometryScale` — stroke/pointer geometry from primary dimension
   - `XteLinearLayout` — responsive layout rects
   - `TextTileLayout` — metric tile rendering
   - `SpringEasing` — pointer animation
   - `PlaceholderNormalize` — missing-value placeholder text
   - `StableDigits` — stable-width digit normalization
   - `UnitAwareFormatter` — distance/heading formatting
   - `StateScreenLabels` — state kind vocabulary
   - `StateScreenPrecedence` — state-screen selection
   - `StateScreenCanvasOverlay` — state-screen canvas rendering

   Public API (standard canvas-dom widget):
   ```javascript
   {
     id: "XteDisplayLinearWidget",
     wantsHideNativeHead: true,
     renderCanvas: renderCanvas,
     translateFunction: translateFunction,
     finalizeFunction: finalizeFunction
   }
   ```

   Rendering flow:
   1. `setupCanvas`, clear, resolve theme tokens via `GaugeToolkit.theme.resolveForRoot(rootEl)`
   2. Resolve state kind (`disconnected` / `noTarget` / `data`). If not `data`, render `StateScreenCanvasOverlay` and return.
   3. Compute mode, insets, content rect, layout from `XteLinearLayout`
   4. Compute gauge bar geometry:
      - `primaryDim = max(1, min(gaugeBar.w, gaugeBar.h))`
      - Use `GeometryScale` for track thickness, tick lengths, pointer size from `tokens.linear.*` factors plus `tokens.strokeWeight`/`tokens.pointerDepthWeight`/`tokens.pointerSideWeight`
      - Compute track Y centered in gauge bar rect
      - Scale X0/X1 from gauge bar rect horizontal bounds (with insets from `tokens.linear.track.widthFactor`)
   5. Build ticks via `LinearGaugeMath.buildTicks(-xteScale, +xteScale, tickMajor, tickMinor)`
   6. Build static cache key (mode, geometry, colors, strokeWeight, xteScale, tickMajor, tickMinor, showEndLabels)
   7. `CanvasLayerCache.ensureLayer("back")`: draw track and ticks via `LinearCanvasPrimitives`, draw tick labels via manual canvas text using `LinearGaugeMath.formatTickLabel()` and `toolkit.text.setFont()`
   8. Blit static layer
   9. Compute XTE pointer position via `LinearGaugeMath.mapValueToX()` with clamping, spring-eased
   10. Draw pointer as an **upward-pointing triangle below the track** — unlike standard linear widgets where `drawPointer` points downward from above, the XTE linear gauge renders a custom upward triangle via direct canvas path:
       ```
       tipY = trackY + floor(trackThickness / 2) + 1
       ctx.moveTo(x, tipY)                    // tip (touching track from below)
       ctx.lineTo(x - side, tipY + depth)     // left base (below tip)
       ctx.lineTo(x + side, tipY + depth)     // right base (below tip)
       ```
       Use `tokens.colors.alarm` when clamped (overflow), `tokens.colors.pointer` otherwise. Pointer depth and side sizing use `GeometryScale.scalePointer()` with `tokens.linear.pointer.depthFactor` / `sideFactor` and `tokens.pointerDepthWeight` / `tokens.pointerSideWeight`, same as shipped linear gauges.
   11. If `hideTextualMetrics`, return (with `wantsFollowUpFrame` if spring active)
   12. Format metric values using `UnitAwareFormatter` (XTE distance, DTW distance, COG/BRG headings)
   13. Apply `StableDigits` to XTE metric with side suffix (L/R) and two-pass padded/plain selection (same as highway widget)
   14. Render metric tiles via `TextTileLayout.drawMetricTile()`
   15. Render optional waypoint name via `TextTileLayout.drawFittedLine()` if space allows
   16. Return `{ wantsFollowUpFrame: true }` if spring easing is active

   Tick label rendering:
   - Tick labels are drawn **only at the min and max positions** (first and last major ticks), not at intermediate major ticks — this keeps the gauge bar visually clean for XTE
   - Labels drawn at `tokens.linear.labels.insetFactor` below the pointer zone (below track + pointer depth)
   - Font size from `tokens.linear.labels.fontFactor` * `primaryDim`
   - Labels use `LinearGaugeMath.formatTickLabel()` for numeric formatting
   - `showEndLabels` controls whether even the min/max labels appear (when `false`, no labels at all)

**Exit condition:** Widget renders gauge bar + metric tiles in all three modes. Overflow alarm pointer works. State screens render. Spring easing animates.

### Phase 7: Component Registration

**Intent:** Register the new layout module and widget renderer in component registries.

**Dependencies:** Phase 5 (layout module exists), Phase 6 (widget exists).

**Deliverables:**

1. `config/components/registry-shared-foundation-layout.js` — Add:
   ```javascript
   sf.XteLinearLayout = {
     js: BASE + "shared/widget-kits/xte/XteLinearLayout.js",
     css: undefined,
     globalKey: "DyniXteLinearLayout",
     deps: ["ResponsiveScaleProfile", "LayoutRectMath", "LayoutSizingHelpers", "ValueMath"]
   };
   ```

2. `config/components/registry-widgets-vessel.js` — Add:
   ```javascript
   w.XteDisplayLinearWidget = {
     js: BASE + "widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js",
     css: undefined,
     globalKey: "DyniXteDisplayLinearWidget",
     deps: [
       "GaugeToolkit",
       "CanvasLayerCache",
       "LinearCanvasPrimitives",
       "LinearGaugeMath",
       "GeometryScale",
       "XteLinearLayout",
       "TextTileLayout",
       "SpringEasing",
       "PlaceholderNormalize",
       "StableDigits",
       "UnitAwareFormatter",
       "StateScreenLabels",
       "StateScreenPrecedence",
       "StateScreenCanvasOverlay"
     ]
   };
   ```

**Exit condition:** Component loader can resolve the full dependency chain.

### Phase 8: Documentation

**Intent:** Document the new widget and update navigation indexes.

**Dependencies:** Phases 1–7 (implementation complete).

**Deliverables:**

1. `documentation/widgets/xte-display-linear.md` (~150 lines)

   Document following the existing `xte-display.md` structure:
   - Overview: linear gauge XTE with integrated text metrics
   - Module registration (deps, globalKey)
   - Props table (display, captions, units, formatUnits, xteScale, layout, stableDigits)
   - State-screen contract (disconnected, noTarget, data)
   - Theme token usage (tokens.linear.*, tokens.colors.*, tokens.surface.*)
   - Layout modes (high/normal/flat) with proportions
   - Gauge geometry (track, ticks, pointer, overflow)
   - Caching (static layer key fields)
   - hideTextualMetrics behavior
   - Related links

2. `documentation/TABLEOFCONTENTS.md` — Add to "Module Reference (Renderers)":
   ```
   - **XTE linear gauge renderer (bar gauge, text metrics)** → [widgets/xte-display-linear.md](widgets/xte-display-linear.md)
   ```

3. `ROADMAP.md` — Mark "add XteDisplayLinear optimized for small and flat widgets based on the linear gauge widgets" as addressed by PLAN29.

**Exit condition:** Docs pass format checks and are linked from table of contents.

### Phase 9: Tests

**Intent:** Full test coverage for all new modules and modified integration points.

**New test files:**

1. `tests/shared/xte/XteLinearLayout.test.js` (~200 lines)

   Test matrix:
   - `computeMode` returns correct mode for ratios below/within/above thresholds
   - `computeInsets` returns finite positive values for various W/H
   - `computeLayout` flat mode: gauge bar left, metric grid right, correct rect positions
   - `computeLayout` normal mode: gauge bar top, metric row bottom, column order COG|XTE|DST|BRG
   - `computeLayout` high mode: top strip with COG/BRG, gauge bar middle, bottom strip with XTE/DST
   - `computeLayout` with `hideTextualMetrics: true`: gauge bar fills content area, metric rects are null/absent
   - `computeLayout` with `showWpName: true/false`: name rect presence/absence
   - `computeMetricTileSpacing` returns finite padX and captionHeightPx
   - Responsive scaling: smaller widgets produce non-zero responsive.textFillScale

2. `tests/widgets/text/XteDisplayLinearWidget.test.js` (~300 lines)

   Test matrix (following `XteDisplayWidget.test.js` harness pattern):
   - Widget creates with expected id and `wantsHideNativeHead: true`
   - `renderCanvas` with disconnected state renders state screen, no gauge
   - `renderCanvas` with noTarget (empty wpName) renders state screen
   - `renderCanvas` in data state draws static layer (track, ticks)
   - `renderCanvas` draws upward-pointing pointer below track at correct XTE position
   - Pointer clamps at edge when XTE exceeds scale
   - Pointer uses alarm color when clamped (overflow)
   - Pointer uses pointer color when within scale
   - Spring easing: returns `wantsFollowUpFrame` when animating
   - `hideTextualMetrics` suppresses metric tile drawing
   - Metric tiles render with correct captions/values/units
   - XTE metric shows L/R side suffix
   - StableDigits two-pass (padded then plain fallback) for XTE metric
   - Mode selection: flat/normal/high based on canvas dimensions
   - Tick labels appear only at min and max; `showEndLabels: false` hides all labels
   - Waypoint name renders when enabled and space allows
   - `finalizeFunction` invalidates static layer cache

**Modified test files:**

3. `tests/cluster/mappers/NavMapper.test.js` — Add `xteDisplayLinear` kind test case:
   - Verifies mapper output shape matches Phase 4 contract
   - Verifies `xteScale` resolves from `xteLinearScale_{token}`
   - Verifies `disconnect` propagation from `wpServer`

4. `tests/config/clusters/nav.test.js` — Add `xteDisplayLinear` to enumerated kind list assertion.

5. `tests/config/clusters/static-clusters.test.js` — Add assertions:
   - `xteDisplayLinear` appears in nav cluster kind list
   - `xteLinearHideTextualMetrics` editable exists with correct default and condition
   - `xteLinearScale_nm` (and other tokens) editable exists with correct condition
   - `stableDigits` condition array includes `{ kind: "xteDisplayLinear" }`

6. `tests/layouts/gpspage-all-widgets.json` — Add fixture entry for `xteDisplayLinear`
7. `tests/layouts/gpspage-all-widgets.test.js` — Add assertion for the new widget entry

**Exit condition:** `npm test` passes. All new test files pass.

### Phase 10: Layout File

**Intent:** Add the xteDisplayLinear widget to the bundled sailboat layout in a small slot.

**Dependencies:** Phase 7 (component registration).

**Deliverable:**

1. `layouts/dyni-sailboat.json` — Add to the `left_small` slot on `navpage`:
   ```json
   {
     "name": "dyni_Nav_Instruments",
     "kind": "xteDisplayLinear",
     "formatUnit_xteDisplayLinearXte": "nm",
     "unit_xteDisplayLinearXte_nm": "nm",
     "unit_xteDisplayLinearCog": "\u00b0",
     "formatUnit_xteDisplayLinearDst": "nm",
     "unit_xteDisplayLinearDst_nm": "nm",
     "unit_xteDisplayLinearBrg": "\u00b0",
     "xteLinearLeadingZero": true
   }
   ```

**Exit condition:** Layout file is valid JSON. Layout tests pass after Phase 9 test file updates.

---

## File Inventory

### New files (5)

| File | Lines (est.) | Purpose |
|---|---|---|
| `shared/widget-kits/xte/XteLinearLayout.js` | ~250 | Responsive layout rects for gauge bar + metric tiles |
| `widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js` | ~350 | Canvas-dom renderer combining gauge bar + metric tiles |
| `documentation/widgets/xte-display-linear.md` | ~150 | Widget documentation |
| `tests/shared/xte/XteLinearLayout.test.js` | ~200 | Layout module tests |
| `tests/widgets/text/XteDisplayLinearWidget.test.js` | ~300 | Widget renderer tests |

### Modified files (15)

| File | Change scope |
|---|---|
| `config/shared/kind-defaults.js` | Add 4 kind-default entries (~20 lines) |
| `shared/unit-format-families.js` | Add 2 metric bindings (~2 lines) |
| `config/clusters/nav.js` | Add kind option + ~12 editables + scale params + updateFunction + stableDigits condition (~80 lines) |
| `config/cluster-routes/nav.js` | Add 1 route entry (~8 lines) |
| `cluster/mappers/NavMapper.js` | Add 1 kind branch (~40 lines) |
| `config/components/registry-shared-foundation-layout.js` | Add 1 layout component entry (~6 lines) |
| `config/components/registry-widgets-vessel.js` | Add 1 widget component entry (~20 lines) |
| `documentation/TABLEOFCONTENTS.md` | Add 1 line |
| `ROADMAP.md` | Mark 1 item (~1 line) |
| `layouts/dyni-sailboat.json` | Add widget entry to navpage left_small (~4 lines) |
| `tests/cluster/mappers/NavMapper.test.js` | Add xteDisplayLinear test cases (~40 lines) |
| `tests/config/clusters/nav.test.js` | Add xteDisplayLinear to kind list (~1 line) |
| `tests/config/clusters/static-clusters.test.js` | Add xteDisplayLinear editable assertions (~20 lines) |
| `tests/layouts/gpspage-all-widgets.json` | Add fixture entry (~4 lines) |
| `tests/layouts/gpspage-all-widgets.test.js` | Add assertion (~5 lines) |

---

## Verification

### Required completion gate

```bash
npm run check:all
```

This runs `check:core` + `test:coverage:check` + `perf:check`.

### Manual verification checklist

- [ ] Completed mandatory preflight reads
- [ ] Kind appears in nav cluster widget editor dropdown as "XTE linear gauge"
- [ ] Editables show/hide correctly by condition (`xteDisplayLinear` only)
- [ ] Shared `stableDigits` condition includes `xteDisplayLinear`
- [ ] Shared `captionUnitScale` condition does NOT include `xteDisplayLinear`
- [ ] Route resolves to `surface: "canvas-dom"` with `rendererId: "XteDisplayLinearWidget"`
- [ ] Mapper emits correct renderer props (display, captions, units, formatUnits, xteScale, layout)
- [ ] Disconnect propagates from `wpServer === false`
- [ ] Widget renders in data state with gauge bar and four metric tiles
- [ ] Gauge bar shows track, ticks, and upward-pointing pointer at correct XTE position
- [ ] Pointer renders below the track pointing upward (not above pointing down like standard linear widgets)
- [ ] Pointer uses pointer color within scale and alarm color at overflow
- [ ] Pointer clamps at gauge edge when XTE exceeds scale
- [ ] Spring easing animates pointer movement (when enabled)
- [ ] No easing when toggle is off
- [ ] Tick labels appear only at min and max positions; `showEndLabels: false` hides all labels
- [ ] XTE metric tile shows value with L/R side suffix
- [ ] StableDigits normalization works (padded then plain fallback)
- [ ] COG/BRG headings respect `leadingZero`
- [ ] Unit-aware formatting: changing XTE unit token changes scale, display labels, and tick labels
- [ ] Waypoint name shows when enabled and space allows
- [ ] Waypoint name hides when disabled or no name available
- [ ] `hideTextualMetrics` removes all metric tiles, gauge bar fills widget
- [ ] Widget adapts layout at different aspect ratios (high/normal/flat)
- [ ] Disconnected state shows "GPS Lost" state screen, no gauge
- [ ] No-target state shows "No Waypoint" state screen, no gauge
- [ ] Night mode shows correct colors via theme tokens
- [ ] Day/night/highcontrast preset colors are correct
- [ ] Small widgets scale responsively without clipping
- [ ] Static layer caches correctly (no unnecessary redraws)
- [ ] All existing tests pass
- [ ] New tests cover layout module, widget renderer, mapper, and static config
- [ ] Documentation is complete and linked from TABLEOFCONTENTS.md
- [ ] Layout file is valid and includes xteDisplayLinear on navpage left_small
- [ ] `npm run check:all` passes
