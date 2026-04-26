# PLAN17 — Formatter unit selector parity and unit-aware defaults

## Status

Implementation-verified final version — all gaps verified against the uploaded repository and AvNav-core snapshot. Load-order positions, environment-split file placement, toolkit catalog access, and Phase 5 scope clarified.

This plan is a refining plan that must land before the current `PLAN18.md` work. The uploaded repository currently contains `exec-plans/active/PLAN18.md` with a heading that says `PLAN17`; reconcile that numbering before committing this plan so the execution order is unambiguous.

## Goal

Give every dyninstruments widget that uses AvNav's unit-aware formatter families a visible unit selector while preserving freely editable displayed unit strings.

Formatter families in scope:

- speed: `kn`, `ms`, `kmh`
- distance/depth: `nm`, `m`, `km`, `ft`, `yd`
- temperature: `celsius`, `kelvin`
- pressure: `pa`, `hpa`, `bar`

The selected formatter unit must control numeric conversion. The displayed unit string must remain freely editable, but its default must change with the selected formatter unit.

## Repository findings

AvNav core exposes the formatter unit through `formatterParameters`. `WidgetFactory` also auto-fills the title-row unit from a formatter parameter named `unit` when the widget unit is empty. Dyninstruments hides `formatter` and `formatterParameters` for cluster widgets, so PLAN17 must expose safe, purpose-built selectors instead of exposing formatter internals.

Current dyninstruments misalignments:

- speed widgets use the free `unit_*` string as the `formatSpeed` formatter parameter, so the display label and semantic formatter token are mixed
- SOG/STW currently default to `kn`, and there is no selector to display SOG/STW in `m/s` or `km/h`
- navigation distances such as DST/RTE currently display a free `unit_*` string, but the NavMapper passes `formatDistance` with an empty parameters array, causing AvNav to silently default to `nm` regardless of the displayed unit string — a user who changes the display label to `m` sees that label but still gets nautical-mile formatting, which is a pre-existing bug that PLAN17 fixes
- map, route, anchor, AIS, XTE, route-points, and active-route distance submetrics pass display strings directly as formatter parameters
- temperature is hard-coded to `celsius`
- pressure uses the legacy alias `skPressure` with mixed-case `hPa` instead of canonical `formatPressure` with lowercase `hpa`
- depth numeric, linear, and radial renderers currently display raw meters through decimal/custom formatting instead of using `formatDistance`
- gauge scale values are interpreted in displayed units, so speed, depth, and temperature gauges need unit-specific min/max/tick/warning/alarm defaults, not just formatter selectors

## Product decisions already resolved

- Add selectors for all four formatter families: speed, distance/depth, temperature, pressure.
- Keep caption strings freely editable.
- Keep displayed unit strings freely editable.
- Do not attempt dynamic defaults for one `unit_*` string; AvNav editable defaults are static.
- Use conditional per-unit display-unit string fields, with only the field matching the selected formatter unit visible.
- Use per-displayed-metric selectors, not one broad global selector per family.
- Use per-unit numeric gauge scale fields where unit choice affects axis/tick/warning/alarm semantics.
- No compatibility or migration work is needed because the plugin is not published and not in use.
- Change depth renderers to format through `formatDistance`, not raw meters.
- Respect the 400 non-empty-line limit; split config/helper files instead of expanding large files inline.

## Public editable model

For each unit-aware metric, generate:

1. `formatUnit_<metricKey>` — a `SELECT` formatter-unit token.
2. `unit_<metricKey>_<unitToken>` — a `STRING` display-label override visible only when the metric and selected unit match.
3. Optional per-unit gauge scale fields for graphical gauges.

Example for SOG:

```js
formatUnit_sog: SELECT ["kn", "ms", "kmh"] default "kn"
unit_sog_kn:  STRING default "kn"   visible when kind=sog and formatUnit_sog=kn
unit_sog_ms:  STRING default "m/s"  visible when kind=sog and formatUnit_sog=ms
unit_sog_kmh: STRING default "km/h" visible when kind=sog and formatUnit_sog=kmh
```

The mapper passes:

```js
formatter: "formatSpeed"
formatterParameters: [formatUnit_sog]
unit: unit_sog_<selectedUnit>
```

Do not expose the generic `formatter` or `formatterParameters` editables on these cluster widgets.

## Unit label defaults

Use one shared catalog for selector tokens and default display labels:

```text
speed:
  kn  -> kn
  ms  -> m/s
  kmh -> km/h

distance:
  nm -> nm
  m  -> m
  km -> km
  ft -> ft
  yd -> yd

temperature:
  celsius -> °C
  kelvin  -> K

pressure:
  pa  -> Pa
  hpa -> hPa
  bar -> bar
```

## Metrics in scope

### Speed formatter metrics

- speed cluster: `sog`, `stw`, `sogLinear`, `stwLinear`, `sogRadial`, `stwRadial`
- nav cluster: `vmg`
- wind cluster numeric speed: `speedTrue`, `speedApparent`
- wind radial/linear speed submetrics: `angleTrueRadialSpeed`, `angleApparentRadialSpeed`, `angleTrueLinearSpeed`, `angleApparentLinearSpeed`

Wind radial/linear speed selectors affect speed value formatting and displayed speed unit only. Their angle ticks/layline settings remain degree-based and are not speed-unit gauge scales.

### Distance/depth formatter metrics

- nav cluster: `dst`, `rteDistance`, `activeRouteRemain`, `xteDisplayXte`, `xteDisplayDst`, `editRouteDst`, `editRouteRte`, `routePointsDistance`
- map cluster: `aisTargetDst`, `aisTargetCpa`, `centerDisplayMarker`, `centerDisplayBoat`, `centerDisplayMeasure`
- anchor cluster: `anchorDistance`, `anchorWatch`
- environment cluster depth: `depth`, `depthLinear`, `depthRadial`

Defaults:

- normal navigation/map/AIS/route/XTE distances: `nm`
- anchor distance/watch: `m`
- depth text/linear/radial: `m`

### Temperature formatter metrics

- environment cluster: `temp`, `tempLinear`, `tempRadial`

Default: `celsius`. Note: AvNav's own `formatTemperature` parameter default is `kelvin`; dyninstruments intentionally overrides to `celsius` as the more common marine display unit.

### Pressure formatter metrics

- environment cluster: `pressure`

Default: `hpa`, matching current dyninstruments display behavior. Note: AvNav's own `formatPressure` parameter default is `pa`; dyninstruments intentionally overrides to `hpa` as the standard meteorological unit.

## Gauge scale model

For every unit-sensitive gauge numeric setting, replace the single field with per-unit fields and resolve the selected one in the mapper.

Applies to:

- speed linear/radial: min, max, major tick, minor tick, warning-from, alarm-from
- depth linear/radial: min, max, major tick, minor tick, warning-from, alarm-from
- temperature linear/radial: min, max, major tick, minor tick, warning-from, alarm-from

Does not apply to:

- booleans such as warning enabled, alarm enabled, show end labels, hide textual metrics, smooth motion
- ratio thresholds
- caption/unit scale
- stable digits
- wind angle scale/ticks/layline settings
- pressure, because there is no pressure gauge in the current repo

The visible field names should be deterministic, for example:

```text
speedLinearMaxValue_kn
speedLinearMaxValue_ms
speedLinearMaxValue_kmh

depthRadialWarningFrom_m
depthRadialWarningFrom_ft

tempLinearAlarmFrom_celsius
tempLinearAlarmFrom_kelvin
```

The mapper forwards only the selected value under the renderer's existing prop name:

```js
rendererProps: {
  speedLinearMaxValue: selectedUnitNumber(...)
}
```

The renderers should not know about per-unit editable field names.

## Recommended gauge defaults

Use readable, rounded display-unit defaults rather than exact mechanical conversions when that produces cleaner gauges.

### Speed gauges

Current `kn` defaults remain unchanged:

```text
kn: min 0, max 30, major 5, minor 1, warning 20, alarm 25
ms: min 0, max 15, major 2.5, minor 0.5, warning 10, alarm 12.5
kmh: min 0, max 60, major 10, minor 2, warning 40, alarm 50
```

Use the same profile for linear and radial speed gauges.

### Depth gauges

Current `m` defaults remain unchanged:

```text
m:  min 0, max 30,    major 5,      minor 1,      warning 5,      alarm 2
ft: min 0, max 100,   major 20,     minor 5,      warning 16,     alarm 6
yd: min 0, max 35,    major 5,      minor 1,      warning 5.5,    alarm 2
km: min 0, max 0.03,  major 0.005,  minor 0.001,  warning 0.005,  alarm 0.002
nm: min 0, max 0.016, major 0.002,  minor 0.0005, warning 0.003,  alarm 0.001
```

Each per-unit numeric field must also have a unit-appropriate `min`, `max`, and `step`; do not reuse the current meter-oriented `step: 0.5` for `km` or `nm`.

### Temperature gauges

Current `celsius` defaults remain unchanged:

```text
celsius: min 0,      max 35,     major 5, minor 1, warning 28,     alarm 32
kelvin:  min 273.15, max 308.15, major 5, minor 1, warning 301.15, alarm 305.15
```

## Review-applied amendments

The following decisions were resolved during critical review and are binding for this edited plan. If an older section below appears broader or ambiguous, this section narrows or clarifies it.

### Scope and compatibility

- The self-configurable Default cluster (`dyni_Default_Instruments`) is explicitly out of scope. It remains the generic/manual escape hatch and may continue exposing `formatter` and `formatterParameters` directly.
- PLAN17 applies only to purpose-built dyninstruments clusters that currently hide formatter internals and need safe formatter-family selectors.
- No runtime/user layout migration or compatibility layer is required.
- Repository-owned fixtures, sample layouts, snapshots, and tests must be updated to the new editable schema.
- Do not modify uploaded/bundled AvNav core files. Add dyninstruments-side contract tests or checked fixtures derived from the reviewed AvNav core snapshot.

### AvNav formatter contract

PLAN17 targets the uploaded AvNav core snapshot as the implementation contract.

Minimum formatter-family contract:

```
formatSpeed: input in m/s; tokens kn, ms, kmh
formatDistance: input in meters; tokens nm, m, km, ft, yd
formatTemperature: input in kelvin; tokens celsius, kelvin
formatPressure: input in pa; tokens pa, hpa, bar
```

Token matching behavior differs by formatter:

- `formatSpeed` uses exact `==` comparison. Unrecognized tokens (including uppercase variants like `MS` or `KMH`) silently fall through to the knots conversion factor. Dyninstruments must always pass exact lowercase tokens.
- `formatDistance` delegates to `unitToFactor()` which uses exact `==` comparison. Unrecognized tokens fall through to the meters factor (`1.0`). Dyninstruments must always pass exact lowercase tokens.
- `formatTemperature` lowercases its token input and uses prefix matching (`/^c/` for celsius, `/^k/` for kelvin). Any string starting with `c` matches celsius. Dyninstruments always passes the full canonical token (`celsius` or `kelvin`) for clarity and forward-compatibility.
- `formatPressure` lowercases its token input and uses exact `==` comparison against the lowercased value. Dyninstruments always passes lowercase tokens as documented.

All four formatters silently fall through to a default conversion when the token is missing or unrecognized: `formatSpeed` defaults to knots, `formatDistance` defaults to meters, `formatTemperature` defaults to kelvin, `formatPressure` defaults to pascal. This silent fallback behavior is why mapper-side token validation and fallback is important — an invalid token produces silently wrong output rather than an error.

The legacy alias `skPressure` is equivalent to `formatPressure` in the uploaded core; dyninstruments uses the canonical `formatPressure` name exclusively.

Public AvNav docs may lag the uploaded core for distance units. Document that as a compatibility note in dyninstruments docs, not as a code branch.

### Shared unit catalog

- Replace the config-only catalog idea with one bootstrap-loaded runtime-accessible shared UMD module at `shared/unit-format-families.js`.
- Load `shared/unit-format-families.js` through the early `plugin.js` bootstrap/internal script path before config shared helpers and before cluster config files.
- The file must self-initialize `DyniPlugin.config.shared` (via `ns.config.shared = ns.config.shared || {}`) before assigning to it. This makes the catalog self-sufficient — its correctness must not depend on a consumer's side effect. Consumers depend on the catalog, never the reverse.
- The file uses a standard UMD wrapper and registers on `DyniComponents.DyniUnitFormatFamilies` (satisfying check-umd wrapper and registration checks). It is added to `MODULE_EXPORT_ALLOWLIST` in `tools/check-umd.mjs` to exempt it from the `{ id, create }` export check. This follows the same pattern as `shared/theme/ThemeModel.js`.
- The bootstrap catalog must expose the same object at both:
  - `window.DyniComponents.DyniUnitFormatFamilies`
  - `DyniPlugin.config.shared.unitFormatFamilies`
- The shared catalog is the only source of display-unit defaults for migrated formatter metrics.
- The same bootstrap-visible catalog area must also expose a migrated metric binding table. Keep it in `shared/unit-format-families.js` unless line-count pressure requires a sibling bootstrap file loaded immediately after it.
- Each migrated metric binding contains at least `family` and `defaultToken`.
- Compound metrics may also define an optional `rendererKey` alias for normalized renderer-domain payload names.
- Config editable generators, `ClusterMapperToolkit`, mapper tests, renderer payload tests, and contract tests must all consume the same catalog/binding metadata.
- For migrated formatter metrics, remove `unit` defaults from `kind-defaults.js` or convert those entries to caption-only records (see kind map split section below).
- Keep ordinary non-migrated unit defaults in `kind-defaults.js`, such as degree, time, bearing, course, voltage, and alarm labels.
- `makePerKindTextParams` remains unchanged and continues to serve non-migrated kind map entries.

### Kind map splits

Clusters with mixed migrated and non-migrated entries in a single kind map must split that map so that `makePerKindTextParams` is never called on migrated entries (which would generate the old `unit_<metricKey>` field).

All split maps are added to the existing `shared.kindMaps` object in `kind-defaults.js`.

**Fully migrated maps (no split needed, entire map becomes caption-only):**

- `SPEED_KIND`: all 6 entries (`sog`, `stw`, `sogLinear`, `stwLinear`, `sogRadial`, `stwRadial`) are migrated. Remove `unit` from all entries.
- `ENV_KIND`: all 7 entries (`depth`, `depthLinear`, `depthRadial`, `temp`, `tempLinear`, `tempRadial`, `pressure`) are migrated. Remove `unit` from all entries.

**WIND_KIND splits to:**

- `WIND_ANGLE_KIND` (non-migrated, keeps `unit`): `angleTrue`, `angleApparent`, `angleTrueDirection`, `angleTrueRadialAngle`, `angleApparentRadialAngle`, `angleTrueLinearAngle`, `angleApparentLinearAngle`
- `WIND_SPEED_KIND` (migrated, `unit` removed): `speedTrue`, `speedApparent`, `angleTrueRadialSpeed`, `angleApparentRadialSpeed`, `angleTrueLinearSpeed`, `angleApparentLinearSpeed`

**NAV_KIND splits to:**

- `NAV_UNIT_AWARE_KIND` (migrated, `unit` removed): `dst`, `rteDistance`, `vmg`, `activeRouteRemain`, `xteDisplayXte`, `xteDisplayDst`
- `NAV_TEXT_KIND` (non-migrated, keeps `unit`): `eta`, `rteEta`, `positionBoat`, `positionWp`, `activeRouteEta`, `activeRouteNextCourse`, `xteDisplayCog`, `xteDisplayBrg`

Note: `editRouteDst`, `editRouteRte`, and `routePointsDistance` are not in `NAV_KIND` — they are hand-written editables in the nav cluster config. They must be individually migrated to unit-aware fields in Phase 3.

**MAP_KIND splits to:**

- `MAP_UNIT_AWARE_KIND` (migrated, `unit` removed): `aisTargetDst`, `aisTargetCpa`, `centerDisplayMarker`, `centerDisplayBoat`, `centerDisplayMeasure`
- `MAP_TEXT_KIND` (non-migrated, keeps `unit`): `zoom`, `aisTargetTcpa`, `aisTargetBrg`, `centerDisplayPosition`

**ANCHOR_KIND splits to (with rename, see anchor rename section):**

- `ANCHOR_UNIT_AWARE_KIND` (migrated, `unit` removed): `anchorDistance`, `anchorWatch`
- `ANCHOR_TEXT_KIND` (non-migrated, keeps `unit`): `anchorBearing`

Cluster configs use the appropriate helper for each split:

```js
// Example: wind cluster
...makePerKindCaptionParams(WIND_SPEED_KIND)
...makeUnitAwareTextParams(WIND_SPEED_KIND, windSpeedBindings)
...makePerKindTextParams(WIND_ANGLE_KIND)
```

### Anchor metric key rename

The anchor cluster's current metric keys (`distance`, `watch`, `bearing`) are bare names that do not follow the prefixed convention used everywhere else (`aisTargetDst`, `centerDisplayMarker`, `xteDisplayXte`, etc.). Rename them to `anchorDistance`, `anchorWatch`, `anchorBearing`.

This rename affects:

- Kind map entries in `kind-defaults.js`: keys become `anchorDistance`, `anchorWatch`, `anchorBearing`
- Kind selector option values in `config/clusters/anchor.js`: `"distance"` → `"anchorDistance"`, `"watch"` → `"anchorWatch"`, `"bearing"` → `"anchorBearing"`
- All `condition` objects referencing those kinds
- `AnchorMapper` kind matching: `req === "distance"` → `req === "anchorDistance"`, etc.
- All generated editable names: `caption_distance` → `caption_anchorDistance`, `unit_distance` → migrated `formatUnit_anchorDistance` / `unit_anchorDistance_m`, etc.
- Metric binding table keys: `anchorDistance`, `anchorWatch`
- Test fixtures referencing anchor kinds and editables

The `storeKeys` in the cluster config remain unchanged — they reference AvNav data paths (`nav.anchor.distance`, etc.), not editable keys. The mapper still reads data values from `p.distance`, `p.watch`, `p.bearing` (these are storeKey-resolved data props, not editable names).

### Selector and display-label behavior

- `formatUnit_<metricKey>` selector values are formatter tokens.
- Selector option labels are user-friendly static labels from the shared unit catalog.
- Example: value `ms` is shown as `m/s`; value `kmh` is shown as `km/h`; value `celsius` is shown as `°C`.
- The selector label is not the user-editable displayed unit string.
- `unit_<metricKey>_<token>` remains freely editable and may be any string, including the empty string.
- Existing string values, including `""`, must be preserved.
- Fall back to the catalog display label only when the per-unit display-label property is missing or undefined.
- Invalid selected formatter tokens fall back to the metric default token before reaching renderers.

### Metric and editable model decisions

- Use independent per-submetric selectors for compound widgets.
  
- Keep XTE, AIS, edit-route, center-display, active-route, route-points, and other compound distances independently selectable where they represent distinct displayed submetrics.
  
- Route-points distance must use `formatUnit_routePointsDistance` and `unit_routePointsDistance_<token>` instead of the old special `distanceUnit`.
  
- `courseUnit` and other ordinary display-only units remain unchanged.
  
- Migrated purpose-built widgets pass only the formatter unit token to unit-aware formatters.
  
- Optional formatter-specific precision parameters such as `formatDistance` `numDigits` and `fillRight` are out of scope.
  
- Migrated metric facts must be represented in the shared metric binding table instead of being duplicated in mapper fallback calls and cluster config defaults.
  
- Example binding shape:
  
  ```
    metricBindings: {
      sog: { family: "speed", defaultToken: "kn" },
      stw: { family: "speed", defaultToken: "kn" },
      sogLinear: { family: "speed", defaultToken: "kn" },
      stwLinear: { family: "speed", defaultToken: "kn" },
      sogRadial: { family: "speed", defaultToken: "kn" },
      stwRadial: { family: "speed", defaultToken: "kn" },
      vmg: { family: "speed", defaultToken: "kn" },
      speedTrue: { family: "speed", defaultToken: "kn" },
      speedApparent: { family: "speed", defaultToken: "kn" },
      angleTrueRadialSpeed: { family: "speed", defaultToken: "kn" },
      angleApparentRadialSpeed: { family: "speed", defaultToken: "kn" },
      angleTrueLinearSpeed: { family: "speed", defaultToken: "kn" },
      angleApparentLinearSpeed: { family: "speed", defaultToken: "kn" },
      dst: { family: "distance", defaultToken: "nm" },
      rteDistance: { family: "distance", defaultToken: "nm" },
      activeRouteRemain: { family: "distance", defaultToken: "nm", rendererKey: "remain" },
      xteDisplayXte: { family: "distance", defaultToken: "nm", rendererKey: "xte" },
      xteDisplayDst: { family: "distance", defaultToken: "nm", rendererKey: "dtw" },
      editRouteDst: { family: "distance", defaultToken: "nm", rendererKey: "dst" },
      editRouteRte: { family: "distance", defaultToken: "nm", rendererKey: "rte" },
      routePointsDistance: { family: "distance", defaultToken: "nm", rendererKey: "distance" },
      aisTargetDst: { family: "distance", defaultToken: "nm", rendererKey: "dst" },
      aisTargetCpa: { family: "distance", defaultToken: "nm", rendererKey: "cpa" },
      centerDisplayMarker: { family: "distance", defaultToken: "nm", rendererKey: "marker" },
      centerDisplayBoat: { family: "distance", defaultToken: "nm", rendererKey: "boat" },
      centerDisplayMeasure: { family: "distance", defaultToken: "nm", rendererKey: "measure" },
      anchorDistance: { family: "distance", defaultToken: "m" },
      anchorWatch: { family: "distance", defaultToken: "m" },
      depth: { family: "distance", defaultToken: "m" },
      depthLinear: { family: "distance", defaultToken: "m" },
      depthRadial: { family: "distance", defaultToken: "m" },
      temp: { family: "temperature", defaultToken: "celsius" },
      tempLinear: { family: "temperature", defaultToken: "celsius" },
      tempRadial: { family: "temperature", defaultToken: "celsius" },
      pressure: { family: "pressure", defaultToken: "hpa" }
    }
  ```
  

### Gauge and numeric fields

- Unit-sensitive gauge scale fields are shared by renderer type, not duplicated per source metric.
- For example, `speedLinearMaxValue_kmh` is shared by both `sogLinear` and `stwLinear`.
- Per-unit scale fields apply to speed linear/radial, depth linear/radial, and temperature linear/radial min/max/tick/warning/alarm settings.
- Each generated per-unit numeric field must define unit-appropriate `default`, `min`, `max`, and `step`.
- Preserve existing warning/alarm-enabled visibility conditions when generating per-unit threshold fields.
- `unitNumber(baseKey, selectedUnitToken)` should resolve materialized props only: finite numeric value returns the value; missing or non-finite returns `undefined`.
- Do not add a second mapper-side numeric default catalog. Generated editable specs own numeric defaults.
- Migrated unit-aware mapper tests should build props from generated editable defaults and then override only the fields under test.

### XTE decisions

- Add visible/editable unit-aware XTE highway scale fields:
  - `xteDisplayScale_nm = 1`
  - `xteDisplayScale_m = 1852`
  - `xteDisplayScale_km = 1.852`
  - `xteDisplayScale_ft = 6076`
  - `xteDisplayScale_yd = 2025`
- Each scale field is visible only when `kind=xteDisplay` and `formatUnit_xteDisplayXte` matches the field token.
- XTE scale `step` values: `nm` step 0.1, `m` step 10, `km` step 0.01, `ft` step 10, `yd` step 1.
- XTE should visibly render the selected/editable XTE unit string in the unit slot.
- Keep `R` / `L` as part of the XTE value text.
- The XTE highway offset uses the formatted/parsed signed XTE display value divided by the selected `xteDisplayScale_<unit>`.
- The mapper must resolve the selected XTE scale via `toolkit.unitNumber("xteDisplayScale", selectedXteToken)` and pass it to the renderer as a prop (e.g., `xteScale`) replacing the current `FIXED_XTE_SCALE = 1` constant.
- Stable-digits measurement/fallback paths must measure with the selected XTE unit string, not with a blank unit.
- Do not add a special precision/conversion path for impractical shallow-depth unit choices such as `nm`; those choices are user-responsibility.
- Normalize XTE to the same top-level compound payload convention as other migrated compound renderers. Replace flat formatter-input props such as `xteUnit` and `dtwUnit` with `units.xte`, `units.dtw`, `formatUnits.xte`, and `formatUnits.dtw`.

### Compound renderer payload convention

- For all migrated compound renderer payloads, use top-level `units` and sparse top-level `formatUnits`.
- `units` contains visible display labels and may include both migrated unit-aware labels and ordinary display-only labels.
- `formatUnits` contains only migrated formatter-token metrics.
- Do not add fake `formatUnits` entries for ordinary display-only units such as degree, time, bearing, course, voltage, or alarm labels.
- Use normalized renderer-domain names inside `units` / `formatUnits`, while editable keys remain metric-specific.
- Example: editable keys `formatUnit_xteDisplayXte` and `unit_xteDisplayXte_nm` map to renderer payload keys `formatUnits.xte` and `units.xte`.
- The optional `rendererKey` in the shared metric binding table is the source of truth for such compound payload aliases.
- XTE must use this same convention; do not keep flat `xteUnit` / `dtwUnit` props as formatter inputs.
- For migrated metrics, `formatUnits.<metric>` must always contain the resolved valid formatter token. Renderers must not repeat fallback logic.
- Simple top-level text/gauge widgets may keep the existing `{ unit, formatter, formatterParameters }` contract.

### Compound renderer update strategy

Compound renderers (ActiveRouteTextHtmlWidget, EditRouteRenderModel, RoutePointsHtmlFit, AisTargetRenderModel, CenterDisplayRenderModel, XteDisplayWidget) already have separate code sites for "what to pass to the formatter" and "what to display as unit text" — they just read both from the same `units.*` source. The migration is a minimal one-line-per-metric swap in each render model:

```
// Before:  formatterParameters: [metricUnits.dst]    unitText: metricUnits.dst
// After:   formatterParameters: [formatTokens.dst]    unitText: metricUnits.dst
```

Where `formatTokens = props.formatUnits || {}` is one new binding at the top of the model. The display `unitText` still comes from `units`. This is net-zero line growth per file for the swap itself.

However, files at exactly 400 non-empty lines need at least the `const formatTokens = ...` binding line, which means they must have one line extracted elsewhere first. See the file-size preflight section for specific pre-extraction requirements.

CenterDisplayRenderModel additionally needs a structural change: its `formatDistance(value, unit, ...)` helper currently uses `unit` for both the formatter parameter and display text. After migration, each row in the rows array must carry both a `.unit` (display text from `units.*`) and a `.formatUnit` (token from `formatUnits.*`). The `formatDistance` call uses `row.formatUnit`; the `appendUnit` call uses `row.unit`.

EditRouteRenderModel needs `formatUnits` threaded from the mapper through the widget into the render model. The mapper must pass `formatUnits: { dst: token, rte: token }` alongside the existing `units` object. The render model binds `const formatTokens = p.formatUnits || {}` and uses `formatTokens.dst` / `formatTokens.rte` for its `formatterParameters` arrays.

### Viewmodel migration for compound widgets

Viewmodels that currently call `toolkit.unit()` for migrated metrics must stop reading those fields, since the old `unit_<metricKey>` editable no longer exists after migration.

Required changes:

- `ActiveRouteViewModel`: remove `unit("activeRouteRemain")` from the `units` output. Continue reading non-migrated units (`eta`, `nextCourse`).
- `AisTargetViewModel`: no change needed. This viewmodel does not read or emit unit fields — it returns domain data only (mmsi, distance, cpa, headingTo, colorRole, etc.). The `MapMapper` is the one that builds the `units: { dst, cpa, tcpa, brg }` object directly.
- `EditRouteViewModel`: this is a separate viewmodel (`cluster/viewmodels/EditRouteViewModel.js`), but its `build()` does not read unit fields. No viewmodel change needed. The NavMapper reads units directly when building the editRoute payload.
- `RoutePointsViewModel`: does not read unit fields. No viewmodel change needed. However, the NavMapper's routePoints branch must still migrate: replace the flat `formatting.distanceUnit` with `formatUnits: { distance: token }` and `units: { distance: displayLabel }`.

For each compound widget, the mapper patches the viewmodel output after calling `build()`:

```js
// NavMapper, activeRoute branch:
const domain = activeRouteViewModel.build(p, toolkit);
const remainToken = tk.formatUnit("activeRouteRemain", "distance", "nm");
domain.units.remain = tk.unitText("activeRouteRemain", "distance", remainToken);
domain.formatUnits = { remain: remainToken };
```

This keeps formatter-token and display-label resolution in mappers. Viewmodels remain domain/data-oriented.

### Mapper resolver requirement

All migrated mappers must use shared `ClusterMapperToolkit` helpers for:

- formatter-token validation
- fallback to default formatter token
- display-label fallback
- blank-label preservation
- per-unit numeric field lookup

Required helper API:

```
formatUnit(metricKey, familyId, fallbackToken)
unitText(metricKey, familyId, selectedUnitToken)
unitNumber(baseKey, selectedUnitToken)
```

`formatUnit` and `unitText` must use the explicit `familyId` to consult the shared catalog. Do not infer the formatter family from the token.

Mapper ownership rule:

- Unit-aware formatter-token and display-label resolution belongs in mappers.
- Viewmodels remain domain/data-oriented and must not perform migrated formatter-token fallback or display-label fallback.
- Mappers may pass resolved `units` / `formatUnits` into viewmodels/renderers, or override domain viewmodel defaults before returning renderer props.
- Do not hand-roll resolver logic in individual mappers.

### Runtime/widget file-size preflight

Before editing any non-test JS runtime/widget file touched by PLAN17, check its non-empty line count.

If the file is already near the 400-line limit, split or extract support helpers before adding unit-selector logic. Do not defer this to final cleanup.

Known files at or near the limit in the uploaded repo (non-empty line counts):

- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` — 400. Needs pre-extraction before the compound renderer migration. The `formatMetric` helper and/or coordinate formatting logic should be extracted to make room for the `formatUnits` binding and split formatter/display paths.
- `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` — 400. Needs pre-extraction before the compound renderer migration. The row-building or coordinate-formatting helpers should be extracted. The CenterDisplayRenderModel's row structure must carry separate `.unit` and `.formatUnit` fields, which requires additional code that will not fit without extraction.
- `shared/widget-kits/nav/RoutePointsHtmlFit.js` — 399. Needs pre-extraction before the compound renderer migration. Replacing the single `cfg.distanceUnit` with separate `cfg.formatUnits.distance` (for formatter) and `cfg.units.distance` (for display) requires at least one additional binding line.
- `shared/widget-kits/linear/LinearGaugeEngine.js` — 399. Not expected to grow from PLAN17 changes. Depth widgets change their `formatDisplay` callbacks, not the engine itself. Listed for awareness only.
- `shared/widget-kits/nav/AisTargetHtmlFit.js` — 384. The `formatUnits` prop threads through AisTargetHtmlFit into AisTargetRenderModel. At 384 lines, AisTargetHtmlFit has sufficient headroom. AisTargetRenderModel is well under the limit. No pre-extraction required.
- `widgets/text/XteDisplayWidget/XteDisplayWidget.js` — 351. Has headroom for the `units`/`formatUnits` migration. No pre-extraction required.

### Documentation phase

Add a focused documentation phase before final acceptance checks.

Required documentation updates:

- `documentation/avnav-api/formatters.md`
  - document `formatUnit_<metricKey>` as the formatter-conversion selector
  - document `unit_<metricKey>_<token>` as visible-label-only
  - document intentional blank label preservation
  - update migrated pressure references from `skPressure` to `formatPressure`
- `documentation/avnav-api/core-formatter-catalog.md`
  - document the reviewed AvNav formatter contract, including distance/depth `ft` and `yd`
  - document per-formatter token matching behavior (exact vs prefix vs lowercased)
  - document silent fallback behavior for unrecognized tokens
  - note the public-doc mismatch for distance as a compatibility note
  - note the dyninstruments default overrides for temperature (`celsius` vs AvNav's `kelvin`) and pressure (`hpa` vs AvNav's `pa`)
- `documentation/avnav-api/core-key-catalog.md`
  - update migrated metric rows to show formatter-token selectors instead of display-unit strings
  - add XTE highway scale semantics
- affected widget/cluster docs for speed, wind, nav, map, anchor, and environment
  - note anchor metric key rename from bare `distance`/`watch`/`bearing` to `anchorDistance`/`anchorWatch`/`anchorBearing`
- `documentation/conventions/coding-standards.md`
  - add naming conventions for `formatUnit_<metricKey>`, `unit_<metricKey>_<token>`, and `<scaleBaseKey>_<token>`
  - document the bootstrap-only shared catalog exception for `shared/unit-format-families.js`
  - document the `MODULE_EXPORT_ALLOWLIST` entry in `check-umd.mjs` for bootstrap-only shared files
  - document optional metric-binding `rendererKey` aliases for compound payloads
  - warn not to pass display labels such as `m/s`, `°C`, or `hPa` into formatter parameters
  - document that renderer-side helpers may format with mapper-resolved tokens but must not repeat mapper fallback logic
  - document the kind map split convention for mixed migrated/non-migrated clusters

### Fixture and test amendments

Update in-repo fixtures/tests to the new schema; do not add runtime migration.

Examples:

```
old: unit_sog = "kn"
new: formatUnit_sog = "kn"; unit_sog_kn = "kn"

old: unit_depthLinear = "m"
new: formatUnit_depthLinear = "m"; unit_depthLinear_m = "m"

old: distanceUnit = "nm"
new: formatUnit_routePointsDistance = "nm"; unit_routePointsDistance_nm = "nm"

old: unit_distance = "m" (anchor)
new: formatUnit_anchorDistance = "m"; unit_anchorDistance_m = "m"

old: kind = "distance" (anchor)
new: kind = "anchorDistance"
```

Fixture update policy:

- Update repo-owned fixtures minimally.
- Preserve existing custom display labels on the matching selected/default token field.
- Do not materialize unused `unit_<metricKey>_<token>` fields unless the test specifically needs them.
- Example: `unit_sogRadial = "knots through GPS"` becomes `formatUnit_sogRadial = "kn"` plus `unit_sogRadial_kn = "knots through GPS"`.

Add targeted negative regression tests proving migrated mappers/renderers never pass display labels into formatter parameters.

Examples that must fail if reintroduced:

```
formatterParameters: ["m/s"]   # wrong; speed token is ms
formatterParameters: ["km/h"]  # wrong; speed token is kmh
formatterParameters: ["°C"]    # wrong; temperature token is celsius
formatterParameters: ["hPa"]   # wrong; pressure token is hpa
```

Also test:

- changing `unit_sog_ms` to `meters/sec` still passes formatter token `ms`
- changing `unit_temp_celsius` to `deg C` still passes formatter token `celsius`
- changing `unit_pressure_hpa` to `""` still passes formatter token `hpa`
- changing `unit_xteDisplayXte_nm` to `""` still keeps `formatUnits.xte = "nm"`
- blank display labels remain blank and do not auto-fill from formatter tokens
- compound renderers call `formatDistance` with `formatUnits.*` and draw `units.*`
- ordinary display-only units remain in `units` and do not appear in `formatUnits`
- Default cluster remains excluded and may expose formatter internals

## Implementation phases

### Phase 0 — Plan numbering preflight

- Add this plan as the new `exec-plans/active/PLAN17.md` or otherwise reconcile the active plan numbering.
- The current `exec-plans/active/PLAN18.md` heading says `PLAN17`; fix that mismatch before implementation.
- Do not start the release/tooling plan before this unit-selector parity plan lands.

### Phase 1 — Shared unit metadata, editable generators, and renderer formatting helper

Add a bootstrap-loaded runtime catalog plus a config helper file instead of growing existing cluster files:

- `shared/unit-format-families.js`
- `config/shared/unit-editable-utils.js`

Update `plugin.js` load order:

- Insert `shared/unit-format-families.js` after `config/components/registry-cluster.js` and before `config/components.js` in the `internalScripts` array.
- Insert `config/shared/unit-editable-utils.js` after `config/shared/kind-defaults.js` and before `config/shared/common-editables.js`. It depends on both the bootstrap catalog (`DyniPlugin.config.shared.unitFormatFamilies`) and `kind-defaults.js` kind maps, and must be available before any cluster config file.

Per-unit gauge scale field specs (default/min/max/step per token) are cluster-specific, not shared across clusters. Generate them inline in cluster configs via `makePerUnitFloatParams` calls — no separate shared gauge-scale file is needed.

`shared/unit-format-families.js` owns:

- family tokens
- default display labels
- selector lists
- migrated metric binding table with `family`, `defaultToken`, and optional `rendererKey`
- UMD wrapper with `DyniComponents.DyniUnitFormatFamilies` registration
- self-initialization of `DyniPlugin.config.shared` (via `ns.config.shared = ns.config.shared || {}`) before additional assignment to `DyniPlugin.config.shared.unitFormatFamilies` for config-time access
- the explicit rule that it is bootstrap-loaded and not dynamically loaded as a component

Add `shared/unit-format-families.js` to `MODULE_EXPORT_ALLOWLIST` in `tools/check-umd.mjs` to exempt it from the `{ id, create }` export check. This follows the same pattern as `shared/theme/ThemeModel.js` and `shared/theme/ThemeResolver.js`.

Update check tooling, if required, so this bootstrap-only shared file is not treated as a missing component registration.

`unit-editable-utils.js` owns helpers such as:

- `makePerKindCaptionParams(kindMap)`
- `makeUnitAwareTextParams(kindMap, bindings)`
- `makeFormatUnitSelectParam(binding)`
- `makePerUnitStringParams(binding)`
- `makePerUnitFloatParams(binding, fieldSpec)`
- condition builders that combine the existing `kind` condition with `formatUnit_<metricKey>`

Keep `config/shared/editable-param-utils.js` small and backward compatible. Existing non-unit-aware clusters should continue to use `makePerKindTextParams` unless they are intentionally migrated.

Migrated unit-aware metrics must not use `makePerKindTextParams` if that would generate the old single `unit_<metricKey>` field. Use explicit caption-only and unit-aware helpers instead:

```
...makePerKindCaptionParams(SPEED_KIND)
...makeUnitAwareTextParams(SPEED_KIND, speedMetricBindings)
```

Add the renderer-side formatting helper as a normal component-registered shared module:

- file: `shared/widget-kits/format/UnitAwareFormatter.js`
- registry: register in `config/components/registry-shared-foundation.js` with id `UnitAwareFormatter` and path `shared/widget-kits/format/UnitAwareFormatter.js`
- widgets that use it must list `UnitAwareFormatter` in their `Depends` header
- purpose: small formatting/display helpers only
- not allowed: mapper fallback logic, token validation fallback, or display-label fallback

Core helper responsibilities:

- `formatWithToken(value, formatter, token, defaultText, Helpers)`
- `formatDistance(value, token, defaultText, Helpers)`
- `appendUnit(valueText, displayUnit, defaultText)`
- `extractNumericDisplay(valueText, fallback)` — parse a numeric value from formatter output text

Creating `UnitAwareFormatter` in Phase 1 makes it available for Phase 4 compound renderer updates and Phase 5 depth conversion.

### Phase 2 — Split environment editables and pre-extract files at the 400-line limit

`config/shared/environment-editables.js` will hit the 400 non-empty line limit once unit fields are added. Split before adding unit fields.

Recommended split:

- `config/shared/environment-base-editables.js` — kind selector, source keys, shared toggles, ratio thresholds, pressure unit selector and per-unit pressure display strings (pressure has no gauge, so it stays in the base file)
- `config/shared/environment-depth-editables.js` — depth unit selectors and depth gauge scale fields
- `config/shared/environment-temperature-editables.js` — temperature unit selectors and temperature gauge scale fields
- `config/shared/environment-editables.js` — small assembler that returns the merged editable object

Each new file must stay comfortably below 300 non-empty lines to avoid immediately approaching the hard 400-line limit.

Update `plugin.js` load order: replace the single `config/shared/environment-editables.js` entry with the three split files followed by the assembler, keeping them in the same position (after `config/shared/common-editables.js` and before cluster configs):

```text
"config/shared/environment-base-editables.js",
"config/shared/environment-depth-editables.js",
"config/shared/environment-temperature-editables.js",
"config/shared/environment-editables.js",
```

Pre-extract helpers from compound renderer files at the 400-line limit before Phase 4 changes:

- `ActiveRouteTextHtmlWidget.js` (400 non-empty): extract `formatMetric` and/or coordinate formatting logic into a small shared helper or sibling file.
- `CenterDisplayTextWidget.js` (400 non-empty): extract row-building or coordinate-formatting helpers.
- `RoutePointsHtmlFit.js` (399 non-empty): extract stable-digits formatting or row-building logic.

These extractions must happen before Phase 4 adds `formatUnits` bindings to these files.

### Phase 3 — Replace unit-string-only editables with unit-aware generated editables

Update kind maps in `config/shared/kind-defaults.js`:

- Add split maps: `WIND_ANGLE_KIND`, `WIND_SPEED_KIND`, `NAV_UNIT_AWARE_KIND`, `NAV_TEXT_KIND`, `MAP_UNIT_AWARE_KIND`, `MAP_TEXT_KIND`, `ANCHOR_UNIT_AWARE_KIND`, `ANCHOR_TEXT_KIND`
- Remove `unit` from all entries in fully-migrated maps (`SPEED_KIND`, `ENV_KIND`) and migrated split maps
- Rename anchor kind entries: `distance` → `anchorDistance`, `watch` → `anchorWatch`, `bearing` → `anchorBearing`

Update cluster configs:

- `config/clusters/speed.js` — fully migrated. Replace `makePerKindTextParams(SPEED_KIND)` with `makePerKindCaptionParams(SPEED_KIND)` + `makeUnitAwareTextParams(SPEED_KIND, speedBindings)`. Add per-unit gauge scale fields for linear/radial.
- `config/clusters/wind.js` — split. Use `makePerKindCaptionParams(WIND_SPEED_KIND)` + `makeUnitAwareTextParams(WIND_SPEED_KIND, windSpeedBindings)` for speed entries. Use `makePerKindTextParams(WIND_ANGLE_KIND)` for angle entries.
- `config/clusters/nav.js` — split. Use `makePerKindCaptionParams(NAV_UNIT_AWARE_KIND)` + `makeUnitAwareTextParams(NAV_UNIT_AWARE_KIND, navUnitAwareBindings)` for migrated entries. Use `makePerKindTextParams(NAV_TEXT_KIND)` for non-migrated entries. Additionally, hand-written editables `unit_editRouteDst`, `unit_editRouteRte`, and `distanceUnit` (for routePoints) must be individually replaced with `makeFormatUnitSelectParam` + `makePerUnitStringParams` calls. Remove the old `distanceUnit` editable.
- `config/clusters/map.js` — split. Use `makePerKindCaptionParams(MAP_UNIT_AWARE_KIND)` + `makeUnitAwareTextParams(MAP_UNIT_AWARE_KIND, mapUnitAwareBindings)` for migrated entries. Use `makePerKindTextParams(MAP_TEXT_KIND)` for non-migrated entries.
- `config/clusters/anchor.js` — split plus rename. Update kind selector option values to `anchorDistance`/`anchorWatch`/`anchorBearing`. Update all conditions. Use `makePerKindCaptionParams(ANCHOR_UNIT_AWARE_KIND)` + `makeUnitAwareTextParams(ANCHOR_UNIT_AWARE_KIND, anchorUnitAwareBindings)` for migrated entries. Use `makePerKindTextParams(ANCHOR_TEXT_KIND)` for non-migrated entries.
- split environment config files from Phase 2 — fully migrated. Replace `makePerKindTextParams(ENV_KIND)` with `makePerKindCaptionParams(ENV_KIND)` + `makeUnitAwareTextParams(ENV_KIND, envBindings)`. Add per-unit gauge scale fields for depth and temperature linear/radial.

Keep ordinary angle/time/position/voltage/alarm unit strings unchanged.

### Phase 4 — Mapper resolver changes and compound widget updates

Extend `ClusterMapperToolkit` with convention-based helpers that do not expose formatter internals:

```js
formatUnit(metricKey, familyId, fallbackToken)
unitText(metricKey, familyId, selectedUnitToken)
unitNumber(baseKey, selectedUnitToken)
```

The toolkit's `create(def, Helpers)` function must capture a reference to the shared catalog via `DyniPlugin.config.shared.unitFormatFamilies` at creation time. This reference is safe because `shared/unit-format-families.js` is bootstrap-loaded before any component, so the catalog is guaranteed to exist when mappers are instantiated. The captured catalog is used by `formatUnit` and `unitText` to validate tokens and resolve display labels for the explicit `familyId`.

Resolution is simple because no migration is required:

- selected token comes from `formatUnit_<metricKey>`
- selected token is validated against the explicit `familyId` in the shared catalog
- displayed text comes from `unit_<metricKey>_<selectedToken>`
- display-label fallback comes from the explicit `familyId` in the shared catalog
- gauge numbers come from `<baseKey>_<selectedToken>`
- mapper fallback calls should use the shared migrated metric binding table instead of duplicating defaults

Update mappers for simple text/gauge widgets:

- `SpeedMapper`: use speed selectors for SOG/STW text and gauges; pass `formatUnit` token to `formatSpeed` and resolved display label to `unit`; pass per-unit scale props for linear/radial gauges
- `WindMapper`: use speed selectors for all speed metrics. Specifically: numeric `speedTrue`/`speedApparent` must replace `const u = unit("speedTrue")` with `const token = tk.formatUnit("speedTrue", "speed", "kn")` and pass `token` to `formatSpeed` (not the display string). All four radial/linear speed submetrics (`angleTrueRadialSpeed`, `angleApparentRadialSpeed`, `angleTrueLinearSpeed`, `angleApparentLinearSpeed`) have the same bug and need the same `unit()` → `formatUnit()` swap in their `formatterParameters` arrays.
- `AnchorMapper`: update kind matching to use renamed keys (`anchorDistance`, `anchorWatch`, `anchorBearing`). Use distance selectors for anchor distance and watch radius; pass `formatUnit` token to `formatDistance`, not display string. Note: data values are still read from `p.distance` and `p.watch` (storeKey-resolved data props).
- `EnvironmentMapper`: use distance selectors for depth, temperature selectors for temp, pressure selector for pressure; pass per-unit gauge scale props; rename formatter from `skPressure` to `formatPressure` and use lowercase tokens `pa`/`hpa`/`bar`; depth text kind passes `formatDistance` instead of `formatDecimal` (see also Phase 5)

Update mappers and renderers atomically for each compound widget (mapper payload and renderer consumption change together to avoid a broken intermediate state):

- `NavMapper` + `ActiveRouteTextHtmlWidget`: mapper patches `units.remain` and adds `formatUnits: { remain: token }` after calling `activeRouteViewModel.build()`; `ActiveRouteViewModel` drops `unit("activeRouteRemain")` from its output; renderer reads `formatUnits.remain` for formatter parameter instead of `units.remain`
- `NavMapper` + `EditRouteRenderModel`: mapper builds `formatUnits: { dst: token, rte: token }` alongside existing `units: { dst, rte }` using toolkit resolver calls instead of `unit("editRouteDst")` and `unit("editRouteRte")`; render model binds `const formatTokens = p.formatUnits || {}` and uses `formatTokens.dst` / `formatTokens.rte` for `formatterParameters` arrays
- `NavMapper` + `RoutePointsHtmlFit`: mapper replaces flat `formatting.distanceUnit` with `formatUnits: { distance: token }` and `units: { distance: displayLabel }`; `courseUnit` stays in `formatting` (non-migrated display-only); render model reads `formatUnits.distance` for formatter parameter and `units.distance` for display text
- `NavMapper` + `XteDisplayWidget`: mapper replaces flat `xteUnit`/`dtwUnit` with `units: { xte, dtw, track, brg }` and `formatUnits: { xte: token, dtw: token }`; mapper resolves `xteScale` via `toolkit.unitNumber("xteDisplayScale", selectedXteToken)` and passes it as a renderer prop replacing the current `FIXED_XTE_SCALE = 1` constant; widget reads `formatUnits.*` for `Helpers.applyFormatter` calls and `units.*` for display text
- `NavMapper` VMG: pass `formatUnit` token to `formatSpeed`, resolved display label to `unit`
- `NavMapper` DST/RTE distance: currently pass `formatDistance` with empty `formatterParameters: []` (AvNav silently defaults to `nm`); must now pass the explicit selected token via `formatUnit`
- `MapMapper` + `AisTargetRenderModel`: `AisTargetViewModel` needs no changes (it does not emit units). The `MapMapper` already builds the `units` object directly. Replace `unit("aisTargetDst")` and `unit("aisTargetCpa")` with toolkit resolver calls and add `formatUnits: { dst: token, cpa: token }`. `AisTargetRenderModel` binds `const formatTokens = p.formatUnits || {}` and uses `formatTokens.dst`/`formatTokens.cpa` for `formatterParameters` arrays. `tcpa` and `brg` remain in `units` only (non-migrated).
- `MapMapper` + `CenterDisplayRenderModel`: mapper adds `formatUnits: { marker: token, boat: token, measure: token }` to existing `units` payload. Render model binds `const formatTokens = p.formatUnits || {}`. Each row in the rows array must carry both `.unit` (display text from `units.*`) and `.formatUnit` (token from `formatUnits.*`). The `formatDistance` helper uses `row.formatUnit` for `formatterParameters`; the `appendUnit` call uses `row.unit` for display text.

For units whose display label differs from formatter token, such as `ms -> m/s` and `celsius -> °C`, renderers must use `formatUnits.*` for formatter calls and `units.*` only for text drawing.

Unit-aware formatter-token and display-label resolution belongs in mappers, not viewmodels.

### Phase 5 — Depth renderer conversion

Change depth text, linear, and radial behavior to use AvNav `formatDistance`.

After Phase 4's mapper changes, the environment mapper already passes the following for all depth kinds (text, linear, and radial):

```js
formatter: "formatDistance"
formatterParameters: [formatUnit_depth]
unit: unitText_depth
```

Phase 5 changes the depth linear and radial **renderers** so they consume these formatter props instead of formatting raw meters locally.

Depth linear and radial widgets must stop deriving display values from raw meters. Replace the local raw-meter formatting with formatter-driven display values. Both `LinearGaugeEngine` and `SemicircleRadialEngine` pass `(rawValue, props, unitText, Helpers)` to the `formatDisplay` callback, so `Helpers` is already available.

Speed and temperature gauges already use `Helpers.applyFormatter` in their `formatDisplay` callbacks. Depth is being brought into alignment with them.

Both `DepthLinearWidget` and `DepthRadialWidget` must add `UnitAwareFormatter` to their `Depends` header and use it for numeric extraction.

Explicit code sketch for the depth `formatDisplay` callback (applies to both linear and radial):

```js
formatDisplay: function (raw, props, unitText, Helpers) {
  const p = props || {};
  const defaultText = resolveDefaultText(p);
  const n = Number(raw);
  if (!isFinite(n)) {
    return { num: NaN, text: defaultText };
  }

  const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatDistance";
  const formatterParameters = (typeof p.formatterParameters !== "undefined")
    ? p.formatterParameters
    : ["m"];

  const formatted = String(Helpers.applyFormatter(n, {
    formatter: formatter,
    formatterParameters: formatterParameters,
    default: defaultText
  }));
  const parsed = UnitAwareFormatter.extractNumericDisplay(formatted, NaN);

  if (!isFinite(parsed)) {
    return { num: NaN, text: defaultText };
  }
  return { num: parsed, text: formatted.trim() };
}
```

The `num` value returned by `formatDisplay` is the display-unit number (e.g., 30 feet, not 9.14 meters). This is correct because:

- The gauge pointer position is computed from this `num` against the axis min/max.
- The axis min/max, ticks, warning, and alarm props are already in display units after Phase 4's per-unit scale field resolution.
- No renderer should convert these values again.

### Phase 6 — Renderer-side deduplication and cleanup

Deduplicate any repeated formatting patterns across compound renderers that were updated in Phase 4, migrating them to use `UnitAwareFormatter` helpers. The Phase 4 compound renderer changes are functionally complete without this deduplication — Phase 6 is purely a cleanup pass.

Required rules:

- `formatDistance(value, formatUnit)` uses formatter token
- drawn unit text uses free display unit string
- XTE uses top-level `units` and `formatUnits`; do not keep flat `xteUnit` / `dtwUnit` props as formatter inputs
- renderer code may use `UnitAwareFormatter`, but must assume `formatUnits.*` entries are already mapper-resolved valid tokens
- `UnitAwareFormatter` does not repeat mapper fallback or token validation policy

Do not pass display strings such as `m/s` or `°C` into formatter parameters.

### Phase 7 — Tests

Add/update tests for both config and mapper behavior.

Config tests:

- selector lists match AvNav formatter families
- metric binding defaults reference valid catalog families and tokens
- optional `rendererKey` aliases are unique within each compound payload where required
- only the per-unit unit string matching the selected formatter unit is visible
- default display strings match the selected formatter token labels
- old single `unit_<metricKey>` fields are absent for migrated metrics
- migrated clusters use caption-only plus unit-aware helpers instead of generating old `unit_<metricKey>` fields through `makePerKindTextParams`
- kind map splits correctly separate migrated and non-migrated entries
- anchor kind values use prefixed names (`anchorDistance`, `anchorWatch`, `anchorBearing`)
- environment split still assembles the complete editable set
- generated files stay under file-size limits
- bootstrap catalog is accepted by tooling without requiring component registration

Mapper tests:

- SOG/STW can produce `formatSpeed` with `kn`, `ms`, and `kmh`
- VMG and wind speeds use the speed selector, not the display string
- numeric `speedTrue`/`speedApparent` pass the `formatUnit` token to `formatSpeed`, not the display string
- all four wind radial/linear speed submetrics pass the `formatUnit` token, not the display string
- DST/RTE now pass the explicit selected token instead of empty `formatterParameters` (pre-existing bug fix)
- anchor distance/watch use renamed keys (`anchorDistance`, `anchorWatch`) and pass formatter tokens
- mapper fallback calls consume shared metric bindings rather than duplicated local defaults
- XTE maps editable keys to renderer-domain aliases through `rendererKey`, such as `xte` and `dtw`
- XTE scale is resolved from `xteDisplayScale_<token>` and passed as `xteScale` prop
- temperature text/gauges pass `celsius` or `kelvin`
- pressure passes `pa`, `hpa`, or `bar` via `formatPressure` (not `skPressure`)
- depth text/gauges pass `formatDistance` instead of `formatDecimal`
- gauge scale props resolve to the selected per-unit numeric field
- display labels remain freely editable independently of formatter tokens
- viewmodels do not emit migrated unit fields; mappers patch them after `build()`
- viewmodels do not perform migrated formatter-token or display-label fallback
- AisTargetViewModel needs no changes (does not emit units)

Renderer tests:

- depth linear/radial format raw meters via `formatDistance` and extract display-unit numbers
- depth gauge pointer and sectors use display-unit numbers
- temperature kelvin gauge uses kelvin axis values
- speed km/h gauge uses km/h axis values
- compound distance widgets use separate formatter token and display unit text
- compound renderers read `formatUnits.*` for `Helpers.applyFormatter` calls and `units.*` for display text
- CenterDisplayRenderModel rows carry separate `.unit` and `.formatUnit` fields
- EditRouteRenderModel reads `formatTokens.dst`/`formatTokens.rte` for formatter parameters
- `UnitAwareFormatter` is component-registered and loaded through normal renderer dependencies
- `UnitAwareFormatter` does not repeat mapper fallback or token validation policy
- XTE uses top-level `units` / `formatUnits` instead of flat formatter-input unit props
- XTE scale prop replaces `FIXED_XTE_SCALE` constant
- route-points reads `formatUnits.distance` for formatter calls and `units.distance` for display; `courseUnit` stays in `formatting`

Regression tests:

- COG/heading leading-zero behavior remains unchanged
- hidden `formatter` and `formatterParameters` editables remain hidden for cluster widgets
- ordinary non-unit-aware strings such as captions, degree symbols, time units, voltage units, and alarm labels are not migrated accidentally
- `aisTargetTcpa` and `aisTargetBrg` remain in `units` only and do not appear in `formatUnits`

Run:

```bash
npm run check:all
```

### Phase 8 — Documentation

Execute the documentation updates described in the documentation phase section above.

## Acceptance criteria

Additional acceptance criteria from review:

- The Default cluster is explicitly excluded from PLAN17 and may continue exposing generic formatter internals.
- Migrated purpose-built widgets never pass display labels into formatter parameters.
- Selector values are formatter tokens while selector labels are user-friendly catalog labels.
- Blank display-unit strings are preserved as intentional blanks.
- Compound renderer payloads use top-level `units` for display labels and sparse top-level `formatUnits` for formatter tokens.
- `formatUnits` entries are always resolved valid tokens for migrated metrics.
- XTE has visible per-unit highway scale fields and renders the selected/editable XTE unit string.
- XTE scale is mapper-resolved and passed as a renderer prop, not a hardcoded constant.
- Migrated unit-label defaults come only from the shared runtime unit catalog.
- The shared runtime unit catalog is bootstrap-loaded from `shared/unit-format-families.js`, dual-exported, and not component-registered.
- The shared runtime unit catalog uses a UMD wrapper with `DyniComponents` registration and is added to `MODULE_EXPORT_ALLOWLIST` in `check-umd.mjs`.
- The shared runtime unit catalog self-initializes `DyniPlugin.config.shared` before assigning.
- Migrated metric defaults and optional renderer-domain aliases come from a shared metric binding table.
- The metric binding table includes all migrated metrics with `family`, `defaultToken`, and `rendererKey` where applicable.
- The metric binding table uses `anchorDistance` and `anchorWatch` (not bare `distance` and `watch`).
- `ClusterMapperToolkit.formatUnit` and `ClusterMapperToolkit.unitText` both take an explicit formatter family id.
- Unit-aware formatter-token and display-label resolution happens in mappers, not viewmodels.
- Viewmodels drop `unit()` calls for migrated metrics; mappers patch `units` and add `formatUnits` after calling viewmodel `build()`.
- AisTargetViewModel needs no changes (does not emit units); MapMapper owns AIS unit resolution.
- Compound mapper+renderer changes are made atomically per widget; no broken intermediate state between Phase 4 and Phase 6.
- XTE uses the same top-level `units` / `formatUnits` convention as other compound renderers.
- Route-points uses `formatUnits.distance` / `units.distance` instead of flat `formatting.distanceUnit` for the migrated distance unit; `courseUnit` stays in `formatting`.
- CenterDisplayRenderModel rows carry separate `.unit` and `.formatUnit` fields.
- EditRouteRenderModel receives `formatUnits` from the mapper and uses it for formatter parameters.
- Renderer-side formatting reuse is provided by a normal component-registered `UnitAwareFormatter` helper registered in `registry-shared-foundation.js`, created in Phase 1, not by a bootstrap script.
- `UnitAwareFormatter` is available for Phase 4 compound renderer updates and Phase 5 depth conversion.
- Depth `formatDisplay` callbacks use `Helpers.applyFormatter` and `UnitAwareFormatter.extractNumericDisplay` to produce display-unit numbers for pointer positioning.
- Kind maps are split into migrated and non-migrated halves where a cluster has mixed entries.
- Anchor metric keys use prefixed names (`anchorDistance`, `anchorWatch`, `anchorBearing`).
- Repository-owned fixtures/tests use the new schema; no runtime migration is added.
- Repository-owned fixtures are updated minimally and preserve old custom labels on the matching selected/default token field.
- Documentation is updated for the new editable model, Default-cluster exception, anchor rename, kind map splits, and AvNav formatter contract details.
- Pressure uses canonical `formatPressure` formatter name with lowercase tokens, not legacy `skPressure` alias.
- Files at the 400-line limit are pre-extracted in Phase 2 before Phase 4 adds `formatUnits` bindings.

- A user can set SOG/STW/VMG/wind speeds to `kn`, `m/s`, or `km/h` through a selector.
- A user can set navigation, route, map, anchor, and depth distances to `nm`, `m`, `km`, `ft`, or `yd` through selectors.
- A user can set temperature to `°C`/`K` by selecting `celsius`/`kelvin`.
- A user can set pressure to `Pa`/`hPa`/`bar` by selecting `pa`/`hpa`/`bar`.
- The displayed unit string defaults follow the selected formatter unit.
- The displayed unit string remains freely editable per selected unit.
- Formatter parameters always receive formatter tokens, never arbitrary display labels.
- Depth no longer formats raw meters directly; it uses `formatDistance` throughout.
- Gauge axes, ticks, warning thresholds, and alarm thresholds use selected display-unit defaults.
- No migrated cluster exposes generic `formatter` or `formatterParameters` unintentionally.
- No non-test JS file exceeds 400 non-empty lines, and large config files are split before they approach the limit.
- The DST/RTE pre-existing bug (display label independent of formatter unit) is fixed.