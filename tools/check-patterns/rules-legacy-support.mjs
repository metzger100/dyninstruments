// Legacy-support project rule family: canonical-helper redefinition outside the owner module
// and editable ratio/threshold internal-flag drift. Speculative compat/legacy naming and
// paranoid member fallbacks are owned by the generic premature-legacy-support rule.

import { findMatchingBrace, getFileData, lineAt } from "./shared.mjs";

/** @typedef {import("./shared.mjs").Rule} Rule */

/** @type {Record<string, string>} */
const CANONICAL_HELPERS = {
  // ValueMath
  toObject: "ValueMath",
  toText: "ValueMath",
  clampNumber: "ValueMath",
  isObject: "ValueMath",
  toSafeInteger: "ValueMath",
  hasText: "ValueMath",
  toFiniteNumber: "ValueMath",
  toOptionalFiniteNumber: "ValueMath",
  isFiniteNumber: "ValueMath",
  trimText: "ValueMath",
  textLength: "ValueMath",
  lerp: "ValueMath",
  appendUnit: "ValueMath",
  keyToText: "ValueMath",
  // HtmlMeasureUtils
  parseFontPx: "HtmlMeasureUtils",
  createApproximateMeasureContext: "HtmlMeasureUtils",
  resolveMeasureContext: "HtmlMeasureUtils",
  measurePx: "HtmlMeasureUtils",
  measureStyle: "HtmlMeasureUtils",
  toStyle: "HtmlMeasureUtils",
  resolveOwnerDocument: "HtmlMeasureUtils",
  resolveFitCache: "HtmlMeasureUtils",
  // HtmlWidgetUtils
  resolveSurfacePolicy: "HtmlWidgetUtils",
  escapeHtml: "HtmlWidgetUtils",
  toFontStyle: "HtmlWidgetUtils",
  buildTextOptions: "HtmlWidgetUtils",
  toStyleText: "HtmlWidgetUtils",
  resolveMetricValueFamily: "HtmlWidgetUtils",
  resolveLabelEdgePolicy: "HtmlWidgetUtils",
  toPx: "HtmlWidgetUtils",
  joinStyles: "HtmlWidgetUtils",
  // TextLayoutComposite
  resolveTextFillScale: "TextLayoutComposite",
  clampTextFillScale: "TextLayoutComposite",
  scaleTextCeiling: "TextLayoutComposite",
  resolveOpacity: "TextLayoutComposite",
  resolveCompactGeometryScale: "TextLayoutComposite",
  scaleValueUnitFit: "TextLayoutComposite",
  scaleInlineFit: "TextLayoutComposite",
  // CanvasTextLayout
  resolveFamily: "CanvasTextLayout",
  // TextLayoutEngine
  makeFitCacheKey: "TextLayoutEngine",
  writeFitCache: "TextLayoutEngine",
  readFitCache: "TextLayoutEngine",
  createFitCache: "TextLayoutEngine",
  // CanvasTextFitting
  setFont: "CanvasTextFitting",
  setCanvasFont: "CanvasTextFitting",
  measureTextWidth: "CanvasTextFitting",
  fitSingleTextPx: "CanvasTextFitting",
  // LayoutRectMath
  splitRow: "LayoutRectMath",
  splitStack: "LayoutRectMath",
  // RadialValueMath
  buildValueTickAngles: "RadialValueMath",
  // RadialAngleMath
  valueToAngleFlat: "RadialAngleMath"
};

/** @type {Record<string, string>} */
const OWNER_MODULE_PATHS = {
  ValueMath: "shared/widget-kits/value/ValueMath.js",
  HtmlMeasureUtils: "shared/widget-kits/html/HtmlMeasureUtils.js",
  HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
  TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
  CanvasTextLayout: "shared/widget-kits/text/CanvasTextLayout.js",
  TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
  CanvasTextFitting: "shared/widget-kits/text/CanvasTextFitting.js",
  LayoutRectMath: "shared/widget-kits/layout/LayoutRectMath.js",
  RadialValueMath: "shared/widget-kits/radial/RadialValueMath.js",
  RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js"
};

/** @type {Record<string, Set<string>>} */
const CANONICAL_HELPER_OWNER_EXCEPTIONS = {
  resolveFitCache: new Set(["shared/widget-kits/text/TextLayoutEngine.js"]),
  resolveTextFillScale: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"]),
  clampTextFillScale: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"]),
  scaleTextCeiling: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"]),
  resolveOpacity: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"]),
  resolveCompactGeometryScale: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"]),
  scaleValueUnitFit: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"]),
  scaleInlineFit: new Set(["shared/widget-kits/text/TextLayoutScaleHelpers.js"])
};

const CANONICAL_HELPER_NAMES = Object.keys(CANONICAL_HELPERS).sort(function (a, b) {
  return b.length - a.length || a.localeCompare(b);
});
const CANONICAL_HELPER_DECL_RE = new RegExp(
  String.raw`^\s*function\s+(` + CANONICAL_HELPER_NAMES.join("|") + String.raw`)\s*\(`,
  "gm"
);

/** @param {Rule} rule @param {string[]} files @returns {any[]} */
export function runCanonicalHelperRedefinitionRule(rule, files) {
  const out = [];
  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = CANONICAL_HELPER_DECL_RE.exec(data.maskedText))) {
      const helperName = match[1];
      const ownerModule = CANONICAL_HELPERS[helperName];
      const ownerPath = ownerModule ? OWNER_MODULE_PATHS[ownerModule] : null;
      if (!ownerPath) {
        continue;
      }
      const normalizedFile = normalizePath(file);
      if (normalizedFile === ownerPath) {
        continue;
      }
      const exceptions = CANONICAL_HELPER_OWNER_EXCEPTIONS[helperName];
      if (exceptions && exceptions.has(normalizedFile)) {
        continue;
      }
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${helperName}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          helperName,
          ownerModule,
          ownerPath
        })
      });
    }
  }
  return out;
}

/** @param {Rule} rule @param {string[]} files @returns {any[]} */
export function runEditableThresholdInternalRule(rule, files) {
  const out = [];
  const propertyDecl = /^[ \t]*([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*\{/gm;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = propertyDecl.exec(data.maskedText))) {
      const keyName = match[1];
      if (!/(Ratio|Threshold)/.test(keyName)) {
        continue;
      }

      const openBrace = data.maskedText.indexOf("{", match.index + match[0].length - 1);
      if (openBrace < 0) {
        continue;
      }
      const closeBrace = findMatchingBrace(data.maskedText, openBrace);
      if (closeBrace < 0) {
        continue;
      }

      const body = data.maskedText.slice(openBrace + 1, closeBrace);
      if (/\binternal\s*:\s*true\b/.test(body)) {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const dedupeKey = `${file}:${line}:${keyName}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          keyName
        })
      });
    }
  }

  return out;
}

/** @param {string} value @returns {string} */
function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/");
}
