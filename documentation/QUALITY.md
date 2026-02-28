# Quality Scorecard

**Last updated:** 2026-02-28

## Layer Health

| Layer | Files | Headers | Size OK | Tests | Duplicates | Grade |
|---|---:|---|---|---|---|---|
| runtime/ | 6 | all | all | ✅ (6/6) | none | A |
| config/ | 12 | all | all | ✅ (9 tests incl. static cluster coverage) | none | A |
| cluster/ | 14 | all | all | ✅ (14/14) | none | A |
| shared/ | 16 | all | check (4 warns, 0 violations) | partial (11/16) | none | B |
| widgets/gauges/ | 6 | all | all | ✅ (6/6) | none | A |
| widgets/text/ | 2 | all | all | ✅ (2/2) | none | A |

Notes:
- `Size OK = check` means no `>400` violations but at least one `>=300` warning.
- Strict grading is applied: unresolved medium/high drift prevents an `A`.
- Smell prevention gate is fail-closed (see `documentation/conventions/smell-prevention.md`).
- Validation run (`2026-02-28`): `npm run check:all` passed.
- `check:filesize` summary: `warnings=4`, `violations=0`, `onelinerWarnings=0`.
- Coverage summary (`coverage/coverage-summary.json`): lines/statements `95.60%` (3244/3393), functions `91.47%` (118/129), branches `70.28%` (485/690).
- Coverage gate groups: Cluster mappers lines `94.52%`, branches `68.22%`; Runtime core lines `92.73%`, branches `79.88%`; Gauge math core lines `92.07%`, branches `59.06%`; Dynamic cluster update functions lines `100.00%`, branches `83.78%`.

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| Cross-file clone drift (renamed helpers + long copy-paste blocks) | HIGH | Previously under-detected by name-based duplicate rule | ✅ Fixed (`check-patterns`: `duplicate-functions: 0`, `duplicate-block-clones: 0`) |
| Canvas layer caching duplication (offscreen cache lifecycle/key/blit logic duplicated in dial renderers) | HIGH | Previously spread across full-circle dial implementations | ✅ Fixed (shared `CanvasLayerCache` + `FullCircleDialEngine`; `check-patterns`: `duplicate-block-clones: 0`) |
| Direct `avnav.api` access in non-runtime code | HIGH | Previously in `GaugeValueMath`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `PositionCoordinateWidget` | ✅ Fixed (`check-patterns`: `forbidden-globals: 0`) |
| Empty catch blocks | MED | Previously in `ClusterRendererRouter`, `runtime/helpers`, `GaugeValueMath`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `PositionCoordinateWidget` | ✅ Fixed (`check-patterns`: `empty-catch: 0`) |
| Oneliner line-limit bypass risk | HIGH | Previously in runtime/shared/widgets (backlog cleared) | ✅ Fixed (`check:filesize` is fail-closed with `--oneliner=block`; latest summary: `onelinerWarnings: 0`) |
| Shared engine hotspot growth near size threshold | MED | `shared/widget-kits/gauge/FullCircleDialEngine.js`, `shared/widget-kits/gauge/FullCircleDialTextLayout.js`, `shared/widget-kits/gauge/GaugeValueMath.js`, `shared/widget-kits/gauge/SemicircleGaugeEngine.js` | ⚠ Active (`check:filesize` warnings: 4, violations: 0) |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |
| Cross-layer helper extraction + dependency cleanup | GPT-5 Codex | Good | Cleared all `duplicate-functions` findings and fixed widget dependency direction without render regressions. |
| Formatter-boundary refactor (`Helpers.applyFormatter`) | GPT-5 Codex | Good | Removed forbidden global access findings and added wind gauge unit tests while preserving formatter output paths. |
| Aggressive duplication detection hardening | GPT-5 Codex | Good | Replaced name-based duplicate detection with body/clone checks and extracted shared semicircle tick-step resolvers. |
| Post-Phase A/Phase C documentation resync (`QUALITY.md` + `TECH-DEBT.md`) | GPT-5 Codex | Good | Recomputed scorecard from live repo gates (`check:all` pass, updated layer counts/tests, warn-tier debt reconciled). |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
