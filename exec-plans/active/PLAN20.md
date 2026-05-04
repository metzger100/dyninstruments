# PLAN20: Route-Driven Lazy Runtime Migration for dyninstruments Performance

**Goal:** Fully migrate dyninstruments from eager clustered startup to route-driven lazy activation so startup registers widgets with a minimal synchronous shell while mapper, view-model, renderer, surface, shadow CSS, and route-specific assets load only for the active `cluster/kind` route.

**Status:** Plan — not yet implemented

---

## Status

This plan is the implementation source of truth for the full performance migration. It is intentionally not a patch plan for one lazy-loaded renderer. The required end state is a different runtime architecture:

- startup loads only bootstrap/config/runtime shell code, `ClusterWidget`, `PerfSpanHelper`, `ThemeModel`, and `ThemeResolver`;

- `ClusterWidget` becomes a minimal synchronous shell/orchestrator;

- `translateFunction()` becomes a synchronous route-frame normalizer, not the mapper execution point;

- route activation loads the active route implementation on demand;

- loaded implementation modules remain cached for the complete plugin session;

- predictive preloading is not part of this plan;

- no new global render scheduler is introduced;

- `ClusterRendererRouter`, `SurfaceControllerFactory`, and `ClusterMapperRegistry` are removed, not kept as compatibility facades.

The plan is phased for implementation safety, but the target architecture is a full migration. Temporary work-in-progress code may exist inside a phase while tests are being updated, but no final phase may leave parallel ownership or compatibility facades behind.

---

## Goal

After PLAN20 is complete, repository-visible and runtime-visible outcomes must be:

1. Initial plugin startup no longer resolves the complete 131-component dependency closure through `ClusterWidget`.

2. Startup widget registration remains synchronous and AvNav-compatible.

3. First render returns an empty-but-sized shell with theme classes and stable mount points, with no visible loading text/spinner.

4. Only the active/current `cluster/kind` route activates mapper, optional view-model, renderer, surface controller, renderer dependencies, shadow CSS, and route-specific assets.

5. Mapper execution happens only inside the activated route pipeline, after route components are loaded.

6. HTML renderer shadow CSS is fetched and cached during route activation before hydration.

7. Current bundled fonts remain plugin-wide `plugin.css` assets with `font-display: swap`; they are not moved into JS/component-loader preloads.

8. Same-route updates keep the current host-commit and surface scheduling behavior.

9. Cold activation is latest-wins and revision-gated so stale async completions cannot hydrate.

10. Rare same-instance route identity changes are handled defensively by destroying the previous surface session while keeping implementation modules cached.

11. Loaded modules/objects remain cached for the complete plugin session; PLAN20 does not implement route-module eviction.

12. Stage-based bootstrap script loading is introduced after the route activation migration is stable.

13. Tests, documentation, dependency checks, and performance gates enforce that the old eager dependency chain cannot return.

---

## Verified Baseline

These facts were verified against the current repository state before writing the plan.

1. `config/components.js` assembles exactly four component registry groups in this order: `sharedFoundation`, `sharedEngines`, `widgets`, `cluster`.

2. The current assembled registry contains 131 components: 65 `sharedFoundation`, 8 `sharedEngines`, 35 `widgets`, and 23 `cluster` components.

3. `config/widget-definitions.js` assigns `config.widgetDefinitions = config.clusters`.

4. The current cluster config files produce 9 widget definitions, and all 9 use `ClusterWidget` as their `widget` component.

5. `runtime/component-loader.js` computes startup components through `loader.uniqueComponents(widgetDefinitions)`, recursively walking `component.deps` from every `widgetDef.widget`.

6. Because all widget definitions point at `ClusterWidget`, `loader.uniqueComponents(widgetDefinitions)` is equivalent to the `ClusterWidget` dependency closure.

7. The current `ClusterWidget` registry entry in `config/components/registry-cluster.js` depends on `ClusterMapperToolkit`, `ClusterRendererRouter`, `ClusterMapperRegistry`, and `PerfSpanHelper`.

8. The current `ClusterWidget` dependency closure reaches all 131 registered components.

9. `ClusterMapperRegistry` currently depends on all 9 mapper modules: `CourseHeadingMapper`, `SpeedMapper`, `EnvironmentMapper`, `WindMapper`, `NavMapper`, `MapMapper`, `AnchorMapper`, `VesselMapper`, and `DefaultMapper`.

10. `ClusterMapperRegistry.create()` eagerly creates all available cluster mappers and stores their `translate` functions in a `mappers` object.

11. `ClusterWidget.translateFunction()` currently calls `mapperRegistry.mapCluster(routeProps, mapperToolkit.createToolkit)` synchronously.

12. `ClusterRendererRouter` currently depends on `ClusterKindCatalog`, `ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, `HtmlSurfaceController`, `SurfaceControllerFactory`, `ThreeValueTextWidget`, `PositionCoordinateWidget`, six committed HTML text renderers, `CenterDisplayTextWidget`, `DefaultRadialWidget`, `DefaultLinearWidget`, `RendererPropsWidget`, and `PerfSpanHelper`.

13. `ClusterRendererRouter.create()` eagerly creates the default route catalog, both surface owners, the surface policy, the surface controller factory, and every renderer spec.

14. `ClusterRendererRouter` currently owns route lookup, renderer validation, shell rendering, shell sizing, surface factory creation, session payload construction, and renderer shadow CSS lookup.

15. `SurfaceControllerFactory` currently exists to dynamically resolve route state and choose `CanvasDomSurfaceAdapter` or `HtmlSurfaceController` during session attachment.

16. `SurfaceSessionController` currently creates controllers via an option-level `createSurfaceController(surface)` factory and tracks only surface/shell identity, not route/renderer identity.

17. `SurfaceSessionController.reconcileSession(payload)` already returns `false` for stale revisions where `payload.revision < mountedRevision`.

18. `HostCommitController` already owns render revision tracking, host commit coalescing, stale commit rejection, RAF attempts, mutation observer fallback, and cleanup.

19. `CanvasDomSurfaceAdapter` already owns canvas paint scheduling with RAF coalescing and lifecycle cleanup for resize/paint resources.

20. `HtmlSurfaceController` already owns committed HTML mount/update/postPatch/detach/destroy behavior and injects shadow CSS text synchronously from `runtime._theme`.

21. `runtime/theme-runtime.js` owns `preloadShadowCssUrls()`, shadow CSS text caches, `getShadowCssText()`, and `hasShadowCssText()`.

22. `runtime/init.js` currently collects shadow CSS URLs from the entire startup component closure and preloads them before widget registration completes.

23. Six HTML renderer components currently declare `shadowCss`: `ActiveRouteTextHtmlWidget`, `EditRouteTextHtmlWidget`, `RoutePointsTextHtmlWidget`, `MapZoomTextHtmlWidget`, `AisTargetTextHtmlWidget`, and `AlarmTextHtmlWidget`.

24. Each HTML renderer `shadowCss` declaration includes `shared/html/HtmlShadowCommon.css` plus its renderer-specific CSS file.

25. `ClusterKindCatalog.js` currently hard-codes 59 routes.

26. Of the 59 routes, 53 use `canvas-dom` and 6 use `html`.

27. The 59 routes use 24 distinct renderer IDs.

28. The route distribution by cluster is: `courseHeading` 8, `default` 3, `speed` 6, `environment` 7, `wind` 9, `nav` 11, `map` 3, `anchor` 3, `vessel` 9.

29. `NavMapper` currently creates `ActiveRouteViewModel`, `EditRouteViewModel`, and `RoutePointsViewModel` at mapper creation time, even for nav kinds that do not use those HTML view models.

30. `MapMapper` currently creates `AisTargetViewModel` at mapper creation time, even for map kinds that do not use it.

31. `VesselMapper` currently declares `AlarmViewModel` as a registry dependency and lazily instantiates it at translate time only for the `alarm` kind, but the component-loader still eagerly loads the module because of the registry dep.

32. `RendererPropsWidget` currently depends on 15 renderer components and wraps a target renderer by merging `props.rendererProps` into renderer props before delegating.

33. Loading `RendererPropsWidget` currently loads all 15 of its target renderer dependencies, even when a route needs only one target renderer.

34. `config/bootstrap-manifest.js` currently exposes a flat array of script paths.

35. `plugin.js` currently loads the bootstrap manifest and then reduces the flat manifest sequentially, loading one script after the previous script has completed.

36. There is no build step; AvNav serves raw source files directly.

37. `assets/fonts/` contains `Roboto-Regular.woff2`, `Roboto-Bold.woff2`, `RobotoMono-Regular.woff2`, `RobotoMono-Bold.woff2`, and `LICENSE.txt`.

38. `plugin.css` owns the current font declarations, and the component registry does not register these fonts as component assets.

39. `documentation/guides/exec-plan-authoring.md` requires execution plans to include Status, Goal, Verified Baseline, Hard Constraints, Implementation Order, Acceptance Criteria, and Related sections.

40. Current relevant tests include `tests/cluster/ClusterWidget.test.js`, `tests/cluster/mappers/ClusterMapperRegistry.test.js`, `tests/cluster/rendering/ClusterRendererRouter.test.js`, `tests/cluster/rendering/RendererPropsWidget.test.js`, `tests/runtime/SurfaceSessionController.test.js`, `tests/runtime/component-loader.test.js`, `tests/runtime/init.test.js`, `tests/plugin/plugin-bootstrap.test.js`, and `tests/config/components.test.js`.

---

## Architectural Decision Record

The following decisions are already resolved and must not be reopened during implementation unless PLAN20 is explicitly amended.

| Area                    | Decision                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Primary architecture    | Route-driven lazy activation with synchronous AvNav shell lifecycle                                     |
| First render            | Empty-but-sized shell; no visible loading text/spinner                                                  |
| Assets                  | Current fonts stay plugin-wide in `plugin.css`; future route-specific assets load with route activation |
| Route source of truth   | New checked-in `config/cluster-route-manifest.js` is canonical                                          |
| Catalog role            | `ClusterKindCatalog` becomes a manifest-backed validation/list/resolve adapter                          |
| Registration component  | `ClusterWidget` becomes minimal synchronous shell/orchestrator                                          |
| Preloading              | Predictive post-first-paint preloading is not part of PLAN20, not even optional                         |
| Module cache            | Loaded implementation modules remain cached for the complete plugin session                             |
| Mapping lifecycle       | `translateFunction()` returns a route frame; real mapping runs in activated route pipeline              |
| Unknown routes          | Development/tests fail loudly; production renders safe empty shell and logs once                        |
| Shell rendering         | New startup-safe `runtime/cluster-shell-renderer.js`, using only route manifest metadata                |
| Surface reconciliation  | Activation resolves before synchronous surface reconciliation                                           |
| Theme                   | `ThemeModel` and `ThemeResolver` remain startup-critical                                                |
| Shadow CSS              | Route activation blocks hydration until active HTML renderer shadow CSS is cached                       |
| Cold activation races   | Latest-wins revision guard; no queue of stale activations                                               |
| Route changes           | Rare same-instance route identity changes destroy the previous surface session; modules remain cached   |
| Same-route scheduling   | No new global scheduler/debouncer                                                                       |
| Warm activation         | Synchronous fast-path when route activation cache is warm; async only on cold activation                |
| Bootstrap loading       | Add staged bootstrap loading later, after route activation migration                                    |
| Broad route deps        | Route manifest owns route-specific dependency sets; broad wrapper deps must be removed                  |
| Router removal          | Remove `ClusterRendererRouter`; no compatibility facade                                                 |
| Surface factory removal | Remove `SurfaceControllerFactory`; direct activated payload creates controllers                         |
| Mapper registry removal | Remove `ClusterMapperRegistry`; route manifest names mapper directly                                    |

---

## Hard Constraints

1. **No build step.** All changes must work with raw source files served by AvNav.

2. **No predictive preloading.** Do not add an optional predictive preload phase, idle warming system, route neighbor warming, or post-first-paint predictor in PLAN20.

3. **No JS module eviction.** Loaded route implementation modules remain cached for the complete plugin session.

4. **No global scheduler.** Do not add a new global debounce/coalescing scheduler for normal same-route data updates.

5. **No visible loading UI.** The cold route shell must be empty-but-sized. It may include diagnostic data attributes but no loading text or spinner.

6. **No compatibility facades for removed router-era abstractions.** `ClusterRendererRouter`, `SurfaceControllerFactory`, and `ClusterMapperRegistry` are removed as architecture owners. Do not leave shadow facades with the same responsibilities.

7. **No eager mapper/renderer/view-model/surface startup path.** `ClusterWidget` startup dependencies must not include mapper implementations, renderer implementations, view models, surface implementations, or route-specific shadow CSS.

8. **Theme remains startup-safe.** Do not lazy-load `ThemeModel` or `ThemeResolver` in PLAN20.

9. **Current fonts remain CSS-owned.** Do not move current bundled fonts into component-loader assets or JS preloads.

10. **Route-specific shadow CSS is activation-owned.** Do not preload all renderer `shadowCss` during startup.

11. **Same-route hot path stays prompt.** Do not debounce instrument value updates globally.

12. **Development must fail loudly.** Unknown/malformed route manifest entries, unknown component IDs, missing renderer APIs, and route/renderer mismatches must throw in tests/development.

13. **Production must be non-fatal.** Unknown route input should render a safe empty shell and log once instead of breaking the whole AvNav dashboard.

14. **Surface resources must still clean up.** DOM nodes, canvas state, timers, observers, RAF handles, font listeners, action bridges, and surface sessions must be detached/destroyed as before.

15. **Line-size gates still apply.** New/changed files must respect the repository file-size checks.

16. **Docs must not describe old ownership after cutover.** Architecture docs must remove router/registry/factory ownership claims once code is migrated.

---

## Target Runtime Architecture

### Current startup path to eliminate

```text
plugin.js
→ load flat bootstrap manifest sequentially
→ runtime.runInit()
→ loader.uniqueComponents(widgetDefinitions)
→ ClusterWidget deps
→ ClusterRendererRouter
→ all renderer specs
→ RendererPropsWidget
→ many renderer families
→ ClusterMapperRegistry
→ all mappers
→ mapper-time view models
→ all 131 components reachable before widget registration
```

### Target startup path

```text
plugin.js
→ load bootstrap/config/runtime shell code
→ runtime.runInit()
→ load startup-critical components only:
    ClusterWidget
    PerfSpanHelper
    ThemeModel
    ThemeResolver
→ configure theme runtime
→ register all 9 cluster widget definitions synchronously
```

### Target first render path

```text
Host calls ClusterWidget.translateFunction(rawProps)
→ normalize route frame:
    cluster
    kind
    routeId
    rawProps
→ Host calls ClusterWidget.renderHtml(routeFrame)
→ route manifest resolves metadata
→ cluster-shell-renderer returns empty sized shell synchronously
→ HostCommitController schedules commit
→ renderHtml returns immediately
```

### Target activation/hydration path

```text
HostCommitController commits latest shell revision
→ ClusterWidget applies theme outputs to root
→ route-activation-loader activates routeId for latest revision
→ component-loader loads exact route dependency set
→ route activation preloads active HTML shadow CSS, if any
→ activated mapper maps latest raw props
→ activation merges rendererProps into payload when needed
→ ClusterSurfacePolicy materializes runtime-only policy props
→ activated payload creates direct html/canvas-dom controller
→ SurfaceSessionController reconciles synchronously
→ shell hydrates silently
```

### Target same-route update path

```text
same widget instance
same routeId
same rendererId
same surface
→ host commit latest revision
→ route activation cache hit (synchronous fast-path)
→ mapper maps latest raw props
→ existing surface session update(payload)
```

### Target rare route-change path

```text
same widget instance
new routeId / rendererId / surface
→ old surface session detach/destroy
→ loaded implementation modules remain cached
→ activate new route if cold
→ create new surface controller
→ attach/update new session
```

---

## Canonical Route Manifest Shape

Create `config/cluster-route-manifest.js` and load it from `config/bootstrap-manifest.js` before `config/widget-definitions.js` and before any runtime module that needs route metadata.

The manifest is a checked-in runtime config file, not generated at runtime and not produced by a build step.

Recommended normalized shape:

```javascript
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config = ns.config || {};

  config.clusterRouteManifest = {
    schemaVersion: 1,
    routes: [
      {
        routeId: "speed/sogRadial",
        cluster: "speed",
        kind: "sogRadial",
        mapperId: "SpeedMapper",
        viewModelId: "MapperOutputViewModel",
        rendererId: "SpeedRadialWidget",
        surface: "canvas-dom",
        shellSizing: { kind: "ratio", aspectRatio: 1 },
        components: {
          mapper: ["ClusterMapperToolkit", "SpeedMapper"],
          viewModel: [],
          renderer: ["SpeedRadialWidget"],
          surface: ["ClusterSurfacePolicy", "CanvasDomSurfaceAdapter"]
        }
      },
      {
        routeId: "nav/activeRoute",
        cluster: "nav",
        kind: "activeRoute",
        mapperId: "NavMapper",
        viewModelId: "ActiveRouteViewModel",
        rendererId: "ActiveRouteTextHtmlWidget",
        surface: "html",
        shellSizing: { kind: "ratio", aspectRatio: 2 },
        components: {
          mapper: ["ClusterMapperToolkit", "NavMapper"],
          viewModel: ["ActiveRouteViewModel"],
          renderer: ["ActiveRouteTextHtmlWidget"],
          surface: ["ClusterSurfacePolicy", "HtmlSurfaceController"]
        }
      },
      {
        routeId: "nav/routePoints",
        cluster: "nav",
        kind: "routePoints",
        mapperId: "NavMapper",
        viewModelId: "RoutePointsViewModel",
        rendererId: "RoutePointsTextHtmlWidget",
        surface: "html",
        shellSizing: { kind: "none" },
        components: {
          mapper: ["ClusterMapperToolkit", "NavMapper"],
          viewModel: ["RoutePointsViewModel"],
          renderer: ["RoutePointsTextHtmlWidget"],
          surface: ["ClusterSurfacePolicy", "HtmlSurfaceController"]
        }
      }
    ]
  };
}(this));
```

Rules:

1. `routeId` is always `cluster + "/" + kind`.

2. `(cluster, kind)` pairs must be unique.

3. `mapperId`, `rendererId`, `surface`, and `shellSizing` are required.

4. `viewModelId` is required and uses `MapperOutputViewModel` for routes where mapper output is already the renderer view model.

5. `components.mapper`, `components.viewModel`, `components.renderer`, and `components.surface` must contain only component IDs that exist in `config.components`.

6. The final activation dependency list is the ordered, de-duplicated union of all `components.*` buckets.

7. Route activation still calls `component-loader.loadComponent(id)`, so transitive renderer/engine dependencies remain respected.

8. Do not include predictive preload neighbors, priority hints, or idle warming metadata.

9. Do not include current plugin-wide fonts in route entries.

10. Future route-specific assets belong on component registry entries, not duplicated directly in the route manifest.

11. `shellSizing.kind` must be `"ratio"`, `"natural"`, or `"none"`. The shell renderer applies `aspect-ratio` for ratio, `height` for natural, and no CSS sizing for none.

---

## Route Manifest Inventory

The manifest must contain the 59 current routes below. This table is the migration inventory for moving hard-coded `ClusterKindCatalog` entries into `config/cluster-route-manifest.js`.

| Route                      | Mapper                | View model              | Renderer                    | Surface      | Initial shell sizing |
| -------------------------- | --------------------- | ----------------------- | --------------------------- | ------------ | -------------------- |
| `courseHeading/cog`        | `CourseHeadingMapper` | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/hdt`        | `CourseHeadingMapper` | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/hdm`        | `CourseHeadingMapper` | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/brg`        | `CourseHeadingMapper` | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/hdtRadial`  | `CourseHeadingMapper` | `MapperOutputViewModel` | `CompassRadialWidget`       | `canvas-dom` | ratio 1              |
| `courseHeading/hdmRadial`  | `CourseHeadingMapper` | `MapperOutputViewModel` | `CompassRadialWidget`       | `canvas-dom` | ratio 1              |
| `courseHeading/hdtLinear`  | `CourseHeadingMapper` | `MapperOutputViewModel` | `CompassLinearWidget`       | `canvas-dom` | ratio 2              |
| `courseHeading/hdmLinear`  | `CourseHeadingMapper` | `MapperOutputViewModel` | `CompassLinearWidget`       | `canvas-dom` | ratio 2              |
| `default/text`             | `DefaultMapper`       | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `default/linearGauge`      | `DefaultMapper`       | `MapperOutputViewModel` | `DefaultLinearWidget`       | `canvas-dom` | ratio 2              |
| `default/radialGauge`      | `DefaultMapper`       | `MapperOutputViewModel` | `DefaultRadialWidget`       | `canvas-dom` | ratio 1              |
| `speed/sog`                | `SpeedMapper`         | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `speed/stw`                | `SpeedMapper`         | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `speed/sogLinear`          | `SpeedMapper`         | `MapperOutputViewModel` | `SpeedLinearWidget`         | `canvas-dom` | ratio 2              |
| `speed/stwLinear`          | `SpeedMapper`         | `MapperOutputViewModel` | `SpeedLinearWidget`         | `canvas-dom` | ratio 2              |
| `speed/sogRadial`          | `SpeedMapper`         | `MapperOutputViewModel` | `SpeedRadialWidget`         | `canvas-dom` | ratio 1              |
| `speed/stwRadial`          | `SpeedMapper`         | `MapperOutputViewModel` | `SpeedRadialWidget`         | `canvas-dom` | ratio 1              |
| `environment/depth`        | `EnvironmentMapper`   | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `environment/depthLinear`  | `EnvironmentMapper`   | `MapperOutputViewModel` | `DepthLinearWidget`         | `canvas-dom` | ratio 2              |
| `environment/depthRadial`  | `EnvironmentMapper`   | `MapperOutputViewModel` | `DepthRadialWidget`         | `canvas-dom` | ratio 1              |
| `environment/temp`         | `EnvironmentMapper`   | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `environment/tempLinear`   | `EnvironmentMapper`   | `MapperOutputViewModel` | `TemperatureLinearWidget`   | `canvas-dom` | ratio 2              |
| `environment/tempRadial`   | `EnvironmentMapper`   | `MapperOutputViewModel` | `TemperatureRadialWidget`   | `canvas-dom` | ratio 1              |
| `environment/pressure`     | `EnvironmentMapper`   | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleTrue`           | `WindMapper`          | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleApparent`       | `WindMapper`          | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleTrueDirection`  | `WindMapper`          | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/speedTrue`           | `WindMapper`          | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/speedApparent`       | `WindMapper`          | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleTrueRadial`     | `WindMapper`          | `MapperOutputViewModel` | `WindRadialWidget`          | `canvas-dom` | ratio 1              |
| `wind/angleApparentRadial` | `WindMapper`          | `MapperOutputViewModel` | `WindRadialWidget`          | `canvas-dom` | ratio 1              |
| `wind/angleTrueLinear`     | `WindMapper`          | `MapperOutputViewModel` | `WindLinearWidget`          | `canvas-dom` | ratio 2              |
| `wind/angleApparentLinear` | `WindMapper`          | `MapperOutputViewModel` | `WindLinearWidget`          | `canvas-dom` | ratio 2              |
| `nav/eta`                  | `NavMapper`           | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/rteEta`               | `NavMapper`           | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/dst`                  | `NavMapper`           | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/rteDistance`          | `NavMapper`           | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/vmg`                  | `NavMapper`           | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/activeRoute`          | `NavMapper`           | `ActiveRouteViewModel`  | `ActiveRouteTextHtmlWidget` | `html`       | ratio 2              |
| `nav/editRoute`            | `NavMapper`           | `EditRouteViewModel`    | `EditRouteTextHtmlWidget`   | `html`       | ratio 2              |
| `nav/routePoints`          | `NavMapper`           | `RoutePointsViewModel`  | `RoutePointsTextHtmlWidget` | `html`       | none                 |
| `nav/positionBoat`         | `NavMapper`           | `MapperOutputViewModel` | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `nav/positionWp`           | `NavMapper`           | `MapperOutputViewModel` | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `nav/xteDisplay`           | `NavMapper`           | `MapperOutputViewModel` | `XteDisplayWidget`          | `canvas-dom` | ratio 2              |
| `map/centerDisplay`        | `MapMapper`           | `MapperOutputViewModel` | `CenterDisplayTextWidget`   | `canvas-dom` | ratio 1              |
| `map/zoom`                 | `MapMapper`           | `MapperOutputViewModel` | `MapZoomTextHtmlWidget`     | `html`       | ratio 2              |
| `map/aisTarget`            | `MapMapper`           | `AisTargetViewModel`    | `AisTargetTextHtmlWidget`   | `html`       | ratio 0.875          |
| `anchor/anchorDistance`    | `AnchorMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `anchor/anchorWatch`       | `AnchorMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `anchor/anchorBearing`     | `AnchorMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/voltage`           | `VesselMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/voltageLinear`     | `VesselMapper`        | `MapperOutputViewModel` | `VoltageLinearWidget`       | `canvas-dom` | ratio 2              |
| `vessel/voltageRadial`     | `VesselMapper`        | `MapperOutputViewModel` | `VoltageRadialWidget`       | `canvas-dom` | ratio 1              |
| `vessel/alarm`             | `VesselMapper`        | `AlarmViewModel`        | `AlarmTextHtmlWidget`       | `html`       | ratio 2              |
| `vessel/clock`             | `VesselMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/dateTime`          | `VesselMapper`        | `MapperOutputViewModel` | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `vessel/timeStatus`        | `VesselMapper`        | `MapperOutputViewModel` | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `vessel/pitch`             | `VesselMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/roll`              | `VesselMapper`        | `MapperOutputViewModel` | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |

`nav/routePoints` is the only current route whose shell sizing is `none`. Its first cold shell renders with no CSS sizing because the renderer's natural height depends on mapped route point count and committed shell width, neither of which is available before activation. The shell has near-zero height only during the first cold activation of a viewer session; once activated, same-route updates (selecting different waypoints, route data changes) go through the warm update path where the surface session is already attached and the shell already has content and natural height. After activation, the existing natural-height behavior applies during committed route session updates.

---

## Implementation Order

Each phase lists intent, dependencies, deliverables, and exit conditions. Later phases depend on previous phases unless stated otherwise.

### Phase 1 — Establish canonical route manifest

**Intent:** Move route metadata out of `ClusterKindCatalog` and into a checked-in runtime config file without yet changing the widget runtime path.

**Dependencies:** None.

#### Deliverables

1. Add `config/cluster-route-manifest.js`.

2. Insert `config/cluster-route-manifest.js` into `config/bootstrap-manifest.js` after cluster config/shared metadata is available and before runtime init can use route data.

3. Move the 59 current route entries from `cluster/rendering/ClusterKindCatalog.js` into `config.clusterRouteManifest.routes`.

4. Include required metadata for each route:
   
   - `routeId`
   
   - `cluster`
   
   - `kind`
   
   - `mapperId`
   
   - `viewModelId`
   
   - `rendererId`
   
   - `surface`
   
   - `shellSizing`
   
   - `components.mapper`
   
   - `components.viewModel`
   
   - `components.renderer`
   
   - `components.surface`

5. Update `ClusterKindCatalog` so it reads `config.clusterRouteManifest` and exposes only validation/list/resolve APIs.

6. Keep `ClusterKindCatalog` free of mapper/renderer implementation imports.

7. Add route manifest validation helpers inside `ClusterKindCatalog` or a small config-safe helper, keeping file sizes under the gate.

8. Update `tools/components-registry-loader.mjs` or add a similar test helper so Node-side tests can load `config/cluster-route-manifest.js` with the registry.

9. Add `tests/config/cluster-route-manifest.test.js`.

10. Update `tests/cluster/rendering/ClusterKindCatalog.test.js` to assert manifest-backed behavior.

#### Validation rules to test

- Exactly 59 routes exist.

- Route IDs are unique.

- `(cluster, kind)` pairs are unique.

- Every route ID equals `cluster + "/" + kind`.

- Every surface is `html` or `canvas-dom`.

- Every `shellSizing.kind` is `ratio`, `natural`, or `none`.

- Every ratio shell sizing has a positive `aspectRatio`.

- Every natural shell sizing has a non-empty `height` string.

- Every `mapperId`, non-default `viewModelId`, and `rendererId` exists in `config.components`.

- Every component in every route dependency bucket exists in `config.components`.

- All six HTML routes declare renderer components that have `shadowCss` in the component registry.

- Canvas routes do not require renderer `shadowCss`.

- No route entry contains predictive preload metadata.

- Current plugin-wide fonts do not appear in the route manifest.

#### Exit conditions

- `npm run test -- tests/config/cluster-route-manifest.test.js tests/cluster/rendering/ClusterKindCatalog.test.js`

- `npm run check:core`

- Existing runtime still works through the old eager path at this phase, but route metadata source of truth has moved.

---

### Phase 2 — Add startup-safe shell renderer and route-frame contract

**Intent:** Create the synchronous shell layer that can replace router-owned shell rendering.

**Dependencies:** Phase 1.

#### Deliverables

1. Add `runtime/cluster-shell-renderer.js`.

2. Add it to `config/bootstrap-manifest.js` before `runtime/init.js`.

3. Expose a runtime API, for example:

```javascript
runtime.createClusterShellRenderer = function createClusterShellRenderer(options) {
  return {
    renderRouteShell: renderRouteShell,
    normalizeRouteFrame: normalizeRouteFrame
  };
};
```

4. Implement `normalizeRouteFrame(rawProps, def, routeManifest, env)` behavior:
   
   - normalize `cluster` from `rawProps.cluster` or `def.cluster`;
   
   - normalize `kind` from `rawProps.kind`;
   
   - compute `routeId`;
   
   - preserve the original raw props as `__dyniRawProps`;
   
   - attach non-enumerable or reserved internal fields only if existing code/test style allows it;
   
   - never call mapper, renderer, view-model, or surface implementations.

5. Implement `renderRouteShell(routeFrame, routeMeta, instanceId)` behavior:
   
   - returns one `.widgetData.dyni-shell` root;
   
   - includes `data-dyni-instance`, `data-dyni-route`, and `data-dyni-surface`;
   
   - includes `dyni-surface-canvas` or `dyni-surface-html` class;
   
   - includes `dyni-kind-{kind}` class with safe tokenization;
   
   - renders an empty stable mount point for the active surface;
   
   - applies startup-safe shell sizing from route manifest metadata: `aspect-ratio` for ratio, `height` for natural, no CSS sizing for none;
   
   - does not call `CanvasDomSurfaceAdapter.renderSurfaceShell()`;
   
   - does not call `HtmlSurfaceController.renderSurfaceShell()`;
   
   - does not instantiate renderer specs.

6. Shell markup contracts:
   
   - canvas shell contains the mount structure expected by `CanvasDomSurfaceAdapter` after activation;
   
   - HTML shell contains the mount structure expected by `HtmlSurfaceController` after activation;
   
   - no visible loading text;
   
   - no route implementation-specific markup.

7. Unknown route behavior:
   
   - tests/development throw exact errors with route ID;
   
   - production returns a safe empty shell with diagnostic `data-dyni-route-status="unknown"` and logs once per route ID.

#### Exit conditions

- Add `tests/runtime/cluster-shell-renderer.test.js`.

- Test route-frame normalization.

- Test shell HTML for both `canvas-dom` and `html` routes.

- Test empty-but-sized behavior for ratio shell sizing.

- Test none shell sizing applies no CSS sizing.

- Test safe production unknown route behavior.

- Test development/test unknown route throws.

- `npm run check:core`.

---

### Phase 3 — Add route activation loader and activated payload contract

**Intent:** Introduce the async implementation-loading boundary before cutting over `ClusterWidget`.

**Dependencies:** Phases 1 and 2.

#### Deliverables

1. Add `runtime/route-activation-loader.js`.

2. Add it to `config/bootstrap-manifest.js` before `runtime/init.js`.

3. Expose a runtime API, for example:

```javascript
runtime.createRouteActivationLoader = function createRouteActivationLoader(options) {
  return {
    createInstance: createInstance,
    getLoadedRouteIds: getLoadedRouteIds
  };
};
```

4. Configure the loader from `runtime/init.js` after component loader and theme runtime are available. The loader receives `Helpers` and the component loader at configuration time. Per-widget instances receive the widget `def` when created.

5. Implement two distinct cache layers (do not implement route module eviction for either):
   
   - **Component code cache (global, existing):** `component-loader` promises are already cached by component ID. Shared across all widget instances. A second `loadComponent("SpeedMapper")` call returns the same resolved promise.
   
   - **Route activation cache (global, new):** keyed by `routeId`, records that a route's full dependency set is loaded and holds references to the resolved component factories. This cache is what enables the synchronous fast-path (deliverable 5a). When any widget instance activates `speed/sogRadial`, every subsequent activation of that route by any widget instance is a cache hit.

  Per-widget mapper/toolkit/renderer/view-model instances created via `.create(def, Helpers)` are NOT shared across widget instances because `def` differs per widget definition and instances may hold internal state. These are stored in per-widget-instance activation state (deliverable 6).

5a. Implement a synchronous fast-path for warm route activation:

- before entering the async promise chain, check the global route activation cache;

- if the route's dependency set is fully loaded (cache hit), skip `Promise.all(loadComponent(...))` and proceed synchronously: map latest raw props, build activated payload, and return the payload directly instead of wrapping in a promise;

- this keeps the warm same-route update path fully synchronous from host commit to surface reconciliation, matching current behavior where commit → mapper → session reconciliation has no async hop;

- cold activation (cache miss) remains async and goes through the normal promise chain.
6. Implement per-widget-instance activation state:

```javascript
{
  instanceId,
  activeRouteId,
  activeRendererId,
  activeSurface,
  inFlightRouteId,
  inFlightPromise,
  latestRevision,
  latestRawProps,
  latestRouteFrame,
  latestRootEl,
  latestShellEl
}
```

7. Implement latest-wins behavior:
   
   - one in-flight activation per widget instance/route;
   
   - new renders update the latest frame;
   
   - when a promise resolves, only the latest committed revision may map/hydrate;
   
   - stale completions return without touching the DOM.

8. Implement route activation steps:
   
   - resolve route metadata from manifest;
   
   - compute the ordered dependency list from manifest component buckets;
   
   - call `loader.loadComponent(id)` for each dependency;
   
   - collect active renderer `shadowCss` from `config.components[rendererId].shadowCss`;
   
   - call `runtime._theme.preloadShadowCssUrls(shadowCssUrls)` before HTML hydration;
   
   - instantiate mapper via `Helpers.getModule(mapperId).create(def, Helpers)` only after mapper component is loaded;
   
   - instantiate toolkit via `Helpers.getModule("ClusterMapperToolkit").create(def, Helpers)` only after toolkit component is loaded;
   
   - instantiate optional route view-model only after its component is loaded;
   
   - instantiate renderer spec only after renderer component is loaded;
   
   - instantiate surface owner only after surface component is loaded;
   
   - build an activated route payload for `SurfaceSessionController`.

9. Activated payload required fields:

```javascript
{
  routeId,
  route,
  surface,
  rendererId,
  rendererSpec,
  rootEl,
  shellEl,
  props,
  rawProps,
  revision,
  shadowCssUrls,
  createSurfaceController
}
```

10. Mapper execution rule:
    
    - `translateFunction()` never executes mapper code;
    
    - route activation runs `mapper.translate(rawProps, toolkit, routeContext)`;
    
    - `routeContext.viewModel` is provided only when the route has a non-default view model;
    
    - mapper output is validated against manifest `rendererId`.

11. `rendererProps` merge rule:
    
    - remove the need for `RendererPropsWidget` by merging `mappedProps.rendererProps` into the final payload before renderer/surface update;
    
    - do this once at activation/session payload boundary;
    
    - preserve current renderer behavior.

12. Surface policy rule:
    
    - `ClusterSurfacePolicy` is loaded as a route activation dependency;
    
    - after mapping and `rendererProps` merge, materialize `surfacePolicy` and `viewportHeight` as runtime-only props;
    
    - initial shell sizing uses manifest metadata, not `ClusterSurfacePolicy`;
    
    - post-activation natural sizing may update shell element for routes that require committed width.

13. Route change rule:
    
    - same `routeId`/`rendererId`/`surface` updates existing session;
    
    - different route identity destroys prior surface session before attaching new controller;
    
    - loaded modules/specs remain cached.

#### Exit conditions

- Add `tests/runtime/route-activation-loader.test.js`.

- Test demand-only dependency loading for a canvas route.

- Test demand-only dependency loading for an HTML route.

- Test HTML shadow CSS preload before `HtmlSurfaceController` attach.

- Test latest-wins stale activation discard.

- Test loaded route cache reuse for same route.

- Test synchronous fast-path returns payload directly when route activation cache is warm.

- Test same-instance route identity change destroys old surface session.

- Test no predictive preload calls or route neighbor metadata exists.

- `npm run check:core`.

---

### Phase 4 — Adapt `SurfaceSessionController` for activated route identity

**Intent:** Keep surface reconciliation synchronous while removing router-era factory ownership.

**Dependencies:** Phase 3.

#### Deliverables

1. Update `runtime/SurfaceSessionController.js` so controller creation is based on activated payload, not only `surface`.

2. Remove the requirement that `createSurfaceController(surface)` exists at controller construction time, or replace it with a payload-aware function that does not depend on router-era state.

3. Preferred clean API:

```javascript
const session = runtime.createSurfaceSessionController();
session.reconcileSession({
  routeId,
  rendererId,
  surface,
  rootEl,
  shellEl,
  props,
  revision,
  createSurfaceController
});
```

4. `createSurfaceController` on the activated payload must create the correct controller directly:
   
   - for `canvas-dom`, use the activated `CanvasDomSurfaceAdapter` and `rendererSpec`;
   
   - for `html`, use the activated `HtmlSurfaceController`, `rendererSpec`, and already-cached `shadowCssUrls`.

5. Store mounted route identity in state:
   
   - `mountedRouteId`
   
   - `mountedRendererId`
   
   - `mountedSurface`
   
   - `mountedRevision`

6. Update reconciliation logic:
   
   - stale revision: return `false`;
   
   - no active controller: create from payload and attach;
   
   - same route/renderer/surface and same shell: update;
   
   - same route/renderer/surface but different shell: detach `remount`, attach;
   
   - different route or renderer: detach/destroy old, create/attach new;
   
   - different surface: detach `surface-switch`, destroy old, create/attach new.

7. Keep `destroy()` behavior strict and complete.

8. Keep `getState()` testable.

#### Exit conditions

- Update `tests/runtime/SurfaceSessionController.test.js`.

- Test same-route update.

- Test same-surface different renderer destroys old controller.

- Test different surface destroys old controller.

- Test stale revision returns false.

- Test missing `createSurfaceController` on payload throws only when a new controller is required.

- `npm run check:core`.

---

### Phase 5 — Cut over `ClusterWidget` to shell + activation

**Intent:** Replace the eager router/registry runtime path with the new synchronous shell and async activation pipeline.

**Dependencies:** Phases 1–4.

#### Deliverables

1. Rewrite `cluster/ClusterWidget.js` so it depends on only one component registry entry: `PerfSpanHelper`. All other dependencies are runtime APIs already available on `runtime.*` from bootstrap:
   
   - `runtime.createClusterShellRenderer` (shell renderer)
   
   - `runtime.createRouteActivationLoader` (activation loader)
   
   - `runtime.createHostCommitController` (host commit)
   
   - `runtime.createSurfaceSessionController` (surface session)
   
   - `runtime._theme` (theme runtime boundary)

2. Update the component registry entry for `ClusterWidget` in `config/components/registry-cluster.js`:
   
   - new deps: `["PerfSpanHelper"]`
   
   - remove `ClusterMapperToolkit`, `ClusterRendererRouter`, `ClusterMapperRegistry`

3. `ClusterWidget.translateFunction(props)` must:
   
   - start/end perf span;
   
   - create and return a route frame;
   
   - never call mapper/view-model/renderer/surface modules.

4. `ClusterWidget.initFunction()` must:
   
   - initialize host commit controller;
   
   - initialize surface session controller;
   
   - initialize per-instance route activation state;
   
   - clean previous state if AvNav reuses context.

5. `ClusterWidget.renderHtml(routeFrame)` must:
   
   - record render revision;
   
   - render empty shell via `cluster-shell-renderer`;
   
   - schedule commit;
   
   - on commit, apply theme to root;
   
   - call route activation for latest revision;
   
   - reconcile surface only after activation resolves.

6. `ClusterWidget.finalizeFunction()` must:
   
   - clean host commit controller;
   
   - destroy surface session controller;
   
   - cancel/mark stale any in-flight activation for the widget instance;
   
   - clear context state fields.

7. Hardcode `wantsHideNativeHead: true` on the returned widget object. All 24 current renderers across all 59 routes declare `wantsHideNativeHead: true`, so the value is unconditionally `true` without needing to eagerly instantiate any renderer spec.

8. Unknown route production behavior must return a safe shell and skip activation.

#### Exit conditions

- Update `tests/cluster/ClusterWidget.test.js` for route-frame translation and shell-first rendering.

- Test that `ClusterWidget.create()` does not request `ClusterRendererRouter`, `ClusterMapperRegistry`, `ClusterMapperToolkit`, mapper modules, renderer modules, view models, or surface implementations from `Helpers`.

- Test commit callback calls route activation loader, not router session payload creation.

- Test finalize cancels/invalidates in-flight activation and destroys surface session.

- `npm run test -- tests/cluster/ClusterWidget.test.js tests/runtime/route-activation-loader.test.js tests/runtime/SurfaceSessionController.test.js`

- `npm run check:core`.

---

### Phase 6 — Remove router-era abstractions and broad dependency fans

**Intent:** Delete the old eager owners and ensure no dependency path can reintroduce the 131-component startup closure.

**Dependencies:** Phase 5.

#### Deliverables

1. Delete `cluster/rendering/ClusterRendererRouter.js`.

2. Delete `cluster/rendering/SurfaceControllerFactory.js`.

3. Delete `cluster/mappers/ClusterMapperRegistry.js`.

4. Delete or fully repurpose `cluster/rendering/RendererPropsWidget.js`. Preferred final state: delete it and merge `rendererProps` in route activation.

5. Remove registry entries for deleted modules from `config/components/registry-cluster.js` and `config/components/registry-widgets-nav.js`.

6. Remove tests that only validate deleted abstractions:
   
   - `tests/cluster/rendering/ClusterRendererRouter.test.js`
   
   - `tests/cluster/mappers/ClusterMapperRegistry.test.js`
   
   - `tests/cluster/rendering/RendererPropsWidget.test.js` if the file is deleted.

7. Replace removed behavior with focused tests for the new owners:
   
   - route activation loader tests for mapper resolution;
   
   - route activation loader tests for rendererProps merge;
   
   - shell renderer tests for shell markup;
   
   - `SurfaceSessionController` tests for route identity changes.

8. Refactor mapper component dependencies:
   
   - `NavMapper` must not depend on `ActiveRouteViewModel`, `EditRouteViewModel`, or `RoutePointsViewModel` in the registry;
   
   - `MapMapper` must not depend on `AisTargetViewModel` in the registry;
   
   - `VesselMapper` must not depend on `AlarmViewModel` in the registry.

9. Refactor mapper APIs so route-specific view models are supplied by activation context, not mapper construction.

10. Keep cluster mapper files cluster-grained for this plan. Do not split every mapper into per-kind files unless a file-size gate or testability requirement forces it. The minimum required cut is removal of unrelated route-specific view-model dependencies.

11. Ensure `RendererPropsWidget` removal does not force broad renderer loading:
    
    - route manifest route entries name the exact renderer component;
    
    - activation-time rendererProps merge happens before payload reaches surface controller;
    
    - no route activation for one gauge renderer loads all gauge renderers.

12. Add startup closure guard tests:
    
    - `loader.uniqueComponents(widgetDefinitions)` must return exactly `ClusterWidget` and `PerfSpanHelper` (2 components from widget definition deps only);
    
    - the full startup load set after `init.js` adds `ThemeModel` and `ThemeResolver` must be exactly 4 components;
    
    - `ClusterWidget` closure must not contain mapper, renderer, view-model, or surface implementation IDs;
    
    - deleted router-era module IDs must not exist in `config.components`.

#### Exit conditions

- Deleted files are gone.

- Deleted module names are absent from runtime source except in completed plan/docs references.

- `npm run test -- tests/runtime/component-loader.test.js tests/config/components.test.js tests/runtime/route-activation-loader.test.js`

- `npm run check:core`.

---

### Phase 7 — Move startup shadow CSS to route activation

**Intent:** Ensure route-specific HTML shadow CSS no longer participates in startup while preserving flicker-free HTML hydration.

**Dependencies:** Phases 3–6.

#### Deliverables

1. Update `runtime/init.js` so it no longer collects and preloads shadow CSS URLs from the startup component closure.

2. Keep theme runtime creation at startup.

3. Route activation owns shadow CSS:
   
   - collect active renderer component `shadowCss`;
   
   - call `runtime._theme.preloadShadowCssUrls(shadowCssUrls)`;
   
   - block HTML surface reconciliation until the promises resolve;
   
   - surface attach reads CSS synchronously from `runtime._theme.getShadowCssText()`.

4. Canvas route activation must not fetch shadow CSS.

5. HTML activation must include `shared/html/HtmlShadowCommon.css` exactly once when required by renderer registry metadata.

6. Production failure handling:
   
   - if shadow CSS fails to load for an HTML route, log the route/URL error;
   
   - do not crash the whole dashboard;
   
   - render safe shell or retain previous session depending on route-change state.

7. Development/test behavior:
   
   - missing expected shadow CSS for HTML route throws.

#### Exit conditions

- Update `tests/runtime/init.test.js`.

- Update `tests/runtime/route-activation-loader.test.js`.

- Test startup shadow CSS preload no longer runs for renderer CSS.

- Test HTML activation preloads both shared and renderer CSS.

- Test CSS is cached before `HtmlSurfaceController.attach`.

- `npm run check:core`.

---

### Phase 8 — Asset policy enforcement

**Intent:** Preserve the current font policy and make route-specific asset ownership explicit for future components.

**Dependencies:** Phase 7.

#### Deliverables

1. Keep current `assets/fonts/*` referenced from `plugin.css`.

2. Keep `font-display: swap` for bundled fonts.

3. Do not add current bundled fonts to component registry `assets` arrays.

4. Keep `runtime/asset-preloader.js` and component-loader asset behavior for future route/component assets.

5. Document the policy:
   
   - plugin-wide fonts: CSS-owned, non-blocking, do not block JS startup, do not block route activation;
   
   - route-specific assets: component-owned, loaded during route activation, cached for plugin session.

6. Update `documentation/architecture/asset-system.md` and `documentation/shared/bundled-fonts.md` if they mention startup behavior that changes.

7. Keep `tests/plugin/plugin-css-fontface.test.js` passing.

8. Add or update tests to assert current fonts are not present in component registry assets.

#### Exit conditions

- `npm run test -- tests/plugin/plugin-css-fontface.test.js tests/config/components.test.js tests/runtime/asset-preloader.test.js`

- `npm run check:core`.

---

### Phase 9 — Stage-based bootstrap loading

**Intent:** Reduce avoidable serial script latency after the main lazy runtime migration is stable.

**Dependencies:** Phases 1–8.

#### Deliverables

1. Update `config/bootstrap-manifest.js` to support staged manifests while keeping a simple raw-file format.

2. Recommended shape:

```javascript
config.bootstrapManifest = [
  ["runtime/namespace.js"],
  [
    "runtime/PerfSpanHelper.js",
    "runtime/helpers.js",
    "runtime/editable-defaults.js"
  ],
  [
    "config/components/registry-shared-foundation-format.js",
    "config/components/registry-shared-foundation-geometry.js",
    "config/components/registry-shared-foundation-layout.js",
    "config/components/registry-shared-foundation-state.js",
    "config/components/registry-shared-engines.js",
    "config/components/registry-widgets-nav.js",
    "config/components/registry-widgets-vessel.js",
    "config/components/registry-widgets-gauge.js",
    "config/components/registry-cluster.js"
  ],
  ["shared/unit-format-families.js"],
  ["config/components.js"],
  [
    "config/shared/editable-param-utils.js",
    "config/shared/kind-defaults.js",
    "config/shared/common-editables.js"
  ],
  ["config/shared/unit-editable-utils.js"],
  [
    "config/shared/environment-base-editables.js",
    "config/shared/environment-depth-editables.js",
    "config/shared/environment-temperature-editables.js"
  ],
  ["config/shared/environment-editables.js"],
  [
    "config/clusters/course-heading.js",
    "config/clusters/speed.js",
    "config/clusters/environment.js",
    "config/clusters/wind.js",
    "config/clusters/nav.js",
    "config/clusters/map.js",
    "config/clusters/anchor.js",
    "config/clusters/vessel.js",
    "config/clusters/default.js"
  ],
  ["config/cluster-route-manifest.js"],
  ["config/widget-definitions.js"],
  [
    "runtime/asset-preloader.js",
    "runtime/widget-registrar.js",
    "runtime/HostCommitController.js",
    "runtime/SurfaceSessionController.js",
    "runtime/TemporaryHostActionBridgeDiscovery.js",
    "runtime/TemporaryHostActionBridge.js",
    "runtime/theme-runtime.js",
    "runtime/cluster-shell-renderer.js",
    "runtime/route-activation-loader.js"
  ],
  ["runtime/component-loader.js"],
  ["runtime/init.js"]
];
```

3. Update `plugin.js` loading logic:
   
   - if a manifest item is a string, load it as a single sequential stage for backwards readability;
   
   - if a manifest item is an array, load all paths in the stage with `Promise.all`;
   
   - stages still run sequentially.

4. Preserve deterministic dependency boundaries. Do not parallelize scripts that depend on side effects from another script in the same stage.

5. Update `tools/components-registry-loader.mjs` and bootstrap manifest tests to understand staged manifests.

6. Add tests for:
   
   - staged manifest order;
   
   - parallel stage loading;
   
   - legacy flat manifest support if retained;
   
   - bootstrap failure propagation.

#### Exit conditions

- `npm run test -- tests/plugin/plugin-bootstrap.test.js tests/config/components.test.js`

- `npm run check:core`

- No route implementation modules are added to bootstrap manifest stages.

---

### Phase 10 — Documentation, gates, and performance baseline

**Intent:** Make the new architecture enforceable and documented.

**Dependencies:** Phases 1–9.

#### Deliverables

1. Update `documentation/architecture/cluster-widget-system.md`:
   
   - remove `ClusterMapperRegistry` ownership;
   
   - remove `ClusterRendererRouter` ownership;
   
   - describe route frame, shell renderer, route activation loader, and activated session reconciliation.

2. Update `documentation/architecture/component-system.md`:
   
   - startup no longer means all widget dependency closure;
   
   - route-specific `shadowCss` loads during activation;
   
   - route-specific assets load during activation;
   
   - staged bootstrap manifest rules.

3. Update `documentation/architecture/runtime-lifecycle.md`:
   
   - startup registration path;
   
   - first shell render;
   
   - post-commit activation;
   
   - latest-wins async guard;
   
   - finalize cleanup.

4. Update `documentation/architecture/surface-session-controller.md`:
   
   - activated payload shape;
   
   - route/renderer identity handling;
   
   - direct surface controller creation.

5. Update `documentation/architecture/html-renderer-lifecycle.md`:
   
   - shadow CSS is activation-cached before attach;
   
   - no startup-wide shadow CSS preload.

6. Update `documentation/guides/add-new-cluster.md` and `documentation/guides/add-new-html-kind.md`:
   
   - new route manifest entry is required;
   
   - route-specific dependency buckets are required;
   
   - renderer `shadowCss` declaration remains on component registry entry;
   
   - no changes to `ClusterRendererRouter` because it no longer exists.

7. Add dependency/pattern guards if existing checks do not cover the new architecture:
   
   - forbid `ClusterWidget` deps containing removed modules;
   
   - forbid source imports/references to removed modules;
   
   - ensure route manifest component IDs exist;
   
   - ensure route manifest renderer IDs match renderer component APIs.

8. Update perf harness/baseline as needed:
   
   - add startup component count measurement;
   
   - add cold route activation measurement;
   
   - add warm same-route update measurement;
   
   - add HTML cold activation shadow CSS measurement;
   
   - keep existing scenario baselines comparable where possible.

9. Run full gates:
   
   - `npm run check:all`
   
   - `npm run perf:check`

#### Exit conditions

- All architecture docs describe only the new owners.

- No docs instruct adding routes to `ClusterRendererRouter` or `ClusterMapperRegistry`.

- `npm run check:all` passes.

- `npm run perf:check` passes or baseline is intentionally updated with a documented reason.

---

## File-Level Change Map

### New files

| File                                            | Purpose                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `config/cluster-route-manifest.js`              | Canonical route metadata and route dependency buckets                                                   |
| `runtime/cluster-shell-renderer.js`             | Startup-safe route-frame normalization and empty shell rendering                                        |
| `runtime/route-activation-loader.js`            | Demand-driven component activation, mapper execution, shadow CSS activation, activated payload building |
| `tests/config/cluster-route-manifest.test.js`   | Manifest schema and route inventory tests                                                               |
| `tests/runtime/cluster-shell-renderer.test.js`  | Shell renderer and route-frame tests                                                                    |
| `tests/runtime/route-activation-loader.test.js` | Lazy activation, latest-wins, shadow CSS, route cache tests                                             |

### Files to rewrite or materially update

| File                                        | Required change                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `cluster/ClusterWidget.js`                  | Minimal synchronous shell/orchestrator; remove mapper/router calls; registry deps become `["PerfSpanHelper"]`   |
| `cluster/rendering/ClusterKindCatalog.js`   | Manifest-backed list/resolve/validate adapter                                                                   |
| `cluster/rendering/ClusterSurfacePolicy.js` | Keep policy logic; rename router-era error prefixes to activation-era names                                     |
| `runtime/SurfaceSessionController.js`       | Payload-aware direct controller creation and route/renderer identity tracking                                   |
| `runtime/init.js`                           | Startup component set shrinks to 4; no startup-wide route shadow CSS preload; configure route activation loader |
| `runtime/component-loader.js`               | Keep cache behavior; add any helper needed for route dependency diagnostics only if needed                      |
| `plugin.js`                                 | Stage-based bootstrap loading in later phase                                                                    |
| `config/bootstrap-manifest.js`              | Add new config/runtime files; later convert to staged manifest                                                  |
| `config/components/registry-cluster.js`     | Remove deleted module entries/deps; ClusterWidget deps become `["PerfSpanHelper"]`                              |
| `config/components/registry-widgets-nav.js` | Remove `RendererPropsWidget` entry if deleted                                                                   |
| `cluster/mappers/NavMapper.js`              | Remove create-time view-model construction; consume route context view model                                    |
| `cluster/mappers/MapMapper.js`              | Remove create-time `AisTargetViewModel`; consume route context view model                                       |
| `cluster/mappers/VesselMapper.js`           | Remove registry-level `AlarmViewModel` dep; consume route context view model                                    |
| Mapper tests                                | Update to pass route context for view-model routes                                                              |
| Runtime/config/plugin tests                 | Update for shell-first and staged/lazy behavior                                                                 |
| Architecture docs                           | Replace old ownership model                                                                                     |

### Files to delete

| File                                            | Reason                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `cluster/rendering/ClusterRendererRouter.js`    | Router-era eager owner replaced by manifest + shell renderer + activation loader               |
| `cluster/rendering/SurfaceControllerFactory.js` | Dynamic router-era controller factory replaced by direct activated payload controller creation |
| `cluster/mappers/ClusterMapperRegistry.js`      | Eager all-mapper registry replaced by route manifest mapper IDs                                |
| `cluster/rendering/RendererPropsWidget.js`      | Broad renderer dependency fan replaced by activation-time `rendererProps` merge                |

Delete tests that exist only for deleted abstractions, replacing behavior coverage under the new owners.

---

## Runtime API Contracts

### `ClusterWidget.translateFunction(props)`

Input: raw AvNav props.

Output: route frame.

Required behavior:

```javascript
{
  ...rawProps,
  cluster,
  kind,
  __dyniRouteId,
  __dyniRawProps
}
```

Rules:

- no mapper execution;

- no route dependency loading;

- no renderer payload construction;

- no view-model construction;

- no shadow CSS loading;

- no DOM access.

### `cluster-shell-renderer.renderRouteShell(routeFrame, routeMeta, instanceId)`

Required behavior:

- synchronous;

- startup-safe;

- generic shell only;

- applies manifest initial shell sizing: `aspect-ratio` for ratio, `height` for natural, no CSS sizing for none;

- no surface implementation imports;

- no renderer spec calls.

### `route-activation-loader.activate(frame)`

Required behavior:

- async on cold activation (cache miss); synchronous fast-path on warm activation (cache hit);

- demand-driven;

- session-cached at two levels: global route activation cache and component-loader cache;

- latest-wins;

- loads exact route dependencies;

- loads active HTML shadow CSS before hydration;

- maps latest raw props only;

- builds activated payload;

- never preloads predicted routes.

### `SurfaceSessionController.reconcileSession(activatedPayload)`

Required behavior:

- synchronous;

- stale revision guard;

- route/renderer/surface identity guard;

- attach/update/remount/surface-switch lifecycle;

- direct payload controller creation.

---

## Performance Analysis

### Startup cost currently dominated by dependency closure

The current critical issue is not a slow individual renderer. The startup loader reaches every registered component because:

```text
widgetDefinitions → ClusterWidget → ClusterRendererRouter + ClusterMapperRegistry → all renderers + all mappers → all transitive deps
```

Fixing this requires breaking ownership, not merely adding `Promise` wrappers around existing modules.

### Route activation cost must avoid broad wrappers

A naive lazy implementation that simply lazy-loads the current `ClusterRendererRouter` would still load all renderer specs. A naive lazy implementation that loads `RendererPropsWidget` for a gauge route would still load 15 renderer dependencies. A naive lazy implementation that loads `NavMapper` with current registry deps would still load all nav HTML route view models.

Therefore PLAN20 requires route-specific dependency buckets and removal of broad eager wrappers.

### First render sizing must come from manifest metadata

Because renderer specs are lazy, first shell render cannot call `rendererSpec.getVerticalShellSizing()`. The route manifest must carry startup-safe initial shell sizing for all routes. This duplicates a small amount of renderer sizing metadata intentionally to keep startup minimal.

The duplication is acceptable because:

- sizing metadata is tiny and stable;

- tests can verify parity with renderer `getVerticalShellSizing()` for static ratio routes;

- `nav/routePoints` uses `shellSizing.kind: "none"` because its natural height depends on mapped data and committed shell width, neither of which is available before activation. This matches current behavior where `RoutePointsTextHtmlWidget.getVerticalShellSizing()` returns `undefined` on the first cold render.

### No predictive preload

Predictive preloading would risk recreating the startup cliff after first paint. PLAN20 deliberately avoids it. The correct baseline is:

```text
load active route only
cache loaded route implementations for session
measure cold activation
optimize route bundles if needed
```

### Same-route update loop remains unchanged

The existing commit and rendering owners already do important coalescing:

- `HostCommitController` gates host commits by revision;

- `CanvasDomSurfaceAdapter` coalesces canvas paints on RAF;

- `HtmlSurfaceController` owns immediate committed DOM updates and guarded relayout.

PLAN20 adds only the async activation guards required by lazy loading.

### Warm-path activation is synchronous via fast-path

Cold route activation is inherently async (component loading returns promises). Without a fast-path, warm same-route updates would also go through the promise chain — even when every component is a cache hit — adding a microtask delay between host commit and surface reconciliation.

The route activation loader implements a synchronous fast-path: if the global route activation cache already holds the route's resolved dependency set, activation skips the promise chain entirely and maps/builds the payload synchronously. This preserves the current behavior where the commit-to-reconciliation path has no async hop on warm updates.

### Bootstrap parallelization is secondary

The flat bootstrap manifest is serial today. This is worth improving, but only after the main route activation migration. It should reduce avoidable script latency without changing the no-build deployment model.

---

## Acceptance Criteria

### Startup and dependency closure

- `ClusterWidget` registry deps are exactly `["PerfSpanHelper"]`.

- `ClusterWidget` registry deps no longer include `ClusterMapperToolkit`, `ClusterRendererRouter`, `ClusterMapperRegistry`, mapper modules, view models, renderer modules, `CanvasDomSurfaceAdapter`, `HtmlSurfaceController`, `ClusterSurfacePolicy`, or route-specific shadow CSS.

- Startup component load set is asserted by tests and equals 4: `ClusterWidget`, `PerfSpanHelper`, `ThemeModel`, `ThemeResolver`.

- `loader.uniqueComponents(widgetDefinitions)` no longer returns all 131 components.

- Widget registration still registers all 9 cluster widget definitions.

### Removed abstractions

- `cluster/rendering/ClusterRendererRouter.js` is deleted.

- `cluster/rendering/SurfaceControllerFactory.js` is deleted.

- `cluster/mappers/ClusterMapperRegistry.js` is deleted.

- `cluster/rendering/RendererPropsWidget.js` is deleted or no longer a broad dependency fan; preferred final state is deleted.

- No source/runtime code references deleted modules.

### Route manifest

- `config/cluster-route-manifest.js` exists and is canonical.

- Manifest contains exactly 59 current routes.

- `ClusterKindCatalog` reads from manifest and contains no hard-coded `CATALOG_ENTRIES` route list.

- Manifest route IDs, component IDs, renderer IDs, view-model IDs, surfaces, and shell sizing are validated by tests.

### Shell lifecycle

- `translateFunction()` returns route frame only.

- `renderHtml()` returns empty-but-sized shell synchronously.

- Shell contains stable route/surface/instance data attributes.

- Shell has no visible loading indicator.

- Shell sizing `none` applies no CSS sizing; ratio applies `aspect-ratio`.

- Unknown routes fail loudly in tests/development and are non-fatal in production.

### Route activation

- Active route dependencies load on demand.

- Mapper execution happens after activation, not during `translateFunction()`.

- Route-specific view models load only for routes that require them.

- `rendererProps` behavior is preserved without loading all renderer families.

- Loaded route implementations are cached for the complete session.

- Warm same-route updates use the synchronous fast-path with no async hop between commit and surface reconciliation.

- Predictive preloading does not exist in code, docs, or tests.

### Shadow CSS and assets

- Startup no longer preloads all renderer `shadowCss` URLs.

- HTML route activation preloads active renderer shadow CSS before hydration.

- Canvas route activation does not preload shadow CSS.

- Current bundled fonts remain declared in `plugin.css` and are not component-loader assets.

- Future route-specific assets remain component-owned and route-activation-loaded.

### Surface lifecycle

- `SurfaceSessionController` reconciles activated payloads synchronously.

- Same route/renderer/surface updates existing controller.

- Route/renderer identity changes destroy and recreate controller defensively.

- Surface switches destroy old controller and attach new controller.

- Finalize cleans host commit state, surface session, and pending activation state.

### Scheduling and races

- No new global same-route scheduler/debouncer exists.

- Cold activation is latest-wins and revision-gated.

- Late/stale activation completions cannot hydrate or update DOM.

### Bootstrap

- Stage-based bootstrap manifest is implemented after route migration.

- Scripts in the same stage are dependency-independent.

- No route implementation modules are added to bootstrap stages.

- Plugin bootstrap tests cover staged loading and failure propagation.

### Documentation and gates

- Architecture docs describe new owners and no longer instruct use of removed router-era modules.

- Add-new-kind/add-new-cluster guides mention route manifest entries.

- `npm run check:all` passes.

- `npm run perf:check` passes or is updated intentionally with documented baseline changes.

---

## Test Plan

Minimum required focused test coverage:

```text
tests/config/cluster-route-manifest.test.js
tests/cluster/rendering/ClusterKindCatalog.test.js
tests/runtime/cluster-shell-renderer.test.js
tests/runtime/route-activation-loader.test.js
tests/runtime/SurfaceSessionController.test.js
tests/cluster/ClusterWidget.test.js
tests/runtime/init.test.js
tests/runtime/component-loader.test.js
tests/plugin/plugin-bootstrap.test.js
tests/config/components.test.js
tests/plugin/plugin-css-fontface.test.js
```

Full gate before completion:

```bash
npm run check:all
npm run perf:check
```

Additional guard tests to add:

1. Startup closure guard: `ClusterWidget` closure must not include lazy implementation categories.

2. Route dependency guard: representative routes must not load unrelated renderer/view-model families.

3. Manifest parity guard: static shell sizing in manifest must match renderer `getVerticalShellSizing()` for ratio routes.

4. Shadow CSS guard: startup does not preload route CSS; HTML activation does.

5. Race guard: stale activation promise resolution is discarded.

6. Warm-path guard: second activation of the same route uses the synchronous fast-path and does not enter the promise chain.

7. Deletion guard: removed module names do not appear in runtime source except in completed plan documentation.

---

## Risks and Mitigations

| Risk                                                        | Mitigation                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Shell sizing drifts from renderer sizing                    | Keep sizing in manifest, add parity tests for static ratio renderers, document RoutePoints exception |
| Async activation hydrates stale props                       | Latest-wins revision guard tied to `HostCommitController` revision                                   |
| Route-specific view-model refactor changes mapper output    | Update mapper tests route-by-route; compare current mapper outputs before and after                  |
| Removing `RendererPropsWidget` changes gauge renderer props | Add activation-level `rendererProps` merge tests and representative gauge render tests               |
| HTML route flashes unstyled content                         | Block HTML hydration until active renderer shadow CSS is cached                                      |
| Production unknown route crashes dashboard                  | Safe shell + log-once production behavior                                                            |
| Staged bootstrap introduces ordering bug                    | Stage tests and conservative staging; only parallelize independent scripts                           |
| Docs retain old ownership model                             | Documentation phase includes explicit router/registry/factory removal checks                         |
| File-size gates fail due new runtime files                  | Keep new APIs split: shell renderer, activation loader, manifest tests, surface tests                |

---

## Non-Goals

- No predictive route preloading.

- No route neighbor warming.

- No JS module unloading or LRU eviction.

- No global render debounce scheduler.

- No build step, bundler, import map, code generation pipeline, or compiled manifest.

- No visual loading indicator.

- No redesign of gauge rendering engines.

- No per-kind mapper file split unless required by gates; PLAN20 only requires removing unrelated route-specific view-model dependencies.

- No moving current plugin-wide fonts into component assets.

---

## Related

- `documentation/guides/exec-plan-authoring.md`

- `documentation/architecture/component-system.md`

- `documentation/architecture/cluster-widget-system.md`

- `documentation/architecture/runtime-lifecycle.md`

- `documentation/architecture/surface-session-controller.md`

- `documentation/architecture/host-commit-controller.md`

- `documentation/architecture/html-renderer-lifecycle.md`

- `documentation/architecture/asset-system.md`

- `documentation/shared/bundled-fonts.md`

- `documentation/guides/performance-gate.md`

- `exec-plans/completed/PLAN19.md`
