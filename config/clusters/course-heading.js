/**
 * Module: DyniPlugin CourseHeading Cluster - Course and heading widget config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/cluster-utils.js, config/shared/kind-maps.js
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
    module: "ClusterHost",
    def: {
      name: "dyninstruments_CourseHeading",
      description: "Course & headings (COG/HDT/HDM/BRG) incl. Compass gauge",
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
            opt("Compass — True (HDT) [Graphic]", "hdtGraphic"),
            opt("Compass — Magnetic (HDM) [Graphic]", "hdmGraphic")
          ],
          default: "cog",
          name: "Kind"
        },

        leadingZero: {
          type: "BOOLEAN",
          default: true,
          name: "Leading zero (e.g., 005°)"
        },

        // ThreeElements thresholds — only for numeric kinds
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

        // CompassGauge thresholds — only for graphic kinds
        compRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.8,
          name: "Compass 2-Rows Threshold",
          condition: [{ kind: "hdtGraphic" }, { kind: "hdmGraphic" }]
        },
        compRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.2,
          name: "Compass 1-Row Threshold",
          condition: [{ kind: "hdtGraphic" }, { kind: "hdmGraphic" }]
        },

        // Shared caption/unit-to-value scale applies to both numeric & graphic
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
