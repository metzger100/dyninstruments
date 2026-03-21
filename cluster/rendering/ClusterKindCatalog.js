/**
 * Module: ClusterKindCatalog - Strict cluster+kind to renderer/surface catalog for router ownership
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterKindCatalog = factory(); }
}(this, function () {
  "use strict";

  const SUPPORTED_SURFACES = {
    html: true,
    "canvas-dom": true
  };

  const DEFAULT_VIEW_MODEL_ID = "MapperOutputViewModel";

  const CATALOG_ENTRIES = [
    // courseHeading
    { cluster: "courseHeading", kind: "cog", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "hdt", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "hdm", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "brg", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "hdtRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "CompassRadialWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "hdmRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "CompassRadialWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "hdtLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "CompassLinearWidget", surface: "canvas-dom" },
    { cluster: "courseHeading", kind: "hdmLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "CompassLinearWidget", surface: "canvas-dom" },

    // speed
    { cluster: "speed", kind: "sog", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "speed", kind: "stw", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "speed", kind: "sogLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "SpeedLinearWidget", surface: "canvas-dom" },
    { cluster: "speed", kind: "stwLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "SpeedLinearWidget", surface: "canvas-dom" },
    { cluster: "speed", kind: "sogRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "SpeedRadialWidget", surface: "canvas-dom" },
    { cluster: "speed", kind: "stwRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "SpeedRadialWidget", surface: "canvas-dom" },

    // environment
    { cluster: "environment", kind: "depth", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "environment", kind: "depthLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "DepthLinearWidget", surface: "canvas-dom" },
    { cluster: "environment", kind: "depthRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "DepthRadialWidget", surface: "canvas-dom" },
    { cluster: "environment", kind: "temp", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "environment", kind: "tempLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "TemperatureLinearWidget", surface: "canvas-dom" },
    { cluster: "environment", kind: "tempRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "TemperatureRadialWidget", surface: "canvas-dom" },
    { cluster: "environment", kind: "pressure", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },

    // wind
    { cluster: "wind", kind: "angleTrue", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "angleApparent", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "angleTrueDirection", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "speedTrue", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "speedApparent", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "angleTrueRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "WindRadialWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "angleApparentRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "WindRadialWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "angleTrueLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "WindLinearWidget", surface: "canvas-dom" },
    { cluster: "wind", kind: "angleApparentLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "WindLinearWidget", surface: "canvas-dom" },

    // nav
    { cluster: "nav", kind: "eta", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "rteEta", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "dst", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "rteDistance", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "vmg", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "activeRoute", viewModelId: "ActiveRouteViewModel", rendererId: "ActiveRouteTextHtmlWidget", surface: "html" },
    { cluster: "nav", kind: "positionBoat", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "PositionCoordinateWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "positionWp", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "PositionCoordinateWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "centerDisplay", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "CenterDisplayTextWidget", surface: "canvas-dom" },
    { cluster: "nav", kind: "xteDisplay", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "XteDisplayWidget", surface: "canvas-dom" },

    // anchor
    { cluster: "anchor", kind: "distance", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "anchor", kind: "watch", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "anchor", kind: "bearing", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },

    // vessel
    { cluster: "vessel", kind: "voltage", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "voltageLinear", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "VoltageLinearWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "voltageRadial", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "VoltageRadialWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "clock", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "dateTime", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "PositionCoordinateWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "timeStatus", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "PositionCoordinateWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "pitch", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" },
    { cluster: "vessel", kind: "roll", viewModelId: DEFAULT_VIEW_MODEL_ID, rendererId: "ThreeValueTextWidget", surface: "canvas-dom" }
  ];

  function entryKey(cluster, kind) {
    return String(cluster) + "::" + String(kind);
  }

  function ensureNonEmptyString(value, fieldName) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("ClusterKindCatalog: entry." + fieldName + " must be a non-empty string");
    }
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") {
      throw new Error("ClusterKindCatalog: each entry must be an object");
    }

    ensureNonEmptyString(entry.cluster, "cluster");
    ensureNonEmptyString(entry.kind, "kind");
    ensureNonEmptyString(entry.viewModelId, "viewModelId");
    ensureNonEmptyString(entry.rendererId, "rendererId");
    ensureNonEmptyString(entry.surface, "surface");

    if (!SUPPORTED_SURFACES[entry.surface]) {
      throw new Error("ClusterKindCatalog: unsupported surface '" + entry.surface + "' for " + entry.cluster + "/" + entry.kind);
    }

    return {
      cluster: entry.cluster,
      kind: entry.kind,
      viewModelId: entry.viewModelId,
      rendererId: entry.rendererId,
      surface: entry.surface
    };
  }

  function create(def, Helpers) {
    function createCatalog(entries) {
      if (typeof entries !== "undefined" && !Array.isArray(entries)) {
        throw new Error("ClusterKindCatalog: createCatalog(entries) expects an array when provided");
      }

      const sourceEntries = Array.isArray(entries) ? entries : CATALOG_ENTRIES;
      const byKey = Object.create(null);
      const list = [];

      for (let i = 0; i < sourceEntries.length; i += 1) {
        const normalized = normalizeEntry(sourceEntries[i]);
        const key = entryKey(normalized.cluster, normalized.kind);
        if (byKey[key]) {
          throw new Error("ClusterKindCatalog: duplicate entry for cluster '" + normalized.cluster + "' kind '" + normalized.kind + "'");
        }
        const frozenEntry = Object.freeze(normalized);
        byKey[key] = frozenEntry;
        list.push(frozenEntry);
      }

      function resolveRoute(cluster, kind) {
        ensureNonEmptyString(cluster, "cluster");
        ensureNonEmptyString(kind, "kind");

        const route = byKey[entryKey(cluster, kind)];
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

    return {
      id: "ClusterKindCatalog",
      createCatalog: createCatalog,
      createDefaultCatalog: function () {
        return createCatalog();
      }
    };
  }

  return { id: "ClusterKindCatalog", create: create };
}));
