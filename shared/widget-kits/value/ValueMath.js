/**
 * Module: ValueMath - Canonical numeric, text, range, and gauge value helpers
 * Documentation: documentation/conventions/shared-helpers.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniValueMath = factory();
  }
}(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function resolveFiniteNumber(value, defaultValue) {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
  }

  function toOptionalFiniteNumber(value) {
    if (value == null) {
      return undefined;
    }
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function toNumber(value) {
    const n = toFiniteNumber(value);
    return typeof n === "number" ? n : NaN;
  }

  function clamp(value, lo, hi) {
    const low = toFiniteNumber(lo);
    const high = toFiniteNumber(hi);
    const safeLo = typeof low === "number" ? low : 0;
    const safeHi = typeof high === "number" ? high : safeLo;
    if (value == null) {
      return safeLo;
    }
    if (typeof value === "string" && value.trim() === "") {
      return safeLo;
    }
    const n = isFiniteNumber(value) ? value : toFiniteNumber(value);
    if (typeof n !== "number") {
      return safeLo;
    }
    return Math.max(safeLo, Math.min(safeHi, n));
  }

  function clampPositive(value, defaultValue) {
    const n = toFiniteNumber(value);
    return typeof n === "number" && n > 0 ? n : defaultValue;
  }

  function ensureObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(String(name || "value") + " must be an object");
    }
    return value;
  }

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function trimText(value) {
    return value == null ? "" : String(value).trim();
  }

  function clampNumber(value, min, max, defaultValue) {
    if (value == null) {
      return defaultValue;
    }
    if (typeof value === "string" && value.trim() === "") {
      return defaultValue;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, n));
  }

  function isObject(value) {
    return !!value && typeof value === "object";
  }

  function toSafeInteger(value, defaultValue) {
    const n = toFiniteNumber(value);
    if (typeof n !== "number") {
      return defaultValue;
    }
    return Math.round(n);
  }

  function hasText(value) {
    return value != null && String(value).trim().length > 0;
  }

  function keyToText(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  function appendUnit(valueText, displayUnit, defaultText) {
    const text = toText(valueText) || toText(defaultText);
    const unit = displayUnit == null ? "" : String(displayUnit);
    return unit ? text + unit : text;
  }

  function textLength(value) {
    if (value == null) {
      return 0;
    }
    return String(value).length;
  }

  function lerp(from, to, t) {
    return from + ((to - from) * t);
  }

  function almostInt(value, eps) {
    const epsilon = Number.isFinite(Number(eps)) ? Number(eps) : 1e-6;
    return Math.abs(value - Math.round(value)) <= epsilon;
  }

  function isApprox(a, b, eps) {
    const epsilon = Number.isFinite(Number(eps)) ? Number(eps) : 1e-6;
    return Math.abs(Number(a) - Number(b)) <= epsilon;
  }

  function extractNumberText(text) {
    const match = String(text).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
    return match ? match[0] : "";
  }

  function normalizeRange(minRaw, maxRaw, defaultMin, defaultMax) {
    let minV = toNumber(minRaw);
    let maxV = toNumber(maxRaw);

    if (!Number.isFinite(minV)) minV = toNumber(defaultMin);
    if (!Number.isFinite(minV)) minV = 0;

    if (!Number.isFinite(maxV)) maxV = toNumber(defaultMax);
    if (!Number.isFinite(maxV)) maxV = minV + 1;

    if (maxV <= minV) maxV = minV + 1;
    return { min: minV, max: maxV, range: maxV - minV };
  }

  function computePad(W, H) {
    return Math.max(6, Math.floor(Math.min(W, H) * 0.04));
  }

  function computeGap(W, H) {
    return Math.max(6, Math.floor(Math.min(W, H) * 0.03));
  }

  function computeMode(ratio, thresholdNormal, thresholdFlat) {
    if (ratio < thresholdNormal) {
      return "high";
    }
    if (ratio > thresholdFlat) {
      return "flat";
    }
    return "normal";
  }

  function formatGaugeDisplay(raw, props, applyFormatter, normalize, defaultFormatter, defaultFormatterParameters) {
    const p = props || {};
    const defaultText = hasOwn.call(p, "default") ? p.default : normalize(undefined, undefined);
    const numericRaw = toOptionalFiniteNumber(raw);
    if (typeof numericRaw !== "number") {
      return { num: NaN, text: defaultText };
    }

    const formatter = hasOwn.call(p, "formatter") ? p.formatter : defaultFormatter;
    const formatterParameters = hasOwn.call(p, "formatterParameters") ? p.formatterParameters : defaultFormatterParameters;
    const formatted = normalize(
      String(applyFormatter(numericRaw, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: defaultText
      })),
      defaultText
    );
    const numberText = extractNumberText(formatted);
    const num = numberText ? Number(numberText) : NaN;
    return Number.isFinite(num) ? { num: num, text: numberText } : { num: NaN, text: defaultText };
  }

  const tickProfiles = {
    standard: {
      default: { major: 10, minor: 2 },
      ranges: [
        { max: 6, major: 1, minor: 0.5 },
        { max: 12, major: 2, minor: 1 },
        { max: 30, major: 5, minor: 1 },
        { max: 60, major: 10, minor: 2 },
        { max: 120, major: 20, minor: 5 }
      ],
      plain: { major: 50, minor: 10 }
    },
    temperature: {
      default: { major: 10, minor: 2 },
      ranges: [
        { max: 8, major: 1, minor: 0.5 },
        { max: 20, major: 2, minor: 1 },
        { max: 50, major: 5, minor: 1 },
        { max: 100, major: 10, minor: 2 },
        { max: 200, major: 20, minor: 5 }
      ],
      plain: { major: 50, minor: 10 }
    },
    voltage: {
      default: { major: 1, minor: 0.2 },
      ranges: [
        { max: 3, major: 0.5, minor: 0.1 },
        { max: 6, major: 1, minor: 0.2 },
        { max: 12, major: 2, minor: 0.5 },
        { max: 30, major: 5, minor: 1 },
        { max: 60, major: 10, minor: 2 },
        { max: 120, major: 20, minor: 5 }
      ],
      plain: { major: 50, minor: 10 }
    }
  };

  function resolveTickSteps(range, profileName) {
    const profile = tickProfiles[profileName] || tickProfiles.standard;
    const n = Number(range);
    if (!Number.isFinite(n) || n <= 0) {
      return { major: profile.default.major, minor: profile.default.minor };
    }
    for (let i = 0; i < profile.ranges.length; i += 1) {
      const step = profile.ranges[i];
      if (n <= step.max) {
        return { major: step.major, minor: step.minor };
      }
    }
    return { major: profile.plain.major, minor: profile.plain.minor };
  }

  function resolveStandardTickSteps(range) {
    return resolveTickSteps(range, "standard");
  }

  function resolveTemperatureTickSteps(range) {
    return resolveTickSteps(range, "temperature");
  }

  function resolveVoltageTickSteps(range) {
    return resolveTickSteps(range, "voltage");
  }

  function formatAngle180(value, leadingZero) {
    const n = toOptionalFiniteNumber(value);
    if (typeof n !== "number") {
      return "";
    }
    let a = ((n + 180) % 360 + 360) % 360 - 180;
    if (a === 180) a = -180;
    const rounded = Math.round(Math.abs(a));
    let out = String(rounded);
    if (leadingZero) out = out.padStart(3, "0");
    if (a < 0) out = "-" + out;
    return out;
  }

  function formatDirection360(value, leadingZero) {
    const n = toOptionalFiniteNumber(value);
    if (typeof n !== "number") {
      return "";
    }
    let a = n % 360;
    if (a < 0) a += 360;
    const rounded = Math.round(a) % 360;
    let out = String(rounded);
    if (leadingZero) out = out.padStart(3, "0");
    return out;
  }

  function formatMajorLabel(value) {
    const n = toOptionalFiniteNumber(value);
    if (typeof n !== "number") {
      return "";
    }
    if (almostInt(n, 1e-6)) {
      return String(Math.round(n));
    }
    const rounded = Math.round(n * 1000) / 1000;
    return String(rounded);
  }

  function create() {
    return {
      id: "ValueMath",
      isFiniteNumber: isFiniteNumber,
      toFiniteNumber: toFiniteNumber,
      resolveFiniteNumber: resolveFiniteNumber,
      toOptionalFiniteNumber: toOptionalFiniteNumber,
      clamp: clamp,
      clampPositive: clampPositive,
      ensureObject: ensureObject,
      toObject: toObject,
      toText: toText,
      trimText: trimText,
      clampNumber: clampNumber,
      isObject: isObject,
      toSafeInteger: toSafeInteger,
      hasText: hasText,
      keyToText: keyToText,
      appendUnit: appendUnit,
      textLength: textLength,
      lerp: lerp,
      almostInt: almostInt,
      isApprox: isApprox,
      extractNumberText: extractNumberText,
      normalizeRange: normalizeRange,
      computePad: computePad,
      computeGap: computeGap,
      computeMode: computeMode,
      formatGaugeDisplay: formatGaugeDisplay,
      resolveTickSteps: resolveTickSteps,
      resolveStandardTickSteps: resolveStandardTickSteps,
      resolveTemperatureTickSteps: resolveTemperatureTickSteps,
      resolveVoltageTickSteps: resolveVoltageTickSteps,
      resolveSemicircleTickSteps: resolveTickSteps,
      resolveStandardSemicircleTickSteps: resolveStandardTickSteps,
      resolveTemperatureSemicircleTickSteps: resolveTemperatureTickSteps,
      resolveVoltageSemicircleTickSteps: resolveVoltageTickSteps,
      formatAngle180: formatAngle180,
      formatDirection360: formatDirection360,
      formatMajorLabel: formatMajorLabel
    };
  }

  return { id: "ValueMath", create: create };
}));
