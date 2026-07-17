/**
 * @file StableDigits - Shared numeric decomposition for fixed-width digit rendering
 * Documentation: documentation/shared/stable-digits.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniStableDigits = factory();
  }
}(this, function () {
  "use strict";

  /**
   * @typedef {{
   *   signActual: string,
   *   integer: string,
   *   dot: string,
   *   fraction: string,
   *   parsedSuffix: string
   * }} StableDigitParts
   */

  const hasOwn = Object.prototype.hasOwnProperty;
  const NUMBER_PARTS_RE = new RegExp(
    "^\\s*([+-]?)(\\d+)(?:[.,](\\d+))?\\s*(.*?)\\s*$"
  );

  /** @type {(value: unknown) => string} */
  let toText = String;

  /** @param {unknown} value @returns {number} */
  function toIntegerWidth(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      return 0;
    }
    return Math.floor(n);
  }

  /**
   * @param {unknown} textValue
   * @param {unknown} minWidth
   * @param {unknown} rangeMax
   * @returns {number}
   */
  function resolveIntegerWidth(textValue, minWidth, rangeMax) {
    const match = toText(textValue).match(/^\s*[+-]?(\d+)/);
    const digits = match ? match[1].length : 0;
    const min = toIntegerWidth(minWidth);
    const rangeNumber = Number(rangeMax);
    const rangeDigits = Number.isFinite(rangeNumber)
      ? Math.max(1, String(Math.floor(Math.abs(rangeNumber))).length)
      : 0;
    return Math.max(min, digits, rangeDigits);
  }

  /** @param {unknown} rawSuffix @param {unknown} defaultSuffix @returns {string} */
  function resolveSuffix(rawSuffix, defaultSuffix) {
    const text = toText(rawSuffix);
    return text ? text : toText(defaultSuffix);
  }

  /** @param {DyniStableDigitsOptions | undefined} options @returns {string} */
  function resolveSideSuffix(options) {
    if (!options || !hasOwn.call(options, "sideSuffix")) {
      return "";
    }
    const raw = toText(options.sideSuffix);
    return raw ? raw.charAt(0) : "";
  }

  /** @param {StableDigitParts} parts @param {string} suffix @returns {string} */
  function buildPlain(parts, suffix) {
    return parts.signActual + parts.integer + parts.dot + parts.fraction + suffix;
  }

  /**
   * @param {StableDigitParts} parts
   * @param {string} suffix
   * @param {boolean} reserveSignSlot
   * @param {number} integerWidth
   * @returns {string}
   */
  function buildPadded(parts, suffix, reserveSignSlot, integerWidth) {
    const sign = parts.signActual || (reserveSignSlot ? " " : "");
    const integer = integerWidth > 0 && parts.integer.length < integerWidth
      ? parts.integer.padStart(integerWidth, "0")
      : parts.integer;
    return sign + integer + parts.dot + parts.fraction + suffix;
  }

  /** @param {unknown} rawText @returns {StableDigitParts | null} */
  function parseParts(rawText) {
    const match = toText(rawText).match(NUMBER_PARTS_RE);
    if (!match) {
      return null;
    }
    const signRaw = match[1] || "";
    const integer = match[2] || "";
    const fraction = match[3] || "";
    return {
      signActual: signRaw === "-" ? "-" : "",
      integer: integer,
      dot: fraction ? "." : "",
      fraction: fraction,
      parsedSuffix: toText(match[4])
    };
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniStableDigitsApi}
   */
  function create(def, componentContext) {
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    toText = componentContext.components.require("ValueMath").toText;

    /**
     * @param {unknown} rawFormattedText
     * @param {DyniStableDigitsOptions} [options]
     * @returns {DyniStableDigitsTextPair}
     */
    function normalize(rawFormattedText, options) {
      const rawText = toText(rawFormattedText);
      if (placeholderNormalize.isPlaceholder(rawText)) {
        return {
          padded: rawText,
          plain: rawText
        };
      }

      const parts = parseParts(rawText);
      if (!parts) {
        return {
          padded: rawText,
          plain: rawText
        };
      }

      /** @type {DyniStableDigitsOptions} */
      const cfg = options && typeof options === "object" ? options : {};
      const integerWidth = toIntegerWidth(cfg.integerWidth);
      const reserveSignSlot = cfg.reserveSignSlot === true;
      const reserveSideSuffixSlot = cfg.reserveSideSuffixSlot === true;
      const sideSuffix = resolveSideSuffix(cfg);
      const suffix = resolveSuffix(cfg.suffix, sideSuffix || parts.parsedSuffix);
      const paddedSuffix = reserveSideSuffixSlot
        ? (sideSuffix || " ")
        : suffix;
      const plain = buildPlain(parts, suffix);
      const padded = buildPadded(parts, paddedSuffix, reserveSignSlot, integerWidth);

      return {
        padded: padded,
        plain: plain
      };
    }

    return {
      id: "StableDigits",
      resolveIntegerWidth: resolveIntegerWidth,
      normalize: normalize
    };
  }

  return {
    id: "StableDigits",
    create: create
  };
}));
