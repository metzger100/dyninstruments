/**
 * @file DepthDisplayFormatter - Shared depth formatter helper for unit-aware numeric extraction
 * Documentation: documentation/architecture/component-system.md
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

  /**
   * @param {DyniDepthDisplayProps | undefined} props
   * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
   * @returns {unknown}
   */
  function resolveDefaultText(props, placeholderNormalize) {
    if (props && hasOwn.call(props, "default")) {
      return props.default;
    }
    return placeholderNormalize.normalize(undefined, undefined);
  }

  /**
   * @param {unknown} raw
   * @param {DyniDepthDisplayProps | undefined} props
   * @param {DyniUnitAwareFormatterApi} unitFormatter
   * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
   * @param {DyniValueMathApi} valueMath
   * @returns {DyniDepthDisplayResult}
   */
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

  /**
   * @param {DyniDepthDisplayResult} display
   * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
   * @returns {{ num: number, text: string }}
   */
  function normalizeCanvasDisplay(display, placeholderNormalize) {
    return { num: display.num, text: placeholderNormalize.normalize(display.text, undefined) };
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniDepthDisplayFormatterApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");

    return {
      id: "DepthDisplayFormatter",
      /**
       * @param {unknown} raw
       * @param {DyniDepthDisplayProps | undefined} props
       * @param {DyniUnitAwareFormatterApi} unitFormatter
       * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
       * @returns {DyniDepthDisplayResult}
       */
      formatDisplay: function (raw, props, unitFormatter, placeholderNormalize) {
        return formatDisplay(raw, props, unitFormatter, placeholderNormalize, valueMath);
      },
      /**
       * @param {DyniUnitAwareFormatterApi} unitFormatter
       * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
       * @returns {DyniDepthFormat}
       */
      createFormatDisplay: function (unitFormatter, placeholderNormalize) {
        /**
         * @param {unknown} raw
         * @param {DyniDepthDisplayProps} [props]
         * @returns {DyniDepthDisplayResult}
         */
        return function (raw, props) {
          return formatDisplay(raw, props, unitFormatter, placeholderNormalize, valueMath);
        };
      },
      /**
       * @param {DyniUnitAwareFormatterApi} unitFormatter
       * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
       * @returns {(raw: unknown, props?: DyniDepthDisplayProps) => { num: number, text: string }}
       */
      createCanvasFormatDisplay: function (unitFormatter, placeholderNormalize) {
        return function (raw, props) {
          return normalizeCanvasDisplay(
            formatDisplay(raw, props, unitFormatter, placeholderNormalize, valueMath),
            placeholderNormalize
          );
        };
      }
    };
  }

  return { id: "DepthDisplayFormatter", create: create };
}));
