/**
 * @file CourseHeadingMapper - Cluster translation for COG/HDT/HDM/BRG and compass kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniCourseHeadingMapper = factory();
  }
}(this, function () {
  "use strict";

  function create() {
    /** @param {DyniMapperProps|null|undefined} props @param {DyniMapperRouteContext} routeContext @returns {Record<string, unknown>} */
    function translate(props, routeContext) {
      const p = /** @type {DyniMapperProps} */ (props || {});
      const toolkit = routeContext.toolkit;
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num;

      const effKind = p.kind;

      if (effKind === "hdtRadial" || effKind === "hdmRadial") {
        const heading = (effKind === "hdtRadial") ? p.hdt : p.hdm;
        return {
          heading: heading,
          markerCourse: p.brg,
          caption: cap(effKind),
          unit: unit(effKind),
          rendererProps: {
            leadingZero: !!p.leadingZero,
            captionUnitScale: num(p.captionUnitScale),
            compassRadialRatioThresholdNormal: num(p.compassRadialRatioThresholdNormal),
            compassRadialRatioThresholdFlat: num(p.compassRadialRatioThresholdFlat),
            compassRadialHideTextualMetrics: !!p.compassRadialHideTextualMetrics
          }
        };
      }

      if (effKind === "hdtLinear" || effKind === "hdmLinear") {
        const heading = (effKind === "hdtLinear") ? p.hdt : p.hdm;
        return {
          heading: heading,
          markerCourse: p.brg,
          caption: cap(effKind),
          unit: unit(effKind),
          rendererProps: {
            leadingZero: !!p.leadingZero,
            captionUnitScale: num(p.captionUnitScale),
            compassLinearRatioThresholdNormal: num(p.compassLinearRatioThresholdNormal),
            compassLinearRatioThresholdFlat: num(p.compassLinearRatioThresholdFlat),
            compassLinearTickMajor: num(p.compassLinearTickMajor),
            compassLinearTickMinor: num(p.compassLinearTickMinor),
            compassLinearShowEndLabels: !!p.compassLinearShowEndLabels,
            compassLinearRange: num(p.compassLinearRange),
            compassLinearHideTextualMetrics: !!p.compassLinearHideTextualMetrics
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
