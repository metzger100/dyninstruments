const fs = require("node:fs");
const path = require("node:path");

const SOURCE_ROOTS = ["cluster", "shared/widget-kits", "widgets"];
/** @type {Record<string, number>} */
const CANONICAL_RANK = {
  disconnected: 0,
  noRoute: 1,
  noTarget: 2,
  noAis: 3,
  hidden: 4,
  data: 5
};
const AIS_EXCEPTION_KINDS = new Set(["disconnected", "noAis", "data"]);

/**
 * @typedef {{
 *   line: number,
 *   inlineArray: boolean,
 *   kinds: string[],
 *   dataWhenTrue: boolean,
 *   nextIndex: number
 * }} CallSite
 */

describe("state screen precedence call-site contract", function () {
  it("keeps repository pickFirst call sites inline and canonical", function () {
    expect(scanRepository()).toEqual([]);
  });

  it("rejects indirect candidates", function () {
    const findings = validateSource("fixture.js", "return precedence.pickFirst(items);");

    expect(findings).toContain("fixture.js:1 pickFirst() calls must pass an inline array literal.");
  });

  it("rejects missing data catch-all candidates", function () {
    const findings = validateSource(
      "fixture.js",
      "return precedence.pickFirst([{ kind: 'disconnected', when: true }]);"
    );

    expect(findings).toContain("fixture.js:1 pickFirst([...]) must include a data catch-all candidate.");
  });

  it("rejects non-canonical candidate order", function () {
    const findings = validateSource(
      "fixture.js",
      [
        "return precedence.pickFirst([",
        "  { kind: 'noRoute', when: props.routeName === '' },",
        "  { kind: 'disconnected', when: props.disconnect === true },",
        "  { kind: 'data', when: true },",
        "]);"
      ].join("\n")
    );

    expect(findings).toContain(
      "fixture.js:1 disconnected must be the first state-screen candidate unless the AIS hidden exception is used."
    );
  });

  it("allows only the AIS hidden-first exception shape", function () {
    const findings = validateSource(
      "fixture.js",
      [
        "return precedence.pickFirst([",
        "  { kind: 'hidden', when: hidden },",
        "  { kind: 'disconnected', when: disconnected },",
        "  { kind: 'noRoute', when: missingRoute },",
        "  { kind: 'data', when: true },",
        "]);"
      ].join("\n")
    );

    expect(findings).toContain("fixture.js:1 AIS state-screen order must be hidden > disconnected > noAis > data.");
  });
});

function scanRepository() {
  return collectSourceFiles(SOURCE_ROOTS)
    .filter(function (rel) {
      return rel !== "shared/widget-kits/state/StateScreenPrecedence.js";
    })
    .flatMap(function (rel) {
      return validateSource(rel, fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
    });
}

/** @param {string} rel @param {string} text @returns {string[]} */
function validateSource(rel, text) {
  return findPickFirstCallSites(text).flatMap(function (callSite) {
    return validateCallSite(rel, callSite);
  });
}

/** @param {string} rel @param {CallSite} callSite @returns {string[]} */
function validateCallSite(rel, callSite) {
  const findings = [];
  const prefix = rel + ":" + callSite.line + " ";
  if (!callSite.inlineArray) {
    return [prefix + "pickFirst() calls must pass an inline array literal."];
  }
  if (!callSite.kinds.length) {
    return [prefix + "pickFirst([...]) must include at least one kind entry."];
  }

  findings.push(...validateDataCandidate(prefix, callSite));
  findings.push(...validateOrder(prefix, callSite.kinds));
  return findings;
}

/** @param {string} prefix @param {CallSite} callSite @returns {string[]} */
function validateDataCandidate(prefix, callSite) {
  const findings = [];
  const dataIndex = callSite.kinds.indexOf("data");
  if (dataIndex === -1) {
    findings.push(prefix + "pickFirst([...]) must include a data catch-all candidate.");
    return findings;
  }
  if (dataIndex !== callSite.kinds.length - 1) {
    findings.push(prefix + "data must be the last state-screen candidate.");
  }
  if (!callSite.dataWhenTrue) {
    findings.push(prefix + "data must use when: true.");
  }
  return findings;
}

/** @param {string} prefix @param {string[]} kinds @returns {string[]} */
function validateOrder(prefix, kinds) {
  if (kinds[0] === "hidden") return validateAisException(prefix, kinds);
  if (kinds[0] !== "disconnected") {
    return [prefix + "disconnected must be the first state-screen candidate unless the AIS hidden exception is used."];
  }
  return validateCanonicalOrder(prefix, kinds);
}

/** @param {string} prefix @param {string[]} kinds @returns {string[]} */
function validateAisException(prefix, kinds) {
  if (kinds[1] !== "disconnected") {
    return [prefix + "AIS exception requires hidden to be followed immediately by disconnected."];
  }
  const orderFindings = validateCanonicalOrder(prefix, kinds.slice(1));
  const unknown = kinds.slice(1).find(function (kind) {
    return !AIS_EXCEPTION_KINDS.has(kind);
  });
  if (unknown) {
    return [prefix + "AIS state-screen order must be hidden > disconnected > noAis > data."];
  }
  return orderFindings;
}

/** @param {string} prefix @param {string[]} kinds @returns {string[]} */
function validateCanonicalOrder(prefix, kinds) {
  let previousRank = -1;
  for (const kind of kinds) {
    const rank = CANONICAL_RANK[kind];
    if (typeof rank !== "number") {
      return [prefix + "Unknown state-screen kind '" + String(kind) + "'."];
    }
    if (rank < previousRank) {
      return [
        prefix +
          "pickFirst([...]) candidates must follow canonical order disconnected > noRoute > noTarget > noAis > hidden > data."
      ];
    }
    previousRank = rank;
  }
  return [];
}

/** @param {string} text @returns {CallSite[]} */
function findPickFirstCallSites(text) {
  const out = /** @type {CallSite[]} */ ([]);
  let index = 0;
  while ((index = text.indexOf("pickFirst", index)) !== -1) {
    const callSite = readPickFirstCallSite(text, index);
    out.push(callSite);
    index = callSite.nextIndex;
  }
  return out;
}

/** @param {string} text @param {number} index @returns {CallSite} */
function readPickFirstCallSite(text, index) {
  const line = lineFromIndex(text, index);
  let cursor = skipWhitespace(text, index + "pickFirst".length);
  if (text[cursor] !== "(") {
    return {
      line,
      inlineArray: false,
      kinds: [],
      dataWhenTrue: false,
      nextIndex: cursor
    };
  }
  cursor = skipWhitespace(text, cursor + 1);
  if (text[cursor] !== "[") {
    return {
      line,
      inlineArray: false,
      kinds: [],
      dataWhenTrue: false,
      nextIndex: cursor
    };
  }

  const arrayEnd = findMatchingBracket(text, cursor, "[", "]");
  if (arrayEnd === -1) return emptyInlineCall(line, cursor + 1);
  const callTail = skipWhitespace(text, arrayEnd + 1);
  if (text[callTail] !== ")") return emptyInlineCall(line, arrayEnd + 1);

  const arrayText = text.slice(cursor, arrayEnd + 1);
  return {
    line,
    inlineArray: true,
    kinds: Array.from(arrayText.matchAll(/kind:\s*["']([^"']+)["']/g)).map(function (match) {
      return match[1];
    }),
    dataWhenTrue: /kind:\s*["']data["'][\s\S]*?when:\s*true/.test(arrayText),
    nextIndex: arrayEnd + 1
  };
}

/** @param {number} line @param {number} nextIndex @returns {CallSite} */
function emptyInlineCall(line, nextIndex) {
  return { line, inlineArray: true, kinds: [], dataWhenTrue: false, nextIndex };
}

/** @param {string[]} roots @returns {string[]} */
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

/** @param {string} text @param {number} startIndex @param {string} openChar @param {string} closeChar @returns {number} */
function findMatchingBracket(text, startIndex, openChar, closeChar) {
  let depth = 0;
  for (let i = startIndex; i < text.length; i += 1) {
    if (text[i] === openChar) depth += 1;
    else if (text[i] === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** @param {string} text @param {number} index @returns {number} */
function skipWhitespace(text, index) {
  let i = index;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  return i;
}

/** @param {string} text @param {number} index @returns {number} */
function lineFromIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}
