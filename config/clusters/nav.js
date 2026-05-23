/**
 * Module: DyniPlugin Nav Cluster - Canonical navigation widget config (ETA, distances, positions, route points)
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js, config/shared/common-editables.js, config/shared/unit-editable-utils.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindCaptionParams = shared.makePerKindCaptionParams;
  const makePerKindTextParams = shared.makePerKindTextParams;
  const makeUnitAwareTextParams = shared.makeUnitAwareTextParams;
  const makeFormatUnitSelectParam = shared.makeFormatUnitSelectParam;
  const makePerUnitStringParams = shared.makePerUnitStringParams;
  const opt = shared.opt;
  const NAV_TEXT_KIND = shared.kindMaps.NAV_TEXT_KIND;
  const NAV_UNIT_AWARE_KIND = shared.kindMaps.NAV_UNIT_AWARE_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;
  const navBindings = shared.unitFormatFamilies.metricBindings;
  const NAV_TEXT_KIND_CONDITION = [
    { kind: "wpEta" },
    { kind: "rteEta" },
    { kind: "dst" },
    { kind: "rteDistance" },
    { kind: "vmg" },
    { kind: "positionBoat" },
    { kind: "positionWp" }
  ];
  const XTE_DISPLAY_SCALE_FIELDS = {
    nm: { default: 1, min: 0, max: 20, step: 0.1 },
    m: { default: 1852, min: 0, max: 20000, step: 10 },
    km: { default: 1.852, min: 0, max: 20, step: 0.01 },
    ft: { default: 6076, min: 0, max: 40000, step: 10 },
    yd: { default: 2025, min: 0, max: 40000, step: 1 }
  };
  const XTE_LINEAR_SCALE_FIELDS = {
    nm: { default: 1, min: 0, max: 20, step: 0.1 },
    m: { default: 1852, min: 0, max: 20000, step: 10 },
    km: { default: 1.852, min: 0, max: 20, step: 0.01 },
    ft: { default: 6076, min: 0, max: 40000, step: 10 },
    yd: { default: 2025, min: 0, max: 40000, step: 1 }
  };

  function makeXteDisplayScaleParams() {
    const out = {};
    Object.keys(XTE_DISPLAY_SCALE_FIELDS).forEach(function (token) {
      const spec = XTE_DISPLAY_SCALE_FIELDS[token];
      out["xteDisplayScale_" + token] = {
        type: "FLOAT",
        min: spec.min,
        max: spec.max,
        step: spec.step,
        default: spec.default,
        name: "XTE highway scale",
        condition: {
          kind: "xteDisplay",
          formatUnit_xteDisplayXte: token
        }
      };
    });
    return out;
  }

  function makeXteLinearScaleParams() {
    const out = {};
    Object.keys(XTE_LINEAR_SCALE_FIELDS).forEach(function (token) {
      const spec = XTE_LINEAR_SCALE_FIELDS[token];
      out["xteLinearScale_" + token] = {
        type: "FLOAT",
        min: spec.min,
        max: spec.max,
        step: spec.step,
        default: spec.default,
        name: "XTE linear scale",
        condition: {
          kind: "xteDisplayLinear",
          formatUnit_xteDisplayLinearXte: token
        }
      };
    });
    return out;
  }

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Nav_Instruments",
      description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Active route / Edit route / Route points / Positions / XTE display / XTE linear gauge)",
      caption: "", unit: "", default: "---",
      cluster: "nav",
      storeKeys: {
        wpEta: "nav.wp.eta",
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
            opt("WP ETA to waypoint", "wpEta"),
            opt("ETA for route", "rteEta"),
            opt("Distance to waypoint (DST)", "dst"),
            opt("Remaining route distance", "rteDistance"),
            opt("VMG to waypoint", "vmg"),
            opt("Active route", "activeRoute"),
            opt("Edit route", "editRoute"),
            opt("Route points list", "routePoints"),
            opt("Boat position (GPS)", "positionBoat"),
            opt("Active waypoint position", "positionWp"),
            opt("XTE highway display", "xteDisplay"),
            opt("XTE linear gauge", "xteDisplayLinear")
          ],
          default: "wpEta",
          name: "Instrument"
        },
        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for headings (e.g., 005)",
          condition: { kind: "xteDisplay" }
        },
        xteLinearLeadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for headings",
          condition: { kind: "xteDisplayLinear" }
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
        xteLinearRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.85,
          internal: true,
          name: "XTE Linear 3-Rows Threshold",
          condition: { kind: "xteDisplayLinear" }
        },
        xteLinearRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.3,
          internal: true,
          name: "XTE Linear 1-Row Threshold",
          condition: { kind: "xteDisplayLinear" }
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
        editRouteRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.2,
          internal: true,
          name: "EditRoute: 3-Rows Threshold",
          condition: { kind: "editRoute" }
        },
        editRouteRatioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.8,
          internal: true,
          name: "EditRoute: 1-Row Threshold",
          condition: { kind: "editRoute" }
        },
        caption_editRoutePts: {
          type: "STRING",
          default: "PTS",
          name: "PTS caption",
          condition: { kind: "editRoute" }
        },
        caption_editRouteDst: {
          type: "STRING",
          default: "DST",
          name: "DST caption",
          condition: { kind: "editRoute" }
        },
        ...makeFormatUnitSelectParam("editRouteDst", navBindings.editRouteDst, { kind: "editRoute" }),
        ...makePerUnitStringParams("editRouteDst", navBindings.editRouteDst, { kind: "editRoute" }),
        caption_editRouteRte: {
          type: "STRING",
          default: "RTE",
          name: "RTE caption",
          condition: { kind: "editRoute" }
        },
        ...makeFormatUnitSelectParam("editRouteRte", navBindings.editRouteRte, { kind: "editRoute" }),
        ...makePerUnitStringParams("editRouteRte", navBindings.editRouteRte, { kind: "editRoute" }),
        caption_editRouteEta: {
          type: "STRING",
          default: "RTE ETA",
          name: "RTE ETA caption",
          condition: { kind: "editRoute" }
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
        ...makeFormatUnitSelectParam("routePointsDistance", navBindings.routePointsDistance, { kind: "routePoints" }),
        ...makePerUnitStringParams("routePointsDistance", navBindings.routePointsDistance, { kind: "routePoints" }),
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
        xteLinearShowWpName: {
          type: "BOOLEAN",
          default: false,
          name: "Show waypoint name",
          condition: { kind: "xteDisplayLinear" }
        },
        coordinatesTabular: {
          type: "BOOLEAN",
          default: true,
          name: "Tabular coordinates",
          condition: [
            { kind: "routePoints" },
            { kind: "positionBoat" },
            { kind: "positionWp" }
          ]
        },
        stableDigits: {
          type: "BOOLEAN",
          default: false,
          name: "Stable digits",
          condition: [
            { kind: "wpEta" },
            { kind: "rteEta" },
            { kind: "dst" },
            { kind: "rteDistance" },
            { kind: "vmg" },
            { kind: "xteDisplay" },
            { kind: "xteDisplayLinear" },
            { kind: "activeRoute" },
            { kind: "editRoute" },
            { kind: "routePoints" }
          ]
        },
        easing: {
          type: "BOOLEAN",
          default: true,
          name: "Smooth motion",
          condition: { kind: "xteDisplay" }
        },
        xteLinearEasing: {
          type: "BOOLEAN",
          default: true,
          name: "Smooth motion",
          condition: { kind: "xteDisplayLinear" }
        },
        xteHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: { kind: "xteDisplay" }
        },
        xteLinearHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: { kind: "xteDisplayLinear" }
        },
        xteLinearTickMajor: {
          type: "FLOAT",
          min: 0.1,
          max: 20,
          step: 0.1,
          default: 1.0,
          internal: true,
          name: "Major tick step",
          condition: { kind: "xteDisplayLinear" }
        },
        xteLinearTickMinor: {
          type: "FLOAT",
          min: 0.05,
          max: 10,
          step: 0.05,
          default: 0.25,
          internal: true,
          name: "Minor tick step",
          condition: { kind: "xteDisplayLinear" }
        },
        xteLinearShowEndLabels: {
          type: "BOOLEAN",
          default: true,
          name: "Show min/max labels",
          condition: { kind: "xteDisplayLinear" }
        },
        ...makeXteDisplayScaleParams(),
        ...makeXteLinearScaleParams(),
        hideSeconds: {
          type: "BOOLEAN",
          default: false,
          name: "Hide seconds",
          condition: [
            { kind: "wpEta" },
            { kind: "rteEta" },
            { kind: "activeRoute" },
            { kind: "editRoute" }
          ]
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindCaptionParams(NAV_UNIT_AWARE_KIND),
        ...makeUnitAwareTextParams(NAV_UNIT_AWARE_KIND, navBindings),
        ...makePerKindTextParams(NAV_TEXT_KIND),
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
        const kind = (values && values.kind) || "wpEta";
        const needsWp = (kind === "dst" || kind === "positionWp" || kind === "xteDisplay" || kind === "xteDisplayLinear");
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
