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
| Redundant internal fallback | Renderer/local code re-applies fallback for props/defaults already guaranteed by mapper/editable contracts (or wraps `Helpers.applyFormatter` default with the same fallback again) | Trust internal contracts for guaranteed props/defaults; keep fallbacks only for external/runtime uncertainty (AvNav/browser APIs) | `check-patterns` (`redundant-internal-fallback`) | block |
| Renderer coercion drift | Renderer does `Number(props.x)` on mapper-owned normalized props | Normalize at mapper boundary, renderer receives finite number or `undefined` | `check-patterns` (`renderer-numeric-coercion-without-boundary-contract`) + `check-smell-contracts` (`mapper-output-no-nan`) | block |
| Mapper logic leakage | Mapper adds helper functions or presentation logic | Keep mappers declarative (`create` + `translate`), move logic to renderer/toolkit modules | `check-patterns` (`mapper-logic-leakage`) | block |
| Mapper output complexity | Mapper branch returns oversized object literal for one `kind` | If more than 8 mapper props are needed, move renderer-specific config to dedicated wrapper/adapter renderer | `check-patterns` (`mapper-output-complexity`) | warn (`>8`), block (`>12`) |
| Cluster renderer naming drift | `cluster/rendering/` component IDs are cluster-prefixed (e.g. `Vessel*`) | Use role-based renderer IDs in `cluster/rendering/` (e.g. `DateTimeWidget`) | `check-patterns` (`cluster-renderer-cluster-prefix`) + `check-naming` | block |
| Hotspot growth | Known hotspot files keep growing | Keep hotspot files under stricter local budget, split shared logic early | `check-smell-contracts` (`text-layout-hotspot-budget`) + `check-file-size` | block |
| Formatter availability heuristic | infer formatter failure from output equality (`out.trim() === String(raw)`) | Use explicit formatter API/fallback behavior, do not infer from output text equality | `check-patterns` (`formatter-availability-heuristic`) + `check-smell-contracts` (`coordinate-formatter-no-raw-equality-fallback`) | block |
| Cross-file clone drift | Copy-pasted logic diverges across files (renamed helpers or duplicated long blocks) | Detect body-level function clones and long cloned blocks; extract shared helpers/toolkits | `check-patterns` (`duplicate-functions`, `duplicate-block-clones`) | block |
| Oneliner line-limit bypass | File-size limit is bypassed by collapsing multiline blocks into dense/very-long oneliners | Keep multiline formatting; do not compress implementation into dense/packed one-liners | `check-file-size` (`oneliner=dense`, `oneliner=long-packed`) | block |

## Tooling Matrix

- Static smell checks: `tools/check-patterns.mjs`
- Semantic contract checks: `tools/check-smell-contracts.mjs`
- Naming contract checks: `tools/check-naming.mjs`
- Aggregated smell gate: `npm run check:smells`
- Full gate: `npm run check:all` (includes `npm run check:smells` via `check:core`)
- Push blocker: `.githooks/pre-push` -> `npm run check:all`
- `check:filesize` runs fail-closed with `--oneliner=block` (used by `check:core`/`check:all`)
- Optional exploratory variant: `npm run check:filesize:warn`

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

### Redundant internal fallback

1. Remove fallback wrappers on renderer props that are guaranteed by mapper contracts (`cap/unit` defaults or explicit mapper literals).
2. Remove outer `fallbackText(...)` wrappers when `Helpers.applyFormatter(..., { default: X })` already uses the same fallback `X`.
3. Keep defensive fallbacks only where values depend on external runtime uncertainty (for example AvNav/browser APIs).
4. Add/adjust `check-patterns` tests for both block cases and allowed external-factor cases.

### Renderer coercion drift

1. Normalize numeric props in mapper (`finite number` or `undefined`).
2. Renderer consumes trusted normalized props and applies local defaults only.
3. Add mapper contract checks for non-finite output.

### Mapper logic leakage

1. Keep mapper logic limited to kind routing, field mapping, and numeric normalization.
2. Remove mapper-local helper functions (other than `create`/`translate`).
3. Move formatter/status/display logic to `cluster/rendering/`, `widgets/`, or `ClusterMapperToolkit`.
4. Apply the renderer decision rule before adding renderer-specific prop sets to mapper branches:
   [../guides/add-new-cluster.md#renderer-decision-rule](../guides/add-new-cluster.md#renderer-decision-rule).

### Mapper output complexity

1. Keep each direct `translate()` return object literal under 9 top-level props when feasible.
2. If one `kind` requires renderer-specific configuration beyond this threshold, move those props into a dedicated renderer wrapper/adapter contract.
3. Use the renderer decision rule as the default architecture gate:
   [../guides/add-new-cluster.md#renderer-decision-rule](../guides/add-new-cluster.md#renderer-decision-rule).
4. Treat `>12` as fail-closed and refactor immediately; treat `9..12` as warning debt and track planned cleanup/promotion in `TECH-DEBT.md`.

### Cluster renderer naming drift

1. Rename cluster-rendering components to role-based IDs (remove cluster prefixes).
2. Keep `componentId`, UMD `globalKey`, returned `id`, and file basename aligned.
3. Update mapper `renderer` values and `config/components.js` registrations together.

### Hotspot growth

1. Split shared math/layout utilities into `shared/widget-kits/`.
2. Keep widget files focused on widget-specific orchestration.
3. Reduce file growth before reaching hard size limit.

### Formatter availability heuristic

1. Remove output-equality checks.
2. Use explicit formatter dispatch/fallback only.
3. Add renderer tests to ensure raw-string formatter output is treated as valid.

### Cross-file clone drift

1. Remove widget-local copy-paste blocks and move shared logic into `shared/widget-kits/`.
2. Prefer shared API calls (`GaugeValueMath.*`, shared renderers) over repeated local helper implementations.
3. Keep duplicated orchestration stubs (`create`, `translate`, `translateFunction`, `renderCanvas`) minimal; all substantive logic belongs in shared modules.
4. Add/adjust tests to lock expected shared-helper behavior after extraction.

### Oneliner line-limit bypass

1. Reformat dense oneliners into multiline blocks.
2. Split very long packed lines into multiline object literals/call arguments.
3. Use `npm run check:filesize` for fail-closed enforcement; use `npm run check:filesize:warn` only for exploratory cleanup passes.

## Related

- [coding-standards.md](coding-standards.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [../guides/garbage-collection.md](../guides/garbage-collection.md)
- [../core-principles.md](../core-principles.md)
