# Smell Prevention

**Status:** ✅ Implemented | Fail-closed smell policy and enforcement map

## Overview

This document defines smell rules and where they are enforced in tooling.  
Blocking checks must pass before push (`npm run check:all` via pre-push hook).

## Smell Catalog

| Smell Class | Anti-Pattern | Required Pattern | Enforcement | Severity |
|---|---|---|---|---|
| Theme cache drift | Token cache never invalidated after theme preset mutation | Cache-owning modules expose explicit invalidation APIs and callers invoke them on mutation | `check-smell-contracts` (`theme-cache-invalidation`) | block |
| Dynamic key stale state | `storeKeys.value` remains when dynamic key field is cleared | Clear stale dynamic store keys when key input is empty | `check-smell-contracts` (`dynamic-storekey-clears-on-empty`) | block |
| Falsy default clobbering | `x.default || "---"` | Preserve explicit falsy defaults using property-presence/nullish semantics | `check-patterns` (`default-truthy-fallback`) + `check-smell-contracts` (`falsy-default-preservation`) | block |
| Renderer coercion drift | Renderer does `Number(props.x)` on mapper-owned normalized props | Normalize at mapper boundary, renderer receives finite number or `undefined` | `check-patterns` (`renderer-numeric-coercion-without-boundary-contract`) + `check-smell-contracts` (`mapper-output-no-nan`) | block |
| Hotspot growth | Known hotspot files keep growing | Keep hotspot files under stricter local budget, split shared logic early | `check-smell-contracts` (`text-layout-hotspot-budget`) + `check-file-size` | block |
| Formatter availability heuristic | infer formatter failure from output equality (`out.trim() === String(raw)`) | Use explicit formatter API/fallback behavior, do not infer from output text equality | `check-patterns` (`formatter-availability-heuristic`) + `check-smell-contracts` (`coordinate-formatter-no-raw-equality-fallback`) | block |
| Oneliner line-limit bypass | File-size limit is bypassed by collapsing multiline blocks into dense/very-long oneliners | Keep multiline formatting; do not compress implementation into dense/packed one-liners | `check-file-size` (`oneliner=dense`, `oneliner=long-packed`) | warn (promotion tracked in `../TECH-DEBT.md` TD-012) |

## Tooling Matrix

- Static smell checks: `tools/check-patterns.mjs`
- Semantic contract checks: `tools/check-smell-contracts.mjs`
- Aggregated smell gate: `npm run check:smells`
- Full gate: `npm run check:all` (includes `npm run check:smells` via `check:core`)
- Push blocker: `.githooks/pre-push` -> `npm run check:all`
- `check-file-size` defaults to `--oneliner=warn` in `check:all`; strict variant is available via `npm run check:filesize:strict` (`--oneliner=block`)

## Severity Model

- `block`: must pass locally before push.
- `warn`: allowed only for exploratory rules not yet promoted; promotion target and rationale must be tracked in `documentation/TECH-DEBT.md`.

## Fix Playbooks

### Theme cache drift

1. Add/verify `invalidateCanvas` and `invalidateAll` on cache-owning module API.
2. Call invalidation from every runtime mutation path.
3. Add/adjust tests for mutation -> invalidation -> refreshed resolve.

### Dynamic key stale state

1. In cluster `updateFunction`, branch on empty key input.
2. Remove stale `storeKeys.<dynamic>` when empty.
3. Add config-cluster tests for empty-key cleanup.

### Falsy default clobbering

1. Replace truthy fallback with property-presence/nullish handling.
2. Keep explicit values (`""`, `0`, `false`) intact end-to-end.
3. Add runtime helper/registrar tests for explicit falsy defaults.

### Renderer coercion drift

1. Normalize numeric props in mapper (`finite number` or `undefined`).
2. Renderer consumes trusted normalized props and applies local defaults only.
3. Add mapper contract checks for non-finite output.

### Hotspot growth

1. Split shared math/layout utilities into `shared/widget-kits/`.
2. Keep widget files focused on widget-specific orchestration.
3. Reduce file growth before reaching hard size limit.

### Formatter availability heuristic

1. Remove output-equality checks.
2. Use explicit formatter dispatch/fallback only.
3. Add renderer tests to ensure raw-string formatter output is treated as valid.

### Oneliner line-limit bypass

1. Reformat dense oneliners into multiline blocks.
2. Split very long packed lines into multiline object literals/call arguments.
3. Use `npm run check:filesize:strict` during cleanup, and promote default `check-file-size --oneliner=block` after warning backlog reaches zero (tracked by TD-012).

## Related

- [coding-standards.md](coding-standards.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [../guides/garbage-collection.md](../guides/garbage-collection.md)
- [../core-principles.md](../core-principles.md)
