/**
 * Module: DepthDisplayFormatter - Shared depth formatter helper for unit-aware numeric extraction
 * Documentation: documentation/architecture/component-system.md
 * Depends: ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniDepthDisplayFormatter = factory();
  }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function resolveDefaultText(props, placeholderNormalize) {
    if (props && hasOwn.call(props, "default")) {
      return props.default;
    }
    return placeholderNormalize.normalize(undefined, undefined);
  }

  function formatDisplay(raw, props, unitFormatter, placeholderNormalize, valueMath) {
    const p = props || {};
    const defaultText = resolveDefaultText(p, placeholderNormalize);
    const n = valueMath.toOptionalFiniteNumber(raw);
    if (typeof n !== "number") {
      return { num: NaN, text: defaultText };
    }

    const formatter = hasOwn.call(p, "formatter") ? p.formatter : "formatDistance";
    const formatterParameters = hasOwn.call(p, "formatterParameters")
      ? p.formatterParameters
      : ["m"];
    const token = Array.isArray(formatterParameters) && formatterParameters.length > 0
      ? formatterParameters[0]
      : "m";
    const formatted = unitFormatter.formatWithToken(n, formatter, token, defaultText);
    const parsed = unitFormatter.extractNumericDisplay(formatted, NaN);

    if (!Number.isFinite(parsed)) {
      return { num: NaN, text: defaultText };
    }
    return { num: parsed, text: String(formatted).trim() };
  }

  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");

    return {
      id: "DepthDisplayFormatter",
      formatDisplay: function (raw, props, unitFormatter, placeholderNormalize) {
        return formatDisplay(raw, props, unitFormatter, placeholderNormalize, valueMath);
      },
      createFormatDisplay: function (unitFormatter, placeholderNormalize) {
        return function (raw, props) {
          return formatDisplay(raw, props, unitFormatter, placeholderNormalize, valueMath);
        };
      }
    };
  }

  return { id: "DepthDisplayFormatter", create: create };
}));
