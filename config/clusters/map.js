/**
 * Module: DyniPlugin Map Cluster - Map-focused instruments (center display, zoom action, AIS target summary)
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const MAP_KIND = shared.kindMaps.MAP_KIND;
  const CENTER_DISPLAY_CONDITION = { kind: "centerDisplay" };
  const AIS_TARGET_CONDITION = { kind: "aisTarget" };

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Map_Instruments",
      description: "Map values (Center display / Zoom / AIS target)",
      caption: "", unit: "", default: "---",
      cluster: "map",
      storeKeys: {
        zoom: "map.currentZoom",
        requiredZoom: "map.requiredZoom",
        centerCourse: "nav.center.course",
        centerDistance: "nav.center.distance",
        centerMarkerCourse: "nav.center.markerCourse",
        centerMarkerDistance: "nav.center.markerDistance",
        centerPosition: "map.centerPosition",
        activeMeasure: "map.activeMeasure",
        measureRhumbLine: "properties.measureRhumbLine",
        lockPosition: "map.lockPosition",
        target: "nav.ais.nearest",
        trackedMmsi: "nav.ais.trackedMmsi",
        aisMarkAllWarning: "properties.aisMarkAllWarning"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Center display", "centerDisplay"),
            opt("Zoom", "zoom"),
            opt("AIS target", "aisTarget")
          ],
          default: "centerDisplay",
          name: "Instrument"
        },
        centerDisplayRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          internal: true,
          name: "CenterDisplay: 3-Rows Threshold",
          condition: CENTER_DISPLAY_CONDITION
        },
        centerDisplayRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.4,
          internal: true,
          name: "CenterDisplay: 1-Row Threshold",
          condition: CENTER_DISPLAY_CONDITION
        },
        aisTargetRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.2,
          internal: true,
          name: "AisTarget: 3-Rows Threshold",
          condition: AIS_TARGET_CONDITION
        },
        aisTargetRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.8,
          internal: true,
          name: "AisTarget: 1-Row Threshold",
          condition: AIS_TARGET_CONDITION
        },
        coordinatesTabular: {
          type: "BOOLEAN",
          default: true,
          name: "Tabular coordinates",
          condition: CENTER_DISPLAY_CONDITION
        },
        stableDigits: {
          type: "BOOLEAN",
          default: false,
          name: "Stable digits",
          condition: [
            CENTER_DISPLAY_CONDITION,
            { kind: "zoom" },
            { kind: "aisTarget" }
          ]
        },
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,
        ...makePerKindTextParams(MAP_KIND)
      },
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "centerDisplay";
        if (kind === "centerDisplay") {
          out.visible = !(values && values.lockPosition) || !!(values && values.editing);
        } else if (Object.prototype.hasOwnProperty.call(out, "visible")) {
          delete out.visible;
        }
        return out;
      }
    }
  });
}(this));
