const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/perf/harness.mjs", function () {
  const harnessPath = path.resolve(__dirname, "../../tools/perf/harness.mjs");
  const tempDirs = [];

  let runPerfScenarioSuite;
  let DEFAULT_SCENARIO_ORDER;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(harnessPath).href);
    runPerfScenarioSuite = mod.runPerfScenarioSuite;
    DEFAULT_SCENARIO_ORDER = mod.DEFAULT_SCENARIO_ORDER;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createTempOutputDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-perf-harness-"));
    tempDirs.push(dir);
    return dir;
  }

  it("keeps scenario order stable across repeated runs", async function () {
    const outA = createTempOutputDir();
    const outB = createTempOutputDir();

    const first = await runPerfScenarioSuite({
      rootDir: process.cwd(),
      outputDir: outA,
      warmupIterations: 1,
      measuredIterations: 2,
      cpuSlowdownFactor: 1,
      captureCpuProfile: false,
      seed: 1337
    });

    const second = await runPerfScenarioSuite({
      rootDir: process.cwd(),
      outputDir: outB,
      warmupIterations: 1,
      measuredIterations: 2,
      cpuSlowdownFactor: 1,
      captureCpuProfile: false,
      seed: 1337
    });

    expect(first.report.scenario_order).toEqual(DEFAULT_SCENARIO_ORDER);
    expect(second.report.scenario_order).toEqual(DEFAULT_SCENARIO_ORDER);
    expect(Object.keys(first.report.scenarios)).toEqual(Object.keys(second.report.scenarios));
  });

  it("always writes parser-readable JSON and markdown artifacts", async function () {
    const outDir = createTempOutputDir();

    const result = await runPerfScenarioSuite({
      rootDir: process.cwd(),
      outputDir: outDir,
      warmupIterations: 1,
      measuredIterations: 2,
      cpuSlowdownFactor: 1,
      captureCpuProfile: false,
      seed: 1337
    });

    expect(fs.existsSync(result.artifacts.jsonPath)).toBe(true);
    expect(fs.existsSync(result.artifacts.markdownPath)).toBe(true);

    const parsed = JSON.parse(fs.readFileSync(result.artifacts.jsonPath, "utf8"));
    const markdown = fs.readFileSync(result.artifacts.markdownPath, "utf8");

    expect(parsed.schema_version).toBe(1);
    expect(parsed.scenario_order).toEqual(DEFAULT_SCENARIO_ORDER);
    expect(markdown).toContain("Dyninstruments Perf Report");
    expect(markdown).toContain("Scenario");
  });
});
