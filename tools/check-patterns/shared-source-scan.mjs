// Source masking and brace/paren/comma scanning helpers shared across check-patterns rules.

const EXTERNAL_FACTOR_CONTEXT_HINTS = [
  "root.avnav",
  "avnav.api",
  "getComputedStyle",
  "devicePixelRatio",
  "ownerDocument",
  "documentElement"
];

/** @param {string} text @returns {string} */
export function maskCommentsAndStrings(text) {
  let out = "";
  let i = 0;
  let mode = "code";
  let quote = "";

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        out += "  ";
        i += 2;
        mode = "line-comment";
        continue;
      }
      if (ch === "/" && next === "*") {
        out += "  ";
        i += 2;
        mode = "block-comment";
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "`") {
        out += " ";
        i += 1;
        mode = "string";
        quote = ch;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }

    if (mode === "line-comment") {
      if (ch === "\n") {
        out += "\n";
        i += 1;
        mode = "code";
        continue;
      }
      out += " ";
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (ch === "*" && next === "/") {
        out += "  ";
        i += 2;
        mode = "code";
        continue;
      }
      out += ch === "\n" ? "\n" : " ";
      i += 1;
      continue;
    }

    if (mode === "string") {
      if (ch === "\\") {
        out += " ";
        i += 1;
        if (i < text.length) {
          out += text[i] === "\n" ? "\n" : " ";
          i += 1;
        }
        continue;
      }
      if (ch === quote) {
        out += " ";
        i += 1;
        mode = "code";
        quote = "";
        continue;
      }
      out += ch === "\n" ? "\n" : " ";
      i += 1;
    }
  }

  return out;
}

/** @param {string} text @param {number} openIndex @returns {number} */
export function findMatchingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** @param {string} text @param {number} openIndex @returns {number} */
export function findMatchingParen(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** @param {string} maskedText @param {number} start @param {number} end @returns {number} */
export function findTopLevelComma(maskedText, start, end) {
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  for (let i = start; i < end; i += 1) {
    const ch = maskedText[i];
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth -= 1;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth -= 1;
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth -= 1;
      continue;
    }
    if (ch === "," && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      return i;
    }
  }
  return -1;
}

/** @param {string} text @param {number} startIndex @returns {{token: string, end: number}|null} */
export function readLiteralToken(text, startIndex) {
  let i = startIndex;
  while (i < text.length && /\s/.test(text[i])) {
    i += 1;
  }
  if (i >= text.length) {
    return null;
  }

  const quote = text[i];
  if (quote === '"' || quote === "'" || quote === "`") {
    let j = i + 1;
    while (j < text.length) {
      const ch = text[j];
      if (ch === "\\") {
        j += 2;
        continue;
      }
      if (ch === quote) {
        return { token: text.slice(i, j + 1), end: j + 1 };
      }
      j += 1;
    }
    return null;
  }

  const rem = text.slice(i);
  const keyword = /^(?:true|false|null|undefined)\b/.exec(rem);
  if (keyword) {
    return { token: keyword[0], end: i + keyword[0].length };
  }
  const numeric = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i.exec(rem);
  if (numeric) {
    return { token: numeric[0], end: i + numeric[0].length };
  }
  return null;
}

/** @param {string} maskedText @param {number} index @returns {boolean} */
export function isExternalFactorFallbackContext(maskedText, index) {
  const start = Math.max(0, index - 220);
  const end = Math.min(maskedText.length, index + 220);
  const snippet = maskedText.slice(start, end);
  return EXTERNAL_FACTOR_CONTEXT_HINTS.some((hint) => snippet.includes(hint));
}
