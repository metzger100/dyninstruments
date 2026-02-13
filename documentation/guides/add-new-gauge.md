# Guide: Create a New Semicircle Gauge

**Status:** ⛔ Blocked until Phase 1 complete (GaugeUtils refactoring)

**Prerequisites:** Read first:
- [gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Proportions, colors, layout modes
- [gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — InstrumentComponents API
- [avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — Widget registration and render cycle
- [architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost routing

## Phase 1 Dependency

This guide produces ~150–200 line gauges using shared drawing/layout from InstrumentComponents. Functions marked `⏳ Phase 1` do not exist in IC yet — they are currently duplicated across the four semicircle gauges and will be consolidated during Phase 1 refactoring.

## Step 1: Create the Gauge Module

**File:** `modules/NewGauge/NewGauge.js` (target: 150–200 lines)

### Template

```javascript
/**
 * Module: NewGauge — Semicircle [description]
 * Style Guide: documentation/gauges/gauge-style-guide.md
 * Depends: InstrumentComponents
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
    // Each gauge has its own raw→display conversion.
    // Must return { num, text } — num for pointer, text for display.
    function displayValueFromRaw(raw) {
      const n = Number(raw);
      if (!isFinite(n)) return { num: NaN, text: '---' };
      // Example: use avnav formatter for unit conversion
      // try { return { num: converted, text: formatted }; } catch(e) {}
      return { num: n, text: n.toFixed(1) };
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

      // --- Padding & layout mode ---
      const pad = Math.max(6, Math.floor(Math.min(W, H) * 0.04));
      const gap = Math.max(6, Math.floor(Math.min(W, H) * 0.03));
      const availW = Math.max(1, W - 2 * pad);
      const availH = Math.max(1, H - 2 * pad);

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
      const disp = displayValueFromRaw(props.value);
      const valueText = disp.text || props.default || '---';
      const valueNum = (typeof disp.num === 'number' && isFinite(disp.num)) ? disp.num : NaN;

      // --- Range ---
      let minV = Number(props.minValue ?? 0);
      let maxV = Number(props.maxValue ?? 100);
      if (!isFinite(minV)) minV = 0;
      if (!isFinite(maxV)) maxV = minV + 1;
      if (maxV <= minV) maxV = minV + 1;

      const secScale = Math.max(0.3, Math.min(3.0, Number(props.captionUnitScale ?? 0.8)));

      // --- Arc (fixed N-shape) ---
      const arc = { startDeg: 270, endDeg: 450 };

      // --- Gauge geometry (see gauge-style-guide.md#proportions) ---
      const R = Math.max(14, Math.min(Math.floor(availW / 2), Math.floor(availH)));
      const gaugeLeft = pad + Math.floor((availW - 2 * R) / 2);
      const gaugeTop  = pad + Math.floor((availH - R) / 2);
      const cx = gaugeLeft + R;
      const cy = gaugeTop + R;
      const rOuter = R;
      const ringW = Math.max(6, Math.floor(R * 0.12));
      const needleDepth = Math.max(8, Math.floor(ringW * 0.9));

      // --- Pointer angle via IC.valueToAngle ---
      const vOpts = { min: minV, max: maxV, startDeg: arc.startDeg, endDeg: arc.endDeg, clamp: true };
      const aNow = isFinite(valueNum) ? IC.valueToAngle(valueNum, vOpts) : NaN;

      // === GAUGE-SPECIFIC: Sector logic ===
      // Adapt sector strategy per gauge-style-guide.md#sector-logic
      // High-end (SpeedGauge/TemperatureGauge): warning→alarm→maxValue
      // Low-end (DepthGauge/VoltageGauge): minValue→alarm→warning
      const warningFrom = Number(props.warningFrom);
      const alarmFrom   = Number(props.alarmFrom);

      // --- DRAW: Arc ring ---
      IC.drawArcRing(ctx, cx, cy, rOuter, arc.startDeg, arc.endDeg, { lineWidth: 1 });

      // --- DRAW: Warning/Alarm sectors ---
      // Convert value thresholds to angles via IC.valueToAngle,
      // then draw with IC.drawAnnularSector.
      if (isFinite(warningFrom)) {
        const wTo = isFinite(alarmFrom) && alarmFrom > warningFrom ? alarmFrom : maxV;
        IC.drawAnnularSector(ctx, cx, cy, rOuter, {
          startDeg: IC.valueToAngle(warningFrom, vOpts),
          endDeg:   IC.valueToAngle(wTo, vOpts),
          thickness: ringW, fillStyle: "#e7c66a"
        });
      }
      if (isFinite(alarmFrom)) {
        IC.drawAnnularSector(ctx, cx, cy, rOuter, {
          startDeg: IC.valueToAngle(alarmFrom, vOpts),
          endDeg:   IC.valueToAngle(maxV, vOpts),
          thickness: ringW, fillStyle: "#ff7a76"
        });
      }

      // --- DRAW: Pointer ---
      if (isFinite(aNow)) {
        IC.drawPointerAtRim(ctx, cx, cy, rOuter, aNow, {
          depth: needleDepth, color: "#ff2b2b",
          variant: "long", sideFactor: 0.25, lengthFactor: 2
        });
      }

      // --- DRAW: Ticks ---
      // Convert value-based intervals to degree-based for IC.drawTicks
      const range = maxV - minV;
      const tickMajor = Number(props.tickMajor ?? 10);
      const tickMinor = Number(props.tickMinor ?? 2);
      const arcSpan = arc.endDeg - arc.startDeg;
      const stepMajorDeg = (tickMajor / range) * arcSpan;
      const stepMinorDeg = (tickMinor / range) * arcSpan;

      IC.drawTicks(ctx, cx, cy, rOuter, {
        startDeg: arc.startDeg, endDeg: arc.endDeg,
        stepMajor: stepMajorDeg, stepMinor: stepMinorDeg,
        includeEnd: !!props.showEndLabels,
        majorMode: "relative",
        major: { len: 9, width: 2 },
        minor: { len: 5, width: 1 }
      });

      // --- DRAW: Labels (IC.drawLabels + IC.angleToValue) ---
      const labelInsetVal = Math.max(18, Math.floor(ringW * 1.8));
      const labelPx = Math.max(10, Math.floor(R * 0.14));

      IC.drawLabels(ctx, cx, cy, rOuter, {
        startDeg: arc.startDeg, endDeg: arc.endDeg,
        step: stepMajorDeg,
        includeEnd: !!props.showEndLabels,
        radiusOffset: labelInsetVal,
        fontPx: labelPx, bold: true, family: family,
        labelFormatter: function(deg) {
          const val = IC.angleToValue(deg, vOpts);
          let r = Math.round(val * 10) / 10;
          if (Math.abs(r - Math.round(r)) < 0.01) r = Math.round(r);
          return String(r);
        }
      });

      // --- DRAW: Text (mode-dependent) ---
      // ⏳ Phase 1: After refactoring, use GaugeUtils shared text-layout:
      //   IC.drawFlatText(ctx, { cx, cy, R, ... })
      //   IC.drawInlineText(ctx, { ... })
      //   IC.drawThreeRowsBlock(ctx, { ... })
      // Until then: text rendering blocked.

      // --- Disconnect overlay ---
      // ⏳ Phase 1: IC.drawDisconnectOverlay(ctx, W, H, family, color)
      if (props.disconnect) {
        ctx.save();
        ctx.globalAlpha = 0.20; ctx.fillStyle = color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1; ctx.fillStyle = color;
        const dpx = Math.max(12, Math.floor(Math.min(W, H) * 0.18));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '700 ' + dpx + 'px ' + family;
        ctx.fillText('NO DATA', Math.floor(W / 2), Math.floor(H / 2));
        ctx.restore();
      }
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

### IC Functions Used by This Template

| Purpose | IC Function | Status |
|---|---|---|
| Arc ring | `IC.drawArcRing(ctx, cx, cy, r, startDeg, endDeg, opts)` | ✅ Available |
| Sectors | `IC.drawAnnularSector(ctx, cx, cy, rOuter, opts)` | ✅ Available |
| Pointer | `IC.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts)` | ✅ Available |
| Ticks | `IC.drawTicks(ctx, cx, cy, rOuter, opts)` | ✅ Available (`majorMode: "relative"`) |
| Labels | `IC.drawLabels(ctx, cx, cy, rOuter, opts)` | ✅ Available (`labelFormatter` for values) |
| Value→angle | `IC.valueToAngle(value, opts)` | ✅ Available |
| Angle→value | `IC.angleToValue(angleDeg, opts)` | ✅ Available (for label formatter) |
| Text layout | `fitTextPx`, `measureValueUnitFit`, `drawThreeRowsBlock`, ... | ⏳ Phase 1 |
| Disconnect | `drawDisconnectOverlay` | ⏳ Phase 1 |

### Value-to-Angle Tick Conversion

IC works in degrees. Convert value-based tick intervals:

```javascript
const arcSpan = arc.endDeg - arc.startDeg;  // 180 for standard semicircle
const range = maxV - minV;
const stepMajorDeg = (tickMajorValue / range) * arcSpan;
const stepMinorDeg = (tickMinorValue / range) * arcSpan;
// Use majorMode: "relative" so ticks align to arc start, not absolute 0°
```

For labels, use `labelFormatter` with `IC.angleToValue()` to convert tick angles back to display values.

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

Also add `"NewGauge"` to ClusterHost's deps array.

## Step 3: Add Kind to Cluster

See [add-new-cluster.md](add-new-cluster.md) for full cluster creation or to add a kind to an existing cluster.

## Step 4: Add ClusterHost Dispatch

In `ClusterHost.js` — see [cluster-system.md](../architecture/cluster-system.md#adding-a-new-renderer):

1. Load module + create spec
2. Add `translateFunction` dispatch case
3. Add `pickRenderer` case
4. Include in `wantsHide` and `finalizeFunction`

## Step 5: Verify

- All 3 layout modes (resize widget to trigger flat/normal/high)
- Warning/alarm sectors render correctly
- Pointer tracks value
- Day/night mode (colors update)

## Related

- [add-new-cluster.md](add-new-cluster.md) — Creating a new cluster widget
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Visual specification
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — IC function reference
- [../architecture/module-system.md](../architecture/module-system.md) — MODULES registry
