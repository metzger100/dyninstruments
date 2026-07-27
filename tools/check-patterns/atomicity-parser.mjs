import { escapeRegex, findMatchingBrace, getFileData, lineAt, readLiteralToken } from "./shared.mjs";

/** @typedef {import("./shared.mjs").FileData} FileData */
/** @typedef {{key: string, keyIndex: number, line: number, valueStart: number, valueEnd: number, rawValue: string}} ObjectLiteralProperty */
/** @typedef {{token: string, type: "string"|"literal", value: string}} ExactLiteral */
/** @typedef {{line: number, rawValue: string, values: Record<string, {value?: string, token: string}>}} ObjectGroupResult */

/** @param {FileData} data @param {string} propertyName @returns {{openBrace: number, closeBrace: number}[]} */
export function findNamedObjectLiterals(data, propertyName) {
  const out = [];
  const detect = new RegExp(`\\b${escapeRegex(propertyName)}\\s*:`, "g");
  let match;

  while ((match = detect.exec(data.maskedText))) {
    let cursor = data.maskedText.indexOf(":", match.index) + 1;
    if (cursor <= 0) {
      continue;
    }
    cursor = skipWhitespace(data.maskedText, cursor, data.maskedText.length);
    if (data.maskedText[cursor] !== "{") {
      continue;
    }
    const closeBrace = findMatchingBrace(data.maskedText, cursor);
    if (closeBrace < 0) {
      continue;
    }
    out.push({
      openBrace: cursor,
      closeBrace: closeBrace
    });
  }

  return out;
}

/** @param {FileData} data @param {number} openBrace @param {number} closeBrace @returns {ObjectLiteralProperty[]} */
export function parseObjectLiteral(data, openBrace, closeBrace) {
  /** @type {ObjectLiteralProperty[]} */
  const properties = [];
  let cursor = openBrace + 1;

  while (cursor < closeBrace) {
    cursor = skipSeparators(data.maskedText, cursor, closeBrace);
    if (cursor >= closeBrace) {
      break;
    }

    if (data.maskedText.startsWith("...", cursor)) {
      cursor = findExpressionEnd(data.maskedText, cursor + 3, closeBrace);
      continue;
    }

    const keyInfo = readPropertyKey(data.text, data.maskedText, cursor);
    if (!keyInfo) {
      cursor += 1;
      continue;
    }

    cursor = skipWhitespace(data.maskedText, keyInfo.end, closeBrace);
    if (data.maskedText[cursor] !== ":") {
      cursor = findExpressionEnd(data.maskedText, cursor, closeBrace);
      continue;
    }

    const valueStart = skipSourceWhitespace(data.text, cursor + 1, closeBrace);
    const valueEnd = findExpressionEnd(data.maskedText, valueStart, closeBrace);
    properties.push({
      key: keyInfo.key,
      keyIndex: keyInfo.index,
      line: lineAt(keyInfo.index, data.lineStarts),
      valueStart,
      valueEnd,
      rawValue: data.text.slice(valueStart, valueEnd).trim()
    });
    cursor = valueEnd + 1;
  }

  return properties;
}

/** @param {FileData} data @param {ObjectLiteralProperty|null} parentProp @param {string} keyName @returns {ObjectLiteralProperty|null} */
export function readNestedObjectProperty(data, parentProp, keyName) {
  if (!parentProp || !parentProp.rawValue.startsWith("{")) {
    return null;
  }
  const nestedClose = findMatchingBrace(data.maskedText, parentProp.valueStart);
  if (nestedClose < 0) {
    return null;
  }
  const nestedProps = parseObjectLiteral(data, parentProp.valueStart, nestedClose);
  return (
    nestedProps.find(function (entry) {
      return entry.key === keyName;
    }) || null
  );
}

/** @param {FileData} data @param {ObjectLiteralProperty[]} props @param {string} groupName @returns {ObjectGroupResult|null} */
export function readStringObjectGroup(data, props, groupName) {
  return readObjectGroup(data, props, groupName, "string");
}

/** @param {FileData} data @param {ObjectLiteralProperty[]} props @param {string} groupName @returns {ObjectGroupResult|null} */
export function readLiteralObjectGroup(data, props, groupName) {
  return readObjectGroup(data, props, groupName, "literal");
}

/** @param {string} rawValue @returns {ExactLiteral|null} */
export function parseExactLiteral(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) {
    return null;
  }

  const literal = readLiteralToken(trimmed, 0);
  if (!literal) {
    return null;
  }
  if (trimmed.slice(literal.end).trim()) {
    return null;
  }

  const token = normalizeToken(literal.token);
  if (/^["'`]/.test(token)) {
    return {
      token,
      type: "string",
      value: token.slice(1, -1)
    };
  }

  return {
    token,
    type: "literal",
    value: token
  };
}

/** @param {string} file @returns {{normal: {token: string, line: number}, flat: {token: string, line: number}}|null} */
export function readDefaultRatioMap(file) {
  let data;
  try {
    data = getFileData(file);
  } catch {
    return null;
  }
  const match = /\bconst\s+DEFAULT_RATIO_DEFAULTS\s*=\s*\{/.exec(data.maskedText);
  if (!match) {
    return null;
  }
  const openBrace = data.maskedText.indexOf("{", match.index);
  if (openBrace < 0) {
    return null;
  }
  const closeBrace = findMatchingBrace(data.maskedText, openBrace);
  if (closeBrace < 0) {
    return null;
  }
  const props = parseObjectLiteral(data, openBrace, closeBrace);
  const normal = props.find(function (entry) {
    return entry.key === "normal";
  });
  const flat = props.find(function (entry) {
    return entry.key === "flat";
  });
  if (!normal || !flat) {
    return null;
  }

  const normalLiteral = parseExactLiteral(normal.rawValue);
  const flatLiteral = parseExactLiteral(flat.rawValue);
  if (!normalLiteral || !flatLiteral) {
    return null;
  }

  return {
    normal: {
      token: normalLiteral.token,
      line: normal.line
    },
    flat: {
      token: flatLiteral.token,
      line: flat.line
    }
  };
}

/** @param {string} file @param {string} constantName @returns {{token: string, line: number}|null} */
export function readConstLiteral(file, constantName) {
  let data;
  try {
    data = getFileData(file);
  } catch {
    return null;
  }
  const detect = new RegExp(`\\bconst\\s+${escapeRegex(constantName)}\\s*=`, "g");
  const match = detect.exec(data.maskedText);
  if (!match) {
    return null;
  }

  const eqIndex = data.maskedText.indexOf("=", match.index);
  if (eqIndex < 0) {
    return null;
  }
  const literal = readLiteralToken(data.text, eqIndex + 1);
  if (!literal) {
    return null;
  }

  return {
    token: normalizeToken(literal.token),
    line: lineAt(match.index, data.lineStarts)
  };
}

/** @param {string} maskedText @returns {Set<string>} */
export function collectFrameworkAliases(maskedText) {
  const out = new Set();
  const detect =
    /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*[^;]*Helpers\.getModule\(\s*["'`][^"'`]+["'`]\s*\)\.create\s*\(/g;
  let match;

  while ((match = detect.exec(maskedText))) {
    out.add(match[1]);
  }

  return out;
}

/** @param {string} token @returns {string} */
export function normalizeToken(token) {
  return String(token || "")
    .replace(/\s+/g, " ")
    .trim();
}

/** @param {FileData} data @param {ObjectLiteralProperty[]} props @param {string} groupName @param {"string"|"literal"} kind @returns {ObjectGroupResult|null} */
function readObjectGroup(data, props, groupName, kind) {
  const prop = props.find(function (entry) {
    return entry.key === groupName;
  });
  if (!prop || !prop.rawValue.startsWith("{")) {
    return null;
  }

  const nestedClose = findMatchingBrace(data.maskedText, prop.valueStart);
  if (nestedClose < 0) {
    return null;
  }
  const nestedProps = parseObjectLiteral(data, prop.valueStart, nestedClose);
  /** @type {Record<string, {value?: string, token: string}>} */
  const values = Object.create(null);

  for (const entry of nestedProps) {
    const literal = parseExactLiteral(entry.rawValue);
    if (!literal) {
      return null;
    }
    if (kind === "string" && literal.type !== "string") {
      return null;
    }
    values[entry.key] = kind === "string" ? { value: literal.value, token: literal.token } : { token: literal.token };
  }

  return {
    line: prop.line,
    rawValue: prop.rawValue,
    values
  };
}

/** @param {string} text @param {string} maskedText @param {number} start @returns {{key: string, index: number, end: number}|null} */
function readPropertyKey(text, maskedText, start) {
  const ch = text[start];
  if (ch === '"' || ch === "'" || ch === "`") {
    const end = findStringEnd(text, start, ch);
    if (end < 0) {
      return null;
    }
    return {
      key: text.slice(start + 1, end),
      index: start,
      end: end + 1
    };
  }

  const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(maskedText.slice(start));
  if (!match) {
    return null;
  }

  return {
    key: match[0],
    index: start,
    end: start + match[0].length
  };
}

/** @param {string} text @param {number} start @param {string} quote @returns {number} */
function findStringEnd(text, start, quote) {
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === quote) {
      return i;
    }
  }
  return -1;
}

/** @param {string} text @param {number} start @param {number} end @returns {number} */
function skipWhitespace(text, start, end) {
  let cursor = start;
  while (cursor < end && /\s/.test(text[cursor])) {
    cursor += 1;
  }
  return cursor;
}

/** @param {string} text @param {number} start @param {number} end @returns {number} */
function skipSourceWhitespace(text, start, end) {
  let cursor = start;
  while (cursor < end && /\s/.test(text[cursor])) {
    cursor += 1;
  }
  return cursor;
}

/** @param {string} text @param {number} start @param {number} end @returns {number} */
function skipSeparators(text, start, end) {
  let cursor = start;
  while (cursor < end && /[\s,]/.test(text[cursor])) {
    cursor += 1;
  }
  return cursor;
}

/** @param {string} maskedText @param {number} start @param {number} limit @returns {number} */
function findExpressionEnd(maskedText, start, limit) {
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = start; i < limit; i += 1) {
    const ch = maskedText[i];
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        return i;
      }
      braceDepth -= 1;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        return i;
      }
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

  return limit;
}
