const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = process.cwd();
const SCOPE_PATH = path.join(root, "tools/quality-policy/format-scope.json");
const VALID_OWNERS = new Set(["prettier", "unsupported"]);

describe("format-scope contract", function () {
  it("gives every row a sanctioned owner", async function () {
    const rows = await freshRows();

    rows.forEach(function (row) {
      expect(VALID_OWNERS.has(row.owner), row.path + " has unrecognized owner " + row.owner).toBe(true);
    });
  });

  it("gives every unsupported row a reason and alternate validation", async function () {
    const rows = await freshRows();

    rows
      .filter(function (row) {
        return row.owner === "unsupported";
      })
      .forEach(function (row) {
        expect(row.reason, row.path + " is unsupported without a reason").toBeTruthy();
        expect(
          row.alternateValidation,
          row.path + " is unsupported without an alternate validation owner"
        ).toBeTruthy();
      });
  });

  it("keeps the committed scope matching fresh discovery", async function () {
    const fresh = await freshRows();
    const committed = JSON.parse(fs.readFileSync(SCOPE_PATH, "utf8"));

    expect(committed.rows, "format-scope.json is stale; rerun npm run format:scope").toEqual(fresh);
  });

  it("classifies known families as expected", async function () {
    const byPath = await freshRowsByPath();

    expect(ownerOf(byPath, "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js")).toBe("prettier");
    expect(ownerOf(byPath, "plugin.css")).toBe("prettier");
    expect(ownerOf(byPath, "package.json")).toBe("prettier");
    expect(ownerOf(byPath, "package-lock.json")).toBe("prettier");
    expect(ownerOf(byPath, ".github/workflows/publish-release.yml")).toBe("prettier");
    expect(ownerOf(byPath, "documentation/core-principles.md")).toBe("prettier");
    expect(ownerOf(byPath, ".codex/config.toml")).toBe("unsupported");
    expect(ownerOf(byPath, "install.sh")).toBe("unsupported");
    expect(ownerOf(byPath, "plugin.json")).toBe("unsupported");
    expect(ownerOf(byPath, "layouts/dyni-motorboat.json")).toBe("unsupported");
    expect(ownerOf(byPath, "tools/quality-policy/complexity-baseline.json")).toBe("unsupported");
    expect(ownerOf(byPath, "assets/fonts/Roboto-Regular.woff2")).toBe("unsupported");
  });

  it("excludes historical artifacts rather than marking them unsupported", async function () {
    const { buildFormatScope } = await import(path.join(root, "tools/quality-policy/generate-format-scope.mjs"));
    const rows = buildFormatScope();
    const paths = new Set(rows.map((/** @type {any} */ row) => row.path));

    expect(paths.has("releases/dyninstruments-1.0.0.zip")).toBe(false);
    expect(paths.has("releases/dyninstruments-1.0.0.md")).toBe(false);
    expect(paths.has("exec-plans/completed/PLAN10.md")).toBe(false);
  });

  it("fails closed on a seeded unclassifiable file extension", async function () {
    const { buildFormatScope } = await import(path.join(root, "tools/quality-policy/generate-format-scope.mjs"));
    const rows = buildFormatScope();

    const trulyUnclassified = rows.filter(function (/** @type {any} */ row) {
      return row.owner === "unsupported" && !row.reason;
    });

    expect(trulyUnclassified).toEqual([]);
  });

  it("excludes tracked paths deleted before their move is staged", async function () {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "format-scope-deleted-"));
    const livePath = path.join(fixtureRoot, "live.md");
    const deletedPath = path.join(fixtureRoot, "deleted.md");
    fs.writeFileSync(livePath, "# Live\n");
    fs.writeFileSync(deletedPath, "# Deleted\n");
    execFileSync("git", ["init", "--quiet"], { cwd: fixtureRoot });
    execFileSync("git", ["add", "live.md", "deleted.md"], { cwd: fixtureRoot });
    fs.rmSync(deletedPath);

    try {
      const { buildFormatScope } = await import(path.join(root, "tools/quality-policy/generate-format-scope.mjs"));
      const paths = buildFormatScope(fixtureRoot).map(function (/** @type {{ path: string }} */ row) {
        return row.path;
      });
      expect(paths).toContain("live.md");
      expect(paths).not.toContain("deleted.md");
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

/** @returns {Promise<{path: string, owner: string, reason?: string, alternateValidation?: string}[]>} */
async function freshRows() {
  const { buildFormatScope } = await import(path.join(root, "tools/quality-policy/generate-format-scope.mjs"));
  return buildFormatScope();
}

/** @returns {Promise<Map<string, {path: string, owner: string}>>} */
async function freshRowsByPath() {
  const rows = await freshRows();
  return new Map(rows.map((row) => [row.path, row]));
}

/** @param {Map<string, {path: string, owner: string}>} byPath @param {string} relativePath */
function ownerOf(byPath, relativePath) {
  const row = byPath.get(relativePath);
  expect(row, relativePath + " is missing from the format scope").toBeTruthy();
  return row ? row.owner : undefined;
}
