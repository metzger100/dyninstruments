/*!
 * ClusterHost dispatch: courseHeading
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchCourseHeading = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const effKind = p.kind;

      if (effKind === "hdtGraphic" || effKind === "hdmGraphic") {
        const heading = (effKind === "hdtGraphic") ? p.hdt : p.hdm;
        return {
          renderer: "CompassGauge",
          heading: heading,
          markerCourse: p.brg,
          caption: cap(effKind),
          unit: unit(effKind),
          leadingZero: !!p.leadingZero,
          captionUnitScale: Number(p.captionUnitScale),
          compRatioThresholdNormal: Number(p.compRatioThresholdNormal),
          compRatioThresholdFlat: Number(p.compRatioThresholdFlat)
        };
      }

      const val = p[effKind];
      const leadingZero = !!p.leadingZero;
      return out(val, cap(effKind), unit(effKind), "formatDirection360", [leadingZero]);
    }

    return {
      cluster: "courseHeading",
      translate: translate
    };
  }

  return { id: "ClusterHostDispatchCourseHeading", create: create };
}));
