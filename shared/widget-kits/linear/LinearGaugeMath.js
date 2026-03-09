/**
 * Module: LinearGaugeMath - Shared value mapping and tick helpers for linear gauges
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeMath = factory(); }
}(this, function () {
  "use strict";

  function keyToText(value) {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }

  function clamp(value, lo, hi) {
    if (!isFinite(value)) {
      return lo;
    }
    return Math.max(lo, Math.min(hi, value));
  }

  function mapValueToX(value, minV, maxV, x0, x1, doClamp) {
    const denom = maxV - minV;
    if (!isFinite(value) || !isFinite(minV) || !isFinite(maxV) || !isFinite(x0) || !isFinite(x1) || denom <= 0) {
      return NaN;
    }
    let ratio = (value - minV) / denom;
    if (doClamp !== false) {
      ratio = clamp(ratio, 0, 1);
    }
    return x0 + (x1 - x0) * ratio;
  }

  function resolveAxisDomain(axisMode, range) {
    if (axisMode === "centered180") {
      return { min: -180, max: 180 };
    }
    if (axisMode === "fixed360") {
      return { min: 0, max: 360 };
    }
    return { min: range.min, max: range.max };
  }

  function buildTicks(minV, maxV, majorStepRaw, minorStepRaw) {
    const majorStep = Math.abs(Number(majorStepRaw));
    const minorStep = Math.abs(Number(minorStepRaw));
    const majorTicks = [];
    const minorTicks = [];
    if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV || !isFinite(majorStep) || majorStep <= 0) {
      return { major: majorTicks, minor: minorTicks };
    }

    const minor = (isFinite(minorStep) && minorStep > 0) ? minorStep : majorStep / 2;
    const eps = 1e-6;
    const majorCount = Math.max(1, Math.round((maxV - minV) / majorStep));
    const minorCount = Math.max(1, Math.round((maxV - minV) / minor));

    for (let i = 0; i <= minorCount; i++) {
      const raw = minV + i * minor;
      const v = raw > maxV ? maxV : raw;
      const majorRatio = (v - minV) / majorStep;
      const nearMajor = Math.abs(majorRatio - Math.round(majorRatio)) <= eps;
      if (!nearMajor) {
        minorTicks.push(v);
      }
      if (v >= maxV - eps) {
        break;
      }
    }

    for (let i = 0; i <= majorCount; i++) {
      const raw = minV + i * majorStep;
      const v = raw > maxV ? maxV : raw;
      majorTicks.push(v);
      if (v >= maxV - eps) {
        break;
      }
    }

    if (!majorTicks.length || Math.abs(majorTicks[0] - minV) > eps) {
      majorTicks.unshift(minV);
    }
    if (Math.abs(majorTicks[majorTicks.length - 1] - maxV) > eps) {
      majorTicks.push(maxV);
    }

    return { major: majorTicks, minor: minorTicks };
  }

  function formatTickLabel(v) {
    if (!isFinite(v)) {
      return "";
    }
    if (Math.abs(v - Math.round(v)) <= 1e-6) {
      return String(Math.round(v));
    }
    return String(Math.round(v * 1000) / 1000);
  }

  function create() {
    return {
      id: "LinearGaugeMath",
      version: "0.2.0",
      keyToText: keyToText,
      clamp: clamp,
      mapValueToX: mapValueToX,
      resolveAxisDomain: resolveAxisDomain,
      buildTicks: buildTicks,
      formatTickLabel: formatTickLabel
    };
  }

  return { id: "LinearGaugeMath", create: create };
}));
