/**
 * Module: DyniPlugin Surface Runtime Index - Runtime-owned surface policy and controller infrastructure
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: runtime/surface/ClusterSurfacePolicy.js, runtime/surface/CanvasDomSurfaceAdapter.js, runtime/surface/HtmlSurfaceController.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  if (typeof runtime._createClusterSurfacePolicy !== "function") {
    throw new Error("dyninstruments: runtime._createClusterSurfacePolicy missing before runtime/surface/index.js load");
  }
  if (typeof runtime._createCanvasDomSurfaceAdapter !== "function") {
    throw new Error("dyninstruments: runtime._createCanvasDomSurfaceAdapter missing before runtime/surface/index.js load");
  }
  if (typeof runtime._createHtmlSurfaceController !== "function") {
    throw new Error("dyninstruments: runtime._createHtmlSurfaceController missing before runtime/surface/index.js load");
  }

  const policy = runtime._createClusterSurfacePolicy();
  const canvasDom = runtime._createCanvasDomSurfaceAdapter();
  const html = runtime._createHtmlSurfaceController();

  function createController(options) {
    const opts = options || {};
    const surface = opts.surface;
    if (surface === "canvas-dom") {
      return canvasDom.createSurfaceController(opts);
    }
    if (surface === "html") {
      return html.createSurfaceController(opts);
    }
    throw new Error("runtime.surfaces.createController: unsupported surface '" + String(surface) + "'");
  }

  runtime.surfaces = Object.freeze({
    policy: policy,
    canvasDom: canvasDom,
    html: html,
    createController: createController
  });
}(this));
