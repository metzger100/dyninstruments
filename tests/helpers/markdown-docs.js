const fs = require("node:fs");
const path = require("node:path");

const JS_SCAN_ROOTS = [
  "plugin.js",
  "runtime",
  "cluster",
  "config",
  "shared",
  "widgets",
];
const JS_EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "tests",
  "tools",
  "coverage",
]);

const STALE_PHRASES = [
  "In COMPONENTS (plugin.js)",
  "composeUpdates() in runtime/widget-registrar.js",
  "runtime/init.js calls runtime.registerWidget()",
  "Update `ClusterWidget.js`",
];

const ROOT_REACHABILITY_DOCS = ["AGENTS.md", "CLAUDE.md", "ARCHITECTURE.md"];
const REACHABILITY_ENTRY_FILES = ["AGENTS.md", "CLAUDE.md"];
const REACHABILITY_EXCLUDED = ["documentation/exec-plans/TEMPLATE.md"];

function walk(curr, out, keepDir) {
  const stat = fs.statSync(curr);
  if (stat.isFile()) {
    if (curr.endsWith(".md")) out.push(curr);
    return;
  }
  for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
    if (entry.isDirectory() && keepDir && !keepDir(entry.name)) continue;
    if (entry.name === ".git") continue;
    walk(path.join(curr, entry.name), out, keepDir);
  }
}

function collectMarkdown(start, keepDir) {
  if (!fs.existsSync(start)) return [];
  const out = [];
  walk(start, out, keepDir);
  return out;
}

function walkJs(curr, out) {
  const stat = fs.statSync(curr);
  if (stat.isFile()) {
    if (curr.endsWith(".js")) out.add(curr);
    return;
  }
  for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
    if (entry.isDirectory() && JS_EXCLUDED_DIRS.has(entry.name)) continue;
    walkJs(path.join(curr, entry.name), out);
  }
}

function collectJsFiles(root) {
  const collected = new Set();
  for (const scanRoot of JS_SCAN_ROOTS) {
    const absolutePath = path.join(root, scanRoot);
    if (!fs.existsSync(absolutePath)) continue;
    walkJs(absolutePath, collected);
  }
  return Array.from(collected).sort();
}

function isExternalLink(link) {
  return /^(https?:|mailto:|tel:|data:)/i.test(link);
}

function rel(root, file) {
  return path.relative(root, file).replace(/\\/g, "/") || ".";
}

function checkDocumentationContracts(root) {
  const resolvedRoot = path.resolve(root);
  const failures = [];
  const fail = (type, file, message) =>
    failures.push({ type, file: rel(resolvedRoot, file), message });

  const targets = [
    ...collectMarkdown(path.join(resolvedRoot, "documentation")),
    path.join(resolvedRoot, "CLAUDE.md"),
  ].filter((p) => fs.existsSync(p));

  for (const file of targets) {
    const text = fs.readFileSync(file, "utf8");
    for (const phrase of STALE_PHRASES) {
      if (text.includes(phrase)) fail("stale-phrase", file, `contains stale phrase '${phrase}'`);
    }
  }

  const jsFiles = collectJsFiles(resolvedRoot);
  for (const jsFile of jsFiles) {
    const match = fs.readFileSync(jsFile, "utf8").match(/Documentation:\s*([^\n*]+)/);
    if (!match) continue;
    const docPath = match[1].trim();
    if (!fs.existsSync(path.join(resolvedRoot, docPath))) {
      fail("missing-doc-target", jsFile, `Documentation header points to missing file '${docPath}'`);
    }
  }

  return {
    ok: failures.length === 0,
    checkedMarkdownFiles: targets.length,
    checkedJsFiles: jsFiles.length,
    failures,
  };
}

function fileLinkTargets(file) {
  if (!fs.existsSync(file) || !file.endsWith(".md")) return [];
  const links = [];
  const re = /!?\[[^\]]*]\(([^)]+)\)/g;
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = re.exec(content))) {
    let out = match[1].trim();
    if (!out) continue;
    if (out.startsWith("<") && out.endsWith(">")) out = out.slice(1, -1).trim();
    if (out.startsWith("#") || isExternalLink(out)) continue;
    const hash = out.indexOf("#");
    if (hash !== -1) out = out.slice(0, hash);
    const space = out.search(/\s/);
    if (space !== -1) out = out.slice(0, space);
    if (!out.toLowerCase().endsWith(".md")) continue;
    links.push({ target: out, abs: path.resolve(path.dirname(file), out) });
  }
  return links;
}

function checkReachability(root) {
  const resolvedRoot = path.resolve(root);
  const abs = (p) => path.join(resolvedRoot, p);
  const excluded = new Set(REACHABILITY_EXCLUDED.map(abs));
  const rootDocs = ROOT_REACHABILITY_DOCS.map(abs).filter((p) => fs.existsSync(p));
  const entryFiles = REACHABILITY_ENTRY_FILES.map(abs).filter((p) => fs.existsSync(p));
  const discovered = Array.from(
    new Set([...collectMarkdown(path.join(resolvedRoot, "documentation"), (name) => name !== "node_modules"), ...rootDocs]),
  ).filter((p) => !excluded.has(p));

  const broken = [];
  const brokenSeen = new Set();
  for (const file of discovered) {
    for (const link of fileLinkTargets(file)) {
      if (fs.existsSync(link.abs)) continue;
      const key = `${file}::${link.target}`;
      if (brokenSeen.has(key)) continue;
      brokenSeen.add(key);
      broken.push({ file: rel(resolvedRoot, file), target: link.target });
    }
  }

  const reachable = new Set(entryFiles);
  const queue = [...entryFiles];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const link of fileLinkTargets(current)) {
      if (!fs.existsSync(link.abs) || reachable.has(link.abs)) continue;
      reachable.add(link.abs);
      queue.push(link.abs);
    }
  }

  const orphans = discovered.filter((file) => !reachable.has(file)).map((p) => rel(resolvedRoot, p));
  return {
    ok: broken.length === 0 && orphans.length === 0,
    discovered: discovered.length,
    reachable: discovered.filter((file) => reachable.has(file)).length,
    orphans,
    broken,
  };
}

module.exports = {
  STALE_PHRASES,
  checkDocumentationContracts,
  checkReachability,
};
