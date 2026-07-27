const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_LINES = [
  'project_doc_fallback_filenames = ["CLAUDE.md"]',
  "project_doc_max_bytes = 65536",
  'approval_policy = "on-request"',
  'sandbox_mode = "workspace-write"',
  'web_search = "cached"'
];

const FORBIDDEN_TOKENS = ["@latest", 'command = "cmd"', "powershell", "C:\\", "mcp_servers", "/home/", "/Users/"];

/**
 * Pure, dependency-free portability check for the small fixed Codex configuration shape.
 * @param {string} text
 * @returns {string[]} violations, empty when the text is a valid portable configuration
 */
function findCodexConfigViolations(text) {
  const violations = /** @type {string[]} */ ([]);
  REQUIRED_LINES.forEach(function (line) {
    if (!text.includes(line)) {
      violations.push(`missing required line: ${line}`);
    }
  });
  FORBIDDEN_TOKENS.forEach(function (token) {
    if (text.includes(token)) {
      violations.push(`contains forbidden token: ${token}`);
    }
  });
  return violations;
}

describe("portable .codex/config.toml contract", function () {
  const configText = fs.readFileSync(path.join(process.cwd(), ".codex/config.toml"), "utf8");

  it("keeps every required portable key present", function () {
    expect(findCodexConfigViolations(configText)).toEqual([]);
  });

  it("has no MCP server declaration", function () {
    expect(configText).not.toContain("[mcp_servers");
  });

  it("rejects a fixture reintroducing the Windows-specific unpinned MCP block", function () {
    const forbidden = `${configText}\n[mcp_servers.chrome-devtools]\ncommand = "cmd"\nargs = ["/c", "npx", "-y", "chrome-devtools-mcp@latest"]\nenv = { SystemRoot="C:\\\\Windows" }\n`;
    expect(findCodexConfigViolations(forbidden).length).toBeGreaterThan(0);
  });

  it("rejects a fixture missing a required portable key", function () {
    const missingKey = configText.replace('sandbox_mode = "workspace-write"\n', "");
    expect(findCodexConfigViolations(missingKey)).toContain('missing required line: sandbox_mode = "workspace-write"');
  });
});
