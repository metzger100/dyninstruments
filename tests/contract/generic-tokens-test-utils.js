const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_GENERIC_TOKENS_PATH = path.join(process.cwd(), "tools/quality-policy/generic-tokens.json");

// The single owner of the genericness token list. Every consuming contract test reads through
// this loader instead of keeping its own inline array, so a token added once propagates to every
// call site (see generic-tokens-single-owner-contract.test.js).
/** @param {string} [customPath] @returns {string[]} */
function loadProjectTokens(customPath) {
  const data = JSON.parse(fs.readFileSync(customPath || DEFAULT_GENERIC_TOKENS_PATH, "utf8"));
  return [...data.projectTokens, ...data.domainTokens, ...data.hostTokens];
}

module.exports = { loadProjectTokens, DEFAULT_GENERIC_TOKENS_PATH };
