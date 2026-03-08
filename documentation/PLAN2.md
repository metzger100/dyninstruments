# Implementation Plan

**Status:** ⏳ Investigated | Plugin-wide responsive scaling and compact rendering rollout

## Overview

This plan extends the new `CenterDisplay` small-widget rendering approach to every dyninstruments instrument family.

Scope:

- replace layout-driving fixed size floors with relative or responsive-profile-derived values
- introduce shared linear text-fill compaction for low-resolution widget sizes
- enforce the contract with tests plus dyninstruments lint/smell checks

## Current Responsive Baseline Summary

| Area | Current state | Rollout implication |
|---|---|---|
| `CenterDisplayTextWidget` + `CenterDisplayLayout` | Already uses a measured layout plus `minDim`-driven linear compaction (`textFillScale`, caption-share scaling, stacked-caption scaling, center-weight scaling). | Treat as the reference behavior and extract the reusable parts into shared infrastructure. |
| `ThreeValueTextWidget` | Responsive by ratio mode only. Relies on `TextLayoutEngine` / `TextLayoutComposite`, but no small-tile compaction profile is applied. | Upgrade shared text engine first; this unlocks numeric kinds across `anchor`, `speed`, `environment`, `vessel`, `wind`, `courseHeading`, and `nav`. |
| `PositionCoordinateWidget` | Uses shared text engine and stacked/flat routing, but compact behavior still depends on engine floors rather than a shared compaction profile. | Migrate after the shared text engine so `positionBoat`, `positionWp`, `dateTime`, and `timeStatus` inherit the same compact behavior. |
| `ActiveRouteTextWidget` | Has ratio modes, but layout uses local hard floors like `40`, `16`, `12`, `6`, `4` and no linear fill boost. | Needs dedicated layout refactor on top of the shared profile. |
| `XteDisplayWidget` + `XteHighwayPrimitives` | Ratio modes exist, but layout reserves large fixed floors (`40`, `24`, `20`, `16`, `12`, `10`) for highway/text panels. | Needs both geometry compaction and text-fill compaction. |
| `LinearGaugeEngine` + `LinearGaugeMath` + `LinearGaugeTextLayout` | Shared engine covers many widgets, but layout and text still clamp to fixed floors (`90`, `80`, `84`, `64`, `36`, `10`, `8`, `6`). | High-leverage migration point for all linear gauges. |
| `WindLinearWidget` | Dual-value text layout is custom and adds more fixed gap floors on top of `LinearGaugeEngine`. | Needs a widget-specific follow-up after linear-engine migration. |
| `SemicircleRadialEngine` | Geometry is mostly proportional, but radial text blocks and label insets still depend on fixed floors (`18`, `10`, `8`, `6`, `4`). | Add shared compact profile for semicircle text and label geometry. |
| `FullCircleRadialEngine` + `FullCircleRadialTextLayout` | Full-circle geometry/text still uses fixed floors (`14`, `12`, `10`, `8`, `6`, `18`, `16`). | Add shared compact profile for dial ring, labels, and text slots. |

## Affected Instrument Map

| Cluster | Kinds / instruments | Renderer path | Migration owner |
|---|---|---|---|
| `anchor` | `distance`, `watch`, `bearing` | `ThreeValueTextWidget` | shared text pipeline |
| `speed` | `sog`, `stw` | `ThreeValueTextWidget` | shared text pipeline |
| `speed` | `sogLinear`, `stwLinear` | `SpeedLinearWidget` -> `LinearGaugeEngine` | shared linear pipeline |
| `speed` | `sogRadial`, `stwRadial` | `SpeedRadialWidget` -> `SemicircleRadialEngine` | shared semicircle pipeline |
| `environment` | `depth`, `temp`, `pressure` | `ThreeValueTextWidget` | shared text pipeline |
| `environment` | `depthLinear`, `tempLinear` | linear wrappers -> `LinearGaugeEngine` | shared linear pipeline |
| `environment` | `depthRadial`, `tempRadial` | radial wrappers -> `SemicircleRadialEngine` | shared semicircle pipeline |
| `vessel` | `voltage`, `clock`, `pitch`, `roll` | `ThreeValueTextWidget` | shared text pipeline |
| `vessel` | `dateTime`, `timeStatus` | `PositionCoordinateWidget` | coordinate pipeline |
| `vessel` | `voltageLinear` | `VoltageLinearWidget` -> `LinearGaugeEngine` | shared linear pipeline |
| `vessel` | `voltageRadial` | `VoltageRadialWidget` -> `SemicircleRadialEngine` | shared semicircle pipeline |
| `wind` | `angleTrue`, `angleApparent`, `angleTrueDirection`, `speedTrue`, `speedApparent` | `ThreeValueTextWidget` | shared text pipeline |
| `wind` | `angleTrueLinear`, `angleApparentLinear` | `WindLinearWidget` | linear + widget-specific dual layout |
| `wind` | `angleTrueRadial`, `angleApparentRadial` | `WindRadialWidget` -> `FullCircleRadialEngine` | shared full-circle pipeline |
| `courseHeading` | `cog`, `hdt`, `hdm`, `brg` | `ThreeValueTextWidget` | shared text pipeline |
| `courseHeading` | `hdtLinear`, `hdmLinear` | `CompassLinearWidget` -> `LinearGaugeEngine` | shared linear pipeline |
| `courseHeading` | `hdtRadial`, `hdmRadial` | `CompassRadialWidget` -> `FullCircleRadialEngine` | shared full-circle pipeline |
| `nav` | `eta`, `rteEta`, `dst`, `rteDistance`, `vmg` | `ThreeValueTextWidget` | shared text pipeline |
| `nav` | `positionBoat`, `positionWp` | `PositionCoordinateWidget` | coordinate pipeline |
| `nav` | `activeRoute` | `ActiveRouteTextWidget` | widget-specific text layout |
| `nav` | `centerDisplay` | `CenterDisplayTextWidget` | reference implementation, then shared extraction |
| `nav` | `xteDisplay` | `XteDisplayWidget` | widget-specific geometry + text layout |

## Current Dyninstruments Gaps

- The new compact behavior lives inside `CenterDisplayLayout` / `CenterDisplayTextWidget` only; there is no shared responsive profile module yet.
- Shared text helpers (`TextLayoutEngine`, `TextLayoutComposite`, `TextTileLayout`) still contain layout-driving fixed floors, so numeric and coordinate widgets do not inherit the new compact fill behavior.
- `ActiveRouteTextWidget`, `XteHighwayPrimitives`, `LinearGaugeMath`, `SemicircleRadialEngine`, `FullCircleRadialEngine`, and `FullCircleRadialTextLayout` each own local size floors and spacing rules.
- The current custom lint/smell system does not yet block new hardcoded responsive-layout floors or missing adoption of a shared compact profile.
- Current tests validate some responsive behavior, but only `CenterDisplay` explicitly checks compact-vs-large linear compaction.

## Final Implementation Goal

- All instrument families derive small-widget compaction from one shared responsive profile contract.
- Layout-driving values use ratios or responsive-profile-derived floors instead of widget-local hard pixel minima.
- Small widgets linearly increase usable text fill and tighten whitespace without changing large-widget visuals.
- The shared engines carry most of the rollout:
  - `TextLayoutEngine` family for numeric and coordinate widgets
  - `LinearGaugeEngine` family for linear gauges
  - `SemicircleRadialEngine` for semicircle gauges
  - `FullCircleRadialEngine` / `FullCircleRadialTextLayout` for full-circle dials
- Dedicated widgets (`ActiveRoute`, `CenterDisplay`, `XTE`, `WindLinear`) only keep widget-specific orchestration after shared extraction.
- New lint/smell rules prevent regressions and move from `warn` to `block` once backlog reaches zero.

## Related Files

| File | Description | Planned/Actual Change |
|---|---|---|
| `documentation/PLAN2.md` | This rollout plan | Actual change in this session |
| `documentation/TABLEOFCONTENTS.md` | Documentation index | Actual change in this session |
| `shared/widget-kits/nav/CenterDisplayLayout.js` | Current compact reference profile | Planned refactor target: extract reusable responsive-profile logic |
| `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` | Current compact reference widget | Planned refactor target: consume shared profile after extraction |
| `shared/widget-kits/text/TextLayoutEngine.js` | Shared text layout facade | Planned change: expose shared responsive profile / compact inset helpers |
| `shared/widget-kits/text/TextLayoutComposite.js` | Shared text row/block layout | Planned change: remove layout-driving fixed floors and adopt profile scaling |
| `shared/widget-kits/text/TextTileLayout.js` | Shared metric/fitted line helper | Planned change: support compact text-fill scaling |
| `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js` | Numeric text renderer used across many clusters | Planned change |
| `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | Stacked coordinate/date/time renderer | Planned change |
| `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js` | Dedicated active-route renderer | Planned change |
| `shared/widget-kits/xte/XteHighwayPrimitives.js` | XTE layout geometry owner | Planned change |
| `widgets/text/XteDisplayWidget/XteDisplayWidget.js` | XTE renderer | Planned change |
| `shared/widget-kits/linear/LinearGaugeMath.js` | Linear layout owner | Planned change |
| `shared/widget-kits/linear/LinearGaugeEngine.js` | Linear gauge rendering pipeline | Planned change |
| `shared/widget-kits/linear/LinearGaugeTextLayout.js` | Linear text/tick-label helper | Planned change |
| `widgets/linear/WindLinearWidget/WindLinearWidget.js` | Dual-value linear layout | Planned change |
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Shared semicircle gauge pipeline | Planned change |
| `shared/widget-kits/radial/FullCircleRadialEngine.js` | Shared full-circle dial pipeline | Planned change |
| `shared/widget-kits/radial/FullCircleRadialTextLayout.js` | Full-circle text layout helper | Planned change |
| `widgets/radial/CompassRadialWidget/CompassRadialWidget.js` | Full-circle label sprite owner | Planned change |
| `config/components.js` | Component registry | Planned change: register new shared responsive module if extracted |
| `tools/check-patterns/rules.mjs` | Pattern-rule registry | Planned change: add responsive-layout anti-regression rules |
| `tools/check-smell-contracts.mjs` | Semantic contract checks | Planned change: add responsive adoption / coverage contract |
| `tests/tools/check-patterns.test.js` | Pattern-rule coverage | Planned change |
| `tests/tools/check-smell-contracts.test.js` | Contract-rule coverage | Planned change |

## Todo Steps

### Phase 0 - Lock the shared responsive contract first

1. Document the `CenterDisplay` behavior as the canonical compact-rendering baseline:
   - `minDim`-driven interpolation range
   - linear `textFillScale`
   - linearly reduced panel shares / caption bands on compact tiles
   - relative gaps and insets derived from available size
2. Define the repo-wide responsive contract:
   - layout-driving geometry should be ratio-based or profile-derived
   - small safety floors for canvas validity are allowed
   - larger user-visible layout/text floors must come from the shared profile, not widget-local literals
3. Decide the shared home for the new contract:
   - preferred: new shared module such as `shared/widget-kits/layout/ResponsiveScaleProfile.js`
   - acceptable fallback: extend an existing shared facade only if it does not create a hotspot
4. Keep the contract fail-fast:
   - no per-widget fallback compat layers
   - no second compact algorithm per widget family

### Phase 1 - Extract shared responsive profile infrastructure

1. Extract the reusable `CenterDisplay` compaction primitives into one shared module:
   - `computeProfile(W, H, spec)`
   - `minDim`
   - normalized interpolation `t`
   - `textFillScale`
   - optional spacing / share scale outputs
2. Expose helper functions for common layout owners:
   - responsive insets / gaps
   - responsive share scaling
   - responsive max-text-px scaling
3. Refactor `CenterDisplayLayout` to consume that shared module so the reference implementation and the shared contract cannot drift.
4. Add focused unit tests for the shared responsive profile:
   - compact widgets get stronger fill than medium widgets
   - medium widgets get stronger fill than large widgets
   - share scaling stays within expected min/max bounds

### Phase 2 - Upgrade the shared text pipeline first

1. Extend `TextLayoutEngine`, `TextLayoutComposite`, and `TextTileLayout` so compact text-fill scaling is available to all text widgets.
2. Replace layout-driving fixed floors in the shared text path with responsive-profile-derived values where appropriate.
3. Keep explicit small rendering guards (`0`, `1`, `2`, or equivalent canvas safety bounds) where they are purely technical rather than user-visible.
4. Migrate `ThreeValueTextWidget` to the shared compact profile.
5. Migrate `PositionCoordinateWidget` to the shared compact profile.
6. Add tests for compact-vs-large behavior in:
   - `tests/widgets/text/ThreeValueTextWidget.test.js`
   - `tests/widgets/text/PositionCoordinateWidget.test.js`
   - shared text helper tests if new shared module APIs are introduced

### Phase 3 - Migrate dedicated nav/text widgets

1. `ActiveRouteTextWidget`
   - move its layout to relative shares plus shared compact profile
   - remove local hard floors such as `40`, `16`, `12`, `6`, `4` where they control user-visible layout
   - keep the approach-state visual behavior unchanged
2. `XteHighwayPrimitives` + `XteDisplayWidget`
   - replace fixed layout floors for highway/name/metric regions with responsive-profile-derived rules
   - add compact text-fill scaling for waypoint name and metric tiles
   - preserve XTE highway geometry semantics and overflow behavior
3. `CenterDisplayTextWidget`
   - keep behavior as the reference
   - refactor only after shared extraction so it uses the same infrastructure as the rest of the repo
4. Add dedicated compact-layout regression tests for `ActiveRoute` and `XTE`, modeled after the current `CenterDisplay` tests.

### Phase 4 - Roll the profile into all linear gauges

1. Refactor `LinearGaugeMath.computeLayout()` so layout-driving widths/heights no longer depend on hardcoded display floors like `90`, `80`, `84`, `64`, `36`.
2. Refactor `LinearGaugeEngine` so:
   - track thickness
   - label font size
   - pointer size
   - marker size
   are derived from relative geometry plus the shared compact profile.
3. Refactor `LinearGaugeTextLayout` so caption/value/tick-label text uses compact fill scaling consistently.
4. Migrate `WindLinearWidget` after the shared linear pipeline is updated:
   - compact dual-column gap scaling
   - compact dual-row fill scaling
   - no local fixed gap floors beyond technical safety bounds
5. Verify all linear wrappers through shared and widget-level tests:
   - `SpeedLinearWidget`
   - `DepthLinearWidget`
   - `TemperatureLinearWidget`
   - `VoltageLinearWidget`
   - `CompassLinearWidget`
   - `WindLinearWidget`

### Phase 5 - Roll the profile into semicircle radial gauges

1. Refactor `SemicircleRadialEngine` text layout so caption/value/unit blocks use the shared compact profile.
2. Replace label/text-specific hard floors (`18`, `10`, `8`, `6`, `4`) where they are user-visible layout decisions rather than safety guards.
3. Keep range, sector, and pointer behavior unchanged.
4. If file-size pressure increases, split the text-specific logic into a shared radial text helper instead of growing `SemicircleRadialEngine.js` further.
5. Verify the full semicircle family:
   - `SpeedRadialWidget`
   - `DepthRadialWidget`
   - `TemperatureRadialWidget`
   - `VoltageRadialWidget`

### Phase 6 - Roll the profile into full-circle dials

1. Refactor `FullCircleRadialEngine.computeGeometry()` so ring, label inset, marker, and strip geometry honor the shared compact profile.
2. Refactor `FullCircleRadialTextLayout` so normal/high/flat text slots use compact fill scaling rather than fixed floors.
3. Update `CompassRadialWidget` sprite sizing / label radius rules to consume the new compact geometry.
4. Verify both full-circle dial families:
   - `WindRadialWidget`
   - `CompassRadialWidget`
5. Preserve current dial semantics:
   - upright compass labels
   - wind laylines
   - pointer behavior

### Phase 7 - Add fail-closed enforcement via linters and smell contracts

1. Add a new `check-patterns` rollout rule for layout-driving hard floors in widget/shared layout code.
   - target: user-visible layout/text minima such as `Math.max(16, ...)`, `Math.max(40, ...)`, `clamp(..., 10, ...)`
   - exclude: low-level canvas primitives, buffer sizing, and explicit safety guards
   - start as `warn`
2. Add a second `check-patterns` or `check-smell-contracts` rule that enforces adoption of the shared responsive profile in layout-owner modules.
   - target owners: shared text helpers, `ActiveRoute`, `XTE`, linear layout owner, semicircle engine, full-circle engine/text layout, `CenterDisplayLayout`
   - choose the semantic contract tool if file-text regex would be too brittle
3. Add tool tests covering both new rules.
4. Record any warn-only backlog in `documentation/TECH-DEBT.md`.
5. Promote the new rules to `block` only after warning backlog reaches zero, following the repo’s existing smell-prevention policy.

### Phase 8 - Documentation and guidance updates

1. Update widget docs so the new compact-rendering contract is documented where the shared engines live:
   - `documentation/widgets/center-display.md`
   - `documentation/shared/text-layout-engine.md`
   - `documentation/linear/linear-shared-api.md`
   - `documentation/radial/gauge-shared-api.md`
   - `documentation/radial/full-circle-dial-engine.md`
2. Update `documentation/conventions/coding-standards.md` with the new expectation that layout owners use the shared responsive profile instead of widget-local hard floors.
3. Update `documentation/conventions/smell-prevention.md` once the lint/smell rules exist.
4. Update the relevant “add new widget” guides so new instruments inherit the contract by default.

### Phase 9 - Verification and release gate

1. Add compact-size regression coverage to each affected family.
2. Run targeted widget and shared-engine tests while migrating each phase.
3. Run the full repo gate at the end: `npm run check:all`.
4. Manually compare a compact, medium, and large tile size for each family before closing the rollout.

## Acceptance Criteria

- A shared responsive-profile contract exists and `CenterDisplay` uses the same shared contract as the rest of the repo.
- All instrument families support linear small-widget text-fill compaction.
- Layout-driving hard floors have been removed or reduced to shared-profile-owned rules across:
  - shared text widgets
  - `ActiveRoute`
  - `XTE`
  - linear gauges
  - semicircle gauges
  - full-circle dials
- Only technical safety floors remain local.
- Custom lint/smell rules detect new regressions.
- Any warn-only rollout rules are tracked in `TECH-DEBT.md` until backlog is zero.
- `npm run check:all` passes after implementation.

## Completed Investigation

1. Read the mandatory preflight docs:
   - `documentation/TABLEOFCONTENTS.md`
   - `documentation/conventions/coding-standards.md`
   - `documentation/conventions/smell-prevention.md`
2. Read the documentation relevant to this task:
   - `documentation/widgets/center-display.md`
   - `documentation/conventions/documentation-format.md`
   - `documentation/PLAN.md`
   - `ARCHITECTURE.md`
3. Inspected the current compact reference implementation:
   - `shared/widget-kits/nav/CenterDisplayLayout.js`
   - `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`
   - `tests/shared/nav/CenterDisplayLayout.test.js`
   - `tests/widgets/text/CenterDisplayTextWidget.test.js`
4. Inspected the shared text pipeline:
   - `shared/widget-kits/text/TextLayoutEngine.js`
   - `shared/widget-kits/text/TextTileLayout.js`
   - `shared/widget-kits/text/TextLayoutComposite.js`
   - `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`
   - `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`
   - `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js`
5. Inspected the XTE pipeline:
   - `shared/widget-kits/xte/XteHighwayPrimitives.js`
   - `widgets/text/XteDisplayWidget/XteDisplayWidget.js`
6. Inspected the linear gauge pipeline:
   - `shared/widget-kits/linear/LinearGaugeMath.js`
   - `shared/widget-kits/linear/LinearGaugeEngine.js`
   - `shared/widget-kits/linear/LinearGaugeTextLayout.js`
   - `widgets/linear/WindLinearWidget/WindLinearWidget.js`
   - `widgets/linear/CompassLinearWidget/CompassLinearWidget.js`
7. Inspected the radial gauge pipelines:
   - `shared/widget-kits/radial/SemicircleRadialEngine.js`
   - `shared/widget-kits/radial/FullCircleRadialEngine.js`
   - `shared/widget-kits/radial/FullCircleRadialTextLayout.js`
   - `widgets/radial/WindRadialWidget/WindRadialWidget.js`
   - `widgets/radial/CompassRadialWidget/CompassRadialWidget.js`
8. Inspected the instrument inventory and routing:
   - `config/clusters/*.js`
   - `cluster/mappers/*.js`
   - `config/components.js`
9. Inspected the enforcement tooling:
   - `tools/check-patterns.mjs`
   - `tools/check-patterns/rules.mjs`
   - `tools/check-smell-contracts.mjs`
   - `tests/tools/check-patterns.test.js`
   - `tests/tools/check-smell-contracts.test.js`

## Open Questions / Validation Points

- Should the shared responsive contract live in a new cross-family layout module, or is extending `TextLayoutEngine` / `RadialValueMath` acceptable without creating a new hotspot?
- Which absolute floors remain acceptable as technical safety bounds, and where should the lint allowlist draw that line?
- Should compact-profile parameters remain internal constants, or become theme-owned/runtime-owned later?
- Is one shared `textFillScale` curve enough for text, linear, semicircle, full-circle, and XTE layouts, or do those families need separate curve specs on top of the same base helper?
- Does the team want compact-vs-large regression tests to assert geometry ratios, text max-px ceilings, or both?

## Relevant Information

- The current best reference is `CenterDisplay`, because it already combines:
  - relative geometry
  - measured layout hints
  - a linear `minDim` compaction profile
  - explicit compact-vs-large tests
- The biggest leverage points are the shared engines, not the cluster mappers:
  - shared text pipeline
  - shared linear pipeline
  - shared semicircle pipeline
  - shared full-circle pipeline
- Current hotspots still using hard layout floors include:
  - `ActiveRouteTextWidget`
  - `XteHighwayPrimitives`
  - `LinearGaugeMath`
  - `SemicircleRadialEngine`
  - `FullCircleRadialEngine`
  - `FullCircleRadialTextLayout`
- The safest rollout order is:
  1. extract the shared profile from `CenterDisplay`
  2. upgrade the shared text pipeline
  3. migrate dedicated nav/text widgets
  4. migrate linear gauges
  5. migrate semicircle gauges
  6. migrate full-circle dials
  7. add lint/smell enforcement and promote rules after backlog cleanup

## Related

- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
- [PLAN.md](PLAN.md)
- [widgets/center-display.md](widgets/center-display.md)
- [conventions/coding-standards.md](conventions/coding-standards.md)
- [conventions/smell-prevention.md](conventions/smell-prevention.md)
- [TECH-DEBT.md](TECH-DEBT.md)
