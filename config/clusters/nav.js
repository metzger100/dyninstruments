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
      description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Positions)",
      caption: "", unit: "", default: "---",
      cluster: "nav",
      storeKeys: {
        eta: "nav.wp.eta",
        rteEta: "nav.route.eta",
        dst: "nav.wp.distance",
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
            opt("Active waypoint position", "positionWp")
          ],
          default: "eta",
          name: "Kind"
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
        const needsWp = (kind === "dst" || kind === "positionWp");
        if (needsWp && values && values.wpServer === false) out.disconnect = true;
        else if (Object.prototype.hasOwnProperty.call(out, "disconnect")) delete out.disconnect;
        return out;
      }
    }
  });
}(this));
