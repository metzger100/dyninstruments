# Quality Scorecard

**Last updated:** 2026-02-28

## Layer Health

| Layer | Files | Headers | Size OK | Tests | Duplicates | Grade |
|---|---:|---|---|---|---|---|
| runtime/ | 6 | all | all | ✅ (6/6) | none | B |
| config/ | 12 | all | all | ✅ (9 tests incl. static cluster coverage) | none | A |
| cluster/ | 11 | all | all | ✅ (11/11) | none | B |
| shared/ | 8 | all | all | partial (3/8) | none | B |
| widgets/gauges/ | 6 | all | all | partial (5/6) | none | B |
| widgets/text/ | 2 | all | all | partial (1/2) | none | B |

Notes:
- `Size OK = check` means no `>400` violations but at least one `>=300` warning.
- Strict grading is applied: unresolved medium/high drift prevents an `A`.
- Smell prevention gate is fail-closed (see `documentation/conventions/smell-prevention.md`).

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| Cross-file clone drift (renamed helpers + long copy-paste blocks) | HIGH | Previously under-detected by name-based duplicate rule | ✅ Fixed (`check-patterns`: `duplicate-functions: 0`, `duplicate-block-clones: 0`) |
| Direct `avnav.api` access in non-runtime code | HIGH | Previously in `GaugeValueMath`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `PositionCoordinateWidget` | ✅ Fixed (`check-patterns`: `forbidden-globals: 0`) |
| Empty catch blocks | MED | Previously in `ClusterRendererRouter`, `runtime/helpers`, `GaugeValueMath`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `PositionCoordinateWidget` | ✅ Fixed (`check-patterns`: `empty-catch: 0`) |
| Oneliner line-limit bypass risk | HIGH | Previously in runtime/shared/widgets (backlog cleared) | ✅ Fixed (`check:filesize` is fail-closed with `--oneliner=block`; latest summary: `onelinerWarnings: 0`) |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |
| Cross-layer helper extraction + dependency cleanup | GPT-5 Codex | Good | Cleared all `duplicate-functions` findings and fixed widget dependency direction without render regressions. |
| Formatter-boundary refactor (`Helpers.applyFormatter`) | GPT-5 Codex | Good | Removed forbidden global access findings and added wind gauge unit tests while preserving formatter output paths. |
| Aggressive duplication detection hardening | GPT-5 Codex | Good | Replaced name-based duplicate detection with body/clone checks and extracted shared semicircle tick-step resolvers. |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
