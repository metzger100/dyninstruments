/**
 * @param {{ kind: unknown, cluster: unknown, toolkit?: unknown, routeId?: unknown, viewModel?: unknown }} options
 * @returns {{ routeId: unknown, cluster: unknown, kind: unknown, toolkit: unknown, viewModel?: unknown }}
 */
function makeRouteContext(options) {
  const kind = options.kind;
  const cluster = options.cluster;
  const routeContext =
    /** @type {{ routeId: unknown, cluster: unknown, kind: unknown, toolkit: unknown, viewModel?: unknown }} */ ({
      routeId: Object.prototype.hasOwnProperty.call(options, "routeId") ? options.routeId : cluster + ":" + kind,
      cluster: cluster,
      kind: kind,
      toolkit: options.toolkit
    });

  if (Object.prototype.hasOwnProperty.call(options, "viewModel")) {
    routeContext.viewModel = options.viewModel;
  }

  return routeContext;
}

module.exports = {
  makeRouteContext
};
