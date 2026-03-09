# Core Principles
**Status:** ✅ Implemented | Non-negotiable architectural boundaries for all changes

## Overview

These rules are mandatory for all contributors and AI agents working in this repository.

Agents and contributors must follow these rules on every task.

1. Rule: Runtime code must be plain JavaScript loaded via `<script>` tags; no bundler and no runtime build step.
Rationale: Agents must produce files that run in AvNav without compilation.
2. Rule: Every component must use the UMD/IIFE wrapper and register on `window.DyniComponents.{globalKey}`.
Rationale: A single module boundary keeps agent output predictable and load-safe.
3. Rule: Passive visual rendering stays on Canvas 2D via `renderCanvas(canvas, props)`; `renderHtml(props)` is allowed only for active widgets that need DOM-owned interaction.
Rationale: Canvas remains the default display path, while the HTML exception stays narrow and tied to real interaction requirements instead of becoming a second passive rendering system.
4. Rule: Dependency direction is one-way by layer: `widgets -> shared`; `cluster -> cluster/widgets/shared`; `shared -> shared`; `config` is pure data; `runtime` must not depend on `widgets/cluster/shared`.
Rationale: One-way layering prevents circular dependencies that confuse agents.
5. Rule: Keep JavaScript files at or below 400 lines; split before crossing the limit.
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
14. Rule: Preserve explicit falsy defaults (`""`, `0`, `false`) by using property-presence/nullish semantics; never use truthy fallback for configured defaults.
Rationale: Truthy fallback (`||`) silently rewrites valid configured values and creates hard-to-debug behavior drift.
15. Rule: Cache-owning modules must expose explicit invalidation APIs and mutation paths must invoke them whenever cached values become stale.
Rationale: Mutable runtime state (theme presets, dynamic CSS/token changes) must not rely on implicit refresh assumptions.
16. Rule: Defaults and validation belong at boundaries; internal code should trust normalized contracts and fail fast.
Rationale: Re-validating or silently sanitizing already-normalized data hides contract drift and multiplies fallback behavior.
17. Rule: Do not add speculative legacy, compatibility, or fallback support unless an active external boundary contract requires it.
Rationale: Premature compatibility paths become permanent debt and obscure the real data flow.
18. Rule: Do not duplicate CSS, theme-token, or declarative config defaults inside runtime/widget logic.
Rationale: Duplicated defaults drift from the real source of truth and make behavior hard to reason about.
19. Rule: Intentional fallback exceptions must use a rule-specific `dyni-lint-disable-*` suppression with a short reason.
Rationale: Explicit, narrow suppressions keep exceptional fallback behavior reviewable and mechanically enforceable.

## Related

- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
- [../ARCHITECTURE.md](../ARCHITECTURE.md)
- [conventions/coding-standards.md](conventions/coding-standards.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
