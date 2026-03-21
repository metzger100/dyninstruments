import {
  escapeRegex,
  findMatchingParen,
  findTopLevelComma,
  getFileData,
  lineAt
} from "./shared.mjs";

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

const DIRECT_PROFILE_GETMODULE_RE = /Helpers\.getModule\(\s*["'`]ResponsiveScaleProfile["'`]\s*\)/;
const FLOOR_LITERAL_RE = /^(?:[3-9]|[1-9]\d+)(?:\.0+)?$/;
const LAYOUT_CONTEXT_RE = /(?:Math\.(?:floor|ceil|round)|\.(?:h|w)\b|\b(?:rect|box|layout|contentRect|content|track|slot|band|label|caption|value|unit|font|gap|pad|width|height|radius|minDim|safeVp|px|Px|availableWidth|availableHeight|line|fit)\b)/;

function normalizeExpression(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildAliasRegex(alias, method) {
  return new RegExp(`\\b${escapeRegex(alias)}\\.${method}\\s*\\(`);
}

function findResponsiveAlias(text) {
  const match = /\bconst\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*Helpers\.getModule\(\s*["'`]ResponsiveScaleProfile["'`]\s*\)\.create\s*\(/.exec(text);
  return match ? { alias: match[1], index: match.index } : null;
}

function parseFloorLiteral(raw) {
  const token = normalizeExpression(raw);
  if (!FLOOR_LITERAL_RE.test(token)) {
    return null;
  }
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

function looksLikeLayoutContext(expression) {
  return LAYOUT_CONTEXT_RE.test(expression);
}

function collectMathMaxFindings(data) {
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
    if (!(floorValue >= 3)) {
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

function collectClampFindings(data) {
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
    if (!(floorValue >= 3)) {
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

export function runResponsiveLayoutHardFloorRule(rule, files) {
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const findings = collectMathMaxFindings(data).concat(collectClampFindings(data));

    for (const entry of findings) {
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

export function runResponsiveProfileOwnershipRule(rule, files) {
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
            detail: `${spec.label} must resolve ResponsiveScaleProfile directly via Helpers.getModule(...).create(...).`
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

    const match = DIRECT_PROFILE_GETMODULE_RE.exec(data.text);
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
        detail: "Consumer modules must not resolve ResponsiveScaleProfile directly; read layout-owned responsive state instead."
      })
    });
  }

  return out;
}
