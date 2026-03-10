# Quality Scorecard

**Last updated:** 2026-03-10

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
- Validation run (`2026-03-10`): `npm run check:all` passed with `77/77` test files and `467/467` tests green.
- `check:patterns` summary (`2026-03-10`): `warnings=9`; `widget-renderer-default-duplication=0`; `engine-layout-default-drift=0`; `canvas-api-typeof-guard=2`; `try-finally-canvas-drawing=2`; `framework-method-typeof-guard=3`; `inline-config-default-duplication=2`; `responsive-layout-hard-floor=0`; `responsive-profile-ownership=0`.
- `check:filesize` summary (`2026-03-10`): `warnings=9`, `violations=0`, `onelinerWarnings=0`.
- Coverage summary (`coverage/coverage-summary.json`, `2026-03-10`): lines/statements `93.9%`, functions `91.32%`, branches `71.54%`.

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| File-size hotspot growth near threshold | MED | `config/clusters/environment.js`, `config/components.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/radial/FullCircleRadialTextLayout.js`, `shared/widget-kits/radial/RadialValueMath.js`, `shared/widget-kits/radial/SemicircleRadialTextLayout.js`, `shared/widget-kits/text/TextLayoutComposite.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | ⚠ Active (`check:filesize` warnings: 9, violations: 0) |
| Atomicity warn backlog | MED | Internal Canvas/helper guards and inline editable-default fallbacks | ⚠ Active (`check:patterns` warnings on `2026-03-10`: `9`; see `TD-019`) |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |
| Cross-layer helper extraction + dependency cleanup | GPT-5 Codex | Good | Cleared all `duplicate-functions` findings and fixed widget dependency direction without render regressions. |
| Formatter-boundary refactor (`Helpers.applyFormatter`) | GPT-5 Codex | Good | Removed forbidden global access findings and added wind gauge unit tests while preserving formatter output paths. |
| Aggressive duplication detection hardening | GPT-5 Codex | Good | Replaced name-based duplicate detection with body/clone checks and extracted shared semicircle tick-step resolvers. |
| Post-Phase A/Phase C documentation resync (`QUALITY.md` + `TECH-DEBT.md`) | GPT-5 Codex | Good | Recomputed scorecard from live repo gates (`check:all` pass, updated layer counts/tests, warn-tier debt reconciled). |
| Phase 9 responsive verification closeout | GPT-5 Codex | Good | Added owner-level monotonic regression coverage for `ActiveRouteLayout` and `XteHighwayLayout`, reran `check:all`, and refreshed rollout status to the March 9, 2026 gate state. |
| Garbage-collection audit + scorecard resync | GPT-5 Codex | Good | Manual baseline..HEAD audit found doc-state drift rather than runtime regressions; resynced `QUALITY.md` and `TECH-DEBT.md` to the live March 9, 2026 gate outputs before advancing the GC baseline. |
| Phase 0 atomicity warn-only rollout | GPT-5 Codex | Good | Added six warn-only `check-patterns` rules, dedicated tool coverage, and the March 10, 2026 backlog snapshot while keeping `check:all` green. |
| Phase 2 range-default ownership cleanup | GPT-5 Codex | Good | Removed six wrapper-owned `rangeDefaults`, added family fallback/equivalence regressions, and resynced atomicity docs to the live March 10, 2026 warning surface. |
| Phase 3 ratio-default ownership cleanup | GPT-5 Codex | Good | Removed engine/layout ratio-default drift across linear, semicircle, and full-circle families, added structural-fallback layout regressions, and revalidated the March 10, 2026 gate state with `check:all`. |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
