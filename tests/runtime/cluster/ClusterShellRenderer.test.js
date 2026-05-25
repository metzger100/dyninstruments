const {
  createScriptContext,
  runIifeScript,
} = require("../../helpers/eval-iife");

describe("ClusterShellRenderer", function () {
  const ORIGINAL_DYNI_PLUGIN = globalThis.DyniPlugin;

  function loadShellRenderer(clusterRoutes) {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {
          surfaces: {
            createController: vi.fn(),
          },
        },
        config: {
          clusterRoutes: clusterRoutes,
        },
      },
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/cluster/ClusterShellRenderer.js", context);
    return {
      context: context,
      shellRenderer: context.DyniPlugin.runtime.clusterShellRenderer,
    };
  }

  afterEach(function () {
    if (typeof ORIGINAL_DYNI_PLUGIN === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = ORIGINAL_DYNI_PLUGIN;
    }
  });

  it("normalizes route frames without touching renderers or surfaces", function () {
    const harness = loadShellRenderer({
      byRouteId: {
        "speed/sog": {
          cluster: "speed",
          kind: "sog",
          rendererId: "SpeedRadialWidget",
          surface: "canvas-dom",
          shellSizing: { kind: "ratio", aspectRatio: 2 },
        },
      },
    });
    const rawProps = { kind: "sog", mode: "vertical", editing: false };

    const routeFrame = harness.shellRenderer.normalizeRouteFrame(
      rawProps,
      { cluster: "speed" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );

    expect(routeFrame).toEqual({
      kind: "sog",
      mode: "vertical",
      editing: false,
      cluster: "speed",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: rawProps,
    });
    expect(Object.keys(routeFrame)).toEqual([
      "kind",
      "mode",
      "editing",
      "cluster",
      "__dyniRouteId",
      "__dyniRawProps",
    ]);
    expect(
      harness.context.DyniPlugin.runtime.surfaces.createController,
    ).not.toHaveBeenCalled();
  });

  it("renders canvas and html shells with stable mount markup and vertical shell sizing only", function () {
    const harness = loadShellRenderer({
      byRouteId: {
        "speed/sog": {
          cluster: "speed",
          kind: "sog",
          rendererId: "SpeedRadialWidget",
          surface: "canvas-dom",
          shellSizing: { kind: "ratio", aspectRatio: 2 },
        },
        "nav/activeRoute": {
          cluster: "nav",
          kind: "activeRoute",
          rendererId: "ActiveRouteTextHtmlWidget",
          surface: "html",
          shellSizing: { kind: "ratio", aspectRatio: 2 },
        },
        "nav/routePoints": {
          cluster: "nav",
          kind: "routePoints",
          rendererId: "RoutePointsTextHtmlWidget",
          surface: "html",
          shellSizing: { kind: "natural" },
        },
      },
    });

    const canvasFrame = harness.shellRenderer.normalizeRouteFrame(
      { kind: "sog", mode: "vertical" },
      { cluster: "speed" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );
    const canvasHtml = harness.shellRenderer.renderRouteShell(
      canvasFrame,
      harness.context.DyniPlugin.config.clusterRoutes.byRouteId["speed/sog"],
      "dyni-host-42",
      { __dyniHostCommitState: { instanceId: "dyni-host-42" } },
    );

    const htmlFrame = harness.shellRenderer.normalizeRouteFrame(
      { cluster: "nav", kind: "activeRoute", mode: "vertical" },
      { cluster: "nav" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );
    const htmlHtml = harness.shellRenderer.renderRouteShell(
      htmlFrame,
      harness.context.DyniPlugin.config.clusterRoutes.byRouteId[
        "nav/activeRoute"
      ],
      "dyni-host-42",
      { __dyniHostCommitState: { instanceId: "dyni-host-42" } },
    );

    const naturalFrame = harness.shellRenderer.normalizeRouteFrame(
      { cluster: "nav", kind: "routePoints", mode: "vertical" },
      { cluster: "nav" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );
    const naturalHtml = harness.shellRenderer.renderRouteShell(
      naturalFrame,
      harness.context.DyniPlugin.config.clusterRoutes.byRouteId[
        "nav/routePoints"
      ],
      "dyni-host-42",
      { __dyniHostCommitState: { instanceId: "dyni-host-42" } },
    );

    expect(canvasHtml).toContain(
      'class="widgetData dyni-shell dyni-surface-canvas dyni-kind-sog dyni-cluster-speed"',
    );
    expect(canvasHtml).toContain('data-dyni-instance="dyni-host-42"');
    expect(canvasHtml).toContain('data-dyni-route="speed/sog"');
    expect(canvasHtml).toContain('data-dyni-surface="canvas-dom"');
    expect(canvasHtml).toContain('style="aspect-ratio:2;"');
    expect(canvasHtml).toContain(
      '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>',
    );

    expect(htmlHtml).toContain(
      'class="widgetData dyni-shell dyni-surface-html dyni-kind-activeRoute dyni-cluster-nav"',
    );
    expect(htmlHtml).toContain('data-dyni-route="nav/activeRoute"');
    expect(htmlHtml).toContain('data-dyni-surface="html"');
    expect(htmlHtml).toContain('style="aspect-ratio:2;"');
    expect(htmlHtml).toContain(
      '<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>',
    );

    expect(naturalHtml).toContain(
      'class="widgetData dyni-shell dyni-surface-html dyni-kind-routePoints dyni-cluster-nav"',
    );
    expect(naturalHtml).toContain('data-dyni-route="nav/routePoints"');
    expect(naturalHtml).not.toContain("style=");
  });

  it("keeps ratio shell sizing inline-free when mode is not vertical or absent", function () {
    const harness = loadShellRenderer({
      byRouteId: {
        "speed/sog": {
          cluster: "speed",
          kind: "sog",
          rendererId: "SpeedRadialWidget",
          surface: "canvas-dom",
          shellSizing: { kind: "ratio", aspectRatio: 2 },
        },
      },
    });
    const routeMeta =
      harness.context.DyniPlugin.config.clusterRoutes.byRouteId["speed/sog"];

    const horizontalFrame = harness.shellRenderer.normalizeRouteFrame(
      { kind: "sog", mode: "horizontal" },
      { cluster: "speed" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );
    const horizontalHtml = harness.shellRenderer.renderRouteShell(
      horizontalFrame,
      routeMeta,
      "dyni-host-42",
      {
        __dyniHostCommitState: { instanceId: "dyni-host-42" },
      },
    );

    const absentModeFrame = harness.shellRenderer.normalizeRouteFrame(
      { kind: "sog" },
      { cluster: "speed" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );
    const absentModeHtml = harness.shellRenderer.renderRouteShell(
      absentModeFrame,
      routeMeta,
      "dyni-host-42",
      {
        __dyniHostCommitState: { instanceId: "dyni-host-42" },
      },
    );

    expect(horizontalHtml).toContain(
      'class="widgetData dyni-shell dyni-surface-canvas dyni-kind-sog dyni-cluster-speed"',
    );
    expect(horizontalHtml).toContain('data-dyni-route="speed/sog"');
    expect(horizontalHtml).toContain('data-dyni-surface="canvas-dom"');
    expect(horizontalHtml).toContain(
      '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>',
    );
    expect(horizontalHtml).not.toContain("style=");
    expect(horizontalHtml).not.toContain("aspect-ratio");
    expect(horizontalHtml).not.toContain("height=");

    expect(absentModeHtml).toContain(
      'class="widgetData dyni-shell dyni-surface-canvas dyni-kind-sog dyni-cluster-speed"',
    );
    expect(absentModeHtml).toContain('data-dyni-route="speed/sog"');
    expect(absentModeHtml).toContain('data-dyni-surface="canvas-dom"');
    expect(absentModeHtml).toContain(
      '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>',
    );
    expect(absentModeHtml).not.toContain("style=");
    expect(absentModeHtml).not.toContain("aspect-ratio");
    expect(absentModeHtml).not.toContain("height=");

    expect(
      harness.context.DyniPlugin.runtime.surfaces.createController,
    ).not.toHaveBeenCalled();
  });

  it("returns a diagnostic shell for unknown routes without inline sizing", function () {
    const harness = loadShellRenderer({
      byRouteId: {},
    });
    const routeFrame = harness.shellRenderer.normalizeRouteFrame(
      { cluster: "nav", kind: "missing" },
      { cluster: "nav" },
      harness.context.DyniPlugin.config.clusterRoutes,
    );
    const html = harness.shellRenderer.renderRouteShell(
      routeFrame,
      null,
      "dyni-host-42",
      {
        __dyniHostCommitState: { instanceId: "dyni-host-42" },
      },
    );

    expect(html).toContain("dyni-shell-unknown");
    expect(html).toContain("dyni-kind-missing");
    expect(html).toContain('data-dyni-route="nav/missing"');
    expect(html).toContain('data-dyni-surface="unknown"');
    expect(html).toContain('data-dyni-shell-mount="1"');
    expect(html).not.toContain("style=");
  });
});
