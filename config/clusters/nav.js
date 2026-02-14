/**
 * Module: DyniPlugin Nav Cluster - Navigation metrics widget config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/cluster-utils.js, config/shared/kind-maps.js, config/shared/common-editables.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const config = ns.config || (ns.config = {});
  const shared = config.shared || (config.shared = {});

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const NAV_KIND = shared.kindMaps && shared.kindMaps.NAV_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;

  config.clusters = Array.isArray(config.clusters) ? config.clusters : [];

  config.clusters.push({
    module: "ClusterHost",
    def: {
      name: "dyninstruments_Nav",
      description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Clock / Positions)",
      caption: "", unit: "", default: "---",
      cluster: "nav",
      storeKeys: {
        eta: "nav.wp.eta",
        rteEta: "nav.route.eta",
        dst: "nav.wp.distance",
        rteDistance: "nav.route.remain",
        vmg: "nav.wp.vmg",
        clock: "nav.gps.rtime",
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
            opt("Clock (local time)", "clock"),
            opt("Boat position (GPS)", "positionBoat"),
            opt("Active waypoint position", "positionWp")
          ],
          default: "eta",
          name: "Kind"
        },
        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for bearings (ignored unless bearing-like)",
          condition: []
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(NAV_KIND),
        ...commonThreeElementsEditables
      }
    }
  });
}(this));
