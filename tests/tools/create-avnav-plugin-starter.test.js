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
});
