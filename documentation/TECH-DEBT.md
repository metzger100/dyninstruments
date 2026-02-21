# Technical Debt Tracker

**Status:** ✅ Active | Updated with each cleanup pass

## Active Items

| ID | Area | Description | Impact | Priority |
|---|---|---|---|---|
| — | — | No active high-priority technical debt items currently tracked. | — | — |

## Completed Items

| ID | Date | Resolution |
|---|---|---|
| TD-001 | 2026-02-20 | Moved `extractNumberText` to `GaugeValueMath.extractNumberText`; all semicircle wrappers consume shared helper. |
| TD-002 | 2026-02-20 | Moved high-end sector construction to `GaugeValueMath.buildHighEndSectors`; speed and temperature wrappers now delegate to shared utility. |
| TD-003 | 2026-02-20 | Moved low-end sector construction to `GaugeValueMath.buildLowEndSectors` with optional defaults; depth and voltage behavior preserved via shared options. |
| TD-004 | 2026-02-20 | Unified speed formatting behavior and removed duplicate widget-local logic; graphic speed rendering now routes through shared formatter boundary. |
| TD-005 | 2026-02-20 | Unified mode detection in text widgets via `GaugeValueMath.computeMode`; duplicate local ratio mode logic removed there. |
| TD-006 | 2026-02-20 | Removed local `clamp` copies in text widgets; both now consume `GaugeValueMath.clamp`. |
| TD-007 | 2026-02-20 | Removed local text helper duplicates by reusing `GaugeTextLayout.setFont`, `GaugeTextLayout.drawDisconnectOverlay`, and `GaugeTextLayout.fitSingleTextPx`. |
| TD-009 | 2026-02-20 | Annotated intentional fallback catches in `ClusterRendererRouter`, `runtime/helpers`, `GaugeValueMath`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, and `PositionCoordinateWidget`; production empty-catch findings cleared. |
| TD-010 | 2026-02-20 | Removed widget-to-widget dependency: `PositionCoordinateWidget` no longer depends on `ThreeValueTextWidget`; dependency graph now follows layer rules. |
| TD-008 | 2026-02-20 | Removed direct `avnav.api` access from `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, and `PositionCoordinateWidget`; all formatter access now goes through `Helpers.applyFormatter` with mapper-provided formatter props. |
| TD-011 | 2026-02-21 | Added fail-closed smell prevention program (pattern + semantic contracts), falsy-default preservation, theme cache invalidation contract, stale dynamic key cleanup, and pre-push full-gate hook workflow. |

## Rules

- Add items when you discover drift, inconsistency, or missing enforcement.
- Prioritize by agent impact: what most harms generated implementation quality.
- Complete items only after the fix is implemented, then move the item to Completed with date and resolution summary.

## Related

- [QUALITY.md](QUALITY.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
