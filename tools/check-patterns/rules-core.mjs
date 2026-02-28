import {
  asGlobal,
  collectFileScopeConstantBooleans,
  countIdentifierReferences,
  escapeRegex,
  getFileData,
  lineAt
} from "./shared.mjs";

const RENDERER_NUMERIC_COERCION_ALLOWLIST = {
  // "widgets/example.js": new Set(["thresholdProp"])
};

export function runRegexRule(rule, files) {
  const out = [];
  for (const file of files) {
    const seenLines = new Set();
    const data = getFileData(file);
    const re = asGlobal(rule.detect);
    let match;
    while ((match = re.exec(data.text))) {
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}`;
      if (seenLines.has(key)) {
        if (match[0].length === 0) re.lastIndex += 1;
        continue;
      }
      seenLines.add(key);
      out.push({ file, line, message: rule.message({ file, line, match }) });
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
  return out;
}

export function runTodoWithoutOwner(rule, files) {
  const valid = /(?:TODO|FIXME|HACK|XXX)\s*\(\s*\w+.*\d{4}/;
  const out = [];
  for (const file of files) {
    const lines = getFileData(file).text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (!rule.detect.test(lines[i])) continue;
      if (valid.test(lines[i])) continue;
      out.push({ file, line: i + 1, message: rule.message({ file, line: i + 1 }) });
    }
  }
  return out;
}

export function runUnusedFallbackRule(rule, files) {
  const out = [];
  const detect = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const name = match[1];
      if (!/fallback/i.test(name)) continue;
      const canonical = name.toLowerCase();
      if (seen.has(canonical)) continue;
      seen.add(canonical);

      const uses = countIdentifierReferences(data.maskedText, name);
      if (uses > 1) continue;

      const line = lineAt(match.index, data.lineStarts);
      out.push({
        file,
        line,
        message: rule.message({ file, line, name })
      });
    }
  }

  return out;
}

export function runDeadCodeRule(rule, files) {
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    const seenLines = new Set();
    const functionDecl = /^\s*function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/gm;
    let match;

    while ((match = functionDecl.exec(data.maskedText))) {
      const name = match[1];
      if (rule.functionAllowlist.includes(name)) continue;

      const references = countIdentifierReferences(data.maskedText, name);
      if (references > 1) continue;

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}`;
      if (seenLines.has(key)) continue;
      seenLines.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          detail: `Function '${name}' is declared but never referenced.`
        })
      });
    }

    const directIf = /\bif\s*\(\s*(true|false)\s*\)/g;
    while ((match = directIf.exec(data.maskedText))) {
      const literal = match[1];
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}`;
      if (seenLines.has(key)) continue;
      seenLines.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          detail: `Condition 'if (${literal})' is constant; one branch is unreachable.`
        })
      });
    }

    const boolConsts = collectFileScopeConstantBooleans(data.maskedText);
    for (const entry of boolConsts) {
      const ifRegex = new RegExp(`\\bif\\s*\\(\\s*(!)?\\s*${escapeRegex(entry.name)}\\s*\\)`, "g");
      let ifMatch;
      while ((ifMatch = ifRegex.exec(data.maskedText))) {
        const negated = !!ifMatch[1];
        const line = lineAt(ifMatch.index, data.lineStarts);
        const key = `${file}:${line}`;
        if (seenLines.has(key)) continue;
        seenLines.add(key);

        const testExpr = negated ? `!${entry.name}` : entry.name;
        const detail = `Condition 'if (${testExpr})' is constant because 'const ${entry.name} = ${entry.value}'.`;
        out.push({
          file,
          line,
          message: rule.message({ file, line, detail })
        });
      }
    }
  }

  return out;
}

export function runDefaultTruthyFallbackRule(rule, files) {
  const out = [];
  const detect = /\b([A-Za-z_$][A-Za-z0-9_$.]*\.default)\s*\|\|/g;

  for (const file of files) {
    const data = getFileData(file);
    const seenLines = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}`;
      if (seenLines.has(key)) continue;
      seenLines.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          expression: match[1] + " || ..."
        })
      });
    }
  }

  return out;
}

export function runFormatterAvailabilityHeuristicRule(rule, files) {
  const out = [];
  const detect = /\b[A-Za-z_$][A-Za-z0-9_$]*\.trim\(\)\s*===\s*String\(\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\)/g;

  for (const file of files) {
    const data = getFileData(file);
    const seenLines = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}`;
      if (seenLines.has(key)) continue;
      seenLines.add(key);
      out.push({
        file,
        line,
        message: rule.message({ file, line })
      });
    }
  }

  return out;
}

export function runRendererNumericCoercionRule(rule, files) {
  const out = [];
  const detect = /\bNumber\s*\(\s*props\.([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:\?\?[^)]*)?\)/g;

  for (const file of files) {
    const allowed = RENDERER_NUMERIC_COERCION_ALLOWLIST[file] || new Set();
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const propName = match[1];
      if (allowed.has(propName)) continue;
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${propName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({ file, line, propName })
      });
    }
  }

  return out;
}
