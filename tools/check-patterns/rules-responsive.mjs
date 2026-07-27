import { escapeRegex, findMatchingParen, findTopLevelComma, getFileData, lineAt } from "./shared.mjs";

/** @typedef {import("./shared.mjs").FileData} FileData */
/** @typedef {import("./shared.mjs").Finding} Finding */
/** @typedef {import("./shared.mjs").Rule} Rule */

const RESPONSIVE_OWNER_SPECS = [
  {
    file: "shared/widget-kits/text/TextLayoutEngine.js",
    label: "TextLayoutEngine",
    requiredMethods: ["computeProfile", "scaleMaxTextPx"]
  },
  {
    file: "shared/widget-kits/nav/CenterDisplayLayout.js",
    label: "CenterDisplayLayout",
    requiredMethods: ["computeProfile", "computeInsetPx"]
  },
  {
    file: "shared/widget-kits/nav/ActiveRouteLayout.js",
    label: "ActiveRouteLayout",
    requiredMethods: ["computeProfile", "computeInsetPx"]
  },
  {
    file: "shared/widget-kits/xte/XteHighwayLayout.js",
    label: "XteHighwayLayout",
    requiredMethods: ["computeProfile", "computeInsetPx"]
  },
  {
    file: "shared/widget-kits/linear/LinearGaugeLayout.js",
    label: "LinearGaugeLayout",
    requiredMethods: ["computeProfile", "computeInsetPx"]
  },
  {
    file: "shared/widget-kits/radial/SemicircleRadialLayout.js",
    label: "SemicircleRadialLayout",
    requiredMethods: ["computeProfile", "computeInsetPx"]
  },
  {
    file: "shared/widget-kits/radial/FullCircleRadialLayout.js",
    label: "FullCircleRadialLayout",
    requiredMethods: ["computeProfile", "computeInsetPx"]
  }
];

const RESPONSIVE_OWNER_BY_FILE = Object.create(null);
for (const spec of RESPONSIVE_OWNER_SPECS) {
  RESPONSIVE_OWNER_BY_FILE[spec.file] = spec;
}

const RESPONSIVE_CONSUMER_FILES = new Set([
  "shared/widget-kits/text/TextLayoutComposite.js",
  "shared/widget-kits/text/TextTileLayout.js",
  "shared/widget-kits/linear/LinearGaugeEngine.js",
  "shared/widget-kits/linear/LinearGaugeTextLayout.js",
  "shared/widget-kits/radial/SemicircleRadialEngine.js",
  "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
  "shared/widget-kits/radial/FullCircleRadialEngine.js",
  "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
  "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
  "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
  "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
  "widgets/text/XteDisplayWidget/XteDisplayWidget.js"
]);

/** @type {Record<string, Set<string>>} */
const RESPONSIVE_HARD_FLOOR_ALLOWLIST = {
  // documentation/shared/text-layout-engine.md documents computeInsets(...) as an
  // intentionally retained low-level non-responsive helper; computeResponsiveInsets(...)
  // is the stable responsive contract every production caller uses instead.
  "shared/widget-kits/text/TextLayoutEngine.js": new Set([
    "Math.max(6, Math.floor(Math.min(W, H) * 0.04))",
    "Math.max(3, Math.floor(Math.min(W, H) * 0.035))",
    "Math.max(6, Math.floor(Math.min(W, H) * 0.06))"
  ])
};

const DIRECT_PROFILE_REQUIRE_RE = /componentContext\.components\.require\(\s*["'`]ResponsiveScaleProfile["'`]\s*\)/;
const FLOOR_LITERAL_RE = /^(?:[3-9]|[1-9]\d+)(?:\.0+)?$/;
const LAYOUT_CONTEXT_RE =
  /(?:Math\.(?:floor|ceil|round)|\.(?:h|w)\b|\b(?:rect|box|layout|contentRect|content|track|slot|band|label|caption|value|unit|font|gap|pad|width|height|radius|minDim|safeVp|px|Px|availableWidth|availableHeight|line|fit)\b)/;

/** @param {string} value @returns {string} */
function normalizeExpression(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

/** @param {string} alias @param {string} method @returns {RegExp} */
function buildAliasRegex(alias, method) {
  return new RegExp(`\\b${escapeRegex(alias)}\\.${method}\\s*\\(`);
}

/** @param {string} text @returns {{alias: string, index: number}|null} */
function findResponsiveAlias(text) {
  const match =
    /\bconst\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*componentContext\.components\.require\(\s*["'`]ResponsiveScaleProfile["'`]\s*\)/.exec(
      text
    );
  return match ? { alias: match[1], index: match.index } : null;
}

/** @param {string} raw @returns {number|null} */
function parseFloorLiteral(raw) {
  const token = normalizeExpression(raw);
  if (!FLOOR_LITERAL_RE.test(token)) {
    return null;
  }
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

/** @param {string} expression @returns {boolean} */
function looksLikeLayoutContext(expression) {
  return LAYOUT_CONTEXT_RE.test(expression);
}

/** @param {FileData} data @returns {{index: number, expression: string}[]} */
function collectMathMaxFindings(data) {
  /** @type {{index: number, expression: string}[]} */
  const out = [];
  const detect = /\bMath\.max\s*\(/g;
  let match;

  while ((match = detect.exec(data.maskedText))) {
    const openParen = data.maskedText.indexOf("(", match.index);
    if (openParen < 0) {
      continue;
    }
    const closeParen = findMatchingParen(data.maskedText, openParen);
    if (closeParen < 0) {
      continue;
    }
    const comma = findTopLevelComma(data.maskedText, openParen + 1, closeParen);
    if (comma < 0) {
      continue;
    }

    const floorValue = parseFloorLiteral(data.text.slice(openParen + 1, comma));
    if (floorValue === null || floorValue < 3) {
      continue;
    }

    const expr = data.text.slice(comma + 1, closeParen);
    if (!looksLikeLayoutContext(expr)) {
      continue;
    }

    out.push({
      index: match.index,
      expression: normalizeExpression(data.text.slice(match.index, closeParen + 1))
    });
  }

  return out;
}

/** @param {FileData} data @returns {{index: number, expression: string}[]} */
function collectClampFindings(data) {
  /** @type {{index: number, expression: string}[]} */
  const out = [];
  const detect = /(?<!\.)\b(?:clamp|clampNumber)\s*\(/g;
  let match;

  while ((match = detect.exec(data.maskedText))) {
    const openParen = data.maskedText.indexOf("(", match.index);
    if (openParen < 0) {
      continue;
    }
    const closeParen = findMatchingParen(data.maskedText, openParen);
    if (closeParen < 0) {
      continue;
    }
    const firstComma = findTopLevelComma(data.maskedText, openParen + 1, closeParen);
    if (firstComma < 0) {
      continue;
    }
    const secondComma = findTopLevelComma(data.maskedText, firstComma + 1, closeParen);
    if (secondComma < 0) {
      continue;
    }

    const expr = data.text.slice(openParen + 1, firstComma);
    const floorValue = parseFloorLiteral(data.text.slice(firstComma + 1, secondComma));
    if (floorValue === null || floorValue < 3) {
      continue;
    }
    if (!looksLikeLayoutContext(expr)) {
      continue;
    }

    out.push({
      index: match.index,
      expression: normalizeExpression(data.text.slice(match.index, closeParen + 1))
    });
  }

  return out;
}

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runResponsiveLayoutHardFloorRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const allowlisted = RESPONSIVE_HARD_FLOOR_ALLOWLIST[file] || new Set();
    const findings = collectMathMaxFindings(data).concat(collectClampFindings(data));

    for (const entry of findings) {
      if (allowlisted.has(entry.expression)) {
        continue;
      }
      const line = lineAt(entry.index, data.lineStarts);
      const key = `${file}:${line}:${entry.expression}`;
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
          expression: entry.expression
        })
      });
    }
  }

  return out;
}

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runResponsiveProfileOwnershipRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];

  for (const file of files) {
    const spec = RESPONSIVE_OWNER_BY_FILE[file];
    const data = getFileData(file);

    if (spec) {
      const aliasInfo = findResponsiveAlias(data.text);
      if (!aliasInfo) {
        out.push({
          file,
          line: 1,
          message: rule.message({
            file,
            line: 1,
            detail: `${spec.label} must resolve ResponsiveScaleProfile directly via componentContext.components.require(...).`
          })
        });
        continue;
      }

      for (const method of spec.requiredMethods) {
        if (buildAliasRegex(aliasInfo.alias, method).test(data.maskedText)) {
          continue;
        }
        const line = lineAt(aliasInfo.index, data.lineStarts);
        out.push({
          file,
          line,
          message: rule.message({
            file,
            line,
            detail: `${spec.label} must call ${aliasInfo.alias}.${method}(...) so responsive compaction stays owned by ResponsiveScaleProfile.`
          })
        });
      }
      continue;
    }

    if (!RESPONSIVE_CONSUMER_FILES.has(file)) {
      continue;
    }

    const match = DIRECT_PROFILE_REQUIRE_RE.exec(data.text);
    if (!match) {
      continue;
    }

    const line = lineAt(match.index, data.lineStarts);
    out.push({
      file,
      line,
      message: rule.message({
        file,
        line,
        detail:
          "Consumer modules must not resolve ResponsiveScaleProfile directly; read layout-owned responsive state instead."
      })
    });
  }

  return out;
}
