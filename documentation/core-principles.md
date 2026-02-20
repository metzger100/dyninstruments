# Core Principles
**Status:** ✅ Implemented | Non-negotiable architectural boundaries for all changes

Agents and contributors must follow these rules on every task.

1. Rule: Runtime code must be plain JavaScript loaded via `<script>` tags; no bundler and no runtime build step.
Rationale: Agents must produce files that run in AvNav without compilation.
2. Rule: Every component must use the UMD/IIFE wrapper and register on `window.DyniComponents.{globalKey}`.
Rationale: A single module boundary keeps agent output predictable and load-safe.
3. Rule: Visual rendering is Canvas 2D only via `renderCanvas(canvas, props)`.
Rationale: One rendering API prevents inconsistent UI implementations across sessions.
4. Rule: Dependency direction is one-way: `widgets/cluster -> shared -> nothing`; `config` is pure data; `runtime` is framework-only.
Rationale: One-way layering prevents circular dependencies that confuse agents.
5. Rule: Keep JavaScript files at or below 300 lines; split before crossing the limit.
Rationale: Focused files improve agent accuracy and reduce regression risk.
6. Rule: Documentation must be updated in the same task as code/architecture changes.
Rationale: Stale docs become stale agent guidance in future sessions.
7. Rule: Every JS component file must include `Module`, `Documentation`, and `Depends` headers.
Rationale: Headers let agents trace dependencies without reading the full registry.
8. Rule: Reusable logic goes in `shared/widget-kits/`, not duplicated widget-local helpers.
Rationale: Centralized utilities preserve consistent patterns agents can safely copy.
Known violation (scan 2026-02-20): `extractNumberText` (4 files), `buildHighEndSectors` (2), `buildLowEndSectors` (2), `clamp` (3), `formatSpeed` (2).
9. Rule: Widgets and cluster code must not access `window.avnav` directly; use runtime/helpers (`Helpers.applyFormatter()`).
Rationale: A single host API boundary avoids duplicated guard patterns and formatter drift.
Known violation (scan 2026-02-20): 5 widget files directly access `window.avnav`/`avnav.api`.
10. Rule: Validate/default props at translate boundaries; interior code should trust validated inputs.
Rationale: Boundary validation prevents YOLO probing and guessed data shapes.
11. Rule: Do not swallow errors silently; handle, rethrow, or comment intentional silence.
Rationale: Empty catches hide real bugs and train agents into unsafe patterns.
Known violation (scan 2026-02-20): 7 empty `catch` blocks exist in production code paths.
12. Rule: Plan before implementing non-trivial tasks (`.plan.md` or planning mode) before editing code.
Rationale: Upfront design improves output quality under limited context windows.
13. Rule: Never fake green tests; fix root causes instead of weakening assertions/macros.
Rationale: Reliability depends on truthful tests, not altered expectations.
14. Rule: Rules that matter must be mechanically enforced (lint/check), not only written in prose.
Rationale: Automated checks persist across sessions when memory and context do not.
