import { compareFindings } from "./shared.mjs";

const CONTROL_FLOW_TOKENS = new Set(["if", "for", "while", "switch", "catch"]);
const KEYWORD_TOKENS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield"
]);

export function tokenizeDuplicationBody(text, startLine) {
  const tokens = [];
  let i = 0;
  let line = startLine;
  const operators = [
    "===",
    "!==",
    ">>>",
    "<<=",
    ">>=",
    "**=",
    "&&=",
    "||=",
    "??=",
    "==",
    "!=",
    "<=",
    ">=",
    "=>",
    "++",
    "--",
    "&&",
    "||",
    "??",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "&=",
    "|=",
    "^=",
    "<<",
    ">>",
    "**",
    "?."
  ];

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\f" || ch === "\v") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      line += 1;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length) {
        if (text[i] === "\n") line += 1;
        if (text[i] === "*" && text[i + 1] === "/") {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === "'" || ch === "\"" || ch === "`") {
      const tokenLine = line;
      const quote = ch;
      let raw = ch;
      i += 1;
      while (i < text.length) {
        const cur = text[i];
        raw += cur;
        if (cur === "\\") {
          i += 1;
          if (i < text.length) {
            raw += text[i];
            if (text[i] === "\n") line += 1;
            i += 1;
          }
          continue;
        }
        if (cur === "\n") line += 1;
        i += 1;
        if (cur === quote) break;
      }
      tokens.push({ value: raw, type: "string", line: tokenLine });
      continue;
    }

    const numberMatch = text.slice(i).match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?)/);
    if (numberMatch) {
      tokens.push({ value: numberMatch[0], type: "number", line });
      i += numberMatch[0].length;
      continue;
    }

    const identMatch = text.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
    if (identMatch) {
      const value = identMatch[0];
      tokens.push({
        value,
        type: KEYWORD_TOKENS.has(value) ? "keyword" : "identifier",
        line
      });
      i += value.length;
      continue;
    }

    let matchedOperator = "";
    for (const op of operators) {
      if (text.startsWith(op, i)) {
        matchedOperator = op;
        break;
      }
    }
    if (matchedOperator) {
      tokens.push({ value: matchedOperator, type: "operator", line });
      i += matchedOperator.length;
      continue;
    }

    if ("{}()[];:,.+-*/%<>=!?&|^~".includes(ch)) {
      tokens.push({ value: ch, type: "punct", line });
      i += 1;
      continue;
    }

    i += 1;
  }

  return tokens;
}

export function toShapeToken(token) {
  if (token.type === "identifier") return "ID";
  if (token.type === "number") return "NUM";
  if (token.type === "string") return "STR";
  return token.value;
}

export function countControlTokens(tokens) {
  let count = 0;
  for (const token of tokens) {
    if (CONTROL_FLOW_TOKENS.has(token)) count += 1;
  }
  return count;
}

export function countStatementMarkers(tokens) {
  let count = 0;
  for (const token of tokens) {
    if (token === ";") count += 1;
  }
  return count;
}

export function compareDuplicateGroups(a, b) {
  if (a.records.length !== b.records.length) return b.records.length - a.records.length;
  if (a.tokenCount !== b.tokenCount) return b.tokenCount - a.tokenCount;
  const firstA = a.records[0];
  const firstB = b.records[0];
  return compareFindings(firstA, firstB);
}

export function dedupeLocations(locations) {
  const seen = new Set();
  const out = [];
  for (const loc of locations) {
    const key = `${loc.file}:${loc.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(loc);
  }
  return out;
}

export function mergeCloneSegments(segments) {
  if (!segments.length) return [];
  const sorted = [...segments].sort(function (a, b) {
    return a.leftStart - b.leftStart || a.rightStart - b.rightStart;
  });
  const out = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    if (next.leftStart <= current.leftEnd + 1 && next.rightStart <= current.rightEnd + 1) {
      current.leftEnd = Math.max(current.leftEnd, next.leftEnd);
      current.rightEnd = Math.max(current.rightEnd, next.rightEnd);
      continue;
    }
    out.push(current);
    current = { ...next };
  }
  out.push(current);
  return out;
}

export function tokenLineAt(entry, tokenIndex) {
  if (!entry.tokens.length) return entry.line;
  const idx = Math.max(0, Math.min(entry.tokens.length - 1, tokenIndex));
  return entry.tokens[idx].line || entry.line;
}
