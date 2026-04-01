# Implementation Plan

**Status:** ✅ Implemented | Phases 1-9 implemented; rollout fully closed on `2026-03-09`

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
| `ThreeValueTextWidget` | Uses shared text compaction via `TextLayoutEngine.computeResponsiveInsets()` plus composite `textFillScale` consumption in `high` / `normal` modes. Flat mode now benefits from compact insets and the lowered inline minimum fit floor. | Phase 2 is implemented for numeric kinds across `anchor`, `speed`, `environment`, `vessel`, `wind`, `courseHeading`, and `nav`. |
| `PositionCoordinateWidget` | Uses shared text compaction via `TextLayoutEngine.computeResponsiveInsets()` for stacked and flat layouts while preserving renderer-owned axis-formatting and emoji guard behavior. | Phase 2 is implemented for `positionBoat`, `positionWp`, `dateTime`, and `timeStatus`. |
| `ActiveRouteTextWidget` | Has ratio modes, but layout uses local hard floors like `40`, `16`, `12`, `6`, `4` and no linear fill boost. | Needs dedicated layout refactor on top of the shared profile. |
| `XteDisplayWidget` + `XteHighwayPrimitives` | Ratio modes exist, but layout reserves large fixed floors (`40`, `24`, `20`, `16`, `12`, `10`) for highway/text panels. | Needs both geometry compaction and text-fill compaction. |
| `LinearGaugeLayout` + `LinearGaugeEngine` + `LinearGaugeMath` + `LinearGaugeTextLayout` | Linear-family layout ownership now lives in `LinearGaugeLayout`, the engine consumes shared responsive insets/geometry, and text rows use compact fill scaling without widget-local hard layout floors. | Phase 4 is implemented for the shared linear pipeline. |
| `WindLinearWidget` | Dual-value text layout now keeps its widget-specific orchestration while consuming layout-owned compact dual gaps from `LinearGaugeLayout`. | Phase 4 is implemented for the wind-specific follow-up. |
| `SemicircleRadialLayout` + `SemicircleRadialTextLayout` + `SemicircleRadialEngine` | Semicircle-family responsive layout ownership now lives in `SemicircleRadialLayout`, mode-routed fitting/draw is delegated to `SemicircleRadialTextLayout`, and the engine consumes shared compact geometry/text state without widget-local hard layout floors. | Phase 5 is implemented for the shared semicircle pipeline. |
| `FullCircleRadialLayout` + `FullCircleRadialEngine` + `FullCircleRadialTextLayout` | Full-circle-family responsive layout ownership now lives in `FullCircleRadialLayout`, the engine consumes layout-owned compact geometry/state, and full-circle text slots use compact fill scaling without widget-local hard layout floors. | Phase 6 is implemented for the shared full-circle pipeline. |

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

- `ResponsiveScaleProfile` now owns the shared base compaction curve, and both `CenterDisplayLayout` and the shared text pipeline consume it.
- Dedicated nav/text ownership is now routed through `ActiveRouteLayout` and `XteHighwayLayout`, and `TextTileLayout` / `LinearGaugeTextLayout` now consume layout-owned spacing without residual responsive-floor backlog.
- Phase 7 enforcement is now fully fail-closed: both responsive ownership and responsive hard-floor drift block once introduced.
- Current tests now validate compact-vs-large text compaction for `CenterDisplay`, `ThreeValueTextWidget`, `PositionCoordinateWidget`, and the shared text engine.

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
| `documentation/TABLEOFCONTENTS.md` | Documentation index | No change required in this session |
| `shared/widget-kits/layout/ResponsiveScaleProfile.js` | Shared runtime owner for the base compact curve | Actual change in this session |
| `shared/widget-kits/nav/CenterDisplayLayout.js` | Current compact reference profile | Actual change in this session: now consumes `ResponsiveScaleProfile` |
| `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` | Current compact reference widget | No runtime change in this session; behavior preserved through `CenterDisplayLayout` |
| `shared/widget-kits/text/TextLayoutEngine.js` | Shared text layout facade | Actual change in this session: now consumes `ResponsiveScaleProfile`, exposes `computeResponsiveInsets()`, and wraps `scaleMaxTextPx()` |
| `shared/widget-kits/text/TextLayoutComposite.js` | Shared text row/block layout | Actual change in this session: removed user-visible fit floors and added compact `textFillScale` consumption for shared stacked layouts |
| `shared/widget-kits/text/TextTileLayout.js` | Shared metric/fitted line helper | Actual change in this session: consumes layout-owned metric padding/caption-band spacing and keeps only technical `1/2px` guards |
| `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js` | Numeric text renderer used across many clusters | Actual change in this session: now uses shared responsive insets and compact text-fill scaling |
| `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | Stacked coordinate/date/time renderer | Actual change in this session: now uses shared responsive insets and compact text-fill scaling |
| `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js` | Dedicated active-route renderer | Actual change in this session: passes layout-owned metric tile spacing into `TextTileLayout` |
| `shared/widget-kits/xte/XteHighwayPrimitives.js` | XTE layout geometry owner | Planned change |
| `widgets/text/XteDisplayWidget/XteDisplayWidget.js` | XTE renderer | Actual change in this session: passes layout-owned metric tile spacing into `TextTileLayout` |
| `shared/widget-kits/linear/LinearGaugeLayout.js` | Linear-family responsive layout owner | Actual change in this session |
| `shared/widget-kits/linear/LinearGaugeMath.js` | Linear axis/tick/value helper | Actual change in this session: layout ownership removed |
| `shared/widget-kits/linear/LinearGaugeEngine.js` | Linear gauge rendering pipeline | Actual change in this session: now consumes `LinearGaugeLayout` and exposes responsive state |
| `shared/widget-kits/linear/LinearGaugeTextLayout.js` | Linear text/tick-label helper | Actual change in this session: compact fill scaling applied to caption/value/inline fits |
| `widgets/linear/WindLinearWidget/WindLinearWidget.js` | Dual-value linear layout | Actual change in this session: consumes layout-owned dual-column gaps from `LinearGaugeLayout` |
| `shared/widget-kits/radial/SemicircleRadialLayout.js` | Semicircle-family responsive layout owner | Actual change in this session |
| `shared/widget-kits/radial/SemicircleRadialTextLayout.js` | Shared semicircle text/caching helper | Actual change in this session |
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Shared semicircle gauge pipeline | Actual change in this session: now consumes `SemicircleRadialLayout` and `SemicircleRadialTextLayout` |
| `shared/widget-kits/radial/FullCircleRadialLayout.js` | Full-circle-family responsive layout owner | Actual change in this session |
| `shared/widget-kits/radial/FullCircleRadialEngine.js` | Shared full-circle dial pipeline | Actual change in this session: now consumes `FullCircleRadialLayout` and exposes layout-owned responsive state |
| `shared/widget-kits/radial/FullCircleRadialTextLayout.js` | Full-circle text layout helper | Actual change in this session: now consumes layout-owned safe bounds plus compact text-fill scaling |
| `widgets/radial/CompassRadialWidget/CompassRadialWidget.js` | Full-circle label sprite owner | Actual change in this session: now consumes layout-owned label/pointer/marker geometry |
| `config/components.js` | Component registry | Actual change in this session: registered `LinearGaugeLayout` and updated `LinearGaugeEngine` deps |
| `tools/check-patterns/rules.mjs` | Pattern-rule registry | Actual change in this session: registered responsive rollout + ownership enforcement rules |
| `tools/check-patterns/rules-responsive.mjs` | Responsive rule runners | Actual change in this session: new hard-floor and ownership checks |
| `tests/tools/check-patterns-responsive.test.js` | Responsive pattern-rule coverage | Actual change in this session |

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
   - chosen owner: new shared module `shared/widget-kits/layout/ResponsiveScaleProfile.js`
   - do not extend `TextLayoutEngine` or `RadialValueMath` with compaction ownership; keep those as consumers/facades
4. Keep the contract fail-fast:
   - no per-widget fallback compat layers
   - no second compact algorithm per widget family

### Phase 1 - Extract shared responsive profile infrastructure

Status: implemented. `ResponsiveScaleProfile` now exists as the shared runtime owner, `CenterDisplayLayout` consumes it, and exact profile outputs are locked in dedicated shared-module tests.

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

Status: implemented. `TextLayoutEngine` now consumes `ResponsiveScaleProfile`, shared stacked text fits accept compact `textFillScale`, `ThreeValueTextWidget` and `PositionCoordinateWidget` use the shared compact insets, and targeted shared/widget tests lock the compact-vs-large behavior.

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

Status: implemented. `LinearGaugeLayout` now owns linear-family responsive layout, `LinearGaugeMath` is reduced to pure axis/tick/value helpers, `LinearGaugeEngine` consumes layout-owned responsive geometry and exposes `state.responsive` / `state.textFillScale`, `LinearGaugeTextLayout` scales caption/value/inline fits via the shared compact profile, and `WindLinearWidget` keeps only ratio-based dual-gap orchestration on top of the shared pipeline.

1. Extract linear-family responsive layout ownership into `LinearGaugeLayout` so layout-driving widths/heights no longer depend on hardcoded display floors like `90`, `80`, `84`, `64`, `36`.
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

Status: implemented. `SemicircleRadialLayout` now owns semicircle-family responsive geometry and label metrics, `SemicircleRadialTextLayout` owns flat/high/normal fit caching plus compact text ceilings, and `SemicircleRadialEngine` is reduced to shared rendering orchestration over the new ownership split.

1. Refactor `SemicircleRadialEngine` text layout so caption/value/unit blocks use the shared compact profile.
2. Replace label/text-specific hard floors (`18`, `10`, `8`, `6`, `4`) where they are user-visible layout decisions rather than safety guards.
3. Keep range, sector, and pointer behavior unchanged.
4. Split the text-specific logic into a shared radial text helper and move responsive geometry ownership into a dedicated semicircle layout module instead of growing `SemicircleRadialEngine.js`.
5. Verify the full semicircle family:
   - `SpeedRadialWidget`
   - `DepthRadialWidget`
   - `TemperatureRadialWidget`
   - `VoltageRadialWidget`

### Phase 6 - Roll the profile into full-circle dials

Status: implemented. `FullCircleRadialLayout` now owns full-circle responsive geometry and label metrics, `FullCircleRadialEngine` is reduced to shared orchestration over layout-owned state, `FullCircleRadialTextLayout` consumes shared compact text fill plus layout-owned safe bounds, and both `CompassRadialWidget` and `WindRadialWidget` consume the new compact geometry contract.

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

Status: implemented. Phase 7 now runs fully fail-closed on `2026-03-09`: `responsive-profile-ownership` and `responsive-layout-hard-floor` both sit at `0` findings, both rules are `block`, and dedicated tool coverage locks the ownership/hard-floor contract.

1. Add a new `check-patterns` rollout rule for layout-driving hard floors in widget/shared layout code.
   - target: user-visible layout/text minima such as `Math.max(16, ...)`, `Math.max(40, ...)`, `clamp(..., 10, ...)`
   - exclude: low-level canvas primitives, buffer sizing, and explicit safety guards
   - start as `warn`
2. Add a second `check-patterns` or `check-smell-contracts` rule that enforces adoption of the shared responsive profile in layout-owner modules.
   - target owners: `TextLayoutEngine`, `CenterDisplayLayout`, `ActiveRouteLayout`, `XteHighwayLayout`, `LinearGaugeLayout`, `SemicircleRadialLayout`, `FullCircleRadialLayout`
   - forbid direct `ResponsiveScaleProfile` imports in consumer modules that should read layout-owned state instead
3. Add tool tests covering both new rules.
4. Record any warn-only backlog in `documentation/TECH-DEBT.md`.
5. Promote the new rules to `block` only after warning backlog reaches zero, following the repo’s existing smell-prevention policy.

### Phase 8 - Documentation and guidance updates

Status: implemented. Phase 8 aligned the shared docs, authoring guides, and maintenance notes with the responsive ownership contract. The remaining work was guidance-layer cleanup only; no additional runtime/API changes were needed.

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

Status: implemented. Phase 9 adds owner-level compact/medium/large progression assertions for `ActiveRouteLayout` and `XteHighwayLayout`, reruns the targeted owner suites, and revalidates the full repo gate on `2026-03-09`. `npm run check:all` passed, `node tools/check-patterns.mjs` reports `responsive-layout-hard-floor=0` and `responsive-profile-ownership=0`, and representative compact/medium/large layout snapshots were reviewed through the existing owner/widget test harnesses for `CenterDisplay`, shared text renderers, `ActiveRoute`, `XTE`, linear gauges, semicircle gauges, and full-circle dials. The rollout closes with no remaining responsive enforcement debt.

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
   - `documentation/PLAN1.md`
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

## Phase 0 Decisions

- Shared owner: use a new cross-family layout module `shared/widget-kits/layout/ResponsiveScaleProfile.js`.
- Ownership boundary: `TextLayoutEngine`, radial/linear engines, and dedicated widgets consume the shared profile; they do not own the compaction curve.
- Safety floors: local literals are acceptable only for technical safety bounds (`0`, `1`, `2`, or equivalent non-visual guards). User-visible floors remain shared-profile-owned.
- Constant ownership: compact-profile constants stay JS-owned in runtime/shared code for now; they do not move to theme tokens, `plugin.css`, or editable parameters in this rollout phase.
- Base curve policy: one shared `minDim -> t` curve is the contract for all families. Family-specific named scales may layer on top of that base profile, but they must not replace it.
- Regression strategy: Phase 0 locks exact/tight-tolerance shared-profile outputs in `CenterDisplayLayout` tests and keeps renderer-level compact-fill behavior covered in `CenterDisplayTextWidget` tests.

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
- [PLAN1.md](PLAN1.md)
- [shared/responsive-scale-profile.md](shared/responsive-scale-profile.md)
- [widgets/center-display.md](widgets/center-display.md)
- [conventions/coding-standards.md](conventions/coding-standards.md)
- [conventions/smell-prevention.md](conventions/smell-prevention.md)
- [TECH-DEBT.md](TECH-DEBT.md)
