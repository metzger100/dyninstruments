import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import inspector from "node:inspector";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import { JSDOM } from "jsdom";
import { loadComponentsRegistry, SENTINEL_BASE } from "../components-registry-loader.mjs";
import { normalizeSummary, summarizeSamples, toFixedNumber } from "./metrics.mjs";
import { summarizeCpuProfile } from "./profile.mjs";

const require = createRequire(import.meta.url);

export const DEFAULT_SCENARIO_ORDER = Object.freeze([
  "speed_radial",
  "wind_radial",
  "xte_text",
  "active_route_html",
  "map_zoom_html",
  "center_display_text",
  "gpspage_all_widgets"
]);

export const DEFAULT_OPTIONS = Object.freeze({
  seed: 1337,
  cpuSlowdownFactor: 6,
  warmupIterations: 5,
  measuredIterations: 200,
  scenarioOrder: DEFAULT_SCENARIO_ORDER,
  captureCpuProfile: true,
  outputDir: path.join("artifacts", "perf")
});

const COMPUTE_SPAN_NAMES = new Set([
  "ClusterWidget.translateFunction",
  "ClusterWidget.renderHtml",
  "HtmlSurfaceController.attach",
  "HtmlSurfaceController.update",
  "Renderer.renderHtml",
  "Renderer.renderCanvas"
]);

const WAIT_SPAN_TO_METRIC = Object.freeze({
  "HostCommitController.scheduleCommit->onCommit": "host_commit_wait_ms",
  "SurfaceSessionController.reconcileSession": "surface_reconcile_wait_ms",
  "CanvasDomSurfaceAdapter.schedulePaint->paintNow": "canvas_paint_queue_wait_ms"
});

const SPAN_FILE_BY_NAME = Object.freeze({
  "ClusterWidget.translateFunction": "cluster/ClusterWidget.js",
  "ClusterWidget.renderHtml": "cluster/ClusterWidget.js",
  "HostCommitController.scheduleCommit->onCommit": "runtime/HostCommitController.js",
  "SurfaceSessionController.reconcileSession": "runtime/SurfaceSessionController.js",
  "HtmlSurfaceController.attach": "runtime/surface/HtmlSurfaceController.js",
  "HtmlSurfaceController.update": "runtime/surface/HtmlSurfaceController.js",
  "CanvasDomSurfaceAdapter.schedulePaint->paintNow": "runtime/surface/CanvasDomSurfaceAdapter.js",
  "Renderer.renderHtml": "runtime/surface/HtmlSurfaceController.js",
  "Renderer.renderCanvas": "runtime/surface/CanvasDomSurfaceAdapter.js"
});

const FIXTURE_WIDGET_CLUSTER_BY_NAME = Object.freeze({
  dyni_CourseHeading_Instruments: "courseHeading",
  dyni_Speed_Instruments: "speed",
  dyni_Environment_Instruments: "environment",
  dyni_Wind_Instruments: "wind",
  dyni_Vessel_Instruments: "vessel",
  dyni_Nav_Instruments: "nav",
  dyni_Map_Instruments: "map",
  dyni_Anchor_Instruments: "anchor"
});

const CAPTION_BY_KEY = Object.freeze({
  hdt: "HDT",
  hdm: "HDM",
  cog: "COG",
  brg: "BRG",
  hdtRadial: "Heading",
  hdtLinear: "Heading",
  sog: "SOG",
  stw: "STW",
  sogRadial: "SOG",
  sogLinear: "SOG",
  depth: "Depth",
  depthRadial: "Depth",
  depthLinear: "Depth",
  temp: "Temp",
  tempRadial: "Temp",
  tempLinear: "Temp",
  angleTrue: "TWA",
  angleApparent: "AWA",
  angleTrueDirection: "TWD",
  angleTrueRadialAngle: "Wind Angle",
  angleTrueRadialSpeed: "Wind Speed",
  angleTrueLinearAngle: "Wind Angle",
  angleTrueLinearSpeed: "Wind Speed",
  voltage: "Voltage",
  voltageRadial: "Voltage",
  voltageLinear: "Voltage",
  eta: "ETA",
  rteEta: "Route ETA",
  dst: "DST",
  rteDistance: "Route Dist",
  vmg: "VMG",
  positionBoat: "Boat Position",
  positionWp: "WP Position",
  activeRouteRemain: "Remain",
  activeRouteEta: "ETA",
  activeRouteNextCourse: "Next COG",
  centerDisplayPosition: "Center",
  centerDisplayMarker: "Marker",
  centerDisplayBoat: "Boat",
  centerDisplayMeasure: "Measure",
  xteDisplayXte: "XTE",
  xteDisplayCog: "COG",
  xteDisplayDst: "DST",
  xteDisplayBrg: "BRG",
  zoom: "Zoom",
  distance: "Anchor Dist",
  watch: "Anchor Watch",
  bearing: "Anchor BRG",
  pitch: "Pitch",
  roll: "Roll",
  dateTime: "Date/Time",
  timeStatus: "Time Status",
  clock: "Clock"
});

const UNIT_BY_KEY = Object.freeze({
  hdt: "deg",
  hdm: "deg",
  cog: "deg",
  brg: "deg",
  hdtRadial: "deg",
  hdtLinear: "deg",
  sog: "kn",
  stw: "kn",
  sogRadial: "kn",
  sogLinear: "kn",
  depth: "m",
  depthRadial: "m",
  depthLinear: "m",
  temp: "C",
  tempRadial: "C",
  tempLinear: "C",
  angleTrue: "deg",
  angleApparent: "deg",
  angleTrueDirection: "deg",
  angleTrueRadialAngle: "deg",
  angleTrueRadialSpeed: "kn",
  angleTrueLinearAngle: "deg",
  angleTrueLinearSpeed: "kn",
  voltage: "V",
  voltageRadial: "V",
  voltageLinear: "V",
  eta: "",
  rteEta: "",
  dst: "nm",
  rteDistance: "nm",
  vmg: "kn",
  positionBoat: "",
  positionWp: "",
  activeRouteRemain: "nm",
  activeRouteEta: "",
  activeRouteNextCourse: "deg",
  centerDisplayPosition: "",
  centerDisplayMarker: "nm",
  centerDisplayBoat: "nm",
  centerDisplayMeasure: "nm",
  xteDisplayXte: "nm",
  xteDisplayCog: "deg",
  xteDisplayDst: "nm",
  xteDisplayBrg: "deg",
  zoom: "x",
  distance: "m",
  watch: "m",
  bearing: "deg",
  pitch: "deg",
  roll: "deg",
  dateTime: "",
  timeStatus: "",
  clock: ""
});

export function createPerfHooksCollector(clock = () => performance.now()) {
  const events = [];

  function cloneTags(tags) {
    if (!tags || typeof tags !== "object") {
      return null;
    }
    return { ...tags };
  }

  return {
    hooks: {
      startSpan(name, tags) {
        return {
          name: String(name),
          start_ms: Number(clock()),
          tags: cloneTags(tags)
        };
      },
      endSpan(token, tags) {
        if (!token || token.__ended) {
          return;
        }
        token.__ended = true;
        const endMs = Number(clock());
        const startMs = Number(token.start_ms);
        const duration = Math.max(0, endMs - startMs);
        events.push({
          name: token.name,
          start_ms: startMs,
          end_ms: endMs,
          duration_ms: duration,
          tags: {
            ...(token.tags || {}),
            ...((tags && typeof tags === "object") ? tags : {})
          }
        });
      }
    },
    events,
    clear() {
      events.length = 0;
    },
    slice(fromIndex) {
      return events.slice(fromIndex);
    }
  };
}

export async function runPerfScenarioSuite(options = {}) {
  const cfg = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  const rootDir = path.resolve(cfg.rootDir || process.cwd());
  const outputDir = path.resolve(rootDir, cfg.outputDir);
  const scenarioOrder = Array.isArray(cfg.scenarioOrder) ? cfg.scenarioOrder.slice() : DEFAULT_SCENARIO_ORDER.slice();

  const env = createHarnessEnvironment({ rootDir });
  try {
    const layoutFixture = readLayoutFixture(rootDir);
    const widgetDefinitions = globalThis.DyniPlugin && globalThis.DyniPlugin.config
      ? globalThis.DyniPlugin.config.widgetDefinitions
      : [];
    const startupComponentIds = env.moduleResolver.uniqueComponents(widgetDefinitions);
    const report = {
      schema_version: 1,
      suite_id: "dyninstruments-perf-core-v1",
      generated_at: new Date().toISOString(),
      environment: {
        runner: "node-jsdom",
        browser_lab_mode: "simulated-chromium-headless",
        cpu_slowdown_factor: cfg.cpuSlowdownFactor,
        warmup_iterations: cfg.warmupIterations,
        measured_iterations: cfg.measuredIterations,
        deterministic_seed: cfg.seed,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      startup: {
        component_ids: startupComponentIds,
        component_count: startupComponentIds.length
      },
      startup_component_ids: startupComponentIds,
      startup_component_count: startupComponentIds.length,
      scenario_order: scenarioOrder,
      scenarios: {}
    };

    for (const scenarioId of scenarioOrder) {
      const scenario = createScenarioRunner({
        scenarioId,
        env,
        layoutFixture
      });
      const seed = buildScenarioSeed(cfg.seed, scenarioId);
      const rng = createRng(seed);

      for (let warmup = 0; warmup < cfg.warmupIterations; warmup += 1) {
        await runScenarioIteration(
          scenario.runWarmupStep,
          warmup,
          cfg.cpuSlowdownFactor,
          rng,
          env.collector,
          env
        );
      }

      env.collector.clear();
      env.shadowCssPreloadEvents.length = 0;
      const coldActivationSample = await measureColdActivationSample({
        scenario,
        iteration: 0,
        cpuSlowdownFactor: cfg.cpuSlowdownFactor,
        rng,
        env
      });

      env.collector.clear();
      env.shadowCssPreloadEvents.length = 0;
      const measuredSamples = [];
      const scenarioSpanEvents = [];

      const runMeasured = async () => {
        for (let iteration = 0; iteration < cfg.measuredIterations; iteration += 1) {
          measuredSamples.push(await runScenarioIteration(
            scenario.runWarmUpdateStep,
            iteration,
            cfg.cpuSlowdownFactor,
            rng,
            env.collector,
            env,
            scenarioSpanEvents
          ));
        }
      };

      let profile = null;
      if (cfg.captureCpuProfile) {
        profile = await captureCpuProfile(runMeasured);
      } else {
        await runMeasured();
      }

      const warmSummary = buildScenarioSummary({
        samples: measuredSamples,
        profile,
        rootDir,
        fallbackEvents: scenarioSpanEvents,
        resolveComponentPath: env.moduleResolver.getComponentPath
      });
      report.scenarios[scenarioId] = buildScenarioReport({
        coldActivationSample,
        warmSummary,
        coldShadowCssPreloads: env.shadowCssPreloadEvents,
        scenarioId
      });
      scenario.destroy();
    }

    report.hotspot_summary = buildHotspotSummary(report.scenarios, scenarioOrder);
    const artifacts = writePerfArtifacts(report, outputDir);
    return {
      report,
      artifacts
    };
  }
  finally {
    env.restore();
  }
}

function createHarnessEnvironment(options) {
  const rootDir = options.rootDir;
  const scheduler = createVirtualScheduler();
  const collector = createPerfHooksCollector();
  const shadowCssPreloadEvents = [];

  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true
  });

  const originalGlobals = captureGlobals();
  const avnav = createAvnavStub();

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = scheduler.requestAnimationFrame;
  globalThis.cancelAnimationFrame = scheduler.cancelAnimationFrame;
  globalThis.setTimeout = scheduler.setTimeout;
  globalThis.clearTimeout = scheduler.clearTimeout;
  globalThis.MutationObserver = scheduler.MutationObserver;
  globalThis.ResizeObserver = scheduler.ResizeObserver;
  globalThis.__DYNI_PERF_HOOKS__ = collector.hooks;
  globalThis.avnav = avnav;
  globalThis.fetch = createDeterministicFetch(rootDir);

  patchCanvasPrototypes(dom.window);

  delete globalThis.DyniPlugin;
  runIifeScript(rootDir, "runtime/namespace.js");
  globalThis.DyniPlugin.baseUrl = SENTINEL_BASE;
  runIifeScript(rootDir, "shared/unit-format-families.js");
  runIifeScript(rootDir, "config/shared/editable-param-utils.js");
  runIifeScript(rootDir, "config/shared/kind-defaults.js");
  runIifeScript(rootDir, "config/shared/common-editables.js");
  runIifeScript(rootDir, "config/shared/unit-editable-utils.js");
  runIifeScript(rootDir, "config/shared/environment-base-editables.js");
  runIifeScript(rootDir, "config/shared/environment-depth-editables.js");
  runIifeScript(rootDir, "config/shared/environment-temperature-editables.js");
  runIifeScript(rootDir, "config/shared/environment-editables.js");
  runIifeScript(rootDir, "config/clusters/course-heading.js");
  runIifeScript(rootDir, "config/clusters/speed.js");
  runIifeScript(rootDir, "config/clusters/environment.js");
  runIifeScript(rootDir, "config/clusters/wind.js");
  runIifeScript(rootDir, "config/clusters/nav.js");
  runIifeScript(rootDir, "config/clusters/map.js");
  runIifeScript(rootDir, "config/clusters/anchor.js");
  runIifeScript(rootDir, "config/clusters/vessel.js");
  runIifeScript(rootDir, "config/clusters/default.js");
  runIifeScript(rootDir, "config/widget-definitions.js");
  runIifeScript(rootDir, "config/components/registry-shared-foundation-format.js");
  runIifeScript(rootDir, "config/components/registry-shared-foundation-geometry.js");
  runIifeScript(rootDir, "config/components/registry-shared-foundation-layout.js");
  runIifeScript(rootDir, "config/components/registry-shared-foundation-state.js");
  runIifeScript(rootDir, "config/components/registry-shared-engines.js");
  runIifeScript(rootDir, "config/components/registry-widgets-nav.js");
  runIifeScript(rootDir, "config/components/registry-widgets-vessel.js");
  runIifeScript(rootDir, "config/components/registry-widgets-gauge.js");
  runIifeScript(rootDir, "config/components/registry-cluster.js");
  runIifeScript(rootDir, "config/components.js");
  runIifeScript(rootDir, "config/cluster-routes.js");
  runIifeScript(rootDir, "config/cluster-routes/course-heading.js");
  runIifeScript(rootDir, "config/cluster-routes/speed.js");
  runIifeScript(rootDir, "config/cluster-routes/environment.js");
  runIifeScript(rootDir, "config/cluster-routes/wind.js");
  runIifeScript(rootDir, "config/cluster-routes/nav.js");
  runIifeScript(rootDir, "config/cluster-routes/map.js");
  runIifeScript(rootDir, "config/cluster-routes/anchor.js");
  runIifeScript(rootDir, "config/cluster-routes/vessel.js");
  runIifeScript(rootDir, "config/cluster-routes/default.js");
  runIifeScript(rootDir, "config/cluster-routes/finalize.js");
  runIifeScript(rootDir, "runtime/PerfSpanHelper.js");
  runIifeScript(rootDir, "runtime/format-runtime.js");
  runIifeScript(rootDir, "runtime/canvas-runtime.js");
  runIifeScript(rootDir, "runtime/dom-runtime.js");
  runIifeScript(rootDir, "runtime/theme/model.js");
  runIifeScript(rootDir, "runtime/theme/resolver.js");
  runIifeScript(rootDir, "runtime/theme-runtime.js");
  runIifeScript(rootDir, "runtime/HostCommitController.js");
  runIifeScript(rootDir, "runtime/SurfaceSessionController.js");
  runIifeScript(rootDir, "runtime/surface/ClusterSurfacePolicy.js");
  runIifeScript(rootDir, "runtime/surface/CanvasDomSurfaceAdapter.js");
  runIifeScript(rootDir, "runtime/surface/HtmlSurfaceController.js");
  runIifeScript(rootDir, "runtime/surface/index.js");
  runIifeScript(rootDir, "runtime/cluster/ClusterShellRenderer.js");
  runIifeScript(rootDir, "runtime/cluster/RouteActivationPayloadBuilder.js");
  runIifeScript(rootDir, "runtime/cluster/RouteActivationLatestWins.js");
  runIifeScript(rootDir, "runtime/cluster/RouteActivationController.js");
  const baseThemeRuntime = globalThis.DyniPlugin.runtime.theme;
  const baseRouteActivationRuntime = globalThis.DyniPlugin.runtime.routeActivation;

  globalThis.DyniPlugin.runtime.theme = Object.freeze({
    configure: baseThemeRuntime.configure,
    applyToRoot: baseThemeRuntime.applyToRoot,
    resolveStartupPresetName: baseThemeRuntime.resolveStartupPresetName,
    preloadShadowCssUrls(urls) {
      const startMs = performance.now();
      const normalizedUrls = normalizeShadowCssUrlList(urls);
      return Promise.resolve(baseThemeRuntime.preloadShadowCssUrls(urls))
        .then(function (result) {
          shadowCssPreloadEvents.push({
            url_count: normalizedUrls.length,
            duration_ms: Math.max(0, performance.now() - startMs)
          });
          return result;
        });
    },
    tokens: Object.freeze({
      resolveForRoot: baseThemeRuntime.tokens.resolveForRoot
    }),
    getShadowCssText: baseThemeRuntime.getShadowCssText,
    hasShadowCssText: baseThemeRuntime.hasShadowCssText
  });

  globalThis.DyniPlugin.runtime.routeActivation = Object.freeze({
    DISCARDED_ACTIVATION: baseRouteActivationRuntime.DISCARDED_ACTIVATION,
    createWidgetController(def) {
      const controller = baseRouteActivationRuntime.createWidgetController(def);
      let lastActivationPromise = null;

      return Object.freeze({
        activateCommittedRoute(options) {
          const activation = controller.activateCommittedRoute(options);
          lastActivationPromise = activation && typeof activation.then === "function" ? activation : null;
          return activation;
        },
        destroy() {
          lastActivationPromise = null;
          return controller.destroy();
        },
        get lastActivationPromise() {
          return lastActivationPromise;
        }
      });
    },
    reportActivationError: baseRouteActivationRuntime.reportActivationError
  });

  globalThis.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });
  globalThis.DyniPlugin.runtime.hostActions = function () {
    return globalThis.DyniPlugin.state.hostActionBridge.getHostActions();
  };

  globalThis.DyniPlugin.state.hostActionBridge = {
    getHostActions: createHostActions
  };

  const moduleResolver = createComponentResolver(rootDir, globalThis.DyniPlugin.runtime);
  globalThis.DyniPlugin.runtime.componentLoader = createPerfComponentLoader(moduleResolver);

  return {
    rootDir,
    document: dom.window.document,
    scheduler,
    collector,
    shadowCssPreloadEvents,
    moduleResolver,
    restore() {
      restoreGlobals(originalGlobals);
      dom.window.close();
      delete globalThis.DyniPlugin;
      delete globalThis.DyniComponents;
      delete globalThis.__DYNI_PERF_HOOKS__;
      delete globalThis.avnav;
    }
  };
}

function createPerfComponentLoader(moduleResolver) {
  const loadedIds = new Set();

  return {
    loadComponent(id) {
      const componentPath = moduleResolver.getComponentPath(id);
      if (!componentPath) {
        return Promise.reject(new Error(`Unknown component: ${id}`));
      }
      loadedIds.add(id);
      return Promise.resolve();
    },
    areComponentsLoaded(ids) {
      if (!Array.isArray(ids)) {
        return false;
      }
      for (let i = 0; i < ids.length; i += 1) {
        if (!loadedIds.has(ids[i])) {
          return false;
        }
      }
      return true;
    },
    createInstance(id, def) {
      loadedIds.add(id);
      return moduleResolver.createInstance(id, def);
    }
  };
}

function createScenarioRunner(args) {
  const scenarioId = args.scenarioId;
  const env = args.env;
  const fixture = args.layoutFixture;

  if (scenarioId === "gpspage_all_widgets") {
    return createAggregateRunner(env, fixture);
  }

  const scenarioMap = {
    speed_radial: { cluster: "speed", kind: "sogRadial", width: 300, height: 300 },
    wind_radial: { cluster: "wind", kind: "angleTrueRadial", width: 300, height: 300 },
    xte_text: { cluster: "nav", kind: "xteDisplay", width: 420, height: 180 },
    active_route_html: { cluster: "nav", kind: "activeRoute", width: 420, height: 180 },
    map_zoom_html: { cluster: "map", kind: "zoom", width: 360, height: 160 },
    center_display_text: { cluster: "map", kind: "centerDisplay", width: 420, height: 220 }
  };

  const spec = scenarioMap[scenarioId];
  if (!spec) {
    throw new Error(`Unknown scenario '${scenarioId}'`);
  }

  const session = createClusterSession(env, spec.cluster, spec.width, spec.height);
  return {
    runWarmupStep(iteration, rng) {
      const props = buildRawProps(spec.cluster, "__perfWarmup__", iteration, 0, rng);
      session.render(props);
    },
    runColdActivationStep(iteration, rng) {
      const props = buildRawProps(spec.cluster, spec.kind, iteration, 0, rng);
      return session.render(props);
    },
    runWarmUpdateStep(iteration, rng) {
      const props = buildRawProps(spec.cluster, spec.kind, iteration, 0, rng);
      return session.render(props);
    },
    destroy() {
      session.destroy();
    }
  };
}

function createAggregateRunner(env, fixture) {
  const entries = [];
  const page = fixture && fixture.widgets ? fixture.widgets.gpspage1 : null;
  const slots = ["left", "left_anchor", "right"];

  for (const slotName of slots) {
    const slot = page && Array.isArray(page[slotName]) ? page[slotName] : [];
    for (const widget of slot) {
      const cluster = FIXTURE_WIDGET_CLUSTER_BY_NAME[widget.name];
      if (!cluster) {
        continue;
      }
      const size = resolveSlotSize(slotName, widget.weight);
      const session = createClusterSession(env, cluster, size.width, size.height);
      entries.push({
        cluster,
        kind: widget.kind,
        session
      });
    }
  }

  return {
    runWarmupStep(iteration, rng) {
      for (const entry of entries) {
        const props = buildRawProps(entry.cluster, "__perfWarmup__", iteration, 0, rng);
        entry.session.render(props);
      }
    },
    runColdActivationStep(iteration, rng) {
      const activationPromises = [];
      for (const entry of entries) {
        const props = buildRawProps(entry.cluster, entry.kind, iteration, 0, rng);
        const result = entry.session.render(props);
        if (result && result.activationPromise && typeof result.activationPromise.then === "function") {
          activationPromises.push(result.activationPromise);
        }
      }
      return activationPromises.length ? { activationPromise: Promise.all(activationPromises) } : null;
    },
    runWarmUpdateStep(iteration, rng) {
      for (const entry of entries) {
        const props = buildRawProps(entry.cluster, entry.kind, iteration, 0, rng);
        entry.session.render(props);
      }
    },
    destroy() {
      for (const entry of entries) {
        entry.session.destroy();
      }
    }
  };
}

function createClusterSession(env, cluster, width, height) {
  const clusterWidget = env.moduleResolver.createInstance("ClusterWidget", { cluster });
  const context = {
    eventHandler: [],
    triggerResize() {},
    hostActions: globalThis.DyniPlugin.runtime.hostActions()
  };

  const rootEl = env.document.createElement("div");
  rootEl.className = "widget dyniplugin dyni-host-html";
  setElementRect(rootEl, width, height);
  env.document.body.appendChild(rootEl);

  clusterWidget.initFunction.call(context);

  return {
    render(rawProps) {
      const mapped = clusterWidget.translateFunction(rawProps);
      const renderProps = {
        ...rawProps,
        ...((mapped && typeof mapped === "object") ? mapped : {})
      };

      const html = clusterWidget.renderHtml.call(context, renderProps);
      rootEl.innerHTML = html;
      const shell = rootEl.querySelector(".widgetData.dyni-shell");
      if (shell) {
        setElementRect(shell, width, height);
      }
      env.scheduler.flushAll();
      const activationController = context.__dyniClusterState && context.__dyniClusterState.activationController
        ? context.__dyniClusterState.activationController
        : null;

      return {
        html,
        activationPromise: activationController && activationController.lastActivationPromise
          ? activationController.lastActivationPromise
          : null
      };
    },
    destroy() {
      clusterWidget.finalizeFunction.call(context);
      if (rootEl.parentElement) {
        rootEl.parentElement.removeChild(rootEl);
      }
    }
  };
}

async function runScenarioIteration(stepFn, iteration, cpuSlowdownFactor, rng, collector, env, eventSink) {
  const loopFactor = Math.max(1, Number(cpuSlowdownFactor) || 1);
  const iterationStart = performance.now();
  const fromIndex = collector.events.length;

  const stepResult = stepFn(iteration, rng);
  const activationPromise = stepResult && typeof stepResult === "object" && stepResult.activationPromise
    ? stepResult.activationPromise
    : null;

  if (stepResult && typeof stepResult.then === "function") {
    await stepResult;
  }
  if (activationPromise && typeof activationPromise.then === "function") {
    await activationPromise;
    await Promise.resolve();
    env.scheduler.flushAll();
  }

  applyCpuSlowdown(loopFactor);

  const totalMs = Math.max(0, performance.now() - iterationStart);
  const events = collector.slice(fromIndex);
  if (Array.isArray(eventSink)) {
    for (const event of events) {
      eventSink.push(event);
    }
  }
  return aggregateIterationMetrics(totalMs, events);
}

async function measureColdActivationSample(options) {
  const scenario = options.scenario;
  const iteration = Number.isFinite(options.iteration) ? options.iteration : 0;
  const cpuSlowdownFactor = options.cpuSlowdownFactor;
  const rng = options.rng;
  const env = options.env;
  const fromIndex = env.shadowCssPreloadEvents.length;

  const sample = await runScenarioIteration(
    scenario.runColdActivationStep,
    iteration,
    cpuSlowdownFactor,
    rng,
    env.collector,
    env
  );

  const shadowCssPreloads = env.shadowCssPreloadEvents.slice(fromIndex);
  return buildColdActivationSummary(sample, shadowCssPreloads);
}

let slowdownSink = 0;
function applyCpuSlowdown(factor) {
  const loops = Math.max(0, (Math.round(factor) - 1) * 3000);
  for (let i = 0; i < loops; i += 1) {
    slowdownSink = (slowdownSink + ((i * 31) % 17)) % 1048573;
  }
}

function aggregateIterationMetrics(totalMs, events) {
  const breakdown = {
    host_commit_wait_ms: 0,
    surface_reconcile_wait_ms: 0,
    canvas_paint_queue_wait_ms: 0
  };

  let computeMs = 0;
  for (const event of events) {
    const duration = Number(event.duration_ms);
    if (!Number.isFinite(duration) || duration < 0) {
      continue;
    }

    if (COMPUTE_SPAN_NAMES.has(event.name)) {
      computeMs += duration;
    }

    const waitMetricKey = WAIT_SPAN_TO_METRIC[event.name];
    if (waitMetricKey) {
      breakdown[waitMetricKey] += duration;
    }
  }

  const waitMs = breakdown.host_commit_wait_ms + breakdown.surface_reconcile_wait_ms + breakdown.canvas_paint_queue_wait_ms;
  const effectiveComputeMs = computeMs > 0 ? computeMs : Math.max(0, totalMs - waitMs);
  const waitRatio = (effectiveComputeMs + waitMs) > 0
    ? waitMs / (effectiveComputeMs + waitMs)
    : 0;

  return {
    compute_ms: effectiveComputeMs,
    wait_ms: waitMs,
    total_ms: totalMs,
    wait_ratio: waitRatio,
    ...breakdown
  };
}

function buildScenarioSummary(args) {
  const samples = args.samples || [];
  const compute = samples.map((item) => item.compute_ms);
  const wait = samples.map((item) => item.wait_ms);
  const total = samples.map((item) => item.total_ms);
  const waitRatio = samples.map((item) => item.wait_ratio);
  const hostCommitWait = samples.map((item) => item.host_commit_wait_ms);
  const surfaceWait = samples.map((item) => item.surface_reconcile_wait_ms);
  const canvasWait = samples.map((item) => item.canvas_paint_queue_wait_ms);

  const longTasks = total.filter((value) => value >= 50);

  const profileSummary = summarizeCpuProfile(args.profile, {
    rootDir: args.rootDir
  });
  const hotspotSummary = profileSummary.top_by_self.length
    ? {
      ...profileSummary,
      source: "cpu-profile"
    }
    : {
      ...summarizeSpanHotspots(args.fallbackEvents || [], args.resolveComponentPath),
      source: "span-fallback"
    };

  return {
    sample_count: samples.length,
    compute_ms: normalizeSummary(summarizeSamples(compute)),
    wait_ms: normalizeSummary(summarizeSamples(wait)),
    total_ms: normalizeSummary(summarizeSamples(total)),
    wait_ratio: normalizeSummary(summarizeSamples(waitRatio)),
    wait_breakdown_ms: {
      host_commit_wait_ms: normalizeSummary(summarizeSamples(hostCommitWait)),
      surface_reconcile_wait_ms: normalizeSummary(summarizeSamples(surfaceWait)),
      canvas_paint_queue_wait_ms: normalizeSummary(summarizeSamples(canvasWait))
    },
    long_tasks: {
      count_50ms: longTasks.length,
      max_ms: toFixedNumber(longTasks.length ? Math.max(...longTasks) : 0)
    },
    hotspots: hotspotSummary
  };
}

function buildColdActivationSummary(sample, shadowCssPreloads) {
  const preloadSamples = Array.isArray(shadowCssPreloads) ? shadowCssPreloads : [];
  const preloadCounts = preloadSamples.map((entry) => entry.url_count);
  const preloadTimes = preloadSamples.map((entry) => entry.duration_ms);
  const coldSample = sample || {};

  return {
    sample_count: 1,
    compute_ms: normalizeSummary(summarizeSamples([coldSample.compute_ms])),
    wait_ms: normalizeSummary(summarizeSamples([coldSample.wait_ms])),
    total_ms: normalizeSummary(summarizeSamples([coldSample.total_ms])),
    wait_ratio: normalizeSummary(summarizeSamples([coldSample.wait_ratio])),
    wait_breakdown_ms: {
      host_commit_wait_ms: normalizeSummary(summarizeSamples([coldSample.host_commit_wait_ms])),
      surface_reconcile_wait_ms: normalizeSummary(summarizeSamples([coldSample.surface_reconcile_wait_ms])),
      canvas_paint_queue_wait_ms: normalizeSummary(summarizeSamples([coldSample.canvas_paint_queue_wait_ms]))
    },
    long_tasks: {
      count_50ms: Number(coldSample.total_ms) >= 50 ? 1 : 0,
      max_ms: toFixedNumber(coldSample.total_ms || 0)
    },
    shadow_css_preload: {
      sample_count: preloadSamples.length,
      url_count: normalizeSummary(summarizeSamples(preloadCounts)),
      time_ms: normalizeSummary(summarizeSamples(preloadTimes))
    }
  };
}

function buildScenarioReport(args) {
  const warmSummary = args.warmSummary || {};
  const emptySummary = normalizeSummary(summarizeSamples([]));
  const emptyWaitBreakdown = {
    host_commit_wait_ms: emptySummary,
    surface_reconcile_wait_ms: emptySummary,
    canvas_paint_queue_wait_ms: emptySummary
  };

  return {
    sample_count: warmSummary.sample_count || 0,
    cold_activation: args.coldActivationSample || null,
    warm_update: warmSummary,
    compute_ms: warmSummary.compute_ms || emptySummary,
    wait_ms: warmSummary.wait_ms || emptySummary,
    total_ms: warmSummary.total_ms || emptySummary,
    wait_ratio: warmSummary.wait_ratio || emptySummary,
    wait_breakdown_ms: warmSummary.wait_breakdown_ms || emptyWaitBreakdown,
    long_tasks: warmSummary.long_tasks || {
      count_50ms: 0,
      max_ms: 0
    },
    hotspots: warmSummary.hotspots || {
      top_by_self: [],
      top_by_total: [],
      hottest_self_share_pct: 0,
      top5_self_share_pct: 0,
      total_profiled_ms: 0
    }
  };
}

function buildHotspotSummary(scenarios, scenarioOrder) {
  const hottestByScenario = [];

  for (const scenarioId of scenarioOrder) {
    const scenario = scenarios[scenarioId];
    if (!scenario || !scenario.hotspots || !Array.isArray(scenario.hotspots.top_by_self)) {
      continue;
    }
    const hottest = scenario.hotspots.top_by_self[0];
    if (!hottest) {
      continue;
    }
    hottestByScenario.push({
      scenario: scenarioId,
      ...hottest
    });
  }

  return {
    scenario_hottest: hottestByScenario,
    hottest_overall: hottestByScenario
      .slice()
      .sort((a, b) => b.self_share_pct - a.self_share_pct)
      .slice(0, 15)
  };
}

function summarizeSpanHotspots(events, resolveComponentPath) {
  const byKey = new Map();

  for (const event of events) {
    const duration = Number(event && event.duration_ms);
    if (!Number.isFinite(duration) || duration <= 0) {
      continue;
    }

    const descriptor = describeHotspotEntry(event, resolveComponentPath);
    const key = `${descriptor.function_name}|${descriptor.file}`;
    const entry = byKey.get(key) || {
      function_name: descriptor.function_name,
      file: descriptor.file,
      self_ms: 0,
      total_ms: 0
    };
    entry.self_ms += duration;
    entry.total_ms += duration;
    byKey.set(key, entry);
  }

  const entries = Array.from(byKey.values());
  const totalSelf = entries.reduce((acc, item) => acc + item.self_ms, 0);
  const totalOverall = entries.reduce((acc, item) => acc + item.total_ms, 0);

  const normalized = entries.map((entry) => {
    const selfShare = totalSelf > 0 ? (entry.self_ms / totalSelf) * 100 : 0;
    const totalShare = totalOverall > 0 ? (entry.total_ms / totalOverall) * 100 : 0;
    return {
      function_name: entry.function_name,
      file: entry.file,
      self_ms: toFixedNumber(entry.self_ms),
      total_ms: toFixedNumber(entry.total_ms),
      self_share_pct: toFixedNumber(selfShare),
      total_share_pct: toFixedNumber(totalShare)
    };
  });

  const topBySelf = normalized
    .slice()
    .sort((a, b) => b.self_ms - a.self_ms || b.total_ms - a.total_ms)
    .slice(0, 15);
  const topByTotal = normalized
    .slice()
    .sort((a, b) => b.total_ms - a.total_ms || b.self_ms - a.self_ms)
    .slice(0, 15);
  const top5Share = topBySelf.slice(0, 5).reduce((acc, item) => acc + item.self_share_pct, 0);

  return {
    top_by_self: topBySelf,
    top_by_total: topByTotal,
    hottest_self_share_pct: topBySelf.length ? topBySelf[0].self_share_pct : 0,
    top5_self_share_pct: toFixedNumber(top5Share),
    total_profiled_ms: toFixedNumber(totalOverall)
  };
}

function describeHotspotEntry(event, resolveComponentPath) {
  const name = event && event.name ? String(event.name) : "unknown";
  const tags = event && event.tags && typeof event.tags === "object" ? event.tags : {};
  if (name === "Renderer.renderCanvas" || name === "Renderer.renderHtml") {
    const rendererId = tags.rendererId || "unknown-renderer";
    const rendererFile = (typeof resolveComponentPath === "function")
      ? (resolveComponentPath(rendererId) || "unknown")
      : "unknown";
    return {
      function_name: `${name}:${rendererId}`,
      file: rendererFile
    };
  }
  return {
    function_name: name,
    file: SPAN_FILE_BY_NAME[name] || "unknown"
  };
}

function writePerfArtifacts(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "perf-report.json");
  const markdownPath = path.join(outputDir, "perf-report.md");

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderPerfMarkdown(report), "utf8");

  return {
    outputDir,
    jsonPath,
    markdownPath
  };
}

function renderPerfMarkdown(report) {
  const lines = [];
  lines.push("# Dyninstruments Perf Report");
  lines.push("");
  lines.push(`Generated: ${report.generated_at}`);
  lines.push(`Seed: ${report.environment.deterministic_seed}`);
  lines.push(`CPU Slowdown Factor: ${report.environment.cpu_slowdown_factor}`);
  lines.push(`Iterations: warmup=${report.environment.warmup_iterations}, measured=${report.environment.measured_iterations}`);
  lines.push("");
  const startup = report.startup || {
    component_count: report.startup_component_count || 0,
    component_ids: report.startup_component_ids || []
  };
  lines.push("## Startup");
  lines.push("");
  lines.push(`- Component count: ${startup.component_count || 0}`);
  lines.push(`- Component ids: ${(startup.component_ids || []).join(", ") || "(none)"}`);
  lines.push("");
  lines.push("## Cold Activation");
  lines.push("");
  lines.push("| Scenario | Cold Compute p95 (ms) | Cold Wait p95 (ms) | Cold Total p95 (ms) | Shadow CSS URLs p95 | Shadow CSS Preload p95 (ms) |");
  lines.push("|---|---:|---:|---:|---:|---:|");

  for (const scenarioId of report.scenario_order) {
    const scenario = report.scenarios[scenarioId];
    if (!scenario || !scenario.cold_activation) {
      continue;
    }
    const cold = scenario.cold_activation;
    const shadow = cold.shadow_css_preload || {};
    lines.push(
      `| ${scenarioId} | ${cold.compute_ms.p95} | ${cold.wait_ms.p95} | ${cold.total_ms.p95} | ${(shadow.url_count && shadow.url_count.p95) || 0} | ${(shadow.time_ms && shadow.time_ms.p95) || 0} |`
    );
  }

  lines.push("");
  lines.push("## Warm Same-Route Update");
  lines.push("");
  lines.push("| Scenario | Compute p95 (ms) | Wait p95 (ms) | Total p95 (ms) | Wait Ratio p95 | Long Tasks >=50ms |");
  lines.push("|---|---:|---:|---:|---:|---:|");

  for (const scenarioId of report.scenario_order) {
    const scenario = report.scenarios[scenarioId];
    if (!scenario) {
      continue;
    }
    lines.push(
      `| ${scenarioId} | ${scenario.compute_ms.p95} | ${scenario.wait_ms.p95} | ${scenario.total_ms.p95} | ${scenario.wait_ratio.p95} | ${scenario.long_tasks.count_50ms} |`
    );
  }

  lines.push("");
  lines.push("## Hottest Functions");
  lines.push("");
  lines.push("| Scenario | Function | File | Self Share % | Self ms | Total ms |");
  lines.push("|---|---|---|---:|---:|---:|");
  for (const entry of report.hotspot_summary.scenario_hottest) {
    lines.push(`| ${entry.scenario} | ${entry.function_name} | ${entry.file} | ${entry.self_share_pct} | ${entry.self_ms} | ${entry.total_ms} |`);
  }

  return `${lines.join("\n")}\n`;
}

function createComponentResolver(rootDir, runtimeServices) {
  const unitFamiliesPath = require.resolve("../../shared/unit-format-families.js");
  delete require.cache[unitFamiliesPath];
  require(unitFamiliesPath);
  const registry = loadComponentsRegistry(rootDir);
  const byId = new Map();
  for (const [componentId, entry] of Object.entries(registry || {})) {
    const jsPath = entry && typeof entry.js === "string" ? entry.js : "";
    if (!jsPath) {
      continue;
    }
    byId.set(componentId, stripSentinel(jsPath));
  }

  const moduleCache = new Map();

  function getModule(id) {
    if (moduleCache.has(id)) {
      return moduleCache.get(id);
    }
    const relPath = byId.get(id);
    if (!relPath) {
      throw new Error(`Missing component '${id}' in registry`);
    }
    const absPath = path.resolve(rootDir, relPath);
    const resolved = require.resolve(absPath);
    delete require.cache[resolved];
    const loaded = require(resolved);
    moduleCache.set(id, loaded);
    return loaded;
  }

  function createInstance(rootId, def) {
    const instanceCache = new Map();
    const building = new Set();

    function instantiate(componentId) {
      if (instanceCache.has(componentId)) {
        return instanceCache.get(componentId);
      }
      if (building.has(componentId)) {
        throw new Error(`Dependency cycle while creating '${rootId}' at '${componentId}'`);
      }

      const componentDef = registry[componentId];
      if (!componentDef) {
        throw new Error(`Missing component '${componentId}' in registry`);
      }

      const deps = Array.isArray(componentDef.deps) ? componentDef.deps : [];
      building.add(componentId);
      const depInstances = Object.create(null);
      for (const depId of deps) {
        depInstances[depId] = instantiate(depId);
      }

      const componentContext = {
        components: {
          require(depId) {
            if (!Object.prototype.hasOwnProperty.call(depInstances, depId)) {
              throw new Error(`componentContext.components.require: '${componentId}' requested undeclared dependency '${depId}'`);
            }
            return depInstances[depId];
          }
        },
        theme: {
          tokens: {
            resolveForRoot(rootEl) {
              return runtimeServices.theme.tokens.resolveForRoot(rootEl);
            }
          }
        },
        perf: runtimeServices.perf,
        format: runtimeServices.format,
        canvas: runtimeServices.canvas,
        dom: runtimeServices.dom,
        hostActions: runtimeServices.hostActions
      };

      const moduleApi = getModule(componentId);
      const apiShape = componentDef.apiShape || "factory";
      const instance = apiShape === "module" ? moduleApi : moduleApi.create(def, componentContext);
      instanceCache.set(componentId, instance);
      building.delete(componentId);
      return instance;
    }

    return instantiate(rootId);
  }

  return {
    createInstance,
    getComponentPath(componentId) {
      return byId.get(componentId) || null;
    },
    uniqueComponents(list) {
      const result = new Set();

      function addWithDeps(id) {
        if (!registry[id] || result.has(id)) {
          return;
        }
        result.add(id);
        const deps = Array.isArray(registry[id].deps) ? registry[id].deps : [];
        for (let i = 0; i < deps.length; i += 1) {
          addWithDeps(deps[i]);
        }
      }

      const items = Array.isArray(list) ? list : [];
      for (let i = 0; i < items.length; i += 1) {
        const widgetId = items[i] && items[i].widget;
        if (typeof widgetId === "string" && widgetId) {
          addWithDeps(widgetId);
        }
      }

      return Array.from(result);
    }
  };
}

function stripSentinel(filePath) {
  if (filePath.startsWith(SENTINEL_BASE)) {
    return filePath.slice(SENTINEL_BASE.length);
  }
  return filePath;
}

function createDeterministicFetch(rootDir) {
  return function fetchStub(input) {
    const url = typeof input === "string"
      ? input
      : (input && typeof input.url === "string" ? input.url : String(input || ""));
    const relativePath = resolvePerfAssetRelativePath(url);
    const absPath = path.resolve(rootDir, relativePath);
    const status = fs.existsSync(absPath) ? 200 : 404;
    const text = status === 200
      ? fs.readFileSync(absPath, "utf8")
      : "";

    return Promise.resolve({
      ok: status === 200,
      status: status,
      text() {
        return Promise.resolve(text);
      }
    });
  };
}

function resolvePerfAssetRelativePath(url) {
  if (!url) {
    return "";
  }
  if (url.startsWith(SENTINEL_BASE)) {
    return stripSentinel(url);
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/^\/+/, "");
    return pathname;
  }
  catch (error) {
    return String(url).replace(/^\/+/, "");
  }
}

function normalizeShadowCssUrlList(urls) {
  if (!Array.isArray(urls) || !urls.length) {
    return [];
  }
  const result = [];
  const seen = new Set();
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    if (typeof url !== "string" || !url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    result.push(url);
  }
  return result;
}

function createVirtualScheduler() {
  let rafId = 0;
  let timeoutId = 0;
  const rafQueue = [];
  const timeoutQueue = [];

  function requestAnimationFrame(callback) {
    rafId += 1;
    rafQueue.push({ id: rafId, callback });
    return rafId;
  }

  function cancelAnimationFrame(id) {
    for (let i = rafQueue.length - 1; i >= 0; i -= 1) {
      if (rafQueue[i].id === id) {
        rafQueue.splice(i, 1);
      }
    }
  }

  function setTimeoutShim(callback) {
    timeoutId += 1;
    timeoutQueue.push({ id: timeoutId, callback });
    return timeoutId;
  }

  function clearTimeoutShim(id) {
    for (let i = timeoutQueue.length - 1; i >= 0; i -= 1) {
      if (timeoutQueue[i].id === id) {
        timeoutQueue.splice(i, 1);
      }
    }
  }

  function flushAll(maxSteps = 1000) {
    let steps = 0;
    while ((rafQueue.length || timeoutQueue.length) && steps < maxSteps) {
      steps += 1;
      if (rafQueue.length) {
        const task = rafQueue.shift();
        task.callback();
        continue;
      }
      const timerTask = timeoutQueue.shift();
      timerTask.callback();
    }
  }

  class MutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.active = false;
    }

    observe() {
      this.active = true;
    }

    disconnect() {
      this.active = false;
    }
  }

  class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.active = false;
    }

    observe() {
      this.active = true;
    }

    disconnect() {
      this.active = false;
    }
  }

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout: setTimeoutShim,
    clearTimeout: clearTimeoutShim,
    MutationObserver,
    ResizeObserver,
    flushAll
  };
}

function patchCanvasPrototypes(windowObject) {
  const { createMockContext2D } = require(path.resolve(process.cwd(), "tests/helpers/mock-canvas.js"));

  const contextByCanvas = new WeakMap();
  const proto = windowObject.HTMLCanvasElement && windowObject.HTMLCanvasElement.prototype;
  if (!proto) {
    return;
  }

  proto.getContext = function getContext(type) {
    if (type !== "2d") {
      return null;
    }
    if (!contextByCanvas.has(this)) {
      contextByCanvas.set(this, createMockContext2D());
    }
    return contextByCanvas.get(this);
  };

  proto.getBoundingClientRect = function getBoundingClientRect() {
    const rect = resolveElementRect(this);
    return {
      width: rect.width,
      height: rect.height,
      top: 0,
      left: 0,
      right: rect.width,
      bottom: rect.height
    };
  };

  if (!Object.getOwnPropertyDescriptor(proto, "clientWidth")) {
    Object.defineProperty(proto, "clientWidth", {
      configurable: true,
      get() {
        return resolveElementRect(this).width;
      }
    });
  }

  if (!Object.getOwnPropertyDescriptor(proto, "clientHeight")) {
    Object.defineProperty(proto, "clientHeight", {
      configurable: true,
      get() {
        return resolveElementRect(this).height;
      }
    });
  }
}

function setElementRect(element, width, height) {
  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || 1));
  element.__dyniRect = { width: w, height: h };
  element.getBoundingClientRect = function getBoundingClientRect() {
    return {
      width: w,
      height: h,
      top: 0,
      left: 0,
      right: w,
      bottom: h
    };
  };

  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    get() {
      return w;
    }
  });

  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    get() {
      return h;
    }
  });
}

function resolveElementRect(element) {
  if (element && element.__dyniRect) {
    return element.__dyniRect;
  }
  if (element && element.parentElement && element.parentElement.__dyniRect) {
    return element.parentElement.__dyniRect;
  }
  return { width: 320, height: 180 };
}

function readLayoutFixture(rootDir) {
  const fixturePath = path.join(rootDir, "tests/layouts/gpspage-all-widgets.json");
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function resolveSlotSize(slotName, weight) {
  const w = Number(weight) || 1;
  if (slotName === "left") {
    return { width: Math.round(250 * w), height: 180 };
  }
  if (slotName === "left_anchor") {
    return { width: Math.round(240 * w), height: 140 };
  }
  return { width: Math.round(260 * w), height: 180 };
}

function buildRawProps(cluster, kind, iteration, subStep, rng) {
  const tick = (iteration * 17) + (subStep * 11);
  const angle = (tick * 7) % 360;
  const speed = 2 + (rng() * 18);
  const depth = 3 + (rng() * 45);
  const temperature = 8 + (rng() * 18);
  const voltage = 11 + (rng() * 2.5);
  const distance = 120 + (rng() * 3600);
  const nowIso = new Date(Date.UTC(2026, 0, 1, 0, 0, 0) + (tick * 60000)).toISOString();

  const props = {
    cluster,
    kind,
    default: "---",
    editing: false,
    dyniLayoutEditing: false,
    className: "dyniplugin",
    leadingZero: true,

    hdt: angle,
    hdm: (angle + 3) % 360,
    cog: (angle + 5) % 360,
    brg: (angle + 21) % 360,

    sog: speed,
    stw: speed * 0.92,
    speedRadialRatioThresholdNormal: 1.1,
    speedRadialRatioThresholdFlat: 3.5,
    speedRadialMinValue: 0,
    speedRadialMaxValue: 35,
    speedRadialTickMajor: 5,
    speedRadialTickMinor: 1,
    speedRadialShowEndLabels: false,
    speedRadialWarningEnabled: true,
    speedRadialAlarmEnabled: true,
    speedRadialWarningFrom: 22,
    speedRadialAlarmFrom: 29,
    speedLinearRatioThresholdNormal: 1.1,
    speedLinearRatioThresholdFlat: 3.5,
    speedLinearMinValue: 0,
    speedLinearMaxValue: 35,
    speedLinearTickMajor: 5,
    speedLinearTickMinor: 1,
    speedLinearShowEndLabels: false,
    speedLinearWarningEnabled: true,
    speedLinearAlarmEnabled: true,
    speedLinearWarningFrom: 22,
    speedLinearAlarmFrom: 29,

    depth,
    depthRadialRatioThresholdNormal: 1.1,
    depthRadialRatioThresholdFlat: 3.5,
    depthLinearRatioThresholdNormal: 1.1,
    depthLinearRatioThresholdFlat: 3.5,

    temp: temperature,
    tempRadialRatioThresholdNormal: 1.1,
    tempRadialRatioThresholdFlat: 3.5,
    tempLinearRatioThresholdNormal: 1.1,
    tempLinearRatioThresholdFlat: 3.5,

    awa: ((tick * 9) % 360) - 180,
    twa: ((tick * 11) % 360) - 180,
    twd: (tick * 13) % 360,
    aws: speed * 1.15,
    tws: speed,
    windRadialRatioThresholdNormal: 0.7,
    windRadialRatioThresholdFlat: 2.0,
    windRadialLayEnabled: true,
    windRadialLayMin: 25,
    windRadialLayMax: 45,
    windLinearRatioThresholdNormal: 0.9,
    windLinearRatioThresholdFlat: 3.0,
    windLinearLayEnabled: true,
    windLinearLayMin: 25,
    windLinearLayMax: 45,

    eta: nowIso,
    rteEta: nowIso,
    dst: distance / 1852,
    rteDistance: (distance * 1.4) / 1852,
    vmg: speed * 0.8,
    xte: (rng() - 0.5) * 2,
    dtw: distance / 1852,
    btw: (angle + 15) % 360,
    wpName: `WP-${(tick % 24) + 1}`,
    wpServer: true,
    activeRouteName: `Route-${(tick % 6) + 1}`,
    activeRouteRemain: (distance * 1.6) / 1852,
    activeRouteEta: nowIso,
    activeRouteNextCourse: (angle + 35) % 360,
    activeRouteApproaching: tick % 6 === 0,
    xteRatioThresholdNormal: 0.85,
    xteRatioThresholdFlat: 2.3,
    activeRouteRatioThresholdNormal: 1.2,
    activeRouteRatioThresholdFlat: 3.8,
    showWpNameXteDisplay: true,

    zoom: 11 + (rng() * 3),
    requiredZoom: 11 + (rng() * 3) + ((tick % 3 === 0) ? 0.4 : 0),
    centerCourse: (angle + 45) % 360,
    centerDistance: distance / 1852,
    centerMarkerCourse: (angle + 60) % 360,
    centerMarkerDistance: (distance * 0.8) / 1852,
    centerPosition: [10.2 + (rng() * 0.6), 54.0 + (rng() * 0.4)],
    activeMeasure: {
      getPointAtIndex(index) {
        return index === 0 ? [10.15, 54.05] : undefined;
      }
    },
    measureRhumbLine: tick % 2 === 0,
    lockPosition: false,
    centerDisplayRatioThresholdNormal: 1.1,
    centerDisplayRatioThresholdFlat: 2.4,

    distance: distance,
    watch: distance / 2,
    bearing: (angle + 80) % 360,

    value: voltage,
    clock: nowIso,
    gpsValid: true,
    pitch: (rng() - 0.5) * 0.2,
    roll: (rng() - 0.5) * 0.3,

    ratioThresholdNormal: 1.0,
    ratioThresholdFlat: 3.0,
    captionUnitScale: 0.8
  };

  applyCaptionUnitDefaults(props);

  props.caption = props[`caption_${kind}`] || CAPTION_BY_KEY[kind] || kind;
  props.unit = props[`unit_${kind}`] || UNIT_BY_KEY[kind] || "";

  return props;
}

function applyCaptionUnitDefaults(target) {
  Object.keys(CAPTION_BY_KEY).forEach((key) => {
    target[`caption_${key}`] = CAPTION_BY_KEY[key];
  });
  Object.keys(UNIT_BY_KEY).forEach((key) => {
    target[`unit_${key}`] = UNIT_BY_KEY[key];
  });
}

function createRng(seed) {
  let state = (Number(seed) || 0) >>> 0;
  return function next() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildScenarioSeed(baseSeed, scenarioId) {
  let hash = Number(baseSeed) >>> 0;
  for (let i = 0; i < scenarioId.length; i += 1) {
    hash = Math.imul(hash ^ scenarioId.charCodeAt(i), 16777619) >>> 0;
  }
  return hash >>> 0;
}

async function captureCpuProfile(fn) {
  const session = new inspector.Session();
  session.connect();

  const post = (method, params = {}) =>
    new Promise((resolve, reject) => {
      session.post(method, params, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result || {});
      });
    });

  try {
    await post("Profiler.enable");
    await post("Profiler.start");
    await Promise.resolve(fn());
    const result = await post("Profiler.stop");
    await post("Profiler.disable");
    return result.profile || null;
  }
  finally {
    session.disconnect();
  }
}

function runIifeScript(rootDir, relPath) {
  const absPath = path.join(rootDir, relPath);
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInThisContext(source, { filename: absPath });
}

function createAvnavStub() {
  return {
    api: {
      formatter: createFormatterApi(),
      registerWidget() {},
      log() {}
    }
  };
}

function createFormatterApi() {
  return {
    formatSpeed(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num.toFixed(1) : "---";
    },
    formatDistance(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num.toFixed(2) : "---";
    },
    formatDirection360(value, leadingZero) {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        return "---";
      }
      const normalized = ((Math.round(num) % 360) + 360) % 360;
      return leadingZero ? String(normalized).padStart(3, "0") : String(normalized);
    },
    formatDirection(value) {
      const num = Number(value);
      return Number.isFinite(num) ? String(Math.round(num)) : "---";
    },
    formatTime(value) {
      if (!value) {
        return "---";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "---";
      }
      return date.toISOString().slice(11, 16);
    },
    formatDate(value) {
      if (!value) {
        return "---";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "---";
      }
      return date.toISOString().slice(0, 10);
    },
    formatDecimal(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num.toFixed(1) : "---";
    },
    formatDecimalOpt(value, digits = 2) {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        return "---";
      }
      return num.toFixed(Number(digits) || 2);
    },
    formatTemperature(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num.toFixed(1) : "---";
    },
    formatLonLats(value) {
      if (Array.isArray(value) && value.length >= 2) {
        return `${Number(value[1]).toFixed(4)}, ${Number(value[0]).toFixed(4)}`;
      }
      if (value && typeof value === "object") {
        return `${Number(value.lat).toFixed(4)}, ${Number(value.lon).toFixed(4)}`;
      }
      return "---";
    },
    formatLonLatsDecimal(value, axis) {
      const normalized = Array.isArray(value)
        ? { lon: Number(value[0]), lat: Number(value[1]) }
        : value;
      const target = axis === "lat" ? normalized && normalized.lat : normalized && normalized.lon;
      return Number.isFinite(Number(target)) ? Number(target).toFixed(4) : "---";
    }
  };
}

function createHostActions() {
  return {
    getCapabilities() {
      return {
        map: {
          checkAutoZoom: "dispatch"
        }
      };
    },
    map: {
      checkAutoZoom() {
        return true;
      }
    }
  };
}

function captureGlobals() {
  return {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    MutationObserver: globalThis.MutationObserver,
    ResizeObserver: globalThis.ResizeObserver,
    avnav: globalThis.avnav,
    perfHooks: globalThis.__DYNI_PERF_HOOKS__,
    dyniComponents: globalThis.DyniComponents
  };
}

function restoreGlobals(saved) {
  globalThis.window = saved.window;
  globalThis.document = saved.document;
  globalThis.getComputedStyle = saved.getComputedStyle;
  globalThis.requestAnimationFrame = saved.requestAnimationFrame;
  globalThis.cancelAnimationFrame = saved.cancelAnimationFrame;
  globalThis.setTimeout = saved.setTimeout;
  globalThis.clearTimeout = saved.clearTimeout;
  globalThis.MutationObserver = saved.MutationObserver;
  globalThis.ResizeObserver = saved.ResizeObserver;
  globalThis.avnav = saved.avnav;
  globalThis.__DYNI_PERF_HOOKS__ = saved.perfHooks;
  globalThis.DyniComponents = saved.dyniComponents;
}
