const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const toolPath = path.resolve(__dirname, "../../tools/check-patterns.mjs");
const tempDirs = [];
let runPatternCheckImpl;

function runPatternCheck(args) {
  return runPatternCheckImpl(args);
}

beforeAll(async function () {
  const mod = await import(pathToFileURL(toolPath).href);
  runPatternCheckImpl = mod.runPatternCheck;
});

afterEach(function () {
  while (tempDirs.length) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

function createWorkspace(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-patterns-"));
  tempDirs.push(dir);

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  }
  return dir;
}

function joinMessages(findings) {
  return findings.map((item) => item.message).join("\n");
}
function joinWarningMessages(warnings) {
  return warnings.map((item) => item.message).join("\n");
}

module.exports = {
  toolPath,
  tempDirs,
  runPatternCheck,
  createWorkspace,
  joinMessages,
  joinWarningMessages,
};
