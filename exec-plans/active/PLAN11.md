# PLAN11 (revised) — Widget State-Screen Unification, Placeholder/Numeric/Time Formatting, and Spring-Based Smoothing

## Status

Final implementation plan, revised after readiness review and independent code-level verification.

This plan defines the target architecture for four cross-widget UX concerns:

1. A semantic **state-screen vocabulary** shared across all widgets that replaces the rendered body with one of four labeled screens (Disconnected / NoRoute / NoTarget / NoAIS), plus AIS's `hidden`. Resolution of which screen to show stays with each widget; only labels, rendering primitives, precedence helper, and interaction policy are shared.
2. A canonical `---` placeholder at the render-model boundary.
3. Three new per-widget options (`coordinatesTabular`, `stableDigits`, `hideSeconds`) offered only on widgets where they are meaningful, and defined per-widget in the cluster config files (the `compassLinearTickMinor` pattern) — not as cross-widget shared editables.
4. **Critically-damped spring smoothing** for graphical indicators (pointer, needle, marker, XTE highway path) — velocity-continuous at retarget, numerically stable under variable and bursty update rates, no period learning.

Each phase is scoped for one Codex session.

---

## Revision notes vs. the original PLAN11

The following decisions differ from the pre-review version:

* **State-screen resolution is decentralized.** The central `StateScreenModel.resolveStateScreen` classifier and its `widgetFamily` enum are dropped. Each widget owns its own resolver, expressed through a shared `StateScreenPrecedence.pickFirst(...)` utility. Labels, HTML markup, canvas overlay, and the interaction-gating policy remain shared.
* **`disconnected` is driven by `keys.nav.gps.connectionLost` only** (`p.disconnect === true`). Every widget's resolver includes `disconnected` as a candidate; all widgets show "GPS Lost" when the viewer loses its server connection — **except** AIS, where the layout-level `hidden` state (widget not visible on this page) takes precedence over `disconnected` so that AIS widgets remain invisible on non-applicable pages during disconnect. No other condition (`wpServer`, empty route name) contributes to the `disconnected` state. The `NavMapper.js` activeRoute branch is amended to pass the raw `p.disconnect` signal instead of the folded viewmodel `disconnect`.
* **`ActiveRouteViewModel` is not unfolded.** The viewmodel still computes its internal fold (`p.disconnect === true || p.wpServer === false || routeName === ""`), but the mapper output passes the raw `p.disconnect` signal for state-screen resolution. The widget distinguishes `disconnected` (server connection lost) from `noRoute` (empty route name) through its resolver.
* **`HideSecondsPostProcess` is removed entirely.** The dateTime variant of `PositionCoordinateWidget` uses two separate formatters on two axes (`formatDate` for the lat axis, `formatTime` for the lon axis); the primary mapper / render-model swap (`formatTime → formatClock`) already covers every hideSeconds case. The `"----/--/-- --:--"` and `"----/--/-- --:--:--"` placeholders are removed from `PlaceholderNormalize`'s pattern list because `formatDateTime` is not used anywhere in the plugin.
* **`BoundedRetargetedEasing` is replaced with `SpringEasing`.** A critically-damped spring has no EWMA, no period learning, and no duration; its `setTarget` takes no timing argument. This is velocity-continuous at retarget, rate-invariant across unsynchronized NMEA streams, and numerically stable under backgrounded-tab resumption.
* **Easer state is stored in a canvas-keyed `Map`** inside the renderer closure, because `rendererSpec` is shared across every widget instance of the same kind (see Verified Baseline item 21). Per-instance state must be keyed on the `canvas` element passed into `renderCanvas`.
* **Animate frame scheduling fires after `clearRenderFlags()`**, not before.
* **Three per-widget editables (`stableDigitsEditable`, `coordinatesTabularEditable`, `hideSecondsEditable`) are defined per-widget in the relevant cluster config files**, following the `compassLinearTickMinor` / `compassLinearShowEndLabels` pattern. `config/shared/common-editables.js` is not touched.
* **`RoutePointsRenderModel.js` is exempted** from the Phase 9 smell contract banning dash-only literals of length ≥ 2, and the acceptance criterion "no `--` in DOM" carves out compound-unit placeholders (e.g. `"--kt/--nm"`) that RoutePoints emits for missing legs.
* **AIS `hidden` takes precedence over `disconnected`.** AIS is the sole widget where `hidden` appears before `disconnected` in the `pickFirst` resolver. Rationale: `hidden` means "this widget slot should not be visible on this page," which is a layout-level decision that outranks any data-state screen. On non-gpspage, non-edit pages where the AIS widget is normally invisible, it stays invisible during disconnect instead of suddenly rendering a "GPS Lost" box. The Phase 9 smell contract is amended: `disconnected` must be the first **non-hidden** candidate; AIS's `hidden` may precede it.
* **ActiveRoute resolver includes a `noRoute` candidate for `wpServer === false`.** When the waypoint server is not running, route metrics (remain, ETA, nextCourse) are stale. Today the viewmodel folds `wpServer === false` into its `disconnect` flag, blanking all fields. After the Phase 3 mapper fix, the raw `p.disconnect` no longer covers this case. The widget's resolver adds `{ kind: "noRoute", when: p.wpServer === false }` after `disconnected` and before the `routeName === ""` candidate. The raw `p.wpServer` is available to the widget via the host-framework spread merge (the mapper does not override it). This preserves today's visual behavior: wpServer down → route body replaced.
* **`SpringEasing.create(spec)` snaps on first `setTarget`.** When no `advance()` has been called yet (freshly created easer), the first `setTarget(value)` initializes `current = value` and `velocity = 0` — an implicit `reset`. This prevents a visual sweep from the default zero-origin on widget attach. Subsequent `setTarget` calls are velocity-continuous as before.
* **`SpringEasing.setTarget(value)` ignores non-finite input.** If `!Number.isFinite(value)`, the call is a no-op — the spring retains its previous target and velocity. Callers do not need to pre-filter NaN or Infinity.
* **`StateScreenCanvasOverlay` has no dep on `RadialTextLayout`.** The overlay reimplements `setFont(ctx, px, weight, family)` locally (a single `ctx.font` assignment). This decouples the state module from the radial-specific module.
* **Phase 1 does not touch legacy overlay code.** `RadialTextLayout.drawDisconnectOverlay` and `TextLayoutPrimitives.primitiveDrawDisconnectOverlay` remain unchanged in Phase 1; `StateScreenCanvasOverlay` is purely additive. No compatibility alias is needed. Phase 4 replaces legacy call sites and removes the legacy functions.
* **Phase 4 removes `TextLayoutEngine.js` re-export.** The removal list explicitly includes `TextLayoutEngine.js`'s `drawDisconnectOverlay` re-export (line 160), which both `PositionCoordinateWidget` and `ThreeValueTextWidget` consume via that engine.
* **Phase 6 two-pass fit is caller-driven.** `fitSingleLineBinary`'s `extraCheck` callback only steers the binary search — it does not "trigger" a retry. The caller inspects the result's `width > maxW` condition and, if true, calls `fitSingleLineBinary` again with the `fallback` text. The plan uses the existing `extraCheck` extension point; no new fit primitive is introduced.
* **Spring rate-invariance claim qualified.** Rate-invariant at typical frame rates (16–60 Hz). Under extreme stall (>50 ms per frame), the `maxDtMs` cap bounds integration to 50 ms per step — the spring progresses at a bounded rate rather than wall-clock rate. This is intentional: the cap exists to prevent numerical divergence after backgrounded-tab resumption.
* **Phase 7 `hideSeconds` threading is explicit in both viewmodel and mapper.** `EditRouteViewModel.build` adds `hideSeconds: p.hideSeconds === true` to its return object; the `NavMapper.js` editRoute branch threads it into the `domain` literal as `hideSeconds: editRouteDomain.hideSeconds`. Same pattern for `ActiveRouteViewModel` + the activeRoute mapper branch.
* **Phase 9 smell-contract `pickFirst` parser is regex-based.** The contract uses a text scanner that matches `pickFirst([` … `])` call sites inline. It extracts `kind:` string literals from each `{...}` entry in array order. Call sites must be written inline (the array literal passed directly to `pickFirst`, not via variable indirection); this is a codified convention.
* **`FullCircleRadialEngine`'s `cfg.drawDisconnect !== false` guard is removed in Phase 4.** No caller passes `drawDisconnect: false`; the guard is functionally inert. It is removed alongside the legacy overlay code, not preserved under the state-screen branch.

---

## Goal

After completion:

* Every widget surfaces the four semantic state-screens — `disconnected`, `noRoute`, `noTarget`, `noAis` — as a full-body replacement of the normal rendered content, following the same pattern currently used by RoutePoints / EditRoute for "No Route". **Every widget of the plugin shows `disconnected` when the viewer loses its server connection** (`p.disconnect === true`, fed by `keys.nav.gps.connectionLost`); this is the first candidate in every resolver **except** AIS, where `hidden` (a layout-level "not visible on this page" decision) takes precedence — see AIS exception below.
* Each widget computes its own state via a shared `StateScreenPrecedence.pickFirst([...])` utility. The order of the list is the precedence. Canonical order (`disconnected > noRoute > noTarget > noAis > hidden > data`) is documented in the style guide and enforced by a Phase 9 smell contract, with a documented AIS exception (`hidden > disconnected > noAis > data`).
* AIS's existing `hidden` render-state is preserved unchanged (HTML-only; canvas widgets never resolve to `hidden`). AIS's `hidden` is the first candidate in its resolver, before `disconnected`, so that AIS widgets remain invisible on pages where they are not expected (non-gpspage, non-edit) regardless of connection state. This matches today's behavior: AIS is invisible outside gpspage / edit mode when there is no target identity, even during disconnect.
* HTML widgets render state-screens through a shared `StateScreenMarkup` helper that wraps the existing widget wrapper and emits a `dyni-state-<kind>` class plus a label element.
* Canvas widgets render state-screens through an upgraded overlay primitive (`StateScreenCanvasOverlay`) that replaces the current `drawDisconnectOverlay` and understands the four non-`hidden` non-`data` labels.
* Every widget displays exactly one missing-value placeholder token, `---`, for both wholly-missing and formatter-returned-placeholder values. Mixed fallbacks (`--`, `0`, `--:--`, `--:--:--`, `-----`, `  -`, `    -`, `"NO DATA"`, and every dash-only string produced by `formatDecimal`'s NaN branch) never reach the rendered output. Compound-unit placeholders in RoutePoints (e.g. `"--kt/--nm"`) are carved out by explicit exemption.
* Placeholder normalization happens at the render-model boundary via a single shared helper (`PlaceholderNormalize`), never through widget-local ad-hoc fallbacks.
* Interaction is coupled to the visible state: semantic empty-state screens render the widget `passive` (no dispatch binding); `disconnected` is always passive. Normal-data-state interactions are unchanged. Enforcement lives in a single shared helper (`StateScreenInteraction`).
* A new `coordinatesTabular` option (default: on) aligns stacked latitude/longitude coordinates vertically using tabular numerals. Defined per-widget in cluster configs where coordinates are displayed.
* A new `stableDigits` option (default: off) pads numeric output with leading zeros to stabilize width. The pad slot always reserves sign (`" "` or `"-"`) and — for XTE — side suffix (`" "`, `"R"`, `"L"`). When padded output would clip, the renderer falls back to un-padded text and re-runs the existing fit pipeline; numeric accuracy (full integer part, full fractional part) is never sacrificed to width. Defined per-widget in cluster configs where numeric values are displayed.
* A new `hideSeconds` option (default: off) hides the seconds component of time displays via `formatTime → formatClock` substitution at the mapper / render-model layer. No post-processor; no formatDateTime handling. Defined per-widget in cluster configs where time values are displayed.
* Roboto and Roboto Mono are bundled with the plugin as `.woff2` assets and registered via `@font-face` in `plugin.css`. The theme font stack prepends `Roboto`. A new `font.familyMono` theme token exposes Roboto Mono. StableDigits uses `familyMono` when active; regular text continues to use `family`.
* Graphical pointers, needles, markers, and the XTE highway path use `SpringEasing`: critically damped, velocity-continuous at retarget, rate-invariant, time-based with `dt` stability cap, per-instance (keyed on canvas element).
* Canvas widgets that want follow-up animation frames return `{ wantsFollowUpFrame: true }` from `renderCanvas`; `CanvasDomSurfaceAdapter` schedules the next paint. Existing renderers that do not return a value are unaffected.
* Widget tests cover the per-widget state-screen resolvers, placeholder normalization, stableDigits padding and fallback, hideSeconds substitution, and spring behavior (retarget velocity continuity, settled convergence, rate invariance).
* Documentation is updated alongside code: new shared-kit docs under `documentation/shared/`, widget-level contract updates under `documentation/widgets/`, navigation index in `TABLEOFCONTENTS.md`.

---

## Verified Baseline

Line numbers below are approximate and reflect the repository state at plan-authoring time. Codex sessions should verify by semantic cue (identifier, function name) rather than by line-number lookup; line numbers drift with refactors.

1. `shared/widget-kits/nav/RoutePointsRenderModel.js` declares `PLACEHOLDER_VALUE = "--"` at line 13 and `NO_ROUTE_TEXT = "No Route"` at line 14. It emits compound-unit placeholders like `"--kt/--nm"` at lines 69, 74, 97, 100 for missing legs. `RoutePointsMarkup.js` renders `renderEmpty()` wrapped in `.dyni-route-points-no-route` inside the wrapper (line 149) and switches the whole inner body at lines 152–173.
2. `shared/widget-kits/nav/EditRouteRenderModel.js` declares `NO_ROUTE_TEXT = "No Route"` at line 14 and applies an analogous empty-body switch.
3. `shared/widget-kits/nav/AisTargetRenderModel.js` declares `PLACEHOLDER_TEXT = "No AIS"` at line 13 and implements a three-state render classifier `resolveRenderState(...) -> "data" | "placeholder" | "hidden"` at lines 63–79; wrapper classes include `dyni-ais-target-<renderState>` (line 250) and `dyni-ais-target-open-<interactionState>` (line 251). The classifier reads `domain.hasTargetIdentity` (a derived boolean computed by `AisTargetViewModel.js` line 102 as `typeof mmsiRaw !== "undefined"`), `cfg.isEditingMode`, and `cfg.pageId`. AIS's viewmodel does not expose a `disconnect` field.
4. `ActiveRouteTextHtmlWidget.js` does not render a full-body state-screen. It sets wrapper class `dyni-active-route-disconnect` at line 171 and blanks individual fields with `disconnect ? undefined : ...` at lines 102, 109, 117. There is no `hasRoute`/`noTarget` full-body switch. `ActiveRouteViewModel.js` folds three conditions into a single `disconnect` flag at line 33: `p.disconnect === true || p.wpServer === false || routeName === ""`. The `NavMapper.js` activeRoute branch (line 52) passes the folded viewmodel `disconnect` as the mapper output field, which overrides the raw AvNav `p.disconnect` in the host-framework spread merge (`ExternalWidget.jsx` line 21: `{...props,...props.translateFunction({...props})}`). The widget receives `p.routeName` (trimmed activeRouteName, from viewmodel) and can access `p.wpServer` and `p.activeRouteName` from the raw AvNav props (not overridden by the mapper), but `p.disconnect` as seen by the widget is the **folded** value. Phase 3 changes the mapper output to pass the raw `p.disconnect === true` signal instead of the folded viewmodel disconnect, enabling the state-screen resolver to distinguish `disconnected` from `noRoute`.
5. `XteDisplayWidget.js` gates per-field rendering with `const disconnected = p.disconnect === true` at line 98 and blanks the fields at lines 111, 141–144. The XTE side suffix is computed at line 162 as `"R"` / `"L"` / `""` based on sign of `xteRaw`. There is no full-body replacement. `NavMapper.js` line 139 threads `p.wpName` through as `typeof p.wpName === "string" ? p.wpName : ""`, giving the widget a raw signal for `noTarget` resolution.
6. `PositionCoordinateWidget.js` calls `text.drawDisconnectOverlay(...)` at line 295 on top of the rendered canvas when `p.disconnect` is truthy. The `dateTime` display variant uses `formatDate` for the lat axis (line 76) and `formatTime` for the lon axis (line 77); it does not use `formatDateTime`. The `timeStatus` variant uses a custom status-circle formatter for lat (line 87) and `formatTime` for lon (line 88). `formatDateTime` is not called anywhere in the plugin.
7. The shared overlay primitive `drawDisconnectOverlay(ctx, W, H, family, color, label, labelWeight)` is defined in `shared/widget-kits/radial/RadialTextLayout.js` at line 199 and exported from its return object at line 228. It draws a 20%-alpha fill plus `"NO DATA"` label. Call sites: `SemicircleRadialEngine.js` line 239, `FullCircleRadialEngine.js` line 284 (guarded by `cfg.drawDisconnect !== false`; no caller passes `false`), `LinearGaugeEngine.js` line 358. `shared/widget-kits/text/TextLayoutPrimitives.js` defines a thin wrapper `primitiveDrawDisconnectOverlay` at line 280 and re-exports it as `drawDisconnectOverlay` at line 301. `shared/widget-kits/text/TextLayoutEngine.js` further re-exports `primitive.drawDisconnectOverlay` at line 160; `PositionCoordinateWidget` and `ThreeValueTextWidget` consume the overlay through this engine re-export.
8. `runtime/helpers.js` `applyFormatter(raw, props)` at line 14 returns `p.default` when `raw` is `null`/`undefined`/`NaN`, and returns `"---"` at line 21 (with `hardcoded-runtime-default` suppression) when no `default` is provided.
9. `viewer/util/formatter.js` owns avnav-core formatters; their fallback tokens cannot be changed from the plugin: `formatTime → "--:--:--"` (line 262), `formatClock → "--:--"` (line 275), `formatDate → "----/--/--"` (line 299), `formatLonLats → "-----"` (line 58), `formatSpeed → "  -"` (line 223, two spaces plus dash), `formatDistance → "    -"` (line 175, four spaces plus dash), `formatPressure → "-----"` (line 321). `formatDecimal` at lines 76–85 produces a dash-only string of length `fix` on NaN input (so `"-"`, `"--"`, `"---"`, `"----"`, `"-----"` and longer dash-only strings are all valid outputs depending on caller-supplied `fix`). `formatDateTime` exists in core (line 286, fallback `"----/--/-- --:--:--"`) but is not called from this plugin.
10. `NavMapper.js` wires `formatTime` at lines 32 (eta) and 35 (rteEta). `VesselMapper.js` wires `formatTime` at line 82 (clock). `EditRouteRenderModel.js` wires `formatTime` at line 183 (ETA). `ActiveRouteTextHtmlWidget.js` wires `formatTime` at line 110. `PositionCoordinateWidget.js` wires `formatTime` at lines 77 and 88 for the `dateTime` and `timeStatus` display variants respectively.
11. `CanvasDomSurfaceAdapter.js` exposes `schedulePaint(reason)` privately at line 280, drives repaint via `requestAnimationFrame` (resolved at lines 98–101), calls `rendererSpec.renderCanvas(canvasEl, props)` at lines 259 and 261 inside a `try { … } finally { perf.endSpan(...) }` block whose return value is currently discarded, ends `pendingPaintWaitSpan` at lines 271–275, and calls `clearRenderFlags()` at line 277. `markDirty(reason)` at line 174 sets `paintDirty = true` for non-`"size"` reasons and `sizeDirty = true` for `"size"`. `paintNow()`'s guard at line 248 returns early when `!paintDirty && !sizeDirty`. Props is closure state (line 132); updated only on `attach()`/`update()`/`detach()` (lines 315, 381).
12. `SemicircleRadialEngine.createRenderer` returns a `renderCanvas(canvas, props)` function at line 119; the renderer holds a closure-scope `fitCache = textLayout.createFitCache()` at line 117. Pointer angle (`angleNow`) is computed freshly each call at line 165. **`rendererSpec` is created once per `ClusterRendererRouter` instance** (`ClusterRendererRouter.js` lines 60–82 calls each `.create(def, Helpers)` exactly once); all widget instances of the same kind share the same renderer closure and therefore the same `fitCache`. Any per-instance state (including easer state) must be keyed on the `canvas` element that `renderCanvas` receives.
13. `shared/theme/ThemeModel.js` declares `DEFAULT_FONT_STACK` at line 19 starting with `"Inter","SF Pro Text",-apple-system,...Roboto,...`; `font.family` is registered at line 44 as theme token `--dyni-font` → CSS var `--dyni-theme-font-family` inside the frozen `TOKEN_DEFS` array at line 40. There is no `font.familyMono` token. `ThemeModel` exposes no `configure(...)` mutation API; the plugin-level theme cache and its `configure(...)` / invalidation entry point live in `shared/theme/ThemeResolver.js` at line 351.
14. `plugin.css` declares `font-family: var(--dyni-theme-font-family);` on `.widget.dyniplugin` at line 9. There are no `@font-face` rules today; no font assets ship with the plugin; the repository has no `assets/` directory.
15. `AVNAV_BASE_URL` resolves to the plugin's served URL root; `plugin.js` uses it at lines 16–20 to construct absolute script URLs. CSS `url(...)` inside `plugin.css` resolves relative to the CSS file, also served under the plugin URL root.
16. `tools/check-file-size.mjs` enforces a hard cap of 400 **non-empty** lines per JS file (`MAX_NON_EMPTY_LINES = 400` at line 7; counted via `countNonEmptyLines` at line 406) and a 300-line warn threshold. `SCAN_ROOTS` at line 21 covers `plugin.js`, `runtime`, `cluster`, `config`, `shared`, `widgets`. Tests, tools, and `node_modules` are excluded.
17. `documentation/conventions/smell-prevention.md` lists as **block** severity the rules relevant to this plan: `hardcoded-runtime-default`, `redundant-internal-fallback`, `redundant-null-type-guard`, `inline-config-default-duplication`, `formatter-availability-heuristic`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing` (targets `ctx.save/ctx.restore` wrappers — does not apply to perf-span try/finally), `responsive-layout-hard-floor`, `mapper-logic-leakage`.
18. `config/components/registry-shared-foundation.js`, `registry-shared-engines.js`, `registry-widgets.js`, `registry-cluster.js` are the four UMD component registries; every new shared module must be added to one of them with the entry shape `{ js, css, globalKey, deps }` (where `css` is `undefined` when the module ships no CSS).
19. `plugin.js` has an authoritative load order at lines 51–77 (the `internalScripts` array); new runtime files must be inserted in that sequence if they depend on earlier runtime state.
20. Existing files in the 300–399 non-empty line band that this plan will touch (total / **non-empty**): `AisTargetRenderModel.js` (317 / 283), `PositionCoordinateWidget.js` (317 / 307), `ActiveRouteTextHtmlWidget.js` (336 / 298), `MapZoomTextHtmlWidget.js` (346 / 309), `EditRouteHtmlFit.js` (339 / 312), `AisTargetHtmlFit.js` (365 / 356), `RoutePointsRenderModel.js` (375 / 338), `CenterDisplayTextWidget.js` (405 / 389), `AisTargetLayout.js` (409 / 380), `EditRouteLayout.js` (415 / 379), `AisTargetLayoutGeometry.js` (427 / 394). Three files (`CenterDisplayTextWidget`, `AisTargetLayout`, `EditRouteLayout`, `AisTargetLayoutGeometry`) have total line counts above 400 but non-empty line counts below; none are currently over the 400 non-empty cap. Any growth on these files must preserve the 400 non-empty-line hard cap. **Caution:** `AisTargetLayoutGeometry.js` has only 6 lines of headroom (394/400); although it is not directly touched by this plan, any cascade from `AisTargetRenderModel` changes (Phase 3) must not propagate into this file without first verifying headroom.
21. **Renderer-spec lifecycle:** `cluster/rendering/ClusterRendererRouter.js` at lines 60–82 creates each renderer spec exactly once per router instance. All canvas widgets of a given kind share that one spec. Per-widget-instance state (easer, per-instance fit-cache segregation if needed) must be keyed on the `canvas` DOM element passed into `renderCanvas(canvas, props)`. The adapter provides stable canvas identity: `CanvasDomSurfaceAdapter.js` creates one canvas per attached surface (`createCanvasNode()` called once at line 343 in `attach()`), destroys it on `detach()` (line 373).
22. Signal derivations from existing props and viewmodel outputs (read directly by each widget's resolver):
    * **Disconnected** for **all** widgets: `p.disconnect === true`. This is the raw `keys.nav.gps.connectionLost` signal from AvNav core, meaning the viewer is disconnected from the server. No other condition (`wpServer`, empty route name, etc.) contributes to the `disconnected` state-screen. For ActiveRoute, the mapper must pass the raw `p.disconnect` signal (not the folded viewmodel `disconnect` that includes `wpServer === false || routeName === ""`); see Phase 3 ActiveRoute deliverable.
    * **NoRoute** for RoutePoints/EditRoute: `!p.route` (already computed as `domain.route`).
    * **NoRoute** for ActiveRoute: `p.routeName === ""` (the trimmed `activeRouteName` from the viewmodel, available via the mapper output). Additionally, `p.wpServer === false` (the raw AvNav prop, not overridden by the mapper) means the waypoint server is down and route metrics are stale; this also resolves to `noRoute`.
    * **NoTarget** for XTE: `typeof p.wpName === "string" && p.wpName.trim() === ""`.
    * **NoAIS** for AIS: derived `domain.hasTargetIdentity === false` in non-hidden page context.
    * **Hidden** for AIS: derived `domain.hasTargetIdentity === false && !isEditingMode && pageId !== "gpspage"`. This is the first candidate in AIS's resolver (before `disconnected`) so that AIS remains invisible on pages where it is not expected, regardless of connection state.
23. No widget today sets `font-variant-numeric: tabular-nums` in CSS or JS; no shared `tabular` helper exists.
24. No plugin-level animation/easing helper exists; `lerp` appears only in `XteHighwayPrimitives.js` (line 19) and `ResponsiveScaleProfile.js` (line 24), both for geometric interpolation, not temporal easing.

---

## Hard Constraints

### Non-negotiable boundaries

1. AvNav core formatters in `viewer/util/formatter.js` must not be modified. All placeholder normalization happens at the plugin's render-model boundary.
2. `Helpers.applyFormatter` contract (`runtime/helpers.js`) must not change. Its documented `"---"` runtime owner fallback behavior remains the single source of that literal in the runtime layer.
3. UMD/IIFE component pattern is mandatory for all new shared modules; every new file registers on `window.DyniComponents.{globalKey}` via the registry. No ES `import`/`export`. Mandatory file headers (`Module`, `Documentation`, `Depends`) on every new file.
4. 400-line hard cap (non-empty lines) and 300-line warn threshold apply to every new or modified JS file. Files currently between 300 and 400 non-empty lines (see Verified Baseline item 20) may grow only if the resulting non-empty-line count remains strictly below 400; where the margin is tight, the phase deliverable extracts a small helper to preserve headroom.
5. One-way dependency direction (`widgets → shared`; `cluster → cluster/widgets/shared`; `shared → shared`; `config` pure data; `runtime` may not depend on `widgets/cluster/shared`) must be preserved.
6. Cluster mappers stay declarative (`create` + `translate` only). Any state-screen resolution logic belongs in render-model / widget layer, not in mappers. Mapper changes are limited to: (a) the Phase 3 ActiveRoute `disconnect` field fix (pass raw `p.disconnect` instead of the folded viewmodel disconnect), and (b) choosing between `formatTime` and `formatClock` as the formatter name in Phase 7.
7. `CanvasDomSurfaceAdapter` follow-up-frame support must be backward-compatible: renderers that return `undefined` from `renderCanvas` behave exactly as today.
8. AIS's `hidden` render-state semantics must be preserved unchanged (AIS is invisible outside `gpspage` / edit mode when there is no target identity). `hidden` is HTML-only; canvas widgets never resolve to `hidden`.
9. StableDigits must never truncate, round, or lose accuracy. If padded output plus existing responsive fit still clips, the renderer falls through to the unpadded text and runs the standard fit pipeline.
10. Bundled fonts are licensed under Apache 2.0 (Roboto, Roboto Mono). License text ships alongside the font files.
11. No `localStorage`, `sessionStorage`, or other browser persistence in any new module.
12. Every new shared kit owns a targeted test; every modified widget gets updated tests covering the new state-screen paths and new options.
13. Per-instance state in canvas widgets (easer, and any future per-instance state) is keyed on the `canvas` DOM element. A `WeakMap<HTMLCanvasElement, InstanceState>` held in the renderer closure is the canonical storage. This pattern relies on the canvas's lifetime being owned by the surface adapter (verified baseline item 21); entries are garbage-collected when the canvas is detached and dereferenced.

### Out of scope

* Redesigning any widget's normal-data visual layout.
* Changing AvNav widget-registration protocol.
* Live theme-preset live-switching behavior (PLAN10 settled this as reload-driven).
* Adding a plugin-wide global settings UI.
* Persistence of per-user preferences across sessions.
* Changing cluster routing or mapper output schema beyond additive per-kind option fields, the Phase 3 ActiveRoute `disconnect` signal fix, and the Phase 7 formatter-name swap.
* Animation on HTML widgets (smoothing is canvas-only for this rollout; HTML widgets continue using the existing patch-based update model).
* Performance-gate regression work (PLAN10 owns that boundary; this plan must not regress it, but does not add new gates).
* Stale-data detection. The spring integrator exposes enough information (time since last `setTarget`) for a future stale indicator, but no such indicator is introduced here.
* `formatDateTime` handling. The plugin does not use `formatDateTime`; if a future widget needs it, hideSeconds for that widget will be handled in a separate plan.

---

## Settled architectural decisions

### 1. State-screen vocabulary (shared) and resolution (per-widget)

**Shared vocabulary.** `StateScreenLabels.LABELS = { disconnected: "GPS Lost", noRoute: "No Route", noTarget: "No Waypoint", noAis: "No AIS" }`. Labels are fixed strings; internationalization is out of scope. `StateScreenLabels.KINDS` enumerates the possible values (`disconnected`, `noRoute`, `noTarget`, `noAis`, `hidden`, `data`).

**Shared precedence helper.** `StateScreenPrecedence.pickFirst(candidates)` takes an array of `{ kind, when }` entries and returns the first entry whose `when` is truthy. If none match, returns `"data"`. The array's order *is* the precedence. Pure; reads only its argument.

```
StateScreenPrecedence.pickFirst([
  { kind: "disconnected", when: p.disconnect === true },
  { kind: "noRoute",      when: p.routeName === "" },
  { kind: "data",         when: true }
])
```

**Canonical precedence.** The documented order, enforced by style guide and Phase 9 smell contract, is `disconnected > noRoute > noTarget > noAis > hidden > data`. **`disconnected` is mandatory in every resolver** — all widgets show the "GPS Lost" state-screen when the viewer loses the server connection. Other kinds may be omitted when not applicable to a given widget. The smell contract parses `pickFirst([...])` call sites and asserts (a) `disconnected` is always the first entry (never omitted) **unless the widget has a `hidden` entry, in which case `hidden` may precede `disconnected`** (AIS exception — see below), (b) `data` is last (as a catch-all with `when: true`), (c) the overall order respects the canonical sequence with omissions allowed for non-`disconnected` kinds.

**AIS exception — `hidden` before `disconnected`.** AIS is the sole widget where `hidden` appears before `disconnected`. The AIS resolver is: `hidden > disconnected > noAis > data`. Rationale: `hidden` is a layout-level decision meaning "this widget slot should not be visible on this page." On non-gpspage, non-edit pages where the AIS widget is normally invisible (because there is no target identity and the page context does not call for showing it), the widget must stay invisible during server disconnect instead of suddenly rendering a "GPS Lost" box. This preserves today's behavior — AIS widgets are invisible outside gpspage / edit mode regardless of connection state.

**Per-widget resolver.** Each widget computes its own kind by calling `pickFirst` with a widget-specific candidate list. Widgets read raw signals directly from their props and their own domain/viewmodel output; the resolver has no awareness of other widgets. See Verified Baseline item 22 for the canonical per-widget signal mapping.

**Disconnected signal.** The `disconnected` state-screen is driven by a single source: `keys.nav.gps.connectionLost` from AvNav core, surfaced as `p.disconnect === true`. This means the viewer has lost its server connection. No other condition (`wpServer`, empty route name, etc.) contributes to this signal. For ActiveRoute, the `NavMapper.js` output is amended to pass the raw `p.disconnect` signal instead of the folded viewmodel `disconnect` (which included `wpServer === false || routeName === ""`); see Phase 3 deliverable.

**AIS and derived signals.** AIS's resolver reads `domain.hasTargetIdentity` as a derived boolean from its viewmodel, not raw `mmsi`. This is acceptable: the "raw" in the canonical model means "the widget sees the signal as a single value, not recombined with others," not "the signal must be a primitive message field." A single-value derived boolean is fine. The per-widget resolver model makes the distinction obvious at each call site. AIS's `hidden` candidate precedes `disconnected` because `hidden` is a page-level layout decision (see AIS exception above).

### 2. State-screen rendering surface (dual-surface)

**HTML.** `StateScreenMarkup.renderStateScreen({ kind, label, wrapperClasses, extraAttrs, fitStyle, htmlUtils })` returns inner HTML that replaces the widget's normal body inside the widget's existing wrapper. The wrapper retains widget-specific classes plus gets `dyni-state-<kind>`. The interaction class on the wrapper is forced to the passive variant whenever `kind !== "data"` (via the `StateScreenInteraction` helper).

**Canvas.** `StateScreenCanvasOverlay.drawStateScreen({ ctx, W, H, family, color, labelWeight, kind, label })`. This is the upgraded `drawDisconnectOverlay`: same dim-and-label primitive, accepts the four non-hidden non-data kind labels, and — in contrast with today's overlay-on-top behavior — is called INSTEAD OF the gauge/text rendering path when `kind !== "data"`. The canvas is cleared, the overlay is drawn on a blank background. `kind === "hidden"` is not a valid argument for canvas overlay (AIS is HTML-only); `kind === "data"` is also not valid (callers must not call the overlay in the data state). Both invalid kinds throw in dev mode. The module reimplements `setFont(ctx, px, weight, family)` locally rather than importing it from `RadialTextLayout`, keeping the state module decoupled from the radial-specific module.

**AIS `hidden` preservation.** The HTML markup for `kind === "hidden"` emits the wrapper with `dyni-state-hidden` and no body content; existing CSS (`display: none` on `.dyni-state-hidden`) makes it invisible. The rendered DOM shape is identical to today's AIS `hidden` path (same parent element, same classes minus the new `dyni-state-hidden` token); visual behavior is pixel-identical.

### 3. Interaction gating tied to state

`StateScreenInteraction.resolveInteraction({ kind, baseInteraction })` returns `"passive"` whenever `kind !== "data"`; otherwise it returns `baseInteraction`. Every widget wraps its existing interaction resolution through this call, so click dispatch is automatically disabled on state-screens. For most widgets, `disconnected` is the first candidate and therefore always resolves to passive interaction. For AIS, `hidden` precedes `disconnected` (see AIS exception in §1); `hidden` also resolves to passive, so interaction is disabled regardless.

### 4. Placeholder normalization

`PlaceholderNormalize.normalize(formattedText, defaultText)` returns `defaultText` (which every widget sets to `"---"` via editable-parameter default) when the input matches any of the known formatter-fallback patterns:

* empty string
* whitespace-only strings
* any dash-only string of length ≥ 1 (covers `"-"`, `"--"`, `"---"`, `"----"`, `"-----"`, and longer; produced by `formatDecimal`'s NaN branch across all `fix` widths and by `formatLonLats` / `formatPressure` / `formatTemperature`)
* `"--:--"` (`formatClock`)
* `"--:--:--"` (`formatTime`)
* `"----/--/--"` (`formatDate`)
* `"  -"` (`formatSpeed`; two leading spaces plus dash — caught by trim-then-dash-check)
* `"    -"` (`formatDistance`; four leading spaces plus dash — caught by the same trim-then-dash-check)
* `"NO DATA"` (legacy canvas overlay label; removed by Phase 4 but matched defensively)

The implementation uses an explicit regex set plus exact-string set; pattern matching is explicit and centralized; no heuristic inference from round-tripped values (that would collide with the `formatter-availability-heuristic` smell rule). The reference regex for the dash-only family is `/^\s*-+\s*$/`.

Every render-model that formats a value for display calls `PlaceholderNormalize.normalize(...)` on the formatter output before writing it to the model. `Helpers.applyFormatter`'s own default behavior is unchanged; the render-model boundary is the single normalization point.

**RoutePoints exemption.** `RoutePointsRenderModel.js` emits compound-unit placeholders like `"--kt/--nm"` from `formatCourseDistanceInfo` / `buildRowInfo` when a leg is missing; these are not dash-only strings and the component sub-values (`"--"` with a unit attached) carry information the user expects to see. `RoutePointsRenderModel.js` is exempt from the Phase 9 dash-literal smell contract, and the acceptance criterion "no `--` in DOM" explicitly carves out compound-unit placeholders emitted by RoutePoints rows.

### 5. Plugin-wide default placeholder

Every widget kind's `def.default` stays `"---"` (as in `config/clusters/nav.js` line 32). Editor-facing defaults are not affected by this plan.

### 6. StableDigits numeric decomposition

`StableDigits.normalize(rawFormattedText, options)` parses the formatted number into `{ sign, integer, dot, fraction, suffix }` where:

* `sign` is `"-"` if the original value was negative, else `" "` when `options.reserveSignSlot === true`, else `""`.
* `integer` is the integer-part digit string, padded with leading zeros to `options.integerWidth` when it fits.
* `dot` is `"."` if a fractional component exists.
* `fraction` is the fractional-part digit string as produced by the formatter (never truncated).
* `suffix` is `options.sideSuffix` (`""`, `"R"`, `"L"` — always one character wide when `reserveSideSuffixSlot === true`) or a plain unit string.

Returns `{ padded, fallback }`:

* `padded` is the fixed-width assembly `sign + integer + dot + fraction + suffix`.
* `fallback` is the unpadded assembly (no leading zeros, no sign slot, no side-suffix slot, but keeping the actual sign/suffix when present).

Integer overflow rule: when `integer.length > options.integerWidth`, `padded.integer` equals `integer` (no truncation). The resulting `padded` string is wider than the reserved slot — accuracy wins over alignment.

Placeholder short-circuit: when `PlaceholderNormalize.isPlaceholder(rawFormattedText) === true`, `StableDigits.normalize` returns `{ padded: rawFormattedText, fallback: rawFormattedText }` without decomposition. Placeholders never pick up a sign slot.

Callers feed `padded` to the existing fit binary-search (`fitSingleLineBinary` in `TextLayoutPrimitives`). If the result indicates the text clips (result `width > maxW` at `minPx`), the caller calls `fitSingleLineBinary` again with `fallback`. This is a caller-driven two-pass pattern; `fitSingleLineBinary`'s existing `extraCheck` callback may optionally be used to steer the binary search, but no new fit primitive is introduced.

**Note on formatters with silent sign drop.** Some avnav-core formatters (notably `formatDistance` via `formatDecimal` with `prefixZero=true`) drop the negative sign when `prefixZero` is active. For those formatters, the sign slot decomposed by StableDigits is always `" "` (never `"-"`) because the upstream text never contains a minus. This is acceptable — StableDigits only reserves a slot; it doesn't manufacture signs. Callers whose upstream formatter always produces positive text (e.g., `formatDistance`) can omit `reserveSignSlot` without loss.

### 7. Tabular numerics rendering

* HTML: add a `dyni-tabular` CSS class. When `stableDigits === true` or `coordinatesTabular === true` applies to a span, the widget adds the class. The class sets `font-variant-numeric: tabular-nums` and `font-family: var(--dyni-theme-font-family-mono), var(--dyni-theme-font-family);`.
* Canvas: the renderer switches `ctx.font` family to `theme.font.familyMono` when drawing stable-digit text; non-digit text continues to use `theme.font.family`.

Tabular-mono font selection is decoupled from the stable-digits padding: `coordinatesTabular` enables tabular-mono font rendering without enabling padding; `stableDigits` enables padding and tabular-mono font together.

### 8. HideSeconds — formatter substitution only

Primary path: at the mapper / render-model layer, if the widget's `hideSeconds === true`, the widget uses `formatClock` instead of `formatTime`. This path is used for ETA, rteEta, clock kind, ActiveRoute ETA, EditRoute ETA, and PositionCoordinate `timeStatus` + `dateTime` variants (both of which use `formatTime` on the lon axis).

No post-processor; no `formatDateTime` handling; no text munging on arbitrary formatter output. The plugin does not use `formatDateTime`.

### 9. Spring-based smoothing (replaces EWMA-based easing)

`SpringEasing.create(spec)` returns an instance-bound critically-damped spring with the following API:

```
easer.setTarget(target)               // no timing argument
easer.advance(nowMs)                   // returns current interpolated value
easer.isSettled()                      // within epsilon of target and near-zero velocity
easer.reset(value)                     // hard snap; velocity = 0
```

Properties:

* **Critically damped.** The spring has no overshoot and no oscillation. Tuning is a single stiffness constant `k` (spec field `stiffness`; default `40` rad/s² for angles, adjustable per widget). Damping coefficient is derived: `d = 2 * sqrt(k)`.
* **First-use snap.** When no `advance()` has been called yet (freshly created easer), the first `setTarget(value)` initializes `current = value` and `velocity = 0` — an implicit `reset()`. This prevents a visual sweep from the default zero-origin on widget attach. Subsequent `setTarget` calls are velocity-continuous as described below.
* **Non-finite guard.** `setTarget(value)` is a no-op when `!Number.isFinite(value)`. The spring retains its previous target and velocity. Callers do not need to pre-filter NaN or Infinity (which are real code paths — e.g. `SemicircleRadialEngine` computes `angleNow = NaN` when the input is out of range).
* **Velocity-continuous at retarget.** `setTarget(newTarget)` (after the first call) does not reset any trajectory state; it only updates the target value. The existing position and velocity integrate smoothly into the new equilibrium. No retarget kink.
* **Rate-invariant at typical frame rates.** Neither `setTarget` nor `advance` measures inter-update gaps. A stream at 10 Hz feeds small target steps the spring smooths quickly; a stream at 0.5 Hz feeds larger target steps the spring settles over ~300–500 ms (characteristic timescale `1/sqrt(k)`); a stream whose rate changes mid-session is tracked without lag. **Qualification:** under extreme stall (>50 ms per frame), the `maxDtMs` cap bounds integration to 50 ms per step, so the spring progresses at a bounded rate rather than wall-clock rate. This is intentional — the cap prevents numerical divergence after backgrounded-tab resumption.
* **Bursty-update tolerant.** Because retargeting is velocity-continuous, back-to-back `setTarget` calls within one frame (AIS burst, for example) are absorbed without stuttering — the spring just sees the final target for that frame.
* **Settled.** `isSettled()` returns true when `|target - current| < spec.epsilon` **and** `|velocity| < spec.epsilonVelocity`. Once settled, `advance` returns `target` exactly (no floating-point drift) and velocity is clamped to zero.
* **Time-based integration.** Each `advance(nowMs)` call computes `dt = nowMs - lastAdvanceMs`. To remain numerically stable under large `dt` (backgrounded tab resumption), `dt` is capped at `spec.maxDtMs` (default `50` ms). Semi-implicit Euler integration is used: `velocity += acceleration * dt; current += velocity * dt;` where `acceleration = -k * (current - target) - d * velocity`. A closed-form analytical solution for critically-damped springs is an acceptable alternative and is numerically stable without a dt cap; the implementer may choose either.
* **Angular wrap-around.** Optional `spec.wrap = 360` mode for compass/heading angles. On `setTarget`, the target is normalized so the spring always moves along the shortest arc: the effective target is adjusted by ±wrap so that `|effectiveTarget - current| <= wrap/2`. The spring's `current` value is therefore not constrained to `[0, 360)`; draw code applies `mod wrap` when rendering.

Widget integration pattern (per-instance state via canvas-keyed `WeakMap`):

```
const easers = new WeakMap(); // HTMLCanvasElement -> easer

function getEaser(canvas) {
  let e = easers.get(canvas);
  if (!e) {
    e = easing.create({ stiffness: 40, epsilon: 0.05, epsilonVelocity: 0.1, wrap: 360 });
    easers.set(canvas, e);
  }
  return e;
}

// Each renderCanvas call:
const easer = getEaser(canvas);
easer.setTarget(angleTarget);         // first call snaps; NaN is ignored
const angleNow = easer.advance(performance.now());
draw.drawPointerAtRim(..., angleNow, ...);
const wantsFollowUpFrame = !easer.isSettled();
return { wantsFollowUpFrame };
```

The `WeakMap` keys on the canvas element passed into `renderCanvas`. When the surface adapter detaches and the canvas is dropped (`CanvasDomSurfaceAdapter.js` `detach()` at line 373 removes the canvas node and clears references), the WeakMap entry becomes garbage-collectible. No explicit cleanup is needed.

### 10. Follow-up frame scheduling in CanvasDomSurfaceAdapter

`paintNow()` in `CanvasDomSurfaceAdapter` captures the return value of `rendererSpec.renderCanvas(...)` into a `let paintResult;` declared before the existing `try { … } finally { perf.endSpan(...) }` block, assigns it inside both branches of the try body (hostContext and non-hostContext call sites), and inspects it after `clearRenderFlags()`. If `paintResult && paintResult.wantsFollowUpFrame === true`, `schedulePaint("animate")` is called **after** `clearRenderFlags()`, so the new `markDirty("animate")` call inside `schedulePaint` is not overwritten by `clearRenderFlags()`. Renderers that return `undefined` or a non-object are unaffected.

The existing try/finally is a perf-span cleanup boundary, not a `ctx.save`/`ctx.restore` wrapper, so the `try-finally-canvas-drawing` smell rule does not apply.

A new marking reason `"animate"` is introduced (alongside existing `"size"` / `"update"` / `"attach"` / default paint). `perf` span annotation records the reason for traceability.

A simple guard prevents infinite animation loops: a closure-scope `let consecutiveAnimateFrames = 0;` counter. The counter increments inside `paintNow()` after a successful `schedulePaint("animate")` call. It resets to zero inside `markDirty(reason)` when `reason !== "animate"` (any `update`/`size`/`attach` paint). When the counter reaches 600 (≈10 s at 60 Hz), a one-time dev warning is logged and further `schedulePaint("animate")` calls are suppressed until the next non-animate paint resets the counter. This only fires if a widget's spring never converges, which is a bug signal.

### 11. Roboto bundling

Plugin ships four font files under `assets/fonts/`:

* `Roboto-Regular.woff2`
* `Roboto-Bold.woff2`
* `RobotoMono-Regular.woff2`
* `RobotoMono-Bold.woff2`

plus `assets/fonts/LICENSE.txt` (Apache 2.0 text).

`plugin.css` declares four `@font-face` rules referencing `assets/fonts/...` relatively. The theme font stacks become:

* `font.family` default: `"Roboto", "Inter", "SF Pro Text", -apple-system, ... (existing stack)` — Roboto prepended.
* `font.familyMono` (new token) default: `"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace`.

Systems with Roboto installed use their local copy; systems without fall through to the bundled `@font-face`. No CDN, no runtime download. `local(...)` precedes `url(...)` in each `@font-face` src so preinstalled system copies win.

### 12. Theme token additions

Add `font.familyMono` to `ThemeModel`'s `TOKEN_DEFS` array (the frozen array at line 40, consumed by `getTokenDefinitions()`): `defineToken("font.familyMono", "--dyni-font-mono", "string", DEFAULT_MONO_STACK, undefined, "--dyni-theme-font-family-mono")` where `DEFAULT_MONO_STACK = '"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace'`. Prepend `"Roboto"` to `DEFAULT_FONT_STACK`.

The plugin-level theme cache is owned by `ThemeResolver.configure(...)` (line 351). Because the new token is added to `TOKEN_DEFS` at module-load time (before any `ThemeResolver.configure` call), no cache-invalidation call is required for the token's existence; the existing resolver picks it up on first read. Tests must confirm that the PLAN10 snapshot signature includes the new token's input var `--dyni-font-mono` so that theme-preset switches invalidate correctly.

### 13. Per-widget editable-parameter surfacing (cluster-config-local)

Each new option appears only on widgets where it is meaningful, defined **per-widget in the relevant cluster config file**, following the existing `compassLinearTickMinor` / `compassLinearShowEndLabels` pattern in `config/clusters/course-heading.js`. Each editable has a concrete `condition: [{ kind: ... }, ...]` list restricting it to the widgets that support it. No cross-widget shared definition in `config/shared/common-editables.js`.

Editable ownership by cluster:

* **`config/clusters/nav.js`:**
  * `coordinatesTabular` (default `true`) on RoutePoints (when `showLatLon === true`), PositionCoordinate position variant, CenterDisplay center-position.
  * `stableDigits` (default `false`) on XTE display, ActiveRoute metrics, EditRoute metrics, CenterDisplay numeric cells.
  * `hideSeconds` (default `false`) on eta / rteEta kinds, ActiveRoute, EditRoute.
  * `easing` (default `true`) on XTE display.
* **`config/clusters/speed.js`:**
  * `stableDigits` (default `false`) on SpeedRadial, SpeedLinear.
  * `easing` (default `true`) on SpeedRadial, SpeedLinear.
* **`config/clusters/environment.js`:**
  * `stableDigits` (default `false`) on DepthRadial, DepthLinear, TemperatureRadial, TemperatureLinear, VoltageRadial, VoltageLinear.
  * `easing` (default `true`) on the same six.
* **`config/clusters/course-heading.js`:**
  * `stableDigits` (default `false`) on CompassRadial, CompassLinear.
  * `easing` (default `true`) on CompassRadial, CompassLinear (with `wrap: 360`).
* **`config/clusters/wind.js`:**
  * `stableDigits` (default `false`) on WindRadial, WindLinear.
  * `easing` (default `true`) on WindRadial, WindLinear (with `wrap: 360`).
* **`config/clusters/vessel.js`:**
  * `hideSeconds` (default `false`) on clock / dateTime / timeStatus kinds.

Defaults match the option's documented default. Every editable has an `internal: false` presentation (user-facing) unless noted; `easing` is `internal: false` too — users may want to disable smoothing for debugging.

---

## Shared module inventory

New modules introduced by this plan (with registry group and deps):

| Module | Path | Group | Deps |
|---|---|---|---|
| `StateScreenLabels` | `shared/widget-kits/state/StateScreenLabels.js` | sharedFoundation | — |
| `StateScreenPrecedence` | `shared/widget-kits/state/StateScreenPrecedence.js` | sharedFoundation | — |
| `StateScreenInteraction` | `shared/widget-kits/state/StateScreenInteraction.js` | sharedFoundation | — |
| `StateScreenMarkup` | `shared/widget-kits/state/StateScreenMarkup.js` | sharedFoundation | `HtmlWidgetUtils`, `StateScreenLabels` |
| `StateScreenCanvasOverlay` | `shared/widget-kits/state/StateScreenCanvasOverlay.js` | sharedFoundation | `StateScreenLabels` |
| `PlaceholderNormalize` | `shared/widget-kits/format/PlaceholderNormalize.js` | sharedFoundation | — |
| `StableDigits` | `shared/widget-kits/format/StableDigits.js` | sharedFoundation | `PlaceholderNormalize` |
| `SpringEasing` | `shared/widget-kits/anim/SpringEasing.js` | sharedFoundation | — |

Each registry entry uses the existing shape `{ js, css, globalKey, deps }` where `css: undefined` for every module in this plan. Every new module uses the UMD template, registers under `window.DyniComponents`, and must stay well under 300 lines. **Note:** `config/components/registry-shared-foundation.js` is currently at 258 non-empty lines; adding 8 new entries (~5 lines each, ~40 total) brings it to ~298 non-empty lines, within the 300-line warn threshold but approaching it. If growth exceeds 300, a new registry group file (e.g. `registry-shared-state.js`) may be split out; this is a non-functional refactor.

Registry dep ordering is linearized automatically by the existing loader (deps are resolved transitively). For clarity, `StateScreenLabels` and `PlaceholderNormalize` and `StateScreenPrecedence` and `StateScreenInteraction` have no deps and load first; `StableDigits` depends on `PlaceholderNormalize`; `StateScreenMarkup` depends on `HtmlWidgetUtils` and `StateScreenLabels`; `StateScreenCanvasOverlay` depends on `StateScreenLabels` (it reimplements `setFont` locally instead of importing from `RadialTextLayout`); `SpringEasing` has no deps.

---

## Implementation phases

### Phase 1 — State-screen shared foundation (labels, precedence, interaction, HTML markup, canvas overlay)

**Intent:** Introduce the shared vocabulary, precedence helper, interaction helper, and rendering primitives for semantic state-screens without yet wiring any widget to use them.

**Dependencies:** none.

**Deliverables:**

* `shared/widget-kits/state/StateScreenLabels.js` — `LABELS` object (`disconnected`, `noRoute`, `noTarget`, `noAis`) and `KINDS` enum (including `hidden` and `data`); ≤60 lines.
* `shared/widget-kits/state/StateScreenPrecedence.js` — `pickFirst(candidates)` returning the first candidate whose `when` is truthy, else `"data"`; validates that each entry has `kind` and `when`; ≤80 lines.
* `shared/widget-kits/state/StateScreenInteraction.js` — `resolveInteraction({ kind, baseInteraction })` returning `"passive"` when `kind !== "data"`, else `baseInteraction`; ≤40 lines.
* `shared/widget-kits/state/StateScreenMarkup.js` — `renderStateScreen({ kind, label, wrapperClasses, extraAttrs, fitStyle, htmlUtils })`; returns inner markup; applies `dyni-state-<kind>`; handles `kind === "hidden"` by emitting an empty body (CSS hides the wrapper); ≤140 lines.
* `shared/widget-kits/state/StateScreenCanvasOverlay.js` — `drawStateScreen({ ctx, W, H, family, color, labelWeight, kind, label })`; reimplements and generalizes `drawDisconnectOverlay` logic (including a local `setFont` helper — no dep on `RadialTextLayout`). Throws in dev mode for `kind === "hidden"` or `kind === "data"` (invalid on canvas). The legacy `RadialTextLayout.drawDisconnectOverlay` and `TextLayoutPrimitives.primitiveDrawDisconnectOverlay` are NOT touched in this phase — they remain unchanged and continue to function for existing call sites. Phase 4 replaces those call sites and removes the legacy functions. ≤160 lines.
* Registry entries in `config/components/registry-shared-foundation.js` for all five new modules (shape `{ js, css: undefined, globalKey, deps }`).
* CSS: add `.dyni-state-disconnected`, `.dyni-state-no-route`, `.dyni-state-no-target`, `.dyni-state-no-ais`, `.dyni-state-hidden` selectors in `plugin.css`. Hidden sets `display: none`; others style the centered label at 18% of the smaller side (matching the current canvas overlay visual).
* Unit tests under `tests/shared/state/`:
  * `StateScreenLabels.test.js` — label constants are fixed strings; KINDS covers six values.
  * `StateScreenPrecedence.test.js` — first-match semantics, fall-through to `"data"`, empty list returns `"data"`, validation.
  * `StateScreenInteraction.test.js` — `"data"` passes through baseInteraction; every non-`"data"` kind returns `"passive"`.
  * `StateScreenMarkup.test.js` — wrapper classes, label text, interaction-class forced passive, `hidden` emits empty body.
  * `StateScreenCanvasOverlay.test.js` — each valid kind produces expected fill + label; invalid kinds throw in dev.
* Docs:
  * New file `documentation/shared/state-screens.md` — vocabulary, precedence helper, per-widget resolver pattern, canonical order, HTML + canvas rendering rules, interaction gating.
  * Update `documentation/TABLEOFCONTENTS.md` with the new entries.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes (new tests green; no other tests broken).
* Legacy `drawDisconnectOverlay` call sites are untouched and continue to work through their original code paths.
* No widget yet uses the new contract — this phase is purely additive.

---

### Phase 2 — Placeholder normalization and `PlaceholderNormalize` adoption

**Intent:** Establish `---` as the single missing-value token across every widget's render-model output.

**Dependencies:** Phase 1 (not strictly required, but merged first to avoid parallel registry churn).

**Deliverables:**

* `shared/widget-kits/format/PlaceholderNormalize.js` — `normalize(text, defaultText)`, `isPlaceholder(text)` predicate, `PLACEHOLDER_PATTERNS` array (exported for tests), plus the dash-only regex `DASH_ONLY_RE = /^\s*-+\s*$/`; ≤120 lines. Patterns must cover: empty / whitespace-only, `DASH_ONLY_RE`, `"--:--"`, `"--:--:--"`, `"----/--/--"`, `"NO DATA"`.
* Registry entry in `config/components/registry-shared-foundation.js`.
* Widget integration — call `PlaceholderNormalize.normalize(...)` on every formatter output, replacing widget-local fallback ternaries:
  * `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` (calls happen in `buildRenderModel`'s `formatMetric`).
  * `shared/widget-kits/nav/EditRouteRenderModel.js`.
  * `shared/widget-kits/nav/RoutePointsRenderModel.js` — apply normalization on each individual formatter call inside `formatLatLonInfo` and on the `courseText` / `distanceText` sub-values inside `formatCourseDistanceInfo`, **not** on the composite output (the compound `"--kt/--nm"` fallback for missing-leg rows is preserved as-is via the plan's exemption).
  * `shared/widget-kits/nav/AisTargetRenderModel.js` (each of the four metric `formatWithFormatter` call sites).
  * `widgets/text/XteDisplayWidget/XteDisplayWidget.js` (the four formatted values).
  * `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` (`formatAxisValue` output).
  * `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js` (each formatted cell).
  * `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` (each formatted metric).
* Remove widget-local placeholder literals where they become redundant; use `dyni-lint-disable-next-line hardcoded-runtime-default -- Single shared placeholder token owned by PlaceholderNormalize` only where lint requires it at the shared-module definition site.
* Unit tests under `tests/shared/format/`:
  * `PlaceholderNormalize.test.js` — every known formatter fallback pattern normalizes to `---`; dash-only strings of length 1 through 10 all normalize; whitespace-padded dashes (like `"  -"` from formatSpeed and `"    -"` from formatDistance) normalize; finite values pass through unchanged.
* Update existing widget tests (each touched `*.test.js`) — fixtures that previously expected `"--:--:--"` or `"--"` now expect `"---"`; RoutePoints fixtures for missing-leg rows continue to expect the compound form.
* Docs: new `documentation/shared/placeholder-normalize.md`; update `documentation/widgets/*.md` for each touched widget to note "missing values render as `---`"; `route-points.md` notes the compound-unit carve-out; update `documentation/TABLEOFCONTENTS.md`.

**Exit conditions:**

* `npm run check:core` passes (no new `redundant-internal-fallback` or `hardcoded-runtime-default` violations).
* `npm run test` passes.
* Every touched widget, in `disconnect === true` or other missing-value states, now outputs `---` uniformly in its per-field text (the full state-screen replacement still happens in Phase 3). RoutePoints missing-leg rows retain their compound `"--kt/--nm"` form.

---

### Phase 3 — Wire state-screens into all HTML widgets

**Intent:** Replace ad-hoc disconnect/no-route branches in HTML widgets with the shared state-screen contract via per-widget resolvers. Every HTML widget includes `disconnected` as a candidate, driven by the raw `p.disconnect === true` signal (`keys.nav.gps.connectionLost`). For most widgets `disconnected` is the first candidate; for AIS, `hidden` precedes `disconnected` (see AIS exception in decision §1). `ActiveRouteViewModel` is not modified; the `NavMapper.js` activeRoute branch is amended to pass the raw `p.disconnect` signal so the widget can distinguish `disconnected` from `noRoute`.

**Dependencies:** Phase 1.

**Deliverables:**

* `cluster/mappers/NavMapper.js` — in the `activeRoute` branch (line 52), change `disconnect: activeRouteDomain.disconnect` to `disconnect: p.disconnect === true`. This decouples the state-screen `disconnected` signal from the viewmodel's folded disconnect (which includes `wpServer === false || routeName === ""`). The viewmodel itself is unchanged. The widget's existing per-field blanking logic is replaced by the state-screen contract (fields are not individually blanked; the entire body is replaced by the state-screen label).
* `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` — add a resolver that calls `StateScreenPrecedence.pickFirst([...])` with candidates:
  * `{ kind: "disconnected", when: p.disconnect === true }`
  * `{ kind: "noRoute", when: p.wpServer === false }`
  * `{ kind: "noRoute", when: p.routeName === "" }`
  * `{ kind: "data", when: true }`
  
  `p.disconnect` is the raw `keys.nav.gps.connectionLost` signal (now passed through the mapper unfolded). `p.routeName` is the trimmed `activeRouteName` from the viewmodel output. `p.wpServer` is the raw AvNav prop (not overridden by the mapper), indicating whether the waypoint server is running; when `false`, route metrics (remain, ETA, nextCourse) are stale and the route body should be replaced. This preserves today's visual behavior where the viewmodel folded `wpServer === false` into `disconnect`.
  When `kind !== "data"`, the widget's `renderMarkup` returns the StateScreen body inside the existing `dyni-active-route-html` wrapper with `dyni-state-<kind>` added. Interaction resolved via `StateScreenInteraction.resolveInteraction`. `layoutSignature` incorporates `kind`.
* `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js` + `shared/widget-kits/nav/EditRouteRenderModel.js` + `shared/widget-kits/nav/EditRouteMarkup.js` — add resolver with candidates for `disconnected` (from `p.disconnect === true`; the EditRoute mapper does not override `p.disconnect`, so the widget receives the raw AvNav signal via the host-framework spread merge), `noRoute` (from `!domain.route`), `data`. Replace existing `NO_ROUTE_TEXT` path with StateScreen rendering; preserve visual parity (code-internal refactor with unchanged DOM output for `kind === "noRoute"`).
* `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js` + `RoutePointsRenderModel.js` + `RoutePointsMarkup.js` — add resolver with candidates for `disconnected` (from `p.disconnect === true`; same spread-merge mechanism as EditRoute), `noRoute`, `data`. (RoutePoints has no `noTarget` concept.) The existing `NO_ROUTE_TEXT` flow is folded into the new contract.
* `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js` + `AisTargetRenderModel.js` + `AisTargetMarkup.js` — rewrite `resolveRenderState` as a `pickFirst` resolver with candidates:
  * `{ kind: "hidden", when: domain.hasTargetIdentity === false && cfg.isEditingMode !== true && cfg.pageId !== "gpspage" }`
  * `{ kind: "disconnected", when: p.disconnect === true }`
  * `{ kind: "noAis", when: domain.hasTargetIdentity === false }`
  * `{ kind: "data", when: true }`
  
  **`hidden` is the first candidate** (AIS exception — see decision §1). On non-gpspage, non-edit pages where there is no target identity, the widget remains invisible regardless of connection state, preserving today's behavior. When the widget IS visible (gpspage or edit mode) and the viewer disconnects, `disconnected` fires. `hidden` rendering goes through `StateScreenMarkup` (wrapper gets `dyni-state-hidden`, body empty, CSS sets `display: none`). `PLACEHOLDER_TEXT` literal is replaced by `StateScreenLabels.LABELS.noAis`. The AIS mapper does not override `p.disconnect`, so the widget receives the raw AvNav signal via the host-framework spread merge.
* `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js` — add resolver with candidates for `disconnected` (from `p.disconnect === true`) and `data`. MapZoom currently has no disconnect handling; this adds the `disconnected` state-screen as new functionality.
* Widget tests updated: `ActiveRouteTextHtmlWidget.test.js`, `EditRouteRenderModel.test.js`, `RoutePointsRenderModel.test.js`, `AisTargetRenderModel.test.js`, `MapZoomTextHtmlWidget.test.js` — cover each state-screen kind produces correct classes, label text, interaction=passive. Every widget test includes a fixture with `disconnect: true` that classifies as `disconnected`. AIS tests include a fixture with `disconnect: true, hasTargetIdentity: false, pageId: "other"` that classifies as `hidden` (not `disconnected`), pinning the AIS exception.
* New integration test: `tests/integration/ActiveRouteStateScreens.test.js` — asserts that a fixture with `disconnect: false, wpServer: true, routeName: "R1"` classifies as `data`, a fixture with `disconnect: true, wpServer: true, routeName: "R1"` classifies as `disconnected`, a fixture with `disconnect: false, wpServer: true, routeName: ""` classifies as `noRoute`, and a fixture with `disconnect: false, wpServer: false, routeName: "R1"` classifies as `noRoute`. This pins all four distinctions using the raw signals.
* Docs: update `documentation/widgets/active-route.md`, `edit-route.md`, `route-points.md`, `ais-target.md`, `map-zoom.md` — each describes its state-screen set and refers back to `documentation/shared/state-screens.md`.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes.
* Every touched HTML widget file stays under 400 non-empty lines.
* Visual parity with today's `NoRoute` / `No AIS` / AIS `hidden` is preserved (snapshot-style assertions in tests).
* Interactions disabled whenever the state-screen is active; tests assert this.
* ActiveRoute fixture with `disconnect: false, wpServer: true` and `routeName: ""` classifies as `noRoute`, not `disconnected`.
* ActiveRoute fixture with `disconnect: true, wpServer: true` and `routeName: "R1"` classifies as `disconnected`, not `data`.
* ActiveRoute fixture with `disconnect: false, wpServer: false` and `routeName: "R1"` classifies as `noRoute` (preserves today's blanking on wpServer down).
* AIS fixture with `disconnect: true, hasTargetIdentity: false, pageId: "other"` classifies as `hidden` (not `disconnected`) — pinning the AIS exception.
* AIS fixture with `disconnect: true, hasTargetIdentity: false, pageId: "gpspage"` classifies as `disconnected` — pinning that AIS shows the disconnect screen when it would otherwise be visible.
* Every HTML widget shows the `disconnected` state-screen when `p.disconnect === true` (except AIS when it is in the `hidden` state on non-applicable pages).

---

### Phase 4 — Wire state-screens into all canvas widgets

**Intent:** Replace the canvas overlay-on-top pattern with state-screen-instead-of-content rendering, using per-widget resolvers. Every canvas widget includes `disconnected` as its first candidate, driven by `p.disconnect === true`.

**Dependencies:** Phase 1.

**Deliverables:**

* `shared/widget-kits/radial/SemicircleRadialEngine.js` — replace the `if (p.disconnect) text.drawDisconnectOverlay(...)` block with a pre-render resolver call: `const kind = StateScreenPrecedence.pickFirst([{ kind: "disconnected", when: p.disconnect === true }, { kind: "data", when: true }]);` when `kind !== "data"`, skip all normal drawing and call `StateScreenCanvasOverlay.drawStateScreen(...)` on the cleared canvas. Return the renderer's standard value (plus, in Phase 8, the follow-up-frame signal).
* `shared/widget-kits/radial/FullCircleRadialEngine.js` — same pattern. Remove the `cfg.drawDisconnect !== false` guard (line 283) — no caller passes `drawDisconnect: false`; the guard is functionally inert and is removed alongside the legacy overlay code.
* `shared/widget-kits/linear/LinearGaugeEngine.js` — same pattern. Note that today's LinearGauge calls `drawDisconnectOverlay` at the end (line 358), not in a guard at the top; Phase 4 restructures this to the top-of-`renderCanvas` branch so the normal drawing path is skipped entirely for non-data kinds.
* `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js` — same pattern.
* `widgets/text/XteDisplayWidget/XteDisplayWidget.js` — resolver with candidates for `disconnected` (from `p.disconnect === true`), `noTarget` (from `typeof p.wpName === "string" && p.wpName.trim() === ""`), and `data`. When `kind !== "data"`, skip highway and boat rendering; draw StateScreen only.
* `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` — resolver with candidates for `disconnected` and `data`. Replace the current `drawDisconnectOverlay` call (line 295) with the state-screen branch.
* `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` — resolver with candidates for `disconnected` and `data`. CenterDisplay currently has no disconnect handling; this adds the `disconnected` state-screen as new functionality (no existing visual parity to validate against). The file is at 389 non-empty lines with 11-line headroom before the 400 cap; if the integration pushes it over, extract the new state-screen dispatch into a small helper `shared/widget-kits/text/CenterDisplayStateAdapter.js` (≤60 lines) to restore headroom.
* Remove legacy overlay code: `RadialTextLayout.drawDisconnectOverlay` (definition at line 199, export at line 228), `TextLayoutPrimitives.primitiveDrawDisconnectOverlay` (line 280, export at line 301), and `TextLayoutEngine.drawDisconnectOverlay` re-export (line 160). All three removal targets must be completed together — `PositionCoordinateWidget` and `ThreeValueTextWidget` consume the overlay through `TextLayoutEngine`, not through the primitives directly.
* Remove all remaining call sites: `SemicircleRadialEngine.js` line 239, `FullCircleRadialEngine.js` line 284 (plus the `cfg.drawDisconnect` guard), `LinearGaugeEngine.js` line 358 are replaced by the branching above; `PositionCoordinateWidget.js` line 295 is replaced directly; `TextLayoutPrimitives.js`'s internal call at line 282 is removed with the wrapper.
* Tests under `tests/shared/radial/`, `tests/shared/linear/`, `tests/shared/text/`, `tests/widgets/radial/`, `tests/widgets/linear/`, `tests/widgets/text/` — update existing engine tests to assert state-screen branching and the new label output; delete assertions about the `"NO DATA"` literal. Add `CenterDisplayTextWidget.test.js` coverage for the new `disconnected` state-screen.
* Docs: update `documentation/radial/gauge-style-guide.md`, `documentation/radial/full-circle-dial-style-guide.md`, `documentation/linear/linear-gauge-style-guide.md`, `documentation/widgets/xte-display.md`, `documentation/widgets/position-coordinates.md`, `documentation/widgets/three-elements.md`, `documentation/widgets/center-display.md` to describe state-screen rendering.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes.
* No engine file grows past its existing non-empty-line size by more than 10 lines (split into a small helper if necessary).
* No call sites to the legacy `drawDisconnectOverlay` remain.
* Every canvas widget in `disconnect === true` renders the shared state-screen on a cleared canvas — no gauge visible behind the label.
* CenterDisplayTextWidget stays under 400 non-empty lines.

---

### Phase 5 — Roboto bundling and `font.familyMono` theme token

**Intent:** Ship Roboto + Roboto Mono as plugin assets and expose a `familyMono` theme token for tabular/mono rendering.

**Dependencies:** none (but Phase 6 consumes the new token).

**Deliverables:**

* `assets/fonts/Roboto-Regular.woff2`, `Roboto-Bold.woff2`, `RobotoMono-Regular.woff2`, `RobotoMono-Bold.woff2`.
* `assets/fonts/LICENSE.txt` — Apache 2.0 license text and source attribution.
* `plugin.css` — four `@font-face` rules at the top of the file (after the header comment) using `font-display: swap` and `local()` fallbacks before the `url()` so preinstalled system copies win.
* `plugin.css` additions for the tabular class: `.dyni-tabular { font-variant-numeric: tabular-nums; font-family: var(--dyni-theme-font-family-mono), var(--dyni-theme-font-family); }`.
* `shared/theme/ThemeModel.js` — append a new entry to the `TOKEN_DEFS` frozen array: `defineToken("font.familyMono", "--dyni-font-mono", "string", DEFAULT_MONO_STACK, undefined, "--dyni-theme-font-family-mono")` where `DEFAULT_MONO_STACK = '"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace'`. Prepend `"Roboto"` to `DEFAULT_FONT_STACK`. `ThemeResolver.configure(...)` is not called from this phase — it continues to pick up `TOKEN_DEFS` entries on next read.
* Tests:
  * `tests/shared/theme/ThemeModel.test.js` — add assertion for `font.familyMono` token, input var, output var, default value. Confirm that the token appears in `getTokenDefinitions()` output.
  * `tests/shared/theme/ThemeResolver.test.js` — add assertion that the new token's input var `--dyni-font-mono` participates in snapshot signature generation (PLAN10 contract — changing the mono token input var changes the committed-root snapshot).
  * `tests/css/theme-token-extremes.user.css` — add a Roboto-overriding preset fixture to prove the font-family cascade resolves.
  * `tests/plugin/plugin-css-fontface.test.js` — parse `plugin.css` text, assert four `@font-face` declarations with expected `font-family` / `src: local(...) url(...)` / `font-weight` shapes.
* Docs:
  * Update `documentation/shared/css-theming.md` — describe `--dyni-theme-font-family-mono` and `.dyni-tabular`.
  * Update `documentation/shared/theme-tokens.md` — list `font.familyMono` among exposed tokens.
  * New `documentation/shared/bundled-fonts.md` — filenames, license, where to find sources, rationale (offline-capable, Roboto Mono for tabular alignment).
  * Update `documentation/TABLEOFCONTENTS.md`.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes.
* `plugin.css` still compiles (syntactic validation in existing css test harness).
* No existing theme/ThemeResolver test regresses; the PLAN10 snapshot signature incorporates the new input var.
* Font files ship under `assets/fonts/` and are reachable under `AVNAV_BASE_URL/assets/fonts/`.

---

### Phase 6 — StableDigits, tabular coordinates, and per-widget editables

**Intent:** Add the two numeric-rendering options (`stableDigits`, `coordinatesTabular`) with the accuracy-preserving two-pass fit fallback, and define the editables per-widget in each cluster config.

**Dependencies:** Phase 5 (Roboto Mono + `font.familyMono` token), Phase 2 (PlaceholderNormalize).

**Deliverables:**

* `shared/widget-kits/format/StableDigits.js` — implementation per decision §6; ≤220 lines. Uses `PlaceholderNormalize.isPlaceholder(text)` to short-circuit placeholders.
* Registry entry in `config/components/registry-shared-foundation.js`.
* HTML widget wiring (spans get `.dyni-tabular` when tabular-mono rendering is active):
  * `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` — respect `p.coordinatesTabular` (default `true`); in stacked mode, emit `.dyni-tabular` on the lat/lon spans; in flat mode, emit on the combined value span.
  * `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js` — when `showLatLon === true` and `coordinatesTabular === true`, the `rowFit.infoStyle` pipeline emits `.dyni-tabular`.
  * `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` — center position rows use `.dyni-tabular` when `coordinatesTabular === true`.
  * `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`, `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js` — numeric-metric spans get `.dyni-tabular` when `stableDigits === true`, and their text is produced via `StableDigits.normalize(...)` with `fallback`-on-clip handled by the existing fit layer.
* Canvas widget wiring:
  * `shared/widget-kits/radial/RadialTextLayout.js` — accept an optional `useMono: true` flag in the public draw helpers; when set, `setFont(ctx, px, weight, theme.font.familyMono)`.
  * `shared/widget-kits/text/TextLayoutPrimitives.js` — same pattern.
  * `widgets/text/XteDisplayWidget/XteDisplayWidget.js` — produce `xteSide` (`"R"`/`"L"`/`""`) as `sideSuffix` input to `StableDigits.normalize`; two-pass fit (padded → fallback) on clip. The sign slot is suppressed (`reserveSignSlot: false`) because `xteDistance` formats `Math.abs(xteRaw)` — the sign is already carried by the side suffix.
  * `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` — `stableDigits` opt-in on numeric cells.
  * Gauges (`widgets/radial/*`, `widgets/linear/*`) — main value text produced via StableDigits when the widget's prop is set; font switches to mono; the caller runs `fitSingleLineBinary` with `padded` text first, then inspects the result — if `width > maxW` or the font size equals `minPx` and the text still clips, the caller calls `fitSingleLineBinary` again with the `fallback` text. The existing `extraCheck` callback may optionally be used to steer the binary search, but the retry itself is caller logic, not an `extraCheck` side-effect.
* Per-widget editables in cluster configs (following the `compassLinearTickMinor` pattern — each editable has its own `condition: [{ kind: ... }, ...]` list):
  * `config/clusters/nav.js` — add `coordinatesTabular` on the position / coord variants, `stableDigits` on XTE / ActiveRoute / EditRoute / CenterDisplay numeric kinds.
  * `config/clusters/speed.js` — add `stableDigits` on SpeedRadial / SpeedLinear kinds.
  * `config/clusters/environment.js` — add `stableDigits` on all six kinds (Depth/Temperature/Voltage × Radial/Linear).
  * `config/clusters/course-heading.js` — add `stableDigits` on CompassRadial / CompassLinear kinds.
  * `config/clusters/wind.js` — add `stableDigits` on WindRadial / WindLinear kinds.
* Tests:
  * `tests/shared/format/StableDigits.test.js` — decomposition, sign slot, side suffix slot, integer overflow preserves full value, fractional digits preserved, two-output pair `(padded, fallback)`, placeholder short-circuit returns the placeholder unchanged in both fields.
  * Updated widget tests for each touched widget: `.dyni-tabular` present in expected DOM; padded vs fallback chosen based on shell width simulation; accuracy invariants at extreme values.
  * `tests/widgets/text/XteDisplayWidget.test.js` — R/L suffix alignment, behavior at XTE = 0 (empty suffix slot).
  * `tests/config/clusters/*.test.js` — assert each new editable appears only for the documented kinds via its `condition` list.
* Docs:
  * New `documentation/shared/stable-digits.md` — contract, two-pass fit, accuracy rule, sign/suffix slots, placeholder short-circuit.
  * Update `documentation/shared/css-theming.md` — `.dyni-tabular` usage.
  * Update each touched `documentation/widgets/*.md` — add `stableDigits` / `coordinatesTabular` sections.
  * Update `documentation/avnav-api/editable-parameters.md` with the new per-cluster editables.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes.
* No touched file grows over 400 non-empty lines; any widget file near the cap gets a small extraction (e.g. `widgets/text/XteDisplayWidget/XteDisplayStableDigits.js`, ≤60 lines) to stay under.
* Manual visual check: gauges with `stableDigits=false` look identical to pre-plan output (function-identical is the contract; pixel-identical is the target).

---

### Phase 7 — HideSeconds via formatter substitution

**Intent:** Give time-display widgets an opt-in to hide seconds via `formatTime → formatClock` substitution at the mapper / render-model layer, defined as per-widget editables in each cluster.

**Dependencies:** Phase 2.

**Deliverables:**

* `cluster/mappers/NavMapper.js` — for `eta` and `rteEta` kinds (lines 32 and 35), if `p.hideSeconds === true`, emit `formatClock` instead of `formatTime` as the formatter name. The mapper body stays declarative — only the formatter-name literal changes based on a prop.
* `cluster/mappers/VesselMapper.js` — for `clock` kind (line 82), same swap.
* `shared/widget-kits/nav/EditRouteRenderModel.js` — when `domain.hideSeconds === true` (populated by EditRouteViewModel from prop), use `formatClock` instead of `formatTime` (the call site today is line 183).
* `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` — likewise, via `props.hideSeconds` (the call site today is line 110).
* `cluster/viewmodels/ActiveRouteViewModel.js` — add `hideSeconds: p.hideSeconds === true` to the `build()` return object (after the existing `units` field). ActiveRouteViewModel's existing `disconnect` fold is unchanged — the widget continues to read the raw signals through its Phase 3 resolver.
* `cluster/viewmodels/EditRouteViewModel.js` — add `hideSeconds: p.hideSeconds === true` to the `build()` return object.
* `cluster/mappers/NavMapper.js` — in the `activeRoute` branch (line 47), add `hideSeconds: activeRouteDomain.hideSeconds` to the mapper output literal so the widget receives the prop. In the `editRoute` branch (line 85), add `hideSeconds: editRouteDomain.hideSeconds` inside the `domain: { ... }` literal. Both are additive fields in the mapper output.
* `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` — for `timeStatus` variant (uses `formatTime` at line 88) and `dateTime` variant (uses `formatTime` for the lon axis at line 77), swap the lon-axis formatter to `formatClock` when `hideSeconds === true`. The lat axis of the `dateTime` variant continues to use `formatDate`, which does not carry seconds.
* Per-widget editables in cluster configs:
  * `config/clusters/nav.js` — add `hideSeconds` on eta / rteEta / ActiveRoute / EditRoute kinds, with appropriate `condition` lists.
  * `config/clusters/vessel.js` — add `hideSeconds` on clock / dateTime / timeStatus kinds.
* Tests:
  * Updated mapper tests (`tests/cluster/mappers/NavMapper.test.js`, `VesselMapper.test.js`) — formatter swap branches based on `hideSeconds` prop.
  * Updated widget tests for ActiveRoute, EditRoute, PositionCoordinate (dateTime + timeStatus variants) — `hideSeconds` on / off parity; output carries `HH:MM` not `HH:MM:SS`.
  * `tests/config/clusters/nav.test.js` / `vessel.test.js` — assert `hideSeconds` editable appears only for the documented kinds.
* Docs:
  * New `documentation/shared/hide-seconds.md` — contract, formatter-swap primary path; note the plugin does not use `formatDateTime` so no post-processor is needed.
  * Update `documentation/widgets/active-route.md`, `edit-route.md`, `position-coordinates.md` — hideSeconds sections.
  * Update `documentation/avnav-api/editable-parameters.md`.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes.
* No mapper gains presentation logic beyond a simple `formatter` name choice (mapper-logic-leakage smell unchanged).
* All `:SS` components are absent from rendered text when `hideSeconds === true` across every affected widget.
* No `HideSecondsPostProcess` module exists in the codebase (it was never introduced).

---

### Phase 8 — SpringEasing and canvas follow-up-frame protocol

**Intent:** Introduce a critically-damped spring smoother, extend `CanvasDomSurfaceAdapter` with the opt-in follow-up-frame protocol, and integrate smoothing into gauges and XTE.

**Dependencies:** none (Phase 6 is orthogonal).

**Deliverables:**

* `shared/widget-kits/anim/SpringEasing.js` — implementation per decision §9; ≤180 lines. Pure — no DOM, no global state; each instance is self-contained. Semi-implicit Euler integration with `dt` capped at 50 ms (backgrounded-tab stability). No EWMA, no period learning, no duration.
* Registry entry in `config/components/registry-shared-foundation.js`.
* `cluster/rendering/CanvasDomSurfaceAdapter.js` — update `paintNow()` to capture the return value of `rendererSpec.renderCanvas(...)`. Declare `let paintResult;` before the try, assign `paintResult = rendererSpec.renderCanvas.call(hostContext, canvasEl, props);` (and the non-hostContext branch), then after `clearRenderFlags()` line (currently 277), if `paintResult && paintResult.wantsFollowUpFrame === true`, call `schedulePaint("animate")`. The order matters: **`schedulePaint("animate")` must fire after `clearRenderFlags()`**, otherwise `markDirty` inside `schedulePaint` is overwritten by `clearRenderFlags` and the follow-up frame never actually paints.
  
  Add a soft-cap guard: a closure-scope `let consecutiveAnimateFrames = 0;` counter. **Increment:** inside `paintNow()`, after the `schedulePaint("animate")` call (so only counting frames that actually schedule a follow-up). **Reset to zero:** inside `markDirty(reason)` when `reason !== "animate"` (i.e. any `update`/`size`/`attach` paint resets the counter). When the counter reaches 600, log a dev warning once and suppress further `schedulePaint("animate")` calls until the next non-animate paint resets it.
* Widget integration (per-instance state via canvas-keyed `WeakMap` — see integration pattern in decision §9):
  * `widgets/radial/SpeedRadialWidget/`, `DepthRadialWidget/`, `TemperatureRadialWidget/`, `VoltageRadialWidget/` — each wraps its pointer-angle computation through a canvas-keyed spring.
  * `widgets/radial/CompassRadialWidget/`, `WindRadialWidget/` — spring with `wrap: 360` for needle/card angle.
  * `widgets/linear/*` (six files) — spring for marker position.
  * `widgets/text/XteDisplayWidget/XteDisplayWidget.js` — spring for XTE highway path offset (the `xteNormalized` value feeds the spring; `drawDynamicHighway` draws at the eased value each paint).
* Per-widget editable `easing` (default `true`) — when `false`, each paint calls `easer.setTarget(target); easer.reset(target);` so snapshots are instant.
* Tests:
  * `tests/shared/anim/SpringEasing.test.js` — critically damped (no overshoot, no oscillation); first-use snap (first `setTarget` before any `advance` initializes `current = target` with zero velocity — no sweep from zero); non-finite guard (`setTarget(NaN)` and `setTarget(Infinity)` are no-ops — spring retains previous target); velocity-continuous at retarget (no derivative discontinuity); rate-invariant at typical frame rates (step responses identical regardless of `advance` cadence at 16–60 Hz; under `maxDtMs` cap, integration bounds per-step); settled (converges to target exactly); `reset()` snap; wrap-around (shortest arc); `dt` cap stability (large gap between `advance` calls does not destabilize).
  * `tests/cluster/rendering/CanvasDomSurfaceAdapter.test.js` — follow-up-frame scheduled on `wantsFollowUpFrame: true`, not scheduled on undefined/false, schedule fires after clearRenderFlags (follow-up actually paints on next frame), soft-cap suppression fires after 600 frames, counter resets on non-animate paint, return value correctly captured inside the existing try/finally without interfering with perf span end.
  * `tests/cluster/rendering/CanvasDomSurfaceAdapter.animate-integration.test.js` — integration test: a fake renderer that returns `wantsFollowUpFrame: true` for the first N frames then `false` actually produces N+1 paints (not just 1).
  * Updated radial / linear widget tests — spring integration with canvas-keyed storage (two canvases must produce independent state); `easing=false` path bypasses.
* Docs:
  * New `documentation/shared/spring-easing.md` — contract, wrap mode, critical damping, rate invariance, `dt` cap, canvas-keyed WeakMap pattern, integration example.
  * Update `documentation/architecture/canvas-dom-surface-adapter.md` — follow-up-frame protocol, return-value shape, capture-inside-try/finally pattern, `schedulePaint("animate")` ordering after `clearRenderFlags()`, soft-cap.
  * Update `documentation/radial/gauge-style-guide.md` and `documentation/linear/linear-gauge-style-guide.md` — spring-smoothed pointer note.
  * Update `documentation/widgets/xte-display.md` — spring-smoothed path offset.
  * Update `documentation/TABLEOFCONTENTS.md`.

**Exit conditions:**

* `npm run check:core` passes.
* `npm run test` passes.
* `npm run perf:check` passes — smoothing must not regress any PLAN10 gate. Performance acceptance rule: steady-state (all springs settled) perf is equal to or better than pre-plan baseline; animated perf may use more paint frames but each paint's self-time stays within ±5% of baseline.
* No widget file exceeds 400 non-empty lines (spring integration is a 5–15 line closure plus one call site per widget; files near the cap get a small helper extraction).
* Two-canvas integration test: two widget instances of the same kind on screen have independent spring state (verified by driving them with different target sequences and asserting independent advance values).
* Manual dev check: rapid value oscillation (simulated) is visually smooth with no kinks at retarget; soft-cap triggers only on synthetic no-settle inputs; backgrounded-tab resume produces no visual glitch.

---

### Phase 9 — Test + documentation sweep and acceptance gates

**Intent:** Fill any coverage gap, verify docs consistency, run the full gate, finalize.

**Dependencies:** Phases 1–8 merged.

**Deliverables:**

* Coverage pass: every new module hits `test:coverage:check` thresholds. Fill gaps identified by `npm run test:coverage`.
* Integration tests under `tests/integration/` (or the closest existing location) exercising:
  * Cross-widget state-screen consistency: **all widgets of the plugin** show `Disconnected` simultaneously when `p.disconnect === true`, and the rendered label text is identical across all of them — **except** AIS widgets that are in the `hidden` state on non-applicable pages (non-gpspage, non-edit, no target identity), which remain invisible. No widget may show normal data or any other non-hidden state-screen when the viewer is disconnected from the server.
  * ActiveRoute split: fixture with `disconnect: false, routeName: ""` classifies as `noRoute`; fixture with `disconnect: true, routeName: "R1"` classifies as `disconnected`; the raw `p.disconnect` signal (not the folded viewmodel disconnect) drives the state-screen.
  * Placeholder consistency: no `---` / `--` / `--:--` / `--:--:--` / `-----` / dash-only mixing in rendered DOM across widgets, except RoutePoints compound-unit placeholders (`"--kt/--nm"` and similar) which are carved out.
  * stableDigits cross-widget: two radial gauges side by side with `stableDigits=true` produce aligned main-value text widths for comparable values.
  * Spring independence: two canvas widgets of the same kind with different live data produce independent smoothing (canvas-keyed WeakMap contract).
* `documentation/TABLEOFCONTENTS.md` — final pass; every new `documentation/shared/*.md` is reachable; every touched `documentation/widgets/*.md` is re-linked.
* `documentation/core-principles.md` — add a rule if needed: "State-screens are widget-body replacements, not overlays; semantic empty states force passive interaction; per-widget resolvers read raw signals through a shared precedence helper." (If this feels redundant with existing rules, skip; do not add ceremony.)
* `documentation/QUALITY.md` — add an entry summarizing this plan's scope and completion criteria.
* `documentation/TECH-DEBT.md` — clear any related items; note any known follow-ups (e.g. HTML-surface smoothing deferred, stale-data indicator deferred, `formatDateTime` support deferred if a widget needs it).
* Smell-contract additions (`tools/check-smell-contracts.mjs`):
  * **Placeholder contract:** every widget's render model must use `PlaceholderNormalize` when formatting (grep-style detection: every `Helpers.applyFormatter` call site in render-model files must be paired with a `PlaceholderNormalize.normalize` call within a small window). `RoutePointsRenderModel.js`'s compound-unit composites are exempt (the exemption is recorded in the contract file with a comment explaining why).
  * **Dash-literal contract:** no widget JS file may contain the literals `"NO DATA"`, `"--:--"`, `"--:--:--"`, `"-----"`, or dash-only strings of length ≥ 2 in string-literal context, except inside `PlaceholderNormalize.js` (definition site) and `RoutePointsRenderModel.js` (compound-placeholder carve-out).
  * **State-screen precedence contract:** every `pickFirst([...])` call site is parsed using a regex-based text scanner that matches inline `pickFirst([` … `])` arrays and extracts `kind:` string literals from each `{...}` entry in order. Call sites must be written inline (the array literal passed directly to `pickFirst`, not via variable indirection); this is a codified convention. The contract asserts: (a) `disconnected` is always the first entry **unless the widget has a `hidden` entry, in which case `hidden` may precede `disconnected`** (AIS exception — the only widget where `hidden` is a layout-level visibility decision that must take precedence over data-state screens); (b) when `data` appears, it is the last entry with `when: true`; (c) the overall order respects the canonical sequence (`disconnected > noRoute > noTarget > noAis > hidden > data`) with omissions allowed for non-`disconnected` kinds, with the AIS exception carved out explicitly in the contract file with a comment explaining the rationale.
* Final run: `npm run check:all` passes (includes `check:core`, `test:coverage:check`, `perf:check`).

**Exit conditions:**

* `npm run check:all` passes.
* Every acceptance criterion (below) is testable and tested.
* Move the plan file from `exec-plans/active/` to `exec-plans/completed/`.

---

## Acceptance criteria

### State-screens

* Each widget's resolver uses `StateScreenPrecedence.pickFirst([...])` with a candidate list in canonical precedence order (`disconnected > noRoute > noTarget > noAis > hidden > data`, with omissions allowed). **Every widget includes `disconnected` as its first candidate, except AIS** where `hidden` (a layout-level "not visible on this page" decision) precedes `disconnected` — see AIS exception.
* Each resolver reads its widget's own signals directly from props / domain; no cross-widget coupling; no central classifier.
* The `disconnected` state-screen is driven solely by `p.disconnect === true` (`keys.nav.gps.connectionLost`). No other condition (`wpServer`, empty route name) contributes to the `disconnected` state. The `NavMapper.js` activeRoute branch passes the raw `p.disconnect` signal, not the folded viewmodel disconnect.
* `ActiveRouteViewModel` is unchanged; the widget distinguishes `disconnected` from `noRoute` using the raw `p.disconnect` signal (now passed through the mapper unfolded), `p.routeName` (trimmed activeRouteName from the viewmodel), and `p.wpServer` (raw AvNav prop via spread merge).
* ActiveRoute fixture with `disconnect: false, wpServer: true` and `routeName: ""` classifies as `noRoute`, not `disconnected`.
* ActiveRoute fixture with `disconnect: true, wpServer: true` and `routeName: "R1"` classifies as `disconnected`, not `data`.
* ActiveRoute fixture with `disconnect: false, wpServer: false` and `routeName: "R1"` classifies as `noRoute` (preserves today's blanking when wpServer is down).
* Every HTML widget adds `dyni-state-<kind>` to its wrapper and renders the shared label body when `kind !== "data"`.
* Every canvas widget clears the canvas and renders the shared overlay label when `kind !== "data"`; no gauge/text remains visible behind the label.
* AIS's `hidden` state is preserved with identical visual behavior (invisible). `hidden` is HTML-only; `StateScreenCanvasOverlay.drawStateScreen({kind: "hidden"})` throws in dev mode. AIS widgets on non-gpspage, non-edit pages remain invisible during disconnect (not `disconnected`).
* Every widget disables dispatch/click in every non-`data` state via `StateScreenInteraction.resolveInteraction`.
* `disconnected` is always passive, regardless of `baseInteraction` (by virtue of being `kind !== "data"`).
* Legacy `drawDisconnectOverlay` has no remaining call sites — removal includes `RadialTextLayout.drawDisconnectOverlay`, `TextLayoutPrimitives.primitiveDrawDisconnectOverlay`, and `TextLayoutEngine.drawDisconnectOverlay` re-export.
* All widgets of the plugin show the `disconnected` state-screen simultaneously when `p.disconnect === true`, **except** AIS widgets that are in the `hidden` state on non-applicable pages (these remain invisible).

### Placeholder normalization

* Every widget outputs exactly `---` for missing / invalid / formatter-fallback values.
* No widget DOM (in any tested state) contains `--`, `--:--`, `--:--:--`, `-----`, `  -`, `    -`, `NO DATA`, `----/--/--`, or any bare dash-only string of length ≥ 1 from `formatDecimal`, **except** for RoutePoints compound-unit placeholders (`"--kt/--nm"` and analogous unit combinations) which are explicitly carved out.
* `PlaceholderNormalize.normalize(...)` is the single source of placeholder replacement.
* `PlaceholderNormalize.isPlaceholder(...)` returns `true` for all known fallback patterns and `false` for finite-value outputs.

### StableDigits + coordinatesTabular

* `StableDigits.normalize(...)` produces `(padded, fallback)` pairs; padded preserves width for in-range values.
* Integer overflow never truncates: `122.5` with `integerWidth=4` outputs `122.5` in padded form.
* Fractional digits produced by the upstream formatter are preserved verbatim.
* Negative sign and XTE R/L suffix reserve a one-char slot in padded output when their respective `reserve*Slot` flags are set.
* Fit fallback: the caller runs `fitSingleLineBinary` with `padded` text; if the result width exceeds `maxW` or the font size bottoms out at `minPx`, the caller retries with `fallback` text and shrinks through the existing binary-search fit. No clipping. The existing `extraCheck` extension point may be used to steer the binary search; no new fit primitive is introduced.
* Placeholder short-circuit: when `StableDigits.normalize` receives a placeholder input, both `padded` and `fallback` equal that input unchanged (no sign slot, no decomposition).
* `.dyni-tabular` class applies tabular-mono rendering on HTML spans.
* Canvas widgets render numeric values in `theme.font.familyMono` when the option is active.
* `coordinatesTabular=true` (default) aligns stacked lat/lon coordinates; turning it off visibly returns to proportional-width rendering.
* Each new editable appears only for the widget kinds documented in decision §13.

### HideSeconds

* `hideSeconds=true` replaces `HH:MM:SS` with `HH:MM` across every supporting widget via `formatTime → formatClock` substitution.
* No post-processor exists; no `formatDateTime` path is touched.
* Placeholder token `--:--:--` (when `hideSeconds=false`) and `--:--` (when `hideSeconds=true`) both normalize to `---` via `PlaceholderNormalize`.

### SpringEasing

* Spring is critically damped: no overshoot, no oscillation for any sequence of `setTarget` values.
* First-use snap: when no `advance()` has been called yet, the first `setTarget(value)` initializes `current = value` and `velocity = 0`. No visual sweep from zero-origin on widget attach.
* Non-finite guard: `setTarget(NaN)` and `setTarget(Infinity)` are no-ops — the spring retains its previous target and velocity. Callers do not need to pre-filter non-finite values.
* Velocity continuous at retarget: a mid-flight retarget (after the first `setTarget`) does not produce a derivative discontinuity in the position trajectory.
* Rate-invariant at typical frame rates (16–60 Hz): identical step responses regardless of how many `advance` calls occur between `setTarget` calls, and regardless of `setTarget` cadence. Under extreme stall (>50 ms per frame), the `maxDtMs` cap bounds integration to 50 ms per step — the spring progresses at a bounded rate rather than wall-clock rate (intentional: prevents numerical divergence after backgrounded-tab resumption).
* Bursty-update tolerant: multiple `setTarget` calls before the next `advance` collapse to the final target for that frame with no stuttering.
* Settled: `isSettled()` returns `true` when both `|target - current| < epsilon` and `|velocity| < epsilonVelocity`; `advance` returns exact `target` once settled.
* Wrap-around: `setTarget(350°)` on a spring currently at `10°` with `wrap=360` takes the shortest arc (−20°).
* `reset(value)` snaps without animation (velocity clamped to zero).
* `dt` cap: a 30-second gap between `advance` calls (backgrounded tab) produces a stable bounded step, not oscillation or divergence.
* Per-instance state: two canvas widgets of the same kind maintain independent spring state via canvas-keyed WeakMap.
* `renderCanvas` returns `{ wantsFollowUpFrame: true }` iff the spring is not settled.
* `CanvasDomSurfaceAdapter` schedules `schedulePaint("animate")` only on that signal and only after `clearRenderFlags()`; legacy renderers that return `undefined` are unaffected.
* Follow-up frames actually paint: an integration test with a renderer returning `wantsFollowUpFrame: true` for the first N frames produces N+1 paints.
* Return-value capture in `CanvasDomSurfaceAdapter` works inside the existing perf-span `try/finally`; `perf.endSpan` still fires in the finally path even when a widget renderer throws.
* Soft cap fires after 600 consecutive animate frames with a dev warning and suppression until the next non-animate paint resets the counter.

### Font bundling and theme token

* `plugin.css` declares four `@font-face` rules for Roboto Regular/Bold and Roboto Mono Regular/Bold.
* `local(...)` precedes `url(...)` so system-installed copies win.
* `ThemeModel` exposes `font.familyMono` token (input var `--dyni-font-mono`, output var `--dyni-theme-font-family-mono`) with the documented default stack, via entry in `TOKEN_DEFS`.
* `font.family` default stack is prepended with `"Roboto"`.
* License file ships alongside the font files.
* No PLAN10 snapshot contract is broken; the new input var participates in the snapshot signature.

### Engineering invariants

* No JS file in `runtime`, `cluster`, `config`, `shared`, `widgets`, or `plugin.js` exceeds 400 non-empty lines.
* Every new file carries `Module` / `Documentation` / `Depends` headers.
* Every new module registers via the UMD template and appears in `config/components/registry-shared-foundation.js` with entry shape `{ js, css, globalKey, deps }`.
* No new smell violations: `hardcoded-runtime-default`, `redundant-internal-fallback`, `redundant-null-type-guard`, `inline-config-default-duplication`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing`, `mapper-logic-leakage`, `responsive-layout-hard-floor`, `formatter-availability-heuristic`.
* New smell contracts green: placeholder-normalize usage; dash-literal ban with RoutePoints exemption; state-screen precedence ordering.
* `npm run check:all` passes at the end of Phase 9.
* Coverage thresholds (via `test:coverage:check`) remain satisfied.
* PLAN10 perf gates remain satisfied (`perf:check` passes).

### Documentation

* `documentation/TABLEOFCONTENTS.md` indexes every new doc.
* New docs: `shared/state-screens.md`, `shared/placeholder-normalize.md`, `shared/stable-digits.md`, `shared/hide-seconds.md`, `shared/spring-easing.md`, `shared/bundled-fonts.md`.
* Updated docs: each touched `widgets/*.md`, `radial/*-style-guide.md`, `linear/linear-gauge-style-guide.md`, `shared/css-theming.md`, `shared/theme-tokens.md`, `architecture/canvas-dom-surface-adapter.md`, `avnav-api/editable-parameters.md`.
* `QUALITY.md` records the rollout.

---

## Related

* [PLAN10.md](../completed/PLAN10.md) — Theme snapshot and perf contract that this plan must not regress.
* [../conventions/coding-standards.md](../../documentation/conventions/coding-standards.md)
* [../conventions/smell-prevention.md](../../documentation/conventions/smell-prevention.md)
* [../core-principles.md](../../documentation/core-principles.md)
* [../guides/exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md)
* [../architecture/canvas-dom-surface-adapter.md](../../documentation/architecture/canvas-dom-surface-adapter.md)
* [../shared/theme-tokens.md](../../documentation/shared/theme-tokens.md)
* [../widgets/route-points.md](../../documentation/widgets/route-points.md) — existing "No Route" precedent that state-screens generalize.
* [../widgets/ais-target.md](../../documentation/widgets/ais-target.md) — existing three-state precedent (`data` / `placeholder` / `hidden`) that state-screens incorporate.
