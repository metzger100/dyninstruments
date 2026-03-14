# Technical Debt Tracker

**Status:** ✅ Active | Updated with each cleanup pass

## Active Items

| ID | Area | Description | Impact | Priority |
|---|---|---|---|---|
| TD-014 | Smell enforcement | `mapper-output-complexity` remains mixed-severity (`warn` at `9..12`, `block` at `>12`). Current backlog is `0` warnings (`check-patterns` summary on `2026-02-28`); promotion criteria/date is still pending. | Medium | Medium |
| TD-015 | File-size hotspot backlog | `check:filesize` reports 9 warning-tier files (`>=300` non-empty lines): `config/clusters/environment.js`, `config/components.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/radial/FullCircleRadialTextLayout.js`, `shared/widget-kits/radial/RadialValueMath.js`, `shared/widget-kits/radial/SemicircleRadialTextLayout.js`, `shared/widget-kits/text/TextLayoutComposite.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, and `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`. Further extractions are needed to keep growth below the hard limit. | Medium | Medium |

## Completed Items

| ID | Date | Resolution |
|---|---|---|
| TD-001 | 2026-02-20 | Moved `extractNumberText` to `RadialValueMath.extractNumberText`; all semicircle wrappers consume shared helper. |
| TD-002 | 2026-02-20 | Moved high-end sector construction to `RadialValueMath.buildHighEndSectors`; speed and temperature wrappers now delegate to shared utility. |
| TD-003 | 2026-02-20 | Moved low-end sector construction to `RadialValueMath.buildLowEndSectors` with optional defaults; depth and voltage behavior preserved via shared options. |
| TD-004 | 2026-02-20 | Unified speed formatting behavior and removed duplicate widget-local logic; graphic speed rendering now routes through shared formatter boundary. |
| TD-005 | 2026-02-20 | Unified mode detection in text widgets via `RadialValueMath.computeMode`; duplicate local ratio mode logic removed there. |
| TD-006 | 2026-02-20 | Removed local `clamp` copies in text widgets; both now consume `RadialValueMath.clamp`. |
| TD-007 | 2026-02-20 | Removed local text helper duplicates by reusing `RadialTextLayout.setFont`, `RadialTextLayout.drawDisconnectOverlay`, and `RadialTextLayout.fitSingleTextPx`. |
| TD-009 | 2026-02-20 | Annotated intentional fallback catches in `ClusterRendererRouter`, `runtime/helpers`, `RadialValueMath`, `TemperatureRadialWidget`, `VoltageRadialWidget`, and `PositionCoordinateWidget`; production empty-catch findings cleared. |
| TD-010 | 2026-02-20 | Removed widget-to-widget dependency: `PositionCoordinateWidget` no longer depends on `ThreeValueTextWidget`; dependency graph now follows layer rules. |
| TD-008 | 2026-02-20 | Removed direct `avnav.api` access from `SpeedRadialWidget`, `TemperatureRadialWidget`, `VoltageRadialWidget`, `WindRadialWidget`, and `PositionCoordinateWidget`; all formatter access now goes through `Helpers.applyFormatter` with mapper-provided formatter props. |
| TD-011 | 2026-02-21 | Added fail-closed smell prevention program (pattern + semantic contracts), falsy-default preservation, theme cache invalidation contract, stale dynamic key cleanup, and pre-push full-gate hook workflow. |
| TD-012 | 2026-02-21 | Cleared oneliner backlog to zero (`onelinerWarnings=0`), promoted `check:filesize` to block mode, and wired `check:core`/`check:all` to fail on dense/packed oneliners. |
| TD-013 | 2026-02-28 | Replaced name-based duplicate detection with body/shape clone checks (`duplicate-functions`, `duplicate-block-clones`) and extracted shared semicircle tick-step resolvers in `RadialValueMath` for gauge wrappers. |
| TD-016 | 2026-03-09 | Cleared the earlier warn-only fallback/legacy backlog to zero; `node tools/check-patterns.mjs` on March 9, 2026 reported `0` warnings for `catch-fallback-without-suppression`, `internal-hook-fallback`, `redundant-null-type-guard`, `hardcoded-runtime-default`, `css-js-default-duplication`, and `premature-legacy-support`. |
| TD-017 | 2026-03-09 | Added shared intrinsic spacing helpers in `ResponsiveScaleProfile`, routed `CenterDisplay`, `ActiveRoute`, `XTE`, and `WindLinear` spacing through layout-owned APIs/state, and removed the remaining widget-local compact gap/padding formulas across the responsive-layout surface. |
| TD-018 | 2026-03-09 | Cleared `responsive-layout-hard-floor` to `0` findings, promoted the rule to `block`, updated responsive rule coverage to fail-closed, and revalidated the zero-backlog state with `node tools/check-patterns.mjs`. |
| TD-019 | 2026-03-10 | Promoted `internal-hook-fallback`, `redundant-null-type-guard`, `hardcoded-runtime-default`, `widget-renderer-default-duplication`, `engine-layout-default-drift`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing`, `framework-method-typeof-guard`, and `inline-config-default-duplication` to `block`. Updated severity-sensitive checker coverage, resynced the enforcement-owner docs, and revalidated the repo with `node tools/check-patterns.mjs` (`failures=0`, `warnings=0`) plus `npm run check:all` passing with `78/78` test files and `475/475` tests green on March 10, 2026. |
| TD-020 | 2026-03-10 | Removed the last voltage wrapper-owned `rangeDefaults` and the redundant `VoltageRadialWidget` sector fallback literals so all config-backed gauge wrappers now trust the editable/default boundary for min/max and threshold values. Resynced the affected debt and widget docs to the live March 10, 2026 state. |

## Rules

- Add items when you discover drift, inconsistency, or missing enforcement.
- Prioritize by agent impact: what most harms generated implementation quality.
- Complete items only after the fix is implemented, then move the item to Completed with date and resolution summary.

## Related

- [QUALITY.md](QUALITY.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
