/**
 * @file DyniPlugin Surface Runtime Index - Runtime-owned surface policy and controller infrastructure
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);

  if (typeof runtime._createClusterSurfacePolicy !== "function") {
    throw new Error("dyninstruments: runtime._createClusterSurfacePolicy missing before runtime/surface/index.js load");
  }
  if (typeof runtime._createCanvasDomSurfaceAdapter !== "function") {
    throw new Error("dyninstruments: runtime._createCanvasDomSurfaceAdapter missing before runtime/surface/index.js load");
  }
  if (typeof runtime._createHtmlSurfaceController !== "function") {
    throw new Error("dyninstruments: runtime._createHtmlSurfaceController missing before runtime/surface/index.js load");
  }

  const policy = /** @type {DyniSurfacePolicy} */ (runtime._createClusterSurfacePolicy());
  const canvasDom = /** @type {DyniSurfaceControllerFactory} */ (runtime._createCanvasDomSurfaceAdapter());
  const html = /** @type {DyniSurfaceControllerFactory} */ (runtime._createHtmlSurfaceController());

  /** @param {DyniSurfaceControllerOptions|null|undefined} options @returns {unknown} */
  function createController(options) {
    const opts = /** @type {DyniSurfaceControllerOptions} */ (options || {});
    const surface = opts.surface;
    if (surface === "canvas-dom") {
      return canvasDom.createSurfaceController(opts);
    }
    if (surface === "html") {
      return html.createSurfaceController(opts);
    }
    throw new Error("runtime.surfaces.createController: unsupported surface '" + String(surface) + "'");
  }

  /**
   * @param {DyniSurfaceControllerOptions|null|undefined} options
   * @returns {Record<string, unknown>}
   */
  function materializeSurfacePolicyProps(options) {
    const opts = /** @type {DyniSurfaceControllerOptions} */ (options || {});
    const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;
    const rendererId = typeof opts.rendererId === "string" ? opts.rendererId : "";
    const props = opts.props;
    if (!props || typeof props !== "object") {
      throw new Error("runtime.surfaces.materializeSurfacePolicyProps: props object is required");
    }

    const routeState = /** @type {DyniSurfacePolicyRouteState} */ ({
      route: {
        rendererId: rendererId
      },
      props: /** @type {Record<string, unknown>} */ (props)
    });

    return policy.resolveRouteStateWithPolicy(routeState, hostContext).props;
  }

  /** @returns {string} */
  function getCommonShadowCssUrl() {
    if (typeof ns.baseUrl !== "string" || !ns.baseUrl) {
      throw new Error("runtime.surfaces.getCommonShadowCssUrl: baseUrl is required");
    }
    return ns.baseUrl + "shared/html/HtmlShadowCommon.css";
  }

  runtime.surfaces = /** @type {DyniSurfaceRuntimeApi} */ (Object.freeze({
    createController: createController,
    materializeSurfacePolicyProps: materializeSurfacePolicyProps,
    getCommonShadowCssUrl: getCommonShadowCssUrl
  }));
}(this));
