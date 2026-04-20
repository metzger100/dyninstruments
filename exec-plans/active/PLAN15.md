# PLAN15 — Default Instruments Cluster (`dyni_Default_Instruments`)

## Status

Written after repository verification and code-trace review of the cluster/mapper/catalog/router/widget pipeline, the existing radial and linear gauge engines, the sector-building API (`RadialValueMath.buildHighEndSectors` / `buildLowEndSectors`), the `RendererPropsWidget` adapter pattern, the `COLOR` editable parameter type, and the existing per-kind caption/unit pattern.

This plan is code-grounded against the verified sources named below. It locks the kind list, editable parameter set, sector model, mapper contract, widget renderer contracts, and documentation/test outcomes for the Default Instruments cluster.

The coding agent may choose equivalent low-level implementation details where appropriate, but the kind catalog tuples, mapper output contract, sector-building contract, editable parameter inventory, and test/documentation outcomes below are explicit plan contracts.

---

## Goal

Add a new cluster `dyni_Default_Instruments` that offers three self-configurable instrument kinds — `text`, `linearGauge`, `radialGauge` — for displaying arbitrary external store values not covered by the existing domain-specific clusters.

Expected outcomes after completion:

- `dyni_Default_Instruments` is a new `ClusterWidget` cluster with `cluster: "default"`.
- The cluster offers three kinds: `text`, `linearGauge`, `radialGauge`.
- The user selects an AvNav store key via a `KEY`-type editable — any valid store path is accepted.
- Caption and unit are fully user-configurable per kind via the standard per-kind text params.
- The formatter is user-selectable via the AvNav built-in `formatter: true` and `formatterParameters: true` editables.
- The `text` kind routes to `ThreeValueTextWidget` (existing, no new renderer needed).
- The `linearGauge` kind routes to a new `DefaultLinearWidget` via `RendererPropsWidget`.
- The `radialGauge` kind routes to a new `DefaultRadialWidget` via `RendererPropsWidget`.
- Both gauge kinds offer four optional sectors: `alarmLow`, `warningLow`, `warningHigh`, `alarmHigh`.
- Each sector has an independent enable toggle (`BOOLEAN`, default `false`), a threshold value (`FLOAT`), and a user-configurable color (`COLOR`).
- Sector colors are editable parameters, not theme tokens — this is intentional so multiple Default widget instances on the same page can have independent sector colors not overridable via `user.css`.
- Both gauge kinds offer full control over min/max range, major/minor tick steps, show end labels, and easing.
- All kinds offer `captionUnitScale` and `stableDigits`.
- The widget is passive — no interaction, no bridge actions.
- No AvNav core files are modified.

---

## Verified Baseline

The following points were rechecked against the repositories before this plan was written.

1. **AvNav's native `Default` widget is a minimal pass-through.** `viewer/components/WidgetList.js` registers `{ name: 'Default', default: "---" }` with no `wclass` override — it uses the basic AvNav text renderer with user-configured `value`, `caption`, `unit`, and `formatter`.
2. **AvNav's `RadialGauge` widget is a thin canvas-gauges wrapper.** `WidgetList.js` registers `{ name: 'RadialGauge', wclass: GaugeRadial, editableParameters: { minValue, maxValue } }`. It offers minimal customization — no sector colors, no tick control, no low-end sectors.
3. **AvNav supports the `COLOR` editable parameter type.** `viewer/util/EditableParameter.js` defines `EditableColorParameter` (type 6) with a `CSS.supports('color', cv)` checker. The editor shows a color picker.
4. **No dyninstruments cluster currently uses `COLOR` editables.** This will be the first use.
5. **AvNav supports `KEY` editable parameters for store key selection.** `EditableKeyParameter` (type 8) shows a store key browser. The render function receives the store value, not the path.
6. **The existing `environment` cluster demonstrates the KEY + updateFunction pattern.** `config/clusters/environment.js` uses `value: { type: "KEY", ... }` with `updateFunction` to wire `storeKeys.value` dynamically.
7. **`RadialValueMath` already provides both `buildHighEndSectors` and `buildLowEndSectors`.** High-end sectors cover warning/alarm above a threshold; low-end sectors cover alarm/warning below a threshold. Both return arrays of `{ a0, a1, color }` angle-domain sector objects.
8. **`RadialValueMath.sectorAngles(from, to, minV, maxV, arc)` is the shared primitive for value-domain to angle-domain sector conversion.** It returns `{ a0, a1 }` or `null`.
9. **The `SemicircleRadialEngine.createRenderer(spec)` accepts a `buildSectors(props, minV, maxV, arc, valueUtils, theme)` callback.** The callback returns an array of `{ a0, a1, color }` sector objects.
10. **The `LinearGaugeEngine.createRenderer(spec)` accepts a `buildSectors(props, minV, maxV, axis, valueApi, theme)` callback.** The callback returns an array of `{ from, to, color }` value-domain sector objects.
11. **Radial and linear sector formats differ.** Radial uses `{ a0, a1, color }` (angle domain); linear uses `{ from, to, color }` (value domain). Both engines convert internally.
12. **`RendererPropsWidget` wraps canvas widgets for the router.** It merges `rendererProps` into the top-level props via `{ ...p, ...p.rendererProps }`. All existing canvas gauge widgets use this pattern.
13. **Easing is a top-level prop, not in `rendererProps`.** Both engines read `p.easing !== false` directly. The `easing` editable parameter lands in top-level props without mapper intervention.
14. **The dyn kind catalog has no `default` cluster entries.** `ClusterKindCatalog.js` contains no `cluster: "default"` entries.
15. **The dyn mapper registry has no `default` mapper.** `ClusterMapperRegistry.js` lists `courseHeading`, `speed`, `environment`, `wind`, `nav`, `map`, `anchor`, `vessel` only.
16. **`makePerKindTextParams(KIND_MAP)` generates per-kind caption/unit editables from a kind map.** All existing clusters use this pattern. The toolkit resolves captions via `p["caption_" + kindName]`.
17. **`resolveStandardSemicircleTickSteps(range)` provides automatic tick sizing.** It uses the `standard` profile with range-based step selection. This is the correct tick profile for a generic gauge.
18. **The `ThreeValueTextWidget` is reused by multiple clusters for text-mode kinds.** `cog`, `hdt`, `sog`, `depth`, `temp`, `voltage`, `clock`, `pitch`, `roll`, etc. all route to it. No new renderer is needed for the Default `text` kind.
19. **`MapperOutputViewModel` is the default viewmodel.** All canvas-dom and simple text kinds use it. No custom viewmodel is needed for the Default cluster.
20. **Existing gauge widgets use prefixed prop names to avoid collisions.** For example, `speedRadialMinValue`, `depthLinearTickMajor`. The Default cluster must use its own prefix (`defaultRadial*`, `defaultLinear*`).
21. **The `condition` system supports AND logic via multiple keys in one object.** `{ kind: "depthRadial", depthRadialAlarmEnabled: true }` means "show only when kind is depthRadial AND alarm is enabled." This is needed for conditional sector threshold/color visibility.
22. **`VoltageLinearWidget` already implements low-end sectors with custom logic inline.** It uses `RadialValueMath.clamp` and builds `{ from, to, color }` sector objects directly. The Default linear widget will combine both low-end and high-end logic.
23. **`VoltageRadialWidget` uses `buildHighEndSectors` with theme colors only.** `DepthRadialWidget` and `DepthLinearWidget` use `buildLowEndSectors`. The Default widgets need to combine both builders and pass user-provided colors instead of theme colors.

---

## Scope

### Included

- `default/text` cluster kind routed to `ThreeValueTextWidget`
- `default/linearGauge` cluster kind routed to a new `DefaultLinearWidget`
- `default/radialGauge` cluster kind routed to a new `DefaultRadialWidget`
- `DefaultMapper` as a thin pass-through mapper
- `KEY`-type editable for store key selection across all kinds
- built-in AvNav `formatter: true` and `formatterParameters: true`
- per-kind caption and unit via `makePerKindTextParams`
- four-sector model for both gauge kinds (alarmLow, warningLow, warningHigh, alarmHigh)
- per-sector enable toggle, threshold value, and COLOR editable
- min/max range, major/minor ticks, show end labels for both gauge kinds
- easing toggle for both gauge kinds
- `stableDigits` for all kinds
- `captionUnitScale` for all kinds
- internal ratio-threshold editables for all kinds
- regression tests, roadmap update, and documentation

### Excluded

- interaction / bridge actions — the Default cluster is fully passive
- theme-token additions — sector colors are per-instance editables, not theme-owned
- canvas compass or full-circle radial variants
- HTML-surface widgets — all three kinds use `canvas-dom`
- `CombinedWidget` or multi-value layouts
- any AvNav core edit

---

## Source Anchors

### AvNav source anchors

- `viewer/components/WidgetList.js`
- `viewer/util/EditableParameter.js`

### dyninstruments source anchors

- `config/clusters/environment.js`
- `config/clusters/vessel.js`
- `config/shared/kind-defaults.js`
- `config/shared/editable-param-utils.js`
- `config/components/registry-cluster.js`
- `config/components/registry-widgets.js`
- `cluster/mappers/ClusterMapperRegistry.js`
- `cluster/mappers/ClusterMapperToolkit.js`
- `cluster/mappers/SpeedMapper.js`
- `cluster/mappers/EnvironmentMapper.js`
- `cluster/mappers/VesselMapper.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `cluster/rendering/RendererPropsWidget.js`
- `shared/widget-kits/radial/RadialValueMath.js`
- `shared/widget-kits/radial/SemicircleRadialEngine.js`
- `shared/widget-kits/linear/LinearGaugeEngine.js`
- `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js`
- `widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js`
- `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`
- `documentation/guides/add-new-cluster.md`
- `documentation/avnav-api/editable-parameters.md`
- `ROADMAP.md`

---

## Concept Specification

This section is the authoritative configuration, mapping, and rendering specification for `dyni_Default_Instruments`.

### Kind list

| Kind | Renderer | Surface | ViewModel |
|---|---|---|---|
| `text` | `ThreeValueTextWidget` | `canvas-dom` | `MapperOutputViewModel` |
| `linearGauge` | `DefaultLinearWidget` | `canvas-dom` | `MapperOutputViewModel` |
| `radialGauge` | `DefaultRadialWidget` | `canvas-dom` | `MapperOutputViewModel` |

### Tuple contracts

```javascript
{ cluster: "default", kind: "text", viewModelId: "MapperOutputViewModel", rendererId: "ThreeValueTextWidget", surface: "canvas-dom" }
{ cluster: "default", kind: "linearGauge", viewModelId: "MapperOutputViewModel", rendererId: "DefaultLinearWidget", surface: "canvas-dom" }
{ cluster: "default", kind: "radialGauge", viewModelId: "MapperOutputViewModel", rendererId: "DefaultRadialWidget", surface: "canvas-dom" }
```

### Cluster config contract

`config/clusters/default.js` registers a single `ClusterWidget` cluster with `cluster: "default"`.

Required:

- `name: "dyni_Default_Instruments"`
- `description: "Self-configurable instrument for any store value"`
- `cluster: "default"`
- `storeKeys: {}` (empty — all keys are dynamic via `updateFunction`)
- `caption: ""`, `unit: ""`, `default: "---"`
- `editableParameters` as inventoried below
- `updateFunction` that wires `storeKeys.value` from the user-selected KEY path

### Editable parameter inventory

#### Kind selector

```
kind: { type: "SELECT", list: [...], default: "text", name: "Instrument" }
```

Options:
- `opt("Numeric display", "text")`
- `opt("Linear gauge", "linearGauge")`
- `opt("Radial gauge", "radialGauge")`

#### Store key

```
value: { type: "KEY", default: "", name: "Store path" }
```

No condition — shown for all kinds.

#### Built-in AvNav editables

```
caption: false
unit: false
formatter: true
formatterParameters: true
className: true
```

`caption` and `unit` are suppressed because per-kind caption/unit editables replace them. `formatter` and `formatterParameters` are enabled — the user picks the data formatter.

#### Per-kind caption/unit (via `makePerKindTextParams`)

```javascript
DEFAULT_KIND: {
  text: { cap: "VALUE", unit: "" },
  linearGauge: { cap: "VALUE", unit: "" },
  radialGauge: { cap: "VALUE", unit: "" }
}
```

#### Shared editables (all kinds)

```
captionUnitScale: { type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8, name: "Caption/Unit size" }
stableDigits: { type: "BOOLEAN", default: false, name: "Stable digits" }
```

#### Text-kind ratio thresholds (internal)

```
ratioThresholdNormal: { type: "FLOAT", ..., default: 1.0, internal: true, condition: { kind: "text" } }
ratioThresholdFlat: { type: "FLOAT", ..., default: 3.0, internal: true, condition: { kind: "text" } }
```

#### Linear gauge editables

All conditioned to `{ kind: "linearGauge" }` unless noted otherwise.

Range and ticks:
```
defaultLinearMinValue: { type: "FLOAT", min: -10000, max: 10000, step: 0.5, default: 0, name: "Min value" }
defaultLinearMaxValue: { type: "FLOAT", min: -10000, max: 10000, step: 0.5, default: 100, name: "Max value" }
defaultLinearTickMajor: { type: "FLOAT", min: 0.1, max: 10000, step: 0.1, default: 10, name: "Major tick step" }
defaultLinearTickMinor: { type: "FLOAT", min: 0.01, max: 5000, step: 0.01, default: 2, name: "Minor tick step" }
defaultLinearShowEndLabels: { type: "BOOLEAN", default: false, name: "Show min/max labels" }
```

Easing:
```
easing: { type: "BOOLEAN", default: true, name: "Smooth motion", condition: [{ kind: "linearGauge" }, { kind: "radialGauge" }] }
```

Sector toggles:
```
defaultLinearAlarmLowEnabled: { type: "BOOLEAN", default: false, name: "Low alarm sector" }
defaultLinearWarningLowEnabled: { type: "BOOLEAN", default: false, name: "Low warning sector" }
defaultLinearWarningHighEnabled: { type: "BOOLEAN", default: false, name: "High warning sector" }
defaultLinearAlarmHighEnabled: { type: "BOOLEAN", default: false, name: "High alarm sector" }
```

Sector thresholds (conditional on their enable toggle):
```
defaultLinearAlarmLowAt: { type: "FLOAT", ..., default: 10, name: "Low alarm at or below", condition: { kind: "linearGauge", defaultLinearAlarmLowEnabled: true } }
defaultLinearWarningLowAt: { type: "FLOAT", ..., default: 20, name: "Low warning at or below", condition: { kind: "linearGauge", defaultLinearWarningLowEnabled: true } }
defaultLinearWarningHighAt: { type: "FLOAT", ..., default: 80, name: "High warning at or above", condition: { kind: "linearGauge", defaultLinearWarningHighEnabled: true } }
defaultLinearAlarmHighAt: { type: "FLOAT", ..., default: 90, name: "High alarm at or above", condition: { kind: "linearGauge", defaultLinearAlarmHighEnabled: true } }
```

Sector colors (conditional on their enable toggle):
```
defaultLinearAlarmLowColor: { type: "COLOR", default: "rgba(200, 50, 50, 0.75)", name: "Low alarm color", condition: { kind: "linearGauge", defaultLinearAlarmLowEnabled: true } }
defaultLinearWarningLowColor: { type: "COLOR", default: "rgba(200, 180, 0, 0.75)", name: "Low warning color", condition: { kind: "linearGauge", defaultLinearWarningLowEnabled: true } }
defaultLinearWarningHighColor: { type: "COLOR", default: "rgba(200, 180, 0, 0.75)", name: "High warning color", condition: { kind: "linearGauge", defaultLinearWarningHighEnabled: true } }
defaultLinearAlarmHighColor: { type: "COLOR", default: "rgba(200, 50, 50, 0.75)", name: "High alarm color", condition: { kind: "linearGauge", defaultLinearAlarmHighEnabled: true } }
```

Internal ratio thresholds:
```
defaultLinearRatioThresholdNormal: { ..., default: 1.1, internal: true, condition: { kind: "linearGauge" } }
defaultLinearRatioThresholdFlat: { ..., default: 3.5, internal: true, condition: { kind: "linearGauge" } }
```

#### Radial gauge editables

All conditioned to `{ kind: "radialGauge" }` unless noted otherwise.

Range and ticks:
```
defaultRadialMinValue: { type: "FLOAT", min: -10000, max: 10000, step: 0.5, default: 0, name: "Min value" }
defaultRadialMaxValue: { type: "FLOAT", min: -10000, max: 10000, step: 0.5, default: 100, name: "Max value" }
defaultRadialTickMajor: { type: "FLOAT", min: 0.1, max: 10000, step: 0.1, default: 10, name: "Major tick step" }
defaultRadialTickMinor: { type: "FLOAT", min: 0.01, max: 5000, step: 0.01, default: 2, name: "Minor tick step" }
defaultRadialShowEndLabels: { type: "BOOLEAN", default: false, name: "Show min/max labels" }
```

Sector toggles:
```
defaultRadialAlarmLowEnabled: { type: "BOOLEAN", default: false, name: "Low alarm sector" }
defaultRadialWarningLowEnabled: { type: "BOOLEAN", default: false, name: "Low warning sector" }
defaultRadialWarningHighEnabled: { type: "BOOLEAN", default: false, name: "High warning sector" }
defaultRadialAlarmHighEnabled: { type: "BOOLEAN", default: false, name: "High alarm sector" }
```

Sector thresholds (conditional on their enable toggle):
```
defaultRadialAlarmLowAt: { type: "FLOAT", ..., default: 10, name: "Low alarm at or below", condition: { kind: "radialGauge", defaultRadialAlarmLowEnabled: true } }
defaultRadialWarningLowAt: { type: "FLOAT", ..., default: 20, name: "Low warning at or below", condition: { kind: "radialGauge", defaultRadialWarningLowEnabled: true } }
defaultRadialWarningHighAt: { type: "FLOAT", ..., default: 80, name: "High warning at or above", condition: { kind: "radialGauge", defaultRadialWarningHighEnabled: true } }
defaultRadialAlarmHighAt: { type: "FLOAT", ..., default: 90, name: "High alarm at or above", condition: { kind: "radialGauge", defaultRadialAlarmHighEnabled: true } }
```

Sector colors (conditional on their enable toggle):
```
defaultRadialAlarmLowColor: { type: "COLOR", default: "rgba(200, 50, 50, 0.75)", name: "Low alarm color", condition: { kind: "radialGauge", defaultRadialAlarmLowEnabled: true } }
defaultRadialWarningLowColor: { type: "COLOR", default: "rgba(200, 180, 0, 0.75)", name: "Low warning color", condition: { kind: "radialGauge", defaultRadialWarningLowEnabled: true } }
defaultRadialWarningHighColor: { type: "COLOR", default: "rgba(200, 180, 0, 0.75)", name: "High warning color", condition: { kind: "radialGauge", defaultRadialWarningHighEnabled: true } }
defaultRadialAlarmHighColor: { type: "COLOR", default: "rgba(200, 50, 50, 0.75)", name: "High alarm color", condition: { kind: "radialGauge", defaultRadialAlarmHighEnabled: true } }
```

Internal ratio thresholds:
```
defaultRadialRatioThresholdNormal: { ..., default: 1.1, internal: true, condition: { kind: "radialGauge" } }
defaultRadialRatioThresholdFlat: { ..., default: 3.5, internal: true, condition: { kind: "radialGauge" } }
```

### updateFunction contract

The `updateFunction` must:

1. read `kind` from values (default: `"text"`)
2. if `value` is a non-empty string, wire `storeKeys.value` to that path
3. otherwise remove `storeKeys.value` if present
4. return the updated values object

This is the same pattern as the environment cluster's pressure KEY handling, but without kind-conditional gating — all three kinds use the same `value` store key.

### Mapper contract

`DefaultMapper` is a thin pass-through. No domain normalization, no custom viewmodel.

For `kind: "text"`:
```javascript
return toolkit.out(p.value, cap("text"), unit("text"));
```

The mapper does NOT set `formatter` or `formatterParameters` — these are left to the user's editable selections, which AvNav merges into props automatically.

For `kind: "linearGauge"`:
```javascript
return {
  renderer: "DefaultLinearWidget",
  value: p.value,
  caption: cap("linearGauge"),
  unit: unit("linearGauge"),
  rendererProps: {
    defaultLinearMinValue, defaultLinearMaxValue,
    defaultLinearTickMajor, defaultLinearTickMinor,
    defaultLinearShowEndLabels,
    defaultLinearAlarmLowEnabled, defaultLinearAlarmLowAt, defaultLinearAlarmLowColor,
    defaultLinearWarningLowEnabled, defaultLinearWarningLowAt, defaultLinearWarningLowColor,
    defaultLinearWarningHighEnabled, defaultLinearWarningHighAt, defaultLinearWarningHighColor,
    defaultLinearAlarmHighEnabled, defaultLinearAlarmHighAt, defaultLinearAlarmHighColor,
    defaultLinearRatioThresholdNormal, defaultLinearRatioThresholdFlat,
    captionUnitScale
  }
};
```

For `kind: "radialGauge"`:
```javascript
return {
  renderer: "DefaultRadialWidget",
  value: p.value,
  caption: cap("radialGauge"),
  unit: unit("radialGauge"),
  rendererProps: {
    defaultRadialMinValue, defaultRadialMaxValue,
    defaultRadialTickMajor, defaultRadialTickMinor,
    defaultRadialShowEndLabels,
    defaultRadialAlarmLowEnabled, defaultRadialAlarmLowAt, defaultRadialAlarmLowColor,
    defaultRadialWarningLowEnabled, defaultRadialWarningLowAt, defaultRadialWarningLowColor,
    defaultRadialWarningHighEnabled, defaultRadialWarningHighAt, defaultRadialWarningHighColor,
    defaultRadialAlarmHighEnabled, defaultRadialAlarmHighAt, defaultRadialAlarmHighColor,
    defaultRadialRatioThresholdNormal, defaultRadialRatioThresholdFlat,
    captionUnitScale
  }
};
```

All numeric rendererProps values are passed through `toolkit.num()`. Boolean values use `!!p.propName`. COLOR values are passed as-is (strings).

### Sector-building contract

Both gauge widgets implement a custom `buildSectors` callback that combines low-end and high-end sectors using user-provided colors instead of theme colors.

#### Radial sector builder

The `buildSectors(props, minV, maxV, arc, valueUtils, theme)` callback:

1. check `props.defaultRadialAlarmLowEnabled` — if truthy:
   - build alarm-low sector from `minV` to `props.defaultRadialAlarmLowAt` using `props.defaultRadialAlarmLowColor`
   - use `RadialValueMath.sectorAngles(minV, alarmLowAt, minV, maxV, arc)` for angle conversion
2. check `props.defaultRadialWarningLowEnabled` — if truthy:
   - build warning-low sector from `alarmLowAt` (or `minV` if no alarm-low) to `props.defaultRadialWarningLowAt` using `props.defaultRadialWarningLowColor`
3. check `props.defaultRadialWarningHighEnabled` — if truthy:
   - build warning-high sector from `props.defaultRadialWarningHighAt` to `alarmHighAt` (or `maxV` if no alarm-high) using `props.defaultRadialWarningHighColor`
4. check `props.defaultRadialAlarmHighEnabled` — if truthy:
   - build alarm-high sector from `props.defaultRadialAlarmHighAt` to `maxV` using `props.defaultRadialAlarmHighColor`
5. return all non-null sectors as `[{ a0, a1, color }, ...]`

If a sector's `sectorAngles()` call returns null (degenerate range), that sector is omitted.

#### Linear sector builder

The `buildSectors(props, minV, maxV, axis, valueApi, theme)` callback follows the same four-sector logic but returns `[{ from, to, color }, ...]` value-domain objects:

1. alarm-low: `{ from: clamp(minV, axis.min, axis.max), to: clamp(alarmLowAt, axis.min, axis.max), color: alarmLowColor }`
2. warning-low: `{ from: alarmLowAt (or minV), to: clamp(warningLowAt, axis.min, axis.max), color: warningLowColor }`
3. warning-high: `{ from: clamp(warningHighAt, axis.min, axis.max), to: alarmHighAt (or maxV), color: warningHighColor }`
4. alarm-high: `{ from: clamp(alarmHighAt, axis.min, axis.max), to: clamp(maxV, axis.min, axis.max), color: alarmHighColor }`

Degenerate sectors (where `to <= from`) are filtered out.

### Widget renderer contracts

#### `DefaultRadialWidget`

- module pattern: UMD with `DyniDefaultRadialWidget` global key
- depends: `SemicircleRadialEngine`, `RadialValueMath`, `PlaceholderNormalize`
- follows the exact pattern of `SpeedRadialWidget.js`
- `createRenderer(spec)` config:
  - `rawValueKey: "value"`
  - `unitDefault: ""`
  - `rangeProps: { min: "defaultRadialMinValue", max: "defaultRadialMaxValue" }`
  - `tickProps: { major: "defaultRadialTickMajor", minor: "defaultRadialTickMinor", showEndLabels: "defaultRadialShowEndLabels" }`
  - `ratioProps: { normal: "defaultRadialRatioThresholdNormal", flat: "defaultRadialRatioThresholdFlat" }`
  - `tickSteps: valueMath.resolveStandardSemicircleTickSteps`
  - `formatDisplay`: uses `Helpers.applyFormatter` with user-provided `props.formatter` and `props.formatterParameters`
  - `buildSectors`: custom four-sector builder as specified above
- `getVerticalShellSizing`: `{ kind: "ratio", aspectRatio: 1 }`

#### `DefaultLinearWidget`

- module pattern: UMD with `DyniDefaultLinearWidget` global key
- depends: `LinearGaugeEngine`, `RadialValueMath`, `PlaceholderNormalize`
- follows the exact pattern of `VoltageLinearWidget.js`
- `createRenderer(spec)` config:
  - `rawValueKey: "value"`
  - `unitDefault: ""`
  - `axisMode: "range"`
  - `rangeProps: { min: "defaultLinearMinValue", max: "defaultLinearMaxValue" }`
  - `tickProps: { major: "defaultLinearTickMajor", minor: "defaultLinearTickMinor", showEndLabels: "defaultLinearShowEndLabels" }`
  - `ratioProps: { normal: "defaultLinearRatioThresholdNormal", flat: "defaultLinearRatioThresholdFlat" }`
  - `tickSteps: valueMath.resolveStandardSemicircleTickSteps`
  - `formatDisplay`: uses `Helpers.applyFormatter` with user-provided `props.formatter` and `props.formatterParameters`
  - `buildSectors`: custom four-sector builder as specified above
- `getVerticalShellSizing`: `{ kind: "ratio", aspectRatio: 2 }`

### Formatter pass-through contract

Both gauge widgets use `Helpers.applyFormatter(n, { formatter, formatterParameters, default: defaultText })` where `formatter` and `formatterParameters` come from the user's editable selections in props. If the user has not selected a formatter, AvNav provides no formatter and the widget falls back to `String(value)`. The `PlaceholderNormalize` module is applied to the formatted output as in all existing gauge widgets.

---

## Hard Constraints

- **No AvNav core edits.**
- **No theme-token additions.** Sector colors are per-instance editables, not `ThemeModel`-owned tokens.
- **No custom viewmodel.** All three kinds use `MapperOutputViewModel`.
- **No HTML-surface widgets.** All three kinds use `canvas-dom`.
- **No interaction / bridge actions.** The cluster is fully passive.
- **Sector colors must be `COLOR`-type editables**, not theme colors. This is the explicit design intent for per-instance independence.
- **The mapper does NOT set `formatter` or `formatterParameters`.** The user's editable selection is the source of truth.
- **Prefixed prop names.** Gauge-specific props use `defaultLinear*` / `defaultRadial*` prefixes to avoid collision with other clusters' prop names.
- **No file exceeds 400 non-empty lines.** Split helpers as needed.
- **Every new and modified file retains its Module/Documentation/Depends header.**
- **`npm run check:all` must pass at the end.**

---

## Implementation Order

### Mandatory preflight

Read these files before any code changes:

- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/guides/add-new-cluster.md`
- `documentation/avnav-api/editable-parameters.md`
- `documentation/radial/gauge-shared-api.md`
- `documentation/linear/linear-shared-api.md`

### Phase 1 — Register `default` cluster config and lock the catalog/router scaffolding

#### Intent

Create the cluster config, kind-defaults, catalog entries, mapper, and all registry/router wiring so the three kinds are known end-to-end before any widget implementation.

#### Files to create

- `config/clusters/default.js`
- `cluster/mappers/DefaultMapper.js`

#### Files to modify

- `config/shared/kind-defaults.js`
- `cluster/rendering/ClusterKindCatalog.js`
- `cluster/mappers/ClusterMapperRegistry.js`
- `config/components/registry-cluster.js`

#### Tasks

1. **`config/shared/kind-defaults.js`**
   - add `DEFAULT_KIND` to `shared.kindMaps`:
     ```javascript
     DEFAULT_KIND: {
       text: { cap: "VALUE", unit: "" },
       linearGauge: { cap: "VALUE", unit: "" },
       radialGauge: { cap: "VALUE", unit: "" }
     }
     ```

2. **`config/clusters/default.js`**
   - push a new `ClusterWidget` entry to `config.clusters`
   - `name: "dyni_Default_Instruments"`
   - `cluster: "default"`
   - `storeKeys: {}` — empty, all keys are dynamic
   - all editableParameters as inventoried in the Concept Specification
   - `updateFunction` wiring `storeKeys.value` from the user-selected KEY path
   - use `makePerKindTextParams(DEFAULT_KIND)` for per-kind caption/unit
   - `formatter: true`, `formatterParameters: true`, `caption: false`, `unit: false`, `className: true`

3. **`cluster/rendering/ClusterKindCatalog.js`**
   - add three entries under a `// default` comment block:
     ```javascript
     { cluster: "default", kind: "text", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
     { cluster: "default", kind: "linearGauge", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "DefaultLinearWidget", surface: "canvas-dom" },
     { cluster: "default", kind: "radialGauge", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "DefaultRadialWidget", surface: "canvas-dom" }
     ```

4. **`cluster/mappers/DefaultMapper.js`**
   - thin pass-through mapper with `cluster: "default"`
   - `translate(props, toolkit)` handles three kinds as specified in the mapper contract
   - does NOT set `formatter` or `formatterParameters`
   - passes gauge-specific props through `rendererProps`

5. **`cluster/mappers/ClusterMapperRegistry.js`**
   - add `default: "DefaultMapper"` to `MAPPER_MODULE_IDS`
   - update the `Depends` header to include `DefaultMapper`

6. **`config/components/registry-cluster.js`**
   - add `DefaultMapper` entry:
     ```javascript
     DefaultMapper: {
       js: BASE + "cluster/mappers/DefaultMapper.js",
       css: undefined,
       globalKey: "DyniDefaultMapper"
     }
     ```
   - add `"DefaultMapper"` to `ClusterMapperRegistry.deps`

#### Exit criteria

- `default/text`, `default/linearGauge`, `default/radialGauge` are known kinds at config/catalog/router/mapper level.
- The kind catalog and mapper registry accept the new cluster.
- Component loader knows DefaultMapper exists.

### Phase 2 — Build `DefaultRadialWidget`

#### Intent

Implement the semicircle radial gauge renderer with four-sector support and user-selectable formatting.

#### Files to create

- `widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js`

#### Files to modify

- `config/components/registry-widgets.js`
- `cluster/rendering/ClusterRendererRouter.js`

#### Tasks

1. **`widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js`**
   - follow `SpeedRadialWidget.js` structure exactly
   - depends: `SemicircleRadialEngine`, `RadialValueMath`, `PlaceholderNormalize`
   - `rawValueKey: "value"`, `unitDefault: ""`
   - `formatDisplay`: read `props.formatter` and `props.formatterParameters` from the user's selections; call `Helpers.applyFormatter` if a formatter is present; fall back to `String(value)` otherwise
   - `buildSectors`: implement the four-sector builder using `RadialValueMath.sectorAngles` with user-provided COLOR values from props
   - `tickSteps: valueMath.resolveStandardSemicircleTickSteps`
   - `getVerticalShellSizing`: `{ kind: "ratio", aspectRatio: 1 }`

2. **`config/components/registry-widgets.js`**
   - add `DefaultRadialWidget` entry:
     ```javascript
     DefaultRadialWidget: {
       js: BASE + "widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js",
       css: undefined,
       globalKey: "DyniDefaultRadialWidget",
       deps: ["SemicircleRadialEngine", "RadialValueMath", "PlaceholderNormalize"]
     }
     ```
   - add `"DefaultRadialWidget"` to `RendererPropsWidget.deps`

3. **`cluster/rendering/ClusterRendererRouter.js`**
   - add `DefaultRadialWidget` to the `rendererSpecs` via `rendererPropsWidget.create(def, Helpers, "DefaultRadialWidget")`
   - update the `Depends` header to include `DefaultRadialWidget`

#### Exit criteria

- `default/radialGauge` renders a semicircle gauge with user-configured range, ticks, sectors, and formatting.
- Four optional sectors with user-picked colors render correctly.

### Phase 3 — Build `DefaultLinearWidget`

#### Intent

Implement the linear bar gauge renderer with four-sector support and user-selectable formatting.

#### Files to create

- `widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js`

#### Files to modify

- `config/components/registry-widgets.js`
- `cluster/rendering/ClusterRendererRouter.js`

#### Tasks

1. **`widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js`**
   - follow `VoltageLinearWidget.js` structure exactly
   - depends: `LinearGaugeEngine`, `RadialValueMath`, `PlaceholderNormalize`
   - `rawValueKey: "value"`, `unitDefault: ""`, `axisMode: "range"`
   - `formatDisplay`: same user-formatter pass-through as DefaultRadialWidget
   - `buildSectors`: implement the four-sector builder returning `{ from, to, color }` objects with user-provided COLOR values from props; filter degenerate sectors
   - `tickSteps: valueMath.resolveStandardSemicircleTickSteps`
   - `getVerticalShellSizing`: `{ kind: "ratio", aspectRatio: 2 }`

2. **`config/components/registry-widgets.js`**
   - add `DefaultLinearWidget` entry:
     ```javascript
     DefaultLinearWidget: {
       js: BASE + "widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js",
       css: undefined,
       globalKey: "DyniDefaultLinearWidget",
       deps: ["LinearGaugeEngine", "RadialValueMath", "PlaceholderNormalize"]
     }
     ```
   - add `"DefaultLinearWidget"` to `RendererPropsWidget.deps`

3. **`cluster/rendering/ClusterRendererRouter.js`**
   - add `DefaultLinearWidget` to the `rendererSpecs` via `rendererPropsWidget.create(def, Helpers, "DefaultLinearWidget")`
   - update the `Depends` header to include `DefaultLinearWidget`

#### Exit criteria

- `default/linearGauge` renders a horizontal bar gauge with user-configured range, ticks, sectors, and formatting.
- Four optional sectors with user-picked colors render correctly.

### Phase 4 — Tests, roadmap, and documentation

#### Intent

Complete the implementation with regression coverage and explicit documentation.

#### Files to create

- `tests/config/clusters/default.test.js`
- `tests/cluster/mappers/DefaultMapper.test.js`
- `tests/widgets/radial/DefaultRadialWidget.test.js`
- `tests/widgets/linear/DefaultLinearWidget.test.js`

#### Files to modify

- `tests/cluster/rendering/ClusterKindCatalog.test.js`
- `tests/cluster/rendering/ClusterRendererRouter.test.js`
- `tests/cluster/mappers/ClusterMapperRegistry.test.js`
- `tests/config/shared/kind-defaults.test.js`
- `ROADMAP.md`
- `documentation/widgets/` (create a Default Instruments page)

#### Tasks

1. **Cluster config tests** (`tests/config/clusters/default.test.js`)
   - cluster registers with `name: "dyni_Default_Instruments"` and `cluster: "default"`
   - kind selector offers `text`, `linearGauge`, `radialGauge`
   - `value` KEY editable exists without kind condition
   - `formatter: true` and `formatterParameters: true` are set
   - `caption: false`, `unit: false`
   - per-kind caption/unit editables exist for all three kinds
   - sector enable toggles default to `false` for both gauge kinds
   - sector threshold/color editables are conditionally visible on their enable toggle
   - `updateFunction` wires `storeKeys.value` from the KEY editable
   - `updateFunction` removes `storeKeys.value` when the KEY editable is empty

2. **Mapper tests** (`tests/cluster/mappers/DefaultMapper.test.js`)
   - text kind returns `{ value, caption, unit }` without `formatter` or `formatterParameters`
   - linearGauge kind returns `{ renderer: "DefaultLinearWidget", rendererProps: { ... } }`
   - radialGauge kind returns `{ renderer: "DefaultRadialWidget", rendererProps: { ... } }`
   - gauge rendererProps pass through numeric values via `num()` and booleans via `!!`
   - COLOR props pass through as strings
   - missing kind returns empty object

3. **Radial widget tests** (`tests/widgets/radial/DefaultRadialWidget.test.js`)
   - widget has `id: "DefaultRadialWidget"`
   - `getVerticalShellSizing` returns `{ kind: "ratio", aspectRatio: 1 }`
   - `wantsHideNativeHead` is `true`
   - `buildSectors` with all sectors disabled returns empty array
   - `buildSectors` with one high-end sector returns one sector with the user-provided color
   - `buildSectors` with all four sectors returns four properly ordered sectors
   - `buildSectors` with degenerate range (threshold at min or max) omits that sector
   - `formatDisplay` uses the user-provided formatter when present
   - `formatDisplay` falls back to string conversion when no formatter is set

4. **Linear widget tests** (`tests/widgets/linear/DefaultLinearWidget.test.js`)
   - same structure as radial tests but verifying `{ from, to, color }` sector format
   - `getVerticalShellSizing` returns `{ kind: "ratio", aspectRatio: 2 }`

5. **Extended tests for modified modules**
   - `ClusterKindCatalog.test.js`: verify all three `default/*` entries resolve correctly
   - `ClusterRendererRouter.test.js`: verify `DefaultRadialWidget` and `DefaultLinearWidget` are resolvable renderer specs
   - `ClusterMapperRegistry.test.js`: verify `default` cluster maps to `DefaultMapper`
   - `kind-defaults.test.js`: verify `DEFAULT_KIND` exists with the correct entries

6. **Roadmap and docs**
   - update `ROADMAP.md`:
     - mark `Default` as covered in the coverage matrix: `dyni_Default_Instruments → text / linearGauge / radialGauge`
     - remove or mark the Default Instruments roadmap item as complete
   - create `documentation/widgets/default-instruments.md` documenting:
     - available kinds
     - editable parameter summary
     - sector configuration
     - formatter usage
     - example store paths for common external plugin values

#### Exit criteria

- Regression coverage exists for config, mapper, both widget renderers, catalog, router, and registry.
- ROADMAP and docs match the shipped scope.
- `npm run check:all` passes.

---

## Affected File Map

| File | Phase | Action |
|---|---:|---|
| `config/shared/kind-defaults.js` | 1 | Add `DEFAULT_KIND` |
| `config/clusters/default.js` | 1 | New cluster config |
| `cluster/rendering/ClusterKindCatalog.js` | 1 | Add three `default/*` tuples |
| `cluster/mappers/DefaultMapper.js` | 1 | New pass-through mapper |
| `cluster/mappers/ClusterMapperRegistry.js` | 1 | Register DefaultMapper |
| `config/components/registry-cluster.js` | 1 | Register DefaultMapper; add to ClusterMapperRegistry.deps |
| `widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js` | 2 | New radial gauge renderer |
| `config/components/registry-widgets.js` | 2, 3 | Register DefaultRadialWidget, DefaultLinearWidget; add to RendererPropsWidget.deps |
| `cluster/rendering/ClusterRendererRouter.js` | 2, 3 | Add both new renderers to rendererSpecs; update Depends header |
| `widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js` | 3 | New linear gauge renderer |
| `tests/config/clusters/default.test.js` | 4 | New tests |
| `tests/cluster/mappers/DefaultMapper.test.js` | 4 | New tests |
| `tests/widgets/radial/DefaultRadialWidget.test.js` | 4 | New tests |
| `tests/widgets/linear/DefaultLinearWidget.test.js` | 4 | New tests |
| `tests/cluster/rendering/ClusterKindCatalog.test.js` | 4 | Extend tests |
| `tests/cluster/rendering/ClusterRendererRouter.test.js` | 4 | Extend tests |
| `tests/cluster/mappers/ClusterMapperRegistry.test.js` | 4 | Extend tests |
| `tests/config/shared/kind-defaults.test.js` | 4 | Extend tests |
| `ROADMAP.md` | 4 | Mark Default as covered |
| `documentation/widgets/default-instruments.md` | 4 | New documentation |

---

## Don'ts

- Do not edit AvNav core files.
- Do not add theme tokens for sector colors — they are per-instance editables by design.
- Do not build a custom viewmodel — `MapperOutputViewModel` is sufficient.
- Do not set `formatter` or `formatterParameters` in the mapper output — the user's selection is authoritative.
- Do not use theme colors (`theme.colors.warning`, `theme.colors.alarm`) for Default widget sectors — use the user-provided `COLOR` editable values.
- Do not create HTML-surface renderers for the Default cluster.
- Do not add interaction or bridge actions.
- Do not reuse existing domain-specific widget renderers (e.g., `SpeedRadialWidget`) for Default kinds — the Default kinds need their own renderers with independent prop prefixes and four-sector support.
- Do not use unprefixed prop names for gauge-specific settings — collision with other clusters' prop names must be prevented.
- Do not gate the `value` KEY editable behind a kind condition — all three kinds need it.

---

## Deployment Boundaries

This plan ships the entire Default Instruments cluster in one rollout.

Specifically:

- implemented: `dyni_Default_Instruments` → `kind: "text"`, `kind: "linearGauge"`, `kind: "radialGauge"`
- implemented: four-sector model with user-configurable colors for both gauge kinds
- implemented: user-selectable formatter and store key for all kinds
- not implemented: full-circle radial variant
- not implemented: HTML-surface alternative renderers
- not implemented: interactive features or bridge actions
- not implemented: compass-mode variants

The plan is complete when all three kinds render correctly, sectors are independently configurable per widget instance, and the user can point any kind at any AvNav store key with any registered formatter.

---

## Acceptance Criteria

This plan is complete only when all of the following are true:

1. `dyni_Default_Instruments` registers as a `ClusterWidget` with `cluster: "default"`.
2. The kind selector offers `text`, `linearGauge`, `radialGauge`.
3. `default/text` routes to `ThreeValueTextWidget` via `canvas-dom`.
4. `default/linearGauge` routes to `DefaultLinearWidget` via `canvas-dom`.
5. `default/radialGauge` routes to `DefaultRadialWidget` via `canvas-dom`.
6. The `value` KEY editable is shown for all three kinds.
7. The `formatter` and `formatterParameters` built-in editables are enabled.
8. Per-kind caption/unit editables exist for all three kinds with default caption `"VALUE"`.
9. Both gauge kinds offer four sector enable toggles, all defaulting to `false`.
10. Enabling a sector reveals its threshold (`FLOAT`) and color (`COLOR`) editables.
11. Sector colors use `COLOR`-type editables with color picker UI.
12. Default sector colors are `"rgba(200, 50, 50, 0.75)"` for alarm and `"rgba(200, 180, 0, 0.75)"` for warning.
13. Both gauge kinds render sectors with the user-specified colors, not theme colors.
14. Multiple Default widget instances on the same page can have independent sector colors.
15. Min/max range, major/minor ticks, and show end labels are configurable for both gauge kinds.
16. Easing is configurable for both gauge kinds (default: enabled).
17. `stableDigits` is configurable for all three kinds.
18. `captionUnitScale` is configurable for all three kinds.
19. The `DefaultRadialWidget` renders a semicircle gauge with `aspectRatio: 1`.
20. The `DefaultLinearWidget` renders a horizontal bar gauge with `aspectRatio: 2`.
21. The formatter is user-selectable — the mapper does not override it.
22. Missing or empty store key produces the placeholder text `"---"`.
23. No AvNav core files were modified.
24. No theme tokens were added for sector colors.
25. Router/registry tests prove all three renderer paths are resolvable.
26. `npm run check:all` passes.

---

## Related

- `exec-plans/completed/PLAN5.md`
- `exec-plans/completed/PLAN6.md`
- `exec-plans/completed/PLAN11.md`
- `exec-plans/active/PLAN14.md`