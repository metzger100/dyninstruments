const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../helpers/load-umd");

const SOURCE_ROOTS = ["cluster", "shared/widget-kits", "widgets"];
const EXEMPT_SOURCES = new Set([
  "shared/widget-kits/format/PlaceholderNormalize.js",
  "shared/widget-kits/nav/RoutePointsRenderModel.js"
]);
const SENTINEL_TOKENS = ["NaN", "undefined", "null", "Infinity", "-Infinity"];
const APPLY_RE = /componentContext\.format\.applyFormatter\s*\(/g;
const NORMALIZE_RE = /(?:PlaceholderNormalize|placeholderNormalize)\.normalize\s*\(/g;

describe("placeholder normalization contract", function () {
  it("keeps repository formatter call sites paired with placeholder normalization", function () {
    expect(scanRepository()).toEqual([]);
  });

  it("rejects formatter call sites without nearby placeholder normalization", function () {
    const findings = validateSource(
      "shared/widget-kits/nav/EditRouteRenderModel.js",
      [
        "function render(componentContext) {",
        "  const text = componentContext.format.applyFormatter(10, {",
        "    formatter: 'formatDistance',",
        "    default: '---',",
        "  });",
        "  return text;",
        "}"
      ].join("\n")
    );

    expect(findings).toContain(
      "shared/widget-kits/nav/EditRouteRenderModel.js:2 applyFormatter output must be normalized through PlaceholderNormalize nearby."
    );
  });

  it("accepts formatter call sites normalized at the render boundary", function () {
    const findings = validateSource(
      "shared/widget-kits/nav/EditRouteRenderModel.js",
      [
        "function render(componentContext, placeholderNormalize) {",
        "  const text = componentContext.format.applyFormatter(10, {",
        "    formatter: 'formatDistance',",
        "    default: '---',",
        "  });",
        "  return placeholderNormalize.normalize(text, '---');",
        "}"
      ].join("\n")
    );

    expect(findings).toEqual([]);
  });

  it("normalizes JavaScript sentinel formatter strings to default text", function () {
    const api = loadFresh("shared/widget-kits/format/PlaceholderNormalize.js").create();

    expect(sentinelNormalizationFailures(api)).toEqual([]);
  });

  it("rejects placeholder APIs that do not normalize sentinel strings", function () {
    const api = {
      /** @param {any} value */
      normalize(value) {
        return String(value);
      },
      isPlaceholder() {
        return false;
      }
    };

    expect(sentinelNormalizationFailures(api)).toEqual(SENTINEL_TOKENS);
  });
});

function scanRepository() {
  return collectSourceFiles(SOURCE_ROOTS).flatMap(function (rel) {
    return validateSource(rel, fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
  });
}

/** @param {string} rel @param {string} text */
function validateSource(rel, text) {
  if (EXEMPT_SOURCES.has(rel)) return [];
  const applyLines = findLineMatches(text, APPLY_RE);
  if (!applyLines.length) return [];
  const normalizeLines = findLineMatches(text, NORMALIZE_RE);

  return applyLines
    .filter(function (line) {
      return !normalizeLines.some(function (normalizeLine) {
        return Math.abs(normalizeLine - line) <= 12;
      });
    })
    .map(function (line) {
      return rel + ":" + line + " applyFormatter output must be normalized through PlaceholderNormalize nearby.";
    });
}

/** @param {any} api */
function sentinelNormalizationFailures(api) {
  return SENTINEL_TOKENS.filter(function (token) {
    return api.normalize(token, "---") !== "---" || api.isPlaceholder(token) !== true;
  });
}

/** @param {string[]} roots */
function collectSourceFiles(roots) {
  const out = /** @type {string[]} */ ([]);
  roots.forEach(function (relRoot) {
    walkJsFiles(path.join(process.cwd(), relRoot), relRoot, out);
  });
  return out.sort();
}

/** @param {string} absDir @param {string} relDir @param {string[]} out */
function walkJsFiles(absDir, relDir, out) {
  if (!fs.existsSync(absDir)) return;
  fs.readdirSync(absDir, { withFileTypes: true }).forEach(function (entry) {
    const abs = path.join(absDir, entry.name);
    const rel = relDir + "/" + entry.name;
    if (entry.isDirectory()) walkJsFiles(abs, rel, out);
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(rel);
  });
}

/** @param {string} text @param {RegExp} regex */
function findLineMatches(text, regex) {
  const matches = [];
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(text))) {
    matches.push(lineFromIndex(text, match.index));
  }
  return matches;
}

/** @param {string} text @param {number} index */
function lineFromIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}
