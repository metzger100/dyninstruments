# Core Principles

**Status:** ✅ Implemented | Non-negotiable architectural boundaries for all changes

## Overview

These rules are mandatory for all contributors and AI agents in this repository.

1. Rule: Runtime code must be plain JavaScript loaded via `<script>` tags; no bundler and no runtime build step. → [conventions/coding-standards.md](conventions/coding-standards.md#overview)
2. Rule: Every component must use the UMD/IIFE wrapper and register on `window.DyniComponents.{globalKey}`. → [conventions/coding-standards.md](conventions/coding-standards.md#umd-component-template)
3. Rule: Cluster widgets register `renderHtml(props)` on the host path; surface selection is internal via strict kind-catalog routing (`surface: "html"` or `surface: "canvas-dom"`). → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
4. Rule: Dependency direction is one-way by layer: `widgets -> shared`; `cluster -> cluster/widgets/shared`; `shared -> shared`; `config` is pure data; `runtime` must not depend on `widgets/cluster/shared`.
5. Rule: Keep JavaScript files at or below 400 lines; split before crossing the limit. → [conventions/coding-standards.md](conventions/coding-standards.md#file-size-limits)
6. Rule: Documentation must be updated in the same task as code/architecture changes.
7. Rule: Every JS component file must include `Module`, `Documentation`, and `Depends` headers. → [conventions/coding-standards.md](conventions/coding-standards.md#mandatory-file-headers)
8. Rule: Reusable logic goes in `shared/widget-kits/`, not duplicated widget-local helpers. → [conventions/coding-standards.md](conventions/coding-standards.md#shared-utilities)
9. Rule: Widgets and cluster code must not access `window.avnav` directly; use runtime/helpers (`Helpers.applyFormatter()`). → [conventions/coding-standards.md](conventions/coding-standards.md#key-details)
10. Rule: Validate/default props at translate boundaries; interior code should trust validated inputs.
11. Rule: Do not swallow errors silently; handle, rethrow, or comment intentional silence.
12. Rule: Never fake green tests; fix root causes instead of weakening assertions/macros.
13. Rule: Rules that matter must be mechanically enforced (lint/check), not only written in prose.
14. Rule: Preserve explicit falsy defaults (`""`, `0`, `false`) using property-presence/nullish semantics; never use truthy fallback for configured defaults. → [conventions/coding-standards.md](conventions/coding-standards.md#key-details)
15. Rule: Cache-owning modules must expose explicit invalidation APIs and mutation paths must invoke them when cached values become stale. → [conventions/coding-standards.md](conventions/coding-standards.md#key-details)
16. Rule: Defaults and validation belong at boundaries; internal code should trust normalized contracts and fail fast. → [conventions/coding-standards.md](conventions/coding-standards.md#fail-fast-keep-it-simple)
17. Rule: Do not add speculative legacy, compatibility, or fallback support unless an active external boundary contract requires it. → [conventions/coding-standards.md](conventions/coding-standards.md#fail-fast-keep-it-simple)
18. Rule: Do not duplicate CSS, theme-token, or declarative config defaults inside runtime/widget logic. → [conventions/coding-standards.md](conventions/coding-standards.md#fail-fast-keep-it-simple)
19. Rule: Intentional fallback exceptions must use a rule-specific `dyni-lint-disable-*` suppression with a short reason. → [conventions/smell-prevention.md](conventions/smell-prevention.md#suppression-syntax)

## Related

- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
- [../ARCHITECTURE.md](../ARCHITECTURE.md)
- [conventions/coding-standards.md](conventions/coding-standards.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
