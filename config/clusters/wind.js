/**
 * Module: DyniPlugin Wind Cluster - Wind numeric and dial widget config
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
  const WIND_KIND = shared.kindMaps.WIND_KIND;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyninstruments_Wind",
      description: "Wind (angle/speed numbers or radial dial renderers)",
      caption: "", unit: "", default: "---",
      cluster: "wind",
      storeKeys: {
        awa: "nav.gps.windAngle",
        twa: "nav.gps.trueWindAngle",
        twd: "nav.gps.trueWindDirection",
        aws: "nav.gps.windSpeed",
        tws: "nav.gps.trueWindSpeed"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Angle — True (TWA)", "angleTrue"),
            opt("Angle — Apparent (AWA)", "angleApparent"),
            opt("Angle — True direction (TWD)", "angleTrueDirection"),
            opt("Speed — True (TWS)", "speedTrue"),
            opt("Speed — Apparent (AWS)", "speedApparent"),
            opt("Dial — True wind (TWA/TWS)", "angleTrueRadial"),
            opt("Dial — Apparent wind (AWA/AWS)", "angleApparentRadial")
          ],
          default: "angleTrue",
          name: "Kind"
        },

        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero for angles (e.g., 005)",
          condition: [
            { kind: "angleTrue" },
            { kind: "angleApparent" },
            { kind: "angleTrueDirection" },
            { kind: "angleTrueRadial" },
            { kind: "angleApparentRadial" }
          ]
        },

        // WindRadialWidget-only row thresholds
        windRadialRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.7,
          name: "Dial 3-Rows Threshold",
          condition: [{ kind: "angleTrueRadial" }, { kind: "angleApparentRadial" }]
        },
        windRadialRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.0,
          name: "Dial 1-Row Threshold",
          condition: [{ kind: "angleTrueRadial" }, { kind: "angleApparentRadial" }]
        },

        // ThreeValueTextWidget thresholds — only for numeric kinds
        ratioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
          name: "3-Rows Threshold (numeric)",
          condition: [
            { kind: "angleTrue" },
            { kind: "angleApparent" },
            { kind: "angleTrueDirection" },
            { kind: "speedTrue" },
            { kind: "speedApparent" }
          ]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
          name: "1-Row Threshold (numeric)",
          condition: [
            { kind: "angleTrue" },
            { kind: "angleApparent" },
            { kind: "angleTrueDirection" },
            { kind: "speedTrue" },
            { kind: "speedApparent" }
          ]
        },

        // Symmetric layline range
        windRadialLayEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Layline sectors enabled",
          condition: [{ kind: "angleTrueRadial" }, { kind: "angleApparentRadial" }]
        },
        windRadialLayMin: {
          type: "FLOAT", min: 0, max: 180, step: 1, default: 25,
          name: "Layline min °",
          condition: [
            { kind: "angleTrueRadial", windRadialLayEnabled: true },
            { kind: "angleApparentRadial", windRadialLayEnabled: true }
          ]
        },
        windRadialLayMax: {
          type: "FLOAT", min: 0, max: 180, step: 1, default: 45,
          name: "Layline max °",
          condition: [
            { kind: "angleTrueRadial", windRadialLayEnabled: true },
            { kind: "angleApparentRadial", windRadialLayEnabled: true }
          ]
        },

        // Shared caption/unit-to-value scale applies to both numeric & radial
        captionUnitScale: {
          type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
          name: "Caption/Unit to Value scale"
        },

        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,

        ...makePerKindTextParams(WIND_KIND)
      }
    }
  });
}(this));
