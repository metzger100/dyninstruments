/**
 * Module: DyniPlugin Position Cluster - Boat and waypoint position config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/cluster-utils.js, config/shared/kind-maps.js, config/shared/common-editables.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const POSITION_KIND = shared.kindMaps.POSITION_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;

  config.clusters.push({
    module: "ClusterHost",
    def: {
      name: "dyninstruments_Position",
      description: "Boat GPS position or active waypoint position (lat/lon)",
      caption: "", unit: "", default: "---",
      cluster: "position",
      storeKeys: {
        boat: "nav.gps.position",
        wp: "nav.wp.position",
        wpServer: "nav.wp.server"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Boat position (GPS)", "boat"),
            opt("Active waypoint position", "wp")
          ],
          default: "boat",
          name: "Kind"
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(POSITION_KIND),
        ...commonThreeElementsEditables
      },
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "boat";
        if (kind === "wp" && values && values.wpServer === false) out.disconnect = true;
        return out;
      }
    }
  });
}(this));
