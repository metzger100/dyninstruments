# Guide: Garbage Collection

**Status:** ✅ Active | Single-pass workflow for keeping code and docs clean

## Overview

Use this guide to remove structural drift, keep documentation synchronized with code, and preserve runtime boundaries. Follow this workflow whenever you perform cleanup or technical-debt reduction.

## Baseline State

Baseline commit (self-updating): `43b373bd04480601bbfe3028fa2d2af4346de6fc`
Baseline updated (UTC): `2026-03-09T15:19:25Z`

## Workflow

1. Read baseline status first.

```bash
npm run gc:status
```

- Use the reported `baseline..HEAD` range and candidate file list to scope cleanup.
- If `gc:status` reports a missing baseline commit, stop and reset explicitly:

```bash
node tools/gc-baseline.mjs --set <commit>
```

2. Run the mandatory manual commit audit (see [Manual Commit Audit (Required)](#manual-commit-audit-required)).

3. Run structural checks.

```bash
npm run check:filesize
node tools/check-headers.mjs
node tools/check-naming.mjs
node tools/check-patterns.mjs --warn
```

Rule references:
- `check-patterns.mjs`: `duplicate-fn-body` (`duplicate-functions`), `duplicate-block` (`duplicate-block-clones`), `forbidden-global`, `empty-catch`, `todo-missing-owner`, `unused-fallback`, `dead-code`, `default-truthy-fallback`, `formatter-availability-heuristic`, `renderer-numeric-coercion-without-boundary-contract`, `mapper-output-complexity` (warn at `9..12`, block at `>12`)
- `check-patterns.mjs` block-mode fail-fast + atomicity rules: `internal-hook-fallback`, `redundant-null-type-guard`, `hardcoded-runtime-default`, `widget-renderer-default-duplication`, `engine-layout-default-drift`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing`, `framework-method-typeof-guard`, `inline-config-default-duplication`
- `check-patterns.mjs` remaining warn-only rollout rules: `catch-fallback-without-suppression`, `css-js-default-duplication`, `premature-legacy-support`, `editable-threshold-missing-internal`
- `check-patterns.mjs` blocking suppression guard: `invalid-lint-suppression`
- `check-smell-contracts.mjs`: `theme-cache-invalidation`, `dynamic-storekey-clears-on-empty`, `falsy-default-preservation`, `mapper-output-no-nan`, `text-layout-hotspot-budget`, `coordinate-formatter-no-raw-equality-fallback`
- `check-file-size.mjs`: warning at `>=300` non-empty lines, failure at `>400` non-empty lines, oneliner detection in block mode via `npm run check:filesize` (optional exploratory warn mode: `npm run check:filesize:warn`)

4. Verify code-doc co-evolution for changed `.js` files.
- Start from `gc:status` candidate files (baseline range + working-tree drift).
- For each file, inspect its header `Documentation:` path and confirm the linked `.md` still describes current behavior.
- Update docs in the same task whenever behavior, props, mapper outputs, or dependencies change.

5. Consolidate duplicate helpers into shared modules.
- Move reusable logic to `shared/widget-kits/` (or `shared/widget-kits/radial/`).
- Keep widget files focused on widget-specific behavior, not shared math/layout/formatter logic.

6. Enforce the AvNav boundary.
- Only `runtime/` and `plugin.js` should access `window.avnav` / `avnav.api` directly.
- Widgets/cluster/shared code should call runtime-safe helpers such as `Helpers.applyFormatter()`.

7. Remove refactor leftovers.
- Delete fallback declarations that are no longer referenced.
- Delete dead top-level helper functions and constant-condition branches.

8. Fix catch and maintenance-marker hygiene.
- Replace empty catches with explicit handling: comment why silence is intentional, log with context, or use centralized handlers.
- For intentional rule exceptions, use rule-specific suppression syntax with a reason:
  - `// dyni-lint-disable-next-line <rule-name> -- <reason>`
  - `/* dyni-lint-disable-line <rule-name> -- <reason> */`
- Ensure maintenance markers include owner and date, e.g. `TODO(name, 2026-02-20): ...`.

9. Re-run checks and close the loop.
- Run strict checks after fixes:

```bash
node tools/check-patterns.mjs
npm run check:filesize
node tools/check-headers.mjs
node tools/check-naming.mjs
node tools/check-docs.mjs
```

- When cleanup changes debt status, update `documentation/TECH-DEBT.md` and `documentation/QUALITY.md`.
- Update baseline marker to current `HEAD` only after all completion gates pass:
- every commit in `RANGE` was manually reviewed (`git rev-list --reverse "$RANGE"`)
- all findings were fixed or explicitly tracked in docs/debt logs
- strict checks were re-run and clean (`npm run check:all`)

```bash
npm run gc:update-baseline
```

## Manual Commit Audit (Required)

- Derive the exact baseline range from `gc:status`.
- Review every commit in chronological order (`git rev-list --reverse`), including merge commits.
- Review each commit diff (`git show`) and capture findings before cleanup edits.

```bash
RANGE="$(npm run -s gc:status | sed -n 's/^Range: //p')"
git rev-list --count "$RANGE"
git rev-list --reverse "$RANGE"
for commit in $(git rev-list --reverse "$RANGE"); do
  echo "===== $commit ====="
  git show --stat --patch --find-renames "$commit"
done
```

Required per-commit audit checks:
- code↔doc drift (behavior changed without linked doc updates)
- smell regressions and boundary violations (`window.avnav` usage outside runtime, mapper leakage, fallback drift)
- suspicious test weakening or missing coverage updates for behavior changes
- renamed/moved files with stale docs, stale headers, or naming drift

## Anti-Patterns

| Pattern | Example from This Project | Detection | Fix |
|---|---|---|---|
| Helper duplication | Historical: `extractNumberText` duplicated in 4 gauge widgets before TD-001 (`DepthRadialWidget`, `SpeedRadialWidget`, `TemperatureRadialWidget`, `VoltageRadialWidget`) | `check-patterns.mjs` (`duplicate-functions` / `[duplicate-fn-body]`) | Extract shared helper to `shared/widget-kits/` (done via `RadialValueMath.extractNumberText`) |
| AvNav boundary bypass | Historical: direct `avnav.api` access in `SpeedRadialWidget`, `TemperatureRadialWidget`, `VoltageRadialWidget`, `WindRadialWidget`, `PositionCoordinateWidget` (TD-008) | `check-patterns.mjs` (`forbidden-global`) | Route through `Helpers.applyFormatter()` |
| Empty catch blocks | Historical: silent `catch(e){}` fallback paths in renderer/helper/widget code before TD-009 | `check-patterns.mjs` (`empty-catch`) | Add explicit comment/logging or use centralized boundary handling |
| Growing files | Current `>=300` warnings: `config/clusters/environment.js`, `config/components.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/radial/FullCircleRadialTextLayout.js`, `shared/widget-kits/radial/RadialValueMath.js`, `shared/widget-kits/radial/SemicircleRadialTextLayout.js`, `shared/widget-kits/text/TextLayoutComposite.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | `check-file-size.mjs` (warning at `>=300`) | Split before exceeding 400 non-empty lines |
| Oneliner size-limit bypass | Backlog resolved (`onelinerDenseWarnings: 0`, `onelinerLongWarnings: 0`, `onelinerWarnings: 0`) and fail-closed enforcement active (TD-012 completed) | `npm run check:filesize` (`--oneliner=block`) | Keep multiline formatting; use `npm run check:filesize:warn` only for exploratory passes |
| Stale doc headers | Historical header path drift: `documentation/modules/...` and `documentation/architecture/module-system.md` migrated to current `documentation/widgets/...` and `documentation/architecture/component-system.md` | `check-headers.mjs` (`broken-doc-link`) | Update `Documentation:` header path to the current doc |
| Naming drift | Historical naming cleanup: `DyniThreeElements` -> `DyniThreeValueTextWidget` and related `globalKey` normalization in `config/components.js` | `check-naming.mjs` | Rename to match conventions (`Dyni{ComponentName}` and matching registered/returned ids) |
| Copy-paste divergence | Historical: `clamp` implemented in multiple files (`RadialValueMath`, `PositionCoordinateWidget`, `ThreeValueTextWidget`) before TD-006 | `check-patterns.mjs` (`duplicate-functions`, `duplicate-block-clones`) | Use canonical shared implementation (`RadialValueMath.clamp`) |
| File-list-only review | Reviewing only `gc:status` candidate files while skipping chronological commit audit in `baseline..HEAD` | Manual workflow gate (`Manual Commit Audit (Required)`) | Run full commit-by-commit inspection (`git rev-list --reverse "$RANGE"` + `git show`) before baseline update |
| Test assertion gaming | Guardrail: no confirmed incident in current history, but risk exists when assertions are weakened to force green builds | Human review | Restore strong assertions and fix implementation behavior |
| Code↔Doc divergence | Risk pattern: JS behavior changed while linked module docs lag behind | Manual workflow step (code-doc co-evolution check) | Update linked docs in the same task |
| Theme cache drift | Runtime preset/style mutation does not invalidate cached token values | `check-smell-contracts.mjs` (`theme-cache-invalidation`) | Expose invalidation API and call it after runtime theme mutation |
| Stale dynamic store keys | Empty dynamic key input leaves old `storeKeys.value` active | `check-smell-contracts.mjs` (`dynamic-storekey-clears-on-empty`) | Remove stale key from `storeKeys` when input is empty |
| Falsy default clobbering | `x.default || "---"` overwrites explicit `""`, `0`, or `false` | `check-patterns.mjs` (`default-truthy-fallback`), `check-smell-contracts.mjs` (`falsy-default-preservation`) | Use property-presence/nullish semantics |
| Invalid suppression directive | `dyni-lint-disable-*` comment is malformed or references unknown rule | `check-patterns.mjs` (`invalid-lint-suppression`) | Fix the directive syntax and keep the reason explicit |
| Catch fallback without suppression | Non-rethrow `catch` path remains without explicit exception | `check-patterns.mjs` (`catch-fallback-without-suppression`) | Re-throw by default or add narrow suppression with reason while the external boundary still requires fallback |
| Internal hook fallback | Shared/widget code wraps hook/spec output in `normalize*` or `cfg.*(...) || ...` fallback logic | `check-patterns.mjs` (`internal-hook-fallback`) | Move defaults to the owning boundary and trust internal hook contracts |
| Redundant null/type guard | Internal code repeatedly sanitizes already-normalized values | `check-patterns.mjs` (`redundant-null-type-guard`) | Remove downstream guards and tighten upstream contracts |
| Hardcoded runtime default | Inline placeholder/object/number defaults drift from config/theme ownership | `check-patterns.mjs` (`hardcoded-runtime-default`) | Move defaults to declarative config/theme/helper boundaries |
| Widget renderer default duplication | Widget `createRenderer(...)` repeats editable defaults in `ratioDefaults` / `rangeDefaults` | `check-patterns.mjs` (`widget-renderer-default-duplication`) | Remove widget-local default objects and keep the engine fallback as the single runtime owner |
| Engine/layout default drift | Layout module copies semantic ratio defaults from its engine family | `check-patterns.mjs` (`engine-layout-default-drift`) | Keep semantic defaults in the engine owner; layout uses structural bounds only |
| Canvas API typeof guard | Internal draw code checks standard Canvas 2D methods with `typeof ctx.* === "function"` | `check-patterns.mjs` (`canvas-api-typeof-guard`) | Remove redundant Canvas API guards and keep capability checks only at external DOM/canvas boundaries |
| Try/finally canvas drawing | Internal draw path wraps `ctx.save()` / `ctx.restore()` in `try/finally` without a real external throw boundary | `check-patterns.mjs` (`try-finally-canvas-drawing`) | Use direct save/draw/restore pairing and suppress only genuine boundary exceptions |
| Framework method typeof guard | Internal code checks `Helpers` or module-alias methods with `typeof ... === "function"` after resolution | `check-patterns.mjs` (`framework-method-typeof-guard`) | Trust module-loader/helper contracts once inside the internal boundary |
| Inline config default duplication | Widget/shared code re-declares editable defaults inline with ternary fallback literals | `check-patterns.mjs` (`inline-config-default-duplication`) | Trust the editable-default contract and delete duplicated literals downstream |
| CSS/JS default duplication | JS repeats CSS/theme defaults around `getComputedStyle`, `defaultValue`, or `--dyni-*` | `check-patterns.mjs` (`css-js-default-duplication`) | Keep visual defaults in CSS/theme boundary only |
| Premature legacy support | Speculative `fallback*`/`legacy*`/`compat*` paths linger in code | `check-patterns.mjs` (`premature-legacy-support`) | Remove compat paths until a live contract requires them |
| Renderer coercion drift | Renderer performs `Number(props.x)` for mapper-owned normalized values | `check-patterns.mjs` (`renderer-numeric-coercion-without-boundary-contract`), `check-smell-contracts.mjs` (`mapper-output-no-nan`) | Normalize at mapper boundary, pass finite or `undefined` |
| Formatter output heuristic | Inferring formatter absence from output equality (`out.trim() === String(raw)`) | `check-patterns.mjs` (`formatter-availability-heuristic`), `check-smell-contracts.mjs` (`coordinate-formatter-no-raw-equality-fallback`) | Remove output-equality heuristics; rely on explicit formatter flow |
| Mapper output complexity | One mapper `kind` branch returns too many top-level props (`return { ... }`) and starts encoding renderer behavior directly | `check-patterns.mjs` (`mapper-output-complexity`) | Keep mapper output thin; move renderer-specific config to a dedicated wrapper/adapter when a branch exceeds 8 props (hard block at `>12`) |
| Undated TODOs (`TODO(name, 2026-02-20): ...` required format) | Guardrail: no current violations, rule still enforced repo-wide | `check-patterns.mjs` (`todo-missing-owner`) | Use `TODO(name, YYYY-MM-DD): description` |
| Unused fallback leftovers | Refactor drift risk: fallback variables remain after formatter-path rewrites and are never read | `check-patterns.mjs` (`unused-fallback`) | Remove stale declarations or wire fallback into reachable formatting flow |
| Dead refactor code | Refactor drift risk: helper function no longer referenced, or `if (false)` / `if (CONST_FLAG)` constant branches | `check-patterns.mjs` (`dead-code`) | Delete unreachable paths and keep only active logic |

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../core-principles.md](../core-principles.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [documentation-maintenance.md](documentation-maintenance.md)
- [../QUALITY.md](../QUALITY.md)
- [../TECH-DEBT.md](../TECH-DEBT.md)
