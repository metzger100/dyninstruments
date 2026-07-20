/**
 * @file DyniPlugin Cluster Routes Finalize - Derives routeId and byRouteId index
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  var clusterRoutes = root.DyniPlugin.config.clusterRoutes;
  var routes = clusterRoutes && Array.isArray(clusterRoutes.routes) ? clusterRoutes.routes : [];
  var byRouteId = Object.create(null);

  for (var i = 0; i < routes.length; i += 1) {
    var route = routes[i];
    route.routeId = route.cluster + "/" + route.kind;
    byRouteId[route.routeId] = route;
  }

  clusterRoutes.byRouteId = byRouteId;
})(this);
