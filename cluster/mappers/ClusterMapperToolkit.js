/**
 * Module: ClusterMapperToolkit - Shared caption/unit/output helpers for cluster mappers
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: RadialAngleMath, ValueMath
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniClusterMapperToolkit = factory();
  }
}(this, function () {
  "use strict";
  let toFiniteNumber;
  let toOptionalFiniteNumber;

  function getGlobalRoot() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    return this;
  }

  function makeAngleFormatter(isDirection, leadingZero, defaultText, angleMath, parseNumber) {
    return function (raw) {
      const n = parseNumber(raw);
      if (typeof n !== "number") {
        return defaultText;
      }
      let a = isDirection ? angleMath.norm360(n) : angleMath.norm180(n);
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

  function getSharedCatalog() {
    const root = getGlobalRoot();
    const shared = root && root.DyniPlugin && root.DyniPlugin.config && root.DyniPlugin.config.shared;
    const catalog = shared && shared.unitFormatFamilies;
    if (!catalog || typeof catalog !== "object" || !catalog.families || !catalog.metricBindings) {
      return null;
    }
    return catalog;
  }

  function createToolkit(props, angleMath, catalog) {
    const p = props || {};
    function resolveBinding(metricKey) {
      if (!catalog) {
        throw new Error("dyninstruments: shared/unit-format-families.js must load before unit-aware mapper resolution");
      }
      const binding = catalog.metricBindings[metricKey];
      if (!binding) {
        throw new Error("dyninstruments: missing unit binding for metric '" + metricKey + "'");
      }
      const family = catalog.families[binding.family];
      if (!family) {
        throw new Error("dyninstruments: missing unit family '" + binding.family + "' for metric '" + metricKey + "'");
      }
      return { binding: binding, family: family };
    }

    function resolveToken(metricKey, familyId) {
      const resolved = resolveBinding(metricKey);
      if (resolved.binding.family !== familyId) {
        throw new Error("dyninstruments: metric '" + metricKey + "' does not belong to family '" + familyId + "'");
      }
      const selectorKey = "formatUnit_" + metricKey;
      const selected = Object.prototype.hasOwnProperty.call(p, selectorKey) ? p[selectorKey] : undefined;
      if (typeof selected === "string" && resolved.family.tokens.indexOf(selected) !== -1) {
        return selected;
      }
      if (resolved.family.tokens.indexOf(resolved.binding.defaultToken) !== -1) {
        return resolved.binding.defaultToken;
      }
      throw new Error("dyninstruments: invalid default token '" + resolved.binding.defaultToken + "' for metric '" + metricKey + "'");
    }

    return {
      cap: function (k) {
        return p["caption_" + k];
      },
      unit: function (k) {
        return p["unit_" + k];
      },
      formatUnit: function (metricKey, familyId) {
        return resolveToken(metricKey, familyId);
      },
      unitText: function (metricKey, familyId, selectedUnitToken) {
        const resolved = resolveBinding(metricKey);
        if (resolved.binding.family !== familyId) {
          throw new Error("dyninstruments: metric '" + metricKey + "' does not belong to family '" + familyId + "'");
        }
        const token = resolved.family.tokens.indexOf(selectedUnitToken) !== -1
          ? selectedUnitToken
          : resolved.binding.defaultToken;
        const key = "unit_" + metricKey + "_" + token;
        if (Object.prototype.hasOwnProperty.call(p, key)) {
          const value = p[key];
          if (typeof value !== "undefined") {
            return value == null ? "" : String(value);
          }
        }
        return resolved.family.labels[token] || token;
      },
      unitNumber: function (baseKey, selectedUnitToken) {
        const key = baseKey + "_" + selectedUnitToken;
        if (!Object.prototype.hasOwnProperty.call(p, key)) {
          return undefined;
        }
        return toFiniteNumber(p[key]);
      },
      out: out,
      num: toOptionalFiniteNumber,
      makeAngleFormatter: function (isDirection, leadingZero, defaultText) {
        return makeAngleFormatter(isDirection, leadingZero, defaultText, angleMath, toOptionalFiniteNumber);
      }
    };
  }

  function create(def, componentContext) {
    const angleMath = componentContext.components.require("RadialAngleMath");
    const valueMath = componentContext.components.require("ValueMath");
    toFiniteNumber = valueMath.toFiniteNumber;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    const catalog = getSharedCatalog();

    return {
      out: out,
      num: toOptionalFiniteNumber,
      makeAngleFormatter: function (isDirection, leadingZero, defaultText) {
        return makeAngleFormatter(isDirection, leadingZero, defaultText, angleMath, toOptionalFiniteNumber);
      },
      createToolkit: function (props) {
        return createToolkit(props, angleMath, catalog);
      }
    };
  }

  return { id: "ClusterMapperToolkit", create: create };
}));
