const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { loadProjectTokens, DEFAULT_GENERIC_TOKENS_PATH } = require("./generic-tokens-test-utils");

const CONSUMERS = [
  "tests/contract/shared-instructions-block-contract.test.js",
  "tests/contract/skill-layer-contract.test.js",
  "tests/contract/pattern-rule-generic-scope-contract.test.js"
];

describe("generic-tokens.json single-owner contract", function () {
  it("is the only genericness token source read by every consuming contract test", function () {
    CONSUMERS.forEach(function (relativePath) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
      expect(source, relativePath + " must import the shared loader").toContain(
        'require("./generic-tokens-test-utils")'
      );
      expect(source, relativePath + " must call the shared loader, not an independent token source").toMatch(
        /loadProjectTokens\(\)/
      );
    });
  });

  it("propagates a token newly added to generic-tokens.json to the shared loader", function () {
    const base = JSON.parse(fs.readFileSync(DEFAULT_GENERIC_TOKENS_PATH, "utf8"));
    const sentinel = "sentinel-single-owner-token";
    const seeded = { ...base, domainTokens: [...base.domainTokens, sentinel] };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-generic-tokens-"));
    const tempPath = path.join(tempDir, "generic-tokens.json");

    try {
      fs.writeFileSync(tempPath, JSON.stringify(seeded), "utf8");
      expect(loadProjectTokens(tempPath)).toContain(sentinel);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
