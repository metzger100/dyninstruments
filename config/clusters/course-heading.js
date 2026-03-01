/**
 * Module: DyniPlugin CourseHeading Cluster - Course and heading widget config
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
  const COURSE_KIND = shared.kindMaps.COURSE_KIND;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyninstruments_CourseHeading",
      description: "Course & headings (COG/HDT/HDM/BRG) incl. radial and linear compass gauges",
      caption: "", unit: "", default: "---",
      cluster: "courseHeading",
      storeKeys: {
        cog: "nav.gps.course",
        hdt: "nav.gps.headingTrue",
        hdm: "nav.gps.headingMag",
        brg: "nav.wp.course"
      },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Course over ground (COG)", "cog"),
            opt("Heading — True (HDT)", "hdt"),
            opt("Heading — Magnetic (HDM)", "hdm"),
            opt("Bearing to waypoint (BRG)", "brg"),
            opt("Compass — True (HDT) [Radial]", "hdtRadial"),
            opt("Compass — Magnetic (HDM) [Radial]", "hdmRadial"),
            opt("Compass — True (HDT) [Linear]", "hdtLinear"),
            opt("Compass — Magnetic (HDM) [Linear]", "hdmLinear")
          ],
          default: "cog",
          name: "Kind"
        },

        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero (e.g., 005°)"
        },

        // ThreeValueTextWidget thresholds — only for numeric kinds
        ratioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
          name: "3-Rows Threshold (numeric)",
          condition: [{ kind: "cog" }, { kind: "hdt" }, { kind: "hdm" }, { kind: "brg" }]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
          name: "1-Row Threshold (numeric)",
          condition: [{ kind: "cog" }, { kind: "hdt" }, { kind: "hdm" }, { kind: "brg" }]
        },

        // CompassRadialWidget thresholds — only for radial kinds
        compassRadialRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.8,
          name: "Compass 2-Rows Threshold",
          condition: [{ kind: "hdtRadial" }, { kind: "hdmRadial" }]
        },
        compassRadialRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.2,
          name: "Compass 1-Row Threshold",
          condition: [{ kind: "hdtRadial" }, { kind: "hdmRadial" }]
        },

        // CompassLinearWidget settings — only for linear kinds
        compassLinearRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "CompassLinearWidget: Normal Threshold",
          condition: [{ kind: "hdtLinear" }, { kind: "hdmLinear" }]
        },
        compassLinearRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "CompassLinearWidget: Flat Threshold",
          condition: [{ kind: "hdtLinear" }, { kind: "hdmLinear" }]
        },
        compassLinearTickMajor: {
          type: "FLOAT", min: 1, max: 180, step: 1, default: 30,
          name: "Major tick step (linear)",
          condition: [{ kind: "hdtLinear" }, { kind: "hdmLinear" }]
        },
        compassLinearTickMinor: {
          type: "FLOAT", min: 1, max: 180, step: 1, default: 10,
          name: "Minor tick step (linear)",
          condition: [{ kind: "hdtLinear" }, { kind: "hdmLinear" }]
        },
        compassLinearShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels (linear)",
          condition: [{ kind: "hdtLinear" }, { kind: "hdmLinear" }]
        },

        // Shared caption/unit-to-value scale applies to both numeric & radial
        captionUnitScale: {
          type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
          name: "Caption/Unit to Value scale"
        },

        // hide low-levels
        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,

        ...makePerKindTextParams(COURSE_KIND)
      }
    }
  });
}(this));
