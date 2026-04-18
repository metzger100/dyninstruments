const { loadFresh } = require("../../helpers/load-umd");

describe("PlaceholderNormalize", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js").create();
  }

  it("normalizes known formatter fallback tokens to ---", function () {
    const api = createApi();
    const tokens = [
      "",
      "   ",
      "--:--",
      "--:--:--",
      "----/--/--",
      "NO DATA",
      "-",
      "--",
      "---",
      "-----"
    ];

    tokens.forEach(function (token) {
      expect(api.normalize(token, "---")).toBe("---");
      expect(api.isPlaceholder(token)).toBe(true);
    });
  });

  it("normalizes dash-only placeholders of length 1 through 10", function () {
    const api = createApi();
    for (let i = 1; i <= 10; i += 1) {
      expect(api.normalize("-".repeat(i), "---")).toBe("---");
      expect(api.isPlaceholder("-".repeat(i))).toBe(true);
    }
  });

  it("normalizes whitespace-padded dash placeholders from speed and distance formatters", function () {
    const api = createApi();
    expect(api.normalize("  -", "---")).toBe("---");
    expect(api.normalize("    -", "---")).toBe("---");
    expect(api.isPlaceholder("  -")).toBe(true);
    expect(api.isPlaceholder("    -")).toBe(true);
  });

  it("passes finite values through unchanged", function () {
    const api = createApi();
    expect(api.normalize("0", "---")).toBe("0");
    expect(api.normalize("12.4", "---")).toBe("12.4");
    expect(api.normalize("DIR:143", "---")).toBe("DIR:143");
    expect(api.normalize("TIME:2026-03-06T11:45:00Z", "---")).toBe("TIME:2026-03-06T11:45:00Z");
    expect(api.isPlaceholder("12.4")).toBe(false);
  });

  it("exports placeholder patterns and dash-only regex for tests", function () {
    const api = createApi();

    expect(Array.isArray(api.PLACEHOLDER_PATTERNS)).toBe(true);
    expect(api.PLACEHOLDER_PATTERNS).toContain("--:--");
    expect(api.PLACEHOLDER_PATTERNS).toContain("--:--:--");
    expect(api.PLACEHOLDER_PATTERNS).toContain("----/--/--");
    expect(api.PLACEHOLDER_PATTERNS).toContain("NO DATA");
    expect(api.DASH_ONLY_RE.test("-----")).toBe(true);
  });
});
