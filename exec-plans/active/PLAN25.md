# PLAN25: Steady-State Render Path Performance for Low-Power Clients

## Status

**Ready for implementation.** All baseline facts, root causes, file references, and
implementation instructions verified against the dyninstruments-main and
avnav-master source trees. FIX-05 (mapper-output memoization) added after
analysis of store-key over-subscription. FIX-02 theme memo key strengthened
with object identity check for theme-preset correctness.

---

## Goal and Scope

Reduce per-frame CPU cost during steady-state value updates across all canvas
gauge widgets. The target environment is low-power clients (e-readers, embedded
ARM boards) where users have already disabled spring easing. On these devices the
dominant cost is the baseline work done on every store-driven data update — not
animation frames, not startup, not cold activation.

**Constraints:**

- Fixes are dyninstruments-internal only. No avnav core changes.
- No new user-facing options, flags, feature switches, or low-power mode toggles.
- No observable change to rendering output for any human viewer, with one
  intentional exception: FIX-01 moves the pointer z-order from behind ticks/labels
  to in front of them, aligning with the existing convention in `LinearGaugeEngine`
  and `FullCircleRadialEngine`.
- Full backward compatibility: no API changes, no layout file changes, no theme
  token changes, no config schema changes.

**Out of scope:** startup optimization, cold activation time, animation frame
budget, HTML-surface text widget rendering, network/loading performance,
memory footprint reduction.

---

## Root-Cause Analysis

### The steady-state hot path

When a sensor value changes (e.g., speed 12.3 → 12.4), avnav's store fires a
React update. For cluster widgets the path is:

1. `ExternalWidget` React render → calls `ClusterWidget.renderHtml()`
2. `HostCommitController` deferred commit → RAF-based DOM discovery
3. Route activation → `CanvasDomSurfaceAdapter.update()` → `shallowEqual` detects changed props
4. `schedulePaint("update")` → RAF → `paintNow()` → `rendererSpec.renderCanvas(canvas, props)`

Step 4 calls the engine's `renderCanvas` function. This is the function under
analysis. It runs once per widget per value change.

### Finding 1: SemicircleRadialEngine redraws the entire gauge every frame

**Affected file:** `shared/widget-kits/radial/SemicircleRadialEngine.js`

Both `LinearGaugeEngine` and `FullCircleRadialEngine` use `CanvasLayerCache` to
cache their static layer (ticks, arc ring, scale labels, alarm/warning sectors)
on an offscreen canvas. On steady-state updates they skip all static drawing and
blit the cached layer in a single `drawImage` call.

`SemicircleRadialEngine` has no layer cache. Every frame it:

- draws alarm/warning sectors (multiple `drawAnnularSector` → `ctx.save/arc/fill/restore` each)
- draws the arc ring (`drawArcRing` → `ctx.save/arc/stroke/restore`)
- draws major and minor ticks (`drawTicksFromAngles` → `beginPath` + N × `moveTo/lineTo` + `stroke`, twice)
- draws numeric scale labels (`drawLabels` → N × `setFont/fillText` with per-label trig)
- draws the pointer (one `drawPointerAtRim` call — the only truly dynamic element)
- draws caption/value/unit text (dynamic, but has its own fit cache)

On a typical speed gauge with 15 minor ticks, 4 major ticks, and 4 labels, this
is approximately 30 canvas API draw calls that produce identical output on every
frame. The pointer and text account for roughly 3 calls.

**Evidence:** `SemicircleRadialEngine.js` has zero references to `CanvasLayerCache`
(confirmed by grep). `LinearGaugeEngine.js` line ~1 (Depends comment) and
`FullCircleRadialEngine.js` line ~1 both declare `CanvasLayerCache` as a
dependency.

**Impact:** Highest. Semicircle gauges are the most common widget type. A typical
GPS dashboard page has 2–4 semicircle gauges running simultaneously. Eliminating
~90% of canvas draw calls per frame per gauge is the single largest win available.

### Finding 2: Layout geometry is recomputed every frame even when dimensions are unchanged

**Affected file:** `shared/widget-kits/radial/SemicircleRadialEngine.js` (the
`renderCanvas` closure, approximately lines 100–130 of the closure body)

Every call to `renderCanvas` executes:

```
layoutApi.computeMode(W, H, thresholdNormal, thresholdFlat)
layoutApi.computeInsets(W, H)
layoutApi.computeLayout({ W, H, theme, mode, insets, responsive })
```

These are pure functions of (W, H, theme tokens, ratio threshold props). During
steady-state updates none of these inputs change — only the sensor value changes.
The layout computation involves `ResponsiveScaleProfile.computeProfile`,
`GeometryScale` scaling, and construction of the full geometry object with ~20
numeric fields plus nested layout mode objects (flat, high, normal).

**Evidence:** `SemicircleRadialLayout.computeLayout` in
`shared/widget-kits/radial/SemicircleRadialLayout.js` accepts a config object
and returns a new layout object every call. No memoization exists.

**Impact:** Medium. The arithmetic itself is modest, but the object allocation
and property computation is redundant work done on every frame for every
semicircle gauge. On low-power ARM CPUs, eliminating this removes measurable
microseconds per widget per frame and reduces GC pressure.

### Finding 3: Text fit cache misses on every value change

**Affected file:** `shared/widget-kits/radial/SemicircleRadialTextLayout.js`

The semicircle text layout has a per-mode fit cache (`createFitCache()`) that
caches text measurement and fitting results. The cache key includes the exact
`valueText` string via `buildCommonFitKey`:

```javascript
function buildCommonFitKey(state, display) {
  return {
    W: state.W,
    H: state.H,
    mode: state.layout.mode,
    caption: display.caption,
    valueText: display.valueText,   // ← changes on every value update
    unit: display.unit,
    secScale: display.secScale,
    family: state.family,
    ...
  };
}
```

When the displayed value changes from "12.3" to "12.4", the key changes, the
cache misses, and the expensive fit search runs. For the `normal` layout mode
this search iterates from `mhMax` down to `mhMin` (typically 20–40 iterations),
calling `computeThreeRowsSizes` on each iteration, which calls `fitTextPx` three
times (caption, value, unit), each of which calls `ctx.measureText`.

In practice, "12.3" and "12.4" produce identical or near-identical fit results —
the font sizes, gaps, and layout geometry don't change for small numeric
variations that have the same rendered width class.

**Evidence:** `SemicircleRadialTextLayout.js` function `buildCommonFitKey` at
approximately line 60. Function `drawNormalText` at approximately line 130
contains the `for (let mh = ...)` iteration loop. The `makeFitCacheKey` function
at line ~40 uses `JSON.stringify` on the key object.

**Impact:** Medium. The `normal` mode fit search is the most expensive per-frame
text operation. On low-power devices, 20–40 × 3 `measureText` calls per gauge
per frame is significant. Most of these calls produce the same result as the
previous frame.

### Finding 4: DOM traversal on every canvas frame for every widget

**Affected file:** `runtime/dom-runtime.js`, function `requirePluginRoot`

Every canvas engine's `renderCanvas` function calls:

```javascript
const rootEl = componentContext.dom.requirePluginRoot(canvas);
```

`requirePluginRoot` performs a composed-tree walk upward from the canvas element,
calling `node.closest(".widget.dyniplugin")` at each step, crossing shadow DOM
boundaries. For a canvas element inside a surface mount, this traverses 3–5 DOM
nodes on every frame.

The result never changes for a mounted widget. The root element is established at
commit time and remains stable until detach/destroy.

**Evidence:** `runtime/dom-runtime.js` function `requirePluginRoot` contains a
`while (node)` loop with `node.closest()` calls. Called from
`SemicircleRadialEngine`, `FullCircleRadialEngine`, `LinearGaugeEngine`,
`XteDisplayWidget`, `CenterDisplayTextWidget`, and all other canvas widgets via
`componentContext.dom.requirePluginRoot(canvas)`.

**Impact:** Low–medium individually, but multiplied across all canvas widgets on
a page. On a page with 6 canvas widgets, this is 6 DOM traversals per data
update, all returning the same elements as last frame.

### Finding 5: Unused store-key values leak into surface adapter props, defeating shallowEqual and causing spurious canvas repaints

**Affected files:** `runtime/cluster/RouteActivationPayloadBuilder.js`,
`runtime/cluster/RouteActivationController.js`

Cluster configs declare store keys for all possible kinds in a cluster. The
speed cluster declares `{ sog: "nav.gps.speed", stw: "nav.gps.waterSpeed" }`;
the wind cluster declares 5 keys; the nav cluster declares 20 keys. avnav's
`useStore` subscribes to every declared key. When any observed key changes, the
full pipeline runs: React re-render → `renderHtml` → host commit → route
activation → surface adapter update.

`RouteActivationPayloadBuilder.buildActivatedPayload` constructs the canvas
engine's props via:

```
const mapperProps = cloneRouteProps(routeFrame);      // all store values
const mappedProps = mapper.translate(mapperProps, …);  // renderer-relevant output
const finalProps = Object.assign({}, mapperProps, mappedProps);
```

`finalProps` contains every raw store value (sog, stw, etc.) alongside the
mapper's output. `CanvasDomSurfaceAdapter.update()` compares old and new
`finalProps` with `shallowEqual`. When an irrelevant key changes (e.g., STW
changes while the widget shows SOG), `finalProps.stw` differs, shallowEqual
fails, and a full `schedulePaint → paintNow → renderCanvas` cycle runs — even
though the engine reads only `p.value` (mapped from SOG) and produces identical
output.

**Evidence:** `RouteActivationPayloadBuilder.js` function
`buildActivatedPayload` line ~`Object.assign({}, mapperProps, mappedProps)`.
`CanvasDomSurfaceAdapter.js` function `update` calls `shallowEqual(props,
payload.props)` on the full merged props object. Store key counts confirmed by
inspection: speed cluster 2 keys, wind 5, course-heading 4, nav 20, map 13.

**Impact:** High. This causes unnecessary full canvas repaints for every canvas
widget whenever any sibling store key in the same cluster changes. On a nav
cluster widget showing COG, up to 19 of 20 store key changes produce spurious
repaints. This affects all canvas widget types (semicircle, full-circle,
linear, text) and undermines the savings from FIX-01 through FIX-04: even with
a layer cache, the blit, pointer draw, text draw, layout memo lookup, theme
resolution, and DOM traversal all run unnecessarily. On a dashboard page with 6
widgets across 3 clusters, a single GPS update that touches 10 store keys can
trigger dozens of redundant repaints.

---

## Decisions Locked for PLAN25

1. **Layer cache pattern:** follows the established `CanvasLayerCache` +
   `buildStaticKey` + `ensureLayer/blit` convention from `LinearGaugeEngine`.
2. **Layout memo strategy:** simple last-result cache keyed on the inputs that
   determine layout (W, H, mode thresholds, theme identity). Not a
   multi-entry cache — only the most recent result is kept.
3. **Text fit width-class design:** replace exact `valueText` in the cache key
   with `measureText` width rounded to the nearest integer pixel. This preserves
   cache validity while hitting on most steady-state numeric changes.
4. **requirePluginRoot cache scope:** WeakMap keyed on the target element. All
   canvas widgets benefit. No explicit invalidation needed — the WeakMap entry
   is garbage-collected when the canvas element is detached.
5. **No layout memo for LinearGaugeEngine or FullCircleRadialEngine.** These
   already have layer caches, making their per-frame layout cost tolerable. The
   risk/reward ratio doesn't justify touching those engines in this plan.
6. **Existing tests must stay green.** No test modifications except adding new
   test files for the new caching behavior.
7. **Mapper-output memoization strategy:** `JSON.stringify` the mapper's
   `translate()` output plus `nightMode` and `editing` flags into a memo key.
   Compare to the previous key for the same route. On match, return
   `DISCARDED_ACTIVATION` to skip the surface update entirely. The signature
   captures all renderer-relevant state: sensor values (in mapper output),
   config/threshold props (in `rendererProps`), disconnect state (in mapper
   output for nav cluster), theme toggle (`nightMode`), and layout-editing
   state (`editing`). Editables like `stableDigits` and `easing` do not change
   during steady-state operation and are excluded from the key.

---

## FIX-01: Static Layer Cache for SemicircleRadialEngine

### Problem

`SemicircleRadialEngine.renderCanvas` redraws all static gauge elements (arc
ring, ticks, labels, alarm/warning sectors) on every frame. These elements only
change when the widget is resized or its configuration (range, tick spacing,
thresholds, theme) changes.

### Files to Modify

| File | Change |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Add `CanvasLayerCache` dependency; restructure `renderCanvas` to separate static and dynamic drawing |

### Precise Changes

#### 1. Add CanvasLayerCache to the dependency list

In the `create` function, add after the existing `require` calls:

```javascript
const layerCacheApi = componentContext.components.require("CanvasLayerCache");
```

Update the module header `Depends:` comment to include `CanvasLayerCache`.

#### 2. Create the layer cache inside `createRenderer`

Inside the `createRenderer` function, after the existing `fitCache` declaration
(approximately where `const fitCache = textLayout.createFitCache();` lives), add:

```javascript
const layerCache = layerCacheApi.createLayerCache({ layers: ["base"] });
```

#### 3. Build a static key before drawing

Inside the `renderCanvas` closure, after the `ticks` and `sectorList` variables
are computed and before the sector drawing loop, build the static key:

```javascript
const staticKey = JSON.stringify({
  W: W,
  H: H,
  bufferW: canvas.width,
  bufferH: canvas.height,
  cx: layout.geom.cx,
  cy: layout.geom.cy,
  rOuter: layout.geom.rOuter,
  ringW: layout.geom.ringW,
  arcLineWidth: layout.geom.arcLineWidth,
  majorTickLen: layout.geom.majorTickLen,
  majorTickWidth: layout.geom.majorTickWidth,
  minorTickLen: layout.geom.minorTickLen,
  minorTickWidth: layout.geom.minorTickWidth,
  pointerDepth: layout.geom.pointerDepth,
  pointerSide: layout.geom.pointerSide,
  labelRadiusOffset: layout.labels.radiusOffset,
  labelFontPx: layout.labels.fontPx,
  labelWeight: labelWeight,
  family: family,
  color: paint.color,
  arcStart: arc.startDeg,
  arcEnd: arc.endDeg,
  tickMajor: tickMajor,
  tickMinor: tickMinor,
  showEndLabels: showEndLabels,
  rangeMin: range.min,
  rangeMax: range.max,
  sectorCount: sectorList.length,
  sectors: sectorList
});
```

#### 4. Move static drawing into the layer cache rebuild callback

Replace the current inline drawing sequence (sectors loop, `drawArcRing`,
`drawTicksFromAngles`, `drawMajorValueLabels`) with:

```javascript
layerCache.ensureLayer(canvas, staticKey, function (layerCtx) {
  const dpr = Math.max(1, canvas.width / Math.max(1, W));
  layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  layerCtx.clearRect(0, 0, W, H);
  layerCtx.fillStyle = paint.color;
  layerCtx.strokeStyle = paint.color;

  for (let i = 0; i < sectorList.length; i += 1) {
    const sector = sectorList[i];
    if (!sector || !value.isFiniteNumber(sector.a0) || !value.isFiniteNumber(sector.a1)) {
      continue;
    }
    draw.drawAnnularSector(layerCtx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, {
      startDeg: sector.a0,
      endDeg: sector.a1,
      thickness: layout.geom.ringW,
      fillStyle: sector.color
    });
  }

  draw.drawArcRing(layerCtx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, arc.startDeg, arc.endDeg, {
    lineWidth: layout.geom.arcLineWidth
  });

  draw.drawTicksFromAngles(layerCtx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, ticks, {
    major: { len: layout.geom.majorTickLen, width: layout.geom.majorTickWidth },
    minor: { len: layout.geom.minorTickLen, width: layout.geom.minorTickWidth }
  });

  drawMajorValueLabels(
    layerCtx,
    family,
    layout.geom,
    layout.labels,
    range.min,
    range.max,
    tickMajor,
    arc,
    showEndLabels,
    labelWeight
  );
});
layerCache.blit(ctx);
```

#### 5. Keep pointer and text drawing on the live context

The `drawPointerAtRim` call and the `textLayout.drawModeText` call remain
unchanged — they draw on `ctx` (the visible canvas context) after the `blit`.
This is the same pattern as `LinearGaugeEngine`.

**Z-order note:** In the current uncached code, the pointer draws *before* ticks
and labels (i.e., behind them). After this change, the pointer draws *after* the
cached layer blit (i.e., on top of ticks and labels). This aligns the semicircle
engine with the established convention in `LinearGaugeEngine` and
`FullCircleRadialEngine`, where the pointer always draws on top of the cached
static layer. The visual difference is only apparent when the pointer tip lands
exactly on a tick mark and the pointer color differs from the foreground color.

### Verification

- All existing tests pass (`npm test`).
- Visual comparison: a semicircle gauge rendered with the cache produces
  pixel-identical static elements (ticks, labels, sectors, arc ring) at the
  same DPR. Pointer z-order relative to ticks changes as noted above.
- Perf: the `speed_radial` scenario in the perf suite shows reduced steady-state
  `renderCanvas` time. The layer rebuild callback fires only on resize or
  config change, not on value change.

---

## FIX-02: Layout Memoization for SemicircleRadialEngine

### Problem

`computeMode`, `computeInsets`, and `computeLayout` are called on every frame
inside `SemicircleRadialEngine.renderCanvas`. Their inputs (W, H, theme tokens,
ratio threshold props) do not change during steady-state value updates.

### Files to Modify

| File | Change |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Add a last-result layout memo inside `createRenderer` |

### Precise Changes

#### 1. Add memo state inside `createRenderer`

After the `fitCache` and `layerCache` declarations (added in FIX-01), add:

```javascript
let memoLayout = null;
```

#### 2. Build a memo key and check before computing layout

Replace the current direct computation sequence:

```javascript
const mode = layoutApi.computeMode(W, H, ...);
const insets = layoutApi.computeInsets(W, H);
const layout = layoutApi.computeLayout({ ... });
```

With:

```javascript
const ratioNormal = value.isFiniteNumber(p[ratioProps.normal]) ? p[ratioProps.normal] : modeDefaults.normal;
const ratioFlat = value.isFiniteNumber(p[ratioProps.flat]) ? p[ratioProps.flat] : modeDefaults.flat;

const memoKey = W + "," + H + "," + ratioNormal + "," + ratioFlat + "," + paint.family + "," + labelWeight + "," + paint.color;

let mode;
let insets;
let layout;
if (memoLayout && memoLayout.key === memoKey && memoLayout.themeRef === theme) {
  mode = memoLayout.mode;
  insets = memoLayout.insets;
  layout = memoLayout.layout;
} else {
  mode = layoutApi.computeMode(W, H, ratioNormal, ratioFlat);
  insets = layoutApi.computeInsets(W, H);
  layout = layoutApi.computeLayout({
    W: W,
    H: H,
    theme: theme,
    mode: mode,
    insets: insets,
    responsive: insets.responsive
  });
  memoLayout = { key: memoKey, themeRef: theme, mode: mode, insets: insets, layout: layout };
}
```

The key is a simple string concatenation of the inputs that affect layout. The
check has two parts: the string key covers dimensions and threshold ratios, and
the `themeRef === theme` identity check covers all theme-derived inputs.
`computeLayout` reads structural theme tokens (`theme.strokeWeight`,
`theme.radial.ring.widthFactor`, `theme.radial.ticks.*`, etc.) that differ
between theme presets but not between day/night mode within the same preset.
Since the theme resolver returns frozen cached objects keyed on
`mode|presetName|classSignature|inlineInputSignature`, theme object identity
changes whenever any theme token changes — whether from a day/night toggle, a
preset switch, or a CSS variable override. The identity check catches all of
these without enumerating individual token values in the string key.

### Verification

- All existing tests pass.
- Layout output is identical to current behavior (the same pure functions are
  called with the same inputs — only the call frequency changes).
- No memo leaks: `memoLayout` holds exactly one result per renderer instance.

---

## FIX-03: Width-Class Text Fit Cache in SemicircleRadialTextLayout

### Problem

The text fit cache in `SemicircleRadialTextLayout` includes the exact
`valueText` in its key. Since the displayed value changes on every update, the
cache misses every frame and the expensive fit search re-runs.

### Files to Modify

| File | Change |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialTextLayout.js` | Replace `valueText` in `buildCommonFitKey` with a width-class integer |

### Precise Changes

#### 1. Add a width-class measurement helper

Add a new function near the top of the module (after the existing helper
functions, before `createFitCache`):

```javascript
function measureWidthClass(ctx, text, fontPx, weight, family) {
  if (!text) {
    return 0;
  }
  var prevFont = ctx.font;
  var size = Math.max(0.5, Number(fontPx) || 0);
  var fontWeight = Number.isFinite(Number(weight)) ? Math.floor(Number(weight)) : 400;
  ctx.font = fontWeight + " " + size + "px " + (family || "sans-serif");
  var width = ctx.measureText(String(text)).width;
  ctx.font = prevFont;
  return Math.round(width);
}
```

This measures the text at a reference font size and returns the width rounded to
the nearest integer pixel. Texts with different characters but the same rendered
width (e.g., "12.3" and "12.4" in a proportional font, or any two strings in a
monospace font) will produce the same width class.

#### 2. Modify `buildCommonFitKey` to accept and use a width class

Change the `buildCommonFitKey` function signature and body:

```javascript
function buildCommonFitKey(state, display, valueWidthClass) {
  return {
    W: state.W,
    H: state.H,
    mode: state.layout.mode,
    caption: display.caption,
    valueWidthClass: valueWidthClass,
    unit: display.unit,
    secScale: display.secScale,
    family: state.family,
    valueWeight: state.valueWeight,
    labelWeight: state.labelWeight,
    textFillScale: state.textFillScale
  };
}
```

The exact `valueText` is replaced with `valueWidthClass` (an integer).

#### 3. Compute the width class once per frame and pass it through

In each of the three `draw*Text` functions (`drawFlatText`, `drawHighText`,
`drawNormalText`), compute the width class before building the key.

**In `drawFlatText`**, before the `makeFitCacheKey` call:

```javascript
var valueWidthClass = measureWidthClass(
  state.ctx, display.valueText, boxes.bottomBox.h, state.valueWeight, state.family
);
```

Then change the `makeFitCacheKey` argument to pass `buildCommonFitKey(state, display, valueWidthClass)` instead of `buildCommonFitKey(state, display)`.

**In `drawHighText`**, before the `makeFitCacheKey` call:

```javascript
var valueWidthClass = measureWidthClass(
  state.ctx, display.valueText, box.h, state.valueWeight, state.family
);
```

Same substitution in the key.

**In `drawNormalText`**, before the `makeFitCacheKey` call:

```javascript
var refHeight = Math.max(1, Math.floor(normal.mhMax / (1 + 2 * normalizeSecondaryScale(display.secScale))));
var valueWidthClass = measureWidthClass(
  state.ctx, display.valueText, refHeight, state.valueWeight, state.family
);
```

Same substitution in the key.

#### 4. Update `drawModeText` to pass through unchanged

No change needed — `drawModeText` delegates to the mode-specific functions
which now handle the width class internally.

### Cost/Benefit Analysis

**Cost:** One `measureText` call per frame (to compute the width class). This is
a single canvas API call — approximately 3–5 microseconds.

**Savings:** When the width class is unchanged (the common case for small numeric
fluctuations), the fit cache hits and the expensive search loop is skipped:
20–40 iterations × 3 `measureText` calls = 60–120 `measureText` calls avoided.

**Visual fidelity:** When two different value strings fall into the same width
class, the cached fit result (font sizes, gaps) from the first string is reused
for the second. Since the width class rounds to the nearest pixel, the maximum
error in the fit is sub-pixel. The text is then drawn with `drawClampedLine`
which applies horizontal scaling when the rendered width exceeds the box — this
auto-corrects any sub-pixel discrepancy. No human-visible difference.

### Verification

- All existing tests pass.
- Visual comparison: gauge text appearance is unchanged for all test values.
- Perf: the `speed_radial` scenario shows reduced steady-state text fit time.
  The fit search runs only when the width class changes (e.g., value crossing
  from two digits to three digits).

---

## FIX-04: DOM Traversal Cache for requirePluginRoot

### Problem

`requirePluginRoot` walks the composed DOM tree on every frame for every canvas
widget. The result is invariant for a mounted widget.

### Files to Modify

| File | Change |
|---|---|
| `runtime/dom-runtime.js` | Add a WeakMap cache to `requirePluginRoot` |

### Precise Changes

#### 1. Add a WeakMap at module scope

Inside the IIFE, before the `requirePluginRoot` function definition, add:

```javascript
const pluginRootCache = new WeakMap();
```

#### 2. Add cache lookup and storage to `requirePluginRoot`

Replace the current `requirePluginRoot` function body:

```javascript
function requirePluginRoot(target) {
  var node = resolveTargetNode(target);
  if (!node) {
    throw new Error("dyninstruments: runtime.dom.requirePluginRoot() requires a committed .widget.dyniplugin root");
  }

  var cached = pluginRootCache.get(node);
  if (cached) {
    return cached;
  }

  var walker = node;
  while (walker) {
    if (walker.nodeType === 1 && typeof walker.closest === "function") {
      var rootEl = walker.closest(".widget.dyniplugin");
      if (rootEl) {
        pluginRootCache.set(node, rootEl);
        return rootEl;
      }
    }
    walker = resolveParentInComposedTree(walker);
  }
  throw new Error("dyninstruments: runtime.dom.requirePluginRoot() requires a committed .widget.dyniplugin root");
}
```

The cache is keyed on the resolved target node (typically the canvas element).
Once a root is found, subsequent calls with the same canvas element return
immediately.

**No explicit invalidation is needed.** When a widget is detached, the
`CanvasDomSurfaceAdapter.detach()` method removes the canvas element from the
DOM and drops all references to it. The WeakMap entry becomes eligible for
garbage collection when the canvas element is collected. If a new canvas element
is created for the same widget (on reattach), it is a new object and gets its
own cache entry via a fresh traversal.

### Verification

- All existing tests pass.
- The cache returns the same element that the uncached traversal would find.
- No memory leak: the WeakMap holds weak references to DOM elements that are
  garbage-collected when detached.

---

## FIX-05: Mapper-Output Memoization to Eliminate Spurious Canvas Repaints

### Problem

When a store key changes that the current widget kind does not use, the full
pipeline runs: React re-render → `renderHtml` → host commit → route activation
→ `mapper.translate()` → `buildActivatedPayload` → surface adapter update →
`shallowEqual` fails (raw store values pollute `finalProps`) → canvas repaint.
The engine produces identical output. The store-key subscription is avnav-owned
and cannot be narrowed, but the activation path can detect unchanged mapper
output and skip the surface update entirely.

### Files to Modify

| File | Change |
|---|---|
| `runtime/cluster/RouteActivationPayloadBuilder.js` | Compute and attach a `__mappedSignature` string to the payload |
| `runtime/cluster/RouteActivationController.js` | Add `lastMemoKey` to route cache; compare signature in `buildPayload`; return `DISCARDED_ACTIVATION` on hit |

### Precise Changes

#### 1. Attach a mapped-output signature in `buildActivatedPayload`

In `RouteActivationPayloadBuilder.js`, inside the `buildActivatedPayload`
function, after the line:

```javascript
const mappedProps = routeCache.mapper.translate(mapperProps, routeContext) || {};
```

Add:

```javascript
var mappedSignature = JSON.stringify(mappedProps);
```

Then in the returned object (after the existing `shadowCssUrls` field), add:

```javascript
__mappedSignature: mappedSignature
```

This captures the complete mapper output — sensor values, caption, unit,
formatter, formatterParameters, and rendererProps (including all config
thresholds, range, tick, sector, and disconnect state) — as a single string.
`JSON.stringify` is deterministic here because the mappers always construct
output objects with the same key insertion order and all values are primitives,
small arrays, or plain objects.

**Cost:** One `JSON.stringify` call on a small object (~100–300 bytes serialized).
Approximately 1–3 microseconds — negligible compared to the repaint it gates.

#### 2. Add `lastMemoKey` to the per-route cache

In `RouteActivationController.js`, inside the `ensureRouteInstance` function,
in the block that creates a new cache entry:

```javascript
cache = {
  mapper: null,
  viewModel: null,
  rendererSpec: null
};
```

Add `lastMemoKey`:

```javascript
cache = {
  mapper: null,
  viewModel: null,
  rendererSpec: null,
  lastMemoKey: null
};
```

#### 3. Add the memo check in `buildPayload`

Replace the current `buildPayload` function:

```javascript
function buildPayload(snapshot, routeMeta) {
  const routeCache = ensureRouteInstance(routeMeta);
  const toolkit = ensureToolkit();
  return payloadBuilder.buildActivatedPayload({
    snapshot: snapshot,
    routeMeta: routeMeta,
    routeCache: routeCache,
    toolkitSpec: toolkit
  });
}
```

With:

```javascript
function buildPayload(snapshot, routeMeta) {
  const routeCache = ensureRouteInstance(routeMeta);
  const toolkit = ensureToolkit();
  var payload = payloadBuilder.buildActivatedPayload({
    snapshot: snapshot,
    routeMeta: routeMeta,
    routeCache: routeCache,
    toolkitSpec: toolkit
  });

  var memoKey = payload.__mappedSignature
    + "|" + (payload.props.nightMode ? "1" : "0")
    + "|" + (payload.props.editing ? "1" : "0");
  if (routeCache.lastMemoKey === memoKey) {
    return DISCARDED_ACTIVATION;
  }
  routeCache.lastMemoKey = memoKey;
  return payload;
}
```

The memo key combines three components:

- **`__mappedSignature`** — the JSON-serialized mapper output, which captures
  all renderer-relevant data: sensor value, caption, unit, formatter,
  formatterParameters, and all rendererProps (range, ticks, thresholds,
  sectors, disconnect state).
- **`nightMode`** — the theme toggle flag, sourced from avnav's
  `fixedStoreKeys`. When the user switches day/night mode, this changes and
  the memo misses, allowing the engine to repaint with the new theme.
- **`editing`** — the layout-editing flag, also from `fixedStoreKeys`. When
  the user enters or exits the layout editor, this changes and the memo misses.

Editables such as `stableDigits`, `easing`, `default`, and `captionUnitScale`
are set when the user edits widget configuration. They are stored as part of
the widget's persistent config and do not change during steady-state sensor
updates. They are excluded from the memo key because they cannot change without
a full widget re-initialization.

#### 4. Downstream handling — no changes needed

`ClusterWidget.renderHtml` already handles `DISCARDED_ACTIVATION` in its
`reconcile` callback:

```javascript
function reconcile(payload) {
  if (payload === runtimeApi.routeActivation.DISCARDED_ACTIVATION) {
    return;
  }
  state.surfaceSessionController.reconcileSession(payload);
}
```

When the memo hits and `buildPayload` returns `DISCARDED_ACTIVATION`, the
reconcile callback exits immediately. No surface adapter update, no
`shallowEqual` on polluted props, no `schedulePaint`, no `renderCanvas`. The
entire downstream path is eliminated.

### What This Skips (per memo hit)

| Step | Work avoided |
|---|---|
| `SurfaceSessionController.reconcileSession` | Payload validation, state checks, surface controller dispatch |
| `CanvasDomSurfaceAdapter.update` | Prop comparison, dirty flag management |
| `schedulePaint → RAF → paintNow` | Canvas clear, static layer blit, pointer draw, text draw |
| Theme resolution | `resolveForRoot` snapshot build and cache lookup |
| DOM traversal | `requirePluginRoot` (even with FIX-04 cache, the WeakMap lookup is skipped) |
| Layout computation | `computeMode`, `computeInsets`, `computeLayout` (even with FIX-02 memo) |

### Cost/Benefit Analysis

**Cost:** One `JSON.stringify` (~1–3 µs) plus one string comparison per
activation cycle, even on memo miss. This adds ~3 µs to every activation.

**Savings on memo hit:** The entire surface update, canvas repaint, theme
resolution, DOM traversal, and layout computation are eliminated. On low-power
ARM devices, a semicircle gauge repaint (even with FIX-01 layer cache) costs
100–500+ µs. Eliminating it for each irrelevant store key change is the largest
per-frame win in this plan.

**Frequency:** On a speed cluster widget showing SOG with 2 store keys, 50% of
store-driven activations are memo hits (STW changes don't affect SOG). On a
wind cluster widget with 5 keys showing a single angle, 60–80% are hits. On a
nav cluster widget with 20 keys showing COG, up to 95% are hits.

### Verification

- All existing tests pass.
- First activation for a route always proceeds (lastMemoKey starts as `null`).
- When the displayed sensor value changes, the mapper output changes, the
  signature changes, and the surface update proceeds normally.
- When an irrelevant store key changes, the mapper output is identical, the
  signature matches, and `DISCARDED_ACTIVATION` is returned — no canvas
  repaint, no visual change (because the output would have been identical).
- Day/night toggle: `nightMode` flag changes, memo misses, repaint proceeds
  with new theme. Confirmed by toggling night mode while data updates.
- Layout editor entry/exit: `editing` flag changes, memo misses.
- Config change (user edits range, ticks, etc.): the new config flows through
  the mapper's `rendererProps`, changing the mapper output and the signature.
  Memo misses, repaint proceeds with new config.
- No memory growth: `lastMemoKey` is a single string per route, overwritten on
  every miss.

---

## Implementation Order

The fixes should be implemented in this order due to dependencies:

| Order | Fix | Reason |
|---|---|---|
| 1 | FIX-05 (mapper-output memo) | Independent; highest impact; eliminates spurious repaints that would mask perf measurements of later fixes |
| 2 | FIX-04 (requirePluginRoot cache) | Independent; smallest diff; serves as a warmup for engine-level changes |
| 3 | FIX-02 (layout memo) | Independent; prepares the layout variables for FIX-01 |
| 4 | FIX-01 (layer cache) | Depends on layout variables being cleanly separated (FIX-02 helps readability); largest diff |
| 5 | FIX-03 (text fit width-class) | Independent; can be done in any order but benefits from the layer cache being in place for perf measurement |

Each fix can be implemented and verified independently. After all five are in
place, run the full verification sequence.

---

## Full Verification Sequence

After all five fixes are implemented:

1. **Tests:** `npm test` — all existing test files pass, zero failures.
2. **Lint/patterns:** `npm run check:all` — zero failures, zero new warnings.
3. **Visual comparison:** render every semicircle gauge variant
   (`DefaultRadialWidget`, `SpeedRadialWidget`, `TemperatureRadialWidget`,
   `VoltageRadialWidget`, `DepthRadialWidget`) at multiple sizes (normal,
   flat, high mode) in both day and night themes. Confirm pixel-identical
   static elements and visually-identical text fitting. Also render the
   full-circle gauge variants (`WindRadialWidget`, `CompassRadialWidget`)
   to confirm no regressions from FIX-04 and FIX-05.
4. **Perf benchmark:** `npm run perf:run` then `npm run perf:check` — confirm
   the `speed_radial` and `wind_radial` scenarios show reduced compute time
   and no regressions in other scenarios.
5. **Resize behavior:** resize a semicircle gauge while data is updating. Confirm
   the static layer rebuilds correctly on size change (the layer cache key
   includes W, H, and buffer dimensions).
6. **Config change behavior:** change a gauge's range or tick spacing via the
   AvNav widget editor. Confirm the static layer rebuilds (the key includes
   range, tick, and sector parameters).
7. **Day/night toggle:** switch between day and night mode. Confirm the layout
   memo misses (color changes), the layer cache rebuilds (color is in the
   static key), and the mapper memo misses (`nightMode` flag changes in the
   memo key).
8. **Cross-cluster spurious update:** place a speed cluster SOG widget on the
   same page as actively updating STW data. Confirm the SOG widget does NOT
   repaint when only STW changes (FIX-05 memo hit returns
   `DISCARDED_ACTIVATION`). Verify by observing the perf span
   `Renderer.renderCanvas` — it should not fire for the SOG widget when only
   STW updates arrive.
9. **Multi-cluster dashboard:** place widgets from speed, wind, and nav clusters
   on the same page with live data. Confirm each widget only repaints when its
   own mapped value changes, not when sibling store keys in the same cluster
   update.

---

## Expected Impact

| Widget type | Steady-state frames affected | Estimated draw-call reduction |
|---|---|---|
| Semicircle radial gauges | Every value-change frame | ~90% of canvas API calls eliminated (static layer cached) |
| Full-circle radial gauges | Every value-change frame | DOM traversal eliminated (FIX-04 only) |
| Linear gauges | Every value-change frame | DOM traversal eliminated (FIX-04 only) |
| Canvas text widgets (XTE, CenterDisplay, etc.) | Every value-change frame | DOM traversal eliminated (FIX-04 only) |
| All canvas widgets (cross-cluster) | Spurious store-key-driven frames | 100% of canvas work eliminated per spurious activation (FIX-05) |

On a GPS dashboard page with 3 semicircle gauges updating at 1 Hz, the combined
effect of FIX-01 through FIX-04 eliminates approximately 90 redundant canvas
draw calls per second and removes all per-frame DOM traversals and layout
recomputations for those gauges.

FIX-05 operates at a higher level: it eliminates entire repaint cycles that
should never have started. On a dashboard with 6 widgets across 3 clusters
(speed/2 keys, wind/5 keys, nav/20 keys), a 1 Hz GPS update that touches 10
distinct store keys would, without FIX-05, trigger up to 60 activation cycles
(6 widgets × 10 key changes). With FIX-05, only the activations where the
mapper output actually changed proceed to the surface adapter — typically 6–10
out of 60. The remaining 50+ activations are short-circuited at the memo check
in `buildPayload`, returning `DISCARDED_ACTIVATION` before any canvas, DOM, or
layout work occurs.
