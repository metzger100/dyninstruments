const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-smell-contracts.mjs catalog coverage", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-smell-contracts.mjs");
  const tempDirs = [];
  let runSmellContracts;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runSmellContracts = mod.runSmellContracts;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace(markdown) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-smell-catalog-"));
    tempDirs.push(dir);
    const rel = "documentation/conventions/smell-prevention.md";
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, markdown, "utf8");
    return dir;
  }

  it("fails when a live smell rule is missing from the catalog section", function () {
    const cwd = createWorkspace([
      "# Smell Prevention",
      "",
      "## Smell Catalog",
      "",
      "| Smell Class | Anti-Pattern | Required Pattern | Enforcement | Severity |",
      "|---|---|---|---|---|",
      "| Example | Example | Example | `check-patterns` (`absolute-user-home-path`) | block |",
      "",
      "## Executable Rule Index",
      "",
      "`global-isfinite`"
    ].join("\n"));

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["smell-catalog-coverage"],
      print: false
    });

    expect(result.summary.ok).toBe(false);
    expect(result.findings[0].message).toContain("[smell-catalog-coverage]");
    expect(result.findings.map((item) => item.message).join("\n")).toContain("global-isfinite");
  });
});
