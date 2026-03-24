# PLAN4 — Runtime & Theme Lifecycle Cleanup After `renderHtml` Refactor

## Status

Rewritten after repository verification.

This plan keeps the verified problem list, removes unsupported assumptions, and uses conservative implementation language where multiple code-level solutions appear viable. The coding agent may choose equivalent implementations as long as the behavioral and documentation outcomes below are met.

---

## Goal

Reduce lifecycle drift, duplicate utility logic, and avoidable runtime work introduced around the `renderCanvas` → `renderHtml` host registration transition, while keeping the existing AvNav host path intact.

Expected outcomes after completion:

- Theme preset selection works when `--dyni-theme-preset` is provided via CSS, including the case where widget roots are mounted after runtime init.
- Duplicate utilities are either consolidated into canonical shared modules or explicitly suppressed with a documented rationale where runtime layering prevents direct reuse.
- Runtime hot paths avoid obvious repeated work without weakening correctness across page changes or remounts.
- `HostCommitController` fallback behavior remains present but is more bounded and easier to reason about.
- `CanvasDomSurfaceAdapter.js` returns to the file-size budget.
- Runtime architecture documentation is updated, including a new `documentation/architecture/runtime-lifecycle.md` page.

---

## Verified Baseline

The following points were rechecked against the repository before this rewrite:

1. `shared/theme/ThemeResolver.js` resolves preset names from `data-dyni-theme` but does not currently fall back to `--dyni-theme-preset` at render time.
2. `getNightModeState` is duplicated between `shared/theme/ThemeResolver.js` and `runtime/helpers.js`.
3. Perf-span helper logic is duplicated across cluster/runtime files.
4. HTML-widget utility helpers are duplicated across multiple HTML widgets and fit modules.
5. `shared/widget-kits/nav/MapZoomHtmlFit.js` still hardcodes font weights instead of reading them from theme tokens.
6. `runtime/HostCommitController.js` falls back to a whole-body `MutationObserver`.
7. `runtime/TemporaryHostActionBridge.js` recomputes capability state repeatedly.
8. `runtime/HostCommitController.js` allocates a fresh shallow state object on every `getState()` call.
9. `loadScriptOnce` is duplicated between `plugin.js` and `runtime/component-loader.js`.
10. `normalizePresetName` is duplicated across theme-related files.
11. Theme invalidation call sites still contain framework-method `typeof` guards.
12. `cluster/rendering/CanvasDomSurfaceAdapter.js` exceeds the preferred line budget.
13. `documentation/architecture/runtime-lifecycle.md` does not currently exist and should be created during the documentation phase.
14. `plugin.js` currently defines 26 internal script loads.
15. `runInit()` is invoked twice in the current flow: once inside `runtime/init.js` and once again from `plugin.js`, with the init guard preventing duplicate work.

---

## Lifecycle Notes

These notes exist to anchor the plan. They are descriptive, not prescriptive.

### Bootstrap and init

- `plugin.js` loads 26 internal scripts in sequence.
- `runtime/namespace.js` creates the runtime namespace early.
- Shared UMD components are loaded later by `runtime/component-loader.js` during `runInit()`.
- `runtime/init.js` self-invokes `runInit()`.
- `plugin.js` invokes `window.DyniPlugin.runtime.runInit()` again after the internal script chain completes.
- The current init guard prevents duplicate initialization.

Consequence: runtime IIFE files cannot assume shared UMD helpers are available during namespace bootstrap.

### Theme preset timing

- Runtime init tries to resolve and apply a preset name before AvNav is guaranteed to have mounted `.widget.dyniplugin` roots.
- Later, render-time token resolution works because tokens are read from computed style on demand.
- Preset-name discovery does not currently have an equivalent render-time CSS fallback.

Consequence: preset names supplied by CSS can be missed even though token overrides work.

### TemporaryHostActionBridge lifecycle

- `state.hostActionBridge` is created once during init and then reused.
- The current bridge code derives page-specific capability state from the live document during action calls.
- The repository does not currently show bridge recreation on page transitions.

Consequence: any optimization here must preserve correctness if the current page changes while the bridge instance remains alive.

### Host commit fallback lifecycle

- `HostCommitController` currently performs two RAF attempts before falling back to a body-wide `MutationObserver`.
- The controller already uses a timeout handle for existing deferred work.

Consequence: any observer ceiling or timeout addition should account for the existing timeout state rather than assuming a free timer slot.

---

## Problem Analysis

### Problem 1 — Theme preset name is not reliably discovered from CSS at render time

`ThemeResolver` currently relies on the `data-dyni-theme` attribute for preset-name discovery. Because widget roots may not exist when runtime init runs, the attribute may never be written before the first render. Per-token CSS reads still work, but preset-name discovery does not benefit from that path.

**Desired outcome:** preset-name resolution should support the priority chain:

1. `data-dyni-theme` on the root
2. `--dyni-theme-preset` from computed style
3. built-in `"default"`

### Problem 2 — `getNightModeState` has two owners

The same logic exists in `ThemeResolver` and `runtime/helpers.js`.

**Desired outcome:** one canonical implementation, or one canonical implementation plus an explicit suppression where direct reuse is not practical because of lifecycle/layering constraints.

### Problem 3 — Perf-span wiring is duplicated across multiple files

The same span helper logic appears in cluster-facing modules and runtime-facing modules.

**Desired outcome:** one shared implementation for UMD consumers; runtime IIFE handling may use either a thin runtime-local helper or an explicit documented suppression if direct reuse is awkward under the current load order.

### Problem 4 — HTML widget utility helpers are duplicated

`toFiniteNumber`, `trimText`, `escapeHtml`, `toStyleAttr`, `resolveShellRect`, `resolveMode`, and `isEditingMode` appear in multiple files in slightly different forms.

**Desired outcome:** one canonical HTML-widget utility module for UMD consumers.

### Problem 5 — `MapZoomHtmlFit` hardcodes font weights

The module currently uses constants where `ActiveRouteHtmlFit` already demonstrates a theme-token-driven approach.

**Desired outcome:** read font weights from theme tokens rather than constants.

### Problem 6 — `HostCommitController` observer fallback is broad and unbounded

The fallback observer currently watches `document.body` with `subtree: true`, which can react to unrelated DOM activity. The plan should keep the fallback, but reduce its blast radius where practical and bound its lifetime.

**Desired outcome:** more RAF budget before fallback, bounded observer lifetime, and narrower observation scope if reliable.

### Problem 7 — `TemporaryHostActionBridge` repeats capability work

Capability and page-detection work is repeated across facade methods.

**Desired outcome:** reduce repeated work without assuming bridge-lifetime page stability unless the implementation also introduces an invalidation or recreation mechanism that makes such caching safe.

### Problem 8 — `HostCommitController.getState()` allocates on every read

The current API creates a new shallow object on each render cycle.

**Desired outcome:** avoid repeated allocation when the underlying controller state has not changed.

### Problem 9 — `loadScriptOnce` is duplicated

The same helper exists in both `plugin.js` and `runtime/component-loader.js`.

**Desired outcome:** one canonical implementation, or a documented suppression if the load order makes reuse too invasive for this plan.

### Problem 10 — `normalizePresetName` is duplicated

Theme normalization logic appears in more than one theme-related file.

**Desired outcome:** one canonical normalization helper exposed from the theme preset side.

### Problem 11 — Theme invalidation still uses framework-method `typeof` guards

The current code contains defensive `typeof` guards around APIs that appear to be required by the module contract.

**Desired outcome:** remove redundant guards where the module contract already guarantees the method, while keeping null checks where object presence can still vary.

### Problem 12 — `CanvasDomSurfaceAdapter.js` exceeds the file-size budget

The file is above the preferred 400-line threshold.

**Desired outcome:** remove redundant guards only on paths whose controller contract already guarantees the method. Guards that protect mixed controller types must remain until the contract is expanded.

---

## Hard Constraints

### Architecture

- Do not change the AvNav host registration strategy.
- Do not add ES module imports.
- Do not add a bundler or build step.
- Keep runtime IIFE files independent of `Helpers.getModule()` unless a verified load-order-safe mechanism is introduced.

### Theme behavior

- Preserve the theme priority model:
  - preset name: DOM attribute → CSS variable → built-in default
  - token value: CSS override → preset value → built-in default
- Do not regress direct token overrides from CSS.

### Runtime correctness

- Do not trade correctness for caching in page-sensitive runtime code.
- Do not remove the `MutationObserver` fallback entirely.
- Do not assume bridge recreation on page changes unless code added in this plan makes that true.

### Scope

- Do not change `config/clusters/*.js` definitions.
- Do not rewrite stable canvas-only widgets unless they share code with in-scope modules.
- Do not perform source-code changes in the documentation phase.

---

## Implementation Order

### Phase 1 — Consolidate shared utilities conservatively

**Intent:** reduce proven duplication and move obvious shared logic into canonical utility modules where layering allows it.

**Dependencies:** none.

#### 1A. Create `shared/widget-kits/perf/PerfSpanHelper.js`

Create a small UMD helper for perf-span start/end behavior used by UMD consumers.

#### 1B. Add `tests/shared/perf/PerfSpanHelper.test.js`

Cover:

- hooks present
- hooks absent
- tag passthrough
- no-op close behavior

#### 1C. Register the helper in component config

Register the new helper in the appropriate shared component registry. Update consumer dependency declarations in the affected registries where the new helper becomes a direct dependency. Update registry tests accordingly.

#### 1D. Rewire UMD consumers to the shared perf helper

Candidate files:

- `cluster/ClusterWidget.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `cluster/rendering/HtmlSurfaceController.js`
- `cluster/rendering/CanvasDomSurfaceAdapter.js`

Local non-perf uses of `GLOBAL_ROOT` may remain local if they are not part of the duplicated perf logic.

#### 1E. Handle runtime perf duplication without assuming impossible load order

For runtime IIFE files such as:

- `runtime/HostCommitController.js`
- `runtime/SurfaceSessionController.js`

the implementation should choose one of these conservative options:

- **Option A:** keep the local logic for now and add explicit suppression/comments pointing to the canonical shared helper.
- **Option B:** introduce a small runtime-local helper that is loaded as part of the internal script chain before the consuming runtime files.
- **Option C:** reuse an existing runtime namespace helper only if the actual script order is verified and the resulting wiring stays simpler than a suppression.

Do not assume a shared UMD helper can be attached during `runtime/namespace.js` bootstrap, because shared UMD components are loaded later.

#### 1F. Create `shared/widget-kits/html/HtmlWidgetUtils.js`

Create a shared UMD utility module for duplicated HTML-widget helpers. Canonical names should be used consistently, including `escapeHtml`.

#### 1G. Add `tests/shared/html/HtmlWidgetUtils.test.js`

Cover edge cases for numeric normalization, HTML escaping, style serialization, shell rect resolution, mode selection, and editing-mode detection.

#### 1H. Register the HTML helper in component config

Register in the appropriate shared component registry. Update consumer dependency declarations in the affected registries where the new helper becomes a direct dependency. Update registry tests accordingly.

#### 1I. Rewire UMD HTML-widget consumers

Primary candidates:

- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`
- `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`
- `shared/widget-kits/nav/MapZoomHtmlFit.js`
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js`

#### 1J. Deduplicate `loadScriptOnce` if the wiring stays low-risk

Preferred direction:

- expose one canonical implementation from `plugin.js`
- have `runtime/component-loader.js` reuse it

Fallback:

- keep the duplicate temporarily with explicit suppression if reuse adds risky bootstrap coupling

The coding agent may choose the lower-risk path.

#### 1K. Bring `CanvasDomSurfaceAdapter.js` back under budget

Use extraction and small helper removals first. Replacing recursive DOM search helpers with direct `querySelector` paths is acceptable if behavior stays equivalent.

**Exit conditions:**

- shared utility tests pass
- file-size budget passes
- no new duplication regressions are introduced

---

### Phase 2 — Fix theme preset timing and consolidate theme helpers

**Intent:** close the user-visible preset bug and reduce theme utility duplication.

**Dependencies:** Phase 1 should be complete where it touches `MapZoomHtmlFit`.

#### 2A. Add render-time CSS fallback for preset-name discovery

In `ThemeResolver`, prefer:

1. `data-dyni-theme` when present
2. computed `--dyni-theme-preset`
3. `"default"`

Use attribute presence rather than truthiness so an explicit default-like value is distinguishable from an unset attribute.

#### 2B. Consolidate `normalizePresetName`

Prefer a single canonical helper exposed from `ThemePresets`. `ThemeResolver` and `runtime/init.js` should delegate to it if that wiring remains straightforward.

If the implementation agent finds a safer single-owner location with the same practical effect, that is acceptable.

#### 2C. Consolidate `getNightModeState`

Preferred direction:

- canonical implementation owned by `ThemeResolver`

Acceptable alternatives:

- runtime delegation after component load
- explicit suppression in `runtime/helpers.js` if delegation would create timing fragility

The implementation should favor correctness and load-order simplicity over forced indirection.

#### 2D. Wire `MapZoomHtmlFit` to theme tokens

Read text weights from theme tokens rather than constants, following the same general pattern already used elsewhere. If MapZoomHtmlFit reads weights through ThemeResolver, add the corresponding direct dependency in registry-shared-foundation.js.

#### 2E. Remove redundant invalidation `typeof` guards where contractually safe

Retain null checks where the owning object may still be absent. Remove redundant invalidation typeof guards only where every concrete controller on that call path guarantees invalidateTheme. Keep the ClusterRendererRouter guard unless HtmlSurfaceController is extended to expose invalidateTheme.

#### 2F. Add or extend tests

At minimum, cover:

- CSS preset fallback with no DOM attribute
- DOM attribute winning over CSS preset
- invalid CSS preset falling back to default
- `MapZoomHtmlFit` using theme-derived font weights

**Exit conditions:**

- CSS preset selection works in automated tests
- theme normalization has one owner or one owner plus justified suppression
- no unnecessary framework-method `typeof` guards remain in the targeted paths

---

### Phase 3 — Reduce runtime hot-path work without weakening page correctness

**Intent:** trim repeated work in runtime code while keeping page-sensitive behavior correct.

**Dependencies:** none.

#### 3A. Rework `TemporaryHostActionBridge` capability handling conservatively

Do not hard-code a single implementation strategy here.

Acceptable outcomes include:

- caching only page-invariant parts of capability state
- caching with explicit invalidation when page identity changes
- bridge recreation on page changes, if that lifecycle is introduced clearly
- another equivalent design that removes obvious repeated work and preserves correct dispatch

Unacceptable outcome:

- bridge-lifetime caching that can stale page-specific behavior.

#### 3B. Cache `HostCommitController.getState()` snapshots

A cached snapshot updated on controller state mutation is a reasonable target. The snapshot does not need to be frozen.

#### 3C. Add or extend runtime tests

At minimum, verify:

- action dispatch remains correct across page-sensitive scenarios
- any caching or snapshot scheme updates when source state changes
- `getState()` no longer allocates a fresh equivalent object on every read

**Exit conditions:**

- repeated bridge work is reduced
- page-specific capabilities remain correct
- `HostCommitController.getState()` avoids avoidable allocation

---

### Phase 4 — Bound the `MutationObserver` fallback

**Intent:** keep the fallback but make it less expensive and less open-ended.

**Dependencies:** Phase 3 should be complete because both phases touch `HostCommitController.js`.

#### 4A. Increase the RAF budget before observer fallback

Moving from 2 RAF attempts to 4 is a reasonable baseline unless tests indicate a different number is measurably better.

#### 4B. Add an observer ceiling

A roughly 2000ms ceiling is an acceptable target. The implementation should account for the controller’s existing timeout state.

Likely implementation choices:

- add a dedicated observer-ceiling handle, or
- refactor timeout state so the existing handle can safely manage both behaviors

Either is acceptable if cleanup stays clear.

#### 4C. Narrow the observation scope if a reliable parent is known

If a stable ancestor can be identified without introducing fragility, observe that ancestor instead of `document.body`. If not, keep the body observer and rely on the RAF budget plus ceiling as the primary mitigation.

#### 4D. Add or extend tests

At minimum, verify:

- the updated RAF budget
- observer teardown on success
- observer teardown on timeout ceiling
- stale renders abandoning fallback work

**Exit conditions:**

- observer fallback remains functional
- fallback lifetime is bounded
- cleanup paths are explicit and tested

---

### Phase 5 — Update documentation

**Intent:** document the post-cleanup lifecycle and remove stale assumptions from documentation.

**Dependencies:** all code phases complete.

**Scope boundary:** documentation only.

#### 5A. Create `documentation/architecture/runtime-lifecycle.md`

This file does not currently exist. Create it and document the runtime/bootstrap/render lifecycle as it exists after the code phases are complete.

The page should include, at minimum:

- bootstrap script flow
- the two `runInit()` call sites and the init guard
- widget registration timing
- render and commit flow
- theme preset resolution behavior
- bridge dispatch lifecycle
- host commit fallback lifecycle
- notable performance characteristics and known trade-offs that remain

#### 5B. Update architecture docs that are directly affected

Primary candidates:

- `documentation/architecture/host-commit-controller.md`
- `documentation/architecture/surface-session-controller.md`
- `documentation/architecture/canvas-dom-surface-adapter.md`

#### 5C. Update shared/theme documentation

Primary candidates:

- `documentation/shared/theme-tokens.md`
- `documentation/shared/helpers.md`

These should reflect:

- CSS preset fallback behavior
- preset normalization ownership
- `getNightModeState` ownership/delegation
- any remaining justified suppressions

#### 5D. Update conventions and guide docs

Primary candidates:

- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/guides/add-new-html-kind.md`

These should reflect the new shared helper modules and the approved suppression pattern, if suppressions remain.

#### 5E. Update indexes and quality tracking

Primary candidates:

- `documentation/TABLEOFCONTENTS.md`
- `documentation/TECH-DEBT.md`
- `documentation/QUALITY.md`

Track any intentionally deferred cleanup such as:

- `resizeSignature` recomputation cost
- handler double-binding cost
- any remaining runtime-local duplication left in place by design

#### 5F. Remove plan-dependent references from docs

Documentation should describe the system directly and should not depend on “Phase 1/2/3/4” wording from this plan.

**Exit conditions:**

- documentation links resolve
- new runtime lifecycle doc exists
- docs match the implemented behavior
- any leftovers are recorded as debt, not silently ignored

---

## Affected File Map

| File                                                                  | Likely phase | Planned change                                                                                                                                                         |
| --------------------------------------------------------------------- | ------------:| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/widget-kits/perf/PerfSpanHelper.js`                           | 1            | Create shared perf helper                                                                                                                                              |
| `tests/shared/perf/PerfSpanHelper.test.js`                            | 1            | Add tests                                                                                                                                                              |
| `shared/widget-kits/html/HtmlWidgetUtils.js`                          | 1            | Create shared HTML utility helper                                                                                                                                      |
| `tests/shared/html/HtmlWidgetUtils.test.js`                           | 1            | Add tests                                                                                                                                                              |
| `config/components/registry-shared-foundation.js`                     | 1            | Register new shared helpers                                                                                                                                            |
| `config/components/registry-cluster.js`                               | 1            | Add direct PerfSpanHelper deps for cluster consumers that are rewired to the shared helper                                                                             |
| `cluster/ClusterWidget.js`                                            | 1            | Rewire perf helper use                                                                                                                                                 |
| `cluster/rendering/ClusterRendererRouter.js`                          | 1, 2         | Rewire perf helper use, Rewire perf helper use; remove invalidateTheme method guard only if all routed controllers guarantee invalidateTheme, otherwise keep the guard |
| `cluster/rendering/HtmlSurfaceController.js`                          | 1            | Rewire perf helper use                                                                                                                                                 |
| `cluster/rendering/CanvasDomSurfaceAdapter.js`                        | 1, 2         | Rewire perf helper, simplify local helpers, reduce file size                                                                                                           |
| `runtime/HostCommitController.js`                                     | 1, 3, 4      | Perf handling decision, state snapshot caching, fallback bounding                                                                                                      |
| `runtime/SurfaceSessionController.js`                                 | 1            | Perf handling decision                                                                                                                                                 |
| `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` | 1            | Rewire HTML utility use                                                                                                                                                |
| `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`         | 1            | Rewire HTML utility use                                                                                                                                                |
| `shared/widget-kits/nav/MapZoomHtmlFit.js`                            | 1, 2         | Rewire HTML utility use, theme token weights                                                                                                                           |
| `shared/widget-kits/nav/ActiveRouteHtmlFit.js`                        | 1            | Rewire HTML utility use                                                                                                                                                |
| `plugin.js`                                                           | 1, 5         | Possible `loadScriptOnce` canonicalization, lifecycle docs alignment                                                                                                   |
| `runtime/component-loader.js`                                         | 1            | Possible `loadScriptOnce` reuse                                                                                                                                        |
| `shared/theme/ThemeResolver.js`                                       | 2            | CSS preset fallback, helper ownership cleanup                                                                                                                          |
| `shared/theme/ThemePresets.js`                                        | 2            | Canonical preset normalization helper                                                                                                                                  |
| `runtime/init.js`                                                     | 2, 5         | Theme helper delegation and lifecycle documentation alignment                                                                                                          |
| `runtime/helpers.js`                                                  | 2            | `getNightModeState` delegation or suppression                                                                                                                          |
| `runtime/TemporaryHostActionBridge.js`                                | 3            | Reduce repeated capability work safely                                                                                                                                 |
| `tests/shared/theme/ThemeResolver.test.js`                            | 2            | Add CSS preset tests                                                                                                                                                   |
| `tests/shared/nav/MapZoomHtmlFit.test.js`                             | 2            | Add theme-weight tests                                                                                                                                                 |
| `tests/runtime/TemporaryHostActionBridge.test.js`                     | 3            | Add bridge correctness/perf tests                                                                                                                                      |
| `tests/runtime/HostCommitController.test.js`                          | 3, 4         | Add snapshot and fallback tests                                                                                                                                        |
| `tests/config/components.test.js`                                     | 1            | Update expected dependency arrays for rewired shared-helper consumers                                                                                                  |
| `documentation/architecture/runtime-lifecycle.md`                     | 5            | Create new doc                                                                                                                                                         |
| `documentation/architecture/host-commit-controller.md`                | 5            | Update fallback documentation                                                                                                                                          |
| `documentation/architecture/surface-session-controller.md`            | 5            | Review/update lifecycle details                                                                                                                                        |
| `documentation/architecture/canvas-dom-surface-adapter.md`            | 5            | Update simplified adapter details                                                                                                                                      |
| `documentation/shared/theme-tokens.md`                                | 5            | Update preset behavior and helper ownership                                                                                                                            |
| `documentation/shared/helpers.md`                                     | 5            | Update helper ownership/delegation                                                                                                                                     |
| `documentation/conventions/coding-standards.md`                       | 5            | Add shared helper guidance                                                                                                                                             |
| `documentation/conventions/smell-prevention.md`                       | 5            | Add extraction/suppression guidance                                                                                                                                    |
| `documentation/guides/add-new-html-kind.md`                           | 5            | Reference shared HTML utility module                                                                                                                                   |
| `documentation/TABLEOFCONTENTS.md`                                    | 5            | Add new doc/module entries                                                                                                                                             |
| `documentation/TECH-DEBT.md`                                          | 5            | Record any deferred cleanup                                                                                                                                            |
| `documentation/QUALITY.md`                                            | 5            | Update quality status                                                                                                                                                  |

---

## Don’ts

- Do not change the AvNav registration model.
- Do not introduce ES modules or a build step.
- Do not force runtime IIFE files to consume UMD helpers through unsupported bootstrap assumptions.
- Do not remove the observer fallback entirely.
- Do not implement unsafe bridge-lifetime capability caching.
- Do not weaken theme precedence.
- Do not use the documentation phase to sneak in source changes.
- Do not exceed the file-size budget after extraction work.

---

## Deployment Boundaries

| Deployable unit            | Phases | Notes                                                                       |
| -------------------------- | ------ | --------------------------------------------------------------------------- |
| Shared utility extraction  | 1      | Mostly additive and local rewiring                                          |
| Theme lifecycle fixes      | 2      | User-visible bug fix; should follow shared helper extraction where relevant |
| Runtime hot-path cleanup   | 3      | Internal runtime work; correctness-sensitive                                |
| Observer fallback bounding | 4      | Internal resilience work in same controller as Phase 3                      |
| Documentation              | 5      | After code phases only                                                      |

---

## Acceptance Criteria

### Shared utilities

- UMD consumers have a canonical perf helper.
- HTML-widget utility helpers have a canonical owner.
- Any remaining runtime-local duplication is explicitly justified in code comments and docs.
- `CanvasDomSurfaceAdapter.js` returns to the size budget.

### Theme lifecycle

- CSS preset selection works when `--dyni-theme-preset` is set on widget roots.
- DOM attribute preset selection still takes precedence over CSS.
- Theme normalization has one canonical owner or one canonical owner plus a clearly justified compatibility wrapper.
- `MapZoomHtmlFit` uses theme-derived text weights.
- Redundant invalidation method typeof guards are removed only from call paths with a guaranteed invalidateTheme contract; mixed-controller paths retain guards until the contract is unified.

### Runtime hot paths

- `TemporaryHostActionBridge` no longer repeats avoidable capability work in every action method.
- Any caching strategy remains correct across page changes.
- `HostCommitController.getState()` avoids repeated equivalent allocations.

### Observer fallback

- More RAF attempts are made before observer fallback than today.
- Observer fallback has a bounded lifetime.
- Cleanup on success, timeout, and stale revision is covered by tests.

### Documentation

- `documentation/architecture/runtime-lifecycle.md` exists.
- Updated docs describe the actual implemented lifecycle.
- Index and cross-links resolve.
- Deferred cleanup is recorded explicitly.

---

## Related

- [PLAN1.md](PLAN1.md) — original `renderHtml` architecture plan
- [PLAN3.md](PLAN3.md) — smell-rule cleanup background
- [core-principles.md](../../documentation/core-principles.md) — architectural principles
- [coding-standards.md](../../documentation/conventions/coding-standards.md) — UMD templates and file-size rules
- [smell-prevention.md](../../documentation/conventions/smell-prevention.md) — duplication and suppression guidance
- [theme-tokens.md](../../documentation/shared/theme-tokens.md) — theme token system
- [host-commit-controller.md](../../documentation/architecture/host-commit-controller.md) — commit scheduling architecture
- [surface-session-controller.md](../../documentation/architecture/surface-session-controller.md) — surface lifecycle state machine
- [canvas-dom-surface-adapter.md](../../documentation/architecture/canvas-dom-surface-adapter.md) — canvas/dom adapter architecture

Planned documentation addition in Phase 5:

- `documentation/architecture/runtime-lifecycle.md`
