/**
 * Module: ClusterMapperToolkit - Shared caption/unit/output helpers for cluster mappers
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: GaugeAngleMath
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterMapperToolkit = factory(); }
}(this, function () {
  "use strict";

  function makeAngleFormatter(isDirection, leadingZero, fallback, angleMath) {
    const norm360 = (angleMath && typeof angleMath.norm360 === "function")
      ? angleMath.norm360
      : ((deg) => {
        if (!isFinite(deg)) return deg;
        let r = deg % 360;
        if (r < 0) r += 360;
        return r;
      });
    const norm180 = (angleMath && typeof angleMath.norm180 === "function")
      ? angleMath.norm180
      : ((deg) => {
        if (!isFinite(deg)) return deg;
        let r = ((deg + 180) % 360 + 360) % 360 - 180;
        if (r === 180) r = -180;
        return r;
      });

    return function (raw) {
      const n = Number(raw);
      if (!isFinite(n)) return fallback || "---";
      let a = isDirection ? norm360(n) : norm180(n);
      let out;
      if (isDirection) {
        out = ((Math.round(a) % 360) + 360) % 360;
      }
      else {
        const r = Math.round(Math.abs(a));
        out = a < 0 ? -r : r;
        if (out === 180) out = -180;
      }
      let s = String(Math.abs(out));
      if (leadingZero) s = s.padStart(3, "0");
      if (!isDirection && out < 0) s = "-" + s;
      return s;
    };
  }

  function out(v, cap, unit, formatter, formatterParameters) {
    const o = {};
    if (typeof v !== "undefined") o.value = v;
    if (typeof cap !== "undefined") o.caption = cap;
    if (typeof unit !== "undefined") o.unit = unit;
    if (typeof formatter !== "undefined") o.formatter = formatter;
    if (Array.isArray(formatterParameters)) o.formatterParameters = formatterParameters;
    return o;
  }

  function createToolkit(props, angleMath) {
    const p = props || {};
    return {
      cap: function (k) {
        return p["caption_" + k];
      },
      unit: function (k) {
        return p["unit_" + k];
      },
      out: out,
      makeAngleFormatter: function (isDirection, leadingZero, fallback) {
        return makeAngleFormatter(isDirection, leadingZero, fallback, angleMath);
      }
    };
  }

  function create(def, Helpers) {
    const angleMath = (Helpers && typeof Helpers.getModule === "function")
      ? Helpers.getModule("GaugeAngleMath").create(def, Helpers)
      : null;

    return {
      out: out,
      makeAngleFormatter: function (isDirection, leadingZero, fallback) {
        return makeAngleFormatter(isDirection, leadingZero, fallback, angleMath);
      },
      createToolkit: function (props) {
        return createToolkit(props, angleMath);
      }
    };
  }

  return { id: "ClusterMapperToolkit", create: create };
}));
