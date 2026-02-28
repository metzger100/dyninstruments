/**
 * Module: WindMapper - Cluster translation for numeric and dial wind kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniWindMapper = factory(); }
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
      const makeAngleFormatter = toolkit.makeAngleFormatter;

      const req = p.kind;

      if (req === "angleTrueGraphic" || req === "angleApparentGraphic") {
        const isTrue = (req === "angleTrueGraphic");
        const speedUnit = p.speedUnitGraphic;
        return {
          renderer: "WindDialWidget",
          angle: isTrue ? p.twa : p.awa,
          speed: isTrue ? p.tws : p.aws,
          rendererProps: {
            angleCaption: isTrue ? p.angleCaption_TWA : p.angleCaption_AWA,
            speedCaption: isTrue ? p.speedCaption_TWS : p.speedCaption_AWS,
            angleUnit: p.angleUnitGraphic,
            speedUnit: speedUnit,
            formatter: "formatSpeed",
            formatterParameters: [speedUnit],
            layEnabled: !!p.windLayEnabled,
            layMin: num(p.layMin),
            layMax: num(p.layMax),
            dialRatioThresholdNormal: num(p.dialRatioThresholdNormal),
            dialRatioThresholdFlat: num(p.dialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            leadingZero: !!p.leadingZero
          }
        };
      }

      const leadingZero = !!p.leadingZero;

      if (req === "angleTrue") {
        return out(p.twa, cap("angleTrue"), unit("angleTrue"), makeAngleFormatter(false, leadingZero, p.default), []);
      }
      if (req === "angleApparent") {
        return out(p.awa, cap("angleApparent"), unit("angleApparent"), makeAngleFormatter(false, leadingZero, p.default), []);
      }
      if (req === "angleTrueDirection") {
        return out(p.twd, cap("angleTrueDirection"), unit("angleTrueDirection"), makeAngleFormatter(true, leadingZero, p.default), []);
      }
      if (req === "speedTrue") {
        const u = unit("speedTrue");
        return out(p.tws, cap("speedTrue"), u, "formatSpeed", [u]);
      }
      if (req === "speedApparent") {
        const u = unit("speedApparent");
        return out(p.aws, cap("speedApparent"), u, "formatSpeed", [u]);
      }
      return {};
    }

    return {
      cluster: "wind",
      translate: translate
    };
  }

  return { id: "WindMapper", create: create };
}));
