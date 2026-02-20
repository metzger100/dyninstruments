# Technical Debt Tracker

**Status:** ✅ Active | Updated with each cleanup pass

## Active Items

| ID | Area | Description | Impact | Priority |
|---|---|---|---|---|
| TD-001 | widgets/gauges | `extractNumberText` duplicated in `DepthGaugeWidget`, `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget` | Agent output can copy local helper pattern instead of shared utility | HIGH |
| TD-002 | widgets/gauges | `buildHighEndSectors` duplicated in `SpeedGaugeWidget` and `TemperatureGaugeWidget` | Dual maintenance and drift risk in high-end sector behavior | HIGH |
| TD-003 | widgets/gauges | `buildLowEndSectors` diverged between `DepthGaugeWidget` and `VoltageGaugeWidget` (voltage uses different defaults) | Inconsistent defaults can create subtle behavior bugs | HIGH |
| TD-004 | widgets/gauges | `formatSpeed` / `formatSpeedString` duplicated in `SpeedGaugeWidget` and `WindDialWidget` | Formatting changes require multi-file updates | MED |
| TD-005 | widgets/text + widgets/gauges | Mode detection (`ratio -> high/normal/flat`) duplicated in `WindDialWidget`, `CompassGaugeWidget`, `PositionCoordinateWidget`, `ThreeValueTextWidget` | Agent output can repeat local mode logic instead of shared rules | LOW |
| TD-006 | shared + widgets/text | `clamp` duplicated across `GaugeValueMath`, `PositionCoordinateWidget`, and `ThreeValueTextWidget` | Boundary logic can drift between implementations | MED |
| TD-007 | widgets/text | `setFont`, `drawDisconnectOverlay`, and `fitSingleTextPx` duplicated in `PositionCoordinateWidget` and `ThreeValueTextWidget` | Text rendering fixes must be replicated manually | MED |
| TD-008 | widgets | Direct `avnav.api` access in `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` bypasses runtime formatter boundary | Boundary violation increases guard-pattern duplication and drift | HIGH |
| TD-009 | cluster + runtime + widgets | Empty catch blocks in `ClusterRendererRouter`, `runtime/helpers`, `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` | Silent failures hide defects and complicate debugging | MED |
| TD-010 | architecture/widgets | Dependency rule violation: `PositionCoordinateWidget -> ThreeValueTextWidget` | Breaks layer contract and can spread forbidden widget coupling | HIGH |

## Completed Items

| ID | Date | Resolution |
|---|---|---|
| — | — | Move resolved items from Active Items here with date and implemented fix. |

## Rules

- Add items when you discover drift, inconsistency, or missing enforcement.
- Prioritize by agent impact: what most harms generated implementation quality.
- Complete items only after the fix is implemented, then move the item to Completed with date and resolution summary.

## Related

- [QUALITY.md](QUALITY.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
