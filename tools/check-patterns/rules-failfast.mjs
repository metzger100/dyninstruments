import { findMatchingBrace, findMatchingParen, getFileData, getInvalidLintSuppressions, lineAt } from "./shared.mjs";

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
      const params = match[2]
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
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
      re: new RegExp(
        String.raw`(?:[A-Za-z_$][A-Za-z0-9_$.]*\.)?(?:isFiniteNumber|Number\.isFinite|isFinite)\s*\(\s*(${INTERNAL_SOURCE_EXPR})\s*\)\s*\?`,
        "g"
      ),
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

const HARDCODED_RUNTIME_DEFAULT_ALLOWLIST = {
  // runtime/format-runtime.js's applyFormatter is the documented runtime owner of
  // the generic missing-value placeholder (documentation/shared/helpers.md).
  "runtime/format-runtime.js": new Set(['"---"']),
  // PlaceholderNormalize.js is the canonical owner of the shared fallback token and
  // the legacy overlay "NO DATA" match target (documentation/shared/placeholder-normalize.md).
  "shared/widget-kits/format/PlaceholderNormalize.js": new Set(['"---"', '"NO DATA"'])
};

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
    const allowlisted = HARDCODED_RUNTIME_DEFAULT_ALLOWLIST[file] || new Set();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.re.exec(data.text))) {
        const expression = pattern.build(match);
        if (allowlisted.has(expression)) {
          continue;
        }
        const line = lineAt(match.index, data.lineStarts);
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

const CSS_JS_DEFAULT_DUPLICATION_ALLOWLIST = {
  // runtime/theme/token-catalog.js is the documented canonical semantic owner for
  // theme token/preset metadata (documentation/shared/theme-tokens.md); its own
  // font-stack constant declaration and token-table usage are the canonical
  // definition, not a duplication of some other owner's default.
  "runtime/theme/token-catalog.js": new Set(["DEFAULT_FONT_STACK"]),
  // runtime/theme-runtime.js reads the live CSS-resolved preset name from the
  // documented CSS boundary; it does not hardcode/duplicate a default value.
  "runtime/theme-runtime.js": new Set(['getPropertyValue("--dyni-theme-preset")'])
};

export function runCssJsDefaultDuplicationRule(rule, files) {
  const out = [];
  const themeDefault = /\bdefaultValue\s*:/g;
  const styleFallback =
    /(?:\.color\s*\|\|\s*["'`][^"'`]+["'`]|DEFAULT_FONT_STACK|getPropertyValue\s*\([^)]*--dyni-[^)]*\))/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const allowlisted = CSS_JS_DEFAULT_DUPLICATION_ALLOWLIST[file] || new Set();
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
      if (allowlisted.has(match[0].trim())) {
        continue;
      }
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
