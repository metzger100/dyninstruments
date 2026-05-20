/**
 * Module: UnitAwareFormatter - Shared formatter helpers for unit-token rendering
 * Documentation: documentation/architecture/component-system.md
 * Depends: PlaceholderNormalize, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniUnitAwareFormatter = factory(); }
}(this, function () {
  "use strict";

  let toText;
  let appendUnitValueMath;

  function formatWithToken(value, formatter, token, defaultText, componentContext, placeholderNormalize) {
    const formatted = componentContext.format.applyFormatter(value, {
      formatter: formatter,
      formatterParameters: [token],
      default: defaultText
    });
    return placeholderNormalize.normalize(formatted == null ? defaultText : String(formatted).trim(), defaultText);
  }

  function formatDistance(value, token, defaultText, componentContext, placeholderNormalize) {
    return formatWithToken(value, "formatDistance", token, defaultText, componentContext, placeholderNormalize);
  }

  function extractNumericDisplay(valueText, defaultValue) {
    const text = toText(valueText).trim();
    const match = text.match(/^([+-]?(?:\d+(?:[.,]\d+)?|\.\d+))/);
    if (!match) {
      return defaultValue;
    }
    const parsed = Number(match[1].replace(",", "."));
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  function create(def, componentContext) {
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const valueMath = componentContext.components.require("ValueMath");
    toText = valueMath.toText;
    appendUnitValueMath = valueMath.appendUnit;

    return {
      id: "UnitAwareFormatter",
      formatWithToken: function (value, formatter, token, defaultText) {
        return formatWithToken(value, formatter, token, defaultText, componentContext, placeholderNormalize);
      },
      formatDistance: function (value, token, defaultText) {
        return formatDistance(value, token, defaultText, componentContext, placeholderNormalize);
      },
      appendUnit: appendUnitValueMath,
      extractNumericDisplay: extractNumericDisplay
    };
  }

  return {
    id: "UnitAwareFormatter",
    create: create
  };
}));
