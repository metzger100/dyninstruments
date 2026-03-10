import { filesForScope, findMatchingBrace, findMatchingParen, getAtomicityContractCache, getFileData, lineAt, setAtomicityContractCache } from "./shared.mjs";
import {
  findNamedObjectLiterals,
  parseExactLiteral,
  parseObjectLiteral,
  readLiteralObjectGroup,
  readNestedObjectProperty,
  readStringObjectGroup
} from "./atomicity-parser.mjs";

const CONFIG_SCOPE = {
  include: ["config/clusters/*.js"],
  exclude: ["tests/**", "tools/**"]
};

const WIDGET_SCOPE = {
  include: ["widgets/**/*.js"],
  exclude: ["tests/**", "tools/**"]
};

export function getAtomicityContracts() {
  const cached = getAtomicityContractCache();
  if (cached) {
    return cached;
  }

  const contracts = {
    configDefaultsByKey: collectConfigDefaultsByKey(),
    widgetSpecs: collectWidgetSpecs()
  };
  setAtomicityContractCache(contracts);
  return contracts;
}

export function getUniqueConfigDefault(configDefaultsByKey, keyName) {
  const entries = configDefaultsByKey[keyName];
  return Array.isArray(entries) && entries.length === 1 ? entries[0] : null;
}

function collectConfigDefaultsByKey() {
  const out = Object.create(null);
  const configFiles = filesForScope(CONFIG_SCOPE);

  for (const file of configFiles) {
    const data = getFileData(file);
    const editableObjects = findNamedObjectLiterals(data, "editableParameters");

    for (const editableObject of editableObjects) {
      const properties = parseObjectLiteral(data, editableObject.openBrace, editableObject.closeBrace);
      for (const prop of properties) {
        if (!prop.rawValue.startsWith("{")) {
          continue;
        }
        const defaultProp = readNestedObjectProperty(data, prop, "default");
        if (!defaultProp) {
          continue;
        }
        const literal = parseExactLiteral(defaultProp.rawValue);
        if (!literal) {
          continue;
        }

        if (!out[prop.key]) {
          out[prop.key] = [];
        }
        out[prop.key].push({
          key: prop.key,
          file,
          line: prop.line,
          defaultLine: defaultProp.line,
          defaultToken: literal.token
        });
      }
    }
  }

  return out;
}

function collectWidgetSpecs() {
  const out = [];
  const widgetFiles = filesForScope(WIDGET_SCOPE);
  const detect = /\.createRenderer\s*\(/g;

  for (const file of widgetFiles) {
    const data = getFileData(file);
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const openParen = data.maskedText.indexOf("(", match.index + match[0].length - 1);
      if (openParen < 0) {
        continue;
      }
      const closeParen = findMatchingParen(data.maskedText, openParen);
      if (closeParen < 0) {
        continue;
      }

      const argStart = skipWhitespace(data.maskedText, openParen + 1, closeParen);
      if (data.maskedText[argStart] !== "{") {
        continue;
      }
      const argClose = findMatchingBrace(data.maskedText, argStart);
      if (argClose < 0 || argClose > closeParen) {
        continue;
      }

      const props = parseObjectLiteral(data, argStart, argClose);
      out.push({
        file,
        line: lineAt(match.index, data.lineStarts),
        ratioProps: readStringObjectGroup(data, props, "ratioProps"),
        ratioDefaults: readLiteralObjectGroup(data, props, "ratioDefaults"),
        rangeProps: readStringObjectGroup(data, props, "rangeProps"),
        rangeDefaults: readLiteralObjectGroup(data, props, "rangeDefaults"),
        tickProps: readStringObjectGroup(data, props, "tickProps")
      });
    }
  }

  return out;
}

function skipWhitespace(text, start, end) {
  let cursor = start;
  while (cursor < end && /\s/.test(text[cursor])) {
    cursor += 1;
  }
  return cursor;
}
