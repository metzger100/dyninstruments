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
    expect(result.stdout + result.stderr).toContain("Starter quality check passed");
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
    expect(fs.readFileSync(path.join(viewer, "plugin.mjs"), "utf8")).toContain("sample-plugin initialized");
    expect(fs.readFileSync(path.join(viewer, "plugin.mjs"), "utf8")).not.toContain("generated-plugin");
    expect(fs.existsSync(path.join(viewer, "documentation/TABLEOFCONTENTS.md"))).toBe(true);
    expect(fs.readFileSync(path.join(python, "plugin.py"), "utf8")).toContain('PLUGIN_ID = "sample-plugin"');
    expect(fs.readFileSync(path.join(python, "tests/test_plugin.py"), "utf8")).toContain("test_plugin_boundary");
    const workflow = fs.readFileSync(path.join(viewer, ".github/workflows/quality.yml"), "utf8");
    expect(workflow).not.toMatch(/uses: actions\/(?:checkout|setup-node|setup-python)@v\d/);
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
  }, 30000);

  it("materializes the neutral distribution source and rejects source mutations", async function () {
    const { runDistributionMaterialization, validateDistributionSource } =
      await import("../../tools/regenerate-distribution-manifest.mjs");
    const result = runDistributionMaterialization({ print: false });
    expect(result.ok).toBe(true);
    expect(result.manifest.sourceOwner).toBe("avnav-plugin-ai-environment");
    expect(() => validateDistributionSource({ ...result.source, paths: ["../escape"] })).toThrow(/repository-relative/);
    expect(() => validateDistributionSource({ ...result.source, sourceOwner: "product-name" })).toThrow(/neutral/);
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

    const qualityRoot = path.join(root, "quality");
    createStarter({
      output: qualityRoot,
      id: "sample-plugin",
      name: "Sample Plugin",
      level: "quality",
      profile: "viewer-only"
    });
    /** @param {string} command */
    const generatedCheck = (command) =>
      childProcess.spawnSync(process.execPath, ["tools/check-generated-quality.mjs", command], {
        cwd: qualityRoot,
        encoding: "utf8"
      });
    fs.writeFileSync(path.join(qualityRoot, "helper.js"), 'var unsafe = eval("1");\n');
    expect(generatedCheck("standalone").status).not.toBe(0);
    fs.rmSync(path.join(qualityRoot, "helper.js"));
    fs.appendFileSync(path.join(qualityRoot, "plugin.mjs"), "\nconst broken = config.default || true;\n");
    expect(generatedCheck("smells").status).not.toBe(0);
    expect(
      childProcess.spawnSync(process.execPath, ["tools/check-generated-quality.mjs", "workflow"], {
        cwd: qualityRoot,
        encoding: "utf8"
      }).status
    ).toBe(0);

    const mutations = [
      {
        name: "identity drift",
        file: "plugin.json",
        mutate: /** @param {string} file */ (file) =>
          fs.writeFileSync(
            file,
            fs.readFileSync(file, "utf8").replace('"name": "sample-plugin"', '"name": "other-plugin"')
          ),
        command: ["tools/check-generated-quality.mjs", "inventory"]
      },
      {
        name: "stale profile path",
        file: "tools/quality-policy/project-profile.json",
        mutate: /** @param {string} file */ (file) =>
          fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace('"plugin.js"', '"../escape"')),
        command: ["tools/check-quality-profile.mjs"]
      },
      {
        name: "unpinned action",
        file: ".github/workflows/quality.yml",
        mutate: /** @param {string} file */ (file) =>
          fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/@[0-9a-f]{40}/, "@v6")),
        command: ["tools/check-generated-quality.mjs", "workflow"]
      },
      {
        name: "write permission",
        file: ".github/workflows/quality.yml",
        mutate: /** @param {string} file */ (file) =>
          fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("contents: read", "contents: write")),
        command: ["tools/check-generated-quality.mjs", "workflow"]
      },
      {
        name: "suppression text",
        file: "plugin.js",
        mutate: /** @param {string} file */ (file) => fs.appendFileSync(file, "\n/* eslint-disable */\n"),
        command: ["tools/portable-core/suppression-engine.mjs"]
      },
      {
        name: "signed byte tampering",
        file: "tools/quality-policy/shared-core-manifest.sha256",
        mutate: /** @param {string} file */ (file) =>
          fs.writeFileSync(file, "0" + fs.readFileSync(file, "utf8").slice(1)),
        command: ["tools/check-shared-core.mjs"]
      },
      {
        name: "missing package file",
        file: "plugin.json",
        mutate: /** @param {string} file */ (file) => fs.unlinkSync(file),
        command: ["tools/check-generated-quality.mjs", "package"]
      }
    ];
    for (const mutation of mutations) {
      const mutationRoot = path.join(root, mutation.name.replaceAll(" ", "-"));
      createStarter({
        output: mutationRoot,
        id: "sample-plugin",
        name: "Sample Plugin",
        level: "quality",
        profile: "viewer-only"
      });
      mutation.mutate(path.join(mutationRoot, mutation.file));
      const result = childProcess.spawnSync(process.execPath, mutation.command, {
        cwd: mutationRoot,
        encoding: "utf8"
      });
      expect(result.status, mutation.name).not.toBe(0);
    }

    const pythonRoot = path.join(root, "python-syntax");
    createStarter({
      output: pythonRoot,
      id: "sample-plugin",
      name: "Sample Plugin",
      level: "quality",
      profile: "python-plus-viewer"
    });
    fs.appendFileSync(path.join(pythonRoot, "plugin.py"), "\ndef broken(:\n    pass\n");
    const pythonSyntax = childProcess.spawnSync("python3", ["-m", "py_compile", "plugin.py"], {
      cwd: pythonRoot,
      encoding: "utf8"
    });
    expect(pythonSyntax.status, "invalid Python syntax").not.toBe(0);
    fs.rmSync(root, { recursive: true, force: true });
  }, 120000);
});
