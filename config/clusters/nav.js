/**
 * Module: DyniPlugin Nav Cluster - Canonical navigation widget config (ETA, distances, positions)
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

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyninstruments_Nav",
      description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Positions / XTE graphic)",
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
            opt("Boat position (GPS)", "positionBoat"),
            opt("Active waypoint position", "positionWp"),
            opt("XTE highway display [Graphic]", "xteDisplay")
          ],
          default: "eta",
          name: "Kind"
        },
        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for headings (e.g., 005)",
          condition: { kind: "xteDisplay" }
        },
        xteRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.85,
          name: "XTE 3-Rows Threshold",
          condition: { kind: "xteDisplay" }
        },
        xteRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.3,
          name: "XTE 1-Row Threshold",
          condition: { kind: "xteDisplay" }
        },
        showWpNameGraphic: {
          type: "BOOLEAN",
          default: true,
          name: "Show waypoint name",
          condition: { kind: "xteDisplay" }
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(NAV_KIND),
        ...commonThreeElementsEditables
      },
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "eta";
        const needsWp = (kind === "dst" || kind === "positionWp" || kind === "xteDisplay");
        if (needsWp && values && values.wpServer === false) out.disconnect = true;
        else if (Object.prototype.hasOwnProperty.call(out, "disconnect")) delete out.disconnect;
        return out;
      }
    }
  });
}(this));
