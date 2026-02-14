/**
 * Module: DyniPlugin Distance Cluster - Waypoint, route, and anchor distance config
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
  const DISTANCE_KIND = shared.kindMaps.DISTANCE_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;

  config.clusters.push({
    module: "ClusterHost",
    def: {
      name: "dyninstruments_Distance",
      description: "Waypoint distance, route remaining, anchor distances",
      caption: "", unit: "", default: "---",
      cluster: "distance",
      storeKeys: {
        dst: "nav.wp.distance",
        dstServer: "nav.wp.server",
        route: "nav.route.remain",
        anchor: "nav.anchor.distance",
        watch: "nav.anchor.watchDistance"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("To waypoint (DST)", "dst"),
            opt("Route remaining", "route"),
            opt("From anchor", "anchor"),
            opt("Anchor watch radius", "watch")
          ],
          default: "dst",
          name: "Kind"
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(DISTANCE_KIND),
        ...commonThreeElementsEditables
      },
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "dst";
        if (kind === "dst" && values && values.dstServer === false) out.disconnect = true;
        return out;
      }
    }
  });
}(this));
