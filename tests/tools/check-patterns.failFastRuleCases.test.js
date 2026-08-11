// @ts-check
const { countFindings, createWorkspace, joinMessages, runPatternCheck } = require("./check-patterns-setup");
const failFastRuleCases = require("../../tools/test-data/check-patterns-failfast-cases.js");

describe("tools/check-patterns.mjs", function () {
  /**
   * @param {{ findings?: import("./check-patterns.harness.js").DyniPatternFinding[], warnings?: import("./check-patterns.harness.js").DyniPatternFinding[] }} result
   * @param {string} severity
   */
  function reportMessages(result, severity) {
    const findings = severity === "block" ? result.findings || [] : result.warnings || [];
    return findings.map((finding) => `${finding.file}:${finding.line}: ${finding.message}`).join("\n");
  }

  it("keeps derived severity maps out of the programmatic summary", function () {
    const result = runPatternCheck({
      root: createWorkspace({ "shared/example.js": "function clean(value) { return value; }\n" }),
      warnMode: false,
      print: false
    });

    expect(result.summary).not.toHaveProperty("byRuleFailures");
    expect(result.summary).not.toHaveProperty("byRuleWarnings");
    expect(JSON.stringify(result.summary)).not.toContain("byRuleFailures");
    expect(JSON.stringify(result.summary)).not.toContain("byRuleWarnings");
  });

  failFastRuleCases.forEach(function (testCase) {
    it(`${testCase.severity === "block" ? "blocks" : "warns"} for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.positive });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = reportMessages(result, testCase.severity);
      expect(result.summary.ok).toBe(testCase.severity !== "block");
      if (testCase.severity === "block") {
        expect(countFindings(result, testCase.rule, "block")).toBeGreaterThan(0);
        expect(countFindings(result, testCase.rule, "warn")).toBe(0);
      } else {
        expect(countFindings(result, testCase.rule, "warn")).toBeGreaterThan(0);
        expect(countFindings(result, testCase.rule, "block")).toBe(0);
      }
      expect(out).toContain(`[${testCase.rule}]`);
      const reported = testCase.severity === "block" ? result.findings : result.warnings;
      const firstFinding = reported.find((finding) => finding.rule === testCase.rule);
      if (!firstFinding) throw new Error(`Expected a ${testCase.rule} finding.`);
      expect(out).toContain(`${firstFinding.file}:${firstFinding.line}`);
    });

    it(`does not report for clean ${testCase.rule} sample`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.clean });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      expect(countFindings(result, testCase.rule, "warn")).toBe(0);
      expect(countFindings(result, testCase.rule, "block")).toBe(0);
    });

    it(`rejects generic disable-next-line for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.disableNextLine });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = joinMessages(result.findings);
      expect(result.summary.ok).toBe(false);
      expect(countFindings(result, "invalid-lint-suppression", "block")).toBeGreaterThan(0);
      expect(out).toContain("[invalid-lint-suppression]");
    });

    it(`rejects generic disable-line for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.disableLine });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = joinMessages(result.findings);
      expect(result.summary.ok).toBe(false);
      expect(countFindings(result, "invalid-lint-suppression", "block")).toBeGreaterThan(0);
      expect(out).toContain("[invalid-lint-suppression]");
    });
  });
});
