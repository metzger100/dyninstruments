const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");

describe("AvNav plugin starter", function () {
  it("creates a deterministic dependency-free project whose full check passes", async function () {
    const { createStarter } = await import("../../tools/create-avnav-plugin-starter.mjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-starter-"));
    const output = path.join(root, "sample");
    const files = createStarter({ output, id: "sample-plugin", name: "Sample Plugin" });
    expect(files).toEqual([...files].sort());
    expect(files).toContain("plugin.js");
    const result = childProcess.spawnSync(process.execPath, ["tools/check.mjs"], { cwd: output, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Starter quality check passed");
    expect(() => createStarter({ output, id: "sample-plugin", name: "Sample Plugin" })).toThrow(/not empty/);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("rejects an unsafe plugin identifier", async function () {
    const { createStarter } = await import("../../tools/create-avnav-plugin-starter.mjs");
    expect(() => createStarter({ output: "/tmp/unused", id: "../bad", name: "Bad" })).toThrow(/--id/);
  });

  it("supports both CLI forms and quality profiles", async function () {
    const { createStarter } = await import("../../tools/create-avnav-plugin-starter.mjs");
    const script = path.resolve("tools/create-avnav-plugin-starter.mjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-starter-cli-"));
    const viewer = path.join(root, "viewer");
    const python = path.join(root, "python");
    const equals = childProcess.spawnSync(
      process.execPath,
      [
        script,
        `--output=${viewer}`,
        "--id",
        "sample-plugin",
        "--name=Sample Plugin",
        "--level",
        "quality",
        "--profile=viewer-only"
      ],
      { encoding: "utf8" }
    );
    const pairs = childProcess.spawnSync(
      process.execPath,
      [
        script,
        "--output",
        python,
        "--id=sample-plugin",
        "--name",
        "Sample Plugin",
        "--level=quality",
        "--profile",
        "python-plus-viewer"
      ],
      { encoding: "utf8" }
    );
    expect(equals.status).toBe(0);
    expect(pairs.status).toBe(0);
    expect(fs.existsSync(path.join(viewer, "tools/quality-policy/portable-role-graph.json"))).toBe(true);
    expect(fs.existsSync(path.join(python, "plugin.py"))).toBe(true);
    expect(() =>
      createStarter({
        output: path.join(root, "bad"),
        id: "sample-plugin",
        name: "Bad",
        level: "quality",
        profile: /** @type {any} */ ("unknown")
      })
    ).toThrow(/--profile/);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("rejects representative quality mutations", async function () {
    const { createStarter } = await import("../../tools/create-avnav-plugin-starter.mjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-starter-mutation-"));
    const output = path.join(root, "sample");
    createStarter({
      output,
      id: "sample-plugin",
      name: "Sample Plugin",
      level: "quality",
      profile: "viewer-only"
    });
    const check = () =>
      childProcess.spawnSync(process.execPath, ["tools/check.mjs"], { cwd: output, encoding: "utf8" });
    fs.appendFileSync(path.join(output, "plugin.js"), '\nvar unsafe = eval("1");\n');
    expect(check().status).not.toBe(0);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
