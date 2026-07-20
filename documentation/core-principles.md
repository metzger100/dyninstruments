# Core Principles

**Status:** ✅ Implemented | Non-negotiable architectural boundaries for all changes

## Overview

These rules are mandatory for all contributors and AI agents in this repository.

1. Rule: Runtime code must be plain JavaScript loaded via `<script>` tags; no bundler and no runtime build step. →
   [conventions/coding-standards.md](conventions/coding-standards.md#overview)
2. Rule: Every component must use the UMD/IIFE wrapper and register on `window.DyniComponents.{globalKey}`. →
   [conventions/coding-standards.md](conventions/coding-standards.md#umd-component-template)
3. Rule: Cluster widgets register `renderHtml(props)` on the host path; surface selection is driven by route metadata in
   `config.clusterRoutes` and runtime route activation. →
   [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
4. Rule: Dependency direction is one-way by layer: `widgets -> shared`; `cluster -> cluster/widgets/shared`;
   `shared -> shared`; `config` is pure data; `runtime` must not depend on `widgets/cluster/shared`.
5. Rule: Hard 400-line limit on all JS files (source and test) and Markdown documentation files. Split before crossing
   the limit. This rule is absolute and overrides exec-plan assumptions. Exempt: `.css`, `.json`, `exec-plans/`,
   `.agents/skills/`, `tools/`, package configs. →
   [conventions/coding-standards.md](conventions/coding-standards.md#file-size-limits)
6. Rule: Documentation must be updated in the same task as code/architecture changes.
7. Rule: Public or complex runtime contracts need focused documentation or JSDoc; `Documentation:` header targets are
   validated when present. →
   [conventions/coding-standards.md](conventions/coding-standards.md#focused-file-doc-comments)
8. Rule: Reusable logic goes in `shared/widget-kits/`, not duplicated widget-local helpers. →
   [conventions/coding-standards.md](conventions/coding-standards.md#shared-utilities)
9. Rule: Widgets and cluster code must not access `window.avnav` directly; use the component-context boundaries
   (`componentContext.format.applyFormatter()` and `componentContext.dom.requirePluginRoot()`). →
   [conventions/coding-standards.md](conventions/coding-standards.md#key-details)
10. Rule: Validate/default props at translate boundaries; interior code should trust validated inputs.
11. Rule: Do not swallow errors silently; handle, rethrow, or comment intentional silence.
12. Rule: Never fake green tests; fix root causes instead of weakening assertions/macros.
13. Rule: Rules that matter must be mechanically enforced (lint/check), not only written in prose.
14. Rule: Preserve explicit falsy defaults (`""`, `0`, `false`) using property-presence/nullish semantics; never use
    truthy fallback for configured defaults. →
    [conventions/coding-standards.md](conventions/coding-standards.md#key-details)
15. Rule: Cache-owning modules must expose explicit invalidation APIs and mutation paths must invoke them when cached
    values become stale. → [conventions/coding-standards.md](conventions/coding-standards.md#key-details)
16. Rule: Defaults and validation belong at boundaries; internal code should trust normalized contracts and fail fast. →
    [conventions/coding-standards.md](conventions/coding-standards.md#fail-fast-keep-it-simple)
17. Rule: Do not add speculative legacy, compatibility, or fallback support unless an active external boundary contract
    requires it. → [conventions/coding-standards.md](conventions/coding-standards.md#fail-fast-keep-it-simple)
18. Rule: Do not duplicate CSS, theme-token, or declarative config defaults inside runtime/widget logic. →
    [conventions/coding-standards.md](conventions/coding-standards.md#fail-fast-keep-it-simple)
19. Rule: Generic `dyni-lint-disable-*` suppressions are forbidden in production source. Intentional exceptions are
    either a narrow canonical-owner allowlist entry owned by the rule itself, or — for genuine external-boundary catch
    fallbacks only — the validated `dyni-boundary-*(category, owner, date[, expires])` marker. →
    [conventions/smell-prevention.md](conventions/smell-prevention.md#suppression-syntax)

## Related

- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
- [../ARCHITECTURE.md](../ARCHITECTURE.md)
- [conventions/coding-standards.md](conventions/coding-standards.md)
- [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
