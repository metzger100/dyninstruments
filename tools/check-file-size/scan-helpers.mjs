// Brace/paren/comma scanning helpers shared by the one-liner detectors.

export function stripTrailingSemicolon(text) {
  return String(text || "")
    .replace(/;\s*$/, "")
    .trim();
}

export function countTopLevelCommas(text) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let count = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (ch === "," && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      count += 1;
    }
  }

  return count;
}

export function countStandaloneAssignments(text) {
  let count = 0;

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "=") continue;

    const prev = text[i - 1] || "";
    const next = text[i + 1] || "";
    if (next === "=" || next === ">") continue;
    if (prev === "=" || prev === "!" || prev === "<" || prev === ">") continue;

    count += 1;
  }

  return count;
}

export function countMatches(text, pattern) {
  const match = text.match(pattern);
  return match ? match.length : 0;
}

export function findMatchingCloseIndex(text, openIndex, openChar, closeChar) {
  if (openIndex < 0 || openIndex >= text.length) return -1;

  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === openChar) {
      depth += 1;
      continue;
    }
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

export function findEnclosingParenRange(text, openIndex, closeIndex) {
  const stack = [];
  let best = null;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      stack.push(i);
      continue;
    }
    if (ch !== ")") continue;

    const openParen = stack.pop();
    if (typeof openParen === "undefined") continue;
    if (openParen > openIndex || i < closeIndex) continue;

    if (!best || openParen >= best.open) {
      best = { open: openParen, close: i };
    }
  }

  return best;
}

export function matchesToken(text, index, token) {
  if (!text.startsWith(token, index)) return false;
  const before = text[index - 1] || "";
  const after = text[index + token.length] || "";
  return !isIdentifierChar(before) && !isIdentifierChar(after);
}

export function skipWhitespace(text, startIndex) {
  let i = startIndex;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  return i;
}

export function skipWhitespaceBackward(text, startIndex) {
  let i = startIndex;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  return i;
}

export function isIdentifierChar(ch) {
  return /[A-Za-z0-9_$]/.test(ch || "");
}

export function maskRegexLiterals(line) {
  let out = "";
  let i = 0;

  while (i < line.length) {
    if (line[i] === "/" && canPrecedeRegexLiteral(out)) {
      const end = findRegexLiteralEnd(line, i);
      if (end > i) {
        out += " ".repeat(end - i);
        i = end;
        continue;
      }
    }
    out += line[i];
    i += 1;
  }

  return out;
}

const REGEX_ALLOWED_KEYWORDS = new Set([
  "return",
  "typeof",
  "instanceof",
  "delete",
  "void",
  "throw",
  "case",
  "do",
  "else",
  "yield",
  "new",
  "in",
  "of"
]);

function canPrecedeRegexLiteral(precedingText) {
  const trimEnd = skipWhitespaceBackward(precedingText, precedingText.length - 1);
  if (trimEnd < 0) return true;
  const lastChar = precedingText[trimEnd];
  if (!isIdentifierChar(lastChar)) return lastChar !== ")" && lastChar !== "]";

  let wordStart = trimEnd;
  while (wordStart >= 0 && isIdentifierChar(precedingText[wordStart])) wordStart -= 1;
  const word = precedingText.slice(wordStart + 1, trimEnd + 1);
  return REGEX_ALLOWED_KEYWORDS.has(word);
}

function findRegexLiteralEnd(line, openIndex) {
  let inCharClass = false;

  for (let i = openIndex + 1; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "[") {
      inCharClass = true;
      continue;
    }
    if (ch === "]") {
      inCharClass = false;
      continue;
    }
    if (ch === "/" && !inCharClass) {
      let end = i + 1;
      while (end < line.length && /[a-z]/i.test(line[end])) end += 1;
      return end;
    }
  }

  return -1;
}
