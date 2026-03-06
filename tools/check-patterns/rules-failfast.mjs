import {
  findMatchingBrace,
  findMatchingParen,
  getFileData,
  getInvalidLintSuppressions,
  lineAt
} from "./shared.mjs";

const INTERNAL_SOURCE_EXPR = String.raw`(?:cfg|p|props|state|theme|display|parsed|opts|style|st|fit)\.[A-Za-z_$][A-Za-z0-9_$.]*`;

export function runInvalidLintSuppressionRule(rule, files) {
  const out = [];

  for (const file of files) {
    const invalids = getInvalidLintSuppressions(file);
    for (const entry of invalids) {
      out.push({
        file,
        line: entry.line,
        message: rule.message({
          file,
          line: entry.line,
          detail: entry.detail
        })
      });
    }
  }

  return out;
}

export function runCatchFallbackWithoutSuppressionRule(rule, files) {
  const out = [];
  const detect = /catch\s*\([^)]*\)\s*\{/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const openBrace = data.maskedText.indexOf("{", match.index + match[0].length - 1);
      if (openBrace < 0) {
        continue;
      }
      const closeBrace = findMatchingBrace(data.maskedText, openBrace);
      if (closeBrace < 0) {
        continue;
      }
      const body = data.maskedText.slice(openBrace + 1, closeBrace);
      if (/\bthrow\b/.test(body)) {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({ file, line, expression: "catch (...) { ... }" })
      });
    }
  }

  return out;
}

export function runInternalHookFallbackRule(rule, files) {
  const out = [];
  const functionDecl = /\bfunction\s+(normalize[A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)/g;
  const cfgFallback = /\bcfg\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = functionDecl.exec(data.maskedText))) {
      const params = match[2].split(",").map(function (item) {
        return item.trim();
      }).filter(Boolean);
      const hasFallbackParam = params.some(function (name) {
        return /fallback/i.test(name);
      });
      if (!hasFallbackParam) {
        continue;
      }
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${match[1]}`;
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
          expression: `function ${match[1]}(${params.join(", ")})`,
          sourceType: "normalize-helper"
        })
      });
    }

    while ((match = cfgFallback.exec(data.maskedText))) {
      const openParen = data.maskedText.indexOf("(", match.index + match[0].length - 1);
      if (openParen < 0) {
        continue;
      }
      const closeParen = findMatchingParen(data.maskedText, openParen);
      if (closeParen < 0) {
        continue;
      }
      let cursor = closeParen + 1;
      while (cursor < data.maskedText.length && /\s/.test(data.maskedText[cursor])) {
        cursor += 1;
      }
      const operator = data.maskedText.slice(cursor, cursor + 2);
      if (operator !== "||" && operator !== "??") {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${match[1]}:${operator}`;
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
          expression: `cfg.${match[1]}(...) ${operator} ...`,
          sourceType: "cfg-hook-fallback"
        })
      });
    }
  }

  return out;
}

export function runRedundantNullTypeGuardRule(rule, files) {
  const out = [];
  const patterns = [
    {
      re: /\bString\s*\(\s*\(?([A-Za-z_$][A-Za-z0-9_$.]*)\s*==\s*null\s*\)?\s*\?\s*[^:]+:\s*\1\s*\)/g,
      build: function (match) {
        return `String(${match[1]} == null ? ... : ${match[1]})`;
      }
    },
    {
      re: /\bArray\.isArray\s*\(\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\)\s*\?\s*\1\s*:\s*\[\s*\]/g,
      build: function (match) {
        return `Array.isArray(${match[1]}) ? ${match[1]} : []`;
      }
    },
    {
      re: new RegExp(String.raw`(?:[A-Za-z_$][A-Za-z0-9_$.]*\.)?(?:isFiniteNumber|Number\.isFinite|isFinite)\s*\(\s*(${INTERNAL_SOURCE_EXPR})\s*\)\s*\?`, "g"),
      build: function (match) {
        return match[0].trim();
      }
    }
  ];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.re.exec(data.maskedText))) {
        const line = lineAt(match.index, data.lineStarts);
        const key = `${file}:${line}:${pattern.build(match)}`;
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
            expression: pattern.build(match)
          })
        });
      }
    }
  }

  return out;
}

export function runHardcodedRuntimeDefaultRule(rule, files) {
  const out = [];
  const patterns = [
    {
      re: /["'`](?:---|NO DATA)["'`]/g,
      build: function (match) {
        return match[0];
      }
    },
    {
      re: new RegExp(String.raw`\b(${INTERNAL_SOURCE_EXPR})\s*(\|\||\?\?)\s*(\{|\[|["'\`]|-?(?:\d|\.\d))`, "g"),
      build: function (match) {
        return `${match[1]} ${match[2]} ${match[3]}...`;
      }
    }
  ];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.re.exec(data.text))) {
        const line = lineAt(match.index, data.lineStarts);
        const expression = pattern.build(match);
        const key = `${file}:${line}:${expression}`;
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
            expression
          })
        });
      }
    }
  }

  return out;
}

export function runCssJsDefaultDuplicationRule(rule, files) {
  const out = [];
  const themeDefault = /\bdefaultValue\s*:/g;
  const styleFallback = /(?:\.color\s*\|\|\s*["'`][^"'`]+["'`]|DEFAULT_FONT_STACK|getPropertyValue\s*\([^)]*--dyni-[^)]*\))/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    if (data.text.includes("--dyni-")) {
      while ((match = themeDefault.exec(data.maskedText))) {
        const line = lineAt(match.index, data.lineStarts);
        const key = `${file}:${line}:defaultValue`;
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
            expression: "defaultValue: ..."
          })
        });
      }
    }

    while ((match = styleFallback.exec(data.text))) {
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${match[0]}`;
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
          expression: match[0].trim()
        })
      });
    }
  }

  return out;
}

export function runPrematureLegacySupportRule(rule, files) {
  const out = [];
  const functionDecl = /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)/g;
  const variableDecl = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  const compatibilityExpr = /\btypeof\s+([A-Za-z_$][A-Za-z0-9_$.]+)\s*!==\s*["']undefined["']\s*\?\s*\1\s*:/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = functionDecl.exec(data.maskedText))) {
      const line = lineAt(match.index, data.lineStarts);
      const params = match[2].split(",").map(function (item) {
        return item.trim();
      }).filter(Boolean);
      const allNames = [match[1]].concat(params);
      for (const name of allNames) {
        if (!/(legacy|compat|deprecated|fallback)/i.test(name)) {
          continue;
        }
        const key = `${file}:${line}:${name}`;
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
            expression: name
          })
        });
      }
    }

    while ((match = variableDecl.exec(data.maskedText))) {
      const name = match[1];
      if (!/(legacy|compat|deprecated|fallback)/i.test(name)) {
        continue;
      }
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${name}`;
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
          expression: name
        })
      });
    }

    while ((match = compatibilityExpr.exec(data.maskedText))) {
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${match[1]}`;
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
          expression: `${match[1]} ?? compat-source`
        })
      });
    }
  }

  return out;
}
