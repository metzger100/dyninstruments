# Core Principles
**Status:** ✅ Implemented | Non-negotiable architectural boundaries for all changes

## Overview

These rules are mandatory for all contributors and AI agents working in this repository.

Agents and contributors must follow these rules on every task.

1. Rule: Runtime code must be plain JavaScript loaded via `<script>` tags; no bundler and no runtime build step.
Rationale: Agents must produce files that run in AvNav without compilation.
2. Rule: Every component must use the UMD/IIFE wrapper and register on `window.DyniComponents.{globalKey}`.
Rationale: A single module boundary keeps agent output predictable and load-safe.
3. Rule: Visual rendering is Canvas 2D only via `renderCanvas(canvas, props)`.
Rationale: One rendering API prevents inconsistent UI implementations across sessions.
4. Rule: Dependency direction is one-way by layer: `widgets -> shared`; `cluster -> cluster/widgets/shared`; `shared -> shared`; `config` is pure data; `runtime` must not depend on `widgets/cluster/shared`.
Rationale: One-way layering prevents circular dependencies that confuse agents.
5. Rule: Keep JavaScript files at or below 300 lines; split before crossing the limit.
Rationale: Focused files improve agent accuracy and reduce regression risk.
6. Rule: Documentation must be updated in the same task as code/architecture changes.
Rationale: Stale docs become stale agent guidance in future sessions.
7. Rule: Every JS component file must include `Module`, `Documentation`, and `Depends` headers.
Rationale: Headers let agents trace dependencies without reading the full registry.
8. Rule: Reusable logic goes in `shared/widget-kits/`, not duplicated widget-local helpers.
Rationale: Centralized utilities preserve consistent patterns agents can safely copy.
9. Rule: Widgets and cluster code must not access `window.avnav` directly; use runtime/helpers (`Helpers.applyFormatter()`).
Rationale: A single host API boundary avoids duplicated guard patterns and formatter drift.
10. Rule: Validate/default props at translate boundaries; interior code should trust validated inputs.
Rationale: Boundary validation prevents YOLO probing and guessed data shapes.
11. Rule: Do not swallow errors silently; handle, rethrow, or comment intentional silence.
Rationale: Empty catches hide real bugs and train agents into unsafe patterns.
12. Rule: Never fake green tests; fix root causes instead of weakening assertions/macros.
Rationale: Reliability depends on truthful tests, not altered expectations.
13. Rule: Rules that matter must be mechanically enforced (lint/check), not only written in prose.
Rationale: Automated checks persist across sessions when memory and context do not.

## Related

- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
- [../ARCHITECTURE.md](../ARCHITECTURE.md)
- [conventions/coding-standards.md](conventions/coding-standards.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
