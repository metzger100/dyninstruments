const {
  runPatternCheck,
  createWorkspace,
  joinMessages,
  joinWarningMessages,
} = require("./check-patterns.harness.js");
const failFastRuleCases = require("../../tools/test-data/check-patterns-failfast-cases.js");

describe("tools/check-patterns.mjs", function () {
  function reportMessages(result, severity) {
    return severity === "block"
      ? joinMessages(result.findings || [])
      : joinWarningMessages(result.warnings || []);
  }

  failFastRuleCases.forEach(function (testCase) {
    it(`${testCase.severity === "block" ? "blocks" : "warns"} for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.positive });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = reportMessages(result, testCase.severity);

      expect(result.summary.ok).toBe(testCase.severity !== "block");
      if (testCase.severity === "block") {
        expect(result.summary.byRuleFailures[testCase.rule]).toBeGreaterThan(0);
        expect(result.summary.byRuleWarnings[testCase.rule]).toBe(0);
      } else {
        expect(result.summary.byRuleWarnings[testCase.rule]).toBeGreaterThan(0);
        expect(result.summary.byRuleFailures[testCase.rule]).toBe(0);
      }
      expect(out).toContain(`[${testCase.rule}]`);
    });

    it(`does not report for clean ${testCase.rule} sample`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.clean });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

      expect(result.summary.byRuleWarnings[testCase.rule]).toBe(0);
      expect(result.summary.byRuleFailures[testCase.rule]).toBe(0);
    });

    it(`supports disable-next-line for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.disableNextLine });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = joinMessages(result.findings);

      expect(result.summary.byRuleWarnings[testCase.rule]).toBe(0);
      expect(result.summary.byRuleFailures[testCase.rule]).toBe(0);
      expect(out).not.toContain("[invalid-lint-suppression]");
    });

    it(`supports disable-line for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.disableLine });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = joinMessages(result.findings);

      expect(result.summary.byRuleWarnings[testCase.rule]).toBe(0);
      expect(result.summary.byRuleFailures[testCase.rule]).toBe(0);
      expect(out).not.toContain("[invalid-lint-suppression]");
    });
  });
});
