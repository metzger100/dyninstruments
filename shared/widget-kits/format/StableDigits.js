/**
 * Module: StableDigits - Shared numeric decomposition for fixed-width digit rendering
 * Documentation: documentation/shared/stable-digits.md
 * Depends: PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStableDigits = factory(); }
}(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;
  const NUMBER_PARTS_RE = /^\s*([+-]?)(\d+)(?:[.,](\d+))?\s*(.*?)\s*$/;

  function toText(value) {
    if (value == null) {
      return "";
    }
    return String(value);
  }

  function toIntegerWidth(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      return 0;
    }
    return Math.floor(n);
  }

  function resolveIntegerWidth(textValue, minWidth) {
    const match = toText(textValue).match(/^\s*[+-]?(\d+)/);
    const digits = match ? match[1].length : 0;
    const min = toIntegerWidth(minWidth);
    return Math.max(min, digits);
  }

  function resolveSuffix(rawSuffix, fallbackSuffix) {
    const text = toText(rawSuffix);
    return text ? text : toText(fallbackSuffix);
  }

  function resolveSideSuffix(options) {
    if (!options || !hasOwn.call(options, "sideSuffix")) {
      return "";
    }
    const raw = toText(options.sideSuffix);
    return raw ? raw.charAt(0) : "";
  }

  function buildFallback(parts, suffix) {
    return parts.signActual + parts.integer + parts.dot + parts.fraction + suffix;
  }

  function buildPadded(parts, suffix, reserveSignSlot, integerWidth) {
    const sign = parts.signActual || (reserveSignSlot ? " " : "");
    const integer = integerWidth > 0 && parts.integer.length < integerWidth
      ? parts.integer.padStart(integerWidth, "0")
      : parts.integer;
    return sign + integer + parts.dot + parts.fraction + suffix;
  }

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

  function create(def, Helpers) {
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    function normalize(rawFormattedText, options) {
      const rawText = toText(rawFormattedText);
      if (placeholderNormalize.isPlaceholder(rawText)) {
        return {
          padded: rawText,
          fallback: rawText
        };
      }

      const parts = parseParts(rawText);
      if (!parts) {
        return {
          padded: rawText,
          fallback: rawText
        };
      }

      const cfg = options && typeof options === "object" ? options : {};
      const integerWidth = toIntegerWidth(cfg.integerWidth);
      const reserveSignSlot = cfg.reserveSignSlot === true;
      const reserveSideSuffixSlot = cfg.reserveSideSuffixSlot === true;
      const sideSuffix = resolveSideSuffix(cfg);
      const suffix = resolveSuffix(cfg.suffix, sideSuffix || parts.parsedSuffix);
      const paddedSuffix = reserveSideSuffixSlot
        ? (sideSuffix || " ")
        : suffix;
      const fallback = buildFallback(parts, suffix);
      const padded = buildPadded(parts, paddedSuffix, reserveSignSlot, integerWidth);

      return {
        padded: padded,
        fallback: fallback
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
