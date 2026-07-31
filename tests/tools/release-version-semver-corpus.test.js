const { isValidReleaseVersion, classifyReleaseTag } = require("../../tools/release-version.mjs");
const corpus = require("../../tools/quality-policy/semver-corpus.json");

expect(corpus.schemaVersion).toBe(1);

describe("tools/release-version.mjs against the shared SemVer corpus", function () {
  it("accepts every valid corpus entry and classifies its prerelease flag correctly", function () {
    corpus.valid.forEach(function (entry) {
      expect(isValidReleaseVersion(entry.version), entry.version).toBe(true);
      expect(classifyReleaseTag(`v${entry.version}`).prerelease, entry.version).toBe(entry.prerelease);
    });
  });

  it("rejects every invalid corpus entry", function () {
    corpus.invalid.forEach(function (version) {
      expect(isValidReleaseVersion(version), JSON.stringify(version)).toBe(false);
    });
  });

  it("keeps the corpus at its captured 20 valid / 42 invalid shape", function () {
    expect(corpus.valid).toHaveLength(20);
    expect(corpus.invalid).toHaveLength(42);
  });
});
