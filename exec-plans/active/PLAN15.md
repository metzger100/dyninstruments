# PLAN15 — Default Instruments Cluster (`dyni_Default_Instruments`)

## Status

Signed off after repository verification and code-trace review.

Repo-grounded corrections folded into this final plan:

- add `config/clusters/default.js` to `plugin.js` internal load order
- update `tests/config/clusters/static-clusters.test.js`
- update `tests/plugin/plugin-bootstrap.test.js`
- update `tests/config/components.test.js`
- update `documentation/TABLEOFCONTENTS.md`
- for gauges, always go through `Helpers.applyFormatter(...)`; do not special-case “no formatter selected”
- `text` can render any normal store value/formatter output; `linearGauge` and `radialGauge` are explicitly numeric gauges and only support raw values / formatter outputs that still yield a parseable numeric substring for pointer positioning
- no new validation/autocorrection layer for awkward threshold ordering or tick relationships; keep existing repo behavior and document that sensible config is the user’s responsibility
- approved initial default preset added for new gauge instances

---

## Goal

Add a new cluster `dyni_Default_Instruments` for arbitrary external store values not already covered by the domain-specific clusters. It supports three self-configurable kinds:

- `text`
- `linearGauge`
- `radialGauge`

All three route through the existing cluster system, use `canvas-dom`, and use `MapperOutputViewModel`.

---

## Final defaults

Use these initial defaults for a fresh widget:

- `kind` default: `text`
- cluster defaults: `caption: ""`, `unit: ""`, `default: "---"`, `storeKeys: {}`
- shared display defaults:
  - `captionUnitScale = 0.8`
  - `stableDigits = false`
- gauge defaults:
  - `min = 0`
  - `max = 100`
  - `major tick = 10`
  - `minor tick = 2`
  - `showEndLabels = false`
  - `easing = true`
- all four sectors disabled by default
- when enabled, sector seed thresholds are:
  - `alarmLow = 10`
  - `warningLow = 25`
  - `warningHigh = 75`
  - `alarmHigh = 90`
- sector seed colors use static literals matching the current day-theme defaults:
  - warning = `#e7c66a`
  - alarm = `#ff7a76`

---

## Functional contract

### Kinds

- `text` → existing `ThreeValueTextWidget`
- `linearGauge` → new `DefaultLinearWidget`
- `radialGauge` → new `DefaultRadialWidget`

### Store key

- one `KEY` editable named `value`
- `updateFunction` wires `storeKeys.value` from the selected path
- empty key removes `storeKeys.value`

`updateFunction` behavior:

- clone incoming values
- ensure `storeKeys` exists
- if `value` is a non-empty string, set `storeKeys.value = value.trim()`
- otherwise remove `storeKeys.value`

### Caption/unit and formatter behavior

Enable built-in AvNav editables:

- `formatter: true`
- `formatterParameters: true`
- `className: true`

Suppress built-in caption/unit editables:

- `caption: false`
- `unit: false`

Provide per-kind caption/unit editables via `makePerKindTextParams(DEFAULT_KIND)`.

Formatter contract:

- mapper does not force formatter selection
- `text` may use any normal formatter output
- `linearGauge` / `radialGauge`:
  - always call `Helpers.applyFormatter(raw, { formatter, formatterParameters, default })`
  - pointer math and gauge-face value text use the current numeric extractor path
  - gauges therefore support numeric raw values and formatter outputs that still contain a parseable plain numeric substring
  - no locale-number normalization or richer parser in this rollout

### Gauge behavior

Both gauges expose:

- min / max
- major / minor tick step
- show end labels
- easing
- `captionUnitScale`
- `stableDigits`
- four optional sectors:
  - `alarmLow`
  - `warningLow`
  - `warningHigh`
  - `alarmHigh`

Each sector has:

- enable toggle
- threshold value
- editable `COLOR`

Sector colors are per-instance editables, not theme tokens.

### Threshold/tick behavior

Keep existing repo behavior:

- no auto-sorting or smart correction of thresholds
- no extra validation for awkward but finite tick pairs
- only non-finite / `<= 0` tick values fall back through existing engine logic
- degenerate sectors are omitted after clamp/filter
- overlapping or awkward configs render in deterministic builder order; sensible config remains user responsibility

---

## Implementation

### Phase 1 — cluster registration and mapper wiring

Create:

- `config/clusters/default.js`
- `cluster/mappers/DefaultMapper.js`

Modify:

- `plugin.js`
- `config/shared/kind-defaults.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/mappers/ClusterMapperRegistry.js`
- `config/components/registry-cluster.js`

#### `config/shared/kind-defaults.js`

Add:

```js
DEFAULT_KIND: {
  text: { cap: "VALUE", unit: "" },
  linearGauge: { cap: "VALUE", unit: "" },
  radialGauge: { cap: "VALUE", unit: "" }
}
```

#### `config/clusters/default.js`

Register one `ClusterWidget` cluster:

- `name: "dyni_Default_Instruments"`
- `description: "Self-configurable instrument for any store value"`
- `cluster: "default"`
- `caption: ""`
- `unit: ""`
- `default: "---"`
- `storeKeys: {}`
- `kind.default = "text"`

Editable parameters:

- `kind` select:
  - `text`
  - `linearGauge`
  - `radialGauge`
- `value: { type: "KEY" }`
- built-ins:
  - `caption: false`
  - `unit: false`
  - `formatter: true`
  - `formatterParameters: true`
  - `className: true`
- `...makePerKindTextParams(DEFAULT_KIND)`
- text internals:
  - `ratioThresholdNormal`
  - `ratioThresholdFlat`
- shared:
  - `captionUnitScale`
  - `stableDigits`
- linear gauge editables:
  - `defaultLinearRatioThresholdNormal`
  - `defaultLinearRatioThresholdFlat`
  - `defaultLinearMinValue`
  - `defaultLinearMaxValue`
  - `defaultLinearTickMajor`
  - `defaultLinearTickMinor`
  - `defaultLinearShowEndLabels`
  - `defaultLinearAlarmLowEnabled`
  - `defaultLinearAlarmLowAt`
  - `defaultLinearAlarmLowColor`
  - `defaultLinearWarningLowEnabled`
  - `defaultLinearWarningLowAt`
  - `defaultLinearWarningLowColor`
  - `defaultLinearWarningHighEnabled`
  - `defaultLinearWarningHighAt`
  - `defaultLinearWarningHighColor`
  - `defaultLinearAlarmHighEnabled`
  - `defaultLinearAlarmHighAt`
  - `defaultLinearAlarmHighColor`
- radial gauge editables:
  - same pattern under `defaultRadial*`
- `easing` only for gauge kinds

Use prefixed gauge prop names throughout.

#### `cluster/rendering/ClusterKindCatalog.js`

Add:

```js
{ cluster: "default", kind: "text", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" }
{ cluster: "default", kind: "linearGauge", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "DefaultLinearWidget", surface: "canvas-dom" }
{ cluster: "default", kind: "radialGauge", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "DefaultRadialWidget", surface: "canvas-dom" }
```

#### `cluster/mappers/DefaultMapper.js`

Implement a thin pass-through mapper.

- `text`:
  - `toolkit.out(p.value, cap("text"), unit("text"))`
- `linearGauge`:
  - `renderer: "DefaultLinearWidget"`
  - `value: p.value`
  - `caption`, `unit`
  - `rendererProps` for all prefixed linear gauge settings
- `radialGauge`:
  - same pattern with prefixed radial props

Use:

- `toolkit.num()` for numeric props
- `!!` for booleans
- pass color strings as-is

Do **not** set `formatter` or `formatterParameters`.

#### `cluster/mappers/ClusterMapperRegistry.js`

- add `default: "DefaultMapper"` to `MAPPER_MODULE_IDS`
- update module header depends list

#### `config/components/registry-cluster.js`

Add `DefaultMapper` and include it in `ClusterMapperRegistry.deps`.

#### `plugin.js`

Insert `config/clusters/default.js` into the authoritative internal script list before `config/widget-definitions.js`.

---

### Phase 2 — `DefaultRadialWidget`

Create:

- `widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js`

Modify:

- `config/components/registry-widgets.js`
- `cluster/rendering/ClusterRendererRouter.js`

Implementation contract:

- follow `SpeedRadialWidget` structure
- deps:
  - `SemicircleRadialEngine`
  - `RadialValueMath`
  - `PlaceholderNormalize`

Engine config:

- `rawValueKey: "value"`
- `unitDefault: ""`
- `rangeProps` → `defaultRadialMinValue`, `defaultRadialMaxValue`
- `tickProps` → `defaultRadialTickMajor`, `defaultRadialTickMinor`, `defaultRadialShowEndLabels`
- `ratioProps` → `defaultRadialRatioThresholdNormal`, `defaultRadialRatioThresholdFlat`
- `tickSteps: valueMath.resolveStandardSemicircleTickSteps`
- `formatDisplay`: always through `Helpers.applyFormatter(...)`, then numeric extraction path
- `buildSectors`: custom four-sector builder using user colors
- `getVerticalShellSizing()` → `{ kind: "ratio", aspectRatio: 1 }`

Sector rules:

- low alarm: `minV .. alarmLowAt`
- low warning: `(alarmLowAt || minV) .. warningLowAt`
- high warning: `warningHighAt .. (alarmHighAt || maxV)`
- high alarm: `alarmHighAt .. maxV`

Clamp through existing math path and omit degenerate sectors.

Registry/router updates:

- register `DefaultRadialWidget`
- add it to `RendererPropsWidget.deps`
- add router spec through `rendererPropsWidget.create(def, Helpers, "DefaultRadialWidget")`
- update router depends header

---

### Phase 3 — `DefaultLinearWidget`

Create:

- `widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js`

Modify:

- `config/components/registry-widgets.js`
- `cluster/rendering/ClusterRendererRouter.js`

Implementation contract:

- follow `VoltageLinearWidget` structure
- deps:
  - `LinearGaugeEngine`
  - `RadialValueMath`
  - `PlaceholderNormalize`

Engine config:

- `rawValueKey: "value"`
- `unitDefault: ""`
- `axisMode: "range"`
- `rangeProps` → `defaultLinearMinValue`, `defaultLinearMaxValue`
- `tickProps` → `defaultLinearTickMajor`, `defaultLinearTickMinor`, `defaultLinearShowEndLabels`
- `ratioProps` → `defaultLinearRatioThresholdNormal`, `defaultLinearRatioThresholdFlat`
- `tickSteps: valueMath.resolveStandardSemicircleTickSteps`
- `formatDisplay`: same always-through-`Helpers.applyFormatter(...)` contract
- `buildSectors`: returns `{ from, to, color }`
- `getVerticalShellSizing()` → `{ kind: "ratio", aspectRatio: 2 }`

Linear sector rules mirror radial, but stay in value domain and filter `to <= from`.

Registry/router updates mirror Phase 2.

---

### Phase 4 — tests and docs

Create:

- `tests/config/clusters/default.test.js`
- `tests/cluster/mappers/DefaultMapper.test.js`
- `tests/widgets/radial/DefaultRadialWidget.test.js`
- `tests/widgets/linear/DefaultLinearWidget.test.js`
- `documentation/widgets/default-instruments.md`

Modify:

- `tests/config/clusters/static-clusters.test.js`
- `tests/plugin/plugin-bootstrap.test.js`
- `tests/config/components.test.js`
- `tests/cluster/rendering/ClusterKindCatalog.test.js`
- `tests/cluster/rendering/ClusterRendererRouter.test.js`
- `tests/cluster/mappers/ClusterMapperRegistry.test.js`
- `tests/config/shared/kind-defaults.test.js`
- `ROADMAP.md`
- `documentation/TABLEOFCONTENTS.md`

#### Test coverage

`tests/config/clusters/default.test.js`

Verify:

- cluster name/id
- `kind.default === "text"`
- kind selector values
- `value` KEY editable exists for all kinds
- formatter editables enabled
- built-in caption/unit suppressed
- per-kind caption/unit editables exist
- gauge defaults match the approved preset
- sector toggles default false
- threshold/color editables are conditionally shown on enable
- `updateFunction` sets and removes `storeKeys.value`

`tests/cluster/mappers/DefaultMapper.test.js`

Verify:

- text output shape
- linear/radial renderer selection
- numeric props go through `num()`
- booleans through `!!`
- colors remain strings
- unknown kind returns `{}`

`tests/widgets/radial/DefaultRadialWidget.test.js`

Verify:

- id
- shell sizing
- hide native head
- all sectors disabled → empty
- individual sector color passthrough
- four-sector ordering
- degenerate sectors omitted
- formatter path uses `Helpers.applyFormatter`
- no formatter still uses the same helper path
- non-numeric formatted output falls back to placeholder / no valid pointer

`tests/widgets/linear/DefaultLinearWidget.test.js`

Mirror the radial tests for linear `{ from, to, color }` sectors.

Extended existing tests:

- `static-clusters.test.js` includes `default`
- `plugin-bootstrap.test.js` includes `config/clusters/default.js` in load order
- `components.test.js` checks:
  - `DefaultMapper`
  - `DefaultRadialWidget`
  - `DefaultLinearWidget`
  - updated dependency arrays
- `ClusterKindCatalog.test.js` includes all `default/*` routes
- `ClusterRendererRouter.test.js` resolves both new gauge widgets
- `ClusterMapperRegistry.test.js` maps `default` to `DefaultMapper`
- `kind-defaults.test.js` checks `DEFAULT_KIND`

#### Docs

`documentation/widgets/default-instruments.md` should document:

- available kinds
- the `value` dynamic store-key contract
- numeric-vs-text behavior
- formatter contract
- sector model
- editable summary
- example store paths
- user-responsibility note for threshold/tick sanity

Also:

- add the page to `documentation/TABLEOFCONTENTS.md`
- mark the ROADMAP item complete

---

## Acceptance criteria

Done means:

- `dyni_Default_Instruments` registers and loads end-to-end
- `text`, `linearGauge`, `radialGauge` all resolve through catalog + mapper + router
- `text` uses `ThreeValueTextWidget`
- `linearGauge` uses `DefaultLinearWidget`
- `radialGauge` uses `DefaultRadialWidget`
- dynamic `KEY` source works
- formatter selection is fully user-controlled
- gauge sectors render with per-instance editable colors
- multiple instances can use different sector colors
- missing key / missing numeric value shows placeholder
- no AvNav core files are changed
- docs/tests/bootstrap/component contracts are all updated
- `npm run check:all` passes
