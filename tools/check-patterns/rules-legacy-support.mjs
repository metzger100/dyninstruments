// Legacy-support rule family: speculative compat/legacy naming, canonical-helper
// redefinition outside the owner module, and editable ratio/threshold internal-flag drift.

import { findMatchingBrace, getFileData, lineAt } from "./shared.mjs";

const PREMATURE_MEMBER_OR_FUNCTION_RE =
  /([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\|\|\s*function\s*\(/g;
const PREMATURE_MEMBER_OR_MEMBER_RE =
  /([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\|\|\s*\1\.([A-Za-z_$][A-Za-z0-9_$]*)/g;

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

const PREMATURE_LEGACY_SUPPORT_ALLOWLIST = {
  // runtime/theme/token-catalog.js and runtime/theme/resolver.js implement the
  // documented, permanent deprecated-CSS-alias contract (Regatta camelCase input
  // vars) so existing user.css files keep working; the "deprecated..." naming here
  // correctly describes required backward compatibility, not speculative support.
  "runtime/theme/token-catalog.js": new Set(["deprecatedInputVar"]),
  "runtime/theme/resolver.js": new Set(["deprecatedAliasInputVar"])
};

export function runPrematureLegacySupportRule(rule, files) {
  const out = [];
  const functionDecl = /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)/g;
  const variableDecl = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  const compatibilityExpr = /\btypeof\s+([A-Za-z_$][A-Za-z0-9_$.]+)\s*!==\s*["']undefined["']\s*\?\s*\1\s*:/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const allowlisted = PREMATURE_LEGACY_SUPPORT_ALLOWLIST[file] || new Set();
    let match;

    while ((match = functionDecl.exec(data.maskedText))) {
      const line = lineAt(match.index, data.lineStarts);
      const params = match[2]
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
      const allNames = [match[1]].concat(params);
      for (const name of allNames) {
        if (!/(legacy|compat|deprecated|fallback)/i.test(name) || allowlisted.has(name)) {
          continue;
        }
        const key = `${file}:${line}:${name}`;
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
            expression: name
          })
        });
      }
    }

    while ((match = variableDecl.exec(data.maskedText))) {
      const name = match[1];
      if (!/(legacy|compat|deprecated|fallback)/i.test(name) || allowlisted.has(name)) {
        continue;
      }
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${name}`;
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
          expression: name
        })
      });
    }

    while ((match = compatibilityExpr.exec(data.maskedText))) {
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${match[1]}`;
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
          expression: `${match[1]} ?? compat-source`
        })
      });
    }

    if (normalizePath(file) !== "runtime/namespace.js") {
      while ((match = PREMATURE_MEMBER_OR_FUNCTION_RE.exec(data.maskedText))) {
        if (!isLikelyFunctionMemberName(match[2])) {
          continue;
        }
        const line = lineAt(match.index, data.lineStarts);
        const sourceLine = readLineText(data, line);
        if (sourceLine.includes('define === "function"')) {
          continue;
        }
        const expression = `${match[1]}.${match[2]} || function(...)`;
        const key = `${file}:${line}:${expression}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        out.push({
          file,
          line,
          severity: "block",
          message: rule.message({
            file,
            line,
            expression
          })
        });
      }

      while ((match = PREMATURE_MEMBER_OR_MEMBER_RE.exec(data.maskedText))) {
        if (!isLikelyFunctionMemberName(match[2]) || !isLikelyFunctionMemberName(match[3])) {
          continue;
        }
        const line = lineAt(match.index, data.lineStarts);
        const sourceLine = readLineText(data, line);
        if (sourceLine.includes('define === "function"')) {
          continue;
        }
        const expression = `${match[1]}.${match[2]} || ${match[1]}.${match[3]}`;
        const key = `${file}:${line}:${expression}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        out.push({
          file,
          line,
          severity: "block",
          message: rule.message({
            file,
            line,
            expression
          })
        });
      }
    }
  }

  return out;
}

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

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function readLineText(data, line) {
  const start = data.lineStarts[Math.max(0, line - 1)] || 0;
  const end = line < data.lineStarts.length ? data.lineStarts[line] - 1 : data.text.length;
  return data.text.slice(start, end);
}

function isLikelyFunctionMemberName(name) {
  return /^(to|is|has|resolve|build|measure|set|fit|format|append|read|write|create|make|clamp|scale|split|valueTo|angleTo|normalize)[A-Z_]/.test(
    String(name || "")
  );
}
