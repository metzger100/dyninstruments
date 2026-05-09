function makeRouteContext(options) {
  const kind = options.kind;
  const cluster = options.cluster;
  const routeContext = {
    routeId: Object.prototype.hasOwnProperty.call(options, "routeId") ? options.routeId : cluster + ":" + kind,
    cluster: cluster,
    kind: kind,
    toolkit: options.toolkit
  };

  if (Object.prototype.hasOwnProperty.call(options, "viewModel")) {
    routeContext.viewModel = options.viewModel;
  }

  return routeContext;
}

module.exports = {
  makeRouteContext
};
