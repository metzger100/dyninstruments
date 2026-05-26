# Quality Scorecard

**Last updated:** 2026-05-26

## Layer Health

| Layer | Files | Headers | Size OK | Tests | Duplicates | Grade |
|---|---:|---|---|---|---|---|
| runtime/ | 26 | all | all | core + coverage | none | B |
| config/ | 41 | all | all | core + coverage | none | B |
| cluster/ | 16 | all | all | core + coverage | none | B |
| shared/ | 98 | all | all | core + coverage | none | B |
| widgets/radial/ | 7 | all | all | core + coverage | none | A |
| widgets/text/ | 12 | all | all | core + coverage | none | B |
| widgets/linear/ | 7 | all | all | core + coverage | none | A |
| tests/ | 395 | n/a | all | core + coverage | none | A |

Notes:
- `Size OK = all` means zero file-size violations (`>400`) in that layer.
- Strict grading is applied: unresolved medium/high drift prevents an `A`.
- Smell prevention gate is fail-closed (see `documentation/conventions/smell-prevention.md`).
- Validation run (`2026-05-26`): `npm run check:all` passed, including `perf:check` (`violations=0`).
- `check:patterns` summary (`2026-05-26`): `checkedFiles=761`, `failures=0`, `warnings=0`.
- `check:filesize` summary (`2026-05-26`): `warnings=N/A (removed)`, `violations=0`, `onelinerFindings=0`.
- Coverage summary (`2026-05-26`): lines/statements `93.92%`, functions `94.47%`, branches `76.16%`.

## Known Drift Patterns

| Pattern | Severity | Files | Status |
|---|---|---|---|
| File-size warning-tier drift | RESOLVED | N/A | ✅ Warning-tier tracking removed; enforcement is fail-closed pass/fail at 400 lines with `violations=0` and `onelinerFindings=0` (`2026-05-26`). |

## Model Selection Log

| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| Documentation quality audit/scorecard | GPT-5 Codex | Good | Accurate repo-derived drift extraction from checks + source scan |
| Phase 9 placeholder/state-screen cleanup | GPT-5 Codex | Good | Replaced widget-local placeholder fallbacks with `PlaceholderNormalize`, hardened state-screen precedence contracts, and revalidated `check:core` plus coverage without the perf gate. |
| Cross-layer helper extraction + dependency cleanup | GPT-5 Codex | Good | Cleared all `duplicate-functions` findings and fixed widget dependency direction without render regressions. |
| Formatter-boundary refactor (`componentContext.format.applyFormatter`) | GPT-5 Codex | Good | Historical: removed forbidden global access findings and added wind gauge unit tests while preserving formatter output paths. |
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
| RoutePoints Phase 5 documentation closeout | GPT-5 Codex | Good | Added `documentation/widgets/route-points.md`, updated architecture/index/guide touchpoints plus debt/roadmap tracking, and revalidated April 2, 2026 with `docs:check` + full `check:all`. |
| EditRoute Phase 5 documentation closeout | GPT-5 Codex | Good | Added `documentation/widgets/edit-route.md`, updated architecture/index/roadmap coverage docs, refreshed quality/debt tracking, and revalidated April 3, 2026 with full `check:all`. |
| Phase 2 vocabulary cleanup and scorecard resync | GPT-5 Codex | Good | Renamed the StableDigits plain-text vocabulary across source, tests, and widgets; cleared the premature legacy-support backlog; and resynced the live quality/debt/roadmap docs to the zero-warning state. |
| PLAN32 Phase 5 quality gate update | GPT-5 Codex | Good | Removed warning-tier wording from quality tracking, added tests-layer visibility, and resynced scorecard metrics to the May 26, 2026 `check:all` run (`violations=0`, `onelinerFindings=0`). |

Append new rows when model choice materially affects outcome.

## Rules

- Update this file whenever completing a cleanup task.
- Update the Model Selection Log when a model choice leads to notably good or bad results.
