/**
 * Module: DyniPlugin Anchor Cluster - Anchor distance/watch/bearing widget config
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
  const opt = shared.opt;
  const ANCHOR_TEXT_KIND = shared.kindMaps.ANCHOR_TEXT_KIND;
  const ANCHOR_UNIT_AWARE_KIND = shared.kindMaps.ANCHOR_UNIT_AWARE_KIND;
  const commonThreeElementsEditables = shared.commonThreeElementsEditables;
  const anchorBindings = shared.unitFormatFamilies.metricBindings;

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
            opt("Distance from anchor", "anchorDistance"),
            opt("Anchor watch radius", "anchorWatch"),
            opt("Bearing from anchor", "anchorBearing")
          ],
          default: "anchorDistance",
          name: "Instrument"
        },
        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for bearing (e.g., 005°)",
          condition: { kind: "anchorBearing" }
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindCaptionParams(ANCHOR_UNIT_AWARE_KIND),
        ...makeUnitAwareTextParams(ANCHOR_UNIT_AWARE_KIND, anchorBindings),
        ...makePerKindTextParams(ANCHOR_TEXT_KIND),
        ...commonThreeElementsEditables,
        stableDigits: {
          type: "BOOLEAN",
          default: false,
          name: "Stable digits",
          condition: [
            { kind: "anchorDistance" },
            { kind: "anchorWatch" },
            { kind: "anchorBearing" }
          ]
        }
      }
    }
  });
}(this));
