# PLAN10 — Shared Performance Stabilization and Gate Recovery

## Status

Final implementation plan.

This plan is prescriptive and implementation-ready.

It defines the target architecture for shared-cache ownership, theme-resolution reuse, HTML patch fast paths, text measurement reuse, widget-level prepared-model reuse, host-policy reuse, validation, and enforcement for the current perf regression set.

---

## Goal

After completion:

* `ThemeResolver` resolves identical committed roots through a cacheable root snapshot and reuses precomputed token metadata instead of rebuilding token-path work and rereading computed style on every identical call.
* shared theme resolution remains root-driven and deterministic, but repeated same-root same-state resolutions no longer pay full recomputation cost.
* `ThemeResolver` returns immutable reusable snapshot objects for identical committed-root state.
* `HtmlWidgetUtils.patchInnerHtml()` remains the only shared HTML patch boundary and now has explicit no-op detection for unchanged markup.
* jsdom-driven perf and test runs use a direct `innerHTML` fast path instead of the heavier template/sync path.
* committed HTML widgets do not build semantic render models twice per update cycle just to answer both `layoutSignature(payload)` and `patchDom(payload)`.
* `MapZoomTextHtmlWidget` and `ActiveRouteTextHtmlWidget` reuse a prepared payload model across layout-signature and patch phases when revision, props identity, and committed shell size are unchanged.
* HTML fit computation for map zoom and active route is cached at the fit-engine boundary using shell size, text payload, dispatch mode, and resolved font tokens as the cache identity.
* radial and text layout helpers reuse measured text widths instead of calling `ctx.measureText(...)` repeatedly for the same font/text pair inside the same render context.
* `RadialTextFitting` owns the shared canvas text-width cache for radial/text-fit callers.
* `TextTileLayout` caches line-fit and metric-tile layout results inside the current canvas context so repeated same-frame layout passes do not recompute identical fit work.
* `CenterDisplayTextWidget` reuses measured line widths within a frame.
* `FullCircleRadialTextLayout` reuses measured block sizes within a render pass.
* `ClusterSurfacePolicy` reuses normalized host capabilities and normalized host actions per host context and stops cloning route props on every call to `withSurfacePolicyProps(...)`.
* `withSurfacePolicyProps(...)` preserves props identity and materializes `surfacePolicy` and `viewportHeight` as non-enumerable runtime fields on the existing props object.
* the failed gates are addressed at the shared hot-path layer first, not through one-off widget hacks.
* perf validation is performed by the canonical perf harness; syntax-only validation is not treated as proof of gate recovery.

---

## In scope

* `shared/theme/ThemeResolver.js`
* `shared/widget-kits/html/HtmlWidgetUtils.js`
* `shared/widget-kits/nav/ActiveRouteHtmlFit.js`
* `shared/widget-kits/nav/MapZoomHtmlFit.js`
* `shared/widget-kits/radial/RadialTextFitting.js`
* `shared/widget-kits/radial/RadialTextLayout.js`
* `shared/widget-kits/radial/FullCircleRadialEngine.js`
* `shared/widget-kits/radial/FullCircleRadialTextLayout.js`
* `shared/widget-kits/text/TextTileLayout.js`
* `cluster/rendering/ClusterSurfacePolicy.js`
* `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`
* `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`
* `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`
* perf-oriented tests that must move with the new cache behavior
* perf validation, acceptance thresholds, and enforcement around the current gate failures
* documentation and smell-contract updates required by the new `ThemeResolver` contract

## Out of scope

* AvNav core changes
* visual redesign of any widget
* semantic behavior changes to route activation, dispatch, or displayed values
* replacing the current committed HTML renderer model
* replacing the current canvas renderer model
* cross-process or persistent caches
* long-lived global caches that survive document/root lifetime
* speculative micro-optimizations outside the hot paths identified by the perf report

---

## Settled architectural decisions

### 1. `ThemeResolver` result contract changes

`ThemeResolver.resolveForRoot(rootEl)` and `resolveOutputsForRoot(rootEl)` may return the same cached object for identical committed-root snapshots.

That object is now an immutable snapshot, not a fresh mutable allocation.

Implementation requirements:

* freeze cached resolution objects before publication
* same snapshot returns the same object identity
* changed snapshot returns a different object
* `configure(...)` clears resolver metadata and caches
* update:

  * `tests/shared/theme/ThemeResolver.test.js`
  * `tools/check-smell-contracts.mjs`
  * `documentation/shared/theme-tokens.md`

### 2. Root snapshot must use canonical theme inputs only

The root snapshot must not fingerprint resolver-owned output vars.

Required snapshot inputs:

* mode
* normalized preset name
* committed root class string
* canonical inline theme-input signature

Forbidden snapshot inputs:

* raw full `rootEl.style.cssText`
* resolver-owned `--dyni-theme-*` outputs
* other resolver-written artifacts

Preferred implementation:

* derive the inline-signature portion from the token input vars defined by `ThemeModel.getTokenDefinitions()`
* not from whole inline style text

### 3. Theme changes remain reload-driven for this rollout

Current architecture treats `user.css` theme changes as reload/manual-refresh work, not live in-place theme mutation.

Implications:

* this plan does not add live theme-change invalidation machinery
* fit invalidation does not need to model hot `user.css` swaps during a running session
* stale docs/snippets that imply console-driven live theme reapply must be removed or corrected

### 4. HTML fit reuse belongs to the fit modules

`ActiveRouteHtmlFit` and `MapZoomHtmlFit` own fit-result reuse.

Widget renderers must not treat `payload.layoutChanged` as the primary fit invalidation boundary.

Required behavior:

* committed HTML widgets call fit computation whenever a shell rect exists
* fit modules decide cache hit or miss from exact structural inputs
* widget-local prepared-model reuse remains separate and only covers semantic model construction

### 5. Surface-policy props stop cloning

`ClusterSurfacePolicy.withSurfacePolicyProps(...)` must stop returning a spread clone.

Required behavior:

* reuse the original `routeState.props` object
* attach `surfacePolicy` and `viewportHeight` as non-enumerable configurable runtime properties
* preserve props identity
* update values each routing pass as needed

Forbidden behavior:

* no prototype-wrapper prop object
* no enumerable runtime-field injection that perturbs shallow key comparison
* no semantic change to downstream access patterns

### 6. Targeted tests must cover every new cache boundary

Behavioral validation is not limited to `ThemeResolver`.

Required targeted tests must cover:

* cache hits
* cache misses on structural input change
* lifecycle cleanup where relevant
* no-op fast paths where relevant

---

## Non-negotiable architectural rules

### Shared hot paths are the first optimization boundary

When the perf report shows the same cost centers across multiple widgets, optimization must start in shared modules.

### Root-based theme semantics stay intact

`ThemeResolver` remains root-driven under `requireCommittedPluginRoot(rootEl)`.

### Cache identity must be structural, not heuristic

All new caches key off committed inputs that actually determine output.

### Cache lifetime must be bounded by existing owner lifetime

Examples:

* `ThemeResolver`: per-root weak caches
* fit modules: host/update-context scoped caches
* canvas helpers: context/render-pass scoped caches
* widget prepared models: renderer-instance scoped caches

### jsdom fast paths stay environment-specific

The direct HTML replacement fast path is jsdom-only.

### Performance work must not silently change behavior

No optimization may change semantic widget output, interaction behavior, route activation behavior, theme-token meaning, committed-surface lifecycle, or renderer update ordering.

### Reuse must not hide real invalidation boundaries

If an output-affecting input changes, the cache must miss.

### The perf harness is authoritative

Manual reasoning, hotspot inspection, or syntax checks are not proof of gate recovery.

### Whole-page cost matters as much as single-widget gates

`gpspage_all_widgets` is a first-class target.

### Object churn on hot paths is a bug

Avoid repeated shallow clones, repeated token-path splits, repeated model builds, and repeated text measurements.

### Validation must separate implementation from measured proof

Do not claim perf recovery before canonical perf reruns pass.

---

## Authoritative architecture

## `ThemeResolver`

Required behavior:

* precompute token-path segments once per resolved `ThemeModel` instance
* precompute output-token path segments once per resolved `ThemeModel` instance
* compute a committed-root snapshot from canonical inputs
* cache full-token and output-only immutable resolutions independently per root
* return the same frozen resolution object when the snapshot signature is unchanged
* clear resolver metadata and per-root caches when `configure(...)` changes resolver configuration

Required snapshot inputs:

* mode
* normalized preset name
* committed root class string
* canonical inline theme-input values only

Forbidden behavior:

* no bypass of `requireCommittedPluginRoot(rootEl)`
* no cache keyed only by root identity
* no permanent global cache that survives root garbage collection
* no caller-visible invalidation API
* no recomputation of token-path splits on every resolve call when the `ThemeModel` instance is unchanged

## `HtmlWidgetUtils.patchInnerHtml(...)`

Required behavior:

* detect unchanged markup and return immediately without DOM patch work
* cache the last patched markup on the root element
* use direct `innerHTML` replacement in jsdom-style environments
* preserve the existing structural sync path for non-jsdom environments
* update the last-patched markup token on all paths, including empty-markup and replace cases

Forbidden behavior:

* no unconditional `innerHTML` replacement in all environments
* no widget-local duplicate HTML patch fast paths
* no removal of shared structural sync logic for real browser use

## `ActiveRouteHtmlFit` and `MapZoomHtmlFit`

These modules own fit reuse.

Required cache identity includes:

* committed shell width and height
* resolved font family
* resolved value and label weights
* mode and dispatch-affecting state
* semantic text payload
* any fit-affecting scale input

Required behavior:

* identical fit requests return cached results
* misses occur when geometry, semantic text, dispatch state, or resolved font tokens change
* caches are stored under module-owned keys on the host/update context

Forbidden behavior:

* widgets must not keep their own competing fit-validity logic based only on `layoutChanged`

## `RadialTextFitting`

Required behavior:

* avoid rewriting `ctx.font` when the requested font string is already active
* cache measured width by `ctx.font + text`
* route all internal width reads through the shared width helper
* bound the cache to the current canvas context lifetime

## `RadialTextLayout`

Required behavior:

* consume the shared width helper instead of direct repeated `ctx.measureText(...)` calls

## `TextTileLayout`

Required behavior:

* cache metric-tile measurement results
* cache fitted single-line results
* cache by actual layout inputs on the current canvas context
* avoid repeated trim/measure loops for identical input sets within the same render context

## `CenterDisplayTextWidget`

Required behavior:

* use a frame-bounded widget-local width cache
* reuse repeated line-width reads within a render
* clear per-frame cache at the start of each render pass

## `FullCircleRadialTextLayout`

Required behavior:

* reuse measured block sizes inside the current render pass
* invalidate on caption, value, unit, geometry, weight, family, or scale change

## `ClusterSurfacePolicy`

Required behavior:

* cache normalized host capabilities on the host context
* cache normalized host action wrappers on the host context
* stop recreating equivalent normalized action wrappers on every call when the host context is unchanged
* stop cloning `routeState.props`
* materialize `surfacePolicy` and `viewportHeight` on the existing props object as non-enumerable runtime fields
* continue exposing `props.surfacePolicy` and `props.viewportHeight` to downstream renderers

Forbidden behavior:

* no semantic changes to surface-policy contents
* no mutation of unrelated host-context state
* no renderer-local recreation of normalized host callbacks where centralized reuse exists

## `ActiveRouteTextHtmlWidget` and `MapZoomTextHtmlWidget`

Required behavior:

* prepare and cache the semantic render model once per compatible payload cycle
* share that prepared model between `layoutSignature(payload)` and `patchDom(payload)`
* validate prepared-model reuse by revision, props identity, and committed shell size
* clear prepared payload state on detach/destroy
* always route fit lookup through the fit module when a shell rect exists

Forbidden behavior:

* no duplicate semantic model build for the same payload cycle
* no widget-local fit invalidation shortcut based only on `payload.layoutChanged`

---

## Failed-gate recovery mapping

### `active_route_html`

Primary levers:

* no-op HTML patch skip
* jsdom direct patch fast path
* prepared-model reuse in `ActiveRouteTextHtmlWidget`
* fit-result reuse in `ActiveRouteHtmlFit`

### `map_zoom_html`

Primary levers:

* root theme-resolution caching
* no-op HTML patch skip
* jsdom direct patch fast path
* prepared-model reuse in `MapZoomTextHtmlWidget`
* fit-result reuse in `MapZoomHtmlFit`

### `center_display_text`

Primary levers:

* root theme-resolution caching
* frame-bounded text-width reuse in `CenterDisplayTextWidget`

### `xte_text`

Primary levers:

* root theme-resolution caching
* line-fit and metric-tile reuse in `TextTileLayout`

### `wind_radial`

Primary levers:

* shared width reuse in `RadialTextFitting`
* `RadialTextLayout` migration to the shared width helper
* block-size reuse in `FullCircleRadialTextLayout`

### `gpspage_all_widgets`

Primary levers:

* `ClusterSurfacePolicy` reuse
* root theme-resolution caching
* shared HTML patch fast path
* shared text/fit reuse across canvas and HTML widgets

---

## Validation and perf contract

## Required validation levels

### 1. Syntax validation

All modified files must pass parser-level validation.

### 2. Targeted behavioral validation

Required targeted tests:

* `ThemeResolver`

  * same snapshot returns same frozen object
  * canonical input change returns a different object
  * `configure(...)` clears caches
  * root contract remains enforced
* `HtmlWidgetUtils.patchInnerHtml(...)`

  * unchanged markup is a no-op
  * jsdom uses direct replacement
  * non-jsdom keeps structural sync
  * empty, append, replace, and sync paths update the last-markup token correctly
* `ActiveRouteTextHtmlWidget` and `MapZoomTextHtmlWidget`

  * one semantic model build per compatible payload cycle
  * prepared-model miss on revision, props identity, or shell-size change
  * prepared state clears on detach/destroy
* `ActiveRouteHtmlFit` and `MapZoomHtmlFit`

  * exact-input cache hits
  * misses on geometry, semantic text, dispatch state, or font-token changes
* `ClusterSurfacePolicy`

  * props identity is preserved
  * runtime fields are non-enumerable
  * normalized capabilities/actions are reused for unchanged host context

### 3. Canonical perf validation

Required runs:

* official perf suite
* official perf gate check against configured baseline
* scenario-by-scenario before/after deltas

## Perf acceptance boundary

The implementation is not complete until the canonical perf check passes for the currently failing gates:

* `active_route_html`
* `center_display_text`
* `map_zoom_html`
* `wind_radial`
* `xte_text`

The work is not fully successful until shared improvements also avoid regressions in non-failing scenarios, especially:

* `speed_radial`
* `gpspage_all_widgets`

## Reporting rule

Project reporting must distinguish clearly between:

* implemented changes
* syntax-safe changes
* behavior-verified changes
* perf-gate-confirmed changes

---

## Implementation phases

### Phase 1 — Shared theme-resolution reuse

Deliverables:

* token-definition metadata reuse in `ThemeResolver`
* output-token-definition metadata reuse in `ThemeResolver`
* committed-root snapshot computation from canonical theme inputs
* weak per-root caches for full and output-only immutable snapshots
* cache reset on `configure(...)`
* tests, docs, and smell-contract updates for the new immutable snapshot contract

Exit conditions:

* repeated identical `resolveForRoot(rootEl)` calls return the same frozen object
* root changes that affect canonical theme inputs return a different object
* resolver behavior remains strict, root-driven, and deterministic

### Phase 2 — Shared HTML patch fast path

Deliverables:

* unchanged-markup detection in `patchInnerHtml(...)`
* jsdom-only direct `innerHTML` patch path
* last-markup persistence across empty, append, replace, and sync paths

Exit conditions:

* identical HTML updates skip patch work
* jsdom perf runs use the direct fast path
* non-jsdom environments continue using the structural sync path

### Phase 3 — HTML widget prepared-model reuse

Deliverables:

* prepared payload reuse in `ActiveRouteTextHtmlWidget`
* prepared payload reuse in `MapZoomTextHtmlWidget`
* shared prepared model between `layoutSignature(...)` and `patchDom(...)`
* prepared payload state cleared on detach/destroy

Exit conditions:

* each compatible payload cycle builds at most one semantic model per widget instance
* layout signature and patching stay behaviorally consistent

### Phase 4 — HTML fit-result reuse

Deliverables:

* exact-input cache identity in `ActiveRouteHtmlFit`
* exact-input cache identity in `MapZoomHtmlFit`
* fit caches stored on module-owned host/update-context keys
* widget renderers always consult fit modules when shell rect exists

Exit conditions:

* repeated identical fit requests return cached results
* cache misses occur when semantic or geometric inputs change

### Phase 5 — Shared canvas text-measure reuse

Deliverables:

* font reuse and width cache in `RadialTextFitting`
* `RadialTextLayout` routed through the shared width helper
* metric-tile and fitted-line reuse in `TextTileLayout`
* frame-bounded width reuse in `CenterDisplayTextWidget`
* block-measure reuse in `FullCircleRadialTextLayout`

Exit conditions:

* repeated same-font same-text measurements are served from cache within the current owner lifetime
* radial and text widgets continue rendering identical output

### Phase 6 — Surface-policy hot-path cleanup

Deliverables:

* cached host capabilities per host context
* cached normalized host action wrappers per host context
* removal of hot-path prop spread cloning
* non-enumerable runtime-field materialization for `surfacePolicy` and `viewportHeight`

Exit conditions:

* surface-policy semantics are unchanged
* props identity is preserved
* whole-page rendering pays less self-time inside `ClusterSurfacePolicy`

### Phase 7 — Perf validation and enforcement

Deliverables:

* parser/syntax checks for all modified files
* targeted tests for all new cache/invalidation boundaries
* perf-suite rerun
* perf-gate rerun against official baseline
* scenario-by-scenario before/after results

Exit conditions:

* failing gates pass
* non-failing scenarios do not regress beyond acceptable noise
* results are documented as measured outcomes, not inferred outcomes

---

## Acceptance criteria

### Theme resolution

* `ThemeResolver` reuses resolved metadata for an unchanged `ThemeModel`.
* `ThemeResolver` reuses root resolutions for unchanged committed-root snapshots.
* `ThemeResolver` returns immutable reusable snapshots.
* root changes that affect theme output invalidate cached resolution results.
* resolver-owned output vars are excluded from the root snapshot.
* no committed-root contract is weakened.

### HTML patching

* `patchInnerHtml(...)` returns early for unchanged markup.
* jsdom-driven runs use the direct HTML fast path.
* non-jsdom environments preserve the structural sync path.

### HTML widget reuse

* `ActiveRouteTextHtmlWidget` no longer builds equivalent semantic models twice per compatible payload cycle.
* `MapZoomTextHtmlWidget` no longer builds equivalent semantic models twice per compatible payload cycle.
* prepared widget payload reuse invalidates correctly on revision, props identity, or shell-size change.

### Shared fit and text layout

* `ActiveRouteHtmlFit` reuses identical fit results.
* `MapZoomHtmlFit` reuses identical fit results.
* `RadialTextFitting` reuses identical font/text width measurements.
* `RadialTextLayout` consumes the shared width helper.
* `TextTileLayout` reuses identical metric-tile and fitted-line layout results.
* `CenterDisplayTextWidget` reuses repeated line-width reads within a frame.
* `FullCircleRadialTextLayout` reuses repeated block-size calculations within a render pass.

### Surface policy

* `ClusterSurfacePolicy` reuses normalized capabilities for the same host context.
* `ClusterSurfacePolicy` reuses normalized action wrappers for the same host context.
* `withSurfacePolicyProps(...)` no longer performs hot-path shallow cloning of route props.
* `withSurfacePolicyProps(...)` preserves props identity.
* `surfacePolicy` and `viewportHeight` are attached as non-enumerable runtime fields.

### Perf gates

* `active_route_html` passes its compute gate.
* `center_display_text` passes its compute gate.
* `map_zoom_html` passes its compute `p50`, `p95`, and `p99` gates.
* `wind_radial` passes its compute `p99` gate.
* `xte_text` passes its compute `p50` and `p95` gates.
* `speed_radial`, `active_route_html`, `map_zoom_html`, `center_display_text`, and `gpspage_all_widgets` show no new unexplained regressions after the shared-cache work lands.

### Validation discipline

* syntax validation passes for all modified files.
* targeted tests reflect all new cache semantics.
* official perf rerun results are captured before the work is declared complete.
* docs and smell contracts reflect the new immutable resolver contract.

---

## Future rule

If later perf reports show new regressions in these same widgets, the first response must be to inspect whether a shared owner boundary has resumed duplicate work before adding more widget-local caches.

Do not turn the codebase into an unstructured pile of ad hoc widget-level memoization.