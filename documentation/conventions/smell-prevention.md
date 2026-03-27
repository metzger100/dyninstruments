# Smell Prevention

**Status:** ✅ Implemented | Fail-closed smell policy and enforcement map

## Overview

This document defines smell rules and where they are enforced in tooling.  
Blocking checks must pass before push (`npm run check:all` via pre-push hook).
Warn-only rollout rules are tracked debt until they are promoted to `block`.

## Smell Catalog

| Smell Class | Anti-Pattern | Required Pattern | Enforcement | Severity |
|---|---|---|---|---|
| Theme cache drift | Token cache never invalidated after theme preset mutation | Cache-owning modules expose explicit invalidation APIs and callers invoke them on mutation | `check-smell-contracts` (`theme-cache-invalidation`) | block |
| Dynamic key stale state | `storeKeys.value` remains when dynamic key field is cleared | Clear stale dynamic store keys when key input is empty | `check-smell-contracts` (`dynamic-storekey-clears-on-empty`) | block |
| Falsy default clobbering | `x.default || "---"` | Preserve explicit falsy defaults using property-presence/nullish semantics | `check-patterns` (`default-truthy-fallback`) + `check-smell-contracts` (`falsy-default-preservation`) | block |
| Redundant internal fallback | Renderer/local code re-applies fallback for props/defaults already guaranteed by mapper/editable contracts (or wraps `Helpers.applyFormatter` default with the same fallback again) | Trust internal contracts for guaranteed props/defaults; keep fallbacks only for external/runtime uncertainty (AvNav/browser APIs) | `check-patterns` (`redundant-internal-fallback`) | block |
| Invalid lint suppression | Inline `dyni-lint-disable-*` directive is malformed or references unknown rule | Suppress only the named rule and always include a short reason | `check-patterns` (`invalid-lint-suppression`) | block |
| Catch fallback without suppression | Non-rethrow `catch` silently degrades behavior without explicit exception | Re-throw by default; keep intentional fallback catches only with rule-specific suppression | `check-patterns` (`catch-fallback-without-suppression`) | warn |
| Internal hook fallback | Shared/widget code normalizes or fallbacks internal hook/spec results (`normalize*`, `cfg.*(...) || ...`) | Keep defaults at the boundary and trust internal hook contracts | `check-patterns` (`internal-hook-fallback`) | block |
| Redundant null/type guard | Internal code repeatedly sanitizes already-normalized values (`String(x == null ? "" : x)`, `Array.isArray(x) ? x : []`, `isFiniteNumber(x) ? ... : ...`) | Remove redundant guards and trust mapper/runtime/theme contracts | `check-patterns` (`redundant-null-type-guard`) | block |
| Hardcoded runtime default | Runtime/widget/shared code embeds fallback literals or object defaults already owned elsewhere | Use declarative config/theme defaults or boundary-owned placeholders | `check-patterns` (`hardcoded-runtime-default`) | block |
| Widget renderer default duplication | Widget `createRenderer(...)` spec repeats editable-parameter defaults in `ratioDefaults` / `rangeDefaults` | Keep editable defaults in config and use engine fallback only as the unreachable last resort | `check-patterns` (`widget-renderer-default-duplication`) | block |
| Engine/layout default drift | Layout owner re-declares semantic ratio defaults already owned by the engine family | Keep semantic defaults in one owner only; layout keeps structural safety bounds only | `check-patterns` (`engine-layout-default-drift`) | block |
| Canvas API typeof guard | Internal drawing code checks standard Canvas 2D methods with `typeof ctx.* === "function"` | Trust the validated Canvas 2D context; keep capability checks only at real DOM/canvas boundaries | `check-patterns` (`canvas-api-typeof-guard`) | block |
| Try/finally canvas drawing | Internal draw path wraps `ctx.save()` / `ctx.restore()` in `try/finally` without an external throwing boundary | Use direct save/draw/restore pairing; reserve `try/finally` for real boundary cleanup | `check-patterns` (`try-finally-canvas-drawing`) | block |
| Framework method typeof guard | Internal code checks `Helpers` or module methods with `typeof ... === "function"` after module resolution | Trust module-loader/helper contracts once inside the internal boundary | `check-patterns` (`framework-method-typeof-guard`) | block |
| Inline config default duplication | Widget/shared code re-declares editable defaults inline (`typeof p.foo !== "undefined" ? ... : 12.2`) | Trust the editable-default contract instead of duplicating literals downstream | `check-patterns` (`inline-config-default-duplication`) | block |
| Responsive layout hard floor | Responsive layout/text owner keeps user-visible hard floors such as `Math.max(9, ...)` or `clamp(..., 10, ...)` instead of deriving them from the shared compact profile | Use `ResponsiveScaleProfile`-derived geometry/text ceilings; keep only technical canvas-safety guards with explicit suppression comments | `check-patterns` (`responsive-layout-hard-floor`) | block |
| Responsive profile ownership drift | Layout owner stops resolving `ResponsiveScaleProfile`, or a consumer module imports it directly instead of using layout-owned `responsive` / `textFillScale` state | Keep compaction ownership in `ResponsiveScaleProfile` + layout-owner modules only; consumers must read layout-owned state | `check-patterns` (`responsive-profile-ownership`) | block |
| CSS/JS default duplication | JS repeats CSS/theme token defaults (`getComputedStyle`, `defaultValue`, `--dyni-*`) | Keep visual/token defaults in CSS or theme resolver boundary only | `check-patterns` (`css-js-default-duplication`) | warn |
| Premature legacy support | Code adds speculative compat/legacy/fallback naming or multi-source compatibility branches | Remove speculative compatibility paths until a live boundary requires them | `check-patterns` (`premature-legacy-support`) | warn |
| Renderer coercion drift | Renderer does `Number(props.x)` on mapper-owned normalized props | Normalize at mapper boundary, renderer receives finite number or `undefined` | `check-patterns` (`renderer-numeric-coercion-without-boundary-contract`) + `check-smell-contracts` (`mapper-output-no-nan`) | block |
| Mapper logic leakage | Mapper adds helper functions or presentation logic | Keep mappers declarative (`create` + `translate`), move logic to renderer/toolkit modules | `check-patterns` (`mapper-logic-leakage`) | block |
| Mapper output complexity | Mapper branch returns oversized object literal for one `kind` | If more than 8 mapper props are needed, move renderer-specific config to dedicated wrapper/adapter renderer | `check-patterns` (`mapper-output-complexity`) | warn (`>8`), block (`>12`) |
| Cluster renderer naming drift | `cluster/rendering/` component IDs are cluster-prefixed (e.g. `Vessel*`) | Use role-based renderer IDs in `cluster/rendering/` (e.g. `RendererPropsWidget`) | `check-patterns` (`cluster-renderer-cluster-prefix`) + `check-naming` | block |
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

## Suppression Syntax

Allowed inline exceptions:

```javascript
// dyni-lint-disable-next-line <rule-name> -- <reason>
/* dyni-lint-disable-line <rule-name> -- <reason> */
```

- Suppress only one named rule.
- Always include a short reason after `--`.
- Malformed directives or unknown rule names fail via `invalid-lint-suppression`.

## Severity Model

- `block`: must pass locally before push.
- `warn`: allowed only for exploratory or rollout rules not yet promoted; promotion target and rationale must be tracked in `documentation/TECH-DEBT.md`.
- Promotion rule for warn-only rollout checks: each rule moves to `block` only after its repo warning count reaches zero and the zero-warning state is recorded in `TECH-DEBT.md`.

## Fix Playbooks

### Theme cache drift

1. Add/verify `invalidateRoot` and `invalidateAll` on cache-owning module API.
2. Call `invalidateRoot(rootEl)` directly from every runtime mutation path that updates a specific widget root.
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

### Catch fallback without suppression

1. Re-throw errors by default.
2. If the fallback is still required by an external boundary, add a rule-specific suppression with a reason.
3. Remove the suppression once the boundary contract is tightened.

### Internal hook fallback

1. Remove `normalize*` helpers that re-sanitize internal hook outputs.
2. Remove `cfg.*(...) || ...` hook-result fallbacks where the hook contract can guarantee shape.
3. Push required defaults into the boundary that owns the hook/spec result.

### Redundant null/type guard

1. Remove repeated `String(... == null ? ... : ...)`, `Array.isArray(...) ? ... : []`, and `isFiniteNumber(...) ? ... : ...` patterns on internal values.
2. Tighten the upstream contract instead of silently normalizing downstream.
3. Add suppression only for temporary migrations that still bridge an external boundary.

### Hardcoded runtime default

1. Move placeholder/default literals to declarative config, mapper defaults, runtime helpers, or CSS/theme token boundaries.
2. Remove inline object/array fallback stubs in widget/shared code where the shape is already contract-owned.
3. Treat new findings as fail-closed; do not reopen warning debt for this rule family.

### Widget renderer default duplication

1. Remove widget-local `ratioDefaults` / `rangeDefaults` that exactly mirror config-owned editable defaults.
2. Keep engine defaults as the single runtime fallback owner for unreachable missing-config scenarios.
3. Add or adjust checker coverage when a new renderer family adds default-bearing spec groups.

### Engine/layout default drift

1. Keep semantic ratio defaults in the engine owner (`DEFAULT_RATIO_DEFAULTS`) and remove copied layout constants.
2. If a layout still needs a fallback, use structural safety bounds rather than re-declaring semantic defaults.
3. Add or adjust family-manifest tests whenever a new engine/layout pair is introduced.

### Canvas API typeof guard

1. Remove `typeof ctx.* === "function"` guards for standard Canvas 2D methods on internal drawing paths.
2. Keep capability checks only at genuine DOM/canvas boundaries and annotate intentional exceptions with rule-specific suppressions.
3. Add or adjust checker tests for any newly allowlisted Canvas methods.

### Try/finally canvas drawing

1. Replace internal `ctx.save(); try { ... } finally { ctx.restore(); }` blocks with direct save/draw/restore pairing.
2. Keep `try/finally` only when cleanup crosses a real external boundary or callback-owned throw path.
3. Suppress narrow boundary exceptions explicitly until the contract is tightened.

### Framework method typeof guard

1. Remove `typeof Helpers.* === "function"` and module-alias method guards after internal resolution.
2. Keep runtime/theme invalidation call paths on direct contract calls (`resolver.invalidateRoot(...)`) once module ownership is established.
3. Keep bootstrap- or DOM-boundary exceptions explicit with rule-specific suppressions.
4. Extend alias detection coverage when a new internal resolver pattern is introduced.

### Inline config default duplication

1. Remove inline fallback literals when the editable-parameter boundary already guarantees the prop default.
2. Keep downstream code on the normalized prop contract and centralize real defaults in config/runtime boundaries.
3. Add checker coverage for new editable-backed fallback patterns before promoting the rule.

### Responsive layout hard floor

1. Replace user-visible `Math.max(N>=3, ...)` / `clamp(..., N>=3, ...)` layout floors with `ResponsiveScaleProfile`-derived geometry or text ceilings.
2. Keep only true technical canvas-viability guards above `2`, and annotate those lines with a rule-specific suppression comment plus reason.
3. Treat any new finding as fail-closed; the rollout backlog was cleared and the rule is now `block`.

### Responsive profile ownership drift

1. Resolve `ResponsiveScaleProfile` only in layout-owner modules (`TextLayoutEngine`, layout owners for nav/xte/linear/radial families).
2. Keep consumer modules on layout-owned state (`responsive`, `textFillScale`, `computeResponsiveInsets`) instead of importing the profile directly.
3. Add or adjust tool tests when ownership boundaries move so the manifest stays aligned with the repo architecture.

### CSS/JS default duplication

1. Keep style/token defaults in `plugin.css` or `ThemeResolver`.
2. Remove duplicated JS defaults around `getComputedStyle`, `defaultValue`, and `--dyni-*` lookups when a single boundary can own them.
3. Suppress only temporary boundary bridges and document why the duplication still exists.

### Premature legacy support

1. Remove speculative `fallback*`, `legacy*`, `compat*`, or `deprecated*` code names when no live contract requires them.
2. Collapse multi-source compatibility branches down to the single supported input path.
3. Reintroduce compatibility only when there is a documented boundary contract and coverage for it.

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
3. Update mapper `renderer` values and component registry registrations together (`config/components/registry-*.js`, assembled by `config/components.js`).

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
2. Prefer shared API calls (`RadialValueMath.*`, shared renderers) over repeated local helper implementations.
3. For runtime IIFE perf instrumentation, use `runtime/PerfSpanHelper.js` (`runtime.getPerfSpanApi()`) as the canonical owner; if bootstrap constraints force temporary local duplication, keep a rule-specific suppression + debt entry.
4. Keep duplicated orchestration stubs (`create`, `translate`, `translateFunction`, `renderHtml`, `renderCanvas`) minimal; all substantive logic belongs in shared modules or surface owners.
5. Add/adjust tests to lock expected shared-helper behavior after extraction.

### Oneliner line-limit bypass

1. Reformat dense oneliners into multiline blocks.
2. Split very long packed lines into multiline object literals/call arguments.
3. Use `npm run check:filesize` for fail-closed enforcement; use `npm run check:filesize:warn` only for exploratory cleanup passes.

## Related

- [coding-standards.md](coding-standards.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [../guides/garbage-collection.md](../guides/garbage-collection.md)
- [../core-principles.md](../core-principles.md)
