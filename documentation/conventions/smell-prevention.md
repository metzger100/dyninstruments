# Smell Prevention

**Status:** ✅ Implemented | Fail-closed smell policy and enforcement map

## Overview

This document defines smell rules and enforcement ownership.
Blocking checks must pass before push (`npm run check:all` via pre-push hook); warn-only rollout rules remain debt until promoted to `block`.

## Smell Catalog

| Smell Class | Anti-Pattern | Required Pattern | Enforcement | Severity |
|---|---|---|---|---|
| Theme cache drift | Token cache never invalidated after theme preset mutation | Cache-owning modules expose explicit invalidation APIs and callers invoke them on mutation | `check-smell-contracts` (`theme-cache-invalidation`) | block |
| Dynamic key stale state | `storeKeys.value` remains when dynamic key field is cleared | Clear stale dynamic store keys when key input is empty | `check-smell-contracts` (`dynamic-storekey-clears-on-empty`) | block |
| Absolute user-home path leak | Repository content includes machine-local absolute paths such as `/home/<user>/...` or `/Users/<user>/...` | Keep repository paths project-relative or placeholder/redacted (`/path/to/...`, `/home/<user>/...`) | `check-patterns` (`absolute-user-home-path`) | block |
| Removed theme/surface architecture resurrection | Reintroducing removed paths such as `ThemePresets`, `data-dyni-theme`, `applyThemePreset*`, `namedHandlers`, `catchAll`, `triggerResize`, inline `onclick="..."`, or legacy `invalidateTheme()` hooks | Keep commit-driven runtime/surface architecture; use direct listener ownership and runtime-owned theme apply/policy boundaries | `check-patterns` (`removed-theme-surface-architecture`) | block |
| Legacy theme CSS input consumer | Migrated CSS consumes raw input vars (`--dyni-font-weight`, `--dyni-label-weight`, `--dyni-border-day`, `--dyni-border-night`) | Consume migrated output vars (`--dyni-theme-*`) for migrated values | `check-patterns` (`legacy-theme-css-input-consumer`) | block |
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
| Mapper output complexity | Mapper branch returns oversized object literal for one `kind` | If more than 8 mapper props are needed, use grouped mapper output (`domain` / `layout` / `formatting`) as documented in [add-new-html-kind.md](../guides/add-new-html-kind.md#grouped-mapper-output-for-complex-payloads) | `check-patterns` (`mapper-output-complexity`) | warn (`>8`), block (`>12`) |
| Cluster renderer naming drift | `cluster/rendering/` component IDs are cluster-prefixed (e.g. `Vessel*`) | Use role-based renderer IDs in `cluster/rendering/` (e.g. `RendererPropsWidget`) | `check-patterns` (`cluster-renderer-cluster-prefix`) + `check-naming` | block |
| Hotspot growth | Known hotspot files keep growing | Keep hotspot files under stricter local budget, split shared logic early | `check-smell-contracts` (`text-layout-hotspot-budget`) + `check-file-size` | block |
| Formatter availability heuristic | infer formatter failure from output equality (`out.trim() === String(raw)`) | Use explicit formatter API/fallback behavior, do not infer from output text equality | `check-patterns` (`formatter-availability-heuristic`) + `check-smell-contracts` (`coordinate-formatter-no-raw-equality-fallback`) | block |
| Placeholder normalization drift | Formatter outputs bypass `PlaceholderNormalize` at the render boundary | Normalize render-model output once via `PlaceholderNormalize` | `check-smell-contracts` (`placeholder-contract`) | block |
| Dash-literal placeholder drift | Widget/runtime source keeps banned literal placeholders like `"NO DATA"` or `"--:--"` | Keep placeholder strings centralized in `PlaceholderNormalize` and exempt only the documented RoutePoints carve-out | `check-smell-contracts` (`dash-literal-contract`) | block |
| State-screen precedence drift | `pickFirst([...])` calls are indirect or order state-screens incorrectly | Use inline `pickFirst([...])` arrays with canonical order and the AIS hidden exception only | `check-smell-contracts` (`state-screen-precedence-contract`) | block |
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

Remediation steps for each smell class: [smell-fix-playbooks.md](smell-fix-playbooks.md).

## Related

- [coding-standards.md](coding-standards.md)
- [smell-fix-playbooks.md](smell-fix-playbooks.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
- [../core-principles.md](../core-principles.md)
