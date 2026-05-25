const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/SurfaceSessionController.js", function () {
  function getCommonShadowCssUrl() {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/surface/ClusterSurfacePolicy.js", context);
    runIifeScript("runtime/surface/CanvasDomSurfaceAdapter.js", context);
    runIifeScript("runtime/surface/HtmlSurfaceController.js", context);
    runIifeScript("runtime/surface/index.js", context);
    return context.DyniPlugin.runtime.surfaces.getCommonShadowCssUrl();
  }

  function loadFactory(overrides) {
    const context = createScriptContext({
      ...(overrides || {}),
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/PerfSpanHelper.js", context);
    runIifeScript("runtime/SurfaceSessionController.js", context);
    return context.DyniPlugin.runtime.createSurfaceSessionController;
  }

  function createControllerMock(id) {
    return {
      id: id,
      attach: vi.fn(),
      update: vi.fn(),
      detach: vi.fn(),
      destroy: vi.fn()
    };
  }

  function createSurfacesMock(controllers) {
    const bySurface = controllers || {
      html: createControllerMock("html"),
      "canvas-dom": createControllerMock("canvas-dom")
    };

    return {
      createController: vi.fn(function (options) {
        const controller = bySurface[options.surface];
        if (!controller) {
          throw new Error("unexpected surface: " + options.surface);
        }
        return controller;
      }),
      controllers: bySurface
    };
  }

  function createPayload(overrides) {
    const opts = overrides || {};
    const surface = Object.prototype.hasOwnProperty.call(opts, "surface") ? opts.surface : "html";
    const routeId = Object.prototype.hasOwnProperty.call(opts, "routeId") ? opts.routeId : "nav/activeRoute";
    const rendererId = Object.prototype.hasOwnProperty.call(opts, "rendererId") ? opts.rendererId : "ActiveRouteTextHtmlWidget";
    const rootEl = Object.prototype.hasOwnProperty.call(opts, "rootEl") ? opts.rootEl : { id: "root-" + String(routeId) };
    const shellEl = Object.prototype.hasOwnProperty.call(opts, "shellEl") ? opts.shellEl : { id: "shell-" + String(routeId) };
    const revision = Object.prototype.hasOwnProperty.call(opts, "revision") ? opts.revision : 1;
    const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : { id: "host-context" };
    const props = Object.prototype.hasOwnProperty.call(opts, "props") ? opts.props : { routeId: routeId };
    const rendererSpec = Object.prototype.hasOwnProperty.call(opts, "rendererSpec")
      ? opts.rendererSpec
      : { id: rendererId, createCommittedRenderer: vi.fn() };
    const shadowCssUrls = Object.prototype.hasOwnProperty.call(opts, "shadowCssUrls") ? opts.shadowCssUrls : [];

    return {
      routeId: routeId,
      rendererId: rendererId,
      surface: surface,
      rootEl: rootEl,
      shellEl: shellEl,
      hostContext: hostContext,
      props: props,
      revision: revision,
      rendererSpec: rendererSpec,
      shadowCssUrls: shadowCssUrls
    };
  }

  it("throws for unsupported surfaces and invalid service/controller contracts", function () {
    const createSurfaceSessionController = loadFactory();

    expect(function () {
      createSurfaceSessionController({});
    }).toThrow("surfaces service must be an object");

    const invalidControllerSession = createSurfaceSessionController({
      surfaces: {
        createController: function () {
          return {
            attach: vi.fn(),
            update: vi.fn(),
            detach: vi.fn()
          };
        }
      }
    });

    expect(function () {
      invalidControllerSession.reconcileSession(createPayload());
    }).toThrow("must implement destroy()");

    const strictSurfaceSession = createSurfaceSessionController({
      surfaces: {
        createController: function () {
          return createControllerMock("x");
        }
      }
    });

    expect(function () {
      strictSurfaceSession.reconcileSession(createPayload({
        surface: "legacy-html",
        routeId: "legacy/html",
        rendererId: "LegacyHtmlWidget",
        rendererSpec: { id: "LegacyHtmlWidget", createCommittedRenderer: vi.fn() }
      }));
    }).toThrow("unsupported surface");
  });

  it("requires route identity and renderer metadata on activated payloads", function () {
    const createSurfaceSessionController = loadFactory();
    const surfaces = createSurfacesMock();
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });

    expect(function () {
      session.reconcileSession(createPayload({
        routeId: "",
        rendererId: "ActiveRouteTextHtmlWidget"
      }));
    }).toThrow("requires routeId");

    expect(function () {
      session.reconcileSession(createPayload({
        routeId: "nav/activeRoute",
        rendererId: "",
        rendererSpec: { id: "ActiveRouteTextHtmlWidget", createCommittedRenderer: vi.fn() }
      }));
    }).toThrow("requires rendererId");

    expect(function () {
      session.reconcileSession(createPayload({
        routeId: "nav/activeRoute",
        rendererId: "ActiveRouteTextHtmlWidget",
        rendererSpec: null
      }));
    }).toThrow("requires rendererSpec");
  });
});
