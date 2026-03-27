# Quality Scorecard

**Last updated:** 2026-03-27

## Layer Health

| Layer | Files | Headers | Size OK | Tests | Duplicates | Grade |
|---|---:|---|---|---|---|---|
| runtime/ | 6 | all | all | ✅ (6/6) | none | A |
| config/ | 12 | all | check (2 warns, 0 violations) | ✅ (9 suites incl. static cluster coverage) | none | B |
| cluster/ | 12 | all | all | ✅ (12/12) | none | A |
| shared/ | 32 | all | check (5 warns, 0 violations) | broad (25 suites) | none | B |
| widgets/radial/ | 6 | all | all | ✅ (6/6) | none | A |
| widgets/text/ | 5 | all | check (2 warns, 0 violations) | ✅ (5/5) | none | B |
| widgets/linear/ | 6 | all | all | ✅ (6/6) | none | A |

Notes:
- `Size OK = check` means no `>400` violations but at least one `>=300` warning.
- Strict grading is applied: unresolved medium/high drift prevents an `A`.
- Smell prevention gate is fail-closed (see `documentation/conventions/smell-prevention.md`).
- Validation run (`2026-03-27`): `npm run check:all` passed with `97/97` test files and `589/589` tests green.
- `check:patterns` summary (`2026-03-27`): `failures=0`, `warnings=0`; promoted fail-fast/atomicity rules (`internal-hook-fallback`, `redundant-null-type-guard`, `hardcoded-runtime-default`, `widget-renderer-default-duplication`, `engine-layout-default-drift`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing`, `framework-method-typeof-guard`, `inline-config-default-duplication`) all sit at `0`, and responsive rules remain `0`.
- `check:filesize` summary (`2026-03-27`): `warnings=10`, `violations=0`, `onelinerWarnings=0`.
- Coverage summary (`coverage/coverage-summary.json`, `2026-03-27`): lines/statements `94.61%`, functions `92.64%`, branches `73.32%`.

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| File-size hotspot growth near threshold | MED | `cluster/rendering/CanvasDomSurfaceAdapter.js`, `cluster/rendering/ClusterRendererRouter.js`, `config/clusters/environment.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/radial/FullCircleRadialTextLayout.js`, `shared/widget-kits/radial/RadialValueMath.js`, `shared/widget-kits/radial/SemicircleRadialTextLayout.js`, `shared/widget-kits/text/TextLayoutComposite.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | ⚠ Active (`check:filesize` warnings: 10, violations: 0) |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |
| Cross-layer helper extraction + dependency cleanup | GPT-5 Codex | Good | Cleared all `duplicate-functions` findings and fixed widget dependency direction without render regressions. |
| Formatter-boundary refactor (`Helpers.applyFormatter`) | GPT-5 Codex | Good | Removed forbidden global access findings and added wind gauge unit tests while preserving formatter output paths. |
| Aggressive duplication detection hardening | GPT-5 Codex | Good | Replaced name-based duplicate detection with body/clone checks and extracted shared semicircle tick-step resolvers. |
| Documentation resync after cleanup passes (`QUALITY.md` + `TECH-DEBT.md`) | GPT-5 Codex | Good | Recomputed scorecard from live repo gates (`check:all` pass, updated layer counts/tests, warn-tier debt reconciled). |
| Responsive verification closeout | GPT-5 Codex | Good | Added owner-level monotonic regression coverage for `ActiveRouteLayout` and `XteHighwayLayout`, reran `check:all`, and refreshed rollout status to the March 9, 2026 gate state. |
| Garbage-collection audit + scorecard resync | GPT-5 Codex | Good | Manual baseline..HEAD audit found doc-state drift rather than runtime regressions; resynced `QUALITY.md` and `TECH-DEBT.md` to the live March 9, 2026 gate outputs before advancing the GC baseline. |
| Atomicity warn-only rollout | GPT-5 Codex | Good | Added six warn-only `check-patterns` rules, dedicated tool coverage, and the March 10, 2026 backlog snapshot while keeping `check:all` green. |
| Range-default ownership cleanup | GPT-5 Codex | Good | Removed six wrapper-owned `rangeDefaults`, added family fallback/equivalence regressions, and resynced atomicity docs to the live March 10, 2026 warning surface. |
| Voltage wrapper ownership cleanup | GPT-5 Codex | Good | Removed the last voltage wrapper-owned `rangeDefaults` plus the redundant `VoltageRadialWidget` sector fallback literals, resynced the affected debt and widget docs, and kept the March 10, 2026 gate green. |
| Ratio-default ownership cleanup | GPT-5 Codex | Good | Removed engine/layout ratio-default drift across linear, semicircle, and full-circle families, added structural-fallback layout regressions, and revalidated the March 10, 2026 gate state with `check:all`. |
| Canvas API guard cleanup | GPT-5 Codex | Good | Removed the internal `setLineDash`/`strokeRect` capability guards, added direct `LinearCanvasPrimitives` coverage, updated the shared canvas mock contract, and revalidated the March 10, 2026 gate state with `check:all`. |
| Severity promotion closeout | GPT-5 Codex | Good | Promoted the cleared atomicity and fail-fast rules to `block`, updated severity-sensitive checker fixtures, resynced the enforcement-owner docs, and kept the March 10, 2026 full gate green. |
| Runtime lifecycle documentation closeout | GPT-5 Codex | Good | Added `documentation/architecture/runtime-lifecycle.md`, resynced runtime/theme architecture docs to the live bootstrap + fallback behavior, updated debt/index references, and revalidated the March 27, 2026 full gate state with `check:all`. |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
