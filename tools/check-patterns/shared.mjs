import fs from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules", "coverage"]);
const EXTERNAL_FACTOR_CONTEXT_HINTS = [
  "root.avnav",
  "avnav.api",
  "getComputedStyle",
  "devicePixelRatio",
  "ownerDocument",
  "documentElement"
];

let ROOT = process.cwd();
let WARN_MODE = false;
const fileCache = new Map();
const scopeCache = new Map();
let clusterPrefixCache = null;
let rendererContractCache = null;

export const RENDER_PROP_OBJECT_NAMES = new Set(["p", "props"]);

export function resetContext(options = {}) {
  ROOT = path.resolve(options.root || process.cwd());
  WARN_MODE = !!options.warnMode;
  fileCache.clear();
  scopeCache.clear();
  clusterPrefixCache = null;
  rendererContractCache = null;
}

export function getWarnMode() {
  return WARN_MODE;
}

export function getRoot() {
  return ROOT;
}

export function getRendererContractCache() {
  return rendererContractCache;
}

export function setRendererContractCache(value) {
  rendererContractCache = value;
}

export function filesForScope(scope) {
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

export function getFileData(file) {
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

export function getClusterPascalPrefixes() {
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

export function lineAt(index, starts) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi + 1;
}

export function asGlobal(re) {
  if (re.flags.includes("g")) return new RegExp(re.source, re.flags);
  return new RegExp(re.source, re.flags + "g");
}

export function compareFindings(a, b) {
  return a.file.localeCompare(b.file) || a.line - b.line;
}

export function collectFileScopeConstantBooleans(maskedText) {
  const out = [];
  const re = /^\s*const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(true|false)\s*;/gm;
  let match;
  while ((match = re.exec(maskedText))) {
    out.push({ name: match[1], value: match[2] });
  }
  return out;
}

export function countIdentifierReferences(text, name) {
  const re = identifierRegExp(name);
  let count = 0;
  while (re.exec(text)) count += 1;
  return count;
}

function identifierRegExp(name) {
  return new RegExp(`(?<![A-Za-z0-9_$])${escapeRegex(name)}(?![A-Za-z0-9_$])`, "g");
}

export function maskCommentsAndStrings(text) {
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

export function findMatchingBrace(text, openIndex) {
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

export function findMatchingParen(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function findTopLevelComma(maskedText, start, end) {
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  for (let i = start; i < end; i += 1) {
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
    if (ch === "," && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      return i;
    }
  }
  return -1;
}

export function readLiteralToken(text, startIndex) {
  let i = startIndex;
  while (i < text.length && /\s/.test(text[i])) {
    i += 1;
  }
  if (i >= text.length) {
    return null;
  }

  const quote = text[i];
  if (quote === "\"" || quote === "'" || quote === "`") {
    let j = i + 1;
    while (j < text.length) {
      const ch = text[j];
      if (ch === "\\") {
        j += 2;
        continue;
      }
      if (ch === quote) {
        return { token: text.slice(i, j + 1), end: j + 1 };
      }
      j += 1;
    }
    return null;
  }

  const rem = text.slice(i);
  const keyword = /^(?:true|false|null|undefined)\b/.exec(rem);
  if (keyword) {
    return { token: keyword[0], end: i + keyword[0].length };
  }
  const numeric = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i.exec(rem);
  if (numeric) {
    return { token: numeric[0], end: i + numeric[0].length };
  }
  return null;
}

export function isExternalFactorFallbackContext(maskedText, index) {
  const start = Math.max(0, index - 220);
  const end = Math.min(maskedText.length, index + 220);
  const snippet = maskedText.slice(start, end);
  return EXTERNAL_FACTOR_CONTEXT_HINTS.some((hint) => snippet.includes(hint));
}

function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "");
}

function toRel(absPath) {
  return normalizePath(path.relative(ROOT, absPath));
}

export function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
