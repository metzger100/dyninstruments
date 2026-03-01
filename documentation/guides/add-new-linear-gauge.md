# Guide: Create a New Linear Gauge

**Status:** ✅ Implemented | Profile playbooks for shipped Speed/Depth/Temperature/Voltage/Wind/Compass linear kinds

## Prerequisites

Read first:

- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

## Overview

Linear gauges should be thin wrappers over `LinearGaugeEngine`.

Select a profile first, then keep the wrapper focused on formatter, ticks, axis mode, and sectors.

## Step 0: Choose Profile

| Profile | `axisMode` | Typical kinds | Domain | Sector style |
|---|---|---|---|---|
| Range high-end | `range` | `sogLinear`, `stwLinear` | Editable `min/max` | Warning/Alarm near max |
| Range low-end | `range` | `depthLinear`, `voltageLinear` | Editable `min/max` | Alarm/Warning near min |
| Range optional high-end | `range` | `tempLinear` | Editable `min/max` | Optional high-end thresholds |
| Centered wind-angle | `centered180` | `angleTrueLinear`, `angleApparentLinear` | Fixed `-180..180` | Optional mirrored laylines |
| Fixed compass | `fixed360` | `hdtLinear`, `hdmLinear` | Fixed `0..360` | Usually none |

## Step 1: Create Wrapper Module

Create `widgets/linear/NewLinearWidget/NewLinearWidget.js` with UMD + `create(def, Helpers)`.

Use `SpeedLinearWidget` as reference and delegate to `LinearGaugeEngine`.

Existing advanced references:

- `CompassLinearWidget` (fixed center pointer + moving `0..360` scale + waypoint marker)
- `WindLinearWidget` (dual angle/speed text + mirrored layline sectors)

```javascript
const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

function formatDisplay(raw, props, unit) {
  const n = Number(raw);
  if (!isFinite(n)) return { num: NaN, text: "---" };
  const out = String(Helpers.applyFormatter(n, {
    formatter: "formatDecimal",
    formatterParameters: [3, 1, true],
    default: "---"
  }));
  const text = valueMath.extractNumberText(out);
  const numeric = Number(text);
  return isFinite(numeric) ? { num: numeric, text: text } : { num: NaN, text: "---" };
}
```

## Step 2: Configure `createRenderer(spec)`

### A) Range profile template

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "value",
  unitDefault: "m",
  axisMode: "range",
  rangeDefaults: { min: 0, max: 30 },
  rangeProps: { min: "depthLinearMinValue", max: "depthLinearMaxValue" },
  tickProps: {
    major: "depthLinearTickMajor",
    minor: "depthLinearTickMinor",
    showEndLabels: "depthLinearShowEndLabels"
  },
  ratioProps: {
    normal: "depthLinearRatioThresholdNormal",
    flat: "depthLinearRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

### B) Centered wind-angle template

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "angle",
  unitDefault: "deg",
  axisMode: "centered180",
  tickProps: {
    major: "windAngleLinearTickMajor",
    minor: "windAngleLinearTickMinor",
    showEndLabels: "windAngleLinearShowEndLabels"
  },
  ratioProps: {
    normal: "windAngleLinearRatioThresholdNormal",
    flat: "windAngleLinearRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

### C) Fixed compass template

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "heading",
  unitDefault: "deg",
  axisMode: "fixed360",
  tickProps: {
    major: "compassLinearTickMajor",
    minor: "compassLinearTickMinor",
    showEndLabels: "compassLinearShowEndLabels"
  },
  ratioProps: {
    normal: "compassLinearRatioThresholdNormal",
    flat: "compassLinearRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

## Step 3: Add Editable Parameters

Add new kind(s) in `config/shared/kind-defaults.js` and cluster `kind` lists.

Use gauge-prefixed editable keys:

- Ratio thresholds: `{gauge}LinearRatioThresholdNormal`, `{gauge}LinearRatioThresholdFlat`
- Ticks: `{gauge}LinearTickMajor`, `{gauge}LinearTickMinor`, `{gauge}LinearShowEndLabels`
- Range domain: `{gauge}LinearMinValue`, `{gauge}LinearMaxValue`
- High/low-end sectors: `{gauge}LinearWarningEnabled`, `{gauge}LinearAlarmEnabled`, `{gauge}LinearWarningFrom`, `{gauge}LinearAlarmFrom`
- Wind mirrored sectors: `{gauge}LinearLayEnabled`, `{gauge}LinearLayMin`, `{gauge}LinearLayMax`

Only expose keys relevant for the selected kind via `condition`.

## Step 4: Register Component + Router

1. `config/components.js`
- Add `NewLinearWidget` entry
- Add it to `ClusterRendererRouter.deps`

2. `cluster/rendering/ClusterRendererRouter.js`
- Instantiate renderer spec in `create()`
- Add to `rendererSpecs`
- Route `props.renderer === "NewLinearWidget"` in `pickRenderer()`

## Step 5: Mapper Wiring

Keep mapper declarative (`create` + `translate`).

```javascript
if (p.kind === "depthLinear") {
  return {
    renderer: "DepthLinearWidget",
    value: p.depth,
    caption: cap("depthLinear"),
    unit: unit("depthLinear"),
    formatter: "formatDecimal",
    formatterParameters: [3, 1, true],
    rendererProps: {
      depthLinearRatioThresholdNormal: num(p.depthLinearRatioThresholdNormal),
      depthLinearRatioThresholdFlat: num(p.depthLinearRatioThresholdFlat),
      depthLinearMinValue: num(p.depthLinearMinValue),
      depthLinearMaxValue: num(p.depthLinearMaxValue),
      depthLinearTickMajor: num(p.depthLinearTickMajor),
      depthLinearTickMinor: num(p.depthLinearTickMinor),
      depthLinearShowEndLabels: !!p.depthLinearShowEndLabels,
      captionUnitScale: num(p.captionUnitScale)
    }
  };
}
```

For `centered180` and `fixed360` kinds, omit `*MinValue` / `*MaxValue` props from mapper output.

## Step 6: Validate

Required checks:

- Wrapper unit test (`tests/widgets/linear/*LinearWidget.test.js`)
- Mapper test (`tests/cluster/mappers/*Mapper.test.js`)
- Cluster static config test updates (`tests/config/clusters/*.test.js`)
- Full gate: `npm run check:all`

Manual checks:

- Resize: `high`, `normal`, `flat`
- Pointer tracks value and clamps at axis edges
- Sector behavior matches selected profile
- Day/night colors and disconnect overlay are correct

## Checklist

- [ ] Kind defaults added in `config/shared/kind-defaults.js`
- [ ] Cluster `kind` select extended in `config/clusters/<cluster>.js`
- [ ] Editable parameter conditions added for new linear keys
- [ ] Wrapper module added in `widgets/linear/`
- [ ] Component registered in `config/components.js`
- [ ] Router wiring updated in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Mapper routes kind to new renderer with normalized props
- [ ] Formatter tuple docs updated for formatter-bearing kinds:
  - [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md)
  - [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md)
  - [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md)
- [ ] `npm run check:all` passes

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
