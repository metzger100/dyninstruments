/**
 * Module: DyniPlugin Nav Cluster - Canonical navigation widget config (ETA, distances, positions, route points)
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js, config/shared/common-editables.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const NAV_KIND = shared.kindMaps.NAV_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;
  const NAV_TEXT_KIND_CONDITION = [
    { kind: "eta" },
    { kind: "rteEta" },
    { kind: "dst" },
    { kind: "rteDistance" },
    { kind: "vmg" },
    { kind: "positionBoat" },
    { kind: "positionWp" }
  ];

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Nav_Instruments",
      description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Active route / Positions / XTE display)",
      caption: "", unit: "", default: "---",
      cluster: "nav",
      storeKeys: {
        eta: "nav.wp.eta",
        rteEta: "nav.route.eta",
        dst: "nav.wp.distance",
        dtw: "nav.wp.distance",
        xte: "nav.wp.xte",
        cog: "nav.gps.course",
        btw: "nav.wp.course",
        wpName: "nav.wp.name",
        wpServer: "nav.wp.server",
        activeRouteName: "nav.route.name",
        activeRouteRemain: "nav.route.remain",
        activeRouteEta: "nav.route.eta",
        activeRouteNextCourse: "nav.route.nextCourse",
        activeRouteApproaching: "nav.route.isApproaching",
        editingRoute: "nav.routeHandler.editingRoute",
        editingIndex: "nav.routeHandler.editingIndex",
        activeName: "nav.routeHandler.activeName",
        useRhumbLine: "nav.routeHandler.useRhumbLine",
        routeShowLL: "properties.routeShowLL",
        rteDistance: "nav.route.remain",
        vmg: "nav.wp.vmg",
        positionBoat: "nav.gps.position",
        positionWp: "nav.wp.position"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("ETA to waypoint", "eta"),
            opt("ETA for route", "rteEta"),
            opt("Distance to waypoint (DST)", "dst"),
            opt("Remaining route distance", "rteDistance"),
            opt("VMG to waypoint", "vmg"),
            opt("Active route", "activeRoute"),
            opt("Route points list", "routePoints"),
            opt("Boat position (GPS)", "positionBoat"),
            opt("Active waypoint position", "positionWp"),
            opt("XTE highway display", "xteDisplay")
          ],
          default: "eta",
          name: "Instrument"
        },
        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for headings (e.g., 005)",
          condition: { kind: "xteDisplay" }
        },
        xteRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.85,
          internal: true,
          name: "XTE 3-Rows Threshold",
          condition: { kind: "xteDisplay" }
        },
        xteRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.3,
          internal: true,
          name: "XTE 1-Row Threshold",
          condition: { kind: "xteDisplay" }
        },
        activeRouteRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.2,
          internal: true,
          name: "ActiveRoute: 3-Rows Threshold",
          condition: { kind: "activeRoute" }
        },
        activeRouteRatioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.8,
          internal: true,
          name: "ActiveRoute: 1-Row Threshold",
          condition: { kind: "activeRoute" }
        },
        routePointsRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
          internal: true,
          name: "RoutePoints: 3-Rows Threshold",
          condition: { kind: "routePoints" }
        },
        routePointsRatioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.5,
          internal: true,
          name: "RoutePoints: 1-Row Threshold",
          condition: { kind: "routePoints" }
        },
        showHeader: {
          type: "BOOLEAN",
          default: true,
          name: "Show header",
          condition: { kind: "routePoints" }
        },
        distanceUnit: {
          type: "STRING",
          default: "nm",
          name: "Distance unit",
          condition: { kind: "routePoints" }
        },
        courseUnit: {
          type: "STRING",
          default: "°",
          name: "Course unit",
          condition: { kind: "routePoints" }
        },
        waypointsText: {
          type: "STRING",
          default: "waypoints",
          name: "Waypoints label",
          condition: { kind: "routePoints" }
        },
        showWpNameXteDisplay: {
          type: "BOOLEAN",
          default: false,
          name: "Show waypoint name",
          condition: { kind: "xteDisplay" }
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(NAV_KIND),
        ratioThresholdNormal: {
          ...commonThreeElementsEditables.ratioThresholdNormal,
          internal: true,
          condition: NAV_TEXT_KIND_CONDITION
        },
        ratioThresholdFlat: {
          ...commonThreeElementsEditables.ratioThresholdFlat,
          internal: true,
          condition: NAV_TEXT_KIND_CONDITION
        },
        captionUnitScale: {
          ...commonThreeElementsEditables.captionUnitScale,
          condition: NAV_TEXT_KIND_CONDITION
        }
      },
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "eta";
        const needsWp = (kind === "dst" || kind === "positionWp" || kind === "xteDisplay");
        if (needsWp && values && values.wpServer === false) out.disconnect = true;
        else if (Object.prototype.hasOwnProperty.call(out, "disconnect")) delete out.disconnect;
        if (Object.prototype.hasOwnProperty.call(out, "visible")) {
          delete out.visible;
        }
        return out;
      }
    }
  });
}(this));
