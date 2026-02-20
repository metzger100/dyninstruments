# Technical Debt Tracker

**Status:** ✅ Active | Updated with each cleanup pass

## Active Items

| ID | Area | Description | Impact | Priority |
|---|---|---|---|---|
| TD-008 | widgets | Direct `avnav.api` access in `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` bypasses runtime formatter boundary | Boundary violation increases guard-pattern duplication and drift | HIGH |
| TD-009 | cluster + runtime + widgets | Empty catch blocks in `ClusterRendererRouter`, `runtime/helpers`, `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` | Silent failures hide defects and complicate debugging | MED |

## Completed Items

| ID | Date | Resolution |
|---|---|---|
| TD-001 | 2026-02-20 | Moved `extractNumberText` to `GaugeValueMath.extractNumberText`; all semicircle wrappers consume shared helper. |
| TD-002 | 2026-02-20 | Moved high-end sector construction to `GaugeValueMath.buildHighEndSectors`; speed and temperature wrappers now delegate to shared utility. |
| TD-003 | 2026-02-20 | Moved low-end sector construction to `GaugeValueMath.buildLowEndSectors` with optional defaults; depth and voltage behavior preserved via shared options. |
| TD-004 | 2026-02-20 | Moved speed string formatting to `GaugeValueMath.formatSpeedString`; speed gauge and wind dial now share one implementation. |
| TD-005 | 2026-02-20 | Unified mode detection in text widgets via `GaugeValueMath.computeMode`; duplicate local ratio mode logic removed there. |
| TD-006 | 2026-02-20 | Removed local `clamp` copies in text widgets; both now consume `GaugeValueMath.clamp`. |
| TD-007 | 2026-02-20 | Removed local text helper duplicates by reusing `GaugeTextLayout.setFont`, `GaugeTextLayout.drawDisconnectOverlay`, and `GaugeTextLayout.fitSingleTextPx`. |
| TD-010 | 2026-02-20 | Removed widget-to-widget dependency: `PositionCoordinateWidget` no longer depends on `ThreeValueTextWidget`; dependency graph now follows layer rules. |

## Rules

- Add items when you discover drift, inconsistency, or missing enforcement.
- Prioritize by agent impact: what most harms generated implementation quality.
- Complete items only after the fix is implemented, then move the item to Completed with date and resolution summary.

## Related

- [QUALITY.md](QUALITY.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
