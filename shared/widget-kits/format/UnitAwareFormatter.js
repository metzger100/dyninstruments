/**
 * Module: UnitAwareFormatter - Shared formatter helpers for unit-token rendering
 * Documentation: documentation/architecture/component-system.md
 * Depends: PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniUnitAwareFormatter = factory(); }
}(this, function () {
  "use strict";

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function formatWithToken(value, formatter, token, defaultText, Helpers, placeholderNormalize) {
    const formatted = Helpers.applyFormatter(value, {
      formatter: formatter,
      formatterParameters: [token],
      default: defaultText
    });
    return placeholderNormalize.normalize(formatted == null ? defaultText : String(formatted).trim(), defaultText);
  }

  function formatDistance(value, token, defaultText, Helpers, placeholderNormalize) {
    return formatWithToken(value, "formatDistance", token, defaultText, Helpers, placeholderNormalize);
  }

  function appendUnit(valueText, displayUnit, defaultText) {
    const text = toText(valueText) || toText(defaultText);
    const unit = displayUnit == null ? "" : String(displayUnit);
    return unit ? text + unit : text;
  }

  function extractNumericDisplay(valueText, fallback) {
    const text = toText(valueText).trim();
    const match = text.match(/^([+-]?(?:\d+(?:[.,]\d+)?|\.\d+))/);
    if (!match) {
      return fallback;
    }
    const parsed = Number(match[1].replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function create(def, Helpers) {
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    return {
      id: "UnitAwareFormatter",
      formatWithToken: function (value, formatter, token, defaultText) {
        return formatWithToken(value, formatter, token, defaultText, Helpers, placeholderNormalize);
      },
      formatDistance: function (value, token, defaultText) {
        return formatDistance(value, token, defaultText, Helpers, placeholderNormalize);
      },
      appendUnit: appendUnit,
      extractNumericDisplay: extractNumericDisplay
    };
  }

  return {
    id: "UnitAwareFormatter",
    create: create
  };
}));
