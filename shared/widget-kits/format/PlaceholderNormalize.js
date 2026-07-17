/**
 * @file PlaceholderNormalize - Shared placeholder normalization for formatter outputs
 * Documentation: documentation/shared/placeholder-normalize.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniPlaceholderNormalize = factory();
  }
}(this, function () {
  "use strict";

  // dyni-lint-disable-next-line hardcoded-runtime-default -- PlaceholderNormalize owns the shared fallback token.
  const DEFAULT_PLACEHOLDER = "---";
  const DASH_ONLY_RE = /^\s*-+\s*$/;
  const PLACEHOLDER_PATTERNS = Object.freeze([
    "--:--",
    "--:--:--",
    "----/--/--",
    "NO DATA" /* dyni-lint-disable-line hardcoded-runtime-default -- PlaceholderNormalize must match the legacy overlay fallback token for cleanup. */
  ]);

  /**
   * @param {unknown} defaultText
   * @returns {string}
   */
  function resolveDefaultText(defaultText) {
    if (typeof defaultText === "string") {
      return defaultText;
    }
    if (defaultText == null) {
      return DEFAULT_PLACEHOLDER;
    }
    return String(defaultText);
  }

  /**
   * @param {unknown} text
   * @returns {boolean}
   */
  function isPlaceholder(text) {
    if (text == null) {
      return true;
    }
    const raw = String(text);
    const trimmed = raw.trim();
    if (!trimmed) {
      return true;
    }
    if (DASH_ONLY_RE.test(raw)) {
      return true;
    }
    if (
      trimmed === "NaN" ||
      trimmed === "undefined" ||
      trimmed === "null" ||
      trimmed === "Infinity" ||
      trimmed === "-Infinity"
    ) {
      return true;
    }
    return PLACEHOLDER_PATTERNS.indexOf(trimmed) >= 0;
  }

  /**
   * @param {unknown} text
   * @param {unknown} defaultText
   * @returns {string}
   */
  function normalize(text, defaultText) {
    if (isPlaceholder(text)) {
      return resolveDefaultText(defaultText);
    }
    return String(text);
  }

  function create() {
    return {
      id: "PlaceholderNormalize",
      normalize: normalize,
      isPlaceholder: isPlaceholder,
      PLACEHOLDER_PATTERNS: PLACEHOLDER_PATTERNS,
      DASH_ONLY_RE: DASH_ONLY_RE
    };
  }

  return {
    id: "PlaceholderNormalize",
    create: create
  };
}));
