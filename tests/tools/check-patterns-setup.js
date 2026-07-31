const {
  toolPath,
  tempDirs,
  runPatternCheck,
  createWorkspace,
  joinMessages,
  joinWarningMessages
} = require("./check-patterns.harness.js");

const failFastRuleCases = require("../../tools/test-data/check-patterns-failfast-cases.js");

/**
 * @param {{ findings?: import("./check-patterns.harness.js").DyniPatternFinding[], warnings?: import("./check-patterns.harness.js").DyniPatternFinding[] }} result
 * @param {string} severity
 */
function reportMessages(result, severity) {
  return severity === "block" ? joinMessages(result.findings || []) : joinWarningMessages(result.warnings || []);
}

module.exports = {
  createWorkspace,
  failFastRuleCases,
  joinMessages,
  joinWarningMessages,
  reportMessages,
  runPatternCheck,
  tempDirs,
  toolPath
};
