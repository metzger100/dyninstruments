# PLAN50 - Fix the confirmed defects from the 2026-09-28 audit

## Status

Active as of 2026-09-28. Baseline: `main` at `d43f3b76a5e733ed1de90f7a9785f15db7a063cf`, clean working tree.

This plan is the single implementation authority for the defects confirmed by the 2026-09-28 read-only audit and
accepted by the owner: ten findings plus seven smaller items. It is a fix-and-delete plan. It adds no checker, no gate
role, no inventory or policy file, no tool module, no production module, and no runtime dependency.

Prescriptive: every Goal, every Hard Constraint (including the exact regatta Sync rule), and every exit condition.
Flexible: local helper names, and where a test lives, within the test-file rules below.

Phases are ordered by user impact. Each phase is one focused change that ends with `npm run check:all` green and lands
as its own commit. Dependencies exist only where two phases edit the same code. All documentation work is collected in
Phase 12, so implementation and documentation are not mixed inside a phase. When every acceptance criterion passes,
delete this file; Git history is the archive.

## Goal

1. A `plugin.mjs` reload inside an open AvNav client registers exactly nine widgets per generation, and the runtime
   stays usable.
2. Cluster `updateFunction`s follow the AvNav host contract: `kind` comes from `this`, the argument holds only live
   store values. Waypoint-dependent nav kinds show the disconnected state when the waypoint server is down. Custom pitch
   and roll store paths take effect. The ineffective map `visible` logic and every `storeKeys` rewrite are gone.
3. A KEY value left over from a previously selected kind can no longer be shown as another kind's value; a missing value
   renders the placeholder.
4. When a gauge value disappears, no pointer, marker, or rotated face is drawn for it. When the value returns, the
   pointer snaps to it.
5. The regatta timer's elapsed time counts from the countdown end, including after remounts and late ticks. Missed beeps
   do not arrive as a burst. Signals keep playing after a remount. The widget does not take clicks in passive
   (layout-edit) mode.
6. Regatta Sync snaps to a signal point when pressed within ±1 s of it, and otherwise to the next lower signal point.
7. RoutePoints re-fits when its rendered texts change and never throws without a shell rect. HTML kinds re-fit after
   `document.fonts.ready`.
8. The course/distance math has known-answer tests.
9. A failed script load logs the failing URL. Each init failure is logged once. A route activation failure is logged
   once and causes no unhandled rejection.
10. The pattern checker no longer reports comparisons as DOM sinks or named function expressions as dead code. The
    documented `X.member || function` and `X.a || X.b` bans are enforced again. The unreachable rule modules and the
    code contortions they caused are gone.
11. Smaller items: the dead `css` registry field is removed end to end; the text-width cache is bounded; there is one
    ±180 angle formatter and it never prints `-0`; the WindLinear pointer takes the short way across ±180; the EditRoute
    total distance is `undefined` instead of too short when a leg cannot be computed; the unreachable `init.js` branch
    is gone; `check:all` runs every test once.
12. Architecture docs, widget docs, the smell catalog, `AGENTS.md`, `quality-gates.md`, and `README.md` describe the
    resulting behaviour.

## Verified Baseline

Facts 1–5 come from the AvNav host source (`viewer/` in the AvNav repository), checked against a local checkout whose
exact version is unknown. All other facts were checked against this repository at the baseline commit.

1. **AvNav host contract.** `viewer/hoc/Dynamic.tsx:39-47`: `computeValues` calls `updateFunction({...data}, storeKeys)`
   with `data = store.getMultiple(storeKeys)`. The argument contains store values only.
2. `viewer/components/WidgetFactory.jsx:205-218`: `DynamicWidget` calls `wprops.updateFunction(data)` as a method, so
   `this` is the widget props object and carries `kind`. It then deletes every `forbiddenEditables` key from the result.
   `forbiddenEditables` (`:187-198`) contains `storeKeys` and, through `allowedDynamicProps` (`:181-186`), `visible`.
3. `viewer/util/EditableParameter.js:459-490`: a KEY editable stores its selected path as `storeKeys[<parameterName>]`,
   so its live value arrives as `values[<parameterName>]`.
4. `viewer/components/EditWidgetDialog.jsx:104-129` saves every parameter that differs from its default, whatever its
   `condition`. `viewer/components/WidgetFactory.jsx:25-38` (`filterByEditables`) re-applies all of them at render. A
   KEY entered for one kind therefore stays subscribed after the kind changes.
5. `viewer/util/pluginmanager.js:515-535`: when the `plugin.mjs` timestamp changes, AvNav disables the old plugin
   (shutdown plus widget deregistration, `:152-167`) and imports `plugin.mjs` again under a base URL ending in
   `/__<timestamp>/`. `viewer/components/WidgetFactory.jsx:509-515` throws `widget <name> already exists` on a duplicate
   name.
6. **Runtime.** `runtime/namespace.js:13` keeps an existing array: `ns.config.clusters = ns.config.clusters || [];`. All
   nine `config/clusters/*.js` files call `config.clusters.push({...})`, and `config/widget-definitions.js:11` sets
   `config.widgetDefinitions = config.clusters`. `config/cluster-routes.js:11` resets `config.clusterRoutes` on every
   run. In `config/bootstrap-manifest.js`, `runtime/namespace.js` (entry line 14) loads before the cluster files (lines
   45-55).
7. Module script IDs are scoped per base-URL generation (`runtime/plugin-bootstrap-core.js:52-71`), so a timestamped
   reload re-executes every bundle or manifest script in the same window. A probe with the real manifest and a
   duplicate-rejecting host showed: generation 1 registers 9 widgets; generation 2 `runInit` rejects with
   `widget dyni_CourseHeading_Instruments already exists`; `runtime/init.js:152-156` then calls `clearGenerationState`,
   which sets `runtime.componentLoader = null` (`:61`); `runtime/cluster/RouteActivationController.js:45-47` then throws
   `runtime.componentLoader must be available` for every widget that renders.
8. `tests/plugin/plugin-module-bootstrap.test.js:312` ("registers widgets again after module shutdown and reload")
   injects a static `widgetDefinitions` mock (`:329`) and never re-runs config scripts.
9. `runtime/init.js:102-104` (`if (state.initStarted) return state.initPromise;`) cannot be reached in production.
   `initStarted` and `initGenerationId` are set together (`:123-124`) and cleared together (`:57-59`), and `:98-100`
   already clears any other started generation. Only the hand-built state in `tests/runtime/init.test.js` ("is
   idempotent once init has started", `state: { initStarted: true, initPromise }`) reaches it.
10. The script loaders reject with the raw DOM `Event`: `runtime/plugin-bootstrap-core.js:100-102`, `plugin.js:48-51`,
    `plugin.mjs:48-51`. `runtime/init.js:152-156` logs `"dyninstruments init failed: " + String(error)` and rethrows;
    `runtime/plugin-bootstrap-core.js:276-279` logs the same error again. A failed script load reaches the log as
    `[object Event]`. `plugin.js` routes `logger.error` to `api.log`; `plugin.mjs` passes `logger: console`.
11. `runtime/cluster/RouteActivationController.js:272-274` defines
    `reportActivationError: function (error) { throw error; }`. `cluster/ClusterWidget.js:206-208` (synchronous catch)
    and `:222-225` (promise `.catch`) call it, so failures escape as exceptions or unhandled rejections. While a cold
    load is pending, each commit attaches another `.then` to the same promise. `runtime/component-loader.js:175` evicts
    a failed load, so the next render fetches it again. `tools/quality-policy/project-pattern-context.json` holds two
    exact-line `catchFallbackExceptions` records for `cluster/ClusterWidget.js`.
12. `runtime/surface/HtmlSurfaceController.js:301-303`: the `document.fonts.ready` refresh increments `fontMetricsEpoch`
    and calls `createRendererPayload(state, latestPayload, false, 0)`, so `layoutChanged` is `false`. Its test
    (`tests/runtime/surface/HtmlSurfaceController.implementsCommittedRendererLifecycleIncluding.test.js:198`) asserts
    the epoch but not `layoutChanged`.
13. **Cluster config and mappers.** `config/clusters/environment.js:35-36` reads `kind` from `this` (`source.kind`) and
    copies KEY aliases (`out.depth = out.depthKey`, `out.temp = out.tempKey`). `config/clusters/nav.js:341`,
    `config/clusters/map.js:121`, and `config/clusters/vessel.js:287` read only `values.kind`, so they always use their
    defaults `"wpEta"`, `"centerDisplay"`, and `"voltage"`.
14. `config/clusters/nav.js:343` sets `out.disconnect = true` for `dst`, `positionWp`, `xteDisplay`, and
    `xteDisplayLinear` when `values.wpServer === false` (store key `nav.wp.server`, `:105`). Consumers read
    `p.disconnect === true` at `cluster/mappers/NavMapper.js:47`, `:175`, `:189`, and `:229`.
15. `config/clusters/vessel.js:62-73` declares the KEY params `pitchKey` and `rollKey`. `:27-33` pins `storeKeys.pitch`
    and `storeKeys.roll` to the default paths, and `:308-322` only rewrites `out.storeKeys`.
    `cluster/mappers/VesselMapper.js:124` and `:136` read `p.pitch` and `p.roll`.
16. `config/clusters/map.js:122-126` sets or deletes `out.visible`; the host strips `visible` (fact 2).
    `config/clusters/nav.js` also deletes `out.visible`.
17. Dead `storeKeys` rewrites: `config/clusters/environment.js:38-55`, `:62-66`, `:75-79`;
    `config/clusters/vessel.js:289-322`; `config/clusters/default.js:258-266`.
18. The tests call `updateFunction` with `kind` (and sometimes `storeKeys` or paths) inside the values argument:
    `tests/config/clusters/nav.test.js:352-397`, `map.test.js:97-106`, `vessel.test.js:166-196`,
    `environment.test.js:116-215`, `default.test.js:168-175`. `nav.test.js` is exactly 400 lines.
19. `cluster/mappers/ClusterMapperToolkit.js:60`: `out()` sets `o.value` only when `v !== undefined`.
    `runtime/cluster/RouteActivationPayloadBuilder.js:138-141` merges `Object.assign({}, mapperProps, mappedProps)`, so
    a raw `value` prop survives when the mapper omits it. `cluster/mappers/EnvironmentMapper.js:148` maps depth via
    `out(p.depth, …)`. A host-shaped probe (pressure KEY configured, kind switched to depth, depth missing) produced
    `value = 101325` with `formatDistance`.
20. The smell-catalog row "Dynamic key stale state" (`documentation/conventions/smell-prevention.md:32`) and
    `documentation/conventions/smell-fix-playbooks.md:26` prescribe the dead mechanism.
    `documentation/avnav-api/editable-parameters.md:116` and `documentation/avnav-api/plugin-lifecycle.md:35-38` already
    state the correct host contract.
21. **Canvas.** `shared/widget-kits/anim/SpringEasing.js:173-187`: once `motion.ready` is true, a non-finite target
    returns `motion.spring.advance(nowMs)`, i.e. the last position, even with easing off.
    `shared/widget-kits/radial/SemicircleRadialEngine.js:266-276` and `:325` draw the pointer whenever the eased angle
    is finite. The same pattern is used in `WindRadialWidget.js`, `CompassRadialWidget.js`, and `LinearGaugeEngine.js`.
    Before commit `dd4340c4`, the semicircle pointer was drawn only for a finite current angle. No test calls
    `resolve()` with a finite and then a non-finite target; `tests/shared/anim/SpringEasing.test.js:45` covers only the
    spring's `setTarget(NaN)`.
22. `shared/widget-kits/text/CanvasTextFitting.js:30-39` and `:65-77` keep a per-context width cache keyed
    `ctx.font + "\n" + text` that is never evicted.
    `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js:15-30` keeps a second per-frame `frameWidthCache`
    with the same purpose.
23. `widgets/linear/WindLinearWidget/WindLinearWidget.js` creates its renderer with `axisMode: "centered180"` and no
    `springWrap`. `shared/widget-kits/linear/LinearGaugeEngine.js:82-85` then creates an unwrapped spring.
    `CompassLinearWidget.js:131` and `WindRadialWidget.js:24` use wrap 360.
24. `shared/widget-kits/value/ValueMath.js:323-335` (`formatAngle180`) normalizes before rounding and prints a sign for
    any negative input: -0.4 gives `"-0"`, 179.6 gives `"180"`, -179.6 gives `"-180"`.
    `cluster/mappers/ClusterMapperToolkit.js:35-55` (`makeAngleFormatter`, non-direction branch) rounds first, prints no
    sign for zero, and maps 180 to -180. The wind gauges use `formatAngle180` (`WindLinearWidget.js:69`,
    `WindRadialWidget.js:69`); the numeric wind kinds use `makeAngleFormatter` (`WindMapper.js:24`).
25. **HTML widgets.** Regatta elapsed time: `shared/widget-kits/vessel/RegattaTimerModel.js:189-198`
    `beginElapsed(nowMs, …)` sets `elapsedStartMs = nowMs`. The natural transition (`:224-226`) passes the tick time;
    restore (`:364-366`) passes `Date.now()`. The catch-up loop (`:211-221`) emits every missed signal in one tick.
26. Regatta audio: `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js:150-152` destroys the audio
    engine on every mount and detach, and `shared/widget-kits/vessel/RegattaTimerAudio.js:116-134` closes its
    AudioContext. The replacement engine (`:327`) has no context; only the START handler calls `ensureContext()`
    (`:253-255`); `playTone` returns early without a context (`RegattaTimerAudio.js:79-81`). The harness
    `tests/cluster/rendering/RegattaTimerTextHtmlWidget.harness.js:66-77` shares one mock engine whose `playTone` is
    always a `vi.fn()`.
27. Regatta clicks: `RegattaTimerTextHtmlWidget.js:236-273` rebinds the click handler only when the wrapper element
    changes or no handler exists. The handler calls `preventDefault()` and `stopPropagation()`.
28. `shared/widget-kits/html/HtmlDomPatchUtils.js:91-97` detects a jsdom user agent, and `:155-159` then assigns
    `innerHTML`, creating a new wrapper on every patch. Browsers take the in-place sync path, which keeps the wrapper. A
    document created with `document.implementation.createHTMLDocument()` has no `defaultView`, so it takes the browser
    path under test.
29. The regatta remount test
    `tests/cluster/rendering/RegattaTimerTextHtmlWidget.resolvesRouteMetadataPreloadAssets.test.js:207-235` (destroy at
    299 s, remount at 302 s) asserts only the elapsed phase. The file has 329 lines; `RegattaTimerModel.test.js`
    has 279.
30. Regatta Sync: `RegattaTimerModel.js:16` `SYNC_GRACE_SECONDS = 1`. `:53-74` builds the signal points
    `[duration, duration − 1, 4, 1, 0]` minutes, which is 6/5/4/1/0 for a 6-minute duration. `:311-317` picks the first
    point with `remaining − point > 1`. The countdown display rounds up (`:154`).
    `tests/shared/vessel/RegattaTimerModel.test.js:95-106` asserts that a second sync at exactly 04:00 goes to 01:00.
    `documentation/widgets/regatta-timer.md:75` documents "strictly below".
31. RoutePoints: `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js:136-151` computes the fit only
    when `layoutChanged || !lastFit`. `shared/widget-kits/nav/RoutePointsRenderModel.js:98-124` builds the resize
    signature from counts, flags, and sizes only. `shared/widget-kits/nav/RoutePointsMarkup.js:89` prefers
    `rowFit.infoText` over the fresh `row.infoText`. `shared/widget-kits/nav/RoutePointsHtmlFit.js:156-158` returns
    `null` without a shell rect, and `RoutePointsMarkup.js:79` then indexes an empty `rowFits`. The EditRoute and AIS
    signatures include their texts.
32. **Nav math.** `shared/widget-kits/nav/CenterDisplayMath.js:111-118` (`computeCourseDistance`) is plugin-owned
    great-circle and rhumb-line code with `EARTH_RADIUS_M = 6371000` (`:14`).
    `tests/shared/nav/CenterDisplayMath.test.js:31-47` asserts only ranges and that the two modes differ. A mutation
    reversing the great-circle bearing by 180° passed the whole behavioural suite.
33. `cluster/viewmodels/EditRouteViewModel.js:47-54` counts an unresolvable leg as 0, and `:85-89` returns 0 when the
    leg sum throws. This path runs only when the route has no usable `computeLength`.
    `tests/cluster/viewmodels/EditRouteViewModel.test.js:146-216` and `:240-270` lock that in (the file has 273 lines).
34. **Dead `css` registry field.** All 155 component entries in `config/components/*.js` set `css: undefined`, and
    `types/globals/cluster-config.d.ts:23` types the field as `css?: undefined`. Consumers:
    - runtime: `runtime/component-loader.js:23`, `:32`, `:156`; `runtime/plugin-bootstrap-core.js:122-145`, `:152-167`,
      `:247-249`;
    - types: `types/bootstrap.d.ts:23`, `types/globals/runtime.d.ts:19`;
    - tooling and tests: `tools/component-registry-validation.mjs:27`, the `tests/runtime/component-loader.*` fixtures;
    - docs: `documentation/architecture/asset-system.md:40`, `documentation/architecture/component-system.md:124`.

    Widget CSS loads through `shadowCss` (`config/components/registry-widgets-nav.js`, `registry-widgets-vessel.js`).
    `tests/config/cluster-routes.test.js:157` lists `css` as a forbidden route field; that is unrelated and stays.

35. **Pattern checker.** `tools/portable-core/generic-rule-contracts.mjs:47` matches `\[[^\]]+\]\s*(?:\+?=)`, which also
    matches `===` and `==`. Commit `2137a925` rewrote `shared/widget-kits/nav/AisTargetHtmlFit.js:104` from a direct
    `aisTokens[colorRole]` lookup to `Object.entries(aisTokens).find(...)` to get past it.
36. `tools/portable-core/generic-rule-structural.mjs:100-120` (`runDeadCode`) reports every `function name(` that is not
    preceded by `=` or `export default`. In commit `2137a925` five named function expressions became anonymous:
    `runtime/init.js` (`shutdownDyniPlugin`), `shared/widget-kits/html/HtmlWidgetLifecycle.js` (`mount`,
    `layoutSignature`), `shared/widget-kits/layout/LayoutSizingHelpers.js` (`createInsetContentRect`,
    `computeMetricTileSpacing`).
37. `tools/check-patterns/rules-legacy-support.mjs:124` exports `runPrematureLegacySupportRule`, which uses the
    `X.member || function(` regex (`:7`) and the `X.a || X.b` regex (`:9`). Nothing imports it:
    `tools/check-patterns/project/rules-legacy-support-project-defs.mjs:5` imports only the two other rules. The active
    `premature-legacy-support` (`generic-rule-structural.mjs:37-49`) inspects declaration names only.
    `AGENTS.md:188-189` and `documentation/conventions/smell-prevention.md:67-68` claim that both patterns are enforced.
38. `tools/check-patterns/rules-duplicates.mjs` (302 lines) and `tools/check-patterns/rules-unsafe-sink.mjs` (144) have
    no importers. `tools/check-patterns/duplicate-utils.mjs` (261) is imported only by `rules-duplicates.mjs`. All three
    are listed in `tsconfig.tools.json` and nowhere else.
39. **Gate.** The gate scripts:
    - `package.json`: `check:all` is `npm run check:core && npm run test:coverage:check`.
    - `check:core` runs the orchestrator roles, including `product-contracts` (`npm run test:contract`) and `test-split`
      (`npm run test:node && npm run test:dom`) (`tools/quality-policy/project-profile.json:42-43`).
    - `test:coverage` then runs every Vitest project again under V8.
    - The orchestrator accepts any subset of roles in canonical order
      (`tools/portable-core/gate-orchestrator.mjs:39-54`).
    - The profile maps the `coverage` role to `npm run test:coverage:check` (`project-profile.json:48`).
    - `tests/tools/package-scripts.test.js:55-63` and `:103-123` pin the current strings.
    - `README.md:286-289` and `documentation/conventions/quality-gates.md:27` and `:62` describe the duplication as
      intentional.
40. **Process.** Adding or removing a test file changes `tools/quality-policy/test-inventory.json` and
    `tsconfig.tests.json` (via `npm run inventory:write`) and the pinned count in
    `tests/tools/verified-baseline.test.js:82` (`toHaveLength(556)`) and
    `documentation/conventions/quality-gates.md:156` (`556 entries`). Adding or removing a tools module changes
    `tsconfig.tools.json`.
41. The complexity budget (`tools/quality-policy/complexity-budget.mjs`, ledger
    `tools/quality-policy/complexity-baseline.json`) requires every active entry to equal its current finding exactly. A
    tracked function that shrinks needs its entry lowered in the same change; a deleted function needs its entry
    removed; no entry may be raised.

## Hard Constraints

- Runtime stays raw UMD/IIFE scripts: no bundler, no ES modules in runtime files, no new runtime dependency. The
  dependency direction in `ARCHITECTURE.md` holds. AvNav objects are accessed only from `runtime/`, `plugin.js`, and
  `plugin.mjs`.
- Do not change:
  - editable parameter names, types, defaults, or conditions (saved and bundled layouts depend on them);
  - the cluster route table, widget names, theme tokens, or `plugin.css`;
  - `runtime/TemporaryHostActionBridge*.js`;
  - `HostCommitController` scheduling;
  - the regatta signal points (fact 30).
- Add no production file. If a phase appears to need one, stop and amend this plan first.
- Add no checker, gate role, inventory, policy file, or tool module. Tooling work in this plan only fixes or deletes.
- `updateFunction` tests use the host call shape: `def.updateFunction.call(widgetProps, storeValues)`. `storeValues`
  never contains `kind` or `storeKeys`.
- Regatta Sync rule (exact). Let `remaining` be the unrounded seconds left. The target is the highest signal point `p`
  with `p <= remaining + 1`. So within ±1 s of a point, Sync snaps to that point; otherwise it snaps to the next lower
  point. A target of 0 starts elapsed time at the press. The 1-second tolerance is a single named constant.
- Tests:
  - Extend existing test files. Create a new test file only when the target file would exceed 400 non-empty lines; in
    that case run `npm run inventory:write` and update the pinned counts from fact 40 in the same phase.
  - `nav.test.js` is at 400 lines, so rewrite its `updateFunction` cases in place.
  - A test that covers a fix in this plan loads the real pure module (`ValueMath`, `SpringEasing`, `CenterDisplayMath`,
    `RegattaTimerModel`, `PlaceholderNormalize`, `ClusterMapperToolkit`) instead of an inline re-implementation.
- Follow the complexity budget as described in fact 41. `catchFallbackExceptions` records change only to follow moved
  lines or to drop records for deleted catches; add no new records.
- No suppression comments, no lowered thresholds, no skipped or focused tests.
- Every touched JS, `.d.ts`, and Markdown file outside `exec-plans/` stays at or below 400 non-empty lines.
- No plan number or phase number appears outside `exec-plans/`: not in code, test names, file names, or docs.

## Implementation Order

### Phase 1 - Reset the cluster list per bootstrap generation

Intent: a `plugin.mjs` reload registers exactly the new generation's nine widgets.

Depends on: nothing.

Deliverables:

- `runtime/namespace.js:13`: `ns.config.clusters = [];`, matching `config/cluster-routes.js:11`.
- Regression test in `tests/runtime/namespace.test.js`: execute the real bootstrap manifest scripts from
  `runtime/namespace.js` through `config/widget-definitions.js` twice in one context. Assert that after each run
  `config.widgetDefinitions` has 9 entries with 9 unique `def.name` values.

Exit conditions:

- The new test fails on the baseline and passes after the change.
- `npm run check:all` passes.

### Phase 2 - Align cluster `updateFunction`s with the host contract

Intent: read `kind` from `this`, copy the pitch and roll KEY aliases, and delete `visible` handling the host discards.

Depends on: nothing.

Deliverables:

- `config/clusters/nav.js`, `vessel.js`: read `kind` from `this` exactly like `environment.js:35-36`; drop every
  `values.kind` read.
- `config/clusters/environment.js`: drop `values.kind` from the `kind` expression and keep `source.kind`.
- `config/clusters/vessel.js`: for kind `pitch`, copy `out.pitchKey` to `out.pitch` when the key is present; the same
  for `roll`/`rollKey`. Follow the `environment.js` `depthKey` pattern.
- `config/clusters/nav.js`, `map.js`: delete the `visible` set and delete logic. If `map.js`'s `updateFunction` no
  longer does anything, delete it (`composeUpdates` skips absent functions, `runtime/widget-registrar.js:35-56`).
- Tests (`tests/config/clusters/{nav,map,vessel,environment}.test.js`): rewrite every `updateFunction` call to the host
  shape. Add:
  - nav: `.call({ kind: "dst" }, { wpServer: false })` sets `disconnect: true`, and `.call({ kind: "wpEta" }, …)` does
    not.
  - vessel: `.call({ kind: "pitch" }, { pitch: 0.01, pitchKey: 0.2 })` returns `pitch: 0.2`; the same for roll.
  - map: delete the `visible` cases.

Exit conditions:

- `rg -n "values\.kind" config/clusters` returns nothing.
- The new nav and vessel tests fail on the baseline and pass after the change.
- `npm run check:all` passes.

### Phase 3 - Stop stale KEY values from leaking, and delete the dead `storeKeys` rewrites

Intent: fix the leak at the producer, and delete the mechanism that never worked.

Depends on: Phase 2 (same files and tests).

Deliverables:

- `cluster/mappers/ClusterMapperToolkit.js` `out()`: always assign `o.value = v`, so a mapped `undefined` overrides the
  raw prop in the payload merge (fact 19). Leave the other fields unchanged.
- If a mapper test shows a kind relying on raw `value` passing through, make that mapper pass the value explicitly. Do
  not bring back the omission.
- Delete every `out.storeKeys` rewrite in `config/clusters/environment.js`, `vessel.js`, and `default.js`, together with
  the tests that assert them. Delete `default.js`'s `updateFunction` if nothing is left in it.
- Tests:
  - `ClusterMapperToolkit` test: `"value" in out(undefined, …)` is `true`. `toEqual` ignores undefined properties, so
    assert the key explicitly.
  - `EnvironmentMapper` test: kind `depth` with props `{ value: 101325 }` and no `depth` gives an own `value` that is
    `undefined`.

Exit conditions:

- `rg -n "storeKeys" config/clusters/*.js` shows only the static `storeKeys: { … }` declarations.
- `npm run check:all` passes.

### Phase 4 - Missing values clear gauge pointers

Intent: when the target is missing, return `NaN` and let the pointer snap when data returns.

Depends on: nothing.

Deliverables:

- `shared/widget-kits/anim/SpringEasing.js` `resolve()`: for a non-finite target, set `motion.ready = false` and return
  `NaN`.
- Check that every caller skips drawing on `NaN`: the semicircle pointer, the WindRadial pointer and markers, the
  CompassRadial face rotation and marker, and the `LinearGaugeEngine` pointer and axis spring. Any caller that does not
  must skip; that is the pre-spring behaviour.
- Tests:
  - `tests/shared/anim/SpringEasing.test.js`: `resolve(c, 10, true, 0)`, then `resolve(c, undefined, true, 16)` returns
    `NaN`, then `resolve(c, 20, true, 32)` returns `20` (snap). Assert the same with easing off.
  - One `SemicircleRadialEngine` test with the real `SpringEasing`: after the value becomes `undefined`,
    `drawPointerAtRim` is not called.

Exit conditions:

- The existing compass stale-marker test stays green.
- `npm run check:all` passes.

### Phase 5 - Regatta timer lifecycle

Intent: anchor elapsed time to the gun, drop late beep bursts, keep audio across remounts, and rebind clicks when the
interaction mode changes.

Depends on: nothing.

Deliverables:

- `RegattaTimerModel.js`:
  - The natural transition (`:224-226`) and restore (`:364-366`) call `beginElapsed(endTimeMs, …)`. `sync()` keeps using
    `now`.
  - Missed-signal policy: emit per-second and per-minute catch-up signals only if the tick skipped at most 2 countdown
    seconds.
  - Emit the start signal only if the tick that observes the end is at most 2 s late.
- `RegattaTimerAudio.js`:
  - Keep one AudioContext per page, held in the module factory scope rather than per engine.
  - `destroy()` no longer closes the shared context.
  - `ensureContext()` creates it on first use and resumes it when it is suspended.
- `RegattaTimerTextHtmlWidget.js`:
  - Call `audioEngine.ensureContext()` in the START, SYNC, and RESET handlers.
  - Remember the `interactionState` the click handler was bound for, and rebind when it changes.
- Tests:
  - Model: a restore from a snapshot whose `endTimeMs` lies 120 s in the past shows elapsed `02:00`. A single tick
    delayed by 40 s emits no burst of `high`/`low` signals and shows the correct elapsed time.
  - Widget: extend the remount test (fact 29) to assert `timeText() === "00:02"`.
  - Harness: `createAudioEngine()` returns a fresh mock per call; assert that a tone plays after a remount.
  - Passive mode, on a root from `document.implementation.createHTMLDocument()`: switching from `dispatch` to `passive`
    makes a click on START leave the phase unchanged and lets the event propagate.

Exit conditions:

- Each new test fails on the baseline and passes after the change.
- `npm run check:all` passes.

### Phase 6 - Regatta Sync snaps within ±1 s

Intent: implement the exact Sync rule from Hard Constraints.

Depends on: Phase 5 (same model file).

Deliverables:

- `RegattaTimerModel.js` `sync()`: target = the highest signal point `p` with `p <= remaining + 1`.
- `tests/shared/vessel/RegattaTimerModel.test.js`: replace the test at `:95-106` with a table test on a 6-minute
  duration. Remaining time before Sync, and the expected display afterwards:
  - 301.5 s → `05:00`
  - 301.0 s → `05:00`
  - 300.8 s → `05:00`
  - 299.2 s → `05:00`
  - 299.0 s → `05:00`
  - 298.9 s → `04:00`
  - 240.5 s → `04:00`
  - 239.4 s → `04:00`
  - 150.0 s → `01:00`
  - 60.6 s → `01:00`
  - 59.2 s → `01:00`
  - 58.5 s → elapsed phase

  Add one 5-minute case: 240.3 s → `04:00`.

Exit conditions:

- The table test fails on the baseline for 299.2, 240.5, 239.4, 60.6, and 59.2 s, and passes after the change.
- `npm run check:all` passes.

### Phase 7 - RoutePoints re-fit and font-load re-fit

Intent: re-fit when rendered text changes or fonts finish loading, and render safely without a fit.

Depends on: nothing.

Deliverables:

- `shared/widget-kits/nav/RoutePointsRenderModel.js`: append the rendered texts (route name, point names, info texts) to
  the resize signature parts, as EditRoute does.
- `shared/widget-kits/nav/RoutePointsMarkup.js`: when `rowFits[i]` is missing, render the row with the model's
  `infoText` and no fit styles.
- `runtime/surface/HtmlSurfaceController.js:303`: the `fonts.ready` refresh passes `layoutChanged = true`.
- Every HTML fit module that caches its result (for example `ActiveRouteHtmlFit`, `MapZoomHtmlFit`,
  `RegattaTimerHtmlFit`): include `fontMetricsEpoch` in the cache key, as `AlarmHtmlFit` does. Check where each cache
  key is built before changing it.
- Tests:
  - `RoutePointsRenderModel`: same point count with changed coordinates gives different signature parts.
  - `RoutePointsMarkup`: a fit with empty `rowFits` renders without throwing and shows the model's info text.
  - Extend the controller test from fact 12 to assert `layoutChanged: true` on the refresh update.

Exit conditions:

- `npm run check:all` passes, and the scaling contract
  `tests/contract/route-points-render-model-scaling-contract.test.js` stays green.

### Phase 8 - Known-answer tests for the course/distance math

Intent: pin the navigation math to independently known values.

Depends on: nothing.

Deliverables: in `tests/shared/nav/CenterDisplayMath.test.js`, add both modes, with course tolerance 0.05° and distance
tolerance 0.1 %:

- (0, 0) → (0, 1): course 90°, distance 111 195 m.
- (0, 0) → (1, 0): course 0°.
- (1, 0) → (0, 0): course 180°.
- (0, 179.5) → (0, −179.5): course 90°, distance 111 195 m (crossing the antimeridian, not the long way round).
- (0, 0) → (1, 1): course about 45°.

Exit conditions:

- Each course assertion fails when the great-circle bearing is temporarily reversed with `atan2(-y, -x)` (checked
  locally, not committed), and passes on the real code.
- If a known-answer assertion fails on the real code, fix the production bug in this phase and note it here.
- `npm run check:all` passes.

### Phase 9 - Diagnosable load and activation errors

Intent: every failure names its cause and is reported exactly once.

Depends on: nothing. The CSS loader is deleted in Phase 11a, so this phase changes script loaders only.

Deliverables:

- `plugin.js`, `plugin.mjs`, `runtime/plugin-bootstrap-core.js` script loaders:
  `reject(new Error("dyninstruments: failed to load " + src))`.
- `plugin.mjs`: route `logger.error` to `api.log`, as `plugin.js` does.
- `runtime/init.js:152-156`: remove the log call and keep `clearGenerationState` plus the rethrow. The bootstrap core's
  `start()` catch becomes the single log owner.
- `runtime/cluster/RouteActivationController.js` `reportActivationError`: log one host-log line (message plus route id
  when known) and return.
- `cluster/ClusterWidget.js`: attach `.then(reconcile)` only once per pending activation promise, and forget it when it
  settles.
- Update the two `catchFallbackExceptions` records for `cluster/ClusterWidget.js` to their new lines, with a reason that
  describes the real reporter.
- Tests:
  - A bootstrap test with a failing script request asserts that the logged text contains the script URL and appears
    once.
  - A ClusterWidget test with a rejecting activation asserts one log line, no throw, and no unhandled rejection.
  - Three commits sharing one pending promise run `reconcile` once.

Exit conditions:

- `rg -n "reject\(error\)" plugin.js plugin.mjs runtime/plugin-bootstrap-core.js` returns nothing.
- `npm run check:all` passes.

### Phase 10 - Fix the pattern-rule port regressions

Intent: remove the false positives, restore the documented bans, and delete unreachable rule code.

Depends on: nothing.

Deliverables:

- `tools/portable-core/generic-rule-contracts.mjs:47`: make the assignment operator `(?:\+?=)(?!=)`.
- `tools/portable-core/generic-rule-structural.mjs` `runDeadCode`: treat `function name(` as an expression, and skip it,
  when the preceding non-space token is `return`, `(`, `,`, `:`, `?`, `=`, `&&`, `||`, `!`, or `[`.
- `premature-legacy-support`: restore detection of `X.member || function(` and `X.a || X.b` by reusing the existing
  `runPrematureLegacySupportRule` (fact 37). Keep exactly one implementation per rule id.
  - Check first whether a project rule can override a generic rule id; `tools/check-patterns/project/rules.mjs` already
    filters one generic definition.
  - If it can, register the existing function as the project definition.
  - Otherwise, move its two regexes and its allowlist into the generic branch and delete the rest of the function.
  - Fix any production finding in code.
- Delete `tools/check-patterns/rules-duplicates.mjs`, `duplicate-utils.mjs`, and `rules-unsafe-sink.mjs`, their
  `tsconfig.tools.json` entries, and any complexity-ledger entries for their functions.
- Delete `catchFallbackExceptions` records that no longer match a reported catch. Verify each one by removing it and
  confirming `npm run check:patterns` stays green.
- Revert the contortions:
  - Restore the direct `aisTokens[colorRole]` lookup in `AisTargetHtmlFit.js`.
  - Restore the five function names from fact 36.
- Rule tests:
  - Negative fixtures, not reported: `map[key] === 1` next to string concatenation and an `on…` word;
    `return function name() {}`.
  - Positive fixtures, reported: `x.a || function () {}`; `x.a || x.b`.

Exit conditions:

- `npm run check:patterns` reports zero findings with the reverted code.
- The rule tests pass.
- `npm run check:all` passes.

### Phase 11 - Smaller confirmed items

Intent: close the smaller confirmed items, one commit each.

Depends on: 11a on Phase 9; 11c on Phase 3; 11f on Phase 9.

Deliverables:

- **11a Dead `css` field.**
  - Remove `css: undefined` from all 155 registry entries.
  - Remove the CSS branch and the `runtime.loadCssOnce` requirement from `runtime/component-loader.js`.
  - Remove `loadCssOnceById`, `loadCssOnceByScopedId`, and `ns.runtime.loadCssOnce` from
    `runtime/plugin-bootstrap-core.js` and from `types/bootstrap.d.ts`, `types/globals/runtime.d.ts`, and
    `types/globals/cluster-config.d.ts`.
  - Remove the `css` resource collection from `tools/component-registry-validation.mjs`.
  - Drop `css: undefined` from the component-loader test fixtures.
  - Exit: `rg -n "css: undefined|loadCssOnce" --glob '!node_modules' --glob '!exec-plans'` lists only the two docs that
    Phase 12 updates.
- **11b Bounded text-width cache.**
  - Cap the per-context cache in `CanvasTextFitting.js` at 2048 entries, and clear it when it overflows.
  - Delete the `CenterDisplayTextWidget` `frameWidthCache` if it only duplicates the shared cache.
  - Test: measuring more than 2048 distinct texts keeps the cache at or below the cap and still returns correct widths.
- **11c One ±180 angle formatter.**
  - `ValueMath.formatAngle180` adopts `makeAngleFormatter`'s semantics: round first, sign only for non-zero, 180 → -180.
  - `makeAngleFormatter`'s non-direction branch delegates to it.
  - Table test in the `ValueMath` tests, with and without leading zero:
    - -0.4 → `0`
    - 0.4 → `0`
    - 179.6 → `-180`
    - 180 → `-180`
    - -179.6 → `-180`
    - 359.6 → `0`
    - 181 → `-179`
  - Replace the inline `formatAngle180` re-implementation in
    `tests/widgets/linear/WindLinearWidget.configuresCentered180DualWindDisplay.test.js` with the real `ValueMath`.
- **11d WindLinear short path.**
  - Give the WindLinear renderer `springWrap: 360`.
  - In `LinearGaugeEngine`, normalize the eased pointer value into [-180, 180) before mapping when `axisMode` is
    `"centered180"`. Use the canonical `norm180` owner listed in `documentation/conventions/shared-helpers.md`.
  - Test: AWA 179 → -179 with easing keeps every intermediate pointer value at |x| ≥ 170.
- **11e EditRoute total distance.**
  - An unresolvable leg makes the leg sum `undefined`, and a throwing leg sum returns `undefined`. A one-point route
    stays 0.
  - Update the assertions from fact 33 that expect partial sums or 0 for unresolvable legs to `toBeUndefined()`. Keep
    the valid-leg sums.
  - Check that `EditRouteRenderModel` renders the placeholder for `undefined`.
- **11f Unreachable init branch.**
  - Delete `runtime/init.js:102-104`.
  - Replace the hand-built-state test with a real one: two `runInit()` calls in the same generation return the same
    promise.
- **11g One test run in `check:all`.**
  - `package.json` `check:all`:
    `node tools/portable-core/gate-orchestrator.mjs --roles standard,suppressions,typing,packaging,focus,smells,complexity,scaling,documentation,file-size,coverage`.
  - `check:core`, the pre-push hook, and `.github/workflows/quality.yml` stay unchanged.
  - Update `tests/tools/package-scripts.test.js` so it pins the new contract: `check:all` selects every role except
    `product-contracts` and `test-split`, in canonical order, ending with `coverage`, and every test project still runs
    once through `test:coverage`.

Exit conditions:

- Each item's tests pass.
- `npm run check:all` passes after each item.

### Phase 12 - Documentation and README

Intent: make every document describe the resulting behaviour.

Depends on: Phases 1-11.

Deliverables:

- `documentation/widgets/regatta-timer.md`: the Sync rule (±1 s snap, otherwise next lower point, 6/5/4/1/0 for a
  6-minute duration); elapsed time anchored to the countdown end; the missed-signal policy; the audio context lifetime.
- `documentation/avnav-api/plugin-lifecycle.md` and `editable-parameters.md`: the `updateFunction` host contract,
  including KEY alias copying for pitch and roll. `documentation/avnav-api/core-key-catalog.md`: the pitch/roll store
  path override text matches the behaviour.
- `documentation/conventions/smell-prevention.md`:
  - Replace the "Dynamic key stale state" row with the real invariant ("mapper output always carries `value`"), with the
    Phase 3 tests as enforcement.
  - Rows 67-68 name the restored enforcement.
- `documentation/conventions/smell-fix-playbooks.md:26`: remove the `storeKeys` step.
- `documentation/shared/spring-easing.md`: a missing target returns `NaN` and resets the motion.
- `documentation/architecture/html-renderer-lifecycle.md`: the `fonts.ready` refresh re-fits with `layoutChanged`.
  `documentation/widgets/route-points.md`: the signature includes the rendered texts.
- `documentation/architecture/component-system.md:124` and `asset-system.md:40`: remove the `css` registry field.
- `documentation/conventions/quality-gates.md`:
  - The `check:all` row (`:62`) and the duplication paragraph (`:27`).
  - The pinned test-inventory count if a test file was added.
- `AGENTS.md` §8 and §9: the `check:all` composition. §10 needs no change once Phase 10 restores enforcement.
- `CONTRIBUTING.md`: check every `check:all` mention.
- `README.md` Development section (`:276-289`): describe `check:all` as every non-test role followed by the coverage
  run, and remove "this duplication with `check:core` is intentional".

Exit conditions:

- `npm run docs:check` passes.
- `npm run check:all` passes.
- `README.md` has been reviewed against the `AGENTS.md` §11 categories, in particular 5 (configuration) and 7
  (development workflow).

## User-Facing Documentation Impact

`README.md` changes are required only in the Development section, for the `check:all` composition (Phase 12). No README
change is needed for:

- installation, theming, layouts, or kind availability: nothing changes there;
- the pitch/roll store paths: README Configuration step 6 already describes KEY overrides, which now work as described;
- the regatta Sync rule: README does not describe Sync, and `documentation/widgets/regatta-timer.md` owns it.

## Acceptance Criteria

- **Runtime:**
  - Running the bootstrap manifest scripts twice in one window yields 9 widget definitions each time (Phase 1).
  - Load failures log their URL once (Phase 9).
  - Activation failures log once with no unhandled rejection (Phase 9).
  - `init.js` has no unreachable branch (Phase 11f).
- **Cluster config:**
  - No `values.kind` reads remain (Phase 2).
  - Nav waypoint kinds get `disconnect: true` when the waypoint server is down (Phase 2).
  - Custom pitch and roll paths reach the mapper (Phase 2).
  - No `storeKeys` rewrites remain (Phase 3).
  - Mapper output always carries `value` (Phase 3).
  - All `updateFunction` tests use the host call shape (Phases 2-3).
- **Canvas:**
  - A missing value draws no pointer and resets the spring (Phase 4).
  - The text-width cache is bounded (Phase 11b).
  - WindLinear eases across ±180 the short way (Phase 11d).
  - One ±180 formatter, never printing `-0` (Phase 11c).
- **Regatta:**
  - Elapsed time counts from the countdown end after late ticks and remounts (Phase 5).
  - No late beep burst (Phase 5).
  - Tones play after a remount (Phase 5).
  - Passive mode does not intercept clicks (Phase 5).
  - The Sync table in Phase 6 passes.
- **RoutePoints and HTML kinds:**
  - Changed texts re-fit (Phase 7).
  - A missing fit does not throw (Phase 7).
  - `fonts.ready` re-fits (Phase 7).
- **Nav math:**
  - Known-answer course and distance tests pass and catch a reversed bearing (Phase 8).
  - The EditRoute total is `undefined` for unresolvable legs (Phase 11e).
- **Tooling:**
  - The sink rule ignores comparisons, and `dead-code` ignores named function expressions (Phase 10).
  - `X.member || function` and `X.a || X.b` are reported (Phase 10).
  - The three dead rule modules are deleted (Phase 10).
  - The Phase 10 code contortions are reverted (Phase 10).
  - The `css` field is gone end to end (Phase 11a).
  - `check:all` runs each test once (Phase 11g).
- **Docs:**
  - Every Phase 12 deliverable is done.
  - No plan or phase citation outside `exec-plans/` (`npm run check:smells`).
- **Gate:** `npm run check:all` passes at the end of every phase.

## Out of Scope

These were considered during the audit and deliberately left out:

- Removing the jsdom fast path in `HtmlDomPatchUtils`. Phase 5 tests the real path through `createHTMLDocument`; a
  repo-wide switch is a separate decision.
- `sessionStorage` persistence for the regatta timer.
- A ResizeObserver on the HTML surface.
- Changes to `TemporaryHostActionBridge`.
- Replacing the gate orchestrator.
- Glob-based `tsconfig` inventories.
- A campaign to rewrite test stubs.
- The runtime audit's reload-window observation: old widgets look up `runtime.theme` and `runtime.routeActivation`
  lazily, so they can throw briefly while a new generation starts. Watch for it during any manual reload check after
  Phase 1, and plan it separately if it shows up.

## Related

- [../../AGENTS.md](../../AGENTS.md)
- [../../documentation/core-principles.md](../../documentation/core-principles.md)
- [../../documentation/conventions/coding-standards.md](../../documentation/conventions/coding-standards.md)
- [../../documentation/conventions/smell-prevention.md](../../documentation/conventions/smell-prevention.md)
- [../../documentation/conventions/quality-gates.md](../../documentation/conventions/quality-gates.md)
- [../../documentation/conventions/testing-infrastructure.md](../../documentation/conventions/testing-infrastructure.md)
- [../../documentation/avnav-api/plugin-lifecycle.md](../../documentation/avnav-api/plugin-lifecycle.md)
- [../../documentation/avnav-api/editable-parameters.md](../../documentation/avnav-api/editable-parameters.md)
- [../../documentation/widgets/regatta-timer.md](../../documentation/widgets/regatta-timer.md)
- [../../documentation/widgets/route-points.md](../../documentation/widgets/route-points.md)
- [../../documentation/architecture/html-renderer-lifecycle.md](../../documentation/architecture/html-renderer-lifecycle.md)
- [../../documentation/guides/exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md)
