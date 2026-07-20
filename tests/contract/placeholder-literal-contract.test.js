const fs = require("node:fs");
const path = require("node:path");

const SOURCE_ROOTS = ["cluster", "shared/widget-kits", "widgets"];
const ALLOWED_PLACEHOLDER_OWNERS = new Set([
  "shared/widget-kits/format/PlaceholderNormalize.js",
  "shared/widget-kits/nav/RoutePointsRenderModel.js"
]);
const BANNED_PLACEHOLDERS = new Set(["NO DATA", "--:--", "--:--:--", "-----"]);

describe("placeholder literal source contract", function () {
  it("keeps banned placeholder literals centralized", function () {
    expect(scanRepository()).toEqual([]);
  });

  it("rejects legacy placeholder text in widget source", function () {
    const findings = validateSource(
      "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
      "function render() { return 'NO DATA'; }"
    );

    expect(findings).toContain(
      'widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js:1 Forbidden placeholder literal "NO DATA" found.'
    );
  });

  it("rejects dash-only placeholder literals outside owners", function () {
    const findings = validateSource(
      "shared/widget-kits/nav/EditRouteRenderModel.js",
      "function render() { return '---'; }"
    );

    expect(findings).toContain(
      'shared/widget-kits/nav/EditRouteRenderModel.js:1 Dash-only string literal "---" is forbidden.'
    );
  });

  it("allows centralized placeholder owners", function () {
    const findings = validateSource(
      "shared/widget-kits/format/PlaceholderNormalize.js",
      "function placeholder() { return '---'; }"
    );

    expect(findings).toEqual([]);
  });
});

function scanRepository() {
  return collectSourceFiles(SOURCE_ROOTS).flatMap(function (rel) {
    return validateSource(rel, fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
  });
}

/** @param {string} rel @param {string} text */
function validateSource(rel, text) {
  if (ALLOWED_PLACEHOLDER_OWNERS.has(rel)) return [];
  return findStringLiterals(text).flatMap(function (literal) {
    return validateLiteral(rel, literal);
  });
}

/** @param {string} rel @param {{ line: number, value: string }} literal */
function validateLiteral(rel, literal) {
  const trimmed = literal.value.trim();
  if (BANNED_PLACEHOLDERS.has(trimmed)) {
    return [rel + ":" + literal.line + ' Forbidden placeholder literal "' + trimmed + '" found.'];
  }
  if (/^-{2,}$/.test(trimmed)) {
    return [rel + ":" + literal.line + ' Dash-only string literal "' + trimmed + '" is forbidden.'];
  }
  return [];
}

/** @param {string} text */
function findStringLiterals(text) {
  const out = /** @type {Array<{ line: number, value: string }>} */ ([]);
  const re = /(["'])([^"'\\\n]*(?:\\.[^"'\\\n]*)*)\1/g;
  let match;
  while ((match = re.exec(text))) {
    out.push({
      line: lineFromIndex(text, match.index),
      value: unescapeString(match[2])
    });
  }
  return out;
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

/** @param {string} text @param {number} index */
function lineFromIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

/** @param {string} value */
function unescapeString(value) {
  return value.replace(/\\(['"\\nrtbfv])/g, function (/** @type {string} */ _, /** @type {string} */ ch) {
    switch (ch) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "v":
        return "\v";
      case "'":
        return "'";
      case '"':
        return '"';
      case "\\":
        return "\\";
      default:
        return ch;
    }
  });
}
