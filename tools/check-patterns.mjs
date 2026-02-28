#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
let ROOT = process.cwd();
let WARN_MODE = false;
const SKIP_DIRS = new Set([".git", "node_modules", "coverage"]);
const fileCache = new Map();
const scopeCache = new Map();
let clusterPrefixCache = null;
const DUPLICATE_FN_MIN_EXACT_TOKENS = 50;
const DUPLICATE_FN_MIN_SHAPE_TOKENS = 90;
const DUPLICATE_FN_MIN_SHAPE_CONTROL = 2;
const DUPLICATE_FN_MIN_SHAPE_STATEMENTS = 6;
const DUPLICATE_BLOCK_WINDOW = 35;
const DUPLICATE_BLOCK_MIN_TOKENS = 120;
const DUPLICATE_BLOCK_MIN_STATEMENTS = 6;
const ALLOWLISTED_ORCHESTRATION_FUNCTIONS = new Set([
  "create",
  "translateFunction",
  "translate",
  "renderCanvas"
]);
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
const RULES = [
  {
    name: "duplicate-functions",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js"],
      exclude: ["**/tests/**", "**/tools/**"]
    },
    allowlist: [...ALLOWLISTED_ORCHESTRATION_FUNCTIONS],
    run: runDuplicateFunctions,
    message: ({ mode, tokenCount, fileCount, locations }) => {
      const lines = locations.map((loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-fn-body] ${mode} function clone across ${fileCount} files (${tokenCount} tokens):\n${lines}\nExtract shared logic to shared/widget-kits/ to prevent copy-paste drift.`;
    }
  },
  {
    name: "duplicate-block-clones",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js"],
      exclude: ["**/tests/**", "**/tools/**"]
    },
    allowlist: [...ALLOWLISTED_ORCHESTRATION_FUNCTIONS],
    run: runDuplicateBlockClones,
    message: ({ tokenCount, statementCount, locations }) => {
      const lines = locations.map((loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-block] Cross-file cloned function block (${tokenCount} tokens, ${statementCount} statements):\n${lines}\nExtract shared logic to shared/widget-kits/ to keep behavior in one place.`;
    }
  },
  {
    name: "forbidden-globals",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js", "**/tests/**", "**/tools/**"]
    },
    detect: /(?:window\.avnav|(?<!\w)avnav\.api)/g,
    allowlist: [],
    message: ({ file, line }) => `[forbidden-global] ${file}:${line}\nDirect access to 'avnav.api' in widget code. Widgets must use\nHelpers.applyFormatter() instead. The centralized formatter in\nruntime/helpers.js already handles availability checks, try/catch,\nand fallback. See ARCHITECTURE.md boundary rule and core-principles.md #9.`
  },
  {
    name: "empty-catch",
    scope: { include: ["**/*.js"], exclude: ["tests/**", "tools/**"] },
    detect: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    allowlist: [],
    message: ({ file, line }) => `[empty-catch] ${file}:${line}\nEmpty catch block swallows errors silently. Either:\n1. Add a comment explaining why: catch(e) { /* intentional: avnav may be absent */ }\n2. Log the error: catch(e) { console.warn('...', e); }\n3. Use Helpers.applyFormatter() which handles this centrally.\nSee core-principles.md #11.`
  },
  {
    name: "console-in-widgets",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js"]
    },
    detect: /\bconsole\.(log|warn|error)\b/g,
    allowlist: [],
    message: ({ file, line }) => `[console-in-widget] ${file}:${line}\nconsole.log/warn/error in non-runtime code. Only runtime/ and plugin.js\nmay log directly. Remove debug logging before committing.`
  },
  {
    name: "todo-without-owner",
    scope: {
      include: ["**/*.js", "**/*.md"],
      exclude: ["node_modules/**", "README.md", "CONTRIBUTING.md", "ROADMAP.md"]
    },
    detect: /\b(?:TODO|FIXME|HACK|XXX)\b/,
    allowlist: [],
    run: runTodoWithoutOwner,
    message: ({ file, line }) => `[todo-missing-owner] ${file}:${line}\nTODO/FIXME without owner and date. Use format: TODO(name, 2025-06-15): description.\nUndated TODOs become permanent. See conventions/coding-standards.md.`
  },
  {
    name: "unused-fallback",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runUnusedFallbackRule,
    message: ({ file, line, name }) => `[unused-fallback] ${file}:${line}\nFallback symbol '${name}' is declared but never used. Remove stale fallback leftovers from refactors or wire the fallback into active code paths.`
  },
  {
    name: "dead-code",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runDeadCodeRule,
    functionAllowlist: ["create", "translateFunction", "translate", "renderCanvas"],
    message: ({ file, line, detail }) => `[dead-code] ${file}:${line}\n${detail}\nRemove stale refactor leftovers or make branch/function reachable.`
  },
  {
    name: "default-truthy-fallback",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runDefaultTruthyFallbackRule,
    message: ({ file, line, expression }) => `[default-truthy-fallback] ${file}:${line}\nTruthy fallback on '.default' detected (${expression}). This clobbers explicit falsy defaults (\"\", 0, false).\nUse property-presence/nullish semantics instead of '||'.`
  },
  {
    name: "formatter-availability-heuristic",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runFormatterAvailabilityHeuristicRule,
    message: ({ file, line }) => `[formatter-availability-heuristic] ${file}:${line}\nFormatter-availability inferred from output equality to String(raw).\nDo not treat formatted output equal to raw text as formatter failure.`
  },
  {
    name: "renderer-numeric-coercion-without-boundary-contract",
    scope: {
      include: ["widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runRendererNumericCoercionRule,
    message: ({ file, line, propName }) => `[renderer-numeric-coercion-without-boundary-contract] ${file}:${line}\nRenderer coerces mapper-owned prop '${propName}' via Number(props.${propName}).\nNormalize at mapper boundary and pass finite numbers or undefined.`
  },
  {
    name: "mapper-logic-leakage",
    scope: {
      include: ["cluster/mappers/*Mapper.js"],
      exclude: [
        "cluster/mappers/ClusterMapperRegistry.js",
        "cluster/mappers/ClusterMapperToolkit.js",
        "tests/**",
        "tools/**"
      ]
    },
    run: runMapperLogicLeakageRule,
    functionAllowlist: ["create", "translate"],
    message: ({ file, line, detail }) => `[mapper-logic-leakage] ${file}:${line}\n${detail}\nMappers must stay declarative. Move presentation/business logic to renderer modules or ClusterMapperToolkit.`
  },
  {
    name: "cluster-renderer-cluster-prefix",
    scope: {
      include: ["cluster/rendering/*.js"],
      exclude: ["cluster/rendering/ClusterRendererRouter.js", "tests/**", "tools/**"]
    },
    run: runClusterRendererClusterPrefixRule,
    allowlist: [],
    message: ({ file, line, id, prefix }) => `[cluster-renderer-cluster-prefix] ${file}:${line}\nRenderer id '${id}' starts with cluster prefix '${prefix}'.\nUse role-based renderer names in cluster/rendering/ (for example 'DateTimeWidget' instead of '${prefix}${id.slice(prefix.length)}').`
  },
  {
    name: "mapper-output-complexity",
    scope: {
      include: ["cluster/mappers/*Mapper.js"],
      exclude: [
        "cluster/mappers/ClusterMapperRegistry.js",
        "cluster/mappers/ClusterMapperToolkit.js",
        "tests/**",
        "tools/**"
      ]
    },
    run: runMapperOutputComplexityRule,
    message: ({ file, line, propCount, kind }) => `[mapper-output-complexity] ${file}:${line} — Mapper returns ${propCount} properties for kind '${kind}'. If >8 props are needed, consider extracting a dedicated renderer wrapper instead of overloading the target renderer. See the renderer decision rule in the add-new-cluster guide.`
  }
];

const RENDERER_NUMERIC_COERCION_ALLOWLIST = {
  // "widgets/example.js": new Set(["thresholdProp"])
};
export function runPatternCheck(options = {}) {
  ROOT = path.resolve(options.root || process.cwd());
  WARN_MODE = !!options.warnMode;
  fileCache.clear();
  scopeCache.clear();
  clusterPrefixCache = null;

  const findings = [];
  const warnings = [];
  const checkedFiles = new Set();
  const byRule = {};
  const byRuleFailures = {};
  const byRuleWarnings = {};
  for (const rule of RULES) {
    const files = filesForScope(rule.scope);
    for (const file of files) checkedFiles.add(file);
    const run = rule.run || runRegexRule;
    const ruleFindings = run(rule, files)
      .map(function (finding) {
        const severity = finding.severity || rule.severity || "block";
        return {
          ...finding,
          severity: severity
        };
      })
      .sort(compareFindings);
    byRule[rule.name] = ruleFindings.length;
    const ruleFailures = ruleFindings.filter((finding) => finding.severity === "block");
    const ruleWarnings = ruleFindings.filter((finding) => finding.severity === "warn");
    byRuleFailures[rule.name] = ruleFailures.length;
    byRuleWarnings[rule.name] = ruleWarnings.length;
    findings.push(...ruleFailures);
    warnings.push(...ruleWarnings);
  }

  const summary = {
    ok: findings.length === 0,
    warnMode: WARN_MODE,
    checkedFiles: checkedFiles.size,
    failures: findings.length,
    warnings: warnings.length,
    byRule,
    byRuleFailures,
    byRuleWarnings
  };

  if (options.print !== false) {
    if (findings.length || warnings.length) {
      for (const warning of warnings) console.log(warning.message);
      const print = WARN_MODE ? console.log : console.error;
      for (const finding of findings) print(finding.message);
      print("SUMMARY_JSON=" + JSON.stringify(summary));
    }
    else {
      console.log("Pattern check passed.");
      console.log("SUMMARY_JSON=" + JSON.stringify(summary));
    }
  }

  return { summary, findings, warnings };
}
export function runPatternCheckCli(argv = process.argv.slice(2)) {
  const warnMode = argv.includes("--warn");
  const { summary, findings } = runPatternCheck({
    root: process.cwd(),
    warnMode,
    print: true
  });
  if (findings.length && !summary.warnMode) process.exit(1);
  process.exit(0);
}
function runRegexRule(rule, files) {
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
function runDuplicateFunctions(rule, files) {
  const groupsExact = new Map();
  const groupsShape = new Map();
  const functions = extractFunctionsForDuplication(files, new Set(rule.allowlist || []));

  for (const entry of functions) {
    if (entry.tokensExact.length >= DUPLICATE_FN_MIN_EXACT_TOKENS) {
      const key = entry.signatureExact;
      if (!groupsExact.has(key)) {
        groupsExact.set(key, {
          mode: "exact",
          tokenCount: entry.tokensExact.length,
          records: []
        });
      }
      groupsExact.get(key).records.push(entry);
    }
    if (
      entry.tokensShape.length >= DUPLICATE_FN_MIN_SHAPE_TOKENS
      && entry.controlCount >= DUPLICATE_FN_MIN_SHAPE_CONTROL
      && entry.statementCount >= DUPLICATE_FN_MIN_SHAPE_STATEMENTS
    ) {
      const key = entry.signatureShape;
      if (!groupsShape.has(key)) {
        groupsShape.set(key, {
          mode: "shape",
          tokenCount: entry.tokensShape.length,
          records: []
        });
      }
      groupsShape.get(key).records.push(entry);
    }
  }

  const out = [];
  const exactMarkedSignatures = new Set();
  const exactGroups = [...groupsExact.values()]
    .sort(compareDuplicateGroups);
  for (const group of exactGroups) {
    const uniqueFiles = new Set(group.records.map((rec) => rec.file));
    if (uniqueFiles.size < 2) continue;
    const locations = dedupeLocations(group.records.map(function (rec) {
      return { file: rec.file, line: rec.line };
    })).sort(compareFindings);
    for (const rec of group.records) exactMarkedSignatures.add(rec.signatureExact);
    out.push({
      file: locations[0].file,
      line: locations[0].line,
      message: rule.message({
        mode: group.mode,
        tokenCount: group.tokenCount,
        fileCount: uniqueFiles.size,
        locations
      })
    });
  }

  const shapeGroups = [...groupsShape.values()]
    .sort(compareDuplicateGroups);
  for (const group of shapeGroups) {
    const uniqueFiles = new Set(group.records.map((rec) => rec.file));
    if (uniqueFiles.size < 2) continue;

    const exactSignatures = new Set(group.records.map((rec) => rec.signatureExact));
    if (exactSignatures.size === 1 && exactMarkedSignatures.has([...exactSignatures][0])) continue;

    const locations = dedupeLocations(group.records.map(function (rec) {
      return { file: rec.file, line: rec.line };
    })).sort(compareFindings);
    out.push({
      file: locations[0].file,
      line: locations[0].line,
      message: rule.message({
        mode: group.mode,
        tokenCount: group.tokenCount,
        fileCount: uniqueFiles.size,
        locations
      })
    });
  }

  return out;
}
function runDuplicateBlockClones(rule, files) {
  const out = [];
  const functions = extractFunctionsForDuplication(files, new Set(rule.allowlist || []));
  const byId = new Map(functions.map((entry) => [entry.id, entry]));
  const windowGroups = new Map();

  for (const entry of functions) {
    if (entry.tokensExact.length < DUPLICATE_BLOCK_WINDOW) continue;
    for (let i = 0; i <= entry.tokensExact.length - DUPLICATE_BLOCK_WINDOW; i += 1) {
      const key = entry.tokensExact.slice(i, i + DUPLICATE_BLOCK_WINDOW).join(" ");
      if (!windowGroups.has(key)) windowGroups.set(key, []);
      windowGroups.get(key).push({
        id: entry.id,
        file: entry.file,
        start: i,
        end: i + DUPLICATE_BLOCK_WINDOW
      });
    }
  }

  const pairDeltaGroups = new Map();
  for (const matches of windowGroups.values()) {
    if (matches.length < 2) continue;
    for (let i = 0; i < matches.length; i += 1) {
      for (let j = i + 1; j < matches.length; j += 1) {
        const leftRaw = matches[i];
        const rightRaw = matches[j];
        if (leftRaw.file === rightRaw.file) continue;

        let left = leftRaw;
        let right = rightRaw;
        if (left.id > right.id) {
          left = rightRaw;
          right = leftRaw;
        }
        const delta = left.start - right.start;
        const key = `${left.id}:${right.id}:${delta}`;
        if (!pairDeltaGroups.has(key)) {
          pairDeltaGroups.set(key, {
            leftId: left.id,
            rightId: right.id,
            segments: []
          });
        }
        pairDeltaGroups.get(key).segments.push({
          leftStart: left.start,
          leftEnd: left.end,
          rightStart: right.start,
          rightEnd: right.end
        });
      }
    }
  }

  const seen = new Set();
  const sortedGroups = [...pairDeltaGroups.values()]
    .sort(function (a, b) {
      return a.leftId - b.leftId || a.rightId - b.rightId;
    });
  for (const group of sortedGroups) {
    const leftFn = byId.get(group.leftId);
    const rightFn = byId.get(group.rightId);
    if (!leftFn || !rightFn) continue;

    const merged = mergeCloneSegments(group.segments);
    for (const segment of merged) {
      const tokenCount = segment.leftEnd - segment.leftStart;
      if (tokenCount < DUPLICATE_BLOCK_MIN_TOKENS) continue;
      const statementCount = countStatementMarkers(
        leftFn.tokensExact.slice(segment.leftStart, segment.leftEnd)
      );
      if (statementCount < DUPLICATE_BLOCK_MIN_STATEMENTS) continue;

      const leftLine = tokenLineAt(leftFn, segment.leftStart);
      const rightLine = tokenLineAt(rightFn, segment.rightStart);
      const signature = [
        leftFn.file,
        leftLine,
        rightFn.file,
        rightLine,
        tokenCount
      ].join(":");
      if (seen.has(signature)) continue;
      seen.add(signature);
      const locations = [
        { file: leftFn.file, line: leftLine },
        { file: rightFn.file, line: rightLine }
      ].sort(compareFindings);
      out.push({
        file: locations[0].file,
        line: locations[0].line,
        message: rule.message({
          tokenCount,
          statementCount,
          locations
        })
      });
    }
  }

  return out;
}
function extractFunctionsForDuplication(files, allowlist) {
  const out = [];
  const patterns = [
    /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function(?:\s+[A-Za-z_$][A-Za-z0-9_$]*)?\s*\([^)]*\)\s*\{/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>\s*\{/g
  ];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    for (const pattern of patterns) {
      const re = asGlobal(pattern);
      let match;
      while ((match = re.exec(data.maskedText))) {
        const name = match[1];
        if (allowlist.has(name)) continue;
        const braceIndex = data.maskedText.indexOf("{", match.index + match[0].length - 1);
        if (braceIndex < 0) continue;
        const bodyEnd = findMatchingBrace(data.maskedText, braceIndex);
        if (bodyEnd < 0) continue;
        const dedupeKey = `${name}:${match.index}:${braceIndex}:${bodyEnd}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const bodyStart = braceIndex + 1;
        const bodyText = data.text.slice(bodyStart, bodyEnd);
        const bodyStartLine = lineAt(bodyStart, data.lineStarts);
        const tokens = tokenizeDuplicationBody(bodyText, bodyStartLine);
        if (!tokens.length) continue;
        const tokensExact = tokens.map(function (token) { return token.value; });
        const tokensShape = tokens.map(toShapeToken);
        out.push({
          id: -1,
          file,
          name,
          line: lineAt(match.index, data.lineStarts),
          tokens,
          tokensExact,
          tokensShape,
          signatureExact: tokensExact.join(" "),
          signatureShape: tokensShape.join(" "),
          controlCount: countControlTokens(tokensExact),
          statementCount: countStatementMarkers(tokensExact)
        });
        if (match[0].length === 0) re.lastIndex += 1;
      }
    }
  }

  out.sort(function (a, b) {
    return compareFindings(a, b) || a.name.localeCompare(b.name);
  });
  for (let i = 0; i < out.length; i += 1) out[i].id = i + 1;
  return out;
}
function findMatchingBrace(text, openIndex) {
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
function tokenizeDuplicationBody(text, startLine) {
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
function toShapeToken(token) {
  if (token.type === "identifier") return "ID";
  if (token.type === "number") return "NUM";
  if (token.type === "string") return "STR";
  return token.value;
}
function countControlTokens(tokens) {
  let count = 0;
  for (const token of tokens) {
    if (CONTROL_FLOW_TOKENS.has(token)) count += 1;
  }
  return count;
}
function countStatementMarkers(tokens) {
  let count = 0;
  for (const token of tokens) {
    if (token === ";") count += 1;
  }
  return count;
}
function compareDuplicateGroups(a, b) {
  if (a.records.length !== b.records.length) return b.records.length - a.records.length;
  if (a.tokenCount !== b.tokenCount) return b.tokenCount - a.tokenCount;
  const firstA = a.records[0];
  const firstB = b.records[0];
  return compareFindings(firstA, firstB);
}
function dedupeLocations(locations) {
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
function mergeCloneSegments(segments) {
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
function tokenLineAt(entry, tokenIndex) {
  if (!entry.tokens.length) return entry.line;
  const idx = Math.max(0, Math.min(entry.tokens.length - 1, tokenIndex));
  return entry.tokens[idx].line || entry.line;
}
function runTodoWithoutOwner(rule, files) {
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
function runUnusedFallbackRule(rule, files) {
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
function runDeadCodeRule(rule, files) {
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
function runDefaultTruthyFallbackRule(rule, files) {
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
function runFormatterAvailabilityHeuristicRule(rule, files) {
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
function runRendererNumericCoercionRule(rule, files) {
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
function runMapperLogicLeakageRule(rule, files) {
  const out = [];
  const namedFunctionDecl = /^\s*function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/gm;
  const helperFunctionBinding = /^\s*(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:function\b|(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>)/gm;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = namedFunctionDecl.exec(data.maskedText))) {
      const name = match[1];
      if (rule.functionAllowlist.includes(name)) continue;
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          detail: `Mapper declares helper function '${name}'.`
        })
      });
    }

    while ((match = helperFunctionBinding.exec(data.maskedText))) {
      const name = match[1];
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          detail: `Mapper binds helper function '${name}' via variable assignment.`
        })
      });
    }
  }

  return out;
}
function runClusterRendererClusterPrefixRule(rule, files) {
  const out = [];
  const prefixes = getClusterPascalPrefixes();
  if (!prefixes.length) return out;

  for (const file of files) {
    const id = path.basename(file, ".js");
    if (rule.allowlist.includes(id)) continue;
    const prefix = prefixes.find((candidate) => id.startsWith(candidate) && id.length > candidate.length);
    if (!prefix) continue;
    out.push({
      file,
      line: 1,
      message: rule.message({ file, line: 1, id, prefix })
    });
  }

  return out;
}
function runMapperOutputComplexityRule(rule, files) {
  const out = [];
  const translateDecl = /\bfunction\s+translate\s*\([^)]*\)\s*\{/g;
  const returnObject = /\breturn\s*\{/g;
  const kindMatch = /===\s*["']([^"']+)["']/g;

  for (const file of files) {
    const data = getFileData(file);
    let translate;

    while ((translate = translateDecl.exec(data.maskedText))) {
      const open = data.maskedText.indexOf("{", translate.index + translate[0].length - 1);
      if (open < 0) continue;
      const close = findMatchingBrace(data.maskedText, open);
      if (close < 0) continue;
      const bodyStart = open + 1;
      const bodyMasked = data.maskedText.slice(bodyStart, close);
      const kindRanges = collectKindRanges(data, bodyStart, close, kindMatch);
      let returnMatch;

      while ((returnMatch = returnObject.exec(bodyMasked))) {
        const returnIndex = bodyStart + returnMatch.index;
        const objectOpen = returnIndex + returnMatch[0].lastIndexOf("{");
        const objectClose = findMatchingBrace(data.maskedText, objectOpen);
        if (objectClose < 0 || objectClose > close) continue;
        const propCount = countObjectLiteralProperties(data.maskedText, objectOpen, objectClose);
        if (propCount <= 8) continue;
        const line = lineAt(returnIndex, data.lineStarts);
        const kind = inferKindForReturn(kindRanges, returnIndex);
        out.push({
          file,
          line,
          severity: propCount > 12 ? "block" : "warn",
          message: rule.message({
            file,
            line,
            propCount,
            kind
          })
        });
      }
    }
  }

  return out;
}
function collectKindRanges(data, bodyStart, bodyEnd, kindMatch) {
  const out = [];
  const bodyText = data.maskedText.slice(bodyStart, bodyEnd);
  const ifPattern = /\bif\s*\(([^)]*)\)\s*\{/g;
  let match;

  while ((match = ifPattern.exec(bodyText))) {
    const absoluteIf = bodyStart + match.index;
    const open = data.maskedText.indexOf("{", absoluteIf + match[0].length - 1);
    if (open < 0) continue;
    const close = findMatchingBrace(data.maskedText, open);
    if (close < 0 || close > bodyEnd) continue;

    const kinds = [];
    const conditionStart = absoluteIf + match[0].indexOf("(") + 1;
    const conditionEnd = conditionStart + match[1].length;
    const conditionText = data.text.slice(conditionStart, conditionEnd);
    let kind;
    while ((kind = kindMatch.exec(conditionText))) {
      if (!kinds.includes(kind[1])) kinds.push(kind[1]);
    }
    kindMatch.lastIndex = 0;

    if (!kinds.length) continue;
    out.push({
      start: open + 1,
      end: close,
      kinds
    });
  }

  return out;
}
function inferKindForReturn(kindRanges, returnIndex) {
  const candidates = kindRanges.filter((entry) => returnIndex >= entry.start && returnIndex <= entry.end);
  if (!candidates.length) return "unknown";

  candidates.sort(function (a, b) {
    const spanA = a.end - a.start;
    const spanB = b.end - b.start;
    if (spanA !== spanB) return spanA - spanB;
    return b.start - a.start;
  });

  return candidates[0].kinds.join("|");
}
function countObjectLiteralProperties(maskedText, objectOpen, objectClose) {
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let segmentStart = objectOpen + 1;
  let count = 0;

  for (let i = objectOpen + 1; i < objectClose; i += 1) {
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
    if (ch !== "," || braceDepth !== 0 || parenDepth !== 0 || bracketDepth !== 0) continue;
    if (maskedText.slice(segmentStart, i).trim()) count += 1;
    segmentStart = i + 1;
  }

  if (maskedText.slice(segmentStart, objectClose).trim()) count += 1;
  return count;
}
function getClusterPascalPrefixes() {
  if (clusterPrefixCache) return clusterPrefixCache;

  const clustersDir = path.join(ROOT, "config/clusters");
  if (!fs.existsSync(clustersDir)) {
    clusterPrefixCache = [];
    return clusterPrefixCache;
  }

  clusterPrefixCache = fs.readdirSync(clustersDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.basename(entry.name, ".js"))
    .map(function (name) {
      return name
        .split(/[-_]+/)
        .filter(Boolean)
        .map(function (segment) {
          return segment[0].toUpperCase() + segment.slice(1);
        })
        .join("");
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return b.length - a.length || a.localeCompare(b);
    });

  return clusterPrefixCache;
}
function filesForScope(scope) {
  const key = JSON.stringify(scope);
  if (scopeCache.has(key)) return scopeCache.get(key);
  const includes = scope.include.map(globToRegExp);
  const excludes = (scope.exclude || []).map(globToRegExp);
  const roots = [...new Set(scope.include.map(scopeRoot))];
  const candidates = new Map();
  for (const root of roots) {
    walk(path.join(ROOT, root), candidates);
  }
  const files = [...candidates.keys()]
    .filter((file) => includes.some((re) => re.test(file)) && !excludes.some((re) => re.test(file)))
    .sort((a, b) => a.localeCompare(b));
  scopeCache.set(key, files);
  return files;
}
function walk(absPath, out) {
  if (!fs.existsSync(absPath)) return;
  const stat = fs.statSync(absPath);
  if (stat.isFile()) {
    out.set(toRel(absPath), true);
    return;
  }
  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    walk(path.join(absPath, entry.name), out);
  }
}
function getFileData(file) {
  if (fileCache.has(file)) return fileCache.get(file);
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  const lineStarts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) lineStarts.push(i + 1);
  }
  const data = { text, lineStarts, maskedText: maskCommentsAndStrings(text) };
  fileCache.set(file, data);
  return data;
}
function lineAt(index, starts) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi + 1;
}
function scopeRoot(pattern) {
  const segments = normalizePath(pattern).split("/");
  const root = [];
  for (const segment of segments) {
    if (!segment || segment.includes("*")) break;
    root.push(segment);
  }
  return root.length ? root.join("/") : ".";
}
function globToRegExp(pattern) {
  const segments = normalizePath(pattern).split("/").filter(Boolean);
  let regex = "^";
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment === "**") {
      regex += i === segments.length - 1 ? ".*" : "(?:[^/]+/)*";
      continue;
    }
    regex += escapeRegex(segment).replace(/\*/g, "[^/]*");
    if (i < segments.length - 1) regex += "/";
  }
  return new RegExp(regex + "$");
}
function asGlobal(re) {
  if (re.flags.includes("g")) return new RegExp(re.source, re.flags);
  return new RegExp(re.source, re.flags + "g");
}
function compareFindings(a, b) {
  return a.file.localeCompare(b.file) || a.line - b.line;
}
function collectFileScopeConstantBooleans(maskedText) {
  const out = [];
  const re = /^\s*const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(true|false)\s*;/gm;
  let match;
  while ((match = re.exec(maskedText))) {
    out.push({ name: match[1], value: match[2] });
  }
  return out;
}
function countIdentifierReferences(text, name) {
  const re = identifierRegExp(name);
  let count = 0;
  while (re.exec(text)) count += 1;
  return count;
}
function identifierRegExp(name) {
  return new RegExp(`(?<![A-Za-z0-9_$])${escapeRegex(name)}(?![A-Za-z0-9_$])`, "g");
}
function maskCommentsAndStrings(text) {
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
      if (ch === "'" || ch === "\"" || ch === "`") {
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
function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "");
}
function toRel(absPath) {
  return normalizePath(path.relative(ROOT, absPath));
}
function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}
if (isCliEntrypoint()) {
  runPatternCheckCli();
}
