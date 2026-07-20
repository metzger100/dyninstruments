const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const baseline = require(path.join(root, "tools/quality-policy/phase0-baseline.json"));
const complexityFindings = require(path.join(root, baseline.complexityDiagnostic.stableIdentityFindings));
const vitestConfig = require(path.join(root, "vitest.config.js"));
const { verifyHistoricalComplexityCapture } = require(
  path.join(root, "tools/quality-policy/phase0-complexity-capture.mjs")
);

const PRODUCTION_ROOTS = ["config", "runtime", "cluster", "shared", "widgets"];
const SUPPRESSION_PATTERN = /eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck|prettier-ignore|istanbul ignore/;

/** @typedef {{ file: string, identity: string, metric: string, value: number, limit: number }} ComplexityFinding */
/** @typedef {Record<string, number | Record<string, number>>} CoverageThresholds */

describe("pre-tightening quality baseline", function () {
  it("identifies the immutable repository snapshot used for the historical capture", function () {
    expect(baseline.capturedCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(baseline.inventories.productionJsFileCount).toBe(211);
    expect(baseline.inventories.testFileCount).toBe(416);
    expect(baseline.inventories.testSpecFileCount).toBe(384);
    expect(baseline.inventories.toolFileCount).toBe(26);
    expect(fs.existsSync(path.join(root, baseline.inventories.productionMjsEntry))).toBe(true);
  });

  it("blocks standard suppression directives across both shipped entrypoints and production roots", function () {
    const directiveCount = PRODUCTION_ROOTS.concat([]).reduce(
      function (total, relativeRoot) {
        return total + countMatches(path.join(root, relativeRoot), ".js", /dyni-lint-disable-/);
      },
      countMatches(root, "plugin.js", /dyni-lint-disable-/, true) +
        countMatches(root, "plugin.mjs", /dyni-lint-disable-/, true)
    );
    const standardSuppressionCount = PRODUCTION_ROOTS.reduce(
      function (total, relativeRoot) {
        return total + countMatches(path.join(root, relativeRoot), ".js", SUPPRESSION_PATTERN);
      },
      countMatches(root, "plugin.js", SUPPRESSION_PATTERN, true) +
        countMatches(root, "plugin.mjs", SUPPRESSION_PATTERN, true)
    );

    expect(directiveCount).toBe(0);
    expect(standardSuppressionCount).toBe(0);
  });

  it("keeps the recorded unsafe-sink inventory reproducible", function () {
    const sinkSites = /** @type {string[]} */ ([]);
    for (const relativeRoot of PRODUCTION_ROOTS) {
      for (const file of collectFiles(path.join(root, relativeRoot), ".js")) {
        const relative = toPosixPath(path.relative(root, file));
        const lines = fs.readFileSync(file, "utf8").split("\n");
        lines.forEach(function (lineText, index) {
          if (/innerHTML\s*=/.test(lineText)) sinkSites.push(`${relative}:${index + 1}`);
        });
      }
    }

    expect(sinkSites).toEqual(baseline.unsafeSinks.innerHtmlAssignmentSites);
  });

  it("declares the exact warn-only check-patterns rule set frozen for promotion in later phases", function () {
    expect(baseline.checkPatterns.warnOnlyRuleIds).toEqual([
      "catch-fallback-without-suppression",
      "css-js-default-duplication",
      "editable-threshold-missing-internal"
    ]);
  });

  it("prevents configured global or critical coverage floors from being lowered", function () {
    expectThresholdsAtLeast(vitestConfig.test.coverage.thresholds, baseline.coverage.configuredThresholds);
  });

  it("records historical complexity by stable file, function, and metric identity", function () {
    expect(complexityFindings.capturedCommit).toBe(baseline.capturedCommit);
    expect(complexityFindings.findingCount).toBe(baseline.complexityDiagnostic.stableIdentityFindingCount);
    expect(complexityFindings.byMetric).toEqual({
      complexity: 124,
      "max-statements": 23,
      "max-depth": 1,
      "max-params": 40
    });
    expect(complexityFindings.findings).toHaveLength(188);
    complexityFindings.findings.forEach(function (/** @type {ComplexityFinding} */ finding) {
      expect(finding).toEqual({
        file: expect.any(String),
        identity: expect.any(String),
        metric: expect.stringMatching(/^(?:complexity|max-statements|max-depth|max-params)$/),
        value: expect.any(Number),
        limit: expect.any(Number)
      });
    });
    const keys = complexityFindings.findings.map(function (/** @type {ComplexityFinding} */ finding) {
      return `${finding.file}\0${finding.identity}\0${finding.metric}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("rejects any regenerated historical complexity capture drift", function () {
    const changedCapture = structuredClone(complexityFindings);
    changedCapture.findings[0].value += 1;

    expect(function () {
      verifyHistoricalComplexityCapture(complexityFindings, changedCapture);
    }).toThrow("Historical complexity capture differs");
    expect(function () {
      verifyHistoricalComplexityCapture(complexityFindings, complexityFindings);
    }).not.toThrow();
  });
});

/** @param {CoverageThresholds} actual @param {CoverageThresholds} floor */
function expectThresholdsAtLeast(actual, floor) {
  Object.entries(floor).forEach(function ([key, expected]) {
    if (typeof expected === "number") {
      expect(/** @type {number} */ (actual[key]), key).toBeGreaterThanOrEqual(expected);
      return;
    }
    expect(actual[key], key).toBeDefined();
    expectThresholdsAtLeast(/** @type {Record<string, number>} */ (actual[key]), expected);
  });
}

/** @param {string} value @returns {string} */
function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

/** @param {string} directory @param {string} extension */
function collectFiles(directory, extension) {
  const results = /** @type {string[]} */ ([]);
  if (!fs.existsSync(directory)) return results;

  /** @param {string} currentDirectory */
  function visit(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(extension)) results.push(absolutePath);
    }
  }

  visit(directory);
  return results;
}

/**
 * @param {string} baseDirectory
 * @param {string} targetOrExtension
 * @param {RegExp} pattern
 * @param {boolean} [singleFile]
 */
function countMatches(baseDirectory, targetOrExtension, pattern, singleFile) {
  const files = singleFile
    ? [path.join(baseDirectory, targetOrExtension)].filter(fs.existsSync)
    : collectFiles(baseDirectory, targetOrExtension);

  return files.reduce(function (total, file) {
    const matches = fs.readFileSync(file, "utf8").match(new RegExp(pattern, "g"));
    return total + (matches ? matches.length : 0);
  }, 0);
}
