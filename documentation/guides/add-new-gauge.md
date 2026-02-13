# Guide: Create a New Semicircle Gauge

**Prerequisites:** Read first:
- [gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Proportions, colors, layout modes
- [avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — Widget registration and render cycle
- [architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost routing

## Step 1: Create the Gauge Module

**File:** `modules/NewGauge/NewGauge.js` (target: 200-250 lines)

### Minimal Template

```javascript
/**
 * Module: NewGauge — Semicircle [description]
 * Style Guide: documentation/gauges/gauge-style-guide.md
 * Depends: InstrumentComponents (drawPointerAtRim only)
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniNewGauge = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const IC = Helpers.getModule('InstrumentComponents')
            && Helpers.getModule('InstrumentComponents').create();

    // === GAUGE-SPECIFIC: Value formatting ===
    // Convert raw SignalK value to display { num, text }
    function displayValueFromRaw(raw) {
      const n = Number(raw);
      if (!isFinite(n)) return { num: NaN, text: '---' };
      // Use avnav formatter if available:
      // try { return formatViaAvnav(n); } catch(e) {}
      return { num: n, text: n.toFixed(1) };
    }

    // === SHARED FUNCTIONS (currently duplicated) ===

    function setFont(ctx, px, bold, family) { ctx.font = (bold ? '700 ' : '400 ') + px + 'px ' + family; }
    function clamp(n, lo, hi) { n = Number(n); if (!isFinite(n)) return lo; return Math.max(lo, Math.min(hi, n)); }
    function isFiniteN(n) { return typeof n === 'number' && isFinite(n); }
    function deg2rad(d) { return (d * Math.PI) / 180; }
    function toCanvasAngleRad(deg) { return deg2rad(Number(deg) - 90); }

    // ... (include all 25 shared functions from any existing gauge)
    // See: modules/SpeedGauge/SpeedGauge.js lines 36-370 for full list

    // drawPointerAtRim — use IC (InstrumentComponents) version:
    function drawPointerAtRim(ctx, cx, cy, r, deg, opts) {
      if (IC && typeof IC.drawPointerAtRim === 'function') {
        return IC.drawPointerAtRim(ctx, cx, cy, r, deg, opts);
      }
    }

    // === RENDER ===
    function renderCanvas(canvas, props) {
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      // --- Padding ---
      const pad = Math.max(6, Math.floor(Math.min(W, H) * 0.04));
      const gap = Math.max(6, Math.floor(Math.min(W, H) * 0.03));
      const availW = Math.max(1, W - 2 * pad);
      const availH = Math.max(1, H - 2 * pad);

      // --- Layout mode ---
      const ratio = W / Math.max(1, H);
      const tN = Number(props.newgaugeRatioThresholdNormal ?? 1.1);
      const tF = Number(props.newgaugeRatioThresholdFlat ?? 3.5);
      let mode;
      if (ratio < tN) mode = 'high';
      else if (ratio > tF) mode = 'flat';
      else mode = 'normal';

      // --- Values ---
      const caption = (props.caption || '').trim();
      const unit = (props.unit || '').trim();
      const raw = props.value;
      const disp = displayValueFromRaw(raw);
      const valueText = disp.text || props.default || '---';
      const valueNum = isFiniteN(disp.num) ? disp.num : NaN;

      // --- Range ---
      let minV = Number(props.minValue ?? 0);
      let maxV = Number(props.maxValue ?? 100);
      if (!isFinite(minV)) minV = 0;
      if (!isFinite(maxV)) maxV = minV + 1;
      if (maxV <= minV) maxV = minV + 1;

      const range = maxV - minV;
      const nice = niceTickSteps(range);
      const tickMajor = Number(props.tickMajor ?? nice.major);
      const tickMinor = Number(props.tickMinor ?? nice.minor);
      const secScale = clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);

      // --- Arc (fixed N-shape) ---
      const arc = { startDeg: 270, endDeg: 450 };

      // --- Gauge geometry ---
      const R = Math.max(14, Math.min(Math.floor(availW / 2), Math.floor(availH)));
      const gaugeLeft = pad + Math.floor((availW - 2 * R) / 2);
      const gaugeTop  = pad + Math.floor((availH - R) / 2);
      const cx = gaugeLeft + R;
      const cy = gaugeTop + R;
      const rOuter = R;
      const ringW = Math.max(6, Math.floor(R * 0.12));
      const needleDepth = Math.max(8, Math.floor(ringW * 0.9));

      // --- Pointer angle ---
      const vClamped = isFiniteN(valueNum) ? Math.max(minV, Math.min(maxV, valueNum)) : NaN;
      const aNow = isFiniteN(vClamped)
        ? (arc.startDeg + (arc.endDeg - arc.startDeg) * ((vClamped - minV) / (maxV - minV)))
        : NaN;

      // --- GAUGE-SPECIFIC: Sectors ---
      // Adapt sector logic from gauge-style-guide.md#sector-logic
      // Example (high-end like SpeedGauge):
      const warningFrom = Number(props.warningFrom);
      const alarmFrom   = Number(props.alarmFrom);
      // ... build sector angle objects ...

      // --- DRAW ---
      drawArcRing(ctx, cx, cy, rOuter, arc.startDeg, arc.endDeg, 1);
      // drawAnnularSector(...) for warning/alarm sectors
      if (isFiniteN(aNow)) {
        drawPointerAtRim(ctx, cx, cy, rOuter, aNow, {
          depth: needleDepth, color: "#ff2b2b",
          variant: "long", sideFactor: 0.25, lengthFactor: 2
        });
      }

      // --- Ticks + Labels ---
      const ticks = buildValueTickAngles(minV, maxV, tickMajor, tickMinor, arc);
      drawTicksFromAngles(ctx, cx, cy, rOuter, ticks.majors, ticks.minors,
        { len: 9, width: 2 }, { len: 5, width: 1 });
      const labelInsetVal = Math.max(18, Math.floor(ringW * 1.8));
      const labelPx = Math.max(10, Math.floor(R * 0.14));
      drawLabelsForMajorValues(ctx, cx, cy, rOuter, family, labelPx,
        labelInsetVal, minV, maxV, tickMajor, arc, !!props.showEndLabels);

      // --- TEXT (mode-dependent) ---
      if (mode === 'flat') {
        // Right side: caption top, value+unit bottom
        // See SpeedGauge.js ~line 545-575
      } else if (mode === 'high') {
        // Below gauge: inline caption value unit
        // See SpeedGauge.js ~line 580-610
      } else {
        // Inside semicircle: 3-row block
        // See SpeedGauge.js ~line 615-645
      }

      // --- Disconnect overlay ---
      if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
    }

    return {
      id: "NewGauge",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction: function() { return {}; }
    };
  }

  return { id: "NewGauge", create };
}));
```

## Step 2: Register Module in MODULES{}

In `plugin.js`, add to the MODULES object:

```javascript
NewGauge: {
  js: BASE + "modules/NewGauge/NewGauge.js",
  css: undefined,
  globalKey: "DyniNewGauge",
  deps: ["InstrumentComponents"]
},
```

Also add `"NewGauge"` to ClusterHost's deps array:

```javascript
ClusterHost: {
  // ...
  deps: ["ThreeElements","WindDial","CompassGauge","SpeedGauge","DepthGauge",
         "TemperatureGauge","VoltageGauge","NewGauge"]
}
```

## Step 3: Add Kind to Cluster

Choose: add to existing cluster or create new cluster (see [add-new-cluster.md](add-new-cluster.md)).

**Adding graphic kind to existing cluster** (e.g. environment):

1. Add to KIND map: `const ENV_KIND = { ..., newgaugeGraphic: { cap: 'NEW', unit: '...' } };`
2. Add to SELECT list in editableParameters
3. Add gauge-specific editableParameters (min/max/ticks/sectors/thresholds)
4. Add condition: `{ kind: "newgaugeGraphic" }` on each

## Step 4: Add ClusterHost Dispatch

In `ClusterHost.js`:

1. Load module: `const newGaugeMod = Helpers.getModule('NewGauge');`
2. Create spec: `const newGaugeSpec = newGaugeMod.create(def, Helpers);`
3. Add to translateFunction for the cluster:
   ```javascript
   if (req === 'newgaugeGraphic') {
     return {
       renderer: 'NewGauge',
       value: p.valueKey,
       caption: cap('newgaugeGraphic'),
       unit: unit('newgaugeGraphic'),
       minValue: Number(p.newgaugeMinValue),
       maxValue: Number(p.newgaugeMaxValue),
       // ... all gauge props
     };
   }
   ```
4. Add to `pickRenderer()`: `if (props.renderer === 'NewGauge') return newGaugeSpec;`
5. Add to `wantsHide` check and `finalizeFunction` array

## Step 5: Verify

- Load plugin in AvNav
- Select the new kind in widget editor
- Check all 3 layout modes (resize widget to trigger flat/normal/high)
- Verify warning/alarm sectors render correctly
- Verify pointer tracks value
- Verify day/night mode (colors update)

## Refactored Gauge Structure

```javascript
function create(def, Helpers) {
  const IC = Helpers.getModule('InstrumentComponents')?.create();

  function displayValueFromRaw(raw) { /* gauge-specific */ }

  function renderCanvas(canvas, props) {
    // Use IC.drawPointerAtRim for pointer
    // Only gauge-specific sector logic and value formatting remain here
  }

  return { id: "NewGauge", wantsHideNativeHead: true, renderCanvas };
}
```

**Target size:** ~150-200 lines (vs current ~650 lines per gauge).

## Related

- [add-new-cluster.md](add-new-cluster.md) — Creating a new cluster widget
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Visual specification
- [../architecture/module-system.md](../architecture/module-system.md) — MODULES registry
