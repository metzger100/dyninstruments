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
const RULES = [
  {
    name: "duplicate-functions",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js"],
      exclude: ["**/tests/**", "**/tools/**"]
    },
    detect: /^\s*function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/gm,
    allowlist: ["create", "translateFunction", "translate", "renderCanvas"],
    run: runDuplicateFunctions,
    message: ({ label, fileCount, locations }) => {
      const lines = locations.map((loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-fn] Function '${label}' defined in ${fileCount} files:\n${lines}\nExtract to shared/widget-kits/ and import via Helpers.getModule(). See conventions/coding-standards.md#shared-utilities`;
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
  const checkedFiles = new Set();
  const byRule = {};
  for (const rule of RULES) {
    const files = filesForScope(rule.scope);
    for (const file of files) checkedFiles.add(file);
    const run = rule.run || runRegexRule;
    const ruleFindings = run(rule, files).sort(compareFindings);
    byRule[rule.name] = ruleFindings.length;
    findings.push(...ruleFindings);
  }

  const summary = {
    ok: findings.length === 0,
    warnMode: WARN_MODE,
    checkedFiles: checkedFiles.size,
    failures: findings.length,
    byRule
  };

  if (options.print !== false) {
    if (findings.length) {
      const print = WARN_MODE ? console.log : console.error;
      for (const finding of findings) print(finding.message);
      print("SUMMARY_JSON=" + JSON.stringify(summary));
    }
    else {
      console.log("Pattern check passed.");
      console.log("SUMMARY_JSON=" + JSON.stringify(summary));
    }
  }

  return { summary, findings };
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
  const groups = new Map();
  for (const file of files) {
    const data = getFileData(file);
    const re = asGlobal(rule.detect);
    let match;
    while ((match = re.exec(data.text))) {
      const name = match[1];
      if (rule.allowlist.includes(name)) continue;
      const canonical = canonicalName(name);
      if (!groups.has(canonical)) {
        groups.set(canonical, { names: new Set(), locations: [] });
      }
      const group = groups.get(canonical);
      group.names.add(name);
      group.locations.push({ file, line: lineAt(match.index, data.lineStarts) });
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
  const out = [];
  for (const [canonical, group] of groups.entries()) {
    const uniqueFiles = new Set(group.locations.map((loc) => loc.file));
    if (uniqueFiles.size < 2) continue;
    const locations = group.locations.sort(compareFindings);
    out.push({
      file: locations[0].file,
      line: locations[0].line,
      message: rule.message({
        label: canonicalLabel(canonical, group.names),
        fileCount: uniqueFiles.size,
        locations
      })
    });
  }
  return out;
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
function canonicalName(name) {
  if (name === "formatSpeed" || name === "formatSpeedString") return "__formatSpeed";
  if (name === "formatAngle180" || name === "formatDirection360") return "__formatAngleDirection";
  const match = name.match(/^(format[A-Z][A-Za-z0-9_$]*)String$/);
  return match ? match[1] : name;
}
function canonicalLabel(canonical, names) {
  if (canonical === "__formatSpeed") return "formatSpeed/formatSpeedString";
  if (canonical === "__formatAngleDirection") return "formatAngle180/formatDirection360";
  if (names.size === 1) return [...names][0];
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (names.has(canonical)) {
    return [canonical, ...sorted.filter((n) => n !== canonical)].join("/");
  }
  return sorted.join("/");
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
