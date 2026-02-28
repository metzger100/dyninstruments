/**
 * Module: CourseHeadingMapper - Cluster translation for COG/HDT/HDM/BRG and compass kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCourseHeadingMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      const effKind = p.kind;

      if (effKind === "hdtRadial" || effKind === "hdmRadial") {
        const heading = (effKind === "hdtRadial") ? p.hdt : p.hdm;
        return {
          renderer: "CompassGaugeWidget",
          heading: heading,
          markerCourse: p.brg,
          caption: cap(effKind),
          unit: unit(effKind),
          rendererProps: {
            leadingZero: !!p.leadingZero,
            captionUnitScale: num(p.captionUnitScale),
            compRatioThresholdNormal: num(p.compRatioThresholdNormal),
            compRatioThresholdFlat: num(p.compRatioThresholdFlat)
          }
        };
      }

      if (effKind === "cog" || effKind === "hdt" || effKind === "hdm" || effKind === "brg") {
        const val = p[effKind];
        const leadingZero = !!p.leadingZero;
        return out(val, cap(effKind), unit(effKind), "formatDirection360", [leadingZero]);
      }

      return {};
    }

    return {
      cluster: "courseHeading",
      translate: translate
    };
  }

  return { id: "CourseHeadingMapper", create: create };
}));
