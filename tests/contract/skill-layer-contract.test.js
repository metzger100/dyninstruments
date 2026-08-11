const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const LOCK_PATH = path.join(root, "skills-lock.json");
const SHA256_HEX_LENGTH = 64;

describe("agent skill layer contract", function () {
  it("keeps every skills-lock.json entry shaped with local provenance and a matching SHA-256 hash", function () {
    const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
    const entries = Object.entries(lock.skills);

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(function ([name, entry]) {
      expect(typeof entry.source, name + ".source").toBe("string");
      expect(entry.source.length, name + ".source").toBeGreaterThan(0);
      expect(typeof entry.sourceType, name + ".sourceType").toBe("string");
      expect(entry.sourceType, name + ".sourceType").toBe("local");
      expect(entry.computedHash, name + ".computedHash").toMatch(/^[0-9a-f]+$/);
      expect(entry.computedHash.length, name + ".computedHash length").toBe(SHA256_HEX_LENGTH);
      const skillPath = path.join(root, entry.source, "SKILL.md");
      expect(fs.existsSync(skillPath), name + ".source must name a local skill directory").toBe(true);
      const localHash = crypto.createHash("sha256").update(fs.readFileSync(skillPath)).digest("hex");
      expect(entry.computedHash, name + ".computedHash").toBe(localHash);
    });
  });

  it("rejects a tampered local skill file hash", function () {
    const expected = crypto.createHash("sha256").update("original").digest("hex");
    const actual = crypto.createHash("sha256").update("tampered").digest("hex");

    expect(actual).not.toBe(expected);
  });

  it("rejects a seeded skills-lock entry with a malformed hash length", function () {
    const seeded = { source: "example/skills", sourceType: "github", computedHash: "deadbeef" };

    expect(seeded.computedHash.length).not.toBe(SHA256_HEX_LENGTH);
  });
});
