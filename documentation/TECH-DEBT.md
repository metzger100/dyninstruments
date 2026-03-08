# Technical Debt Tracker

**Status:** ✅ Active | Updated with each cleanup pass

## Active Items

| ID | Area | Description | Impact | Priority |
|---|---|---|---|---|
| TD-014 | Smell enforcement | `mapper-output-complexity` remains mixed-severity (`warn` at `9..12`, `block` at `>12`). Current backlog is `0` warnings (`check-patterns` summary on `2026-02-28`); promotion criteria/date is still pending. | Medium | Medium |
| TD-015 | Shared gauge engine size hotspots | `check:filesize` reports 4 warning-tier files (`>=300` non-empty lines): `FullCircleRadialEngine.js`, `FullCircleRadialTextLayout.js`, `RadialValueMath.js`, `SemicircleRadialEngine.js`. Further extractions are needed to keep growth below hard limit. | Medium | Medium |
| TD-016 | Fail-fast fallback rollout | Warn-only fallback/legacy backlog introduced on `2026-03-06`: `233` total warnings from `node tools/check-patterns.mjs --warn` (`catch-fallback-without-suppression=8`, `internal-hook-fallback=8`, `redundant-null-type-guard=24`, `hardcoded-runtime-default=137`, `css-js-default-duplication=36`, `premature-legacy-support=20`). Promotion rule: each warn-only rule moves to `block` only after its repo warning count reaches `0` and that zero-warning state is recorded here. | High | High |
| TD-017 | Plugin-wide compact spacing system | Multiple widgets still size row gaps, panel gaps, and padding with helpers or local formulas that stay too large on small dashboard tiles. Extract a shared intrinsic spacing contract so compact widgets derive spacing from available canvas size and row count, with gaps that shrink on small tiles and expand on large tiles. Apply that contract across text and gauge layout helpers instead of fixing each widget ad hoc. | High | High |

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

## Rules

- Add items when you discover drift, inconsistency, or missing enforcement.
- Prioritize by agent impact: what most harms generated implementation quality.
- Complete items only after the fix is implemented, then move the item to Completed with date and resolution summary.

## Related

- [QUALITY.md](QUALITY.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
