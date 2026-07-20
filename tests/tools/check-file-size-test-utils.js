const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const toolPath = path.resolve(__dirname, "../../tools/check-file-size.mjs");

/** @returns {Promise<any>} */
async function loadRunFileSizeCheck() {
  const mod = await import(pathToFileURL(toolPath).href);
  return mod.runFileSizeCheck;
}

function createWorkspaceManager() {
  const tempDirs = /** @type {string[]} */ ([]);

  /** @param {Record<string, string>} files */
  function createWorkspace(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-file-size-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }

    return dir;
  }

  function cleanup() {
    while (tempDirs.length) {
      fs.rmSync(/** @type {string} */ (tempDirs.pop()), { recursive: true, force: true });
    }
  }

  return {
    createWorkspace,
    cleanup
  };
}

/**
 * @param {any} runFileSizeCheck
 * @param {string} cwd
 * @param {Record<string, any>} [options]
 */
function runCheck(runFileSizeCheck, cwd, options = {}) {
  const logs = /** @type {string[]} */ ([]);
  const errors = /** @type {string[]} */ ([]);
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => logs.push(args.join(" "));
  console.error = (...args) => errors.push(args.join(" "));

  let result;
  try {
    result = runFileSizeCheck({
      root: cwd,
      onelinerMode: options.onelinerMode || "block",
      print: options.print !== false
    });
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  return {
    result,
    output: [...logs, ...errors].join("\n")
  };
}

/** @param {number} count @param {string} [prefix] */
function buildNonEmptyLines(count, prefix = "const v") {
  return Array.from({ length: count }, (_, i) => `${prefix}${i} = ${i};`).join("\n");
}

/** @param {number} count @param {string} [prefix] */
function buildTotalLines(count, prefix = "line") {
  if (count <= 0) return "";
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`).join("\n");
}

module.exports = {
  loadRunFileSizeCheck,
  createWorkspaceManager,
  runCheck,
  buildNonEmptyLines,
  buildTotalLines
};
