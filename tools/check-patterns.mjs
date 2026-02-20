#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const WARN_MODE = process.argv.includes("--warn");
const SKIP_DIRS = new Set([".git", "node_modules", "coverage"]);
const fileCache = new Map();
const scopeCache = new Map();
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
    scope: { include: ["**/*.js", "**/*.md"], exclude: ["node_modules/**"] },
    detect: /\b(?:TODO|FIXME|HACK|XXX)\b/,
    allowlist: [],
    run: runTodoWithoutOwner,
    message: ({ file, line }) => `[todo-missing-owner] ${file}:${line}\nTODO/FIXME without owner and date. Use format: TODO(name, 2025-06-15): description.\nUndated TODOs become permanent. See conventions/coding-standards.md.`
  }
];
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
if (findings.length) {
  const print = WARN_MODE ? console.log : console.error;
  for (const finding of findings) print(finding.message);
  print("SUMMARY_JSON=" + JSON.stringify(summary));
  if (!WARN_MODE) process.exit(1);
  process.exit(0);
}
console.log("Pattern check passed.");
console.log("SUMMARY_JSON=" + JSON.stringify(summary));
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
  const data = { text, lineStarts };
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
function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "");
}
function toRel(absPath) {
  return normalizePath(path.relative(ROOT, absPath));
}
function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
