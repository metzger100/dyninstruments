# Guide: Create a New Semicircle Gauge

**Status:** ⛔ Blocked until Phase 1 complete (GaugeUtils refactoring)

**Prerequisites:** Read first:
- [gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Proportions, colors, layout modes
- [gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — InstrumentComponents API
- [avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — Widget registration and render cycle
- [architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost routing

## Phase 1 Dependency

This guide targets ~150–200 line gauges using shared drawing/layout from GaugeUtils (refactored InstrumentComponents). The template will be added here once Phase 1 is complete and the following functions are available in IC/GaugeUtils:

| Category | Functions Needed | Current Location |
|---|---|---|
| Text layout | `fitTextPx`, `measureValueUnitFit`, `drawValueUnitWithFit`, `drawCaptionMax`, `fitInlineCapValUnit`, `drawThreeRowsBlock` | Duplicated in each gauge (~350 lines per gauge) |
| Overlay | `drawDisconnectOverlay` | Duplicated in each gauge |
| Arc drawing | `drawArcRing`, `drawAnnularSector`, `drawTicks`, `drawLabels` | ✅ Already in IC (opts-object API) |
| Pointer | `drawPointerAtRim` | ✅ Already in IC |
| Math | `valueToAngle`, `angleToValue` | ✅ Already in IC |

**Do not create new gauges until these functions are consolidated.** Copying from existing gauges reintroduces the duplication that Phase 1 eliminates.

## Steps Overview (execute after Phase 1)

### Step 1: Create the Gauge Module

**File:** `modules/NewGauge/NewGauge.js` (target: 150–200 lines)

Structure:
1. UMD wrapper (see [module-system.md](../architecture/module-system.md#umd-module-template))
2. `create(def, Helpers)` — get IC via `Helpers.getModule('InstrumentComponents') && Helpers.getModule('InstrumentComponents').create()`
3. Gauge-specific `displayValueFromRaw(raw)` → `{ num, text }` using avnav formatters
4. `renderCanvas(canvas, props)` — all drawing via IC/GaugeUtils calls, no local drawing primitives
5. Export: `{ id, wantsHideNativeHead: true, renderCanvas, translateFunction }`

### Gauge-Specific Code (only these parts vary per gauge)

| Concern | What Varies | Reference |
|---|---|---|
| Value formatting | Formatter call + unit conversion | [formatters.md](../avnav-api/formatters.md) |
| Sector strategy | High-end vs. low-end placement | [gauge-style-guide.md#sector-logic](../gauges/gauge-style-guide.md#sector-logic) |
| Range defaults | minValue, maxValue, tick intervals | editableParameters in plugin.js |
| Threshold prop names | `{gauge}RatioThresholdNormal`, `{gauge}RatioThresholdFlat` | [gauge-style-guide.md#layout-modes](../gauges/gauge-style-guide.md#layout-modes) |

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

### Step 2: Register Module in MODULES{}

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

### Step 3: Add Kind to Cluster

See [add-new-cluster.md](add-new-cluster.md) for full cluster creation or to add a kind to an existing cluster.

### Step 4: Add ClusterHost Dispatch

In `ClusterHost.js` — see [cluster-system.md](../architecture/cluster-system.md#adding-a-new-renderer):

1. Load module + create spec
2. Add `translateFunction` dispatch case
3. Add `pickRenderer` case
4. Include in `wantsHide` and `finalizeFunction`

### Step 5: Verify

- All 3 layout modes (resize widget to trigger flat/normal/high)
- Warning/alarm sectors render correctly
- Pointer tracks value
- Day/night mode (colors update)

## Related

- [add-new-cluster.md](add-new-cluster.md) — Creating a new cluster widget
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Visual specification
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — IC function reference
- [../architecture/module-system.md](../architecture/module-system.md) — MODULES registry
