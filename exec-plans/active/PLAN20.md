# PLAN20: Runtime API Rebuild and Lazy Route Activation for dyninstruments

**Goal:** Rebuild the dyninstruments runtime around clean bootstrap, runtime-service, component-instantiation, and route-activation APIs; then use that runtime to remove eager clustered startup and activate only the mapper, optional view-model, renderer, shadow CSS, and route-specific assets required by the active widget route.

**Status:** Plan — not yet implemented

---

## Status

This plan is the implementation source of truth for a runtime rebuild and performance migration. The required end state is not just “lazy loading”; it is a cleaner runtime architecture with explicit service ownership, dependency-scoped component creation, split route metadata, a startup-safe shell, and lazy route activation built on those APIs.

The target architecture has these final properties:

- bootstrap loads raw runtime/config/service scripts and registers the minimal synchronous `ClusterWidget` shell component;
- runtime services have explicit owners: theme, perf, format, canvas, DOM, host actions, surfaces, component loading, shell rendering, and route activation;
- theme, perf, and surface lifecycle are bootstrap runtime infrastructure, not registered components and not fake component modules;
- registered components are instantiated only through `runtime.componentLoader.createInstance(id, def)`;
- component contexts are created internally by the component loader and expose runtime services plus declared component dependencies only;
- `runtime.createHelpers()` and `Helpers.getModule()` are removed from final runtime source;
- `ClusterWidget` becomes the AvNav shell/orchestrator boundary;
- `translateFunction()` only normalizes a route frame;
- route activation is the only place mapper/view-model/renderer implementation code is created and executed;
- loaded component modules remain cached for the plugin session, while component instances have explicit per-tree/per-widget lifetimes;
- `ClusterRendererRouter`, `SurfaceControllerFactory`, `ClusterMapperRegistry`, `ClusterKindCatalog`, and `RendererPropsWidget` are removed as architecture owners.

Temporary aliases are acceptable only inside migration phases when tests are being moved. No final phase may leave compatibility facades, parallel ownership, or broad helper/service-locator paths behind.

---

## Goal

After PLAN20 is complete, repository-visible and runtime-visible outcomes must be:

1. Runtime APIs have clear ownership boundaries: bootstrap/orchestration code uses `runtime.*`; registered components are created by `runtime.componentLoader.createInstance(id, def)` and receive a loader-created `componentContext`.
2. `runtime.createHelpers()` and `Helpers.getModule()` are gone from final runtime source.
3. `componentContext.components.require(id)` is dependency-scoped, component-loader-owned, and returns declared dependency instances only.
4. Theme, perf, format, canvas, DOM, host actions, and surfaces are runtime services with explicit owners.
5. Theme internals are core bootstrap runtime code, not registered components.
6. Surface lifecycle is runtime infrastructure, not route implementation.
7. Initial plugin startup no longer resolves the complete 131-component dependency closure through `ClusterWidget`.
8. Startup widget registration remains synchronous and AvNav-compatible.
9. First render returns an empty-but-sized shell with stable mount points and no visible loading text/spinner.
10. Only the active/current `cluster/kind` route activates mapper, optional view-model, renderer, renderer deps, shadow CSS, and route-specific assets.
11. Mapper execution happens only inside the activated route pipeline after route components are loaded.
12. HTML renderer shadow CSS is fetched and cached during route activation before hydration.
13. Current bundled fonts remain plugin-wide `plugin.css` assets with `font-display: swap`.
14. Same-route updates keep the current host-commit and surface scheduling behavior.
15. Cold activation is latest-wins and revision-gated so stale async completions cannot hydrate.
16. Rare same-instance route identity changes detach stale shell-bound resources promptly and reconcile/destroy through `SurfaceSessionController` when a new payload succeeds.
17. Tests, documentation, dependency checks, and performance gates enforce that the old eager dependency chain and helper/service-locator patterns cannot return.

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

| Area                   | Decision                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary target         | Rebuild runtime APIs and use the rebuilt runtime for lazy route activation                                                                                                                                                                                                                                                                              |
| Bootstrap runtime      | Raw-script bootstrap configures explicit runtime services and registers the synchronous shell widget                                                                                                                                                                                                                                                    |
| Runtime service names  | Cross-file runtime services use clear public names such as `runtime.theme`, `runtime.format`, `runtime.canvas`, `runtime.dom`, `runtime.perf`, `runtime.surfaces`, `runtime.componentLoader`, `runtime.clusterShellRenderer`, and `runtime.routeActivation`                                                                                             |
| Underscored fields     | Underscored runtime fields are private implementation details, not cross-file contracts                                                                                                                                                                                                                                                                 |
| Component creation     | `runtime.componentLoader.createInstance(id, def)` is the only final registered-component instance factory                                                                                                                                                                                                                                               |
| Component context      | Component contexts are component-loader-created internals; no public `runtime.createComponentContext` API exists                                                                                                                                                                                                                                        |
| Component dependencies | `componentContext.components.require(id)` is a pure lookup of already-created declared dependency instances                                                                                                                                                                                                                                             |
| Dependency instances   | Dependency instances are created deterministically during `createInstance(id, def)`                                                                                                                                                                                                                                                                     |
| Instance lifetime      | Component modules are cached globally; component instances are fresh per public `createInstance()` tree; route activation may cache route-root instances per widget route                                                                                                                                                                               |
| Dependency cycles      | Registered component dependency cycles are invalid and must be detected with full path reporting                                                                                                                                                                                                                                                        |
| Old helpers            | `runtime.createHelpers()` and `Helpers.getModule()` are deleted from final runtime source                                                                                                                                                                                                                                                               |
| Theme                  | Theme model/resolution is core bootstrap runtime code behind `runtime.theme`. Bootstrap methods (`configure`, `applyToRoot`, `preloadShadowCssUrls`, `getShadowCssText`, `hasShadowCssText`, `resolveStartupPresetName`) are runtime-only. Per-render token resolution is exposed to registered components through `componentContext.theme.tokens` only |
| Perf                   | `runtime/PerfSpanHelper.js` is the single perf-span implementation; registered components use `componentContext.perf`                                                                                                                                                                                                                                   |
| Surfaces               | `ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, and `HtmlSurfaceController` move to runtime surface infrastructure behind `runtime.surfaces`                                                                                                                                                                                                         |
| Route metadata         | Split checked-in route metadata files define explicit route objects; aggregator derives `routeId` and `byRouteId`                                                                                                                                                                                                                                       |
| Route ID               | `routeId` is always derived from `cluster + "/" + kind`, never hand-written in per-route objects                                                                                                                                                                                                                                                        |
| Registration component | `ClusterWidget` becomes a minimal synchronous shell/orchestrator with registry deps `[]`                                                                                                                                                                                                                                                                |
| First render           | Empty-but-sized shell; no visible loading text/spinner                                                                                                                                                                                                                                                                                                  |
| Shell ownership        | `ClusterShellRenderer` owns generic shell/mount markup; surface controllers attach to committed shells only                                                                                                                                                                                                                                             |
| Mapping lifecycle      | `translateFunction()` returns a route frame; activated mapper receives clean `mapperProps` without `__dyni*` internals                                                                                                                                                                                                                                  |
| Mapper toolkit         | `RouteActivationController` per-widget controllers own the `ClusterMapperToolkit` instance and call `createToolkit(mapperProps)` per activation; the resulting toolkit object is passed on `routeContext.toolkit`. Mappers do not declare `ClusterMapperToolkit` in their deps and stop accepting toolkit as a positional argument                      |
| View models            | `viewModelId` is optional route metadata; routes without it use mapper output directly                                                                                                                                                                                                                                                                  |
| Renderer props         | `RendererPropsWidget` is deleted; route activation merges `mappedProps.rendererProps` before surface reconciliation                                                                                                                                                                                                                                     |
| Component graph        | `config.components` + `runtime.componentLoader` are the only registered-component dependency graph                                                                                                                                                                                                                                                      |
| Preloading             | No predictive preloading, route-neighbor warming, or idle warming is added                                                                                                                                                                                                                                                                              |
| Module cache           | Loaded component modules remain cached for the plugin session; successful JS module eviction is out of scope                                                                                                                                                                                                                                            |
| Warm activation        | Warm activation returns a payload synchronously; no `Promise.resolve()` wrapping on the hot path                                                                                                                                                                                                                                                        |
| Active-route loading   | Active-route loading starts after the latest shell commit, not during `renderHtml()`                                                                                                                                                                                                                                                                    |
| Bootstrap manifest     | Keep the current flat raw-script bootstrap model while rebuilding the runtime                                                                                                                                                                                                                                                                           |
| Shell sizing           | Route metadata `shellSizing` describes only the empty pre-activation placeholder. Final post-activation sizing is owned by the renderer's shadow CSS. Runtime never calls a renderer sizing hook on attach, update, or commit. The `getVerticalShellSizing` renderer-spec slot is deleted entirely                                                      |
| Removed owners         | Remove `ClusterRendererRouter`, `SurfaceControllerFactory`, `ClusterMapperRegistry`, `ClusterKindCatalog`, and `RendererPropsWidget`                                                                                                                                                                                                                    |

---

## Hard Constraints

1. **No build step.** All changes must work with raw source files served by AvNav.
2. **No compatibility facades for removed owners.** Removed router/registry/factory abstractions must not remain as shadow owners.
3. **No eager mapper/renderer/view-model startup path.** `ClusterWidget` startup deps must be `[]` and must not include implementation families.
4. **No second component dependency graph.** Route metadata may name direct role components only: `mapperId`, optional `viewModelId`, and `rendererId`. Transitive dependencies stay only in `config.components`.
5. **No global component-instance cache.** Component modules are globally cached; component instances are not globally shared by component-loader.
6. **No predictive preloading.** Load only the active route roots and their registry-owned dependency closure.
7. **No JS module eviction.** Successfully loaded route implementation modules remain cached for the plugin session.
8. **No global scheduler.** Do not add a new global debounce/coalescing scheduler for normal same-route updates.
9. **No visible loading UI.** Cold route shells are empty-but-sized with diagnostic attributes allowed, but no loading text or spinner.
10. **Current fonts remain CSS-owned.** Do not move bundled fonts into component-loader assets or JS preloads.
11. **Route-specific shadow CSS is activation-owned.** Do not preload all renderer `shadowCss` during startup.
12. **Surface resources must still clean up.** DOM nodes, canvas state, timers, observers, RAF handles, font listeners, action bridges, and surface sessions must be detached/destroyed as before.
13. **Line-size gates still apply.** Split files instead of compressing metadata into opaque packed rows.
14. **Docs must not describe old ownership after cutover.** Architecture docs must remove router/registry/factory ownership claims.
15. **Registered-component dependency cycles are invalid.** Detect cycles during loading and instance creation; do not add lazy proxies or partial instances to support cycles.

---

## Target Runtime Architecture

### Clean runtime model

```text
plugin.js + flat bootstrap manifest
= raw-script bootstrap runtime/config/service lane

runtime services
= explicit domain APIs:
  runtime.theme
  runtime.format
  runtime.canvas
  runtime.dom
  runtime.perf
  runtime.hostActions
  runtime.surfaces
  runtime.componentLoader
  runtime.clusterShellRenderer
  runtime.routeActivation

config.components
= registered route implementation component registry:
  id, script path, deps, assets, css, shadowCss, UMD global

config.clusterRoutes
= route metadata only:
  cluster, kind, mapperId, optional viewModelId, rendererId, surface, shellSizing

componentContext
= loader-created dependency object passed to registered components:
  componentContext.components.require(id)  // declared deps only, instance only
  componentContext.theme        // tokens-only view; no bootstrap methods
    .tokens.resolveForRoot(rootEl)
  componentContext.perf
  componentContext.format
  componentContext.canvas
  componentContext.dom
  componentContext.hostActions

ClusterWidget
= synchronous AvNav shell/orchestrator boundary

runtime.routeActivation
= service that creates per-widget activation controllers;
  controllers compute active route roots and build activated payloads
```

Rules:

- runtime services are classic bootstrap scripts and are not hidden behind `component-loader`;
- `config.components` remains the only source of registered route implementation script/dependency/asset metadata;
- `config.clusterRoutes` never contains transitive dependencies, preload hints, assets, CSS, shadow CSS, priority hints, idle warming metadata, or duplicated dependency lists;
- `runtime.componentLoader` is the only owner that walks registered `deps`, caches loaded modules, validates component APIs, preloads component CSS/assets, evicts failed load promises for retry, and creates registered component instances;
- `runtime.componentLoader.loadComponent(id)` is async and loads modules/deps/CSS/assets;
- `runtime.componentLoader.createInstance(id, def)` is synchronous, requires the module/dependency closure to be loaded, creates a fresh instance tree, and throws clearly if called too early;
- component context creation is internal to component-loader;
- route activation computes small direct route root IDs from route metadata and delegates all registered dependency traversal to component-loader;
- registered components use `componentContext` for runtime-facing services and declared component dependencies; they do not reach into global runtime for ordinary services.

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
→ load bootstrap/config/runtime service code
→ runtime.runInit()
→ configure runtime.theme, runtime.surfaces, runtime services, component-loader, shell renderer, route activation
→ load startup-critical widget component only:
    ClusterWidget
→ register all 9 cluster widget definitions synchronously
```

### Target first render path

```text
Host calls ClusterWidget.translateFunction(rawProps)
→ normalize route frame:
    cluster
    kind
    __dyniRouteId
    __dyniRawProps
→ Host calls ClusterWidget.renderHtml(routeFrame)
→ config.clusterRoutes.byRouteId resolves route metadata
→ ClusterShellRenderer returns empty sized shell synchronously
→ HostCommitController schedules commit
→ renderHtml returns immediately
```

### Target activation/hydration path

```text
HostCommitController commits latest shell revision
→ ClusterWidget calls runtime.theme.applyToRoot(rootEl) to materialize theme tokens onto the freshly committed root
→ ClusterWidget detaches any mounted controller whose shellEl was replaced
→ activationController.activateCommittedRoute({ routeFrame, revision, rootEl, shellEl, hostContext })
→ activation controller computes direct route roots:
    mapperId
    optional viewModelId
    rendererId
→ component-loader loads those roots and registry-owned transitive deps
→ route activation preloads active HTML renderer shadow CSS, if any
→ component-loader creates mapper/view-model/renderer instances through dependency-scoped component contexts
→ activation controller builds routeContext { routeId, cluster, kind, viewModel, toolkit }
  with toolkit = clusterMapperToolkit.createToolkit(mapperProps)
→ activated mapper maps clean mapperProps using routeContext, not route-frame internals
→ activation merges rendererProps into payload when needed
→ runtime.surfaces materializes runtime-only surface policy props
→ data-only activated payload returns to ClusterWidget
→ SurfaceSessionController reconciles synchronously using runtime.surfaces
→ shell hydrates silently
```

### Target same-route update path

```text
same widget instance
same routeId
same rendererId
same surface
→ host commit latest revision
→ activation controller warm fast-path returns data payload synchronously
→ mapper maps latest mapperProps
→ existing surface session update(payload)
```

### Target rare route-change path

```text
same widget instance
new routeId / rendererId / surface
→ new shell commit detaches stale shell-bound resources
→ activation loads new route if cold
→ on success, SurfaceSessionController destroys/switches old controller as part of reconciling the new payload
→ loaded component modules remain cached
```

---

## Canonical Cluster Routes Shape

Use split explicit route metadata files to keep files clear and under line-size gates.

Bootstrap order:

```text
config/cluster-routes.js
config/cluster-routes/course-heading.js
config/cluster-routes/speed.js
config/cluster-routes/environment.js
config/cluster-routes/wind.js
config/cluster-routes/nav.js
config/cluster-routes/map.js
config/cluster-routes/anchor.js
config/cluster-routes/vessel.js
config/cluster-routes/default.js
config/cluster-routes/finalize.js
```

Initializer shape:

```javascript
(function (root) {
  "use strict";
  var ns = root.DyniPlugin;
  var config = ns.config = ns.config || {};

  config.clusterRoutes = {
    schemaVersion: 1,
    routes: []
  };
}(this));
```

Per-cluster route files push explicit route objects:

```javascript
(function (root) {
  "use strict";
  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "speed",
      kind: "sogRadial",
      mapperId: "SpeedMapper",
      rendererId: "SpeedRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "speed",
      kind: "sog",
      mapperId: "SpeedMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
}(this));
```

Routes that need a route-specific view model declare it explicitly:

```javascript
{
  cluster: "nav",
  kind: "activeRoute",
  mapperId: "NavMapper",
  viewModelId: "ActiveRouteViewModel",
  rendererId: "ActiveRouteTextHtmlWidget",
  surface: "html",
  shellSizing: { kind: "ratio", aspectRatio: 2 }
}
```

Finalizer derives `routeId` and `byRouteId`:

```javascript
(function (root) {
  "use strict";
  var clusterRoutes = root.DyniPlugin.config.clusterRoutes;
  var byRouteId = Object.create(null);

  for (var i = 0; i < clusterRoutes.routes.length; i += 1) {
    var route = clusterRoutes.routes[i];
    route.routeId = route.cluster + "/" + route.kind;
    byRouteId[route.routeId] = route;
  }

  clusterRoutes.byRouteId = byRouteId;
}(this));
```

Rules:

1. Per-route objects do not hand-write `routeId`; the finalizer derives it.
2. `(cluster, kind)` pairs must be unique.
3. `mapperId`, `rendererId`, `surface`, and `shellSizing` are required.
4. `viewModelId` is optional; absent means mapper output is already the renderer payload.
5. Present `mapperId`, `viewModelId`, and `rendererId` values must exist in `config.components`.
6. `surface` must be `"html"` or `"canvas-dom"`; `runtime.surfaces` owns controller creation.
7. Route metadata never contains component buckets, transitive deps, script paths, CSS, shadow CSS, assets, preload hints, priority hints, idle warming metadata, or future override metadata.
8. Current plugin-wide fonts do not appear in route metadata.
9. Future route-specific assets belong on component registry entries, not in `config.clusterRoutes`.
10. `shellSizing.kind` must be `"ratio"` or `"natural"`. `shellSizing` describes only the empty pre-activation placeholder; final post-activation sizing is owned by the renderer's shadow CSS.
11. Runtime route files stay data + tiny derivation only; schema/parity validation lives in tests and gates.

---

## Cluster Routes Inventory

`config.clusterRoutes.routes` must contain the 59 current routes below. This table is the migration inventory for moving hard-coded `ClusterKindCatalog` route metadata into `config/cluster-routes.js`.

| Route                      | Mapper                | View model             | Renderer                    | Surface      | Initial shell sizing |
| -------------------------- | --------------------- | ---------------------- | --------------------------- | ------------ | -------------------- |
| `courseHeading/cog`        | `CourseHeadingMapper` | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/hdt`        | `CourseHeadingMapper` | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/hdm`        | `CourseHeadingMapper` | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/brg`        | `CourseHeadingMapper` | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `courseHeading/hdtRadial`  | `CourseHeadingMapper` | `—`                    | `CompassRadialWidget`       | `canvas-dom` | ratio 1              |
| `courseHeading/hdmRadial`  | `CourseHeadingMapper` | `—`                    | `CompassRadialWidget`       | `canvas-dom` | ratio 1              |
| `courseHeading/hdtLinear`  | `CourseHeadingMapper` | `—`                    | `CompassLinearWidget`       | `canvas-dom` | ratio 2              |
| `courseHeading/hdmLinear`  | `CourseHeadingMapper` | `—`                    | `CompassLinearWidget`       | `canvas-dom` | ratio 2              |
| `default/text`             | `DefaultMapper`       | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `default/linearGauge`      | `DefaultMapper`       | `—`                    | `DefaultLinearWidget`       | `canvas-dom` | ratio 2              |
| `default/radialGauge`      | `DefaultMapper`       | `—`                    | `DefaultRadialWidget`       | `canvas-dom` | ratio 1              |
| `speed/sog`                | `SpeedMapper`         | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `speed/stw`                | `SpeedMapper`         | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `speed/sogLinear`          | `SpeedMapper`         | `—`                    | `SpeedLinearWidget`         | `canvas-dom` | ratio 2              |
| `speed/stwLinear`          | `SpeedMapper`         | `—`                    | `SpeedLinearWidget`         | `canvas-dom` | ratio 2              |
| `speed/sogRadial`          | `SpeedMapper`         | `—`                    | `SpeedRadialWidget`         | `canvas-dom` | ratio 1              |
| `speed/stwRadial`          | `SpeedMapper`         | `—`                    | `SpeedRadialWidget`         | `canvas-dom` | ratio 1              |
| `environment/depth`        | `EnvironmentMapper`   | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `environment/depthLinear`  | `EnvironmentMapper`   | `—`                    | `DepthLinearWidget`         | `canvas-dom` | ratio 2              |
| `environment/depthRadial`  | `EnvironmentMapper`   | `—`                    | `DepthRadialWidget`         | `canvas-dom` | ratio 1              |
| `environment/temp`         | `EnvironmentMapper`   | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `environment/tempLinear`   | `EnvironmentMapper`   | `—`                    | `TemperatureLinearWidget`   | `canvas-dom` | ratio 2              |
| `environment/tempRadial`   | `EnvironmentMapper`   | `—`                    | `TemperatureRadialWidget`   | `canvas-dom` | ratio 1              |
| `environment/pressure`     | `EnvironmentMapper`   | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleTrue`           | `WindMapper`          | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleApparent`       | `WindMapper`          | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleTrueDirection`  | `WindMapper`          | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/speedTrue`           | `WindMapper`          | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/speedApparent`       | `WindMapper`          | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `wind/angleTrueRadial`     | `WindMapper`          | `—`                    | `WindRadialWidget`          | `canvas-dom` | ratio 1              |
| `wind/angleApparentRadial` | `WindMapper`          | `—`                    | `WindRadialWidget`          | `canvas-dom` | ratio 1              |
| `wind/angleTrueLinear`     | `WindMapper`          | `—`                    | `WindLinearWidget`          | `canvas-dom` | ratio 2              |
| `wind/angleApparentLinear` | `WindMapper`          | `—`                    | `WindLinearWidget`          | `canvas-dom` | ratio 2              |
| `nav/eta`                  | `NavMapper`           | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/rteEta`               | `NavMapper`           | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/dst`                  | `NavMapper`           | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/rteDistance`          | `NavMapper`           | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/vmg`                  | `NavMapper`           | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `nav/activeRoute`          | `NavMapper`           | `ActiveRouteViewModel` | `ActiveRouteTextHtmlWidget` | `html`       | ratio 2              |
| `nav/editRoute`            | `NavMapper`           | `EditRouteViewModel`   | `EditRouteTextHtmlWidget`   | `html`       | ratio 0.875          |
| `nav/routePoints`          | `NavMapper`           | `RoutePointsViewModel` | `RoutePointsTextHtmlWidget` | `html`       | natural              |
| `nav/positionBoat`         | `NavMapper`           | `—`                    | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `nav/positionWp`           | `NavMapper`           | `—`                    | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `nav/xteDisplay`           | `NavMapper`           | `—`                    | `XteDisplayWidget`          | `canvas-dom` | ratio 2              |
| `map/centerDisplay`        | `MapMapper`           | `—`                    | `CenterDisplayTextWidget`   | `canvas-dom` | ratio 1              |
| `map/zoom`                 | `MapMapper`           | `—`                    | `MapZoomTextHtmlWidget`     | `html`       | ratio 2              |
| `map/aisTarget`            | `MapMapper`           | `AisTargetViewModel`   | `AisTargetTextHtmlWidget`   | `html`       | ratio 0.875          |
| `anchor/anchorDistance`    | `AnchorMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `anchor/anchorWatch`       | `AnchorMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `anchor/anchorBearing`     | `AnchorMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/voltage`           | `VesselMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/voltageLinear`     | `VesselMapper`        | `—`                    | `VoltageLinearWidget`       | `canvas-dom` | ratio 2              |
| `vessel/voltageRadial`     | `VesselMapper`        | `—`                    | `VoltageRadialWidget`       | `canvas-dom` | ratio 1              |
| `vessel/alarm`             | `VesselMapper`        | `AlarmViewModel`       | `AlarmTextHtmlWidget`       | `html`       | ratio 2              |
| `vessel/clock`             | `VesselMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/dateTime`          | `VesselMapper`        | `—`                    | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `vessel/timeStatus`        | `VesselMapper`        | `—`                    | `PositionCoordinateWidget`  | `canvas-dom` | ratio 2              |
| `vessel/pitch`             | `VesselMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |
| `vessel/roll`              | `VesselMapper`        | `—`                    | `ThreeValueTextWidget`      | `canvas-dom` | ratio 2              |

`nav/routePoints` is the only current route whose shell sizing is `natural`. Route metadata `shellSizing` describes only the empty pre-activation placeholder; for `natural` routes no height is reserved during cold load (the shell starts at near-zero height and grows once the renderer's shadow content mounts).

Final post-activation sizing is owned entirely by the renderer's shadow CSS, not by runtime. Phase 7 deliverable 11 adds a `:host { height: auto; max-height: calc(60vh); display: flex; flex-direction: column; min-height: 0; }` rule to `RoutePointsTextHtmlWidget`'s shadow CSS that overrides `BASE_SHADOW_STYLE_CSS`'s default `:host { height: 100% }`. The shell wraps to the shadow content's height, capped at 60vh by CSS. The renderer's internal `RoutePointsLayout.computeNaturalHeight` continues to be used inside the renderer for its own row-layout decisions (rows, header, gaps, capping at `window.innerHeight × 0.6` to mirror the CSS cap), but it is renderer-internal and is not called by runtime.

---

## Implementation Order

Each phase lists intent, deliverables, and exit conditions. Later phases depend on previous phases unless stated otherwise.

### Phase 1 — Establish canonical split route metadata

**Intent:** Move route metadata out of `ClusterKindCatalog` and into clear checked-in route config without introducing a second dependency graph.

#### Deliverables

1. Add `config/cluster-routes.js` initializer.
2. Add one explicit route file per cluster under `config/cluster-routes/`.
3. Add `config/cluster-routes/finalize.js` to derive `routeId` and build `byRouteId`.
4. Insert the new route metadata files into `config/bootstrap-manifest.js` after cluster config/shared metadata and before widget definitions/runtime consumers. Phase 1 only adds the eleven `config/cluster-routes*` entries (`config/cluster-routes.js`, the nine per-domain files, and `config/cluster-routes/finalize.js`); all other manifest changes shown below land in later phases (`runtime/format-runtime.js`, `runtime/canvas-runtime.js`, `runtime/dom-runtime.js` and the deletion of `runtime/helpers.js` in Phase 2; theme internals folding in Phase 2; `runtime/surface/*` in Phase 2; `runtime/cluster/ClusterShellRenderer.js` in Phase 3; `runtime/cluster/RouteActivationController.js` in Phase 4). The full target manifest order *after PLAN20 completes* is shown below for reference; the manifest matches this listing only at the end of Phase 9, not at the end of Phase 1:

```text
runtime/namespace.js
runtime/PerfSpanHelper.js                  // → runtime.perf
runtime/format-runtime.js                  // → runtime.format
runtime/canvas-runtime.js                  // → runtime.canvas
runtime/dom-runtime.js                     // → runtime.dom
runtime/editable-defaults.js
runtime/theme/<theme model + resolver internals>  // folded into theme runtime
runtime/theme-runtime.js                   // → runtime.theme
config/components/registry-shared-foundation-format.js
config/components/registry-shared-foundation-geometry.js
config/components/registry-shared-foundation-layout.js
config/components/registry-shared-foundation-state.js
config/components/registry-shared-engines.js
config/components/registry-widgets-nav.js
config/components/registry-widgets-vessel.js
config/components/registry-widgets-gauge.js
config/components/registry-cluster.js
shared/unit-format-families.js
config/components.js
config/shared/editable-param-utils.js
config/shared/kind-defaults.js
config/shared/unit-editable-utils.js
config/shared/common-editables.js
config/shared/environment-base-editables.js
config/shared/environment-depth-editables.js
config/shared/environment-temperature-editables.js
config/shared/environment-editables.js
config/clusters/course-heading.js
config/clusters/speed.js
config/clusters/environment.js
config/clusters/wind.js
config/clusters/nav.js
config/clusters/map.js
config/clusters/anchor.js
config/clusters/vessel.js
config/clusters/default.js
config/cluster-routes.js
config/cluster-routes/course-heading.js
config/cluster-routes/speed.js
config/cluster-routes/environment.js
config/cluster-routes/wind.js
config/cluster-routes/nav.js
config/cluster-routes/map.js
config/cluster-routes/anchor.js
config/cluster-routes/vessel.js
config/cluster-routes/default.js
config/cluster-routes/finalize.js
config/widget-definitions.js
runtime/asset-preloader.js
runtime/component-loader.js                // → runtime.componentLoader
runtime/widget-registrar.js
runtime/HostCommitController.js
runtime/SurfaceSessionController.js
runtime/TemporaryHostActionBridgeDiscovery.js
runtime/TemporaryHostActionBridge.js       // → runtime.hostActions
runtime/surface/ClusterSurfacePolicy.js
runtime/surface/CanvasDomSurfaceAdapter.js
runtime/surface/HtmlSurfaceController.js
runtime/surface/index.js                   // → runtime.surfaces (composes the three above)
runtime/cluster/ClusterShellRenderer.js    // → runtime.clusterShellRenderer
runtime/cluster/RouteActivationController.js  // → runtime.routeActivation
runtime/init.js
```

Theme internals files (`runtime/theme/...`) collectively replace today's `ThemeModel.js` and `ThemeResolver.js` source. `runtime/helpers.js` is gone (deleted with `runtime.createHelpers()`). The `runtime/surface/index.js` shim is one acceptable factoring; equivalent factorings are fine as long as `runtime.surfaces` is configured before `runtime/cluster/RouteActivationController.js` runs and `runtime/init.js` is last.
5. Populate the split route metadata files with the 59 current route entries that `ClusterKindCatalog.createDefaultCatalog()` produces today, so that `config.clusterRoutes.routes` becomes the single authoritative source of route metadata starting in Phase 1. The route entries follow the canonical schema in this document: `viewModelId` is omitted on routes that use mapper output directly (it is **not** carried over as the legacy `"MapperOutputViewModel"` sentinel string from today's `ClusterKindCatalog`). Of the 59 routes, five carry an explicit `viewModelId`: `nav/activeRoute`, `nav/editRoute`, `nav/routePoints`, `map/aisTarget`, and `vessel/alarm`; the remaining 54 routes (including the HTML route `map/zoom`, which uses mapper output directly) omit the field. This matches the route table in the "Cluster Routes Inventory" section, where a `—` in the View model column indicates omission.
6. Rebase `cluster/rendering/ClusterKindCatalog.js` onto `config.clusterRoutes`: its `createDefaultCatalog()` (and any sibling helpers used by `ClusterRendererRouter`) must derive `listRoutes()` and `resolveRoute(cluster, kind)` from `root.DyniPlugin.config.clusterRoutes` instead of returning a hard-coded route list. After this rebase the file contains only the thin adapter; the hard-coded route list moves out entirely. The adapter does not synthesize a legacy `viewModelId` default — entries it returns reflect the canonical schema directly, so canvas routes that omit `viewModelId` in `config.clusterRoutes` produce adapter outputs without that field. This is safe because `ClusterRendererRouter` only consumes `cluster`, `kind`, `rendererId`, and `surface` from the catalog (it never reads `viewModelId`), so the live router path remains behaviorally identical through Phase 6. The adapter file is deleted in Phase 7 along with `ClusterRendererRouter`.
7. Keep route files data-only: no runtime validation helpers, no dependency buckets, no assets, no preload hints.
8. Update Node-side config/test loaders to load the split route metadata.
9. Add `tests/config/cluster-routes.test.js`.
10. Delete `tests/cluster/rendering/ClusterKindCatalog.test.js`. Its coverage of route inventory, `(cluster, kind)` uniqueness, surface validity, and reference-to-component-registry parity is fully covered by the new `tests/config/cluster-routes.test.js` (the validation rules below). The old test asserted catalog-output deep equality against the hard-coded `MapperOutputViewModel` sentinel, which the canonical schema retires; rewriting it to match the new shape would just produce a thinner duplicate of `tests/config/cluster-routes.test.js` for one phase before deletion. Phase 7's "deleted files" list still names this file for double-bookkeeping clarity but the deletion happens here.

#### Validation rules to test

- Exactly 59 routes exist.
- Route IDs are unique and derived as `cluster + "/" + kind`.
- `(cluster, kind)` pairs are unique.
- Every surface is `html` or `canvas-dom`.
- Every `shellSizing.kind` is `ratio` or `natural`.
- Every ratio shell sizing has a positive `aspectRatio`.
- Natural shell sizing has no `height` field (final sizing comes from renderer shadow CSS).
- Present `mapperId`, `viewModelId`, and `rendererId` values exist in `config.components`.
- All six HTML routes declare renderer components with `shadowCss` in the component registry.
- Canvas routes do not require renderer `shadowCss`.
- No route entry contains dependency buckets, script paths, CSS, shadow CSS, assets, predictive preload metadata, priority hints, or idle warming metadata.
- Current plugin-wide fonts do not appear in route metadata.
- Route metadata is in parity with AvNav editor kind selectors.
- The Phase 1 rebased `ClusterKindCatalog` returns `listRoutes()` and `resolveRoute(cluster, kind)` results equivalent on the four router-consumed fields (`cluster`, `kind`, `rendererId`, `surface`) to the pre-Phase-1 hard-coded catalog for every (cluster, kind) pair currently in the registry, so `ClusterRendererRouter` continues to work unchanged through Phase 6. `viewModelId` is no longer asserted: the adapter passes through whatever `config.clusterRoutes` declares (present for the five view-model routes, absent elsewhere), and the live router never reads this field.

#### Exit conditions

- `npm run test -- tests/config/cluster-routes.test.js`
- `npm run test -- tests/cluster/rendering/ClusterRendererRouter.test.js` (to confirm the rebased adapter does not regress the live router path)
- `npm run test` (full suite — every phase that touches production code must end with the entire test suite green; the per-file invocations above are explicit because they are the new/most-affected tests for this phase, not because the others are exempt)
- `npm run check:core`

### Phase 2 — Rebuild runtime service boundaries and component-loader-owned instantiation

**Intent:** Replace the catch-all helper/service-locator model with explicit runtime services and a component-loader-owned component context before lazy route activation depends on it.

#### Deliverables

1. Add or clarify explicit runtime service owners:
   
   - `runtime/theme-runtime.js` plus `runtime/theme/*` internals → `runtime.theme`
   - `runtime/format-runtime.js` → `runtime.format`
   - `runtime/canvas-runtime.js` → `runtime.canvas`
   - `runtime/dom-runtime.js` → `runtime.dom`
   - existing host action bridge → `runtime.hostActions`
   - `runtime/PerfSpanHelper.js` → `runtime.perf`
   - `runtime/surface/*` → `runtime.surfaces`

2. Move `ThemeModel` and `ThemeResolver` out of `config.components`, remove them from all component `deps`, and expose only the configured `runtime.theme` service to runtime and component code. Concretely, this requires:
   
   - Deleting `ThemeModel` and `ThemeResolver` registry entries from `config/components/registry-shared-foundation-state.js`.
   - Removing `"ThemeResolver"` from every `deps` array that currently lists it (registry entries in `registry-shared-engines.js`, `registry-shared-foundation-layout.js`, `registry-widgets-nav.js`, `registry-widgets-vessel.js`, and `registry-cluster.js`).
   - Rewriting every component source that today calls `themeResolver.resolveForRoot(rootEl)` (or `theme.resolveForRoot(rootEl)` via a renamed dep) to call `componentContext.theme.tokens.resolveForRoot(rootEl)` instead. Current consumers: `shared/widget-kits/radial/RadialToolkit.js` (the radial/linear engine facade — `GU.theme` becomes `componentContext.theme.tokens` on the toolkit instance, so the three engines below keep their `GU.theme.resolveForRoot(rootEl)` call site), `shared/widget-kits/radial/FullCircleRadialEngine.js`, `shared/widget-kits/radial/SemicircleRadialEngine.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/nav/MapZoomHtmlFit.js`, `shared/widget-kits/nav/AisTargetHtmlFit.js`, `shared/widget-kits/nav/EditRouteHtmlFit.js`, `shared/widget-kits/nav/ActiveRouteHtmlFit.js`, `shared/widget-kits/nav/RoutePointsHtmlFit.js`, `shared/widget-kits/vessel/AlarmHtmlFit.js`, `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`, `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`, `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`, `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`, and `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`.
   - Folding `ThemeModel.js` and `ThemeResolver.js` source into runtime theme internals (under `runtime/theme/...`) so `runtime.theme` can configure them at startup; `shared/theme/ThemeModel.js` and `shared/theme/ThemeResolver.js` are deleted from final source.

3. Delete the component-level `PerfSpanHelper`, remove it from all component `deps`, and make registered components use `componentContext.perf`.

4. Move `ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, and `HtmlSurfaceController` out of `config.components`, remove them from all component `deps`, and put them behind runtime surface infrastructure. Concretely, the migrated source files (`runtime/surface/ClusterSurfacePolicy.js`, `runtime/surface/CanvasDomSurfaceAdapter.js`, `runtime/surface/HtmlSurfaceController.js`) follow the existing runtime-infrastructure convention used by `runtime/HostCommitController.js`, `runtime/SurfaceSessionController.js`, `runtime/theme-runtime.js`, and `runtime/asset-preloader.js`:
   
   - the file body is wrapped in `(function (root) { "use strict"; ... }(this));`;
   - the file reads `root.DyniPlugin.runtime` at script-load time and attaches its public factory/API onto a runtime namespace (the surface infrastructure attaches into `runtime.surfaces`, composed by `runtime/surface/index.js` or an equivalent factoring listed in the target manifest);
   - the file reaches `runtime.perf` and `runtime.theme` directly through the runtime namespace at call time (runtime infrastructure is permitted to use the full `runtime.theme` surface, including `getShadowCssText`, per the `runtime.surfaces` contract);
   - the file does not export to `DyniComponents`, does not have a `globalKey`, does not accept `(def, Helpers)` and does not consume `componentContext` — it is no longer a registered component;
   - the file does not depend on any registered component; transitive dependencies stay only inside `config.components`.
   
   `ClusterSurfacePolicy.applyShellSizingToElement` is not carried over to `runtime/surface/ClusterSurfacePolicy.js`. Shell sizing is now owned by `ClusterShellRenderer` at render time (Phase 3 deliverable 3), so the runtime surface policy has no sizing responsibility.

5. Remove `renderSurfaceShell()` from runtime surface controllers. `ClusterShellRenderer` owns generic shell/mount markup.

5a. **Consequence for `ClusterRendererRouter` and `SurfaceControllerFactory`.** Both files `Helpers.getModule()` the four components moved/removed in deliverable 4 (`ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, `HtmlSurfaceController`, `SurfaceControllerFactory`). Because deliverable 4 removes those four from every component's registry deps, Phase 2 also rewrites `ClusterRendererRouter` and deletes `SurfaceControllerFactory` in the same phase:

- `cluster/rendering/ClusterRendererRouter.js`: `create(def, componentContext)` reads `runtime.surfaces.policy`, `runtime.surfaces.html`, and `runtime.surfaces.canvasDom` from the runtime namespace at create time, and drops `ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, `HtmlSurfaceController`, and `SurfaceControllerFactory` from its registry deps. This makes `ClusterRendererRouter` a transitional boundary component (like `ClusterWidget`) that may reach into runtime services through Phase 6 because it owns the live cluster path; the file is deleted in Phase 7.

- `cluster/rendering/SurfaceControllerFactory.js`: its remaining responsibility — dynamic surface-type dispatch to choose `CanvasDomSurfaceAdapter` or `HtmlSurfaceController` — is absorbed by `runtime.surfaces.createController({ surface })`. The router's call sites that used the factory switch to reading `runtime.surfaces` directly. Delete the file and its registry entry in Phase 2. Do not carry it as a vestigial component to Phase 7.
6. Replace `runtime.createHelpers()` and `Helpers.getModule()` with component-loader-owned component context creation.

7. Add `runtime.componentLoader.createInstance(id, def)` as a strictly synchronous API:
   
   - `loadComponent(id)` is the async load API;
   - `createInstance()` never starts loading and never returns a promise;
   - calling `createInstance()` before the loaded closure is ready throws clearly;
   - each public `createInstance()` call creates a fresh instance tree;
   - component modules are cached globally, but component instances are not;
   - declared dependency instances are created deterministically while the instance tree is built;
   - `componentContext.components.require(id)` is a pure lookup of already-created declared dependency instances;
   - undeclared dependency access throws with the requesting component ID;
   - raw module factories are not exposed through component context;
   - registered component code must not call `.create()` on dependencies;
   - no public `runtime.createComponentContext` API exists.

8. Detect registered-component dependency cycles during both `loadComponent(id)` traversal and `createInstance(id, def)` instance creation. Cycle errors must include the full path, for example `A -> B -> A`. Do not add lazy proxies or partial instances to support cycles.

9. Component context service shape is composition only:
   
   - `componentContext.theme` exposes only token resolution: `componentContext.theme.tokens.resolveForRoot(rootEl)`. Bootstrap methods (`applyToRoot`, `configure`, `preloadShadowCssUrls`, `getShadowCssText`, `hasShadowCssText`, `resolveStartupPresetName`) are runtime-only and are not reachable from `componentContext.theme`.
   - `componentContext.perf = runtime.perf`
   - `componentContext.format = runtime.format`
   - `componentContext.canvas = runtime.canvas`
   - `componentContext.dom = runtime.dom`
   - `componentContext.hostActions = runtime.hostActions`
   - `componentContext` does not expose `surfaces`.
   - Nesting rule: a `componentContext` namespace is flat when it has a single concern; it is nested only when it carries genuinely distinct sub-concerns (today, only `theme` qualifies, because token resolution and bootstrap lifecycle are different concerns).

10. Update `runtime/widget-registrar.js` and route activation call sites to request registered component instances through `runtime.componentLoader.createInstance(id, def)`.

11. Adopt the new component factory signature across every registered component module. The canonical signature is:
    
    ```javascript
    function create(def, componentContext) {
    // ...
    return instance;
    }
    ```
    
    `def` is the same AvNav widget definition that today is passed as the first argument to every `create(def, Helpers)` call; component-loader cascades it down the instance tree unchanged. `componentContext` is component-loader-created with the shape defined in deliverable 9. Each registered component module must be rewritten as follows:
    
    - replace `create(def, Helpers)` with `create(def, componentContext)`;
    - replace each `Helpers.getModule(id).create(def, Helpers)` with `componentContext.components.require(id)` (the lookup returns an instance, never a module factory);
    - replace each `Helpers.getModule(id)` used as a module-shape lookup (e.g. `apiShape: "module"` consumers) with `componentContext.components.require(id)` — the loader-created instance for module-shape components is the module object itself;
    - replace each `Helpers.applyFormatter` / `Helpers.setupCanvas` / `Helpers.requirePluginRoot` / `Helpers.getNightModeState` / `Helpers.getHostActions` call with the corresponding `componentContext.format.applyFormatter` / `componentContext.canvas.setupCanvas` / `componentContext.dom.requirePluginRoot` / `componentContext.dom.getNightModeState` / `componentContext.hostActions` call;
    - replace each `themeResolver.resolveForRoot(rootEl)` (consumed today via the `ThemeResolver` registry dep) with `componentContext.theme.tokens.resolveForRoot(rootEl)`;
    - replace each create-time `PerfSpanHelper` consumption with `componentContext.perf`;
    - update each component's `Depends:` header comment so it reflects only registry deps actually declared in that component's `config.components` entry, plus `componentContext` services it uses.
    
    Worked example:
    
    ```javascript
    // BEFORE — widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js
    function create(def, Helpers) {
    const theme              = Helpers.getModule("ThemeResolver");
    const text               = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    // ...
    function renderCanvas(canvas, props) {
    const setup = Helpers.setupCanvas(canvas);
    const tokens = theme.resolveForRoot(props.rootEl);
    // ...
    }
    }
    
    // AFTER
    function create(def, componentContext) {
    const text                 = componentContext.components.require("TextLayoutEngine");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    // ...
    function renderCanvas(canvas, props) {
    const setup  = componentContext.canvas.setupCanvas(canvas);
    const tokens = componentContext.theme.tokens.resolveForRoot(props.rootEl);
    // ...
    }
    }
    ```
    
    Scope: this rewrite touches every registered component file (today there are ~324 `Helpers.getModule(...)` call sites across the 131-component registry, all of which must be migrated, plus every direct `Helpers.applyFormatter` / `Helpers.setupCanvas` / `Helpers.requirePluginRoot` / `Helpers.getNightModeState` / `Helpers.getHostActions` call).

12. **Migrate every existing component test to the new factory signature.** Phase 2 changes ~324 `Helpers.getModule()` call sites across the 131-component registry, and the matching test files under `tests/cluster/`, `tests/widgets/`, `tests/config/`, and `tests/shared/` build a `Helpers` mock today. Every such test file whose subject is a registered component must be updated to construct the component via the new `create(def, componentContext)` factory, with the `Helpers` mock replaced by a `componentContext` test double. Add a single shared scaffolding helper at `tests/helpers/component-context-mock.js` that produces a `componentContext` whose `components.require(id)` returns pre-built dependency instances supplied by each test, and whose `theme.tokens`, `perf`, `format`, `canvas`, `dom`, `hostActions` are vi-stubbed; every migrated component test consumes this shared helper instead of hand-rolling the shape. The migration table row "Other component tests touched by the factory-signature migration (Phase 2 deliverable 12)" enumerates the files in scope.

13. Add/update focused tests for runtime services and component-loader-owned instantiation (the new tests this phase introduces beyond the existing-test migration in deliverable 12).

#### Exit conditions

- `ThemeModel`, `ThemeResolver`, component-level `PerfSpanHelper`, `ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, `HtmlSurfaceController`, and `SurfaceControllerFactory` are absent from `config.components` and from all component `deps`.
- `cluster/rendering/SurfaceControllerFactory.js` is deleted; its responsibilities are inlined into `ClusterRendererRouter`.
- No final runtime source contains `runtime.createHelpers()`, `Helpers.getModule()`, public `runtime.createComponentContext`, or `componentContext.components.get()`.
- No registered component module's `create()` accepts a `Helpers` second argument; every registered component's factory is `create(def, componentContext)`.
- No non-test source contains `Helpers.getModule`, `Helpers.applyFormatter`, `Helpers.setupCanvas`, `Helpers.requirePluginRoot`, `Helpers.getNightModeState`, or `Helpers.getHostActions`.
- Component-loader tests cover sync before-load failure, deterministic dependency instance creation, scoped services, denied undeclared dependencies, and cycle path reporting.
- `npm run test` (full suite — the deliverable-12 component-test migration must land in this phase, so the entire suite is green at end of phase).
- `npm run check:core`

### Phase 3 — Add startup-safe shell renderer and route-frame contract

**Intent:** Create the synchronous shell layer that replaces router-owned shell rendering without loading route implementations.

#### Deliverables

1. Add `runtime/cluster/ClusterShellRenderer.js` and configure `runtime.clusterShellRenderer` from `runtime/init.js`.
2. Implement `normalizeRouteFrame(rawProps, def, clusterRoutes)`:
   - normalize `cluster` from props or widget definition;
   - normalize `kind` from props;
   - compute `__dyniRouteId`;
   - preserve original raw props as `__dyniRawProps`;
   - keep reserved fields enumerable and plain-object-friendly;
   - never call mapper, renderer, view-model, or surface implementations.
3. Implement `renderRouteShell(routeFrame, routeMeta, instanceId, hostContext)`:
   - returns one `.widgetData.dyni-shell` root;
   - includes `data-dyni-instance`, `data-dyni-route`, and `data-dyni-surface`;
   - includes surface/kind classes with safe tokenization;
   - renders an empty stable mount point compatible with runtime surface controllers;
   - applies `shellSizing` from route metadata only when the host's container orientation is vertical (today's `ClusterSurfacePolicy.resolveContainerOrientation(props)` rule: `routeFrame.__dyniRawProps.mode === "vertical"`); in non-vertical orientation the shell is emitted without any inline `aspect-ratio` / `height` style, matching current behavior. The orientation check is inlined directly in the shell renderer — it does not delegate to `runtime.surfaces.policy` — because the check is a single field read (`rawProps.mode === "vertical"`) and keeping it local avoids coupling the startup-safe shell layer to runtime surface infrastructure;
   - `routePoints`'s `shellSizing.kind === "natural"` already emits no inline sizing (no height is reserved during cold load), so it is unaffected by the orientation gate;
   - produces no visible loading UI.
4. Unknown route input returns an inert diagnostic shell and skips activation.

#### Exit conditions

- `tests/runtime/cluster/ClusterShellRenderer.test.js` covers route-frame normalization, canvas/html shell markup, ratio/none sizing, vertical-vs-non-vertical orientation gating of inline `shellSizing` (vertical → inline `aspect-ratio`/`height` applied; non-vertical → no inline sizing emitted), unknown-route diagnostic shell, and no surface implementation calls.
- `npm run test` (full suite green; the new `ClusterShellRenderer` is now in the bootstrap manifest and any test that imports the runtime namespace must keep passing).
- `npm run check:core`

### Phase 4 — Add route activation service and activated payload contract

**Intent:** Introduce active-route implementation loading and payload construction on top of the cleaned runtime/component APIs.

#### Deliverables

1. Add `runtime/cluster/RouteActivationController.js` and configure the global service as `runtime.routeActivation`.

2. Expose `runtime.routeActivation.createWidgetController(def)` for per-widget activation state. The returned controller's public API is at minimum:
   
   ```javascript
   widgetController.activateCommittedRoute({
   routeFrame, revision, rootEl, shellEl, hostContext
   })   // → activated payload (warm path) | Promise<activated payload> (cold path)
   widgetController.destroy()
   ```

3. Implement one activation controller per widget instance; it may cache root mapper/view-model/renderer instances by `routeId` for that widget only. `widgetController.destroy()` must:
   
   - flip an internal `destroyed` flag the activation pipeline checks immediately before resolving back to `ClusterWidget`. Any in-flight cold activation that has not yet settled when `destroy()` runs **resolves** (does not reject) with `runtime.routeActivation.DISCARDED_ACTIVATION`, a single frozen sentinel object exported by the `runtime.routeActivation` service (`Object.freeze({ discarded: true })`, identity-checked). Resolve, not reject, because destroy is a clean cancellation signal, not an error: real load failures still reject the activation Promise and ClusterWidget's `.catch` still logs them via `console.error`. ClusterWidget's `.then` handler exits early on `payload === runtime.routeActivation.DISCARDED_ACTIVATION` before calling `SurfaceSessionController.reconcileSession`. The `.catch` path is unchanged from the no-destroy case — it never sees the sentinel. Subsequent `activate*()` calls after `destroy()` throw synchronously with a clearly-named error (`RouteActivationError: controller destroyed`), so the sentinel is only ever observed by callers whose Promise predates destroy;
   - drop the per-widget cache of route-root mapper/view-model/renderer instances built across that widget's activations, releasing references so the instance trees can be garbage-collected once any in-flight activation settles;
   - release the per-widget `ClusterMapperToolkit` instance reference (the toolkit module remains in `runtime.componentLoader`'s global module cache; only the per-widget instance is dropped);
   - not abort or evict any `runtime.componentLoader.loadComponent(id)` promises in flight — those promises remain valid contributors to the global module cache and must be allowed to resolve normally (per Hard Constraint 7, "no JS module eviction").
   
   `ClusterWidget.initFunction()` calls `previous.activationController.destroy()` when reusing context (alongside the existing `previous.hostCommitController.cleanup()` and `previous.surfaceSessionController.destroy()` calls), and `ClusterWidget.finalizeFunction()` calls `state.activationController.destroy()` as part of cleanup (this is what Phase 6 deliverable 6's "invalidates in-flight activation, and clears context state" means concretely).

4. Use `runtime.componentLoader` as the only global load/cache owner:
   
   - successful component modules are cached by component ID for the plugin session;
   - failed script/CSS/asset load promises are evicted for retry;
   - expose `areComponentsLoaded(ids)` backed by resolved-module state, not promise inspection;
   - component-loader still loads registry-owned deps, CSS, and assets before validating an already-present global.

5. Implement warm fast-path:
   
   - before entering async loading, ask component-loader whether all direct route roots are already loaded;
   - for HTML routes, also require `runtime.theme.hasShadowCssText(url)` for every required shadow CSS URL;
   - `ClusterMapperToolkit` is not in the route-roots set but is required for the warm path because the warm path synchronously calls `clusterMapperToolkit.createToolkit(mapperProps)` (see deliverable 8). The per-widget activation controller loads the toolkit during its first cold activation and reuses the instance, so any later warm activation on the same widget is guaranteed to find it loaded; the readiness check therefore does not need to test for the toolkit explicitly. If a future change makes a warm path reachable before the controller's first cold activation completes, the toolkit must be added to the readiness set;
   - if warm, map/build/return the activated payload synchronously;
   - `ClusterWidget` must branch on payload-vs-promise and must not wrap warm payloads in `Promise.resolve()`.

6. Activation starts only after shell commit:

```javascript
activationController.activateCommittedRoute({
  routeFrame,
  revision,
  rootEl,
  shellEl,
  hostContext
});
```

7. Route activation steps:
   - resolve route metadata from `config.clusterRoutes.byRouteId`;
   - compute direct route root component IDs: `mapperId`, optional `viewModelId`, `rendererId`;
   - call `componentLoader.loadComponent(id)` for each direct root and let component-loader load transitive registry deps;
   - collect active renderer `shadowCss` from `config.components[rendererId].shadowCss`;
   - call `runtime.theme.preloadShadowCssUrls(shadowCssUrls)` before HTML hydration;
   - create mapper/view-model/renderer instances through `runtime.componentLoader.createInstance(id, def)`;
   - load and instantiate `ClusterMapperToolkit` once per widget activation controller through `runtime.componentLoader`; the per-widget instance is reused across activations of that widget;
   - build clean `mapperProps` from the route frame by removing `__dyniRouteId` and `__dyniRawProps` while keeping normalized `cluster` and `kind`;
   - build a `routeContext` with this shape:

```javascript
{
  routeId,        // "nav/activeRoute"
  cluster,        // "nav"
  kind,           // "activeRoute"
  viewModel,      // declared route view-model instance, or null when route metadata has no viewModelId
  toolkit         // fresh per-call object built by activation as
                  // clusterMapperToolkit.createToolkit(mapperProps)
}
```

- call `mapper.translate(mapperProps, routeContext)`;

- merge `mappedProps.rendererProps` into final props at the activation boundary;

- call `runtime.surfaces.materializeSurfacePolicyProps({ hostContext, rendererId, props })` for HTML routes only (canvas-dom routes skip this — see the `runtime.surfaces` contract);

- return a data-only activated payload.
8. `RouteActivationController` per-widget controllers own the `ClusterMapperToolkit` instance. The mapper `translate` signature changes here (not in Phase 7) to `translate(mapperProps, routeContext)`, where `routeContext.toolkit` is the per-call toolkit object built by the activation controller. Mappers no longer accept toolkit as a positional argument and no longer declare `ClusterMapperToolkit` in their own registry deps (today no mapper actually declares it as a dep, but make this explicit so the rule cannot silently regress). `ClusterMapperToolkit.createToolkit(mapperProps)` is invoked once per activation (cold and warm) by the activation controller, preserving today's per-call props binding.
   
   Because `cluster/mappers/ClusterMapperRegistry.js` is still alive through Phase 6 and calls mappers as `mapper(props, toolkit)` positionally, Phase 4 also updates `ClusterMapperRegistry.mapCluster()` to wrap the legacy toolkit into a `routeContext`-shaped object before delegating, so the old path keeps working against the new mapper signature for the duration it remains in source:
   
   ```javascript
   // ClusterMapperRegistry.mapCluster, Phase 4 form
   function mapCluster(props, createToolkit) {
   const p = props || {};
   const cluster = p.cluster || def.cluster || "";
   const mapperSpec = mapperSpecs[cluster];
   if (!mapperSpec || typeof mapperSpec.translate !== "function") {
   return {};
   }
   const toolkit = typeof createToolkit === "function" ? createToolkit(p) : {};
   const legacyRouteContext = {
   routeId: cluster + "/" + (p.kind || ""),
   cluster: cluster,
   kind: p.kind,
   viewModel: null,
   toolkit: toolkit
   };
   return mapperSpec.translate(p, legacyRouteContext) || {};
   }
   ```
   
   Phase 7 deletes `ClusterMapperRegistry.js`, retiring this bridge.

9. Activated payload fields:

```javascript
{
  routeId,
  route,
  surface,
  rendererId,
  rendererSpec,
  rootEl,
  shellEl,
  hostContext,
  props,
  rawProps, // clean mapperProps, not route-frame internals
  revision,
  shadowCssUrls
}
```

10. Latest-wins behavior:
    - one current in-flight activation per widget instance;
    - new renders snapshot the full `activateCommittedRoute` input — `routeFrame`, `revision`, `rootEl`, `shellEl`, and `hostContext` — into the controller's latest-state store, so an in-flight cold activation that resolves after a shell replacement builds its payload from the current DOM elements and revision, not the stale originals;
    - same-route in-flight cold activation reuses the loading promise and hydrates with the latest-state snapshot;
    - every activation on a non-destroyed widget controller (cold or warm) resolves with a payload stamped with the activation's snapshot `revision`. For non-destroyed controllers the activation pipeline does not silently discard stale resolutions or hand `ClusterWidget` a sentinel value — staleness is enforced downstream at `SurfaceSessionController.reconcileSession` via its existing `payload.revision < mountedRevision` gate (Verified Baseline #17), so stale completions reach reconciliation but produce no DOM mutation. ClusterWidget's `.then` handler may still run non-DOM side effects (e.g., ending perf spans, clearing in-flight bookkeeping); only the surface reconcile is gated. The destroy-while-in-flight case is handled separately per deliverable 3: when the controller's `destroyed` flag is set, the in-flight activation **resolves** (not rejects) with `runtime.routeActivation.DISCARDED_ACTIVATION`, and ClusterWidget's `.then` handler exits early on identity match (`payload === runtime.routeActivation.DISCARDED_ACTIVATION`) before calling `SurfaceSessionController.reconcileSession`. ClusterWidget's `.catch` handler is unchanged — it never sees the sentinel and only logs real load failures. The two paths do not overlap because a destroyed controller never produces a non-sentinel payload.
11. Unexpected activation failures reject. `ClusterWidget` catches activation promise rejections, clears in-flight state, leaves the committed empty shell in place, and calls `console.error("dyninstruments route activation failed:", error)`. Stale activations and unknown route input are expected non-hydration cases and may return without logging.
12. If `runtime/cluster/RouteActivationController.js` approaches the project's line-size gate (`tools/check-file-size.mjs`: warn at 300, block at 400 non-empty lines), split into focused sibling files (e.g., `RouteActivationLatestWins.js`, `RouteActivationPayloadBuilder.js`) rather than compressing logic into denser one-liners. Hard Constraint 13 applies.

#### Exit conditions

- `tests/runtime/cluster/RouteActivationController.test.js` covers demand-only loading for canvas/html routes, shadow CSS before hydration, latest-wins same-route in-flight promise reuse with full input snapshot (a re-render during in-flight cold activation updates stored `rootEl`/`shellEl`/`hostContext` and the resolved payload uses the latest references), payload `revision` stamping (so downstream `SurfaceSessionController.reconcileSession` can gate stale completions), warm synchronous payload return, clean mapperProps, `routeContext` shape (including `viewModel: null` when route metadata has no `viewModelId` and per-call `toolkit` built from `clusterMapperToolkit.createToolkit(mapperProps)`), rendererProps merge, no predictive preload, per-widget route instance caching, component-loader-only module cache ownership, and destroy-while-in-flight handling (in-flight cold activation completing after `widgetController.destroy()` resolves — does not reject — with `runtime.routeActivation.DISCARDED_ACTIVATION` by reference identity; subsequent `activate*()` calls after destroy throw synchronously with the documented error; real load failures still reject as today).
- `npm run test` (full suite green; mapper-signature changes from D8 and the new bridge in `ClusterMapperRegistry.mapCluster()` must keep every existing mapper test passing).
- `npm run check:core`

### Phase 5 — Adapt `SurfaceSessionController` for runtime surfaces and route identity

**Intent:** Keep surface reconciliation synchronous while moving surface lifecycle ownership into runtime surfaces.

#### Deliverables

1. Update `runtime/SurfaceSessionController.js` so it receives the stable `runtime.surfaces` service once at construction.
2. Remove payload-level `createSurfaceController` factories.
3. Use a data-only activated payload:

```javascript
const session = runtime.createSurfaceSessionController({
  surfaces: runtime.surfaces
});

session.reconcileSession({
  routeId,
  rendererId,
  surface,
  rootEl,
  shellEl,
  hostContext,
  props,
  revision,
  rendererSpec,
  shadowCssUrls
});
```

4. `runtime.surfaces.createController({ surface, rendererSpec, hostContext })` chooses the correct runtime surface controller from the activated payload's data-only fields.

5. Store mounted route identity: `mountedRouteId`, `mountedRendererId`, `mountedSurface`, `mountedRevision`, and shell identity.

6. Reconciliation logic:
   
   - stale revision returns `false`;
   - no active controller creates/attaches;
   - same route/renderer/surface and same shell updates;
   - same route/renderer/surface but different shell detaches/remounts;
   - different route or renderer destroys old controller and attaches new;
   - different surface detaches/destroys old and attaches new.

7. Add `detachForShellReplacement()` to `SurfaceSessionController` with this contract:
   
   - The call takes no arguments. `SurfaceSessionController`'s own `state.shellEl` is the single source of truth for shell-element identity.
   - If `state.activeController` exists, it calls `state.activeController.detach("shell-replacement")` and clears `state.shellEl` so the detached DOM node can be garbage-collected. If no controller is active, the call is a silent no-op (`ClusterWidget` may therefore call it unconditionally on every commit).
   - It **preserves** `state.activeController`, `state.mountedSurface`, `state.mountedRouteId`, `state.mountedRendererId`, and `state.mountedRevision`. Shell identity is the only field cleared.
   - The next `reconcileSession(payload)` then flows through the existing reconciliation branches in deliverable 6 unchanged: same surface and new shell hits `sameSurface && !sameShell`, which performs `mountedController.detach("remount")` (a no-op on the already-detached controller — see deliverable 8) followed by `mountedController.attach(payload)`, reusing the controller against the new shell; different surface hits the surface-switch branch and swaps controllers via `detach + destroy + new controller + attach`; stale revision still returns `false`.

8. Tighten the runtime surface controller contract for both `runtime.surfaces` controllers (`HtmlSurfaceController`, `CanvasDomSurfaceAdapter`): `controller.detach(reason)` MUST be idempotent — calling it on an already-detached controller is a documented no-op. Today's `HtmlSurfaceController.detach` already short-circuits on `!state.renderer`; the same behavior is required of every runtime surface controller and is asserted by `tests/runtime/SurfaceSessionController.test.js` so it cannot be tightened away later. `controller.attach(payload)` MUST be allowed after a prior `detach` and is required to behave equivalently to a fresh first attach.

9. Keep `destroy()` strict and complete.

10. `SurfaceSessionController` does not call any renderer sizing hook and does not mutate `shellEl.style.height` or `shellEl.style.aspect-ratio` on attach, update, remount, or surface-switch. Shell sizing is owned by route metadata at first paint and by renderer shadow CSS afterwards.

11. **Legacy-path bridging (so the plugin still runs at end of Phase 5).** `ClusterWidget` is not yet cut over (that happens in Phase 6), but it constructs the SSC and feeds it payloads, so the legacy path needs a minimal same-phase update to match the new contract:
- In `cluster/ClusterWidget.js`, change the SSC construction site from `runtimeApi.createSurfaceSessionController({ createSurfaceController: rendererRouter.createSurfaceControllerFactory(ctx) })` to `runtimeApi.createSurfaceSessionController({ surfaces: runtime.surfaces })`. No other ClusterWidget logic moves in this phase.

- In `cluster/rendering/ClusterRendererRouter.js`, extend `createSessionPayload(commitPayload, ctx)` to also emit `routeId`, `rendererId`, `rendererSpec`, `hostContext`, and `shadowCssUrls` on the returned object (in addition to today's `surface`, `rootEl`, `shellEl`, `props`, `revision`, `route`). The router already resolves `route.rendererId`, the renderer spec via the existing `RendererPropsWidget` lookup, and shadow CSS URLs via `resolveRendererShadowCss`; this deliverable just passes those through. `routeId` is `route.cluster + "/" + route.kind`. `hostContext` comes from `ctx.hostContext` (already in scope in `createSessionPayload`). For canvas routes, `shadowCssUrls` is `[]`.

- `rendererRouter.createSurfaceControllerFactory(ctx)` is no longer called from `ClusterWidget`; it stays defined on the router as dead code through Phase 6 and is deleted with the rest of the router in Phase 7.
12. **Phase 2 corollary: `ClusterRendererRouter` already accesses runtime surfaces.** Phase 2 deliverable 4 moves `ClusterSurfacePolicy`, `CanvasDomSurfaceAdapter`, and `HtmlSurfaceController` out of `config.components` and onto `runtime.surfaces`, removing them from every component's `deps`. Because `ClusterRendererRouter` is alive through Phase 6 and currently `Helpers.getModule()`s those three plus `SurfaceControllerFactory`, Phase 2 also rewrites the router's `create(def, componentContext)` to read `surfacePolicy = runtime.surfaces.policy`, `htmlSurfaceController = runtime.surfaces.html`, and `canvasDomAdapter = runtime.surfaces.canvasDom` from the runtime namespace, and to drop those four IDs (plus `SurfaceControllerFactory`, already deleted in Phase 2 deliverable 5a) from its registry deps. This is the same kind of legacy-path bridging as deliverable 11 — `ClusterRendererRouter` is treated as a transitional boundary component (like `ClusterWidget`) that may reach into runtime services through Phase 6 because it owns the live cluster path; the router is deleted in Phase 7. Listed here so Phase 5's payload-shape contract above (`rendererSpec`, `hostContext`, `shadowCssUrls`) is reachable from the router that has to produce it.

#### Exit conditions

- `tests/runtime/SurfaceSessionController.test.js` covers same-route updates, route/renderer/surface changes, stale revisions, no-arg shell-replacement detach (acts when an active controller is present, silent no-op when no controller is active), state preserved across `detachForShellReplacement` (active controller and route/renderer/surface/revision identity retained, only `state.shellEl` cleared), `attach → detach → attach` reuse via the existing same-surface-different-shell branch, idempotent `controller.detach(reason)` on already-detached runtime surface controllers, and missing required surface payload errors.
- `tests/cluster/ClusterWidget.test.js` continues to pass against the legacy renderer-router path with the bridging from deliverables 11–12 (SSC constructed with `{ surfaces: runtime.surfaces }`, `createSessionPayload` returning the extended payload). Phase 5 is not allowed to ship a non-runnable plugin; the cluster widget tests are the gate that catches it.
- `npm run test` (full suite green; the SSC contract change must keep every test in `tests/cluster/`, `tests/runtime/`, `tests/widgets/`, and `tests/integration/` passing).
- `npm run check:core`

### Phase 6 — Cut over `ClusterWidget` to shell + activation

**Intent:** Replace the eager router/registry runtime path with the new synchronous shell and activation pipeline.

#### Deliverables

1. Rewrite `cluster/ClusterWidget.js` so its registry deps are exactly `[]`.
2. `ClusterWidget` may use runtime boundary services directly because it is the AvNav shell/orchestrator boundary:
   - `runtime.clusterShellRenderer`
   - `runtime.routeActivation`
   - `runtime.createHostCommitController`
   - `runtime.createSurfaceSessionController`
   - `runtime.surfaces`
   - `runtime.theme` (boundary use of `runtime.theme.applyToRoot(rootEl)` only; per-render token resolution still goes through `componentContext.theme.tokens` for non-orchestrator components)
   - `runtime.perf`
3. `translateFunction(props)` starts/ends perf span, creates a route frame, and never calls mapper/view-model/renderer/surface modules.
4. `initFunction()` initializes host commit controller, surface session controller, and activation controller; it cleans previous state if AvNav reuses context.
5. `renderHtml(routeFrame)` records revision, renders empty shell via `runtime.clusterShellRenderer.renderRouteShell(routeFrame, routeMeta, instanceId, this)` (the AvNav widget context — `this` inside `renderHtml` — is the `hostContext` the shell renderer needs in order to apply route-metadata `shellSizing` only in vertical orientation), schedules commit, and inside the commit callback (in this order) calls `runtime.theme.applyToRoot(commitPayload.rootEl)` to materialize theme tokens onto the freshly committed root, then calls `state.surfaceSessionController.detachForShellReplacement()` unconditionally to release any controller still bound to the previously-mounted shell (the call is a no-op on first commit when no controller is active — see Phase 5 deliverable 7), then starts activation. Activation handles sync warm payloads without microtask wrapping, and on activation resolution always passes the payload through `SurfaceSessionController.reconcileSession`. Stale payloads are filtered there by the existing revision gate, not by ClusterWidget; ClusterWidget only branches on payload-vs-promise and on success-vs-rejection.
6. `finalizeFunction()` cleans host commit controller, destroys surface session controller, invalidates in-flight activation, and clears context state.
7. Hardcode `wantsHideNativeHead: true` on the returned widget object.
8. Unknown route input returns a safe diagnostic shell and skips activation.

#### Exit conditions

- `tests/cluster/ClusterWidget.test.js` covers route-frame translation, shell-first rendering, no eager implementation requests, activation callback usage, sync warm payload handling, and finalize cleanup.
- `npm run test -- tests/cluster/ClusterWidget.test.js tests/runtime/cluster/RouteActivationController.test.js tests/runtime/SurfaceSessionController.test.js`
- `npm run test` (full suite green; the cutover removes the Phase 5 bridging and must leave every cluster, widget, runtime, and integration test passing).
- `npm run check:core`

### Phase 7 — Remove router-era abstractions and broad dependency fans

**Intent:** Delete old eager owners and ensure no dependency path can reintroduce the startup closure.

#### Deliverables

1. Delete `cluster/rendering/ClusterRendererRouter.js`.
2. Delete `cluster/mappers/ClusterMapperRegistry.js`.
3. Delete `cluster/rendering/ClusterKindCatalog.js`.
4. Delete `cluster/rendering/RendererPropsWidget.js`.
5. Remove deleted module registry entries and deps.
6. Refactor mapper dependencies:
   - `NavMapper` no longer depends on `ActiveRouteViewModel`, `EditRouteViewModel`, or `RoutePointsViewModel`;
   - `MapMapper` no longer depends on `AisTargetViewModel`;
   - `VesselMapper` no longer depends on `AlarmViewModel`;
   - mappers do not declare `ClusterMapperToolkit` in their own deps; the activation controller owns the toolkit instance and supplies the per-call toolkit on `routeContext.toolkit` (this rule originated in Phase 4 deliverable 8 and is restated here only because the registry edits land alongside the deletions in this phase).
7. Finalize the mapper bodies for the post-deletion world. The `translate(mapperProps, routeContext)` signature itself was already adopted in Phase 4 deliverable 8 (so `RouteActivationController` and the legacy `ClusterMapperRegistry` bridge could both call mappers uniformly during Phases 4–6); Phase 7 now removes:
   - the create-time construction of route-specific view models inside `NavMapper`, `MapMapper`, and `VesselMapper`. Mappers no longer construct `ActiveRouteViewModel`, `EditRouteViewModel`, `RoutePointsViewModel`, `AisTargetViewModel`, or `AlarmViewModel` at create time or lazily inside `translate`. Whenever a mapper needs a route-specific view model, it reads `routeContext.viewModel` (the activation-controller-provided instance keyed by route metadata's `viewModelId`).
   - the `renderer` field that mappers currently emit from their `translate` output. Route metadata is the only source of renderer identity, and the legacy `renderer` mismatch validation in `ClusterRendererRouter` is gone with that file.
8. Keep cluster mappers cluster-grained in PLAN20. Do not split 9 cluster mappers into 59 per-kind mappers unless file-size gates or measured cold activation cost require it later.
9. Replace old behavior tests with tests for the new owners.
10. Delete `getVerticalShellSizing` from every renderer spec that exports it. The complete list of current exporters is: text renderers `ThreeValueTextWidget`, `PositionCoordinateWidget`, `ActiveRouteTextHtmlWidget`, `EditRouteTextHtmlWidget`, `RoutePointsTextHtmlWidget`, `MapZoomTextHtmlWidget`, `AisTargetTextHtmlWidget`, `AlarmTextHtmlWidget`, `CenterDisplayTextWidget`, `XteDisplayWidget`; linear renderers `CompassLinearWidget`, `DefaultLinearWidget`, `DepthLinearWidget`, `SpeedLinearWidget`, `TemperatureLinearWidget`, `VoltageLinearWidget`, `WindLinearWidget`; radial renderers `CompassRadialWidget`, `DefaultRadialWidget`, `DepthRadialWidget`, `SpeedRadialWidget`, `TemperatureRadialWidget`, `VoltageRadialWidget`, `WindRadialWidget` (24 renderer specs total). Remove the `getVerticalShellSizing` slot from the renderer-spec contract entirely. The renderer-spec contract no longer has any sizing hook.
11. Add `:host { height: auto; max-height: calc(60vh); display: flex; flex-direction: column; min-height: 0; }` to `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css`. This rule overrides `BASE_SHADOW_STYLE_CSS`'s `:host { height: 100% }` for routePoints and is the only post-activation sizing authority for that route. `RoutePointsLayout.computeNaturalHeight` stays inside the renderer for internal row-layout decisions.
12. Add startup closure guards:
    - `ClusterWidget` deps are exactly `[]`;
    - startup component load set is exactly `ClusterWidget`;
    - `ClusterWidget` closure contains no mapper, renderer, view-model, surface runtime modules, route shadow CSS, or deleted owner IDs;
    - deleted module IDs are absent from `config.components`.

#### Exit conditions

- Deleted files are gone.
- Deleted module names are absent from runtime source except historical plan/docs references.
- All test files listed for deletion in the "Test file migration" table are gone, and no remaining test file imports `cluster/rendering/ClusterRendererRouter`, `cluster/rendering/ClusterKindCatalog`, `cluster/rendering/SurfaceControllerFactory`, `cluster/mappers/ClusterMapperRegistry`, `cluster/rendering/RendererPropsWidget`, the moved-to-runtime surface modules at their old `cluster/rendering/...` paths, `runtime/helpers`, `shared/widget-kits/perf/PerfSpanHelper`, `shared/theme/ThemeModel`, or `shared/theme/ThemeResolver`.
- `npm run test -- tests/runtime/component-loader.test.js tests/config/components.test.js tests/runtime/cluster/RouteActivationController.test.js`
- `npm run test` (full suite green; the bulk deletions in this phase must leave the suite passing — every remaining test that referenced a deleted module has been migrated or removed per the Test file migration table).
- `npm run check:core`

### Phase 8 — Move route shadow CSS and asset policy to activation

**Intent:** Ensure route-specific HTML shadow CSS and future route-specific assets do not participate in startup while preserving flicker-free hydration.

#### Deliverables

1. Update `runtime/init.js` so it no longer preloads renderer shadow CSS from startup component closure.
2. Keep `runtime.theme` configured at startup for theme token resolution and shadow CSS cache APIs.
3. Route activation owns shadow CSS:
   - collect active renderer `shadowCss`;
   - call `runtime.theme.preloadShadowCssUrls(shadowCssUrls)`;
   - block HTML surface reconciliation until CSS promises resolve;
   - surface attach reads CSS synchronously from `runtime.theme.getShadowCssText()`.
4. Canvas route activation does not fetch shadow CSS.
5. HTML renderer registry entries that need the shared shadow CSS list `shared/html/HtmlShadowCommon.css` in their `shadowCss` array. Registry entries (in `config/components/registry-*.js`) continue to inline the path via a local `const SHARED_HTML_SHADOW_CSS = BASE + "shared/html/HtmlShadowCommon.css";` constant the way they do today, because registry files load early in the bootstrap manifest — before `runtime/surface/index.js` configures `runtime.surfaces` — and must not depend on runtime services at registry-definition time. `runtime.surfaces.getCommonShadowCssUrl()` is the canonical accessor for **runtime call sites that need the path after bootstrap completes** (renderer-spec code, route-activation code, test code) — it gives those callers a single source of truth so the literal is not re-hardcoded across runtime source. The literal therefore appears in two places only: the per-registry-file `SHARED_HTML_SHADOW_CSS` constant, and `runtime.surfaces.getCommonShadowCssUrl()`'s implementation. Repeated loads of the same URL are no-ops via the `runtime.theme.preloadShadowCssUrls` cache; no extra de-duplication is required at activation.
6. Keep current `assets/fonts/*` referenced from `plugin.css` with `font-display: swap`.
7. Do not add current bundled fonts to component registry `assets` arrays.
8. Keep component-loader asset behavior for future route/component assets.
9. Document the policy:
   - plugin-wide fonts are CSS-owned and non-blocking;
   - route-specific assets are component-owned, loaded during route activation, and cached for the plugin session.

#### Exit conditions

- `tests/runtime/init.test.js` covers no startup renderer shadow CSS preload.
- `tests/runtime/cluster/RouteActivationController.test.js` covers HTML CSS preload and canvas no-op.
- `tests/plugin/plugin-css-fontface.test.js`, `tests/config/components.test.js`, and `tests/runtime/asset-preloader.test.js` pass.
- `npm run test` (full suite green; the activation-owned shadow CSS path and asset-policy edits must leave every existing test passing).
- `npm run check:core`

### Phase 9 — Documentation, gates, and performance baseline

**Intent:** Make the new runtime/API/lazy-activation architecture enforceable and documented.

#### Deliverables

1. Update architecture docs for cluster widget, component system, runtime lifecycle, surface session controller, HTML renderer lifecycle, and assets.
2. Update add-new-cluster/add-new-html-kind guides:
   - route metadata entry is required;
   - transitive dependencies stay in `config.components`;
   - renderer `shadowCss` remains on component registry entry;
   - do not reference deleted router-era files.
3. Add or update dependency/pattern guards:
   - forbid final `runtime.createHelpers()` and `Helpers.getModule()`;
   - forbid public `runtime.createComponentContext`;
   - forbid `componentContext.components.get()`;
   - forbid `ClusterWidget` deps;
   - forbid route metadata dependency buckets;
   - ensure route metadata component references exist;
   - ensure runtime service IDs are absent from `config.components` and component `deps`;
   - ensure deleted owner modules are not reintroduced;
   - block ordinary registered components from adding new direct runtime reach-throughs for normal services.
4. Update perf harness/baseline:
   - startup component count;
   - cold route activation;
   - warm same-route update;
   - HTML cold activation shadow CSS.
5. Run full gates.

#### Exit conditions

- All docs describe the new owners only.
- No docs instruct adding routes to `ClusterRendererRouter`, `ClusterKindCatalog`, or `ClusterMapperRegistry`.
- `npm run check:all` passes.
- `npm run perf:check` passes or baseline is intentionally updated with a documented reason.

---

## File-Level Change Map

### New files

| File                                                             | Purpose                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `config/cluster-routes.js`                                       | Initialize `config.clusterRoutes`                                                                       |
| `config/cluster-routes/*.js`                                     | Explicit per-cluster route metadata objects                                                             |
| `config/cluster-routes/finalize.js`                              | Derive route IDs and build `byRouteId`                                                                  |
| `runtime/format-runtime.js`                                      | Formatting runtime service previously hidden in helpers                                                 |
| `runtime/canvas-runtime.js`                                      | Canvas runtime service previously hidden in helpers                                                     |
| `runtime/dom-runtime.js`                                         | DOM/root/night-mode runtime service previously hidden in helpers                                        |
| `runtime/theme/*` or folded `runtime/theme-runtime.js` internals | Core bootstrap theme model/resolution                                                                   |
| `runtime/surface/ClusterSurfacePolicy.js`                        | Runtime surface policy service                                                                          |
| `runtime/surface/CanvasDomSurfaceAdapter.js`                     | Runtime canvas surface controller                                                                       |
| `runtime/surface/HtmlSurfaceController.js`                       | Runtime HTML surface controller                                                                         |
| `runtime/surface/index.js`                                       | Compose surface modules into `runtime.surfaces`                                                         |
| `runtime/cluster/ClusterShellRenderer.js`                        | Startup-safe route-frame normalization and empty shell rendering                                        |
| `runtime/cluster/RouteActivationController.js`                   | Active-route implementation loading and payload construction                                            |
| `tests/config/cluster-routes.test.js`                            | Route metadata schema/inventory/parity tests                                                            |
| `tests/runtime/cluster/ClusterShellRenderer.test.js`             | Shell renderer and route-frame tests                                                                    |
| `tests/runtime/cluster/RouteActivationController.test.js`        | Lazy activation, latest-wins, shadow CSS, warm-path tests                                               |
| `tests/helpers/component-context-mock.js`                        | Shared test double for `componentContext` used by all migrated component tests (Phase 2 deliverable 12) |

### Files to rewrite or materially update

| File                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Required change                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Keep flat raw-script bootstrap behavior; load added runtime/config files                                                                                                                                                                                                                                                                                                                                                                                                        |
| `runtime/init.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Configure runtime services, component-loader, shell renderer, route activation; no startup renderer shadow CSS preload                                                                                                                                                                                                                                                                                                                                                          |
| `runtime/component-loader.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Own async loading, module cache, failed-load retry eviction, sync `createInstance()`, dependency-scoped contexts, cycle detection                                                                                                                                                                                                                                                                                                                                               |
| `runtime/widget-registrar.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Instantiate registered components through `runtime.componentLoader.createInstance(id, def)`                                                                                                                                                                                                                                                                                                                                                                                     |
| `runtime/theme-runtime.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Become configured bootstrap theme service with theme model/resolution internals available at startup                                                                                                                                                                                                                                                                                                                                                                            |
| `runtime/SurfaceSessionController.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Payload-aware reconciliation using stable `runtime.surfaces` service and route identity tracking                                                                                                                                                                                                                                                                                                                                                                                |
| `runtime/HostCommitController.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Keep existing scheduling/revision ownership; integrate with shell commit/activation flow only where needed                                                                                                                                                                                                                                                                                                                                                                      |
| `config/bootstrap-manifest.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Add split route metadata files and runtime service files; keep flat manifest format                                                                                                                                                                                                                                                                                                                                                                                             |
| `config/components/registry-cluster.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Remove deleted module entries/deps; `ClusterWidget` deps become `[]`; mapper entries do not declare `ClusterMapperToolkit` (toolkit ownership moves to activation)                                                                                                                                                                                                                                                                                                              |
| `config/components/registry-widgets-nav.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Remove `RendererPropsWidget` entry if present                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `cluster/ClusterWidget.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Minimal shell/orchestrator; no mapper/router calls; activation through `runtime.routeActivation`                                                                                                                                                                                                                                                                                                                                                                                |
| `cluster/mappers/NavMapper.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Remove create-time route view-model construction; consume route context view model and toolkit; do not declare `ClusterMapperToolkit` in deps; stop emitting `renderer` field                                                                                                                                                                                                                                                                                                   |
| `cluster/mappers/MapMapper.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Remove create-time `AisTargetViewModel`; consume route context view model and toolkit; stop emitting `renderer` field                                                                                                                                                                                                                                                                                                                                                           |
| `cluster/mappers/VesselMapper.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Remove registry-level `AlarmViewModel` dep; consume route context view model and toolkit; stop emitting `renderer` field                                                                                                                                                                                                                                                                                                                                                        |
| Components currently consuming `ThemeResolver` via deps (`shared/widget-kits/radial/RadialToolkit.js`, `shared/widget-kits/radial/FullCircleRadialEngine.js`, `shared/widget-kits/radial/SemicircleRadialEngine.js`, `shared/widget-kits/linear/LinearGaugeEngine.js`, `shared/widget-kits/nav/MapZoomHtmlFit.js`, `shared/widget-kits/nav/AisTargetHtmlFit.js`, `shared/widget-kits/nav/EditRouteHtmlFit.js`, `shared/widget-kits/nav/ActiveRouteHtmlFit.js`, `shared/widget-kits/nav/RoutePointsHtmlFit.js`, `shared/widget-kits/vessel/AlarmHtmlFit.js`, `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`, `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`, `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`, `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`, `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`, `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`, `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`) | Switch from `themeResolver.resolveForRoot(rootEl)` (consumed via the `ThemeResolver` registry dep) to `componentContext.theme.tokens.resolveForRoot(rootEl)`. For `RadialToolkit` specifically, expose `componentContext.theme.tokens` on the toolkit's `theme` member so existing `GU.theme.resolveForRoot(rootEl)` call sites in the engines keep working. Remove `"ThemeResolver"` from the entry's `deps` array in the corresponding `config/components/registry-*.js` file |
| Registry entries declaring `"ThemeResolver"` in `deps` (across `registry-shared-engines.js`, `registry-shared-foundation-layout.js`, `registry-widgets-nav.js`, `registry-widgets-vessel.js`, `registry-cluster.js`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Remove `"ThemeResolver"` from each `deps` array                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Mapper tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Update for the new mapper signature (`(mapperProps, routeContext)`), activation-owned toolkit consumed via `routeContext.toolkit`, route-context view models replacing create-time view models, and removal of the legacy `renderer` field from translate output                                                                                                                                                                                                                |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Add `:host { height: auto; max-height: calc(60vh); display: flex; flex-direction: column; min-height: 0; }` to override the base shadow CSS `:host { height: 100% }` for the natural-flow case                                                                                                                                                                                                                                                                                  |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Delete `getVerticalShellSizing` export; `RoutePointsLayout.computeNaturalHeight` stays for internal row layout                                                                                                                                                                                                                                                                                                                                                                  |
| Other HTML and canvas renderer JS exporting `getVerticalShellSizing` (`ThreeValueTextWidget`, `PositionCoordinateWidget`, `ActiveRouteTextHtmlWidget`, `EditRouteTextHtmlWidget`, `MapZoomTextHtmlWidget`, `AisTargetTextHtmlWidget`, `AlarmTextHtmlWidget`, `CenterDisplayTextWidget`, `XteDisplayWidget`, and any other renderer spec currently exposing it)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Delete `getVerticalShellSizing` export                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Runtime/config/plugin tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Update for runtime API boundary, shell-first, and lazy activation behavior                                                                                                                                                                                                                                                                                                                                                                                                      |
| Architecture docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Replace old ownership model                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Files to delete

| File                                            | Reason                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cluster/rendering/ClusterRendererRouter.js`    | Replaced by route metadata + shell renderer + route activation                                                                                                                              |
| `cluster/rendering/ClusterKindCatalog.js`       | Replaced by `config.clusterRoutes.byRouteId` and route metadata tests                                                                                                                       |
| `cluster/rendering/SurfaceControllerFactory.js` | Inlined into `ClusterRendererRouter` and deleted in Phase 2; replaced by `runtime.surfaces` + data-only activated payload reconciliation                                                    |
| `cluster/mappers/ClusterMapperRegistry.js`      | Replaced by route metadata mapper IDs                                                                                                                                                       |
| `cluster/rendering/RendererPropsWidget.js`      | Replaced by activation-time `rendererProps` merge                                                                                                                                           |
| `runtime/helpers.js`                            | Decomposed into `runtime/format-runtime.js`, `runtime/canvas-runtime.js`, `runtime/dom-runtime.js`, and `runtime.hostActions`; `runtime.createHelpers()` and `Helpers.getModule()` are gone |
| `shared/widget-kits/perf/PerfSpanHelper.js`     | Replaced by `runtime.perf` / `componentContext.perf`                                                                                                                                        |
| `shared/theme/ThemeModel.js`                    | Folded into runtime theme internals (`runtime/theme/...`); theme model is no longer a registered component                                                                                  |
| `shared/theme/ThemeResolver.js`                 | Folded into runtime theme internals (`runtime/theme/...`); per-render token resolution is reached only through `componentContext.theme.tokens.resolveForRoot()`                             |

### Test file migration

For every deleted or moved source file, the test file migrates the same way. The action column is the explicit instruction for the developer.

| Test file                                                                                                                                                                                                                                                                                                                      | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/cluster/rendering/ClusterRendererRouter.test.js`                                                                                                                                                                                                                                                                        | Delete (Phase 7). The router is gone. Coverage of route resolution moves into `tests/config/cluster-routes.test.js` (route metadata) and `tests/runtime/cluster/RouteActivationController.test.js` (route activation pipeline)                                                                                                                                                                                                                               |
| `tests/cluster/rendering/ClusterKindCatalog.test.js`                                                                                                                                                                                                                                                                           | Delete (Phase 1, not Phase 7). The old test asserts catalog-output deep equality against the legacy `"MapperOutputViewModel"` sentinel that the canonical schema retires in Phase 1. Its coverage of route inventory, uniqueness, surface validity, and reference-to-component-registry parity moves into `tests/config/cluster-routes.test.js` added in the same phase. Listed alongside Phase 7's other catalog-related deletions for cross-reference only |
| `tests/cluster/rendering/RendererPropsWidget.test.js`                                                                                                                                                                                                                                                                          | Delete (Phase 7). `rendererProps` merge coverage moves into `tests/runtime/cluster/RouteActivationController.test.js`                                                                                                                                                                                                                                                                                                                                        |
| `tests/cluster/mappers/ClusterMapperRegistry.test.js`                                                                                                                                                                                                                                                                          | Delete (Phase 7). Mapper-dispatch coverage by `(cluster, kind)` moves into `tests/runtime/cluster/RouteActivationController.test.js`. Per-mapper unit tests stay where they are and are updated for the new `translate(mapperProps, routeContext)` signature per the "Mapper tests" entry above                                                                                                                                                              |
| `tests/cluster/rendering/ClusterSurfacePolicy.test.js`                                                                                                                                                                                                                                                                         | Move to `tests/runtime/surface/ClusterSurfacePolicy.test.js` and rewrite for the runtime infrastructure construction model (no `def`/`Helpers`; reads `runtime.theme`/`runtime.perf` from the runtime namespace). Coverage: `materializeSurfacePolicyProps` HTML-only invocation, capability normalization, normalized actions, container orientation, viewport facts                                                                                        |
| `tests/cluster/rendering/CanvasDomSurfaceAdapter.test.js`                                                                                                                                                                                                                                                                      | Move to `tests/runtime/surface/CanvasDomSurfaceAdapter.test.js` and rewrite for the runtime infrastructure construction model. Coverage: canvas paint scheduling, RAF coalescing, lifecycle cleanup, idempotent `detach(reason)` no-op on already-detached controllers                                                                                                                                                                                       |
| `tests/cluster/rendering/HtmlSurfaceController.test.js`                                                                                                                                                                                                                                                                        | Move to `tests/runtime/surface/HtmlSurfaceController.test.js` and rewrite for the runtime infrastructure construction model. Coverage: committed HTML mount/update/postPatch/detach/destroy, shadow CSS injection from `runtime.theme.getShadowCssText`, idempotent `detach(reason)` no-op, `attach → detach → attach` reuse                                                                                                                                 |
| `tests/runtime/helpers.test.js`                                                                                                                                                                                                                                                                                                | Delete (Phase 2). Coverage splits into focused service tests: `tests/runtime/format-runtime.test.js` (`applyFormatter`), `tests/runtime/canvas-runtime.test.js` (`setupCanvas`), `tests/runtime/dom-runtime.test.js` (`requirePluginRoot`, `getNightModeState`), and existing `tests/runtime/TemporaryHostActionBridge.test.js` retains host-actions coverage                                                                                                |
| `tests/cluster/ClusterWidget.test.js`                                                                                                                                                                                                                                                                                          | Rewrite (Phase 6) for the shell + activation pipeline: route-frame translation, shell-first rendering, no eager implementation requests, post-commit `runtime.theme.applyToRoot(rootEl)` ordering, unconditional `detachForShellReplacement()` call on every commit (no-op on first commit), sync warm payload handling, async cold payload handling, activation rejection cleanup, finalize cleanup                                                         |
| `tests/runtime/init.test.js`                                                                                                                                                                                                                                                                                                   | Update (Phase 8) to assert no startup renderer shadow CSS preload and that startup component load set is exactly `["ClusterWidget"]`                                                                                                                                                                                                                                                                                                                         |
| `tests/runtime/component-loader.test.js`                                                                                                                                                                                                                                                                                       | Rewrite (Phase 2) for `loadComponent`/`createInstance`/`areComponentsLoaded` split, sync-before-load failure, deterministic dependency instance creation, scoped `componentContext.components.require`, denied undeclared dependencies, and cycle path reporting                                                                                                                                                                                             |
| Per-mapper tests in `tests/cluster/mappers/`                                                                                                                                                                                                                                                                                   | Update (Phase 4) for the new `translate(mapperProps, routeContext)` signature; toolkit consumed via `routeContext.toolkit`; view models consumed via `routeContext.viewModel`; `renderer` field no longer expected in translate output (post-Phase-7)                                                                                                                                                                                                        |
| Per-renderer tests in `tests/cluster/rendering/<*>.test.js` and `tests/widgets/text/<*>.test.js`, `tests/widgets/radial/<*>.test.js`, `tests/widgets/linear/<*>.test.js` that today reference `getVerticalShellSizing` (see Verified Baseline #40 and the `getVerticalShellSizing` consumer list under Phase 7 deliverable 10) | Delete `getVerticalShellSizing` assertions (Phase 7); the renderer-spec contract no longer exposes a sizing hook                                                                                                                                                                                                                                                                                                                                             |
| Other component tests touched by the factory-signature migration (Phase 2 deliverable 12)                                                                                                                                                                                                                                      | Update tests to construct components via the new `create(def, componentContext)` factory using the shared `tests/helpers/component-context-mock.js` test double whose `components.require(id)` returns pre-built dependency instances. Existing test helpers that currently build a `Helpers` mock are replaced by this shared `componentContext` mock                                                                                                       |
| `tests/runtime/PerfSpanHelper.test.js`                                                                                                                                                                                                                                                                                         | Update (Phase 2) for the `runtime.getPerfSpanApi()` → `runtime.perf` rename; test setup and assertions that reference `getPerfSpanApi` switch to the new property accessor                                                                                                                                                                                                                                                                                   |
| `tests/runtime/theme-runtime.test.js`                                                                                                                                                                                                                                                                                          | Rewrite (Phase 2) for the expanded theme runtime that absorbs `ThemeModel` and `ThemeResolver` internals; test setup must configure theme model/resolution through `runtime.theme` rather than through separate registered component mocks                                                                                                                                                                                                                   |
| `tests/runtime/widget-registrar.test.js`                                                                                                                                                                                                                                                                                       | Update (Phase 2) for `runtime.componentLoader.createInstance(id, def)` instantiation; the current `makePositionHelpers()` / `Helpers.getModule()` test double is replaced by a `componentLoader` mock whose `createInstance` returns the component spec                                                                                                                                                                                                      |

---

## Runtime API Contracts

### `runtime.componentLoader`

Required public API:

```javascript
runtime.componentLoader.loadComponent(id)       // async cold-loading API
runtime.componentLoader.areComponentsLoaded(ids)       // sync warm-path readiness check
runtime.componentLoader.createInstance(id, def) // sync instance-tree creation API
```

Rules:

- `loadComponent(id)` loads the component module and registry-owned transitive deps/CSS/assets.
- `loadComponent(id)` evicts failed script/CSS/asset promises so retries can work.
- `createInstance(id, def)` is synchronous and never starts loading.
- `createInstance(id, def)` throws clearly if the component or dependency closure is not loaded.
- Each public `createInstance()` call creates a fresh instance tree.
- Component modules are cached globally; component instances are not cached globally.
- Declared dependency instances are created deterministically during instance-tree creation.
- `componentContext.components.require(id)` is a pure lookup of an already-created declared dependency instance.
- `require(id)` throws for undeclared dependencies and never returns raw modules/factories.
- Dependency cycles are invalid and report full paths during loading and instance creation.
- `config.components` is the single source of all registered component metadata. Component-loader exclusively owns dependency graph traversal, module caching, and instance creation. However, `config.components[id].shadowCss` is read directly by route activation code (Phase 4 deliverable 7) and by `runtime/init.js` (until Phase 8 removes the startup preload). This is not a second dependency walker — it is a flat metadata field read, distinct from component-loader's graph traversal responsibilities. Shadow CSS text fetching is owned by `runtime.theme.preloadShadowCssUrls`, not by component-loader.

### Registered component factory contract

Every registered component module's factory has this signature:

```javascript
function create(def, componentContext) {
  // ...
  return instance;
}
```

Rules:

- `def` is the AvNav widget definition (`widgetDef.def`) supplied at the top of the instance tree by `runtime.componentLoader.createInstance(id, def)` and cascaded unchanged into every nested dependency instance the loader creates while building that tree.
- `componentContext` is component-loader-created and per-instance; it has the shape defined in Phase 2 deliverable 9 (`components.require`, `theme.tokens`, `perf`, `format`, `canvas`, `dom`, `hostActions`).
- A component must not call `create()` on a dependency itself; dependency instances are already built by the loader and reached through `componentContext.components.require(id)`.
- A component must not capture or pass `componentContext` to other components; each instance receives its own scoped context from the loader.
- A component must not reach into `runtime.*` directly for ordinary services covered by `componentContext` (theme tokens, perf, format, canvas, dom, hostActions). The only registered component permitted to use `runtime.*` directly in the steady state is `ClusterWidget`, because it is the AvNav shell/orchestrator boundary (see Phase 6 deliverable 2). During Phases 2–6, `ClusterRendererRouter` is also permitted to reach into `runtime.surfaces` because Phase 2 moves its surface dependencies onto runtime while the router itself remains a registered component until Phase 7 deletes it (see Phase 2 deliverable 5a).
- For module-shape components (`apiShape: "module"`), `componentContext.components.require(id)` returns the loaded module object directly, since the "instance" of a module-shape component is the module itself.

### `runtime.perf`

Required public API:

```javascript
runtime.perf.startSpan(name, tags)   // → span token (or null when perf hooks are absent)
runtime.perf.endSpan(span, tags)     // no-op when span is null
```

Rules:

- Behavior is identical to today's `runtime.getPerfSpanApi()` result; this contract just renames the accessor from a function call (`runtime.getPerfSpanApi()`) to a property (`runtime.perf`).
- `componentContext.perf` is the same object reference; registered components call `componentContext.perf.startSpan(...)` instead of today's `Helpers.getModule("PerfSpanHelper").create(def, Helpers).startSpan(...)`.
- The flat `runtime.getPerfSpanApi()` accessor is removed from final runtime source.

### `runtime.format`

Required public API:

```javascript
runtime.format.applyFormatter(raw, props)   // → formatted string or props.default
```

Rules:

- Behavior is identical to today's `runtime.applyFormatter` / `Helpers.applyFormatter`; this contract just namespaces it under `runtime.format`.
- The flat `runtime.applyFormatter` is removed from final runtime source.

### `runtime.canvas`

Required public API:

```javascript
runtime.canvas.setupCanvas(canvas)   // → { ctx, W, H }
```

Rules:

- Behavior is identical to today's `runtime.setupCanvas` / `Helpers.setupCanvas`, including DPR handling and the per-canvas layout cache.
- The flat `runtime.setupCanvas` is removed from final runtime source.

### `runtime.dom`

Required public API:

```javascript
runtime.dom.requirePluginRoot(target)    // → committed `.widget.dyniplugin` root, throws if absent
runtime.dom.getNightModeState(rootEl)    // → boolean
```

Rules:

- Behavior is identical to today's `runtime.requirePluginRoot` / `runtime.getNightModeState` (and their `Helpers.*` mirrors), including the composed-tree traversal in `requirePluginRoot`.
- The flat `runtime.requirePluginRoot` and `runtime.getNightModeState` are removed from final runtime source.

### `runtime.hostActions`

Required public API:

```javascript
runtime.hostActions()    // → current host actions object, re-read on every call
```

Rules:

- `runtime.hostActions` is a function, not a captured reference: every call re-reads the current actions from the host action bridge so callers always see the freshest set (matches today's `Helpers.getHostActions()` behavior, which itself reads `ns.state.hostActionBridge.getHostActions()` on every call).
- `componentContext.hostActions` is the same function reference; registered components that need host actions call `componentContext.hostActions().routePoints.activate(...)` etc.
- `runtime/widget-registrar.js` continues to attach the actions snapshot to AvNav widget context on every wrapped lifecycle call — `attachHostActions(ctx) { ctx.hostActions = runtime.hostActions(); }` — preserving today's `hostContext.hostActions` shape that `runtime.surfaces` reads.
- The flat `runtime.getHostActions` is removed from final runtime source.

### `runtime.theme`

Required public API:

```javascript
// Bootstrap / runtime-only — not reachable from componentContext
runtime.theme.configure({ activePresetName })
runtime.theme.applyToRoot(rootEl)
runtime.theme.preloadShadowCssUrls(urls)        // → Promise
runtime.theme.getShadowCssText(url)             // sync read
runtime.theme.hasShadowCssText(url)             // sync check
runtime.theme.resolveStartupPresetName(htmlEl)

// Per-render token resolution — exposed on componentContext.theme.tokens
runtime.theme.tokens.resolveForRoot(rootEl)
```

Rules:

- The bootstrap surface owns theme model loading, preset configuration, root-class application, and shadow CSS caching.
- The `tokens` surface owns per-render palette/colour resolution and is the only theme surface registered components see.
- `runtime.theme` is configured at startup using internals folded out of the deleted `ThemeModel` and `ThemeResolver` component registry entries; theme internals are not registered components.
- Surface controllers and other runtime infrastructure may use the full `runtime.theme` surface directly because they are runtime-only.

### `runtime.surfaces`

Required public API:

```javascript
runtime.surfaces.createController({
  surface,                 // "html" | "canvas-dom"
  rendererSpec,
  hostContext
})
// → { attach, update, detach, destroy }

runtime.surfaces.materializeSurfacePolicyProps({
  hostContext,
  rendererId,
  props                    // post-rendererProps-merge
})
// → returns the props object with .surfacePolicy field added.
//   The .surfacePolicy shape matches today's ClusterSurfacePolicy output
//   exactly so existing consumers (AisTargetRenderModel reads pageId and
//   containerOrientation; HtmlWidgetUtils reads interaction.mode;
//   RoutePointsTextHtmlWidget / EditRouteTextHtmlWidget /
//   AisTargetTextHtmlWidget read containerOrientation) keep working
//   unchanged:
//   {
//     pageId,                 // string, hoisted from host capabilities ("other" by default)
//     containerOrientation,   // "vertical" | "default"
//     interaction: { mode },  // "dispatch" | "passive"
//     actions,                // normalized host action shims
//     hostFacts: { viewportHeight }
//   }
// The materialized props object also carries a separate enumerable-false
// .viewportHeight field (mirrors today's withSurfacePolicyProps behavior).

runtime.surfaces.getCommonShadowCssUrl()
// → "shared/html/HtmlShadowCommon.css"
```

Rules:

- `createController` is the only path to canvas-dom and HTML surface controllers; the deleted `SurfaceControllerFactory` does not return.
- `materializeSurfacePolicyProps` owns the per-`hostContext` `WeakMap` cache that today lives in `ClusterSurfacePolicy`, including capability normalization and normalized action dispatch shims.
- `materializeSurfacePolicyProps` is called by `runtime.routeActivation` only on HTML routes. Canvas-dom routes do not call it because no current canvas renderer or canvas-side runtime reads `props.surfacePolicy`. If a future canvas renderer needs it, activation is extended at that point.
- `getCommonShadowCssUrl()` is the canonical source for the shared HTML shadow CSS path string **for runtime call sites that need it after bootstrap completes** (renderer-spec code, route-activation code, test code). Renderer registry entries continue to declare their `shadowCss` arrays via a local `const SHARED_HTML_SHADOW_CSS = BASE + "shared/html/HtmlShadowCommon.css";` constant the way they do today, because `config/components/registry-*.js` files load before `runtime/surface/index.js` in the bootstrap manifest and must not depend on runtime services at registry-definition time. The accessor exists so post-bootstrap callers have one source of truth — repeated loads of the same URL are already no-ops via the existing `runtime.theme.preloadShadowCssUrls` cache, so no separate de-duplication pass is performed.
- Surface controllers may use the full `runtime.theme` surface (including `getShadowCssText`) directly because they are runtime-only.

### Runtime/component service boundary

Required behavior:

- `runtime.*` owns bootstrap/orchestration APIs and core runtime services;
- registered components receive a component-loader-created `componentContext`;
- `componentContext` exposes `theme.tokens`, `perf`, `format`, `canvas`, `dom`, `hostActions`, and `components.require()`;
- `componentContext.theme` exposes only token resolution; theme bootstrap methods are runtime-only;
- surface lifecycle is runtime/orchestration-only through `runtime.surfaces` and is not exposed on `componentContext`;
- ordinary registered components must not add new direct global runtime reach-throughs for normal services.

### `ClusterWidget.translateFunction(props)`

Output route frame:

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
- no DOM access;
- route-frame fields are plain enumerable fields.

### `ClusterShellRenderer.renderRouteShell(routeFrame, routeMeta, instanceId, hostContext)`

Required behavior:

- synchronous;
- startup-safe;
- generic shell only;
- applies route metadata initial shell sizing only when the host's container orientation is vertical (matching today's `ClusterSurfacePolicy.resolveContainerOrientation` rule); in non-vertical orientation no inline `aspect-ratio` or `height` is emitted;
- no surface implementation imports;
- no renderer spec calls;
- emits mount markup compatible with runtime surface controllers;
- emits no visible loading UI.

### `runtime.routeActivation`

Required public API:

```javascript
runtime.routeActivation.createWidgetController(def)   // → per-widget activation controller
runtime.routeActivation.DISCARDED_ACTIVATION           // frozen sentinel: Object.freeze({ discarded: true })
```

Rules:

- `createWidgetController(def)` returns a per-widget controller with `activateCommittedRoute(payload)` and `destroy()`.
- `DISCARDED_ACTIVATION` is a single frozen sentinel object, identity-checked (`===`). In-flight cold activations that complete after `destroy()` resolve (not reject) with this sentinel. `ClusterWidget`'s `.then` handler exits early on identity match before calling `SurfaceSessionController.reconcileSession`. `.catch` never sees the sentinel.
- `destroy()` flips an internal `destroyed` flag, drops the per-widget route-root instance cache and toolkit reference, and causes subsequent `activate*()` calls to throw synchronously. It does not abort or evict `runtime.componentLoader.loadComponent(id)` promises in flight.

### `RouteActivationController.activateCommittedRoute(payload)` (per-widget controller)

Input:

```javascript
{
  routeFrame,
  revision,
  rootEl,
  shellEl,
  hostContext
}
```

Required behavior:

- async on cold activation and synchronous on warm activation;
- demand-driven;
- latest-wins — each call snapshots the full input (`routeFrame`, `revision`, `rootEl`, `shellEl`, `hostContext`) and the resolved payload uses the latest snapshot;
- computes exact direct route roots from route metadata;
- delegates registered dependency traversal to component-loader;
- preloads active HTML shadow CSS before hydration;
- creates mapper/view-model/renderer instances through `runtime.componentLoader.createInstance()`;
- maps clean `mapperProps` only;
- uses `rawProps` in the activated payload for those same clean mapper props, not `__dyni*` route-frame internals;
- builds data-only activated payload;
- never preloads predicted routes.

### `SurfaceSessionController.reconcileSession(activatedPayload)`

Required behavior:

- synchronous;
- stale revision guard;
- route/renderer/surface identity guard;
- attach/update/remount/surface-switch lifecycle;
- uses stable `runtime.surfaces` service for controller creation.

---

## Performance Analysis

### Startup cost currently dominated by dependency closure

The current critical issue is ownership: startup reaches every registered component because widget registration follows `ClusterWidget` through mapper/router registries and broad renderer wrappers. PLAN20 breaks that ownership chain and makes startup load only the shell widget component.

### Clean APIs enable safe lazy activation

Lazy loading is only safe if component dependencies, runtime services, and route activation have clear ownership. PLAN20 therefore rebuilds `component-loader`, runtime services, surface ownership, and component context before cutting over `ClusterWidget`.

### Route activation cost avoids broad wrappers

Route activation loads only the active route mapper, optional view model, renderer, and their registry-owned deps. It does not lazy-load old all-route owners such as `ClusterRendererRouter`, `ClusterMapperRegistry`, or `RendererPropsWidget`.

### First render placeholder comes from route metadata; final sizing comes from shadow CSS

Renderer specs are lazy, so first shell render cannot call any renderer sizing API. Route metadata `shellSizing` carries a tiny first-paint placeholder (`ratio` for most HTML routes, `natural` for `routePoints`) and is applied only when the host container orientation is vertical, matching today's `ClusterSurfacePolicy.resolveContainerOrientation` rule. After activation, the renderer's shadow CSS becomes the only sizing authority — runtime never calls a renderer sizing hook on attach, update, or commit.

### Warm-path activation is synchronous

Cold route activation is inherently async. Warm same-route updates must not pay a microtask hop once all route components and required shadow CSS are loaded. `RouteActivationController.activateCommittedRoute()` returns a payload directly on warm path and a promise only on cold path.

### Same-route update loop remains unchanged

`HostCommitController`, runtime canvas surface controller, and runtime HTML surface controller keep their existing scheduling/coalescing ownership. PLAN20 adds only the async activation guards required by lazy route activation.

---

## Acceptance Criteria

### Runtime API cleanliness

- Public runtime services use clear names: `runtime.theme`, `runtime.format`, `runtime.canvas`, `runtime.dom`, `runtime.perf`, `runtime.hostActions`, `runtime.surfaces`, `runtime.componentLoader`, `runtime.clusterShellRenderer`, and `runtime.routeActivation`.
- `runtime.createHelpers()` and `Helpers.getModule()` are absent from final runtime source.
- No public `runtime.createComponentContext` exists.
- `componentContext.components.get()` does not exist.
- Registered components are instantiated only by `runtime.componentLoader.createInstance(id, def)`.
- Registered components receive runtime services through `componentContext`.
- `componentContext.components.require(id)` is dependency-scoped, instance-only, and throws for undeclared access.
- `componentContext.theme` exposes only `tokens`; bootstrap methods are absent from it.
- Dependency cycles are rejected with full path reporting.
- Runtime services are not registered components and are not referenced by component registry `deps`.
- Ordinary registered components do not add new direct runtime reach-throughs for normal services.

### Startup and dependency closure

- `ClusterWidget` registry deps are exactly `[]`.
- Startup component load set is asserted by tests and equals 1: `ClusterWidget`.
- `loader.uniqueComponents(widgetDefinitions)` no longer returns all 131 components.
- Widget registration still registers all 9 cluster widget definitions.

### Removed abstractions

- `ClusterRendererRouter.js`, `SurfaceControllerFactory.js`, `ClusterMapperRegistry.js`, `ClusterKindCatalog.js`, and `RendererPropsWidget.js` are deleted.
- Deleted module IDs are absent from `config.components`.
- Component-level `PerfSpanHelper.js` is deleted.
- Theme and surface runtime infrastructure IDs are absent from `config.components`.

### Route activation

- Only active route roots load on cold activation.
- Mapper execution happens only after activation.
- Mappers receive clean `mapperProps`, not route-frame internals.
- HTML route activation preloads active renderer shadow CSS before hydration.
- Canvas route activation does not fetch HTML shadow CSS.
- Warm same-route activation returns payload synchronously.
- Stale activation completions cannot hydrate or update DOM.
- Unexpected activation failures are caught by `ClusterWidget`, logged with `console.error`, and leave the committed empty shell in place.

### Documentation and gates

- Architecture docs describe new owners and no longer instruct use of removed router-era modules.
- Add-new-kind/add-new-cluster guides mention route metadata entries and component registry deps.
- `npm run check:all` passes.
- `npm run perf:check` passes or is updated intentionally with documented baseline changes.

---

## Test Plan

Minimum required focused coverage:

```text
tests/config/cluster-routes.test.js
runtime service tests for format/canvas/dom/theme/surfaces
tests/runtime/component-loader.test.js
tests/runtime/cluster/ClusterShellRenderer.test.js
tests/runtime/cluster/RouteActivationController.test.js
tests/runtime/SurfaceSessionController.test.js
tests/cluster/ClusterWidget.test.js
tests/runtime/init.test.js
tests/config/components.test.js
tests/plugin/plugin-css-fontface.test.js
tests/runtime/asset-preloader.test.js
```

Full gate before completion:

```bash
npm run check:all
npm run perf:check
```

Additional guard tests:

1. Runtime API boundary guard: runtime services are not registered components; `Helpers.getModule()` and `runtime.createHelpers()` are gone; component contexts are created only by component-loader.
2. Component dependency guard: `componentContext.components.require(id)` only allows declared deps, returns instances, and rejects cycles with full paths.
3. Startup closure guard: `ClusterWidget` closure contains no lazy implementation categories.
4. Route loading guard: representative route activations do not load unrelated renderer/view-model families.
5. Renderer-spec sizing-hook deletion guard: no renderer spec exports `getVerticalShellSizing`; runtime source contains no calls to `getVerticalShellSizing` and no calls to `applyShellSizingToElement` outside of historical plan/docs references.
6. Shadow CSS guard: startup does not preload route CSS; HTML activation does.
7. Race guard: when a stale activation promise resolves (its payload `revision` is older than `mountedRevision`), `SurfaceSessionController.reconcileSession` returns false and performs no attach/update/detach. The activation controller does not pre-filter stale resolutions before they reach `ClusterWidget`.
8. Warm-path guard: second activation of the same route uses the synchronous fast-path and does not enter the promise chain.
9. Deletion guard: removed module names do not appear in runtime source except historical plan/docs references.
10. Theme surface guard: registered components reach theme only through `componentContext.theme.tokens.*`; no registered component source references `componentContext.theme.applyToRoot`, `componentContext.theme.configure`, `componentContext.theme.preloadShadowCssUrls`, `componentContext.theme.getShadowCssText`, `componentContext.theme.hasShadowCssText`, or `componentContext.theme.resolveStartupPresetName`.
11. Surface-policy scope guard: HTML route activation produces an activated payload with a populated `props.surfacePolicy`; canvas-dom route activation does not call `runtime.surfaces.materializeSurfacePolicyProps` and the activated payload's `props.surfacePolicy` is absent.

---

## Risks and Mitigations

| Risk                                               | Mitigation                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component context becomes a renamed helper bag     | Keep behavior in explicit runtime services; component context only composes services and declared dependency lookup                                                                                                                                                  |
| Dependency-scoped instance creation exposes cycles | Reject cycles in loader traversal and instance creation with full path errors                                                                                                                                                                                        |
| Surface move bloats bootstrap                      | Surface lifecycle is runtime infrastructure; measure startup after cutting eager 131-component closure                                                                                                                                                               |
| Theme move bloats bootstrap                        | Theme model/resolution are small and prevent activation/theme special cases                                                                                                                                                                                          |
| Shell sizing drifts from renderer rendered size    | Route metadata `shellSizing` is documented as first-paint placeholder only; final sizing is renderer-shadow-CSS-owned, so there is no JS sizing function whose output could disagree with metadata. Renderer-spec sizing-hook deletion guard prevents reintroduction |
| Cold HTML activation flickers without CSS          | Block HTML hydration until active renderer shadow CSS is cached                                                                                                                                                                                                      |
| Warm path accidentally becomes async               | Tests assert warm activation returns a payload directly and `ClusterWidget` does not wrap it in a promise                                                                                                                                                            |
| Old eager owners reappear                          | Delete files, remove registry entries, add pattern/dependency guards                                                                                                                                                                                                 |

---

## Related

- `documentation/guides/exec-plan-authoring.md`
- `documentation/architecture/component-system.md`
- `documentation/architecture/runtime-lifecycle.md`
- `documentation/architecture/cluster-widget-system.md`
- `documentation/architecture/surface-session-controller.md`
- `documentation/architecture/html-renderer-lifecycle.md`
- `documentation/architecture/asset-system.md`
- `documentation/shared/bundled-fonts.md`
