const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");

const root = process.cwd();
const ignorePath = path.join(root, ".prettierignore");

// New maintained JS/MJS, CSS, and Markdown files must not be
// able to land outside Prettier ownership. If a file genuinely needs to be
// excluded (e.g. a fixture whose content Prettier cannot parse), add its
// exact repo-relative path here with a comment explaining why, and make sure
// an owner test exercises it directly. Never exclude by directory glob.
const NEGATIVE_FIXTURE_EXCLUSIONS = /** @type {string[]} */ ([]);

const MAINTAINED_JS_ROOTS = ["config", "runtime", "cluster", "shared", "widgets", "tests", "tools"];
const MAINTAINED_JS_FILES = ["plugin.js", "plugin.mjs"];

const MAINTAINED_CSS_GLOBS = [{ file: "plugin.css" }, { dir: "shared" }, { dir: "widgets" }, { dir: "tests/css" }];

const MAINTAINED_MARKDOWN_ROOTS = ["documentation", ".agents/skills", "exec-plans/active"];

describe("formatting scope contract", function () {
  it("covers every maintained JavaScript/MJS file with format and format:check", function () {
    const maintained = collectMaintainedJsFiles();
    const covered = collectPrettierScope("format:check");

    expectAllCovered(maintained, covered, ".js/.mjs");
  });

  it("covers every maintained CSS file with format and format:check", function () {
    const maintained = collectMaintainedCssFiles();
    const covered = collectPrettierScope("format:check");

    expectAllCovered(maintained, covered, ".css");
  });

  it("covers every maintained Markdown file with format and format:check", function () {
    const maintained = collectMaintainedMarkdownFiles();
    const covered = collectPrettierScope("format:check");

    expectAllCovered(maintained, covered, ".md");
  });

  it("keeps format and format:check targeting the exact same file set", function () {
    const writeScope = collectPrettierScope("format");
    const checkScope = collectPrettierScope("format:check");

    expect(Array.from(writeScope).sort()).toEqual(Array.from(checkScope).sort());
  });

  it("only allows negative fixture exclusions by exact path, never by directory glob", function () {
    NEGATIVE_FIXTURE_EXCLUSIONS.forEach(function (relPath) {
      expect(relPath.includes("*")).toBe(false);
      expect(fs.existsSync(path.join(root, relPath)), relPath + " must exist on disk").toBe(true);
    });
  });

  it("keeps every approved negative fixture scoped to a fixture/test-data path", function () {
    NEGATIVE_FIXTURE_EXCLUSIONS.forEach(function (relPath) {
      const segments = relPath.split("/");
      expect(segments.includes("lint-fixtures") || segments.includes("test-data")).toBe(true);
    });
  });

  it("finds every maintained JS/MJS file not effectively ignored by Prettier's real resolution", async function () {
    await expectNoneEffectivelyIgnored(collectMaintainedJsFiles());
  });

  it("finds every maintained CSS file not effectively ignored by Prettier's real resolution", async function () {
    await expectNoneEffectivelyIgnored(collectMaintainedCssFiles());
  });

  it("finds every maintained Markdown file not effectively ignored by Prettier's real resolution", async function () {
    await expectNoneEffectivelyIgnored(collectMaintainedMarkdownFiles());
  });

  it("proves a maintained file newly added to .prettierignore is detected as ignored", async function () {
    const seededIgnorePath = path.join(root, `.prettierignore.contract-proof-${process.pid}`);
    const targetFile = "shared/widget-kits/value/ValueMath.js";
    try {
      fs.writeFileSync(seededIgnorePath, `${fs.readFileSync(ignorePath, "utf8")}\n${targetFile}\n`);

      const info = await prettier.getFileInfo(path.join(root, targetFile), { ignorePath: seededIgnorePath });

      expect(info.ignored).toBe(true);
    } finally {
      fs.rmSync(seededIgnorePath, { force: true });
    }
  });
});

/** @param {string[]} maintained @param {Set<string>} covered @param {string} label */
function expectAllCovered(maintained, covered, label) {
  const excluded = new Set(NEGATIVE_FIXTURE_EXCLUSIONS);
  const missing = maintained.filter(function (relPath) {
    return !excluded.has(relPath) && !covered.has(relPath);
  });

  expect(missing, "missing " + label + " files from Prettier scope").toEqual([]);
}

/** @param {string[]} maintained */
async function expectNoneEffectivelyIgnored(maintained) {
  const excluded = new Set(NEGATIVE_FIXTURE_EXCLUSIONS);
  const ignored = [];
  for (const relPath of maintained) {
    if (excluded.has(relPath)) continue;
    const info = await prettier.getFileInfo(path.join(root, relPath), { ignorePath });
    if (info.ignored) ignored.push(relPath);
  }
  expect(ignored, "maintained files effectively ignored by Prettier").toEqual([]);
}

/** @param {"format" | "format:check"} scriptName @returns {Set<string>} */
function collectPrettierScope(scriptName) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const command = pkg.scripts[scriptName];
  const args = tokenizeCommand(command).filter(function (token) {
    return token !== "prettier" && token !== "--write" && token !== "--check";
  });

  const covered = new Set();
  args.forEach(function (pattern) {
    const matches = fs.globSync(pattern, { cwd: root });
    matches.forEach(function (match) {
      covered.add(match.replace(/\\/g, "/"));
    });
  });
  return covered;
}

/** @param {string} command @returns {string[]} */
function tokenizeCommand(command) {
  const tokens = /** @type {string[]} */ ([]);
  const pattern = /"([^"]*)"|(\S+)/g;
  let match = pattern.exec(command);
  while (match) {
    tokens.push(match[1] !== undefined ? match[1] : match[2]);
    match = pattern.exec(command);
  }
  return tokens;
}

/** @returns {string[]} */
function collectMaintainedJsFiles() {
  const files = /** @type {string[]} */ ([]);
  MAINTAINED_JS_ROOTS.forEach(function (dir) {
    files.push(...walk(path.join(root, dir), [".js", ".mjs"]));
  });
  MAINTAINED_JS_FILES.forEach(function (relPath) {
    if (fs.existsSync(path.join(root, relPath))) files.push(relPath);
  });
  return files;
}

/** @returns {string[]} */
function collectMaintainedCssFiles() {
  const files = /** @type {string[]} */ ([]);
  MAINTAINED_CSS_GLOBS.forEach(function (entry) {
    if (entry.file) {
      if (fs.existsSync(path.join(root, entry.file))) files.push(entry.file);
      return;
    }
    files.push(...walk(path.join(root, /** @type {string} */ (entry.dir)), [".css"]));
  });
  return files;
}

/** @returns {string[]} */
function collectMaintainedMarkdownFiles() {
  const files = walk(root, [".md"], { topLevelOnly: true });
  MAINTAINED_MARKDOWN_ROOTS.forEach(function (dir) {
    files.push(...walk(path.join(root, dir), [".md"]));
  });
  return files;
}

/**
 * @param {string} absoluteDir
 * @param {string[]} extensions
 * @param {{ topLevelOnly?: boolean }} [options]
 * @returns {string[]}
 */
function walk(absoluteDir, extensions, options) {
  const opts = options || {};
  const results = /** @type {string[]} */ ([]);
  if (!fs.existsSync(absoluteDir)) return results;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      if (!opts.topLevelOnly) results.push(...walk(absolutePath, extensions));
      continue;
    }
    if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(path.relative(root, absolutePath).replace(/\\/g, "/"));
    }
  }
  return results;
}
