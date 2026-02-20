# Quality Scorecard

**Last updated:** 2026-02-20

## Layer Health

| Layer | Files | Headers | Size OK | Tests | Duplicates | Grade |
|---|---:|---|---|---|---|---|
| runtime/ | 6 | all | all | ✅ (6/6) | none | B |
| config/ | 12 | all | all | ✅ (9 tests incl. static cluster coverage) | none | A |
| cluster/ | 11 | all | all | ✅ (11/11) | `norm360`, `norm180` overlap | B |
| shared/ | 8 | all | all | partial (3/8) | math/text helper overlaps | B |
| widgets/gauges/ | 6 | all | check (1 near-limit warn) | partial (4/6) | multiple duplicated helpers | C |
| widgets/text/ | 2 | all | all | partial (1/2) | duplicated helpers + boundary violation | C |

Notes:
- `Size OK = check` means no `>300` violations but at least one `>250` warning.
- Strict grading is applied: unresolved medium/high drift prevents an `A`.

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| `extractNumberText` duplicated | HIGH | `DepthGaugeWidget`, `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget` | 🔴 Unfixed |
| `buildHighEndSectors` duplicated | HIGH | `SpeedGaugeWidget`, `TemperatureGaugeWidget` | 🔴 Unfixed |
| `buildLowEndSectors` diverged | HIGH | `DepthGaugeWidget`, `VoltageGaugeWidget` (different defaults in voltage) | 🔴 Unfixed |
| `formatSpeed` / `formatSpeedString` duplicated | MED | `SpeedGaugeWidget`, `WindDialWidget` | 🔴 Unfixed |
| Mode detection duplicated | LOW | `WindDialWidget`, `CompassGaugeWidget`, `PositionCoordinateWidget`, `ThreeValueTextWidget` | 🔴 Unfixed |
| `clamp` duplicated where shared version exists | MED | `GaugeValueMath`, `PositionCoordinateWidget`, `ThreeValueTextWidget` | 🔴 Unfixed |
| `setFont` / `drawDisconnectOverlay` / `fitSingleTextPx` duplicated | MED | `PositionCoordinateWidget`, `ThreeValueTextWidget` | 🔴 Unfixed |
| Direct `avnav.api` access in widgets | HIGH | `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` | 🔴 Unfixed |
| Empty catch blocks | MED | `ClusterRendererRouter`, `runtime/helpers`, `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` | 🔴 Unfixed |
| Widget-to-widget dependency direction violation | HIGH | `PositionCoordinateWidget -> ThreeValueTextWidget` | 🔴 Unfixed |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
