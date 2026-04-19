# Smell Fix Playbooks

**Status:** ✅ Reference | Step-by-step remediation for smell catalog entries

## Overview

Remediation playbooks for smell rules defined in `smell-prevention.md`. Consult during cleanup sessions only.

## Key Details

- Apply these playbooks after a smell finding is reported by `check-patterns` or `check-smell-contracts`.
- Keep fixes minimal and aligned with canonical ownership boundaries documented in coding standards.
- Use rule-specific suppressions only for intentional, temporary boundary exceptions.

## Playbooks

### Theme cache drift

1. Add/verify `invalidateRoot` and `invalidateAll` on cache-owning module API.
2. Call `invalidateRoot(rootEl)` directly from every runtime mutation path that updates a specific widget root.
3. Add/adjust tests for mutation -> invalidation -> refreshed resolve.

### Dynamic key stale state

1. In cluster `updateFunction`, branch on empty key input.
2. Remove stale `storeKeys.<dynamic>` when empty.
3. Add config-cluster tests for empty-key cleanup.

### Absolute user-home path leak

1. Replace machine-local absolute paths with repo-relative references, runtime variables, or placeholders (`/path/to/...`, `/home/<user>/...`).
2. Keep installation docs generic (`<AVNAV_DATA_DIR>`, `<YOUR_AVNAV_PLUGIN_DIR>`) instead of personal home directories.
3. If a real path is temporarily unavoidable in a test fixture, add a rule-specific suppression and an explicit reason.

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
4. Apply the renderer decision rule before adding renderer-specific prop sets to mapper branches: [../guides/add-new-cluster.md#renderer-decision-rule](../guides/add-new-cluster.md#renderer-decision-rule).

### Mapper output complexity

1. Keep each direct `translate()` return object literal under 9 top-level props when feasible.
2. If one `kind` requires renderer-specific configuration beyond this threshold, move those props into a dedicated renderer wrapper/adapter contract.
3. Use the renderer decision rule as the default architecture gate: [../guides/add-new-cluster.md#renderer-decision-rule](../guides/add-new-cluster.md#renderer-decision-rule).
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

### Placeholder normalization drift

1. Move placeholder replacement to `PlaceholderNormalize.normalize(...)` at the render boundary.
2. Remove widget-local placeholder fallback branches once the shared helper is wired in.
3. Keep RoutePoints compound placeholders as the only documented carve-out.

### Dash-literal placeholder drift

1. Remove banned literal placeholder strings from widget/runtime source.
2. Route all placeholder text through `PlaceholderNormalize`.
3. Preserve the RoutePoints compound-placeholder carve-out when it is the intended contract.

### State-screen precedence drift

1. Keep `pickFirst([...])` calls inline so the checker can inspect the precedence order.
2. Put `disconnected` first, with the AIS `hidden` exception allowed only when it must precede `disconnected`.
3. Keep `data` as the final catch-all candidate.

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

- [smell-prevention.md](smell-prevention.md)
- [coding-standards.md](coding-standards.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [../guides/garbage-collection.md](../guides/garbage-collection.md)
