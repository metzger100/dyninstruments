/**
 * Module: ClusterKindCatalog - Thin adapter over config.clusterRoutes metadata
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: config/cluster-routes/finalize.js
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterKindCatalog = factory(); }
}(this, function () {
  "use strict";

  var SUPPORTED_SURFACES = {
    html: true,
    "canvas-dom": true
  };

  function ensureNonEmptyString(value, fieldName) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("ClusterKindCatalog: entry." + fieldName + " must be a non-empty string");
    }
  }

  function resolveRoutesConfig() {
    var globalRoot = (typeof globalThis !== "undefined")
      ? globalThis
      : (typeof self !== "undefined" ? self : {});
    var ns = globalRoot.DyniPlugin;
    var config = ns && ns.config;
    var clusterRoutes = config && config.clusterRoutes;

    if (!clusterRoutes || !Array.isArray(clusterRoutes.routes)) {
      throw new Error("ClusterKindCatalog: config.clusterRoutes.routes must be an array");
    }

    return clusterRoutes.routes;
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") {
      throw new Error("ClusterKindCatalog: each entry must be an object");
    }

    ensureNonEmptyString(entry.cluster, "cluster");
    ensureNonEmptyString(entry.kind, "kind");
    ensureNonEmptyString(entry.rendererId, "rendererId");
    ensureNonEmptyString(entry.surface, "surface");

    if (typeof entry.viewModelId !== "undefined") {
      ensureNonEmptyString(entry.viewModelId, "viewModelId");
    }

    if (!SUPPORTED_SURFACES[entry.surface]) {
      throw new Error("ClusterKindCatalog: unsupported surface '" + entry.surface + "' for " + entry.cluster + "/" + entry.kind);
    }

    var normalized = {
      cluster: entry.cluster,
      kind: entry.kind,
      rendererId: entry.rendererId,
      surface: entry.surface
    };

    if (typeof entry.viewModelId !== "undefined") {
      normalized.viewModelId = entry.viewModelId;
    }

    return normalized;
  }

  function createCatalogFromClusterRoutes() {
    var sourceEntries = resolveRoutesConfig();
    var byKey = Object.create(null);
    var list = [];

    for (var i = 0; i < sourceEntries.length; i += 1) {
      var normalized = normalizeEntry(sourceEntries[i]);
      var routeKey = normalized.cluster + "::" + normalized.kind;
      if (byKey[routeKey]) {
        throw new Error("ClusterKindCatalog: duplicate entry for cluster '" + normalized.cluster + "' kind '" + normalized.kind + "'");
      }
      var frozenEntry = Object.freeze(normalized);
      byKey[routeKey] = frozenEntry;
      list.push(frozenEntry);
    }

    function resolveRoute(cluster, kind) {
      ensureNonEmptyString(cluster, "cluster");
      ensureNonEmptyString(kind, "kind");

      var route = byKey[cluster + "::" + kind];
      if (!route) {
        throw new Error("ClusterKindCatalog: missing catalog entry for cluster '" + cluster + "' kind '" + kind + "'");
      }
      return route;
    }

    function listRoutes() {
      return list.slice();
    }

    return {
      resolveRoute: resolveRoute,
      listRoutes: listRoutes
    };
  }

  function create() {
    return {
      id: "ClusterKindCatalog",
      createDefaultCatalog: createCatalogFromClusterRoutes
    };
  }

  return { id: "ClusterKindCatalog", create: create };
}));
