import {
  asGlobal,
  collectFileScopeConstantBooleans,
  countIdentifierReferences,
  escapeRegex,
  getFileData,
  lineAt
} from "./shared.mjs";
import { collectStaticStringConstants, parseAst, staticMemberName, staticStringValue, walkAst } from "./ast-utils.mjs";

const RENDERER_NUMERIC_COERCION_ALLOWLIST = {
  // "widgets/example.js": new Set(["thresholdProp"])
};

const UNSAFE_SINK_ASSIGNMENT_ALLOWLIST = {
  "shared/widget-kits/html/HtmlDomPatchUtils.js": [
    htmlAssignment("patchInnerHtml", "rootEl.innerHTML"),
    htmlAssignment("patchInnerHtml", "template.innerHTML")
  ],
  "plugin.js": resourceAssignments("loadScriptOnce", "scriptEl"),
  "plugin.mjs": resourceAssignments("loadScriptOnce", "scriptEl"),
  "runtime/plugin-bootstrap-core.js": [
    ...resourceAssignments("loadScriptOnceById", "scriptEl"),
    ...resourceAssignments("loadCssOnceById", "linkEl")
  ],
  "runtime/asset-preloader.js": resourceAssignments("loadImage", "img")
};

const HTML_ASSIGNMENT_SINKS = new Set(["innerHTML", "outerHTML"]);
const INLINE_HANDLER_NAME = /^on[a-z][a-z0-9_-]*$/i;

export function runUnsafeHtmlDomSinkRule(rule, files) {
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const ast = parseAst(file, data.text);
    const constants = collectStaticStringConstants(ast);
    const allowCounts = new Map();

    walkAst(ast, function (node, _parent, _parentKey, ancestors) {
      const sinkName = unsafeSinkName(node, constants);
      if (!sinkName) return;
      if (isAllowedSinkAssignment(file, node, ancestors, constants, allowCounts)) return;
      const line = node.loc.start.line;
      const key = `${file}:${line}:${sinkName}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({ file, line, sinkName })
      });
    });
  }

  return out;
}

function htmlAssignment(owner, target) {
  return { owner, target, rhs: "markup", count: 1 };
}

function resourceAssignments(owner, target) {
  return [
    { owner, target: `${target}.onload`, rhs: "function", count: 1 },
    { owner, target: `${target}.onerror`, rhs: "function", count: 1 }
  ];
}

function isAllowedSinkAssignment(file, node, ancestors, constants, counts) {
  if (node.type !== "AssignmentExpression" || node.operator !== "=" || node.left.type !== "MemberExpression") {
    return false;
  }
  if (node.left.object.type !== "Identifier") return false;
  const target = `${node.left.object.name}.${staticMemberName(node.left, constants)}`;
  const spec = UNSAFE_SINK_ASSIGNMENT_ALLOWLIST[file]?.find(function (candidate) {
    return (
      candidate.target === target && ownsAssignment(ancestors, candidate.owner) && matchesAllowedRhs(node, candidate)
    );
  });
  if (!spec) return false;
  const key = `${spec.owner}:${spec.target}`;
  const count = (counts.get(key) || 0) + 1;
  counts.set(key, count);
  return count <= spec.count;
}

function ownsAssignment(ancestors, owner) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type === "FunctionDeclaration") return ancestor.id?.name === owner;
  }
  return false;
}

function matchesAllowedRhs(node, spec) {
  if (spec.rhs === "markup") return node.right.type === "Identifier" && node.right.name === "markup";
  return node.right.type === "FunctionExpression" || node.right.type === "ArrowFunctionExpression";
}

function unsafeSinkName(node, constants) {
  if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
    const memberName = staticMemberName(node.left, constants);
    if (HTML_ASSIGNMENT_SINKS.has(memberName)) return memberName;
    if (INLINE_HANDLER_NAME.test(memberName || "")) return "inline event-handler assignment";
    return undefined;
  }

  if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") return undefined;
  const memberName = staticMemberName(node.callee, constants);
  if (memberName === "insertAdjacentHTML") return memberName;
  if ((memberName === "write" || memberName === "writeln") && isDocumentReference(node.callee.object)) {
    return "document.write";
  }
  if (
    memberName === "setAttribute" &&
    INLINE_HANDLER_NAME.test(staticStringValue(node.arguments[0], constants) || "")
  ) {
    return "inline event-handler assignment";
  }
  return undefined;
}

function isDocumentReference(node) {
  if (node.type === "Identifier") return node.name === "document";
  return node.type === "MemberExpression" && staticMemberName(node) === "document";
}

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

export function runLegacyComponentLoaderApiRule(rule, files) {
  const out = [];
  const detect =
    /\b(?:runtime\.createHelpers|runtime\.createComponentContext|Helpers\.getModule|componentContext\.components\.get)\b/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
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
          expression: match[0]
        })
      });
    }
  }

  return out;
}

export function runRuntimeReachThroughRule(rule, files) {
  const out = [];
  const detect =
    /\bruntime\.(?:theme|format|canvas|dom|perf|hostActions|surfaces|componentLoader|clusterShellRenderer|routeActivation)\b/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
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
          expression: match[0]
        })
      });
    }
  }

  return out;
}
