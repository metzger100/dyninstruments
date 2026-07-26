const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

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

// @ts-ignore -- pre-existing untyped test mock boundary
function loadFactory(overrides) {
  const context = createScriptContext({
    ...(overrides || {}),
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });

  runIifeScript("runtime/SurfaceSessionController.js", context);
  return context.DyniPlugin.runtime.createSurfaceSessionController;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createControllerMock(id) {
  return {
    id: id,
    attach: vi.fn(),
    update: vi.fn(),
    detach: vi.fn(),
    destroy: vi.fn()
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
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

// @ts-ignore -- pre-existing untyped test mock boundary
function createPayload(overrides) {
  const opts = overrides || {};
  const surface = Object.prototype.hasOwnProperty.call(opts, "surface") ? opts.surface : "html";
  const routeId = Object.prototype.hasOwnProperty.call(opts, "routeId") ? opts.routeId : "nav/activeRoute";
  const rendererId = Object.prototype.hasOwnProperty.call(opts, "rendererId")
    ? opts.rendererId
    : "ActiveRouteTextHtmlWidget";
  const rootEl = Object.prototype.hasOwnProperty.call(opts, "rootEl") ? opts.rootEl : { id: "root-" + String(routeId) };
  const shellEl = Object.prototype.hasOwnProperty.call(opts, "shellEl")
    ? opts.shellEl
    : { id: "shell-" + String(routeId) };
  const revision = Object.prototype.hasOwnProperty.call(opts, "revision") ? opts.revision : 1;
  const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext")
    ? opts.hostContext
    : { id: "host-context" };
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

module.exports = {
  createControllerMock,
  createPayload,
  createScriptContext,
  createSurfacesMock,
  getCommonShadowCssUrl,
  loadFactory,
  runIifeScript
};
