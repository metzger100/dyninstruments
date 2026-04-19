/**
 * Module: DyniPlugin Anchor Cluster - Anchor distance/watch/bearing widget config
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
  const ANCHOR_KIND = shared.kindMaps.ANCHOR_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Anchor_Instruments",
      description: "Anchor metrics (distance, watch radius, bearing)",
      caption: "", unit: "", default: "---",
      cluster: "anchor",
      storeKeys: {
        distance: "nav.anchor.distance",
        watch: "nav.anchor.watchDistance",
        bearing: "nav.anchor.direction"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Distance from anchor", "distance"),
            opt("Anchor watch radius", "watch"),
            opt("Bearing from anchor", "bearing")
          ],
          default: "distance",
          name: "Instrument"
        },
        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for bearing (e.g., 005°)",
          condition: { kind: "bearing" }
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(ANCHOR_KIND),
        ...commonThreeElementsEditables,
        stableDigits: {
          type: "BOOLEAN",
          default: false,
          name: "Stable digits",
          condition: [
            { kind: "distance" },
            { kind: "watch" },
            { kind: "bearing" }
          ]
        }
      }
    }
  });
}(this));
