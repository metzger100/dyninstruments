# Quality Scorecard

**Last updated:** 2026-03-09

## Layer Health

| Layer | Files | Headers | Size OK | Tests | Duplicates | Grade |
|---|---:|---|---|---|---|---|
| runtime/ | 6 | all | all | ✅ (6/6) | none | A |
| config/ | 12 | all | check (2 warns, 0 violations) | ✅ (9 suites incl. static cluster coverage) | none | B |
| cluster/ | 12 | all | all | ✅ (12/12) | none | A |
| shared/ | 32 | all | check (5 warns, 0 violations) | broad (24 suites) | none | B |
| widgets/radial/ | 6 | all | all | ✅ (6/6) | none | A |
| widgets/text/ | 5 | all | check (2 warns, 0 violations) | ✅ (5/5) | none | B |
| widgets/linear/ | 6 | all | all | ✅ (6/6) | none | A |

Notes:
- `Size OK = check` means no `>400` violations but at least one `>=300` warning.
- Strict grading is applied: unresolved medium/high drift prevents an `A`.
- Smell prevention gate is fail-closed (see `documentation/conventions/smell-prevention.md`).
- Validation run (`2026-03-09`): `npm run check:all` passed with `74/74` test files and `414/414` tests green.
- `check:patterns` summary (`2026-03-09`): `warnings=3`, all from `responsive-layout-hard-floor`; `responsive-profile-ownership=0`.
- `check:filesize` summary (`2026-03-09`): `warnings=9`, `violations=0`, `onelinerWarnings=0`.
- Coverage summary (`coverage/coverage-summary.json`, `2026-03-09`): lines/statements `93.68%`, functions `90.09%`, branches `69.91%`.

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| Responsive hard-floor rollout backlog | HIGH | `shared/widget-kits/text/TextTileLayout.js`, `shared/widget-kits/linear/LinearGaugeTextLayout.js` | ⚠ Active (`check:patterns`: `responsive-layout-hard-floor=3`; tracked in `TD-018`) |
| File-size hotspot growth near threshold | MED | `config/clusters/environment.js`, `config/components.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/radial/FullCircleRadialTextLayout.js`, `shared/widget-kits/radial/RadialValueMath.js`, `shared/widget-kits/radial/SemicircleRadialTextLayout.js`, `shared/widget-kits/text/TextLayoutComposite.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | ⚠ Active (`check:filesize` warnings: 9, violations: 0) |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |
| Cross-layer helper extraction + dependency cleanup | GPT-5 Codex | Good | Cleared all `duplicate-functions` findings and fixed widget dependency direction without render regressions. |
| Formatter-boundary refactor (`Helpers.applyFormatter`) | GPT-5 Codex | Good | Removed forbidden global access findings and added wind gauge unit tests while preserving formatter output paths. |
| Aggressive duplication detection hardening | GPT-5 Codex | Good | Replaced name-based duplicate detection with body/clone checks and extracted shared semicircle tick-step resolvers. |
| Post-Phase A/Phase C documentation resync (`QUALITY.md` + `TECH-DEBT.md`) | GPT-5 Codex | Good | Recomputed scorecard from live repo gates (`check:all` pass, updated layer counts/tests, warn-tier debt reconciled). |
| Phase 9 responsive verification closeout | GPT-5 Codex | Good | Added owner-level monotonic regression coverage for `ActiveRouteLayout` and `XteHighwayLayout`, reran `check:all`, and refreshed rollout status to the March 9, 2026 gate state. |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
