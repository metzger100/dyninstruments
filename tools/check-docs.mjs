#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  ...collectFiles(path.join(ROOT, "documentation"), (p) => p.endsWith(".md")),
  path.join(ROOT, "README.md"),
  path.join(ROOT, "CLAUDE.md")
].filter((p) => fs.existsSync(p));

const STALE_PHRASES = [
  "In MODULES (plugin.js)",
  "composeUpdates() in plugin.js",
  "plugin.js calls registerInstrument()",
  "Update `ClusterHost.js`"
];

const headingMap = new Map();
for (const file of TARGETS) {
  headingMap.set(file, extractAnchors(fs.readFileSync(file, "utf8")));
}

const failures = [];

for (const file of TARGETS) {
  const markdown = fs.readFileSync(file, "utf8");
  const text = stripCode(markdown);

  for (const link of extractLinks(text)) {
    if (isExternalLink(link)) continue;

    const normalized = normalizeLink(link);
    if (!normalized) continue;

    let targetFile = file;
    let anchor = "";

    if (normalized.startsWith("#")) {
      anchor = normalized.slice(1);
    } else {
      const split = normalized.split("#");
      const filePart = split[0];
      anchor = split.length > 1 ? split.slice(1).join("#") : "";
      targetFile = path.resolve(path.dirname(file), filePart);

      if (!fs.existsSync(targetFile)) {
        fail("missing-link-file", file, `link '${link}' -> '${rel(targetFile)}' does not exist`);
        continue;
      }

      if (!headingMap.has(targetFile) && targetFile.endsWith(".md")) {
        headingMap.set(targetFile, extractAnchors(fs.readFileSync(targetFile, "utf8")));
      }
    }

    if (anchor) {
      const anchors = headingMap.get(targetFile) || new Set();
      if (!anchors.has(anchor.toLowerCase())) {
        fail(
          "missing-link-anchor",
          file,
          `link '${link}' -> anchor '#${anchor}' not found in '${rel(targetFile)}'`
        );
      }
    }
  }

  for (const phrase of STALE_PHRASES) {
    const idx = text.indexOf(phrase);
    if (idx >= 0) {
      fail("stale-phrase", file, `contains stale phrase '${phrase}'`);
    }
  }
}

const jsFiles = collectFiles(ROOT, (p) => p.endsWith(".js") && !p.includes(`${path.sep}.git${path.sep}`));
for (const jsFile of jsFiles) {
  const content = fs.readFileSync(jsFile, "utf8");
  const match = content.match(/Documentation:\s*([^\n*]+)/);
  if (!match) continue;

  const docPath = match[1].trim();
  const target = path.join(ROOT, docPath);
  if (!fs.existsSync(target)) {
    fail(
      "missing-doc-target",
      jsFile,
      `Documentation header points to missing file '${docPath}'`
    );
  }
}

const summary = {
  ok: failures.length === 0,
  checkedMarkdownFiles: TARGETS.length,
  checkedJsFiles: jsFiles.length,
  failures: failures.length
};

if (failures.length) {
  console.error("Documentation check failed:\n");
  for (const f of failures) {
    console.error(`- [${f.type}] ${rel(f.file)}: ${f.message}`);
  }
  console.error("\nSUMMARY_JSON=" + JSON.stringify(summary));
  process.exit(1);
}

console.log("Documentation check passed.");
console.log("SUMMARY_JSON=" + JSON.stringify(summary));

function fail(type, file, message) {
  failures.push({ type, file, message });
}

function rel(p) {
  return path.relative(ROOT, p) || ".";
}

function collectFiles(start, predicate) {
  if (!fs.existsSync(start)) return [];
  const out = [];
  walk(start, out, predicate);
  return out;
}

function walk(curr, out, predicate) {
  const stat = fs.statSync(curr);
  if (stat.isFile()) {
    if (predicate(curr)) out.push(curr);
    return;
  }
  for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    walk(path.join(curr, entry.name), out, predicate);
  }
}

function stripCode(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let inFence = false;
  let fence = "";

  for (const line of lines) {
    const fenceMatch = line.match(/^(```+|~~~+)/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fence = marker;
      } else if (marker === fence) {
        inFence = false;
        fence = "";
      }
      out.push("");
      continue;
    }

    if (inFence) {
      out.push("");
      continue;
    }

    out.push(line.replace(/`[^`\n]*`/g, ""));
  }

  return out.join("\n");
}

function extractLinks(text) {
  const links = [];
  const re = /!?(?:\[[^\]]*\])\(([^)]+)\)/g;
  let match;
  while ((match = re.exec(text))) {
    links.push(match[1].trim());
  }
  return links;
}

function isExternalLink(link) {
  return /^(https?:|mailto:|tel:|data:)/i.test(link);
}

function normalizeLink(link) {
  if (!link) return "";
  let out = link;

  if (out.startsWith("<") && out.endsWith(">")) {
    out = out.slice(1, -1).trim();
  }

  if (!out.startsWith("#")) {
    const spaceIndex = out.indexOf(" ");
    if (spaceIndex !== -1) {
      out = out.slice(0, spaceIndex);
    }
  }

  return out;
}

function extractAnchors(markdown) {
  const lines = markdown.split(/\r?\n/);
  const anchors = new Set();
  const counts = new Map();
  let inFence = false;
  let fence = "";

  for (const line of lines) {
    const fenceMatch = line.match(/^(```+|~~~+)/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fence = marker;
      } else if (marker === fence) {
        inFence = false;
        fence = "";
      }
      continue;
    }

    if (inFence) continue;

    const m = line.match(/^#{1,6}\s+(.*)$/);
    if (!m) continue;

    const base = slugify(m[1]);
    if (!base) continue;

    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);

    const finalAnchor = count === 1 ? base : `${base}-${count}`;
    anchors.add(finalAnchor);
  }

  return anchors;
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[!"#$%&'()+,./:;<=>?@[\\\]^{}|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
